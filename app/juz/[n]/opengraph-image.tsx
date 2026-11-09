import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/og-card";
import { getChapters, getJuz } from "@/lib/quran";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Juz preview card";

export function generateStaticParams() {
  return Array.from({ length: 30 }, (_, i) => ({ n: String(i + 1) }));
}

export default async function Image({ params }: { params: Promise<{ n: string }> }) {
  const juz = Number((await params).n);
  const refs = await getJuz(juz);
  const chapters = getChapters();
  const names = [...new Set(refs.map((r) => chapters[r.s - 1].nameSimple))];
  const pages = refs.map((r) => r.verse.p ?? 0);
  return ogCard({
    eyebrow: `Part ${juz} of 30 · Pages ${Math.min(...pages)}–${Math.max(...pages)}`,
    title: juz === 30 ? "Juzʾ ʿAmma" : `Juzʾ ${juz}`,
    subtitle: names.length > 4 ? `${names.slice(0, 4).join(", ")} and ${names.length - 4} more` : names.join(", "),
  });
}
