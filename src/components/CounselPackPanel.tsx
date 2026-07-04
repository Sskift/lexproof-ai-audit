import { useState } from "react";
import { Anchor, CheckCircle2, ClipboardCheck, Download, FileText, History, Printer, Save, ServerCog, ShieldAlert } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  createSimulatedAnchorReceipt,
  downloadAnchorReceiptJson,
  type SimulatedAnchorReceipt
} from "../lib/anchorReceipt";
import { CounselQuestionsPanel } from "./CounselQuestionsPanel";
import { downloadMarkdownFile, printCounselPackPdf } from "../lib/counselPack";
import {
  downloadCounselHandoffChecklistJson,
  type CounselHandoffChecklist,
  type CounselHandoffChecklistItemStatus,
  type CounselHandoffChecklistStatus
} from "../lib/counselHandoffChecklist";
import {
  downloadCounselPackVersionDiffJson,
  downloadCounselPackVersionJson,
  type CounselPackVersionRecord
} from "../lib/counselPackVersions";
import type { CounselPackTemplate, CounselPackTemplateId } from "../lib/counselPackTemplates";
import type { CounselReviewItem, CounselReviewStatus } from "../lib/counselReview";
import {
  createCounselPackExportRecordReceipt,
  downloadCounselPackExportRecordReceiptJson
} from "../lib/counselPackExportRecordReceipt";
import type { CounselQuestion } from "../lib/counselQuestions";
import type { DataBoundaryReport } from "../lib/dataBoundary";
import type { SubmissionFit } from "../lib/auditEngine";
import { downloadManifestJson, type EvidenceManifest } from "../lib/evidenceManifest";
import type { CounselPackExportRecord } from "../lib/phase2Types";
import {
  downloadRegulatorySourcePackJson,
  type RegulatorySourcePack
} from "../lib/regulatorySourcePack";

const SERVER_EXPORT_ERROR_BOUNDARY =
  "Not legal advice. Counsel Pack export errors are audit preparation workflow metadata only.";

type CounselPackPanelProps = {
  projectName: string;
  fit: SubmissionFit;
  manifest: EvidenceManifest | null;
  regulatorySourcePack: RegulatorySourcePack | null;
  markdown: string;
  counselQuestions: CounselQuestion[];
  counselReviews: CounselReviewItem[];
  exportTemplates: CounselPackTemplate[];
  selectedExportTemplate: CounselPackTemplate;
  recommendedExportTemplateId: CounselPackTemplateId;
  dataBoundaryReport: DataBoundaryReport;
  handoffChecklist: CounselHandoffChecklist | null;
  counselPackVersions: CounselPackVersionRecord[];
  serverExportRecords: CounselPackExportRecord[];
  onSelectExportTemplate: (id: CounselPackTemplateId) => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (id: string, updates: Partial<CounselQuestion>) => void;
  onRemoveQuestion: (id: string) => void;
  onUpdateReview: (id: string, updates: Partial<CounselReviewItem>) => void;
  onSaveVersion: () => Promise<void> | void;
  onCreateServerExport: (apiBaseUrl: string) => Promise<void> | void;
};

type ServerExportErrorState = {
  message: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary: string;
};

