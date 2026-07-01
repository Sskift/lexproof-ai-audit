# Architecture

LexProof AuditOS is a Vite React single-page application. The app is intentionally local-first: all demo data, scoring, hashing, and memo generation happen in the browser with pure TypeScript logic.

Start future work from [docs/project-governance.md](docs/project-governance.md). It defines the authority order for work intake, architecture ownership, workflow, verification, and clean handoff.

For future feature placement and anti-drift rules, use [docs/architecture-guardrails.md](docs/architecture-guardrails.md) with this file. For the approved backlog direction, use [docs/work-universe.md](docs/work-universe.md).

## Top-Level Shape

```text
lexproof-ai-audit/
  server/
    app.ts                   # Fastify app composition and shared hooks
    index.ts                 # API process entry point
    systemRoutes.ts          # Health and API preflight system routes
    modelGatewayRoutes.ts    # Model Gateway adapter, run, lookup, and summary routes
    counselPackExportRoutes.ts # Counsel Pack export-record create/list/lookup routes
    humanReviewRoutes.ts     # Human Review create/list/queue/update and linked target sync routes
    evidenceVaultRoutes.ts   # Evidence Vault upload/list/update/replacement/manifest routes
    workspaceRoutes.ts       # Workspace create/read/update routes
    auditLogRoutes.ts        # Audit Log listing routes
    apiError.ts              # Typed API error responses with the audit-prep boundary
    evidenceVaultService.ts  # Server-side evidence metadata and SHA-256 hashing service
    modelGatewayService.ts   # Mock Model Gateway success/failure receipts and boundary checks
    humanReviewService.ts    # Human review record helpers
    counselPackExportService.ts # Metadata-only Counsel Pack export record helper
    reviewWorkspaceRepository.ts # Memory and Prisma/SQLite repository adapters
    routeHash.ts             # Server-side SHA-256 and stable JSON hashing helper
  prisma/
    schema.prisma            # Phase 2 SQLite/Prisma persistence schema
  src/
    App.tsx                  # React workbench shell, persistence, and tab composition
    styles.css               # Responsive UI styling
    main.tsx                 # React entry point
    components/
      ProjectWorkspace.tsx   # Editable project profile and sample loading
      DemoScenarioLibrary.tsx # Judge-ready seeded scenario launcher
      AuditWizard.tsx        # Step-by-step project review surface
      AIReviewPanel.tsx      # Controlled model-assisted audit preparation
      ModelSettingsPanel.tsx # Mock/OpenAI-compatible model configuration
      ModelIntakePanel.tsx   # Model connection profile and AI event intake records
      RegulatoryCommandCenter.tsx # Source-backed jurisdiction graph and evidence gap cockpit
      RegulatoryControlMatrixPanel.tsx # Downloadable source/evidence/source-review control matrix
      SecurityReviewChecklistPanel.tsx # Security readiness gates for integrations
      IntegrationReadinessPanel.tsx # Adapter-level readiness registry for external integration gates
      GrcTicketExportPanel.tsx # Metadata-only remediation ticket export from Risk Audit
      CounselQuestionsPanel.tsx # Editable counsel question queue
      JurisdictionChecklistPanel.tsx # Jurisdiction checklist, policy controls, and local-counsel routing
      EvidenceLedger.tsx     # Editable evidence queue and manifest display
      CounselPackPanel.tsx   # Markdown, manifest, source pack, and simulated receipt export
      SubmissionPackPanel.tsx # Judge-facing submission metadata artifact and JSON download
    data/
      sampleProfiles.ts      # Seed legal/compliance audit scenarios
      demoScenarios.ts       # Judge-ready paths mapped to seed profiles
      evidenceTemplates.ts   # Seed evidence request templates
      regulatoryClauses.ts   # Reviewed official-source regulatory clause references
    lib/
      auditEngine.ts         # Pure audit engine and memo/hash helpers
      demoScenarioLibrary.ts # Demo scenario validation and lookup helpers
      aiReview.ts            # AI review payload, redaction gate, missing evidence checklist
      modelProvider.ts       # Mock and OpenAI-compatible model provider adapters
      modelAccessWorkflow.ts # Model setup, run, and human-review workflow status
      modelConnectionReadiness.ts # Model configuration and redaction readiness summary
      modelIntake.ts         # Model connection profile validation and AI event hashes
      modelReviewLedger.ts   # AI review run receipts and model payload/response hashes
      modelGatewayProviderPolicy.ts # Disabled-by-default provider policy reports and JSON export
      modelGatewayProviderPolicyClient.ts # Browser client for metadata-only provider policy refresh
      modelGatewaySecretPolicy.ts # Metadata-only secret policy readiness reports and JSON export
      modelGatewaySecretPolicyClient.ts # Browser client for secret policy evaluation
      modelGatewayEvaluation.ts # Metadata-only Model Gateway evaluation artifacts and JSON export
      auditLogExport.ts      # Metadata-only Secure Review audit log export artifacts
      projectModel.ts        # Project/evidence types and validation
      counselQuestions.ts    # Deterministic and AI-assisted counsel question queue helpers
      counselReview.ts       # Counsel/compliance review status queue helpers
      evidenceTemplates.ts   # Template recommendation and instantiation helpers
      evidenceIntakeGuidance.ts # Empty-ledger intake guidance from risk/evidence coverage
      fileEvidence.ts        # Browser-side local file hashing and metadata evidence
      evidenceAuditTrail.ts  # Local evidence change events and JSON export
      retentionPolicy.ts     # Evidence retention readiness, vault-sync blockers, and JSON export
      evidenceUploadBoundary.ts # Server Evidence Vault metadata boundary scanner
      evidenceVaultWorkflow.ts # Evidence Vault status transition guardrails
      missingEvidenceWorkflow.ts # Risk Audit requirement-to-ledger request helpers
      riskExplainers.ts      # Source-linked issue cards and trigger facts
      riskEvidence.ts        # Per-risk evidence requirements and coverage status
      evidenceManifest.ts    # Deterministic item and bundle hashes
      evidenceVaultManifest.ts # Server Evidence Vault persisted metadata manifests
      anchorReceipt.ts       # Local simulated manifest anchor receipt
      phase2Types.ts         # Phase 2 backend-boundary type contracts and pure helpers
      phase2ApiContracts.ts  # Phase 2 API route, boundary, and Prisma schema draft contracts
      serverHumanReviewEffects.ts # Server-side Human Review effects on linked records
      serverHumanReviewQueue.ts # Server-side Human Review queue filtering and summaries
      jurisdictionChecklist.ts # Jurisdiction checklist generation
      jurisdictionPacks.ts  # Jurisdiction policy controls and local-counsel routing
      regulatoryGraph.ts    # Official-source trigger matching and evidence coverage graph
      regulatoryControlMatrix.ts # Metadata-only source/evidence/source-review control matrix
      regulatorySourceReview.ts # Source review freshness and reviewer-note ledger
      regulatorySourceApproval.ts # Source update approval queue and metadata-only JSON export
      regulatorySourcePack.ts # Metadata-only regulatory source pack JSON artifact
      submissionPack.ts      # Metadata-only hackathon submission pack artifact and stable hash
      workspaceActionQueue.ts # First-screen operational action queue across evidence/model/review/export readiness
      counselPack.ts         # Markdown pack and browser download helper
      dataClassification.ts  # Shared security data-classification and redaction rules
      dataBoundary.ts        # Export Safety Gate classification, redaction, and blocker report
      counselPackTemplates.ts # Counsel Pack template definitions and recommendation logic
      counselPackVersions.ts # Counsel Pack export version metadata, hashes, and diffs
      counselPackExportClient.ts # Browser client for Phase 2 Counsel Pack export records
      auditLogFilters.ts    # Server audit-log query normalization and filtering
      securityReviewChecklist.ts # Integration security readiness checklist
      integrationReadiness.ts # Adapter readiness registry for model, storage, anchor, OCR, and GRC integrations
      grcTicketExport.ts    # Metadata-only GRC/ticket remediation export bundle
      auditEngine.test.ts    # Domain tests
    App.test.tsx             # UI smoke test
  docs/
    project-governance.md    # Operating contract for intake, architecture, workflow, verification, and handoff
    research.md              # Hackathon and audit research notes
  README.md                  # Product and submission overview
  WORKFLOW.md                # Direct-to-main development process
  CONTRIBUTING.md            # Project guardrails
```

