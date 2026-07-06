import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, ClipboardList, DatabaseZap, Download, FileText, PlayCircle, RefreshCcw, ServerCog, ShieldCheck, UserCheck } from "lucide-react";
import type { AuditResult } from "../lib/auditEngine";
import { AuditLogClientError, fetchAuditLogRecords } from "../lib/auditLogClient";
import {
  createAuditLogExport,
  downloadAuditLogJson,
  type AuditLogExportRecord
} from "../lib/auditLogExport";
import type { AuditLogFilterInput } from "../lib/auditLogFilters";
import {
  createModelGatewayEvaluationRecord,
  downloadModelGatewayEvaluationJson,
  type ModelGatewayEvaluationRecord
} from "../lib/modelGatewayEvaluation";
import {
  createModelGatewayRunReceipt,
  downloadModelGatewayRunReceiptJson
} from "../lib/modelGatewayRunReceipt";
import { ModelGatewayRunClientError, fetchModelGatewayRuns } from "../lib/modelGatewayRunClient";
import type { ModelConnectReceipt } from "../lib/modelConnect";
import { createModelGatewayRunSummary, type AuditLogRecord, type ModelGatewayRun, type ModelGatewayRunSummary } from "../lib/phase2Types";
import type { ProjectProfile } from "../lib/projectModel";
import { runSecureReviewJourney, type SecureReviewJourneyResult } from "../lib/secureReviewJourney";

const SECURE_JOURNEY_ERROR_BOUNDARY =
  "Not legal advice. Secure review journey errors are audit preparation workflow metadata only.";

type SecureReviewWorkspaceProps = {
  project: ProjectProfile;
  audit: AuditResult;
  projectReady: boolean;
  evidenceCount: number;
  auditRiskLevel: AuditResult["riskLevel"];
  modelConnectReceipt: ModelConnectReceipt | null;
  humanReviewOpenCount: number;
  humanReviewOwner: string;
  manifestHash?: string;
  onNavigate: (target: "wizard" | "ai" | "model" | "review" | "evidence" | "counsel") => void;
  onModelGatewayEvaluationChange?: (evaluation: ModelGatewayEvaluationRecord | null) => void;
  onAuditLogExportChange?: (record: AuditLogExportRecord | null) => void;
};

type SecureJourneyErrorState = {
  message: string;
  code?: string;
  runId?: string;
  retryState?: string;
  recoveryAction?: string;
  remediationSteps: string[];
  notLegalAdviceBoundary: string;
};

