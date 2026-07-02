import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  CloudUpload,
  DatabaseZap,
  Download,
  FileUp,
  GitBranch,
  History,
  LockKeyhole,
  RefreshCcw,
  ShieldAlert,
  Trash2
} from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import { downloadEvidenceAuditTrailJson, type EvidenceAuditEvent } from "../lib/evidenceAuditTrail";
import type { EvidenceIntakeGuidance, EvidenceIntakeGuidanceAction } from "../lib/evidenceIntakeGuidance";
import type { EvidenceManifest } from "../lib/evidenceManifest";
import { downloadEvidenceVaultManifestJson } from "../lib/evidenceVaultManifestDownload";
import type { EvidenceTemplate } from "../lib/evidenceTemplates";
import {
  EvidenceVaultClientError,
  fetchEvidenceVaultManifest,
  listEvidenceVaultRecords,
  replaceEvidenceVaultRecord,
  syncEvidenceLedgerToVault,
  type EvidenceVaultManifestResponse,
  type EvidenceVaultRecordResponse
} from "../lib/evidenceVaultClient";
import { createEvidenceVaultControlCoverage, type EvidenceVaultControlCoverage } from "../lib/evidenceVaultControlCoverage";
import {
  createEvidenceVaultLineageDigest,
  downloadEvidenceVaultLineageDigestJson,
  type EvidenceVaultLineageDigest
} from "../lib/evidenceVaultLineageDigest";
import { createEvidenceItemFromFile } from "../lib/fileEvidence";
import { createRejectedEvidenceReplacementDraft } from "../lib/evidenceReplacement";
import { evidenceStatuses, type EvidenceItem, type EvidenceOwner, type EvidenceStatus } from "../lib/projectModel";
import {
  createEvidenceRetentionRemediationQueue,
  downloadEvidenceRetentionRemediationJson,
  type EvidenceRetentionRemediationQueue
} from "../lib/evidenceRetentionRemediation";
import {
  createEvidenceRecertificationQueue,
  downloadEvidenceRecertificationJson,
  type EvidenceRecertificationQueue
} from "../lib/evidenceRecertification";
import {
  createRetentionPolicyReport,
  downloadRetentionPolicyJson,
  type RetentionPolicyReport
} from "../lib/retentionPolicy";

type EvidenceLedgerProps = {
  projectId: string;
  evidenceItems: EvidenceItem[];
  evidenceAuditEvents: EvidenceAuditEvent[];
  manifest: EvidenceManifest | null;
  evidenceIntakeGuidance: EvidenceIntakeGuidance;
  evidenceTemplates: EvidenceTemplate[];
  recommendedTemplateIds: string[];
  onAddEvidence: (item: EvidenceItem) => void;
  onApplyEvidenceTemplate: (templateId: string) => void;
  onUpdateEvidence: (index: number, updates: Partial<EvidenceItem>) => void;
  onRemoveEvidence: (index: number) => void;
  onVaultControlCoverageChange?: (coverage: EvidenceVaultControlCoverage) => void;
};

const statuses = evidenceStatuses;
const owners: EvidenceOwner[] = ["Founder", "Counsel", "Compliance", "Engineering", "Product"];

const blankEvidence: EvidenceItem = {
  label: "",
  kind: "Markdown",
  content: "",
  source: "",
  status: "draft",
  owner: "Founder"
};

type VaultErrorDetails = {
  message: string;
  code?: string;
  recoveryAction?: string;
  duplicateEvidenceId?: string;
  duplicateStatus?: EvidenceVaultRecordResponse["status"];
  notLegalAdviceBoundary?: string;
};

