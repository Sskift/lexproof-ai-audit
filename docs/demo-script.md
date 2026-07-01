# LexProof AuditOS Hackathon Demo Script

This is the runnable judging path for BLI Legal Tech Hackathon 2. The demo shows audit preparation workflow records only. It is not legal advice, not KYC, and not a real on-chain write.

## Local Setup

Run the API and web app in separate terminals:

```bash
npm install
npm run build:server
DATABASE_URL=file:./demo-review-workspace.db npm run start:api
```

```bash
npm run dev
```

Open `http://127.0.0.1:5173`. Use `http://127.0.0.1:8787` anywhere the UI asks for a Secure Review or Evidence Vault API base URL.

## End-To-End Demo Path

Before step 0, use **Judge Demo Readiness** in **Project Workspace**:

- Confirm **Scenario library**, **Clean clone commands**, **Private credentials not required**, and **Screenshot set** are ready.
- Enter `http://127.0.0.1:8787` in **Demo API base URL**, click **Check Demo API**, and confirm **Phase 2 API preflight ready**.
- Screenshot: `docs/assets/screenshots/judge-demo-readiness.png`.
- This check is readiness metadata only. Not legal advice.

0. **Start from a seeded scenario**
   - In **Project Workspace**, find **Demo Scenario Library**.
   - Click **Start High-risk RWA launch** to load the `YieldPassport` synthetic profile and jump into the Risk Audit surface.
   - Optional DAO source path: click **Start DAO proposal review** to load `ClauseGuard DAO`, open Human Review, then inspect US SEC DAO Report / UK Law Commission DAO source controls in Risk Audit.
   - Optional alternate judge path: click **Start AI legal workflow review** to load `LexAssist Evidence Desk` and start in Model Intake for model governance, human review, EU AI Act / UK ICO AI data protection source controls, and counsel export.
   - Optional Brazil source path: click **Start Brazil VASP source review** to load `Brazil VASP Launch Review` and start in Jurisdiction Checklist for Banco Central/CVM source controls, authorization evidence gaps, AML/CFT review routing, and counsel export.
   - Optional Singapore source path: click **Start Singapore DPT custody review** to load `HarborKey DPT Custody Review` and start in Jurisdiction Checklist for MAS PS-G03 customer-asset safeguard controls, custody evidence gaps, and counsel export.
   - Optional Hong Kong source path: click **Start Hong Kong VATP custody review** to load `HarborBridge VATP Custody Review` and start in Jurisdiction Checklist for SFC VATP client-asset custody controls, wallet governance evidence gaps, and counsel export.
   - Optional marketing path: click **Start Marketing claims review** to load `SignalBridge Marketing Review`, open Counsel Pack, confirm the **Marketing Claims Review** template, and review US FTC / UK FCA / UAE VARA 2024 promotion, risk-warning, KOL/incentive, and recordkeeping source gaps.
   - On the marketing path, show the first-screen **Workspace Action Queue** item **Recertify stale evidence** for the stale source-linked `Claims inventory` record, then click it to route into Evidence Ledger. Not legal advice.
   - Show expected artifacts: Evidence Manifest, GRC Ticket Export, and Counsel Pack Markdown.
   - Confirm the scenario boundary: Not legal advice. Demo scenarios are synthetic audit preparation paths only.
   - Screenshot: `docs/assets/screenshots/demo-scenario-library-ai-workflow.png`.
   - DAO source screenshot: `docs/assets/screenshots/dao-governance-source-graph.png`.
   - Brazil path screenshot: `docs/assets/screenshots/demo-scenario-library-brazil-vasp.png`.
   - Singapore path screenshot: `docs/assets/screenshots/singapore-dpt-custody-source-graph.png`.
   - Marketing path screenshot: `docs/assets/screenshots/demo-scenario-library-marketing-claims.png`.
   - UAE VARA 2024 marketing source screenshot: `docs/assets/screenshots/uae-vara-marketing-source-graph.png`.
   - Marketing template screenshot: `docs/assets/screenshots/counsel-pack-marketing-claims-template.png`.

