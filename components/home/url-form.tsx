"use client";

/**
 * UrlForm — hero URL input. Validates the link client-side and routes to
 * /watch?src=… with proper encoding.
 */
import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, InputGroup, TextField } from "@heroui/react";

import { looksLikeVideoUrl, parseVideoUrl } from "@/lib/video-url";
import { PlayCircleIcon } from "@/components/player/player-icons";

export function UrlForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const play = useCallback(
    (event: FormEvent) => {
      event.preventDefault();

      const parsed = parseVideoUrl(value);

      if (!parsed) {
        setError("Please paste a valid http(s) link.");

        return;
      }

      setError(null);
      setIsNavigating(true);
      router.push(`/watch?src=${encodeURIComponent(parsed.toString())}`);
    },
    [value, router],
  );

  const handleChange = useCallback((next: string) => {
    setValue(next);
    setError(null);

    const parsed = parseVideoUrl(next);

    setWarning(
      parsed && !looksLikeVideoUrl(parsed)
        ? "This doesn't look like a direct video file — playback may fail."
        : null,
    );
  }, []);

  return (
    <form
      className="flex w-full max-w-2xl flex-col gap-2"
      onSubmit={play}
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <TextField
          aria-label="Video URL"
          className="flex-1"
          isInvalid={error !== null}
          name="url"
          type="url"
          value={value}
          onChange={handleChange}
        >
          <InputGroup className="h-12">
            <InputGroup.Input
              className="text-base"
              placeholder="https://example.com/movie.mp4"
              spellCheck={false}
            />
          </InputGroup>
        </TextField>
        <Button
          className="h-12 px-8"
          isDisabled={!value.trim() || isNavigating}
          isPending={isNavigating}
          type="submit"
          variant="primary"
        >
          <PlayCircleIcon size={20} />
          Play
        </Button>
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {!error && warning && <p className="text-sm text-warning">{warning}</p>}
    </form>
  );
}
