import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AyahView } from "@/components/quran/ayah-view";
import { ayahMetadata, loadAyah } from "@/lib/ayah-page";

/**
 * One page per ayah (6,236), English. Localized versions live at /{lang}/surah/{id}/{ayah}.
 * The most-visited ayat are prebuilt and the rest are generated on first request and then cached.
 */

export const PREBUILT: Array<[number, number[]]> = [
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

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, ayah } = await params;
  const d = await loadAyah(id, ayah, "en");
  return d ? ayahMetadata(d) : {};
}

export default async function AyahPage({ params }: { params: Params }) {
  const { id, ayah } = await params;
  const d = await loadAyah(id, ayah, "en");
  if (!d) notFound();
  return <AyahView d={d} />;
}
