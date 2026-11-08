# Noor — a modern Qurʾān app

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
- **Your library**: bookmarks and "continue reading", saved locally.
- **Motion**: parallax hero, scroll-reveal bento grid, a sticky scroll-driven walk through Al-Fātiḥah, Lenis smooth scrolling. All of it honours reduced-motion.
- Light and dark themes; responsive from 375 px up.

## How others solved it

The design follows established open-source readers:

- **Quran.com**: the tajweed colour scheme, word-by-word hover cards, per-word audio (`audio.qurancdn.com/wbw`) and the verse/reading view split.
- **Quran Recital**: interlinear glosses and word timing sync, where the active word is the one whose `start ≤ t < end`. It also showed how to fall back across several audio CDNs.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # pre-renders all 114 surahs
```

The dataset is committed. To regenerate it from upstream run `npm run data`, which needs network access to GitHub and npm.

## Credits & licences

- Word data, timings and tajweed markup come from the [Quran.com API](https://quran.com) via [ivosetyadi/quran-recital](https://github.com/ivosetyadi/quran-recital) (MIT).
- Translations and transliteration come from [quran-json](https://github.com/risan/quran-json) (CC-BY-4.0), sourced from Tanzil.net and QuranEnc.
- Audio is streamed from Islamic Network CDN and EveryAyah.
- UI components: [Untitled UI React](https://github.com/untitleduico/react) (MIT).
- Fonts: Amiri Quran (OFL) and Inter (OFL).