1. **Review command center**
   - Start on the **Regulatory Command Center** at the top of the workbench.
   - Show the **Workspace Journey** from project facts -> model/evidence intake -> risk/source graph -> human review -> vault/manifest -> counsel export, including the current next action and the Not legal advice boundary.
   - Show jurisdiction readiness, official-source clause triggers, the Regulatory Control Matrix, Jurisdiction Evidence Map, Source Freshness Board, evidence gap queue, manifest status, and the Not legal advice boundary.
   - Click **Download Control Matrix JSON** to show the metadata-only handoff with evidence coverage, source review status, local counsel route, next action, and no compliance conclusion.
   - Click **Download Jurisdiction Evidence Map JSON** to show per-jurisdiction open evidence requests, source topics, local counsel roles, map hash, and the Not legal advice boundary.
   - Click **Download Source Freshness Board JSON** to show metadata-missing, overdue, due-soon, and scheduled source review lanes with a board hash and no legal conclusion.
   - Show the **Local Counsel Routing Plan**, then click **Download Local Counsel Routing JSON** to show jurisdiction + counsel-role routes, route priority, evidence gaps, source-review state, plan hash, and the Not legal advice boundary.
   - Click **Download Source Review Packet JSON** to show the metadata-only source refresh action queue, clause-match targets, packet hash, and Not legal advice boundary.
   - If source review is due, show the **Source Update Approval Queue** and click **Download Source Approval Queue JSON** to show that source updates cannot affect matching behavior until counsel or compliance review records refreshed source metadata.
   - When the Phase 2 API is running, enter `http://127.0.0.1:8787` in **Source Approval API base URL** and click **Sync Source Approval Queue** to persist metadata-only source approval records while confirming matching behavior is unchanged.
   - Screenshot: `docs/assets/screenshots/regulatory-command-center.png`.
   - Screenshot: `docs/assets/screenshots/workspace-journey.png`.
   - Screenshot: `docs/assets/screenshots/jurisdiction-evidence-map.png`.
   - Screenshot: `docs/assets/screenshots/source-freshness-board.png`.
   - Screenshot: `docs/assets/screenshots/local-counsel-routing-plan.png`.
   - Screenshot: `docs/assets/screenshots/source-review-packet.png`.
   - Screenshot: `docs/assets/screenshots/source-update-approval-queue.png`.
   - Screenshot: `docs/assets/screenshots/source-approval-api-sync.png`.
   - Optional DAO path screenshot after **Start DAO proposal review**: `docs/assets/screenshots/dao-governance-source-graph.png`.
   - Optional RWA Regulation D screenshot after **Start High-risk RWA launch**: `docs/assets/screenshots/us-reg-d-rwa-source-control.png`.
   - Optional RWA OFAC virtual-currency sanctions screenshot after **Start High-risk RWA launch**: `docs/assets/screenshots/us-ofac-rwa-source-control.png`.
   - Optional RWA custody screenshot after **Start High-risk RWA launch**: `docs/assets/screenshots/eu-mica-casp-custody-source-graph.png`.
   - Optional AI path screenshot after **Start AI legal workflow review**: `docs/assets/screenshots/ai-workflow-regulatory-source-controls.png`.
   - Optional Brazil path screenshot after **Start Brazil VASP source review**: `docs/assets/screenshots/regulatory-command-center-brazil-source-graph.png`.
   - Optional Singapore path screenshot after **Start Singapore DPT custody review**: `docs/assets/screenshots/singapore-dpt-custody-source-graph.png`.
   - Optional Hong Kong path screenshot after **Start Hong Kong VATP custody review**: `docs/assets/screenshots/hong-kong-vatp-source-graph.png`.
   - Optional marketing path screenshot after **Start Marketing claims review**: `docs/assets/screenshots/demo-scenario-library-marketing-claims.png`.
   - Optional VARA 2024 marketing source screenshot after **Start Marketing claims review**: `docs/assets/screenshots/uae-vara-marketing-source-graph.png`.
   - Optional marketing template screenshot after **Start Marketing claims review**: `docs/assets/screenshots/counsel-pack-marketing-claims-template.png`.
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
   - For the AI alternate path, apply the **AI compliance workflow** evidence template and show source references such as `regulatory control: control-eu-ai-act-ai-literacy-governance` and `regulatory control: control-uk-ico-ai-data-protection-governance`.
   - Include a source reference such as `regulatory control: control-eu-mica-title-ii-white-paper`, sync to the local Evidence Vault API, and show the vault record's **Controls:** line plus manifest hash. Click **Download Vault Manifest JSON** to show the server manifest is a metadata-only artifact. In the AI alternate path, show **Evidence Vault Control Coverage** with the EU AI Act and UK ICO control IDs linked across vault records and manifest items. Not legal advice.
   - Change one synthetic evidence item to `under-review`, then `rejected`, then click **Create replacement** to show the local ledger preserves the rejected record and opens a new metadata-only replacement request rather than treating rejection as legal approval or deletion. Not legal advice.
   - Show that local files are hashed as metadata and raw file bytes are not stored in the ledger.
   - Show **Evidence Retention Readiness** and confirm normal demo evidence is metadata-only or needs human confirmation before vault sync. Not legal advice.
   - Optional marketing path: after **Start Marketing claims review**, open **Evidence Ledger** and show **Evidence Recertification Queue** flagging the stale source-linked `Claims inventory` record. Click **Mark Claims inventory recertified** to refresh the metadata timestamp and clear the queue. Download the Recertification Queue JSON if time allows. Not legal advice.
   - Screenshot: `docs/assets/screenshots/demo-02-evidence-ledger.png`.
   - Recertification screenshot: `docs/assets/screenshots/evidence-recertification-queue.png`.
   - Review-stage status screenshot: `docs/assets/screenshots/evidence-ledger-review-stage-statuses.png`.
   - Rejected replacement screenshot: `docs/assets/screenshots/evidence-ledger-rejected-replacement.png`.
   - Vault manifest screenshot: `docs/assets/screenshots/evidence-vault-manifest-download.png`.
   - AI control-coverage screenshot: `docs/assets/screenshots/evidence-vault-control-coverage-ai.png`.

