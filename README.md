# LexProof AuditOS

LexProof AuditOS is a legal and compliance audit MVP for **BLI Legal Tech Hackathon 2** on DoraHacks. It helps Web3 teams turn messy launch facts into a counsel-ready audit workspace with risk flags, remediation owners, editable evidence records, deterministic manifest hashes, source references, and downloadable Markdown counsel packs.

This project is not legal advice. It is an audit preparation workflow for lawyers, compliance teams, and builders.

## Operating Docs

Start future agent or contributor work from [docs/constraints-index.md](docs/constraints-index.md). It points to the complete build universe, architecture guardrails, workflow/test rules, and clean repository handoff contract.

- [docs/work-universe.md](docs/work-universe.md) is the complete product, frontend, backend, data, security, integration, and demo work inventory.
- [docs/architecture-guardrails.md](docs/architecture-guardrails.md) and [ARCHITECTURE.md](ARCHITECTURE.md) define where new functionality belongs so the app does not drift.
- [docs/engineering-workflow.md](docs/engineering-workflow.md) and [WORKFLOW.md](WORKFLOW.md) define test launch recipes, screenshot policy, staging rules, and direct-to-main hygiene.
- [docs/project-governance.md](docs/project-governance.md) resolves conflicts between scope, architecture, verification, privacy, and Not legal advice boundaries.

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

- Custom Project Workspace for creating a local audit project from zero, loading synthetic samples, or launching a judge-ready Demo Scenario Library path.
- Step-by-step Audit Wizard for reviewing facts, AI/data/chain boundaries, and handoff readiness.
- Model Intake for registering provider/model purpose, allowed data classes, human-review owner, editable hashed AI event review records, and downloadable Model Intake JSON.
- AI Review with mock and OpenAI-compatible model settings, Model Access Workflow, Model Connection Readiness, audit-prep extraction, draft questions, and missing evidence suggestions.
- Redaction Gate before model calls, with evidence payload previews, KYC/personal-data warnings, and blocker handling for private-key-like material.
- Shared data classification and redaction rules for private keys, API keys, raw KYC, wallet-address identifiers, personal-data references, and confidentiality labels across Model Connect settings metadata, Export Safety Gate, and Evidence Vault metadata checks.
- Export Safety Gate before Counsel Pack handoff, with data-boundary findings for private keys, API keys, raw KYC, wallet-address identifiers, personal-data references, and confidentiality labels.
- AI Review Run Ledger with local payload and response hashes for each completed model review.
- Server Model Gateway provider policy API, secret policy evaluation API, workbench refresh flow, receipts, automatic Human Review queueing for completed gateway output, Model Gateway Evaluation artifacts, and Audit Log Export artifacts with payload hash, response hash, source evidence hash, provider/secret policy metadata, human-review status, retry/error state, audit actions, before/after hashes, and remediation steps without returning raw payloads or credentials.
- Security Review Checklist for model provider, evidence storage, and anchor integration readiness before real external adapters, object storage, or chain writes are enabled.
- Integration Readiness Registry for server model providers, object storage, chain anchors, document parser/OCR, and GRC ticket export adapters with ready, needs-policy, blocked, and disabled states before any real external integration is enabled.
- Integration Enablement Dossier inside Integration Readiness, with one downloadable metadata-only JSON artifact that consolidates adapter readiness, provider/secret/storage/parser/chain/GRC policy reports, blockers, next actions, a stable dossier hash, and `externalEnablementAllowed: false`.
- Object Storage Policy Evaluation inside Integration Readiness, with server sync through `POST /api/integrations/object-storage/policy`, retention/manifest/access controls, metadata-only JSON export, and `externalObjectStorageAllowed: false` even when the policy evaluates ready.
- Document Parser Policy Evaluation inside Integration Readiness, with server sync through `POST /api/integrations/document-parser/policy`, metadata-only parser purpose, redaction, no-training, access logging, retention, deletion, no-sensitive-material, and human-review controls, JSON export, and `externalDocumentParsingAllowed: false` even when the policy evaluates ready.
- Chain Anchor Policy Evaluation inside Integration Readiness, with server sync through `POST /api/integrations/chain-anchor/policy`, metadata-only manifest/counsel-version/signing-policy controls, JSON export, and `externalChainAnchoringAllowed: false` plus `anchorMode: simulated-only` even when the policy evaluates ready.
- GRC Destination Policy Evaluation inside Integration Readiness, with server sync through `POST /api/integrations/grc-destination/policy`, metadata-only destination mapping, authentication, export redaction, ticket ownership, retry/audit logging, and human-review controls, JSON export, and `externalGrcTicketCreationAllowed: false` even when the policy evaluates ready.
- Integration Policy Evaluation Receipts for server-evaluated object storage, document parser, chain anchor, and GRC destination policy reports, persisted by workspace with report/context/policy hashes, audit-log entries, and an explicit metadata-only Not legal advice boundary.
- GRC Ticket Export from Risk Audit for metadata-only remediation tickets, gated by Integration Readiness and downloadable as JSON without creating real external tickets.
- Human Review queue with reviewer assignment, due dates, saved status history, source clause-match refresh actions, saved Counsel Pack version handoff review, linked evidence and model-run status updates, server-side queue views by target/status/reviewer, and downloadable review timeline JSON with audit log IDs.
- Editable Counsel Questions queue that combines deterministic risk prompts, AI draft questions, user edits, status, and priority.
- Editable Counsel Review Status queue for each deterministic risk flag, with reviewer, status, evidence summary, and notes.
- Regulatory Command Center first screen with a Workspace Cockpit Handoff JSON, Workspace Journey rail, Workspace Action Queue, Regulatory Control Matrix, Jurisdiction Evidence Map, Jurisdiction Readiness Digest, Source Freshness Board, Local Counsel Routing Plan, jurisdiction readiness, source-backed clause triggers, Source Review Ledger metadata, Source Update Approval Queue, evidence gaps, manifest readiness, and counsel handoff status.
- Regulatory Source Graph for official-source audit-prep triggers across US SEC/CFTC, US SEC Regulation D accredited-investor review, US OFAC virtual-currency sanctions guidance, US FinCEN CVC/MSB and BSA transfer-recordkeeping review, US GENIUS Act payment stablecoin issuer review, US SEC DAO Report, US CFTC Ooki DAO / DeFi derivatives-platform review, US FTC advertising/endorsement guides, EU MiCA Title II, ART/EMT stablecoin issuer review, Article 75 CASP custody, and marketing communications, EU DORA ICT operational resilience, EU TFR crypto-asset transfer information review, EU DLT Pilot Regime market-infrastructure review, EU AI Act, UK FCA qualifying stablecoin issuer review, UK FCA financial promotions, UK FCA cryptoasset AML/MLR registration and Travel Rule guidance, UK Law Commission DAO scoping, UK ICO AI data protection guidance, Singapore MAS PSN02 and PS-G03 DPT customer-asset safeguards, Hong Kong SFC VATP custody, Hong Kong HKMA stablecoin issuer regime, Japan FSA crypto-asset custody/user-protection guidance, Canada CSA CTP PRU custody/investor-protection guidance, Australia ASIC digital-asset financial-services and AUSTRAC VASP AML/CTF guidance, South Korea FSC Virtual Asset User Protection Act / Enforcement Decree and KoFIU VASP reporting / AML guidance, India FIU-IND / Ministry of Finance PMLA VDA AML/CFT guidance, German BaFin/MiCAR CASP custody review, Swiss FINMA ICO and stablecoin guidance, UAE VARA activity scope / compliance / 2024 marketing regulations, Brazil Banco Central, and Brazil CVM references, including effective dates, source review dates, and reviewer notes.
- Downloadable metadata-only Regulatory Source Pack JSON from Counsel Pack with matched clauses, evidence gaps, source freshness, counsel questions, local counsel routes, and a stable pack hash.
- Downloadable metadata-only Source Review Packet JSON from the command center with source refresh actions, clause-match targets, packet hash, and Not legal advice boundary.
- Downloadable metadata-only Source Freshness Board JSON from the command center with source review lanes, overdue/due-soon counts, next actions, board hash, and Not legal advice boundary.
- Server-syncable metadata-only Source Review Ledger from the command center through `POST /api/workspaces/:workspaceId/source-reviews`, with stable ledger hash, audit-log metadata, and `matchingBehaviorChanged: false`.
- Downloadable and server-syncable metadata-only Source Update Approval Queue from the command center with review-due source approvals, metadata gates, `POST /api/workspaces/:workspaceId/source-approvals`, audit-log metadata, and a boundary that source updates cannot affect matching until counsel or compliance review records refreshed source metadata.
- Downloadable metadata-only Regulatory Control Matrix JSON from the command center with source-review status, evidence coverage, local counsel routes, next actions, and Not legal advice boundary.
- Downloadable metadata-only Jurisdiction Evidence Map JSON from the command center with per-jurisdiction open evidence requests, topic coverage, local counsel roles, map hash, and Not legal advice boundary.
- Downloadable metadata-only Jurisdiction Readiness Digest JSON from the command center with per-jurisdiction handoff status, evidence blockers, source freshness blockers, local counsel routes, digest hash, and Not legal advice boundary.
- Downloadable metadata-only Local Counsel Routing Plan JSON from the command center with jurisdiction/counsel-role routes, route priority, evidence gaps, source-review status, plan hash, and Not legal advice boundary.
- Jurisdiction Checklist for core US, EU, and UK audit-prep prompts without legal conclusions.
- Jurisdiction Packs with policy controls, evidence-ready status, and local-counsel routing for US, EU, UK, Singapore, Hong Kong, Japan, Canada, Australia, South Korea, India, Germany, Switzerland, UAE, Brazil, and fallback jurisdictions.
- Weighted legal/compliance risk audit with explicit flags, owner assignments, source links, “why this flag triggered” issue cards, per-risk evidence workflow coverage, and one-click missing evidence requests.
- Editable Evidence Ledger with empty-state Evidence Intake Guidance, `draft/requested/received/under-review/verified/rejected` evidence status, owner, source notes, local file SHA-256 metadata intake, visible edit labels, long-row wrapping, item hashes, manifest bundle hash, and local evidence change trail.
- Evidence Retention Readiness panel that classifies metadata-only evidence, personal-data review needs, and vault-sync blockers for private-key-like material, API keys, and raw KYC references with metadata-only retention policy JSON plus a hashed remediation queue JSON export.
- Evidence Recertification Queue that flags stale or expiring reliance-ready evidence from metadata timestamps, prioritizes source-linked controls, lets a reviewer mark evidence recertified, and downloads a metadata-only hashed queue. Not legal advice.
- Evidence Vault versioning with duplicate-hash detection, rejected-record replacement, parent/superseded lineage, replacement reasons, linked regulatory control IDs, server-side persisted metadata manifests, downloadable Evidence Vault Lineage Digest JSON, server-enforced status transitions, local `under-review/rejected` ledger sync, and metadata-only recovery actions.
- Evidence Templates for tokenized yield/RWA issuance, DAO governance/multisig execution, and AI legal/compliance workflows.
- Evidence Manifest generator with deterministic SHA-256 item hashes, bundle hash, and JSON download.
- Simulated Anchor Receipt for the manifest bundle hash. It is explicitly not a real on-chain write.
- Counsel Pack Markdown download and browser Print / Save PDF handoff with non-advice disclaimer, project facts, risk posture, regulatory source graph, Source Review Ledger freshness metadata, Source Freshness Board hash/lanes, Local Counsel Routing Plan hash/routes, Source Update Approval Queue gates, editable counsel questions, counsel review statuses, manifest hash, source pack, and remediation queue.
- Counsel Pack export templates for launch readiness, RWA/tokenized asset review, AI governance review, custody controls, and marketing claims, with template-specific review agendas and evidence focus in the Markdown packet.
- Counsel Pack version history with manifest hash, Markdown hash, source snapshot, Regulatory Source Pack hash, source review status, review status summary, diff from the previous export, and metadata-only JSON download.
- Server-side Counsel Pack export records through the Phase 2 API, storing export hashes, version metadata, review summary, source count, Regulatory Source Pack hash, source review status, and audit-log entries without raw Markdown, KYC, personal data, or credentials. Blocked data-boundary findings disable Markdown/PDF, manifest JSON, simulated anchor, version save, and server export actions until remediated.
- Counsel Handoff Checklist in Counsel Pack, with a stable checklist hash, export safety status, evidence manifest/source pack/submission pack readiness, evidence recertification status, Evidence Vault lineage readiness, review status, saved version state, server export-record state, and downloadable metadata-only JSON. Not legal advice.
- Submission fit scorecard for BLI themes and required DoraHacks assets.
- Submission Pack JSON from Sources with pack hash, manifest hash, Regulatory Source Pack hash, Demo Runbook hash, export safety summary, demo readiness, required submission assets, hackathon theme mapping, known limitations, and Not legal advice boundary.
- Demo Smoke Checklist JSON and `npm run demo:smoke` CLI preflight from Judge Demo Readiness, plus Demo Runbook JSON from Judge Demo Readiness and Sources with clean-clone commands, scenario paths, screenshot references, API preflight status, limitations, and a stable runbook hash for hackathon judges. Not legal advice.
- Export Safety Inventory in Sources with a stable inventory hash, artifact readiness, Demo Runbook JSON, Source Freshness Board hash/status, data-boundary blockers, metadata-only JSON download, and an explicit handoff allowed/blocked status before counsel or judge artifacts leave the workspace.
- Judge Handoff Bundle JSON from Sources that consolidates Submission Pack, Demo Runbook, Export Safety Inventory, and Counsel Handoff Checklist hashes/statuses into one metadata-only judge packet with a stable bundle hash and Not legal advice boundary.
- Responsive React workbench with tabs for Audit Wizard, AI Review, Model Intake, Jurisdiction Checklist, Risk Audit, Evidence Ledger, Counsel Pack, and Sources.

