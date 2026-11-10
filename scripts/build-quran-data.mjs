#!/usr/bin/env node
/**
 * Builds the bundled Quran dataset used by the app.
 *
 * Sources (fetched into .cache/quran-sources, which is git-ignored):
 *  - github.com/ivosetyadi/quran-recital (MIT): per-word Uthmani text, transliteration,
 *    English gloss and recitation timings (Mahmoud Khalil al-Husary), plus per-word
 *    tajweed markup (originally sourced from the Quran.com API).
 *  - npm quran-json@3.1.2 (CC-BY-4.0): surah metadata, full-verse transliteration
 *    (tanzil.net) and translations (Saheeh International for English, tanzil.net).
 *
 * Output:
 *  - data/quran/chapters.json             surah index
 *  - data/quran/surah/{n}.json            verses with words, tajweed, timings, English
 *  - public/data/translations/{lang}/{n}.json   other translations, loaded on demand
 *
 * Usage: npm run data
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CACHE = join(ROOT, ".cache", "quran-sources");
const RECITAL = join(CACHE, "quran-recital");
const QURAN_JSON = join(CACHE, "quran-json", "package", "dist");

const LANGS = ["fr", "es", "id", "tr", "ur", "bn", "ru", "zh", "sv"];

function sh(cmd, args, cwd = ROOT) {
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
}

function fetchSources() {
  mkdirSync(CACHE, { recursive: true });
  if (!existsSync(join(RECITAL, "data", "114.json"))) {
    rmSync(RECITAL, { recursive: true, force: true });
    sh("git", ["clone", "--depth", "1", "https://github.com/ivosetyadi/quran-recital.git", RECITAL]);
  }
  if (!existsSync(join(QURAN_JSON, "quran_en.json"))) {
    const dir = join(CACHE, "quran-json");
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    sh("npm", ["pack", "quran-json@3.1.2", "--silent"], dir);
    sh("tar", ["xzf", "quran-json-3.1.2.tgz"], dir);
  }
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const pad = (n) => String(n).padStart(3, "0");

/**
 * "<rule class=ham_wasl>ٱ</rule>للَّهِ" → [["ٱ","ham_wasl"],["للَّهِ"]], or a plain string.
 * Rules can nest (e.g. a madd wrapping a `custom-alef-maksora` glyph marker); each text run
 * takes the innermost rule that carries a tajweed colour.
 */
const DISPLAY_ONLY_RULES = new Set(["custom-alef-maksora"]);

function parseTajweed(html) {
  if (!html.includes("<rule")) return html;
  const out = [];
  const stack = [];
  const re = /<rule class=([a-z_-]+)>|<\/rule>|[^<]+/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("<rule")) stack.push(m[1]);
    else if (m[0] === "</rule>") stack.pop();
    else {
      const rule = [...stack].reverse().find((r) => !DISPLAY_ONLY_RULES.has(r));
      const last = out[out.length - 1];
      if (last && last[1] === rule) last[0] += m[0];
      else out.push(rule ? [m[0], rule] : [m[0]]);
    }
  }
  if (stack.length) throw new Error(`unbalanced tajweed markup: ${html}`);
  return out.length === 1 && out[0].length === 1 ? out[0][0] : out;
}

// --- Text integrity ------------------------------------------------------------------------
// The Qurʾān text must never lose, gain or change a letter. Two upstream copies are used (plain
// Uthmani words and per-word tajweed markup); every tajweed word is checked against its plain word
// by consonantal skeleton, and the plain text was audited against the independent quran-json text.

/** Consonantal skeleton: hamza seats unified, dotless forms mapped, marks and spaces removed. */
const skeleton = (t) =>
  t
    .replace(/يٕ/g, "ئ").replace(/ىٕ/g, "ئ").replace(/و[ٕٔ]/g, "ؤ")
    .replace(/أ/g, "أ").replace(/إ/g, "إ").replace(/ٮ/g, "ى")
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ࣓-ࣿ‌-‏\s]/g, "")
    .replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي");

/**
 * Upstream plain-text errors, corrected to the Madani mushaf (verified against quran-json's
 * KFGQPC-based text). Keyed surah:ayah:word; the original must match exactly, so an upstream fix
 * makes the build fail here instead of silently double-correcting.
 */
