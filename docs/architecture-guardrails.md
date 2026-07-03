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

The intended shape is a modular monolith for the hackathon and early pilot phase. Add focused modules inside the existing folders before adding new top-level packages. A new top-level directory needs a clear runtime boundary, such as a worker, CLI, or independent package that cannot live cleanly in `src`, `server`, `docs`, or `prisma`.

## Target Architecture Blueprint

LexProof has one product architecture: a local-first review workbench with an optional Phase 2 API boundary. New features must strengthen this architecture instead of adding disconnected demo islands.

```text
Browser runtime
  React components
    collect input, render workflow state, show empty/error/recovery actions
  src/lib domain modules
    validate, score, hash, match sources, build artifacts, enforce boundaries
  src/data static data
    synthetic scenarios, evidence templates, reviewed source references
  src/lib/*Client.ts
    typed browser-to-API requests with sanitized errors

Server runtime
  server/app.ts
    composes route modules and shared hooks
  server/*Routes.ts
    parse requests, call services, return typed responses
  server/*Service.ts
    validate, hash, transition state, create receipts, append audit summaries
  server/reviewWorkspaceRepository.ts
    memory and Prisma repository implementations
  prisma/schema.prisma
    durable metadata schema only
```

Data moves in one direction for user workflows:

```text
Project facts
  -> deterministic audit and source graph
  -> evidence/model intake
  -> human review
  -> vault/manifest/audit log
  -> counsel/submission/export artifacts
```

AI and external systems are side inputs only. They may create draft audit-prep questions, receipts, or metadata records, but they must not alter deterministic risk scores or source matching without a focused domain function and tests.

## Feature Addition Protocol

Use this protocol before creating or moving files:

1. Name the workstream from `docs/work-universe.md`.
2. Name the user journey step, such as `Evidence Ledger -> Evidence Vault -> Counsel Pack`.
3. Add or update the smallest `src/lib` domain function first when behavior changes.
4. Add static/demo data in `src/data` only when the behavior needs reviewed source, scenario, or template material.
5. Add a server route/service only when durability, audit logging, model gateway, vault, review, export, or policy evaluation is required.
6. Add a typed client in `src/lib/<feature>Client.ts` before wiring React to a server route.
7. Add UI in one focused component or the existing owning component.
8. Update README/docs only for user-visible behavior, API contracts, demo flow, or governance rules.
9. Add tests only for new core behavior or user-visible workflow state.
10. Capture screenshots only for durable judge-visible UI changes.

If a slice needs more than one new domain module, one new route family, and one new panel, split it unless the pieces are inseparable for a runnable journey.

## Feature Shape Decision

Choose exactly one primary shape for each slice before editing files. This keeps new capability from spreading into every layer without a reason.

| Slice shape | When to use it | Allowed owners | Required proof |
| --- | --- | --- | --- |
| Local-first domain slice | Pure validation, hashing, matching, export building, status calculation, or privacy rule | `src/lib`, nearest `src/lib/*.test.ts`, docs if user-visible | Focused domain test, full verify |
| Static data/source slice | Reviewed clause metadata, synthetic scenario, demo readiness entry, or evidence template | `src/data`, matching `src/lib` tests when behavior changes, docs/screenshot when visible | Data validation or matching test |
| UI workflow slice | User can click into a new state, empty state, error state, recovery action, or export action | Existing `src/components` owner, `src/App.tsx` wiring, domain helper first | App/component workflow test and screenshot when judge-visible |
| Server metadata slice | Durability, audit log, route validation, model/evidence/review/export persistence, or policy receipt | `server/*Routes.ts`, `server/*Service.ts`, repository, shared `src/lib` contract/client | Route/service tests, `npm run build:server`, full verify |
| External integration readiness slice | A future provider/storage/parser/GRC/chain adapter needs policy and failure states | Policy module, policy route/client, readiness UI, no real side effects | Policy tests, route tests, disabled-state UI proof |
| Documentation constraint slice | Scope, architecture, workflow, demo path, or governance rules change | `docs`, `README.md`, `WORKFLOW.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md` | Link/command inspection, full verify before push |

Only widen the shape when the user journey cannot run without it. For example, a server metadata slice may need a small UI state to prove the route is usable, but it should not also add a new regulatory source unless that source is the reason for the route.

## Architecture Registration Checklist

Before implementing a non-trivial feature, write down this placement record in the issue, agent prompt, or implementation note:

```text
Feature:
Workstream:
User journey:
Frontend surface:
Domain module:
Backend route/service:
Data file:
Shared contract:
Tests:
Screenshot:
Not legal advice boundary:
Privacy/security boundary:
Commit scope:
```

