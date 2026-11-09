"use client";

import { m, useScroll } from "motion/react";
import { useRef } from "react";
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
const mushafSize = (s: { arabicSize: number }) =>
  ARABIC_SIZES[Math.max(0, s.arabicSize - 2)] ?? ARABIC_SIZES[1];

function ReadingVerse({
  verse,
  index,
  surah,
}: {
  verse: Verse;
  index: number;
  surah: number;
}) {
  const isCurrent = usePlayer(
    (s) => s.surah === surah && s.index === index && s.status !== "idle",
  );
  const activeWord = useTick((s) => (isCurrent ? s.word : -1));
  const tajweed = useSettings((s) => s.tajweed);
  const size = useSettings(mushafSize);
  // Only the ayah on the reading line re-renders when the reader scrolls.
  const onLine = useReaderPosition(
    (s) => s.surah === surah && s.ayah === verse.n,
  );

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
  return (
    <span className="tabular-nums normal-case">
      {ayah ? `${surah}:${ayah}` : ""}
    </span>
  );
}

/** One printed page: juz header, justified text that runs ayah into ayah, and the page number at the foot. */
function MushafPage({
  page,
  verses,
  surah,
  startIndex,
  basmala,
  className,
}: {
  page: number;
  verses: Verse[];
  surah: number;
  startIndex: number;
  basmala?: React.ReactNode;
  className?: string;
}) {
  const first = verses[0];
  const size = useSettings(mushafSize);
  const ref = useRef<HTMLElement>(null);
  // Page-by-page walk: the gold line under the header fills as this page moves through the reading line.
  const { scrollYProgress: walk } = useScroll({
    target: ref,
    offset: ["start 0.6", "end 0.6"],
  });

  return (
    <div>
      <section
        ref={ref}
        aria-label={`Page ${page}`}
        dir="ltr"
        className={cx(
          "relative mx-auto flex w-full max-w-4xl flex-col rounded-3xl border border-secondary bg-primary_alt px-3 pt-3 pb-4 shadow-xs ring-1 ring-gold-400/15 ring-inset sm:px-8 sm:pt-4 sm:pb-5",
          className,
        )}
      >
        {/* Clipped decoration layer, so the page itself never clips a word's meaning card. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
        >
          {/* Spine: a soft fold shadow along the bound (right) edge, as on a printed page. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-black/[0.06] to-transparent dark:from-black/30"
          />
        </span>

        <header className="relative flex items-center justify-between border-b border-gold-400/25 pb-2 text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">
          <span>Juzʾ {juzOf(surah, first.n)}</span>
          <ReadingLineLabel surah={surah} />
          {first.q ? (
            <span className="text-gold-600 normal-case dark:text-gold-400">
              {quarterLabel(first.q)}
            </span>
          ) : (
            <span />
          )}
          <m.span
            aria-hidden="true"
            style={{ scaleX: walk }}
            className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-gold-500"
          />
        </header>
        {basmala}
        <div
          dir="rtl"
          lang="ar"
          className={cx(
            "mt-3 flex-1 text-justify font-quran leading-[1.8] [text-align-last:center]",
            size,
          )}
        >
          {verses.map((v, i) => (
            <ReadingVerse
              key={v.n}
              verse={v}
              index={startIndex + i}
              surah={surah}
            />
          ))}
        </div>
        <PageNumber
          page={page}
          href={IS_ARTIFACT ? undefined : `/page/${page}`}
        />
      </section>
    </div>
  );
}

/** Mushaf reading view laid out on the Madani mushaf's 604 pages. */
export function ReadingView({
  verses,
  surah,
  basmala,
}: {
  verses: Verse[];
  surah: number;
  basmala?: React.ReactNode;
}) {
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
        />
      ))}
    </div>
  );
}
