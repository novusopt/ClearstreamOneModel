#!/usr/bin/env node
/**
 * Builds public/data/search.json, the full-text index used by the ⌘K palette:
 * [[surah, ayah, englishTranslation, normalisedArabic], ...] for all 6,236 ayat.
 * Arabic is stripped of diacritics so searches ignore harakat (same rules as lib/utils.ts).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const normalizeArabic = (s) =>
  s
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");

const rows = [];
for (let n = 1; n <= 114; n++) {
  const { verses } = JSON.parse(readFileSync(join(ROOT, "data/quran/surah", `${n}.json`), "utf8"));
  for (const v of verses) rows.push([n, v.n, v.en, normalizeArabic(v.w.map((w) => w.a).join(" "))]);
}
writeFileSync(join(ROOT, "public/data/search.json"), JSON.stringify(rows));
console.log(`Indexed ${rows.length} ayat.`);
