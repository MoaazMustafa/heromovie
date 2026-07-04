/**
 * Watch history — persisted to localStorage, capped to a sane maximum.
 */
import type { HistoryEntry } from "@/types/streaming";

import { createStore, useStore } from "@/stores/create-store";
import { readJson, writeJson } from "@/services/local-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { hashUrl, titleFromUrl } from "@/lib/video-url";

const MAX_ENTRIES = 100;

interface HistoryState {
  entries: HistoryEntry[];
  hydrated: boolean;
}

export const historyStore = createStore<HistoryState>({
  entries: [],
  hydrated: false,
});

export function hydrateHistory(): void {
  if (historyStore.get().hydrated) return;

  historyStore.set({
    entries: readJson<HistoryEntry[]>(STORAGE_KEYS.history, []),
    hydrated: true,
  });
}

function persist(entries: HistoryEntry[]): void {
  historyStore.set({ entries });
  writeJson(STORAGE_KEYS.history, entries);
}

/** Creates or updates the entry for `url` with the latest position. */
export function recordProgress(
  url: string,
  position: number,
  duration: number,
): void {
  const id = hashUrl(url);
  const entries = historyStore.get().entries;
  const existing = entries.find((entry) => entry.id === id);

  const updated: HistoryEntry = {
    id,
    url,
    title: existing?.title ?? titleFromUrl(url),
    position,
    duration: duration || existing?.duration || 0,
    updatedAt: Date.now(),
  };

  persist(
    [updated, ...entries.filter((entry) => entry.id !== id)].slice(
      0,
      MAX_ENTRIES,
    ),
  );
}

export function getHistoryEntry(url: string): HistoryEntry | undefined {
  return historyStore
    .get()
    .entries.find((entry) => entry.id === hashUrl(url));
}

export function removeHistoryEntry(id: string): void {
  persist(historyStore.get().entries.filter((entry) => entry.id !== id));
}

export function clearHistory(): void {
  persist([]);
}

export function useHistory(): HistoryEntry[] {
  return useStore(historyStore, (state) => state.entries);
}
