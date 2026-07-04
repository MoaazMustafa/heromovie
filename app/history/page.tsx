import type { Metadata } from "next";

import { HistoryClearButton } from "@/components/history/history-clear-button";
import { HistoryGrid } from "@/components/history/history-grid";
import { title } from "@/components/primitives";

export const metadata: Metadata = {
  title: "History",
};

export default function HistoryPage() {
  return (
    <section className="flex flex-col gap-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className={title({ size: "sm" })}>Watch history</h1>
        <HistoryClearButton />
      </div>
      <HistoryGrid />
    </section>
  );
}
