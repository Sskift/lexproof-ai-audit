# Phase 2 Secure Review Workspace Plan

Last updated: 2026-06-29

## Product Goal

Phase 2 turns LexProof AuditOS from a local-first hackathon MVP into a credible professional prototype for secure review workflows. The product remains an AI-assisted legal and compliance audit preparation workspace. It does not provide legal advice, adjudicate disputes, replace lawyers, perform real KYC, or write real blockchain transactions.

The near-term objective is to prepare the architecture and first infrastructure seams for a backend-backed review workspace while keeping the current React + TypeScript + Vite MVP stable.

## Why These Priorities

### Model Gateway

The current app supports mock and OpenAI-compatible model review from the browser. That is good for demos, but a professional workflow needs a controlled server boundary for model calls. The Model Gateway should eventually own provider adapters, encrypted or session-scoped credentials, redaction enforcement, request metadata, rate limits, and model-run receipts.

Near-term value:

- separates model access policy from UI state
- keeps model output as draft audit preparation
- gives reviewers payload and response hashes without exposing credentials
- prepares enterprise provider and proxy integrations

### Evidence Vault

The current Evidence Ledger stores local metadata and browser-side hashes. A real review workspace needs a secure evidence layer for uploaded files, extracted text, version metadata, access logs, and manifest generation.

Near-term value:

- gives the product a credible secure document intake path
- keeps raw evidence separate from counsel exports
- makes manifest hashes and evidence versions easier to verify
- prepares OCR and document parsing without changing the audit engine

### Human Review Workflow

The product's strongest trust boundary is human review. AI output, deterministic risk flags, and evidence records should each be reviewable by counsel or compliance users before external reliance.

Near-term value:

- preserves the non-advice boundary
- makes reviewer decisions visible and exportable
- separates AI suggestions from human approvals
- gives counsel a clear place to request more evidence or reject draft output

## Non-Goals

Phase 2 does not build or claim:

- AI adjudication or automated legal decision-making
- legal advice or attorney-client review
- real KYC processing or identity verification
- storage of raw private keys, credentials, or sensitive personal data
- real blockchain writes, wallet signing, or transaction submission
- production SOC 2 controls
- a large UI redesign or marketing site

## Two-Week Near-Term Plan

### Week 1: Architecture And Contracts

1. Add the Phase 2 planning document and architecture notes.
2. Add `src/lib/phase2Types.ts` with TypeScript contracts for workspace, evidence vault, model gateway, human review, and audit log records.
3. Add pure helper functions for audit-log IDs, model-run summaries, and evidence-vault validation.
4. Add tests for every helper function.
5. Keep all current UI behavior unchanged.

Acceptance at the end of Week 1:

- Phase 2 plan exists in `docs/phase-2-secure-review-workspace.md`.
- `ARCHITECTURE.md` describes the future backend boundary.
- Type contracts compile and helper tests pass.
- `npm run verify` passes.

### Week 2: Backend Design Spike

1. Choose the backend stack for the professional prototype. Recommended default: Node.js + TypeScript + Fastify + SQLite + Prisma.
2. Draft API route contracts for projects, evidence, model runs, human reviews, exports, and audit logs.
3. Draft Prisma schema or equivalent persistence model.
4. Define redaction-gate and evidence-upload request boundaries.
5. Add a no-op backend health endpoint only if the repository is ready for a backend package layout.
6. Do not implement file storage, credential persistence, OCR, or real model gateway secrets until the API and data boundaries are reviewed.

Acceptance at the end of Week 2:

- backend stack decision is documented
- API and data model contracts are reviewable
- security boundaries are explicit
- no existing MVP workflow regresses
- verification remains green

Week 2 design-spike artifacts:

- `docs/phase-2-backend-design-spike.md` records the backend stack decision, API route table, persistence-model scope, security boundaries, and health endpoint decision.
- `src/lib/phase2ApiContracts.ts` keeps the API route contracts, Model Gateway boundary validator, Evidence Upload boundary validator, and Prisma schema draft executable and testable.
- `server/app.ts` adds Fastify routes for health, Workspace, Evidence Vault, mock Model Gateway, Human Review, and Audit Log workflows.
- `server/evidenceVaultService.ts` adds metadata-only evidence upload hashing for the first backend implementation step.
- `server/modelGatewayService.ts` adds Model Gateway adapter readiness plus mock success/failure receipts behind redaction, allowed-data-class, credential, KYC, legal-decision, human-review, and provider-adapter boundaries.
- `server/humanReviewService.ts` adds human-review record creation and status updates.
- `server/reviewWorkspaceRepository.ts` adds Prisma/SQLite persistence for Workspace, Evidence Vault, Model Gateway, Human Review, and Audit Log records.

