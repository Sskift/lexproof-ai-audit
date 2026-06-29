# LexProof AuditOS

LexProof AuditOS is a legal and compliance audit MVP for **BLI Legal Tech Hackathon 2** on DoraHacks. It helps Web3 teams turn messy launch facts into a counsel-ready audit workspace with risk flags, remediation owners, editable evidence records, deterministic manifest hashes, source references, and downloadable Markdown counsel packs.

This project is not legal advice. It is an audit preparation workflow for lawyers, compliance teams, and builders.

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
- Weighted legal/compliance risk audit with explicit flags and owner assignments.
- Editable Evidence Ledger with evidence status, owner, source notes, item hashes, and manifest bundle hash.
- Evidence Manifest generator with deterministic SHA-256 item hashes, bundle hash, and JSON download.
- Counsel Pack Markdown download with non-advice disclaimer, project facts, risk posture, manifest hash, source pack, and remediation queue.
- Submission fit scorecard for BLI themes and required DoraHacks assets.
- Responsive React workbench with tabs for Audit Wizard, Risk Audit, Evidence Ledger, Counsel Pack, and Sources.

## First-Stage Workflow

1. Open the app and click **New project**, or load one of the synthetic sample profiles.
2. Fill in project facts in the Project Workspace. Do not enter raw KYC, private keys, or personal data.
3. Use **Audit Wizard** to review the facts and the non-advice handoff boundary.
4. Open **AI Review** to run the mock reviewer or configure an OpenAI-compatible model. AI output is draft audit preparation, not legal advice.
5. Open **Risk Audit** to see current risk level, weighted flags, and remediation owners.
6. Add or edit records in **Evidence Ledger**. The manifest updates with per-item hashes and a bundle SHA-256.
7. Open **Counsel Pack** and download the Markdown audit-prep packet or manifest JSON for counsel/compliance review.

Workspace data is stored locally in browser `localStorage`. The MVP does not upload evidence by default, perform real KYC, or write to a blockchain. API keys for live model calls are held in browser state and are not persisted.

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

## Run Locally

```bash
npm install
npm run verify
npm run dev
```

The dev server defaults to `http://127.0.0.1:5173`.

## Submission Assets

- Public GitHub repository: this repo
- Demo video: record the app flow through the five tabs
- DoraHacks BUIDL submission: use the generated Counsel Pack and README summary
- Source pack: see [docs/research.md](docs/research.md)

## Sources

- DoraHacks BLI page: https://dorahacks.io/hackathon/legal-hack-2026/detail
- BLI hackathon page: https://bli.tools/hackathon/
- CompeteHub BLI summary: https://www.competehub.dev/en/competitions/dorahackslegal-hack-2026
- Constellation Labs BLI 2025 highlights: https://medium.com/constellationlabs/building-the-future-of-legal-innovation-highlights-from-the-blockchain-legal-institute-hackathon-c65899009f75