## Data Flow

```text
demoScenarios, sampleProfiles, or blank project
  -> validateDemoScenarioLibrary(demoScenarios, sampleProfiles)
  -> ProjectProfile in App state
  -> localStorage persistence when valid
  -> analyzeAuditProfile(project)
  -> createRiskIssueCards(project, audit)
  -> createRiskEvidenceCoverage(audit, project.evidenceItems)
  -> createEvidenceRequestFromRequirement(requirement) for missing Risk Audit evidence
  -> createEvidenceItemFromFile(file) for browser-side local file metadata evidence
  -> createEvidenceAuditEvent(...) for local ledger create/update/remove metadata
  -> createRetentionPolicyReport(project.id, evidenceItems) for Evidence Vault sync readiness
  -> createJurisdictionChecklist(project, audit)
  -> createJurisdictionPacks(project, audit)
  -> createRegulatoryGraph(project, audit, evidenceItems)
  -> createRegulatorySourceReview(regulatoryGraph)
  -> createRegulatorySourceApprovalQueue(regulatorySourceReview)
  -> createRegulatoryControlMatrix({ graph: regulatoryGraph, sourceReview: regulatorySourceReview })
  -> recommendEvidenceTemplates(project)
  -> validateModelConnectionProfile(modelIntakeProfile)
  -> buildModelIntakeSummary(modelIntakeProfile, project AI events)
  -> createRedactionReport(project.evidenceItems)
  -> createModelConnectionReadiness(modelSettings, settingsValidation, redactionReport)
  -> createModelAccessWorkflow(model settings, readiness, Model Intake summary, run count)
  -> buildAIReviewPayload(project, audit, evidenceItems)
  -> runAIReview(...) through mock or OpenAI-compatible provider
  -> create local ModelReviewRun with payload and response hashes
  -> createAIReviewEventFromRun(run, result, humanReviewer)
  -> createModelGatewayEvaluationRecord(server model run) after Secure Review Journey
  -> createAuditLogExport(server audit log records) after Secure Review Journey
  -> merge AI draft questions into editable CounselQuestion queue
  -> createDefaultCounselQuestions(project, audit)
  -> createDefaultCounselReviewItems(project, audit, evidenceCoverage)
  -> merge edits into editable CounselReviewItem queue
  -> createHumanReviewQueue(project, reviews, evidence, AI events, regulatorySourceReview)
  -> createEvidenceIntakeGuidance(project, evidenceItems, riskEvidenceCoverage, recommended templates)
  -> createEvidenceManifest(project, audit, evidenceItems)
  -> createEvidenceVaultManifest(workspace, persisted evidence records) in Phase 2 API
  -> createDataBoundaryReport(project, evidenceItems, questions, reviews, AI events)
  -> createSecurityReviewChecklist(model connect, retention report, data boundary report, manifest hash)
  -> createWorkspaceActionQueue(project validation, source graph, source review, human review, security, data boundary, manifest/export status)
  -> createSimulatedAnchorReceipt(manifest)
  -> recommendCounselPackTemplate(project, audit)
  -> buildMarkdownCounselPack(project, audit, manifest, questions, reviews, modelIntake, regulatoryGraph, selectedTemplate, dataBoundaryReport, regulatorySourceReview, regulatorySourceApprovalQueue)
  -> buildPrintableCounselPackHtml(title, markdown)
  -> createCounselPackVersionRecord(project, audit, manifest, markdown, reviews, previousVersions)
  -> createServerCounselPackExportRecord(apiBaseUrl, workspaceId, latestVersion) for metadata-only Phase 2 export records
  -> createSubmissionPack(project, audit, manifest, source pack, demo readiness) for judge-facing metadata artifact
  -> tabbed UI surfaces, Markdown download, version JSON download, and browser Print / Save PDF
```

The UI does not own legal scoring, hashing, validation, or export rules. It renders output from `src/lib` modules and owns only browser interaction state.

## Core Modules

### `src/lib/auditEngine.ts`

Owns the domain behavior:

- `analyzeAuditProfile(profile)` returns weighted flags, risk score, risk level, remediation items, and source references.
- `createEvidenceHash(items)` returns a deterministic SHA-256 hash for the current evidence bundle.
- `buildCounselMemo(profile, audit, hash)` returns copy-ready Markdown for counsel/compliance review.
- `createSubmissionFit()` describes how the MVP maps to BLI Legal Tech Hackathon 2.

Keep this file deterministic and side-effect-light. New scoring rules should be covered by tests before they are used by the UI.

### `src/lib/projectModel.ts`

Owns first-stage workspace types and validation:

- `ProjectProfile` is the editable audit project model.
- `EvidenceItem` includes optional local ID, source, status, owner, and timestamps.
- `validateProjectProfile()` returns explicit errors for missing project facts.

This module does not store data and does not accept raw KYC or private data handling.

### `src/lib/counselQuestions.ts`

Owns counsel question queue behavior:

- `createDefaultCounselQuestions(project, audit)` creates deterministic risk-rule prompts from current audit flags.
- `createQuestionsFromAIReview(project, review)` converts AI draft questions into editable local prompts.
- `mergeCounselQuestionQueues()` preserves user edits while de-duplicating AI, manual, and rule-generated questions.
- `sortCounselQuestionsForReview()` puts AI review drafts, risk-rule prompts, and manual questions into a stable review order.

Questions are audit preparation prompts only. They do not create legal conclusions and remain editable by the user before export.

### `src/lib/counselReview.ts`

Owns counsel review status behavior:

- `createDefaultCounselReviewItems(project, audit, evidenceCoverage)` creates one editable review row per active deterministic risk flag.
- Default status is derived from evidence coverage: complete coverage becomes `ready-for-counsel`; incomplete coverage becomes `needs-evidence`.
- `mergeCounselReviewQueues()` preserves user-edited status, reviewer, notes, and update time while refreshing generated risk context and evidence summaries.

Review status is local audit workflow metadata only. It is not a signed approval, legal conclusion, or substitute for counsel review.

### `src/lib/aiReview.ts`

Owns model-assisted audit preparation behavior:

- `buildAIReviewPayload()` creates a non-advice model payload with project facts, risk flags, evidence previews, and missing evidence requirements.
- `createRedactionReport()` produces the visible Redaction Gate status, evidence previews, warning findings, and model-call blockers.
- `createMissingEvidenceChecklist()` maps deterministic audit flags to concrete evidence requests.
- `runAIReview()` combines model output with deterministic missing evidence.
- `parseAIReviewJson()` accepts structured model JSON and ignores unsupported fields.

Evidence content is previewed and private-key-like values are redacted before model calls. Private-key-like material blocks the UI call. AI output remains a draft and does not control risk scoring.

### `src/lib/riskExplainers.ts`

Owns user-facing issue explanation:

- `createRiskIssueCards(project, audit)` maps deterministic flags to trigger facts such as asset model, custody model, data sensitivity, or AI usage.
- Each issue card links back to source references from the audit source pack.
- The output explains why a flag triggered for audit preparation. It does not create legal conclusions.