export function CounselPackPanel({
  projectName,
  fit,
  manifest,
  regulatorySourcePack,
  markdown,
  counselQuestions,
  counselReviews,
  exportTemplates,
  selectedExportTemplate,
  recommendedExportTemplateId,
  dataBoundaryReport,
  handoffChecklist,
  counselPackVersions,
  serverExportRecords,
  onSelectExportTemplate,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onUpdateReview,
  onSaveVersion,
  onCreateServerExport
}: CounselPackPanelProps) {
  const [receipt, setReceipt] = useState<SimulatedAnchorReceipt | null>(null);
  const [printError, setPrintError] = useState("");
  const [versionError, setVersionError] = useState("");
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [serverExportApiBaseUrl, setServerExportApiBaseUrl] = useState("");
  const [serverExportError, setServerExportError] = useState<ServerExportErrorState | null>(null);
  const [isCreatingServerExport, setIsCreatingServerExport] = useState(false);
  const exportBlocked = !dataBoundaryReport.exportAllowed;
  const exportBlockReason = "Resolve blocked data boundary findings before export handoff.";

  const createReceipt = () => {
    if (!manifest) {
      return;
    }
    setReceipt(createSimulatedAnchorReceipt(manifest, "ethereum-sepolia"));
  };

  const printCounselPack = () => {
    setPrintError("");
    try {
      printCounselPackPdf(`${projectName} Counsel Pack`, markdown);
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : "Unable to open counsel pack print window.");
    }
  };

  const saveVersion = async () => {
    setVersionError("");
    setIsSavingVersion(true);
    try {
      await onSaveVersion();
    } catch (error) {
      setVersionError(error instanceof Error ? error.message : "Unable to save Counsel Pack version.");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const createServerExport = async () => {
    setServerExportError(null);
    setIsCreatingServerExport(true);
    try {
      await onCreateServerExport(serverExportApiBaseUrl);
    } catch (error) {
      setServerExportError(toServerExportErrorState(error));
    } finally {
      setIsCreatingServerExport(false);
    }
  };

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={FileText}
        title="Counsel Pack"
        subtitle="Download a Markdown audit-prep packet with non-advice disclaimer, facts, flags, owners, manifest hash, and sources."
      />

      <div className="submission-strip">
        {fit.requiredAssets.map((asset) => (
          <span key={asset}>
            <CheckCircle2 size={15} aria-hidden="true" />
            {asset}
          </span>
        ))}
      </div>

      <ExportTemplatePanel
        templates={exportTemplates}
        selectedTemplate={selectedExportTemplate}
        recommendedTemplateId={recommendedExportTemplateId}
        onSelectTemplate={onSelectExportTemplate}
      />

      <ExportSafetyGatePanel report={dataBoundaryReport} />

      <CounselHandoffChecklistPanel projectName={projectName} checklist={handoffChecklist} />

      <CounselQuestionsPanel
        questions={counselQuestions}
        onAddQuestion={onAddQuestion}
        onUpdateQuestion={onUpdateQuestion}
        onRemoveQuestion={onRemoveQuestion}
      />

      <CounselReviewStatusPanel reviews={counselReviews} onUpdateReview={onUpdateReview} />

      <div className="counsel-actions">
        <div>
          <span>Manifest bundle SHA-256</span>
          <code>{manifest?.bundleHash ?? "calculating"}</code>
        </div>
        <div>
          <span>Source pack SHA-256</span>
          <code>{regulatorySourcePack?.packHash ?? "calculating"}</code>
        </div>
        <div className="export-buttons">
          <button
            type="button"
            disabled={exportBlocked}
            onClick={() => downloadMarkdownFile(`${slug(projectName)}-counsel-pack.md`, markdown)}
          >
            <Download size={16} aria-hidden="true" />
            Download Markdown
          </button>
          <button type="button" className="secondary" disabled={exportBlocked} onClick={printCounselPack}>
            <Printer size={16} aria-hidden="true" />
            Print / Save PDF
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!manifest || exportBlocked}
            onClick={() => manifest && downloadManifestJson(`${slug(projectName)}-manifest.json`, manifest)}
          >
            <Download size={16} aria-hidden="true" />
            Download Manifest JSON
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!regulatorySourcePack || exportBlocked}
            onClick={() =>
              regulatorySourcePack &&
              downloadRegulatorySourcePackJson(`${slug(projectName)}-regulatory-source-pack.json`, regulatorySourcePack)
            }
          >
            <Download size={16} aria-hidden="true" />
            Download Source Pack JSON
          </button>
          <button type="button" className="secondary" disabled={!manifest || exportBlocked} onClick={createReceipt}>
            <Anchor size={16} aria-hidden="true" />
            {!manifest ? "Calculating Anchor Receipt" : receipt ? "Refresh Receipt" : "Create Simulated Anchor Receipt"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!manifest || isSavingVersion || exportBlocked}
            onClick={saveVersion}
          >
            <Save size={16} aria-hidden="true" />
            {isSavingVersion ? "Saving Version" : "Save Pack Version"}
          </button>
        </div>
        {exportBlocked ? <p className="save-state">{exportBlockReason}</p> : null}
        {printError ? <p className="save-state">{printError}</p> : null}
        {versionError ? <p className="save-state">{versionError}</p> : null}
      </div>

      <CounselPackVersionsPanel projectName={projectName} versions={counselPackVersions} />
      <ServerExportRecordsPanel
        projectName={projectName}
        apiBaseUrl={serverExportApiBaseUrl}
        error={serverExportError}
        isCreating={isCreatingServerExport}
        records={serverExportRecords}
        canCreate={counselPackVersions.length > 0 && dataBoundaryReport.exportAllowed}
        disabledReason={
          dataBoundaryReport.exportAllowed ? "Save a Pack Version before creating a server export record." : exportBlockReason
        }
        onApiBaseUrlChange={setServerExportApiBaseUrl}
        onCreate={createServerExport}
      />

      {receipt ? (
        <section className="anchor-receipt">
          <div className="panel-title compact-title">
            <Anchor size={17} aria-hidden="true" />
            <h3>Simulated Anchor Receipt</h3>
          </div>
          <div className="receipt-grid">
            <ReceiptFact label="Mode" value={receipt.mode} />
            <ReceiptFact label="Status" value={receipt.status} />
            <ReceiptFact label="Network" value={receipt.network} />
            <ReceiptFact label="Receipt ID" value={receipt.receiptId} />
            <ReceiptFact label="Bundle hash" value={receipt.bundleHash} wide />
          </div>
          <p>{receipt.disclaimer}</p>
          <button
            type="button"
            className="secondary"
            onClick={() => downloadAnchorReceiptJson(`${slug(projectName)}-anchor-receipt.json`, receipt)}
          >
            <Download size={16} aria-hidden="true" />
            Download Receipt JSON
          </button>
        </section>
      ) : null}

      <pre className="memo">{markdown}</pre>
    </section>
  );
}

