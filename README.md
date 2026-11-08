# Mishkah · مشكاة — a lantern for the Qurʾān

Mishkah (“lamp-niche”) takes its name from Āyat an-Nūr (24:35): *“The example of His light is like a
niche within which is a lamp.”* The brand follows that image: a midnight-indigo niche holding
lantern-amber light.

Read, listen to and understand the Qurʾān. Built with Next.js 16, Untitled UI (React Aria + Tailwind v4)
and Motion.

## Features

- **Qurʾānic text**: Uthmani script in the Amiri Quran typeface, adjustable size and ornamented ayah markers.
- **Tajweed**: 19 recitation rules colour-coded letter by letter, with a legend.
- **Word by word**: hover or tap any word for its transliteration and meaning, or show glosses inline. Tapping a word plays its pronunciation.
- **Translation**: Saheeh International plus 9 more languages (fr, es, id, tr, ur, bn, ru, zh, sv), loaded on demand. Verse transliteration is optional.
- **Audio**: 5 reciters, continuous playback, repeat (ayah/surah), speed control, auto-scroll and a persistent mini-player. With Al-Husary, each word lights up as it is recited.
- **Reading modes**: verse cards or a continuous mushaf-style page.
- **Navigation**: surah search (Latin, Arabic or number), Meccan/Medinan filter, browse by juzʾ, deep links (`/surah/2#v-255`).
- **Quick navigation**: ⌘K / Ctrl+K command palette to jump to any surah or ayah (type `2:255`), plus reader shortcuts: <kbd>Space</kbd> play/pause, <kbd>J</kbd>/<kbd>K</kbd> next/previous ayah.
- **Your library**: bookmarks and "continue reading", saved locally.
- **Motion**: parallax hero, scroll-reveal bento grid, a sticky scroll-driven walk through Al-Fātiḥah, Lenis smooth scrolling. All of it honours reduced-motion.
- Light and dark themes; responsive from 375 px up.

## Brand

- **Name & mark**: Mishkah, with an original logo of a lamp glowing inside a pointed-arch niche. Brand constants live in `lib/brand.ts`.
- **Palette**: midnight indigo (`brand-*`) and lantern amber (`gold-*`), on warm paper in light mode and deep ink in dark mode.
- **Type**: Fraunces (display serif), Inter (UI) and Amiri Quran (Arabic).
- **Motifs**: arch-shaped verse tags and hover cards, an eight-point ayah medallion and a flickering lantern glow.
- **Tajweed palette**: Mishkah's own colour system, grouped by family. Nasal rules are warm, madd is a deepening blue scale, idghām is green, qalqalah is crimson and silent letters are grey.

## Research notes

We looked at how existing open readers handle the hard parts, then designed our own UI. Ideas we kept:
toggling word-by-word glosses on and off, a verse view alongside a continuous reading view, and per-word
timing sync, where the active word is the one whose `start ≤ t < end`. We also fall back across several
audio CDNs if one fails.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # pre-renders all 114 surahs
```

The dataset is committed. To regenerate it from upstream run `npm run data`, which needs network access to GitHub and npm.

## Credits & licences

- Word data, timings and tajweed markup come from [ivosetyadi/quran-recital](https://github.com/ivosetyadi/quran-recital) (MIT), which is itself derived from the Quran.com API.
- Per-word pronunciation clips are streamed from the public word-by-word audio CDN.
- Translations and transliteration come from [quran-json](https://github.com/risan/quran-json) (CC-BY-4.0), sourced from Tanzil.net and QuranEnc.
- Audio is streamed from Islamic Network CDN and EveryAyah.
- UI components: [Untitled UI React](https://github.com/untitleduico/react) (MIT).
- Fonts: Amiri Quran (OFL) and Inter (OFL).