## Recommended Backend Architecture

Start with a small TypeScript backend in the same repository, not microservices.

Recommended stack:

- Node.js
- TypeScript
- Fastify
- SQLite for the prototype
- Prisma for schema and migrations
- local filesystem storage only for development evidence uploads

Future production substitutions:

- PostgreSQL instead of SQLite
- S3, R2, or GCS instead of local filesystem storage
- KMS-backed secret storage for provider credentials
- queue-based OCR and document extraction workers

Boundary rule: React owns interaction state and workbench rendering. The backend owns durable workspace records, uploaded evidence metadata, model gateway receipts, human review records, exports, and audit logs.

## API Draft

### Workspaces

- `POST /api/workspaces`
  - creates a secure review workspace from project facts
  - returns `WorkspaceRecord`
- `GET /api/workspaces/:workspaceId`
  - returns workspace metadata and current review status
- `PATCH /api/workspaces/:workspaceId`
  - updates workspace metadata

### Evidence Vault

- `POST /api/workspaces/:workspaceId/evidence`
  - accepts multipart upload or external-reference metadata
  - computes file hash server-side
  - returns `EvidenceVaultRecord`
- `GET /api/workspaces/:workspaceId/evidence`
  - returns evidence records without raw file bytes
- `PATCH /api/workspaces/:workspaceId/evidence/:evidenceId`
  - updates status, owner, source note, linked risk flags, or version metadata
- `GET /api/workspaces/:workspaceId/evidence-manifest`
  - returns manifest JSON for current evidence versions

### Model Gateway

- `GET /api/model-gateway/adapters`
  - returns adapter readiness records
  - enables only the local mock adapter in Phase 2A
  - lists OpenAI-compatible and enterprise-proxy adapters as disabled placeholders until server-side secret policy is approved
- `GET /api/model-gateway/provider-policy`
  - returns the server-side provider registry policy report
  - exposes enabled/disabled provider status, required controls, next actions, and Not legal advice boundary
  - does not accept credentials, call external providers, or enable external provider proxying
  - can be refreshed from the Integration Readiness Registry so users see server sync and failure recovery states before any future provider enablement
- `POST /api/model-gateway/provider-policy`
  - evaluates the server-side provider registry policy from sanitized Model Connect receipt metadata only
  - accepts only provider, mode, status, and blockers
  - does not accept session API keys, endpoint hosts, model names, provider labels, raw evidence, external provider calls, or legal-advice output
- `POST /api/workspaces/:workspaceId/model-runs`
  - validates Model Intake metadata
  - applies the Redaction Gate
  - creates mock success receipts only after policy checks
  - persists safe blocked/failed receipts with retry state and remediation steps when policy checks fail
  - returns `ModelGatewayRun` metadata, source evidence hashes, and response hashes without raw payloads
- `GET /api/workspaces/:workspaceId/model-runs`
  - returns model run summaries
- `GET /api/workspaces/:workspaceId/model-runs/:runId`
  - returns a single run receipt without credentials

### Human Review

- `POST /api/workspaces/:workspaceId/reviews`
  - creates a review request for a risk flag, evidence item, model run, or counsel pack
- `PATCH /api/workspaces/:workspaceId/reviews/:reviewId`
  - updates reviewer, comment, status, or decision
- `GET /api/workspaces/:workspaceId/reviews`
  - lists review records for the workspace

### Exports

- `POST /api/workspaces/:workspaceId/exports/counsel-pack`
  - creates Markdown and, later, PDF export metadata
- `GET /api/workspaces/:workspaceId/exports/:exportId`
  - downloads an export artifact

### Audit Logs

- `GET /api/workspaces/:workspaceId/audit-log`
  - lists operation metadata for workspace, evidence, model, review, and export actions

