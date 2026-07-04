/** URL validation and identity helpers. */

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mkv",
  ".mov",
  ".m4v",
  ".ogv",
  ".avi",
  ".ts",
];

/** Parses and validates a user-supplied video URL. Returns null when invalid. */
export function parseVideoUrl(input: string): URL | null {
  const trimmed = input.trim();

  if (!trimmed) return null;

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  return url;
}

/** Heuristic: does the URL path look like a direct video file? */
export function looksLikeVideoUrl(url: URL): boolean {
  const pathname = url.pathname.toLowerCase();

  return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

/** Extracts a display title from a URL (decoded file name without extension). */
export function titleFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments.at(-1);

    if (!last) return url.hostname;

    const decoded = decodeURIComponent(last);
    const withoutExt = decoded.replace(/\.[a-z0-9]{2,5}$/i, "");

    return withoutExt.replace(/[._-]+/g, " ").trim() || url.hostname;
  } catch {
    return rawUrl;
  }
}

/** Stable non-cryptographic hash of a string (FNV-1a), used as cache/history id. */
export function hashUrl(input: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
