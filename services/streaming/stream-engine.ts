/**
 * StreamEngine — facade that picks the best playback strategy for a URL.
 *
 * Strategy (native-first, so CORS never blocks playback that would work):
 * 1. HLS playlists (.m3u8) → native HLS on Safari, hls.js elsewhere.
 * 2. `probeStream` inspects the server opportunistically. Probe failures are
 *    NEVER fatal — a cross-origin <video src> plays fine without CORS even
 *    when fetch() is blocked.
 * 3. When the probe confirms an MSE-compatible source (WebM/fMP4 with
 *    supported codecs + range support), the chunked pipeline is used:
 *    ChunkManager → IndexedDB cache → SourceBuffer with adaptive look-ahead.
 * 4. Everything else uses the native <video> element, where the browser
 *    itself issues HTTP range requests and manages its media buffer.
 *
 * If native playback later fails (codec/CORS-tainted redirects), the player
 * retries once through the same-origin /api/proxy route.
 */
import type { PlaybackEngine, StreamError, StreamProbeResult } from "@/types/streaming";

import { MseEngine } from "@/services/streaming/mse-engine";
import { probeStream } from "@/services/streaming/stream-probe";
import { isHlsUrl, startHls } from "@/services/streaming/hls-engine";
import { hashUrl } from "@/lib/video-url";

export interface StreamSession {
  engine: PlaybackEngine;
  probe: StreamProbeResult | null;
  dispose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-url": "That link doesn't look like a valid URL.",
  "network-timeout": "The server took too long to respond. Try again.",
  "cors-blocked":
    "This server blocks cross-site access (CORS). Trying the built-in proxy…",
  "not-found": "The video could not be found. The link may be broken.",
  "expired-link": "Access denied — the link may have expired.",
  "no-range-support":
    "This server doesn't support partial downloads; playback may be less efficient.",
  "unsupported-codec":
    "This video's codec isn't supported by your browser (e.g. H.265/HEVC on some devices). Try a different quality or browser.",
  "unsupported-server": "The server returned an unexpected response.",
  unknown: "Something went wrong while loading the video.",
};

export function describeStreamError(code: string): StreamError {
  return {
    code: (code in ERROR_MESSAGES ? code : "unknown") as StreamError["code"],
    message: ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown,
  };
}

function createNativeSession(
  video: HTMLVideoElement,
  url: string,
  probe: StreamProbeResult | null,
): StreamSession {
  video.src = url;

  return {
    engine: "native",
    probe,
    dispose: () => {
      video.removeAttribute("src");
      video.load();
    },
  };
}

/**
 * Starts playback of `url` on `video`. Never throws for reachability
 * problems — the <video> element is always given a chance to play.
 */
export async function startStream(
  video: HTMLVideoElement,
  url: string,
  options?: {
    maxCacheBytes?: number;
    onFatalError?: (error: StreamError) => void;
  },
): Promise<StreamSession> {
  // 1. HLS playlists get their own pipeline.
  if (isHlsUrl(url)) {
    const session = startHls(video, url, (message) =>
      options?.onFatalError?.({ code: "unsupported-codec", message }),
    );

    return { engine: "hls", probe: null, dispose: session.dispose };
  }

  // 2. Probe opportunistically; failures only downgrade the strategy.
  const probe = await probeStream(url);

  if (isHlsUrl(url, probe.contentType)) {
    const session = startHls(video, url, (message) =>
      options?.onFatalError?.({ code: "unsupported-codec", message }),
    );

    return { engine: "hls", probe, dispose: session.dispose };
  }

  // 3. Chunked MSE pipeline when the source qualifies.
  if (!probe.error && probe.mseCompatible && probe.contentLength) {
    const engine = new MseEngine({
      videoId: hashUrl(url),
      url,
      contentLength: probe.contentLength,
      contentType: probe.contentType,
      maxCacheBytes: options?.maxCacheBytes,
      onNeedFallback: () => {
        // Preserve position across the engine swap.
        const position = video.currentTime;
        const wasPaused = video.paused;

        video.src = url;
        video.currentTime = position;
        if (!wasPaused) void video.play().catch(() => undefined);
      },
    });

    engine.attach(video);

    return { engine: "mse", probe, dispose: () => engine.dispose() };
  }

  // 4. Native progressive playback — works cross-origin without CORS.
  return createNativeSession(video, url, probe);
}
