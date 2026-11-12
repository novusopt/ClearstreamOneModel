"use client";

import { ArrowRight, BookOpen01, Bookmark, Edit05, Trash01 } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { VerseNumber } from "@/components/quran/verse-number";
import { ayahName } from "@/lib/ayah-names";
import { toggleBookmark, useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";

type Order = "recent" | "mushaf";

const byMushaf = (a: string, b: string) => {
  const [s1, a1] = a.split(":").map(Number);
  const [s2, a2] = b.split(":").map(Number);
  return s1 - s2 || a1 - a2;
};

export function BookmarkList({ chapters }: { chapters: Chapter[] }) {
  const bookmarks = useLibrary((s) => s.bookmarks);
  const notes = useLibrary((s) => s.notes);
  const [order, setOrder] = useState<Order>("recent");

  if (bookmarks.length === 0) {
    return (
      <EmptyState size="md" className="max-w-none rounded-2xl bg-primary py-14 shadow-xs ring-1 ring-secondary">
        <EmptyState.Header pattern="circle">
          <EmptyState.FeaturedIcon icon={Bookmark} color="brand" theme="light" />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>No bookmarks yet</EmptyState.Title>
          <EmptyState.Description>Tap the bookmark icon beside any ayah to save it here.</EmptyState.Description>
        </EmptyState.Content>
        <EmptyState.Footer>
          <Button href="/surah/1" iconLeading={BookOpen01}>
            Start reading
          </Button>
        </EmptyState.Footer>
      </EmptyState>
    );
  }

  const list = order === "mushaf" ? [...bookmarks].sort(byMushaf) : bookmarks;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tertiary">
          {bookmarks.length} {bookmarks.length === 1 ? "bookmark" : "bookmarks"}
        </p>
        <ButtonGroup
          size="sm"
          selectedKeys={[order]}
          disallowEmptySelection
          onSelectionChange={(k) => setOrder([...k][0] as Order)}
          aria-label="Sort bookmarks"
        >
          <ButtonGroupItem id="recent">Recently saved</ButtonGroupItem>
          <ButtonGroupItem id="mushaf">Mushaf order</ButtonGroupItem>
        </ButtonGroup>
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence initial={false}>
          {list.map((key, i) => {
            const [s, a] = key.split(":").map(Number);
            const ch = chapters[s - 1];
            if (!ch) return null;
            const name = ayahName(s, a)?.name;
            const note = notes[key]?.text;
            return (
              <m.li
                key={key}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.03 } }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-col rounded-2xl bg-primary shadow-xs ring-1 ring-secondary"
              >
                <div className="flex items-start gap-4 p-5">
                  <VerseNumber surah={s} ayah={a} />
                  <Link href={`/surah/${s}#v-${a}`} prefetch={false} className="group min-w-0 flex-1 rounded-md outline-focus-ring focus-visible:outline-2">
                    <span className="block truncate text-md font-semibold text-primary group-hover:underline">{ch.nameSimple}</span>
                    <span className="block text-sm text-tertiary">
                      Ayah {a} of {ch.versesCount}
                    </span>
                  </Link>
                  <span lang="ar" dir="rtl" className="font-quran text-2xl leading-none text-secondary">
                    {ch.nameArabic}
                  </span>
                </div>
                {(name || note) && (
                  <div className="space-y-2 px-5 pb-4">
                    {name && (
                      <Badge type="pill-color" color="warning" size="sm">
                        {name}
                      </Badge>
                    )}
                    {note && (
                      <p className="flex gap-2 text-sm text-tertiary">
                        <Edit05 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                        <span className="line-clamp-2">{note}</span>
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-secondary px-5 py-3">
                  <div className="flex items-center gap-4">
                    <Button size="sm" color="link-color" href={`/surah/${s}#v-${a}`} iconTrailing={ArrowRight}>
                      Read
                    </Button>
                    <Button size="sm" color="link-gray" href={`/surah/${s}/${a}`}>
                      Ayah page
                    </Button>
                  </div>
                  <ButtonUtility size="xs" color="tertiary" tooltip="Remove bookmark" icon={Trash01} onPress={() => toggleBookmark(s, a)} />
                </div>
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
