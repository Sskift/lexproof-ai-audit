# LexProof AuditOS Submission Pack

This document is the screenshot-backed submission narrative for BLI Legal Tech Hackathon 2. LexProof creates audit preparation materials only. It is not legal advice, not a law firm, not a KYC provider, and not a real chain-writing service.

## Pitch

**Problem:** Web3 teams prepare launch reviews from scattered artifacts: token terms, custody assumptions, KYC policies, governance notes, AI-generated drafts, on-chain references, marketing claims, and investor questions. Counsel then has to reconstruct the facts before legal/compliance review can begin.

**Users:** founders, compliance leads, protocol engineers, and counsel preparing RWA pilots, tokenized private-credit products, DAO governance actions, custody workflows, protocol launches, or AI legal/compliance tools for review.

**Workflow:** a user creates a project, reviews facts in the Audit Wizard, runs deterministic risk triage, optionally uses AI for draft extraction and questions, applies evidence templates, generates a deterministic manifest, and exports a counsel pack.

**Why now:** AI-generated compliance work, tokenized assets, cross-border launches, and custody workflows are converging. Teams need a repeatable review handoff with source lineage and evidence integrity rather than a generic chatbot answer.

**Why BLI:** the BLI Legal Tech Hackathon 2 themes include legal, compliance, finance, AI, RWA, RegTech, Bitcoin, Ethereum, and Web3. LexProof fits those themes by making the legal/compliance preparation workflow explicit, auditable, and non-advisory.

## Product Evidence

### Source-Linked Risk Audit

The Risk Audit uses deterministic project facts, not model output, to explain why each flag triggered. Issue cards include trigger facts, source context, and a non-advice boundary.

![Risk Audit with source-linked issue cards](assets/screenshots/risk-audit-source-links.jpg)

### Controlled Model Access

The AI Review tab supports a mock reviewer for demos and an OpenAI-compatible provider for BYOM/BYOK workflows. The Redaction Gate previews evidence summaries before model calls, and the AI Review Run Ledger records local payload and response hashes without storing API keys.

![AI Review Run Ledger with payload and response hashes](assets/screenshots/ai-review-run-ledger.jpg)

### Counsel Handoff

The Counsel Pack exports a Markdown audit-prep packet, Evidence Manifest JSON, and a simulated anchor receipt. The manifest bundle hash is local and deterministic; the anchor receipt is explicitly not a real on-chain write.

![Counsel Pack export surface](assets/screenshots/counsel-pack-exports.jpg)

## Demo Path

1. Load the `YieldPassport` synthetic sample.
2. Open **AI Review**, inspect the Redaction Gate, run the mock reviewer, and show the Run Ledger.
3. Open **Risk Audit** and point to source-linked trigger facts.
4. Open **Evidence Ledger**, apply the tokenized yield/RWA evidence template, and show the manifest bundle hash.
5. Open **Counsel Pack** and download Markdown, Manifest JSON, and the simulated anchor receipt.

## Boundaries

- Not legal advice.
- No real KYC processing.
- No private keys or personal data should be entered.
- No real blockchain write in the first-stage MVP.
- AI output remains draft audit preparation and does not control deterministic risk scoring.