export function SecureReviewWorkspace({
  project,
  audit,
  projectReady,
  evidenceCount,
  auditRiskLevel,
  modelConnectReceipt,
  humanReviewOpenCount,
  humanReviewOwner,
  manifestHash,
  onNavigate,
  onModelGatewayEvaluationChange,
  onAuditLogExportChange
}: SecureReviewWorkspaceProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [journeyStatus, setJourneyStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [journeyError, setJourneyError] = useState<SecureJourneyErrorState | null>(null);
  const [journeyResult, setJourneyResult] = useState<SecureReviewJourneyResult | null>(null);
  const modelReady = modelConnectReceipt?.status === "ready";
  const manifestReady = Boolean(manifestHash);
  const reviewReady = humanReviewOpenCount === 0;

  const runJourney = async () => {
    setJourneyStatus("running");
    setJourneyError(null);
    setJourneyResult(null);
    onModelGatewayEvaluationChange?.(null);
    onAuditLogExportChange?.(null);

    try {
      const result = await runSecureReviewJourney({
        project,
        audit,
        evidenceItems: project.evidenceItems,
        modelConnectReceipt,
        apiBaseUrl,
        humanReviewOwner
      });
      setJourneyResult(result);
      onModelGatewayEvaluationChange?.(createModelGatewayEvaluationRecord(result.modelGatewayRun));
      onAuditLogExportChange?.(
        createAuditLogExport({
          workspaceId: result.workspace.id,
          records: result.auditLogRecords
        })
      );
      setJourneyStatus("complete");
    } catch (error) {
      setJourneyStatus("error");
      setJourneyError(toSecureJourneyErrorState(error));
      onModelGatewayEvaluationChange?.(null);
      onAuditLogExportChange?.(null);
    }
  };

  return (
    <section className="secure-workspace-panel" aria-label="Secure Review Workspace">
      <div className="secure-workspace-header">
        <div>
          <p className="eyebrow">Secure Review Workspace</p>
          <h2>Secure Review Workspace</h2>
          <p>Not legal advice. Secure review workspace records are audit preparation materials only.</p>
        </div>
        <div className={`secure-risk ${auditRiskLevel}`}>
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{auditRiskLevel} risk</span>
        </div>
      </div>

      <div className="secure-flow-grid">
        <WorkflowStep
          icon={ClipboardList}
          title="Project Facts"
          status={projectReady ? "ready" : "needs-input"}
          detail={projectReady ? "Workspace facts are ready for deterministic audit." : "Complete required project facts first."}
          actionLabel="Review facts"
          onAction={() => onNavigate("wizard")}
        />
        <WorkflowStep
          icon={DatabaseZap}
          title="Evidence Vault"
          status={evidenceCount > 0 ? "ready" : "needs-input"}
          detail={evidenceCount > 0 ? `${evidenceCount} evidence records available.` : "Add or request evidence before review handoff."}
          actionLabel="Manage evidence"
          onAction={() => onNavigate("evidence")}
        />
        <WorkflowStep
          icon={Bot}
          title="Model Connect"
          status={modelReady ? "ready" : "needs-input"}
          detail={modelReady ? `${modelConnectReceipt.providerLabel} validated.` : "Validate a mock or session-only model connection."}
          actionLabel="Connect Model"
          onAction={() => onNavigate("ai")}
        />
        <WorkflowStep
          icon={UserCheck}
          title="Human Review"
          status={reviewReady ? "ready" : "needs-review"}
          detail={reviewReady ? "No open review decisions." : `${humanReviewOpenCount} review decisions need human attention.`}
          actionLabel="Open queue"
          onAction={() => onNavigate("review")}
        />
        <WorkflowStep
          icon={FileText}
          title="Counsel Pack"
          status={manifestReady ? "ready" : "needs-input"}
          detail={manifestReady ? `Manifest ${manifestHash?.slice(0, 12)}... ready.` : "Manifest is still being generated."}
          actionLabel="Prepare pack"
          onAction={() => onNavigate("counsel")}
        />
      </div>

      <section className={`secure-journey-panel ${journeyStatus}`}>
        <div className="split-title compact-title">
          <div>
            <ServerCog size={17} aria-hidden="true" />
            <h3>Secure Review Journey</h3>
          </div>
          <span className={`workflow-status ${journeyStatus}`}>{journeyStatus}</span>
        </div>
        <p>
          Create a backend workspace, sync metadata-only evidence vault records, create a Model Gateway run receipt, and open a
          human review request. Not legal advice.
        </p>
        <div className="secure-journey-controls">
          <div>
            <label className="field-label" htmlFor="secure-review-api-base">
              Secure Review API base URL
            </label>
            <input
              id="secure-review-api-base"
              value={apiBaseUrl}
              onChange={(event) => setApiBaseUrl(event.target.value)}
              placeholder="/api on same host, or http://127.0.0.1:8787"
            />
          </div>
          <button type="button" disabled={journeyStatus === "running"} onClick={() => void runJourney()}>
            <PlayCircle size={16} aria-hidden="true" />
            {journeyStatus === "running" ? "Running Secure Review Journey" : "Run Secure Review Journey"}
          </button>
        </div>
        {journeyError ? (
          <SecureJourneyError error={journeyError} onNavigate={onNavigate} />
        ) : null}
        {journeyResult ? (
          <SecureJourneyResult result={journeyResult} apiBaseUrl={apiBaseUrl} onAuditLogExportChange={onAuditLogExportChange} />
        ) : null}
      </section>
    </section>
  );
}

type WorkflowStepProps = {
  icon: typeof ClipboardList;
  title: string;
  status: "ready" | "needs-input" | "needs-review";
  detail: string;
  actionLabel: string;
  onAction: () => void;
};

function WorkflowStep({ icon: Icon, title, status, detail, actionLabel, onAction }: WorkflowStepProps) {
  return (
    <article className={`secure-flow-step ${status}`}>
      <header>
        <Icon size={17} aria-hidden="true" />
        <span>{statusLabel(status)}</span>
      </header>
      <strong>{title}</strong>
      <p>{detail}</p>
      <button type="button" className="secondary" onClick={onAction}>
        <CheckCircle2 size={15} aria-hidden="true" />
        {actionLabel}
      </button>
    </article>
  );
}

function statusLabel(status: WorkflowStepProps["status"]): string {
  if (status === "ready") {
    return "ready";
  }

  if (status === "needs-review") {
    return "needs review";
  }

  return "needs input";
}

function SecureJourneyResult({
  result,
  apiBaseUrl,
  onAuditLogExportChange
}: {
  result: SecureReviewJourneyResult;
  apiBaseUrl: string;
  onAuditLogExportChange?: SecureReviewWorkspaceProps["onAuditLogExportChange"];
}) {
  const evaluation = createModelGatewayEvaluationRecord(result.modelGatewayRun);

  return (
    <div className="secure-journey-result">
      <strong>Secure review journey complete</strong>
      <div className="run-facts">
        <JourneyFact label="Vault manifest" value={shortHash(result.evidenceVault.manifest.bundleHash)} />
        <JourneyFact label="Model Gateway response" value={shortHash(result.modelGatewayRun.responseHash)} />
        <JourneyFact label="Human review request" value={result.humanReview.id} />
        <JourneyFact label="Audit log events" value={String(result.auditLogRecords.length)} />
      </div>
      <small>{result.notLegalAdviceBoundary}</small>
      <AuditLogExplorerPanel
        apiBaseUrl={apiBaseUrl}
        workspaceId={result.workspace.id}
        initialRecords={result.auditLogRecords}
        onAuditLogExportChange={onAuditLogExportChange}
      />
      <ModelGatewayRunLedgerPanel apiBaseUrl={apiBaseUrl} workspaceId={result.workspace.id} initialRun={result.modelGatewayRun} />
      <ModelGatewayEvaluationPanel evaluation={evaluation} />
    </div>
  );
}

type AuditLogExplorerStatus = "idle" | "syncing" | "synced" | "error";

function AuditLogExplorerPanel({
  apiBaseUrl,
  workspaceId,
  initialRecords,
  onAuditLogExportChange
}: {
  apiBaseUrl: string;
  workspaceId: string;
  initialRecords: AuditLogRecord[];
  onAuditLogExportChange?: SecureReviewWorkspaceProps["onAuditLogExportChange"];
}) {
  const [records, setRecords] = useState<AuditLogRecord[]>(initialRecords);
  const [filters, setFilters] = useState<AuditLogFilterInput>({});
  const [refreshStatus, setRefreshStatus] = useState<AuditLogExplorerStatus>("idle");
  const [refreshError, setRefreshError] = useState("");
  const [refreshRecoveryAction, setRefreshRecoveryAction] = useState("");
  const exportRecord = useMemo(
    () =>
      createAuditLogExport({
        workspaceId,
        records
      }),
    [records, workspaceId]
  );
  const latestAction = exportRecord.events.at(-1)?.action ?? "none";
  const visibleEvents = exportRecord.events.slice(-4).reverse();

  useEffect(() => {
    onAuditLogExportChange?.(exportRecord);
  }, [exportRecord, onAuditLogExportChange]);

  useEffect(() => {
    setRecords(initialRecords);
    setRefreshStatus("idle");
    setRefreshError("");
    setRefreshRecoveryAction("");
  }, [initialRecords, workspaceId]);

  const updateFilter = (key: keyof AuditLogFilterInput, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  };

  const refreshAuditLog = async () => {
    setRefreshStatus("syncing");
    setRefreshError("");
    setRefreshRecoveryAction("");

    try {
      const nextRecords = await fetchAuditLogRecords({
        apiBaseUrl,
        workspaceId,
        filters
      });
      setRecords(nextRecords);
      setRefreshStatus("synced");
    } catch (error) {
      setRefreshStatus("error");
      if (error instanceof AuditLogClientError) {
        setRefreshError(error.message);
        setRefreshRecoveryAction(error.recoveryAction);
        return;
      }
      setRefreshError(error instanceof Error ? error.message : "Audit Log refresh failed.");
      setRefreshRecoveryAction("Start the Phase 2 API, use supported filters, and retry Audit Log refresh.");
    }
  };

  return (
    <section className="audit-log-export" aria-label="Server Audit Log Explorer">
      <div className="split-title compact-title">
        <div>
          <ClipboardList size={17} aria-hidden="true" />
          <h3>Server Audit Log Explorer</h3>
        </div>
        <span className="workflow-status complete">{exportRecord.eventCount} events</span>
      </div>
      <p className="section-note">{exportRecord.notLegalAdviceBoundary}</p>
      <p className="section-note">{exportRecord.integritySummary}</p>
      <div className="audit-log-filter-grid">
        <label>
          <span>Audit log actor</span>
          <input
            value={filters.actorId ?? ""}
            onChange={(event) => updateFilter("actorId", event.target.value)}
            placeholder="Compliance"
          />
        </label>
        <label>
          <span>Audit log action</span>
          <input
            value={filters.action ?? ""}
            onChange={(event) => updateFilter("action", event.target.value)}
            placeholder="human-review.updated"
          />
        </label>
        <label>
          <span>Audit log target type</span>
          <select value={filters.targetType ?? ""} onChange={(event) => updateFilter("targetType", event.target.value)}>
            <option value="">All target types</option>
            <option value="workspace">workspace</option>
            <option value="evidence">evidence</option>
            <option value="model-run">model-run</option>
            <option value="human-review">human-review</option>
            <option value="source-approval">source-approval</option>
            <option value="source-review">source-review</option>
            <option value="integration-policy">integration-policy</option>
            <option value="export">export</option>
          </select>
        </label>
        <label>
          <span>Audit log target ID</span>
          <input
            value={filters.targetId ?? ""}
            onChange={(event) => updateFilter("targetId", event.target.value)}
            placeholder="human-review-full"
          />
        </label>
      </div>
      <div className="model-evaluation-actions">
        <span>Refresh reads metadata-only server records through the Phase 2 Audit Log route.</span>
        <button type="button" className="secondary" disabled={refreshStatus === "syncing"} onClick={() => void refreshAuditLog()}>
          <RefreshCcw size={16} aria-hidden="true" />
          {refreshStatus === "syncing" ? "Refreshing Server Audit Log" : "Refresh Server Audit Log"}
        </button>
      </div>
      {refreshStatus === "synced" ? (
        <span className="save-state">Audit Log refreshed: {records.length} metadata-only record{records.length === 1 ? "" : "s"}.</span>
      ) : null}
      {refreshError ? (
        <div className="provider-policy-error" role="alert">
          <strong>{refreshError}</strong>
          {refreshRecoveryAction ? <span>{refreshRecoveryAction}</span> : null}
          <small>Not legal advice. Audit Log refresh is review workspace metadata only.</small>
        </div>
      ) : null}
      <div className="run-facts audit-log-facts">
        <JourneyFact label="Audit events" value={String(exportRecord.eventCount)} />
        <JourneyFact label="Audit export hash" value={shortHash(exportRecord.exportHash)} />
        <JourneyFact label="Integrity chain" value={shortHash(exportRecord.integrityChainHash)} />
        <JourneyFact label="Integrity status" value={exportRecord.integrityStatus} />
        <JourneyFact label="Last audit action" value={latestAction} />
        <JourneyFact label="Audit actors" value={exportRecord.actors.join(", ") || "none"} />
        <JourneyFact label="Target types" value={exportRecord.targetTypes.join(", ") || "none"} />
      </div>
      <div className="audit-log-event-list" aria-label="Audit Log Events">
        {visibleEvents.length ? (
          visibleEvents.map((event) => (
            <article key={event.id} className="audit-log-event-card">
              <header>
                <span>{event.targetType}</span>
                <strong>{event.action}</strong>
              </header>
              <p>{event.summary}</p>
              <small>
                {event.actorId} · {event.targetId} · {event.createdAt}
              </small>
              <small>
                before {shortHash(event.beforeHash)} · after {shortHash(event.afterHash)}
              </small>
              <small>entry {shortHash(event.entryHash)}</small>
            </article>
          ))
        ) : (
          <p className="empty-state">No Audit Log records match the current filters. Not legal advice.</p>
        )}
      </div>
      <div className="model-evaluation-actions">
        <span>Export includes action counts, before/after hashes, targets, and non-secret summaries.</span>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadAuditLogJson("secure-review-audit-log.json", exportRecord)}
        >
          <Download size={16} aria-hidden="true" />
          Download Audit Log JSON
        </button>
      </div>
    </section>
  );
}

