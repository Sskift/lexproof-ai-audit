# LexProof Plan

Last updated: 2026-07-07

This is the single planning document for LexProof AuditOS. Use it for backlog direction and slice selection. Use `ARCHITECTURE.md` and `docs/architecture-guardrails.md` for placement, `docs/engineering-workflow.md` for verification, and `docs/project-governance.md` for authority and handoff rules.

LexProof remains **Not legal advice**. It creates audit preparation materials, source lineage, evidence workflow metadata, model governance records, and counsel handoff artifacts. It must not create legal conclusions, perform KYC, store secrets, expose raw evidence, or claim real chain proof without a real transaction.

## Product Direction

LexProof should be a focused AI and Web3 regulatory evidence workspace:

- Project facts, source-backed controls, evidence requests, model receipts, human review, vault metadata, and Counsel Pack exports should form one continuous workflow.
- AI output is draft audit preparation only. Deterministic risk scoring, source matching, and export gates remain testable domain logic.
- Evidence and export artifacts should be metadata-first, hashable, versioned, and safe to hand to counsel or judges.
- External integrations should start as disabled-by-default policy checks with receipts before any real adapter is enabled.

Rejected directions:

- Generic legal chatbot behavior.
- Source-free legal conclusions or launch approvals.
- Raw KYC processing, private-key custody, credential storage, or raw document retention in the demo path.
- Simulated chain-proof marketing that is not backed by a real verifiable transaction.
- Parallel demo-only surfaces that do not connect to the main audit-prep journey.

## Current Baseline

The repository already has the main single-user journey:

- React + TypeScript + Vite workbench with local project state, demo scenarios, and clean-clone run commands.
- Deterministic risk audit, source-linked issue cards, regulatory source/control graph, jurisdiction evidence map, source freshness, local counsel routing, and Jurisdiction Readiness Digest.
- Model Intake, Model Connect, Redaction Gate, AI Review, local model receipts, and Phase 2 mock Model Gateway receipts.
- Evidence Ledger, metadata-only file hashing, evidence templates, retention gates, Evidence Vault metadata sync, duplicate/replacement recovery, manifests, lineage digest, and audit logs.
- Human Review queue, status effects, review timeline exports, and source refresh review routing.
- Counsel Pack Markdown, export templates, Export Safety Gate, version history, diffs, Regulatory Source Pack, Jurisdiction Readiness Digest handoff metadata, server export records, and receipt exports.
- Integration readiness and policy evaluation receipts for provider, secret, object storage, document parser, chain anchor, and GRC destination boundaries without real external side effects.
- Demo script, README, screenshots, Submission Pack, Judge Handoff Bundle, and recovery playbook.

Future work should deepen or harden this journey instead of adding disconnected modules.

## Priorities

| Priority | Direction | Good slice shape | Stop line |
| --- | --- | --- | --- |
| P0 | Keep the judge/demo path trustworthy | Fix one broken, stale, or unclear step in project -> model/evidence -> risk/source -> review -> vault -> export | Do not add a second demo path |
| P1 | Deepen source-backed jurisdiction review | Add one reviewed source/control/template path with evidence gaps, source freshness, and counsel routing | Do not write legal conclusions |
| P2 | Harden recovery and export reliability | Add one blocked, empty, duplicate, rejected, returned, stale, or drift state with actionable recovery | Do not persist raw evidence, KYC, secrets, keys, or credentials |
| P3 | Make integrations policy-real before adapter-real | Add metadata-only policy checks, disabled states, receipts, and audit logs for one adapter class | Do not make real external calls by default |
| P4 | Prepare pilots only after the single-user flow stays stable | Add auth, roles, sharing, raw document intake, or real storage behind written boundaries | Do not start multi-tenant infrastructure as a shortcut |

## Workstreams

