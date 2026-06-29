# LexProof AuditOS Product Strategy

Last updated: 2026-06-29

## Executive View

LexProof AuditOS should be positioned as an AI-assisted legal and compliance audit preparation workspace for Web3 teams, not as an AI judge, legal decision-maker, or substitute counsel. The strongest product narrative for BLI Legal Tech Hackathon 2 is:

> Web3 teams need a repeatable way to turn launch facts, evidence, policy records, and AI-assisted issue spotting into a counsel-ready review packet before public release, fundraising, exchange listing, or protocol governance action.

The current app already has the right first-stage shape: custom project workspace, model-assisted audit drafting, jurisdiction-aware issue checklists, policy-control routing, editable evidence ledger, deterministic evidence manifest, and downloadable counsel pack. The next leap is to make it credible in a realistic professional workflow: deeper control libraries, collaboration, review approvals, document intake, and optional verifiable anchoring.

The product should keep the non-advice boundary everywhere. It creates audit preparation materials for lawyers and compliance teams. It does not provide legal advice, adjudicate disputes, validate securities status, perform KYC, or write real blockchain records in the first stage.

## Competition Reading

The target competition is BLI Legal Tech Hackathon 2 on DoraHacks:

- Official DoraHacks listing describes the event as the second year of Blockchain Legal Institute's global legal hackathon, with bounties and support from blockchain companies and law firms.
- Public DoraHacks metadata lists a 50,000 USD prize pool and a submission window beginning 2026-05-15.
- CompeteHub summarizes the event as virtual, open worldwide, ending 2026-11-01, with themes across blockchain, crypto, legal, finance, compliance, AI, RWA, RegTech, Web3, Bitcoin, and Ethereum.
- BLI's own hackathon page emphasizes law, finance, compliance, mentoring, bounties, collaboration, builder support, and clarity for international business.
- BLI's page also states that Blockchain Legal Institute is not a law firm and does not provide legal advice. LexProof should mirror that boundary.

Sources:

- https://dorahacks.io/hackathon/legal-hack-2026/detail
- https://dorahacks.io/hackathon/legal-hack-2026/qa
- https://bli.tools/hackathon/
- https://www.competehub.dev/en/competitions/dorahackslegal-hack-2026

## Product Fit Against Hackathon Themes

| Hackathon Signal | Current LexProof Fit | Gap To Strong Submission |
| --- | --- | --- |
| Legal tech | Counsel Pack, editable counsel questions, review statuses, and non-advice audit memo are aligned | Add signed approvals, collaboration, and deeper lawyer-review workflows |
| Compliance / RegTech | Risk flags, remediation queue, evidence ledger, jurisdiction packs, and policy-control routing are aligned | Expand the policy control library across more product scenarios and jurisdictions |
| AI | Controlled AI Review, mock reviewer, OpenAI-compatible model settings, redaction gate, and run ledger are aligned | Add enterprise proxy controls, admin policies, and richer document extraction |
| Blockchain / Web3 | Evidence manifest and SHA-256 bundle hash are aligned | Add optional verifiable anchor interface or simulated anchor receipt with clear boundary |
| Finance / RWA | Sample yield/private-credit workflow is aligned | Add richer token/RWA classification intake and disclosure evidence templates |
| Bitcoin / Ethereum | Current UI references Ethereum and blockchain use | Add chain-neutral anchor abstraction and examples for Ethereum, Bitcoin timestamping, or registry workflows |
| Mentorship / business growth | README and workflow explain hackathon use | Add pitch narrative, demo script, screenshots, and business model section |

## Current Product State

Implemented:

