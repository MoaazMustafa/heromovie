/**
 * Tracks observed download throughput with an exponential moving average
 * and classifies the connection so the chunk manager can adapt its
 * preload window (slow → 2 chunks, fast → 6 chunks).
 */
import type { NetworkQuality } from "@/types/streaming";

import {
  NETWORK_FAST_BPS,
  NETWORK_SLOW_BPS,
  PRELOAD_BY_QUALITY,
} from "@/lib/constants";

export class NetworkMonitor {
  /** Bytes per second, exponentially smoothed. */
  private emaBps = 0;
  private samples = 0;

  /** Records a completed download of `bytes` that took `durationMs`. */
  recordSample(bytes: number, durationMs: number): void {
    if (durationMs <= 0 || bytes <= 0) return;

    const bps = (bytes / durationMs) * 1000;

    this.samples += 1;
    // Heavier smoothing once we have a few samples.
    const alpha = this.samples < 3 ? 0.5 : 0.2;

    this.emaBps = this.emaBps === 0 ? bps : alpha * bps + (1 - alpha) * this.emaBps;
  }

  get bytesPerSecond(): number {
    return this.emaBps;
  }

  get quality(): NetworkQuality {
    if (this.samples === 0) return "medium";
    if (this.emaBps >= NETWORK_FAST_BPS) return "fast";
    if (this.emaBps <= NETWORK_SLOW_BPS) return "slow";

    return "medium";
  }

  /** Number of chunks to preload ahead for the current conditions. */
  get preloadTarget(): number {
    return PRELOAD_BY_QUALITY[this.quality];
  }
}
