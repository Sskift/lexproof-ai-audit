# LexProof AuditOS

LexProof AuditOS is a legal and compliance audit MVP for **BLI Legal Tech Hackathon 2** on DoraHacks. It helps Web3 teams turn messy launch facts into a counsel-ready audit workspace with risk flags, remediation owners, editable evidence records, deterministic manifest hashes, source references, and downloadable Markdown counsel packs.

This project is not legal advice. It is an audit preparation workflow for lawyers, compliance teams, and builders.

## Pitch

**Problem:** early Web3 teams often approach counsel with scattered token terms, custody assumptions, KYC policies, AI drafts, governance notes, and launch claims. That makes legal/compliance review slower, more expensive, and harder to verify.

**Users:** founders, compliance leads, protocol engineers, and counsel preparing a launch, RWA pilot, DAO action, custody workflow, or AI legal/compliance product for review.

**Workflow:** create a project, run deterministic risk triage, use AI only for draft audit preparation, attach or request evidence, generate stable hashes, and export a counsel-ready packet.

**Why now:** Web3 teams increasingly mix AI-generated work, tokenized assets, custody controls, and multi-jurisdiction launches. The review handoff needs source lineage and evidence integrity, not another generic chatbot.

**Why BLI:** the hackathon's legal, compliance, finance, AI, RWA, RegTech, Bitcoin, Ethereum, and broader Web3 themes match a focused audit-preparation operating system with a clear non-advice boundary.

## Why This Hackathon

I selected BLI Legal Tech Hackathon 2 as the highest value non-Casper DoraHacks target because it is active, virtual, open worldwide, has a long runway, and aligns with a feasible but strong MVP across legal, compliance, AI, RegTech, finance, RWA, and blockchain themes.

Key evidence:

- DoraHacks lists BLI Legal Tech Hackathon 2 with legal, finance, compliance, AI, RWA, RegTech, Bitcoin, and Ethereum themes.
- CompeteHub summarizes the prize/support pool as $50k+ and the deadline as November 1, 2026.
- BLI's own hackathon page centers law, finance, compliance, mentoring, bounties, and builder support.
- Past BLI-adjacent projects rewarded verified data, digital evidence, and tamper-proof audit trails.

## MVP Features

- Custom Project Workspace for creating a local audit project from zero or loading synthetic samples.
- Step-by-step Audit Wizard for reviewing facts, AI/data/chain boundaries, and handoff readiness.
- AI Review with mock and OpenAI-compatible model settings for audit-prep extraction, draft questions, and missing evidence suggestions.
- Redaction Gate before model calls, with evidence payload previews, KYC/personal-data warnings, and blocker handling for private-key-like material.
- AI Review Run Ledger with local payload and response hashes for each completed model review.
- Jurisdiction Checklist for US, EU, and UK audit-prep prompts without legal conclusions.
- Weighted legal/compliance risk audit with explicit flags, owner assignments, source links, “why this flag triggered” issue cards, and per-risk evidence workflow coverage.
- Editable Evidence Ledger with evidence status, owner, source notes, visible edit labels, long-row wrapping, item hashes, and manifest bundle hash.
- Evidence Templates for tokenized yield/RWA issuance, DAO governance/multisig execution, and AI legal/compliance workflows.
- Evidence Manifest generator with deterministic SHA-256 item hashes, bundle hash, and JSON download.
- Simulated Anchor Receipt for the manifest bundle hash. It is explicitly not a real on-chain write.
- Counsel Pack Markdown download with non-advice disclaimer, project facts, risk posture, manifest hash, source pack, and remediation queue.
- Submission fit scorecard for BLI themes and required DoraHacks assets.
- Responsive React workbench with tabs for Audit Wizard, AI Review, Jurisdiction Checklist, Risk Audit, Evidence Ledger, Counsel Pack, and Sources.

## Product Screenshots

Risk Audit explains deterministic trigger facts and links source context for counsel review.

![Risk Audit with source-linked issue cards](docs/assets/screenshots/risk-audit-source-links.jpg)

AI Review keeps model output as draft audit preparation and records local run receipts with payload and response hashes.

![AI Review Run Ledger with payload and response hashes](docs/assets/screenshots/ai-review-run-ledger.jpg)

