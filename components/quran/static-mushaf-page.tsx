import Link from "next/link";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { quarterLabel } from "@/components/quran/hizb-mark";
import { PageNumber } from "@/components/quran/page-number";
import { TajweedText } from "@/components/quran/tajweed-text";
import { juzOf } from "@/lib/constants";
import { ayahPath, surahPath } from "@/lib/site";
import type { VerseRef } from "@/lib/quran";
import type { Chapter, Verse } from "@/lib/types";

/** Surah title band printed where a surah begins on the page. */
function SurahBand({ chapter }: { chapter: Chapter }) {
  return (
    <div className="my-4 flex items-center gap-3 rounded-2xl border border-gold-400/40 bg-gold-50/70 px-4 py-2.5 dark:bg-gold-500/10">
      <span aria-hidden="true" className="size-2 rotate-45 bg-gold-500" />
      <Link href={surahPath(chapter.id)} prefetch={false} className="min-w-0 truncate font-display text-md font-medium text-primary hover:text-brand-secondary">
        Surah {chapter.nameSimple}
      </Link>
      <span className="hidden shrink-0 text-sm text-tertiary sm:inline">{chapter.versesCount} ayat</span>
      <span lang="ar" dir="rtl" className="ml-auto shrink-0 font-quran text-2xl whitespace-nowrap text-brand-secondary">
        سورة {chapter.nameArabic}
      </span>
      <span aria-hidden="true" className="size-2 rotate-45 bg-gold-500" />
    </div>
  );
}

/**
 * A printed page of the Madani mushaf, server-rendered for the /page/N landing pages: surah bands
 * and the Basmala where surahs begin, justified run-on text with tajweed, ayah markers linking to
 * each ayah's page, and the arch page number. Same design language as the reader's mushaf view.
 */
export function StaticMushafPage({ page, refs, chapters, basmala }: { page: number; refs: VerseRef[]; chapters: Chapter[]; basmala: Verse }) {
  // Split the page into runs, one per surah, so a surah band can open each new surah.
  const runs: Array<{ s: number; verses: Verse[] }> = [];
  for (const r of refs) {
    const last = runs[runs.length - 1];
    if (last && last.s === r.s) last.verses.push(r.verse);
    else runs.push({ s: r.s, verses: [r.verse] });
  }
  const first = refs[0];
  return (
    <section aria-label={`Mushaf page ${page}`} className="rounded-3xl border border-secondary bg-primary_alt px-3 pt-3 pb-5 shadow-xs ring-1 ring-gold-400/15 ring-inset sm:px-8 sm:pt-4">
      <header className="flex items-center justify-between border-b border-gold-400/25 pb-2 text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">
        <Link href={`/juz/${juzOf(first.s, first.verse.n)}`} prefetch={false} className="hover:text-brand-secondary">
          Juzʾ {juzOf(first.s, first.verse.n)}
        </Link>
        {first.verse.q ? <span className="text-gold-600 normal-case dark:text-gold-400">{quarterLabel(first.verse.q)}</span> : <span />}
      </header>
      {runs.map((run) => {
        const chapter = chapters[run.s - 1];
        const opens = run.verses[0].n === 1;
        return (
          <div key={run.s}>
            {opens && <SurahBand chapter={chapter} />}
            {opens && run.s !== 1 && run.s !== 9 && (
              <p dir="rtl" lang="ar" className="mb-1 text-center font-quran text-3xl leading-[2] text-primary sm:text-4xl">
                {basmala.w.map((w, i) => (
                  <span key={i}>
                    <TajweedText value={w.j} />{" "}
                  </span>
                ))}
              </p>
            )}
            <p dir="rtl" lang="ar" className="mt-3 text-justify font-quran text-3xl leading-[1.9] text-primary [text-align-last:center] sm:text-4xl">
              {run.verses.map((v) => (
                <span key={v.n} id={`v-${run.s}-${v.n}`}>
                  {v.q && v.n !== 1 && (
                    <span aria-label={quarterLabel(v.q)} className="mx-1 text-gold-500">
                      ۞
                    </span>
                  )}
                  {v.w.map((w, i) => (
                    <span key={i}>
                      <TajweedText value={w.j} />{" "}
                    </span>
                  ))}
                  <Link href={ayahPath(run.s, v.n)} prefetch={false} aria-label={`Ayah ${run.s}:${v.n}`} className="inline-block rounded-full align-middle outline-focus-ring focus-visible:outline-2">
                    <AyahMarker n={v.n} />
                  </Link>{" "}
                </span>
              ))}
            </p>
          </div>
        );
      })}
      <PageNumber page={page} />
    </section>
  );
}
