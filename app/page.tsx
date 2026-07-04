import { Chip } from "@heroui/react";

import { UrlForm } from "@/components/home/url-form";
import { HistoryGrid } from "@/components/history/history-grid";
import { title, subtitle } from "@/components/primitives";

const FEATURES = [
  {
    name: "Chunked streaming",
    description: "Smart range requests download only what you watch.",
  },
  {
    name: "Resume anywhere",
    description: "Playback positions are remembered on this device.",
  },
  {
    name: "CORS proxy built in",
    description: "Locked-down file hosts play through the app's server.",
  },
  {
    name: "Subtitles & speed",
    description: "Upload .vtt captions, 0.25×–2× playback, PiP and more.",
  },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Ambient cinematic glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-[480px] max-w-4xl bg-gradient-to-br from-violet-600/25 via-fuchsia-500/10 to-blue-600/25 blur-3xl"
      />

      <section className="flex flex-col items-center gap-12 py-12 md:py-20">
        {/* Hero */}
        <div className="flex max-w-3xl flex-col items-center gap-5 text-center">
          <Chip color="accent" variant="soft">
            No uploads · No accounts · Streams straight from the source
          </Chip>
          <div>
            <span className={title({ size: "lg" })}>Your link.&nbsp;</span>
            <span className={title({ size: "lg", color: "violet" })}>
              Your cinema.
            </span>
            <br />
            <span className={title({ size: "lg" })}>Instantly.</span>
          </div>
          <p className={subtitle({ class: "max-w-xl text-center" })}>
            Paste any direct video URL — MP4, WebM, MKV or HLS — and watch it
            in a beautiful player with smart buffering and resumable playback.
          </p>
        </div>

        {/* URL input */}
        <UrlForm />

        {/* Feature highlights */}
        <div className="grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.name}
              className="flex flex-col gap-1 rounded-2xl border border-separator bg-surface/60 p-4 backdrop-blur-sm"
            >
              <span className="text-sm font-semibold">{feature.name}</span>
              <span className="text-xs text-muted">{feature.description}</span>
            </div>
          ))}
        </div>

        {/* Recently watched */}
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Continue watching</h2>
          </div>
          <HistoryGrid limit={6} />
        </div>
      </section>
    </div>
  );
}
