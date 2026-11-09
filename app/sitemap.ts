import type { MetadataRoute } from "next";
import { getChapters } from "@/lib/quran";
import { absoluteUrl, ayahPath, surahPath } from "@/lib/site";

/** Home, 114 surahs, 30 juzʾ, 604 mushaf pages and 6,236 ayat (well under the 50,000-URL limit per sitemap). */
export default function sitemap(): MetadataRoute.Sitemap {
  const chapters = getChapters();
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    ...chapters.map((c) => ({ url: absoluteUrl(surahPath(c.id)), changeFrequency: "monthly" as const, priority: 0.9 })),
    ...Array.from({ length: 30 }, (_, i) => ({ url: absoluteUrl(`/juz/${i + 1}`), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...Array.from({ length: 604 }, (_, i) => ({ url: absoluteUrl(`/page/${i + 1}`), changeFrequency: "yearly" as const, priority: 0.5 })),
    ...chapters.flatMap((c) =>
      Array.from({ length: c.versesCount }, (_, i) => ({ url: absoluteUrl(ayahPath(c.id, i + 1)), changeFrequency: "yearly" as const, priority: 0.6 })),
    ),
  ];
}
