# LexProof Work Universe

This file is the single backlog boundary for LexProof AuditOS. It lists the product, frontend, backend, security, data, demo, and operational work that can move the platform from hackathon prototype to a real audit workspace.

LexProof remains **Not legal advice**. Every item below must produce audit preparation material, evidence workflow metadata, source lineage, model governance records, or counsel handoff artifacts. It must not produce legal conclusions, perform KYC, store secrets in the client, or claim real chain proof without a real verifiable transaction.

## How To Use This File

Treat this document as the complete build universe and product direction file. A new feature, issue, or agent prompt must either map to an existing workstream below or first amend this file with a clear capability area, owner layer, proof path, and non-goals.

Start from `docs/constraints-index.md` for the complete constraint map, then use `docs/project-governance.md` when turning this universe into implementation work. This file answers **what can be built**; `docs/architecture-guardrails.md` answers **where it belongs**; `docs/engineering-workflow.md` answers **how to verify and hand off**.

Rules:

- Pick one smallest demonstrable slice from a workstream instead of starting a broad rewrite.
- Name the workstream ID in commits, issues, and agent prompts when possible, for example `W4 Human Review Workflow`.
- Keep one user journey in view: project facts -> evidence/model intake -> risk/source graph -> human review -> vault/manifest -> counsel pack/export.
- Do not add parallel demo-only features when the same behavior belongs in an existing module.
- Do not promote a later-horizon capability, such as auth, raw document storage, or real chain anchoring, unless its privacy, retention, and verification boundaries are already written and tested.
- If a requested feature does not fit any workstream, add it to `Backlog Intake Rules` below before implementation so future work does not drift.

## Master Inventory Contract

This file is exhaustive at the capability level. It is not a ticket list with every possible small task; it is the boundary that every ticket, agent prompt, and feature slice must map back to.

Every new item must name:

- **Workstream:** one W1-W12 lane below.
- **User journey:** the exact flow being improved, for example `Model Connect -> Evidence Vault -> Human Review -> Counsel Pack`.
- **Frontend owner:** existing or new surface under `src/components` or `src/App.tsx`.
- **Domain owner:** focused module under `src/lib`.
- **Backend owner:** route/service/repository under `server`, or `none` for local-first work.
- **Data owner:** seed/source/template file under `src/data`, or `none`.
- **Proof:** targeted test, route test, UI workflow test, screenshot, demo script update, or full `npm run verify`.
- **Boundary:** Not legal advice wording plus privacy/security exclusions.

If an item needs a new workstream, add it here with product outcome, frontend surface, backend/domain/data owner, required proof, and non-goals before implementation.

## Complete Scope By Layer

Use this table to keep feature ideas from drifting into the wrong layer.

| Layer | Complete work scope | Direction |
| --- | --- | --- |
| Product | Project intake, risk/source review, evidence operations, model governance, human review, vault/manifest, counsel/submission export, demo readiness | Make one continuous audit-prep journey, not disconnected tools |
| Frontend | Command Center, journey rail, tabs, panels, status chips, empty/error/recovery states, export surfaces, screenshots | Dense professional workbench; no marketing landing page |
| Domain | Validation, deterministic audit, source matching, evidence hashes, workflow transitions, model policy, export builders, privacy gates | Pure or side-effect-light `src/lib` functions with focused tests |
| Backend | Fastify route families, services, repository adapters, audit logs, model gateway receipts, vault metadata, human review, export records | Thin routes, testable services, metadata-only responses by default |
| Data | Synthetic profiles, demo scenarios, evidence templates, reviewed regulatory/source metadata | Realistic but synthetic, reviewed, source-linked, and safe |
| Security | Data classification, redaction, retention, export blockers, model/storage/parser/GRC/chain readiness gates | Block secrets, private keys, raw KYC, personal data, and raw evidence leakage |
| Integrations | Model provider proxy, object storage, parser/OCR, GRC/ticket sync, optional chain anchoring | Disabled by default until policy, retention, audit, and failure states exist |
| Demo | Clean-clone commands, demo script, scenario library, screenshots, submission pack, known limitations | Judge can reproduce the story without secrets or private data |

## Construction Direction

Build in this order unless the user narrows a smaller urgent slice:

1. **Demo certainty:** keep the judge path runnable from clean clone, with clear screenshots, Not legal advice boundaries, and no credentials.
2. **Regulatory depth:** expand source-backed jurisdiction controls for RWA, DAO governance, custody, AI legal workflow, marketing claims, and selected non-US routes.
3. **Review reliability:** make model receipts, evidence routes, human review, vault manifests, audit logs, and Counsel Pack exports behave as one recoverable journey.
4. **Security hardening:** deepen data-boundary blockers, retention controls, error states, and metadata-only export guarantees before external adapters.
5. **Pilot readiness:** add auth, orgs, permissions, sharing, raw document intake, and real integrations only after the single-user secure flow remains stable.

Rejected direction remains explicit: no legal advice chatbot, no real KYC processor, no private-key custody tool, no source-free legal classifier, no simulated-chain-proof marketing, and no generic GRC clone that loses the AI/Web3 evidence focus.

## Product Direction

LexProof should become an AI and Web3 regulatory evidence operating system:

- A workspace where teams map launch facts, AI use, token mechanics, custody, data handling, and marketing claims to evidence requests.
- A review system where model output is treated as draft audit preparation, routed through human review, and logged with stable hashes.
- A jurisdiction-aware source and control graph that helps counsel see what needs review without pretending to decide legality.
- A verifiable evidence package generator that exports manifests, model receipts, review status, source lineage, and counsel-ready Markdown/PDF.
- A demoable workbench that feels like a professional GRC/legal operations tool, not a landing page or generic chatbot.

## North-Star Journey

The product should converge on one complete operating flow:

1. **Create workspace:** a team creates or loads a synthetic-safe project profile with jurisdictions, asset model, AI usage, data boundary, custody, and launch facts.
2. **Connect model safely:** the user configures a mock or future server-gated model path, confirms allowed data classes, and records a human-review owner without persisting secrets.
3. **Collect evidence:** the user requests, adds, hashes, templates, replaces, rejects, and verifies metadata-first evidence.
4. **Map risk and sources:** deterministic audit rules, jurisdiction packs, and reviewed regulatory source clauses produce review triggers, not legal conclusions.
5. **Route human review:** evidence, model runs, source refreshes, risk flags, and export packets move through returned/rejected/reviewed states with history.
6. **Vault and manifest:** server-backed metadata records produce versioned evidence lineage, duplicate detection, manifest hashes, and audit logs.
7. **Export counsel packet:** Counsel Pack, Regulatory Source Pack, Submission Pack, model receipts, review timeline, and simulated anchor receipts are downloadable audit-prep artifacts.

Every future slice should make at least one step in this journey more real, safer, or easier to demonstrate.

## Current Baseline

The repository already has:

