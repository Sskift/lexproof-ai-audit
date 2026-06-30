# LexProof Work Universe

This file is the single backlog boundary for LexProof AuditOS. It lists the product, frontend, backend, security, data, demo, and operational work that can move the platform from hackathon prototype to a real audit workspace.

LexProof remains **Not legal advice**. Every item below must produce audit preparation material, evidence workflow metadata, source lineage, model governance records, or counsel handoff artifacts. It must not produce legal conclusions, perform KYC, store secrets in the client, or claim real chain proof without a real verifiable transaction.

## Product Direction

LexProof should become an AI and Web3 regulatory evidence operating system:

- A workspace where teams map launch facts, AI use, token mechanics, custody, data handling, and marketing claims to evidence requests.
- A review system where model output is treated as draft audit preparation, routed through human review, and logged with stable hashes.
- A jurisdiction-aware source and control graph that helps counsel see what needs review without pretending to decide legality.
- A verifiable evidence package generator that exports manifests, model receipts, review status, source lineage, and counsel-ready Markdown/PDF.
- A demoable workbench that feels like a professional GRC/legal operations tool, not a landing page or generic chatbot.

## Current Baseline

The repository already has:

- React + TypeScript + Vite workbench UI.
- Local-first project workspace and synthetic sample profiles.
- Deterministic risk audit, issue explainers, source links, remediation queue, and risk evidence coverage.
- Model Intake, Model Connect, model readiness checks, Redaction Gate, AI Review run ledger, and a mock/OpenAI-compatible client-side model path.
- Phase 2 API routes for secure review workspace, Evidence Vault metadata hashing, mock Model Gateway receipts, Human Review, and Audit Log listing.
- Editable Evidence Ledger, local file metadata hashing, evidence templates, audit trail JSON, deterministic Evidence Manifest, simulated anchor receipt, and Counsel Pack export.
- Jurisdiction checklist and jurisdiction packs for initial US/EU/UK/Singapore/Switzerland/UAE routing.
- Demo script, screenshots, and integration tests for the full secure review journey.

Future work should extend these capabilities, not create parallel demo-only paths.

## Workstreams

### W1. Regulatory Source Graph

Goal: turn jurisdiction packs into a structured source/control/evidence graph.

Build:

- `src/data/regulatoryClauses.ts` with source-backed regulatory references by jurisdiction, regulator, topic, citation, source URL, trigger facts, evidence requests, and counsel questions.
- `src/lib/regulatoryGraph.ts` to match project facts, audit flags, evidence status, and jurisdiction packs to clause references and evidence gaps.
- Frontend panels for jurisdiction risk matrix, clause cards, evidence coverage by source, and local counsel handoff routes.
- Source update metadata: `effectiveAsOf`, `lastReviewedAt`, `sourceUrl`, and reviewer notes.
- Tests proving clause matching, evidence coverage, source visibility, and non-advice wording.

Acceptance:

- A user can select jurisdictions and see source-linked review triggers with missing evidence.
- The UI never says a project is legally compliant or non-compliant.
- Counsel Pack exports matched clauses, evidence gaps, and local counsel questions.

Do not build:

- Automated legal opinions.
- Jurisdiction conclusions without source links.
- Scrapers that silently change rule behavior without review.

### W2. Evidence Vault and Provenance

Goal: make evidence handling durable, versioned, and reviewable while staying metadata-first.

Build:

- Versioned Evidence Vault records with parent/child relationships, replacement reason, owner, source notes, and linked risk/control IDs.
- Server-side manifest generation from persisted evidence metadata.
- Evidence state machine: `draft`, `requested`, `received`, `under-review`, `verified`, `rejected`, `superseded`.
- Evidence empty states, invalid upload errors, duplicate hash detection, and rejected-evidence recovery flows.
- Optional object storage adapter only after retention, privacy, and access policy are documented.

Acceptance:

