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
- Phase 2 API routes for secure review workspace, Evidence Vault metadata hashing, duplicate-hash blocking, rejected-evidence replacement lineage, mock Model Gateway success/failure receipts, Human Review, server-side Counsel Pack export metadata records, and Audit Log listing.
- Local Human Review operations with reviewer assignment, due dates, saved status history, source clause-match refresh actions, linked evidence updates, and downloadable timeline JSON with audit log IDs.
- Editable Evidence Ledger, empty-state Evidence Intake Guidance, local file metadata hashing, evidence templates, audit trail JSON, deterministic Evidence Manifest, simulated anchor receipt, Counsel Pack export templates, Export Safety Gate data-boundary blocker, local Counsel Pack version history with manifest/Markdown hashes and diff metadata, and Phase 2 server export records for the latest Pack Version.
- Jurisdiction checklist and jurisdiction packs for initial US/EU/UK/Singapore/Switzerland/UAE routing.
- Demo script, screenshots, Demo Scenario Library launcher, and integration tests for the full secure review journey, Counsel Pack template selection, version-history export path, server export-record path, and seeded judge paths.

Future work should extend these capabilities, not create parallel demo-only paths.

## Workstreams

### W1. Regulatory Source Graph

Goal: turn jurisdiction packs into a structured source/control/evidence graph.

Build:

- `src/data/regulatoryClauses.ts` with source-backed regulatory references by jurisdiction, regulator, topic, citation, source URL, trigger facts, evidence requests, and counsel questions.
- `src/lib/regulatoryGraph.ts` to match project facts, audit flags, evidence status, and jurisdiction packs to clause references and evidence gaps.
- Frontend panels for jurisdiction risk matrix, clause cards, evidence coverage by source, and local counsel handoff routes.
- Source update metadata: `effectiveAsOf`, `lastReviewedAt`, `sourceUrl`, and reviewer notes. The first Source Review Ledger is implemented in `src/lib/regulatorySourceReview.ts` and `RegulatoryCommandCenter`: it shows current/review-due/metadata-missing source records and refresh actions without making legal conclusions.
- Tests proving clause matching, evidence coverage, source visibility, source review freshness, and non-advice wording.

Acceptance:

- A user can select jurisdictions and see source-linked review triggers with missing evidence.
- The UI never says a project is legally compliant or non-compliant.
- Counsel Pack exports matched clauses, evidence gaps, Source Review Ledger freshness metadata, and local counsel questions.

Do not build:

- Automated legal opinions.
- Jurisdiction conclusions without source links.
- Scrapers that silently change rule behavior without review.

### W2. Evidence Vault and Provenance

Goal: make evidence handling durable, versioned, and reviewable while staying metadata-first.

Build:

- Versioned Evidence Vault records with parent/child relationships, replacement reason, owner, source notes, and linked risk/control IDs.
- Server-side manifest generation from persisted evidence metadata. The first dedicated manifest builder is implemented in `src/lib/evidenceVaultManifest.ts` and the Evidence Vault manifest route: it uses stable ordering, status/version/lineage hashes, and excludes raw bytes plus source-note body content.
- Evidence state machine: `draft`, `requested`, `received`, `under-review`, `verified`, `rejected`, `superseded`. The first server-enforced transition guard is implemented in `src/lib/evidenceVaultWorkflow.ts` and the Evidence Vault PATCH route; rejected or superseded records cannot be directly reactivated outside replacement recovery.
- Evidence empty states, invalid upload errors, duplicate hash detection, and rejected-evidence recovery flows. The first empty-ledger guidance is implemented in `src/lib/evidenceIntakeGuidance.ts` and `EvidenceLedger`: it recommends the safest template action and missing risk evidence requests without raw KYC, private keys, credentials, personal data, or legal conclusions.
- Optional object storage adapter only after retention, privacy, and access policy are documented.

Acceptance:

- Adding, replacing, rejecting, and verifying evidence changes the manifest bundle hash.
- Raw evidence bytes are not included in Counsel Pack or manifest JSON by default.
- Empty evidence journeys tell the user exactly what to add next from risk evidence coverage and recommended templates.
- Invalid Evidence Vault status transitions return actionable recovery guidance before any record or audit log mutation.

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
- Safe Model Gateway failure receipts with run ID, retry state, error code, and remediation steps.
- Model run evaluation records: payload hash, response hash, source evidence hash, provider metadata, human-review status, and retry/error state. The first metadata-only evaluation artifact is implemented in `src/lib/modelGatewayEvaluation.ts` and rendered in `SecureReviewWorkspace` with JSON download.
- Admin-visible model connection failures with remediation steps.

