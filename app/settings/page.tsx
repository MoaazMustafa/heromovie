import type { Metadata } from "next";

import { SettingsView } from "@/components/settings/settings-view";
import { title } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <h1 className={title({ size: "sm" })}>Settings</h1>
      <SettingsView />
    </section>
  );
}