- Adding, replacing, rejecting, and verifying evidence changes the manifest bundle hash.
- Raw evidence bytes are not included in Counsel Pack or manifest JSON by default.
- Empty evidence journeys tell the user exactly what to add next.

Do not build:

- Raw KYC intake.
- Private key handling.
- File persistence without retention and deletion rules.

### W3. Model Gateway and AI Governance

Goal: move BYOM/BYOK model access behind a server policy boundary with review receipts.

Build:

- Server-side provider registry with disabled-by-default adapters.
- Secret handling policy before real external model calls.
- Model Gateway route that enforces Redaction Gate, allowed data classes, purpose, reviewer, and final-decision blockers.
- Model run evaluation records: payload hash, response hash, source evidence hash, provider metadata, human-review status, and retry/error state.
- Admin-visible model connection failures with remediation steps.

Acceptance:

- A model connection failure returns a user-actionable error without leaking secrets.
- Every model output that enters the workspace creates a human-review-required event.
- Deterministic risk scoring never depends on model output.

Do not build:

- Client-persisted API keys.
- Final legal-decision roles for models.
- Model calls using raw KYC, private keys, or personal data.

### W4. Human Review Workflow

Goal: make review status operational instead of decorative.

Build:

- Review queues by target type: evidence, model run, risk flag, clause match, counsel pack.
- Reviewer assignment, due date, status history, decision reason, and linked evidence changes.
- Return-to-evidence flow when a reviewer requests more support.
- Rejection flow that preserves the rejected item and opens a replacement action.
- Exportable review timeline with audit log IDs.

Acceptance:

- Review actions update the affected evidence/control/export readiness.
- Rejected and returned items are visible and recoverable.
- Counsel Pack includes review status without representing it as legal approval.

Do not build:

- Signed legal opinions.
- Irreversible approval states.
- Hidden reviewer changes.

### W5. Counsel Pack and Export System

Goal: make exports reliable artifacts for counsel, compliance, and judges.

Build:

- Versioned Counsel Pack records with manifest hash, review status, source pack, and export timestamp.
- Markdown and print/PDF flows that share the same export builder.
- Export templates for launch review, RWA/tokenized asset review, AI governance review, custody review, and marketing review.
- Download receipts for manifest JSON, model-run receipts, evidence audit trail, and simulated/real anchor receipts.
- Export diff view between pack versions.

Acceptance:

- A judge can reproduce the demo export from a clean project.
- Counsel can see facts, assumptions, source links, evidence gaps, review status, and hashes in one packet.
- Every export repeats the Not legal advice boundary.

Do not build:

- Export content that hides missing evidence.
- Real chain claims for simulated receipts.

### W6. Frontend Command Center

Goal: make the product feel like a real review cockpit.

Build:

- A first-screen Regulatory Command Center with project readiness, jurisdiction risk matrix, evidence coverage, model readiness, human review status, and export readiness.
- Clear left-to-right journey: project facts -> model/evidence intake -> risk/source graph -> review -> vault/manifest -> counsel export.
- Dense professional panels, icons, tabs, status chips, empty states, error recovery, and screenshot-ready demo surfaces.
- Frontend copy that is concise, operational, and consistent with audit preparation.
- Mobile and desktop responsive checks for text overflow and panel collisions.

Acceptance:

- A first-time judge understands the workflow in under one minute.
- Empty, loading, failure, rejected, and success states all have clear next actions.
- UI tests cover core journeys; screenshots prove high-value flows render.

Do not build:

- Marketing landing pages inside the app.
- Decorative visuals that obscure workflow state.
- Large frontend rewrites without preserving current journeys.

### W7. Backend Platform

Goal: turn the Phase 2 API skeleton into a maintainable service boundary.

Build:

- Fastify route modules split by domain: workspaces, evidence vault, model gateway, human review, audit log, exports.
- Repository interfaces with Prisma implementations and memory implementations for tests.
- Request validation, typed error responses, and consistent audit logging.
- Optional background jobs for export rendering and long-running model calls.
- Auth/RBAC design before multi-user or organization features.

