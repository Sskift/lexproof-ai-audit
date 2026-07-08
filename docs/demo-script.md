# LexProof AuditOS Hackathon Demo Script

This is the runnable judging path for BLI Legal Tech Hackathon 2. The demo shows audit preparation workflow records only. It is not legal advice, not KYC, and not a real on-chain write.

## Local Setup

Run the API and web app in separate terminals:

```bash
npm install
npm run verify
npm run build:server
DATABASE_URL=file:./demo-review-workspace.db npm run start:api
```

```bash
DEMO_API_BASE_URL=http://127.0.0.1:8787 npm run demo:smoke
npm run dev
```

Open `http://127.0.0.1:5173`. Use `http://127.0.0.1:8787` anywhere the UI asks for a Secure Review or Evidence Vault API base URL.

If port `8787` is already occupied, use the same alternate port for the API, smoke CLI, and UI API base URL fields:

```bash
PORT=8791 DATABASE_URL=file:./demo-review-workspace.db npm run start:api
DEMO_API_BASE_URL=http://127.0.0.1:8791 npm run demo:smoke
```

## End-To-End Demo Path

Before step 0, use **Judge Demo Readiness** in **Project Workspace**:

- Confirm **Scenario library**, **Clean clone commands**, **Private credentials not required**, and **Screenshot set** are ready.
- Confirm the terminal `npm run demo:smoke` result is `ready`; it checks `/api/health` plus safe GET route families for Model Gateway adapters, provider policy disabled-adapter recovery metadata, Server Model Run Ledger metadata, and non-empty run recovery next actions, Evidence Vault manifest bundle hashes plus lineage digest and lineage recovery packet hashes with non-empty next actions, Human Review queue recovery metadata and non-empty next actions, Source Review Ledger packet hashes and non-empty next actions, Source Approval Queue packet hashes and non-empty next actions, Counsel Pack exports plus non-empty export recovery next actions, Audit Log export integrity metadata and non-empty next actions, and Integration Policy Evaluation receipts plus receipt bundle metadata and non-empty next actions. If `/api/health` fails because the default port is occupied, restart with `PORT=<free-port>` and rerun with the same `DEMO_API_BASE_URL`. Use `npm run demo:smoke -- --skip-api` only for offline repository checks.
- Enter `http://127.0.0.1:8787` in **Demo API base URL**, click **Check Demo API**, and confirm **Phase 2 API preflight ready**.
- Click **Download Demo Runbook JSON** and show the stable runbook hash, scenario count, API preflight status, screenshot references, limitations, and Not legal advice boundary.
- Screenshot: `docs/assets/screenshots/judge-demo-readiness.png`.
- Screenshot: `docs/assets/screenshots/demo-runbook-json.png`.
- This check is readiness metadata only. Not legal advice.

