import { title, subtitle } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl justify-center text-center">
        <span className={title()}>Stream&nbsp;</span>
        <span className={title({ color: "violet" })}>any video&nbsp;</span>
        <span className={title()}>from a link.</span>
        <div className={subtitle({ class: "mt-4" })}>
          Paste a direct video URL and start watching instantly.
        </div>
      </div>
    </section>
  );
}