### `src/lib/riskEvidence.ts`

Owns per-risk evidence workflow behavior:

- `createRiskEvidenceCoverage(audit, evidenceItems)` maps deterministic risk flags to evidence requirements, coverage counts, and matched evidence labels.
- Requirement status distinguishes `missing`, `in-progress`, and `covered` evidence. Draft/requested evidence can show progress, but only received/verified evidence counts as covered.
- `createMissingEvidenceChecklist(audit, evidenceItems)` preserves the AI Review checklist contract while using the same requirement library.

Coverage is audit preparation status only. It does not determine legal compliance or replace counsel review.

### `src/lib/missingEvidenceWorkflow.ts`

Owns the handoff from Risk Audit coverage gaps into ledger requests:

- `createEvidenceRequestFromRequirement(requirement)` turns a missing deterministic evidence requirement into a `requested` Evidence Ledger item.
- The generated request includes the related risk flag, priority, reason, and non-advice boundary.
- Requested evidence counts as `in-progress` in Risk Audit coverage, not `covered`; only received or verified evidence counts as covered.

### `src/lib/evidenceTemplates.ts`

Owns evidence template behavior:

- `listEvidenceTemplates()` returns the static template library from `src/data/evidenceTemplates.ts`.
- `recommendEvidenceTemplates(project)` ranks templates against current project facts.
- `createEvidenceItemsFromTemplate(templateId)` creates requested evidence items for the ledger.

Templates currently cover tokenized yield/RWA issuance, DAO governance/multisig execution, and AI legal/compliance workflows. Template content is synthetic-safe and should not include raw KYC, personal records, or secrets.

### `src/lib/evidenceIntakeGuidance.ts`

Owns Evidence Ledger empty-state guidance:

- `createEvidenceIntakeGuidance(input)` turns project facts, risk evidence coverage, and recommended templates into concrete next actions.
- Guidance actions can apply a recommended evidence template, prefill a missing evidence request, or create a manual metadata-only summary.
- The output repeats the Not legal advice boundary and must not expose raw evidence content, raw KYC, personal records, credentials, or private keys.

The UI may render these actions and trigger existing ledger/template handlers, but it must not duplicate template ranking or risk requirement selection in components.

### `src/lib/fileEvidence.ts`

Owns local file evidence intake behavior:

- `hashLocalFile(file)` hashes browser `File` bytes with SHA-256.
- `createEvidenceItemFromFile(file, options)` turns local file name, MIME type, byte size, last-modified time, and SHA-256 into an `EvidenceItem`.

The module does not upload files and does not store raw file bytes or raw document content. The resulting ledger item is metadata-only audit preparation material.

### `src/lib/evidenceAuditTrail.ts`

Owns local evidence event behavior:

- `createEvidenceCreatedEvent(projectId, evidence, actor)` records local evidence creation and template application.
- `createEvidenceUpdateEvent(projectId, previous, next, actor)` records only material evidence field changes and returns `null` when no material field changed.
- `createEvidenceRemovedEvent(projectId, evidence, actor)` records local evidence removal metadata.
- `exportEvidenceAuditTrailJson(events)` and `downloadEvidenceAuditTrailJson(filename, events)` export the trail as local JSON.

Evidence audit trail events are audit-prep metadata only. They are not signed approvals, legal conclusions, external timestamps, uploaded documents, or real chain writes.

### `src/lib/retentionPolicy.ts`

Owns Evidence Retention Readiness behavior:

- `createRetentionPolicyReport({ workspaceId, evidenceItems })` classifies ledger evidence as metadata-only, needs human retention review, or blocked before Evidence Vault sync.
- Blockers include private-key-like material, API-key-like credentials, and raw KYC references. Warning classes include personal-data, KYC, and confidentiality references that require human confirmation before metadata-only sync.
- `exportRetentionPolicyJson(report)` and `downloadRetentionPolicyJson(filename, report)` export a metadata-only retention policy report with redacted snippets, retention window, deletion trigger, and the Not legal advice boundary.

The module does not delete user-entered ledger content, perform KYC, store files, or make legal conclusions. It controls whether Evidence Vault sync can run and gives recoverable remediation steps before metadata leaves the local ledger.

### `src/lib/evidenceUploadBoundary.ts`

Owns server Evidence Vault metadata boundary behavior:

- `validateEvidenceMetadataBoundary(input)` scans filenames, owners, source notes, linked risk IDs, linked control IDs, and replacement reasons for private-key-like material, credential-like tokens, and raw KYC references before an Evidence Vault record is created.
- The result returns deterministic blocked classes, sanitized error messages, and the Not legal advice boundary.
- Clean metadata can mention the absence of raw KYC without being blocked.

This module is metadata-only audit preparation guardrail logic. It does not inspect or persist raw file bytes, perform KYC, or create legal conclusions.

### `src/lib/jurisdictionChecklist.ts`

Owns jurisdiction checklist generation:

- `createJurisdictionChecklist(project, audit)` returns US, EU, UK, and fallback local-counsel prompts.
- Checklist items are preparation prompts with source text, priority, and evidence status.
- The module does not classify legality, compliance, securities status, or licensing status.

### `src/lib/jurisdictionPacks.ts`

Owns jurisdiction pack behavior:

- `createJurisdictionPacks(project, audit)` returns jurisdiction-specific policy controls for US, EU, UK, Singapore, Switzerland, UAE, Brazil, and fallback local-counsel intake.
- Each control maps active risk flags to evidence keywords, owner, priority, and evidence-ready status.
- Each pack includes a local-counsel route with recommended role, trigger, handoff note, source, and explicit non-advice boundary.

Packs are audit preparation routing aids only. They do not determine legal status or compliance.

### `src/lib/regulatoryGraph.ts`

Owns official-source regulatory graph behavior:

- `createRegulatoryGraph(project, audit, evidenceItems)` matches current project facts, deterministic risk flags, jurisdictions, and evidence records against reviewed source references from `src/data/regulatoryClauses.ts`.
- Matched clauses include jurisdiction, regulator, source name, URL, citation, topic, trigger facts, evidence request status, local counsel role, and non-advice boundary.
- Evidence coverage distinguishes `missing`, `partial`, and `covered` source controls. Only received or verified evidence counts as covered.
- The graph returns jurisdiction readiness, an evidence gap queue, and top actions for the Command Center and Counsel Pack.

Regulatory graph output is audit preparation material only. It does not classify legality, determine compliance, or replace local counsel review.

### `src/lib/regulatorySourceReview.ts`

Owns source review metadata for the Regulatory Command Center:

- `createRegulatorySourceReview(graph, options)` turns matched regulatory clauses into source review records with `effectiveAsOf`, `lastReviewedAt`, `nextReviewDueAt`, `sourceUrl`, and reviewer notes.
- Review status distinguishes `current`, `review-due`, and `metadata-missing` source records using a configurable review window.
- The output repeats the Not legal advice boundary and creates review actions for source metadata refresh only.

This module tracks source lineage and review freshness. It does not decide whether a law applies, whether a source is legally current, or whether a project is compliant.

### `src/lib/regulatorySourceApproval.ts`

Owns source update approval workflow metadata for the Regulatory Command Center:

- `createRegulatorySourceApprovalQueue(sourceReview, options)` turns `review-due` and `metadata-missing` source review records into approval-gated queue items.
- Queue items distinguish `approval-required` from `metadata-required`, carry priority, source lineage, next action, and an approval gate that source updates cannot change matching behavior until counsel or compliance review records refreshed source metadata.
- `exportRegulatorySourceApprovalQueueJson(queue)` and `downloadRegulatorySourceApprovalQueueJson(filename, queue)` produce metadata-only JSON for the command center.

