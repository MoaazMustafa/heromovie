/**
 * HLS playback support.
 *
 * hls.js is preferred wherever MSE is available because `canPlayType` for
 * HLS is unreliable outside Safari ("maybe" on some Chromium builds that
 * can't actually stream playlists). Safari/iOS — where MSE is missing but
 * native HLS is real — uses the <video src> path.
 *
 * NOTE: the import is static because Turbopack stalls on dynamically
 * importing hls.js; the cost only affects the watch route's chunk.
 */
import Hls from "hls.js";

/** Does this URL look like an HLS playlist? */
export function isHlsUrl(url: string, contentType?: string | null): boolean {
  const type = contentType?.split(";")[0].trim().toLowerCase();

  if (
    type === "application/vnd.apple.mpegurl" ||
    type === "application/x-mpegurl" ||
    type === "audio/mpegurl"
  ) {
    return true;
  }

  try {
    return new URL(url, "http://relative.invalid").pathname
      .toLowerCase()
      .endsWith(".m3u8");
  } catch {
    return false;
  }
}

export interface HlsSession {
  dispose: () => void;
}

/**
 * Attaches an HLS source to the video element.
 */
export function startHls(
  video: HTMLVideoElement,
  url: string,
  onFatalError: (message: string) => void,
): HlsSession {
  if (Hls.isSupported()) {
    const hls = new Hls({ enableWorker: true });
    let mediaRecoveryAttempted = false;

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
      } else if (
        data.type === Hls.ErrorTypes.MEDIA_ERROR &&
        !mediaRecoveryAttempted
      ) {
        mediaRecoveryAttempted = true;
        hls.recoverMediaError();
      } else {
        onFatalError(
          data.type === Hls.ErrorTypes.MEDIA_ERROR
            ? "Your browser can't decode this stream's audio/video codecs."
            : "The HLS stream could not be played.",
        );
        hls.destroy();
      }
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    return { dispose: () => hls.destroy() };
  }

  // Safari/iOS: real native HLS.
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;

    return {
      dispose: () => {
        video.removeAttribute("src");
        video.load();
      },
    };
  }

  onFatalError("HLS playback isn't supported in this browser.");

  return { dispose: () => undefined };
}
