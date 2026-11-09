"use client";

import { m } from "motion/react";
import { Word } from "@/components/quran/word";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { HizbMark, quarterLabel } from "@/components/quran/hizb-mark";
import { usePlayer, useTick } from "@/lib/audio-engine";
import { useReaderPosition } from "@/lib/reader-position";
import { juzOf } from "@/lib/constants";
import { ARABIC_SIZES, useSettings } from "@/lib/settings";
import type { Verse } from "@/lib/types";
import { PageNumber } from "@/components/quran/page-number";
import { IS_ARTIFACT } from "@/lib/runtime";
import { cx } from "@/utils/cx";

/** The mushaf sets the text one step smaller than verse cards, so a page holds a printed page's worth of lines. */
const mushafSize = (s: { arabicSize: number }) => ARABIC_SIZES[Math.max(0, s.arabicSize - 2)] ?? ARABIC_SIZES[1];

function ReadingVerse({ verse, index, surah }: { verse: Verse; index: number; surah: number }) {
  const isCurrent = usePlayer((s) => s.surah === surah && s.index === index && s.status !== "idle");
  const activeWord = useTick((s) => (isCurrent ? s.word : -1));
  const tajweed = useSettings((s) => s.tajweed);
  const size = useSettings(mushafSize);
  // Only the ayah on the reading line re-renders when the reader scrolls.
  const onLine = useReaderPosition((s) => s.surah === surah && s.ayah === verse.n);

  return (
    <span
      id={`v-${verse.n}`}
      data-ayah={verse.n}
      className={cx(
        "group/ayah scroll-mt-40 rounded-lg transition-colors duration-500 [box-decoration-break:clone]",
        onLine && !isCurrent && "bg-gold-400/12",
        isCurrent && "bg-brand-primary/50",
      )}
    >
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

/** "Surah:ayah" of the ayah on the reading line, so the header always says where the reader is. */
function ReadingLineLabel({ surah }: { surah: number }) {
  const ayah = useReaderPosition((s) => (s.surah === surah ? s.ayah : 0));
  return <span className="tabular-nums normal-case">{ayah ? `${surah}:${ayah}` : ""}</span>;
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
      {/* Sticky so the reader always sees the juzʾ and where they are while a long page scrolls. */}
      <header className="sticky top-16 z-10 -mx-3 flex items-center justify-between border-b border-gold-400/25 bg-primary_alt/90 px-3 pt-3 pb-2 text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase backdrop-blur-md sm:-mx-8 sm:px-8">
        <span>Juzʾ {juzOf(surah, first.n)}</span>
        <ReadingLineLabel surah={surah} />
        {first.q ? <span className="text-gold-600 normal-case dark:text-gold-400">{quarterLabel(first.q)}</span> : <span />}
      </header>
      {basmala}
      <div dir="rtl" lang="ar" className={cx("mt-3 flex-1 text-justify font-quran leading-[1.8] [text-align-last:center]", size)}>
        {verses.map((v, i) => (
          <ReadingVerse key={v.n} verse={v} index={startIndex + i} surah={surah} />
        ))}
      </div>
      <PageNumber page={page} href={IS_ARTIFACT ? undefined : `/page/${page}`} />
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