type ModelGatewayRunLedgerStatus = "idle" | "syncing" | "synced" | "error";
type ModelGatewayRunReceiptStatus = "idle" | "building" | "downloaded" | "error";

function ModelGatewayRunLedgerPanel({
  apiBaseUrl,
  workspaceId,
  initialRun
}: {
  apiBaseUrl: string;
  workspaceId: string;
  initialRun: ModelGatewayRun;
}) {
  const [runs, setRuns] = useState<ModelGatewayRunSummary[]>(() => [createModelGatewayRunSummary(initialRun)]);
  const [refreshStatus, setRefreshStatus] = useState<ModelGatewayRunLedgerStatus>("idle");
  const [refreshError, setRefreshError] = useState("");
  const [refreshRecoveryAction, setRefreshRecoveryAction] = useState("");
  const [receiptStatus, setReceiptStatus] = useState<ModelGatewayRunReceiptStatus>("idle");
  const [receiptHash, setReceiptHash] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const visibleRuns = runs.slice(-4).reverse();
  const latestRun = visibleRuns[0];

  useEffect(() => {
    setRuns([createModelGatewayRunSummary(initialRun)]);
    setRefreshStatus("idle");
    setRefreshError("");
    setRefreshRecoveryAction("");
    setReceiptStatus("idle");
    setReceiptHash("");
    setReceiptError("");
  }, [initialRun, workspaceId]);

  const refreshModelRuns = async () => {
    setRefreshStatus("syncing");
    setRefreshError("");
    setRefreshRecoveryAction("");

    try {
      const nextRuns = await fetchModelGatewayRuns({
        apiBaseUrl,
        workspaceId
      });
      setRuns(nextRuns);
      setRefreshStatus("synced");
    } catch (error) {
      setRefreshStatus("error");
      if (error instanceof ModelGatewayRunClientError) {
        setRefreshError(error.message);
        setRefreshRecoveryAction(error.recoveryAction);
        return;
      }
      setRefreshError(error instanceof Error ? error.message : "Model Gateway run refresh failed.");
      setRefreshRecoveryAction("Start the Phase 2 API and retry Model Gateway run refresh.");
    }
  };

  const downloadLatestRunReceipt = async () => {
    if (!latestRun) {
      setReceiptStatus("error");
      setReceiptError("No Model Gateway run is available for receipt export.");
      return;
    }

    setReceiptStatus("building");
    setReceiptError("");

    try {
      const receiptSource = latestRun.id === initialRun.id ? initialRun : latestRun;
      const receipt = await createModelGatewayRunReceipt(receiptSource, { workspaceId });
      downloadModelGatewayRunReceiptJson(`model-gateway-run-${safeFilenamePart(latestRun.id)}-receipt.json`, receipt);
      setReceiptHash(receipt.receiptHash);
      setReceiptStatus("downloaded");
    } catch (error) {
      setReceiptStatus("error");
      setReceiptError(error instanceof Error ? error.message : "Model Gateway run receipt export failed.");
    }
  };

  return (
    <section className="model-run-ledger" aria-label="Server Model Run Ledger">
      <div className="split-title compact-title">
        <div>
          <ServerCog size={17} aria-hidden="true" />
          <h3>Server Model Run Ledger</h3>
        </div>
        <span className={`workflow-status ${latestRun?.status ?? "idle"}`}>{runs.length} runs</span>
      </div>
      <p className="section-note">
        AI-assisted draft for audit preparation only. Not legal advice. Refresh reads persisted metadata-only Model Gateway
        run summaries from the Phase 2 API.
      </p>
      <div className="model-evaluation-actions">
        <span>Use this to confirm Model Gateway receipts survive reloads and human-review status sync.</span>
        <button type="button" className="secondary" disabled={refreshStatus === "syncing"} onClick={() => void refreshModelRuns()}>
          <RefreshCcw size={16} aria-hidden="true" />
          {refreshStatus === "syncing" ? "Refreshing Server Model Runs" : "Refresh Server Model Runs"}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!latestRun || receiptStatus === "building"}
          onClick={() => void downloadLatestRunReceipt()}
        >
          <Download size={16} aria-hidden="true" />
          {receiptStatus === "building" ? "Preparing Model Run Receipt" : "Download Model Run Receipt JSON"}
        </button>
      </div>
      {refreshStatus === "synced" ? (
        <span className="save-state">
          Model Gateway runs refreshed: {runs.length} metadata-only run{runs.length === 1 ? "" : "s"}.
        </span>
      ) : null}
      {receiptStatus === "downloaded" && receiptHash ? (
        <span className="save-state">Model Run receipt ready: {shortHash(receiptHash)} metadata-only hash.</span>
      ) : null}
      {receiptError ? (
        <div className="provider-policy-error" role="alert">
          <strong>{receiptError}</strong>
          <small>Not legal advice. Model Gateway run receipts are audit preparation metadata only.</small>
        </div>
      ) : null}
      {refreshError ? (
        <div className="provider-policy-error" role="alert">
          <strong>{refreshError}</strong>
          {refreshRecoveryAction ? <span>{refreshRecoveryAction}</span> : null}
          <small>Not legal advice. Model Gateway run refresh is review workspace metadata only.</small>
        </div>
      ) : null}
      {latestRun ? (
        <div className="run-facts model-run-ledger-facts">
          <JourneyFact label="Latest run" value={latestRun.id} />
          <JourneyFact label="Latest status" value={latestRun.status} />
          <JourneyFact label="Human review" value={latestRun.humanReviewStatus} />
          <JourneyFact label="Retry state" value={latestRun.retryState} />
          <JourneyFact label="Payload hash" value={shortHash(latestRun.payloadHash)} />
          <JourneyFact label="Response hash" value={shortHash(latestRun.responseHash)} />
        </div>
      ) : null}
      <div className="model-run-ledger-list" aria-label="Model Gateway Run Records">
        {visibleRuns.length ? (
          visibleRuns.map((run) => (
            <article key={run.id} className={`model-run-ledger-card ${run.status}`}>
              <header>
                <span>{run.status}</span>
                <strong>{run.id}</strong>
              </header>
              <p>
                {run.providerLabel} · {run.model} · human review {run.humanReviewStatus}
              </p>
              <small>
                payload {shortHash(run.payloadHash)} · response {shortHash(run.responseHash)} · source{" "}
                {shortHash(run.sourceEvidenceHash)}
              </small>
              <small>
                retry {run.retryState} · {run.requiresHumanReview ? "human review required" : "no human review required"}
              </small>
              {run.remediationSteps.length ? (
                <ul>
                  {run.remediationSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              ) : null}
              <small>{run.boundary}</small>
            </article>
          ))
        ) : (
          <p className="empty-state">No persisted Model Gateway run records were returned. Not legal advice.</p>
        )}
      </div>
    </section>
  );
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "model-run";
}

