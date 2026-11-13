# Data Product Platform — Design

Date: 2026-11-13
Status: awaiting approval

Lines marked **[call]** are choices made by the author of this document, not
decisions the project owner made. They are open to correction.

## 1. Intent

Demonstrate the value of a platform approach to data products by showing the
whole chain working for real, in one sitting: a data product is authored, its
data contract is defined, it is deployed, and it appears in the catalog.

The owner's words: "I want to demonstrate the value of it and I want end to end
process. From data product authoring, data contract, deployments," with
OpenMetadata as the catalog.

The audience is people deciding whether a platform approach to data products is
worth adopting **[call]**. What has to land with them:

- A data product is a self-contained unit, created from a template in minutes.
- Open standards (ODPS, ODCS) are the source of truth; everything else is derived.
- The contract is enforced, not just documented.
- The catalog fills itself.

Inspiration: Entropy Data (formerly Data Mesh Manager) — a data product
marketplace built on ODCS and ODPS with Git-connected products.

## 2. Goals

1. **Live authoring to catalog.** From the UI, a presenter creates a new data
   product and, with no manual step outside the UI and GitHub, it ends up as
   queryable tables in Trino, a scheduled DAG in Airflow, and a data product in
   OpenMetadata with its domain, ports, contract and lineage. Target: under
   10 minutes from first click to catalog entry **[call]**.
2. **Self-contained product units.** Each product is one folder holding its ODPS
   descriptor, its ODCS contracts, and its transformation code, generated from a
   template.
3. **Git is the source of truth.** The UI and OpenMetadata hold nothing that
   cannot be rebuilt from the repository.
4. **Contract enforcement, visibly.** A breaking contract change is blocked in
   the pull request, with the affected downstream products named. Data that
   violates the contract turns the product's status red in the UI and in
   OpenMetadata.
5. **One-machine stack, real GitHub loop.** `docker compose` brings up
   everything, including a self-hosted GitHub Actions runner, so real workflows
   deploy into the local stack.
6. **Portable to a hosted environment later** by changing configuration
   (endpoints, runner labels, secrets), not code.

## 3. Non-goals (first version)

- Login, SSO, roles or permissions in the UI.
- Access requests, data usage agreements, approvals workflow.
- One repository per data product (the layout allows lifting a folder out later).
- Production hardening: high availability, TLS, secrets management, backups.
- Retiring or deleting products (create and update only).
- Streaming ports, APIs as ports, semantic layer, cost reporting.
- The Linux Foundation "Open Data Product Specification" — we use Bitol's
  Open Data Product Standard.
- Real business data. All data is synthetic.

## 4. Anti-goals

These would make the demo a failure even if it technically works:

- **Faked steps.** No mocked deployments, canned statuses, or screenshots
  standing in for a system.
- **A second source of truth.** No database behind the UI. No hand edits in
  OpenMetadata that the next publish would not reproduce.
- **Bespoke metadata formats.** Platform-specific settings live inside the
  standards' own extension points (`customProperties`), not in side files with
  an invented schema.
- **Platform logic copied into products.** Products hold declarations and
  transformation code. Pipeline logic lives in the platform so that improving
  the platform improves every product.
- **Manual glue during the demo.** No "now I run this script in a terminal"
  between clicking Create and seeing the catalog entry. (Injecting bad source
  data in demo step 4 is done from a terminal; that simulates an upstream
  fault, it is not platform glue.)

## 5. Constraints

- Repository: `novusopt/ClearstreamOneModel`. It currently holds a one-commit
  Next.js car-marketplace scaffold, which this work replaces (owner did not
  object when this was proposed). `CLAUDE.md` is rewritten for the new project.
- The repository has no `main` branch today; its default branch is
  `claude/modern-car-sales-ui-puab8`. GitHub only runs `workflow_dispatch` and
  default-branch `push` workflows from the default branch, so the GitHub loop
  needs a `main` branch set as default. Creating it is the owner's step; the
  build work is delivered on `ccr-9b52548b-catyl9`.
- One machine with about 16 GB RAM must run the whole stack.
- Open-source components only. Versions are pinned.
- Self-hosted runners execute whatever a workflow says. The repository must be
  private, or workflows on pull requests from forks must be disabled.
- A GitHub token is required at demo time: one for registering the runner, one
  for the UI (contents, pull requests, actions, workflows: read/write). No
  third credential is stored as an Actions secret (see 7.5).
- **Open — presenting machine.** Operating system, CPU architecture and how
  much memory Docker actually gets are not yet known. On a 16 GB Mac, Docker
  gets noticeably less than 16 GB, which may force slimming the stack and
  affects image choice (arm64).
