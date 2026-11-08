#!/usr/bin/env node
/**
 * Adds study data on top of the core dataset (run after build-quran-data.mjs).
 *
 * Sources (fetched into .cache/quran-sources):
 *  - spa5k/tafsir_api (MIT code; texts from QUL / QuranEnc): "Al-Mukhtasar fi Tafsir al-Qur'an"
 *    by the Tafsir Center for Quranic Studies, in 9 languages. Quality-checked: complete, no
 *    encoding damage. (The repo's "Asbab al-Nuzul by al-Wahidi" edition is deliberately NOT
 *    used: it mixes in passages from a different tafsir and has broken characters.)
 *  - Waqar144/Quran_Mutashabihat_Data (CC0): ayat with near-identical wording that huffaz confuse.
 *  - npm quran-meta (MIT): Madani mushaf page and hizb-quarter boundaries (Hafs). Read as data.
 *
 * Output:
 *  - public/data/tafsir/{lang}/{n}.json      string[] per ayah
 *  - public/data/similar/{n}.json            { [ayah]: [{ s, a, n (surah name), t (Arabic) }] }  (symmetric)
 *  - data/quran/surah/{n}.json               verses gain `p` (mushaf page) and `q` (hizb quarter starting here)
 *  - data/quran/chapters.json                chapters gain `pages` [first, last] and `words`
 *
 * Usage: npm run data   (runs all data scripts in order)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CACHE = join(ROOT, ".cache", "quran-sources");
const TAFSIR_DIR = join(CACHE, "tafsir", "tafsir");
const MUTASH = join(CACHE, "mutashabihat", "mutashabiha_data.json");
const QMETA = join(CACHE, "qmeta", "package", "dist");

/** App translation language → Al-Mukhtasar edition. Languages without one fall back to English in the UI. */
const TAFSIR_EDITIONS = {
  en: "en-tafsir-al-mukhtasar",
  ar: "ar-tafsir-al-mukhtasar",
  fr: "french-mokhtasar",
  es: "spanish-mokhtasar",
  id: "indonesian-mokhtasar",
  tr: "turkish-mokhtasar",
  ru: "russian-mokhtasar",
  bn: "bengali-mokhtasar",
  zh: "chinese-mokhtasar",
};

const sh = (cmd, args, cwd = ROOT) => execFileSync(cmd, args, { cwd, stdio: "inherit" });
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

function fetchSources() {
  mkdirSync(CACHE, { recursive: true });
  if (!existsSync(join(TAFSIR_DIR, TAFSIR_EDITIONS.en, "114.json"))) {
    rmSync(join(CACHE, "tafsir"), { recursive: true, force: true });
    sh("git", ["clone", "--depth", "1", "--filter=blob:none", "--sparse", "https://github.com/spa5k/tafsir_api.git", join(CACHE, "tafsir")]);
    sh("git", ["sparse-checkout", "set", "--no-cone", ...Object.values(TAFSIR_EDITIONS).map((s) => `/tafsir/${s}/*.json`)], join(CACHE, "tafsir"));
  }
  if (!existsSync(MUTASH)) {
    rmSync(join(CACHE, "mutashabihat"), { recursive: true, force: true });
    sh("git", ["clone", "--depth", "1", "https://github.com/Waqar144/Quran_Mutashabihat_Data.git", join(CACHE, "mutashabihat")]);
  }
  if (!existsSync(QMETA)) {
    const dir = join(CACHE, "qmeta");
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    sh("npm", ["pack", "quran-meta", "--silent"], dir);
    const tgz = readdirSync(dir).find((f) => f.endsWith(".tgz"));
    sh("tar", ["xzf", tgz], dir);
  }
}

/** Parse a numeric array literal (e.g. `PageList: [0, 1, 8, ...]`) out of quran-meta's Hafs list module — read as text, never executed. */
function readList(name) {
  const file = readdirSync(QMETA).find((f) => /^HafsLists-.*\.js$/.test(f));
  const src = readFileSync(join(QMETA, file), "utf8");
  const m = src.match(new RegExp(`${name}:\\s*\\[([^\\]]*)\\]`));
  if (!m) throw new Error(`quran-meta: ${name} not found`);
  return m[1].match(/-?\d+/g).map(Number);
}

