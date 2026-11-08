"use client";

import { motion } from "motion/react";
import { memo } from "react";
import { TajweedText } from "@/components/quran/tajweed-text";
import { player } from "@/lib/audio-engine";
import type { Word as WordType } from "@/lib/types";
import { cx } from "@/utils/cx";

interface WordProps {
  word: WordType;
  surah: number;
  ayah: number;
  /** 0-based position within the ayah. */
  index: number;
  tajweed: boolean;
  wordByWord: boolean;
  wbwTransliteration: boolean;
  active: boolean;
  sizeClass: string;
}

export const Word = memo(function Word({ word, surah, ayah, index, tajweed, wordByWord, wbwTransliteration, active, sizeClass }: WordProps) {
  return (
    <button
      type="button"
      onClick={() => player.playWord(surah, ayah, index + 1)}
      aria-label={`${word.t}: ${word.e}. Play pronunciation`}
      className={cx(
        "group/word relative inline-flex cursor-pointer flex-col items-center rounded-xl px-1.5 pt-1 pb-1.5 outline-focus-ring transition-colors duration-200",
        "hover:bg-brand-primary/70 focus-visible:outline-2 focus-visible:outline-offset-2",
        active && "text-brand-secondary",
      )}
    >
      {active && (
        <motion.span
          layoutId={`word-highlight-${surah}-${ayah}`}
          className="absolute inset-0 -z-0 rounded-xl bg-brand-primary ring-1 ring-brand"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <span lang="ar" dir="rtl" className={cx("relative font-quran text-primary", sizeClass, active && "text-brand-primary")}>
        {tajweed ? <TajweedText value={word.j} /> : word.a}
      </span>
      {wordByWord ? (
        <span className="relative mt-1 flex max-w-36 flex-col items-center text-center leading-tight" dir="ltr">
          {wbwTransliteration && <span className="text-xs text-brand-tertiary italic">{word.t}</span>}
          <span className="text-xs text-tertiary">{word.e}</span>
        </span>
      ) : (
        <span
          role="presentation"
          dir="ltr"
          className={cx(
            "pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-max max-w-56 -translate-x-1/2 flex-col items-center rounded-lg bg-primary-solid px-3 py-2 text-center shadow-lg",
            "group-hover/word:flex group-focus-visible/word:flex",
          )}
        >
          <span className="text-xs font-medium text-gold-300 italic">{word.t}</span>
          <span className="text-xs font-semibold text-white">{word.e}</span>
        </span>
      )}
    </button>
  );
});
