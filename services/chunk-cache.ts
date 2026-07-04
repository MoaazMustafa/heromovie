/**
 * IndexedDB-backed chunk cache.
 *
 * Stores downloaded byte-ranges keyed by `${videoId}:${index}` so playback
 * can survive seeks/reloads without re-downloading, while enforcing a hard
 * size budget with LRU-style eviction (oldest chunks first).
 */
import type { VideoChunk } from "@/types/streaming";

import { CHUNK_STORE, DB_NAME, DB_VERSION } from "@/lib/constants";

function chunkKey(videoId: string, index: number): string {
  return `${videoId}:${index}`;
}

export class ChunkCache {
  private dbPromise: Promise<IDBDatabase> | null = null;
  /** In-memory fallback when IndexedDB is unavailable. */
  private memory = new Map<string, VideoChunk>();
  private useMemory = typeof indexedDB === "undefined";

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains(CHUNK_STORE)) {
            const store = db.createObjectStore(CHUNK_STORE, { keyPath: "id" });

            store.createIndex("byVideo", "videoId");
            store.createIndex("byCreatedAt", "createdAt");
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  private async withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.open();

    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(CHUNK_STORE, mode);
      const request = run(tx.objectStore(CHUNK_STORE));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(videoId: string, index: number): Promise<VideoChunk | null> {
    const key = chunkKey(videoId, index);

    if (this.useMemory) return this.memory.get(key) ?? null;

    try {
      const result = await this.withStore("readonly", (store) =>
        store.get(key),
      );

      return (result as VideoChunk | undefined) ?? null;
    } catch {
      this.useMemory = true;

      return this.memory.get(key) ?? null;
    }
  }

  async put(chunk: VideoChunk): Promise<void> {
    if (this.useMemory) {
      this.memory.set(chunk.id, chunk);

      return;
    }

    try {
      await this.withStore("readwrite", (store) => store.put(chunk));
    } catch {
      this.useMemory = true;
      this.memory.set(chunk.id, chunk);
    }
  }

  async delete(videoId: string, index: number): Promise<void> {
    const key = chunkKey(videoId, index);

    if (this.useMemory) {
      this.memory.delete(key);

      return;
    }

    try {
      await this.withStore("readwrite", (store) => store.delete(key));
    } catch {
      this.memory.delete(key);
    }
  }

  /** Removes every cached chunk for a video. */
  async deleteVideo(videoId: string): Promise<void> {
    if (this.useMemory) {
      for (const key of this.memory.keys()) {
        if (key.startsWith(`${videoId}:`)) this.memory.delete(key);
      }

      return;
    }

    const db = await this.open();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CHUNK_STORE, "readwrite");
      const index = tx.objectStore(CHUNK_STORE).index("byVideo");
      const request = index.openCursor(IDBKeyRange.only(videoId));

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Total bytes stored across all videos. */
  async totalBytes(): Promise<number> {
    if (this.useMemory) {
      let total = 0;

      for (const chunk of this.memory.values()) total += chunk.data.byteLength;

      return total;
    }

    const db = await this.open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(CHUNK_STORE, "readonly");
      const request = tx.objectStore(CHUNK_STORE).openCursor();
      let total = 0;

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor) {
          total += (cursor.value as VideoChunk).data.byteLength;
          cursor.continue();
        } else {
          resolve(total);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Evicts oldest chunks until the cache fits within `maxBytes`. */
  async enforceBudget(maxBytes: number): Promise<void> {
    if (this.useMemory) {
      let total = 0;

      for (const chunk of this.memory.values()) total += chunk.data.byteLength;

      if (total <= maxBytes) return;

      const sorted = [...this.memory.values()].sort(
        (a, b) => a.createdAt - b.createdAt,
      );

      for (const chunk of sorted) {
        if (total <= maxBytes) break;
        total -= chunk.data.byteLength;
        this.memory.delete(chunk.id);
      }

      return;
    }

    const total = await this.totalBytes();

    if (total <= maxBytes) return;

    const db = await this.open();
    let toFree = total - maxBytes;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CHUNK_STORE, "readwrite");
      const index = tx.objectStore(CHUNK_STORE).index("byCreatedAt");
      const request = index.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor && toFree > 0) {
          toFree -= (cursor.value as VideoChunk).data.byteLength;
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Clears the entire cache. */
  async clear(): Promise<void> {
    this.memory.clear();

    if (this.useMemory) return;

    try {
      await this.withStore("readwrite", (store) => store.clear());
    } catch {
      // Nothing left to do — memory map already cleared.
    }
  }
}

/** Shared singleton — chunk cache is app-global by design. */
export const chunkCache = new ChunkCache();
