# Mishkah — Modern Qurʾān App

## Project Overview

Mishkah (مشكاة) is a reader for the Qurʾān: Uthmani text, translations, word-by-word meanings, colour-coded
tajweed and recitation audio with word-level highlighting. It is fully static: every surah is
pre-rendered from a bundled dataset, and user state (settings, bookmarks, last read) lives in
localStorage. There is no backend and no auth.

## Tech Stack

- **Runtime**: Node 22, npm 10
- **Framework**: Next.js 16 (App Router, React Server Components, Turbopack)
- **Language**: TypeScript (strict)
- **UI**: Untitled UI React components (open source, MIT), built on React Aria Components,
  Tailwind CSS v4. Design tokens live in `styles/theme.css` (brand palette = teal).
- **Motion**: `motion` (Framer Motion) for scroll-linked/reveal animations, `lenis` for smooth scrolling
- **Icons**: `@untitledui/icons` only (enforced by `no-restricted-imports` in `eslint.config.mjs`). Keyboard hints use
  `<Kbd icon={…}>` with Untitled UI icons, not glyphs. Qurʾānic marks (۞ rub el hizb, ۩ sajdah) and the brand/ornament
  SVGs (logo, ayah star, niches) are typography/illustration, not UI icons.
- **Misc**: next-themes (`light-mode` / `dark-mode` classes), sonner (toasts)

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static build of all 114 surahs (runs tsc)
npm run lint
npm run data     # regenerate data/quran + public/data (incl. search index) from upstream sources
npm run build:artifact  # single-page build for the claude.ai-hosted version (dist-artifact/)
```

## Directory Layout

```
app/
  layout.tsx              # fonts (Inter, Amiri Quran — local), providers, header/footer, player bar
  page.tsx                # landing: hero + live reader preview, sources marquee, bento, journey (sticky steps),
                          # Al-Fātiḥah scroll story, stats, surah/juz index, principles, FAQ, closing CTA
  surah/[id]/page.tsx     # reader (generateStaticParams → 114 static pages)
  surah/[id]/[ayah]/page.tsx  # ayah page (SEO): Arabic + tajweed, translation, word by word, tafsir, similar ayat,
                          # prev/next; ~90 popular ayat prebuilt, the rest generated on first request (ISR)
  [lang]/page.tsx         # localized home (/fr …): components/home/home-page.tsx renders the same sections
  [lang]/surah/[id]/…     # localized surah + ayah pages for the 9 translation languages (fr es id tr ur bn ru zh sv):
                          # server-rendered, hreflang-linked, ISR; strings in lib/i18n.ts; ayah pages share
                          # components/quran/ayah-view.tsx + lib/ayah-page.ts with the English route
  juz/[n]/page.tsx        # juzʾ landing (30, static): surahs, ḥizb quarters, page grid, opening words
  page/[n]/page.tsx       # mushaf page landing (604): StaticMushafPage + translation; popular pages prebuilt, rest ISR
  robots.ts, sitemap.ts   # robots + one sitemap per language (/sitemap/en.xml … /sitemap/sv.xml)
  **/opengraph-image.tsx  # share cards via lib/og/og-card.tsx (Satori; Latin only, it cannot shape Arabic)
  library/page.tsx        # progress & reading plan, bookmarks, notes, memorised (UUI Tabs)
  bookmarks/page.tsx      # same view, Bookmarks tab
  globals.css             # Tailwind import, tajweed colour tokens (light + dark), Lenis CSS
components/
  base/, application/, foundations/   # Untitled UI components (vendored, kebab-case files)
  providers/              # Providers (theme, router, MotionConfig), SmoothScroll (Lenis)
  site/                   # header, footer, logo, theme toggle, scroll progress
  home/                   # hero, hero-showcase, sources-marquee, bento-features, journey, fatihah-story, stats,
                          # surah-index, continue-reading, principles, faq, final-cta
  quran/                  # surah-reader, reader-bar (position + Display presets), resume-banner,
                          # reader-tips, juz-divider, surah-end, basmala (opening of each surah), verse-card, word, tajweed-text, reading-view, hifz-panel,
                          # verse-dialogs (note, share image, similar), tafsir-section, similar-ayat, hizb-mark, reader-settings, tajweed-legend,
                          # audio-player-bar, bookmark-list, reciter-avatar (Arabic-initial emblem; `photo` when licensed)
  library/                # library-view (progress, plan, notes, memorised), review-session (/review), offline-card
  site/command-palette    # ⌘K: surah/ayah jump + full-text search (public/data/search.json)
