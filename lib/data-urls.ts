import { DATA_BASE, IS_ARTIFACT } from "@/lib/runtime";

/**
 * Where client components fetch per-surah data. The Next app serves static JSON from /public and
 * /api/surah/[id] (pre-rendered); the single-page build ships flat files beside the page.
 */
export const dataUrl = {
  surah: (n: number) => (IS_ARTIFACT ? `${DATA_BASE}/surah-${n}.json` : `/api/surah/${n}`),
  tafsir: (lang: string, n: number) => (IS_ARTIFACT ? `${DATA_BASE}/tafsir-${lang}.json` : `${DATA_BASE}/tafsir/${lang}/${n}.json`),
};

/** In the single-page build the tafsir file bundles all surahs: pick one surah out of it. */
export const pickSurah = <T,>(kind: "tafsir", data: unknown, n: number): T | null => {
  if (!IS_ARTIFACT) return data as T;
  return ((data as T[])[n - 1] ?? null) as T | null;
};