Source update approval queues are audit preparation workflow metadata only. They do not refresh sources automatically, scrape laws, decide source currency, or make compliance conclusions.

### `src/lib/regulatoryControlMatrix.ts`

Owns control-matrix workflow metadata for the Regulatory Command Center:

- `createRegulatoryControlMatrix({ graph, sourceReview })` turns matched regulatory clauses into controls with evidence coverage status, source review status, local counsel route, open evidence request count, priority, and next action.
- Control status is workflow-only: `needs-evidence`, `needs-source-review`, `metadata-missing`, or `ready-for-counsel`.
- `exportRegulatoryControlMatrixJson(matrix)` produces readable metadata-only JSON for counsel/compliance handoff.

Control matrices are audit preparation workflow metadata only. They do not classify a project as legally compliant or non-compliant, and they do not replace source review or local counsel review.

### `src/lib/regulatorySourcePack.ts`

Owns standalone source-pack handoff artifacts:

- `createRegulatorySourcePack({ graph, sourceReview })` projects the Regulatory Source Graph and Source Review Ledger into metadata-only clauses, evidence gaps, jurisdiction summaries, counsel questions, source review status, and a stable SHA-256 pack hash.
- `exportRegulatorySourcePackJson(pack)` and `downloadRegulatorySourcePackJson(filename, pack)` produce a readable local JSON handoff.
- The pack hash excludes `generatedAt`, raw evidence bodies, and legal conclusions so counsel can compare source/gap lineage across exports.

Source packs are audit preparation materials only. They do not determine legal status, certify source currency, or replace local counsel review.

### `src/lib/workspaceActionQueue.ts`

Owns first-screen operational action ranking for the Regulatory Command Center:

- `createWorkspaceActionQueue(input)` combines project validation, regulatory evidence gaps, Source Review refresh actions, Human Review status, Security Review readiness, Export Safety Gate status, manifest readiness, and Counsel Pack version state.
- Queue items include priority, target tab, concise summary, CTA, and the Not legal advice boundary.
- The component renders the queue and navigation only; it does not decide action priority.

Workspace actions are audit preparation workflow prompts only. They do not make legal conclusions, approve launch readiness, or replace counsel review.

### `src/data/regulatoryClauses.ts`

Owns reviewed official-source reference seeds for the Regulatory Source Graph:

- US SEC/CFTC crypto asset interpretation.
- EU MiCA Regulation (EU) 2023/1114.
- UK FCA PS23/6 and FG23/3 cryptoasset financial promotions materials.
- Singapore MAS PSN02 digital payment token AML/CFT materials.
- Swiss FINMA ICO/token classification guidance.
- UAE VARA virtual asset regulations and compliance/risk management rulebook.
- Brazil Banco Central virtual asset service regulation and CVM Guidance Opinion 40 crypto-asset securities guidance.

This file contains static source metadata, trigger keywords, evidence requests, counsel questions, effective dates, review dates, and reviewer notes. It must not contain legal conclusions, scraped user data, credentials, or scoring logic.

### `src/lib/modelProvider.ts`

Owns model connection boundaries:

- `createMockModelProvider()` returns deterministic demo output for judges and tests.
- `buildOpenAICompatibleRequest()` prepares a chat-completions request without putting API keys in the JSON body.
- `createOpenAICompatibleModelProvider()` can call a user-supplied OpenAI-compatible endpoint.
- `validateModelSettings()` prevents live calls without endpoint, model, and API key, and blocks unsafe model name or endpoint metadata through the shared data-classification rules.

API keys are session-only and are not persisted by the app. Model Connect receipts redact model and endpoint metadata before rendering or export.

### `src/lib/modelConnectionReadiness.ts`

Owns model connection readiness messaging:

- `createModelConnectionReadiness()` combines model settings validation with Redaction Gate status.
- Mock provider readiness is explicit and requires no API key.
- OpenAI-compatible provider readiness distinguishes incomplete session settings from a configured live provider.
- Redaction blockers override provider readiness so private-key-like or secret material cannot be sent to a model.

Readiness is an audit-prep gate only. It does not test a live endpoint, store credentials, or certify model quality.

### `src/lib/modelAccessWorkflow.ts`

Owns the user-facing model connection route:

- `createModelAccessWorkflow()` combines Model Intake readiness, provider settings validation, Model Connection Readiness, and run count.
- It returns setup/run/human-review steps for registering Model Intake, configuring a provider, passing Redaction Gate, running AI Review, and reviewing/exporting AI events.
- It surfaces live OpenAI-compatible settings errors and unresolved AI event review requirements before external reliance.

The workflow is audit preparation guidance only. It does not make legal conclusions, verify endpoint quality, store credentials, or replace human review.

### `src/lib/modelReviewLedger.ts`

Owns model-run audit receipts:

- `runAIReviewWithLedger()` runs a provider, parses the AI review result, and creates a local run receipt.
- `createModelReviewRun()` records provider label, model name, redaction status, payload hash, response hash, risk flag count, and evidence summary count.
- `exportModelReviewRunJson()` and `downloadModelReviewRunJson()` export the receipt without raw credentials.

Run receipts support audit preparation and reproducibility. They are not legal conclusions, proof of model correctness, or a substitute for human review.

### `src/lib/modelIntake.ts`

Owns model intake and AI event registration:

- `validateModelConnectionProfile()` checks provider/model purpose, human-review owner, prohibited final legal-decision roles, and blocked raw KYC/personal-data classes.
- `hashAIEventRecord()` creates a deterministic SHA-256 hash for each local AI event record.
- `createAIReviewEventFromRun()` converts an AI Review run receipt and parsed output into a needs-review Model Intake event.
- `buildModelIntakeSummary()` returns readiness, blockers, unresolved review counts, handoff checklist items, event hashes, and the non-advice boundary.
- `exportModelIntakeJson()` exports profile, event, and summary metadata without credentials.
- `downloadModelIntakeJson()` downloads the model intake profile, AI event ledger, readiness checklist, and event hashes as local JSON.

Model Intake records are local audit-prep metadata. They do not store API keys, perform KYC, make legal determinations, or prove model correctness.

### `src/lib/modelGatewayEvaluation.ts`

Owns metadata-only Model Gateway evaluation artifacts:

- `createModelGatewayEvaluationRecord(run)` converts a server Model Gateway receipt into a safe review artifact with provider policy metadata, allowed data classes, payload/response/source-evidence hashes, human-review status, retry state, remediation steps, and reviewer action.
- `exportModelGatewayEvaluationJson(record)` and `downloadModelGatewayEvaluationJson(filename, record)` export the evaluation JSON locally.
- Error messages and remediation steps are passed through the shared data-boundary redactor before export.

The evaluation record is audit preparation metadata only. It does not store raw prompts, raw model output, provider credentials, KYC data, legal conclusions, or proof that a model response is correct.

### `src/lib/auditLogExport.ts`

Owns metadata-only Secure Review audit-log exports:

- `createAuditLogExport({ workspaceId, records })` sorts server audit-log records, summarizes event counts, first/last event time, actors, target types, and action counts.
- `exportAuditLogJson(record)` and `downloadAuditLogJson(filename, record)` export the audit timeline as local JSON.
- Audit actors, target IDs, summaries, and before/after hashes pass through the shared data-boundary redactor before export.

Audit Log Export records are review workspace metadata only. They are not legal conclusions, signed approvals, chain anchors, or evidence of external timestamping.

### `src/lib/evidenceManifest.ts`

Owns deterministic manifest behavior:

- `hashEvidenceItem(item)` hashes normalized evidence content and material metadata.
- `createEvidenceManifest(project, audit, evidenceItems)` returns item hashes, risk context, and a bundle SHA-256.
- `exportManifestJson(manifest)` produces readable JSON for future export surfaces.
- `downloadManifestJson(filename, manifest)` downloads the manifest locally as JSON.

The first-stage manifest is local and simulated. It is not a real chain write or proof of external existence.

### `src/lib/evidenceVaultManifest.ts`

Owns server Evidence Vault manifest behavior for persisted metadata:

- `createEvidenceVaultManifest({ workspaceId, records })` sorts persisted Evidence Vault records, projects metadata-only manifest items, and hashes status, version, lineage, owner, linked-risk, linked-control, and file-hash metadata.
- `exportEvidenceVaultManifestJson(manifest)` returns readable JSON for route responses or future downloads.
- The hash payload excludes `generatedAt`, source-note body text, and raw file bytes, so repeated generation is stable while status, version, and lineage changes still alter the bundle hash.

Evidence Vault manifests are audit preparation metadata only. They do not expose raw document content, raw KYC, personal data, or legal conclusions.

### `src/lib/anchorReceipt.ts`

Owns simulated manifest anchoring:

- `createSimulatedAnchorReceipt(manifest, network)` creates a local receipt for a manifest bundle hash.
- `exportAnchorReceiptJson(receipt)` produces readable JSON for handoff.
- `downloadAnchorReceiptJson(filename, receipt)` downloads the simulated receipt.

The receipt status is `not-submitted` and the mode is `simulated`. It is not a real on-chain write and contains only manifest metadata, not raw evidence.

### `src/lib/phase2Types.ts`

Owns Phase 2 backend-boundary contracts:

- `WorkspaceRecord` describes a durable secure review workspace.
- `EvidenceVaultRecord` describes uploaded-file or external-reference metadata for a future evidence vault.
- `ModelGatewayRun` describes server-mediated model-run receipts, source evidence hashes, retry state, provider metadata, and safe failure remediation without credentials.
- `HumanReviewRecord` describes reviewer workflow metadata for risk flags, evidence, model runs, and exports.
- `CounselPackExportRecord` describes metadata-only server export records for saved Counsel Pack versions.
- `AuditLogRecord` describes append-only operation metadata for workspace actions.
- `createAuditLogRecord()` creates deterministic local audit-log IDs from material metadata.
- `createModelGatewayRunSummary()` returns a credential-free model-run summary for UI and exports.
- `validateEvidenceVaultRecord()` returns explicit validation errors for missing evidence metadata and blocked raw KYC/personal-data handling.
- Evidence vault records can carry `parentEvidenceId`, `supersededByEvidenceId`, and `replacementReason` so rejected evidence can be recovered without hiding the original record.

This module is a contract draft only. It does not create a backend, upload files, persist credentials, perform KYC, or make legal conclusions.

### `src/lib/phase2ApiContracts.ts`

Owns the Phase 2 backend design-spike contracts:

- `listPhase2ApiRoutes()` returns the review workspace API route table for workspaces, evidence vault, model gateway, human review, exports, and audit log domains.
- `validateModelGatewayBoundary()` blocks model gateway requests that bypass Redaction Gate, include credential material, include raw KYC/personal data, request final legal decisions, lack a human-review owner, or route data classes outside the approved audit-prep metadata boundary.
- `validateEvidenceUploadBoundary()` blocks evidence upload metadata that embeds raw document content, raw KYC/personal data, missing hashes, or missing file metadata.
- `createPhase2PrismaSchemaDraft()` returns the SQLite/Prisma persistence draft for `WorkspaceRecord`, `EvidenceVaultRecord`, `ModelGatewayRun`, `HumanReviewRecord`, `CounselPackExportRecord`, and `AuditLogRecord`.

The contracts are executable design artifacts. They do not start a server, add backend dependencies, store files, persist provider keys, process KYC, or create real chain records.

### `src/lib/counselPack.ts`

Owns export behavior:

- `buildMarkdownCounselPack(project, audit, manifest, counselQuestions, counselReviews, modelIntake, regulatoryGraph, exportTemplate, dataBoundaryReport, regulatorySourceReview, regulatorySourceApprovalQueue)` generates audit preparation Markdown with the non-advice boundary, optional export-template agenda, Export Safety Gate summary, regulatory source graph, Source Review Ledger freshness metadata, Source Update Approval Queue gates, editable counsel questions, review statuses, model intake summary, AI event hashes, and evidence manifest context.
- `downloadMarkdownFile(filename, content)` uses a browser Blob download and does not upload content.
- `buildPrintableCounselPackHtml(title, markdown)` wraps the Markdown pack in escaped, print-oriented HTML.
- `printCounselPackPdf(title, markdown)` opens a browser print window so the user can save the local pack as PDF without uploading content.

### `src/lib/dataClassification.ts`

Owns shared W8 data-classification rules:

- `classifyDataBoundaryText(value)` detects private-key-like material, credential-like tokens, raw KYC references, personal-data references, and confidentiality labels with severity metadata.
- `redactClassifiedText(value)` redacts reusable snippets before UI, export, or server error surfaces display them.
- Model settings, export, and server upload boundaries must reuse this module instead of copying scanner regexes.

### `src/lib/dataBoundary.ts`

Owns export data-boundary behavior:

- `createDataBoundaryReport(input)` scans project facts, evidence metadata/content, counsel questions, counsel review notes, and AI event records for private-key-like material, credential-like tokens, raw KYC references, personal-data references, and confidentiality labels.
- `summarizeDataBoundaryForExport(report)` produces the Markdown-safe Export Safety Gate section for Counsel Pack output.
- `redactDataBoundaryText(value)` redacts private keys, API keys, raw KYC phrases, and direct personal-data identifiers before preview/export strings are rendered.

Blocked findings disable Counsel Pack Markdown download, browser Print / Save PDF, manifest JSON, simulated anchor receipt, Pack Version save, and server export-record creation in `CounselPackPanel`. Warnings keep export available but visible for human confirmation. The module is audit preparation data classification only; it does not perform legal review or KYC.

### `src/lib/securityReviewChecklist.ts`

Owns integration security readiness behavior:

- `createSecurityReviewChecklist(input)` combines Model Connect status, Evidence Retention Readiness, Export Safety Gate state, evidence count, and manifest readiness into model-provider, evidence-storage, and anchor-integration gates.
- The checklist returns ready, needs-review, or blocked status with sanitized evidence, recovery actions, and requirements before real external model providers, raw object storage, or chain writes can be enabled.
- Simulated manifest receipts can be marked ready for audit-prep handoff while still requiring wallet signing, privacy, transaction logging, and consent review before real chain writes.

The checklist is audit preparation metadata only. It does not store credentials, persist raw files, call model providers, write to a blockchain, or create legal conclusions.

### `src/lib/integrationReadiness.ts`

Owns W9 adapter readiness behavior:

- `createIntegrationReadinessRegistry(input)` maps the Security Review Checklist plus manifest, evidence, remediation, Model Connect, and Counsel Pack version state into five adapter records: server model provider, object storage vault, chain anchor, document parser/OCR, and GRC ticket export.
- Each adapter returns one of `ready`, `needs-policy`, `blocked`, or `disabled`, plus sanitized readiness evidence, validation errors, recovery action, required policy, and the Not legal advice boundary.
- The registry makes deferred integrations visible without enabling them. Local mock model routing can make the server provider adapter explicitly disabled; metadata-only remediation queues can make GRC ticket export ready; object storage, chain anchoring, and OCR stay behind policy or blocker states.

