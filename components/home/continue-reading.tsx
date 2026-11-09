"use client";

import { ArrowRight, BookOpen01, Bookmark, RefreshCw01 } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { dueReviews, useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";

export function ContinueReading({ chapters }: { chapters: Chapter[] }) {
  const lastRead = useLibrary((s) => s.lastRead);
  const bookmarks = useLibrary((s) => s.bookmarks);
  const due = useLibrary((s) => dueReviews(s).length);
  if (!lastRead && bookmarks.length === 0 && due === 0) return null;
  const ch = lastRead ? chapters[lastRead.surah - 1] : null;

  return (
    <AnimatePresence>
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ch && lastRead && (
          <Link
            href={`/surah/${ch.id}#v-${lastRead.ayah}`}
            className="group flex items-center gap-4 rounded-2xl bg-brand-solid p-5 text-white shadow-lg outline-focus-ring transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <FeaturedIcon icon={BookOpen01} color="gray" theme="dark" size="lg" />
            <span className="flex-1">
              <span className="block text-sm text-white/80">Continue reading</span>
              <span className="block text-lg font-semibold">
                {ch.nameSimple} · {ch.id}:{lastRead.ayah}
              </span>
            </span>
            <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </Link>
        )}
        {due > 0 && (
          <Link
            href="/review"
            className="group flex items-center gap-4 rounded-2xl border border-gold-400/50 bg-primary p-5 outline-focus-ring transition hover:-translate-y-0.5 hover:border-gold-400 focus-visible:outline-2"
          >
            <FeaturedIcon icon={RefreshCw01} color="warning" theme="light" size="lg" />
            <span className="flex-1">
              <span className="block text-sm text-tertiary">Memorisation review</span>
              <span className="block text-lg font-semibold text-primary">
                {due} ayah{due === 1 ? "" : "s"} due today
              </span>
            </span>
            <ArrowRight className="size-5 text-fg-quaternary transition group-hover:translate-x-1" />
          </Link>
        )}
        {bookmarks.length > 0 && (
          <Link
            href="/library"
            className="group flex items-center gap-4 rounded-2xl border border-secondary bg-primary p-5 outline-focus-ring transition hover:-translate-y-0.5 hover:border-brand focus-visible:outline-2"
          >
            <FeaturedIcon icon={Bookmark} color="brand" theme="light" size="lg" />
            <span className="flex-1">
              <span className="block text-sm text-tertiary">Bookmarks</span>
              <span className="block text-lg font-semibold text-primary">
                {bookmarks.length} saved {bookmarks.length === 1 ? "ayah" : "ayat"}
              </span>
            </span>
            <ArrowRight className="size-5 text-fg-quaternary transition group-hover:translate-x-1" />
          </Link>
        )}
      </m.div>
    </AnimatePresence>
  );
}