0. **Start from a seeded scenario**
   - In **Project Workspace**, find **Demo Scenario Library**.
   - Click **Start High-risk RWA launch** to load the `YieldPassport` synthetic profile and jump into the Risk Audit surface.
   - Inspect the New York NYDFS BitLicense and custody customer-protection evidence gaps, then continue through US FinCEN/BSA, EU DLT Pilot, EU TFR, and EU DORA review triggers.
   - Optional DAO source path: click **Start DAO proposal review** to load `ClauseGuard DAO`, open Human Review, then inspect US SEC DAO Report / US CFTC Ooki DAO / EU MiCA DAO perimeter / UK Law Commission DAO source controls in Risk Audit.
   - Optional alternate judge path: click **Start AI legal workflow review** to load `LexAssist Evidence Desk` and start in Model Intake for model governance, human review, ABA Formal Opinion 512 professional-responsibility review, US NIST AI RMF / NIST AI 600-1 Generative AI Profile, NYC Local Law 144 AEDT hiring/promotion review, California CCPA ADMT consumer-rights review, Colorado ADMT consequential-decision review, EU AI Act AI-literacy, Article 50 transparency, administration-of-justice/ADR perimeter source controls, UK ICO AI data protection source controls, Singapore IMDA / AI Verify Foundation Agentic AI governance controls, and counsel export.
   - Optional Brazil source path: click **Start Brazil VASP source review** to load `Brazil VASP Launch Review` and start in Jurisdiction Checklist for Banco Central/CVM source controls, authorization evidence gaps, AML/CFT review routing, and counsel export.
   - Optional Singapore source path: click **Start Singapore DPT custody review** to load `HarborKey DPT Custody Review` and start in Jurisdiction Checklist for MAS PSN02 AML/CFT controls, MAS PS-G03 customer-asset safeguard controls, custody/data-redaction evidence gaps, and counsel export.
   - Optional Hong Kong source path: click **Start Hong Kong VATP custody review** to load `HarborBridge VATP Custody Review` and start in Jurisdiction Checklist for SFC VATP client-asset custody controls, wallet governance evidence gaps, and counsel export.
   - Optional Hong Kong stablecoin source path: click **Start Hong Kong HKMA stablecoin issuer review** to load `HarborMint Stablecoin Issuer Review` and start in Jurisdiction Checklist for HKMA Stablecoins Ordinance issuer licensing, reserve, redemption, AML/CFT, user-protection evidence gaps, and counsel export.
   - Optional Hong Kong tokenised product path: click **Start Hong Kong tokenised product review** to load `HarborYield Tokenised Product Review` and start in Jurisdiction Checklist for SFC tokenisation and secondary-trading circular controls, ownership-record, smart-contract, fair-pricing, liquidity, disclosure, and counsel export evidence gaps.
   - Optional Japan source path: click **Start Japan crypto custody review** to load `SakuraKey Crypto Custody Review` and start in Jurisdiction Checklist for FSA crypto-asset exchange custody controls, user-asset protection evidence gaps, cold-wallet/offline management, reconciliation, leakage-response review routing, and counsel export.
   - Optional Canada source path: click **Start Canada CTP custody review** to load `MapleVault CTP Custody Review` and start in Jurisdiction Checklist for CSA CTP PRU custody controls, registration and PRU evidence gaps, client-asset custody and segregation, acceptable third-party custodian assurance, no re-hypothecation, no leverage, VRCA consent, and counsel export.
   - Optional Australia source path: click **Start Australia digital asset review** to load `SouthernCross Digital Asset Review` and start in Jurisdiction Checklist for ASIC digital-asset financial-services controls, AUSTRAC VASP AML/CTF evidence gaps, CDD, travel-rule, reporting, recordkeeping, and counsel export.
   - Optional Korea source path: click **Start Korea VASP user protection review** to load `HanRiver VASP User Protection Review` and start in Jurisdiction Checklist for FSC user-asset protection and KoFIU VASP reporting / AML evidence gaps, CDD/EDD, STR, Travel Rule, real-name account, and counsel export.
   - Optional India source path: click **Start India VDA PMLA review** to load `Mumbai VDA PMLA Review` and start in Jurisdiction Checklist for FIU-IND/PMLA VDA service provider controls, Reporting Entity registration, AML/CFT/CPF, CDD/EDD, STR/monthly reporting, Travel Rule, record-retention evidence gaps, and counsel export.
   - Optional Thailand source path: click **Start Thailand digital asset custody review** to load `Bangkok Digital Asset Custody Review` and start in Jurisdiction Checklist for SEC digital asset business licensing/custody controls, AMLO AML/CDD controls, client-asset records, transfer approvals, daily reconciliation, beneficial-owner, high-risk customer, and local-counsel evidence gaps.
   - Optional Indonesia source path: click **Start Indonesia OJK crypto trading review** to load `Jakarta OJK Crypto Trading Review` and start in Jurisdiction Checklist for OJK digital financial asset / crypto asset trading controls, PAKD/CPAKD status, SPRINT route, whitelist, product/instrument registration, reporting, governance, main-party competence, consumer-protection, and local-counsel evidence gaps.
   - Optional Malaysia source path: click **Start Malaysia digital asset exchange review** to load `Kuala Lumpur Digital Asset Exchange Review` and start in Jurisdiction Checklist for SC Malaysia DAX/DAC/IEO controls, BNM AML/CFT digital-currency reporting-institution controls, STR, recordkeeping, transparency, no-raw-KYC, and local-counsel evidence gaps.
   - Optional Philippines source path: click **Start Philippines VASP custody review** to load `Manila VASP Custody Review` and start in Jurisdiction Checklist for BSP Circular No. 1108 and BSP Memorandum No. M-2026-003 controls, VASP/CASP counterparty status, BSP registration or Certificate of Authority route, VA exchange/transfer/safekeeping, wallet security, AML/CFT, due-diligence, STR, recordkeeping, no-raw-KYC, and local-counsel evidence gaps.
   - Optional South Africa source path: click **Start South Africa CASP Travel Rule review** to load `Cape Town CASP Travel Rule Review` and start in Jurisdiction Checklist for FSCA crypto-asset financial-product and FIC Directive 9 Travel Rule controls, CASP/FSP licence route, advice/intermediary/investment-management scope, RMCP, counterparty due-diligence, unhosted-wallet, recordkeeping, no-raw-KYC, and local-counsel evidence gaps.
   - Optional UK source path: click **Start UK cryptoasset AML review** to load `Thames Cryptoasset AML Review` and start in Jurisdiction Checklist for FCA cryptoasset AML/CTF, MLR registration, MLRO, BWRA/CRA, sanctions, SAR, transaction-monitoring, Travel Rule, record-retrieval evidence gaps, and counsel export.
   - Optional Germany source path: click **Start Germany MiCAR custody review** to load `RhineVault MiCAR Custody Review` and start in Jurisdiction Checklist for BaFin/MiCAR CASP service-scope, Article 60/62, Article 75 custody, client-position, segregation, return-process, means-of-access, and local-counsel evidence gaps.
   - Optional Swiss source path: click **Start Swiss FINMA stablecoin review** to load `Helvetia Stablecoin Review` and start in Jurisdiction Checklist for FINMA ICO token-classification, FINMA Guidance 06/2024 stablecoin issuer, bank-guarantee, AML, sanctions, transfer-risk evidence gaps, and counsel export.
   - Optional US stablecoin source path: click **Start US GENIUS Act stablecoin review** to load `LibertyDollar Stablecoin Review` and start in Jurisdiction Checklist for GENIUS Act permitted-issuer route, reserve, redemption, BSA/AML, sanctions, custody, and no-raw-KYC evidence gaps.
   - Optional EU stablecoin source path: click **Start EU MiCA ART/EMT stablecoin review** to load `EuroMint MiCA Stablecoin Review` and start in Jurisdiction Checklist for MiCA ART/EMT classification, issuer authorisation or notification route, white paper, reserve, redemption, recovery, custody, and no-raw-customer-record evidence gaps.
   - Optional UK stablecoin source path: click **Start UK qualifying stablecoin issuer review** to load `SterlingMint Stablecoin Review` and start in Jurisdiction Checklist for UKQS issuer route, admission or distribution scope, disclosures, backing assets, safeguarding, redemption, systemic-transition, and no-raw-customer-record evidence gaps.
   - Optional UAE source path: click **Start UAE VARA operating review** to load `Dubai VARA Operating Review` and start in Jurisdiction Checklist for VARA activity-scope, licensing, compliance management, AML/CFT, client virtual asset custody, proof-of-reserves, reconciliation evidence gaps, and counsel export.
   - Optional marketing path: click **Start Marketing claims review** to load `SignalBridge Marketing Review`, open Counsel Pack, confirm the **Marketing Claims Review** template, and review US FTC / EU MiCA / UK FCA / UAE VARA 2024 promotion, marketing-communication, risk-warning, KOL/incentive, and recordkeeping source gaps. If a project adds investment adviser, private-fund, Form ADV, testimonial, endorsement, or performance-presentation facts, show the US SEC Investment Adviser Marketing Rule source control as a separate counsel-routing trigger.
   - On the marketing path, show the first-screen **Workspace Action Queue** item **Recertify stale evidence** for the stale source-linked `Claims inventory` record, then click it to route into Evidence Ledger. Not legal advice.
   - Show expected artifacts: Evidence Manifest, GRC Ticket Export, and Counsel Pack Markdown.
   - Show the scenario proof strip for workflow step count, expected artifact count, source-control signals, and the Not legal advice proof-signal boundary.
   - Confirm the scenario boundary: Not legal advice. Demo scenarios are synthetic audit preparation paths only.
   - Proof strip screenshot: `docs/assets/screenshots/demo-scenario-proof-signals.jpg`.
   - Screenshot: `docs/assets/screenshots/demo-scenario-library-ai-workflow.png`.
   - DAO source screenshot: `docs/assets/screenshots/dao-governance-source-graph.png`.
   - Brazil path screenshot: `docs/assets/screenshots/demo-scenario-library-brazil-vasp.png`.
   - Singapore path screenshot: `docs/assets/screenshots/singapore-dpt-custody-source-graph.png`.
   - Hong Kong HKMA stablecoin path screenshot: `docs/assets/screenshots/hong-kong-stablecoin-source-graph.png`.
   - Hong Kong tokenised product path screenshot: `docs/assets/screenshots/hong-kong-tokenised-product-source-graph.png`.
   - US GENIUS Act stablecoin path screenshot: `docs/assets/screenshots/us-genius-stablecoin-source-graph.png`.
   - EU MiCA ART/EMT stablecoin path screenshot: `docs/assets/screenshots/eu-mica-stablecoin-issuer-source-graph.png`.
   - UK qualifying stablecoin path screenshot: `docs/assets/screenshots/uk-stablecoin-issuer-source-graph.png`.
   - Japan path screenshot: `docs/assets/screenshots/japan-crypto-custody-source-graph.png`.
   - Canada path screenshot: `docs/assets/screenshots/canada-ctp-custody-source-graph.png`.
   - Australia path screenshot: `docs/assets/screenshots/australia-digital-asset-source-graph.png`.
   - Korea path screenshot: `docs/assets/screenshots/korea-vasp-user-protection-source-graph.png`.
   - India path screenshot: `docs/assets/screenshots/india-vda-pmla-source-graph.png`.
   - Thailand path screenshot: `docs/assets/screenshots/thailand-digital-asset-custody-source-graph.png`.
   - Indonesia path screenshot: `docs/assets/screenshots/indonesia-ojk-crypto-trading-source-graph.png`.
   - Malaysia path screenshot: `docs/assets/screenshots/malaysia-digital-asset-exchange-source-graph.png`.
   - Philippines path screenshot: `docs/assets/screenshots/philippines-vasp-custody-source-graph.png`.
   - South Africa path screenshot: `docs/assets/screenshots/south-africa-casp-travel-rule-source-graph.png`.
   - UK path screenshot: `docs/assets/screenshots/uk-cryptoasset-aml-source-graph.png`.
   - Germany path screenshot: `docs/assets/screenshots/germany-micar-custody-source-graph.png`.
   - UAE VARA operating source screenshot: `docs/assets/screenshots/uae-vara-operating-source-graph.png`.
   - Marketing path screenshot: `docs/assets/screenshots/demo-scenario-library-marketing-claims.png`.
   - UAE VARA 2024 marketing source screenshot: `docs/assets/screenshots/uae-vara-marketing-source-graph.png`.
   - EU MiCA marketing source screenshot: `docs/assets/screenshots/eu-mica-marketing-source-graph.png`.
   - Marketing template screenshot: `docs/assets/screenshots/counsel-pack-marketing-claims-template.png`.