## Product Screenshots

The Demo Scenario Library turns seeded synthetic profiles into runnable judging paths with expected artifacts and Not legal advice boundaries, including RWA launch with NYDFS BitLicense/custody review, DAO review, public-source review, AI legal workflow review, Brazil VASP source review, Swiss FINMA stablecoin review, US GENIUS Act stablecoin review, EU MiCA ART/EMT stablecoin review, UK qualifying stablecoin issuer review, Singapore DPT custody review, Hong Kong VATP custody review, Hong Kong HKMA stablecoin issuer review, Japan crypto custody review, Canada CTP custody review, Australia digital asset review, Korea VASP user protection review, India VDA PMLA review, UK cryptoasset AML review, Germany MiCAR custody review, and marketing claims review paths.

![Demo Scenario Library](docs/assets/screenshots/demo-scenario-library-ai-workflow.png)

![Demo Scenario Library Brazil VASP path](docs/assets/screenshots/demo-scenario-library-brazil-vasp.png)

![NYDFS RWA source control](docs/assets/screenshots/nydfs-rwa-source-control.png)

![US GENIUS Act stablecoin source graph](docs/assets/screenshots/us-genius-stablecoin-source-graph.png)

![EU MiCA ART/EMT stablecoin source graph](docs/assets/screenshots/eu-mica-stablecoin-issuer-source-graph.png)

![UK qualifying stablecoin issuer source graph](docs/assets/screenshots/uk-stablecoin-issuer-source-graph.png)

![Demo Scenario Library marketing claims path](docs/assets/screenshots/demo-scenario-library-marketing-claims.png)

Judge Demo Readiness keeps the clean-clone path visible on the first screen: required commands, the `npm run demo:smoke` CLI preflight, a downloadable Demo Smoke Checklist JSON, validated synthetic scenarios, no private credentials, current screenshot set, a Phase 2 API preflight covering `/api/health` plus safe GET route families, and a downloadable Demo Runbook JSON with a stable runbook hash. Not legal advice.

![Judge Demo Readiness](docs/assets/screenshots/judge-demo-readiness.png)

![Demo Smoke Checklist](docs/assets/screenshots/demo-smoke-checklist.png)

![Demo Runbook JSON](docs/assets/screenshots/demo-runbook-json.png)

Risk Audit explains deterministic trigger facts and links source context for counsel review.

The Regulatory Command Center turns project facts into a first-screen Workspace Cockpit, Workspace Journey, Workspace Action Queue, source-backed jurisdiction triggers, source review freshness, source update approval gates, evidence gaps, and local counsel handoff status without making legal conclusions. The Workspace Cockpit Handoff JSON exports the cockpit status, facts, journey steps, action queue, manifest/export state, and a stable handoff hash as metadata-only audit preparation material. The Workspace Journey shows the audit-prep path from project facts through model/evidence intake, risk/source graph, human review, vault/manifest, and counsel export with a next-action button. Source gap actions now focus the Source Evidence Gap Triage panel directly so users can request the missing metadata-only evidence without hunting through tabs.

![Regulatory Command Center](docs/assets/screenshots/regulatory-command-center.png)

![Workspace Cockpit Handoff](docs/assets/screenshots/workspace-cockpit-handoff.png)

![Workspace Journey](docs/assets/screenshots/workspace-journey.png)

The Local Counsel Routing Plan turns matched source clauses into jurisdiction + counsel-role work queues with priority, evidence gaps, source-review state, and a stable plan hash. It is metadata-only audit preparation material, not legal advice.

![Local Counsel Routing Plan](docs/assets/screenshots/local-counsel-routing-plan.png)

The DAO proposal scenario routes `ClauseGuard DAO` into US SEC DAO Report, US CFTC Ooki DAO / DeFi derivatives-platform, and UK Law Commission DAO scoping source controls for governance-token, participant-role, voting, signer, derivatives-platform boundary, FCM/BSA/CIP assumptions, and asset-control evidence review. Not legal advice.

![DAO governance source graph](docs/assets/screenshots/dao-governance-source-graph.png)

The AI legal workflow scenario now routes `LexAssist Evidence Desk` into US NIST AI RMF / NIST AI 600-1 Generative AI Profile, EU AI Act, and UK ICO AI data protection source controls, with evidence gaps for govern/map/measure/manage evidence, GenAI output provenance, human oversight, source lineage, redaction, and reviewer decision logs. Not legal advice.

![AI workflow regulatory source controls](docs/assets/screenshots/ai-workflow-regulatory-source-controls.png)

![US NIST AI workflow source graph](docs/assets/screenshots/us-nist-ai-workflow-source-graph.png)

The RWA path now routes tokenized private-credit facts into US Regulation D accredited-investor and offering-evidence review triggers, US OFAC virtual-currency sanctions screening and blocked-property escalation review triggers, US FinCEN CVC/MSB and BSA transfer-recordkeeping review triggers, EU DLT Pilot Regime market-infrastructure perimeter review, and EU projects with platform wallet custody into MiCA Article 75 custody, DORA ICT operational-resilience, and TFR crypto-asset transfer-information review triggers. These add investor eligibility, solicitation-control, wallet sanctions screening, blocked-property reporting, CVC business-model and AML-program handoff, US and EU Travel Rule transfer-recordkeeping handoff, DLT financial-instrument and DLT MTF/TSS/SS perimeter evidence, competent-authority/ESMA handoff metadata, settlement, safekeeping, liability-safeguard evidence, CASP custody policy, client crypto-asset safeguarding, ICT risk-management, incident-response, testing, and ICT third-party service register evidence gaps without making legal conclusions. Not legal advice.

