import { UrlForm } from "@/components/home/url-form";
import { HistoryGrid } from "@/components/history/history-grid";
import { title, subtitle } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center gap-10 py-10 md:py-16">
      {/* Hero */}
      <div className="flex max-w-3xl flex-col items-center gap-4 text-center">
        <div>
          <span className={title({ size: "lg" })}>Stream&nbsp;</span>
          <span className={title({ size: "lg", color: "violet" })}>
            any video
          </span>
          <br />
          <span className={title({ size: "lg" })}>straight from a link.</span>
        </div>
        <p className={subtitle({ class: "max-w-xl text-center" })}>
          Paste a direct video URL and watch instantly — smart chunked
          buffering, resumable playback and zero uploads.
        </p>
      </div>

      {/* URL input */}
      <UrlForm />

      {/* Recently watched */}
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-xl font-semibold">Recently watched</h2>
        <HistoryGrid limit={6} />
      </div>
    </section>
  );
}
