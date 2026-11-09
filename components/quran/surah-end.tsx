"use client";

import { ArrowLeft, ArrowRight, Grid01 } from "@untitledui/icons";
import { m } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";

/** A calm close to the surah: how much was read, and where to go next. */
export function SurahEnd({ chapter, prev, next }: { chapter: Chapter; prev: Chapter | null; next: Chapter | null }) {
  const read = useLibrary((s) => s.read[chapter.id]?.length ?? 0);
  const complete = read >= chapter.versesCount;

  return (
    <m.section
      initial={{ y: 24 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      aria-label={`End of ${chapter.nameSimple}`}
      className="relative mt-12 overflow-hidden rounded-3xl border border-secondary bg-primary px-6 py-10 text-center shadow-xs sm:px-10"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-24 mx-auto size-72 rounded-full bg-gold-300/25 blur-3xl dark:bg-gold-500/10" />
      <p aria-hidden="true" className="relative text-3xl text-gold-500">
        ۞
      </p>
      <p className="relative mt-2 text-sm font-semibold text-brand-secondary">{complete ? "Surah complete" : "End of surah"}</p>
      <h2 className="relative mt-1 font-display text-display-xs font-medium text-primary">
        {chapter.nameSimple}{" "}
        <span lang="ar" className="font-quran text-3xl text-secondary">
          {chapter.nameArabic}
        </span>
      </h2>
      <div className="relative mx-auto mt-5 max-w-sm text-left">
        <ProgressBar value={Math.min(read, chapter.versesCount)} max={chapter.versesCount} labelPosition="bottom" valueFormatter={(v) => `${v} of ${chapter.versesCount} ayat read`} />
      </div>

      <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {next && (
          <Button size="lg" href={`/surah/${next.id}`} iconTrailing={ArrowRight}>
            Continue to {next.nameSimple}
          </Button>
        )}
        <Button size="lg" color="secondary" href="/#surahs" iconLeading={Grid01}>
          All surahs
        </Button>
      </div>
      {prev && (
        <Button color="link-gray" size="sm" href={`/surah/${prev.id}`} iconLeading={ArrowLeft} className="relative mt-5">
          Previous: {prev.id}. {prev.nameSimple}
        </Button>
      )}
    </m.section>
  );
}
