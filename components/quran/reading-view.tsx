"use client";

import { motion } from "motion/react";
import { Word } from "@/components/quran/word";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { usePlayer, useTick } from "@/lib/audio-engine";
import { ARABIC_SIZES, useSettings } from "@/lib/settings";
import type { Verse } from "@/lib/types";
import { cx } from "@/utils/cx";

function ReadingVerse({ verse, index, surah }: { verse: Verse; index: number; surah: number }) {
  const isCurrent = usePlayer((s) => s.surah === surah && s.index === index && s.status !== "idle");
  const activeWord = useTick((s) => (isCurrent ? s.word : -1));
  const tajweed = useSettings((s) => s.tajweed);
  const size = useSettings((s) => ARABIC_SIZES[s.arabicSize - 1] ?? ARABIC_SIZES[2]);

  return (
    <span id={`v-${verse.n}`} data-ayah={verse.n} className={cx("group/ayah scroll-mt-40 rounded-2xl transition-colors duration-500", isCurrent && "bg-brand-primary/50")}>
      {verse.w.map((w, i) => (
        <Word
          key={i}
          word={w}
          surah={surah}
          ayah={verse.n}
          index={i}
          tajweed={tajweed}
          wordByWord={false}
          wbwTransliteration={false}
          active={activeWord === i}
          sizeClass={size}
        />
      ))}
      <AyahMarker n={verse.n} active={isCurrent} className={cx(size, "align-top mt-[calc(0.25rem+0.56em)]")} />
    </span>
  );
}

/** Mushaf-style continuous reading view. */
export function ReadingView({ verses, surah }: { verses: Verse[]; surah: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-secondary bg-primary_alt p-5 shadow-xs sm:p-10"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-dashed border-gold-400/40" />
      <div dir="rtl" lang="ar" className="relative flex flex-wrap items-center justify-center gap-y-4 text-center">
        {verses.map((v, i) => (
          <ReadingVerse key={v.n} verse={v} index={i} surah={surah} />
        ))}
      </div>
    </motion.div>
  );
}
