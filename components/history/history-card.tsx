"use client";

/** HistoryCard — one watch-history entry with progress and actions. */
import { memo } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ProgressBar, Tooltip } from "@heroui/react";

import type { HistoryEntry } from "@/types/streaming";

import { formatRelativeDate, formatTime } from "@/lib/format";
import { removeHistoryEntry } from "@/stores/history-store";
import { PlayCircleIcon, TrashIcon } from "@/components/player/player-icons";

interface HistoryCardProps {
  entry: HistoryEntry;
}

export const HistoryCard = memo(function HistoryCard({ entry }: HistoryCardProps) {
  const router = useRouter();
  const percent =
    entry.duration > 0
      ? Math.min(Math.round((entry.position / entry.duration) * 100), 100)
      : 0;

  const resume = () =>
    router.push(`/watch?src=${encodeURIComponent(entry.url)}`);

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title className="truncate text-base" title={entry.title}>
          {entry.title}
        </Card.Title>
        <Card.Description className="truncate text-xs" title={entry.url}>
          {entry.url}
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex flex-col gap-2">
        <ProgressBar
          aria-label={`Watched ${percent}%`}
          className="w-full"
          value={percent}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <div className="flex justify-between text-xs text-muted">
          <span className="tabular-nums">
            {formatTime(entry.position)}
            {entry.duration > 0 && ` / ${formatTime(entry.duration)} · ${percent}%`}
          </span>
          <span>{formatRelativeDate(entry.updatedAt)}</span>
        </div>
      </Card.Content>

      <Card.Footer className="flex justify-between gap-2">
        <Button size="sm" variant="primary" onPress={resume}>
          <PlayCircleIcon size={16} />
          Resume
        </Button>
        <Tooltip>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              aria-label={`Remove ${entry.title} from history`}
              size="sm"
              variant="danger-soft"
              onPress={() => removeHistoryEntry(entry.id)}
            >
              <TrashIcon size={16} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Remove from history</Tooltip.Content>
        </Tooltip>
      </Card.Footer>
    </Card>
  );
});
