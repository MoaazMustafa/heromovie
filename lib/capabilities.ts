/** Browser capability detection with SSR-safe guards. */

export interface BrowserCapabilities {
  mediaSource: boolean;
  indexedDB: boolean;
  pictureInPicture: boolean;
  mediaSession: boolean;
  fullscreen: boolean;
}

export function detectCapabilities(): BrowserCapabilities {
  if (typeof window === "undefined") {
    return {
      mediaSource: false,
      indexedDB: false,
      pictureInPicture: false,
      mediaSession: false,
      fullscreen: false,
    };
  }

  return {
    mediaSource: "MediaSource" in window,
    indexedDB: "indexedDB" in window,
    pictureInPicture: "pictureInPictureEnabled" in document,
    mediaSession: "mediaSession" in navigator,
    fullscreen:
      document.fullscreenEnabled ||
      // Safari
      "webkitFullscreenEnabled" in document,
  };
}

/** MIME types (with codecs) that MSE can consume without remuxing. */
const MSE_MIME_CANDIDATES: Record<string, string[]> = {
  "video/webm": ['video/webm; codecs="vp9,opus"', 'video/webm; codecs="vp8,vorbis"'],
  "video/mp4": ['video/mp4; codecs="avc1.42E01E,mp4a.40.2"'],
};

/**
 * Returns the first MSE-supported mime string for a content type,
 * or null when MSE cannot play this container.
 */
export function mseMimeFor(contentType: string | null): string | null {
  if (typeof window === "undefined" || !("MediaSource" in window)) return null;
  if (!contentType) return null;

  const base = contentType.split(";")[0].trim().toLowerCase();
  const candidates = MSE_MIME_CANDIDATES[base];

  if (!candidates) return null;

  return candidates.find((mime) => MediaSource.isTypeSupported(mime)) ?? null;
}
