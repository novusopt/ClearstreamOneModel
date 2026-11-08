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
  /** Memorisation mode: the word is hidden until tapped. */
  concealed?: boolean;
  onReveal?: (index: number) => void;
}

export const Word = memo(function Word({ word, surah, ayah, index, tajweed, wordByWord, wbwTransliteration, active, sizeClass, concealed = false, onReveal }: WordProps) {
  return (
    <button
      type="button"
      onClick={() => (concealed ? onReveal?.(index) : player.playWord(surah, ayah, index + 1))}
      aria-label={concealed ? `Hidden word ${index + 1}. Reveal` : `${word.t}: ${word.e}. Play pronunciation`}
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
      <span
        lang="ar"
        dir="rtl"
        aria-hidden={concealed || undefined}
        className={cx(
          "relative font-quran text-primary transition-[filter,opacity] duration-300",
          sizeClass,
          active && "text-brand-primary",
          concealed && "opacity-40 blur-md select-none",
        )}
      >
        {tajweed ? <TajweedText value={word.j} /> : word.a}
      </span>
      {concealed ? null : wordByWord ? (
        <span className="relative mt-1 flex max-w-36 flex-col items-center text-center leading-tight" dir="ltr">
          {wbwTransliteration && <span className="text-xs text-brand-tertiary italic">{word.t}</span>}
          <span className="text-xs text-tertiary">{word.e}</span>
        </span>
      ) : (
        <span
          role="presentation"
          dir="ltr"
          className={cx(
            "pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 flex w-max max-w-56 -translate-x-1/2 translate-y-1 flex-col items-center rounded-t-2xl rounded-b-lg border border-gold-400/50 bg-brand-950 px-3.5 pt-2.5 pb-2 text-center opacity-0 shadow-xl transition duration-150",
            // Short hover delay so cards don't flash while the pointer sweeps across a line.
            "group-hover/word:visible group-hover/word:translate-y-0 group-hover/word:opacity-100 group-hover/word:delay-200",
            "group-focus-visible/word:visible group-focus-visible/word:translate-y-0 group-focus-visible/word:opacity-100",
          )}
        >
          <span className="font-display text-sm text-gold-300 italic">{word.t}</span>
          <span className="text-xs font-medium text-white">{word.e}</span>
        </span>
      )}
    </button>
  );
});
