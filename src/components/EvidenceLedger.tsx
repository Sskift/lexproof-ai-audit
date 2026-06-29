import { useState } from "react";
import { BadgeCheck, CloudUpload, DatabaseZap, Download, FileUp, History, LockKeyhole, RefreshCcw, Trash2 } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import { downloadEvidenceAuditTrailJson, type EvidenceAuditEvent } from "../lib/evidenceAuditTrail";
import type { EvidenceManifest } from "../lib/evidenceManifest";
import type { EvidenceTemplate } from "../lib/evidenceTemplates";
import {
  fetchEvidenceVaultManifest,
  syncEvidenceLedgerToVault,
  type EvidenceVaultManifestResponse,
  type EvidenceVaultRecordResponse
} from "../lib/evidenceVaultClient";
import { createEvidenceItemFromFile } from "../lib/fileEvidence";
import type { EvidenceItem, EvidenceOwner, EvidenceStatus } from "../lib/projectModel";

type EvidenceLedgerProps = {
  projectId: string;
  evidenceItems: EvidenceItem[];
  evidenceAuditEvents: EvidenceAuditEvent[];
  manifest: EvidenceManifest | null;
  evidenceTemplates: EvidenceTemplate[];
  recommendedTemplateIds: string[];
  onAddEvidence: (item: EvidenceItem) => void;
  onApplyEvidenceTemplate: (templateId: string) => void;
  onUpdateEvidence: (index: number, updates: Partial<EvidenceItem>) => void;
  onRemoveEvidence: (index: number) => void;
};

const statuses: EvidenceStatus[] = ["draft", "requested", "received", "verified"];
const owners: EvidenceOwner[] = ["Founder", "Counsel", "Compliance", "Engineering", "Product"];

const blankEvidence: EvidenceItem = {
  label: "",
  kind: "Markdown",
  content: "",
  source: "",
  status: "draft",
  owner: "Founder"
};

