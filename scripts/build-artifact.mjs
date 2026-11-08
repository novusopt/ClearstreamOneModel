#!/usr/bin/env node
/**
 * Builds the single-page version of Mishkah for hosting as a claude.ai page.
 *
 * Output (dist-artifact/):
 *   index.html            page with inlined CSS, fonts and JS (the page skeleton is added at publish)
 *   data/surah-{n}.json   per-surah verse data, fetched on demand
 *   data/tr-{lang}.json   one file per non-English translation (all surahs)
 *   data/home.json        Al-Fatihah + Ayat al-Kursi for the home page demos
 *
 * Usage: npm run build:artifact
 */
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";

const ROOT = process.cwd();
const OUT = join(ROOT, "dist-artifact");
const DATA = join(OUT, "data");
const LANGS = ["fr", "es", "id", "tr", "ur", "bn", "ru", "zh", "sv"];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(DATA, { recursive: true });

// 1. JavaScript
const js = await build({
  entryPoints: [join(ROOT, "artifact/main.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  legalComments: "none",
  logLevel: "error",
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_ARTIFACT": '"1"',
  },
  alias: {
    "next/link": join(ROOT, "artifact/shims/next-link.tsx"),
    "next/navigation": join(ROOT, "artifact/shims/next-navigation.ts"),
  },
});
const script = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

// 2. CSS (Tailwind v4 over the same globals.css) + inlined fonts
const cssFile = join(ROOT, "app/globals.css");
const compiled = await postcss([tailwind({ base: ROOT })]).process(readFileSync(cssFile, "utf8"), { from: cssFile });
const font = (file) => `url(data:font/woff2;base64,${readFileSync(join(ROOT, "app/fonts", file)).toString("base64")}) format("woff2")`;
const fonts = `
@font-face{font-family:"Inter";src:${font("inter-latin.woff2")};font-weight:100 900;font-display:swap}
@font-face{font-family:"Fraunces";src:${font("fraunces-latin.woff2")};font-weight:100 900;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Fraunces";src:${font("fraunces-latin-ext.woff2")};font-weight:100 900;font-display:swap;unicode-range:U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Amiri Quran";src:${font("amiri-quran-arabic.woff2")};font-weight:400;font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:"Amiri Quran";src:${font("amiri-quran-latin.woff2")};font-weight:400;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
:root{--font-inter:"Inter";--font-display-face:"Fraunces";--font-amiri-quran:"Amiri Quran"}
body{background:var(--color-bg-primary);color:var(--color-text-primary)}
`;
const css = compiled.css + fonts;

// 3. Data
for (const f of readdirSync(join(ROOT, "data/quran/surah"))) {
  writeFileSync(join(DATA, `surah-${f}`), readFileSync(join(ROOT, "data/quran/surah", f)));
}
for (const l of LANGS) {
  const all = [];
  for (let n = 1; n <= 114; n++) all.push(JSON.parse(readFileSync(join(ROOT, "public/data/translations", l, `${n}.json`), "utf8")));
  writeFileSync(join(DATA, `tr-${l}.json`), JSON.stringify(all));
}
const fatihah = JSON.parse(readFileSync(join(ROOT, "data/quran/surah/1.json"), "utf8")).verses;
const sample = JSON.parse(readFileSync(join(ROOT, "data/quran/surah/2.json"), "utf8")).verses[254];
writeFileSync(join(DATA, "home.json"), JSON.stringify({ fatihah, sample }));

// 4. Page (no <html>/<head>/<body>: the host wraps it)
const html = `<title>Mishkah</title>
<meta name="description" content="A lantern for the Qurʾān: Uthmani text, translations, word-by-word meanings and colour-coded tajweed.">
<style>${css}</style>
<div id="mishkah-root"></div>
<script>${script}</script>
`;
writeFileSync(join(OUT, "index.html"), html);
const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`index.html ${kb(html.length)} (js ${kb(script.length)}, css ${kb(css.length)}), ${readdirSync(DATA).length} data files`);