Acceptance:

- A model connection or gateway policy failure returns a user-actionable error without leaking secrets or raw model payloads.
- Every model output that enters the workspace creates a human-review-required event.
- Secure Review Journey exposes a metadata-only Model Gateway Evaluation artifact for human review.
- Deterministic risk scoring never depends on model output.

Do not build:

- Client-persisted API keys.
- Final legal-decision roles for models.
- Model calls using raw KYC, private keys, or personal data.

### W4. Human Review Workflow

Goal: make review status operational instead of decorative.

Build:

- Review queues by target type: evidence, model run, risk flag, clause match, counsel pack. Clause-match source review actions now enter the local Human Review queue from `regulatorySourceReview.ts`, and the server queue view in `src/lib/serverHumanReviewQueue.ts` plus `GET /api/workspaces/:workspaceId/reviews/queue` accepts `clause-match` filters with target/status/reviewer next actions.
- Reviewer assignment, due date, status history, decision reason, and linked evidence/model-run changes. Server review updates now sync Evidence Vault status and Model Gateway `humanReviewStatus` through `src/lib/serverHumanReviewEffects.ts` and append metadata-only audit-log records.
- Return-to-evidence flow when a reviewer requests more support.
- Rejection flow that preserves the rejected item and opens a replacement action.
- Exportable review timeline with audit log IDs.

Acceptance:

- Review actions update the affected evidence/control/export readiness. Server-side effects update linked Evidence Vault status and Model Gateway human-review status for matching review decisions.
- Rejected and returned items are visible and recoverable.
- Human Review queue views can be filtered by target type, status, and reviewer without treating review as legal approval.
- Counsel Pack includes review status without representing it as legal approval.

Do not build:

- Signed legal opinions.
- Irreversible approval states.
- Hidden reviewer changes.

### W5. Counsel Pack and Export System

Goal: make exports reliable artifacts for counsel, compliance, and judges.

Build:

- Versioned Counsel Pack records with manifest hash, review status, source pack, export timestamp, and metadata-only server export records.
- Markdown and print/PDF flows that share the same export builder.
- Export templates for launch review, RWA/tokenized asset review, AI governance review, custody review, and marketing review; the initial five-template set is implemented and should be extended only when new review scenarios need it.
- Export Safety Gate that routes the same data-boundary report into Markdown preview, Markdown/PDF download gating, manifest JSON gating, simulated anchor gating, version-save gating, and server export-record gating.
- Download receipts for manifest JSON, model-run receipts, evidence audit trail, and simulated/real anchor receipts.
- Export diff view between pack versions.
- Source Review Ledger export in Markdown so reviewed source counts, next review dates, reviewer notes, and refresh actions survive the counsel handoff without becoming legal conclusions.

Acceptance:

- A judge can reproduce the demo export from a clean project.
- Counsel can see facts, assumptions, source links, source freshness, evidence gaps, review status, and hashes in one packet.
- Blocked private-key, credential, or raw-KYC findings stop export handoff until remediated.
- Every export repeats the Not legal advice boundary.

Do not build:

- Export content that hides missing evidence.
- Real chain claims for simulated receipts.

### W6. Frontend Command Center

Goal: make the product feel like a real review cockpit.

Build:

- A first-screen Regulatory Command Center with project readiness, jurisdiction risk matrix, evidence coverage, model readiness, human review status, and export readiness. The first Workspace Action Queue is implemented in `src/lib/workspaceActionQueue.ts` and `RegulatoryCommandCenter`: it ranks recoverable project facts, source evidence gaps, source refresh, human review, security readiness, and export actions with Not legal advice wording.
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

