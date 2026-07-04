/**
 * CORS bypass proxy — streams a remote video through the app's own origin.
 *
 * The browser's fetch/MSE pipeline is subject to CORS, and many file hosts
 * don't send Access-Control-Allow-Origin. This route fetches the file
 * server-side (where CORS doesn't apply), forwards Range headers both ways
 * and pipes the body through, so chunked streaming keeps working.
 */
import type { NextRequest } from "next/server";

import { isForbiddenHost } from "@/lib/proxy";

export const dynamic = "force-dynamic";

/** Upstream response headers worth forwarding to the player. */
const FORWARDED_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
  "cache-control",
];

export async function GET(request: NextRequest): Promise<Response> {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let target: URL;

  try {
    target = new URL(rawUrl);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return Response.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  if (isForbiddenHost(target.hostname)) {
    return Response.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstreamHeaders = new Headers();
  const range = request.headers.get("range");

  if (range) upstreamHeaders.set("range", range);

  let upstream: Response;

  try {
    upstream = await fetch(target, {
      headers: upstreamHeaders,
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return Response.json(
      { error: "Upstream fetch failed" },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();

  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);

    if (value) responseHeaders.set(name, value);
  }
  // The proxy itself is same-origin, but expose headers for completeness.
  responseHeaders.set("access-control-allow-origin", "*");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
