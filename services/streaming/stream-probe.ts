/**
 * Probes a remote video URL before playback:
 * - detects HTTP Range support (via a 1-byte range GET)
 * - reads content length and content type
 * - decides whether the MSE pipeline can be used
 * - classifies failures into user-friendly error codes
 */
import type { StreamErrorCode, StreamProbeResult } from "@/types/streaming";

import { REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { mseMimeFor } from "@/lib/capabilities";

function classifyStatus(status: number): StreamErrorCode {
  if (status === 404 || status === 410) return "not-found";
  if (status === 403 || status === 401) return "expired-link";

  return "unsupported-server";
}

export async function probeStream(url: string): Promise<StreamProbeResult> {
  const failed = (error: StreamErrorCode): StreamProbeResult => ({
    url,
    supportsRanges: false,
    contentLength: null,
    contentType: null,
    mseCompatible: false,
    error,
  });

  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return failed("network-timeout");
    }

    // fetch TypeError without a response almost always means CORS or DNS.
    return failed("cors-blocked");
  }

  if (!response.ok && response.status !== 206) {
    return failed(classifyStatus(response.status));
  }

  const supportsRanges =
    response.status === 206 ||
    response.headers.get("accept-ranges")?.toLowerCase() === "bytes";

  const contentType = response.headers.get("content-type");

  // For 206 responses, total size lives in Content-Range: bytes 0-0/12345.
  const contentRange = response.headers.get("content-range");
  const rangeTotal = contentRange?.split("/")[1];
  const contentLength =
    rangeTotal && rangeTotal !== "*"
      ? Number(rangeTotal)
      : Number(response.headers.get("content-length")) || null;

  // Drain the tiny body so the connection can be reused.
  response.body?.cancel().catch(() => undefined);

  return {
    url,
    supportsRanges,
    contentLength: Number.isFinite(contentLength) ? contentLength : null,
    contentType,
    mseCompatible:
      supportsRanges && contentLength !== null && mseMimeFor(contentType) !== null,
  };
}