![US Regulation D RWA source control](docs/assets/screenshots/us-reg-d-rwa-source-control.png)

![US OFAC virtual-currency sanctions source control](docs/assets/screenshots/us-ofac-rwa-source-control.png)

![US FinCEN CVC/MSB and BSA transfer source control](docs/assets/screenshots/us-fincen-rwa-source-control.png)

![EU MiCA CASP custody source graph](docs/assets/screenshots/eu-mica-casp-custody-source-graph.png)

![EU DORA RWA source control](docs/assets/screenshots/eu-dora-rwa-source-control.png)

![EU TFR Travel Rule RWA source control](docs/assets/screenshots/eu-tfr-rwa-source-control.png)

![EU DLT Pilot Regime RWA source control](docs/assets/screenshots/eu-dlt-pilot-rwa-source-control.png)

Brazil projects now route to Banco Central virtual asset service and CVM crypto-asset securities source controls, with evidence gaps for authorization, AML/CFT, classification, disclosure, and investor communication. Not legal advice.

![Brazil regulatory source graph](docs/assets/screenshots/regulatory-command-center-brazil-source-graph.png)

Swiss stablecoin projects now route to FINMA ICO token-classification guidance and FINMA Guidance 06/2024 on stablecoins, with evidence gaps for payment/utility/asset/hybrid token assumptions, offering/prospectus intake, holder redemption claims, reserve assets, bank guarantees, banking-law and collective-investment perimeter assumptions, AML, sanctions, holder identification, transfer risk, and local-counsel handoff. Not legal advice.

![Swiss FINMA stablecoin source graph](docs/assets/screenshots/swiss-finma-stablecoin-source-graph.png)

US payment stablecoin issuer projects now route to GENIUS Act source controls and Treasury/OCC implementation materials, with evidence gaps for permitted-issuer route, state or federal oversight, reserve assets, redemption, monthly disclosure, custody, insolvency-priority evidence, BSA/AML, sanctions, transaction monitoring, and no-raw-KYC handoff. Not legal advice.

![US GENIUS Act stablecoin source graph](docs/assets/screenshots/us-genius-stablecoin-source-graph.png)

EU MiCA stablecoin issuer projects now route to ART/EMT source controls from EBA and ESMA MiCA materials, with evidence gaps for token classification, issuer authorisation or notification route, home Member State, competent-authority handoff, white paper, reserve composition, reserve custody, redemption, recovery plan, redemption plan, and no-raw-customer-record handoff. Not legal advice.

![EU MiCA ART/EMT stablecoin source graph](docs/assets/screenshots/eu-mica-stablecoin-issuer-source-graph.png)

UK qualifying stablecoin issuer projects now route to FCA PS26/10 and BoE/FCA joint-approach source controls, with evidence gaps for UKQS issuer route, regulated activity assumptions, admission or distribution scope, disclosures, backing assets, safeguarding, reconciliation, redemption, liquidity, recordkeeping, systemic-transition handoff, and no-raw-customer-record evidence. Not legal advice.

![UK qualifying stablecoin issuer source graph](docs/assets/screenshots/uk-stablecoin-issuer-source-graph.png)

Singapore DPT custody projects now route to MAS PS-G03 customer-asset safeguard controls, with evidence gaps for segregation, custody disclosure, reconciliation, transfer controls, and local-counsel handoff. Not legal advice.

![Singapore DPT custody source graph](docs/assets/screenshots/singapore-dpt-custody-source-graph.png)

Hong Kong VATP custody projects now route to SFC VATP client-asset custody controls, with evidence gaps for associated-entity trust holding, wallet segregation, reconciliation, cold-storage/key-control, monitoring, compensation arrangements, and local-counsel handoff. Not legal advice.

![Hong Kong VATP custody source graph](docs/assets/screenshots/hong-kong-vatp-source-graph.png)

Hong Kong stablecoin issuer projects now route to HKMA Stablecoins Ordinance source controls, with evidence gaps for licence/application scope, regulated stablecoin activity, reserve assets, full backing, redemption, attestation, AML/CFT, recordkeeping, user-protection, and local-counsel handoff. Not legal advice.

![Hong Kong HKMA stablecoin issuer source graph](docs/assets/screenshots/hong-kong-stablecoin-source-graph.png)

Japan crypto custody projects now route to FSA crypto-asset exchange supervision and user-asset protection controls, with evidence gaps for registration assumptions, user-asset protection, information to users, cold-wallet/offline management, reconciliation, leakage response, and local-counsel handoff. Not legal advice.

![Japan crypto custody source graph](docs/assets/screenshots/japan-crypto-custody-source-graph.png)

Canada CTP custody projects now route to CSA Staff Notice 21-332 / 21-329 controls, with evidence gaps for registration and PRU assumptions, Canadian client access, no leverage, VRCA consent, client-asset custody and segregation, acceptable third-party custodian assurance, no re-hypothecation, insurance or alternative risk mitigation, and local-counsel handoff. Not legal advice.

![Canada CTP custody source graph](docs/assets/screenshots/canada-ctp-custody-source-graph.png)

Australia digital asset projects now route to ASIC INFO 225, ASIC RG 133, and AUSTRAC virtual asset service guidance, with evidence gaps for digital-asset financial-services scope, AFS licensing handoff, dealing/market-making/custodial-service assumptions, crypto custody controls, VASP AML/CTF programs, CDD, travel rule, reporting, seven-year recordkeeping, and local-counsel handoff. Not legal advice.

![Australia digital asset source graph](docs/assets/screenshots/australia-digital-asset-source-graph.png)

Korea VASP user protection projects now route to FSC Virtual Asset User Protection Act / Enforcement Decree and KoFIU VASP reporting / AML guidance, with evidence gaps for user deposits at banks, user virtual-asset segregation, 80 percent cold-wallet handling, insurance/reserve, abnormal trading monitoring/reporting, user disclosure, CDD/EDD, STR, Travel Rule, real-name account, ISMS, and local-counsel handoff. Not legal advice.

![Korea VASP user protection source graph](docs/assets/screenshots/korea-vasp-user-protection-source-graph.png)

India VDA projects now route to the Ministry of Finance PMLA VDA notification and FIU-IND AML/CFT guidance, with evidence gaps for VDA activity scope, FIU-IND Reporting Entity registration, AML/CFT/CPF program, Designated Director / Principal Officer, CDD/EDD, beneficial ownership, STR/monthly reporting, transaction monitoring, risk assessment, Travel Rule, record retention, FINGate/reporting-format handoff, and local-counsel review. Not legal advice.

![India VDA PMLA source graph](docs/assets/screenshots/india-vda-pmla-source-graph.png)

UK cryptoasset AML projects now route to FCA AML/CTF regime, MLR registration expectations, and Travel Rule expectations, with evidence gaps for cryptoasset exchange/custodian-wallet activity scope, FCA MLR registration, business plan, ownership/control, MLRO, BWRA/CRA, AML/CTF/CPF framework, CDD/EDD, sanctions, blockchain analytics, transaction monitoring, SAR escalation, Travel Rule originator/beneficiary data flow, record retrieval, and local-counsel handoff. Not legal advice.

![UK cryptoasset AML source graph](docs/assets/screenshots/uk-cryptoasset-aml-source-graph.png)

Germany MiCAR custody projects now route to BaFin/MiCAR CASP service-scope, Article 60 notification or Article 62 authorisation assumptions, Article 75 custody safeguarding, client-position records, segregation, return-process, means-of-access handling, private-key exclusion, and German local-counsel handoff evidence gaps. Not legal advice.

![Germany MiCAR custody source graph](docs/assets/screenshots/germany-micar-custody-source-graph.png)

UAE VARA operating projects now route to the VARA Virtual Assets and Related Activities Regulations 2023 and VARA Compliance and Risk Management Rulebook, with evidence gaps for virtual-asset activity scope, licensing assumptions, compliance management, AML/CFT, books and records, audit, client virtual asset custody, proof-of-reserves, reconciliation, and UAE local-counsel handoff. The separate VARA 2024 marketing controls now require marketing-specific trigger facts so operating/custody reviews do not inherit promotion-only gaps. Not legal advice.

![UAE VARA operating source graph](docs/assets/screenshots/uae-vara-operating-source-graph.png)

The marketing claims scenario routes `SignalBridge Marketing Review` into US FTC endorsement/advertising, EU MiCA marketing communications, UK FCA financial-promotion, and UAE VARA 2024 Marketing Regulations controls, including communication labels, white-paper consistency, home/host Member State audience routing, promotion approval, risk-warning, KOL/incentive, and recordkeeping evidence gaps. Not legal advice.

![Marketing claims source graph](docs/assets/screenshots/demo-scenario-library-marketing-claims.png)

![UAE VARA 2024 marketing source graph](docs/assets/screenshots/uae-vara-marketing-source-graph.png)

![EU MiCA marketing communications source graph](docs/assets/screenshots/eu-mica-marketing-source-graph.png)

![Marketing Claims Counsel Pack template](docs/assets/screenshots/counsel-pack-marketing-claims-template.png)

![Workspace Action Queue](docs/assets/screenshots/workspace-action-queue.png)

![Workspace action source gap focus](docs/assets/screenshots/workspace-action-source-gap-focus.png)

![Regulatory Control Matrix](docs/assets/screenshots/regulatory-control-matrix.png)

The Jurisdiction Evidence Map groups the control matrix by jurisdiction so reviewers can see open evidence requests, source topics, local counsel routes, and a stable map hash without turning those signals into legal conclusions. Not legal advice.

![Jurisdiction Evidence Map](docs/assets/screenshots/jurisdiction-evidence-map.png)

The Jurisdiction Readiness Digest condenses jurisdiction evidence, source freshness, and local counsel routing into a per-jurisdiction handoff summary with a digest hash, blockers, and next actions. Not legal advice.

