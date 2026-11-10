import { ArrowLeft, ArrowRight, BookOpen01, ChevronRight } from "@untitledui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { quarterLabel } from "@/components/quran/hizb-mark";
import { JsonLd } from "@/components/seo/json-ld";
import { getChapters, getJuz } from "@/lib/quran";
import { breadcrumbLd, snippet } from "@/lib/seo";
import { ayahPath, surahPath } from "@/lib/site";
import { toArabicNumber } from "@/lib/utils";

/** Landing page for each of the 30 juzʾ: surahs, ḥizb quarters, pages and where to start reading. */

type Params = Promise<{ n: string }>;

/** Names in common use for the last three parts (the rest are known by their opening words, shown on the page). */
/** First words of an ayah, without the ۞ quarter sign the Uthmani text prefixes to the first word. */
const firstWords = (w: Array<{ a: string }>, n: number) =>
  w
    .map((x) => x.a.replace(/۞\s*/g, ""))
    .filter(Boolean)
    .slice(0, n)
    .join(" ");

const JUZ_NAMES: Record<number, string> = { 28: "Juzʾ Qad Samiʿa", 29: "Juzʾ Tabārak", 30: "Juzʾ ʿAmma" };

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 30 }, (_, i) => ({ n: String(i + 1) }));
}

async function load(params: Params) {
  const { n: raw } = await params;
  const juz = Number(raw);
  if (!/^\d+$/.test(raw) || juz < 1 || juz > 30) return null;
  const refs = await getJuz(juz);
  const chapters = getChapters();
  const surahs: Array<{ s: number; from: number; to: number; whole: boolean }> = [];
  for (const r of refs) {
    const last = surahs[surahs.length - 1];
    if (last && last.s === r.s) last.to = r.verse.n;
    else surahs.push({ s: r.s, from: r.verse.n, to: r.verse.n, whole: false });
  }
  for (const x of surahs) x.whole = x.from === 1 && x.to === chapters[x.s - 1].versesCount;
  const pages = [...new Set(refs.map((r) => r.verse.p).filter((p): p is number => p != null))];
  const quarters = refs.filter((r) => r.verse.q != null);
  return { juz, refs, surahs, pages, quarters, chapters };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  const name = JUZ_NAMES[d.juz];
  const first = d.refs[0];
  const last = d.refs[d.refs.length - 1];
  const surahNames = d.surahs.map((x) => d.chapters[x.s - 1].nameSimple);
  return {
    title: `Juz ${d.juz}${name ? ` (${name})` : ""}: Read Online with Translation & Audio`,
    description: snippet(
      `Juzʾ ${d.juz} of the Qurʾān runs from ${d.chapters[first.s - 1].nameSimple} ${first.s}:${first.verse.n} to ${d.chapters[last.s - 1].nameSimple} ${last.s}:${last.verse.n} (pages ${d.pages[0]}–${d.pages[d.pages.length - 1]}): ${surahNames.join(", ")}.`,
    ),
    alternates: { canonical: `/juz/${d.juz}` },
    openGraph: { type: "article", url: `/juz/${d.juz}` },
  };
}

