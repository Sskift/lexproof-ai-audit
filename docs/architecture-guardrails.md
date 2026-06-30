# Architecture Guardrails

This file defines where new LexProof functionality belongs. Use it before adding features so the codebase does not drift into duplicated UI logic, source-free legal claims, or untestable backend behavior.

The product boundary is constant: LexProof creates audit preparation materials. It is **Not legal advice**.

## Layer Map

```text
React Workbench (src/App.tsx, src/components)
  -> domain and workflow functions (src/lib)
  -> seed/demo data (src/data)
  -> typed API clients and contracts (src/lib/*Client.ts, src/lib/phase2Types.ts)
  -> Phase 2 API (server)
  -> persistence adapter (server/reviewWorkspaceRepository.ts, prisma/schema.prisma)
```

## Dependency Rules

- `src/components` may import from `src/lib`, `src/data`, React, and UI libraries. Components must not contain scoring, hashing, source matching, manifest, model policy, or evidence validation rules.
- `src/lib` owns domain types, deterministic functions, validation, source matching, export builders, and typed client helpers. Most functions should be pure. Browser side effects are allowed only in explicitly named helpers such as `download*` or `print*`.
- `src/data` owns synthetic seed profiles, evidence templates, and reviewed static source libraries. It must not contain business logic or secrets.
- `server` owns Fastify routes, services, repository interfaces, server-side validation, audit logging, and persistence boundaries. It must not import React or browser-only helpers.
- `prisma/schema.prisma` owns durable server schema only. UI code must not depend on Prisma models directly.
- Shared contracts belong in `src/lib/*Types.ts` or focused contract modules. Server and UI can both use these contracts when they do not import browser or React APIs.

## Feature Placement Pattern

Add new capabilities in this order:

1. Type and validation model in `src/lib/<feature>.ts`.
2. Tests beside the model in `src/lib/<feature>.test.ts`.
3. Server service and route only if durability, uploads, model gateway, review workflow, or audit logs are needed.
4. API client helper in `src/lib/<feature>Client.ts` if React needs to call the backend.
5. Focused React component in `src/components/<FeaturePanel>.tsx`.
6. App wiring in `src/App.tsx`.
7. README/docs update only for user-visible behavior changes.

Do not start with UI state and then backfill domain logic.

## Domain Boundaries

### Audit and Risk

Use `src/lib/auditEngine.ts`, `riskExplainers.ts`, and `riskEvidence.ts` for deterministic audit behavior.

- Risk scoring is rule-based and source-linked.
- AI output may suggest questions or missing evidence, but it must not change deterministic scores.
- Every new risk rule needs a test showing why it triggers and when it does not trigger.

### Regulatory Sources

Use a dedicated data + graph split:

- Static reviewed source references: `src/data/regulatoryClauses.ts`.
- Matching and evidence coverage logic: `src/lib/regulatoryGraph.ts`.
- UI rendering: `src/components/RegulatoryCommandCenter.tsx` or focused child panels.

Regulatory source output must say it is a review trigger or audit-prep prompt, not a legal conclusion.

### Evidence

Use `projectModel.ts`, `fileEvidence.ts`, `evidenceAuditTrail.ts`, `evidenceManifest.ts`, `evidenceVaultClient.ts`, and server evidence services.

- Evidence records should store metadata, hashes, status, owner, source notes, linked risk/control IDs, and timestamps.
- Raw document content, raw KYC, personal data, private keys, and secrets must not enter demo data or exports.
- Manifest hashes must be deterministic and covered by tests.
- Evidence status changes that affect export readiness should be visible in UI and audit logs.

### Model Governance

Use `modelConnect.ts`, `modelIntake.ts`, `modelProvider.ts`, `modelConnectionReadiness.ts`, `modelAccessWorkflow.ts`, `modelReviewLedger.ts`, `aiReview.ts`, and server Model Gateway services.

- Client-side API keys are session-only and must not be persisted.
- Server-side external provider calls require a documented secret policy first.
- Redaction Gate and human-review owner are mandatory before model output can enter review workflows.
- Model output is draft audit preparation.

### Human Review

Use `humanReviewWorkflow.ts`, `counselReview.ts`, `HumanReviewPanel.tsx`, and server human review services.

- Review status is workflow metadata, not legal approval.
- Rejected and returned states must be recoverable.
- Review actions should update linked evidence, model run, risk flag, or export readiness consistently.

### Counsel Pack and Exports

Use `counselPack.ts`, `evidenceManifest.ts`, `anchorReceipt.ts`, and `CounselPackPanel.tsx`.

- Export builders should be deterministic from inputs.
- Download/print helpers are the only export side effects.
- Every export repeats the non-advice boundary, source lineage, evidence gaps, manifest hash, and review status when available.
- Simulated anchor receipts must remain clearly labeled as simulated.

## Backend Rules

- Routes stay thin: parse input, call services, persist through repositories, append audit logs, return typed responses.
- Services own validation, hashing, state transitions, and provider/evidence/review policy.
- Repositories own storage. Tests may use memory repositories; API runtime may use Prisma/SQLite.
- Error responses must be actionable and must not leak secrets or raw payloads.
- Audit logs should record actor, action, target, timestamp, summary, and hashes, not raw sensitive content.

## Frontend Rules

- Keep the app as a dense workbench. Do not add a marketing landing page as the first screen.
- Use visible status chips, empty states, recovery actions, and source links for workflows that can fail.
- Use icons for tool actions when an obvious icon exists.
- Avoid nested cards and decorative panels that do not carry workflow state.
- Text must fit mobile and desktop containers without overlap.
- A UI change that affects demo flow needs a screenshot under `docs/assets/screenshots/`.

## Data Rules

- Demo data must be realistic but synthetic.
- Do not commit real personal data, KYC records, credentials, private keys, seed phrases, raw legal matter data, or customer documents.
- Source references should include URL, source name, citation or section label, and review date when available.
- Jurisdiction packs and regulatory source data must route to local counsel for legal conclusions.

## Test Boundaries

- Pure domain functions: unit tests beside the function.
- Backend services and routes: server tests with memory repository where possible.
- UI journeys: React Testing Library tests for user-visible state transitions.
- Screenshots: required for visual/demo flow changes, not for pure library changes.
- Avoid broad snapshots and duplicate tests that assert the same behavior through multiple layers.

## Anti-Drift Checklist

Before committing a feature, check:

- Does the domain logic live outside React components?
- Does the backend route avoid duplicating UI validation as hidden business logic?
- Are generated/exported materials marked Not legal advice?
- Are source links and assumptions visible?
- Are secrets, raw KYC, personal data, and raw files excluded from repo and default exports?
- Are tests focused on new behavior rather than unrelated coverage growth?
- Does `npm run verify` pass?