## Data Model Draft

### `WorkspaceRecord`

Durable workspace metadata for one legal/compliance audit preparation matter. Stores name, organization, owner, status, and non-advice boundary.

### `EvidenceVaultRecord`

Durable evidence metadata for uploaded files or external references. Stores file name, MIME type, byte size, file hash, storage mode, owner, source note, linked risk flags, version, and status. It must not store raw KYC or personal data in this Phase 2 draft.

### `ModelGatewayRun`

Durable model-run receipt. Stores provider label, model, purpose, redaction status, payload hash, response hash, source evidence hash, provider metadata, status, retry state, remediation steps, and human-review status. It does not store API keys, raw credentials, or raw model payloads.

### `HumanReviewRecord`

Review workflow record for evidence, risk flags, model runs, or exports. Stores reviewer, target, status, comment, and timestamps. It is workflow metadata, not a legal conclusion.

### `AuditLogRecord`

Append-only operation metadata for review workspace actions. Stores actor, action, target, before/after hashes, summary, and timestamp.

The first TypeScript contract draft lives in `src/lib/phase2Types.ts`.
The API contract and Prisma schema draft live in `src/lib/phase2ApiContracts.ts`.

## Testing Strategy

Near-term tests:

- unit tests for Phase 2 type helper functions
- validation tests for missing evidence vault fields
- tests that raw KYC or personal-data markers block the evidence-vault draft
- tests that model gateway summaries do not expose credentials
- audit-log tests for deterministic IDs
- API route-contract tests for all Week 2 backend domains
- tests that Model Gateway requests cannot bypass Redaction Gate, allowed data classes, credentials, KYC, purpose, or human-review boundaries
- tests that non-mock Model Gateway adapters are blocked until provider proxy policy exists
- tests that Model Gateway failure receipts preserve retry state and remediation steps without leaking secrets
- tests that Evidence Upload requests cannot embed raw document content or raw KYC/personal data in the Phase 2 draft
- tests that the Prisma schema draft contains only the expected Phase 2 persistence models
- route tests for Workspace create/read/update and multipart Evidence Vault upload/list/update/manifest behavior
- repository tests for Workspace, Evidence Vault, Model Gateway, Human Review, and Audit Log persistence across Prisma/SQLite instances

Later backend tests:

- API contract tests for each route
- file hash tests using fixture uploads
- redaction-gate tests before model gateway calls
- model-run ledger tests with mock provider responses
- review workflow status transition tests
- export tests for Markdown and PDF content
- audit-log append tests for evidence, model, review, and export actions

Every new domain helper must be tested before it is wired into UI or API routes.

## Acceptance Criteria

The Phase 2 near-term slice is accepted when:

- `docs/phase-2-secure-review-workspace.md` explains the two-week plan and backend direction.
- `ARCHITECTURE.md` includes the Phase 2 extension architecture.
- `src/lib/phase2Types.ts` exists with workspace, evidence vault, model gateway, human review, and audit log contracts.
- Tests cover each new core helper.
- Backend implementation remains scoped to the reviewed Phase 2 seams and does not introduce raw file persistence, OCR, real provider credentials, or chain writes prematurely.
- The product is never described as an AI judge, legal advice engine, KYC provider, or real chain-writing service.
- `npm run verify` passes.

## Implementation Order After This Slice

1. Review and approve the backend stack. Completed for the professional prototype: Node.js + TypeScript + Fastify + SQLite + Prisma.
2. Add a backend package skeleton only after API contracts are accepted. Started with `server/app.ts`, `server/index.ts`, Workspace/Evidence/Model/Human Review/Audit Log routes, and `npm run start:api`.
3. Implement evidence upload metadata and server-side hashing first. Started with `server/evidenceVaultService.ts`, multipart upload/list/update/manifest routes, and Prisma/SQLite metadata persistence; raw uploaded file-byte storage is still intentionally deferred.
4. Move model calls behind the gateway after evidence and redaction boundaries are stable. Started with adapter readiness, persisted mock gateway run receipts, and API routes; real provider proxying remains deferred.
5. Add human review APIs before server-side Counsel Pack exports. Started with create/update/list routes persisted through Prisma/SQLite.
