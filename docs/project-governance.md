# LexProof Project Governance

This file is the operating contract for future LexProof AuditOS work. Use it before adding features, UI, backend routes, tests, or documentation so the project grows as one audit workspace instead of drifting into disconnected demos.

LexProof is always **Not legal advice**. It creates audit preparation materials, source lineage, evidence workflow metadata, model governance records, and counsel handoff artifacts. It must not create legal conclusions, perform KYC, store secrets in the client, or claim real chain proof without a real verifiable transaction.

## Authority Files

Use these files as the single source of truth:

| Question | Authority file | Purpose |
| --- | --- | --- |
| What should be built? | `docs/work-universe.md` | Complete product, frontend, backend, data, security, integration, and demo work universe |
| Where should it live? | `docs/architecture-guardrails.md` and `ARCHITECTURE.md` | Layer boundaries, module ownership, dependency direction, and anti-drift rules |
| How should it be built and verified? | `docs/engineering-workflow.md` and `WORKFLOW.md` | Direct-to-main loop, targeted tests, full verification, screenshots, staging, and push rules |
| What product boundaries are non-negotiable? | `CONTRIBUTING.md` and this file | Not legal advice, synthetic-safe demos, no secrets, no raw KYC, no private keys, no real chain claims unless real |
| What can judges run? | `README.md` and `docs/demo-script.md` | Clean-clone setup, demo path, screenshots, API launch commands, and export story |

If two docs appear to conflict, preserve the stricter privacy, non-advice, architecture, and verification rule, then update the stale file in the same documentation slice.

## Agent Operating Contract

Every agent or contributor must treat the four governance docs as constraints, not optional reading:

1. `docs/work-universe.md` answers **what can be built** and the direction of future work.
2. `docs/architecture-guardrails.md` answers **where code belongs** and how to avoid structural drift.
3. `docs/engineering-workflow.md` answers **how to test, run, stage, commit, push, and keep the repository clean**.
4. This file answers **which rule wins** when scope, architecture, workflow, and product boundaries overlap.

For any non-trivial task, the implementation note, issue, or agent prompt must include:

- Workstream ID from `docs/work-universe.md`.
- User journey step.
- Owning modules by layer.
- Privacy boundary.
- Not legal advice boundary.
- Targeted verification command.
- Whether a screenshot is required.
- Files expected in the commit.

If those fields cannot be filled, the task is too broad or underspecified. Narrow it before editing.

Direct-to-main remains allowed only when the change is scoped, verified, and easy to audit. Long-running or risky work can use a branch, but the same gates still apply before merging or pushing.

## Required Start Gate

Before changing source code, data, docs, screenshots, or tests:

1. Run `git status -sb`.
2. Identify the smallest workstream slice from `docs/work-universe.md`.
3. Identify the owning layer from `docs/architecture-guardrails.md`.
4. Decide the minimum targeted test from `docs/engineering-workflow.md`.
5. Confirm whether a screenshot is required.
6. Confirm which files are in scope and which dirty files must be left unstaged.

Do not begin broad implementation if the slice cannot answer these questions:

| Field | Required answer |
| --- | --- |
| Workstream | One workstream ID from `docs/work-universe.md`, such as `W2 Evidence Vault and Provenance` |
| User journey | The exact path being improved, such as `Evidence Ledger -> Evidence Vault -> Counsel Pack` |
| Product output | What the user can now do or verify |
| Frontend owner | Existing or new component under `src/components` |
| Domain owner | Existing or new focused module under `src/lib` |
| Backend owner | Existing route/service/repository, or `none` if local-first |
| Data owner | Existing file under `src/data`, or `none` if no seed/source data changes |
| Boundary wording | How generated output repeats Not legal advice |
| Privacy boundary | Data classes blocked, redacted, or excluded |
| Verification | Targeted tests, `npm run verify`, screenshot yes/no |
| Commit scope | Files expected in the commit |

## Product Build Universe

All feature work must fit the complete build universe in `docs/work-universe.md`. The allowed capability areas are:

- Project intake and demo scenarios.
- Regulatory source/control graph.
- Deterministic risk audit and remediation.
- Model Connect, Model Gateway, and AI governance.
- Evidence Ledger, Evidence Vault, provenance, retention, and manifests.
- Human Review workflow and review timelines.
- Counsel Pack, Submission Pack, source packs, versioning, and exports.
- Secure review backend routes, services, repositories, and audit logs.
- Security, privacy, readiness gates, and integration policy.
- Professional workbench UI quality, empty states, error states, and screenshots.
- Judge readiness, demo script, screenshots, and clean-clone runbook.

Do not add a new capability area unless `docs/work-universe.md` is amended with:

- Product outcome.
- Frontend surface.
- Domain/backend owner.
- Required proof.
- Non-goals.
- Privacy and Not legal advice boundaries.

## Architecture Invariants

The project is a modular monolith with a local-first React workbench and a Phase 2 Fastify API.

```text
src/components
  -> src/lib
  -> src/data
  -> src/lib/*Client.ts and shared contracts
  -> server routes/services/repository
  -> prisma schema
```

Mandatory placement rules:

- React components render workflow state, collect input, show recovery actions, and call typed helpers.
- `src/lib` owns deterministic rules, validation, hashing, matching, workflow transitions, export builders, typed API clients, and security boundaries.
- `src/data` owns synthetic profiles, scenario definitions, evidence templates, demo readiness metadata, and reviewed static source libraries.
- `server` owns request validation, durable API behavior, repository access, audit logging, model gateway receipts, vault metadata, review records, and export records.
- `prisma/schema.prisma` owns durable server state only.
- Docs explain behavior and constraints; they do not create a second product architecture.

