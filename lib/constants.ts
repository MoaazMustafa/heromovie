/** Streaming and caching tunables. */

/** Target chunk size in bytes (2 MiB works well over HTTP ranges). */
export const CHUNK_SIZE = 2 * 1024 * 1024;

/** Default number of chunks preloaded ahead of the playhead. */
export const DEFAULT_PRELOAD_AHEAD = 4;

/** Preload window per network quality. */
export const PRELOAD_BY_QUALITY = {
  slow: 2,
  medium: 4,
  fast: 6,
} as const;

/** Seconds of media kept behind the playhead before eviction. */
export const KEEP_BEHIND_SECONDS = 10 * 60;

/** Videos longer than this (seconds) enable long-video eviction. */
export const LONG_VIDEO_THRESHOLD_SECONDS = 40 * 60;

/** Max simultaneous chunk downloads. */
export const MAX_CONCURRENT_DOWNLOADS = 3;

/** Retry policy for failed chunk downloads. */
export const CHUNK_RETRY_LIMIT = 3;
export const CHUNK_RETRY_BASE_DELAY_MS = 800;

/** Fetch timeout for probe and chunk requests. */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Default max size of the IndexedDB chunk cache. */
export const DEFAULT_MAX_CACHE_BYTES = 512 * 1024 * 1024;

/** Network speed thresholds (bytes/second). */
export const NETWORK_FAST_BPS = 3_000_000;
export const NETWORK_SLOW_BPS = 500_000;

/** IndexedDB identifiers. */
export const DB_NAME = "heromovie-cache";
export const DB_VERSION = 1;
export const CHUNK_STORE = "chunks";

/** localStorage keys. */
export const STORAGE_KEYS = {
  history: "heromovie:history",
  settings: "heromovie:settings",
} as const;

/** Playback speeds offered by the player. */
export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Seek step for arrow keys / skip buttons (seconds). */
export const SEEK_STEP_SECONDS = 10;