function main() {
  fetchSources();
  const chapters = readJson(join(ROOT, "data/quran/chapters.json"));

  // Global ayah number ↔ [surah, ayah].
  const start = [0];
  let acc = 0;
  for (const c of chapters) {
    start.push(acc);
    acc += c.versesCount;
  }
  const toRef = (g) => {
    let s = 1;
    while (s < 114 && start[s + 1] < g) s++;
    return [s, g - start[s]];
  };

  // Validate quran-meta against our known juz starts before trusting its pages.
  const juz = readList("JuzList");
  const known = [[1, 1], [2, 142], [2, 253], [3, 93], [78, 1]];
  for (const [s, a] of known) if (!juz.includes(start[s] + a)) throw new Error(`quran-meta juz mismatch at ${s}:${a}`);
  const pages = readList("PageList"); // pages[p] = first global ayah of page p (1..604), last entry is a sentinel
  const quarters = readList("HizbQuarterList"); // quarters[q] = first global ayah of rub' q (1..240)
  const pageOf = (g) => {
    let p = 1;
    while (p < 604 && pages[p + 1] <= g) p++;
    return p;
  };
  const quarterAt = new Map(quarters.slice(1, 241).map((g, i) => [g, i + 1]));

  // Surah files: add page + quarter markers; collect per-surah stats.
  const arabic = new Map(); // global → Arabic text, for similar-ayat lookups
  for (const c of chapters) {
    const file = join(ROOT, "data/quran/surah", `${c.id}.json`);
    const data = readJson(file);
    let words = 0;
    for (const v of data.verses) {
      v.p = pageOf(v.g);
      const q = quarterAt.get(v.g);
      if (q) v.q = q;
      else delete v.q;
      words += v.w.length;
      arabic.set(v.g, v.w.map((w) => w.a).join(" "));
    }
    writeFileSync(file, JSON.stringify(data));
    c.pages = [data.verses[0].p, data.verses[data.verses.length - 1].p];
    c.words = words;
  }
  writeFileSync(join(ROOT, "data/quran/chapters.json"), JSON.stringify(chapters));

  // Tafsir (Al-Mukhtasar), one string per ayah.
  const norm = (t) => new Set(t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").split(/\s+/));

  for (const [lang, slug] of Object.entries(TAFSIR_EDITIONS)) {
    const dir = join(ROOT, "public/data/tafsir", lang);
    mkdirSync(dir, { recursive: true });
    for (const c of chapters) {
      const raw = readJson(join(TAFSIR_DIR, slug, `${c.id}.json`));
      const list = Array.isArray(raw) ? raw : raw.ayahs;
      const by = new Map(list.filter((x) => x.surah === c.id).map((x) => [x.ayah, String(x.text).trim()]));
      const out = [];
      for (let a = 1; a <= c.versesCount; a++) {
        const t = by.get(a);
        if (!t) throw new Error(`tafsir ${slug} missing ${c.id}:${a}`);
        if (t.includes("�")) throw new Error(`tafsir ${slug} has broken characters at ${c.id}:${a}`);
        out.push(t);
      }
      writeFileSync(join(dir, `${c.id}.json`), JSON.stringify(out));
    }
  }

  // Similar ayat (mutashabihat), made symmetric. The dataset numbers ayat from 0 (verified below by
  // word overlap: ~0.29 Jaccard with +1, ~0.06 without), so shift to our 1-based global numbers.
  const OFFSET = 1;
  const pairs = new Map(); // global → Set(global)
  const link = (a, b) => {
    if (a === b) return;
    if (!pairs.has(a)) pairs.set(a, new Set());
    pairs.get(a).add(b);
  };
  for (const entries of Object.values(readJson(MUTASH))) {
    for (const e of entries) {
      const srcs = Array.isArray(e.src.ayah) ? e.src.ayah : [e.src.ayah];
      for (const m of e.muts) {
        const targets = Array.isArray(m.ayah) ? m.ayah : [m.ayah];
        for (const s0 of srcs) for (const t0 of targets) {
          const s = s0 + OFFSET;
          const t = t0 + OFFSET;
          link(s, t);
          link(t, s);
        }
      }
    }
  }
  let overlap = 0;
  let count = 0;
  for (const [a, set] of pairs) for (const b of set) {
    const A = norm(arabic.get(a) ?? "");
    const B = norm(arabic.get(b) ?? "");
    overlap += [...A].filter((w) => B.has(w)).length / new Set([...A, ...B]).size;
    count++;
  }
  if (overlap / count < 0.2) throw new Error(`mutashabihat alignment looks wrong (mean overlap ${(overlap / count).toFixed(2)})`);

  const simDir = join(ROOT, "public/data/similar");
  rmSync(simDir, { recursive: true, force: true });
  mkdirSync(simDir, { recursive: true });
  const bySurah = new Map();
  for (const [g, set] of pairs) {
    const [s, a] = toRef(g);
    if (!bySurah.has(s)) bySurah.set(s, {});
    bySurah.get(s)[a] = [...set]
      .sort((x, y) => x - y)
      .map((o) => {
        const [os, oa] = toRef(o);
        return { s: os, a: oa, n: chapters[os - 1].nameSimple, t: arabic.get(o) };
      });
  }
  // One file per surah (empty object when none), so clients never request a missing file.
  for (const c of chapters) writeFileSync(join(simDir, `${c.id}.json`), JSON.stringify(bySurah.get(c.id) ?? {}));

  console.log(`Pages/quarters added; tafsir: ${Object.keys(TAFSIR_EDITIONS).length} languages; similar ayat: ${pairs.size} ayat in ${bySurah.size} surahs.`);
}

main();