Forbidden drift:

- Scoring, hashing, regulatory matching, export assembly, model policy, or evidence validation inside JSX.
- Static regulatory clauses hard-coded in components.
- Direct `fetch` calls spread across multiple components for the same route family.
- Server imports of browser-only helpers that touch `window`, `document`, `localStorage`, downloads, print, or React.
- UI code depending directly on Prisma models.
- New top-level directories without a real runtime boundary.

## Workflow Invariants

Normal work happens directly on `main`, but `main` must stay runnable.

Required loop for pushed work:

```bash
git status -sb
git diff --stat
git diff --check
npm run verify
git add <scoped-files-only>
git diff --cached --stat
git commit -m "<type>: <scope>"
git push origin main
git status -sb
```

Never stage unrelated local changes. Never use `git add .` unless every changed file has been inspected and belongs to the same slice.

Generated or local runtime artifacts must not be committed:

- `node_modules`
- `dist`
- `server-dist`
- coverage output
- `*.tsbuildinfo`
- local SQLite files such as `*.db` and `prisma/*.db`
- throwaway downloads, recordings, or screenshots
- `.env` files and secrets

## Verification Ladder

Use the narrowest useful proof first, then run the full gate before pushing.

| Slice type | Targeted proof | Full gate |
| --- | --- | --- |
| Docs only | Inspect links, commands, and cross-references | `npm run verify` before push |
| Pure domain logic | `npm test -- src/lib/<feature>.test.ts` | `npm run verify` |
| React workflow | `npm test -- src/App.test.tsx` | `npm run verify`, screenshot if demo-visible |
| Server service | `npm test -- server/<service>.test.ts` | `npm run verify` |
| Server route | `npm test -- server/<route>.test.ts` | `npm run verify` |
| Persistence/schema | repository tests and `npm run build:server` | `npm run verify` |
| Model/evidence/export boundary | targeted lib plus route tests for validators and safe receipts | `npm run verify` |
| Visible UI redesign | App tests, manual smoke, desktop/mobile screenshot | `npm run verify` |

Full verification is:

```bash
npm run verify
```

It currently expands to:

```bash
npm test
npm run build
```

Backend plus frontend local smoke:

```bash
npm run build:server
DATABASE_URL=file:./demo-review-workspace.db npm run start:api
npm run dev -- --port 5173
curl http://127.0.0.1:8787/api/health
```

Do not commit the disposable SQLite file.

## Test Discipline

Add tests for behavior, not churn.

Add a test when the change introduces or changes:

- Scoring, validation, hashing, source matching, export generation, or data-boundary enforcement.
- API request validation, persistence effects, audit logs, or metadata-only response guarantees.
- User-visible workflow state, disabled actions, empty states, error states, or recovery actions.

Do not add tests for:

- Documentation-only edits.
- Copy-only edits that do not change user action availability or generated artifacts.
- Decorative layout changes that are better proven by screenshot/manual smoke.
- The same behavior at three layers unless each layer can catch a distinct regression.
- Large snapshots or fixture dumps.

Every new core function needs a focused test. A core function is any function that scores, validates, hashes, matches sources, changes workflow status, builds exports, talks to the API, or enforces a privacy/security boundary.

## Frontend Quality Bar

The app is a workbench, not a marketing page.

Frontend additions must:

- Preserve the first-screen audit cockpit shape.
- Use dense panels, status chips, action buttons, empty states, and recovery paths.
- Keep text readable and non-overlapping on desktop and mobile.
- Prefer icons in tool buttons when the icon is obvious.
- Avoid decorative cards and visuals that do not carry workflow state.
- Keep Not legal advice visible in generated or exported review material.
- Capture screenshots under `docs/assets/screenshots/` only when a durable demo-visible state changes.

## Backend Quality Bar

Backend additions must:

- Keep routes thin and services testable.
- Validate before mutating repository state.
- Return typed, actionable errors with the audit-prep boundary.
- Persist hashes, status, summaries, and audit-log metadata instead of raw sensitive content.
- Keep external providers, object storage, OCR, ticket systems, and chain adapters disabled until readiness gates and policies exist.
- Avoid leaking Prisma models into UI code.

## Rejection Rules

Do not implement a slice if it:

- Produces legal advice, legal conclusions, or compliance determinations.
- Requires raw KYC, private keys, seed phrases, customer personal data, or browser-persisted API keys.
- Claims a real on-chain proof without a real verifiable transaction.
- Adds a parallel demo-only path where an existing workstream owns the behavior.
- Adds an external integration without disabled-by-default readiness, failure, and privacy states.
- Cannot name the owner modules and verification path.
- Requires broad refactors unrelated to the user-visible slice.

## Agent Prompt Template

Use this template when delegating a focused slice:

```text
Implement <workstream ID and slice>. User journey: <exact flow>. Put domain behavior in <src/lib module>, static data in <src/data module if needed>, UI in <component>, backend in <server route/service if needed>. Preserve Not legal advice. Do not store secrets, raw KYC, private keys, personal data, raw evidence bytes, or real chain writes. Add only tests that prove new core behavior or user-visible workflow state. Run <targeted tests>, then npm run verify. Capture a screenshot only if UI changed. Inspect git diff, stage only scoped files, commit, and push origin/main after verification passes.
```

## Clean Handoff

A change is ready to hand off only when:

- The changed files map to one coherent slice.
- Targeted tests passed, when applicable.
- `npm run verify` passed before push.
- Screenshots were captured only when required and are named after the durable workflow state.
- `git status -sb` is clean after push, or unrelated user-owned changes are explicitly called out as left unstaged.
- The final response names the commit hash and verification result.
