"use client";

/**
 * WatchView — client-side watch experience:
 * validates the ?src= URL, offers "Continue watching?" resume, then mounts
 * the player. The player is mounted only after the resume decision so
 * playback starts exactly once at the right position.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Modal, Skeleton } from "@heroui/react";

import { parseVideoUrl, titleFromUrl } from "@/lib/video-url";
import { formatTime } from "@/lib/format";
import { getHistoryEntry } from "@/stores/history-store";
import { useStore } from "@/stores/create-store";
import { historyStore } from "@/stores/history-store";
import { VideoPlayer } from "@/components/player/video-player";
import { title as titleClass } from "@/components/primitives";

export function WatchView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const src = searchParams.get("src") ?? "";
  const parsed = useMemo(() => parseVideoUrl(src), [src]);
  const videoTitle = useMemo(() => (parsed ? titleFromUrl(src) : ""), [parsed, src]);

  const hydrated = useStore(historyStore, (state) => state.hydrated);

  /** null = undecided, number = start position (0 for "start over"). */
  const [startPosition, setStartPosition] = useState<number | null>(null);
  const [resumeCandidate, setResumeCandidate] = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated || !parsed || startPosition !== null) return;

    const entry = getHistoryEntry(src);
    const isResumable =
      entry &&
      entry.position > 30 &&
      (entry.duration === 0 || entry.position < entry.duration * 0.95);

    if (isResumable) setResumeCandidate(entry.position);
    else setStartPosition(0);
  }, [hydrated, parsed, src, startPosition]);

  if (!parsed) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 py-10">
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Invalid video link</Alert.Title>
            <Alert.Description>
              The address you provided is not a valid http(s) URL. Paste a
              direct link to a video file.
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant="primary" onPress={() => router.push("/")}>
          Back to home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className={titleClass({ size: "sm", class: "truncate" })} title={videoTitle}>
        {videoTitle}
      </h1>

      {startPosition !== null ? (
        <VideoPlayer initialPosition={startPosition} title={videoTitle} url={src} />
      ) : (
        <Skeleton className="aspect-video w-full rounded-2xl" />
      )}

      {/* Resume watching dialog */}
      <Modal isOpen={resumeCandidate !== null && startPosition === null}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog aria-label="Continue watching">
              <Modal.Header>
                <Modal.Heading>Continue watching?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                You stopped at{" "}
                <span className="font-semibold tabular-nums">
                  {formatTime(resumeCandidate ?? 0)}
                </span>
                . Resume from there or start over?
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setStartPosition(0)}>
                  Start over
                </Button>
                <Button
                  variant="primary"
                  onPress={() => setStartPosition(resumeCandidate ?? 0)}
                >
                  Resume
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
