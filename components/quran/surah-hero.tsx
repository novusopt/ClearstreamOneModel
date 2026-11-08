"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Badge } from "@/components/base/badges/badges";
import { BISMILLAH } from "@/lib/constants";
import type { Chapter } from "@/lib/types";
import { toArabicNumber } from "@/lib/utils";

export function SurahHero({ chapter }: { chapter: Chapter }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const showBismillah = chapter.id !== 1 && chapter.id !== 9;

  return (
    <div ref={ref} className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        style={{ rotate }}
        className="pointer-events-none absolute top-10 left-1/2 -z-0 size-[34rem] -translate-x-1/2 text-brand-500/10"
      >
        <g fill="none" stroke="currentColor" strokeWidth="0.6">
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x="40" y="40" width="120" height="120" transform={`rotate(${i * 15} 100 100)`} />
          ))}
          <circle cx="100" cy="100" r="52" />
          <circle cx="100" cy="100" r="88" />
        </g>
      </motion.svg>
      <motion.div style={{ y, opacity, scale }} className="relative mx-auto max-w-3xl px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-center gap-2"
        >
          <Badge type="pill-color" color="brand" size="md">
            Surah {chapter.id}
          </Badge>
          <Badge type="pill-color" color={chapter.revelation === "meccan" ? "warning" : "blue"} size="md">
            {chapter.revelation === "meccan" ? "Meccan" : "Medinan"}
          </Badge>
          <Badge type="pill-color" color="gray" size="md">
            {chapter.versesCount} ayat
          </Badge>
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, filter: "blur(12px)", y: 20 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          lang="ar"
          dir="rtl"
          className="font-quran text-7xl text-primary md:text-8xl"
        >
          <span className="bg-gradient-to-b from-brand-500 to-brand-800 bg-clip-text text-transparent dark:from-brand-200 dark:to-brand-500">
            {chapter.nameArabic}
          </span>
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <p className="mt-2 text-display-xs font-semibold tracking-tight text-primary md:text-display-sm">{chapter.nameSimple}</p>
          <p className="mt-1 text-md text-tertiary">
            {chapter.nameTranslation} · <span className="font-quran">سورة {toArabicNumber(chapter.id)}</span>
          </p>
        </motion.div>
        {showBismillah && (
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.3em" }}
            animate={{ opacity: 1, letterSpacing: "0em" }}
            transition={{ delay: 0.45, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            lang="ar"
            dir="rtl"
            className="mt-10 font-quran text-4xl text-secondary md:text-5xl"
          >
            {BISMILLAH}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