export function EvidenceLedger({
  projectId,
  evidenceItems,
  evidenceAuditEvents,
  manifest,
  evidenceIntakeGuidance,
  evidenceTemplates,
  recommendedTemplateIds,
  onAddEvidence,
  onApplyEvidenceTemplate,
  onUpdateEvidence,
  onRemoveEvidence,
  onVaultControlCoverageChange
}: EvidenceLedgerProps) {
  const [draft, setDraft] = useState<EvidenceItem>(blankEvidence);
  const [fileImportState, setFileImportState] = useState("");
  const [vaultApiBaseUrl, setVaultApiBaseUrl] = useState("");
  const [vaultStatus, setVaultStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [vaultError, setVaultError] = useState("");
  const [vaultErrorDetails, setVaultErrorDetails] = useState<VaultErrorDetails | null>(null);
  const [vaultRecoveryState, setVaultRecoveryState] = useState("");
  const [vaultReplacementReasons, setVaultReplacementReasons] = useState<Record<string, string>>({});
  const [vaultManifest, setVaultManifest] = useState<EvidenceVaultManifestResponse | null>(null);
  const [vaultRecords, setVaultRecords] = useState<EvidenceVaultRecordResponse[]>([]);
  const [vaultLineageDigest, setVaultLineageDigest] = useState<EvidenceVaultLineageDigest | null>(null);
  const [retentionRemediationQueue, setRetentionRemediationQueue] = useState<EvidenceRetentionRemediationQueue | null>(null);
  const [recertificationQueue, setRecertificationQueue] = useState<EvidenceRecertificationQueue | null>(null);
  const vaultControlCoverage = useMemo(
    () =>
      createEvidenceVaultControlCoverage({
        records: vaultRecords,
        manifest: vaultManifest
      }),
    [vaultManifest, vaultRecords]
  );
  const retentionReport = useMemo(
    () =>
      createRetentionPolicyReport({
        workspaceId: projectId,
        evidenceItems
      }),
    [evidenceItems, projectId]
  );
  useEffect(() => {
    onVaultControlCoverageChange?.(vaultControlCoverage);
  }, [onVaultControlCoverageChange, vaultControlCoverage]);
  useEffect(() => {
    let isActive = true;
    setRetentionRemediationQueue(null);
    void createEvidenceRetentionRemediationQueue(retentionReport).then((queue) => {
      if (isActive) {
        setRetentionRemediationQueue(queue);
      }
    });
    return () => {
      isActive = false;
    };
  }, [retentionReport]);
  useEffect(() => {
    let isActive = true;
    setRecertificationQueue(null);
    void createEvidenceRecertificationQueue({
      workspaceId: projectId,
      evidenceItems
    }).then((queue) => {
      if (isActive) {
        setRecertificationQueue(queue);
      }
    });
    return () => {
      isActive = false;
    };
  }, [evidenceItems, projectId]);
  useEffect(() => {
    let isActive = true;

    if (vaultRecords.length === 0) {
      setVaultLineageDigest(null);
      return () => {
        isActive = false;
      };
    }

    void createEvidenceVaultLineageDigest({
      workspaceId: projectId,
      records: vaultRecords,
      manifest: vaultManifest
    }).then((digest) => {
      if (isActive) {
        setVaultLineageDigest(digest);
      }
    });

    return () => {
      isActive = false;
    };
  }, [projectId, vaultManifest, vaultRecords]);

  const canAdd = draft.label.trim().length > 0 && draft.content.trim().length > 0;
  const canSyncVault =
    evidenceItems.length > 0 && projectId.trim().length > 0 && retentionReport.vaultSyncAllowed && vaultStatus !== "syncing";

  const addEvidence = () => {
    if (!canAdd) {
      return;
    }
    onAddEvidence(draft);
    setDraft(blankEvidence);
  };

  const createRejectedReplacement = (item: EvidenceItem) => {
    const replacement = createRejectedEvidenceReplacementDraft(item);
    if (replacement) {
      onAddEvidence(replacement);
    }
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

  const startGuidanceAction = (action: EvidenceIntakeGuidanceAction) => {
    if (action.actionType === "apply-template" && action.templateId) {
      onApplyEvidenceTemplate(action.templateId);
      return;
    }

    setDraft({
      ...blankEvidence,
      label: action.title,
      kind: "Evidence request",
      content: `Requested: ${action.description} ${evidenceIntakeGuidance.notLegalAdviceBoundary}`,
      source: action.source ?? "LexProof evidence intake guidance",
      status: "requested",
      owner: action.owner
    });
  };

  const syncVault = async () => {
    if (!canSyncVault) {
      return;
    }

    setVaultStatus("syncing");
    setVaultError("");
    setVaultErrorDetails(null);
    setVaultRecoveryState("");

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
      captureVaultError(error, "Evidence Vault sync failed.");
    }
  };

  const refreshVaultManifest = async () => {
    if (!projectId.trim() || vaultStatus === "syncing") {
      return;
    }

    setVaultStatus("syncing");
    setVaultError("");
    setVaultErrorDetails(null);
    setVaultRecoveryState("");

    try {
      const [nextManifest, nextRecords] = await Promise.all([
        fetchEvidenceVaultManifest({
          workspaceId: projectId,
          apiBaseUrl: vaultApiBaseUrl
        }),
        listEvidenceVaultRecords({
          workspaceId: projectId,
          apiBaseUrl: vaultApiBaseUrl
        })
      ]);
      setVaultManifest(nextManifest);
      setVaultRecords(nextRecords);
      setVaultStatus("synced");
    } catch (error) {
      setVaultStatus("error");
      captureVaultError(error, "Evidence Vault manifest refresh failed.");
    }
  };

  const recoverRejectedVaultRecord = async (record: EvidenceVaultRecordResponse, index: number) => {
    const replacementItem = findReplacementEvidenceItem(record, evidenceItems, index);

    if (!replacementItem) {
      setVaultStatus("error");
      setVaultError("Add local evidence metadata before replacing a rejected Evidence Vault record.");
      setVaultErrorDetails(null);
      return;
    }

    setVaultStatus("syncing");
    setVaultError("");
    setVaultErrorDetails(null);
    setVaultRecoveryState("");

    try {
      const result = await replaceEvidenceVaultRecord({
        workspaceId: projectId,
        evidenceId: record.id,
        replacementItem,
        replacementReason: vaultReplacementReasons[record.id] ?? createDefaultReplacementReason(record),
        apiBaseUrl: vaultApiBaseUrl
      });
      const nextManifest = await fetchEvidenceVaultManifest({
        workspaceId: projectId,
        apiBaseUrl: vaultApiBaseUrl
      });

      setVaultRecords((current) => upsertVaultRecords(current, [result.superseded, result.replacement]));
      setVaultManifest(nextManifest);
      setVaultStatus("synced");
      setVaultRecoveryState(`Replacement evidence created for ${record.filename}.`);
    } catch (error) {
      setVaultStatus("error");
      captureVaultError(error, "Evidence Vault replacement failed.");
    }
  };

  function captureVaultError(error: unknown, fallbackMessage: string) {
    if (error instanceof EvidenceVaultClientError) {
      setVaultError(error.message);
      setVaultErrorDetails({
        message: error.message,
        code: error.code,
        recoveryAction: error.recoveryAction,
        duplicateEvidenceId: error.duplicateEvidenceId,
        duplicateStatus: error.duplicateStatus,
        notLegalAdviceBoundary: error.notLegalAdviceBoundary
      });
      return;
    }

    setVaultError(error instanceof Error ? error.message : fallbackMessage);
    setVaultErrorDetails(null);
  }

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

      {evidenceItems.length === 0 ? (
        <EvidenceIntakeGuidancePanel guidance={evidenceIntakeGuidance} onStartAction={startGuidanceAction} />
      ) : null}

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

      <RetentionPolicyPanel report={retentionReport} remediationQueue={retentionRemediationQueue} />
      <EvidenceRecertificationPanel
        queue={recertificationQueue}
        onMarkRecertified={(index) => onUpdateEvidence(index, { status: "verified" })}
      />

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
          <button
            type="button"
            className="secondary"
            disabled={!vaultManifest}
            onClick={() => vaultManifest && downloadEvidenceVaultManifestJson("evidence-vault-manifest.json", vaultManifest)}
          >
            <Download size={16} aria-hidden="true" />
            Download Vault Manifest JSON
          </button>
        </div>
        {!retentionReport.vaultSyncAllowed && evidenceItems.length > 0 ? (
          <p className="empty-state">Vault sync blocked until retention blockers are remediated. Not legal advice.</p>
        ) : null}
        {vaultStatus === "syncing" ? <p className="save-state">Syncing metadata-only evidence snapshots to the vault...</p> : null}
        {evidenceItems.length === 0 ? (
          <p className="empty-state">
            Add or apply at least one evidence item before syncing Evidence Vault. Not legal advice; sync creates metadata-only
            audit preparation records.
          </p>
        ) : null}
        {vaultStatus === "synced" && vaultManifest ? (
          <p className="save-state">
            Evidence Vault synced {vaultRecords.length} records. Manifest contains {vaultManifest.itemCount} items.
          </p>
        ) : null}
        {vaultLineageDigest ? <VaultLineageDigestPanel digest={vaultLineageDigest} /> : null}
        {vaultControlCoverage.controlCount > 0 ? <VaultControlCoveragePanel coverage={vaultControlCoverage} /> : null}
        {vaultRecoveryState ? <p className="save-state vault-recovery-state">{vaultRecoveryState} Not legal advice.</p> : null}
        {vaultError ? <p className="error-text">{vaultError}</p> : null}
        {vaultErrorDetails ? <VaultErrorRecoveryPanel error={vaultErrorDetails} /> : null}
        {vaultRecords.length > 0 ? (
          <div className="vault-record-list" aria-label="Evidence Vault records">
            {vaultRecords.slice(0, 5).map((record, index) => (
              <article key={record.id} className={`vault-record ${record.status}`}>
                <strong>{record.filename}</strong>
                <span>
                  {record.status} · {record.owner} · v{record.version}
                </span>
                {record.sourceNote ? <small>{record.sourceNote}</small> : null}
                {(record.linkedControlIds ?? []).length > 0 ? <small>Controls: {record.linkedControlIds.join(", ")}</small> : null}
                {record.parentEvidenceId ? <small>Parent evidence: {record.parentEvidenceId}</small> : null}
                {record.supersededByEvidenceId ? <small>Superseded by: {record.supersededByEvidenceId}</small> : null}
                {record.replacementReason ? <small>Replacement reason: {record.replacementReason}</small> : null}
                <code>{record.fileHash}</code>
                {record.status === "rejected" ? (
                  <div className="vault-recovery">
                    <label className="field-label" htmlFor={`vault-replacement-reason-${record.id}`}>
                      Replacement reason for {record.filename}
                    </label>
                    <input
                      id={`vault-replacement-reason-${record.id}`}
                      value={vaultReplacementReasons[record.id] ?? createDefaultReplacementReason(record)}
                      onChange={(event) =>
                        setVaultReplacementReasons((current) => ({
                          ...current,
                          [record.id]: event.target.value
                        }))
                      }
                    />
                    <button type="button" className="secondary" onClick={() => void recoverRejectedVaultRecord(record, index)}>
                      <RefreshCcw size={16} aria-hidden="true" />
                      Replace rejected evidence
                    </button>
                  </div>
                ) : null}
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
            {item.status === "rejected" ? (
              <div className="evidence-replacement-recovery">
                <strong>Rejected evidence recovery</strong>
                <p>
                  Preserve this rejected item and open a metadata-only replacement request. Not legal advice.
                </p>
                <button type="button" className="secondary" onClick={() => createRejectedReplacement(item)}>
                  <RefreshCcw size={16} aria-hidden="true" />
                  Create replacement for {item.label || "Untitled evidence"}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceIntakeGuidancePanel({
  guidance,
  onStartAction
}: {
  guidance: EvidenceIntakeGuidance;
  onStartAction: (action: EvidenceIntakeGuidanceAction) => void;
}) {
  return (
    <section className={`evidence-intake-guidance ${guidance.status}`} aria-label="Evidence Intake Guidance">
      <div className="split-title compact-title">
        <div>
          <BadgeCheck size={17} aria-hidden="true" />
          <h3>Evidence Intake Guidance</h3>
        </div>
        <span>{guidance.status === "needs-evidence" ? "Start here" : "In progress"}</span>
      </div>
      <p>{guidance.summary}</p>
      <small>{guidance.notLegalAdviceBoundary}</small>
      <div className="evidence-guidance-actions">
        {guidance.actions.map((action) => (
          <article key={action.id} className={`evidence-guidance-action ${action.actionType}`}>
            <header>
              {action.priority ? <span className={`priority ${action.priority}`}>{action.priority}</span> : <span>Template</span>}
              <strong>{action.title}</strong>
            </header>
            <p>{action.description}</p>
            {action.source ? <small>{action.source}</small> : null}
            <button type="button" className="secondary" onClick={() => onStartAction(action)}>
              {action.actionType === "apply-template" ? `Apply recommended ${action.title.replace(/^Apply /, "")}` : "Prefill evidence request"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceRecertificationPanel({
  queue,
  onMarkRecertified
}: {
  queue: EvidenceRecertificationQueue | null;
  onMarkRecertified: (index: number) => void;
}) {
  const status = queue?.status ?? "generating";
  const visibleItems = queue?.items.slice(0, 5) ?? [];

  return (
    <section className={`evidence-recertification-panel ${queue?.status ?? "monitoring"}`} aria-label="Evidence Recertification Queue">
      <div className="split-title compact-title">
        <div>
          <CalendarClock size={17} aria-hidden="true" />
          <h3>Evidence Recertification Queue</h3>
        </div>
        <span className={`recertification-status ${queue?.status ?? "monitoring"}`}>{status}</span>
      </div>
      <p className="section-note">
        {queue?.notLegalAdviceBoundary ??
          "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."}
      </p>
      <div className="recertification-grid">
        <RetentionFact label="Actions" value={String(queue?.summary.totalActionCount ?? 0)} />
        <RetentionFact label="Overdue" value={String(queue?.summary.overdueCount ?? 0)} />
        <RetentionFact label="Expiring" value={String(queue?.summary.expiringCount ?? 0)} />
        <RetentionFact label="Queue SHA-256" value={queue?.queueHash ?? "calculating"} />
      </div>
      {visibleItems.length === 0 ? (
        <p className="empty-state">
          {queue?.nextSteps[0] ?? "Checking reliance-ready evidence recertification metadata."}
        </p>
      ) : (
        <div className="recertification-list">
          {visibleItems.map((item) => (
            <article key={item.id} className={`recertification-item ${item.priority.toLowerCase()}`}>
              <header>
                <span className={`recertification-priority ${item.priority.toLowerCase()}`}>{item.priority}</span>
                <strong>{item.evidenceLabel}</strong>
                <small>
                  {item.evidenceStatus} · {item.owner} · due {item.dueAt === "missing" ? "missing" : item.dueAt.slice(0, 10)}
                </small>
              </header>
              <p>{item.reason}</p>
              <small>
                {item.nextAction} Age: {item.ageDays} days. Controls: {item.linkedControlIds.join(", ") || "none"}.
              </small>
              <div className="recertification-actions">
                <button type="button" className="secondary" onClick={() => onMarkRecertified(item.evidenceIndex)}>
                  <RefreshCcw size={16} aria-hidden="true" />
                  Mark {item.evidenceLabel} recertified
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="retention-footer">
        <ul>
          {(queue?.nextSteps ?? ["Generate recertification queue from metadata-only evidence."]).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <button
          type="button"
          className="secondary"
          disabled={!queue || queue.summary.totalActionCount === 0}
          onClick={() => (queue ? downloadEvidenceRecertificationJson("evidence-recertification-queue.json", queue) : undefined)}
        >
          <Download size={16} aria-hidden="true" />
          Download Recertification Queue JSON
        </button>
      </div>
    </section>
  );
}

function RetentionPolicyPanel({
  report,
  remediationQueue
}: {
  report: RetentionPolicyReport;
  remediationQueue: EvidenceRetentionRemediationQueue | null;
}) {
  const statusLabel =
    report.status === "blocked" ? "Blocked retention" : report.status === "needs-review" ? "Needs retention review" : "Ready";
  const visibleActions = report.actions.slice(0, 5);
  const visibleRemediationItems = remediationQueue?.items.slice(0, 5) ?? [];

  return (
    <section className={`retention-policy-panel ${report.status}`}>
      <div className="split-title compact-title">
        <div>
          <ShieldAlert size={17} aria-hidden="true" />
          <h3>Evidence Retention Readiness</h3>
        </div>
        <span className={`retention-status ${report.status}`}>{statusLabel}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="retention-grid">
        <RetentionFact label="Evidence items" value={String(report.evidenceCount)} />
        <RetentionFact label="Blockers" value={String(report.blockerCount)} />
        <RetentionFact label="Needs review" value={String(report.reviewCount)} />
        <RetentionFact label="Vault sync" value={report.vaultSyncAllowed ? "allowed" : "blocked"} />
      </div>
      <div className="retention-actions">
        {visibleActions.map((action, index) => (
          <article key={`${action.evidenceLabel}-${action.action}-${action.dataClass}-${index}`}>
            <header>
              <span className={`retention-severity ${action.severity}`}>{action.severity}</span>
              <strong>{`Evidence item: ${action.evidenceLabel}`}</strong>
              <small>
                {action.dataClass} · {action.action} · {action.owner}
              </small>
            </header>
            <p>{action.reason}</p>
            <code>{action.redactedSnippet}</code>
            <small>
              Retention: {action.retentionWindow}. Deletion trigger: {action.deletionTrigger}.
            </small>
          </article>
        ))}
      </div>
      <section className="retention-remediation-panel" aria-label="Evidence Retention Remediation Queue">
        <div className="split-title compact-title">
          <div>
            <ShieldAlert size={16} aria-hidden="true" />
            <h3>Evidence Retention Remediation Queue</h3>
          </div>
          <span>{remediationQueue?.status ?? "generating"}</span>
        </div>
        <p className="section-note">
          {remediationQueue?.notLegalAdviceBoundary ??
            "Not legal advice. Evidence retention remediation queues are audit preparation workflow metadata only."}
        </p>
        <div className="retention-remediation-grid">
          <RetentionFact label="Queue actions" value={String(remediationQueue?.summary.totalActionCount ?? report.actions.length)} />
          <RetentionFact label="P0 blockers" value={String(remediationQueue?.summary.blockedActionCount ?? report.blockerCount)} />
          <RetentionFact label="P1 reviews" value={String(remediationQueue?.summary.reviewActionCount ?? report.reviewCount)} />
          <RetentionFact label="Queue SHA-256" value={remediationQueue?.queueHash ?? "calculating"} />
        </div>
        <div className="retention-remediation-list">
          {visibleRemediationItems.map((item) => (
            <article key={item.id} className={`retention-remediation-item ${item.priority.toLowerCase()}`}>
              <header>
                <span className={`retention-priority ${item.priority.toLowerCase()}`}>{item.priority}</span>
                <strong>{item.nextAction}</strong>
                <small>
                  {item.dataClass} · {item.actionType} · {item.owner}
                </small>
              </header>
              <p>{item.reason}</p>
              <code>{item.redactedSnippet}</code>
              <small>
                Retention: {item.retentionWindow}. Trigger: {item.deletionTrigger}.
              </small>
            </article>
          ))}
        </div>
      </section>
      <div className="retention-footer">
        <ul>
          {(remediationQueue?.nextSteps ?? report.nextSteps).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <button
          type="button"
          className="secondary"
          disabled={!remediationQueue || report.evidenceCount === 0}
          onClick={() =>
            remediationQueue
              ? downloadEvidenceRetentionRemediationJson("evidence-retention-remediation-queue.json", remediationQueue)
              : undefined
          }
        >
          <Download size={16} aria-hidden="true" />
          Download Remediation Queue JSON
        </button>
        <button
          type="button"
          className="secondary"
          disabled={report.evidenceCount === 0}
          onClick={() => downloadRetentionPolicyJson("evidence-retention-policy.json", report)}
        >
          <Download size={16} aria-hidden="true" />
          Download Retention Policy JSON
        </button>
      </div>
    </section>
  );
}

function RetentionFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function VaultLineageDigestPanel({ digest }: { digest: EvidenceVaultLineageDigest }) {
  return (
    <section className={`vault-lineage-digest ${digest.readinessStatus}`} aria-label="Evidence Vault Lineage Digest">
      <div className="split-title compact-title">
        <div>
          <GitBranch size={17} aria-hidden="true" />
          <h3>Evidence Vault Lineage Digest</h3>
        </div>
        <span>{formatLineageStatus(digest.readinessStatus)}</span>
      </div>
      <p>{digest.notLegalAdviceBoundary}</p>
      <div className="vault-lineage-summary">
        <VaultMetric label="Digest hash" value={shortHash(digest.digestHash)} />
        <VaultMetric label="Manifest hash" value={digest.manifestHash ? shortHash(digest.manifestHash) : "not synced"} />
        <VaultMetric label="Active records" value={String(digest.lineageCounts.activeRecords)} />
        <VaultMetric label="Replaced records" value={String(digest.lineageCounts.replacedRecords)} />
        <VaultMetric label="Open rejected" value={String(digest.lineageCounts.openRejectedRecords)} />
        <VaultMetric label="Lineage links" value={String(digest.lineageCounts.lineageLinkCount)} />
      </div>
      <div className="vault-lineage-actions">
        <div>
          <strong>Next action</strong>
          <span>{digest.nextActions[0] ?? "Keep lineage metadata with the Evidence Manifest."}</span>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadEvidenceVaultLineageDigestJson("evidence-vault-lineage-digest.json", digest)}
        >
          <Download size={16} aria-hidden="true" />
          Download Lineage Digest JSON
        </button>
      </div>
      {digest.linkedControlIds.length > 0 ? (
        <div className="vault-lineage-list" aria-label="Lineage linked controls">
          {digest.linkedControlIds.slice(0, 4).map((controlId) => (
            <code key={controlId}>{controlId}</code>
          ))}
        </div>
      ) : null}
      {digest.lineageLinks.length > 0 ? (
        <div className="vault-lineage-links" aria-label="Vault lineage links">
          {digest.lineageLinks.slice(0, 3).map((link) => (
            <article key={`${link.parentEvidenceId}-${link.replacementEvidenceId}`}>
              <strong>{link.parentEvidenceId}</strong>
              <span>
                replaced by {link.replacementEvidenceId} · v{link.replacementVersion} · {link.replacementStatus}
              </span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function VaultControlCoveragePanel({ coverage }: { coverage: EvidenceVaultControlCoverage }) {
  return (
    <section className="vault-control-coverage" aria-label="Evidence Vault Control Coverage">
      <div className="split-title compact-title">
        <div>
          <BadgeCheck size={17} aria-hidden="true" />
          <h3>Evidence Vault Control Coverage</h3>
        </div>
        <span>{coverage.controlCount} controls</span>
      </div>
      <p>
        {coverage.controlCount} controls linked across {coverage.recordCount} vault records and {coverage.manifestItemCount} manifest
        items.
      </p>
      <div className="vault-control-list">
        {coverage.controls.map((control) => (
          <article key={control.controlId} className="vault-control-card">
            <code>{control.controlId}</code>
            <div className="vault-control-facts">
              <span>{control.evidenceRecordCount} records</span>
              <span>{control.manifestItemCount} manifest items</span>
            </div>
            <small>Readiness: {formatControlCoverageReadiness(control.readiness)}</small>
            <small>{control.nextAction}</small>
            <small>Status coverage: {control.statuses.join(", ") || "not synced"}</small>
            <small>Evidence files: {control.filenames.join(", ") || "no filenames"}</small>
          </article>
        ))}
      </div>
      <small>{coverage.notLegalAdviceBoundary}</small>
    </section>
  );
}

function formatControlCoverageReadiness(readiness: EvidenceVaultControlCoverage["controls"][number]["readiness"]): string {
  if (readiness === "ready-for-handoff") {
    return "Ready for handoff";
  }

  if (readiness === "needs-review") {
    return "Needs review";
  }

  if (readiness === "needs-manifest-link") {
    return "Needs manifest link";
  }

  return "Needs vault record";
}

function formatLineageStatus(status: EvidenceVaultLineageDigest["readinessStatus"]) {
  if (status === "needs-replacement") {
    return "needs replacement";
  }

  if (status === "needs-manifest") {
    return "needs manifest";
  }

  return status;
}

function shortHash(hash: string): string {
  if (hash.length <= 18) {
    return hash;
  }

  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function VaultErrorRecoveryPanel({ error }: { error: VaultErrorDetails }) {
  const facts = [
    { label: "Error code", value: error.code },
    { label: "Duplicate evidence ID", value: error.duplicateEvidenceId },
    { label: "Duplicate status", value: error.duplicateStatus }
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <section className="vault-error-panel" aria-label="Evidence Vault recovery details">
      <div className="split-title compact-title">
        <div>
          <ShieldAlert size={17} aria-hidden="true" />
          <h3>Evidence Vault Recovery</h3>
        </div>
        <span>Review before retry</span>
      </div>
      {error.recoveryAction ? (
        <p>
          <strong>Recovery action</strong>
          <span>{error.recoveryAction}</span>
        </p>
      ) : null}
      {facts.length > 0 ? (
        <dl className="vault-error-facts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>
                <code>{fact.value}</code>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <small>
        {error.notLegalAdviceBoundary ??
          "Not legal advice. Evidence Vault recovery details are audit preparation workflow signals only."}
      </small>
    </section>
  );
}

function findReplacementEvidenceItem(record: EvidenceVaultRecordResponse, evidenceItems: EvidenceItem[], index: number): EvidenceItem | undefined {
  const filename = record.filename.toLowerCase();
  return evidenceItems.find((item) => filename.startsWith(slug(item.label))) ?? evidenceItems[index] ?? evidenceItems[0];
}

function createDefaultReplacementReason(record: EvidenceVaultRecordResponse): string {
  return record.sourceNote.trim() ? `Replacement after rejected review: ${record.sourceNote.trim()}` : "Replacement after rejected evidence review.";
}

function upsertVaultRecords(current: EvidenceVaultRecordResponse[], next: EvidenceVaultRecordResponse[]): EvidenceVaultRecordResponse[] {
  return next.reduce((records, record) => {
    const index = records.findIndex((item) => item.id === record.id);

    if (index === -1) {
      return [...records, record];
    }

    const updated = [...records];
    updated[index] = record;
    return updated;
  }, current);
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "evidence"
  );
}