1. **Review command center**
   - Start on the **Regulatory Command Center** at the top of the workbench.
   - Click **Download Cockpit Handoff JSON** to show the first-screen status, journey steps, action queue, manifest/export state, handoff hash, and Not legal advice boundary.
   - Click **Download Action Queue JSON** to show the ranked recovery work, queue hash, summary counts, and Not legal advice boundary as a separate metadata-only artifact.
   - Show the **Workspace Journey** from project facts -> model/evidence intake -> risk/source graph -> human review -> vault/manifest -> counsel export, including the current next action and the Not legal advice boundary.
   - Show jurisdiction readiness, official-source clause triggers, the Regulatory Control Matrix, Jurisdiction Evidence Map, Jurisdiction Readiness Digest, Source Freshness Board, evidence gap queue, manifest status, and the Not legal advice boundary.
   - Click **Download Control Matrix JSON** to show the metadata-only handoff with evidence coverage, source review status, local counsel route, next action, and no compliance conclusion.
   - Click **Download Jurisdiction Evidence Map JSON** to show per-jurisdiction open evidence requests, source topics, local counsel roles, map hash, and the Not legal advice boundary.
   - Click **Download Jurisdiction Digest JSON** to show one per-jurisdiction handoff digest with evidence blockers, source freshness blockers, local counsel route status, digest hash, and no compliance conclusion.
   - Show **Regulatory Source Coverage**, then click **Download Source Coverage JSON** to show jurisdiction-level source coverage, review freshness, open evidence requests, local counsel roles, coverage hash, and the Not legal advice boundary.
   - Click **Download Source Freshness Board JSON** to show metadata-missing, overdue, due-soon, and scheduled source review lanes with a board hash and no legal conclusion.
   - Show the **Local Counsel Routing Plan**, then click **Download Local Counsel Routing JSON** to show jurisdiction + counsel-role routes, route priority, evidence gaps, source-review state, plan hash, and the Not legal advice boundary.
   - Click **Download Source Review Packet JSON** to show the metadata-only source refresh action queue, clause-match targets, packet hash, and Not legal advice boundary.
   - When the Phase 2 API is running, enter `http://127.0.0.1:8787` in **Source Review API base URL**, click **Sync Source Review Ledger**, then click **Refresh Source Review Packet** and **Download Server Source Review Packet JSON** to show ledger hashes, review counts, packet hash, recovery actions, and no reviewer-note body text from `GET /api/workspaces/:workspaceId/source-reviews/packet`.
   - Show the **Workspace Action Queue** item **Recover final handoff packet** when the Handoff Recovery Playbook still has open steps, then click **Open handoff recovery** to route into Sources. Not legal advice.
   - Screenshot: `docs/assets/screenshots/workspace-action-handoff-recovery.png`.
   - To demo source freshness at a planned handoff date, set **Source review as-of date** to a future ISO date such as `2026-10-02`; then click the **Workspace Action Queue** item **Open source approval queue** to focus the **Source Update Approval Queue**. Click **Download Source Approval Queue JSON** to show that source updates cannot affect matching behavior until counsel or compliance review records refreshed source metadata.
   - Screenshot: `docs/assets/screenshots/workspace-action-source-approval-focus.png`.
   - When the Phase 2 API is running, enter `http://127.0.0.1:8787` in **Source Approval API base URL** and click **Sync Source Approval Queue** to persist metadata-only source approval records while confirming matching behavior is unchanged. Click **Refresh Source Approval Packet**, then **Download Server Source Approval Packet JSON**, to show queue hashes, approval-gate counts, packet hash, recovery actions, and no reviewer-note body text from `GET /api/workspaces/:workspaceId/source-approvals/packet`.
   - Screenshot: `docs/assets/screenshots/regulatory-command-center.png`.
   - Screenshot: `docs/assets/screenshots/workspace-cockpit-handoff.png`.
   - Screenshot: `docs/assets/screenshots/workspace-action-queue-export.png`.
   - Screenshot: `docs/assets/screenshots/workspace-journey.png`.
   - Screenshot: `docs/assets/screenshots/jurisdiction-evidence-map.png`.
   - Screenshot: `docs/assets/screenshots/regulatory-source-coverage.png`.
   - Screenshot: `docs/assets/screenshots/source-freshness-board.png`.
   - Screenshot: `docs/assets/screenshots/local-counsel-routing-plan.png`.
   - Screenshot: `docs/assets/screenshots/source-review-packet.png`.
   - Screenshot: `docs/assets/screenshots/source-update-approval-queue.png`.
   - Screenshot: `docs/assets/screenshots/source-approval-api-sync.png`.
   - Optional DAO path screenshot after **Start DAO proposal review**: `docs/assets/screenshots/dao-governance-source-graph.png`.
   - Optional RWA Regulation D screenshot after **Start High-risk RWA launch**: `docs/assets/screenshots/us-reg-d-rwa-source-control.png`.
   - Optional RWA OFAC virtual-currency sanctions screenshot after **Start High-risk RWA launch**: `docs/assets/screenshots/us-ofac-rwa-source-control.png`.
   - Optional RWA NYDFS BitLicense/custody screenshot after **Start High-risk RWA launch**: `docs/assets/screenshots/nydfs-rwa-source-control.png`.
   - Optional RWA custody screenshot after **Start High-risk RWA launch**: `docs/assets/screenshots/eu-mica-casp-custody-source-graph.png`.
   - Optional RWA EU DLT Pilot Regime screenshot after **Start High-risk RWA launch**: `docs/assets/screenshots/eu-dlt-pilot-rwa-source-control.png`.
   - Optional AI path screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/ai-workflow-regulatory-source-controls.png`.
   - Optional Singapore Agentic AI path screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/singapore-agentic-ai-workflow-source-control.png`.
   - Optional US NIST AI path screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/us-nist-ai-workflow-source-graph.png`.
   - Optional NYC AEDT AI path screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/nyc-aedt-ai-workflow-source-graph-focused.png`.
   - Optional California CCPA ADMT AI path screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/california-ccpa-admt-ai-workflow-source-graph-focused.png`.
   - Optional Colorado ADMT AI path screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/colorado-admt-ai-workflow-source-graph-focused.png`.
   - Optional EU AI Act Article 50 transparency screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/eu-ai-act-article-50-transparency-source-control.png`.
   - Optional EU AI Act justice/ADR perimeter screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/eu-ai-act-justice-adr-source-gap-triage.png`.
   - Optional Brazil path screenshot after **Start Brazil VASP source review**: `docs/assets/screenshots/regulatory-command-center-brazil-source-graph.png`.
   - Optional Singapore path screenshot after **Start Singapore DPT custody review**: `docs/assets/screenshots/singapore-dpt-custody-source-graph.png`.
   - Optional Hong Kong path screenshot after **Start Hong Kong VATP custody review**: `docs/assets/screenshots/hong-kong-vatp-source-graph.png`.
   - Optional Hong Kong HKMA stablecoin path screenshot after **Start Hong Kong HKMA stablecoin issuer review**: `docs/assets/screenshots/hong-kong-stablecoin-source-graph.png`.
   - Optional Hong Kong tokenised product path screenshot after **Start Hong Kong tokenised product review**: `docs/assets/screenshots/hong-kong-tokenised-product-source-graph.png`.
   - Optional Japan path screenshot after **Start Japan crypto custody review**: `docs/assets/screenshots/japan-crypto-custody-source-graph.png`.
   - Optional Canada path screenshot after **Start Canada CTP custody review**: `docs/assets/screenshots/canada-ctp-custody-source-graph.png`.
   - Optional Australia path screenshot after **Start Australia digital asset review**: `docs/assets/screenshots/australia-digital-asset-source-graph.png`.
   - Optional Korea path screenshot after **Start Korea VASP user protection review**: `docs/assets/screenshots/korea-vasp-user-protection-source-graph.png`.
   - Optional India path screenshot after **Start India VDA PMLA review**: `docs/assets/screenshots/india-vda-pmla-source-graph.png`.
   - Optional Thailand path screenshot after **Start Thailand digital asset custody review**: `docs/assets/screenshots/thailand-digital-asset-custody-source-graph.png`.
   - Optional Indonesia path screenshot after **Start Indonesia OJK crypto trading review**: `docs/assets/screenshots/indonesia-ojk-crypto-trading-source-graph.png`.
   - Optional Malaysia path screenshot after **Start Malaysia digital asset exchange review**: `docs/assets/screenshots/malaysia-digital-asset-exchange-source-graph.png`.
   - Optional Philippines path screenshot after **Start Philippines VASP custody review**: `docs/assets/screenshots/philippines-vasp-custody-source-graph.png`.
   - Optional South Africa path screenshot after **Start South Africa CASP Travel Rule review**: `docs/assets/screenshots/south-africa-casp-travel-rule-source-graph.png`.
   - Optional UK path screenshot after **Start UK cryptoasset AML review**: `docs/assets/screenshots/uk-cryptoasset-aml-source-graph.png`.
   - Optional Germany path screenshot after **Start Germany MiCAR custody review**: `docs/assets/screenshots/germany-micar-custody-source-graph.png`.
   - Optional Swiss path screenshot after **Start Swiss FINMA stablecoin review**: `docs/assets/screenshots/swiss-finma-stablecoin-source-graph.png`.
   - Optional US GENIUS Act stablecoin path screenshot after **Start US GENIUS Act stablecoin review**: `docs/assets/screenshots/us-genius-stablecoin-source-graph.png`.
   - Optional EU MiCA ART/EMT stablecoin path screenshot after **Start EU MiCA ART/EMT stablecoin review**: `docs/assets/screenshots/eu-mica-stablecoin-issuer-source-graph.png`.
   - Optional UK qualifying stablecoin path screenshot after **Start UK qualifying stablecoin issuer review**: `docs/assets/screenshots/uk-stablecoin-issuer-source-graph.png`.
   - Optional marketing path screenshot after **Start Marketing claims review**: `docs/assets/screenshots/demo-scenario-library-marketing-claims.png`.
   - Optional VARA 2024 marketing source screenshot after **Start Marketing claims review**: `docs/assets/screenshots/uae-vara-marketing-source-graph.png`.
   - Optional EU MiCA marketing source screenshot after **Start Marketing claims review**: `docs/assets/screenshots/eu-mica-marketing-source-graph.png`.
   - Optional marketing template screenshot after **Start Marketing claims review**: `docs/assets/screenshots/counsel-pack-marketing-claims-template.png`.
   - Optional Evidence Ledger draft safety screenshot: open **Evidence Ledger**, enter a manual evidence draft that mentions private-key-like material or direct identifiers, and confirm **Evidence Draft Boundary Preview** shows redacted recovery guidance before downstream handoff. Screenshot: `docs/assets/screenshots/evidence-draft-boundary-preview.png`.
   - Optional Evidence Ledger safety screenshot: open **Evidence Ledger**, choose a local file whose filename includes raw KYC, credential, or private-key-like metadata, and confirm **Local File Metadata Boundary** blocks the intake before hashing with redacted recovery guidance. Screenshot: `docs/assets/screenshots/local-file-metadata-boundary-blocker.png`.
   - Screenshot: `docs/assets/screenshots/regulatory-control-matrix.png`.

