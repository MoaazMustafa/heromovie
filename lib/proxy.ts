/** Helpers for routing playback through the same-origin CORS proxy. */

export const PROXY_PATH = "/api/proxy";

/** Builds a same-origin proxy URL for a remote video. */
export function proxiedUrl(url: string): string {
  return `${PROXY_PATH}?url=${encodeURIComponent(url)}`;
}

/** True when the URL already points at our proxy. */
export function isProxiedUrl(url: string): boolean {
  return url.startsWith(PROXY_PATH);
}

/**
 * SSRF guard — rejects hostnames that resolve to obviously private or
 * loopback destinations. Used by the proxy route before fetching upstream.
 */
export function isForbiddenHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // IPv4 private / loopback / link-local / metadata ranges.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];

    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }

  // IPv6 unique-local / link-local.
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true;
  }

  return false;
}