function ModelGatewayEvaluationPanel({ evaluation }: { evaluation: ModelGatewayEvaluationRecord }) {
  return (
    <section className={`model-gateway-evaluation ${evaluation.status}`}>
      <div className="split-title compact-title">
        <div>
          <ServerCog size={17} aria-hidden="true" />
          <h3>Model Gateway Evaluation</h3>
        </div>
        <span className={`workflow-status ${evaluation.status}`}>{evaluation.status}</span>
      </div>
      <p className="section-note">{evaluation.notLegalAdviceBoundary}</p>
      <div className="run-facts evaluation-facts">
        <JourneyFact label="Payload hash" value={shortHash(evaluation.hashes.payloadHash)} />
        <JourneyFact label="Response hash" value={shortHash(evaluation.hashes.responseHash)} />
        <JourneyFact label="Source evidence" value={shortHash(evaluation.hashes.sourceEvidenceHash)} />
        <JourneyFact label="Human review" value={evaluation.humanReviewStatus} />
        <JourneyFact label="Retry state" value={evaluation.retryState} />
        <JourneyFact label="Adapter" value={evaluation.adapterMode} />
      </div>
      <div className="model-evaluation-policy">
        <span>Allowed data classes</span>
        <strong>{evaluation.allowedDataClasses.join(", ") || "none declared"}</strong>
        <small>{evaluation.credentialPolicy}. {evaluation.secretPolicy}</small>
      </div>
      <div className="model-evaluation-actions">
        <span>Reviewer action: {evaluation.reviewerAction}</span>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadModelGatewayEvaluationJson("model-gateway-evaluation.json", evaluation)}
        >
          <Download size={16} aria-hidden="true" />
          Download Model Evaluation JSON
        </button>
      </div>
    </section>
  );
}