2. **Connect model**
   - Open **AI Review**.
   - Keep **Mock local reviewer** selected for the live demo, then click **Validate Model Connect**.
   - Show the receipt, Model Access Workflow, Model Connection Readiness, and Redaction Gate.
   - In **Integration Readiness Registry**, click **Refresh Server Provider Policy** after validation to show the receipt-aware policy refresh. The request sends only provider, mode, status, and blocker metadata; session API keys, endpoint hosts, model names, provider labels, and raw evidence are not sent.
   - Fill **Secret Policy Evaluation** with synthetic policy metadata, click **Evaluate Server Secret Policy**, and show that the report can become ready while **External proxying** remains disabled. Download the Secret Policy JSON if time allows. Not legal advice.
   - Screenshot: `docs/assets/screenshots/demo-01-model-connect.png`.

3. **Select or upload evidence**
   - Open **Evidence Ledger**.
   - Apply the **tokenized yield / RWA** evidence template, or add one local synthetic evidence item.
   - For the AI alternate path, apply the **AI compliance workflow** evidence template and show source references such as `regulatory control: control-us-aba-formal-opinion-512-generative-ai-law-practice`, `regulatory control: control-us-nist-ai-rmf-governance`, `regulatory control: control-us-nyc-local-law-144-aedt-employment-decision-governance`, `regulatory control: control-us-california-ccpa-admt-consumer-rights-governance`, `regulatory control: control-us-colorado-admt-consequential-decision-governance`, `regulatory control: control-eu-ai-act-ai-literacy-governance`, and `regulatory control: control-uk-ico-ai-data-protection-governance`.
   - Include a source reference such as `regulatory control: control-eu-mica-title-ii-white-paper`, sync to the local Evidence Vault API, and show the vault record's **Controls:** line plus manifest hash. Click **Download Vault Manifest JSON** to show the server manifest is a metadata-only artifact, then show **Evidence Vault Lineage Digest** and click **Download Lineage Digest JSON** to prove active/replaced/rejected counts, manifest hash, and linked controls are exportable without source-note body text. Use the Phase 2 lineage recovery route when rejected records or missing manifest lineage need a packet hash and next actions before final handoff. In the AI alternate path, show **Evidence Vault Control Coverage** with the ABA Formal Opinion 512, US NIST AI RMF, NYC AEDT, California CCPA ADMT, Colorado ADMT, EU AI Act AI-literacy, EU AI Act Article 50 transparency, EU AI Act justice/ADR perimeter, and UK ICO control IDs linked across vault records and manifest items. Not legal advice.
   - Change one synthetic evidence item to `under-review`, then `rejected`, then click **Create replacement** to show the local ledger preserves the rejected record and opens a new metadata-only replacement request rather than treating rejection as legal approval or deletion. Not legal advice.
   - Show that local files are hashed as metadata and raw file bytes are not stored in the ledger.
   - Show **Evidence Retention Readiness** and confirm normal demo evidence is metadata-only or needs human confirmation before vault sync. Not legal advice.
   - After at least one Pack Version has been saved, edit a synthetic evidence item and show **Manifest Drift Guard** in Evidence Ledger: the current manifest hash should differ from the saved Counsel Pack version or server export target, and **Download Manifest Drift JSON** should remain metadata-only. Not legal advice.
   - Optional marketing path: after **Start Marketing claims review**, open **Evidence Ledger** and show **Evidence Recertification Queue** flagging the stale source-linked `Claims inventory` record. Click **Mark Claims inventory recertified** to refresh the metadata timestamp and clear the queue. Download the Recertification Queue JSON if time allows. Not legal advice.
   - Screenshot: `docs/assets/screenshots/demo-02-evidence-ledger.png`.
   - Recertification screenshot: `docs/assets/screenshots/evidence-recertification-queue.png`.
   - Review-stage status screenshot: `docs/assets/screenshots/evidence-ledger-review-stage-statuses.png`.
   - Rejected replacement screenshot: `docs/assets/screenshots/evidence-ledger-rejected-replacement.png`.
   - Vault manifest screenshot: `docs/assets/screenshots/evidence-vault-manifest-download.png`.
   - Vault lineage digest screenshot: `docs/assets/screenshots/evidence-vault-lineage-digest.png`.
   - AI control-coverage screenshot: `docs/assets/screenshots/evidence-vault-control-coverage-ai.png`.
   - Manifest drift screenshot: `docs/assets/screenshots/manifest-drift-guard-stale-version.png`.

