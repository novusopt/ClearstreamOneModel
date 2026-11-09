"use client";

import { m } from "motion/react";
import { Word } from "@/components/quran/word";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { HizbMark, quarterLabel } from "@/components/quran/hizb-mark";
import { usePlayer, useTick } from "@/lib/audio-engine";
import { juzOf } from "@/lib/constants";
import { ARABIC_SIZES, useSettings } from "@/lib/settings";
import type { Verse } from "@/lib/types";
import { toArabicNumber } from "@/lib/utils";
import { cx } from "@/utils/cx";

/** The mushaf sets the text one step smaller than verse cards, so a page holds a printed page's worth of lines. */
const mushafSize = (s: { arabicSize: number }) => ARABIC_SIZES[Math.max(0, s.arabicSize - 2)] ?? ARABIC_SIZES[1];

function ReadingVerse({ verse, index, surah }: { verse: Verse; index: number; surah: number }) {
  const isCurrent = usePlayer((s) => s.surah === surah && s.index === index && s.status !== "idle");
  const activeWord = useTick((s) => (isCurrent ? s.word : -1));
  const tajweed = useSettings((s) => s.tajweed);
  const size = useSettings(mushafSize);

  return (
    <span id={`v-${verse.n}`} data-ayah={verse.n} className={cx("group/ayah scroll-mt-40 rounded-lg transition-colors duration-500 [box-decoration-break:clone]", isCurrent && "bg-brand-primary/50")}>
      {verse.q && <HizbMark q={verse.q} className={size} />}
      {verse.w.map((w, i) => (
        <span key={i}>
          <Word
            word={w}
            surah={surah}
            ayah={verse.n}
            index={i}
            tajweed={tajweed}
            wordByWord={false}
            wbwTransliteration={false}
            active={activeWord === i}
            sizeClass={size}
            dense
          />{" "}
        </span>
      ))}
      <span className="inline-block align-middle font-quran">
        <AyahMarker n={verse.n} active={isCurrent} />
      </span>{" "}
    </span>
  );
}

/** Gold flourish beside the page number: a fading rule ending in a small diamond. */
function Flourish({ flip = false }: { flip?: boolean }) {
  return (
    <span aria-hidden="true" className={cx("flex flex-1 items-center gap-1.5", flip && "flex-row-reverse")}>
      <span className={cx("h-px flex-1 from-transparent to-gold-400/70", flip ? "bg-gradient-to-l" : "bg-gradient-to-r")} />
      <span className="size-1 rotate-45 bg-gold-400/80" />
      <span className="h-px w-6 bg-gold-400/70" />
      <span className="size-1.5 rotate-45 border border-gold-500 dark:border-gold-400" />
    </span>
  );
}

/**
 * Page number at the foot of a mushaf page: Mishkah's lamp-niche arch holding the number in
 * Arabic-Indic digits, with gold flourishes either side and the Latin number beneath.
 */
function PageNumber({ page }: { page: number }) {
  const digits = toArabicNumber(page);
  return (
    <footer className="mt-4 flex items-center gap-3 px-2 sm:px-8">
      <Flourish />
      <span className="flex flex-col items-center">
        <svg viewBox="0 0 48 56" aria-hidden="true" className="h-14 w-12 overflow-visible drop-shadow-[0_1px_0_var(--color-gold-200)] dark:drop-shadow-none">
          {/* Pointed arch: outer gold line, warm fill, dashed inner arch. */}
          <path d="M4 54 V24 C4 13 13 5 24 1 C35 5 44 13 44 24 V54 Z" className="fill-gold-50 stroke-gold-500 dark:fill-brand-950 dark:stroke-gold-400" strokeWidth="1.6" />
          <path d="M9 50 V25 C9 16 16 10 24 7 C32 10 39 16 39 25 V50 Z" className="fill-none stroke-gold-400/60" strokeWidth="0.8" strokeDasharray="1.6 2" />
          <circle cx="24" cy="4.2" r="1.6" className="fill-gold-500 dark:fill-gold-400" />
          <text
            x="24"
            y="33"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={digits.length >= 3 ? 17 : 20}
            className="fill-gold-700 font-quran dark:fill-gold-200"
          >
            {digits}
          </text>
        </svg>
        <span className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-quaternary uppercase tabular-nums">Page {page}</span>
      </span>
      <Flourish flip />
    </footer>
  );
}

/** One printed page: juz header, justified text that runs ayah into ayah, and the page number at the foot. */
function MushafPage({ page, verses, surah, startIndex, basmala, delay, className }: { page: number; verses: Verse[]; surah: number; startIndex: number; basmala?: React.ReactNode; delay: number; className?: string }) {
  const first = verses[0];
  const size = useSettings(mushafSize);
  return (
    <m.section
      aria-label={`Page ${page}`}
      dir="ltr"
      initial={{ y: 28 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cx("relative mx-auto flex w-full max-w-4xl flex-col rounded-3xl border border-secondary bg-primary_alt px-3 pt-3 pb-4 shadow-xs ring-1 ring-gold-400/15 ring-inset sm:px-8 sm:pt-4 sm:pb-5", className)}
    >
      <header className="flex items-center justify-between border-b border-gold-400/25 pb-2 text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">
        <span>Juzʾ {juzOf(surah, first.n)}</span>
        {first.q ? <span className="text-gold-600 normal-case dark:text-gold-400">{quarterLabel(first.q)}</span> : <span />}
      </header>
      {basmala}
      <div dir="rtl" lang="ar" className={cx("mt-3 flex-1 text-justify font-quran leading-[1.8] [text-align-last:center]", size)}>
        {verses.map((v, i) => (
          <ReadingVerse key={v.n} verse={v} index={startIndex + i} surah={surah} />
        ))}
      </div>
      <PageNumber page={page} />
    </m.section>
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
    // One sheet per page, stacked; overflow-x-clip keeps edge word cards from widening the page.
    <div className="space-y-5 [overflow-x:clip]">
      {groups.map((g, i) => (
        <MushafPage
          key={g.page || i}
          page={g.page}
          verses={g.verses}
          surah={surah}
          startIndex={g.start}
          basmala={i === 0 ? basmala : undefined}
          delay={i === 0 ? 0 : 0.05}
        />
      ))}
    </div>
  );
}
