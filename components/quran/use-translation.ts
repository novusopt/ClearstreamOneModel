"use client";

import { useEffect, useState } from "react";
import { DATA_BASE, IS_ARTIFACT } from "@/lib/runtime";

const cache = new Map<string, string[]>();

/** Loads a non-English translation for a surah from /public/data/translations. */
export function useTranslationText(surah: number, lang: string): { texts: string[] | null; loading: boolean } {
  const key = `${lang}/${surah}`;
  const [, force] = useState(0);
  const skip = lang === "en";

  useEffect(() => {
    if (skip || cache.has(key)) return;
    let cancelled = false;
    // The single-page build ships one file per language instead of one per surah.
    const url = IS_ARTIFACT ? `${DATA_BASE}/tr-${lang}.json` : `${DATA_BASE}/translations/${key}.json`;
    fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<string[] | string[][]>) : Promise.reject(new Error(r.statusText))))
      .then((data) => {
        if (IS_ARTIFACT) (data as string[][]).forEach((texts, i) => cache.set(`${lang}/${i + 1}`, texts));
        else cache.set(key, data as string[]);
        if (!cancelled) force((n) => n + 1);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key, lang, skip]);

  if (skip) return { texts: null, loading: false };
  const texts = cache.get(key) ?? null;
  return { texts, loading: texts == null };
}