export function EvidenceLedger({
  projectId,
  evidenceItems,
  evidenceAuditEvents,
  manifest,
  evidenceTemplates,
  recommendedTemplateIds,
  onAddEvidence,
  onApplyEvidenceTemplate,
  onUpdateEvidence,
  onRemoveEvidence
}: EvidenceLedgerProps) {
  const [draft, setDraft] = useState<EvidenceItem>(blankEvidence);
  const [fileImportState, setFileImportState] = useState("");
  const [vaultApiBaseUrl, setVaultApiBaseUrl] = useState("");
  const [vaultStatus, setVaultStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [vaultError, setVaultError] = useState("");
  const [vaultManifest, setVaultManifest] = useState<EvidenceVaultManifestResponse | null>(null);
  const [vaultRecords, setVaultRecords] = useState<EvidenceVaultRecordResponse[]>([]);

  const canAdd = draft.label.trim().length > 0 && draft.content.trim().length > 0;
  const canSyncVault = evidenceItems.length > 0 && projectId.trim().length > 0 && vaultStatus !== "syncing";

  const addEvidence = () => {
    if (!canAdd) {
      return;
    }
    onAddEvidence(draft);
    setDraft(blankEvidence);
  };

  const importLocalFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setFileImportState(`Hashing ${file.name}`);
    const item = await createEvidenceItemFromFile(file, {
      owner: "Founder",
      status: "received"
    });
    onAddEvidence(item);
    setFileImportState(`Added ${file.name} as local file metadata`);
  };

  const syncVault = async () => {
    if (!canSyncVault) {
      return;
    }

    setVaultStatus("syncing");
    setVaultError("");

    try {
      const result = await syncEvidenceLedgerToVault({
        workspaceId: projectId,
        evidenceItems,
        apiBaseUrl: vaultApiBaseUrl
      });

      setVaultRecords(result.records);
      setVaultManifest(result.manifest);
      setVaultStatus("synced");
    } catch (error) {
      setVaultStatus("error");
      setVaultError(error instanceof Error ? error.message : "Evidence Vault sync failed.");
    }
  };

  const refreshVaultManifest = async () => {
    if (!projectId.trim() || vaultStatus === "syncing") {
      return;
    }

    setVaultStatus("syncing");
    setVaultError("");

    try {
      const nextManifest = await fetchEvidenceVaultManifest({
        workspaceId: projectId,
        apiBaseUrl: vaultApiBaseUrl
      });
      setVaultManifest(nextManifest);
      setVaultStatus("synced");
    } catch (error) {
      setVaultStatus("error");
      setVaultError(error instanceof Error ? error.message : "Evidence Vault manifest refresh failed.");
    }
  };

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={DatabaseZap}
        title="Evidence Ledger"
        subtitle="Maintain a local, editable evidence queue and produce a deterministic manifest hash for review handoff."
      />

      <div className="hash-banner">
        <LockKeyhole size={20} aria-hidden="true" />
        <div>
          <span>Manifest bundle SHA-256</span>
          <small>Evidence bundle SHA-256</small>
          <code>{manifest?.bundleHash ?? "calculating"}</code>
        </div>
      </div>

      <section className="evidence-audit-trail">
        <div className="split-title compact-title">
          <div>
            <History size={17} aria-hidden="true" />
            <h3>Evidence Audit Trail</h3>
          </div>
          <button
            type="button"
            className="secondary"
            disabled={evidenceAuditEvents.length === 0}
            onClick={() => downloadEvidenceAuditTrailJson("evidence-audit-trail.json", evidenceAuditEvents)}
          >
            <Download size={16} aria-hidden="true" />
            Download Evidence Trail JSON
          </button>
        </div>
        <div className="evidence-trail-list">
          {evidenceAuditEvents.length === 0 ? <p className="empty-state">No evidence change events recorded yet.</p> : null}
          {evidenceAuditEvents.slice(0, 5).map((event) => (
            <article key={event.id} className={`evidence-trail-event ${event.action}`}>
              <strong>{event.summary}</strong>
              <span>
                {event.actor} · {event.createdAt}
              </span>
              <small>
                {event.changedFields.join(", ")} · {event.notLegalAdviceBoundary}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="template-section">
        <div className="panel-title compact-title">
          <BadgeCheck size={17} aria-hidden="true" />
          <h3>Evidence Templates</h3>
        </div>
        <div className="template-grid">
          {evidenceTemplates.map((template) => {
            const recommended = recommendedTemplateIds.includes(template.id);
            return (
              <article key={template.id} className={recommended ? "template-card recommended" : "template-card"}>
                <div className="template-card-header">
                  <strong>{template.title}</strong>
                  {recommended ? <span>Recommended</span> : null}
                </div>
                <p>{template.description}</p>
                <small>{template.notLegalAdviceBoundary}</small>
                <button type="button" className="secondary" onClick={() => onApplyEvidenceTemplate(template.id)}>
                  <BadgeCheck size={16} aria-hidden="true" />
                  Apply {template.shortLabel} template
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="file-evidence-section">
        <div className="panel-title compact-title">
          <FileUp size={17} aria-hidden="true" />
          <h3>Local File Evidence</h3>
        </div>
        <p className="section-note">
          Hash a local file in the browser and add only its metadata to the ledger. Raw file content is not uploaded or stored.
        </p>
        <label className="file-evidence-input" htmlFor="local-evidence-file">
          <span className="field-label">Local evidence file</span>
          <input
            id="local-evidence-file"
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              void importLocalFile(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {fileImportState ? <p className="save-state">{fileImportState}</p> : null}
      </section>

      <section className={`evidence-vault-sync ${vaultStatus}`}>
        <div className="split-title compact-title">
          <div>
            <CloudUpload size={17} aria-hidden="true" />
            <h3>Evidence Vault Sync</h3>
          </div>
          <span className="vault-mode">metadata only</span>
        </div>
        <p className="section-note">
          Sync ledger entries to the Phase 2 backend as metadata-only snapshot files, then fetch the server Evidence Vault
          manifest. Not legal advice; vault records are audit preparation workflow metadata.
        </p>
        <div className="vault-sync-grid">
          <div className="vault-api-field">
            <label className="field-label" htmlFor="evidence-vault-api-base">
              Evidence Vault API base URL
            </label>
            <input
              id="evidence-vault-api-base"
              value={vaultApiBaseUrl}
              onChange={(event) => setVaultApiBaseUrl(event.target.value)}
              placeholder="/api on same host, or http://127.0.0.1:8787"
            />
          </div>
          <VaultMetric label="Local ledger items" value={String(evidenceItems.length)} />
          <VaultMetric label="Synced vault records" value={String(vaultRecords.length)} />
          <div className="vault-hash">
            <span>Vault bundle SHA-256</span>
            <code>{vaultManifest?.bundleHash ?? "not synced"}</code>
          </div>
        </div>
        <div className="vault-actions">
          <button type="button" disabled={!canSyncVault} onClick={() => void syncVault()}>
            <CloudUpload size={16} aria-hidden="true" />
            Sync Evidence Vault
          </button>
          <button type="button" className="secondary" disabled={!projectId.trim() || vaultStatus === "syncing"} onClick={() => void refreshVaultManifest()}>
            <RefreshCcw size={16} aria-hidden="true" />
            Refresh Vault Manifest
          </button>
        </div>
        {vaultStatus === "syncing" ? <p className="save-state">Syncing metadata-only evidence snapshots to the vault...</p> : null}
        {vaultStatus === "synced" && vaultManifest ? (
          <p className="save-state">
            Evidence Vault synced {vaultRecords.length} records. Manifest contains {vaultManifest.itemCount} items.
          </p>
        ) : null}
        {vaultError ? <p className="error-text">{vaultError}</p> : null}
        {vaultRecords.length > 0 ? (
          <div className="vault-record-list">
            {vaultRecords.slice(0, 3).map((record) => (
              <article key={record.id} className={`vault-record ${record.status}`}>
                <strong>{record.filename}</strong>
                <span>
                  {record.status} · {record.owner} · v{record.version}
                </span>
                <code>{record.fileHash}</code>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <div className="ledger-form">
        <div>
          <label className="field-label" htmlFor="evidence-label">
            Evidence label
          </label>
          <input
            id="evidence-label"
            value={draft.label}
            onChange={(event) => setDraft({ ...draft, label: event.target.value })}
            placeholder="Launch memo"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="evidence-kind">
            Evidence kind
          </label>
          <input
            id="evidence-kind"
            value={draft.kind}
            onChange={(event) => setDraft({ ...draft, kind: event.target.value })}
            placeholder="Markdown, PDF, policy, JSON"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="evidence-source">
            Source reference
          </label>
          <input
            id="evidence-source"
            value={draft.source ?? ""}
            onChange={(event) => setDraft({ ...draft, source: event.target.value })}
            placeholder="Synthetic policy, counsel draft, runbook"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="evidence-status">
            Evidence status
          </label>
          <select
            id="evidence-status"
            value={draft.status ?? "draft"}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as EvidenceStatus })}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="evidence-owner">
            Evidence owner
          </label>
          <select
            id="evidence-owner"
            value={draft.owner ?? "Founder"}
            onChange={(event) => setDraft({ ...draft, owner: event.target.value as EvidenceOwner })}
          >
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>
        <div className="full-width">
          <label className="field-label" htmlFor="evidence-content">
            Evidence content
          </label>
          <textarea
            id="evidence-content"
            value={draft.content}
            onChange={(event) => setDraft({ ...draft, content: event.target.value })}
            placeholder="Summarize the artifact. Do not paste raw KYC, private keys, or personal data."
          />
        </div>
        <button type="button" disabled={!canAdd} onClick={addEvidence}>
          Add evidence item
        </button>
      </div>

      <div className="ledger-list editable">
        {evidenceItems.length === 0 ? <p className="empty-state">No evidence items yet.</p> : null}
        {evidenceItems.map((item, index) => (
          <article key={item.id ?? `${item.label}-${index}`} className="ledger-editor">
            <div className="ledger-editor-header">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label || "Untitled evidence"}</strong>
              <BadgeCheck size={18} aria-label="Included in manifest" />
            </div>
            <div className="ledger-editor-grid">
              <div className="editor-field title-field">
                <label className="field-label" htmlFor={`evidence-${index + 1}-label`}>
                  Evidence {String(index + 1).padStart(2, "0")} label
                </label>
                <input
                  id={`evidence-${index + 1}-label`}
                  aria-label={`Label for evidence ${index + 1}`}
                  value={item.label}
                  onChange={(event) => onUpdateEvidence(index, { label: event.target.value })}
                />
              </div>
              <div className="editor-field title-field">
                <label className="field-label" htmlFor={`evidence-${index + 1}-kind`}>
                  Evidence {String(index + 1).padStart(2, "0")} kind
                </label>
                <input
                  id={`evidence-${index + 1}-kind`}
                  aria-label={`Kind for evidence ${index + 1}`}
                  value={item.kind}
                  onChange={(event) => onUpdateEvidence(index, { kind: event.target.value })}
                />
              </div>
              <div className="editor-field">
                <label className="field-label" htmlFor={`evidence-${index + 1}-status`}>
                  Evidence {String(index + 1).padStart(2, "0")} status
                </label>
                <select
                  id={`evidence-${index + 1}-status`}
                  aria-label={`Status for evidence ${index + 1}`}
                  value={item.status ?? "draft"}
                  onChange={(event) => onUpdateEvidence(index, { status: event.target.value as EvidenceStatus })}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="editor-field">
                <label className="field-label" htmlFor={`evidence-${index + 1}-owner`}>
                  Evidence {String(index + 1).padStart(2, "0")} owner
                </label>
                <select
                  id={`evidence-${index + 1}-owner`}
                  aria-label={`Owner for evidence ${index + 1}`}
                  value={item.owner ?? "Founder"}
                  onChange={(event) => onUpdateEvidence(index, { owner: event.target.value as EvidenceOwner })}
                >
                  {owners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
              <div className="editor-field source-field">
                <label className="field-label" htmlFor={`evidence-${index + 1}-source`}>
                  Evidence {String(index + 1).padStart(2, "0")} source
                </label>
                <input
                  id={`evidence-${index + 1}-source`}
                  aria-label={`Source for evidence ${index + 1}`}
                  value={item.source ?? ""}
                  onChange={(event) => onUpdateEvidence(index, { source: event.target.value })}
                />
              </div>
              <div className="editor-field content-field">
                <label className="field-label" htmlFor={`evidence-${index + 1}-content`}>
                  Evidence {String(index + 1).padStart(2, "0")} content
                </label>
                <textarea
                  id={`evidence-${index + 1}-content`}
                  aria-label={`Content for evidence ${index + 1}`}
                  value={item.content}
                  onChange={(event) => onUpdateEvidence(index, { content: event.target.value })}
                />
              </div>
            </div>
            <div className="inline-actions">
              <div className="hash-block">
                <span>Evidence {String(index + 1).padStart(2, "0")} SHA-256</span>
                <code>{manifest?.items[index]?.contentHash ?? "calculating"}</code>
              </div>
              <button type="button" className="danger" onClick={() => onRemoveEvidence(index)} aria-label={`Remove ${item.label}`}>
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function VaultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="vault-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
