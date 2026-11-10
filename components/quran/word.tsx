"use client";

import { m } from "motion/react";
import { memo, useState } from "react";
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
  /** Mushaf view: tight padding so words sit in continuous, justified lines. */
  dense?: boolean;
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

export const Word = memo(function Word({ word, surah, ayah, index, tajweed, wordByWord, wbwTransliteration, active, sizeClass, concealed = false, hint = false, onReveal, dense = false }: WordProps) {
  // The meaning card is only created once the word is hovered or focused: a long surah would
  // otherwise ship (and hydrate) thousands of hidden cards.
  const [card, setCard] = useState(false);
  const showCard = !concealed && !wordByWord;
  // Tajweed rules present in this word, named in the hover card (learn the colours in context).
  const rules = card && tajweed && typeof word.j !== "string" ? rulesIn(word.j) : [];
  // First letter plus its vowel marks, for the "first letter" memorisation cue.
  const cue = hint && concealed ? (word.a.match(/^[\u0621-\u064A\u0671-\u06D3][\u064B-\u065F\u0670\u06D6-\u06ED]*/u)?.[0] ?? "") : "";
  const wake = showCard && !card ? () => setCard(true) : undefined;
  // Position of this word's recording (see Word.k); 0 means there is none to play.
  const audioPos = word.k ?? index + 1;
  return (
    <button
      type="button"
      onClick={() => (concealed ? onReveal?.(index) : audioPos > 0 && player.playWord(surah, ayah, audioPos))}
      onPointerEnter={wake}
      onFocus={wake}
      aria-label={concealed ? `Hidden word ${index + 1}. Reveal` : `${word.t}: ${word.e}${audioPos > 0 ? ". Play pronunciation" : ""}`}
      className={cx("qw", dense ? "qw-dense" : "qw-pad", active && "qw-on")}
    >
      {active && (
        <m.span
          layoutId={`word-highlight-${surah}-${ayah}`}
          className="absolute inset-0 -z-0 rounded-xl bg-brand-primary ring-1 ring-brand"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <span
        lang="ar"
        dir="rtl"
        aria-hidden={concealed || undefined}
        className={cx("qw-text", sizeClass, active && "text-brand-primary", concealed && !cue && "qw-hide")}
      >
        {cue ? (
          <>
            <span className="text-brand-secondary">{cue}</span>
            <span className="qw-hide">{word.a.slice(cue.length)}</span>
          </>
        ) : tajweed ? (
          <TajweedText value={word.j} />
        ) : (
          word.a
        )}
      </span>
      {concealed ? null : wordByWord ? (
        <span className="qw-gloss" dir="ltr">
          {wbwTransliteration && <span className="text-xs text-brand-tertiary italic">{word.t}</span>}
          <span className="text-xs text-tertiary">{word.e}</span>
        </span>
      ) : card ? (
        <span role="presentation" dir="ltr" className="qw-card">
          <span className="font-display text-sm text-gold-300 italic">{word.t}</span>
          <span className="text-xs font-medium text-white">{word.e}</span>
          {rules.length > 0 && (
            <span className="mt-1.5 flex flex-wrap justify-center gap-1 border-t border-white/10 pt-1.5">
              {rules.map((r) => (
                <span key={r.id} className="qw-chip">
                  <span className={`tj-${r.classes[0]} size-1.5 rounded-full bg-current`} />
                  {r.name}
                </span>
              ))}
            </span>
          )}
        </span>
      ) : null}
    </button>
  );
});