4. **Run risk audit**
   - Open **Risk Audit**.
   - Show deterministic flags, source-linked issue cards, evidence workflow coverage, and remediation owners.
   - If a missing item is useful for narration, click **Request evidence** to push a requested item into Evidence Ledger.
   - Screenshot: `docs/assets/screenshots/demo-03-risk-audit.png`.

5. **Route human review**
   - Open **Human Review**.
   - Set one evidence item to `needs-more-evidence`, adjust the due date if useful for narration, save the decision, and show the return message.
   - Show **Human Review Timeline** with the saved decision, audit log ID, and **Download Review Timeline JSON**.
   - Return to **Evidence Ledger** and show the linked evidence status moved back to `requested`.
   - Screenshot: `docs/assets/screenshots/demo-04-human-review-return.png`.

6. **Sync vault and gateway journey**
   - Open the **Secure Review Workspace** panel at the top of the app.
   - In **Integration Readiness Registry**, show **Model Gateway Provider Policy** with mock-only enabled status, disabled external model adapters, required provider controls, **Secret Policy Evaluation**, **Download Provider Policy JSON**, and **Download Secret Policy JSON**. Not legal advice.
   - In **Integration Enablement Dossier**, show the dossier hash, six consolidated policy reports, disabled external enablement state, and click **Download Enablement Dossier JSON** to show a metadata-only handoff with `externalEnablementAllowed: false`. Not legal advice.
   - Enter `http://127.0.0.1:8787` in **Provider Policy API base URL**, click **Refresh Server Provider Policy**, and show **Server provider policy synced**. If the API is down, show the recovery action instead of collecting credentials.
   - In **Object Storage Policy Evaluation**, enter `http://127.0.0.1:8787`, fill synthetic owner/retention/deletion metadata, approve encryption, bucket allowlist, access logging, lifecycle policy, no-sensitive-material, and human-review controls, then click **Evaluate Server Storage Policy**. Show **Storage policy report synced**, `10/10`, and **External storage: Disabled**. Download Storage Policy JSON if time allows. Not legal advice.
   - In **Document Parser Policy Evaluation**, enter `http://127.0.0.1:8787`, fill synthetic owner, document-size, raw-retention, deletion-SLA, and parser-purpose metadata, approve redaction before parsing, no model training use, parser access logging, no-sensitive-material, and human-review controls, then click **Evaluate Server Parser Policy**. Show **Parser policy report synced** and **External parsing: Disabled**. Download Parser Policy JSON if time allows. Not legal advice.
   - In **Chain Anchor Policy Evaluation**, enter `http://127.0.0.1:8787`, fill synthetic owner, `ethereum-sepolia`, wallet custody model, signer role, approve transaction logging, privacy review, public payload limits, user consent, no-raw-evidence-on-chain, and human-review controls, then click **Evaluate Server Anchor Policy**. Show **Anchor policy report synced**, `anchorMode: simulated-only`, and **External anchoring: Disabled**. Download Anchor Policy JSON if time allows. Not legal advice.
   - In **GRC Destination Policy Evaluation**, enter `http://127.0.0.1:8787`, fill synthetic owner, destination system such as `jira`, destination queue such as `LEGAL-AUDIT`, approve field mapping, authentication policy, export redaction, ticket ownership, retry/audit logging, no-sensitive-material, and human-review controls, then click **Evaluate Server GRC Policy**. Show **GRC policy report synced** and **External tickets: Disabled**. Download GRC Policy JSON if time allows. Not legal advice.
   - Enter `http://127.0.0.1:8787` in **Secure Review API base URL**.
   - Click **Run Secure Review Journey**.
   - Show the Evidence Vault manifest hash, Model Gateway response hash, **Model Gateway Evaluation** payload/response/source-evidence hashes, the automatically queued Human Review request ID, **Audit Log Export** action counts/last action, JSON download actions, and Not legal advice boundary.
   - Screenshot: `docs/assets/screenshots/demo-05-secure-review-journey.png`.
   - Integration dossier screenshot: `docs/assets/screenshots/integration-enablement-dossier.png`.
   - Storage policy screenshot: `docs/assets/screenshots/object-storage-policy-evaluation.png`.
   - Parser policy screenshot: `docs/assets/screenshots/document-parser-policy-evaluation.png`.
   - Chain anchor policy screenshot: `docs/assets/screenshots/chain-anchor-policy-evaluation.png`.
   - GRC destination policy screenshot: `docs/assets/screenshots/grc-destination-policy-evaluation.png`.

