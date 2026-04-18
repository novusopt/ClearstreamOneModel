# Clearstream — Modern Car Marketplace

<!--
MAINTENANCE NOTES
- Keep this file under ~200 lines. Long CLAUDE.md files reduce adherence and eat context.
- Add a rule when: (a) Claude made the same mistake twice, (b) a reviewer caught something
  Claude should have known, (c) a new contributor would need the same context.
- Prefer concrete, verifiable rules ("use 2-space indent") over vague ones ("write clean code").
- Put personal overrides in CLAUDE.local.md (gitignored) — not here.
- HTML comments are stripped before injection, so they don't cost tokens.
- Reference: https://code.claude.com/docs/en/memory
-->

## Project Overview

Clearstream is a buyer-side car marketplace: home, listings with URL-driven filters, car detail
pages, and an inquiry dialog. It is a self-contained demo backed by a local JSON file — there
is no real backend, no auth, no seller flow. The goal is a polished, accessible, responsive UI
that a real API can slot into later without reshaping components.

## Tech Stack

- **Runtime**: Node 22, npm 10
- **Framework**: Next.js 16 (App Router, React Server Components, Turbopack dev)
- **Language**: TypeScript (strict)
- **UI**: React 19, Tailwind CSS v4 (CSS-first config via `@theme` in `app/globals.css`)
- **Primitives**: Radix UI (Dialog, Select, Slider, Label, Tabs, Checkbox, Dropdown, Slot)
- **Forms**: react-hook-form + zod (via `@hookform/resolvers`)
- **Misc**: next-themes, framer-motion, sonner (toasts), lucide-react, class-variance-authority,
  clsx, tailwind-merge
- **Data**: `data/cars.json` (~12 cars), validated at import time via a zod schema

## Commands

```bash
npm install            # install deps
npm run dev            # dev server → http://localhost:3000  (Turbopack)
npm run build          # production build (must succeed with no type errors)
npm start              # serve production build
npm run lint           # eslint (flat config in eslint.config.mjs)
```

There is no separate typecheck script — `next build` runs `tsc` as part of its pipeline.

## Directory Layout

```
app/                      # App Router entries
  layout.tsx              # root shell, fonts, ThemeProvider, Header/Footer, Toaster
  page.tsx                # home
  globals.css             # Tailwind v4 import + CSS custom properties (light + dark)
  cars/
    page.tsx              # listings (server component, reads searchParams)
    [id]/page.tsx         # detail (uses generateStaticParams)
components/
  ui/                     # small, stateless primitives (button, card, input, dialog, ...)
  site/                   # Header, Footer, ThemeProvider, ThemeToggle
  home/                   # Hero, CategoryTiles, FeaturedCarousel, HowItWorks, CtaBanner
  cars/                   # CarCard, CarGrid, CarFilters, CarGallery, SpecGrid,
                          # SellerCard, SimilarCars, SortDropdown, SearchBar, InquiryDialog
lib/
  cars.ts                 # getCars / getCarById / getFeaturedCars / getSimilarCars / getMakes
  filters.ts              # parseSearchParams, stateToSearchParams, applyFilters (pure)
  schemas.ts              # zod schemas: carSchema, inquirySchema (+ derived TS types)
  constants.ts            # BODY_TYPES, FUEL_TYPES, TRANSMISSIONS, SORT_OPTIONS, bounds
  utils.ts                # cn(), formatPrice, formatMiles, formatRelative
data/cars.json            # mock inventory (the only source of truth)
public/                   # static assets
```

Path alias: `@/*` → repo root (see `tsconfig.json`).

## Code Style

- 2-space indent, double quotes in TS/TSX (Next default), trailing commas, semicolons on.
- **Never `any`** — if types are unclear, introduce a `type`/`interface` in `lib/schemas.ts` or
  next to the component that owns it.
- Components: `PascalCase.tsx`. Utilities: `camelCase.ts`. Constants: `UPPER_SNAKE_CASE`.
- Prefer **Server Components** by default; add `"use client"` only when the file uses hooks,
  event handlers, Radix primitives, or browser APIs.
- Data fetching: call `lib/cars.ts` helpers from server components. Never import `data/cars.json`
  in a client component — always go through `lib/cars.ts`.
- Styling: Tailwind classes only, using the CSS-variable tokens (`bg-background`, `text-foreground`,
  `border-border`, etc.). No inline `style={{ ... }}` unless dynamic values require it.
- Use `cn()` from `@/lib/utils` whenever joining conditional classes.
- Icons: `lucide-react`; size via Tailwind (`className="h-4 w-4"`), not the `size` prop.
- Forms: always `react-hook-form` + `zodResolver(<schema>)`. Schemas live in `lib/schemas.ts`.
- Filters: the URL is the source of truth. Components read via `useSearchParams` and write via
  `router.replace(pathname + "?" + qs, { scroll: false })`. Do not mirror filter state in React
  state except for uncontrolled inputs that debounce into the URL.

## Accessibility & UX

- All interactive elements must be keyboard-reachable and show a visible focus ring
  (`focus-visible:ring-2 focus-visible:ring-ring`).
- Images: always include `alt` text (car make + model + trim).
- Motion: wrap animations so they respect `prefers-reduced-motion` (framer-motion does this
  automatically; keep it that way).
- Color: don't hard-code hex — use the token classes so dark mode works.
- Dialogs and Sheets come from Radix — don't roll custom modals.

## Git Workflow

- Active branch: `claude/modern-car-sales-ui-puab8`. Do not push to `main`.
- Conventional commit subjects (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Keep commits focused; small PRs over mega-PRs.
- Push with `git push -u origin <branch>`. Retry on network errors with exponential backoff.
- Only open a PR when the user explicitly asks.

## Things Claude Should NOT Do

- Don't force-push, `git reset --hard` shared branches, or `git clean -fd` without asking.
- Don't `--no-verify` past a failing hook — fix the underlying issue.
- Don't add a real backend, auth, payment flow, or database. Scope is buyer-side only.
- Don't swap the tech stack (Next.js + Tailwind v4 + Radix is locked in).
- Don't install a UI kit that overlaps with what's already here (no MUI, Chakra, Mantine, etc.).
- Don't commit `.env*`, build artifacts, `node_modules/`, or editor-specific files.
- Don't put mock data anywhere except `data/cars.json`; everything reads through `lib/cars.ts`.
- Don't delete or rename files without checking imports first.

## Verification Checklist (run before saying a change is done)

1. `npm run build` completes with no type or lint errors.
2. `npm run dev` → the touched pages render without console errors at 375 / 768 / 1440 px.
3. Filters: toggling any filter updates the URL and grid; empty state appears when nothing matches.
4. Detail page: gallery thumbnails swap the main image; inquiry dialog opens; empty submit shows
   zod errors; valid submit shows a success toast.
5. Theme toggle flips light/dark without a flash on reload.

## Not In Scope

Auth, payments, real backend, seller/dealer flows, saved favorites persistence, image uploads,
reviews, messaging, i18n, analytics, SEO beyond basic metadata.
