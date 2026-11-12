import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SurahHero } from "@/components/quran/surah-hero";
import { SurahReader } from "@/components/quran/surah-reader";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { JsonLd } from "@/components/seo/json-ld";
import { getChapter, getChapters, getSurah, isValidSurahId } from "@/lib/quran";
import { INITIAL_AYAT } from "@/lib/constants";
import { breadcrumbLd, surahLd } from "@/lib/seo";
import { languageAlternates } from "@/lib/i18n";
import { surahPath } from "@/lib/site";
import { LanguageLinks } from "@/components/quran/language-links";

export const dynamicParams = false;

export function generateStaticParams() {
  return getChapters().map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: PageProps<"/surah/[id]">): Promise<Metadata> {
  const { id } = await params;
  const chapter = getChapter(Number(id));
  if (!chapter) return {};
  const title = `Surah ${chapter.nameSimple} (${chapter.nameTranslation}): Arabic, Translation & Audio`;
  const description = `Read Surah ${chapter.nameSimple} (${chapter.nameArabic}, “${chapter.nameTranslation}”): ${chapter.versesCount} ayat in Arabic with English translation, word-by-word meanings, colour-coded tajweed, tafsir and recitation.`;
  return {
    title,
    description,
    alternates: { canonical: surahPath(chapter.id), languages: languageAlternates(surahPath(chapter.id)) },
    openGraph: { type: "article", url: surahPath(chapter.id), title: `Surah ${chapter.nameSimple} (${chapter.nameTranslation})`, description },
  };
}

export default async function SurahPage({ params }: PageProps<"/surah/[id]">) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!isValidSurahId(id)) notFound();
  const chapter = getChapter(id)!;
  const [{ verses }, fatihah] = await Promise.all([getSurah(id), getSurah(1)]);
  // Long surahs: full data for the first cards only, the rest as plain text (see SurahReader).
  const head = verses.slice(0, INITIAL_AYAT);
  const rest = verses.slice(INITIAL_AYAT).map((v) => ({ n: v.n, a: v.w.map((w) => w.a).join(" "), en: v.en, p: v.p }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Mishkah", path: "/" },
            { name: `Surah ${chapter.nameSimple}`, path: surahPath(chapter.id) },
          ]),
          surahLd(chapter),
        ]}
      />
      <ScrollProgress />
      <SurahHero chapter={chapter} />
      <SurahReader
        chapter={chapter}
        verses={head}
        rest={rest}
        prev={getChapter(id - 1) ?? null}
        next={getChapter(id + 1) ?? null}
        basmala={fatihah.verses[0]}
        footer={<LanguageLinks current="en" path={surahPath(id)} className="mt-10 justify-center" />}
      />
    </>
  );
}
