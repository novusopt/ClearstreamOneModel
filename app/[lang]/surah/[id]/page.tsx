import { ArrowLeft, ArrowRight, BookOpen01, ChevronRight } from "@untitledui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { LanguageLinks } from "@/components/quran/language-links";
import { HtmlLang } from "@/components/seo/html-lang";
import { JsonLd } from "@/components/seo/json-ld";
import { juzOf } from "@/lib/constants";
import { isLocale, languageAlternates, ogLocale, localePath, LOCALES, meaningIn, t, translator } from "@/lib/i18n";
import { getChapter, getSurah, getTranslation, isValidSurahId } from "@/lib/quran";
import { breadcrumbLd, surahLd } from "@/lib/seo";
import { ayahPath, surahPath } from "@/lib/site";

/**
 * Localized surah pages (/fr/surah/18 …): the whole surah server-rendered with the Arabic and that
 * language's translation, for search and for readers who arrive from it. The interactive reader
 * (/surah/18?t=fr) opens with the same translation selected.
 */

export const dynamicParams = true;

export function generateStaticParams() {
  // Prebuild the most-read surahs in every language; the rest render on first request.
  return LOCALES.flatMap((lang) => [1, 18, 36, 67].map((id) => ({ lang, id: String(id) })));
}

type Params = Promise<{ lang: string; id: string }>;

async function load(params: Params) {
  const { lang, id: raw } = await params;
  const id = Number(raw);
  if (!isLocale(lang) || !isValidSurahId(id)) return null;
  const chapter = getChapter(id)!;
  const [{ verses }, translation] = await Promise.all([getSurah(id), getTranslation(lang, id)]);
  return { lang, id, chapter, verses, translation };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  const s = t(d.lang);
  const meaning = meaningIn(d.chapter, d.lang);
  const path = surahPath(d.id);
  return {
    title: s.surahTitle(d.chapter, meaning),
    description: s.surahDescription(d.chapter, meaning),
    alternates: { canonical: localePath(d.lang, path), languages: languageAlternates(path) },
    openGraph: { type: "article", url: localePath(d.lang, path), locale: ogLocale(d.lang), images: [`${path}/opengraph-image`] },
  };
}

