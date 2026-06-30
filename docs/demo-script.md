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
   - Show expected artifacts: Evidence Manifest, GRC Ticket Export, and Counsel Pack Markdown.
   - Confirm the scenario boundary: Not legal advice. Demo scenarios are synthetic audit preparation paths only.
   - Screenshot: `docs/assets/screenshots/demo-scenario-library.png`.

1. **Review command center**
   - Start on the **Regulatory Command Center** at the top of the workbench.
   - Show jurisdiction readiness, official-source clause triggers, the Regulatory Control Matrix, evidence gap queue, manifest status, and the Not legal advice boundary.
   - Click **Download Control Matrix JSON** to show the metadata-only handoff with evidence coverage, source review status, local counsel route, next action, and no compliance conclusion.
   - Screenshot: `docs/assets/screenshots/regulatory-command-center.png`.
   - Screenshot: `docs/assets/screenshots/regulatory-control-matrix.png`.

2. **Connect model**
   - Open **AI Review**.
   - Keep **Mock local reviewer** selected for the live demo, then click **Validate Model Connect**.
   - Show the receipt, Model Access Workflow, Model Connection Readiness, and Redaction Gate.
   - Screenshot: `docs/assets/screenshots/demo-01-model-connect.png`.

3. **Select or upload evidence**
   - Open **Evidence Ledger**.
   - Apply the **tokenized yield / RWA** evidence template, or add one local synthetic evidence item.
   - Include a source reference such as `regulatory control: control-eu-mica-title-ii-white-paper`, sync to the local Evidence Vault API, and show the vault record's **Controls:** line plus manifest hash. Not legal advice.
   - Show that local files are hashed as metadata and raw file bytes are not stored in the ledger.
   - Show **Evidence Retention Readiness** and confirm normal demo evidence is metadata-only or needs human confirmation before vault sync. Not legal advice.
   - Screenshot: `docs/assets/screenshots/demo-02-evidence-ledger.png`.

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
   - In **Integration Readiness Registry**, show **Model Gateway Provider Policy** with mock-only enabled status, disabled external model adapters, required provider controls, and **Download Provider Policy JSON**. Not legal advice.
   - Enter `http://127.0.0.1:8787` in **Secure Review API base URL**.
   - Click **Run Secure Review Journey**.
   - Show the Evidence Vault manifest hash, Model Gateway response hash, **Model Gateway Evaluation** payload/response/source-evidence hashes, Human Review request ID, **Audit Log Export** action counts/last action, JSON download actions, and Not legal advice boundary.
   - Screenshot: `docs/assets/screenshots/demo-05-secure-review-journey.png`.

7. **Export counsel pack**
   - Open **Counsel Pack**.
   - Show the recommended **Export template**, then switch to **AI Governance Review** or another template to show the Markdown agenda and evidence focus update without changing deterministic risk scoring.
   - Show **Export Safety Gate**. In the normal path, warnings are visible for human confirmation and blocked counts must be zero before handoff.
   - Show Regulatory Source Graph, Model Intake summary, AI event hashes if a model run was created, counsel review statuses, manifest hash, remediation queue, source pack hash, and source review status.
   - Click **Save Pack Version**, update one counsel review status, then click **Save Pack Version** again to show the export diff and version JSON action.
   - Enter `http://127.0.0.1:8787` in **Server export API base URL**, then click **Create Server Export Record** to persist a metadata-only server record for the latest Pack Version.
   - Click **Download Markdown**. Optionally click **Download Version JSON**, **Download Manifest JSON**, and **Create Simulated Anchor Receipt**.
   - Screenshot: `docs/assets/screenshots/demo-06-counsel-pack-export.png`.

8. **Download submission pack**
   - Open **Sources**.
   - Show the generated **Submission Pack** with pack hash, manifest hash, Regulatory Source Pack hash, demo readiness, required assets, hackathon mapping, and known limitations.
   - Click **Download Submission Pack JSON** for the judge-facing metadata artifact.
   - Confirm the boundary: Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only.
   - Screenshot: `docs/assets/screenshots/submission-pack.png`.

## Error-State Checks

- **Model connection failure:** choose **OpenAI-compatible**, leave Base URL/model/API key incomplete, click **Validate Model Connect**, then run **Secure Review Journey**. The workspace should show a recoverable **Fix Model Connect** action. No API key is persisted.
- **Evidence missing:** start a new project and click **Run Secure Review Journey** before adding evidence. The workspace should direct the user to add metadata-only evidence first.
- **Model Gateway policy failure:** with a server test fixture or API client, submit a Model Gateway request that fails Redaction Gate or allowed data-class policy. The API should persist a safe failure receipt and return a run ID, retry state, and remediation steps without raw payloads or credentials. The UI should show the Model Gateway remediation state when the Secure Review Journey receives that response.
- **Review returned:** save a Human Review decision as `needs-more-evidence`; linked evidence should move to `requested` for rework and the review timeline should record the decision with an audit log ID.
- **Rejected vault evidence:** refresh **Evidence Vault Sync** after the backend has a rejected vault record, edit the replacement reason, and click **Replace rejected evidence**. The old record should remain visible as `superseded`, the new record should show `received`, and the manifest hash should update. Not legal advice.
- **Duplicate vault evidence:** sync one safe metadata-only evidence item to the local API, then click **Sync Evidence Vault** again without changing the item. The UI should show `EVIDENCE_DUPLICATE_HASH`, the existing duplicate evidence ID, duplicate status, recovery action, and the Not legal advice API boundary.
- **Server export blocked:** try **Create Server Export Record** before saving a Pack Version, or point **Server export API base URL** at an inactive server. The UI should require a saved version or show a recoverable metadata export error without losing local Pack Version data.
- **Retention blocked:** add a disposable evidence item that mentions a private-key-like value, API-key-like token, or raw KYC packet, then stay in **Evidence Ledger**. **Evidence Retention Readiness** should show **Blocked retention**, redact detected material in snippets, disable **Sync Evidence Vault**, keep **Download Retention Policy JSON** available, and show a Not legal advice boundary. Delete or replace that evidence item before continuing the normal demo path.
- **Export Safety Gate blocked:** add a disposable evidence item that mentions a private-key-like value, API-key-like token, or raw KYC packet, then open **Counsel Pack**. The gate should show **Blocked for export**, redact the detected material in snippets, and disable Markdown/PDF, manifest JSON, simulated anchor, Pack Version save, and server export actions. Delete or replace that evidence item before continuing the normal demo path. Not legal advice.

## Closing Line

LexProof's trust layer is the structured workspace: deterministic risk rules, source-linked issue cards, metadata-only evidence vault sync, duplicate-hash checks, rejected-evidence replacement lineage, model-run hash receipts, human review timelines, manifest hashes, source-pack hashes, local counsel-pack versions, and server export metadata records. Every output remains audit preparation material. Not legal advice.