Use `none` when a layer is intentionally not touched. If a field cannot be filled without guessing, the feature is too broad or not ready for implementation.

## Drift Control Rules

These rules keep new functionality aligned with the current structure:

- Prefer one bounded context per commit. Do not mix a broad CSS redesign, new backend route family, regulatory data expansion, and export changes unless they are required for one runnable user journey.
- Add the domain function before UI wiring when behavior changes.
- Add the typed API client before React calls a new server route.
- Add server services before route handlers accumulate validation, hashing, or transition logic.
- Add static source/demo data only in `src/data`, never inside JSX.
- Update docs only when user behavior, architecture rules, API boundaries, workflow rules, or demo paths change.
- Do not add a test only because a file changed. Add a test because a user-visible behavior, core function, route contract, or privacy boundary could regress.

## Architecture Contract

LexProof should grow as a layered review workspace, not as a collection of disconnected demos. New work must preserve these contracts:

- **Frontend contract:** React components render workflow state, collect user input, show empty/error/recovery states, and call typed helpers. Components do not decide legal/compliance rules, evidence hashes, model policy, export contents, or server status transitions.
- **Domain contract:** `src/lib` owns deterministic rules, workflow state transitions, validation, hashing, export builders, API client contracts, and security boundaries. A core function should be callable from a test without rendering React.
- **Data contract:** `src/data` owns synthetic profiles, scenario definitions, evidence templates, demo readiness metadata, and reviewed static source libraries. Data files do not import application logic.
- **Backend contract:** `server` owns durable API behavior, request validation, repository access, audit logging, model gateway receipts, vault metadata, review records, and export records. Routes are thin; services and repositories carry behavior.
- **Persistence contract:** `prisma/schema.prisma` describes durable server state only. UI and client-side domain modules depend on stable TypeScript contracts, not Prisma models.
- **Documentation contract:** README explains how to run and demo; `docs/project-governance.md` is the operating contract; `docs/work-universe.md` defines what to build; this file defines where it belongs; `docs/engineering-workflow.md` defines how to verify and keep the repository clean.

If a proposed feature cannot name its frontend, domain, backend, data, and verification boundaries, split it before implementation.

## No-Drift Placement Rules

Use these rules to stop architecture drift during normal agent work:

| Change pressure | Correct response | Drift to reject |
| --- | --- | --- |
| A component needs a new status calculation | Move the calculation to `src/lib/<context>.ts` and import the result | Inline branching rules spread across JSX |
| A panel needs to call an API | Create or reuse `src/lib/<feature>Client.ts` | Multiple direct `fetch` calls in components |
| A route needs validation | Put reusable validation in a service or shared domain helper | Route handlers that mutate before validation |
| A regulatory rule needs source text | Add reviewed metadata to `src/data/regulatoryClauses.ts` | Hard-coded legal/source copy in a component |
| An export needs new content | Extend the export builder in `src/lib` and test it | String assembly in JSX or route handlers |
| A workflow needs server state | Add repository methods and route tests | UI-only state pretending to be durable |
| A screenshot proves only decoration | Do not commit it | Screenshot churn without workflow value |

Naming conventions:

- Domain modules: `src/lib/<boundedContext>.ts`.
- Domain tests: `src/lib/<boundedContext>.test.ts`.
- Browser API clients: `src/lib/<boundedContext>Client.ts`.
- React workflow panels: `src/components/<WorkflowPanel>.tsx`.
- Server route families: `server/<boundedContext>Routes.ts`.
- Server services: `server/<boundedContext>Service.ts`.
- Repository changes: extend `server/reviewWorkspaceRepository.ts` before route code depends on persistence.

## Dependency Rules

- `src/components` may import from `src/lib`, `src/data`, React, and UI libraries. Components must not contain scoring, hashing, source matching, manifest, model policy, or evidence validation rules.
- `src/lib` owns domain types, deterministic functions, validation, source matching, export builders, and typed client helpers. Most functions should be pure. Browser side effects are allowed only in explicitly named helpers such as `download*` or `print*`.
- `src/data` owns synthetic seed profiles, evidence templates, and reviewed static source libraries. It must not contain business logic or secrets.
- `server` owns Fastify routes, services, repository interfaces, server-side validation, audit logging, and persistence boundaries. It must not import React or browser-only helpers.
- `prisma/schema.prisma` owns durable server schema only. UI code must not depend on Prisma models directly.
- Shared contracts belong in `src/lib/*Types.ts` or focused contract modules. Server and UI can both use these contracts when they do not import browser or React APIs.

Forbidden dependency directions:

