"use client";

/**
 * VideoPlayer — orchestrates the streaming engine, the media element and the
 * control overlay. Owns the playback lifecycle:
 *   startStream → resume position → progress recording → cleanup.
 */
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Alert, Chip, Spinner } from "@heroui/react";

import type { StreamError, PlaybackEngine } from "@/types/streaming";

import { startStream, type StreamSession } from "@/services/streaming/stream-engine";
import { useVideoPlayer } from "@/hooks/use-video-player";
import { usePlayerShortcuts } from "@/hooks/use-player-shortcuts";
import { useMediaSession } from "@/hooks/use-media-session";
import { recordProgress } from "@/stores/history-store";
import { useSettings } from "@/stores/settings-store";
import { detectCapabilities } from "@/lib/capabilities";
import { PlayerControls } from "@/components/player/player-controls";

const CONTROLS_HIDE_DELAY_MS = 3000;
const PROGRESS_SAVE_INTERVAL_MS = 5000;

interface VideoPlayerProps {
  url: string;
  title: string;
  initialPosition?: number;
}

export function VideoPlayer({ url, title, initialPosition = 0 }: VideoPlayerProps) {
  const { videoRef, containerRef, state, actions } = useVideoPlayer();
  const settings = useSettings();

  const [error, setError] = useState<StreamError | null>(null);
  const [engine, setEngine] = useState<PlaybackEngine | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasSubtitles, setHasSubtitles] = useState(false);

  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const subtitleUrlRef = useRef<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const lastSaveRef = useRef(0);

  const capabilities = detectCapabilities();

  usePlayerShortcuts(containerRef, actions, () => state.duration);
  useMediaSession(title, actions);

  // ── Streaming lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    let session: StreamSession | null = null;
    let cancelled = false;

    startStream(video, url, { maxCacheBytes: settings.maxCacheBytes })
      .then((started) => {
        if (cancelled) {
          started.dispose();

          return;
        }
        session = started;
        setEngine(started.engine);
      })
      .catch((streamError: StreamError) => {
        if (!cancelled) setError(streamError);
      });

    return () => {
      cancelled = true;
      session?.dispose();
    };
    // Intentionally not re-running on settings change mid-playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // ── Initial player configuration ──────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.volume = settings.defaultVolume;
    video.playbackRate = settings.defaultPlaybackRate;

    const onLoadedMetadata = () => {
      if (initialPosition > 0 && initialPosition < video.duration) {
        video.currentTime = initialPosition;
      }
      if (settings.autoplay) void video.play().catch(() => undefined);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => video.removeEventListener("loadedmetadata", onLoadedMetadata);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // ── Progress persistence (throttled) ──────────────────────────────────────
  useEffect(() => {
    if (state.currentTime === 0) return;

    const now = Date.now();

    if (now - lastSaveRef.current >= PROGRESS_SAVE_INTERVAL_MS) {
      lastSaveRef.current = now;
      recordProgress(url, state.currentTime, state.duration);
    }
  }, [state.currentTime, state.duration, url]);

  // Save one final position on unmount.
  useEffect(() => {
    const video = videoRef.current;

    return () => {
      if (video && video.currentTime > 0) {
        recordProgress(url, video.currentTime, video.duration || 0);
      }
      if (subtitleUrlRef.current) URL.revokeObjectURL(subtitleUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // ── Auto-hide controls ────────────────────────────────────────────────────
  const showControls = useCallback(() => {
    setControlsVisible(true);

    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);

    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    showControls();

    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  // ── Subtitles (.vtt upload) ───────────────────────────────────────────────
  const handleSubtitleFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      const video = videoRef.current;

      if (!file || !video) return;

      if (subtitleUrlRef.current) URL.revokeObjectURL(subtitleUrlRef.current);

      // Remove previously added tracks.
      for (const track of Array.from(video.querySelectorAll("track"))) {
        track.remove();
      }

      const objectUrl = URL.createObjectURL(file);

      subtitleUrlRef.current = objectUrl;

      const track = document.createElement("track");

      track.kind = "subtitles";
      track.label = file.name.replace(/\.vtt$/i, "");
      track.default = true;
      track.src = objectUrl;
      video.appendChild(track);

      requestAnimationFrame(() => {
        if (video.textTracks[0]) {
          video.textTracks[0].mode = settings.subtitlesEnabled
            ? "showing"
            : "hidden";
        }
      });

      setHasSubtitles(true);
      event.target.value = "";
    },
    [videoRef, settings.subtitlesEnabled],
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Playback failed</Alert.Title>
          <Alert.Description>{error.message}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label={`Video player: ${title}`}
      className="group/player relative w-full overflow-hidden rounded-2xl bg-black shadow-lg outline-none"
      role="region"
      tabIndex={0}
      onDoubleClick={actions.toggleFullscreen}
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <video
        ref={videoRef}
        className="aspect-video w-full"
        crossOrigin="anonymous"
        playsInline
        preload="metadata"
        onClick={actions.togglePlay}
        onError={() => {
          const mediaError = videoRef.current?.error;

          if (mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            setError({
              code: "unsupported-codec",
              message: "This video format isn't supported by your browser.",
            });
          }
        }}
      />

      {/* Buffering overlay */}
      {state.isWaiting && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Spinner aria-label="Buffering" size="lg" />
        </div>
      )}

      {/* Engine badge — visible while controls are shown */}
      {engine && controlsVisible && (
        <div className="absolute right-3 top-3">
          <Chip color="accent" size="sm">
            {engine === "mse" ? "Chunked streaming" : "Progressive streaming"}
          </Chip>
        </div>
      )}

      {/* Control bar */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <PlayerControls
          actions={actions}
          hasSubtitles={hasSubtitles}
          pipSupported={capabilities.pictureInPicture}
          state={state}
          subtitleInputRef={subtitleInputRef}
          onSubtitleFile={handleSubtitleFile}
        />
      </div>
    </div>
  );
}
