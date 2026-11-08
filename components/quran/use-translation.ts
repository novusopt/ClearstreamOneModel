"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, string[]>();

/** Loads a non-English translation for a surah from /public/data/translations. */
export function useTranslationText(surah: number, lang: string): { texts: string[] | null; loading: boolean } {
  const key = `${lang}/${surah}`;
  const [, force] = useState(0);
  const skip = lang === "en";

  useEffect(() => {
    if (skip || cache.has(key)) return;
    let cancelled = false;
    fetch(`/data/translations/${key}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<string[]>) : Promise.reject(new Error(r.statusText))))
      .then((data) => {
        cache.set(key, data);
        if (!cancelled) force((n) => n + 1);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key, skip]);

  if (skip) return { texts: null, loading: false };
  const texts = cache.get(key) ?? null;
  return { texts, loading: texts == null };
}