4. **Run risk audit**
   - Open **Risk Audit**.
   - Show deterministic flags, source-linked issue cards, evidence workflow coverage, and remediation owners.
   - If a missing item is useful for narration, click **Request evidence** to push a requested item into Evidence Ledger.
   - Screenshot: `docs/assets/screenshots/demo-03-risk-audit.png`.

5. **Route human review**
   - Open **Human Review**.
   - Set one evidence item to `needs-more-evidence`, adjust the due date if useful for narration, save the decision, and show the return message.
   - Show **Human Review Recovery Packet**, click **Download Recovery Packet JSON**, and point out the stable packet hash, returned/rejected counts, recovery actions, redacted reviewer notes, and Not legal advice boundary.
   - Show **Human Review Timeline** with the saved decision, audit log ID, and **Download Review Timeline JSON**.
   - Return to **Evidence Ledger** and show the linked evidence status moved back to `requested`.
   - Screenshot: `docs/assets/screenshots/demo-04-human-review-return.png`.
   - Recovery packet screenshot: `docs/assets/screenshots/human-review-recovery-packet.png`.

6. **Sync vault and gateway journey**
   - Open the **Secure Review Workspace** panel at the top of the app.
   - In **Integration Readiness Registry**, show **Model Gateway Provider Policy** with mock-only enabled status, disabled external model adapters, required provider controls, **Secret Policy Evaluation**, **Download Provider Policy JSON**, and **Download Secret Policy JSON**. Not legal advice.
   - In **Integration Enablement Dossier**, show the dossier hash, six consolidated policy reports, **Policy Receipt Coverage** for object storage, document parser, chain anchor, and GRC destination receipts, disabled external enablement state, and click **Download Enablement Dossier JSON** to show a metadata-only handoff with `externalEnablementAllowed: false`. Not legal advice.
   - Screenshot: `docs/assets/screenshots/integration-policy-receipt-coverage.png`.
   - Enter `http://127.0.0.1:8787` in **Provider Policy API base URL**, click **Refresh Server Provider Policy**, and show **Server provider policy synced**. If the API is down, show the recovery action instead of collecting credentials.
   - In **Object Storage Policy Evaluation**, enter `http://127.0.0.1:8787`, fill synthetic owner/retention/deletion metadata, approve encryption, bucket allowlist, access logging, lifecycle policy, no-sensitive-material, and human-review controls, then click **Evaluate Server Storage Policy**. Show **Storage policy report synced**, `10/10`, and **External storage: Disabled**. Download Storage Policy JSON if time allows. Not legal advice.
   - In **Document Parser Policy Evaluation**, enter `http://127.0.0.1:8787`, fill synthetic owner, document-size, raw-retention, deletion-SLA, and parser-purpose metadata, approve redaction before parsing, no model training use, parser access logging, no-sensitive-material, and human-review controls, then click **Evaluate Server Parser Policy**. Show **Parser policy report synced** and **External parsing: Disabled**. Download Parser Policy JSON if time allows. Not legal advice.
   - In **Chain Anchor Policy Evaluation**, enter `http://127.0.0.1:8787`, fill synthetic owner, `ethereum-sepolia`, wallet custody model, signer role, approve transaction logging, privacy review, public payload limits, user consent, no-raw-evidence-on-chain, and human-review controls, then click **Evaluate Server Anchor Policy**. Show **Anchor policy report synced**, `anchorMode: simulated-only`, and **External anchoring: Disabled**. Download Anchor Policy JSON if time allows. Not legal advice.
   - In **GRC Destination Policy Evaluation**, enter `http://127.0.0.1:8787`, fill synthetic owner, destination system such as `jira`, destination queue such as `LEGAL-AUDIT`, approve field mapping, authentication policy, export redaction, ticket ownership, retry/audit logging, no-sensitive-material, and human-review controls, then click **Evaluate Server GRC Policy**. Show **GRC policy report synced** and **External tickets: Disabled**. Download GRC Policy JSON if time allows. Not legal advice.
   - Enter `http://127.0.0.1:8787` in **Secure Review API base URL**.
   - Click **Run Secure Review Journey**.
   - Show the Evidence Vault manifest hash, Model Gateway response hash, **Model Gateway Evaluation** payload/response/source-evidence hashes, the automatically queued Human Review request ID, **Server Model Run Ledger**, **Download Model Run Receipt JSON**, receipt hash confirmation, **Audit Log Export** action counts/last action, recovery next actions, JSON download actions, and Not legal advice boundary.
   - Screenshot: `docs/assets/screenshots/demo-05-secure-review-journey.png`.
   - Model run receipt screenshot: `docs/assets/screenshots/model-run-receipt-download.png`.
   - Integration dossier screenshot: `docs/assets/screenshots/integration-enablement-dossier.png`.
   - Empty evidence chain-anchor recovery screenshot: `docs/assets/screenshots/empty-evidence-chain-anchor-blocked.png`.
   - Storage policy screenshot: `docs/assets/screenshots/object-storage-policy-evaluation.png`.
   - Parser policy screenshot: `docs/assets/screenshots/document-parser-policy-evaluation.png`.
   - Chain anchor policy screenshot: `docs/assets/screenshots/chain-anchor-policy-evaluation.png`.
   - GRC destination policy screenshot: `docs/assets/screenshots/grc-destination-policy-evaluation.png`.

