# Engineering Workflow and Verification Matrix

This file is the operational rulebook for keeping LexProof AuditOS clean, demoable, and easy to extend.

Use it with:

- `WORKFLOW.md` for direct-to-main policy.
- `CONTRIBUTING.md` for product and engineering guardrails.
- `ARCHITECTURE.md` and `docs/architecture-guardrails.md` for module boundaries.
- `docs/work-universe.md` for the approved backlog direction.

## Start-of-Work Checklist

Run:

```bash
git status -sb
```

Then decide the smallest valid slice:

- Documentation-only: edit docs, run `npm run verify` before commit if pushing to `main`.
- Pure logic: write or update focused tests first, implement in `src/lib`, then run targeted tests and `npm run verify`.
- UI workflow: add or update domain logic first, add UI tests, manually run the flow, capture screenshot if judge-visible.
- Backend workflow: add or update service/route tests, implement service/repository/route, run targeted server tests and `npm run verify`.

Do not stage unrelated files. If unrelated local changes exist, leave them out of the commit.

## Work Intake Contract

Every implementation prompt or issue should contain these fields before code changes begin:

- **Workstream:** one ID from `docs/work-universe.md`, for example `W2 Evidence Vault and Provenance`.
- **User journey:** the exact flow being improved, such as `Evidence Ledger -> Evidence Vault sync -> Manifest`.
- **Layer placement:** files or modules expected in `src/lib`, `src/data`, `src/components`, `server`, `prisma`, and docs.
- **Non-advice boundary:** the generated output wording or state that keeps the feature as audit preparation only.
- **Privacy boundary:** data classes that must be blocked, redacted, or excluded.
- **Verification:** targeted tests, full gate, and whether a screenshot is required.
- **Commit scope:** files that are expected to change and files that should not be touched.

Minimal agent prompt template:

```text
Implement <workstream/slice>. User journey: <flow>. Put domain logic in <src/lib module>, static demo/source data in <src/data module>, UI in <component>, backend in <server route/service> only if needed. Preserve Not legal advice. Do not store secrets, raw KYC, private keys, personal data, raw evidence bytes, or real chain writes. Add only tests that prove new core behavior. Run <targeted tests>, then npm run verify. Capture a screenshot only if UI changed. Inspect git diff, stage only scoped files, commit, and push origin/main after verification passes.
```

If the prompt cannot be filled without guessing, narrow the slice before editing.

## Test Selection Matrix

| Change type | Minimum targeted verification | Full gate |
| --- | --- | --- |
| Docs only | Read changed docs and check links/commands by inspection | `npm run verify` before push |
| `src/lib` pure function | `npm test -- src/lib/<file>.test.ts` | `npm run verify` |
| React component or App wiring | `npm test -- src/App.test.tsx` plus affected component tests if present | `npm run verify` and screenshot for visible demo flow |
| Server service | `npm test -- server/<service>.test.ts` | `npm run verify` |
| Server route | `npm test -- server/<route>.test.ts` | `npm run verify` |
| Prisma/schema/persistence | repository tests plus `npm run build:server` | `npm run verify` |
| Model, evidence, or export boundary | targeted lib + server tests for validators and receipts | `npm run verify` |
| UI layout redesign | App tests, manual desktop/mobile smoke, screenshot | `npm run verify` |

### Exact Test Launch Recipes

Use the narrowest command that proves the changed behavior before running the full gate.

Pure library slice:

```bash
npm test -- src/lib/<feature>.test.ts
```

React workflow slice:

```bash
npm test -- src/App.test.tsx
```

Server route or service slice:

```bash
npm test -- server/<feature>.test.ts
```

Multiple related tests:

```bash
npm test -- src/lib/<feature>.test.ts server/<feature>.test.ts src/App.test.tsx
```

Server build after backend or shared-contract changes:

```bash
npm run build:server
```

Full gate before push:

```bash
npm run verify
```

Use full verification before every commit that will be pushed:

```bash
npm run verify
```

Current full gate expands to:

```bash
npm test
npm run build
```

### Backend And End-to-End Launch Recipes

Use these when a change touches the Phase 2 API, secure review journey, Evidence Vault, Model Gateway, Human Review, audit logs, or server Counsel Pack export records.

Build the server:

```bash
npm run build:server
```

Start the API with local SQLite:

```bash
DATABASE_URL=file:./demo-review-workspace.db npm run start:api
```

