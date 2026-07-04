"use client";

/**
 * Keyboard shortcuts for the player, attached to the player container:
 * Space/K play-pause · ←/→ seek · ↑/↓ volume · M mute · F fullscreen ·
 * P picture-in-picture · C captions · Home/End jump.
 */
import { useEffect, type RefObject } from "react";

import type { VideoPlayerActions } from "@/hooks/use-video-player";

import { SEEK_STEP_SECONDS } from "@/lib/constants";

export function usePlayerShortcuts(
  containerRef: RefObject<HTMLElement | null>,
  actions: VideoPlayerActions,
  getDuration: () => number,
): void {
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Don't hijack typing inside inputs (e.g. subtitle file dialogs).
      const target = event.target as HTMLElement;

      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault();
          actions.togglePlay();
          break;
        case "ArrowLeft":
          event.preventDefault();
          actions.seekBy(-SEEK_STEP_SECONDS);
          break;
        case "ArrowRight":
          event.preventDefault();
          actions.seekBy(SEEK_STEP_SECONDS);
          break;
        case "ArrowUp":
          event.preventDefault();
          actions.setVolume(volumeOf(container) + 0.1);
          break;
        case "ArrowDown":
          event.preventDefault();
          actions.setVolume(volumeOf(container) - 0.1);
          break;
        case "m":
          actions.toggleMute();
          break;
        case "f":
          actions.toggleFullscreen();
          break;
        case "p":
          actions.togglePip();
          break;
        case "c":
          actions.toggleCaptions();
          break;
        case "Home":
          event.preventDefault();
          actions.seekTo(0);
          break;
        case "End":
          event.preventDefault();
          actions.seekTo(getDuration());
          break;
        default:
          break;
      }
    };

    container.addEventListener("keydown", onKeyDown);

    return () => container.removeEventListener("keydown", onKeyDown);
  }, [containerRef, actions, getDuration]);
}

function volumeOf(container: HTMLElement): number {
  const video = container.querySelector("video");

  return video?.volume ?? 1;
}
