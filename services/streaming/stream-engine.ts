/**
 * StreamEngine — facade that picks the best playback strategy for a URL.
 *
 * Pipeline:
 * 1. `probeStream` inspects the server (range support, size, content type).
 * 2. When the source is MSE-compatible (WebM / fragmented MP4 with supported
 *    codecs), the chunked pipeline is used: ChunkManager → IndexedDB cache →
 *    SourceBuffer, with adaptive look-ahead and cache eviction.
 * 3. Otherwise — or whenever MSE hits an unrecoverable condition — playback
 *    falls back to the native `<video src>` path, where the browser itself
 *    issues HTTP range requests and manages its media buffer.
 */
import type { PlaybackEngine, StreamError, StreamProbeResult } from "@/types/streaming";

import { MseEngine } from "@/services/streaming/mse-engine";
import { probeStream } from "@/services/streaming/stream-probe";
import { hashUrl } from "@/lib/video-url";

export interface StreamSession {
  engine: PlaybackEngine;
  probe: StreamProbeResult;
  dispose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-url": "That link doesn't look like a valid URL.",
  "network-timeout": "The server took too long to respond. Try again.",
  "cors-blocked":
    "This server doesn't allow playback from other websites (CORS). Try a different link.",
  "not-found": "The video could not be found. The link may be broken.",
  "expired-link": "Access denied — the link may have expired.",
  "no-range-support":
    "This server doesn't support partial downloads; playback may be less efficient.",
  "unsupported-codec": "This video format isn't supported by your browser.",
  "unsupported-server": "The server returned an unexpected response.",
  unknown: "Something went wrong while loading the video.",
};

export function describeStreamError(code: string): StreamError {
  return {
    code: (code in ERROR_MESSAGES ? code : "unknown") as StreamError["code"],
    message: ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown,
  };
}

/**
 * Starts playback of `url` on `video`, choosing MSE when possible and
 * falling back to native progressive streaming otherwise.
 */
export async function startStream(
  video: HTMLVideoElement,
  url: string,
  options?: { maxCacheBytes?: number },
): Promise<StreamSession> {
  const probe = await probeStream(url);

  if (probe.error && probe.error !== "no-range-support") {
    throw describeStreamError(probe.error);
  }

  const useNative = (): StreamSession => {
    video.src = url;

    return {
      engine: "native",
      probe,
      dispose: () => {
        video.removeAttribute("src");
        video.load();
      },
    };
  };

  if (!probe.mseCompatible || !probe.contentLength) {
    return useNative();
  }

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

  return {
    engine: "mse",
    probe,
    dispose: () => engine.dispose(),
  };
}