const PLAIN_CORRECTIONS = {
  // دَآئِرَ ةٌ → دَآئِرَةٌ: stray space inside the word dāʾiratun
  "5:52:12": ["دَآئِرَ ةٌۭ ۚ", "دَآئِرَةٌۭ ۚ"],
  // افْتَرَاهُ → ٱفْتَرَىٰهُ: written with alif waṣla and yāʾ + dagger alif in the mushaf
  "11:13:3": ["افْتَرَاهُ ۖ", "ٱفْتَرَىٰهُ ۖ"],
};

const asRuns = (x) => (typeof x === "string" ? [[x]] : x);
const runsText = (x) => asRuns(x).map((r) => r[0]).join("");
const simplifyRuns = (rs) => (rs.every((r) => r.length === 1) ? rs.map((r) => r[0]).join("") : rs);
const isLetter = (ch) => /[ء-يٮٱ-ۓ]/.test(ch ?? "");

/**
 * The tajweed copy writes some yāʾ + dagger-alif spellings (وَلَّىٰهُمۡ) as tatweel + dagger alif
 * (وَلَّـٰهُمۡ), dropping the yāʾ of the rasm. Put it back: dotless medial yāʾ (ٮ, the tooth of the
 * printed mushaf) inside a word, ى at the end. Returns null if no single restoration matches.
 */
function restoreYa(tok, want) {
  const rs = asRuns(tok).map((r) => [...r]);
  for (let ri = 0; ri < rs.length; ri++) {
    let from = 0;
    for (;;) {
      const at = rs[ri][0].indexOf("ـٰ", from);
      if (at < 0) break;
      const after = rs[ri][0].slice(at + 2) + rs.slice(ri + 1).map((r) => r[0]).join("");
      const ya = isLetter(after.replace(/^[ً-ٰٟۖ-ۭ]+/, "")[0]) ? "ٮ" : "ى";
      const trial = rs.map((r, k) => (k === ri ? [r[0].slice(0, at) + ya + r[0].slice(at + 1), ...r.slice(1)] : r));
      if (skeleton(runsText(trial)) === want) return simplifyRuns(trial);
      from = at + 2;
    }
  }
  return null;
}

/** Where the plain word is two written words ("بَعْدَ مَا") and the tajweed copy joins them, split it. */
function matchSpacing(tok, plain) {
  const parts = plain.trim().split(/\s+/).filter((p) => skeleton(p));
  const text = runsText(tok);
  if (parts.length !== 2 || /\s/.test(text)) return tok;
  for (let i = 1; i < text.length; i++) {
    if (!isLetter(text[i]) || skeleton(text.slice(0, i)) !== skeleton(parts[0])) continue;
    // Insert the space at offset i, inside whichever run holds it.
    let offset = i;
    const rs = asRuns(tok).map((r) => {
      const run = [...r];
      if (offset >= 0 && offset <= run[0].length) {
        if (offset > 0 && offset < run[0].length) run[0] = `${run[0].slice(0, offset)} ${run[0].slice(offset)}`;
        else if (offset === run[0].length) run[0] = `${run[0]} `;
        else run[0] = ` ${run[0]}`;
        offset = -1;
      } else if (offset > 0) offset -= run[0].length;
      return run;
    });
    return simplifyRuns(rs);
  }
  return tok;
}

/**
 * Pair each plain word with its tajweed rendering. Upstream tajweed lists are occasionally out of
 * step with the words (8:6 splits "بعد ما" and so loses its last word); align by skeleton, merge
 * split entries, restore dropped yāʾs, and fall back to the plain word (no colours, correct text).
 */
function alignTajweed(key, plainWords, tokens, report) {
  const out = [];
  let j = 0;
  for (let i = 0; i < plainWords.length; i++) {
    const want = skeleton(plainWords[i]);
    const tok = tokens[j];
    if (tok != null && skeleton(runsText(tok)) === want) {
      out.push(matchSpacing(tok, plainWords[i]));
      j++;
      continue;
    }
    if (tok != null && tokens[j + 1] != null && skeleton(runsText(tok) + runsText(tokens[j + 1])) === want) {
      out.push(simplifyRuns([...asRuns(tok), [" "], ...asRuns(tokens[j + 1])]));
      report.merged.push(`${key}:${i + 1}`);
      j += 2;
      continue;
    }
    const restored = tok != null ? restoreYa(tok, want) : null;
    if (restored) {
      out.push(restored);
      report.ya.push(`${key}:${i + 1}`);
      j++;
      continue;
    }
    out.push(plainWords[i]);
    report.plain.push(`${key}:${i + 1}`);
    // Consume the token unless it already belongs to the next word.
    if (tok != null && !(i + 1 < plainWords.length && skeleton(runsText(tok)) === skeleton(plainWords[i + 1]))) j++;
  }
  return out;
}

