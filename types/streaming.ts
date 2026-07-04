/** Domain types shared across the streaming pipeline, stores and UI. */

/** A single downloaded byte-range of a video. */
export interface VideoChunk {
  /** Cache key: `${videoId}:${index}` */
  id: string;
  videoId: string;
  /** Sequential chunk index (byteOffset = index * chunkSize). */
  index: number;
  start: number;
  end: number;
  data: ArrayBuffer;
  createdAt: number;
}

export type ChunkState = "idle" | "loading" | "ready" | "failed";

/** Result of probing a remote video URL. */
export interface StreamProbeResult {
  url: string;
  supportsRanges: boolean;
  contentLength: number | null;
  contentType: string | null;
  /** Whether the source can be streamed through MSE. */
  mseCompatible: boolean;
  error?: StreamErrorCode;
}

export type StreamErrorCode =
  | "invalid-url"
  | "network-timeout"
  | "cors-blocked"
  | "not-found"
  | "expired-link"
  | "no-range-support"
  | "unsupported-codec"
  | "unsupported-server"
  | "unknown";

export interface StreamError {
  code: StreamErrorCode;
  message: string;
}

/** Persisted watch-history entry. */
export interface HistoryEntry {
  /** Stable hash of the URL. */
  id: string;
  url: string;
  title: string;
  /** Seconds. */
  position: number;
  /** Seconds; 0 when unknown. */
  duration: number;
  /** Epoch ms of last playback. */
  updatedAt: number;
}

/** User preferences persisted in localStorage. */
export interface UserSettings {
  autoplay: boolean;
  defaultVolume: number;
  defaultPlaybackRate: number;
  subtitlesEnabled: boolean;
  /** Max chunk cache size in bytes. */
  maxCacheBytes: number;
}

export type NetworkQuality = "slow" | "medium" | "fast";

export interface BufferHealth {
  /** Seconds of media buffered ahead of the playhead. */
  aheadSeconds: number;
  quality: NetworkQuality;
  /** Current target for chunks to preload ahead. */
  preloadTarget: number;
}

export type PlaybackEngine = "mse" | "native" | "hls";