export default async function LocalizedSurahPage({ params }: { params: Params }) {
  const d = await load(params);
  if (!d) notFound();
  const { lang, id, chapter, verses, translation } = d;
  const s = t(lang);
  const meaning = meaningIn(chapter, lang);
  const prev = getChapter(id - 1);
  const next = getChapter(id + 1);
  const basmala = id !== 1 && id !== 9 ? (await getSurah(1)).verses[0].w.map((w) => w.a).join(" ") : null;
  const rtl = s.dir === "rtl";
  const firstJuz = juzOf(id, 1);
  const lastJuz = juzOf(id, chapter.versesCount);

  return (
    <article lang={s.code} dir={s.dir} className="relative overflow-hidden pt-24 pb-32 md:pt-28">
      <HtmlLang lang={s.code} />
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Mishkah", path: "/" },
            { name: s.surahHeading(chapter), path: localePath(lang, surahPath(id)) },
          ]),
          surahLd(chapter),
        ]}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/60" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          <Button href="/#surahs" color="link-gray" size="sm">
            {s.surahs}
          </Button>
          <ChevronRight aria-hidden="true" className="size-4 text-fg-quaternary rtl:rotate-180" />
          <span aria-current="page" className="font-semibold text-brand-secondary">
            {chapter.nameSimple}
          </span>
        </nav>

        {/* Same anatomy as the English surah header (components/quran/surah-hero.tsx). */}
        <header className="mt-4 flex items-end justify-between gap-4 border-b border-secondary pb-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span aria-hidden="true" className="relative flex size-10 shrink-0 items-center justify-center sm:size-12">
              <span className="absolute inset-[6px] rotate-45 rounded-lg bg-brand-solid shadow-md sm:inset-[7px]" />
              <span className="relative font-display text-md font-medium text-white tabular-nums sm:text-lg">{id}</span>
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-display-xs font-medium tracking-tight text-primary sm:text-display-sm">{s.surahHeading(chapter)}</h1>
              <p className="mt-0.5 text-md text-tertiary">{meaning}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge type="pill-color" size="sm" color={chapter.revelation === "meccan" ? "warning" : "brand"}>
                  {chapter.revelation === "meccan" ? s.meccan : s.medinan}
                </Badge>
                <Badge type="modern" size="sm">
                  {s.ayat(chapter.versesCount)}
                </Badge>
                <Badge type="modern" size="sm">
                  {s.juz} {firstJuz === lastJuz ? firstJuz : `${firstJuz}–${lastJuz}`}
                </Badge>
                {chapter.pages && (
                  <Badge type="modern" size="sm">
                    {s.page} {chapter.pages[0]}
                    {chapter.pages[1] !== chapter.pages[0] ? `–${chapter.pages[1]}` : ""}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <p lang="ar" dir="rtl" className="shrink-0 self-start font-quran text-4xl leading-none text-brand-secondary sm:self-end sm:text-5xl md:text-6xl">
            {chapter.nameArabic}
          </p>
        </header>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <Button size="lg" href={`${surahPath(id)}?t=${lang}`} iconLeading={<BookOpen01 data-icon aria-hidden="true" className="size-5" />}>
            {s.openReader}
          </Button>
          <p className="text-sm text-tertiary">
            {s.translation}: {translator(lang)}
          </p>
        </div>

        {basmala && (
          <p dir="rtl" lang="ar" className="mt-10 text-center font-quran text-4xl leading-[2] text-primary">
            {basmala}
          </p>
        )}

        <ol className="mt-8 divide-y divide-secondary rounded-3xl border border-secondary bg-primary shadow-xs">
          {verses.map((v, i) => (
            <li key={v.n} id={`v-${v.n}`} className="scroll-mt-28 px-4 py-5 [contain-intrinsic-size:auto_14rem] [content-visibility:auto] sm:px-8 sm:py-6">
              <Link href={localePath(lang, ayahPath(id, v.n))} prefetch={false} dir="ltr" className="font-display text-sm font-semibold text-tertiary tabular-nums hover:text-brand-secondary">
                {id}:{v.n}
              </Link>
              <p dir="rtl" lang="ar" className="mt-3 font-quran text-3xl leading-[2.2] text-primary sm:text-4xl">
                {v.w.map((w) => w.a).join(" ")}
                <span className="font-quran">
                  <AyahMarker n={v.n} />
                </span>
              </p>
              <p dir={rtl ? "rtl" : "ltr"} className="mt-4 text-lg text-secondary">
                {translation[i]}
              </p>
            </li>
          ))}
        </ol>

        <nav aria-label={`${s.previousSurah} / ${s.nextSurah}`} className="mt-12 grid grid-cols-2 gap-3 border-t border-secondary pt-8">
          {prev ? (
            <Link href={localePath(lang, surahPath(prev.id))} className="rounded-2xl border border-secondary bg-primary p-4 outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center gap-1.5 text-sm text-tertiary">
                <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" /> {s.previousSurah}
              </span>
              <span className="mt-1 block font-semibold text-primary">
                {prev.id}. {prev.nameSimple}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={localePath(lang, surahPath(next.id))} className="rounded-2xl border border-secondary bg-primary p-4 text-end outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center justify-end gap-1.5 text-sm text-tertiary">
                {s.nextSurah} <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
              </span>
              <span className="mt-1 block font-semibold text-primary">
                {next.id}. {next.nameSimple}
              </span>
            </Link>
          )}
        </nav>
        <LanguageLinks current={lang} path={surahPath(id)} className="mt-10 justify-center" />
      </div>
    </article>
  );
}
