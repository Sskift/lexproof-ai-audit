# Architecture

LexProof AuditOS is a Vite React single-page application. The app is intentionally local-first: all demo data, scoring, hashing, and memo generation happen in the browser with pure TypeScript logic.

## Top-Level Shape

```text
lexproof-ai-audit/
  src/
    App.tsx                  # React workbench shell, persistence, and tab composition
    styles.css               # Responsive UI styling
    main.tsx                 # React entry point
    components/
      ProjectWorkspace.tsx   # Editable project profile and sample loading
      AuditWizard.tsx        # Step-by-step project review surface
      AIReviewPanel.tsx      # Controlled model-assisted audit preparation
      ModelSettingsPanel.tsx # Mock/OpenAI-compatible model configuration
      JurisdictionChecklistPanel.tsx # US/EU/UK audit-prep checklist surface
      EvidenceLedger.tsx     # Editable evidence queue and manifest display
      CounselPackPanel.tsx   # Markdown, manifest, and simulated receipt export
    data/
      sampleProfiles.ts      # Seed legal/compliance audit scenarios
      evidenceTemplates.ts   # Seed evidence request templates
    lib/
      auditEngine.ts         # Pure audit engine and memo/hash helpers
      aiReview.ts            # AI review payload, redaction gate, missing evidence checklist
      modelProvider.ts       # Mock and OpenAI-compatible model provider adapters
      modelReviewLedger.ts   # AI review run receipts and model payload/response hashes
      projectModel.ts        # Project/evidence types and validation
      evidenceTemplates.ts   # Template recommendation and instantiation helpers
      riskExplainers.ts      # Source-linked issue cards and trigger facts
      riskEvidence.ts        # Per-risk evidence requirements and coverage status
      evidenceManifest.ts    # Deterministic item and bundle hashes
      anchorReceipt.ts       # Local simulated manifest anchor receipt
      jurisdictionChecklist.ts # Jurisdiction checklist generation
      counselPack.ts         # Markdown pack and browser download helper
      auditEngine.test.ts    # Domain tests
    App.test.tsx             # UI smoke test
  docs/
    research.md              # Hackathon and audit research notes
  README.md                  # Product and submission overview
  WORKFLOW.md                # Direct-to-main development process
  CONTRIBUTING.md            # Project guardrails
```

## Data Flow