![Jurisdiction Readiness Digest](docs/assets/screenshots/jurisdiction-readiness-digest.png)

The Source Freshness Board turns Source Review Ledger dates into an operating board for metadata-missing, overdue, due-soon, and scheduled source reviews. It is scheduling metadata for audit preparation, not legal advice.

![Source Freshness Board](docs/assets/screenshots/source-freshness-board.png)

![Regulatory Source Review Ledger](docs/assets/screenshots/regulatory-source-review-ledger.png)

![Source Update Approval Queue](docs/assets/screenshots/source-update-approval-queue.png)

The Source Update Approval Queue can sync metadata-only approval records to the Phase 2 API and refresh persisted records back into the command center through `GET /api/workspaces/:workspaceId/source-approvals`. Matching behavior stays unchanged until counsel or compliance review records refreshed source metadata. Not legal advice.

![Source Approval persisted record refresh](docs/assets/screenshots/source-approval-record-refresh.png)

![Source Approval API Sync](docs/assets/screenshots/source-approval-api-sync.png)

![Risk Audit with source-linked issue cards](docs/assets/screenshots/risk-audit-source-links.jpg)

AI Review keeps model output as draft audit preparation, shows a Model Access Workflow for setup/run/human-review status, and records local run receipts with payload and response hashes.

![AI Review Model Access Workflow](docs/assets/screenshots/model-access-workflow.png)

![AI Review Model Connection Readiness](docs/assets/screenshots/ai-review-connection-readiness.png)

![AI Review Run Ledger with payload and response hashes](docs/assets/screenshots/ai-review-run-ledger.jpg)

Model Intake records provider purpose, human review readiness, AI event hashes, and standalone JSON export.

![Model Intake JSON export](docs/assets/screenshots/model-intake-json-export.png)

Evidence Ledger records local evidence creation, template application, source-gap requests, duplicate-safe request refreshes, edits, and removals as audit-prep events with a standalone JSON export. When a new project has no evidence, Evidence Intake Guidance recommends the safest next template and concrete metadata-only requests from the current risk coverage. Not legal advice.

![Evidence Audit Trail](docs/assets/screenshots/evidence-audit-trail.png)

![Evidence Intake Guidance](docs/assets/screenshots/evidence-intake-guidance.png)

Source Evidence Gap Triage can request metadata-only Evidence Ledger items from the command center. Requests are keyed by source-gap metadata, so reopening the same source gap returns to the existing Ledger request instead of creating duplicate evidence rows. Not legal advice.

![Source gap idempotent Evidence Ledger request](docs/assets/screenshots/source-gap-idempotent-request.png)

Evidence Retention Readiness blocks Evidence Vault sync when evidence contains private-key-like material, API-key-like credentials, or raw KYC references, then builds a hashed Evidence Retention Remediation Queue with P0/P1/P2 actions and JSON export. Not legal advice.

![Evidence Retention Readiness](docs/assets/screenshots/evidence-retention-readiness.png)

![Evidence Retention Remediation Queue](docs/assets/screenshots/evidence-retention-remediation-queue.png)

Evidence Recertification Queue flags stale source-linked metadata before counsel/export reliance. Load `SignalBridge Marketing Review`, confirm the first-screen **Workspace Action Queue** routes stale `Claims inventory` to Evidence Ledger, and refresh the evidence to clear the queue. Not legal advice.

![Workspace Action Queue recertification route](docs/assets/screenshots/workspace-action-recertification.png)

![Evidence Recertification Queue](docs/assets/screenshots/evidence-recertification-queue.png)

Security Review Checklist turns Model Connect, retention, Export Safety Gate, manifest, and anchor state into real integration gates for model providers, evidence storage, and anchoring. Not legal advice.

![Security Review Checklist](docs/assets/screenshots/security-review-checklist.png)

Integration Readiness Registry maps those gates into adapter-level status for model providers, object storage, chain anchoring, OCR, and GRC ticket export without enabling external calls, raw uploads, or chain transactions. Empty evidence workspaces now keep chain anchoring blocked until at least one metadata-only evidence item exists, even if a local manifest hash can be calculated. Not legal advice.

![Integration Readiness Registry](docs/assets/screenshots/integration-readiness-registry.png)

![Empty evidence Chain Anchor blocked state](docs/assets/screenshots/empty-evidence-chain-anchor-blocked.png)

Integration Enablement Dossier consolidates the registry plus model provider, secret handling, object storage, document parser, chain anchor, and GRC destination policy reports into one hashed JSON handoff. It remains metadata-only and keeps all external adapters disabled until a separate enablement review. Not legal advice.

![Integration Enablement Dossier](docs/assets/screenshots/integration-enablement-dossier.png)

Policy Evaluation Receipts show the latest server-side integration policy evaluations for the workspace, including policy ID, control readiness, report hash, context hash, and disabled external capability state. The workbench can refresh persisted receipts from `GET /api/workspaces/:workspaceId/integration-policy-evaluations` after a reload or handoff. They are audit preparation metadata only and do not store credentials, raw evidence, raw KYC, personal data, or external write commands. Not legal advice.

![Integration Policy Evaluation Receipts](docs/assets/screenshots/integration-policy-receipts-refresh.png)

Model Gateway Provider Policy makes disabled external model adapters and required controls visible before any server-side provider proxy is enabled. The workbench can refresh the metadata-only policy from `GET /api/model-gateway/provider-policy`, after Model Connect validation use `POST /api/model-gateway/provider-policy` with only provider, mode, status, and blocker metadata, and evaluate `POST /api/model-gateway/secret-policy` from a metadata-only secret policy draft. It never sends session API keys, endpoint hosts, model names, provider labels, raw evidence, or provider credentials to policy routes. The panel shows server sync and failure recovery states, exports metadata-only JSON, and keeps external providers disabled until secret policy, provider allowlist, egress logging, Redaction Gate, human-review controls, and a separate adapter enablement review are approved. Not legal advice.

![Model Gateway Provider Policy](docs/assets/screenshots/model-gateway-provider-policy.png)

![Model Gateway Provider Policy server refresh](docs/assets/screenshots/model-gateway-provider-policy-server-refresh.png)

![Model Gateway Secret Policy Evaluation](docs/assets/screenshots/model-gateway-secret-policy-evaluation.png)

Object Storage Policy Evaluation turns Evidence Retention, manifest availability, retention/deletion windows, encryption, bucket allowlist, access logging, lifecycle controls, sensitive-material confirmation, and Human Review enforcement into a server-verifiable readiness report. It sends only policy metadata and context, never raw evidence bytes or credentials, and keeps external object storage disabled until a separate adapter enablement review. Not legal advice.

![Object Storage Policy Evaluation](docs/assets/screenshots/object-storage-policy-evaluation.png)

Document Parser Policy Evaluation turns Evidence Retention, Export Safety, manifest availability, document-size limits, raw-document retention, deletion SLA, parser purpose, redaction-before-parsing, no-training-use, access logging, sensitive-material confirmation, and Human Review enforcement into a server-verifiable readiness report. It sends only whitelisted policy metadata and context, never raw document bytes, raw document body, credentials, or final legal-decision requests, and keeps external document parsing disabled until a separate raw-document adapter enablement review. Not legal advice.

![Document Parser Policy Evaluation](docs/assets/screenshots/document-parser-policy-evaluation.png)

Chain Anchor Policy Evaluation turns manifest availability, Counsel Pack version readiness, network scope, wallet custody notes, signer role, transaction logging, privacy review, public payload limits, user consent, and Human Review enforcement into a server-verifiable readiness report. It sends only policy metadata and context, never wallet keys, signed transactions, raw evidence, KYC, credentials, or real chain-write instructions, and keeps external chain anchoring disabled in `simulated-only` mode until a separate wallet signing and transaction enablement review. Not legal advice.

![Chain Anchor Policy Evaluation](docs/assets/screenshots/chain-anchor-policy-evaluation.png)

GRC Destination Policy Evaluation turns the remediation queue, Export Safety Gate, local GRC ticket export readiness, destination scope, field mapping, authentication policy, redaction, ticket ownership, retry/audit logging, and Human Review enforcement into a server-verifiable readiness report. It sends only whitelisted policy metadata and context, never API keys, webhook secrets, raw ticket bodies, raw KYC, personal data, or external ticket-write commands, and keeps external GRC ticket creation disabled until a separate adapter enablement review. Not legal advice.

![GRC Destination Policy Evaluation](docs/assets/screenshots/grc-destination-policy-evaluation.png)

Risk Audit can export the remediation queue as a metadata-only GRC ticket bundle after the GRC adapter readiness gate is clear. It does not create external Jira/Linear/ServiceNow tickets. Not legal advice.

![GRC Ticket Export](docs/assets/screenshots/grc-ticket-export.png)

Evidence Vault sync carries linked regulatory control IDs and redacted metadata-boundary warnings from ledger source references into server records and the manifest hash while keeping raw evidence bytes and raw identifiers out of API responses. After sync, users can download the server-side **Vault Manifest JSON** as a metadata-only handoff artifact, inspect the **Evidence Vault Lineage Digest** for active/replaced/rejected counts, manifest hash, lineage links, linked controls, and download a hashed lineage JSON before counsel handoff. The ledger also shows **Evidence Vault Control Coverage** so reviewers can see which controls are linked across vault records and manifest items. Not legal advice.

![Evidence Vault control links](docs/assets/screenshots/evidence-vault-control-links.png)

![Evidence Vault manifest download](docs/assets/screenshots/evidence-vault-manifest-download.png)

![Evidence Vault lineage digest](docs/assets/screenshots/evidence-vault-lineage-digest.png)

Evidence Ledger now exposes review-stage statuses directly, so users can move metadata-only records into `under-review`, preserve `rejected` records, and create a metadata-only replacement request without copying stale rejected content before Evidence Vault sync. Not legal advice.

