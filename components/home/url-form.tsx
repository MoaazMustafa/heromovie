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

  const SAMPLES = [
    {
      label: "Big Buck Bunny (MP4)",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    {
      label: "Live stream demo (HLS)",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    },
  ];

  return (
    <form
      className="flex w-full max-w-2xl flex-col gap-3"
      onSubmit={play}
    >
      <div className="flex w-full flex-col gap-2 rounded-3xl border border-separator bg-surface/70 p-3 shadow-lg backdrop-blur-md sm:flex-row">
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
              placeholder="https://example.com/movie.mp4 · .webm · .mkv · .m3u8"
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

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
        <span>Try it:</span>
        {SAMPLES.map((sample) => (
          <button
            key={sample.url}
            className="rounded-full border border-separator px-3 py-1 transition-colors hover:border-accent hover:text-accent"
            type="button"
            onClick={() => handleChange(sample.url)}
          >
            {sample.label}
          </button>
        ))}
      </div>
    </form>
  );
}
