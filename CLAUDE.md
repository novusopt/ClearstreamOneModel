# Data Product Platform

## Project overview

A platform for building data products as self-contained units, on open standards: the Open Data
Product Standard (ODPS v1.0.0, Bitol) for the product spec and the Open Data Contract Standard
(ODCS v3.1.0, Bitol) for data contracts. The spec and the contract are the source; everything else
(dbt schema, Airflow DAG, OpenMetadata entries, policies' inputs) is derived from them.

The full design, including what is decided and what is still open, is in
`docs/superpowers/specs/2026-11-13-data-product-platform-design.md`. Read it before changing scope.

**What exists today:** the authoring UI in `ui/`, running on a mock backend. The stack (Trino,
Airflow, OpenMetadata, OPA), the templates, the CLI and the GitHub workflows are designed but not
built.

## Repository layout

```
docs/superpowers/specs/     the design
ui/                         Data Product Studio — Next.js app
  src/app/                  routes: /products, /products/new, /products/[domain]/[name],
                            /products/[domain]/[name]/contracts/[port], /map, /api/*
  src/components/app/       the Studio's own components
  src/components/{base,application,foundations}/   vendored Untitled UI React (MIT) — keep upstream form
  src/lib/
    types.ts                domain model (ODPS/ODCS-shaped)
    standards/              serialize to ODPS/ODCS, validate against the official JSON Schemas
    backend/                the Backend interface and its mock implementation + seed data
    policies.ts             policy evaluation (stand-in for OPA)
    lifecycle.ts            lifecycle states, transitions and gates
    breaking.ts             contract diff and semantic version bump
  src/styles/theme.css      vendored Untitled UI theme; Studio overrides live in app/globals.css
```

## UI tech stack

- Node 22, npm 10. Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4.
- Untitled UI React components (built on React Aria). Its installer needs untitledui.com; when that
  is unreachable, vendor files from `raw.githubusercontent.com/untitleduico/react/main/`.
- `@xyflow/react` + dagre for the lineage canvas, CodeMirror for code panels, `yaml` and `ajv` for
  the standards, `sonner` for toasts, `vitest` for tests.
- This Next.js version differs from older ones: route `params` and `searchParams` are Promises.
  Check `ui/node_modules/next/dist/docs/` before using an unfamiliar API.

## Commands (run in `ui/`)

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # must pass with no type errors
npm run lint
npm test           # vitest: standards validation, policies, lifecycle, breaking changes
```

## Rules for the UI

- **All data goes through `src/lib/backend`.** Server components call `backend.*`; client components
  call `src/lib/api.ts`, which talks to the route handlers. Never import seed data into a screen.
  The real backend (Git + OpenMetadata) will replace the mock behind the same functions.
- **Anything simulated is labelled as such in the UI** (pipeline runs, quality results).
- **Generated documents must validate.** `npm test` checks every seeded product and contract against
  the official ODPS and ODCS JSON Schemas; keep that passing when changing `serialize.ts`.
- **Vocabulary is defined in the catalog, mapped in the contract.** Business terms go in
  `authoritativeDefinitions`, the confidentiality level in `classification`, everything else
  (PII, tier, regulatory) in `tags`.
- Platform-specific settings go in the standards' `customProperties`, never in side files.
- Styling: Tailwind classes with the Untitled UI semantic tokens (`bg-primary`, `text-tertiary`,
  `border-secondary`, `utility-<colour>-<step>`). Check a token exists in `theme.css` before using it.
- Server components cannot pass component functions (such as icons) to client components; pass a
  rendered element (`iconLeading={<Plus data-icon />}`) or make the caller a client component.
- Never `any`. 2-space indent, double quotes, semicolons, trailing commas.
- Every interactive element is keyboard-reachable with a visible focus ring; icon-only buttons have
  an `aria-label`.

## Git workflow

- Work on the branch the session assigns. Never push to the default branch.
- Conventional commit subjects (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Only open a pull request when asked.
- No force-push, no `--no-verify`. Do not commit `.env*`, build output or `node_modules/`.

## Before saying a change is done

1. `npm run build`, `npm run lint` and `npm test` pass in `ui/`.
2. The touched screens render without console errors at 375 and 1440 px.
3. The flows still work: create a product in the wizard; edit a contract and save; a breaking change
   names its consumers; a draft shows what it lacks for Active; deprecate asks for a sunset date.
