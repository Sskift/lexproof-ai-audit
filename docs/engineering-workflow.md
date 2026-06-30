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
- Keep docs, screenshots, tests, and source changes in the same commit only when they describe the same user-visible slice.
- Fix forward on `main` if a pushed change breaks the app.
- Do not run destructive git reset/checkout commands to hide uncertainty.

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
