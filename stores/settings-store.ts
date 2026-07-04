/**
 * User settings — persisted to localStorage, hydrated once on the client.
 */
import type { UserSettings } from "@/types/streaming";

import { createStore, useStore } from "@/stores/create-store";
import { readJson, writeJson } from "@/services/local-storage";
import { DEFAULT_MAX_CACHE_BYTES, STORAGE_KEYS } from "@/lib/constants";

export const DEFAULT_SETTINGS: UserSettings = {
  autoplay: true,
  defaultVolume: 1,
  defaultPlaybackRate: 1,
  subtitlesEnabled: true,
  maxCacheBytes: DEFAULT_MAX_CACHE_BYTES,
};

interface SettingsState {
  settings: UserSettings;
  hydrated: boolean;
}

export const settingsStore = createStore<SettingsState>({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
});

export function hydrateSettings(): void {
  if (settingsStore.get().hydrated) return;

  settingsStore.set({
    settings: {
      ...DEFAULT_SETTINGS,
      ...readJson<Partial<UserSettings>>(STORAGE_KEYS.settings, {}),
    },
    hydrated: true,
  });
}

export function updateSettings(patch: Partial<UserSettings>): void {
  const next = { ...settingsStore.get().settings, ...patch };

  settingsStore.set({ settings: next });
  writeJson(STORAGE_KEYS.settings, next);
}

export function resetSettings(): void {
  settingsStore.set({ settings: DEFAULT_SETTINGS });
  writeJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function useSettings(): UserSettings {
  return useStore(settingsStore, (state) => state.settings);
}