![Evidence Ledger review-stage statuses](docs/assets/screenshots/evidence-ledger-review-stage-statuses.png)

![Evidence Ledger rejected replacement request](docs/assets/screenshots/evidence-ledger-rejected-replacement.png)

![Evidence Vault control coverage](docs/assets/screenshots/evidence-vault-control-coverage-ai.png)

Evidence Vault recovery preserves rejected evidence as superseded metadata and creates a received replacement record with parent lineage and a replacement reason.

![Evidence Vault rejected evidence recovery](docs/assets/screenshots/evidence-vault-recovery.png)

Evidence Vault duplicate-hash recovery keeps the existing vault record visible, shows the server error code, duplicate record ID, duplicate status, and an actionable retry path without storing raw evidence content. Not legal advice.

![Evidence Vault duplicate hash recovery](docs/assets/screenshots/evidence-vault-duplicate-recovery.png)

Human Review records reviewer due dates, saved status history, audit log IDs, source clause-match refresh actions, and a downloadable review timeline.

![Human Review timeline](docs/assets/screenshots/human-review-timeline.png)

Source review refresh actions route into Human Review as clause-match items for local counsel or compliance review. They remain audit-prep workflow metadata, not legal conclusions.

![Human Review clause-match source refresh](docs/assets/screenshots/human-review-clause-match-source-refresh.png)

Saved Counsel Pack versions route into Human Review as `counsel-pack` items before external handoff. Review status is audit-preparation workflow metadata only, not legal approval.

![Human Review Counsel Pack queue](docs/assets/screenshots/human-review-counsel-pack-queue.png)

The Source Review Ledger can also export a metadata-only Source Review Packet JSON with a packet hash, source records, and clause-match refresh actions for counsel/compliance review. Not legal advice.

![Source Review Packet](docs/assets/screenshots/source-review-packet.png)

The Source Review Ledger can sync metadata-only source review records to the Phase 2 API with a stable ledger hash while keeping source matching unchanged.

![Source Review Ledger API sync](docs/assets/screenshots/source-review-ledger-api-sync.png)

The Phase 2 secure review journey connects Model Connect, metadata-only Evidence Vault sync, Model Gateway receipts, auto-queued Human Review, audit log records, and Counsel Pack handoff. If the server gateway blocks a run, the UI shows the persisted failure receipt run ID, retry state, remediation steps, and the Not legal advice boundary.

![Secure Review Journey](docs/assets/screenshots/secure-review-journey.png)

Model Gateway Evaluation turns the server receipt into a metadata-only review artifact with payload/response/source-evidence hashes, provider policy, retry state, and a JSON download for human review. Not legal advice.

![Model Gateway Evaluation](docs/assets/screenshots/model-gateway-evaluation.png)

Server Model Run Ledger refreshes persisted Model Gateway run summaries from `GET /api/workspaces/:workspaceId/model-runs`, showing run status, human-review status, retry state, and receipt hashes after the Secure Review Journey completes. Not legal advice.

![Server Model Run Ledger](docs/assets/screenshots/server-model-run-ledger.png)

Server Audit Log Explorer turns Secure Review Journey audit-log records into a metadata-only timeline with actors, action counts, targets, before/after hashes, JSON download, and Phase 2 API refresh filters for actor, action, target type, and target ID. Not legal advice.

![Server Audit Log Explorer](docs/assets/screenshots/server-audit-log-explorer.png)

![Model Gateway failure receipt remediation](docs/assets/screenshots/model-gateway-failure-receipt.png)

Counsel Pack exports template-specific Markdown, browser Print / Save PDF output, Model Intake summary, AI event hashes, source review freshness ledger, source update approval gates, manifest JSON, version-history JSON, and a simulated anchor receipt without claiming a real chain write. Model Intake can also download its own profile, event ledger, readiness checklist, and event hashes as JSON.

![Counsel Pack export surface](docs/assets/screenshots/counsel-pack-exports.jpg)

Counsel Pack export templates route the same project facts into launch, RWA/tokenized asset, AI governance, custody controls, or marketing claims review agendas while keeping missing evidence visible.

![Counsel Pack export templates](docs/assets/screenshots/counsel-pack-export-templates.png)

The Counsel Pack Markdown preview now carries the Source Review Ledger and Source Freshness Board from the Regulatory Command Center, including reviewed source counts, next review dates, reviewer notes, refresh actions, board hash, metadata-missing/overdue/due-soon/scheduled lanes, and Source Update Approval Queue gates when source updates need counsel or compliance review before matching behavior changes. It repeats the Not legal advice boundary because source freshness is audit-prep lineage and scheduling metadata only.

![Counsel Pack Source Review Ledger](docs/assets/screenshots/counsel-pack-source-review-ledger.png)

![Counsel Pack Source Freshness Board](docs/assets/screenshots/counsel-pack-source-freshness-board.png)

![Counsel Pack Source Update Approval Queue](docs/assets/screenshots/counsel-pack-source-approval-queue.png)

The Counsel Pack Markdown preview also carries Human Review Timeline metadata and Evidence Recertification Queue metadata, including stale evidence status, queue hash, source-linked controls, reviewer actions, saved decisions, reviewer names, decision notes, and audit log IDs. Review and recertification status remain audit preparation workflow metadata only, not legal approval.

![Counsel Pack Human Review Timeline](docs/assets/screenshots/counsel-pack-human-review-timeline-focus.png)

The Counsel Pack export surface now includes a metadata-only Regulatory Source Pack JSON download with its own stable SHA-256 hash, source URLs, evidence gaps, and Not legal advice boundary.

![Counsel Pack Source Pack JSON download](docs/assets/screenshots/counsel-pack-source-pack-download.png)

The Export Safety Gate scans the current project, evidence ledger, counsel questions, review notes, and AI event records before export. It shows blocked/warning findings and keeps raw KYC, credentials, and private-key-like material out of export actions.

![Counsel Pack Export Safety Gate](docs/assets/screenshots/export-safety-gate.png)

Counsel Pack version history records the manifest hash, Markdown hash, review-status snapshot, source snapshot, Regulatory Source Pack hash, source review status, export timestamp, and diff from the previous export without storing raw Markdown content in the version JSON.

![Counsel Pack version history](docs/assets/screenshots/counsel-pack-version-history.png)

Server export records let the demo create a Phase 2 API-backed Counsel Pack handoff from the latest saved Pack Version, including the Regulatory Source Pack hash and source review status. The server record is metadata-only and repeats the Not legal advice boundary.

![Counsel Pack server export record](docs/assets/screenshots/counsel-pack-server-export-record.png)

The Counsel Handoff Checklist condenses Export Safety Inventory, Evidence Manifest, Evidence Recertification Queue, Evidence Vault Lineage Digest, Regulatory Source Pack, Counsel Review Status, Counsel Pack Version, server export record, and Submission Pack readiness into one downloadable metadata-only handoff JSON with a stable checklist hash. Not legal advice.

![Counsel Handoff Checklist](docs/assets/screenshots/counsel-handoff-checklist.png)

![Counsel Handoff recertification gate](docs/assets/screenshots/counsel-handoff-recertification-gate.png)

![Counsel Handoff Vault lineage gate](docs/assets/screenshots/counsel-handoff-vault-lineage-gate.png)

Sources now includes generated Submission Pack JSON and Demo Runbook JSON artifacts for judges. The Submission Pack summarizes demo readiness, Demo Runbook hash, export safety summary, required assets, feature-to-theme mapping, known limitations, manifest hash, Regulatory Source Pack hash, and the Not legal advice boundary.

![Submission Pack artifact](docs/assets/screenshots/submission-pack.png)

![Submission Pack Export Safety Summary](docs/assets/screenshots/submission-pack-export-safety-summary.jpg)

Sources also includes an Export Safety Inventory that consolidates the handoff state for manifest, source pack, Counsel Pack version, source review, Source Freshness Board, Demo Runbook, local counsel routing, GRC ticket export, integration dossier, and submission pack artifacts. It carries the Source Freshness Board and Demo Runbook artifact hashes/statuses when available, blocks external handoff when the data boundary detects private keys, credential-like tokens, or raw KYC references, and downloads only redacted metadata. Not legal advice.

![Export Safety Inventory](docs/assets/screenshots/export-safety-inventory.png)

![Export Safety Inventory Source Freshness Board](docs/assets/screenshots/export-safety-source-freshness-board.jpg)

The Judge Handoff Bundle gives evaluators one Sources-level JSON packet that lists the Submission Pack, Demo Runbook, Export Safety Inventory, and Counsel Handoff Checklist artifact hashes/statuses, clickable recovery actions to Counsel Pack, Judge Demo Readiness, Export Safety Inventory, or the final checklist, a stable bundle hash, and the Not legal advice boundary.

![Judge Handoff Bundle](docs/assets/screenshots/judge-handoff-bundle.png)

![Sources Demo Runbook Handoff](docs/assets/screenshots/sources-demo-runbook-handoff.png)

## Hackathon Demo Runbook

The runnable judge path is documented in [docs/demo-script.md](docs/demo-script.md). It starts the Phase 2 API, opens the Vite app, and walks through:

Clean-clone smoke gate:

```bash
# Terminal 1
npm install
npm run verify
npm run build:server
DATABASE_URL=file:./demo-review-workspace.db npm run start:api

# Terminal 2
DEMO_API_BASE_URL=http://127.0.0.1:8787 npm run demo:smoke
npm run dev
```

