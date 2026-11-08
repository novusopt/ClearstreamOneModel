import { DATA_BASE, IS_ARTIFACT } from "@/lib/runtime";

/**
 * Where client components fetch per-surah data. The Next app serves static JSON from /public and
 * /api/surah/[id] (pre-rendered); the single-page build ships flat files beside the page.
 */
export const dataUrl = {
  surah: (n: number) => (IS_ARTIFACT ? `${DATA_BASE}/surah-${n}.json` : `/api/surah/${n}`),
  tafsir: (lang: string, n: number) => (IS_ARTIFACT ? `${DATA_BASE}/tafsir-${lang}.json` : `${DATA_BASE}/tafsir/${lang}/${n}.json`),
  similar: (n: number) => (IS_ARTIFACT ? `${DATA_BASE}/similar.json` : `${DATA_BASE}/similar/${n}.json`),
};

/** In the single-page build some files bundle all surahs: pick one surah out of them. */
export const pickSurah = <T,>(kind: "tafsir" | "similar", data: unknown, n: number): T | null => {
  if (!IS_ARTIFACT) return data as T;
  if (kind === "tafsir") return ((data as T[])[n - 1] ?? null) as T | null;
  return ((data as Record<string, T>)[String(n)] ?? null) as T | null;
};
