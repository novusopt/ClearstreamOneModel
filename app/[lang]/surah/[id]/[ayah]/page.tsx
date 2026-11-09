import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AyahView } from "@/components/quran/ayah-view";
import { ayahMetadata, loadAyah } from "@/lib/ayah-page";
import { isLocale, LOCALES } from "@/lib/i18n";

/** Localized ayah pages (/fr/surah/2/255 …): every ayah in every translation language, generated on first request. */

export const dynamicParams = true;

export function generateStaticParams() {
  // Prebuild Āyat al-Kursī in every language; everything else renders on first request.
  return LOCALES.map((lang) => ({ lang, id: "2", ayah: "255" }));
}

type Params = Promise<{ lang: string; id: string; ayah: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id, ayah } = await params;
  if (!isLocale(lang)) return {};
  const d = await loadAyah(id, ayah, lang);
  return d ? ayahMetadata(d) : {};
}

export default async function LocalizedAyahPage({ params }: { params: Params }) {
  const { lang, id, ayah } = await params;
  if (!isLocale(lang)) notFound();
  const d = await loadAyah(id, ayah, lang);
  if (!d) notFound();
  return <AyahView d={d} />;
}