- Local-first React + TypeScript + Vite workbench.
- Custom Project Workspace with localStorage persistence.
- Audit Wizard for project facts and handoff readiness.
- AI Review with mock reviewer, OpenAI-compatible request adapter, model settings, evidence preview redaction, and missing evidence checklist.
- Redaction Gate before model calls with payload preview, KYC/personal-data warnings, and private-key-like blockers.
- AI Review Run Ledger with local payload/response hash receipts for completed model calls.
- Editable Counsel Questions queue that merges deterministic risk-rule prompts, AI draft questions, and manual user edits into Counsel Pack exports.
- Editable Counsel Review Status queue that maps deterministic risk flags to reviewer, status, evidence summary, and notes.
- Jurisdiction Checklist with core US, EU, and UK audit-prep prompts that avoid legal conclusions.
- Jurisdiction Packs with US, EU, UK, Singapore, Switzerland, UAE, and fallback local-counsel routing plus policy controls tied to active risk flags and evidence-ready status.
- Risk Audit from deterministic rules in `src/lib/auditEngine.ts`, with source-linked issue cards explaining why each flag triggered.
- Per-risk evidence workflow coverage in Risk Audit, backed by deterministic evidence requirements in `src/lib/riskEvidence.ts`.
- Missing evidence request workflow that turns Risk Audit requirements into `requested` Evidence Ledger items without treating them as verified evidence.
- Editable Evidence Ledger with owner, status, source, content fields, scenario evidence templates, and browser-side local file metadata hashing.
- Evidence Ledger polish for long evidence rows, visible edit labels, mobile-friendly field stacking, and wrapped SHA/source text.
- Evidence Templates for tokenized yield/RWA issuance, DAO governance/multisig execution, and AI legal/compliance workflows.
- Evidence Manifest with per-item hashes, local file metadata hashes, bundle hash, and JSON download in `src/lib/evidenceManifest.ts`.
- Simulated Anchor Receipt for manifest bundle hashes, clearly marked as not a real on-chain write.
- Counsel Pack Markdown generation, download, and browser Print / Save PDF handoff in `src/lib/counselPack.ts`.
- Screenshot-backed README and submission pack with pitch narrative, product screenshots, and demo path.
- Source references, remediation queue, and non-advice copy.
- Tests for core hashing, local file evidence metadata, missing evidence requests, validation, counsel-pack content, print/PDF handoff, download helpers, and UI workflow.

Current limitation:

The MVP proves workflow, not production readiness. It has controlled model-adapter boundaries, first-stage jurisdiction policy controls, local review statuses, and browser-side local file hashing, but it does not yet provide accounts, collaboration, secure backend evidence storage, real document parsing, signed approvals, a production-grade policy-control library, full KYC redaction, or verifiable chain anchoring.

## Expected End State

The expected mature product is a review operating system for legal/compliance readiness:

1. **Project Intake**
   - Structured onboarding for Web3 product facts.
   - Templates for token launches, DAO governance, RWA issuance, exchange/listing workflows, stablecoins, custody, NFT marketplaces, and AI/legal workflow products.
   - Explicit jurisdiction and user-exposure assumptions.

2. **Model-Assisted Audit Preparation**
   - User can connect OpenAI-compatible or enterprise model providers.
   - AI can extract facts, summarize evidence, detect missing documents, draft issue rationales, and suggest remediation tasks.
   - Model output is always marked as draft and requires human review.
   - Each completed model run should record provider/model metadata, payload hash, response hash, redaction status, and run time.
   - Raw KYC, private keys, and personal data are blocked or redacted before model calls.

3. **Deterministic Audit Engine**
   - Rules remain separate from model output.
   - Risk score is reproducible.
   - Every flag has a source, rationale, owner, and evidence dependency.
   - AI assists explanation, but the engine records what triggered the risk.

4. **Evidence Operating Layer**
   - Evidence ledger supports files, text notes, policy controls, review comments, approvals, and version history.
   - Evidence Manifest can be exported as JSON and Markdown.
   - Hashing is deterministic and stable.
   - Optional chain anchoring is explicit and privacy-preserving.

5. **Counsel / Compliance Handoff**
   - Counsel Pack is exportable as Markdown, browser-saved PDF, and shareable review link.
   - Pack includes project assumptions, risk flags, remediation queue, evidence manifest, open questions, and source pack.
   - Lawyers can mark issues reviewed, request more evidence, or override risk labels.

6. **Audit Trail And Governance**
   - Every meaningful change is recorded.
   - Human approvals are distinct from AI suggestions.
   - On-chain anchoring records only hashes or receipts, never raw evidence.

## Gaps From Current MVP

### Must-Have Before Final Hackathon Submission

No remaining must-have gaps are identified for the current Phase 1 submission-ready MVP. Continue improving strong differentiators before final recording.

### Strong Differentiators

- Deepen jurisdiction pack controls into more scenarios, product types, evidence patterns, and counsel-review workflows.

### Production-Grade Later

- Authentication and team workspaces.
- Role permissions for founder, counsel, compliance, engineer, investor reviewer.
- Secure evidence storage with upload controls, encryption, and access logs.
- Real document parsing and OCR.
- Real chain anchoring or timestamping integration.
- SOC2-style audit logs and data retention settings.

## Real-World Meaning

The realistic pain point is not “AI replaces lawyers.” The pain point is that early Web3 teams usually approach counsel with scattered facts:

- token terms in one document
- custody assumptions in chat
- KYC policy in a PDF
- governance receipt on-chain
- marketing claims in Notion
- investor questions in email
- AI-generated drafts with unclear source lineage