function SecureJourneyError({
  error,
  onNavigate
}: {
  error: SecureJourneyErrorState;
  onNavigate: SecureReviewWorkspaceProps["onNavigate"];
}) {
  const recovery = recoveryForJourneyError(error.message);

  return (
    <div className="secure-journey-error" role="alert">
      <strong>{recovery.title}</strong>
      <p>{recovery.detail}</p>
      <div className="secure-journey-error-facts">
        {error.code ? <JourneyFact label="Error code" value={error.code} /> : null}
        {error.runId ? <JourneyFact label="Run ID" value={error.runId} /> : null}
        {error.retryState ? <JourneyFact label="Retry state" value={error.retryState} /> : null}
      </div>
      <small>{error.message}</small>
      {error.recoveryAction ? <small>Recovery: {error.recoveryAction}</small> : null}
      {error.remediationSteps.length > 0 ? (
        <ul className="secure-journey-remediation">
          {error.remediationSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
      <div className="inline-actions">
        <span>{error.notLegalAdviceBoundary}</span>
        <button type="button" className="secondary" onClick={() => onNavigate(recovery.target)}>
          {recovery.actionLabel}
        </button>
      </div>
    </div>
  );
}

function recoveryForJourneyError(message: string): {
  title: string;
  detail: string;
  actionLabel: string;
  target: Parameters<SecureReviewWorkspaceProps["onNavigate"]>[0];
} {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("model gateway boundary") ||
    normalized.includes("model-gateway-run-") ||
    normalized.includes("retry state:")
  ) {
    return {
      title: "Secure Review Journey cannot run until Model Gateway remediation is complete",
      detail: "Review the server failure receipt, complete the remediation steps, then rerun the secure review journey.",
      actionLabel: "Fix Model Gateway inputs",
      target: "ai"
    };
  }

  if (
    normalized.includes("model connect") ||
    normalized.includes("model name") ||
    normalized.includes("base url") ||
    normalized.includes("api key")
  ) {
    return {
      title: "Secure Review Journey cannot run until Model Connect is ready",
      detail: "Complete Base URL, model name, and API key, or switch to the mock local reviewer, then validate Model Connect again.",
      actionLabel: "Fix Model Connect",
      target: "ai"
    };
  }

  if (normalized.includes("evidence")) {
    return {
      title: "Secure Review Journey needs evidence before vault sync",
      detail: "Add a metadata-only evidence item or apply an evidence template, then rerun the secure review journey.",
      actionLabel: "Add Evidence",
      target: "evidence"
    };
  }

  return {
    title: "Secure Review Journey stopped before completion",
    detail: "Check the API base URL, backend server status, and workspace inputs before retrying.",
    actionLabel: "Review Workspace",
    target: "wizard"
  };
}

function JourneyFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <code>
        {label} {value}
      </code>
    </div>
  );
}