- `src/lib` must not import from `src/components`, `src/App.tsx`, or `server`.
- `src/data` must not import from `src/lib`, `src/components`, or `server`.
- `server` must not import browser-only helpers that touch `window`, `document`, `localStorage`, downloads, print, or React state.
- React components must not import Prisma types directly.
- Tests may import across layers only to verify a real integration boundary; they must not make production code depend on test helpers.

## Bounded Contexts

Use these contexts to avoid creating generic helpers or moving behavior into `App.tsx`.

| Context | Canonical types/artifacts | Domain owner | UI owner | Server owner | Drift warning |
| --- | --- | --- | --- | --- | --- |
| Workspace/project | `ProjectProfile`, validation errors, scenario IDs | `src/lib/projectModel.ts`, `src/lib/demoScenarioLibrary.ts` | `ProjectWorkspace`, `AuditWizard`, `DemoScenarioLibrary` | `workspaceRoutes`, repository workspace methods | Project validation duplicated in JSX or route handlers |
| Audit/risk | audit result, risk flags, issue cards, remediation queue | `auditEngine.ts`, `riskExplainers.ts`, `riskEvidence.ts` | `Risk Audit` sections in `App.tsx` or focused panels | Future ticket/export routes only | AI output or server state changing deterministic score |
| Regulatory graph | clause IDs, source review records, control matrix, source pack | `regulatoryGraph.ts`, `regulatorySourceReview.ts`, `regulatoryControlMatrix.ts`, `regulatorySourcePack.ts` | `RegulatoryCommandCenter`, `RegulatoryControlMatrixPanel` | Future reviewed-source workflow routes | Source clauses hard-coded in components |
| Evidence | `EvidenceItem`, manifest, vault record, retention report | `evidenceManifest.ts`, `retentionPolicy.ts`, `evidenceVaultWorkflow.ts`, `evidenceUploadBoundary.ts` | `EvidenceLedger` | `evidenceVaultRoutes`, `evidenceVaultService` | Raw evidence bytes or unsafe metadata flowing into exports |
| Model governance | model settings, intake profile, run receipt, evaluation record | `modelConnect.ts`, `modelIntake.ts`, `modelProvider.ts`, `modelReviewLedger.ts`, `modelGatewayEvaluation.ts` | `ModelSettingsPanel`, `AIReviewPanel`, `ModelIntakePanel` | `modelGatewayRoutes`, `modelGatewayService` | API keys persisted or model output treated as a decision |
| Human review | review item, timeline, status history, linked effects | `humanReviewWorkflow.ts`, `serverHumanReviewQueue.ts`, `serverHumanReviewEffects.ts` | `HumanReviewPanel` | `humanReviewRoutes`, `humanReviewService` | Approval labels that imply legal sign-off |
| Counsel/export | Markdown pack, export template, version record, submission pack | `counselPack.ts`, `counselPackTemplates.ts`, `counselPackVersions.ts`, `submissionPack.ts`, `dataBoundary.ts` | `CounselPackPanel`, `SubmissionPackPanel` | `counselPackExportRoutes`, `counselPackExportService` | Export string assembly hidden in JSX |
| Security/readiness | classification finding, redaction report, integration gate | `dataClassification.ts`, `dataBoundary.ts`, `securityReviewChecklist.ts`, `integrationReadiness.ts` | `SecurityReviewChecklistPanel`, `IntegrationReadinessPanel` | Route/service validators | Blockers implemented only as visual warnings |

When adding a file, place it under one context. If it belongs to several contexts, create a small contract type in `src/lib` and keep each context's behavior local.

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

### Slice Shape

For most features, keep the first slice to this shape:

1. One domain function or data entry that changes real behavior.
2. One focused test proving that behavior.
3. One UI or API path that exposes the behavior, if needed.
4. One failure/empty/recovery state when a user can get stuck.
5. One docs update when the workflow or demo path changes.
6. One screenshot only when the UI change is judge-visible.

Avoid mixing unrelated domain changes, broad CSS redesign, API refactors, and demo script churn in the same commit.

## Feature Routing Table

Use this table before creating files.

