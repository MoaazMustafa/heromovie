"use client";

/**
 * VideoPlayer — orchestrates the streaming engine, the media element and the
 * control overlay.
 *
 * Playback lifecycle: startStream (native-first) → resume position →
 * progress recording → cleanup. If direct playback fails (CORS-locked file
 * hosts, blocked redirects), it automatically retries once through the
 * same-origin /api/proxy route before surfacing an error.
 */
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Alert, Button, Chip, Spinner, Tooltip } from "@heroui/react";

import type { StreamError, PlaybackEngine } from "@/types/streaming";

import { startStream, describeStreamError, type StreamSession } from "@/services/streaming/stream-engine";
import { useVideoPlayer } from "@/hooks/use-video-player";
import { usePlayerShortcuts } from "@/hooks/use-player-shortcuts";
import { useMediaSession } from "@/hooks/use-media-session";
import { recordProgress } from "@/stores/history-store";
import { useSettings } from "@/stores/settings-store";
import { detectCapabilities } from "@/lib/capabilities";
import { proxiedUrl } from "@/lib/proxy";
import { PlayerControls } from "@/components/player/player-controls";
import { PauseIcon, PlayIcon } from "@/components/player/player-icons";

const CONTROLS_HIDE_DELAY_MS = 3000;
const PROGRESS_SAVE_INTERVAL_MS = 5000;

const ENGINE_LABELS: Record<PlaybackEngine, string> = {
  mse: "Chunked",
  native: "Progressive",
  hls: "HLS",
};

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
  const [viaProxy, setViaProxy] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasSubtitles, setHasSubtitles] = useState(false);

  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const subtitleUrlRef = useRef<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const lastSaveRef = useRef(0);
  const probeErrorRef = useRef<string | null>(null);

  const capabilities = detectCapabilities();
  const effectiveUrl = viaProxy ? proxiedUrl(url) : url;

  usePlayerShortcuts(containerRef, actions, () => state.duration);
  useMediaSession(title, actions);

  // ── Streaming lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    let session: StreamSession | null = null;
    let cancelled = false;

    setError(null);

    startStream(video, effectiveUrl, {
      maxCacheBytes: settings.maxCacheBytes,
      onFatalError: (streamError) => {
        if (!cancelled) setError(streamError);
      },
    })
      .then((started) => {
        if (cancelled) {
          started.dispose();

          return;
        }
        session = started;
        probeErrorRef.current = started.probe?.error ?? null;
        setEngine(started.engine);
      })
      .catch(() => {
        if (!cancelled) setError(describeStreamError("unknown"));
      });

    return () => {
      cancelled = true;
      session?.dispose();
    };
    // Intentionally not re-running on settings change mid-playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUrl]);

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
  }, [effectiveUrl]);

  // ── Media element error handling with proxy retry ─────────────────────────
  const handleMediaError = useCallback(() => {
    const mediaError = videoRef.current?.error;

    // Ignore teardown/abort noise.
    if (!mediaError || mediaError.code === MediaError.MEDIA_ERR_ABORTED) return;

    // Decode errors are codec problems — the proxy can't help.
    if (mediaError.code === MediaError.MEDIA_ERR_DECODE) {
      setError(describeStreamError("unsupported-codec"));

      return;
    }

    // First failure on the direct URL → retry through the CORS proxy.
    if (!viaProxy) {
      setViaProxy(true);

      return;
    }

    // Proxy also failed — surface the most specific error we know.
    if (mediaError.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      setError(describeStreamError("unsupported-codec"));
    } else {
      setError(describeStreamError(probeErrorRef.current ?? "unknown"));
    }
  }, [viaProxy, videoRef]);

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
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl border border-separator bg-surface p-6">
        <Alert className="max-w-lg" status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Playback failed</Alert.Title>
            <Alert.Description>{error.message}</Alert.Description>
          </Alert.Content>
        </Alert>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onPress={() => {
              setError(null);
              setViaProxy(false);
            }}
          >
            Try again
          </Button>
          {!viaProxy && (
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => {
                    setError(null);
                    setViaProxy(true);
                  }}
                >
                  Retry via proxy
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>
                Streams the file through this app&apos;s server to bypass CORS
              </Tooltip.Content>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }

  return (
    // Keyboard shortcuts require focus on the player surface.
    /* eslint-disable jsx-a11y/no-noninteractive-tabindex */
    <div
      ref={containerRef}
      aria-label={`Video player: ${title}`}
      className="group/player relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      role="application"
      tabIndex={0}
      onDoubleClick={actions.toggleFullscreen}
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      {/* Captions are attached dynamically from user-uploaded .vtt files. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className="aspect-video w-full"
        playsInline
        preload="metadata"
        onClick={actions.togglePlay}
        onError={handleMediaError}
      />

      {/* Center play/pause flash overlay */}
      {!state.isWaiting && controlsVisible && (
        <button
          aria-label={state.isPlaying ? "Pause" : "Play"}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 p-5 text-white opacity-0 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-black/70 group-hover/player:opacity-100"
          type="button"
          onClick={actions.togglePlay}
        >
          {state.isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
        </button>
      )}

      {/* Buffering overlay */}
      {state.isWaiting && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <Spinner aria-label="Buffering" size="lg" />
        </div>
      )}

      {/* Engine badges — visible while controls are shown */}
      {engine && controlsVisible && (
        <div className="absolute right-3 top-3 flex gap-1.5">
          {viaProxy && (
            <Chip color="warning" size="sm">
              Proxy
            </Chip>
          )}
          <Chip color="accent" size="sm">
            {ENGINE_LABELS[engine]}
          </Chip>
        </div>
      )}

      {/* Control bar */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
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