1. Demo Scenario Library launch from a synthetic profile such as **High-risk RWA launch**, **DAO proposal review**, **Brazil VASP source review**, **Swiss FINMA stablecoin review**, **US GENIUS Act stablecoin review**, **EU MiCA ART/EMT stablecoin review**, **UK qualifying stablecoin issuer review**, **Hong Kong VATP custody review**, **Hong Kong HKMA stablecoin issuer review**, **Japan crypto custody review**, **Canada CTP custody review**, **Australia digital asset review**, **Korea VASP user protection review**, **India VDA PMLA review**, **UK cryptoasset AML review**, **Germany MiCAR custody review**, or **Marketing claims review**.
2. Workspace Journey review on the command center to show the full path and next blocked/review action.
3. Model Connect validation with the mock local reviewer.
4. Evidence selection or local metadata-only evidence intake.
5. Deterministic Risk Audit with source-linked issue cards.
6. Human Review return flow that moves linked evidence back to `requested` and records a downloadable review timeline.
7. Secure Review Journey across Evidence Vault, Model Gateway, Model Gateway Evaluation, Human Review, audit log routes, and Audit Log Export.
8. Counsel Pack template selection, Source Review Ledger API sync, Source Update Approval Queue preview, Counsel Handoff Checklist JSON, version save with Regulatory Source Pack hash, server export record creation, Markdown export, Manifest JSON, and simulated anchor receipt.
9. Sources tab Judge Handoff Bundle, Export Safety Inventory, Submission Pack JSON, Demo Runbook JSON, and Counsel Handoff Checklist artifact status with bundle/inventory/pack/runbook/checklist hashes, export safety summary, known limitations, demo readiness, and hackathon mapping.

Screenshots for the exact demo path:

![Demo step 1: Model Connect](docs/assets/screenshots/demo-01-model-connect.png)

![Demo step 2: Evidence Ledger](docs/assets/screenshots/demo-02-evidence-ledger.png)

![Demo step 3: Risk Audit](docs/assets/screenshots/demo-03-risk-audit.png)

![Demo step 4: Human Review Return](docs/assets/screenshots/demo-04-human-review-return.png)

![Demo step 5: Secure Review Journey](docs/assets/screenshots/demo-05-secure-review-journey.png)

![Demo step 6: Counsel Pack Export](docs/assets/screenshots/demo-06-counsel-pack-export.png)

![Demo step 7: Export Safety Inventory](docs/assets/screenshots/export-safety-inventory.png)

![Demo step 8: Submission Pack](docs/assets/screenshots/submission-pack.png)

Every step is audit preparation only. Not legal advice.

## How Users Connect Models

LexProof uses a controlled BYOM/BYOK model workflow:

1. Open **Model Intake** to register the provider/model purpose, endpoint type, allowed data classes, and required human-review owner. Model Intake stores no API keys.
2. Record AI event intake entries for model outputs that need audit tracking. AI Review runs also create a Model Intake event automatically. Each event receives a deterministic SHA-256 hash, reviewer, and editable review status.
3. Open **AI Review** and use the built-in mock reviewer for demos, or choose the OpenAI-compatible provider.
4. Enter a base URL, model name, and API key. In this first-stage SPA, the API key is kept in browser state and is not persisted to `localStorage`.
5. Check **Model Access Workflow** and **Model Connection Readiness**. The workflow shows Model Intake, provider setup, Redaction Gate, model run, and human-review/export status. Readiness shows whether the mock reviewer is ready, whether live OpenAI-compatible settings are incomplete, or whether the Redaction Gate blocks the run.
6. Review the **Redaction Gate** payload summary before running the model.
7. Run AI Review only after evidence summaries are clean or reviewed. Private-key-like material blocks model calls.
8. After a completed run, inspect the **AI Review Run Ledger** for provider/model metadata, redaction status, payload SHA-256, response SHA-256, and a downloadable run JSON receipt. The same run is also recorded in **Model Intake** as a needs-review AI event.
9. Run **Secure Review Journey** against the Phase 2 API to create a backend workspace, sync metadata-only evidence, create a server Model Gateway receipt, read the automatically queued Human Review request, fetch audit log records, and refresh the persisted server Model Run Ledger. The server request is limited to audit-prep metadata, evidence hashes, and risk flag summaries.
10. Mark AI events reviewed or rejected in **Model Intake** after human review, download **Model Intake JSON** for the model-event audit trail, then open **Counsel Pack** to choose an export template, review the Export Safety Gate, and export the Model Intake Summary, readiness status, human-review owner, review statuses, AI event hashes, Counsel Pack version metadata, and a server-side export metadata record with the review packet.

Model output is draft audit preparation only. It does not change deterministic risk scoring, make legal conclusions, perform KYC, or replace counsel review. Model Intake records are local audit-prep metadata, not final adjudication.

## First-Stage Workflow

1. Open the app and click **New project**, load one of the synthetic sample profiles, or use **Demo Scenario Library** to start a judge-ready path such as **High-risk RWA launch**, **DAO proposal review**, **Public source education review**, **AI legal workflow review**, **Brazil VASP source review**, **Swiss FINMA stablecoin review**, **US GENIUS Act stablecoin review**, **EU MiCA ART/EMT stablecoin review**, **UK qualifying stablecoin issuer review**, **Singapore DPT custody review**, **Hong Kong VATP custody review**, **Hong Kong HKMA stablecoin issuer review**, **Japan crypto custody review**, **Canada CTP custody review**, **Australia digital asset review**, **Korea VASP user protection review**, **India VDA PMLA review**, **UK cryptoasset AML review**, **Germany MiCAR custody review**, **UAE VARA operating review**, or **Marketing claims review**.
2. Fill in project facts in the Project Workspace. Do not enter raw KYC, private keys, or personal data.
3. Review the **Regulatory Command Center** for the **Workspace Cockpit Handoff**, **Workspace Journey**, **Workspace Action Queue**, **Regulatory Control Matrix**, **Jurisdiction Evidence Map**, **Jurisdiction Readiness Digest**, **Source Freshness Board**, **Local Counsel Routing Plan**, jurisdiction readiness, official-source triggers, Source Review Ledger, Source Update Approval Queue, evidence gaps, and the non-advice handoff boundary. The **High-risk RWA launch** path now shows New York NYDFS BitLicense and custody customer-protection controls for New York resident access, virtual-currency business activity, customer virtual-currency segregation, beneficial-interest disclosure, sub-custody approval, reconciliation, books-and-records, and no-proprietary-use evidence, US Regulation D accredited-investor review triggers for offering route, investor eligibility, solicitation controls, and verification evidence, US OFAC virtual-currency sanctions controls for wallet screening, geolocation, blocked-property escalation, reporting, and recordkeeping evidence, US FinCEN CVC/MSB and BSA transfer-recordkeeping controls for business-model, AML-program, MSB registration handoff, SAR/CTR escalation, Travel Rule, originator/beneficiary handling, and retention-owner evidence, plus EU MiCA Article 75 CASP custody, DORA ICT operational-resilience, and EU TFR crypto-asset transfer-information controls for counterparty CASP handling, missing/incomplete transfer information, rejection/return handling, retention-owner, and reviewer-owner evidence when platform wallet custody is present. The **DAO proposal review** scenario shows US SEC DAO Report, US CFTC Ooki DAO / DeFi derivatives-platform, and UK Law Commission DAO scoping controls for governance-token, participant-role, voting, signer, derivatives-platform boundary, FCM/BSA/CIP assumptions, control-transfer history, and asset-control evidence. The **AI legal workflow review** scenario shows US NIST AI RMF / NIST AI 600-1 Generative AI Profile, EU AI Act, and UK ICO AI data protection controls for AI governance, use-case context, risk measurement, GenAI output provenance, human oversight, source lineage, redaction, and reviewer decision logs. The **Brazil VASP source review** scenario shows Banco Central and CVM source controls for authorization, AML/CFT, classification, disclosure, and investor-communication evidence gaps. The **Swiss FINMA stablecoin review** scenario shows FINMA ICO Guidelines and FINMA Guidance 06/2024 controls for payment/utility/asset/hybrid token classification, offering/prospectus intake, redemption claims, reserve assets, bank guarantees, banking-law and collective-investment perimeter assumptions, AML, sanctions, holder identification, transfer-risk, and local-counsel handoff. The **US GENIUS Act stablecoin review** scenario shows payment stablecoin issuer controls for permitted-issuer route, state or federal oversight, reserve assets, redemption, monthly disclosure, custody, insolvency-priority evidence, BSA/AML, sanctions, transaction monitoring, and no-raw-KYC handoff. The **Singapore DPT custody review** scenario shows MAS PS-G03 customer-asset safeguard source controls for segregation, custody disclosure, reconciliation, and transfer-control evidence gaps. The **Hong Kong VATP custody review** scenario shows SFC VATP client-asset custody source controls for associated-entity trust holding, wallet segregation, reconciliation, cold-storage/key-control, monitoring, and compensation evidence gaps. The **Hong Kong HKMA stablecoin issuer review** scenario shows Stablecoins Ordinance / HKMA source controls for issuer licensing, regulated stablecoin activity, reserve assets, full backing, redemption, attestation, AML/CFT, recordkeeping, user-protection, and local-counsel handoff. The **Japan crypto custody review** scenario shows FSA crypto-asset exchange supervision controls for registration assumptions, user-asset protection, information to users, cold-wallet/offline management, reconciliation, and leakage-response evidence gaps. The **Canada CTP custody review** scenario shows CSA Staff Notice 21-332 / 21-329 controls for registration and PRU assumptions, Canadian client access, no leverage, VRCA consent, client-asset custody and segregation, acceptable third-party custodian assurance, no re-hypothecation, insurance or alternative risk mitigation, and local-counsel handoff. The **Australia digital asset review** scenario shows ASIC INFO 225, ASIC RG 133, and AUSTRAC virtual asset service guidance controls for digital-asset financial-services scope, AFS licensing handoff, dealing/market-making/custodial-service assumptions, crypto custody controls, VASP AML/CTF programs, CDD, travel rule, reporting, seven-year recordkeeping, and local-counsel handoff. The **Korea VASP user protection review** scenario shows FSC Virtual Asset User Protection Act / Enforcement Decree and KoFIU VASP reporting / AML controls for user deposits at banks, user virtual-asset segregation, 80 percent cold-wallet handling, insurance/reserve, abnormal transaction monitoring/reporting, Korean-language whitepaper or user disclosure, compliance system, shareholder/ISMS/real-name account reporting, CDD/EDD, STR, Travel Rule, and local-counsel handoff. The **India VDA PMLA review** scenario shows Ministry of Finance PMLA VDA notification and FIU-IND AML/CFT guidance controls for VDA activity scope, FIU-IND Reporting Entity registration, AML/CFT/CPF program, Designated Director / Principal Officer, CDD/EDD, beneficial ownership, STR/monthly reporting, transaction monitoring, risk assessment, Travel Rule, record retention, FINGate/reporting-format handoff, and local-counsel handoff. The **UK cryptoasset AML review** scenario shows FCA AML/CTF regime, MLR registration expectations, and Travel Rule expectations for cryptoasset exchange-provider and custodian-wallet-provider scope, registration evidence, business plan, ownership/control, MLRO, BWRA/CRA, AML/CTF/CPF framework, CDD/EDD, sanctions, blockchain analytics, transaction monitoring, SAR escalation, Travel Rule data flow, record retrieval, outsourcing, and local-counsel handoff. The **Germany MiCAR custody review** scenario shows BaFin/MiCAR CASP service-scope, Article 60 notification or Article 62 authorisation assumptions, Article 75 custody safeguarding, client-position records, segregation, return-process, means-of-access handling, private-key exclusion, and German local-counsel handoff. The **UAE VARA operating review** scenario shows VARA Virtual Assets and Related Activities Regulations 2023 plus the VARA Compliance and Risk Management Rulebook controls for virtual-asset activity scope, licensing assumptions, compliance management, AML/CFT, books and records, audit, client virtual asset custody, proof-of-reserves, reconciliation, and local-counsel handoff without pulling in marketing-only regulations unless marketing facts are present. The **Marketing claims review** scenario shows US FTC, EU MiCA Articles 7-8, UK FCA, and UAE VARA 2024 Marketing Regulations controls for advertising substantiation, endorsement/material-connection disclosures, marketing communication labels, white-paper consistency, home/host Member State audience routing, promotion approval, risk warnings, KOL/incentive disclosures, marketing recordkeeping, client categorisation, activity scope, and access-control evidence gaps. Download the Cockpit Handoff JSON when counsel or judges need the first-screen status, journey, action queue, manifest/export state, and handoff hash in one metadata-only artifact. Download the Control Matrix JSON when counsel needs a metadata-only source/evidence/source-review handoff, download the Jurisdiction Evidence Map JSON when counsel needs per-jurisdiction open evidence and map hash context, download the Jurisdiction Digest JSON when counsel needs one per-jurisdiction handoff status with evidence/source blockers and a digest hash, download the Source Freshness Board JSON when counsel needs overdue/due-soon source review scheduling context, download the Local Counsel Routing JSON when counsel needs jurisdiction/counsel-role routing with a plan hash, sync the Source Review Ledger to the Phase 2 API when the source freshness ledger needs durable metadata records, download the Source Review Packet JSON when counsel needs the source refresh action queue and packet hash, or download the Source Approval Queue JSON when review-due source updates need an approval gate before matching behavior changes. Use journey and queue buttons to jump directly to project facts, evidence, model, review, or export recovery work.
   The **EU MiCA ART/EMT stablecoin review** scenario shows asset-referenced token and e-money token issuer controls for classification, authorisation or notification route, home Member State, competent-authority handoff, white paper, reserve composition, reserve custody, redemption, recovery plan, redemption plan, and no-raw-customer-record handoff.

   The **UK qualifying stablecoin issuer review** scenario shows FCA PS26/10 and BoE/FCA joint-approach controls for UKQS issuer route, regulated activity assumptions, admission or distribution scope, disclosures, backing assets, safeguarding, redemption, liquidity, recordkeeping, systemic-transition handoff, and no-raw-customer-record evidence.
