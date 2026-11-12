"use client";

import { ArrowLeft, CheckCircle, Eye, GraduationHat01, RefreshCw01 } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { Kbd } from "@/components/site/command-palette";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { VerseNumber } from "@/components/quran/verse-number";
import { Word } from "@/components/quran/word";
import { dataUrl } from "@/lib/data-urls";
import { dueReviews, type Grade, gradeReview, libraryStore, nextReviewDate, schedule, today, useLibrary } from "@/lib/library";
import { ARABIC_SIZES, useSettings } from "@/lib/settings";
import type { Chapter, SurahData } from "@/lib/types";
import { useRemote } from "@/lib/use-remote";
import { cx } from "@/utils/cx";

const noop = () => () => {};

const GRADES: Array<{ id: Grade; label: string; key: string; color: "secondary-destructive" | "secondary" | "primary" }> = [
  { id: "again", label: "Again", key: "1", color: "secondary-destructive" },
  { id: "hard", label: "Hard", key: "2", color: "secondary" },
  { id: "good", label: "Good", key: "3", color: "primary" },
  { id: "easy", label: "Easy", key: "4", color: "secondary" },
];

function inDays(n: number) {
  return n <= 1 ? "Tomorrow" : n < 30 ? `In ${n} days` : n < 365 ? `In ${Math.round(n / 30)} mo` : `In ${Math.round(n / 365)} yr`;
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" });
}

function ReviewCard({ refKey, chapters, onGraded }: { refKey: string; chapters: Chapter[]; onGraded: () => void }) {
  const [s, a] = refKey.split(":").map(Number);
  const chapter = chapters[s - 1];
  const surahData = useRemote<SurahData>(dataUrl.surah(s));
  const verse = surahData?.verses[a - 1];
  const tajweed = useSettings((x) => x.tajweed);
  const size = useSettings((x) => ARABIC_SIZES[x.arabicSize - 1] ?? ARABIC_SIZES[2]);
  const review = useLibrary((x) => x.reviews[refKey]);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set([0]));
  const shown = verse ? revealed.size >= verse.w.length : false;

  const grade = (g: Grade) => {
    gradeReview(refKey, g);
    onGraded();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, [role=dialog]") || !verse) return;
      if (!shown && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(new Set(verse.w.map((_, i) => i)));
      }
      const g = GRADES.find((x) => x.key === e.key);
      if (shown && g) grade(g.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <m.article
      key={refKey}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-secondary bg-primary p-5 shadow-xs sm:p-8"
      aria-label={`Review ${chapter.nameSimple} ${refKey}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <VerseNumber surah={s} ayah={a} />
          <span className="text-sm font-medium text-tertiary">{chapter.nameSimple}</span>
        </div>
        <span className="text-xs text-quaternary">
          {review && review.n > 0 ? `Reviewed ${review.n}× · every ${review.i} day${review.i === 1 ? "" : "s"}` : "First review"}
        </span>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-tertiary">{shown ? "Check your recitation" : "Recite from memory. Tap a word to peek."}</p>

      <div dir="rtl" lang="ar" className="mt-4 flex min-h-24 flex-wrap items-start justify-center gap-x-1 gap-y-3">
        {verse ? (
          <>
            {verse.w.map((w, i) => (
              <Word
                key={i}
                word={w}
                surah={s}
                ayah={a}
                index={i}
                tajweed={tajweed}
                wordByWord={false}
                wbwTransliteration={false}
                active={false}
                sizeClass={size}
                concealed={!revealed.has(i)}
                onReveal={(n) => setRevealed((prev) => new Set(prev).add(n))}
              />
            ))}
            <span className={cx("font-quran pt-1", size)}>
              <AyahMarker n={a} />
            </span>
          </>
        ) : (
          <span className="mt-6 h-8 w-2/3 animate-pulse rounded-lg bg-quaternary" aria-label="Loading ayah" />
        )}
      </div>

      <AnimatePresence initial={false}>
        {shown && verse && (
          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <p className="mx-auto mt-5 max-w-2xl text-center text-md text-secondary">{verse.en}</p>
          </m.div>
        )}
      </AnimatePresence>

      <div className="mt-6 border-t border-secondary pt-5">
        {!shown ? (
          <div className="flex justify-center">
            <Button size="lg" iconLeading={Eye} isDisabled={!verse} onPress={() => verse && setRevealed(new Set(verse.w.map((_, i) => i)))}>
              <span className="flex items-center gap-2">
                Show ayah <Kbd>Space</Kbd>
              </span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g) => (
              <Button key={g.id} color={g.color} size="lg" onPress={() => grade(g.id)} className="flex-col gap-0 py-2.5">
                <span className="flex items-center gap-2">
                  {g.label} <Kbd>{g.key}</Kbd>
                </span>
                <span className="text-xs font-normal opacity-80">{inDays(schedule(review, g.id).i)}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </m.article>
  );
}

/** Spaced-repetition review of memorised ayat due today. */
export function ReviewSession({ chapters }: { chapters: Chapter[] }) {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  // Freeze today's queue when the session starts (grading changes due dates as we go).
  const [queue, setQueue] = useState<string[] | null>(null);
  const [done, setDone] = useState(0);
  const memorisedCount = useLibrary((s) => s.memorised.length);
  const next = useLibrary((s) => nextReviewDate(s));

  useEffect(() => {
    if (mounted && queue === null) setQueue(dueReviews(libraryStore.get())); // eslint-disable-line react-hooks/set-state-in-effect
  }, [mounted, queue]);

  const current = queue?.[done];
  const total = queue?.length ?? 0;
  const pct = useMemo(() => (total ? Math.round((done / total) * 100) : 0), [done, total]);

  if (!mounted || queue === null) {
    return <div className="mt-10 h-72 animate-pulse rounded-3xl bg-secondary" aria-label="Loading review" />;
  }

  if (!current) {
    const reviewedToday = done > 0;
    return (
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-3xl border border-secondary bg-primary px-6 py-14">
        <EmptyState size="md">
          <EmptyState.Header pattern="circle">
            <EmptyState.FeaturedIcon icon={memorisedCount ? CheckCircle : GraduationHat01} color={memorisedCount ? "success" : "brand"} theme="light" />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title>{memorisedCount === 0 ? "Nothing to review yet" : reviewedToday ? "Review complete" : "All caught up"}</EmptyState.Title>
            <EmptyState.Description>
              {memorisedCount === 0
                ? "Mark ayat as memorised in Memorise mode and they will come back here at growing intervals, so they stay firm."
                : `${reviewedToday ? `You reviewed ${done} ayah${done === 1 ? "" : "s"}. ` : ""}${next && next > today() ? `Next review: ${formatDate(next)}.` : ""}`}
            </EmptyState.Description>
          </EmptyState.Content>
          <EmptyState.Footer>
            <Button color="secondary" href="/library" iconLeading={ArrowLeft}>
              Library
            </Button>
            <Button href="/surah/1" iconLeading={GraduationHat01}>
              Memorise more
            </Button>
          </EmptyState.Footer>
        </EmptyState>
      </m.div>
    );
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="flex items-center gap-4">
        <ProgressBar value={done} max={total} className="flex-1" />
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-tertiary tabular-nums">
          <RefreshCw01 aria-hidden="true" className="size-4" />
          {done + 1} of {total}
        </span>
        <span className="sr-only">{pct}% done</span>
      </div>
      <AnimatePresence mode="wait">
        <ReviewCard key={current} refKey={current} chapters={chapters} onGraded={() => setDone((n) => n + 1)} />
      </AnimatePresence>
    </div>
  );
}