Start the frontend in a second terminal:

```bash
npm run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

Minimum API smoke check:

```bash
curl http://127.0.0.1:8787/api/health
```

Expected result: a JSON health response from the local API. Do not commit the local SQLite file.

### Browser Smoke Recipes

Use a browser smoke when a visible workflow changes:

1. Start the app with `npm run dev -- --port 5173`.
2. Load `http://127.0.0.1:5173/`.
3. Run the affected path from the same start state a judge would use.
4. Confirm the Not legal advice boundary is visible in generated/export surfaces.
5. Confirm empty, failure, or recovery states render when the slice introduces them.
6. Save screenshots under `docs/assets/screenshots/` only when the visual state is durable and useful.

## Local Run Recipes

Frontend only:

```bash
npm run dev
```

Phase 2 API:

```bash
npm run build:server
DATABASE_URL=file:./demo-review-workspace.db npm run start:api
```

Frontend with API:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Minimum manual smoke path:

1. Create or load a project.
2. Check Model Connect readiness.
3. Add or select evidence.
4. Run Risk Audit and confirm source-linked issue cards render.
5. Use Human Review for a reviewed and a returned/rejected state.
6. Run Secure Review Journey.
7. Open Counsel Pack and confirm manifest hash plus Not legal advice wording.

## Screenshot Policy

Capture screenshots only when they prove a visible workflow or demo state:

- New first-screen or major UI layout.
- New end-to-end journey.
- Error/empty/recovery state that judges or users must trust.
- Export surface changes.

Store intentional screenshots in:

```text
docs/assets/screenshots/
```

Use descriptive names, for example:

```text
regulatory-command-center.png
evidence-vault-rejected-state.png
model-gateway-failure-state.png
```

Do not commit throwaway screenshots, videos, `dist`, coverage output, local SQLite files, or build artifacts.

## Test Discipline

Add tests for behavior, not for file churn.

Good tests:

- A hash is stable for equivalent material data.
- A hash changes when material evidence changes.
- A blocked data class returns a specific error.
- A returned review moves linked evidence to the right state.
- A UI journey shows the next action after an error.

Avoid:

- Large snapshots.
- Tests that duplicate another test at a higher layer without adding confidence.
- Brittle assertions on decorative copy.
- Testing implementation details inside React components.
- Adding tests for docs-only changes.

Every new core function needs a focused test. A "core function" is any function that scores, validates, hashes, matches sources, changes workflow status, builds exports, talks to the API, or enforces a boundary.

### No-Useless-Test Rule

Do not add a test just because a file changed. Add a test only when it would catch a plausible regression.

Use one primary test layer for each behavior:

- `src/lib` test for deterministic business logic, hashing, validation, source matching, export generation, and data-boundary decisions.
- `server` test for HTTP status codes, request validation, persistence effects, audit-log writes, and metadata-only response guarantees.
- `src/App.test.tsx` or component-level test for user-visible state changes, disabled buttons, empty states, recovery actions, and tab journeys.

Do not test the same sentence of copy in both a library test and a UI test unless the UI behavior depends on exact wording. Prefer stable labels, status chips, hashes, action availability, and structured fields over paragraph text.

If a feature has no new core logic and only rearranges docs or copy, do not add tests. Run the full gate before push because `main` must remain runnable.

### Test Budget Rules

Keep tests proportional to risk:

- **One new core function:** one focused unit test file or one focused case in the nearest existing test file.
- **One server route behavior:** one route test for request validation, response contract, persistence effect, and audit-log effect if applicable.
- **One UI workflow:** one user-visible state transition test, not paragraph-level copy snapshots.
- **One data-only source/template change:** one test that proves matching, recommendation, or validation behavior changes; no test if docs-only text changes.
- **One error state:** one test that proves the actionable error code/state, not decorative wording.

Do not add tests that only assert implementation details, repeat the same guarantee across three layers, or freeze copy that is likely to change. If a test cannot fail for a real user-visible regression, it is probably noise.

### Regression Budget

Keep the test suite useful:

- One focused test file per new domain module.
- One App workflow test per new user journey or important error state.
- One server route test per route family or policy failure path.
- No broad snapshots.
- No generated fixture dumps larger than the behavior under test.
- Remove or update obsolete tests when behavior intentionally changes.

If a proposed test would still pass while the user journey is broken, rewrite it or do not add it.

## Commit and Push Gate

Before staging:

