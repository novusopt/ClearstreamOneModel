"use client";

import { ChevronRight } from "@untitledui/icons";
import { m, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { juzOf, SAJDAH_AYAT } from "@/lib/constants";
import type { Chapter } from "@/lib/types";
import { toArabicNumber } from "@/lib/utils";

export function SurahHero({ chapter }: { chapter: Chapter }) {
  const firstJuz = juzOf(chapter.id, 1);
  const lastJuz = juzOf(chapter.id, chapter.versesCount);
  const juzRange = firstJuz === lastJuz ? `Juzʾ ${firstJuz}` : `Juzʾ ${firstJuz}–${lastJuz}`;
  const sajdahs = SAJDAH_AYAT.filter(([s]) => s === chapter.id).length;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.2]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <div ref={ref} className="relative overflow-hidden pt-24 pb-5 md:pt-28 md:pb-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/60" />
      <m.div style={{ opacity, y }} className="mx-auto max-w-5xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          <Button href="/#surahs" color="link-gray" size="sm">
            Surahs
          </Button>
          <ChevronRight aria-hidden="true" className="size-4 text-fg-quaternary" />
          <span aria-current="page" className="font-semibold text-brand-secondary">
            {chapter.nameSimple}
          </span>
        </nav>

        {/* Compact so the reading starts high on the page; the Arabic name sits beside the title on every screen size. */}
        <div className="mt-4 flex items-end justify-between gap-4 border-b border-secondary pb-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="relative flex size-10 shrink-0 items-center justify-center sm:size-12">
              <span className="absolute inset-[6px] rotate-45 rounded-lg bg-brand-solid shadow-md sm:inset-[7px]" />
              <span className="relative font-display text-md font-medium text-white tabular-nums sm:text-lg">{chapter.id}</span>
            </span>
            <div className="min-w-0">
              <h1
                className="enter-visible font-display text-display-xs font-medium tracking-tight text-primary sm:text-display-sm"
              >
                {chapter.nameSimple}
              </h1>
              <p className="mt-0.5 text-md text-tertiary">{chapter.nameTranslation}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge type="pill-color" color={chapter.revelation === "meccan" ? "warning" : "brand"} size="sm">
                  {chapter.revelation === "meccan" ? "Meccan" : "Medinan"}
                </Badge>
                <Badge type="modern" color="gray" size="sm">
                  {chapter.versesCount} ayat
                </Badge>
                <Badge type="modern" color="gray" size="sm">
                  {juzRange}
                </Badge>
                {chapter.pages && (
                  <Badge type="modern" color="gray" size="sm">
                    {chapter.pages[0] === chapter.pages[1] ? `Page ${chapter.pages[0]}` : `Pages ${chapter.pages[0]}–${chapter.pages[1]}`}
                  </Badge>
                )}
                {chapter.words && (
                  <Badge type="modern" color="gray" size="sm">
                    {chapter.words.toLocaleString("en-US")} words
                  </Badge>
                )}
                {sajdahs > 0 && (
                  <Badge type="pill-color" color="warning" size="sm" className="gap-1">
                    <span aria-hidden="true">۩</span> {sajdahs === 1 ? "Sajdah" : `${sajdahs} sajdahs`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <p
            lang="ar"
            dir="rtl"
            className="enter-sharpen shrink-0 self-start font-quran text-4xl leading-none text-brand-secondary sm:self-end sm:text-5xl md:text-6xl"
          >
            {chapter.nameArabic}
            <span className="sr-only"> — surah {toArabicNumber(chapter.id)}</span>
          </p>
        </div>

      </m.div>
    </div>
  );
}
