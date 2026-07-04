/**
 * HLS playback support.
 *
 * Safari plays HLS natively through the <video> element; every other browser
 * gets hls.js (dynamically imported so it never lands in the main bundle).
 */

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
    return new URL(url).pathname.toLowerCase().endsWith(".m3u8");
  } catch {
    return false;
  }
}

export interface HlsSession {
  dispose: () => void;
}

/**
 * Attaches an HLS source to the video element. Prefers native playback
 * (Safari/iOS), falls back to hls.js elsewhere.
 */
export async function startHls(
  video: HTMLVideoElement,
  url: string,
  onFatalError: (message: string) => void,
): Promise<HlsSession> {
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;

    return {
      dispose: () => {
        video.removeAttribute("src");
        video.load();
      },
    };
  }

  const { default: Hls } = await import("hls.js");

  if (!Hls.isSupported()) {
    onFatalError("HLS playback isn't supported in this browser.");

    return { dispose: () => undefined };
  }

  const hls = new Hls({ enableWorker: true });

  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (!data.fatal) return;

    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      hls.startLoad();
    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      hls.recoverMediaError();
    } else {
      onFatalError("The HLS stream could not be played.");
      hls.destroy();
    }
  });

  hls.loadSource(url);
  hls.attachMedia(video);

  return { dispose: () => hls.destroy() };
}