```bash
git status -sb
git diff --stat
git diff --check
```

Review changed files:

```bash
git diff --stat
git diff -- <file>
```

Run:

```bash
npm run verify
```

Stage only current-scope files:

```bash
git add <files-you-intentionally-changed>
git status -sb
```

Commit:

```bash
git commit -m "docs: define architecture and workflow guardrails"
```

Push:

```bash
git push origin main
```

After push:

```bash
git status -sb
```

Expected:

```text
## main...origin/main
```

## Branch Rules

Normal hackathon work happens directly on `main`.

Use a branch only for:

- Multi-session rewrites.
- Replacing scoring architecture.
- Introducing auth/RBAC.
- Real model provider proxying.
- Raw file persistence.
- Real wallet signing or chain anchoring.
- Package manager, build system, or framework changes.

If a branch is used, keep the same verification gate before merging back.

## Repository Cleanliness Rules

- Never commit credentials, `.env` secrets, raw KYC, private keys, seed phrases, or personal data.
- Never commit `node_modules`, `dist`, `server-dist`, coverage output, TypeScript build info, or local SQLite databases.
- Never commit local API databases such as `demo-review-workspace.db`, throwaway downloads, ad hoc browser recordings, or screenshots that are not linked to a durable demo state.
- Keep docs, screenshots, tests, and source changes in the same commit only when they describe the same user-visible slice.
- Fix forward on `main` if a pushed change breaks the app.
- Do not run destructive git reset/checkout commands to hide uncertainty.

### Generated File Watchlist

Before staging, check for common accidental artifacts:

```bash
git status -sb
find . -maxdepth 3 \( -name "dist" -o -name "server-dist" -o -name "coverage" -o -name "*.tsbuildinfo" -o -name "*.db" \) -print
```

Remove only generated files you created during the current slice. Leave unrelated user changes alone.

### Staging Rules

- Stage explicit files, not `git add .`, unless the diff has been fully inspected and every file belongs to the same slice.
- Run `git diff --cached --stat` before commit.
- Do not include local databases, downloaded artifacts, throwaway screenshots, or generated build output.
- If a screenshot is required, name it after the workflow state and store it under `docs/assets/screenshots/`.
- If unrelated user changes exist, leave them unstaged and mention that in the final handoff.

### Dirty Worktree Recovery

Use inspection before action:

```bash
git status -sb
git diff --stat
git diff -- <path>
```

Allowed cleanup:

- Remove generated files you created during the current slice.
- Restore local edits you made during the current slice only when you are intentionally abandoning them.

Not allowed without explicit user instruction:

- `git reset --hard`
- `git checkout -- .`
- force-pushing `main`
- deleting user-created files because they are unrelated to the current task

### Documentation Update Rules

Update docs when a user-visible workflow, API boundary, architecture rule, or demo path changes.

Use existing docs first:

- Backlog and product direction: `docs/work-universe.md`.
- Feature placement and anti-drift: `docs/architecture-guardrails.md`.
- Test commands, screenshot policy, and cleanliness: `docs/engineering-workflow.md`.
- Public runnable overview: `README.md`.
- Demo path: `docs/demo-script.md`.

Do not create a new plan document when one of these files is the correct home. New docs need a durable audience and must be linked from README or an existing docs index.

## Definition Of Clean Handoff

A handoff is clean only when:

- `git status -sb` shows no unstaged or untracked project changes after push, except unrelated user-owned changes that were explicitly left out.
- The final message names the verification command that was run and its result.
- Any screenshot path is included when screenshots were required.
- Any skipped verification is called out as a limitation, not implied as passing.
- The commit contains one coherent slice, not a mix of unrelated cleanup, generated output, and feature work.

## Agent Prompt Contract

When delegating work to an agent, include:

- The exact slice from `docs/work-universe.md`.
- The relevant architecture boundary from `docs/architecture-guardrails.md`.
- The test row from the verification matrix above.
- The non-advice and privacy boundaries.
- Whether screenshots are required.
- The instruction to run `npm run verify`, commit, and push only after the gate passes.

Example:

```text
Implement W1 Regulatory Source Graph slice: add source-backed clause data, graph matching, command center UI, tests, and screenshot. Keep legal output as audit preparation only. Put matching logic in src/lib, source data in src/data, UI in src/components, no React business logic. Run targeted tests, npm run verify, capture docs/assets/screenshots/regulatory-command-center.png, commit, and push origin/main.
```