lib/
  quran.ts                # server-only data access (chapters, surah files)
  types.ts                # Verse / Word / Chapter types (compact JSON keys documented there)
  constants.ts            # reciters, translations, tajweed rules, juz starts
  audio.ts                # audio URL builders (ayah + per-word)
  audio-engine.ts         # client audio player + external stores (player, tick)
  settings.ts             # persisted reader settings (view mode: verse | reading | hifz) + display presets
  reader-position.ts      # live "ayah on the reading line" store (reader bar)
  library.ts              # persisted bookmarks, notes, memorised (+ SM-2 reviews), read ayat, daily log, plan, streak
  data-urls.ts            # client data URLs (surah / tafsir / similar) for the Next app and the artifact build
  use-remote.ts           # cached client JSON fetch hook
  create-store.ts         # tiny useSyncExternalStore-based store
data/quran/               # generated: chapters.json, surah/{n}.json
public/data/translations/ # generated: {lang}/{n}.json, fetched on demand
scripts/build-quran-data.mjs, build-search-index.mjs, build-study-data.mjs (tafsir, similar ayat, pages/hizb)
```

Path alias: `@/*` → repo root.

## Data

Generated by `npm run data` — do not hand-edit. The Qurʾān text is non-negotiable: `npm run data` ends with
`scripts/verify-quran-data.mjs` (also `npm run verify:data`), which checks every ayah's plain and tajweed text letter for
letter against the independent quran-json (KFGQPC) text, juzʾ/ḥizb/page/sajdah against quran-meta, translations against
their sources, and Qurʾān text typed into the site's code. Upstream errors are corrected only in the build script
(`PLAIN_CORRECTIONS`, tajweed alignment and `repairTimings` for word-highlight timings in `build-quran-data.mjs`), each one asserted against the upstream original, never in
the generated files. Quote translations verbatim from the shipped translation (including bracketed clarifications). Sources:

- Words, transliteration, English gloss, Husary recitation timings and tajweed markup: derived from
  the Quran.com API via the MIT-licensed `ivosetyadi/quran-recital` dataset.
- Surah metadata, verse transliteration and translations: npm `quran-json@3.1.2` (CC-BY-4.0;
  Tanzil / QuranEnc).
- Tafsir (`public/data/tafsir/{lang}/{n}.json`): Al-Mukhtasar via `spa5k/tafsir_api`. Asbāb al-nuzūl was
  evaluated and excluded (the available edition has contaminated text). No surah introductions: no licensed source.
- Look-alike ayat (`public/data/similar/{n}.json`): `Waqar144/Quran_Mutashabihat_Data` (CC0, 0-based → +1).
- Mushaf page (`p`) and hizb quarter (`q`) per verse: npm `quran-meta`.
- Word audio position (`k`, only when it differs from index + 1; pause marks, ۞ and ۩ take positions; 0 = no recording)
  and the gloss/transliteration check: Quran.com API v4 (`api.quran.com`, cached in `.cache/quran-sources/qurancom`).
- Audio is streamed at runtime: `cdn.islamic.network` (primary) → EveryAyah mirrors (fallback);
  word pronunciation from `audio.qurancdn.com/wbw`. Word-sync highlighting is only available for
  Al-Husary (the reciter the timings were recorded against).

## Brand

Mishkah has its own identity. Do not imitate other Qurʾān apps' branding, layouts or colour schemes.
- Name/tagline/storage prefix live in `lib/brand.ts`; the logo is `components/site/logo.tsx` (lamp in an arch).
- Palette: `brand-*` = midnight indigo, `gold-*` = lantern amber; warm paper (light) / ink (dark) surfaces
  are set in `app/globals.css`.
- Type: `font-display` (Fraunces) for headings, Inter for UI, `font-quran` (Amiri Quran) for Arabic.
- The tajweed colours are Mishkah's own palette (`--tj-*` in `globals.css`), grouped by rule family.

## Untitled UI first

Every control and standard UI pattern uses an Untitled UI component (`components/base`, `components/application`, `components/foundations`):
Button / ButtonUtility / ButtonGroup, Badge, Input, Select, Toggle, Slider, Tabs, Tooltip, Modal, SlideoutMenu,
NavItemBase, Avatar, FeaturedIcon, EmptyState, LoadingIndicator, Dropdown, TextArea, ProgressBar.
Alerts and toasts: the open-source kit has no component for these, so `components/application/alerts/alert.tsx`
(inline) and `components/application/notifications/notification.tsx` (`notify.success/error/warning/info/neutral`,
rendered via sonner's headless `toast.custom`) follow the Untitled UI anatomy, as does `components/application/accordion/accordion.tsx`
(FAQ, on React Aria Disclosure). Never call sonner's `toast()` directly. Before hand-building something, check the
Untitled UI React repo (github.com/untitleduico/react) and vendor the component instead.

The only deliberately custom pieces are Qurʾān-specific: the interlinear `Word` token (a single button whose CSS
hover card stays light enough for 6,000+ words in Al-Baqarah), ayah markers, tajweed text, and the decorative
bento-grid demos and scroll story. Landing-page demos (hero preview, journey panels) are built from UUI Badge,
ButtonGroup, Button and ProgressBar; clickable badges use `AriaButton` (`onPress`) or `BadgeWithButton`, never a native `<button>`. Vendored components keep Untitled UI conventions (kebab-case files,
`Aria*` import aliases); fix overlay stacking by passing `className="z-50"` rather than editing them.

## Code Style

- Follow the Untitled UI conventions in vendored components: kebab-case file names,
  `react-aria-components` imports aliased as `Aria*`, `cx()` from `@/utils/cx` for classes.
- Server Components by default; `"use client"` only for hooks, events, motion, React Aria.
- Never import `data/quran/*` from client components — go through `lib/quran.ts` on the server.
- Use semantic token classes (`bg-primary`, `text-secondary`, `border-secondary`, `bg-brand-solid`…).
  No hard-coded hex in components; tajweed colours are CSS variables in `globals.css`.
- React Aria buttons take `onPress`, not `onClick`.
- Hot paths (verse/word rendering) subscribe to narrow store selectors so only the active ayah
  re-renders during playback. Keep it that way.
- Scroll-linked `useTransform` input ranges must be strictly increasing and within [0, 1]
  (motion accelerates them with WAAPI, which throws otherwise).

## SEO rules

- Every indexable page sets `alternates.canonical` itself (never in the root layout: it would be inherited);
  personal pages (library, review, bookmarks) are `robots: { index: false }` and disallowed in robots.ts.
- Site origin comes from `lib/site.ts` (`NEXT_PUBLIC_SITE_URL`, else Vercel's production domain).
- JSON-LD via `components/seo/json-ld.tsx` + builders in `lib/seo.ts`: WebSite + FAQPage (home), BreadcrumbList + Chapter
  (surah), BreadcrumbList + Quotation (ayah).
- The surah HTML must contain every ayah: verses not yet upgraded to interactive cards render as `PlainVerse`.
- Ayah references link to `/surah/{s}/{a}`; juzʾ dividers/index link to `/juz/{n}`; mushaf page numbers link to `/page/{n}`; famous ayah names live in `lib/ayah-names.ts` (established names only).
- Files read at request time by ISR pages/OG images are listed in `outputFileTracingIncludes` (next.config.ts).
- Languages: English is unprefixed; `/{lang}/…` for LOCALES in `lib/i18n.ts`. Surah and ayah pages (both languages)
  carry `alternates.languages` (`languageAlternates`) and a `LanguageLinks` switcher. Localized pages set `lang`/`dir`
  on their article and `HtmlLang` for the document (never `dir` on html: the English header would mirror).
  Word-by-word glosses are English only; tafsir falls back to English for ur/sv (labelled). `?t={lang}` on a surah
  URL opens the reader with that translation. Surah-name meanings per language come from `chapters.json` `names`.
- Site copy (header, footer, home) lives in `lib/ui-messages/{lang}.ts` (shape = `en.ts`): plain strings with
  `{placeholders}` filled by `fmt()` (lib/ui-format.ts), so a page sends only its language to the client. Home sections
  read it via `useUi()` (UiProvider from HomePage); header/footer get all languages' chrome strings from the layout and
  pick one from the URL (`langFromPath`). Links go through `localizeHref` to stay in the visitor's language; the header
  language menu uses `switchLanguagePath`.
- The language menu (header) pairs a round flag (`components/site/language-flag.tsx`, `country-flag-icons`, MIT) with the
  native name and the name in the visitor's language (`Intl.DisplayNames`). Flags stand for countries, not languages: never
  show one without the language name. Add a string to `en.ts` first, then every locale (tsc enforces the shape).

## Performance rules

- Long surahs render progressively (`lib/use-progressive.ts`: 24 ayat up front, then idle batches as a
  transition). Anything that scrolls to an ayah must `ensure(n)` first (deep links, hashchange, resume, audio follow).
- `Word` keeps its styling in the `.qw*` classes in `globals.css` and mounts its meaning card on first hover/focus;
  don't move long utility lists back onto it or pre-render cards.
- On-demand UI is code-split with `React.lazy` and mounted on first use: ⌘K dialog, verse dialogs, reader-settings
  panel, audio player bar. Keep the light host (store + trigger) separate from the heavy content file.
- Animations use `m.*` under `<LazyMotion features={loadMotionFeatures} strict>` — never import `motion` components.
- Above-the-fold entrances are CSS (`.enter*` in `globals.css`); LCP text (hero headline/intro, surah names) must not
  start at opacity 0 — use `.enter-visible` / `.enter-word-visible` / `.enter-sharpen`.
- Fonts: Fraunces and Amiri are split by `unicode-range` and all subsets are preloaded (a late swap of the
  Latin-Extended or Amiri-Latin face shifted the layout, CLS 0.39). Lists of many links use `prefetch={false}`.

## Reading experience principles

- The Arabic text leads; everything else (translation, glosses, controls) is quieter and optional.
- Always show where the reader is: surah, ayah and juzʾ in the reader bar; juzʾ dividers and sajdah (۩) badges in the text.
- Prefer presets (Read / Study / Arabic only) over exposing every switch; detailed toggles live in Settings.
- The Basmala is Qurʾān text, not a page title: it opens the reading (verse and mushaf views) using the words
  of 1:1 (tajweed, meanings, word audio), is absent for Al-Fātiḥah (it is ayah 1) and replaced by a note for At-Tawbah.
- The surah index is Mishkah's own: arched niches (Meccan = gold, Medinan = indigo) where reading
  progress rises as lantern light, plus a book-style Contents view. Don't revert to generic list cards.
- Respect continuity: offer to resume, end each surah with progress and the next surah.
- Mushaf view = printed-page density: ayat run on in justified lines (last line centred), dense `Word`s one size below
  verse cards, one page sheet per row (no side-by-side spread) with the arch page-number medallion at the foot.
  Don't go back to one block per ayah.
- The mushaf page header is not sticky, and pages don't animate in.
- The text starts high: a compact surah header, first-visit tips as one dismissible `Alert`, and verse cards whose header
  keeps the ornamental rub el ḥizb medallion with the linked `2:255` (`VerseNumber compact`: no "Ayah" label).
- On phones the header bar holds only logo, search, Read and the menu; language and theme live in the slideout footer.
- Anything date-dependent on a prerendered page renders only after mount (the build date isn't today: hydration error).
- Surah names in copy use the dataset's plain transliteration (`Al-Fatihah`, `An-Nur`, `Ya-Sin`), the same as
  `chapters.json` `nameSimple`; diacritics stay for terms and titles (Qurʾān, Juzʾ, Ḥizb, Āyat al-Kursī, Al-Mukhtaṣar).
- Nothing is greyed out to show focus (reader, mushaf, home scroll story): the current ayah gets a soft gold ground.
- Page headers share one anatomy (surah, localized surah, juzʾ): number medallion, title, subtitle, badges, Arabic name beside.
- Empty data shows an Untitled UI `EmptyState` with one next step, not zeros and empty charts.
- The audio player (`audio-player-bar-content.tsx`) is built from UUI Button/ButtonUtility/Slider/Dropdown/Badge: reciter
  disc with a turning ring while playing, morphing play button (spinner while loading), live "now reciting" word for the
  word-synced reciter (`AudioVerse.a`), surah progress along the top edge, speed menu; phones get two rows.

## Accessibility

- Keyboard reachable controls with visible focus (`outline-focus-ring`).
- Arabic text gets `lang="ar" dir="rtl"`; Urdu translation renders RTL.
- Animations respect `prefers-reduced-motion` (MotionConfig `reducedMotion="user"`, Lenis disabled).

## Git Workflow

- Conventional commit subjects (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Push with `git push -u origin <branch>`; only open a PR when asked.
- Don't commit `.env*`, `.next/`, `.cache/`, `node_modules/`.
