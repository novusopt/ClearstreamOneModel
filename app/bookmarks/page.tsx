import type { Metadata } from "next";
import { BookmarkList } from "@/components/quran/bookmark-list";
import { getChapters } from "@/lib/quran";

export const metadata: Metadata = { title: "Bookmarks" };

export default function BookmarksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-24">
      <p className="text-sm font-semibold text-brand-secondary">Saved on this device</p>
      <h1 className="mt-2 text-display-sm font-semibold tracking-tight text-primary">Bookmarks</h1>
      <BookmarkList chapters={getChapters()} />
    </div>
  );
}
