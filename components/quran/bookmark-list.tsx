"use client";

import { Bookmark, Trash01 } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { toggleBookmark, useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";

export function BookmarkList({ chapters }: { chapters: Chapter[] }) {
  const bookmarks = useLibrary((s) => s.bookmarks);

  if (bookmarks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-12 flex flex-col items-center rounded-3xl border border-dashed border-secondary px-6 py-16 text-center">
        <FeaturedIcon icon={Bookmark} color="brand" theme="light" size="lg" />
        <h2 className="mt-4 text-lg font-semibold text-primary">No bookmarks yet</h2>
        <p className="mt-1 max-w-sm text-sm text-tertiary">Tap the bookmark icon beside any ayah to save it here.</p>
        <Button className="mt-6" href="/surah/1">
          Start reading
        </Button>
      </motion.div>
    );
  }

  return (
    <ul className="mt-10 space-y-3">
      <AnimatePresence initial={false}>
        {bookmarks.map((key, i) => {
          const [s, a] = key.split(":").map(Number);
          const ch = chapters[s - 1];
          if (!ch) return null;
          return (
            <motion.li
              key={key}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
              exit={{ opacity: 0, x: -40 }}
              className="flex items-center gap-3 rounded-2xl border border-secondary bg-primary p-4"
            >
              <Link href={`/surah/${s}#v-${a}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-lg outline-focus-ring focus-visible:outline-2">
                <span className="flex h-10 min-w-14 items-center justify-center rounded-xl bg-brand-primary px-2 text-sm font-semibold text-brand-secondary tabular-nums">{key}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-primary">{ch.nameSimple}</span>
                  <span className="block truncate text-sm text-tertiary">Ayah {a} of {ch.versesCount}</span>
                </span>
                <span lang="ar" dir="rtl" className="ml-auto font-quran text-2xl text-secondary">
                  {ch.nameArabic}
                </span>
              </Link>
              <ButtonUtility size="sm" color="tertiary" tooltip="Remove" icon={Trash01} onPress={() => toggleBookmark(s, a)} />
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
