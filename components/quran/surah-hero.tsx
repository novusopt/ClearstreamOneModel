"use client";

import { ChevronRight } from "@untitledui/icons";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { JUZ_STARTS } from "@/lib/constants";
import type { Chapter } from "@/lib/types";
import { toArabicNumber } from "@/lib/utils";

/** Juzʾ that a surah starts in. */
function juzOf(surah: number): number {
  let juz = 1;
  JUZ_STARTS.forEach(([s, a], i) => {
    if (s < surah || (s === surah && a === 1)) juz = i + 1;
  });
  return juz;
}

export function SurahHero({ chapter }: { chapter: Chapter }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.2]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <div ref={ref} className="relative overflow-hidden pt-28 pb-8 md:pt-32 md:pb-10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/60" />
      <motion.div style={{ opacity, y }} className="mx-auto max-w-5xl px-4 sm:px-6">
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
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md"
              >
                {chapter.nameSimple}
              </motion.h1>
              <p className="mt-1 text-md text-tertiary">{chapter.nameTranslation}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge type="pill-color" color={chapter.revelation === "meccan" ? "warning" : "brand"} size="sm">
                  {chapter.revelation === "meccan" ? "Meccan" : "Medinan"}
                </Badge>
                <Badge type="modern" color="gray" size="sm">
                  {chapter.versesCount} ayat
                </Badge>
                <Badge type="modern" color="gray" size="sm">
                  Juzʾ {juzOf(chapter.id)}
                </Badge>
              </div>
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.1 }}
            lang="ar"
            dir="rtl"
            className="font-quran text-6xl leading-none text-brand-secondary md:text-7xl"
          >
            {chapter.nameArabic}
            <span className="sr-only"> — surah {toArabicNumber(chapter.id)}</span>
          </motion.p>
        </div>

      </motion.div>
    </div>
  );
}