7. **Export counsel pack**
   - Open **Counsel Pack**.
   - Show the recommended **Export template**, then switch to **AI Governance Review** or another template to show the Markdown agenda and evidence focus update without changing deterministic risk scoring.
   - Show **Export Safety Gate**. In the normal path, warnings are visible for human confirmation and blocked counts must be zero before handoff.
   - Show **Manifest Drift Guard** and **Counsel Handoff Checklist** with checklist hash, handoff allowed/blocked state, Evidence Manifest, Manifest Drift Guard, Evidence Recertification Queue, Evidence Vault Lineage Digest, Regulatory Source Pack, Counsel Review Status, Counsel Pack Version, server export record, and Submission Pack readiness. Click **Download Handoff Checklist JSON** to show the metadata-only final handoff checklist. Not legal advice.
   - Show Regulatory Source Graph, Model Intake summary, AI event hashes if a model run was created, counsel review statuses, manifest hash, remediation queue, evidence recertification queue hash when stale evidence is open, source pack hash, source review status, Source Freshness Board hash/lanes, and any Source Update Approval Queue gates in the Markdown preview.
   - Click **Save Pack Version**, update one counsel review status, then click **Save Pack Version** again to show the export diff, **Download Version JSON**, and **Download Diff JSON** actions.
   - Open **Human Review**, filter **Target type** to **Counsel Pack**, and show the saved Pack Version queued for reviewer decision before external handoff. This review status is audit-prep workflow metadata only, not legal approval.
   - Enter `http://127.0.0.1:8787` in **Server export API base URL**, then click **Create Server Export Record** to persist a metadata-only server record for the latest Pack Version.
   - Click **Download Markdown**. Optionally click **Download Version JSON**, **Download Diff JSON**, **Download Manifest JSON**, and **Create Simulated Anchor Receipt**.
   - Screenshot: `docs/assets/screenshots/demo-06-counsel-pack-export.png`.
   - Diff download screenshot: `docs/assets/screenshots/counsel-pack-diff-download.png`.
   - Handoff checklist screenshot: `docs/assets/screenshots/counsel-handoff-checklist.png`.
   - Manifest drift screenshot: `docs/assets/screenshots/manifest-drift-guard-stale-version.png`.
   - Source freshness handoff screenshot: `docs/assets/screenshots/counsel-pack-source-freshness-board.png`.
   - Counsel Pack Human Review screenshot: `docs/assets/screenshots/human-review-counsel-pack-queue.png`.

