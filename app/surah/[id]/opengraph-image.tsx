import { getChapter, getChapters } from "@/lib/quran";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/og-card";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Surah preview card";

export function generateStaticParams() {
  return getChapters().map((c) => ({ id: String(c.id) }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const chapter = getChapter(Number((await params).id))!;
  return ogCard({
    eyebrow: `Surah ${chapter.id} · ${chapter.versesCount} ayat · ${chapter.revelation === "meccan" ? "Meccan" : "Medinan"}`,
    title: chapter.nameSimple,
    subtitle: chapter.nameTranslation,
  });
}
