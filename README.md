# LexProof AuditOS

LexProof AuditOS is a legal and compliance audit MVP for **BLI Legal Tech Hackathon 2** on DoraHacks. It helps Web3 teams turn messy launch facts into a counsel-ready audit package with risk flags, remediation owners, evidence hashing, source references, and a copy-ready Markdown memo.

This project is not legal advice. It is an audit preparation workflow for lawyers, compliance teams, and builders.

## Why This Hackathon

I selected BLI Legal Tech Hackathon 2 as the highest value non-Casper DoraHacks target because it is active, virtual, open worldwide, has a long runway, and aligns with a feasible but strong MVP across legal, compliance, AI, RegTech, finance, RWA, and blockchain themes.

Key evidence:

- DoraHacks lists BLI Legal Tech Hackathon 2 with legal, finance, compliance, AI, RWA, RegTech, Bitcoin, and Ethereum themes.
- CompeteHub summarizes the prize/support pool as $50k+ and the deadline as November 1, 2026.
- BLI's own hackathon page centers law, finance, compliance, mentoring, bounties, and builder support.
- Past BLI-adjacent projects rewarded verified data, digital evidence, and tamper-proof audit trails.

## MVP Features

- Scenario-based intake for tokenized finance, DAO governance, and legal education projects.
- Weighted legal/compliance risk audit with explicit flags and owner assignments.
- Evidence ledger with deterministic SHA-256 hash over all attached facts and notes.
- Counsel Pack generator with non-advice disclaimer, project facts, risk posture, source pack, and remediation queue.
- Submission fit scorecard for BLI themes and required DoraHacks assets.
- Responsive React interface with tabs for Intake, Risk Audit, Evidence Ledger, Counsel Pack, and Sources.

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
