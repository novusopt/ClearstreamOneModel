import { ArrowLeft, ArrowRight, BookOpen02, ChevronRight, Copy07 } from "@untitledui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { AyahActions } from "@/components/quran/ayah-actions";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { quarterLabel } from "@/components/quran/hizb-mark";
import { TajweedText } from "@/components/quran/tajweed-text";
import { JsonLd } from "@/components/seo/json-ld";
import { ayahName } from "@/lib/ayah-names";
import { isSajdah, juzOf, TAFSIR_SOURCE } from "@/lib/constants";
import { getChapter, getSimilar, getSurah, getTafsir, isValidSurahId } from "@/lib/quran";
import { ayahLd, breadcrumbLd, snippet } from "@/lib/seo";
import { ayahPath, surahPath } from "@/lib/site";

/**
 * One page per ayah (6,236): the Arabic with tajweed, transliteration, translation, word-by-word
 * meanings, the Al-Mukhtaṣar tafsir and look-alike ayat. Fully server-rendered for search; the
 * most-visited ayat are prebuilt and the rest are generated on first request and then cached.
 */

const PREBUILT: Array<[number, number[]]> = [
  [1, [1, 2, 3, 4, 5, 6, 7]],
  [2, [1, 2, 3, 4, 5, 152, 153, 186, 201, 255, 256, 285, 286]],
  [3, [8, 26, 190, 191]],
  [18, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
  [24, [35]],
  [36, [1, 2, 3, 4, 5, 82, 83]],
  [55, [13]],
  [59, [22, 23, 24]],
  [65, [2, 3]],
  [67, [1, 2]],
  [94, [5, 6]],
  [112, [1, 2, 3, 4]],
  [113, [1, 2, 3, 4, 5]],
  [114, [1, 2, 3, 4, 5, 6]],
];

export const dynamicParams = true;

export function generateStaticParams() {
  return PREBUILT.flatMap(([s, ayat]) => ayat.map((a) => ({ id: String(s), ayah: String(a) })));
}

type Params = Promise<{ id: string; ayah: string }>;

async function load(params: Params) {
  const { id: rawId, ayah: rawAyah } = await params;
  const id = Number(rawId);
  const ayah = Number(rawAyah);
  if (!isValidSurahId(id) || !/^\d+$/.test(rawAyah)) return null;
  const chapter = getChapter(id)!;
  if (ayah < 1 || ayah > chapter.versesCount) return null;
  const { verses } = await getSurah(id);
  return { chapter, verse: verses[ayah - 1], ayah, id };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  const { chapter, verse, ayah, id } = data;
  const named = ayahName(id, ayah);
  const ref = `${chapter.nameSimple} ${id}:${ayah}`;
  const title = named ? `${named.name} (${ref}): Arabic, Translation & Tafsir` : `Surah ${ref}: Arabic, Translation & Tafsir`;
  const description = snippet(`“${verse.en}” Quran ${id}:${ayah} in Arabic with translation, word-by-word meaning and tafsir.`);
  return {
    title,
    description,
    alternates: { canonical: ayahPath(id, ayah) },
    openGraph: { type: "article", url: ayahPath(id, ayah), title: named ? `${named.name} · ${ref}` : `Quran ${id}:${ayah} · ${chapter.nameSimple}`, description },
  };
}

function SectionTitle({ icon: Icon, children }: { icon: typeof BookOpen02; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-xl font-medium text-primary">
      <Icon aria-hidden="true" className="size-5 text-fg-brand-secondary" />
      {children}
    </h2>
  );
}

export default async function AyahPage({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();
  const { chapter, verse, ayah, id } = data;
  const [tafsir, similarAll] = await Promise.all([getTafsir("en", id).catch(() => [] as string[]), getSimilar(id).catch(() => ({}) as Awaited<ReturnType<typeof getSimilar>>)]);
  const explanation = tafsir[ayah - 1];
  const similar = similarAll[String(ayah)] ?? [];
  const named = ayahName(id, ayah);
  const arabic = verse.w.map((w) => w.a).join(" ");
  const ref = `${id}:${ayah}`;
  const prevCh = ayah === 1 ? getChapter(id - 1) : chapter;
  const prev = ayah > 1 ? { s: id, a: ayah - 1, ch: chapter } : prevCh ? { s: prevCh.id, a: prevCh.versesCount, ch: prevCh } : null;
  const nextCh = ayah === chapter.versesCount ? getChapter(id + 1) : chapter;
  const next = ayah < chapter.versesCount ? { s: id, a: ayah + 1, ch: chapter } : nextCh ? { s: nextCh.id, a: 1, ch: nextCh } : null;
  const audio = { n: verse.n, g: verse.g, t: verse.w.map((w) => (w.s != null && w.f != null ? ([w.s, w.f] as [number, number]) : null)) };

  return (
    <article className="relative overflow-hidden pt-28 pb-32 md:pt-32">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Mishkah", path: "/" },
            { name: `Surah ${chapter.nameSimple}`, path: surahPath(id) },
            { name: `Ayah ${ref}`, path: ayahPath(id, ayah) },
          ]),
          ayahLd(chapter, ayah, arabic, verse.en, named?.name),
        ]}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/60" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
          <Button href="/#surahs" color="link-gray" size="sm">
            Surahs
          </Button>
          <ChevronRight aria-hidden="true" className="size-4 text-fg-quaternary" />
          <Button href={surahPath(id)} color="link-gray" size="sm">
            {chapter.nameSimple}
          </Button>
          <ChevronRight aria-hidden="true" className="size-4 text-fg-quaternary" />
          <span aria-current="page" className="font-semibold text-brand-secondary tabular-nums">
            {ref}
          </span>
        </nav>

        <header className="mt-6">
          <p className="text-sm font-semibold text-gold-700 dark:text-gold-300">
            Surah {chapter.nameSimple} · Ayah {ayah} of {chapter.versesCount}
          </p>
          <h1 className="mt-2 font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md">
            {named ? (
              <>
                {named.name} <span className="text-tertiary">· {ref}</span>
              </>
            ) : (
              <>
                {chapter.nameSimple} {ref}
              </>
            )}
          </h1>
          {named?.also && <p className="mt-2 text-md text-tertiary">Also known as {named.also.join(", ")}</p>}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge type="pill-color" size="sm" color={chapter.revelation === "meccan" ? "warning" : "brand"}>
              {chapter.revelation === "meccan" ? "Meccan" : "Medinan"}
            </Badge>
            <Link href={`/juz/${juzOf(id, ayah)}`} prefetch={false} className="rounded-md outline-focus-ring focus-visible:outline-2">
              <Badge type="modern" size="sm">
                Juzʾ {juzOf(id, ayah)}
              </Badge>
            </Link>
            {verse.p && (
              <Link href={`/page/${verse.p}`} prefetch={false} className="rounded-md outline-focus-ring focus-visible:outline-2">
                <Badge type="modern" size="sm">
                  Page {verse.p}
                </Badge>
              </Link>
            )}
            {verse.q && (
              <Badge type="pill-color" size="sm" color="warning">
                ۞ {quarterLabel(verse.q)}
              </Badge>
            )}
            {isSajdah(id, ayah) && (
              <Badge type="pill-color" size="sm" color="warning">
                ۩ Sajdah
              </Badge>
            )}
          </div>
        </header>

        <section aria-label="Arabic text and translation" className="mt-8 rounded-3xl border border-secondary bg-primary p-6 shadow-xs sm:p-10">
          <p dir="rtl" lang="ar" className="text-center font-quran text-4xl leading-[2.3] text-primary sm:text-5xl">
            {verse.w.map((w, i) => (
              <span key={i}>
                <TajweedText value={w.j} />{" "}
              </span>
            ))}
            <span className="font-quran">
              <AyahMarker n={ayah} />
            </span>
          </p>
          <p className="mt-6 text-center font-display text-md text-brand-tertiary italic">{verse.tr}</p>
          <blockquote className="mt-4 border-l-2 border-gold-400 pl-4 text-lg text-secondary">
            {verse.en}
            <footer className="mt-1 text-sm text-quaternary">Saheeh International</footer>
          </blockquote>
          <div className="mt-8 border-t border-secondary pt-6">
            <AyahActions surah={id} surahName={chapter.nameSimple} audio={audio} title={`${chapter.nameSimple} ${ref}`} contextHref={`${surahPath(id)}#v-${ayah}`} />
          </div>
        </section>

        <section aria-labelledby="wbw" className="mt-12">
          <h2 id="wbw" className="font-display text-xl font-medium text-primary">
            Word by word
          </h2>
          <ol dir="rtl" lang="ar" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {verse.w.map((w, i) => (
              <li key={i} className="flex flex-col items-center rounded-2xl border border-secondary bg-primary px-3 py-4 text-center">
                <span className="font-quran text-3xl leading-[1.9] text-primary">
                  <TajweedText value={w.j} />
                </span>
                <span dir="ltr" className="font-display text-sm text-gold-700 italic dark:text-gold-300">
                  {w.t}
                </span>
                <span dir="ltr" className="mt-0.5 text-sm text-secondary">
                  {w.e}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {explanation && (
          <section aria-labelledby="tafsir" className="mt-12">
            <SectionTitle icon={BookOpen02}>
              <span id="tafsir">Explanation (tafsir)</span>
            </SectionTitle>
            <p className="mt-1 text-sm text-tertiary">
              {TAFSIR_SOURCE.name} · {TAFSIR_SOURCE.author}
            </p>
            <p className="mt-4 rounded-2xl border border-secondary bg-secondary/60 p-5 text-md leading-relaxed text-secondary">{explanation}</p>
            <p className="mt-2 text-sm text-tertiary">Also available in Arabic, French, Spanish, Indonesian, Turkish, Russian, Bengali and Chinese in the reader.</p>
          </section>
        )}

        {similar.length > 0 && (
          <section aria-labelledby="similar" className="mt-12">
            <SectionTitle icon={Copy07}>
              <span id="similar">Ayat with similar wording</span>
            </SectionTitle>
            <ul className="mt-4 space-y-2">
              {similar.map((x) => (
                <li key={`${x.s}:${x.a}`}>
                  <Link
                    href={ayahPath(x.s, x.a)}
                    className="flex items-center gap-4 rounded-2xl border border-secondary bg-primary px-4 py-3 outline-focus-ring transition hover:border-brand hover:bg-secondary/40 focus-visible:outline-2"
                  >
                    <span className="shrink-0 text-sm font-semibold text-secondary tabular-nums">
                      {x.n} {x.s}:{x.a}
                    </span>
                    <span dir="rtl" lang="ar" className="min-w-0 flex-1 truncate font-quran text-2xl text-primary">
                      {x.t}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav aria-label="Neighbouring ayat" className="mt-14 grid gap-3 border-t border-secondary pt-8 sm:grid-cols-2">
          {prev ? (
            <Link href={ayahPath(prev.s, prev.a)} className="group rounded-2xl border border-secondary bg-primary p-4 outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center gap-1.5 text-sm text-tertiary">
                <ArrowLeft aria-hidden="true" className="size-4" /> Previous ayah
              </span>
              <span className="mt-1 block font-semibold text-primary">
                {prev.ch.nameSimple} {prev.s}:{prev.a}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={ayahPath(next.s, next.a)} className="group rounded-2xl border border-secondary bg-primary p-4 text-right outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center justify-end gap-1.5 text-sm text-tertiary">
                Next ayah <ArrowRight aria-hidden="true" className="size-4" />
              </span>
              <span className="mt-1 block font-semibold text-primary">
                {next.ch.nameSimple} {next.s}:{next.a}
              </span>
            </Link>
          )}
        </nav>
        <div className="mt-6 flex justify-center">
          <Button color="link-color" href={surahPath(id)} iconTrailing={<ArrowRight data-icon aria-hidden="true" className="size-5" />}>
            Read all of Surah {chapter.nameSimple}
          </Button>
        </div>
      </div>
    </article>
  );
}
