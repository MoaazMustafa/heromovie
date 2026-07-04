"use client";

import { useEffect } from "react";
import { Alert, Button } from "@heroui/react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16">
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Something went wrong</Alert.Title>
          <Alert.Description>
            An unexpected error occurred. You can try again or go back home.
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <div className="flex gap-2">
        <Button variant="primary" onPress={() => reset()}>
          Try again
        </Button>
        <Button variant="tertiary" onPress={() => (window.location.href = "/")}>
          Go home
        </Button>
      </div>
    </div>
  );
}
