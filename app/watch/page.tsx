import type { Metadata } from "next";

import { Suspense } from "react";
import { Skeleton } from "@heroui/react";

import { WatchView } from "@/components/watch/watch-view";

export const metadata: Metadata = {
  title: "Watch",
};

export default function WatchPage() {
  return (
    <Suspense
      fallback={<Skeleton className="mt-4 aspect-video w-full rounded-2xl" />}
    >
      <WatchView />
    </Suspense>
  );
}