| New thing | Put it here | Do not put it here | Why |
| --- | --- | --- | --- |
| Risk scoring, flags, source-linked issue rationale | `src/lib/auditEngine.ts`, `src/lib/riskExplainers.ts`, `src/lib/riskEvidence.ts` | React components or server routes | Risk must stay deterministic and testable without UI/API state |
| Regulatory clauses or reviewed source references | `src/data/regulatoryClauses.ts` | `src/lib` hard-coded arrays or JSX | Data can be reviewed independently from matching logic |
| Regulatory matching, source freshness, evidence gaps | `src/lib/regulatoryGraph.ts`, `src/lib/regulatorySourceReview.ts` | Components | Matching needs focused tests and stable export behavior |
| Model provider settings, readiness, receipts | `src/lib/model*.ts`, server model gateway service/routes | Local component state only | Model governance must stay consistent across UI and backend |
| Evidence status, hashing, vault workflow | `src/lib/evidence*.ts`, `server/evidenceVault*.ts` | Counsel Pack UI or generic helpers | Evidence changes affect manifests, retention, review, and exports |
| Review queues and status effects | `src/lib/humanReviewWorkflow.ts`, `src/lib/serverHumanReviewEffects.ts`, server review routes | Counsel Pack-only state | Review decisions must update linked evidence/model/export readiness |
| Export builders and artifact hashes | `src/lib/counselPack*.ts`, `src/lib/regulatorySourcePack.ts` | JSX string assembly | Exports need deterministic tests and no hidden UI-only behavior |
| API calls from the browser | `src/lib/<feature>Client.ts` | Direct `fetch` calls inside multiple components | Clients centralize typed responses and error recovery |
| API route behavior | `server/<feature>Routes.ts`, `server/<feature>Service.ts` | `server/app.ts` | Routes stay composable and service behavior stays testable |
| Demo fixtures | `src/data/*` and docs screenshots | `src/lib` or server seed state | Fixtures must be synthetic and easy to audit |
| Visual-only panel state | `src/components/<FeaturePanel>.tsx` | `src/lib` | UI state belongs in UI when it has no domain meaning |

If a feature touches more than three rows, split it into incremental slices. Each slice should produce one demonstrable behavior and one focused verification path.

## State Ownership

- Browser `localStorage` is for the current single-user project snapshot and demo continuity only.
- Session-only values such as API keys stay in React state and must not be serialized into project, evidence, export, or review records.
- Server persistence owns workspace, evidence metadata, model-run receipts, human-review records, export metadata, and audit logs when the Phase 2 API is running.
- Exported artifacts should be rebuildable from explicit inputs. Do not hide material state in UI-only refs or temporary globals.
- When the same concept appears in client and server, define the stable contract in `src/lib` and have both sides use it if it is runtime-safe for Node and browser.

## API Boundary Pattern

Server-backed features should use this boundary:

```text
React panel
  -> src/lib/<feature>Client.ts typed request/response helper
  -> server/<feature>Routes.ts request parsing and typed errors
  -> server/<feature>Service.ts validation, hashing, transitions, receipts
  -> server/reviewWorkspaceRepository.ts repository interface
  -> prisma/schema.prisma durable shape when persistence is needed
```

Do not call `fetch` from multiple components for the same route family. Do not let a route mutate repository state before all data-boundary, status-transition, and Not legal advice checks have passed.

## File Size And Split Rules

Avoid splitting files just to look organized, but split when a file starts carrying unrelated responsibilities.

- A React panel should have one workflow purpose. Extract a child component when a panel mixes independent surfaces such as settings, ledger rows, export history, and error recovery.
- A `src/lib` module should own one domain concept. Create a new module when new functions would import only a small part of the old one or require a different test fixture set.
- Server route modules should map to one URL family. Shared validation and hashing belong in services or helpers, not repeated across routes.
- Prefer small typed helpers over generic utility files. A helper named `utils.ts` is a warning sign unless it is already established and narrowly scoped.
- Do not reorganize broad folders in the same commit as a feature unless the reorganization directly removes duplicate behavior needed by that feature.

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
- Evidence Vault records that replace rejected material should preserve parent/child lineage, replacement reason, and superseded status instead of overwriting history.
- Duplicate evidence hashes should be detected as recoverable workflow errors before a second active vault record is stored.
- Raw document content, raw KYC, personal data, private keys, and secrets must not enter demo data or exports.
- Manifest hashes must be deterministic and covered by tests.
- Evidence status changes that affect export readiness should be visible in UI and audit logs.

### Model Governance

Use `modelConnect.ts`, `modelIntake.ts`, `modelProvider.ts`, `modelConnectionReadiness.ts`, `modelAccessWorkflow.ts`, `modelReviewLedger.ts`, `aiReview.ts`, and server Model Gateway services.

- Client-side API keys are session-only and must not be persisted.
- Server-side external provider calls require a documented secret policy first.
- Redaction Gate and human-review owner are mandatory before model output can enter review workflows.
- Model Gateway success and failure receipts must stay credential-free, include allowed data-class context, and expose remediation through typed receipt fields rather than ad hoc UI strings.
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
