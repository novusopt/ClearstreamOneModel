"use client";

import { motion } from "motion/react";
import { Word } from "@/components/quran/word";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { HizbMark, quarterLabel } from "@/components/quran/hizb-mark";
import { usePlayer, useTick } from "@/lib/audio-engine";
import { juzOf } from "@/lib/constants";
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
      {verse.q && <HizbMark q={verse.q} className={size} />}
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
      <span className={cx("inline-block font-quran pt-1 align-top", size)}>
        <AyahMarker n={verse.n} active={isCurrent} />
      </span>
    </span>
  );
}

/** One printed page: juz header, the text, and the page number in a star at the foot. */
function MushafPage({ page, verses, surah, startIndex, basmala, delay }: { page: number; verses: Verse[]; surah: number; startIndex: number; basmala?: React.ReactNode; delay: number }) {
  const first = verses[0];
  return (
    <motion.section
      aria-label={`Page ${page}`}
      initial={{ y: 28 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[2rem] border border-secondary bg-primary_alt px-5 pt-5 pb-6 shadow-xs sm:px-10 sm:pt-6 sm:pb-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-dashed border-gold-400/40" />
      <header className="relative mb-4 flex items-center justify-between text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">
        <span>Juzʾ {juzOf(surah, first.n)}</span>
        {first.q ? <span className="text-gold-600 normal-case dark:text-gold-400">{quarterLabel(first.q)}</span> : <span />}
      </header>
      {basmala}
      <div dir="rtl" lang="ar" className="relative flex flex-wrap items-center justify-center gap-y-4 text-center">
        {verses.map((v, i) => (
          <ReadingVerse key={v.n} verse={v} index={startIndex + i} surah={surah} />
        ))}
      </div>
      <footer className="relative mt-6 flex items-center justify-center gap-3">
        <span aria-hidden="true" className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400/60" />
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-tertiary tabular-nums">
          <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold-400" />
          Page {page}
          <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold-400" />
        </span>
        <span aria-hidden="true" className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400/60" />
      </footer>
    </motion.section>
  );
}

/** Mushaf reading view laid out on the Madani mushaf's 604 pages. */
export function ReadingView({ verses, surah, basmala }: { verses: Verse[]; surah: number; basmala?: React.ReactNode }) {
  // Group consecutive ayat by their printed page (falls back to one sheet if pages are unknown).
  const groups: Array<{ page: number; start: number; verses: Verse[] }> = [];
  verses.forEach((v, i) => {
    const page = v.p ?? 0;
    const last = groups[groups.length - 1];
    if (last && last.page === page) last.verses.push(v);
    else groups.push({ page, start: i, verses: [v] });
  });
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {groups.map((g, i) => (
        <MushafPage key={g.page || i} page={g.page} verses={g.verses} surah={surah} startIndex={g.start} basmala={i === 0 ? basmala : undefined} delay={i === 0 ? 0 : 0.05} />
      ))}
    </div>
  );
}
