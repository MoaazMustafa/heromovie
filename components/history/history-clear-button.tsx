"use client";

/** Clears the entire watch history after confirmation. */
import { Button, Modal } from "@heroui/react";

import { clearHistory, useHistory } from "@/stores/history-store";
import { TrashIcon } from "@/components/player/player-icons";

export function HistoryClearButton() {
  const entries = useHistory();

  if (entries.length === 0) return null;

  return (
    <Modal>
      <Modal.Trigger>
        <Button size="sm" variant="danger-soft">
          <TrashIcon size={16} />
          Clear all
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog aria-label="Clear history">
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading>Clear watch history?</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  This removes all {entries.length} entries and their saved
                  playback positions. This cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="tertiary" onPress={close}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onPress={() => {
                      clearHistory();
                      close();
                    }}
                  >
                    Clear history
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
