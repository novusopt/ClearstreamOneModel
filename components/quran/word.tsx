"use client";

import { motion } from "motion/react";
import { memo } from "react";
import { TajweedText } from "@/components/quran/tajweed-text";
import { player } from "@/lib/audio-engine";
import { TAJWEED_RULES } from "@/lib/constants";
import type { TajweedSegment, Word as WordType } from "@/lib/types";
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
  /** With `concealed`: keep the first letter visible as a memory cue. */
  hint?: boolean;
  onReveal?: (index: number) => void;
}

const RULE_BY_CLASS = new Map(TAJWEED_RULES.flatMap((r) => r.classes.map((c) => [c, r] as const)));

/** Tajweed rules present in a word (deduplicated, in order). */
export function rulesIn(segments: TajweedSegment[]) {
  const seen = new Map<string, (typeof TAJWEED_RULES)[number]>();
  for (const [, cls] of segments) {
    const rule = cls ? RULE_BY_CLASS.get(cls) : undefined;
    if (rule) seen.set(rule.id, rule);
  }
  return [...seen.values()];
}

export const Word = memo(function Word({ word, surah, ayah, index, tajweed, wordByWord, wbwTransliteration, active, sizeClass, concealed = false, hint = false, onReveal }: WordProps) {
  // Tajweed rules present in this word, named in the hover card (learn the colours in context).
  const rules = tajweed && typeof word.j !== "string" ? rulesIn(word.j) : [];
  // First letter plus its vowel marks, for the "first letter" memorisation cue.
  const cue = hint && concealed ? (word.a.match(/^[\u0621-\u064A\u0671-\u06D3][\u064B-\u065F\u0670\u06D6-\u06ED]*/u)?.[0] ?? "") : "";
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
          concealed && !cue && "opacity-40 blur-md select-none",
        )}
      >
        {cue ? (
          <>
            <span className="text-brand-secondary">{cue}</span>
            <span className="opacity-40 blur-md select-none">{word.a.slice(cue.length)}</span>
          </>
        ) : tajweed ? (
          <TajweedText value={word.j} />
        ) : (
          word.a
        )}
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
          {tajweed && rules.length > 0 && (
            <span className="mt-1.5 flex flex-wrap justify-center gap-1 border-t border-white/10 pt-1.5">
              {rules.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/85">
                  <span className={`tj-${r.classes[0]} size-1.5 rounded-full bg-current`} />
                  {r.name}
                </span>
              ))}
            </span>
          )}
        </span>
      )}
    </button>
  );
});
