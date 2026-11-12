import "server-only";
import type { Metadata } from "next";
import { ayahName } from "@/lib/ayah-names";
import { hasTafsir, type Lang, languageAlternates, localePath, ogLocale, t } from "@/lib/i18n";
import { getChapter, getSurah, getTafsir, getTranslation, isValidSurahId } from "@/lib/quran";
import { snippet } from "@/lib/seo";
import { ayahPath } from "@/lib/site";

/** Data for one ayah page in one language (null for an invalid reference → 404). */
export async function loadAyah(rawId: string, rawAyah: string, lang: Lang) {
  const id = Number(rawId);
  const ayah = Number(rawAyah);
  if (!isValidSurahId(id) || !/^\d+$/.test(rawAyah)) return null;
  const chapter = getChapter(id)!;
  if (ayah < 1 || ayah > chapter.versesCount) return null;
  const tafsirLang = hasTafsir(lang) ? lang : "en";
  const [{ verses }, translation, tafsir] = await Promise.all([
    getSurah(id),
    getTranslation(lang, id).catch(() => null),
    getTafsir(tafsirLang, id).catch(() => [] as string[]),
  ]);
  const verse = verses[ayah - 1];
  return {
    id,
    ayah,
    chapter,
    verse,
    lang,
    translation: translation?.[ayah - 1] ?? verse.en,
    tafsir: tafsir[ayah - 1] as string | undefined,
    tafsirLang,
  };
}

export type AyahData = NonNullable<Awaited<ReturnType<typeof loadAyah>>>;

export function ayahMetadata(d: AyahData): Metadata {
  const { chapter, id, ayah, lang } = d;
  const s = t(lang);
  const named = ayahName(id, ayah);
  const ref = `${chapter.nameSimple} ${id}:${ayah}`;
  const title =
    lang === "en" && named ? `${named.name} (${ref}): Arabic, Translation & Tafsir` : named ? `${named.name} · ${s.ayahTitle(chapter, ayah)}` : s.ayahTitle(chapter, ayah);
  const description = snippet(s.ayahDescription(chapter, ayah, d.translation));
  const path = ayahPath(id, ayah);
  return {
    title,
    description,
    alternates: { canonical: localePath(lang, path), languages: languageAlternates(path) },
    openGraph: {
      type: "article",
      url: localePath(lang, path),
      locale: ogLocale(lang),
      title: named ? `${named.name} · ${ref}` : `Quran ${id}:${ayah} · ${chapter.nameSimple}`,
      description,
      // One share card per ayah (English route); localized pages reuse it.
      images: [`${path}/opengraph-image`],
    },
  };
}