The registry is audit preparation metadata only. It does not call external providers, persist secrets, upload raw files, run OCR, create GRC tickets, write chain transactions, or change deterministic audit scoring.

### `src/lib/grcTicketExport.ts`

Owns the first W9 GRC export artifact:

- `createGrcTicketExport(input)` turns deterministic remediation items into metadata-only ticket records with owner, priority, action, linked risk flag IDs, source titles, adapter status, blockers, and the Not legal advice boundary.
- The export is gated by `IntegrationReadinessRegistry`. If the GRC adapter is blocked or disabled, the bundle contains sanitized blockers and no tickets.
- `exportGrcTicketExportJson()` and `downloadGrcTicketExportJson()` serialize and download the local JSON bundle for review handoff.

The bundle is audit preparation workflow metadata only. It does not create Jira, Linear, ServiceNow, GRC, or other external system records, and it does not include raw evidence content.

### `src/lib/counselPackTemplates.ts`

Owns Counsel Pack export template behavior:

- `counselPackTemplates` defines the initial launch readiness, RWA/tokenized asset, AI governance, custody controls, and marketing claims review templates.
- `recommendCounselPackTemplate(project, audit)` recommends a template from project facts without changing deterministic risk scoring.
- `getCounselPackTemplateById(id)` returns a stable template for UI selection and Markdown export.

Templates are audit-preparation routing aids only. They must not hide missing evidence, create legal conclusions, or change risk scoring.

### `src/lib/counselPackVersions.ts`

Owns Counsel Pack export version metadata:

- `createCounselPackVersionRecord(project, audit, manifest, regulatorySourcePack, markdown, counselReviews, previousVersions)` stores export metadata with manifest hash, Markdown hash, Regulatory Source Pack hash, source review status, review-status snapshot, source snapshot, export timestamp, and Not legal advice boundary.
- `createCounselPackDiff(previous, next)` compares manifest hash, Markdown hash, Regulatory Source Pack hash, source changes, and review-status changes between saved exports.
- `exportCounselPackVersionJson(record)` and `downloadCounselPackVersionJson(filename, record)` export metadata-only JSON.

Version records intentionally do not store raw Markdown content, credentials, raw KYC, personal data, or legal conclusions. They are audit preparation export metadata only.

### `src/lib/counselPackExportClient.ts`

Owns the browser-to-Phase-2 API call for server export records:

- `createServerCounselPackExportRecord(apiBaseUrl, workspaceId, versionRecord, createdBy)` maps the latest local Counsel Pack version into a metadata-only API request.
- The request includes manifest hash, Markdown artifact hash, artifact size, review summary, source count, Regulatory Source Pack hash, source review status, and the Not legal advice boundary.
- It does not send raw Markdown, PDF bytes, credentials, raw KYC, or personal data.

### `src/data/sampleProfiles.ts`

Owns seeded demo scenarios. Each scenario should represent a realistic legal/compliance posture:

- high-risk tokenized yield/custody case
- DAO governance or contract workflow case
- lower-risk legal education/reference case

Do not put scoring logic in this file.

### `src/data/demoScenarios.ts` and `src/lib/demoScenarioLibrary.ts`

Own the judge-ready scenario launcher:

- `demoScenarios` maps seeded synthetic profiles to short runnable demo paths, expected artifacts, focus tags, and recommended starting tabs.
- `validateDemoScenarioLibrary()` verifies every scenario references an existing sample profile, repeats the Not legal advice boundary, includes enough path steps and artifacts, and blocks unsafe demo text such as raw KYC, private keys, seed phrases, or live API keys.
- `findDemoScenarioById()` is the UI lookup helper used before loading a sample profile.

Scenario paths are synthetic audit preparation routes only. They must not create parallel scoring logic or require private credentials.

### `src/App.tsx`

Owns UI state and composition:

- current `ProjectProfile`
- localStorage read/write for valid projects
- editable counsel questions and counsel review statuses
- local evidence audit trail events
- active tab
- async evidence manifest state
- current regulatory source graph derived from project facts, audit flags, and evidence items
- current Export Safety Gate report derived from project facts, evidence, counsel queues, and AI event records
- current Security Review Checklist derived from Model Connect, retention, export boundary, manifest, and evidence state
- current Evidence Intake Guidance derived from project facts, risk evidence coverage, and recommended templates
- local server export-record cache filtered by current workspace ID
- selected Counsel Pack export template

The component calls library modules and renders the workbench surfaces: Regulatory Command Center, Secure Review Workspace, Security Review Checklist, Audit Wizard, AI Review, Model Intake, Jurisdiction Checklist, Risk Audit, Evidence Ledger, Counsel Pack, and Sources.

### `src/components/*`

Components are intentionally presentational and interaction-focused:

- `ProjectWorkspace` edits project facts, loads synthetic samples, and hosts the Demo Scenario Library launcher.
- `DemoScenarioLibrary` renders seeded scenario paths, expected artifacts, focus tags, and start actions from `demoScenarioLibrary.ts` validation output.
- `AuditWizard` displays the step-by-step audit review.
- `AIReviewPanel` shows Model Access Workflow, Model Connection Readiness, the Redaction Gate, runs model-assisted review, and shows missing evidence.
- `ModelSettingsPanel` configures mock or OpenAI-compatible model settings without persisting API keys.
- `ModelIntakePanel` edits model connection profile metadata, AI event records, reviewers, review statuses, event hashes, human-review readiness, and standalone Model Intake JSON export.
- `RegulatoryCommandCenter` renders jurisdiction readiness, official-source clause triggers, source review freshness, source update approval gates, evidence gaps, manifest readiness, source links, and counsel handoff status from `regulatoryGraph.ts`, `regulatorySourceReview.ts`, and `regulatorySourceApproval.ts`.
- `SecureReviewWorkspace` runs the backend journey and renders workspace, Evidence Vault, Model Gateway Evaluation, Human Review, Audit Log Export, and audit log status without exposing raw model payloads or credentials.
- `SecurityReviewChecklistPanel` renders the integration security gates from `securityReviewChecklist.ts` and navigates users back to Model Connect, Evidence Ledger, or Counsel Pack recovery surfaces.
- `CounselQuestionsPanel` edits AI/rule/manual question text, priority, status, and local queue membership.
- `CounselReviewStatusPanel` edits deterministic risk flag status, reviewer, and notes inside Counsel Pack export.
- AI Review Run Ledger displays local payload/response hash receipts for completed model calls.
- `JurisdictionChecklistPanel` renders core US/EU/UK audit-prep prompts plus jurisdiction packs, policy controls, evidence-ready status, and local-counsel routing.
- `RiskAuditPanel` renders per-risk evidence workflow coverage from `riskEvidence.ts` and creates requested ledger items from missing requirements.
- `EvidenceLedger` renders Evidence Intake Guidance when a project has no evidence, applies scenario templates, pre-fills requested evidence rows, hashes local files into metadata-only evidence, adds, edits, or removes local evidence records with visible field labels for long-row and mobile editing, exposes recent local evidence audit trail events plus JSON export, renders Evidence Retention Readiness, exports retention policy JSON, and blocks Evidence Vault sync when retention blockers are present.
- `CounselPackPanel` selects an export template, renders the Export Safety Gate, previews and downloads Markdown output, opens browser Print / Save PDF, includes model intake summary and AI event hashes when present, edits counsel questions and review statuses, saves version-history metadata with diffs, creates metadata-only server export records from the latest Pack Version, and exports version JSON, manifest JSON, Regulatory Source Pack JSON, and simulated anchor receipt JSON.

### `src/styles.css`

Owns global and component-level styling. The UI should remain dense, functional, and judge-demo friendly. Avoid decorative layouts that hide the product workflow.

