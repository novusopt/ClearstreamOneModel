import type { MetadataRoute } from "next";
import { getChapters } from "@/lib/quran";
import { absoluteUrl, ayahPath, surahPath } from "@/lib/site";

/** Home, all 114 surahs and all 6,236 ayah pages (well under the 50,000-URL limit per sitemap). */
export default function sitemap(): MetadataRoute.Sitemap {
  const chapters = getChapters();
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    ...chapters.map((c) => ({ url: absoluteUrl(surahPath(c.id)), changeFrequency: "monthly" as const, priority: 0.9 })),
    ...chapters.flatMap((c) =>
      Array.from({ length: c.versesCount }, (_, i) => ({ url: absoluteUrl(ayahPath(c.id, i + 1)), changeFrequency: "yearly" as const, priority: 0.6 })),
    ),
  ];
}
