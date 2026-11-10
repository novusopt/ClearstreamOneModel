import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";
import { getChapters } from "@/lib/quran";
import { absoluteUrl, ayahPath, surahPath } from "@/lib/site";

/**
 * One sitemap per language (each well under the 50,000-URL limit):
 * /sitemap/en.xml  home, 114 surahs, 30 juzʾ, 604 mushaf pages, 6,236 ayat
 * /sitemap/fr.xml  … /sitemap/sv.xml  localized home, surahs and ayat
 */
export async function generateSitemaps() {
  return [{ id: "en" }, ...LOCALES.map((l) => ({ id: l }))];
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  const chapters = getChapters();
  const prefix = id === "en" ? "" : `/${id}`;
  const surahs = chapters.map((c) => ({ url: absoluteUrl(prefix + surahPath(c.id)), changeFrequency: "monthly" as const, priority: id === "en" ? 0.9 : 0.7 }));
  const ayat = chapters.flatMap((c) =>
    Array.from({ length: c.versesCount }, (_, i) => ({ url: absoluteUrl(prefix + ayahPath(c.id, i + 1)), changeFrequency: "yearly" as const, priority: id === "en" ? 0.6 : 0.5 })),
  );
  if (id !== "en") return [{ url: absoluteUrl(`/${id}`), changeFrequency: "weekly" as const, priority: 0.9 }, ...surahs, ...ayat];
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/credits"), changeFrequency: "monthly", priority: 0.3 },
    ...surahs,
    ...Array.from({ length: 30 }, (_, i) => ({ url: absoluteUrl(`/juz/${i + 1}`), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...Array.from({ length: 604 }, (_, i) => ({ url: absoluteUrl(`/page/${i + 1}`), changeFrequency: "yearly" as const, priority: 0.5 })),
    ...ayat,
  ];
}
