import { ArrowLeft, ArrowRight, BookOpen01, ChevronRight } from "@untitledui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { StaticMushafPage } from "@/components/quran/static-mushaf-page";
import { JsonLd } from "@/components/seo/json-ld";
import { juzOf } from "@/lib/constants";
import { getChapters, getMushafPage, getSurah, type VerseRef } from "@/lib/quran";
import { breadcrumbLd, snippet } from "@/lib/seo";
import { ayahPath, surahPath } from "@/lib/site";

/** Landing page for each of the 604 pages of the Madani mushaf ("quran page 604"). */

const TOTAL_PAGES = 604;
type Params = Promise<{ n: string }>;

// Prebuild the most-read pages (the opening pages and Juzʾ ʿAmma, pages 582–604); the rest are
// generated on first request and then cached, which keeps deployments small.
export const dynamicParams = true;

export function generateStaticParams() {
  const popular = [1, 2, 3, ...Array.from({ length: 23 }, (_, i) => 582 + i)];
  return popular.map((n) => ({ n: String(n) }));
}

async function load(params: Params) {
  const { n: raw } = await params;
  const page = Number(raw);
  if (!/^\d+$/.test(raw) || page < 1 || page > TOTAL_PAGES) return null;
  const refs = await getMushafPage(page);
  return refs.length ? { page, refs } : null;
}

/** "Al-Baqarah 2:1–5", or several surahs joined with " · ". */
function describe(refs: VerseRef[]) {
  const chapters = getChapters();
  const spans: Array<{ s: number; from: number; to: number }> = [];
  for (const r of refs) {
    const last = spans[spans.length - 1];
    if (last && last.s === r.s) last.to = r.verse.n;
    else spans.push({ s: r.s, from: r.verse.n, to: r.verse.n });
  }
  return spans.map((x) => ({ ...x, name: chapters[x.s - 1].nameSimple, label: `${chapters[x.s - 1].nameSimple} ${x.s}:${x.from}${x.to > x.from ? `–${x.to}` : ""}` }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  const spans = describe(data.refs);
  const juz = juzOf(data.refs[0].s, data.refs[0].verse.n);
  const names = [...new Set(spans.map((x) => x.name))].join(", ");
  return {
    title: `Quran Page ${data.page} (${names}): Madani Mushaf`,
    description: snippet(`Page ${data.page} of 604 of the Madani mushaf, Juzʾ ${juz}: ${spans.map((x) => x.label).join(", ")}. Arabic text with tajweed and English translation.`),
    alternates: { canonical: `/page/${data.page}` },
    // Mushaf pages share the site card (604 per-page images would bloat every deployment).
    openGraph: { type: "article", url: `/page/${data.page}`, images: ["/opengraph-image"] },
  };
}

export default async function MushafPageRoute({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();
  const { page, refs } = data;
  const chapters = getChapters();
  const spans = describe(refs);
  const first = refs[0];
  const juz = juzOf(first.s, first.verse.n);
  const basmala = (await getSurah(1)).verses[0];

  return (
    <article className="relative overflow-hidden pt-28 pb-32 md:pt-32">
      <JsonLd
        data={breadcrumbLd([
          { name: "Mishkah", path: "/" },
          { name: `Juzʾ ${juz}`, path: `/juz/${juz}` },
          { name: `Page ${page}`, path: `/page/${page}` },
        ])}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/60" />
      <div className="mx-auto max-w-4xl px-3 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
          <Button href={`/juz/${juz}`} color="link-gray" size="sm">
            Juzʾ {juz}
          </Button>
          <ChevronRight aria-hidden="true" className="size-4 text-fg-quaternary" />
          <span aria-current="page" className="font-semibold text-brand-secondary tabular-nums">
            Page {page}
          </span>
        </nav>

        <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gold-700 dark:text-gold-300">Madani mushaf · page {page} of 604</p>
            <h1 className="mt-2 font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md">Quran page {page}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {spans.map((x) => (
                <Badge key={x.s} type="modern" size="sm">
                  {x.label}
                </Badge>
              ))}
              <Badge type="pill-color" size="sm" color="brand">
                Juzʾ {juz}
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="md" color="secondary" href={`/page/${page - 1}`} isDisabled={page <= 1} iconLeading={<ArrowLeft data-icon aria-hidden="true" className="size-5" />}>
              <span className="sr-only sm:not-sr-only">Previous</span>
            </Button>
            <Button size="md" color="secondary" href={`/page/${page + 1}`} isDisabled={page >= TOTAL_PAGES} iconTrailing={<ArrowRight data-icon aria-hidden="true" className="size-5" />}>
              <span className="sr-only sm:not-sr-only">Next</span>
            </Button>
          </div>
        </header>

        <div className="mt-8">
          <StaticMushafPage page={page} refs={refs} chapters={chapters} basmala={basmala} />
        </div>

        <div className="mt-6 flex justify-center">
          <Button size="lg" href={`${surahPath(first.s)}#v-${first.verse.n}`} iconLeading={<BookOpen01 data-icon aria-hidden="true" className="size-5" />}>
            Read and listen from here
          </Button>
        </div>

        <section aria-labelledby="translation" className="mt-14">
          <h2 id="translation" className="font-display text-xl font-medium text-primary">
            Translation of page {page}
          </h2>
          <p className="mt-1 text-sm text-tertiary">Saheeh International</p>
          <ol className="mt-4 divide-y divide-secondary rounded-2xl border border-secondary bg-primary">
            {refs.map((r) => (
              <li key={`${r.s}:${r.verse.n}`} className="flex gap-4 px-4 py-3.5 sm:px-5">
                <Link href={ayahPath(r.s, r.verse.n)} prefetch={false} className="w-14 shrink-0 pt-0.5 font-display text-sm font-medium text-secondary tabular-nums hover:text-brand-secondary">
                  {r.s}:{r.verse.n}
                </Link>
                <p className="text-md text-secondary">{r.verse.en}</p>
              </li>
            ))}
          </ol>
        </section>

        <nav aria-label="Neighbouring pages" className="mt-12 grid grid-cols-2 gap-3 border-t border-secondary pt-8">
          {page > 1 ? (
            <Link href={`/page/${page - 1}`} className="rounded-2xl border border-secondary bg-primary p-4 outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center gap-1.5 text-sm text-tertiary">
                <ArrowLeft aria-hidden="true" className="size-4" /> Previous page
              </span>
              <span className="mt-1 block font-semibold text-primary tabular-nums">Page {page - 1}</span>
            </Link>
          ) : (
            <span />
          )}
          {page < TOTAL_PAGES && (
            <Link href={`/page/${page + 1}`} className="rounded-2xl border border-secondary bg-primary p-4 text-right outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center justify-end gap-1.5 text-sm text-tertiary">
                Next page <ArrowRight aria-hidden="true" className="size-4" />
              </span>
              <span className="mt-1 block font-semibold text-primary tabular-nums">Page {page + 1}</span>
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
