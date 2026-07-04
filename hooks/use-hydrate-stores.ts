"use client";

/** Hydrates localStorage-backed stores exactly once on the client. */
import { useEffect } from "react";

import { hydrateHistory } from "@/stores/history-store";
import { hydrateSettings } from "@/stores/settings-store";

export function useHydrateStores(): void {
  useEffect(() => {
    hydrateSettings();
    hydrateHistory();
  }, []);
}