```text
sampleProfiles or blank project
  -> ProjectProfile in App state
  -> localStorage persistence when valid
  -> analyzeAuditProfile(project)
  -> createRiskIssueCards(project, audit)
  -> createRiskEvidenceCoverage(audit, project.evidenceItems)
  -> createJurisdictionChecklist(project, audit)
  -> recommendEvidenceTemplates(project)
  -> createRedactionReport(project.evidenceItems)
  -> buildAIReviewPayload(project, audit, evidenceItems)
  -> runAIReview(...) through mock or OpenAI-compatible provider
  -> create local ModelReviewRun with payload and response hashes
  -> createEvidenceManifest(project, audit, evidenceItems)
  -> createSimulatedAnchorReceipt(manifest)
  -> buildMarkdownCounselPack(project, audit, manifest)
  -> tabbed UI surfaces and Markdown download
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

### `src/lib/evidenceTemplates.ts`

Owns evidence template behavior:

- `listEvidenceTemplates()` returns the static template library from `src/data/evidenceTemplates.ts`.
- `recommendEvidenceTemplates(project)` ranks templates against current project facts.
- `createEvidenceItemsFromTemplate(templateId)` creates requested evidence items for the ledger.

Templates currently cover tokenized yield/RWA issuance, DAO governance/multisig execution, and AI legal/compliance workflows. Template content is synthetic-safe and should not include raw KYC, personal records, or secrets.

### `src/lib/jurisdictionChecklist.ts`

Owns jurisdiction checklist generation:

- `createJurisdictionChecklist(project, audit)` returns US, EU, UK, and fallback local-counsel prompts.
- Checklist items are preparation prompts with source text, priority, and evidence status.
- The module does not classify legality, compliance, securities status, or licensing status.

### `src/lib/modelProvider.ts`

Owns model connection boundaries:

- `createMockModelProvider()` returns deterministic demo output for judges and tests.
- `buildOpenAICompatibleRequest()` prepares a chat-completions request without putting API keys in the JSON body.
- `createOpenAICompatibleModelProvider()` can call a user-supplied OpenAI-compatible endpoint.
- `validateModelSettings()` prevents live calls without endpoint, model, and API key.

API keys are not persisted by the app.

### `src/lib/modelReviewLedger.ts`

Owns model-run audit receipts:

- `runAIReviewWithLedger()` runs a provider, parses the AI review result, and creates a local run receipt.
- `createModelReviewRun()` records provider label, model name, redaction status, payload hash, response hash, risk flag count, and evidence summary count.
- `exportModelReviewRunJson()` and `downloadModelReviewRunJson()` export the receipt without raw credentials.

Run receipts support audit preparation and reproducibility. They are not legal conclusions, proof of model correctness, or a substitute for human review.

### `src/lib/evidenceManifest.ts`

Owns deterministic manifest behavior:

- `hashEvidenceItem(item)` hashes normalized evidence content and material metadata.
- `createEvidenceManifest(project, audit, evidenceItems)` returns item hashes, risk context, and a bundle SHA-256.
- `exportManifestJson(manifest)` produces readable JSON for future export surfaces.
- `downloadManifestJson(filename, manifest)` downloads the manifest locally as JSON.

The first-stage manifest is local and simulated. It is not a real chain write or proof of external existence.

### `src/lib/anchorReceipt.ts`

Owns simulated manifest anchoring:

- `createSimulatedAnchorReceipt(manifest, network)` creates a local receipt for a manifest bundle hash.
- `exportAnchorReceiptJson(receipt)` produces readable JSON for handoff.
- `downloadAnchorReceiptJson(filename, receipt)` downloads the simulated receipt.

The receipt status is `not-submitted` and the mode is `simulated`. It is not a real on-chain write and contains only manifest metadata, not raw evidence.

### `src/lib/counselPack.ts`

Owns export behavior:

- `buildMarkdownCounselPack(project, audit, manifest)` generates audit preparation Markdown with the non-advice boundary.
- `downloadMarkdownFile(filename, content)` uses a browser Blob download and does not upload content.

### `src/data/sampleProfiles.ts`

Owns seeded demo scenarios. Each scenario should represent a realistic legal/compliance posture:

- high-risk tokenized yield/custody case
- DAO governance or contract workflow case
- lower-risk legal education/reference case

Do not put scoring logic in this file.

### `src/App.tsx`

Owns UI state and composition:

- current `ProjectProfile`
- localStorage read/write for valid projects
- active tab
- async evidence manifest state

The component calls library modules and renders five surfaces: Audit Wizard, Risk Audit, Evidence Ledger, Counsel Pack, and Sources.

### `src/components/*`

Components are intentionally presentational and interaction-focused:

- `ProjectWorkspace` edits project facts and loads synthetic samples.
- `AuditWizard` displays the step-by-step audit review.
- `AIReviewPanel` shows the Redaction Gate, runs model-assisted review, and shows missing evidence.
- `ModelSettingsPanel` configures mock or OpenAI-compatible model settings without persisting API keys.
- AI Review Run Ledger displays local payload/response hash receipts for completed model calls.
- `JurisdictionChecklistPanel` renders US/EU/UK audit-prep prompts and evidence status.
- `RiskAuditPanel` renders per-risk evidence workflow coverage from `riskEvidence.ts`.
- `EvidenceLedger` applies scenario templates and adds, edits, or removes local evidence records with visible field labels for long-row and mobile editing.
- `CounselPackPanel` previews and downloads Markdown output, manifest JSON, and simulated anchor receipt JSON.

### `src/styles.css`

Owns global and component-level styling. The UI should remain dense, functional, and judge-demo friendly. Avoid decorative layouts that hide the product workflow.

## Testing Strategy

Domain tests live next to the audit engine and cover:

- critical risk classification
- low-risk no-custody classification
- stable evidence hashing
- hash changes when evidence changes
- counsel memo content
- hackathon submission fit
- project validation errors
- manifest item and bundle hashing
- manifest JSON export
- manifest JSON browser download behavior
- AI review payload redaction
- missing evidence checklist generation
- mock and OpenAI-compatible model provider behavior
- model review run payload and response hashing
- model review run JSON export
- counsel pack Markdown content
- Markdown browser download behavior
- redaction report warnings and blockers
- jurisdiction checklist generation
- simulated anchor receipt export
- evidence template recommendation and instantiation
- source-linked risk issue card generation
- per-risk evidence workflow coverage

UI tests cover:

- the main workbench shell
- BLI hackathon targeting
- required tabs
- custom project creation
- Risk Audit updates from the new project profile
- per-risk evidence workflow coverage updates from ledger evidence
- Evidence Ledger item creation
- long evidence record editing with visible field labels
- manifest bundle hash visibility
- AI Review mock workflow
- Redaction Gate visibility
- AI Review Run Ledger visibility
- Jurisdiction Checklist tab
- source-linked Risk Audit trigger explanations
- evidence template application
- manifest JSON download action
- simulated anchor receipt creation

## Extension Points

Good next additions:

- import custom JSON profiles
- add richer jurisdiction checklists
- add source citation controls per flag
- add optional real on-chain anchoring only after privacy, wallet, backend, and signing boundaries are documented
- add PDF export and screenshot-backed demo assets

Avoid adding real legal conclusions, real wallet signing, or third-party data upload until the non-advice and data-handling boundaries are explicit.