- React + TypeScript + Vite workbench UI.
- Local-first project workspace and synthetic sample profiles.
- Deterministic risk audit, issue explainers, source links, remediation queue, and risk evidence coverage.
- Model Intake, Model Connect, model readiness checks, Redaction Gate, AI Review run ledger, and a mock/OpenAI-compatible client-side model path.
- Phase 2 API routes for secure review workspace, Evidence Vault metadata hashing, duplicate-hash blocking, rejected-evidence replacement lineage, mock Model Gateway success/failure receipts with automatic Human Review queueing for completed output, Human Review, server-side Counsel Pack export metadata records, and Audit Log listing.
- Local Human Review operations with reviewer assignment, due dates, saved status history, source clause-match refresh actions, linked evidence updates, and downloadable timeline JSON with audit log IDs.
- Editable Evidence Ledger with review-stage statuses, rejected-record replacement requests, empty-state Evidence Intake Guidance, local file metadata hashing, evidence templates, audit trail JSON, deterministic Evidence Manifest, Evidence Vault control coverage summary, Evidence Vault Lineage Digest with stable digest hash and JSON download, simulated anchor receipt, Counsel Pack export templates, Export Safety Gate data-boundary blocker, Counsel Handoff Checklist with a stable checklist hash and JSON download, local Counsel Pack version history with manifest/Markdown/source-pack hashes and diff metadata, and Phase 2 server export records for the latest Pack Version.
- Jurisdiction checklist and jurisdiction packs for initial US/EU/UK/Singapore/Hong Kong/Japan/Canada/Australia/South Korea/India/Switzerland/UAE/Brazil routing.
- Demo script, screenshots, Demo Scenario Library launcher, Workspace Journey rail, Source Review Packet export, and integration tests for the full secure review journey, Counsel Pack template selection, version-history export path, server export-record path, command-center Regulatory Control Matrix export, Jurisdiction Readiness Digest export, and seeded judge paths.
- Generated Submission Pack JSON in Sources with pack hash, manifest hash, Regulatory Source Pack hash, Demo Runbook hash, export safety summary, demo readiness, required assets, feature-to-theme mapping, known limitations, and Not legal advice boundary.
- Generated Judge Handoff Bundle JSON in Sources with Submission Pack, Demo Runbook, Export Safety Inventory, and Counsel Handoff Checklist child artifact hashes/statuses, recovery queue, stable bundle hash, and Not legal advice boundary.

Future work should extend these capabilities, not create parallel demo-only paths.

## Market Bar And Product Ambition

Reviewed on 2026-07-01. The competitive bar is no longer "chatbot plus memo." Strong products around this space provide focused work surfaces:

