import type { Metadata } from "next";
import { LibraryView } from "@/components/library/library-view";
import { getChapters } from "@/lib/quran";

// Personal, device-local page: keep it out of search results.
export const metadata: Metadata = { title: "Library", robots: { index: false, follow: true } };

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-24 md:px-8">
      <p className="text-sm font-semibold text-brand-secondary">Saved on this device</p>
      <h1 className="mt-2 font-display text-display-sm font-medium tracking-tight text-primary">Your library</h1>
      <p className="mt-2 max-w-xl text-tertiary">Reading progress and plans, bookmarks, notes and the ayat you have memorised.</p>
      <LibraryView chapters={getChapters()} />
    </div>
  );
}
