# BLI Legal Audit MVP Design

## Goal

Build a polished MVP for BLI Legal Tech Hackathon 2 that helps Web3 teams prepare legal and compliance audit packets.

## Target User

The primary user is a founder, protocol operator, or legal operations teammate preparing a product for counsel review. The secondary user is a hackathon judge checking whether the project is useful, complete, and aligned with BLI themes.

## Product Surface

LexProof AuditOS has five tabs:

- Intake: project scenario, jurisdictions, custody, data, AI, blockchain use, and operator notes.
- Risk Audit: weighted risk score, flags, rationale, and remediation queue.
- Evidence Ledger: normalized evidence items and a deterministic SHA-256 bundle hash.
- Counsel Pack: Markdown memo with non-advice disclaimer, facts, flags, owners, hash, and sources.
- Sources: hackathon and audit research references.

## Architecture

The app is a Vite React SPA with a pure TypeScript audit engine. `src/lib/auditEngine.ts` owns scoring, evidence hashing, memo generation, and hackathon fit metadata. `src/data/sampleProfiles.ts` owns seeded demo cases. `src/App.tsx` composes the workbench and keeps UI state local.

## Testing

Vitest covers the audit engine and key UI surfaces. Tests assert high-risk and low-risk classifications, stable SHA-256 hashes, memo contents, submission fit metadata, and rendered workbench tabs.

## Submission Fit

The MVP directly maps to BLI's legal, compliance, AI, RegTech, finance, RWA, and blockchain themes. It produces the assets a DoraHacks submission needs: public repo, README, source pack, demo-ready UI, and a generated counsel packet.
