"use client";

/**
 * useVideoPlayer — owns all imperative interaction with the <video> element
 * and exposes a serializable state snapshot plus memoized actions.
 * Player state stays isolated from page/UI state by design.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SEEK_STEP_SECONDS } from "@/lib/constants";
import { clamp } from "@/lib/format";

export interface VideoPlayerState {
  isPlaying: boolean;
  isWaiting: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  /** End of the buffered range containing the playhead (seconds). */
  bufferedEnd: number;
  isFullscreen: boolean;
  isPip: boolean;
  captionsVisible: boolean;
}

const INITIAL_STATE: VideoPlayerState = {
  isPlaying: false,
  isWaiting: true,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  bufferedEnd: 0,
  isFullscreen: false,
  isPip: false,
  captionsVisible: false,
};

export interface VideoPlayerActions {
  togglePlay: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  togglePip: () => void;
  toggleCaptions: () => void;
}

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VideoPlayerState>(INITIAL_STATE);

  const patch = useCallback((partial: Partial<VideoPlayerState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Media element event wiring ────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const readBuffered = () => {
      const { buffered, currentTime } = video;

      for (let i = 0; i < buffered.length; i++) {
        if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
          return buffered.end(i);
        }
      }

      return buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
    };

    const listeners: [string, () => void][] = [
      ["play", () => patch({ isPlaying: true })],
      ["pause", () => patch({ isPlaying: false })],
      ["waiting", () => patch({ isWaiting: true })],
      ["playing", () => patch({ isWaiting: false })],
      ["canplay", () => patch({ isWaiting: false })],
      [
        "timeupdate",
        () =>
          patch({ currentTime: video.currentTime, bufferedEnd: readBuffered() }),
      ],
      ["progress", () => patch({ bufferedEnd: readBuffered() })],
      [
        "durationchange",
        () =>
          patch({
            duration: Number.isFinite(video.duration) ? video.duration : 0,
          }),
      ],
      [
        "volumechange",
        () => patch({ volume: video.volume, isMuted: video.muted }),
      ],
      ["ratechange", () => patch({ playbackRate: video.playbackRate })],
      ["enterpictureinpicture", () => patch({ isPip: true })],
      ["leavepictureinpicture", () => patch({ isPip: false })],
      ["ended", () => patch({ isPlaying: false })],
    ];

    for (const [event, handler] of listeners) {
      video.addEventListener(event, handler);
    }

    return () => {
      for (const [event, handler] of listeners) {
        video.removeEventListener(event, handler);
      }
    };
  }, [patch]);

  useEffect(() => {
    const onFullscreenChange = () =>
      patch({ isFullscreen: document.fullscreenElement !== null });

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [patch]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const actions = useMemo<VideoPlayerActions>(() => {
    const video = () => videoRef.current;

    return {
      togglePlay: () => {
        const el = video();

        if (!el) return;
        if (el.paused) void el.play().catch(() => undefined);
        else el.pause();
      },
      stop: () => {
        const el = video();

        if (!el) return;
        el.pause();
        el.currentTime = 0;
      },
      seekTo: (seconds) => {
        const el = video();

        if (!el) return;
        el.currentTime = clamp(seconds, 0, el.duration || 0);
      },
      seekBy: (delta) => {
        const el = video();

        if (!el) return;
        el.currentTime = clamp(el.currentTime + delta, 0, el.duration || 0);
      },
      setVolume: (volume) => {
        const el = video();

        if (!el) return;
        el.volume = clamp(volume, 0, 1);
        el.muted = volume === 0;
      },
      toggleMute: () => {
        const el = video();

        if (el) el.muted = !el.muted;
      },
      setPlaybackRate: (rate) => {
        const el = video();

        if (el) el.playbackRate = rate;
      },
      toggleFullscreen: () => {
        const container = containerRef.current;

        if (!container) return;

        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined);
        } else {
          void container.requestFullscreen().catch(() => undefined);
        }
      },
      togglePip: () => {
        const el = video();

        if (!el || !document.pictureInPictureEnabled) return;

        if (document.pictureInPictureElement) {
          void document.exitPictureInPicture().catch(() => undefined);
        } else {
          void el.requestPictureInPicture().catch(() => undefined);
        }
      },
      toggleCaptions: () => {
        const el = video();

        if (!el) return;

        const track = el.textTracks[0];

        if (!track) return;

        const show = track.mode !== "showing";

        track.mode = show ? "showing" : "hidden";
        setState((prev) => ({ ...prev, captionsVisible: show }));
      },
    };
  }, []);

  const seekStep = SEEK_STEP_SECONDS;

  return { videoRef, containerRef, state, actions, seekStep };
}