Counsel Pack exports Markdown, manifest JSON, and a simulated anchor receipt without claiming a real chain write.

![Counsel Pack export surface](docs/assets/screenshots/counsel-pack-exports.jpg)

## How Users Connect Models

LexProof uses a controlled BYOM/BYOK model workflow:

1. Open **AI Review**.
2. Use the built-in mock reviewer for demos, or choose the OpenAI-compatible provider.
3. Enter a base URL, model name, and API key. In this first-stage SPA, the API key is kept in browser state and is not persisted to `localStorage`.
4. Review the **Redaction Gate** payload summary before running the model.
5. Run AI Review only after evidence summaries are clean or reviewed. Private-key-like material blocks model calls.
6. After a completed run, inspect the **AI Review Run Ledger** for provider/model metadata, redaction status, payload SHA-256, response SHA-256, and a downloadable run JSON receipt.

Model output is draft audit preparation only. It does not change deterministic risk scoring, make legal conclusions, perform KYC, or replace counsel review.

## First-Stage Workflow

1. Open the app and click **New project**, or load one of the synthetic sample profiles.
2. Fill in project facts in the Project Workspace. Do not enter raw KYC, private keys, or personal data.
3. Use **Audit Wizard** to review the facts and the non-advice handoff boundary.
4. Open **AI Review** to inspect the Redaction Gate and run the mock reviewer or an OpenAI-compatible model. AI output is draft audit preparation, not legal advice, and each completed run receives a local hash receipt.
5. Open **Jurisdiction Checklist** to see US/EU/UK preparation prompts for counsel review.
6. Open **Risk Audit** to see current risk level, source-linked issue cards, trigger facts, weighted flags, evidence workflow coverage, and remediation owners.
7. Add or edit records in **Evidence Ledger**, or apply one of the scenario templates for tokenized yield/RWA, DAO governance/multisig, or AI compliance workflows. The manifest updates with per-item hashes and a bundle SHA-256.
8. Open **Counsel Pack** and download the Markdown audit-prep packet, manifest JSON, or a simulated anchor receipt JSON for counsel/compliance review.

Workspace data is stored locally in browser `localStorage`. The MVP does not upload evidence by default, perform real KYC, or write to a blockchain. API keys for live model calls are held in browser state and are not persisted. Model run ledger entries store hashes and metadata, not credentials. The anchor receipt is a local simulation for manifest handoff only.

## Tech Stack

- React 19
- TypeScript
- Vite
- Vitest
- Testing Library
- Lucide React icons

## Project Docs

- [WORKFLOW.md](WORKFLOW.md): direct-to-main development and push workflow.
- [ARCHITECTURE.md](ARCHITECTURE.md): module boundaries, data flow, and extension points.
- [CONTRIBUTING.md](CONTRIBUTING.md): product and engineering guardrails.
- [docs/research.md](docs/research.md): hackathon selection and audit research notes.
- [docs/product-strategy.md](docs/product-strategy.md): competition fit, product outlook, gaps, and roadmap.
- [docs/submission-pack.md](docs/submission-pack.md): screenshot-backed pitch, demo path, and submission narrative.

## Run Locally

```bash
npm install
npm run verify
npm run dev
```

The dev server defaults to `http://127.0.0.1:5173`.

## Submission Assets

- Public GitHub repository: this repo
- Demo video: record the app flow through project creation, AI Review, Jurisdiction Checklist, Risk Audit, Evidence Ledger, and Counsel Pack
- DoraHacks BUIDL submission: use the generated Counsel Pack and README summary
- Screenshot-backed submission narrative: see [docs/submission-pack.md](docs/submission-pack.md)
- Source pack: see [docs/research.md](docs/research.md)
- Demo script: see [docs/demo-script.md](docs/demo-script.md)

## Sources

- DoraHacks BLI page: https://dorahacks.io/hackathon/legal-hack-2026/detail
- BLI hackathon page: https://bli.tools/hackathon/
- CompeteHub BLI summary: https://www.competehub.dev/en/competitions/dorahackslegal-hack-2026
- Constellation Labs BLI 2025 highlights: https://medium.com/constellationlabs/building-the-future-of-legal-innovation-highlights-from-the-blockchain-legal-institute-hackathon-c65899009f75