4. Open **Model Intake** to document model purpose, allowed data classes, human review owner, and any AI event records that need traceability.
5. Open **AI Review** to inspect Model Access Workflow, Model Connection Readiness, review the Redaction Gate, and run the mock reviewer or an OpenAI-compatible model. AI output is draft audit preparation, not legal advice, and each completed run receives a local hash receipt plus an automatic Model Intake event for human review.
6. Return to **Model Intake** to assign a reviewer, move AI event records from `needs-review` to `reviewed` or `rejected`, and download Model Intake JSON when the model-event ledger needs a standalone handoff.
7. Open **Jurisdiction Checklist** to see preparation prompts, jurisdiction packs, policy controls, evidence-ready status, and local-counsel routing for counsel review.
8. Open **Risk Audit** to see current risk level, source-linked issue cards, trigger facts, weighted flags, evidence workflow coverage, remediation owners, missing evidence request actions, and the metadata-only **GRC Ticket Export** JSON bundle.
9. Add or edit records in **Evidence Ledger**, move local evidence through `draft`, `requested`, `received`, `under-review`, `verified`, and `rejected` workflow states, hash a local file into metadata-only evidence, use Evidence Intake Guidance when the ledger is empty, request missing evidence from Risk Audit, request source evidence gaps from the Command Center without creating duplicate Ledger rows, or apply one of the scenario templates for tokenized yield/RWA, DAO governance/multisig, or AI compliance workflows. Source references can include `source gap: ...`, `regulatory control: control-...`, or `regulatory clause: ...` so Evidence Vault sync carries linked control IDs, redacted metadata-boundary warnings, and review-stage statuses into the server manifest, **Evidence Vault Lineage Digest**, and **Evidence Vault Control Coverage** summary. The manifest updates with per-item hashes and a bundle SHA-256; after server sync, use **Download Vault Manifest JSON** and **Download Lineage Digest JSON** to export persisted metadata-only vault handoff artifacts. The Evidence Audit Trail records local evidence creation, template application, source-gap requests/refreshes, edits, removals, and a JSON export. Check **Evidence Retention Readiness** before vault sync; private-key-like material, API-key-like credentials, and raw KYC references block Evidence Vault sync until replaced with metadata-only summaries. Use **Download Remediation Queue JSON** to hand off P0 delete/replace and P1 metadata-confirmation work without raw secret, KYC, or personal-data content.
10. Open **Human Review** to assign reviewers, adjust due dates, save returned/reviewed/rejected decisions, route due source clause-match refresh actions to local counsel, and download the Human Review timeline JSON for status history with audit log IDs.
11. Review **Integration Readiness Registry** on the main workspace to see which external adapters are ready, blocked, disabled, or waiting for policy approval. Use **Integration Enablement Dossier** to download one hashed metadata-only JSON artifact that consolidates adapter readiness plus provider, secret, object storage, parser, chain anchor, and GRC destination policies while keeping `externalEnablementAllowed: false`. Use Object Storage Policy Evaluation, Document Parser Policy Evaluation, Chain Anchor Policy Evaluation, and GRC Destination Policy Evaluation to produce metadata-only readiness reports before enabling any future storage, raw-document parser, wallet/chain, or ticket-system adapter. Use recovery buttons to open Model Connect, Evidence Ledger, Risk Audit, or Counsel Pack before enabling any future real provider, storage, OCR, GRC, or chain adapter.
12. Run **Secure Review Journey** to sync metadata-only evidence to the Phase 2 API, create a server Model Gateway receipt, open Human Review, record audit-log events, refresh the Server Model Run Ledger, and inspect the Server Audit Log Explorer. Gateway policy failures are shown as recoverable failure receipts with run IDs and remediation steps.
13. Open **Counsel Pack** to choose an export template, inspect the Export Safety Gate, edit the counsel question queue, update review status for each risk flag, confirm the Source Review Ledger, Source Freshness Board, Local Counsel Routing Plan, and any open Source Update Approval Queue gates appear in the Markdown preview, save a Pack Version to capture manifest/Markdown hashes, Regulatory Source Pack hash, source review status, and review-status diff, create a server export record from that latest version when the Phase 2 API is running, then download the Markdown audit-prep packet with Regulatory Source Graph, Source Review Ledger, Source Freshness Board scheduling metadata, local counsel routes, source update approval gates, Model Intake summary and AI event hashes, use browser Print / Save PDF, download version JSON, download manifest JSON, or create a simulated anchor receipt JSON for counsel/compliance review. If the gate detects private keys, API keys, or raw KYC materials, these export actions are disabled until the evidence is replaced with metadata-only summaries.

