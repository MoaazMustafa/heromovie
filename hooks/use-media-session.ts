"use client";

/** Media Session API integration — lock-screen / OS media controls. */
import { useEffect } from "react";

import type { VideoPlayerActions } from "@/hooks/use-video-player";

import { SEEK_STEP_SECONDS } from "@/lib/constants";

export function useMediaSession(
  title: string,
  actions: VideoPlayerActions,
): void {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const session = navigator.mediaSession;

    session.metadata = new MediaMetadata({
      title,
      artist: "HeroMovie",
    });

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => actions.togglePlay()],
      ["pause", () => actions.togglePlay()],
      ["stop", () => actions.stop()],
      ["seekbackward", () => actions.seekBy(-SEEK_STEP_SECONDS)],
      ["seekforward", () => actions.seekBy(SEEK_STEP_SECONDS)],
      [
        "seekto",
        (details) => {
          if (details.seekTime !== undefined) actions.seekTo(details.seekTime);
        },
      ],
    ];

    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Action not supported by this browser.
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // Ignore.
        }
      }
    };
  }, [title, actions]);
}
