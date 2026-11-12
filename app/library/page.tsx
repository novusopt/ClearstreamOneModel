import type { Metadata } from "next";
import { LibraryView } from "@/components/library/library-view";
import { getChapters } from "@/lib/quran";

// Personal, device-local page: keep it out of search results.
export const metadata: Metadata = { title: "Library", robots: { index: false, follow: true } };

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-24 md:px-8 md:pt-32">
      <LibraryView chapters={getChapters()} />
    </div>
  );
}
