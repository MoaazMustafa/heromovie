/**
 * ChunkManager — the heart of the streaming pipeline.
 *
 * Responsibilities:
 * - splits the remote file into fixed-size byte ranges ("chunks")
 * - downloads the chunk under the playhead plus an adaptive look-ahead window
 * - deduplicates in-flight requests and retries failures with backoff
 * - serves chunks from the IndexedDB cache when available
 * - evicts chunks far behind the playhead so the cache never grows unbounded
 * - refocuses the download window instantly on seek
 */
import type { NetworkQuality, VideoChunk } from "@/types/streaming";

import {
  CHUNK_RETRY_BASE_DELAY_MS,
  CHUNK_RETRY_LIMIT,
  CHUNK_SIZE,
  DEFAULT_MAX_CACHE_BYTES,
  KEEP_BEHIND_SECONDS,
  LONG_VIDEO_THRESHOLD_SECONDS,
  MAX_CONCURRENT_DOWNLOADS,
  REQUEST_TIMEOUT_MS,
} from "@/lib/constants";
import { chunkCache } from "@/services/chunk-cache";
import { NetworkMonitor } from "@/services/streaming/network-monitor";

export interface ChunkManagerOptions {
  videoId: string;
  url: string;
  contentLength: number;
  chunkSize?: number;
  maxCacheBytes?: number;
  /** Called whenever a chunk becomes available (cache hit or download). */
  onChunkReady?: (chunk: VideoChunk) => void;
  onError?: (error: Error, chunkIndex: number) => void;
}

export class ChunkManager {
  readonly chunkCount: number;

  private readonly chunkSize: number;
  private readonly maxCacheBytes: number;
  private readonly monitor = new NetworkMonitor();
  private readonly inFlight = new Map<number, AbortController>();
  private readonly failures = new Map<number, number>();
  private readonly ready = new Set<number>();

  private focusIndex = 0;
  private mediaDuration = 0;
  private disposed = false;

  constructor(private readonly options: ChunkManagerOptions) {
    this.chunkSize = options.chunkSize ?? CHUNK_SIZE;
    this.maxCacheBytes = options.maxCacheBytes ?? DEFAULT_MAX_CACHE_BYTES;
    this.chunkCount = Math.ceil(options.contentLength / this.chunkSize);
  }

  /** Lets eviction convert the 10-minute keep-behind window into chunk counts. */
  setMediaDuration(seconds: number): void {
    this.mediaDuration = seconds;
  }

  get networkQuality(): NetworkQuality {
    return this.monitor.quality;
  }

  get preloadTarget(): number {
    return this.monitor.preloadTarget;
  }

  chunkIndexForByte(byteOffset: number): number {
    return Math.floor(byteOffset / this.chunkSize);
  }

  isReady(index: number): boolean {
    return this.ready.has(index);
  }

  /**
   * Focuses the download window on `index` (the chunk under the playhead)
   * and schedules the adaptive look-ahead. Called on timeupdate and on seek.
   */
  focus(index: number): void {
    if (this.disposed) return;

    this.focusIndex = Math.max(0, Math.min(index, this.chunkCount - 1));
    this.cancelOutOfWindowDownloads();
    void this.fillWindow();
    void this.evictBehind();
  }

  /** Fetches a single chunk on demand (used for backward seeks). */
  async request(index: number): Promise<VideoChunk | null> {
    if (index < 0 || index >= this.chunkCount) return null;

    const cached = await chunkCache.get(this.options.videoId, index);

    if (cached) {
      this.markReady(cached);

      return cached;
    }

    return this.download(index);
  }

  dispose(): void {
    this.disposed = true;

    for (const controller of this.inFlight.values()) controller.abort();
    this.inFlight.clear();
  }

  /** Removes all cached data for this video. */
  async purge(): Promise<void> {
    this.dispose();
    await chunkCache.deleteVideo(this.options.videoId);
  }

