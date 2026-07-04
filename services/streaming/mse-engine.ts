/**
 * MseEngine — feeds ChunkManager output into a MediaSource SourceBuffer.
 *
 * Chunks are byte-ranges of the original file, so they must be appended in
 * strict sequential order. The engine keeps an append queue, tracks the next
 * expected chunk index and drives the ChunkManager focus window from the
 * current playback position.
 *
 * When the user seeks into a region that has not been appended yet (which
 * byte-range MSE cannot satisfy without container-level index parsing), the
 * engine reports `onNeedFallback` so playback can continue through the
 * browser's native range-request streaming.
 */
import type { VideoChunk } from "@/types/streaming";

import { ChunkManager } from "@/services/streaming/chunk-manager";
import { mseMimeFor } from "@/lib/capabilities";

export interface MseEngineOptions {
  videoId: string;
  url: string;
  contentLength: number;
  contentType: string | null;
  maxCacheBytes?: number;
  /** Fired when MSE cannot continue and native playback should take over. */
  onNeedFallback: (reason: string) => void;
}

export class MseEngine {
  private readonly manager: ChunkManager;
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private video: HTMLVideoElement | null = null;
  private objectUrl: string | null = null;

  /** Chunks waiting to be appended, keyed by index. */
  private pending = new Map<number, VideoChunk>();
  private nextAppendIndex = 0;
  private appending = false;
  private disposed = false;

  constructor(private readonly options: MseEngineOptions) {
    this.manager = new ChunkManager({
      videoId: options.videoId,
      url: options.url,
      contentLength: options.contentLength,
      maxCacheBytes: options.maxCacheBytes,
      onChunkReady: (chunk) => this.enqueue(chunk),
      onError: () => this.fallback("chunk-download-failed"),
    });
  }

  /** True when this browser/source combination can use the MSE pipeline. */
  static supports(contentType: string | null): boolean {
    return mseMimeFor(contentType) !== null;
  }

  attach(video: HTMLVideoElement): void {
    const mime = mseMimeFor(this.options.contentType);

    if (!mime || !("MediaSource" in window)) {
      this.fallback("mse-unsupported");

      return;
    }

    this.video = video;
    this.mediaSource = new MediaSource();
    this.objectUrl = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener("sourceopen", () => {
      if (!this.mediaSource || this.disposed) return;

      try {
        this.sourceBuffer = this.mediaSource.addSourceBuffer(mime);
      } catch {
        this.fallback("source-buffer-failed");

        return;
      }

      this.sourceBuffer.addEventListener("updateend", () => this.drain());
      this.sourceBuffer.addEventListener("error", () =>
        this.fallback("append-error"),
      );

      this.manager.focus(0);
    });

    video.addEventListener("timeupdate", this.handleTimeUpdate);
    video.addEventListener("seeking", this.handleSeeking);
    video.addEventListener("durationchange", this.handleDurationChange);
    video.src = this.objectUrl;
  }

  dispose(): void {
    this.disposed = true;
    this.manager.dispose();

    if (this.video) {
      this.video.removeEventListener("timeupdate", this.handleTimeUpdate);
      this.video.removeEventListener("seeking", this.handleSeeking);
      this.video.removeEventListener("durationchange", this.handleDurationChange);
    }

    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);

    this.pending.clear();
    this.mediaSource = null;
    this.sourceBuffer = null;
    this.video = null;
  }

  private get bytesPerSecond(): number {
    const duration = this.video?.duration;

    if (!duration || !Number.isFinite(duration) || duration <= 0) return 0;

    return this.options.contentLength / duration;
  }

  private handleDurationChange = (): void => {
    const duration = this.video?.duration;

    if (duration && Number.isFinite(duration)) {
      this.manager.setMediaDuration(duration);
    }
  };

  private handleTimeUpdate = (): void => {
    if (!this.video || this.bytesPerSecond === 0) return;

    const byteOffset = this.video.currentTime * this.bytesPerSecond;

    this.manager.focus(this.manager.chunkIndexForByte(byteOffset));
    this.maybeEndOfStream();
  };

  private handleSeeking = (): void => {
    if (!this.video) return;

    const buffered = this.video.buffered;
    const time = this.video.currentTime;

    for (let i = 0; i < buffered.length; i++) {
      if (time >= buffered.start(i) && time <= buffered.end(i)) return;
    }

    // Seek target is outside every appended range: sequential byte-range MSE
    // cannot jump ahead without a container index, so hand over to native.
    this.fallback("seek-outside-buffer");
  };

  private enqueue(chunk: VideoChunk): void {
    if (this.disposed) return;

    this.pending.set(chunk.index, chunk);
    this.drain();
  }

  private drain(): void {
    if (
      this.disposed ||
      this.appending ||
      !this.sourceBuffer ||
      this.sourceBuffer.updating
    ) {
      return;
    }

    const chunk = this.pending.get(this.nextAppendIndex);

    if (!chunk) return;

    this.appending = true;
    this.pending.delete(chunk.index);

    try {
      this.sourceBuffer.appendBuffer(chunk.data);
      this.nextAppendIndex += 1;
    } catch {
      this.fallback("append-error");

      return;
    } finally {
      this.appending = false;
    }

    this.maybeEndOfStream();
  }

  private maybeEndOfStream(): void {
    if (
      this.mediaSource?.readyState === "open" &&
      this.nextAppendIndex >= this.manager.chunkCount &&
      this.sourceBuffer &&
      !this.sourceBuffer.updating
    ) {
      try {
        this.mediaSource.endOfStream();
      } catch {
        // Already ended or torn down.
      }
    }
  }

  private fallback(reason: string): void {
    if (this.disposed) return;

    this.dispose();
    this.options.onNeedFallback(reason);
  }
}
