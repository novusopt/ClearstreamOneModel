import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SurahHero } from "@/components/quran/surah-hero";
import { SurahReader } from "@/components/quran/surah-reader";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { getChapter, getChapters, getSurah, isValidSurahId } from "@/lib/quran";

export const dynamicParams = false;

export function generateStaticParams() {
  return getChapters().map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: PageProps<"/surah/[id]">): Promise<Metadata> {
  const { id } = await params;
  const chapter = getChapter(Number(id));
  if (!chapter) return {};
  return {
    title: `${chapter.nameSimple} (${chapter.nameTranslation})`,
    description: `Read Surah ${chapter.nameSimple} — ${chapter.versesCount} ayat with translation, word-by-word meanings, tajweed and audio.`,
  };
}

export default async function SurahPage({ params }: PageProps<"/surah/[id]">) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!isValidSurahId(id)) notFound();
  const chapter = getChapter(id)!;
  const { verses } = await getSurah(id);

  return (
    <>
      <ScrollProgress />
      <SurahHero chapter={chapter} />
      <SurahReader chapter={chapter} verses={verses} prev={getChapter(id - 1) ?? null} next={getChapter(id + 1) ?? null} />
    </>
  );
}
