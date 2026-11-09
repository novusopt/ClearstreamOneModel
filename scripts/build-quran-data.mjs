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
  for (const ch of chapters) {
    const n = ch.id;
    const src = readJson(join(RECITAL, "data", `${pad(n)}.json`));
    const tj = readJson(join(RECITAL, "data", "tajweed", `${pad(n)}.json`));
    if (src.ayat.length !== ch.versesCount) throw new Error(`verse count mismatch in ${n}`);

    const verses = src.ayat.map((a, i) => {
      const tjw = tj[String(a.ayah)] ?? [];
      if (tjw.length !== a.words.length) throw new Error(`tajweed word mismatch ${n}:${a.ayah}`);
      words += a.words.length;
      return {
        n: a.ayah,
        g: a.global,
        tr: translit[n - 1].verses[i].transliteration,
        en: en[n - 1].verses[i].translation,
        w: a.words.map((w, j) => {
          // A few upstream tajweed strings carry HTML-entity residue (e.g. "&gt;" in 32:3); use the
          // plain Uthmani word for those rather than showing broken text.
          const tajweed = /&[a-z#0-9]+;/i.test(tjw[j]) ? w.ar : parseTajweed(tjw[j]);
          const word = { a: w.ar, t: w.tr, e: w.en, j: tajweed };
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
}

main();