That creates expensive legal review, missed compliance issues, and weak audit trails. LexProof creates value by making the first handoff cleaner:

- founders know what facts matter
- counsel can see assumptions and missing evidence faster
- compliance teams can assign owners
- engineering can hash and version artifacts
- investors or hackathon judges can see a credible review process

The product is especially meaningful where legal/compliance work is high-context but repeatable: RWA pilots, tokenized private credit, DAO governance, custody disclosures, AI legal drafting tools, and protocol launch review.

## How A Real User Would Use It

1. Founder creates a project and selects a scenario template.
2. Founder enters product facts and adds synthetic-safe evidence summaries or browser-side local file hashes.
3. AI Review extracts structured facts and highlights missing evidence.
4. Risk Audit produces deterministic flags, remediation owners, and missing evidence request actions.
5. Founder or compliance lead turns missing requirements into requested Evidence Ledger items.
6. Counsel reviews flags, updates review statuses, asks for evidence, and edits assumptions.
7. Engineering hashes evidence and creates a manifest.
8. Compliance exports a Counsel Pack for review meeting or investor diligence.
9. Optional anchor records a manifest hash after legal/privacy review.

## AI Model Access Plan

The platform lets users connect models only through a controlled workflow.

Recommended architecture:

- `src/lib/modelProvider.ts` keeps provider config, OpenAI-compatible request construction, and deterministic mock provider behavior.
- `src/lib/modelReviewLedger.ts` creates local model-run receipts with payload and response SHA-256 hashes and JSON export without credentials.
- `src/lib/aiReview.ts` builds prompt payloads from project facts and evidence summaries, parses structured JSON output, and validates suggestions before UI display.
- `src/components/ModelSettingsPanel.tsx` exposes provider, base URL, model name, and API key inputs with local-only key handling in the first stage.
- `src/components/AIReviewPanel.tsx` runs AI Review and shows extracted facts, missing evidence, draft questions, suggested remediation, redaction status, and run receipts.

Rules:

- Do not auto-send raw evidence.
- Do not send raw KYC, private keys, or personal data.
- Show a review payload before model call.
- Mark all model output as AI-assisted draft.
- Keep deterministic audit scoring separate from model response.
- Store model-run receipts as hashes and metadata, not raw API keys.

## Product Roadmap

### Phase 1: Submission-Ready MVP

- Current workspace features.
- AI Review with mock/OpenAI-compatible provider.
- Redaction Gate before model calls.
- AI Review Run Ledger with payload/response hash receipts.
- Editable AI/rule-generated counsel questions in Counsel Pack.
- Editable counsel review statuses in Counsel Pack.
- Manifest JSON export.
- Browser Print / Save PDF export for Counsel Pack.
- Simulated anchor receipt export.
- First-stage US/EU/UK jurisdiction checklist.
- Jurisdiction packs for US, EU, UK, Singapore, Switzerland, UAE, and fallback local-counsel intake with first-stage policy controls and evidence-ready status.
- Source-linked Risk Audit issue cards.
- Evidence templates for tokenized yield/RWA, DAO governance/multisig, and AI compliance workflows.
- Per-risk evidence workflow coverage in Risk Audit.
- Missing evidence request workflow from Risk Audit into Evidence Ledger.
- Long evidence row and mobile editing polish.
- Better demo dataset and pitch docs.
- Screenshot-backed README section.
- Screenshot-backed submission pack.

### Phase 2: Credible Professional Prototype

- Branded PDF templates and backend-rendered PDF export beyond browser Print / Save PDF.
- Secure document intake, parsing, and OCR beyond metadata-only local file hashing.
- User-editable AI counsel questions.
- Deeper jurisdiction pack content libraries for scenario-specific controls, approvals, and counsel-review workflows.

### Phase 3: Real Compliance Workspace

- Accounts and teams.
- Role-based permissions.
- Secure evidence storage.
- Review comments and approvals.
- Optional verified timestamp or chain anchor.
- Matter/workspace integrations.

## Strategic Recommendation

For the hackathon, do not broaden into a generic legal chatbot. The best path is to deepen the audit workflow:

1. Make the demo prove a complete journey from project facts to counsel-ready packet.
2. Add AI only where it improves audit preparation: extraction, missing evidence, draft questions, summary.
3. Keep deterministic hashes, source lineage, and human review as the trust layer.
4. Make the non-advice boundary part of the product's credibility, not a footnote.

This gives LexProof a sharper identity: a legal/compliance readiness operating system for Web3 launches, with AI as a controlled assistant and evidence integrity as the differentiator.