function CounselHandoffChecklistPanel({
  projectName,
  checklist
}: {
  projectName: string;
  checklist: CounselHandoffChecklist | null;
}) {
  const visibleItems = checklist?.items.slice(0, 7) ?? [];

  return (
    <section
      className={`counsel-handoff-checklist ${checklist?.overallStatus ?? "needs-action"}`}
      role="region"
      aria-label="Counsel Handoff Checklist"
    >
      <div className="handoff-checklist-header">
        <div className="panel-title compact-title">
          <ClipboardCheck size={17} aria-hidden="true" />
          <h3>Counsel Handoff Checklist</h3>
        </div>
        <span className={`handoff-status ${checklist?.overallStatus ?? "needs-action"}`}>
          {checklist ? formatHandoffStatus(checklist.overallStatus) : "Handoff calculating"}
        </span>
      </div>
      <p className="section-note">
        {checklist?.notLegalAdviceBoundary ??
          "Not legal advice. Counsel handoff checklists are audit preparation workflow metadata only."}
      </p>

      {!checklist ? <p className="empty-state">Counsel handoff checklist is calculating from current export metadata.</p> : null}

      {checklist ? (
        <>
          <div className="handoff-checklist-summary">
            <ChecklistFact label="Checklist hash" value={checklist.checklistHash} wide />
            <ChecklistFact label="Handoff" value={checklist.handoffAllowed ? "allowed" : "blocked"} />
            <ChecklistFact label="Ready" value={String(checklist.readyCount)} />
            <ChecklistFact label="Needs review" value={String(checklist.needsReviewCount)} />
            <ChecklistFact label="Needs action" value={String(checklist.needsActionCount)} />
            <ChecklistFact label="Blocked" value={String(checklist.blockedCount)} />
          </div>
          <div className="handoff-checklist-actions">
            <strong>{checklist.handoffAllowed ? "Handoff allowed" : formatHandoffStatus(checklist.overallStatus)}</strong>
            <span>{checklist.itemCount} artifact and workflow checks</span>
            <button
              type="button"
              className="secondary"
              onClick={() => downloadCounselHandoffChecklistJson(`${slug(projectName)}-handoff-checklist.json`, checklist)}
            >
              <Download size={16} aria-hidden="true" />
              Download Handoff Checklist JSON
            </button>
          </div>
          <div className="handoff-checklist-grid">
            {visibleItems.map((item) => (
              <article key={item.id} className={`handoff-checklist-item ${item.status}`}>
                <header>
                  <strong>{item.label}</strong>
                  <span>{formatItemStatus(item.status)}</span>
                </header>
                <p>{item.evidence}</p>
                <small>{item.recoveryAction}</small>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ExportTemplatePanel({
  templates,
  selectedTemplate,
  recommendedTemplateId,
  onSelectTemplate
}: {
  templates: CounselPackTemplate[];
  selectedTemplate: CounselPackTemplate;
  recommendedTemplateId: CounselPackTemplateId;
  onSelectTemplate: (id: CounselPackTemplateId) => void;
}) {
  return (
    <section className="export-template-panel">
      <div className="export-template-header">
        <label className="editor-field" htmlFor="counsel-pack-export-template">
          <span className="field-label">Export template</span>
          <select
            id="counsel-pack-export-template"
            value={selectedTemplate.id}
            onChange={(event) => onSelectTemplate(event.target.value as CounselPackTemplateId)}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
        </label>
        <div className="export-template-summary">
          <div>
            <strong>{selectedTemplate.title}</strong>
            {selectedTemplate.id === recommendedTemplateId ? <span>Recommended for current project</span> : null}
          </div>
          <p>{selectedTemplate.summary}</p>
          <small>{selectedTemplate.notLegalAdviceBoundary}</small>
        </div>
      </div>
      <div className="export-template-grid">
        <TemplateList title="Review agenda" items={selectedTemplate.reviewAgenda} />
        <TemplateList title="Evidence focus" items={selectedTemplate.evidenceFocus} />
      </div>
    </section>
  );
}

function ExportSafetyGatePanel({ report }: { report: DataBoundaryReport }) {
  const statusLabel =
    report.status === "blocked" ? "Blocked for export" : report.status === "needs-review" ? "Needs human review" : "Clean for export";
  const visibleFindings = report.findings.slice(0, 5);

  return (
    <section className={`data-boundary-panel ${report.status}`}>
      <div className="data-boundary-header">
        <div className="panel-title compact-title">
          <ShieldAlert size={17} aria-hidden="true" />
          <h3>Export Safety Gate</h3>
        </div>
        <span className={`boundary-status ${report.status}`}>{statusLabel}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="data-boundary-metrics">
        <BoundaryFact label="Blockers" value={String(report.blockerCount)} />
        <BoundaryFact label="Warnings" value={String(report.warningCount)} />
        <BoundaryFact label="Export allowed" value={report.exportAllowed ? "yes" : "no"} />
        <BoundaryFact label="Classes" value={report.detectedClasses.join(", ") || "none"} wide />
      </div>
      {visibleFindings.length === 0 ? (
        <p className="empty-state">No blocked export findings detected. Review before external handoff.</p>
      ) : (
        <div className="data-boundary-findings">
          {visibleFindings.map((finding, index) => (
            <article key={`${finding.sourceType}-${finding.sourceLabel}-${finding.dataClass}-${finding.severity}-${index}`}>
              <header>
                <span className={`boundary-severity ${finding.severity}`}>{finding.severity}</span>
                <strong>{finding.dataClass}</strong>
                <small>
                  {finding.sourceType} · {finding.sourceLabel} · {finding.matchCount} match
                  {finding.matchCount === 1 ? "" : "es"}
                </small>
              </header>
              <p>{finding.message}</p>
              <code>{finding.redactedSnippet}</code>
            </article>
          ))}
        </div>
      )}
      <div className="data-boundary-remediation">
        <span>Remediation</span>
        <ul>
          {report.remediation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BoundaryFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "wide" : ""}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChecklistFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "wide" : ""}>
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function formatHandoffStatus(status: CounselHandoffChecklistStatus): string {
  if (status === "needs-action") {
    return "Handoff needs action";
  }
  if (status === "needs-review") {
    return "Handoff needs review";
  }
  if (status === "blocked") {
    return "Handoff blocked";
  }
  return "Handoff ready";
}

function formatItemStatus(status: CounselHandoffChecklistItemStatus): string {
  if (status === "needs-action") {
    return "needs action";
  }
  if (status === "needs-review") {
    return "needs review";
  }
  return status;
}

function TemplateList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <span>{title}</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ServerExportRecordsPanel({
  projectName,
  apiBaseUrl,
  error,
  isCreating,
  records,
  canCreate,
  disabledReason,
  onApiBaseUrlChange,
  onCreate
}: {
  projectName: string;
  apiBaseUrl: string;
  error: ServerExportErrorState | null;
  isCreating: boolean;
  records: CounselPackExportRecord[];
  canCreate: boolean;
  disabledReason: string;
  onApiBaseUrlChange: (value: string) => void;
  onCreate: () => Promise<void> | void;
}) {
  const downloadReceipt = async (record: CounselPackExportRecord) => {
    const receipt = await createCounselPackExportRecordReceipt(record);
    downloadCounselPackExportRecordReceiptJson(
      `${slug(projectName)}-server-export-v${record.version}-receipt.json`,
      receipt
    );
  };

  return (
    <section className="server-export-panel">
      <div className="panel-title compact-title">
        <ServerCog size={17} aria-hidden="true" />
        <h3>Server Export Records</h3>
      </div>
      <p className="section-note">
        Create a Phase 2 API record for the latest Counsel Pack version using hashes and metadata only. Not legal advice.
      </p>
      <div className="server-export-controls">
        <label className="editor-field" htmlFor="server-export-api-base">
          <span className="field-label">Server export API base URL</span>
          <input
            id="server-export-api-base"
            value={apiBaseUrl}
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
            placeholder="/api on same host, or http://127.0.0.1:8787"
          />
        </label>
        <button type="button" className="secondary" disabled={!canCreate || isCreating} onClick={() => void onCreate()}>
          <ServerCog size={16} aria-hidden="true" />
          {isCreating ? "Creating Server Export Record" : "Create Server Export Record"}
        </button>
      </div>
      {!canCreate ? <p className="empty-state">{disabledReason}</p> : null}
      {error ? (
        <div className="save-state server-export-error" role="status">
          <p>{error.message}</p>
          {error.code ? <code>{error.code}</code> : null}
          {error.recoveryAction ? <small>{error.recoveryAction}</small> : null}
          <small>{error.notLegalAdviceBoundary}</small>
        </div>
      ) : null}
      {records.length === 0 ? (
        <p className="empty-state">No server Counsel Pack export records have been created for this project yet.</p>
      ) : (
        <div className="server-export-list">
          {records.slice(0, 5).map((record) => (
            <article key={record.id} className="server-export-row">
              <header>
                <span>Server v{record.version}</span>
                <div>
                  <strong>{record.title}</strong>
                  <small>
                    {record.id} · {record.format} · {record.status}
                  </small>
                </div>
              </header>
              <div className="counsel-version-facts">
                <VersionFact label="Manifest" value={shortHash(record.manifestHash)} />
                <VersionFact label="Artifact" value={shortHash(record.artifactHash)} />
                <VersionFact label="Sources" value={String(record.sourceCount)} />
                <VersionFact label="Source Pack" value={shortHash(record.sourcePackHash)} />
                <VersionFact label="Source Review" value={record.sourceReviewStatus} />
                <VersionFact label="Reviewed" value={`${record.reviewSummary.reviewed}/${record.reviewSummary.total}`} />
              </div>
              <small>{record.notLegalAdviceBoundary}</small>
              <button type="button" className="secondary" onClick={() => void downloadReceipt(record)}>
                <Download size={16} aria-hidden="true" />
                Download Server Export Receipt JSON
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CounselPackVersionsPanel({
  projectName,
  versions
}: {
  projectName: string;
  versions: CounselPackVersionRecord[];
}) {
  const visibleVersions = versions.slice(0, 5);

  return (
    <section className="counsel-version-panel">
      <div className="panel-title compact-title">
        <History size={17} aria-hidden="true" />
        <h3>Counsel Pack Versions</h3>
      </div>
      <p className="section-note">
        Save export metadata before external handoff. Not legal advice; version records are audit preparation metadata only.
      </p>
      {visibleVersions.length === 0 ? (
        <p className="empty-state">No Counsel Pack version records saved for {projectName || "this project"} yet.</p>
      ) : (
        <div className="counsel-version-list">
          {visibleVersions.map((record) => (
            <article key={record.id} className="counsel-version-row">
              <header>
                <span>Version {record.version}</span>
                <div>
                  <strong>{record.title}</strong>
                  <small>
                    {formatDateTime(record.exportedAt)} · {record.riskLevel} risk · {record.reviewSummary.open} open review items
                  </small>
                </div>
              </header>
              <div className="counsel-version-facts">
                <VersionFact label="Manifest" value={shortHash(record.manifestHash)} />
                <VersionFact label="Markdown" value={shortHash(record.markdownHash)} />
                <VersionFact label="Sources" value={String(record.sourcePack.length)} />
                <VersionFact label="Source Pack" value={record.regulatorySourcePack ? shortHash(record.regulatorySourcePack.packHash) : "missing"} />
                <VersionFact label="Source Review" value={record.regulatorySourcePack?.sourceReviewStatus ?? "metadata-missing"} />
                <VersionFact label="Reviewed" value={`${record.reviewSummary.reviewed}/${record.reviewSummary.total}`} />
              </div>
              <p className="counsel-version-diff">
                {record.diffFromPrevious?.summary ?? "Baseline export. No previous version diff."}
              </p>
              <small>{record.notLegalAdviceBoundary}</small>
              <button
                type="button"
                className="secondary"
                onClick={() => downloadCounselPackVersionJson(`${slug(projectName)}-counsel-pack-v${record.version}.json`, record)}
              >
                <Download size={16} aria-hidden="true" />
                Download Version JSON
              </button>
              {record.diffFromPrevious ? (
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    downloadCounselPackVersionDiffJson(
                      `${slug(projectName)}-counsel-pack-v${record.version}-diff.json`,
                      record.diffFromPrevious!
                    )
                  }
                >
                  <Download size={16} aria-hidden="true" />
                  Download Diff JSON
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CounselReviewStatusPanel({
  reviews,
  onUpdateReview
}: {
  reviews: CounselReviewItem[];
  onUpdateReview: (id: string, updates: Partial<CounselReviewItem>) => void;
}) {
  return (
    <section className="review-status-panel">
      <div className="panel-title compact-title">
        <CheckCircle2 size={17} aria-hidden="true" />
        <h3>Counsel Review Status</h3>
      </div>
      <p className="section-note">
        Track counsel and compliance review readiness for each deterministic risk flag. Not legal advice.
      </p>
      <div className="review-status-list">
        {reviews.length === 0 ? <p className="empty-state">No risk flags require counsel review yet.</p> : null}
        {reviews.map((review, index) => {
          const sequence = index + 1;
          return (
            <article key={review.id} className={`review-status-card ${review.status}`}>
              <header>
                <span className={`priority ${review.priority}`}>{review.priority}</span>
                <div>
                  <strong>{review.title}</strong>
                  <small>
                    {review.owner} · {review.severity} · {review.evidenceSummary}
                  </small>
                </div>
              </header>
              <div className="review-status-grid">
                <label className="editor-field" htmlFor={`review-${sequence}-status`}>
                  <span className="field-label">Status</span>
                  <select
                    id={`review-${sequence}-status`}
                    aria-label={`Status for review ${sequence}`}
                    value={review.status}
                    onChange={(event) => onUpdateReview(review.id, { status: event.target.value as CounselReviewStatus })}
                  >
                    <option value="not-started">not-started</option>
                    <option value="needs-evidence">needs-evidence</option>
                    <option value="ready-for-counsel">ready-for-counsel</option>
                    <option value="reviewed">reviewed</option>
                    <option value="blocked">blocked</option>
                  </select>
                </label>
                <label className="editor-field" htmlFor={`review-${sequence}-reviewer`}>
                  <span className="field-label">Reviewer</span>
                  <input
                    id={`review-${sequence}-reviewer`}
                    aria-label={`Reviewer for review ${sequence}`}
                    value={review.reviewer}
                    onChange={(event) => onUpdateReview(review.id, { reviewer: event.target.value })}
                    placeholder="Counsel or compliance owner"
                  />
                </label>
                <label className="editor-field review-note-field" htmlFor={`review-${sequence}-note`}>
                  <span className="field-label">Review note</span>
                  <textarea
                    id={`review-${sequence}-note`}
                    aria-label={`Review note ${sequence}`}
                    value={review.reviewerNote}
                    onChange={(event) => onUpdateReview(review.id, { reviewerNote: event.target.value })}
                    placeholder="Decision, blocker, or evidence request"
                  />
                </label>
              </div>
              <small>{review.notLegalAdviceBoundary}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReceiptFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "wide" : ""}>
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function VersionFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function shortHash(value: string | undefined): string {
  if (!value) {
    return "missing";
  }
  return value.length > 16 ? `${value.slice(0, 12)}...${value.slice(-4)}` : value;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "lexproof"
  );
}

function toServerExportErrorState(error: unknown): ServerExportErrorState {
  if (!(error instanceof Error)) {
    return {
      message: "Unable to create server Counsel Pack export record.",
      notLegalAdviceBoundary: SERVER_EXPORT_ERROR_BOUNDARY
    };
  }

  const details = error as Error & {
    code?: unknown;
    recoveryAction?: unknown;
    notLegalAdviceBoundary?: unknown;
  };

  return {
    message: error.message || "Unable to create server Counsel Pack export record.",
    ...(typeof details.code === "string" && details.code.trim() ? { code: details.code.trim() } : {}),
    ...(typeof details.recoveryAction === "string" && details.recoveryAction.trim()
      ? { recoveryAction: details.recoveryAction.trim() }
      : {}),
    notLegalAdviceBoundary:
      typeof details.notLegalAdviceBoundary === "string" && details.notLegalAdviceBoundary.startsWith("Not legal advice.")
        ? details.notLegalAdviceBoundary
        : SERVER_EXPORT_ERROR_BOUNDARY
  };
}
