# LexProof AuditOS Submission Pack

This document is the screenshot-backed submission narrative for BLI Legal Tech Hackathon 2. LexProof creates audit preparation materials only. It is not legal advice, not a law firm, not a KYC provider, and not a real chain-writing service.

## Pitch

**Problem:** Web3 teams prepare launch reviews from scattered artifacts: token terms, custody assumptions, KYC policies, governance notes, AI-generated drafts, on-chain references, marketing claims, and investor questions. Counsel then has to reconstruct the facts before legal/compliance review can begin.

**Users:** founders, compliance leads, protocol engineers, and counsel preparing RWA pilots, tokenized private-credit products, DAO governance actions, custody workflows, protocol launches, or AI legal/compliance tools for review.

**Workflow:** a user creates a project, reviews facts in the Audit Wizard, registers model purpose and AI event records in Model Intake, runs deterministic risk triage, optionally uses AI for draft extraction and questions, applies evidence templates, checks the local Evidence Audit Trail, generates a deterministic manifest, and exports a counsel pack.

**Why now:** AI-generated compliance work, tokenized assets, cross-border launches, and custody workflows are converging. Teams need a repeatable review handoff with source lineage and evidence integrity rather than a generic chatbot answer.

**Why BLI:** the BLI Legal Tech Hackathon 2 themes include legal, compliance, finance, AI, RWA, RegTech, Bitcoin, Ethereum, and Web3. LexProof fits those themes by making the legal/compliance preparation workflow explicit, auditable, and non-advisory.

## Product Evidence

### Source-Linked Risk Audit

The Risk Audit uses deterministic project facts, not model output, to explain why each flag triggered. Issue cards include trigger facts, source context, and a non-advice boundary.

![Risk Audit with source-linked issue cards](assets/screenshots/risk-audit-source-links.jpg)

### Controlled Model Access

The Model Intake tab registers provider/model purpose, allowed data classes, human-review owner, and editable hashed AI event records without storing credentials. It also exports a standalone Model Intake JSON audit trail with profile metadata, readiness status, and event hashes. The AI Review tab supports a mock reviewer for demos and an OpenAI-compatible provider for BYOM/BYOK workflows. Model Access Workflow shows setup, provider, Redaction Gate, run, and human-review/export status. Model Connection Readiness tells users whether the mock reviewer is ready, live settings are incomplete, or Redaction Gate blockers prevent a run. The Redaction Gate previews evidence summaries before model calls, the AI Review Run Ledger records local payload and response hashes without storing API keys, and each completed AI Review run automatically creates a needs-review Model Intake event that can be marked reviewed or rejected.

![AI Review Model Connection Readiness](assets/screenshots/ai-review-connection-readiness.png)

![AI Review Model Access Workflow](assets/screenshots/model-access-workflow.png)

![Model Intake JSON export](assets/screenshots/model-intake-json-export.png)

![AI Review Run Ledger with payload and response hashes](assets/screenshots/ai-review-run-ledger.jpg)

### Counsel Handoff

The Counsel Pack exports a Markdown audit-prep packet, Model Intake summary with AI event hashes, Evidence Manifest JSON, and a simulated anchor receipt. The manifest bundle hash is local and deterministic; the anchor receipt is explicitly not a real on-chain write.

![Counsel Pack export surface](assets/screenshots/counsel-pack-exports.jpg)

### Submission Pack Artifact

The Sources tab generates metadata-only Submission Pack JSON and Demo Runbook JSON for judges. The Submission Pack carries the pack hash, manifest hash, Regulatory Source Pack hash, Demo Runbook hash, demo readiness status, required DoraHacks assets, feature-to-theme mapping, known limitations, and the Not legal advice boundary. It does not store raw KYC, credentials, raw evidence bytes, legal conclusions, or real chain-write claims.

![Submission Pack artifact](assets/screenshots/submission-pack.png)

### Evidence Change Trail

The Evidence Ledger records local evidence creation, template application, edits, and removals as audit-prep metadata. The trail is downloadable as JSON and remains separate from signed approvals or real chain anchoring.

![Evidence Audit Trail](assets/screenshots/evidence-audit-trail.png)

## Demo Path

1. Load the `YieldPassport` synthetic sample.
2. Open **Model Intake** and show model purpose, allowed data classes, human-review owner, AI event hash records, and Model Intake JSON download.
3. Open **AI Review**, inspect Model Access Workflow, Model Connection Readiness, and the Redaction Gate, run the mock reviewer, and show the Run Ledger plus the automatic editable Model Intake event.
4. Open **Risk Audit** and point to source-linked trigger facts.
5. Open **Evidence Ledger**, apply the tokenized yield/RWA evidence template, show the Evidence Audit Trail JSON export, and show the manifest bundle hash.
6. Open **Counsel Pack** and show the Model Intake Summary, AI event hashes, Markdown download, Manifest JSON, and simulated anchor receipt.
7. Open **Sources** and download **Submission Pack JSON** plus **Demo Runbook JSON** to show the judge-facing pack hash, Demo Runbook hash, known limitations, demo readiness, and clean-clone path.

## Boundaries

- Not legal advice.
- No real KYC processing.
- No private keys or personal data should be entered.
- No real blockchain write in the first-stage MVP.
- AI output remains draft audit preparation and does not control deterministic risk scoring.
- Model Intake records are audit-prep metadata for human review, not final legal or compliance decisions.
