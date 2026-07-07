# LexProof Constraint Index

This is the starting point for future LexProof AuditOS work. It tells agents and contributors which files control product scope, architecture placement, workflow, verification, and repository cleanliness.

LexProof is always **Not legal advice**. The product creates audit preparation material, source lineage, evidence workflow metadata, model governance records, and counsel handoff artifacts. It must not create legal conclusions, perform real KYC, store secrets in the browser or repo, upload private material by default, or claim real chain proof without a real verifiable transaction.

## Authority Map

| Need | Start here | What it controls |
| --- | --- | --- |
| Active backlog direction | `docs/plan.md` | The single product, frontend, backend, data, security, integration, and demo plan |
| Project architecture | `docs/architecture-guardrails.md` and `ARCHITECTURE.md` | Layer boundaries, dependency direction, module ownership, API shape, and anti-drift rules |
| Workflow and testing | `docs/engineering-workflow.md` and `WORKFLOW.md` | Start gate, test selection, launch recipes, screenshots, staging, commits, and push rules |
| Rule conflicts | `docs/project-governance.md` | Authority order, required task metadata, rejection rules, and clean handoff contract |
| Public run/demo path | `README.md` and `docs/demo-script.md` | Judge-facing setup, demo flow, screenshots, exports, limitations, and non-advice positioning |

When files conflict, use the stricter privacy, security, architecture, verification, and Not legal advice rule. Fix the stale doc in the same documentation slice when practical.

## Required Agent Start Gate

Before editing code, data, tests, screenshots, or docs:

1. Run `git status -sb`.
2. Identify the workstream in `docs/plan.md`.
3. Identify the owning layer in `docs/architecture-guardrails.md`.
4. Choose the narrowest useful test from `docs/engineering-workflow.md`.
5. Decide whether a screenshot is required.
6. List the files that are in scope and the dirty files that must be left unstaged.

If a task cannot answer those six points, narrow it before implementation.

## Feature Placement Rule

Use the existing structure first:

| Behavior | Correct home |
| --- | --- |
| Scoring, validation, source matching, hashing, workflow transitions, export builders, policy decisions | `src/lib` |
| Synthetic project profiles, demo scenarios, evidence templates, reviewed static regulatory/source metadata | `src/data` |
| User interaction, status display, empty/error/recovery states, tab surfaces | `src/components` and `src/App.tsx` |
| Durable API behavior, request validation, audit logs, repository access, model gateway receipts, vault records, review records, export records | `server` |
| Durable metadata schema | `prisma/schema.prisma` |
| Product direction, architecture, workflow, demo runbooks | `docs`, `README.md`, `WORKFLOW.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md` |

Do not create a new top-level directory unless there is a real runtime boundary such as a worker, CLI, or independent package.

## Verification Rule

Use targeted tests while developing, then run the full gate before any pushed commit:

```bash
npm run verify
```

For server or end-to-end slices, also use the launch recipes in `docs/engineering-workflow.md`:

```bash
npm run build:server
DATABASE_URL=file:./demo-review-workspace.db npm run start:api
npm run dev -- --port 5173
curl http://127.0.0.1:8787/api/health
```

Do not commit the local SQLite file.

## Repository Cleanliness Rule

- Stage explicit files only. Avoid `git add .` unless the full diff was inspected and every file belongs to the same slice.
- Leave unrelated dirty files unstaged.
- Do not commit generated artifacts: `node_modules`, `dist`, `server-dist`, coverage output, `*.tsbuildinfo`, local SQLite files, downloaded exports, throwaway recordings, `.env`, or secrets.
- Do not add tests for docs-only edits, copy-only edits, decorative layout changes, or behavior already covered at the correct layer.
- Every new core function needs a focused test. A core function scores, validates, hashes, matches sources, transitions workflow state, builds exports, calls an API, or enforces a privacy/security boundary.

## Definition Of Ready

A future implementation slice is ready only when it names:

- Workstream and user journey.
- Frontend owner.
- Domain owner.
- Backend owner, or `none`.
- Data owner, or `none`.
- Privacy boundary.
- Not legal advice wording.
- Targeted tests.
- Screenshot requirement.
- Commit scope.

## Definition Of Done

A slice is done only when:

- The changed files map to one coherent workstream slice.
- Generated/exported material repeats the Not legal advice boundary when relevant.
- Unsafe data classes are blocked, redacted, or explicitly excluded.
- Targeted tests passed when behavior changed.
- `npm run verify` passed before push.
- Screenshots were captured only for durable visible workflow changes.
- `git status -sb` is clean after push, except unrelated user-owned changes explicitly left unstaged.
