#!/usr/bin/env node
/**
 * Verifies the bundled Qurʾān data against independent references. Run after `npm run data`
 * (it is the last step of that script) or on its own: `npm run verify:data`. Exits 1 on any finding.
 *
 * References (fetched into .cache/quran-sources by the build scripts):
 *  - quran-json@3.1.2: KFGQPC-based Uthmani text, Saheeh International and the other translations
 *  - quran-meta (qmeta-hafs.json): juzʾ, ḥizb quarter, page and sajdah positions for Ḥafṣ
 *
 * Checks: 114 surahs / 6,236 ayat with contiguous numbering; every ayah's plain Uthmani text and its
 * tajweed rendering letter-for-letter against the reference (consonantal skeleton, hamza seats and
 * dotless forms unified); the basmala; juzʾ starts, ḥizb quarters, pages and sajdahs; translations
 * identical to their sources; tafsir and similar-ayat integrity; the search index; and Qurʾān text
 * typed into the site's source, which must occur verbatim in an ayah; and word timings (all words timed, in order).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CACHE = join(ROOT, ".cache", "quran-sources");
const REF = join(CACHE, "quran-json", "package", "dist");
const read = (p) => JSON.parse(readFileSync(p, "utf8"));

if (!existsSync(join(REF, "quran.json")) || !existsSync(join(CACHE, "qmeta-hafs.json"))) {
  console.error("verify-quran-data: reference sources missing; run `npm run data` first.");
  process.exit(1);
}

const skeleton = (t) =>
  t
    .replace(/\u0670\u0654/g, "\u0670\u0621") // hamza over a dagger alif is the letter hamza (2:72, KFGQPC)
    .replace(/\u064A\u0655/g, "\u0626").replace(/\u0649\u0655/g, "\u0626").replace(/\u0648[\u0654\u0655]/g, "\u0624")
    .replace(/\u0627\u0654/g, "\u0623").replace(/\u0627\u0655/g, "\u0625").replace(/\u066E/g, "\u0649")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u08D3-\u08FF\u200C-\u200F\s]/g, "")
    .replace(/[\u0671\u0623\u0625\u0622]/g, "\u0627").replace(/\u0649/g, "\u064A");
const tajweedText = (j) => (typeof j === "string" ? j : j.map((r) => r[0]).join(""));

const findings = [];
const fail = (area, msg) => findings.push(`[${area}] ${msg}`);

const ref = read(join(REF, "quran.json"));
const meta = read(join(CACHE, "qmeta-hafs.json"));
const chapters = read(join(ROOT, "data/quran/chapters.json"));
const surahs = chapters.map((c) => read(join(ROOT, `data/quran/surah/${c.id}.json`)));

// Structure and text ----------------------------------------------------------------------------
if (chapters.length !== 114) fail("structure", `${chapters.length} surahs`);
let g = 0;
surahs.forEach((s, i) => {
  if (s.verses.length !== chapters[i].versesCount || s.verses.length !== ref[i].total_verses) fail("structure", `${i + 1}: ${s.verses.length} ayat`);
  s.verses.forEach((v, k) => {
    g++;
    const key = `${i + 1}:${v.n}`;
    if (v.n !== k + 1 || v.g !== g) fail("structure", `${key}: numbering n=${v.n} g=${v.g}`);
    const want = skeleton(ref[i].verses[k].text);
    if (skeleton(v.w.map((w) => w.a).join("")) !== want) fail("text", `${key}: plain text differs from the reference`);
    if (skeleton(v.w.map((w) => tajweedText(w.j ?? w.a)).join("")) !== want) fail("text", `${key}: tajweed text differs from the reference`);
    v.w.forEach((w, wi) => {
      if (skeleton(tajweedText(w.j ?? w.a)) !== skeleton(w.a)) fail("text", `${key} word ${wi + 1}: tajweed and plain words differ`);
    });
  });
});
if (g !== 6236) fail("structure", `${g} ayat`);

// Word timings (word-by-word highlighting): every word timed, positive length, in order, no overlap.
surahs.forEach((s) =>
  s.verses.forEach((v) =>
    v.w.forEach((w, i) => {
      const prev = v.w[i - 1];
      if (w.s == null || w.f == null || w.f <= w.s || (prev && w.s < prev.f)) fail("timings", `${s.id}:${v.n} word ${i + 1}: ${w.s}–${w.f}`);
    }),
  ),
);
const bism = skeleton("بسم الله الرحمن الرحيم");
if (skeleton(surahs[0].verses[0].w.map((w) => w.a).join("")) !== bism) fail("basmala", "1:1 is not the basmala");
surahs.slice(1).forEach((s) => {
  if (skeleton(s.verses[0].w.map((w) => w.a).join("")).startsWith(bism)) fail("basmala", `${s.id}:1 includes the basmala`);
});

// Mushaf structure ------------------------------------------------------------------------------
const flat = surahs.flatMap((s) => s.verses.map((v) => ({ s: s.id, ...v })));
const at = (gid) => flat[gid - 1];
const constants = readFileSync(join(ROOT, "lib/constants.ts"), "utf8");
const pairs = (block) => [...block.matchAll(/\[(\d+), (\d+)\]/g)].map((m) => `${m[1]}:${m[2]}`);
const juzApp = pairs(constants.match(/JUZ_STARTS[\s\S]*?\];/)[0]);
meta.JuzList.slice(1, 31).forEach((gid, i) => {
  const v = at(gid);
  if (juzApp[i] !== `${v.s}:${v.n}`) fail("juz", `Juzʾ ${i + 1} starts at ${juzApp[i]}, reference ${v.s}:${v.n}`);
});
const sajApp = pairs(constants.match(/SAJDAH_AYAT[\s\S]*?\];/)[0]).sort().join(",");
const sajRef = meta.SajdaList.map((gid) => `${at(gid).s}:${at(gid).n}`).sort().join(",");
if (sajApp !== sajRef) fail("sajdah", `${sajApp} vs reference ${sajRef}`);
const quarters = new Map(meta.HizbQuarterList.slice(1, 241).map((gid, i) => [gid, i + 1]));
let page = 0;
const pageStarts = meta.PageList.slice(1, 605);
flat.forEach((v) => {
  if ((v.q ?? null) !== (quarters.get(v.g) ?? null)) fail("hizb", `${v.s}:${v.n}`);
  while (page < 604 && pageStarts[page] <= v.g) page++;
  if (v.p !== page) fail("page", `${v.s}:${v.n} page ${v.p}, reference ${page}`);
});

// Translations, tafsir, similar ayat, search ------------------------------------------------------
const enRef = read(join(REF, "quran_en.json"));
surahs.forEach((s, i) => s.verses.forEach((v, k) => v.en !== enRef[i].verses[k].translation && fail("translation", `en ${s.id}:${v.n}`)));
for (const lang of readdirSync(join(ROOT, "public/data/translations"))) {
  const src = read(join(REF, `quran_${lang}.json`));
  chapters.forEach((c, i) => {
    const t = read(join(ROOT, `public/data/translations/${lang}/${c.id}.json`));
    if (t.length !== c.versesCount) fail("translation", `${lang} ${c.id}: ${t.length} entries`);
    t.forEach((x, k) => x !== src[i].verses[k]?.translation && fail("translation", `${lang} ${c.id}:${k + 1} differs from its source`));
  });
}
for (const lang of readdirSync(join(ROOT, "public/data/tafsir"))) {
  chapters.forEach((c) => {
    const t = read(join(ROOT, `public/data/tafsir/${lang}/${c.id}.json`));
    if (t.length !== c.versesCount) fail("tafsir", `${lang} ${c.id}: ${t.length} entries`);
  });
}
chapters.forEach((c) => {
  const f = join(ROOT, `public/data/similar/${c.id}.json`);
  if (!existsSync(f)) return;
  for (const [a, list] of Object.entries(read(f))) {
    for (const x of list) {
      const target = surahs[x.s - 1]?.verses[x.a - 1];
      if (!target || +a > c.versesCount) fail("similar", `${c.id}:${a} → ${x.s}:${x.a} out of range`);
      else if (x.t && x.t !== target.w.map((w) => w.a).join(" ")) fail("similar", `${c.id}:${a} → ${x.s}:${x.a} quotes different text`);
    }
  }
});
const search = read(join(ROOT, "public/data/search.json"));
if (search.length !== 6236) fail("search", `${search.length} entries`);
search.forEach(([s, a, en, ar]) => {
  const v = surahs[s - 1]?.verses[a - 1];
  // The index folds hamza seats and tāʾ marbūṭa for searching; compare with the same folding.
  const fold = (t) => skeleton(t).replace(/[ؤئء]/g, "ء").replace(/ة/g, "ه");
  if (!v || en !== v.en || fold(ar) !== fold(v.w.map((w) => w.a).join(""))) fail("search", `${s}:${a}`);
});

// Qurʾān text typed into the site's source --------------------------------------------------------
const allAyat = flat.map((v) => ({ key: `${v.s}:${v.n}`, text: skeleton(v.w.map((w) => w.a).join("")) }));
const sources = ["components", "lib", "app", "artifact"].flatMap(function walk(dir) {
  const p = join(ROOT, dir);
  if (!existsSync(p)) return [];
  return readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  );
});
for (const file of sources) {
  const text = readFileSync(join(ROOT, file), "utf8");
  for (const m of text.matchAll(/[ء-يٱ][؀-ۿ࣓-ࣿ\s]*/g)) {
    const run = m[0].trim();
    // Arabic with ḥarakāt (Urdu copy and labels carry none) spanning two or more words is treated as Qurʾān text.
    if (!/[ً-ْ]/.test(run) || run.split(/\s+/).length < 2 || /[ہھےیٹڈڑں]/.test(run)) continue;
    if (!allAyat.some((a) => a.text.includes(skeleton(run)))) fail("ui-text", `${file}: "${run}" is not verbatim Qurʾān text`);
  }
}

if (findings.length) {
  console.error(`Qurʾān data verification failed (${findings.length}):`);
  findings.slice(0, 50).forEach((f) => console.error("  " + f));
  process.exit(1);
}
console.log("Qurʾān data verified: 114 surahs, 6,236 ayat; text, tajweed, mushaf structure, translations, tafsir, similar ayat, search and site quotes all match their references.");