Acceptance:

- Route tests prove validation, persistence, and audit log behavior.
- Services can be tested without React.
- Repository changes do not leak Prisma models into UI code.

Do not build:

- Broad infrastructure before product flows need it.
- Multi-tenant auth without a clear permission model.

### W8. Security, Privacy, and Compliance Operations

Goal: make the workspace safe enough for realistic demos and future pilots.

Build:

- Data classification rules for public, confidential, personal data, KYC, secrets, and private keys.
- Secret scanning in model settings, evidence notes, and export payloads.
- Retention and deletion policy before storing raw files.
- Audit log export with actor, action, target, timestamp, before/after hashes, and non-secret summaries.
- Security review checklist for model providers, evidence storage, and anchor integrations.

Acceptance:

- Blocked data classes produce explicit, recoverable UI messages.
- Exports do not contain credentials, private keys, or raw KYC.
- Tests cover boundary validators and redaction blockers.

Do not build:

- Real KYC processing.
- Credential storage in browser localStorage.
- Unreviewed third-party uploads.

### W9. Integrations

Goal: connect to useful external systems only after boundaries are explicit.

Build candidates:

- OpenAI-compatible server provider adapter after secret policy approval.
- Object storage adapter after retention policy approval.
- Optional wallet/on-chain anchor adapter after signing and privacy boundaries are documented.
- Document parser/OCR adapter after raw-document handling is approved.
- GRC/ticket export for remediation queues.

Acceptance:

- Every adapter has a disabled state, readiness state, validation errors, and tests.
- Integration failures are visible and recoverable.
- No adapter changes core audit scoring without an explicit domain function and tests.

Do not build:

- Direct browser-to-provider production flows.
- Real chain writes from demo buttons.
- Silent data uploads.

### W10. Demo, Submission, and Judge Readiness

Goal: keep the repository always demoable.

Build:

- One canonical demo script for a clean clone.
- Screenshots for every judge-visible workflow after UI changes.
- A short seeded scenario library with realistic but synthetic data.
- Submission narrative that maps product features to hackathon criteria.
- Known-limitations section that is honest about local-first, simulated, and deferred features.

Acceptance:

- `npm run verify` passes from a clean install.
- A judge can run the demo without private credentials.
- The README points to current screenshots and current commands.

Do not build:

- Demo paths that require real secrets.
- Screenshots that no longer match the app.

## Build Sequence

Use this sequence unless a user asks for a narrower urgent slice:

1. Regulatory Source Graph: clause library, graph matcher, command center panels, source-linked export.
2. Evidence Vault hardening: evidence versioning, server manifest, duplicate/rejection recovery.
3. Model Gateway production boundary: server-side provider policy, secret handling, error states, run evaluation records.
4. Review operations: reviewer queues, status history, returned/rejected recovery, export readiness.
5. Export versioning: persisted counsel packs, diffing, server-side export records.
6. Auth/RBAC and organizations: only after single-user workflows are stable.
7. Optional real anchoring and raw document storage: only after privacy, wallet, and retention boundaries are written and tested.

## Definition of Done for New Work

Every non-document feature must include:

- A domain function or service in the correct layer.
- Focused tests for each new core function or boundary validator.
- A UI path only after the domain behavior exists.
- Empty, failure, and recovery states when the user can get stuck.
- Not legal advice wording in any generated or exported review material.
- README or docs updates when the user workflow changes.
- `npm run verify` before commit and push.
- Screenshot evidence when visible UI or demo path changes.

## Non-Goals

LexProof should not become:

- A legal advice chatbot.
- A real KYC processor.
- A private-key or wallet custody tool.
- A generic project management board.
- A broad GRC clone without AI/Web3 evidence specificity.
- A source-free regulatory classifier.
- A chain-proof product that only produces simulated receipts.