## Phase 2 Extension Architecture

Phase 1 is intentionally local-first. React state, browser `localStorage`, pure TypeScript rules, browser-side hashing, mock/OpenAI-compatible model settings, Markdown download, browser Print / Save PDF, Model Intake JSON, Evidence Audit Trail JSON, and simulated anchor receipts all run in the browser. This is sufficient for the hackathon MVP and keeps the non-advice boundary visible.

Phase 2 introduces a small backend boundary without replacing the current workbench. The professional-prototype shape is Node.js + TypeScript + Fastify + SQLite + Prisma, with local filesystem evidence storage only for development. The backend should own durable workspace records, evidence upload metadata, model gateway receipts, human review records, server-side exports, and audit logs. The frontend should keep rendering the workbench and should call typed backend APIs only after the contracts are stable.

The Week 2 backend design spike is documented in `docs/phase-2-backend-design-spike.md`. The executable contract draft lives in `src/lib/phase2ApiContracts.ts`. The backend now exposes `GET /api/health`, Model Gateway adapter readiness, Workspace create/read/update routes, multipart Evidence Vault upload/list/update/replacement/manifest routes, mock Model Gateway run routes, Human Review create/update/list/queue-view routes, Counsel Pack export-record create/list/read routes, and Audit Log listing/filtering. `server/app.ts` composes shared hooks and route modules; `server/systemRoutes.ts`, `server/workspaceRoutes.ts`, `server/modelGatewayRoutes.ts`, `server/counselPackExportRoutes.ts`, `server/humanReviewRoutes.ts`, `server/evidenceVaultRoutes.ts`, and `server/auditLogRoutes.ts` are W7 route modules split out of the monolithic app while preserving route contracts and repository-backed audit logging. `server/apiError.ts` provides the shared typed error response shape; Workspace, Evidence Vault, Model Gateway, Human Review, Counsel Pack export, and Audit Log filter failures now include stable codes, the audit-prep boundary, and recovery guidance where useful. `server/index.ts` uses Prisma/SQLite through `server/reviewWorkspaceRepository.ts`; tests can still use the memory adapter for isolated route checks. Raw file persistence, OCR, server-rendered PDF export, and real provider proxying are still deferred.

### Model Gateway Responsibilities

- proxy model calls through a server-side policy boundary
- apply Redaction Gate checks before provider calls
- enforce allowed data classes before run creation
- keep provider credentials out of React state and exports
- evaluate metadata-only provider and secret policy reports without enabling external provider proxying
- record provider label, model, purpose, payload hash, response hash, source evidence hash, status, redaction status, retry state, and provider policy metadata
- persist blocked/failed run receipts with error codes and remediation steps
- automatically queue human-review-required records for completed Model Gateway output

The gateway must keep model output as draft audit preparation. It must not change deterministic risk scoring, produce legal advice, or make final compliance decisions.

`server/modelGatewayService.ts` implements the first gateway seam: it exposes adapter readiness, evaluates metadata-only provider and secret policy reports, validates redaction, allowed data classes, credential, KYC, final-decision, human-review, and provider-adapter boundaries, then creates a mock run receipt with payload hash, response hash, source evidence hash, provider metadata, retry state, and human-review status. Boundary failures and disabled adapter attempts create safe failure receipts with error codes, retry state, and remediation steps. The backend enables only the local mock adapter in Phase 2A; OpenAI-compatible and enterprise-proxy adapters remain disabled placeholders even when secret policy controls evaluate ready, until a separate adapter enablement review is approved. `server/modelGatewayRoutes.ts` persists successful and failed run receipts through the repository, automatically creates a `model-run` Human Review request for completed output, and appends audit-log records for both the run and the review queue action. It does not call external providers or store credentials.

### Evidence Vault Responsibilities

- accept file upload metadata or external evidence references
- compute and store server-side file hashes
- keep raw file bytes out of Counsel Pack exports by default
- track owner, source notes, linked risk flags, linked regulatory control IDs, evidence status, version, replacement lineage, and timestamps
- enforce evidence status transitions before updating persisted records
- block active duplicate hashes before storing a second evidence record
- let rejected records be superseded by replacement metadata while preserving parent/child relationships and replacement reasons
- feed the Evidence Manifest with stable server-side evidence versions

The Phase 2 draft must not store raw KYC or personal data. Secure document parsing and OCR should be added only after privacy and retention boundaries are documented.

`src/lib/evidenceVaultWorkflow.ts` owns the shared Evidence Vault status machine. `server/evidenceVaultRoutes.ts` uses it before PATCH writes so rejected evidence cannot be directly reactivated and superseded records stay historical; users must use the replacement endpoint to preserve parent/child lineage. `server/evidenceVaultService.ts` implements the first evidence boundary: it receives upload bytes in process memory, computes server-side SHA-256, returns metadata-only `EvidenceVaultRecord` values, detects active duplicate hashes, and builds replacement lineage for rejected records. It does not persist files or expose raw document content through JSON.

`src/lib/evidenceUploadBoundary.ts` is called by `server/evidenceVaultService.ts` before record creation so unsafe metadata is blocked server-side even if a client bypasses the UI retention gate. It reuses `src/lib/dataClassification.ts` for scanner coverage and returns class-level errors without echoing credentials, private keys, or raw KYC snippets.

### Human Review Workflow Responsibilities

- create review requests for deterministic risk flags, source clause matches, evidence records, model runs, and counsel packs
- expose queue views filtered by target type, status, and reviewer for operational triage
- let reviewers mark items as `under-review`, `reviewed`, `rejected`, or `needs-more-evidence`
- sync evidence-target and model-run-target review decisions back to linked workflow metadata
- preserve comments, reviewer identity, due dates, status history, and audit-log IDs as workflow metadata
- export a review timeline JSON for counsel/compliance handoff
- include human-review status in exports

Human review records are not signed legal opinions. They track audit preparation workflow status for counsel and compliance review.

`src/lib/humanReviewWorkflow.ts` implements the local review queue, due-date defaults, latest-decision projection, linked evidence/model/risk status mapping, and review timeline export. `src/lib/serverHumanReviewQueue.ts` creates metadata-only server queue views with target/status/reviewer counts and next actions. `src/lib/serverHumanReviewEffects.ts` maps evidence-target review decisions to Evidence Vault status updates and model-run-target decisions to Model Gateway `humanReviewStatus` updates without treating review as legal approval. `server/humanReviewService.ts` implements review record creation and status updates for the Phase 2 API skeleton. `server/humanReviewRoutes.ts` persists records through the repository, returns filtered queue views, validates create/update payloads, returns typed error codes for recoverable failures, syncs linked evidence/model-run status when applicable, and appends audit-log records for create/update/sync actions.

### Counsel Pack Export Record Responsibilities

- create server-side records for saved local Counsel Pack versions
- persist version number, project title, artifact name, manifest hash, artifact hash, artifact size, risk level, review summary, source count, Regulatory Source Pack hash, source review status, creator, status, timestamp, and Not legal advice boundary
- reject raw Markdown/PDF content, raw KYC/personal data, credential material, invalid hashes, and invalid artifact metadata
- append audit-log records when a server export record is created

`server/counselPackExportService.ts` implements export-record validation and metadata construction. `src/lib/counselPackExportClient.ts` maps local Pack Version metadata into the Phase 2 API request. `server/counselPackExportRoutes.ts` persists records through the repository, exposes create/list/lookup routes, appends audit-log records, returns typed error codes for unsafe payloads and missing records, and intentionally does not render PDFs or store raw Counsel Pack content.

### Audit Log Responsibilities

- append operation metadata for workspace, evidence, model-run, human-review, and export actions
- record actor, target, action, timestamp, summary, and before/after hashes
- support export and review of process integrity without storing raw secrets

