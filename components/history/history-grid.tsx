"use client";

/**
 * HistoryGrid — responsive grid of history cards with skeleton loading and
 * an empty state. `limit` keeps the homepage light; the history page shows all.
 */
import { EmptyState, Skeleton } from "@heroui/react";

import { historyStore, useHistory } from "@/stores/history-store";
import { useStore } from "@/stores/create-store";
import { HistoryCard } from "@/components/history/history-card";

interface HistoryGridProps {
  limit?: number;
}

export function HistoryGrid({ limit }: HistoryGridProps) {
  const entries = useHistory();
  const hydrated = useStore(historyStore, (state) => state.hydrated);

  if (!hydrated) {
    return (
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit ?? 3 }, (_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState className="py-10">
        <p className="text-lg font-medium">Nothing watched yet</p>
        <p className="text-sm text-muted">
          Paste a video link above and it will show up here.
        </p>
      </EmptyState>
    );
  }

  const visible = limit ? entries.slice(0, limit) : entries;

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((entry) => (
        <HistoryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