function toSecureJourneyErrorState(error: unknown): SecureJourneyErrorState {
  if (!(error instanceof Error)) {
    return {
      message: "Secure review journey failed.",
      remediationSteps: [],
      notLegalAdviceBoundary: SECURE_JOURNEY_ERROR_BOUNDARY
    };
  }

  const details = error as Error & {
    code?: unknown;
    runId?: unknown;
    retryState?: unknown;
    recoveryAction?: unknown;
    remediationSteps?: unknown;
    notLegalAdviceBoundary?: unknown;
  };
  const remediationSteps = Array.isArray(details.remediationSteps)
    ? details.remediationSteps.filter((step): step is string => typeof step === "string" && step.trim().length > 0)
    : [];

  return {
    message: error.message || "Secure review journey failed.",
    ...(typeof details.code === "string" && details.code.trim() ? { code: details.code.trim() } : {}),
    ...(typeof details.runId === "string" && details.runId.trim() ? { runId: details.runId.trim() } : {}),
    ...(typeof details.retryState === "string" && details.retryState.trim() ? { retryState: details.retryState.trim() } : {}),
    ...(typeof details.recoveryAction === "string" && details.recoveryAction.trim()
      ? { recoveryAction: details.recoveryAction.trim() }
      : {}),
    remediationSteps,
    notLegalAdviceBoundary:
      typeof details.notLegalAdviceBoundary === "string" && details.notLegalAdviceBoundary.startsWith("Not legal advice.")
        ? details.notLegalAdviceBoundary
        : SECURE_JOURNEY_ERROR_BOUNDARY
  };
}

function shortHash(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}