function main() {
  fetchSources();
  const outQuran = join(ROOT, "data", "quran");
  const outSurah = join(outQuran, "surah");
  mkdirSync(outSurah, { recursive: true });

  const en = readJson(join(QURAN_JSON, "quran_en.json"));
  const translit = readJson(join(QURAN_JSON, "quran_transliteration.json"));
  const langs = Object.fromEntries(LANGS.map((l) => [l, readJson(join(QURAN_JSON, `quran_${l}.json`))]));

  const chapters = en.map((c, i) => ({
    id: c.id,
    nameArabic: c.name,
    nameSimple: c.transliteration,
    nameTranslation: c.translation,
    // Surah name meaning per translation language (used by the localized /{lang}/ pages).
    names: Object.fromEntries(LANGS.map((l) => [l, langs[l][i].translation])),
    revelation: c.type,
    versesCount: c.total_verses,
  }));
  writeFileSync(join(outQuran, "chapters.json"), JSON.stringify(chapters));

  let words = 0;
  const integrity = { corrected: [], merged: [], ya: [], plain: [] };
  for (const ch of chapters) {
    const n = ch.id;
    const src = readJson(join(RECITAL, "data", `${pad(n)}.json`));
    const tj = readJson(join(RECITAL, "data", "tajweed", `${pad(n)}.json`));
    if (src.ayat.length !== ch.versesCount) throw new Error(`verse count mismatch in ${n}`);

    const verses = src.ayat.map((a, i) => {
      const tjw = tj[String(a.ayah)] ?? [];
      if (tjw.length !== a.words.length) throw new Error(`tajweed word mismatch ${n}:${a.ayah}`);
      words += a.words.length;
      a.words.forEach((w, j) => {
        const fix = PLAIN_CORRECTIONS[`${n}:${a.ayah}:${j + 1}`];
        if (!fix) return;
        if (w.ar !== fix[0]) throw new Error(`plain correction ${n}:${a.ayah}:${j + 1} no longer matches upstream: "${w.ar}"`);
        w.ar = fix[1];
        integrity.corrected.push(`${n}:${a.ayah}:${j + 1}`);
      });
      // A few upstream tajweed strings carry HTML-entity residue (e.g. "&gt;" in 32:3): no markup for those.
      const parsed = tjw.map((h, j) => (/&[a-z#0-9]+;/i.test(h) ? a.words[j].ar : parseTajweed(h)));
      const aligned = alignTajweed(`${n}:${a.ayah}`, a.words.map((w) => w.ar), parsed, integrity);
      return {
        n: a.ayah,
        g: a.global,
        tr: translit[n - 1].verses[i].transliteration,
        en: en[n - 1].verses[i].translation,
        w: a.words.map((w, j) => {
          const word = { a: w.ar, t: w.tr, e: w.en, j: aligned[j] };
          if (w.start != null && w.end != null) {
            word.s = w.start;
            word.f = w.end;
          }
          return word;
        }),
      };
    });
    writeFileSync(join(outSurah, `${n}.json`), JSON.stringify({ id: n, verses }));

    for (const l of LANGS) {
      const dir = join(ROOT, "public", "data", "translations", l);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${n}.json`), JSON.stringify(langs[l][n - 1].verses.map((v) => v.translation)));
    }
  }
  console.log(`Wrote ${chapters.length} surahs, ${words} words, ${LANGS.length + 1} translations.`);
  console.log(
    `Text integrity: ${integrity.corrected.length} plain corrections (${integrity.corrected.join(", ")}), ` +
      `${integrity.merged.length} split tajweed words merged (${integrity.merged.join(", ")}), ` +
      `${integrity.ya.length} dropped yāʾ restored, ${integrity.plain.length} words shown without tajweed (${integrity.plain.join(", ")}).`,
  );
}

main();
