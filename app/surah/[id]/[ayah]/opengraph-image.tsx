import { ayahName } from "@/lib/ayah-names";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/og-card";
import { getChapter, getSurah } from "@/lib/quran";
import { snippet } from "@/lib/seo";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Ayah preview card";

export default async function Image({ params }: { params: Promise<{ id: string; ayah: string }> }) {
  const { id: rawId, ayah: rawAyah } = await params;
  const id = Number(rawId);
  const ayah = Number(rawAyah);
  const chapter = getChapter(id)!;
  const verse = (await getSurah(id)).verses[ayah - 1];
  const named = ayahName(id, ayah);
  return ogCard({
    eyebrow: `Surah ${chapter.nameSimple} · Ayah ${ayah}`,
    title: named ? named.name : `Quran ${id}:${ayah}`,
    subtitle: named ? `${chapter.nameSimple} ${id}:${ayah}` : undefined,
    quote: `“${snippet(verse.en, named ? 150 : 190)}”`,
  });
}