7. **Export counsel pack**
   - Open **Counsel Pack**.
   - Show the recommended **Export template**, then switch to **AI Governance Review** or another template to show the Markdown agenda and evidence focus update without changing deterministic risk scoring.
   - Show **Export Safety Gate**. In the normal path, warnings are visible for human confirmation and blocked counts must be zero before handoff.
   - Show Regulatory Source Graph, Model Intake summary, AI event hashes if a model run was created, counsel review statuses, manifest hash, remediation queue, evidence recertification queue hash when stale evidence is open, source pack hash, source review status, Source Freshness Board hash/lanes, and any Source Update Approval Queue gates in the Markdown preview.
   - Click **Save Pack Version**, update one counsel review status, then click **Save Pack Version** again to show the export diff and version JSON action.
   - Open **Human Review**, filter **Target type** to **Counsel Pack**, and show the saved Pack Version queued for reviewer decision before external handoff. This review status is audit-prep workflow metadata only, not legal approval.
   - Enter `http://127.0.0.1:8787` in **Server export API base URL**, then click **Create Server Export Record** to persist a metadata-only server record for the latest Pack Version.
   - Click **Download Markdown**. Optionally click **Download Version JSON**, **Download Manifest JSON**, and **Create Simulated Anchor Receipt**.
   - Screenshot: `docs/assets/screenshots/demo-06-counsel-pack-export.png`.
   - Source freshness handoff screenshot: `docs/assets/screenshots/counsel-pack-source-freshness-board.png`.
   - Counsel Pack Human Review screenshot: `docs/assets/screenshots/human-review-counsel-pack-queue.png`.

8. **Download submission pack**
   - Open **Sources**.
   - Show **Export Safety Inventory** with inventory hash, boundary status, export handoff allowed/blocked state, artifact statuses, Source Freshness Board hash/status when available, and the Not legal advice boundary.
   - Click **Download Export Inventory JSON** to show the metadata-only redacted handoff inventory.
   - Show the generated **Submission Pack** with pack hash, manifest hash, Regulatory Source Pack hash, demo readiness, required assets, hackathon mapping, and known limitations.
   - Click **Download Submission Pack JSON** for the judge-facing metadata artifact.
   - Confirm the boundary: Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only.
   - Screenshot: `docs/assets/screenshots/export-safety-inventory.png`.
   - Screenshot: `docs/assets/screenshots/submission-pack.png`.

## Error-State Checks

- **Model connection failure:** choose **OpenAI-compatible**, leave Base URL/model/API key incomplete, click **Validate Model Connect**, then run **Secure Review Journey**. The workspace should show a recoverable **Fix Model Connect** action. No API key is persisted.
- **Evidence missing:** start a new project and click **Run Secure Review Journey** before adding evidence. The workspace should direct the user to add metadata-only evidence first.
- **Model Gateway policy failure:** with a server test fixture or API client, submit a Model Gateway request that fails Redaction Gate or allowed data-class policy. The API should persist a safe failure receipt and return a run ID, retry state, and remediation steps without raw payloads or credentials. The UI should show the Model Gateway remediation state when the Secure Review Journey receives that response.
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