- Fastify route modules split by domain: workspaces, evidence vault, model gateway, human review, audit log, exports. The first W7 splits are implemented for Workspace routes in `server/workspaceRoutes.ts`, Model Gateway routes in `server/modelGatewayRoutes.ts`, Counsel Pack export routes in `server/counselPackExportRoutes.ts`, Human Review routes in `server/humanReviewRoutes.ts`, Evidence Vault routes in `server/evidenceVaultRoutes.ts`, and Audit Log routes in `server/auditLogRoutes.ts`; continue extracting shared system routes without changing route contracts.
- Repository interfaces with Prisma implementations and memory implementations for tests.
- Request validation, typed error responses, and consistent audit logging. The shared typed error helper is implemented in `server/apiError.ts` and currently wired into Workspace, Evidence Vault, Model Gateway, Human Review, Counsel Pack export, and Audit Log filter failures with stable error codes and the audit-prep boundary.
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
- Secret scanning in model settings, evidence notes, Evidence Vault upload metadata, and export payloads. The first export-side classifier is implemented in `src/lib/dataBoundary.ts` for private-key-like values, API-key-like credentials, raw KYC references, personal-data references, and confidentiality labels. The first server Evidence Vault metadata boundary is implemented in `src/lib/evidenceUploadBoundary.ts` and blocks credential material, private-key-like values, and raw KYC references before record creation.
- Retention and deletion policy before storing raw files. The first Evidence Ledger retention gate is implemented in `src/lib/retentionPolicy.ts` and `EvidenceLedger`: it blocks Evidence Vault sync for private-key-like material, API-key-like credentials, and raw KYC references, shows recoverable remediation, and exports metadata-only retention policy JSON.
- Audit log export with actor, action, target, timestamp, before/after hashes, and non-secret summaries. The first Secure Review Audit Log Export is implemented in `src/lib/auditLogExport.ts` and `SecureReviewWorkspace` with metadata-only JSON download.
- Security review checklist for model providers, evidence storage, and anchor integrations. The first checklist is implemented in `src/lib/securityReviewChecklist.ts` and `SecurityReviewChecklistPanel`: it combines Model Connect, Evidence Retention Readiness, Export Safety Gate, manifest, and evidence state into ready/needs-review/blocked gates with recovery actions before real providers, object storage, or chain writes are enabled.

Acceptance:

- Blocked data classes produce explicit, recoverable UI messages.
- Exports do not contain credentials, private keys, or raw KYC.
- Evidence Vault sync cannot run while retention blockers are present.
- Evidence Vault API uploads reject unsafe metadata without echoing secrets or raw KYC snippets.
- Secure Review audit logs can be exported without raw secrets, raw KYC, or legal conclusions.
- Security Review Checklist surfaces model provider, evidence storage, and anchor integration blockers before W9 adapters are enabled.
- Tests cover boundary validators and redaction blockers.

Do not build:

- Real KYC processing.
- Credential storage in browser localStorage.
- Unreviewed third-party uploads.

### W9. Integrations

Goal: connect to useful external systems only after boundaries are explicit.

Implemented first slice:

- Integration Readiness Registry in `src/lib/integrationReadiness.ts` and `IntegrationReadinessPanel`: maps security-review gates into adapter-level ready, needs-policy, blocked, and disabled states for server model providers, object storage, chain anchors, document parser/OCR, and GRC ticket export. It exposes sanitized validation errors and recovery actions without enabling external providers, raw uploads, OCR, ticket creation, or chain writes.
- Metadata-only GRC Ticket Export in `src/lib/grcTicketExport.ts` and `GrcTicketExportPanel`: turns the Risk Audit remediation queue into downloadable ticket JSON only when the GRC adapter readiness gate is clear. Blocked adapter states produce sanitized blockers and no ticket payload. It does not create real external Jira, Linear, ServiceNow, or GRC records.

Build candidates:

- OpenAI-compatible server provider adapter after secret policy approval.
- Object storage adapter after retention policy approval.
- Optional wallet/on-chain anchor adapter after signing and privacy boundaries are documented.
- Document parser/OCR adapter after raw-document handling is approved.
- Real GRC/ticket system adapter after destination mapping, authentication, and export redaction policies are approved.

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

Implemented first slice:

- Demo Scenario Library in `src/data/demoScenarios.ts`, `src/lib/demoScenarioLibrary.ts`, and `DemoScenarioLibrary`: maps realistic synthetic sample profiles into short judge-ready routes, expected artifacts, focus tags, and recommended workbench tabs. The validation layer rejects unknown samples, missing Not legal advice boundaries, weak paths, empty artifacts, raw KYC, private-key, seed-phrase, and live-key demo text.

Build:

- One canonical demo script for a clean clone.
- Screenshots for every judge-visible workflow after UI changes.
- Additional seeded scenario library entries only when they map to real product workflows and remain synthetic.
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
5. Export versioning and safety: persisted counsel packs, diffing, server-side export records, and data-boundary export blockers.
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