  private windowEnd(): number {
    return Math.min(this.focusIndex + this.monitor.preloadTarget, this.chunkCount - 1);
  }

  private async fillWindow(): Promise<void> {
    for (let index = this.focusIndex; index <= this.windowEnd(); index++) {
      if (this.disposed) return;
      if (this.ready.has(index) || this.inFlight.has(index)) continue;
      if (this.inFlight.size >= MAX_CONCURRENT_DOWNLOADS) return;

      const cached = await chunkCache.get(this.options.videoId, index);

      if (cached) {
        this.markReady(cached);
        continue;
      }

      void this.download(index).then(() => this.fillWindow());
    }
  }

  private cancelOutOfWindowDownloads(): void {
    const end = this.windowEnd();

    for (const [index, controller] of this.inFlight) {
      if (index < this.focusIndex || index > end) {
        controller.abort();
        this.inFlight.delete(index);
      }
    }
  }

  private async download(index: number): Promise<VideoChunk | null> {
    if (this.disposed || this.inFlight.has(index)) return null;

    const start = index * this.chunkSize;
    const end = Math.min(start + this.chunkSize - 1, this.options.contentLength - 1);
    const controller = new AbortController();

    this.inFlight.set(index, controller);

    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = performance.now();

    try {
      const response = await fetch(this.options.url, {
        headers: { Range: `bytes=${start}-${end}` },
        signal: controller.signal,
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`Range request failed with status ${response.status}`);
      }

      const data = await response.arrayBuffer();

      this.monitor.recordSample(data.byteLength, performance.now() - startedAt);

      const chunk: VideoChunk = {
        id: `${this.options.videoId}:${index}`,
        videoId: this.options.videoId,
        index,
        start,
        end,
        data,
        createdAt: Date.now(),
      };

      await chunkCache.put(chunk);
      await chunkCache.enforceBudget(this.maxCacheBytes);
      this.failures.delete(index);
      this.markReady(chunk);

      return chunk;
    } catch (error) {
      if (controller.signal.aborted && this.disposed) return null;

      return this.handleFailure(index, error);
    } finally {
      clearTimeout(timeout);
      this.inFlight.delete(index);
    }
  }

  private handleFailure(index: number, error: unknown): Promise<VideoChunk | null> {
    const attempts = (this.failures.get(index) ?? 0) + 1;

    this.failures.set(index, attempts);

    if (attempts > CHUNK_RETRY_LIMIT) {
      this.options.onError?.(
        error instanceof Error ? error : new Error(String(error)),
        index,
      );

      return Promise.resolve(null);
    }

    const delay = CHUNK_RETRY_BASE_DELAY_MS * 2 ** (attempts - 1);

    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.disposed) {
          resolve(null);

          return;
        }
        resolve(this.download(index));
      }, delay);
    });
  }

  private markReady(chunk: VideoChunk): void {
    if (!this.ready.has(chunk.index)) {
      this.ready.add(chunk.index);
      this.options.onChunkReady?.(chunk);
    }
  }

  /**
   * Long-video eviction: for videos over 40 minutes, keep only ~10 minutes
   * of media behind the playhead; for shorter videos keep everything (the
   * global cache budget still applies).
   */
  private async evictBehind(): Promise<void> {
    if (this.mediaDuration < LONG_VIDEO_THRESHOLD_SECONDS) return;
    if (this.mediaDuration <= 0) return;

    const bytesPerSecond = this.options.contentLength / this.mediaDuration;
    const keepBehindChunks = Math.ceil(
      (KEEP_BEHIND_SECONDS * bytesPerSecond) / this.chunkSize,
    );
    const evictBefore = this.focusIndex - keepBehindChunks;

    for (const index of this.ready) {
      if (index < evictBefore) {
        this.ready.delete(index);
        await chunkCache.delete(this.options.videoId, index);
      }
    }
  }
}
