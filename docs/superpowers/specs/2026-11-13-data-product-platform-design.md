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

- A data product is a self-contained unit, created from a choice of templates
  in minutes.
- The data product spec (ODPS) and the data contract (ODCS) are the source.
  They are published wherever they are needed; nothing downstream is
  maintained by hand. (Owner's requirement.)
- The contract carries the mapping from columns to business meaning, and that
  mapping is linked in OpenMetadata. (Owner's requirement.)
- Lineage is captured in OpenMetadata automatically. (Owner's requirement.)
- Every product moves through one standardized lifecycle. (Owner's requirement.)
- The contract is enforced, not just documented.

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
7. **Publish everywhere from the two source files.** dbt schema and tests,
   the Airflow DAG, and every OpenMetadata entity are generated from the ODPS
   and ODCS files on each deploy, with no manual step. New publish targets can
   be added without touching products.
8. **Semantics linked.** Each contract column can point at a business term;
   the publish step attaches that term to the column in OpenMetadata, so the
   term's page shows every product that carries it.
9. **Automatic lineage** in OpenMetadata at product, table and column level,
   refreshed on every deploy and run.
10. **A template catalog** with several template types, chosen in the wizard.
11. **A standardized lifecycle** (Proposed → Draft → Active → Deprecated →
    Retired) stored in the spec, enforced by the pipeline, visible in the UI
    and in OpenMetadata.

## 3. Non-goals (first version)

- Login, SSO, roles or permissions in the UI.
- Access requests, data usage agreements, approvals workflow.
- One repository per data product (the layout allows lifting a folder out later).
- Production hardening: high availability, TLS, secrets management, backups.
- Deleting products or their data. A Retired product stays in Git and in the
  catalog as history.
- Streaming ports, APIs as ports, semantic layer, cost reporting.
- The Linux Foundation "Open Data Product Specification" — we use Bitol's
  Open Data Product Standard.
- Real business data. All data is synthetic.

## 4. Anti-goals

These would make the demo a failure even if it technically works:

- **Faked steps.** No mocked deployments, canned statuses, or screenshots
  standing in for a system.
- **A second source of truth.** No database behind the UI. No hand edits to
  product metadata in OpenMetadata; the next publish would overwrite them.
  (The business glossary is the one thing governed in OpenMetadata itself,
  see 7.8.)
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
templates/<id>/            template catalog (Copier), one folder per template type
products/<domain>/<product>/
  dataproduct.odps.yaml    ODPS descriptor
  contracts/<port>.odcs.yaml   one ODCS contract per output port
  dbt/ or spark/           transformation code, per template
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
- **Transformation code** — a complete dbt project (`dbt/`) or a Spark job
  (`spark/`), depending on the template. Inputs are the input ports; outputs
  are the output ports. The dbt schema file (columns, tests) is generated from
  the contract, not written by hand.
- Platform settings — template, engine, schedule, target schema — go in
  ODPS `customProperties` **[call]**.
- Lifecycle state is the standard `status` field of the ODPS file, mirrored in
  each contract's `status` (section 7.10).
- Semantic mappings are the standard `authoritativeDefinitions` entries on
  contract columns (section 7.8).
- Naming **[call]**: Trino schema is `<domain>_<product>`; each output port is
  one table in that schema, named after the port.

### 7.3 Template catalog

The platform offers several template types. Each lives in its own folder under
`templates/<id>/` with a small manifest (name, description, product type,
engine, the questions it asks). The UI reads the list from the repository, so
adding a template is adding a folder.

Templates shipped **[call]**:

| Template | Product type | Engine | What it produces |
|---|---|---|---|
| `source-aligned-dbt` | source-aligned | dbt on Trino | Cleans a raw source table and exposes it as an output port. No input ports. |
| `aggregate-dbt` | aggregate / consumer-aligned | dbt on Trino | Combines other products' output ports into a new output port. |
| `spark-iceberg` | aggregate, heavier processing | PySpark on Iceberg | A Spark job reading input ports and writing an output port. Spark runs in local mode; no extra cluster service. |

Every template renders the same ODPS and ODCS files and differs only in the
transformation code and how it is run. The ODPS `customProperties` record
which template and engine a product uses, and the pipeline picks the matching
build step.

Tooling: Copier **[call]**, chosen over Cookiecutter because it can re-apply a
newer template version to existing products (`copier update`), which is the
platform's argument for templates in the first place.

A template renders from one answers payload (JSON). The same payload shape is
what the UI wizard produces.

### 7.4 Platform CLI — `dpctl`

A small Python CLI so that CI, Airflow and a developer's terminal all run the
same code. Commands:

- `validate <product>` — JSON Schema validation of ODPS and ODCS files, plus
  cross-file rules: every output port has a contract file; every input port
  resolves to an existing product's output contract; names follow the
  conventions; the transformation code produces every output port; every
  business-term link resolves to an existing term.
- `breaking <product> --base <ref>` — compares each contract with its version
  on the base branch (using datacontract-cli's comparison) and lists breaking
  changes together with the downstream products whose input ports reference
  the contract.
- `test <product> [--schema <override>]` — runs the contract against Trino
  with datacontract-cli; emits a machine-readable result.
- `publish <product>` — runs every publish target (section 7.7).
- `lifecycle check <product> --base <ref>` — verifies that a status change is
  a legal transition and that the gates for the new state are met
  (section 7.10).
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
- **`validate`** (pull requests touching `products/**` or `templates/**`) — for
  each changed product: `dpctl validate`; `dpctl lifecycle check`;
  `dpctl breaking`; dbt build into an
  isolated schema `pr_<number>_<domain>_<product>`; `dpctl test` against that
  schema; a summary comment on the PR. The PR schema is dropped when the PR
  closes.
- **`deploy`** (push to `main` touching `products/**`) — for each changed
  product, according to its lifecycle state (section 7.10): build into the
  product schema (dbt or Spark); `dpctl test`; `dpctl publish`; make the
  product visible to Airflow.

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

### 7.7 Publishing

The ODPS and ODCS files are the source. `dpctl publish` reads them and runs a
list of **publish targets**; each target is a small plug-in that receives the
parsed spec and contracts and makes one system match them. Adding a target
(another catalog, a marketplace, an access-management system) means adding a
plug-in, not changing products **[call]**.

Targets in this build:

| Target | What is generated from the spec and contract |
|---|---|
| dbt | schema file: columns, descriptions, tests from contract rules |
| Airflow | the product's DAG: schedule, upstream dependencies |
| OpenMetadata | everything in the table below |

OpenMetadata mapping:

| In Git | In OpenMetadata |
|---|---|
| ODPS domain | Domain |
| ODPS data product | Data Product (`<domain>.<product>`), with owner and description |
| ODPS `status` | lifecycle state on the Data Product |
| Output port | Output port → the Trino table (ingested from Trino first) |
| Input port | Input port → the upstream product's table |
| ODCS contract | Data Contract on the output table, via OpenMetadata's ODCS import |
| ODCS classification (e.g. PII) | Tags on columns |
| ODCS business-term link on a column | Glossary term attached to the column (7.8) |
| Ports and transformation code | Lineage (7.9) |
| Contract test result (from CI or Airflow) | Data Contract result on the contract |

Enforcement is done by datacontract-cli in CI and Airflow, and results are
pushed to OpenMetadata **[call]**. OpenMetadata's own scheduled contract
validation is not relied on.

All of this runs inside the deploy workflow and the Airflow DAG. Nobody opens
OpenMetadata to enter product metadata.

### 7.8 Semantics

- **Where business terms live [call]:** in an OpenMetadata glossary, because
  that is where data stewards govern vocabulary and where consumers look it
  up. The repository ships a starter glossary (settlement terms) that is
  loaded when the stack first starts, so the demo has terms to map to.
- **Where the mapping lives:** in the contract. A column carries a standard
  ODCS `authoritativeDefinitions` entry pointing at its business term. The
  same hook on the table links the whole output port to a business object.

  ```yaml
  - name: settlement_date
    logicalType: date
    authoritativeDefinitions:
      - type: businessDefinition
        url: <link to glossary term "Settlement Date">
  ```

- **What publishing does:** OpenMetadata's ODCS import keeps these links but
  does not act on them, so the OpenMetadata publish target resolves each link
  and attaches the glossary term to the column. The term's page in
  OpenMetadata then lists every column and product that carries it.
- **Checks:** a link that does not resolve fails validation. Becoming Active
  requires every output column to be mapped (7.10).
- **In the UI:** each column row in the contract editor has a business-term
  picker that searches the OpenMetadata glossary.

The link must stay valid when the stack moves to a hosted environment; the
exact link form is left to the builder.

### 7.9 Lineage

Captured in OpenMetadata automatically, with no drawing by hand:

- **Product level** — input ports and output ports on the Data Product.
- **Table level** — upstream product table → this product's table.
- **Column level** — derived from the transformation code (dbt's compiled
  SQL; the Spark job's lineage events).
- **Pipeline** — the product's Airflow DAG is recorded as the process that
  produces the edge.

Lineage is published on deploy and refreshed after every run.

### 7.10 Lifecycle

One lifecycle for every product **[call on the details]**, using the status
values the standards already define. The state is the `status` field in the
ODPS file. A state change is a pull request that edits that field; the
pipeline checks that the move is legal and that the gates are met.

```
Proposed ──► Draft ──► Active ──► Deprecated ──► Retired
    └──────────┴───────────────────────────────────▲   (abandon)
```

| State | Meaning | What the platform does | Gate to enter |
|---|---|---|---|
| **Proposed** | An idea is registered. | Listed in the UI. Nothing deployed; not in the catalog. | Name, domain, owner, purpose. |
| **Draft** | Being built. | Built and contract-tested on merge. Published to OpenMetadata marked Draft. Not scheduled. Cannot be an input for an Active product. Contract may change freely. | Template applied; specs valid; build succeeds. |
| **Active** | Supported and open to consumers. | Scheduled. Contract enforced on every run. Fully published. Breaking contract changes need a major version bump. | Every output column has a description, a classification and a business term; at least one quality rule per port; SLA stated; contract test passing; version ≥ 1.0.0; pull request approved. |
| **Deprecated** | Still running, on its way out. | Still scheduled and enforced. Flagged in the UI and OpenMetadata with its sunset date and successor. No new consumers accepted. | Sunset date given. Existing consumers are listed on the pull request. |
| **Retired** | Switched off. | Schedule removed. Hidden from consumer listings; kept in Git and OpenMetadata as history. Data is left in place. | No Active product still consumes it; sunset date reached. |

In the UI the product page shows the lifecycle as a stepper with the gates
for the next state as a checklist, and a button that opens the pull request
for the next move.

### 7.11 The UI (`ui/`)

Next.js 16 (App Router), React 19, Tailwind v4 — the stack already in the
repository — with **Untitled UI React** components (React Aria based) replacing
the scaffold's Radix primitives **[call]**. Untitled UI's open-source tier is
MIT and ships a Next.js starter on exactly this stack.

Next.js is used rather than a browser-only React app because the UI needs a
server side to hold the GitHub and OpenMetadata tokens **[call]**. There is no
database: every screen reads from GitHub (files on `main`, pull requests,
workflow runs) and OpenMetadata (contract results, entity links).

Screens:

1. **Products** — a card per product: name, domain, owner, lifecycle state,
   ports, contract status badge, last deployment. Filter by domain and state.

   ```
   ┌ Settlement Instructions ─────────── ● Active ┐
   │ settlement · Team Post-Trade                 │
   │ out: instructions        contract ✔ passing  │
   │ deployed 2h ago                              │
   └──────────────────────────────────────────────┘
   ```

2. **Product detail** — overview from the ODPS file; the lifecycle stepper
   with the next state's gate checklist (7.10); ports with a contract viewer
   (schema table with business terms, quality rules, SLA); a small lineage picture
   (inputs → product → outputs); deployment history (workflow runs); contract
   test history; links out to the GitHub folder, the Airflow DAG, the
   OpenMetadata page, and a sample Trino query.

3. **New product wizard**
   1. Template — pick from the template catalog (7.3). Later steps adapt to
      the template.
   2. Basics — name, domain, owner, description. The wizard can stop here
      and register the product as **Proposed**.
   3. Input ports — pick from existing Active products' output ports (or a
      raw source table, for a source-aligned template).
   4. Output port and contract — columns, types, required/unique, PII
      classification, business term, quality rules.
   5. Transformation — a code editor for the output (SQL for dbt templates,
      PySpark for the Spark template), prefilled with a `select` over the
      chosen inputs **[call]**. Richer work happens on the PR branch in an
      editor, as usual.
   6. Review — the generated YAML, then **Create**. The product is created
      as **Draft**.

   After Create, the wizard becomes a progress view that follows the real
   pipeline: PR opened → checks → merge → deploy → in catalog, each step
   linking to the real thing. Merge can be pressed from the UI **[call]** so
   the presenter stays in one place; merging on GitHub works equally.

4. **Edit contract** — form and YAML side by side on an existing product,
   including the business-term picker per column. Saving opens a pull
   request; the screen then shows the breaking-change verdict from CI.

The wizard creates products through the `scaffold` workflow (so the template
has exactly one implementation). Contract edits and lifecycle moves commit
the changed file to a branch directly through the GitHub API.

### 7.12 Example products **[call]**

Synthetic securities post-trade data, guessed from the repository's name and
trivially swappable:

- `settlement/settlement-instructions` — source-aligned; cleans raw instructions.
- `settlement/settlement-fails-daily` — consumer-aligned; consumes the first.
- Created live in the demo: `settlement/counterparty-fail-rates`, consuming
  the second.

## 8. The demo script (acceptance)

The build is done when this runs start to finish without leaving the UI,
GitHub, and the linked systems:

1. **Start.** Stack is up; the UI shows two Active products with passing
   contracts; both are in OpenMetadata with ports, contracts, business terms
   and lineage.
2. **Create.** Presenter picks a template and builds `counterparty-fail-rates`
   in the wizard. A PR appears; checks go green; merge; deploy runs. The
   product is a **Draft**: queryable in Trino, present in Airflow, and in
   OpenMetadata under its domain with ports, contract and lineage down to
   column level.
3. **Promote.** Presenter presses "Promote to Active". The gate check fails
   because one column has no business term. Presenter maps it in the contract
   editor; the check passes; merge. The product is Active and scheduled, and
   the glossary term's page in OpenMetadata now lists the new column.
4. **Breaking change.** Presenter removes a column from the
   `settlement-fails-daily` contract in the UI. The PR check fails and names
   `counterparty-fail-rates` as the affected consumer.
5. **Bad data [call on the details].** From a terminal, contract-violating
   rows are injected into the raw data behind `settlement-instructions`. The
   presenter triggers that product's DAG from the Airflow UI. Its contract
   test fails; `settlement-instructions` turns red in the UI and in
   OpenMetadata; the downstream DAGs do not run, so the bad data does not
   propagate. Reset restores the clean data.
6. **Deprecate.** Presenter deprecates `settlement-fails-daily` with a sunset
   date; the PR lists its consumer; after merge the product is flagged in the
   UI and OpenMetadata and can no longer be picked as an input.

## 9. Phasing

1. **Core loop** — stack; template catalog with the two dbt templates;
   `dpctl`; the three workflows; publish targets (dbt, Airflow, OpenMetadata
   including lineage); lifecycle states Draft and Active; UI products list,
   detail and wizard. Demo steps 1–2.
2. **Governance** — semantics (glossary, term mapping, picker); full
   lifecycle with gates and the stepper; breaking-change check with consumer
   impact; contract editor; bad-data path. Demo steps 3–6.
3. **Breadth** — the `spark-iceberg` template with one example product; a
   template-upgrade workflow that opens `copier update` PRs across all
   products.

Each phase leaves a working demo.

## 10. Left to the builder

- Exact pinned versions of every component, and which Iceberg catalog and
  object store implementation to use.
- How Airflow sees the merged products (shared checkout volume vs. Airflow's
  Git DAG bundle) and how dbt is invoked inside the DAG.
- How lineage is produced (dbt artifacts ingestion vs. direct lineage calls;
  how Spark lineage reaches OpenMetadata).
- The form of the business-term link in the contract, and how lifecycle state
  is represented on the OpenMetadata Data Product (native field if the pinned
  version has one, otherwise a tag).
- The template manifest format and how far the wizard adapts to it.
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