8. **Download submission pack**
   - Open **Sources**.
   - Show **Judge Handoff Bundle** with one bundle hash plus Submission Pack JSON, Demo Runbook JSON, Export Safety Inventory JSON, and Counsel Handoff Checklist JSON artifact hashes/statuses.
   - If the bundle is not ready, click **Open Counsel Pack** or **Open Judge Demo Readiness** from the recovery actions to show the handoff blocker routes to a real workspace surface. Not legal advice.
   - Click **Download Judge Handoff Bundle JSON** to show a single metadata-only packet for evaluator handoff. Not legal advice.
   - Show **Handoff Recovery Playbook** with the playbook hash, ordered recovery steps, target workbench tabs, redacted reasons, and **Download Recovery Playbook JSON**. Click **Open Evidence Ledger** on a Manifest Drift Guard step if the current demo still needs a fresh vault/export target. Not legal advice.
   - Show **Export Safety Inventory** with inventory hash, boundary status, export handoff allowed/blocked state, artifact statuses, Model Gateway Evaluation hash/status after Secure Review Journey, Demo Runbook JSON hash/status, Evidence Vault Lineage Digest hash/status after vault sync, Source Freshness Board hash/status when available, and the Not legal advice boundary.
   - Model evaluation inventory screenshot: `docs/assets/screenshots/export-safety-model-gateway-evaluation.jpg`.
   - Vault lineage artifact screenshot: `docs/assets/screenshots/export-safety-vault-lineage-digest.png`.
   - Click **Download Export Inventory JSON** to show the metadata-only redacted handoff inventory.
   - Show the generated **Submission Pack** with pack hash, manifest hash, Regulatory Source Pack hash, Regulatory Source Coverage hash/status, Demo Runbook hash, export safety summary, demo readiness, required assets, hackathon mapping, and known limitations.
   - Click **Download Submission Pack JSON** for the judge-facing metadata artifact.
   - Click **Download Demo Runbook JSON** from the same Sources handoff area to show the clean-clone path is exportable without returning to Project Workspace.
   - Confirm the boundary: Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only.
   - Screenshot: `docs/assets/screenshots/judge-handoff-bundle.png`.
   - Screenshot: `docs/assets/screenshots/handoff-recovery-playbook.png`.
   - Screenshot: `docs/assets/screenshots/export-safety-inventory.png`.
   - Screenshot: `docs/assets/screenshots/sources-demo-runbook-handoff.png`.
   - Screenshot: `docs/assets/screenshots/submission-pack.png`.

