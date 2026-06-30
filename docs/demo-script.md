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

0. **Review command center**
   - Start on the **Regulatory Command Center** at the top of the workbench.
   - Show jurisdiction readiness, official-source clause triggers, evidence gap queue, manifest status, and the Not legal advice boundary.
   - Screenshot: `docs/assets/screenshots/regulatory-command-center.png`.

1. **Connect model**
   - Open **AI Review**.
   - Keep **Mock local reviewer** selected for the live demo, then click **Validate Model Connect**.
   - Show the receipt, Model Access Workflow, Model Connection Readiness, and Redaction Gate.
   - Screenshot: `docs/assets/screenshots/demo-01-model-connect.png`.

2. **Select or upload evidence**
   - Open **Evidence Ledger**.
   - Apply the **tokenized yield / RWA** evidence template, or add one local synthetic evidence item.
   - Show that local files are hashed as metadata and raw file bytes are not stored in the ledger.
   - Screenshot: `docs/assets/screenshots/demo-02-evidence-ledger.png`.

3. **Run risk audit**
   - Open **Risk Audit**.
   - Show deterministic flags, source-linked issue cards, evidence workflow coverage, and remediation owners.
   - If a missing item is useful for narration, click **Request evidence** to push a requested item into Evidence Ledger.
   - Screenshot: `docs/assets/screenshots/demo-03-risk-audit.png`.

4. **Route human review**
   - Open **Human Review**.
   - Set one evidence item to `needs-more-evidence`, adjust the due date if useful for narration, save the decision, and show the return message.
   - Show **Human Review Timeline** with the saved decision, audit log ID, and **Download Review Timeline JSON**.
   - Return to **Evidence Ledger** and show the linked evidence status moved back to `requested`.
   - Screenshot: `docs/assets/screenshots/demo-04-human-review-return.png`.

5. **Sync vault and gateway journey**
   - Open the **Secure Review Workspace** panel at the top of the app.
   - Enter `http://127.0.0.1:8787` in **Secure Review API base URL**.
   - Click **Run Secure Review Journey**.
   - Show the Evidence Vault manifest hash, Model Gateway response hash, Human Review request ID, audit log count, and Not legal advice boundary.
   - Screenshot: `docs/assets/screenshots/demo-05-secure-review-journey.png`.

6. **Export counsel pack**
   - Open **Counsel Pack**.
   - Show Regulatory Source Graph, Model Intake summary, AI event hashes if a model run was created, counsel review statuses, manifest hash, remediation queue, and source pack.
   - Click **Save Pack Version**, update one counsel review status, then click **Save Pack Version** again to show the export diff and version JSON action.
   - Enter `http://127.0.0.1:8787` in **Server export API base URL**, then click **Create Server Export Record** to persist a metadata-only server record for the latest Pack Version.
   - Click **Download Markdown**. Optionally click **Download Version JSON**, **Download Manifest JSON**, and **Create Simulated Anchor Receipt**.
   - Screenshot: `docs/assets/screenshots/demo-06-counsel-pack-export.png`.

## Error-State Checks

- **Model connection failure:** choose **OpenAI-compatible**, leave Base URL/model/API key incomplete, click **Validate Model Connect**, then run **Secure Review Journey**. The workspace should show a recoverable **Fix Model Connect** action. No API key is persisted.
- **Evidence missing:** start a new project and click **Run Secure Review Journey** before adding evidence. The workspace should direct the user to add metadata-only evidence first.
- **Model Gateway policy failure:** with a server test fixture or API client, submit a Model Gateway request that fails Redaction Gate or allowed data-class policy. The API should persist a safe failure receipt and return a run ID, retry state, and remediation steps without raw payloads or credentials. The UI should show the Model Gateway remediation state when the Secure Review Journey receives that response.
- **Review returned:** save a Human Review decision as `needs-more-evidence`; linked evidence should move to `requested` for rework and the review timeline should record the decision with an audit log ID.
- **Rejected vault evidence:** refresh **Evidence Vault Sync** after the backend has a rejected vault record, edit the replacement reason, and click **Replace rejected evidence**. The old record should remain visible as `superseded`, the new record should show `received`, and the manifest hash should update. Not legal advice.
- **Server export blocked:** try **Create Server Export Record** before saving a Pack Version, or point **Server export API base URL** at an inactive server. The UI should require a saved version or show a recoverable metadata export error without losing local Pack Version data.

## Closing Line

LexProof's trust layer is the structured workspace: deterministic risk rules, source-linked issue cards, metadata-only evidence vault sync, duplicate-hash checks, rejected-evidence replacement lineage, model-run hash receipts, human review timelines, manifest hashes, local counsel-pack versions, and server export metadata records. Every output remains audit preparation material. Not legal advice.