- Legal AI platforms such as [Harvey](https://www.harvey.ai/), [Legora](https://legora.com/), [Thomson Reuters CoCounsel Legal](https://legal.thomsonreuters.com/en/products/cocounsel-legal), and [Spellbook](https://spellbook.com/) emphasize matter workflows, drafting/review, trusted source context, collaboration, and secure data handling.
- Crypto compliance platforms such as [Chainalysis KYT](https://www.chainalysis.com/product/kyt/), [TRM wallet screening](https://www.trmlabs.com/blockchain-intelligence-platform/wallet-screening), and [Elliptic screening](https://www.elliptic.co/solutions/screening) emphasize wallet/transaction risk, configurable rules, audit trails, and compliance operations.
- GRC and regulatory-intelligence platforms such as [Regology](https://regology.com/), [Vanta](https://www.vanta.com/), and [Diligent](https://www.diligent.com/) emphasize continuous controls, regulatory change intake, issue management, audit evidence, and board/compliance reporting.
- Web3 operations tools such as [OpenZeppelin Defender](https://docs.openzeppelin.com/defender) show that serious blockchain products expose monitoring, transaction proposals, automation, and operational evidence rather than vague "on-chain" claims.

LexProof should not copy any one category. The 10x direction is to combine:

- AI legal-work assistance with human review and hashed receipts.
- Web3 evidence provenance with metadata-only manifests and optional anchors.
- RegTech source/control mapping with jurisdiction routing and review freshness.
- GRC-style issue ownership, evidence requests, approvals, and export history.

The differentiator is a counsel-ready audit preparation workspace for AI and Web3 launch risk. It must stay sharper than a generic legal AI assistant, safer than an unaudited model workflow, and more reviewable than a normal compliance checklist.

## Work Universe Control Board

This is the canonical inventory for future work. Every feature, frontend change, backend route, data expansion, test, screenshot, and demo improvement must map to one row below before implementation starts.

| Work lane | What must be built | Frontend surface | Backend/domain/data owner | Verification path | Direction |
| --- | --- | --- | --- | --- | --- |
| W1 Regulatory intelligence | Deeper jurisdiction controls, source refresh review, local-counsel routing, source update approval, source-pack exports | Regulatory Command Center, Jurisdiction Checklist, Source Review Ledger, Source Approval Queue | `src/data/regulatoryClauses.ts`, `src/lib/regulatoryGraph.ts`, `src/lib/regulatorySourceReview.ts`, `server/source*Routes.ts` | Clause matching tests, source review sync route tests, screenshot for new command-center state | Build source-backed review triggers, not legal conclusions |
| W2 Evidence operations | Evidence requests, metadata intake, file hashes, retention gates, vault lineage, duplicate/replacement recovery, manifests | Evidence Ledger, Evidence Retention, Evidence Vault panels | `src/lib/evidence*.ts`, `src/lib/retentionPolicy.ts`, `server/evidenceVault*` | Stable hash tests, transition tests, duplicate/replacement route tests, screenshot for new recovery state | Make evidence metadata verifiable and recoverable without raw files |
| W3 Model governance | BYOM/BYOK setup, redaction gate, provider/secret policy, gateway receipts, model-run evaluation, failure recovery | Model Settings, AI Review, Model Intake, Secure Review Workspace | `src/lib/model*.ts`, `src/lib/aiReview.ts`, `server/modelGateway*` | Model validation tests, policy route tests, receipt hash tests, UI failure-state test | Treat AI output as draft audit prep requiring human review |
| W4 Human review | Review queue by target, reviewer assignment, due dates, return/reject/reviewed flows, timeline export, linked status effects | Human Review queue and timeline surfaces | `src/lib/humanReviewWorkflow.ts`, `src/lib/serverHumanReviewEffects.ts`, `server/humanReview*` | Queue/filter tests, linked effect tests, route tests, screenshot for reviewed/rejected flow | Make review operational while avoiding legal approval language |
| W5 Counsel and submission exports | Versioned Counsel Pack, source pack, submission pack, export safety gate, print/PDF handoff, diff and receipt exports | Counsel Pack, Sources, Submission Pack | `src/lib/counselPack*.ts`, `src/lib/submissionPack.ts`, `server/counselPackExport*` | Markdown/export tests, version diff tests, export blocker tests | Produce reproducible audit-prep artifacts with hashes and limitations |
| W6 Workbench experience | First-screen cockpit, journey rail, action queue, dense panels, empty/error/recovery states, responsive polish | `src/App.tsx`, `src/components/*`, `src/styles.css` | Domain state remains in `src/lib`; static demo data in `src/data` | App workflow tests, desktop/mobile screenshots for durable UI changes | Make the product feel like a serious GRC/legal ops workbench |
| W7 Backend platform | Route modules, repository adapters, Prisma state, audit logs, typed errors, health/preflight, future background jobs | Secure Review Workspace and API-connected panels | `server/*Routes.ts`, `server/*Service.ts`, `server/reviewWorkspaceRepository.ts`, `prisma/schema.prisma` | Route/service/repository tests, `npm run build:server`, `npm run verify` | Keep API behavior durable, typed, and metadata-only by default |
| W8 Security and privacy | Classification, redaction, retention, upload/export blockers, safe audit log export, readiness gates | Redaction Gate, Export Safety Gate, Security Review, Integration Readiness | `src/lib/dataClassification.ts`, `src/lib/dataBoundary.ts`, `src/lib/evidenceUploadBoundary.ts`, policy routes | Boundary tests, redaction tests, policy route tests, negative tests for unsafe data | Block secrets, private keys, raw KYC, personal data, and raw evidence leakage |
| W9 Integrations | Disabled-by-default provider, object storage, OCR/parser, GRC/ticket, and optional chain-anchor adapters | Integration Readiness Registry and adapter panels | `src/lib/*Policy.ts`, focused clients/services, future adapter routes | Adapter policy tests, no-real-call tests, failure recovery tests | Add real integrations only after policy, retention, and audit controls exist |
| W10 Demo and judge readiness | Clean-clone script, screenshot set, demo scenarios, API preflight, known limitations, hackathon submission materials | Demo Scenario Library, Demo Readiness, README, docs | `src/lib/demoScenarioLibrary.ts`, `src/lib/demoReadiness.ts`, docs | Scenario/readiness tests, `npm run verify`, documented smoke path | Make judging reproducible without credentials or private data |
| W11 Pilot operations | Accounts, orgs, roles, reviewer permissions, matter sharing, workspace activity, durable settings | Future admin/workspace surfaces only after W1-W10 are stable | Future auth/RBAC service and repository tables | Permission model tests, route tests, threat-model review | Defer until single-user secure review flow is stable |
| W12 Production readiness | Observability, background jobs, migration discipline, deployment, enterprise reporting, custom controls | Future ops/admin surfaces | Future worker/deploy modules, server metrics, policy packs | Build/deploy smoke, migration tests, operational runbook | Defer until pilot workflows prove demand |

## Build Order And Direction

Use this order unless a user explicitly narrows a different slice:

1. **Close demo gaps first:** Any judge-visible flow with unclear empty, error, recovery, or export state beats a new integration.
2. **Deepen jurisdiction evidence next:** Expand source/control coverage for RWA, DAO governance, custody, AI legal workflow, marketing claims, and Brazil/Singapore/Hong Kong/Japan/Canada/Australia/South Korea/India/UAE/UK/EU/US routes when each addition has reviewed source metadata and tests.
3. **Harden secure review loops:** Model Gateway, Human Review, Evidence Vault, Audit Log, and Counsel Pack should behave as one journey before new product areas are added.
4. **Make integrations policy-real before adapter-real:** Every external adapter starts as a metadata-only policy evaluation with disabled state, failure state, and no real side effects.
5. **Only then add pilot infrastructure:** Auth, organizations, sharing, raw document intake, and real storage belong after the current single-user flow remains stable under `npm run verify` and browser smoke.

Rejected directions:

- Generic chatbot features that bypass deterministic audit and human review.
- Region-law answers that read as legal advice instead of source-backed review triggers.
- Real KYC, raw customer document storage, private-key handling, or real chain writes in the demo.
- Parallel demo-only pages that do not connect to the North-Star Journey.

## Complete Build Universe

This is the full scope boundary. New work should fit one of these capabilities or explicitly amend this file before implementation.

| Capability area | Product outcome | Frontend surface | Domain/backend owner | Required proof |
| --- | --- | --- | --- | --- |
| Project intake and scenarios | Teams can start from blank, sample, or scenario templates with clear assumptions | Project Workspace, Demo Scenario Library, Audit Wizard | `src/lib/projectModel.ts`, `src/data/sampleProfiles.ts`, `src/data/demoScenarios.ts` | Profile validation tests, scenario validation tests, screenshot for new scenario UI |
| Regulatory source/control graph | Jurisdiction and source triggers become reviewable controls, not legal conclusions | Regulatory Command Center, Jurisdiction Checklist, Source Review Ledger | `src/data/regulatoryClauses.ts`, `src/lib/regulatoryGraph.ts`, `src/lib/regulatorySourceReview.ts` | Clause matching tests, source freshness tests, Not legal advice copy |
| Deterministic risk audit | Risk flags are reproducible, source-linked, and evidence-dependent | Risk Audit, issue cards, remediation queue, GRC export | `src/lib/auditEngine.ts`, `src/lib/riskExplainers.ts`, `src/lib/riskEvidence.ts`, `src/lib/grcTicketExport.ts` | Trigger/non-trigger tests, coverage tests, export boundary tests |
| Model connect and AI governance | Users can bring models through a policy gate without storing secrets or relying on AI as final judgment | Model Intake, Model Settings, AI Review, Model Gateway Evaluation | `src/lib/modelConnect.ts`, `src/lib/modelIntake.ts`, `src/lib/modelProvider.ts`, server model gateway services | Validation tests, receipt hash tests, failure-state route tests |
| Evidence ledger and vault | Evidence is editable, versioned, metadata-first, recoverable, and hashable | Evidence Ledger, Evidence Retention, Evidence Vault sync/recovery | `src/lib/evidenceManifest.ts`, `src/lib/evidenceVaultWorkflow.ts`, `server/evidenceVaultService.ts` | Stable hash tests, status transition tests, duplicate/replacement tests |
| Human review and approvals | Reviewers can return, reject, or mark items reviewed while preserving history | Human Review queue, review timeline, linked status updates | `src/lib/humanReviewWorkflow.ts`, `src/lib/serverHumanReviewEffects.ts`, server human review routes | Queue tests, linked evidence/model status tests, timeline export tests |
| Counsel pack and submission artifacts | Counsel and judges can export a single packet with assumptions, hashes, source lineage, and limitations | Counsel Pack, Sources, Submission Pack, Print/Save PDF | `src/lib/counselPack.ts`, `src/lib/counselPackVersions.ts`, `src/lib/regulatorySourcePack.ts` | Markdown content tests, version diff tests, export safety tests |
| Secure review backend | The SPA has a real API boundary for workspace, evidence, model runs, review, exports, and audit logs | Secure Review Workspace, server-backed export panels | `server/*Routes.ts`, `server/*Service.ts`, `server/reviewWorkspaceRepository.ts` | Route tests, service tests, memory repository tests, `npm run build:server` |
| Security and privacy operations | Unsafe data classes are blocked or redacted before model calls, vault sync, and exports | Redaction Gate, Export Safety Gate, Security Review Checklist, Integration Readiness | `src/lib/dataClassification.ts`, `src/lib/dataBoundary.ts`, `src/lib/retentionPolicy.ts` | Blocker tests, redaction tests, no-secret payload tests |
| Integrations | External systems are added only behind disabled-by-default readiness gates | Integration Readiness Registry, adapter-specific panels | `src/lib/integrationReadiness.ts`, future focused client/service modules | Adapter disabled-state tests, failure recovery tests, no real call by default |
| Frontend workbench quality | The app feels like a dense professional audit cockpit, not a marketing page | Tabs, panels, status chips, empty/error/recovery states, responsive layout | `src/components/*`, `src/App.tsx`, `src/styles.css` | App tests for workflow state, screenshot for visible demo surfaces |
| Demo and judge readiness | A clean clone can run the whole story without secrets | README, demo script, screenshots, readiness preflight | `src/lib/demoScenarioLibrary.ts`, `src/lib/demoReadiness.ts`, docs | Scenario/readiness tests, screenshot set, documented commands |

## Capability Ownership Map

Use this map when turning a rough idea into implementation work.

| Capability | Product direction | Frontend work | Domain work | Backend work | Data/docs work |
| --- | --- | --- | --- | --- | --- |
| Project workspace | Move from static samples to durable audit matters with explicit assumptions | Workspace editor, scenario launcher, validation messages, local persistence recovery | Profile validation, scenario validation, migration helpers | Workspace create/read/update, future org scoping | Synthetic sample profiles, demo scenario docs |
| Regulatory intelligence | Build source-backed review triggers and control coverage for AI/Web3 workflows | Command Center, source ledger, source approval queue, control matrix, local counsel routing | Clause matching, source freshness, source review sync, source approval gates, source pack, evidence gap logic | Source Review Ledger and Source Approval metadata routes | Reviewed source clause data with dates and citations |
| Risk and remediation | Keep deterministic risk scoring explainable and evidence-dependent | Risk cards, trigger facts, owner/status queue, GRC export panel | Audit rules, explainers, evidence requirements, ticket bundle generation | Future ticket adapter with disabled-by-default gate | Risk rule notes and non-advice copy |
| Model governance | Make BYOM/BYOK useful without turning AI into a decision-maker | Model Intake, Model Connect, redaction gate, run receipts, failure recovery | Provider validation, redaction checks, model run ledger, evaluation artifacts | Gateway routes, provider policy, receipt persistence, audit logs | Model setup guide and limitation notes |
| Evidence operations | Treat evidence as metadata-first, versioned, hashable, and recoverable | Ledger, file hash intake, retention panel, vault sync/recovery UI | Manifest hashing, retention policy, upload boundary, status workflow | Vault upload/list/update/replacement/manifest routes | Evidence templates and safe examples |
| Human review | Turn review into operational workflow, not a decorative status | Review queue, due dates, returned/rejected recovery, timeline export | Review queue generation, status effects, timeline building | Review create/list/update, linked target updates, audit logs | Demo path and reviewer-state descriptions |
| Counsel/export | Produce reproducible handoff artifacts for counsel and judges | Template selector, preview, export gates, version history, server export record | Markdown builder, version diff, source pack, submission pack, data boundary | Export record routes and persistence | README/demo script/screenshots |
| Security/privacy | Block unsafe data before model, vault, and export surfaces | Clear blockers, recovery actions, readiness registry | Classification, redaction, boundary reports, readiness gates | Server upload/model/export policy checks | Privacy and non-goal documentation |
| Integrations | Add real external systems only when gated and observable | Adapter readiness cards and failure states | Adapter contracts and validation | Provider/storage/OCR/GRC/chain adapters | Secret/retention/wallet policies |
| Demo quality | Keep main runnable and judge-friendly | First-screen path, screenshots, empty/error states | Demo readiness validators | Health/preflight routes | Demo script, submission pack, known limitations |

## Backlog Intake Rules

Before adding a new item to the build universe, answer these questions in the relevant workstream or in a new row above:

- What user journey step does it improve?
- Which existing module owns the domain behavior?
- Does it require a server boundary or can it stay local-first?
- What data must be synthetic, reviewed, or excluded?
- What is the smallest proof: unit test, route test, UI test, screenshot, or demo script update?
- What must not be built in this slice?

Reject or defer work that cannot answer these questions without inventing a new architecture.

## Build Horizon

Use this horizon to pick the next slice. Avoid starting later-stage infrastructure before the earlier user journey is stable.

### Horizon A: Hackathon-grade operating system

- Make the judge path impossible to misunderstand: one start point, one full journey, one export story.
- Deepen regulatory source/control mapping for the strongest Web3 scenarios: RWA/tokenized credit, DAO governance, custody, marketing claims, AI legal workflow.
- Expand error/empty/recovery states for model failure, unsafe evidence, review rejection, source freshness, and export blockers.
- Keep all real external integrations disabled by default while showing exactly what would be required to enable them.

### Horizon B: Pilot-grade workspace

- Add accounts, organizations, roles, reviewer assignment, and workspace sharing after the single-user flow stays stable.
- Add secure document intake with explicit retention, deletion, access log, and redaction policy before raw files are persisted.
- Move live model access behind the server gateway with secret storage, egress logging, provider allowlist, cost controls, and audit receipts.
- Add regulatory change review queues where source updates must be approved before they affect matching behavior.

### Horizon C: Production-grade platform

- Add real object storage, OCR/document parsing, ticket-system sync, and optional wallet/anchor adapters after readiness gates are approved.
- Add continuous control monitoring and evidence recertification for ongoing compliance programs.
- Add enterprise reporting for counsel, compliance, investor diligence, and board-level risk summaries.
- Add organization-level policy packs and custom control libraries without weakening the Not legal advice boundary.

## Workstreams

### W1. Regulatory Source Graph

Goal: turn jurisdiction packs into a structured source/control/evidence graph.

Build:

- `src/data/regulatoryClauses.ts` with source-backed regulatory references by jurisdiction, regulator, topic, citation, source URL, trigger facts, evidence requests, and counsel questions.
- `src/lib/regulatoryGraph.ts` to match project facts, audit flags, evidence status, and jurisdiction packs to clause references and evidence gaps.
- US Regulation D accredited-investor routing is implemented for tokenized private-credit/RWA review using current eCFR Rule 501(a) and Rule 506(c) metadata. The `tokenized-yield-rwa` evidence template now carries `control-us-sec-reg-d-accredited-investor-verification` so investor eligibility, offering route, solicitation-control, and verification gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions.
- US OFAC virtual-currency sanctions routing is implemented for tokenized private-credit/RWA review using OFAC virtual-currency sanctions guidance metadata. The `tokenized-yield-rwa` evidence template now carries `control-us-ofac-virtual-currency-sanctions-compliance` so wallet screening, geolocation, blocked-property escalation, reporting, and recordkeeping gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions.
- US FinCEN CVC/MSB and BSA transfer-recordkeeping routing is implemented for tokenized private-credit/RWA custody and wallet-transfer review using FinCEN FIN-2019-G001 plus current eCFR MSB AML program and funds-transfer recordkeeping metadata. The `tokenized-yield-rwa` evidence template now carries `control-us-fincen-cvc-msb-bsa-travel-rule` and a US FinCEN CVC MSB and BSA transfer control register so business-model, money-transmission, MSB registration handoff, AML program, SAR/CTR escalation, Travel Rule, originator/beneficiary handling, and transfer-recordkeeping gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions or raw KYC.
- EU DORA ICT operational-resilience routing is implemented for EU CASP/custody RWA review using Regulation (EU) 2022/2554 metadata. The `tokenized-yield-rwa` evidence template now carries `control-eu-dora-ict-operational-resilience` and an EU DORA ICT resilience register so ICT risk-management, incident-response, testing, and ICT third-party service register gaps can flow into the regulatory graph, Source Review Ledger, Evidence Vault control coverage, and counsel handoff without legal conclusions.
- EU TFR crypto-asset transfer-information routing is implemented for EU CASP/custody RWA review using Regulation (EU) 2023/1113 and EBA Travel Rule Guidelines metadata. The `tokenized-yield-rwa` evidence template now carries `control-eu-tfr-crypto-asset-transfer-information` and an EU TFR Travel Rule transfer information register so crypto-asset transfer information, counterparty CASP handling, missing or incomplete information escalation, rejection/return handling, retention owner, and reviewer-owner gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions or raw KYC.
- EU MiCA marketing-communications routing is implemented for cross-border virtual-asset marketing review using Regulation (EU) 2023/1114 Articles 7-8 metadata and ESMA's MiCA single rulebook. The `marketing-claims-review` evidence template now carries `control-eu-mica-marketing-communications` and an EU MiCA marketing communication review pack so communication labels, white-paper consistency, home/host Member State audience routing, notification assumptions, publication timing, source lineage, and reviewer-owner gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions or raw audience files.
- Japan FSA crypto-asset custody and user-protection routing is implemented for Japan crypto-asset exchange custody review using FSA crypto-asset exchange supervision guidance and the FSA regulatory framework overview. The `tokenized-yield-rwa` evidence template now carries `control-jp-fsa-crypto-asset-custody-user-protection` and a Japan crypto-asset custody and leakage response register so registration assumptions, user-asset protection, information to users, segregated wallet handling, cold-wallet/offline management, daily reconciliation, leakage response, separate management audit, and wallet-secret exclusion gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions or raw customer records.
- Canada CSA CTP PRU custody and investor-protection routing is implemented for Canada crypto asset trading platform review using CSA Staff Notice 21-332 and Joint CSA/IIROC Staff Notice 21-329 metadata. The `tokenized-yield-rwa` evidence template now carries `control-ca-csa-ctp-pru-custody-investor-protection` and a Canada CTP PRU custody and investor-protection register so registration and PRU assumptions, Canadian client access, no leverage, VRCA consent, client-asset segregation, acceptable third-party custodian assurance, no re-hypothecation, insurance or alternative risk mitigation, CCO/financial reporting, and raw-client-record exclusion gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions.
- Australia ASIC/AUSTRAC digital-asset financial-services routing is implemented for Australia digital asset platform review using ASIC INFO 225, ASIC RG 133, and AUSTRAC virtual asset service guidance metadata. The `tokenized-yield-rwa` evidence template now carries `control-au-asic-austrac-digital-asset-financial-services` and an Australia digital asset financial services and VASP AML register so AFS licensing handoff, dealing/market-making/custodial-service assumptions, client-asset separation, crypto custody controls, VASP AML/CTF programs, CDD, travel rule, suspicious matter/threshold transaction reporting, annual compliance reporting, seven-year recordkeeping, and raw KYC/wallet-secret/customer-record exclusion gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions.
- South Korea FSC/KoFIU VASP user-protection and AML routing is implemented for Korea virtual asset service review using FSC Virtual Asset User Protection Act implementation, the Enforcement Decree, and KoFIU VASP reporting / AML metadata. The `tokenized-yield-rwa` evidence template now carries `control-kr-fsc-kofiu-vasp-user-protection-aml` and a Korea VASP user protection and AML reporting register so user deposits at banks, user virtual-asset segregation, 80 percent cold-wallet handling, insurance/reserve, abnormal transaction monitoring/reporting, user disclosure, compliance system, shareholder/ISMS/real-name account reporting, CDD/EDD, STR, Travel Rule, and raw KYC/customer-record/wallet-secret exclusion gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions.
- India FIU-IND/PMLA VDA AML/CFT routing is implemented for India virtual digital asset service provider review using the PMLA VDA notification, FIU-IND AML/CFT guidelines, FIU-IND source registry, PIB enforcement notice metadata, and FIU-IND VASP reporting-format manual. The `tokenized-yield-rwa` evidence template now carries `control-in-fiu-pmla-vda-aml-cft` and an India VDA SP FIU-IND registration and AML reporting register so VDA activity scope, FIU-IND Reporting Entity registration, AML/CFT/CPF program, Designated Director / Principal Officer, CDD/EDD, beneficial ownership, STR/monthly reporting, transaction monitoring, risk assessment, Travel Rule, record retention, FINGate/reporting-format handoff, and raw-KYC/customer-record/wallet-secret exclusion gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions.
- US NIST AI RMF / NIST AI 600-1 Generative AI Profile routing is implemented for AI legal workflow review. The `ai-compliance-workflow` evidence template now carries `control-us-nist-ai-rmf-governance` and a NIST GenAI output review and provenance register so govern/map/measure/manage evidence, model-use limits, risk measurement, GenAI output review, source provenance, and human accountability gaps can flow into the regulatory graph, Evidence Vault control coverage, and counsel handoff without legal conclusions or confidential matter text.
- AI legal workflow source-control coverage is implemented for EU AI Act Article 4 / Chapter III review routing and UK ICO AI data protection guidance. The `ai-compliance-workflow` evidence template carries `control-eu-ai-act-ai-literacy-governance` and `control-uk-ico-ai-data-protection-governance` source references so the AI scenario can show human oversight, source lineage, redaction, and reviewer decision-log gaps without legal conclusions.
- `src/lib/regulatorySourcePack.ts` for downloadable metadata-only source pack JSON with matched clauses, evidence gaps, Source Review Ledger freshness, counsel questions, local counsel routes, and a stable pack hash from the Counsel Pack surface.
- `src/lib/regulatoryControlMatrix.ts` for downloadable metadata-only control matrix JSON with source review status, evidence coverage status, local counsel route, next action, and Not legal advice boundary from the command center.
- `src/lib/regulatorySourceReviewPacket.ts` for downloadable metadata-only source review packet JSON with a packet hash, source review records, clause-match refresh actions, and Not legal advice boundary from the command center.
- `src/lib/regulatorySourceReviewSync.ts`, `src/lib/regulatorySourceReviewClient.ts`, and `server/sourceReviewRoutes.ts` for server-syncable metadata-only Source Review Ledger records with stable ledger hashes, audit-log entries, `matchingBehaviorChanged: false`, and no raw source bodies, credentials, KYC, personal data, or legal conclusions.
- `src/lib/regulatorySourceApproval.ts`, `src/lib/regulatorySourceApprovalSync.ts`, `src/lib/regulatorySourceApprovalClient.ts`, and `server/sourceApprovalRoutes.ts` for downloadable and server-syncable metadata-only Source Update Approval Queue records with review-due source approvals, metadata gates, audit-log entries, and a rule that source updates cannot change matching behavior until counsel or compliance review records refreshed source metadata.
- `src/lib/jurisdictionEvidenceMap.ts` and `JurisdictionEvidenceMapPanel` for a downloadable metadata-only per-jurisdiction evidence map with open evidence requests, source topics, local counsel roles, next actions, stable map hash, and Not legal advice boundary.
- `src/lib/jurisdictionReadinessDigest.ts` and `RegulatoryCommandCenter` for a downloadable metadata-only per-jurisdiction readiness digest with evidence blockers, source freshness blockers, local counsel route status, next actions, stable digest hash, and Not legal advice boundary.
- `src/lib/sourceFreshnessBoard.ts` and `SourceFreshnessBoardPanel` for a downloadable metadata-only source freshness board with metadata-missing, overdue, due-soon, and scheduled source review lanes, next actions, stable board hash, and Not legal advice boundary.
- Frontend panels for jurisdiction risk matrix, clause cards, evidence coverage by source, and local counsel handoff routes.
- Source update metadata: `effectiveAsOf`, `lastReviewedAt`, `sourceUrl`, and reviewer notes. The first Source Review Ledger is implemented in `src/lib/regulatorySourceReview.ts` and `RegulatoryCommandCenter`: it shows current/review-due/metadata-missing source records and refresh actions without making legal conclusions. Source Review Ledger server sync is implemented through `POST /api/workspaces/:workspaceId/source-reviews` and stores source review metadata only, never raw source bodies or legal conclusions. The first Source Update Approval Queue is implemented in `src/lib/regulatorySourceApproval.ts` and `RegulatoryCommandCenter`: it turns review-due and metadata-missing source records into approval-gated metadata items before matching behavior can change. The approval server sync is implemented through `POST /api/workspaces/:workspaceId/source-approvals` and stores approval metadata only, never raw source bodies or legal conclusions.
- Tests proving clause matching, evidence coverage, source visibility, source review freshness, source freshness board export, source approval queue export, control matrix export, jurisdiction evidence map export, and non-advice wording.

Acceptance:

- A user can select jurisdictions and see source-linked review triggers with missing evidence.
- The UI never says a project is legally compliant or non-compliant.
- Counsel Pack and source pack exports include matched clauses, evidence gaps, Source Review Ledger freshness metadata, and local counsel questions.
- The command center can export a control matrix without raw evidence, legal conclusions, or compliance labels.
- The command center can export a jurisdiction evidence map without raw evidence, legal conclusions, or compliance labels.
- The command center can export a source freshness board without raw evidence, legal conclusions, source scraping, or automatic source changes.
- The command center can export a Source Update Approval Queue without raw evidence, legal conclusions, or automatic source changes.

Do not build:

- Automated legal opinions.
- Jurisdiction conclusions without source links.
- Scrapers that silently change rule behavior without review.

### W2. Evidence Vault and Provenance

Goal: make evidence handling durable, versioned, and reviewable while staying metadata-first.

Build:

- Versioned Evidence Vault records with parent/child relationships, replacement reason, owner, source notes, and linked risk/control IDs. The first control-link path is implemented from Evidence Ledger source references through multipart upload, persisted vault records, manifest hashing, the vault record UI, and an aggregated Evidence Vault Control Coverage summary in `src/lib/evidenceVaultControlCoverage.ts`.
- Server-side manifest generation from persisted evidence metadata. The first dedicated manifest builder is implemented in `src/lib/evidenceVaultManifest.ts`, the Evidence Vault manifest route, and the Evidence Ledger **Download Vault Manifest JSON** action: it uses stable ordering, status/version/lineage hashes, redacted metadata-boundary warning hashes, and excludes raw bytes plus source-note body content.
- `src/lib/evidenceVaultLineageDigest.ts` and the Evidence Ledger **Evidence Vault Lineage Digest** panel summarize active, replaced, open-rejected, lineage-link, risk/control coverage, manifest hash, recovery action, stable digest hash, and downloadable metadata-only JSON without source-note body text or legal conclusions.
- Evidence state machine: `draft`, `requested`, `received`, `under-review`, `verified`, `rejected`, `superseded`. The first server-enforced transition guard is implemented in `src/lib/evidenceVaultWorkflow.ts` and the Evidence Vault PATCH route; rejected or superseded records cannot be directly reactivated outside replacement recovery. The local Evidence Ledger now exposes `under-review` and `rejected`, Human Review maps rejected evidence to a rejected local state, and Evidence Vault client sync preserves those review-stage statuses as metadata-only workflow records.
- Evidence empty states, invalid upload errors, duplicate hash detection, and rejected-evidence recovery flows. The first empty-ledger guidance is implemented in `src/lib/evidenceIntakeGuidance.ts` and `EvidenceLedger`: it recommends the safest template action and missing risk evidence requests without raw KYC, private keys, credentials, personal data, or legal conclusions.
- Optional object storage adapter only after retention, privacy, and access policy are documented.

Acceptance:

- Adding, replacing, rejecting, and verifying evidence changes the manifest bundle hash.
- Raw evidence bytes are not included in Counsel Pack or manifest JSON by default.
- Empty evidence journeys tell the user exactly what to add next from risk evidence coverage and recommended templates.
- Evidence Vault control coverage shows linked controls across vault records and manifest items without describing a project as compliant or non-compliant.
- Evidence Vault Lineage Digest shows active, replaced, and open rejected states with a stable digest hash and JSON download without source-note body text, raw evidence bytes, or legal conclusions.
- Invalid Evidence Vault status transitions return actionable recovery guidance before any record or audit log mutation.

Do not build:

- Raw KYC intake.
- Private key handling.
- File persistence without retention and deletion rules.

### W3. Model Gateway and AI Governance

Goal: move BYOM/BYOK model access behind a server policy boundary with review receipts.

Build:

- Server-side provider registry with disabled-by-default adapters. The registry is exposed through `GET /api/model-gateway/adapters`, metadata-only `GET /api/model-gateway/provider-policy`, and receipt-aware `POST /api/model-gateway/provider-policy` reports with required controls, next actions, and Not legal advice boundary. The POST route accepts only sanitized Model Connect metadata: provider, mode, status, and blockers. The workbench can refresh this report and show sync/failure recovery states without accepting credentials, endpoint hosts, model names, raw evidence, or calling external providers.
- Metadata-only secret handling policy evaluation before real external model calls. The first server route is implemented through `POST /api/model-gateway/secret-policy`, `src/lib/modelGatewaySecretPolicy.ts`, and `IntegrationReadinessPanel`: it evaluates KMS storage, rotation, access review, provider allowlist, egress logging, incident response, no-client-persistence, and human-review controls, blocks unsafe policy metadata, exports JSON, and still returns `externalProviderProxyingAllowed: false`.
- Metadata-only object storage policy evaluation before real storage adapters. `POST /api/integrations/object-storage/policy`, `src/lib/objectStoragePolicy.ts`, `src/lib/objectStoragePolicyClient.ts`, and `IntegrationReadinessPanel` now evaluate retention, manifest, retention/deletion windows, encryption, bucket allowlist, access logging, lifecycle, no-sensitive-material, and human-review controls, block unsafe policy metadata, export JSON, and still return `externalObjectStorageAllowed: false`.
- Metadata-only document parser policy evaluation before real OCR or raw-document adapters. `POST /api/integrations/document-parser/policy`, `src/lib/documentParserPolicy.ts`, `src/lib/documentParserPolicyClient.ts`, and `IntegrationReadinessPanel` now evaluate retention, Export Safety, manifest, document-size cap, raw-document retention, deletion SLA, parser purpose, redaction before parsing, no-training-use, access logging, no-sensitive-material, and human-review controls, block unsafe policy metadata, export JSON, and still return `externalDocumentParsingAllowed: false`.
- Metadata-only chain anchor policy evaluation before real wallet or chain adapters. `POST /api/integrations/chain-anchor/policy`, `src/lib/chainAnchorPolicy.ts`, `src/lib/chainAnchorPolicyClient.ts`, and `IntegrationReadinessPanel` now evaluate retention/export hard blockers, manifest availability, Counsel Pack version readiness, network scope, wallet custody metadata, signer role, transaction logging, privacy review, public-payload limits, user consent, no-raw-evidence-on-chain, and human-review controls, block unsafe metadata and real chain-write instructions, export JSON, and still return `externalChainAnchoringAllowed: false` with `anchorMode: simulated-only`.
- Model Gateway route that enforces Redaction Gate, allowed data classes, purpose, reviewer, and final-decision blockers.
- Safe Model Gateway failure receipts with run ID, retry state, error code, and remediation steps.
- Model run evaluation records: payload hash, response hash, source evidence hash, provider metadata, human-review status, and retry/error state. The first metadata-only evaluation artifact is implemented in `src/lib/modelGatewayEvaluation.ts` and rendered in `SecureReviewWorkspace` with JSON download.
- Automatic server-side Human Review queueing for completed Model Gateway output. `server/modelGatewayRoutes.ts` now creates a `model-run` Human Review request and audit-log record when a completed run enters the workspace; `runSecureReviewJourney()` reads that queued review instead of creating a duplicate.
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

- Review queues by target type: evidence, model run, risk flag, clause match, counsel pack. Clause-match source review actions now enter the local Human Review queue from `regulatorySourceReview.ts`, the command center can export those actions as a hashed Source Review Packet through `src/lib/regulatorySourceReviewPacket.ts`, and the server queue view in `src/lib/serverHumanReviewQueue.ts` plus `GET /api/workspaces/:workspaceId/reviews/queue` accepts `clause-match` filters with target/status/reviewer next actions.
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

- Versioned Counsel Pack records with manifest hash, review status, Regulatory Source Pack hash, source review status, source pack, export timestamp, and metadata-only server export records.
- Markdown and print/PDF flows that share the same export builder.
- Export templates for launch review, RWA/tokenized asset review, AI governance review, custody review, and marketing review; the initial five-template set is implemented and should be extended only when new review scenarios need it.
- Export Safety Gate that routes the same data-boundary report into Markdown preview, Markdown/PDF download gating, manifest JSON gating, simulated anchor gating, version-save gating, and server export-record gating.
- Download receipts for manifest JSON, model-run receipts, evidence audit trail, and simulated/real anchor receipts.
- Export diff view between pack versions.
- Source Review Ledger export in Markdown so reviewed source counts, next review dates, reviewer notes, refresh actions, and open Source Update Approval Queue gates survive the counsel handoff without becoming legal conclusions. The first source approval gate handoff is implemented in `src/lib/counselPack.ts` and the Counsel Pack preview: open source approval queues appear in Markdown only as audit-prep workflow metadata.
- Sources-level Export Safety Inventory in `src/lib/exportSafetyInventory.ts` and `ExportSafetyInventoryPanel` consolidates Evidence Manifest, source pack, Counsel Pack, source-review, Source Freshness Board, Demo Runbook, local-counsel, GRC, integration dossier, and Submission Pack artifact readiness into one redacted hashed JSON handoff with Not legal advice wording.
- Sources-level Judge Handoff Bundle in `src/lib/judgeHandoffBundle.ts` and `JudgeHandoffBundlePanel` consolidates Submission Pack, Demo Runbook, Export Safety Inventory, and Counsel Handoff Checklist hashes/statuses into one downloadable metadata-only judge packet with clickable recovery actions and a stable bundle hash.

Acceptance:

- A judge can reproduce the demo export from a clean project.
- Counsel can see facts, assumptions, source links, source freshness, source update approval gates, evidence gaps, review status, and hashes in one packet.
- Blocked private-key, credential, or raw-KYC findings stop export handoff until remediated.
- Every export repeats the Not legal advice boundary.

Do not build:

- Export content that hides missing evidence.
- Real chain claims for simulated receipts.

### W6. Frontend Command Center

Goal: make the product feel like a real review cockpit.

Build:

- A first-screen Regulatory Command Center with project readiness, jurisdiction risk matrix, evidence coverage, model readiness, human review status, and export readiness. The first Workspace Journey rail is implemented in `src/lib/workspaceJourney.ts` and `RegulatoryCommandCenter`: it shows project facts -> model/evidence intake -> risk/source graph -> human review -> vault/manifest -> counsel export, counts ready/blocked steps, and routes the next action without legal conclusions. The first Workspace Action Queue is implemented in `src/lib/workspaceActionQueue.ts` and `RegulatoryCommandCenter`: it ranks recoverable project facts, source evidence gaps, source refresh, human review, security readiness, and export actions with Not legal advice wording. The first Source Update Approval Queue is implemented in `src/lib/regulatorySourceApproval.ts` and `RegulatoryCommandCenter`: it gates review-due or metadata-missing source updates before source matching behavior can change. The first Regulatory Control Matrix is implemented in `src/lib/regulatoryControlMatrix.ts` and `RegulatoryControlMatrixPanel`: it turns source graph clauses, evidence coverage, and Source Review Ledger status into downloadable workflow controls without compliance conclusions. The first Jurisdiction Evidence Map is implemented in `src/lib/jurisdictionEvidenceMap.ts` and `JurisdictionEvidenceMapPanel`: it groups workflow controls by jurisdiction with open evidence requests, source topics, local counsel roles, next actions, and a metadata-only map hash. The first Jurisdiction Readiness Digest is implemented in `src/lib/jurisdictionReadinessDigest.ts` and `RegulatoryCommandCenter`: it condenses the evidence map, local counsel routing, and Source Freshness Board into per-jurisdiction handoff status, blockers, next actions, and a digest hash without compliance conclusions. The first Source Freshness Board is implemented in `src/lib/sourceFreshnessBoard.ts` and `SourceFreshnessBoardPanel`: it groups Source Review Ledger dates into metadata-missing, overdue, due-soon, and scheduled lanes without changing source matching.
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

- Fastify route modules split by domain: system, workspaces, evidence vault, model gateway, human review, audit log, exports. The first W7 splits are implemented for System routes in `server/systemRoutes.ts`, Workspace routes in `server/workspaceRoutes.ts`, Model Gateway routes in `server/modelGatewayRoutes.ts`, Counsel Pack export routes in `server/counselPackExportRoutes.ts`, Human Review routes in `server/humanReviewRoutes.ts`, Evidence Vault routes in `server/evidenceVaultRoutes.ts`, Source Review Ledger routes in `server/sourceReviewRoutes.ts`, Source Approval routes in `server/sourceApprovalRoutes.ts`, and Audit Log routes in `server/auditLogRoutes.ts`; continue extracting shared platform behavior without changing route contracts.
- Repository interfaces with Prisma implementations and memory implementations for tests.
- Request validation, typed error responses, and consistent audit logging. The shared typed error helper is implemented in `server/apiError.ts` and currently wired into Workspace, Evidence Vault, Model Gateway, Human Review, Counsel Pack export, Audit Log filter failures, and Integration Policy malformed-payload failures with stable error codes and the audit-prep boundary.
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

- Data classification rules for public, confidential, personal data, wallet-address identifiers, KYC, secrets, and private keys. The shared scanner and redaction rules now live in `src/lib/dataClassification.ts` so model settings, export, API-client error displays, and server upload boundaries do not drift.
- Secret scanning in model settings, evidence notes, Evidence Vault upload metadata, and export payloads. Model Connect validation now blocks credential material, private-key-like values, and raw KYC references in model name or endpoint metadata while keeping the API key field session-only. The first export-side report is implemented in `src/lib/dataBoundary.ts` for private-key-like values, API-key-like credentials, raw KYC references, wallet-address identifiers, personal-data references, and confidentiality labels. The first server Evidence Vault metadata boundary is implemented in `src/lib/evidenceUploadBoundary.ts` and blocks credential material, private-key-like values, and raw KYC references before record creation.
- Retention and deletion policy before storing raw files. The first Evidence Ledger retention gate is implemented in `src/lib/retentionPolicy.ts`, `src/lib/evidenceRetentionRemediation.ts`, and `EvidenceLedger`: it blocks Evidence Vault sync for private-key-like material, API-key-like credentials, and raw KYC references, shows a hashed P0/P1/P2 remediation queue, and exports metadata-only retention policy and remediation queue JSON.
- Audit log export with actor, action, target, timestamp, before/after hashes, and non-secret summaries. The first Secure Review Audit Log Export is implemented in `src/lib/auditLogExport.ts` and `SecureReviewWorkspace` with metadata-only JSON download.
- Security review checklist for model providers, evidence storage, and anchor integrations. The first checklist is implemented in `src/lib/securityReviewChecklist.ts` and `SecurityReviewChecklistPanel`: it combines Model Connect, Evidence Retention Readiness, Export Safety Gate, manifest, and evidence state into ready/needs-review/blocked gates with recovery actions before real providers, object storage, or chain writes are enabled.

Acceptance:

- Blocked data classes produce explicit, recoverable UI messages.
- Exports do not contain credentials, private keys, or raw KYC.
- Evidence Vault sync cannot run while retention blockers are present.
- Evidence Vault API uploads reject unsafe metadata without echoing secrets or raw KYC snippets, and preserve warning-level wallet-address, personal-data, and confidentiality metadata only as redacted review signals.
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

- Integration Readiness Registry in `src/lib/integrationReadiness.ts` and `IntegrationReadinessPanel`: maps security-review gates into adapter-level ready, needs-policy, blocked, and disabled states for server model providers, object storage, chain anchors, document parser/OCR, and GRC ticket export. It exposes sanitized validation errors, provider-policy API refresh, object-storage policy evaluation, document-parser policy evaluation, and recovery actions without enabling external providers, raw uploads, OCR, ticket creation, storage writes, or chain writes.
- Integration Enablement Dossier in `src/lib/integrationEnablementDossier.ts` and `IntegrationReadinessPanel`: consolidates adapter readiness plus provider, secret, object storage, document parser, chain anchor, and GRC destination policy reports into one hashed metadata-only JSON handoff with sanitized blockers, next actions, Not legal advice boundary, and `externalEnablementAllowed: false`.
- Metadata-only GRC Ticket Export in `src/lib/grcTicketExport.ts` and `GrcTicketExportPanel`: turns the Risk Audit remediation queue into downloadable ticket JSON only when the GRC adapter readiness gate is clear. Blocked adapter states produce sanitized blockers and no ticket payload. It does not create real external Jira, Linear, ServiceNow, or GRC records.
- Metadata-only GRC Destination Policy Evaluation in `src/lib/grcDestinationPolicy.ts`, `src/lib/grcDestinationPolicyClient.ts`, `server/integrationPolicyRoutes.ts`, and `IntegrationReadinessPanel`: evaluates remediation queue state, Export Safety, local ticket export readiness, destination scope, field mapping, authentication policy, redaction policy, ticket ownership, retry/audit logging, no-sensitive-material confirmation, and human-review controls before any future ticket-system adapter. It blocks unsafe credentials, raw KYC, raw ticket body, and external ticket-write metadata, exports JSON, and still returns `externalGrcTicketCreationAllowed: false`.

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

- Demo Scenario Library in `src/data/demoScenarios.ts`, `src/lib/demoScenarioLibrary.ts`, and `DemoScenarioLibrary`: maps realistic synthetic sample profiles into short judge-ready routes, expected artifacts, focus tags, and recommended workbench tabs. The seeded set now includes RWA launch, DAO review, public-source review, AI legal workflow review, Brazil VASP source review, Singapore DPT custody review, Hong Kong VATP custody review, Japan crypto custody review, Canada CTP custody review, Australia digital asset review, Korea VASP user protection review, India VDA PMLA review, and marketing claims review paths. The validation layer rejects unknown samples, missing Not legal advice boundaries, weak paths, empty artifacts, raw KYC, private-key, seed-phrase, and live-key demo text.
- Submission Pack artifact in `src/lib/submissionPack.ts` and `SubmissionPackPanel`: generates a metadata-only judge packet with stable pack hash, manifest/source-pack/Demo Runbook hashes, export safety summary, demo readiness, required assets, hackathon mapping, known limitations, and JSON download.
- Demo Runbook artifact in `src/lib/demoRunbook.ts`, `DemoReadinessPanel`, and `SubmissionPackPanel`: generates a metadata-only clean-clone runbook with scenario paths, screenshots, API preflight status, limitations, Not legal advice boundary, stable runbook hash, JSON download for hackathon judges from Project Workspace or Sources, and Sources-level handoff tracking through Submission Pack and Export Safety Inventory.
- Judge Handoff Bundle artifact in `src/lib/judgeHandoffBundle.ts` and `JudgeHandoffBundlePanel`: generates a metadata-only Sources packet with child artifact hashes/statuses for Submission Pack JSON, Demo Runbook JSON, Export Safety Inventory JSON, and Counsel Handoff Checklist JSON, plus clickable recovery actions, stable bundle hash, JSON download, and Not legal advice boundary.

Build:

- Keep the canonical demo script and Demo Runbook JSON aligned for a clean clone.
- Screenshots for every judge-visible workflow after UI changes.
- Additional seeded scenario library entries only when they map to real product workflows and remain synthetic.
- Expand the generated Submission Pack only when new real workflows need new evidence, readiness, or limitation fields.

Acceptance:

- `npm run verify` passes from a clean install.
- A judge can run the demo without private credentials.
- The README points to current screenshots and current commands.
- The Sources tab Submission Pack JSON repeats Not legal advice and exposes known limitations without raw evidence, credentials, KYC, or legal conclusions.

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