## Error-State Checks

- **Model connection failure:** choose **OpenAI-compatible**, leave Base URL/model/API key incomplete, click **Validate Model Connect**, then run **Secure Review Journey**. The workspace should show a recoverable **Fix Model Connect** action. No API key is persisted.
- **Evidence missing:** start a new project and click **Run Secure Review Journey** before adding evidence. The workspace should direct the user to add metadata-only evidence first.
- **Workspace persistence recovery:** start a new project, enter API-key-like material in **AI usage**, and confirm **Workspace autosave blocked** appears in Project Workspace. The local project snapshot should not contain the unsafe string, and the recovery notice should repeat the Not legal advice boundary. Screenshot: `docs/assets/screenshots/workspace-persistence-recovery.png`.
- **Model Gateway policy failure:** with a server test fixture or API client, submit a Model Gateway request that fails Redaction Gate or allowed data-class policy. The API should persist a safe failure receipt and return a run ID, retry state, and remediation steps without raw payloads or credentials. `GET /api/workspaces/:workspaceId/model-runs/recovery` should return the blocked run in a metadata-only recovery packet with a stable packet hash and non-empty recovery next actions. The UI should show the Model Gateway remediation state when the Secure Review Journey receives that response.
- **Review returned:** save a Human Review decision as `needs-more-evidence`; linked evidence should move to `requested` for rework and the review timeline should record the decision with an audit log ID.
- **Rejected vault evidence:** refresh **Evidence Vault Sync** after the backend has a rejected vault record, edit the replacement reason, and click **Replace rejected evidence**. The old record should remain visible as `superseded`, the new record should show `received`, and the manifest hash should update. Not legal advice.
- **Duplicate vault evidence:** sync one safe metadata-only evidence item to the local API, then click **Sync Evidence Vault** again without changing the item. The UI should show `EVIDENCE_DUPLICATE_HASH`, the existing duplicate evidence ID, duplicate status, recovery action, and the Not legal advice API boundary.
- **Server export blocked:** try **Create Server Export Record** before saving a Pack Version, or point **Server export API base URL** at an inactive server. The UI should require a saved version or show a recoverable metadata export error without losing local Pack Version data.
- **Retention blocked:** add a disposable evidence item that mentions a private-key-like value, API-key-like token, or raw KYC packet, then stay in **Evidence Ledger**. **Evidence Retention Readiness** should show **Blocked retention**, redact detected material in snippets, disable **Sync Evidence Vault**, show **Evidence Retention Remediation Queue**, keep **Download Retention Policy JSON** and **Download Remediation Queue JSON** available, and show a Not legal advice boundary. Delete or replace that evidence item before continuing the normal demo path.
- **Recertification due:** load `SignalBridge Marketing Review`, open **Evidence Ledger**, and confirm **Evidence Recertification Queue** shows a P0 source-linked item for `Claims inventory`; click **Mark Claims inventory recertified** and confirm the queue moves to ready without changing raw evidence content. Not legal advice.
- **Export Safety Gate blocked:** add a disposable evidence item that mentions a private-key-like value, API-key-like token, or raw KYC packet, then open **Counsel Pack**. The gate should show **Blocked for export**, redact the detected material in snippets, and disable Markdown/PDF, manifest JSON, simulated anchor, Pack Version save, and server export actions. Delete or replace that evidence item before continuing the normal demo path. Not legal advice.
- **Export Safety Inventory blocked:** add a disposable evidence item that mentions a private-key-like value, API-key-like token, or raw KYC packet, then open **Sources**. The inventory should show **Export handoff blocked**, list redacted blockers, keep **Download Export Inventory JSON** available for remediation review, and avoid echoing secrets or raw KYC text. Delete or replace that evidence item before continuing. Not legal advice.
- **GRC destination policy blocked:** paste a disposable API-key-like token or external ticket-write instruction into **GRC Destination Policy Evaluation** notes, then click **Evaluate Server GRC Policy**. The report should block the metadata boundary, keep external ticket creation disabled, avoid echoing the unsafe text, and show the Not legal advice boundary. Remove the unsafe note before continuing.
- **Integration enablement blocked:** add unsafe disposable evidence or unsafe policy metadata, then return to **Integration Readiness Registry**. **Integration Enablement Dossier** should move to blocked, redact unsafe text in blockers, keep `externalEnablementAllowed: false`, and still allow the metadata-only JSON download for remediation review. Not legal advice.

## Closing Line

LexProof's trust layer is the structured workspace: deterministic risk rules, source-linked issue cards, metadata-only evidence vault sync, duplicate-hash checks, rejected-evidence replacement lineage, model-run hash receipts, human review timelines, manifest hashes, source-pack hashes, local counsel-pack versions, and server export metadata records. Every output remains audit preparation material. Not legal advice.
