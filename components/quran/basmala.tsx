"use client";

import { InfoCircle } from "@untitledui/icons";
import { motion } from "motion/react";
import { useTranslationText } from "@/components/quran/use-translation";
import { Word } from "@/components/quran/word";
import { TRANSLATIONS } from "@/lib/constants";
import { ARABIC_SIZES, useSettings } from "@/lib/settings";
import type { Verse } from "@/lib/types";
import { cx } from "@/utils/cx";

const SM_UP = ["sm:text-3xl", "sm:text-4xl", "sm:text-5xl", "sm:text-6xl", "sm:text-7xl", "sm:text-7xl"];

/** Small eight-point star used as the Basmala's centre ornament. */
function Star({ className }: { className?: string }) {
  const sq = { x: 9.5, y: 9.5, width: 29, height: 29, rx: 2.5 };
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cx("size-4 overflow-visible", className)}>
      <g className="stroke-gold-500" strokeWidth="3" fill="none">
        <rect {...sq} />
        <rect {...sq} transform="rotate(45 24 24)" />
      </g>
      <g className="fill-gold-100 dark:fill-brand-950">
        <rect {...sq} />
        <rect {...sq} transform="rotate(45 24 24)" />
      </g>
    </svg>
  );
}

/** Thin gold rule that fades towards the edge, with the star at its inner end. */
function Rule({ side }: { side: "start" | "end" }) {
  return (
    <span aria-hidden="true" className={cx("flex flex-1 items-center gap-2", side === "end" && "flex-row-reverse")}>
      <span className={cx("h-px flex-1", side === "start" ? "bg-gradient-to-r" : "bg-gradient-to-l", "from-transparent to-gold-400/70")} />
      <span className="size-1 rotate-45 bg-gold-400" />
    </span>
  );
}

interface BasmalaProps {
  /** Ayah 1:1, whose words form the Basmala (so tajweed, meanings and word audio work). */
  basmala: Verse;
  surah: number;
  variant?: "panel" | "page";
}

/**
 * The Basmala that opens each surah. Not shown for Al-Fātiḥah (where it is ayah 1) and replaced
 * by a short note for At-Tawbah, which is the one surah revealed without it.
 */
export function Basmala({ basmala, surah, variant = "panel" }: BasmalaProps) {
  const tajweed = useSettings((s) => s.tajweed);
  const wordByWord = useSettings((s) => s.wordByWord);
  const wbwTransliteration = useSettings((s) => s.wbwTransliteration);
  const showTranslation = useSettings((s) => s.showTranslation);
  const lang = useSettings((s) => s.translation);
  // Reading size on phones (keeps it on one line); one step larger from `sm`, so it opens the
  // surah without shouting. Literal class names so Tailwind generates them.
  const size = useSettings((s) => cx(ARABIC_SIZES[s.arabicSize - 1] ?? ARABIC_SIZES[2], SM_UP[s.arabicSize - 1] ?? SM_UP[2]));
  const { texts } = useTranslationText(1, lang);
  const meaning = lang === "en" ? basmala.en : texts?.[0];
  const rtl = TRANSLATIONS.find((t) => t.id === lang)?.rtl ?? false;

  if (surah === 1) return null;

  if (surah === 9) {
    return (
      <p className="mx-auto mb-6 flex max-w-xl items-start justify-center gap-2 text-center text-sm text-tertiary">
        <InfoCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
        At-Tawbah is the only surah that does not begin with the Basmala.
      </p>
    );
  }

  const words = (
    <div dir="rtl" lang="ar" className="flex flex-wrap items-start justify-center gap-x-1">
      {basmala.w.map((w, i) => (
        <Word
          key={i}
          word={w}
          surah={1}
          ayah={1}
          index={i}
          tajweed={tajweed}
          wordByWord={variant === "panel" && wordByWord}
          wbwTransliteration={wbwTransliteration}
          active={false}
          sizeClass={size}
        />
      ))}
    </div>
  );

  if (variant === "page") {
    return (
      <div aria-label="Basmala" role="group" className="relative mb-6 flex items-center gap-4 sm:gap-6">
        <Rule side="start" />
        {words}
        <Rule side="end" />
      </div>
    );
  }

  return (
    <motion.section
      aria-label="Basmala"
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-6 rounded-3xl border border-secondary bg-primary px-5 pt-7 pb-6 text-center shadow-xs sm:px-10"
    >
      {/* Lantern glow and a quiet arch line behind the text. */}
      {/* Glow is clipped by its own wrapper so word hover cards can still rise above the frame. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute inset-x-0 -top-24 mx-auto h-48 w-2/3 rounded-full bg-gold-300/20 blur-3xl dark:bg-gold-500/10" />
      </div>
      <svg aria-hidden="true" viewBox="0 0 400 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-6 top-3 h-10 w-[calc(100%-3rem)] text-gold-400/40">
        <path d="M0 60 V40 Q0 20 40 20 H160 Q200 20 200 0 Q200 20 240 20 H360 Q400 20 400 40 V60" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="relative">{words}</div>

      <div className="relative mx-auto mt-3 flex max-w-md items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-400/60" />
        <Star />
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-400/60" />
      </div>

      {showTranslation && meaning && (
        <p dir={rtl ? "rtl" : "ltr"} className="relative mx-auto mt-3 max-w-xl text-sm text-tertiary italic">
          {meaning}
        </p>
      )}
    </motion.section>
  );
}