Audit logs are review metadata. They are not real chain anchors, signed approvals, or legal conclusions.

`src/lib/auditLogFilters.ts` normalizes and validates server audit-log query filters for actor, action, target type, and target ID. `server/auditLogRoutes.ts` lists persisted audit-log records for a workspace through the repository and applies those filters while returning typed errors for unsupported filter values. Audit-log export shaping stays in `src/lib/auditLogExport.ts`; the route returns stored metadata records and does not expose raw evidence, raw model payloads, credentials, or legal conclusions.

`server/reviewWorkspaceRepository.ts` provides both an in-memory adapter for tests and a Prisma/SQLite adapter for the API process. The Prisma schema covers only `WorkspaceRecord`, `EvidenceVaultRecord`, `ModelGatewayRun`, `HumanReviewRecord`, `CounselPackExportRecord`, and `AuditLogRecord`.

### Current Simulated Capabilities

These capabilities remain simulated or local in the current codebase:

- API keys for live model calls are browser-session only and are not persisted.
- The Phase 2 Model Gateway creates mock success receipts, auto-queues completed output for Human Review, and creates safe failure receipts only; it does not call external providers or store provider credentials.
- OpenAI-compatible and enterprise-proxy Model Gateway adapters are visible as disabled readiness records only.
- Evidence files are hashed locally in the browser or uploaded through the Phase 2 multipart route for server-side metadata hashing.
- The Phase 2 server computes evidence hashes in memory for metadata records and persists evidence metadata, but does not persist uploaded file bytes.
- Workspace, Evidence Vault, Model Gateway, Human Review, Counsel Pack Export, and Audit Log records use Prisma/SQLite in the API process.
- Evidence Audit Trail is local browser metadata, not a signed external log.
- Counsel Pack PDF output uses browser Print / Save PDF, not backend rendering.
- Server export records store hashes, Regulatory Source Pack lineage metadata, and metadata for a local Counsel Pack version, not the raw Markdown/PDF artifact.
- Manifest anchoring creates a simulated receipt and does not submit a transaction.
- Model Intake and AI Review ledgers are local audit-prep metadata, not final model governance certification.

## Testing Strategy

Domain tests live next to the audit engine and cover:

- critical risk classification
- low-risk no-custody classification
- stable evidence hashing
- hash changes when evidence changes
- counsel memo content
- counsel question generation and queue merging
- counsel review status generation and queue merging
- hackathon submission fit
- project validation errors
- demo scenario validation, lookup, summary text, and blocked unsafe demo text
- manifest item and bundle hashing
- manifest JSON export
- manifest JSON browser download behavior
- AI review payload redaction
- missing evidence checklist generation
- missing evidence request generation for Evidence Ledger
- mock and OpenAI-compatible model provider behavior
- model access workflow status and blockers
- model connection readiness and redaction blocker gating
- model connection profile validation
- AI event hashing and model intake summaries
- Model Intake JSON browser download behavior
- AI Review run conversion into Model Intake events
- AI event reviewer and review-status editing
- data boundary report classification, blocker handling, redacted snippets, and export Markdown summary
- security review checklist status, sanitized blockers, session-model review state, and simulated-anchor requirements
- integration readiness registry status, disabled adapters, policy blockers, safe GRC readiness, and sanitized unsafe evidence blockers
- GRC ticket export bundle gating, metadata-only remediation records, JSON serialization, and browser download
- counsel pack model intake export
- model review run payload and response hashing
- model review run JSON export
- Model Gateway evaluation record generation, redaction, and JSON export
- Audit Log Export record generation, redaction, sorting, counts, and JSON export
- counsel pack Markdown content
- counsel pack template recommendation and template-specific Markdown agenda behavior
- Markdown browser download behavior
- counsel pack version record hashing, diffing, and metadata-only JSON download behavior
- server Counsel Pack export-record client mapping and metadata-only API behavior
- printable counsel pack HTML and browser print behavior
- redaction report warnings and blockers
- jurisdiction checklist generation
- jurisdiction pack controls and local-counsel routing
- simulated anchor receipt export
- evidence template recommendation and instantiation
- empty-ledger evidence intake guidance, recommended template actions, and missing risk evidence requests
- local file SHA-256 hashing and metadata-only evidence creation
- evidence audit trail create/update/remove events and JSON export
- evidence retention policy classification, redaction, vault-sync blocker status, and JSON export
- Evidence Vault metadata boundary scanning for credential material, private-key-like values, raw KYC references, negated clean KYC references, and sanitized errors
- Evidence Vault status transition guardrails and rejected/superseded recovery errors
- Phase 2 evidence vault validation, model gateway summary, and audit-log helper behavior
- Phase 2 API route contracts, Model Gateway boundary validation, Evidence Upload boundary validation, and Prisma schema draft scope
- Phase 2 Fastify system-route registration, typed API error responses, Workspace route-module registration, Evidence Vault route-module registration, and server-side Evidence Vault metadata hashing
- Phase 2 Model Gateway adapter readiness, mock run routes, Human Review route-module registration, persisted review routes, filtered server-side review queue views, and linked evidence/model-run review status sync
- Phase 2 Counsel Pack export-record creation, route validation, repository persistence, audit-log route-module registration/filtering, and audit-log creation
- Phase 2 Prisma/SQLite repository persistence for Workspace, Evidence Vault, Model Gateway, Human Review, Counsel Pack Export, and Audit Log records
- source-linked risk issue card generation
- per-risk evidence workflow coverage
- regulatory source review freshness, source update approval gates, review-due actions, reviewer notes, and non-advice boundary

UI tests cover:

- the main workbench shell
- Demo Scenario Library scenario launch into the recommended workbench surface
- BLI hackathon targeting
- required tabs
- custom project creation
- Risk Audit updates from the new project profile
- per-risk evidence workflow coverage updates from ledger evidence
- missing Risk Audit evidence request flow into Evidence Ledger
- empty Evidence Ledger guidance and recommended template application
- Evidence Ledger item creation
- local file evidence import without displaying raw file content
- long evidence record editing with visible field labels
- manifest bundle hash visibility
- Model Gateway Evaluation visibility and JSON download action
- Audit Log Export visibility and JSON download action
- Security Review Checklist visibility and gate updates from Model Connect and evidence blockers
- AI Review mock workflow
- Model Access Workflow visibility in AI Review
- Model Intake profile and AI event workflow
- Redaction Gate visibility
- AI Review Run Ledger visibility
- editable counsel questions in Counsel Pack
- editable counsel review statuses in Counsel Pack
- Counsel Pack export template switching and Markdown agenda update
- Export Safety Gate blocking Counsel Pack export actions for private keys, API keys, and raw KYC materials
- Counsel Pack version save, diff visibility, and version JSON download action
- Counsel Pack server export-record creation from saved Pack Version metadata
- Jurisdiction Checklist tab with policy controls and local-counsel routing
- source-linked Risk Audit trigger explanations
- evidence template application
- Evidence Audit Trail visibility and JSON download action
- Evidence Retention Readiness blocker state and disabled Evidence Vault sync action
- manifest JSON download action
- Counsel Pack Print / Save PDF action
- simulated anchor receipt creation

## Extension Points

Good next additions:

- import custom JSON profiles
- deepen jurisdiction pack controls with more scenarios, evidence patterns, and local-counsel workflows
- add source citation controls per flag
- add optional real on-chain anchoring only after privacy, wallet, backend, and signing boundaries are documented
- add screenshot-backed demo assets

Avoid adding real legal conclusions, real wallet signing, or third-party data upload until the non-advice and data-handling boundaries are explicit.