export default async function JuzPage({ params }: { params: Params }) {
  const d = await load(params);
  if (!d) notFound();
  const { juz, refs, surahs, pages, quarters, chapters } = d;
  const first = refs[0];
  const opening = firstWords(first.verse.w, 4);

  return (
    <article className="relative overflow-hidden pt-24 pb-32 md:pt-28">
      <JsonLd
        data={breadcrumbLd([
          { name: "Mishkah", path: "/" },
          { name: `Juzʾ ${juz}`, path: `/juz/${juz}` },
        ])}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/60" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          <Button href="/#juz" color="link-gray" size="sm">
            Juzʾ
          </Button>
          <ChevronRight aria-hidden="true" className="size-4 text-fg-quaternary" />
          <span aria-current="page" className="font-semibold text-brand-secondary tabular-nums">
            {juz}
          </span>
        </nav>

        {/* Same anatomy as the surah header: number medallion, title, subtitle and badges, Arabic name beside. */}
        <header className="mt-4 border-b border-secondary pb-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <span aria-hidden="true" className="relative flex size-10 shrink-0 items-center justify-center sm:size-12">
                <span className="absolute inset-[6px] rotate-45 rounded-lg bg-brand-solid shadow-md sm:inset-[7px]" />
                <span className="relative font-display text-md font-medium text-white tabular-nums sm:text-lg">{juz}</span>
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary sm:text-display-sm">Juzʾ {juz}</h1>
                <p className="mt-0.5 text-md text-tertiary">{JUZ_NAMES[juz] ? `${JUZ_NAMES[juz]} · Part ${juz} of 30` : `Part ${juz} of 30`}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge type="modern" size="sm">
                    {refs.length} ayat
                  </Badge>
                  <Badge type="modern" size="sm">
                    {surahs.length === 1 ? "1 surah" : `${surahs.length} surahs`}
                  </Badge>
                  <Badge type="modern" size="sm">
                    Pages {pages[0]}–{pages[pages.length - 1]}
                  </Badge>
                  <Badge type="pill-color" size="sm" color="warning">
                    Ḥizb {juz * 2 - 1}–{juz * 2}
                  </Badge>
                </div>
              </div>
            </div>
            <p lang="ar" dir="rtl" className="shrink-0 self-start font-quran text-4xl leading-none text-brand-secondary sm:self-end sm:text-5xl md:text-6xl">
              الجزء {toArabicNumber(juz)}
            </p>
          </div>
          <p className="mt-4 flex flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
            <span className="text-xs font-semibold tracking-[0.08em] text-quaternary uppercase">Begins with</span>
            <span lang="ar" dir="rtl" className="font-quran text-xl text-primary sm:text-2xl">
              {opening} …
            </span>
          </p>
        </header>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="lg" href={`${surahPath(first.s)}#v-${first.verse.n}`} iconLeading={<BookOpen01 data-icon aria-hidden="true" className="size-5" />}>
            Read Juzʾ {juz}
          </Button>
          <Button size="lg" color="secondary" href={`/page/${pages[0]}`}>
            Open page {pages[0]}
          </Button>
        </div>

        <section aria-labelledby="surahs" className="mt-14">
          <h2 id="surahs" className="font-display text-xl font-medium text-primary">
            Surahs in this juzʾ
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {surahs.map((x) => {
              const c = chapters[x.s - 1];
              return (
                <li key={x.s}>
                  <Link
                    href={x.from === 1 ? surahPath(x.s) : `${surahPath(x.s)}#v-${x.from}`}
                    className="flex items-center gap-4 rounded-2xl border border-secondary bg-primary px-4 py-3 outline-focus-ring transition hover:border-brand hover:bg-secondary/40 focus-visible:outline-2"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-display text-sm font-medium text-secondary tabular-nums ring-1 ring-secondary">
                      {x.s}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-primary">{c.nameSimple}</span>
                      <span className="block text-sm text-tertiary tabular-nums">
                        {x.whole ? `Whole surah · ${c.versesCount} ayat` : `Ayat ${x.from}–${x.to} of ${c.versesCount}`}
                      </span>
                    </span>
                    <span lang="ar" dir="rtl" className="font-quran text-2xl text-secondary">
                      {c.nameArabic}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {quarters.length > 0 && (
          <section aria-labelledby="quarters" className="mt-14">
            <h2 id="quarters" className="font-display text-xl font-medium text-primary">
              Ḥizb quarters
            </h2>
            <ol className="mt-4 divide-y divide-secondary rounded-2xl border border-secondary bg-primary">
              {quarters.map((r) => (
                <li key={`${r.s}:${r.verse.n}`}>
                  <Link
                    href={ayahPath(r.s, r.verse.n)}
                    prefetch={false}
                    className="flex items-center gap-4 px-4 py-3 outline-focus-ring transition hover:bg-secondary/40 focus-visible:outline-2 sm:px-5"
                  >
                    <span aria-hidden="true" className="text-xl text-gold-500">
                      ۞
                    </span>
                    <span className="w-40 shrink-0">
                      <span className="block text-sm font-semibold text-primary">{quarterLabel(r.verse.q!)}</span>
                      <span className="block text-xs text-tertiary tabular-nums">
                        {chapters[r.s - 1].nameSimple} {r.s}:{r.verse.n}
                      </span>
                    </span>
                    <span lang="ar" dir="rtl" className="min-w-0 flex-1 truncate font-quran text-2xl text-primary">
                      {firstWords(r.verse.w, 6)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="pages" className="mt-14">
          <h2 id="pages" className="font-display text-xl font-medium text-primary">
            Pages of the mushaf
          </h2>
          <ol className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {pages.map((p) => (
              <li key={p}>
                <Link
                  href={`/page/${p}`}
                  prefetch={false}
                  aria-label={`Page ${p}`}
                  className="flex h-full flex-col items-center rounded-t-[1.25rem] rounded-b-lg border border-secondary bg-primary px-2 pt-3 pb-2 outline-focus-ring transition hover:-translate-y-0.5 hover:border-brand focus-visible:outline-2"
                >
                  <span lang="ar" className="font-quran text-lg text-gold-700 dark:text-gold-300">
                    {toArabicNumber(p)}
                  </span>
                  <span className="text-xs font-semibold text-tertiary tabular-nums">{p}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <nav aria-label="Neighbouring parts" className="mt-14 grid grid-cols-2 gap-3 border-t border-secondary pt-8">
          {juz > 1 ? (
            <Link href={`/juz/${juz - 1}`} className="rounded-2xl border border-secondary bg-primary p-4 outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center gap-1.5 text-sm text-tertiary">
                <ArrowLeft aria-hidden="true" className="size-4" /> Previous
              </span>
              <span className="mt-1 block font-semibold text-primary">Juzʾ {juz - 1}</span>
            </Link>
          ) : (
            <span />
          )}
          {juz < 30 && (
            <Link href={`/juz/${juz + 1}`} className="rounded-2xl border border-secondary bg-primary p-4 text-right outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center justify-end gap-1.5 text-sm text-tertiary">
                Next <ArrowRight aria-hidden="true" className="size-4" />
              </span>
              <span className="mt-1 block font-semibold text-primary">Juzʾ {juz + 1}</span>
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
