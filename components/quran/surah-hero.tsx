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
    <div ref={ref} className="relative overflow-hidden pt-28 pb-8 md:pt-32 md:pb-10">
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

        <div className="mt-6 flex flex-col gap-6 border-b border-secondary pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="relative flex size-16 shrink-0 items-center justify-center">
              <span className="absolute inset-[9px] rotate-45 rounded-xl bg-brand-solid shadow-md" />
              <span className="relative font-display text-xl font-medium text-white tabular-nums">{chapter.id}</span>
            </span>
            <div>
              <h1
                className="enter-visible font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md"
              >
                {chapter.nameSimple}
              </h1>
              <p className="mt-1 text-md text-tertiary">{chapter.nameTranslation}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
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
            className="enter-sharpen font-quran text-6xl leading-none text-brand-secondary md:text-7xl"
          >
            {chapter.nameArabic}
            <span className="sr-only"> — surah {toArabicNumber(chapter.id)}</span>
          </p>
        </div>

      </m.div>
    </div>
  );
}