- Standards versions: ODCS v3.1.0, ODPS (Bitol) v1.0.0 **[call]**. OpenMetadata
  2.0.3 or later, because ODCS import with quality rules needs it.

## 6. Approaches considered

| | Approach | Trade-off |
|---|---|---|
| 1 | **One-machine stack with the real GitHub loop.** Docker Compose runs Trino, Airflow, OpenMetadata, the UI and a self-hosted Actions runner. | Every step is real. Needs a 16 GB machine and a GitHub token. Presented from that machine, not a shared link. |
| 2 | **Hosted environment.** Same stack on a persistent VM or cluster, public UI. | Anyone can click through. Needs infrastructure and secrets from the owner; much of the effort becomes operations. |
| 3 | **Lightweight.** Actions run against throwaway engines inside the runner; no persistent stack. | Cheap. Nothing to click through afterwards; OpenMetadata barely exercised. Misses the end-to-end bar. |

**Picked: approach 1** (owner's decision), built so that moving to approach 2
is a configuration change.

## 7. How it works

```
UI wizard ──► scaffold workflow ──► pull request
                                    (ODPS + ODCS + dbt project, from template)
                                         │
                       validate workflow │  spec validation, breaking-change check,
                                         │  dbt build in a PR schema, contract test
                                         ▼
                                       merge
                                         │
                         deploy workflow │
          ┌──────────────────────────────┼─────────────────────────────┐
          ▼                              ▼                             ▼
   Trino (dbt build)           Airflow (DAG per product)      OpenMetadata (domain,
                               dbt build → contract test      product, ports, contract,
                               → publish result               lineage, test results)
          └──────────────────────────────┬─────────────────────────────┘
                                         ▼
               UI: product status, contract results, links to each system
```

### 7.1 Repository layout **[call]**

```
template/                  product template (Copier)
products/<domain>/<product>/
  dataproduct.odps.yaml    ODPS descriptor
  contracts/<port>.odcs.yaml   one ODCS contract per output port
  dbt/                     dbt project for this product
  README.md
  .copier-answers.yml      records template version, enables upgrades
platform/
  cli/                     `dpctl` — Python CLI used by workflows, Airflow and humans
  airflow/                 DAG factory
  schemas/                 pinned ODCS and ODPS JSON Schemas
.github/workflows/         scaffold, validate, deploy
stack/                     docker-compose, engine config, seed data, runner
ui/                        Next.js + Untitled UI app
docs/
```

One repository, one folder per product **[call]**. Workflows are path-filtered
so only changed products are validated and deployed. Nothing outside a product
folder is needed to understand the product, so a folder can later move to its
own repository.

### 7.2 The product unit

- **`dataproduct.odps.yaml`** — name, domain, owner/team, description, status,
  input ports (each referencing another product's output contract by id),
  output ports (each referencing a contract in `contracts/`).
- **`contracts/<port>.odcs.yaml`** — schema (columns, types, required, unique,
  primary key, classification such as PII), quality rules, SLA properties, and
  a `servers` entry pointing at the Trino location of the port.
- **`dbt/`** — a complete dbt project (dbt-trino). Sources are the input ports;
  models produce the output ports.
- Platform settings — flavour (`dbt-trino`), schedule, target schema — go in
  ODPS `customProperties` **[call]**.
- Naming **[call]**: Trino schema is `<domain>_<product>`; each output port is
  one table in that schema, named after the port.

### 7.3 Template

Copier **[call]**, chosen over Cookiecutter because it can re-apply a newer
template version to existing products (`copier update`), which is the
platform's argument for templates in the first place.

Flavours: `dbt-trino` first. `spark` second (section 9).

The template renders the ODPS file, the contract(s), the dbt project, and the
README from one answers payload (JSON). The same payload shape is what the UI
wizard produces.

### 7.4 Platform CLI — `dpctl`

A small Python CLI so that CI, Airflow and a developer's terminal all run the
same code. Commands:

- `validate <product>` — JSON Schema validation of ODPS and ODCS files, plus
  cross-file rules: every output port has a contract file; every input port
  resolves to an existing product's output contract; names follow the
  conventions; the dbt project produces a model for every output port.
- `breaking <product> --base <ref>` — compares each contract with its version
  on the base branch (using datacontract-cli's comparison) and lists breaking
  changes together with the downstream products whose input ports reference
  the contract.
- `test <product> [--schema <override>]` — runs the contract against Trino
  with datacontract-cli; emits a machine-readable result.
- `publish <product>` — pushes to OpenMetadata (section 7.7).
- `scaffold --answers <file>` — runs Copier.

datacontract-cli is the contract engine (lint, test against Trino, compare)
**[call]**. It is open source, speaks ODCS natively, and is the engine Entropy
Data itself uses.

### 7.5 GitHub Actions workflows

- **`scaffold`** (`workflow_dispatch`, input: one JSON answers payload) — runs
  `dpctl scaffold` and pushes branch `product/<domain>-<product>`. It does not
  open the pull request: a PR opened with the workflow's built-in token would
  not trigger `validate`, and organisations often forbid Actions from opening
  PRs. Instead the UI, using its own token, opens the PR as soon as the branch
  appears **[call]**. The deterministic branch name is how the UI finds it.
- **`validate`** (pull requests touching `products/**` or `template/**`) — for
  each changed product: `dpctl validate`; `dpctl breaking`; dbt build into an
  isolated schema `pr_<number>_<domain>_<product>`; `dpctl test` against that
  schema; a summary comment on the PR. The PR schema is dropped when the PR
  closes.
- **`deploy`** (push to `main` touching `products/**`) — for each changed
  product: dbt build into the product schema; `dpctl test`; `dpctl publish`;
  make the new product visible to Airflow.

Jobs that need the stack run on the self-hosted runner (label `dp-stack`).
Whether pure file validation runs on GitHub-hosted runners is the builder's
choice.

Upstream/downstream order on deploy: products are deployed in dependency order
derived from input ports.

**What "blocked" means [call].** The `validate` check goes red and the UI's
Merge button is disabled while it is red. Making the check *required* through
branch protection is an optional owner step described in the runbook (it
depends on the repository's plan and visibility). An intentional breaking
change is allowed when the contract's major version is bumped in the same PR;
the check then passes with a warning that still names the affected consumers.

### 7.6 The stack (`stack/`)

One `docker compose` project, started with a single command:

| Service | Role |
|---|---|
| Trino | query engine; Iceberg tables |
| Iceberg catalog + S3-compatible object store | table storage, shared with Spark later **[call]** |
| Airflow 3 | orchestration; one DAG per product, generated |
| OpenMetadata server + its database + search index | catalog |
| GitHub Actions runner | executes workflows inside the stack's network |
| UI | the management app |

- OpenMetadata's own ingestion container is left out **[call]** to save
  memory; `dpctl publish` runs metadata ingestion itself using the
  `openmetadata-ingestion` package.
- **Airflow DAG factory** (`platform/airflow/`): discovers every
  `dataproduct.odps.yaml` on `main` and creates one DAG per product:
  dbt build → contract test → publish result to OpenMetadata. Schedule comes
  from the product's `customProperties`. A downstream product's DAG is
  triggered by its upstream's output (Airflow assets) **[call]**; the builder
  may fall back to plain schedules if that proves fiddly.
- **Seed data:** synthetic raw tables loaded into a `raw` schema at startup.
- Commands: bring up, tear down, reset to the demo's starting state, inject
  contract-violating rows (for demo step 4).
- **Reset covers GitHub too [call]**, so the demo can be rehearsed and
  repeated. Reset removes the live-created product with a revert commit on
  `main` (history is never rewritten), closes its pull requests, deletes its
  branches, drops its Trino schemas and removes its OpenMetadata entities. This
  is a demo tool; retiring products remains a non-goal as a product feature.

### 7.7 OpenMetadata mapping

OpenMetadata is strictly downstream: written by `dpctl publish`, never edited
by hand.

| In Git | In OpenMetadata |
|---|---|
| ODPS domain | Domain |
| ODPS data product | Data Product (`<domain>.<product>`), with owner and description |
| Output port | Output port → the Trino table (ingested from Trino first) |
| Input port | Input port → the upstream product's table |
| ODCS contract | Data Contract on the output table, via OpenMetadata's ODCS import |
| ODCS classification (e.g. PII) | Tags on columns |
| Input → output relationship | Lineage between tables |
| Contract test result (from CI or Airflow) | Data Contract result on the contract |

Enforcement is done by datacontract-cli in CI and Airflow, and results are
pushed to OpenMetadata **[call]**. OpenMetadata's own scheduled contract
validation is not relied on.

### 7.8 The UI (`ui/`)

Next.js 16 (App Router), React 19, Tailwind v4 — the stack already in the
repository — with **Untitled UI React** components (React Aria based) replacing
the scaffold's Radix primitives **[call]**. Untitled UI's open-source tier is
MIT and ships a Next.js starter on exactly this stack.

Next.js is used rather than a browser-only React app because the UI needs a
server side to hold the GitHub and OpenMetadata tokens **[call]**. There is no
database: every screen reads from GitHub (files on `main`, pull requests,
workflow runs) and OpenMetadata (contract results, entity links).

Screens:

1. **Products** — a card per product: name, domain, owner, status, ports,
   contract status badge, last deployment. Filter by domain and status.

   ```
   ┌ Settlement Instructions ─────────── ● Active ┐
   │ settlement · Team Post-Trade                 │
   │ out: instructions        contract ✔ passing  │
   │ deployed 2h ago                              │
   └──────────────────────────────────────────────┘
   ```

2. **Product detail** — overview from the ODPS file; ports with a contract
   viewer (schema table, quality rules, SLA); a small lineage picture
   (inputs → product → outputs); deployment history (workflow runs); contract
   test history; links out to the GitHub folder, the Airflow DAG, the
   OpenMetadata page, and a sample Trino query.

3. **New product wizard**
   1. Basics — name, domain, owner, description.
   2. Input ports — pick from existing products' output ports.
   3. Output port and contract — columns, types, required/unique, PII
      classification, quality rules.
   4. Transformation — a SQL editor for the output model, prefilled with a
      `select` over the chosen input ports **[call]**. Richer dbt work happens
      on the PR branch in an editor, as usual.
   5. Review — the generated YAML, then **Create**.

   After Create, the wizard becomes a progress view that follows the real
   pipeline: PR opened → checks → merge → deploy → in catalog, each step
   linking to the real thing. Merge can be pressed from the UI **[call]** so
   the presenter stays in one place; merging on GitHub works equally.

4. **Edit contract** — form and YAML side by side on an existing product.
   Saving opens a pull request; the screen then shows the breaking-change
   verdict from CI.

The wizard creates products through the `scaffold` workflow (so the template
has exactly one implementation). Contract edits commit the changed ODCS file
to a branch directly through the GitHub API.

### 7.9 Example products **[call]**

Synthetic securities post-trade data, guessed from the repository's name and
trivially swappable:

- `settlement/settlement-instructions` — source-aligned; cleans raw instructions.
- `settlement/settlement-fails-daily` — consumer-aligned; consumes the first.
- Created live in the demo: `settlement/counterparty-fail-rates`, consuming
  the second.

## 8. The demo script (acceptance)

The build is done when this runs start to finish without leaving the UI,
GitHub, and the linked systems:

1. **Start.** Stack is up; the UI shows two live products with passing
   contracts; both are in OpenMetadata with ports, contracts and lineage.
2. **Create.** Presenter builds `counterparty-fail-rates` in the wizard. A PR
   appears; checks go green; merge; deploy runs. The product is queryable in
   Trino, has a DAG in Airflow, and is in OpenMetadata under its domain with
   input port, output port, contract and lineage.
3. **Breaking change.** Presenter removes a column from the
   `settlement-fails-daily` contract in the UI. The PR check fails and names
   `counterparty-fail-rates` as the affected consumer.
4. **Bad data [call on the details].** From a terminal, contract-violating
   rows are injected into the raw data behind `settlement-instructions`. The
   presenter triggers that product's DAG from the Airflow UI. Its contract
   test fails; `settlement-instructions` turns red in the UI and in
   OpenMetadata; the downstream DAGs do not run, so the bad data does not
   propagate. Reset restores the clean data.

## 9. Phasing

1. **Core loop** — stack, template (`dbt-trino`), `dpctl`, three workflows,
   OpenMetadata publish, UI products list + detail + wizard. Demo steps 1–2.
2. **Enforcement** — breaking-change check with consumer impact, contract
   editor, bad-data path, contract history. Demo steps 3–4.
3. **Breadth** — `spark` template flavour with one example product writing to
   the same Iceberg catalog; a template-upgrade workflow that opens
   `copier update` PRs across all products.

Each phase leaves a working demo.

## 10. Left to the builder

- Exact pinned versions of every component, and which Iceberg catalog and
  object store implementation to use.
- How Airflow sees the merged products (shared checkout volume vs. Airflow's
  Git DAG bundle) and how dbt is invoked inside the DAG.
- How lineage is produced (dbt artifacts ingestion vs. direct lineage calls).
- How ODPS owners/teams map to OpenMetadata users/teams.
- Internal structure of `dpctl` and of the UI's server layer; test strategy.
- Whether file-only validation runs on GitHub-hosted runners.
- Memory tuning so the stack fits in 16 GB.
- Mechanism for the UI to follow a dispatched workflow run to its PR.

## 11. Verification notes

The cloud session this is built in can run Docker (about 15 GB RAM) and pull
images, so the stack, `dpctl`, the template, dbt builds, contract tests,
OpenMetadata publishing and the UI can all be exercised there. What cannot be
exercised there without the owner: registering the self-hosted runner and the
default-branch-only triggers (`workflow_dispatch`, push to `main`). Those need
the owner's token and a `main` default branch, and are verified on the owner's
machine using a written runbook.