| ID | Workstream | Outcome | Owners and proof |
| --- | --- | --- | --- |
| W1 | Regulatory intelligence | Deeper jurisdiction controls, source review freshness, local counsel routing, source approval, and source-pack exports | `src/data/regulatoryClauses.ts`, `src/lib/regulatory*.ts`, source route tests, clause matching tests, command-center screenshot when visible |
| W2 | Evidence operations | Metadata-first evidence requests, file hashes, retention gates, vault lineage, duplicate/replacement recovery, and manifests | `src/lib/evidence*.ts`, `server/evidenceVault*`, hash/transition/route tests |
| W3 | Model governance | BYOM/BYOK setup, redaction, provider/secret policy, gateway receipts, run evaluation, and failure recovery | `src/lib/model*.ts`, `src/lib/aiReview.ts`, `server/modelGateway*`, policy and receipt tests |
| W4 | Human review | Reviewer assignment, due dates, returned/rejected/reviewed flows, timeline exports, and linked target effects | `src/lib/humanReview*.ts`, `server/humanReview*`, queue/effect/route tests |
| W5 | Counsel and submission exports | Versioned Counsel Pack, source pack, submission pack, export safety, diff, print/PDF, and receipt artifacts | `src/lib/counselPack*.ts`, `src/lib/submissionPack.ts`, `server/counselPackExport*`, Markdown/export/version tests |
| W6 | Workbench experience | Dense professional cockpit, journey rail, action queue, empty/error/recovery states, and responsive polish | `src/App.tsx`, `src/components/*`, `src/styles.css`, App workflow tests and screenshots for durable UI changes |
| W7 | Backend platform | Route modules, repository adapters, Prisma state, typed errors, health/preflight, audit logs, and future jobs | `server/*`, `prisma/schema.prisma`, route/service/repository tests, `npm run build:server` |
| W8 | Security and privacy | Classification, redaction, retention, upload/export blockers, readiness gates, and safe audit-log exports | `src/lib/dataClassification.ts`, `src/lib/dataBoundary.ts`, policy modules, negative tests |
| W9 | Integrations | Disabled-by-default provider, object storage, parser/OCR, GRC/ticket, and optional chain-anchor adapters | `src/lib/*Policy.ts`, focused clients/services, policy route tests, no-real-call tests |
| W10 | Demo and judge readiness | Clean-clone path, scenario library, screenshots, API preflight, submission materials, and known limitations | README, demo script, `src/lib/demo*.ts`, readiness tests, screenshot inspection |
| W11 | Pilot operations | Accounts, orgs, roles, reviewer permissions, matter sharing, and durable settings | Deferred until W1-W10 are stable; requires permission and route tests |
| W12 | Production readiness | Observability, background jobs, migration discipline, deployment, enterprise reporting, and custom controls | Deferred until pilot workflows prove demand; requires operational runbooks and deployment smoke |

## Next Useful Slices

Start here when no narrower user request exists:

1. Keep `npm run verify`, demo script, README run commands, and key screenshots aligned with the latest main branch.
2. Add one source-backed regulatory control path at a time for custody, stablecoin, AI governance, marketing claims, RWA, or DAO workflows.
3. Harden one recovery state across Evidence Vault, Model Gateway, Human Review, Audit Log, or Counsel Pack export records.
4. Extend metadata-only integration policy receipts only when the disabled state, audit log, recovery path, and tests are already clear.
5. Defer auth, organizations, raw document storage, real OCR, real GRC tickets, real object storage, and real chain anchoring until a privacy and retention boundary is written and tested.

## Slice Intake Template

Use this compact record before implementation:

```text
Workstream:
Priority:
User journey:
User-visible outcome:
Frontend files:
Domain files:
Backend files:
Data/docs files:
Privacy boundary:
Not legal advice wording:
Targeted verification:
Screenshot required:
Commit scope:
```

Reject or narrow the task if it cannot name a workstream, user journey, owner files, boundary, and proof path.

## Done Rule

A slice is done only when it maps to one workstream, preserves the Not legal advice and privacy boundaries, passes targeted proof for changed behavior, passes `npm run verify` before push, and leaves the worktree clean except for explicitly unrelated user-owned changes.