Workspace data is stored locally in browser `localStorage`. Local file evidence is hashed in the browser and stored as file metadata plus SHA-256, not raw file bytes. The Phase 2 API stores workspace, evidence metadata, model-run receipt, human-review, integration policy evaluation receipt, audit-log, and Counsel Pack export metadata records in SQLite when enabled. It does not store model credentials, raw KYC, personal data, raw evidence bytes, raw Markdown, or real chain transactions. API keys for live browser model calls are held in browser state and are not persisted. Model Intake JSON, Evidence Audit Trail JSON, Evidence Retention Policy JSON, Evidence Retention Remediation Queue JSON, Evidence Vault Manifest JSON, Evidence Vault Lineage Digest JSON, Demo Smoke Checklist JSON, Demo Runbook JSON, Judge Handoff Bundle JSON, Integration Readiness Registry output, Integration Enablement Dossier JSON, Integration Policy Evaluation Receipts, GRC Destination Policy JSON, GRC Ticket Export JSON, Model Gateway Evaluation JSON, Audit Log Export JSON, Counsel Pack version JSON, Counsel Handoff Checklist JSON, Export Safety Inventory JSON, Model Gateway receipts, server export records, and model-run ledger exports store hashes and metadata, not credentials or raw Markdown content. Evidence Retention Readiness redacts detected secrets in snippets and blocks Evidence Vault sync for private-key-like material, credential-like tokens, and raw KYC references; wallet-address identifiers and personal-data references remain warning-level review signals for counsel handoff. The remediation queue carries only redacted snippets, priority, next action, and queue SHA-256. Integration Readiness Registry and Integration Enablement Dossier expose disabled, needs-policy, ready, and blocked adapter states only; they do not call external providers, upload objects, run OCR, create GRC tickets, or write to a chain. GRC Destination Policy and GRC Ticket Export create local/server metadata-only JSON artifacts only; they do not create external Jira, Linear, ServiceNow, or GRC system records. The Evidence Vault API blocks invalid status transitions such as directly reactivating rejected or superseded records; users must use replacement recovery so lineage remains visible. The Export Safety Gate, Export Safety Inventory, Counsel Handoff Checklist, and Judge Handoff Bundle redact detected secrets in previews/downloads and block or flag export handoff for the same blocked data classes. The anchor receipt is a local simulation for manifest handoff only.

## Tech Stack

- React 19
- TypeScript
- Vite
- Vitest
- Testing Library
- Lucide React icons

## Project Docs

- [docs/project-governance.md](docs/project-governance.md): operating contract for work intake, architecture ownership, workflow, verification, and clean handoff.
- [WORKFLOW.md](WORKFLOW.md): direct-to-main development and push workflow.
- [ARCHITECTURE.md](ARCHITECTURE.md): module boundaries, data flow, and extension points.
- [CONTRIBUTING.md](CONTRIBUTING.md): product and engineering guardrails.
- [docs/work-universe.md](docs/work-universe.md): complete build universe and product direction for future work.
- [docs/architecture-guardrails.md](docs/architecture-guardrails.md): placement rules that keep new features aligned with the existing structure.
- [docs/engineering-workflow.md](docs/engineering-workflow.md): verification matrix, screenshot policy, cleanliness rules, and agent prompt contract.
- [docs/research.md](docs/research.md): hackathon selection and audit research notes.
- [docs/product-strategy.md](docs/product-strategy.md): competition fit, product outlook, gaps, and roadmap.
- [docs/phase-2-secure-review-workspace.md](docs/phase-2-secure-review-workspace.md): near-term Secure Review Workspace plan and backend-boundary contracts.
- [docs/phase-2-backend-design-spike.md](docs/phase-2-backend-design-spike.md): Week 2 backend stack decision, API contracts, schema draft, and security boundaries.
- [docs/submission-pack.md](docs/submission-pack.md): screenshot-backed pitch, demo path, and submission narrative.

## Run Locally

```bash
npm install
npm run verify
npm run dev
```

The dev server defaults to `http://127.0.0.1:5173`.

The Phase 2 API backend can be built and started separately:

```bash
npm run build:server
npm run start:api
```

Once the API is running, the judge smoke CLI checks required npm scripts, demo files, screenshot assets, `/api/health`, and safe GET route families for Model Gateway, Evidence Vault manifest, Human Review queue, Counsel Pack exports, Audit Log, and Integration Policy Evaluation receipts without using private credentials:

```bash
DEMO_API_BASE_URL=http://127.0.0.1:8787 npm run demo:smoke
```

For offline repository-only checks, use:

```bash
npm run demo:smoke -- --skip-api
```

The API defaults to `http://127.0.0.1:8787` and currently exposes `GET /api/health`, Model Gateway adapter readiness, provider policy and secret policy evaluation routes, Object Storage Policy Evaluation, Document Parser Policy Evaluation, Chain Anchor Policy Evaluation, GRC Destination Policy Evaluation, Workspace create/read/update routes, multipart Evidence Vault upload/list/update/replacement/manifest routes, mock Model Gateway run create/list/lookup routes, Human Review create/update/list plus queue-view routes, Source Approval sync/list routes, Counsel Pack export-record create/list/read routes, Integration Policy Evaluation receipt listing, filtered Audit Log listing, and Prisma/SQLite persistence for workspace/evidence/model/review/integration-policy/source-approval/export/audit records. Health and API preflight behavior lives in `server/systemRoutes.ts`, keeping `server/app.ts` focused on composition and shared hooks. Evidence uploads are hashed server-side and responses stay metadata-only. Evidence Vault manifests are generated from persisted metadata through `src/lib/evidenceVaultManifest.ts`, with stable item ordering, lineage/status/version/control-link hashing, no raw file bytes, and no source-note body content in the JSON; the Evidence Ledger can download that server manifest after sync. Duplicate evidence hashes are blocked with recoverable errors, rejected vault records can be superseded by replacement metadata with parent lineage and a replacement reason, and invalid status transitions return recovery guidance before any write or audit-log mutation. Model Gateway policy routes evaluate provider readiness and secret-policy controls without accepting provider credentials or enabling external proxying. `POST /api/integrations/object-storage/policy` evaluates metadata-only object-storage controls without raw uploads, credentials, storage buckets, or adapter enablement; it always returns `externalObjectStorageAllowed: false`. `POST /api/integrations/document-parser/policy` evaluates metadata-only document parser controls without raw document bytes, raw document body, credentials, OCR execution, parser adapters, or legal-decision output; it always returns `externalDocumentParsingAllowed: false`. `POST /api/integrations/chain-anchor/policy` evaluates metadata-only simulated anchor controls without wallet keys, signed transactions, raw evidence, raw KYC, credentials, or blockchain submission; it always returns `externalChainAnchoringAllowed: false` and `anchorMode: simulated-only`. `POST /api/integrations/grc-destination/policy` evaluates metadata-only GRC destination controls without API keys, webhook secrets, raw ticket bodies, raw KYC, personal data, or external ticket creation; it always returns `externalGrcTicketCreationAllowed: false`. When those integration policy requests include a workspace ID and the Phase 2 API repository is active, the response also includes a metadata-only `evaluationRecord`, persists that receipt, and writes an audit-log entry; `GET /api/workspaces/:workspaceId/integration-policy-evaluations` lists the receipts without raw policy, context, evidence, credential, or ticket body content. `POST /api/workspaces/:workspaceId/source-approvals` persists metadata-only source approval records and audit-log entries from the Source Update Approval Queue while keeping `matchingBehaviorChanged: false`; `GET /api/workspaces/:workspaceId/source-approvals` lists those records. `GET /api/workspaces/:workspaceId/audit-log` supports actor, action, target type, and target ID filters from the Secure Review Workspace without returning raw payloads, credentials, raw KYC, personal data, or legal conclusions. Model Gateway runs enforce Redaction Gate status, allowed data classes, purpose, human-review owner, credential/KYC blockers, and adapter policy. Successful runs persist payload hash, response hash, source evidence hash, provider metadata, retry state, and human-review status, then automatically create a model-run Human Review request with audit-log metadata; the Secure Review Workspace can refresh persisted run summaries through the Server Model Run Ledger. Failed or blocked runs persist safe failure receipts with run IDs, retry state, error codes, and remediation steps without returning raw payloads. Human Review queue views group filtered review records by target type, status, reviewer, and next action for evidence, model-run, risk-flag, clause-match, and counsel-pack targets without representing review as legal approval; evidence-target decisions sync Evidence Vault status, and model-run decisions sync Model Gateway human-review status plus audit-log metadata. Counsel Pack export records persist version number, artifact name, manifest hash, artifact hash, review summary, source count, Regulatory Source Pack hash, source review status, and the Not legal advice boundary without storing raw Markdown/PDF content. The backend only enables the local mock model adapter in this phase; OpenAI-compatible and enterprise-proxy adapters are listed as disabled placeholders even when secret policy controls evaluate ready, until a separate adapter enablement review is approved. It does not persist uploaded file bytes, store model credentials, process KYC, call external model providers, upload to object storage, run OCR, create external GRC tickets, or write to a blockchain.

Source Review Ledger persistence is also available through `POST /api/workspaces/:workspaceId/source-reviews` and `GET /api/workspaces/:workspaceId/source-reviews`. It stores metadata-only source review records with a stable ledger hash, audit-log entry, `matchingBehaviorChanged: false`, and the Not legal advice boundary; it does not ingest raw source bodies or change regulatory matching behavior.

For the scripted hackathon demo, use a disposable SQLite file:

```bash
# Terminal 1
npm run build:server
DATABASE_URL=file:./demo-review-workspace.db npm run start:api

# Terminal 2
DEMO_API_BASE_URL=http://127.0.0.1:8787 npm run demo:smoke
```

Then run the frontend in another terminal:

```bash
npm run dev
```

## Submission Assets

- Public GitHub repository: this repo
- Demo video: record the scripted flow in [docs/demo-script.md](docs/demo-script.md), including Model Connect, Evidence Ledger, Risk Audit, Human Review, Secure Review Journey, and Counsel Pack export
- DoraHacks BUIDL submission: use the generated Counsel Pack and README summary
- Screenshot-backed submission narrative plus generated Judge Handoff Bundle and Submission Pack JSON: see [docs/submission-pack.md](docs/submission-pack.md) and the **Sources** tab
- Source pack: see [docs/research.md](docs/research.md)
- Demo script: see [docs/demo-script.md](docs/demo-script.md)

## Sources

- DoraHacks BLI page: https://dorahacks.io/hackathon/legal-hack-2026/detail
- BLI hackathon page: https://bli.tools/hackathon/
- CompeteHub BLI summary: https://www.competehub.dev/en/competitions/dorahackslegal-hack-2026
- Constellation Labs BLI 2025 highlights: https://medium.com/constellationlabs/building-the-future-of-legal-innovation-highlights-from-the-blockchain-legal-institute-hackathon-c65899009f75
