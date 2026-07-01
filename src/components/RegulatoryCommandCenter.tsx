import { AlertTriangle, Download, ExternalLink, FileSearch, Globe2, ListChecks, RefreshCcw, ShieldCheck } from "lucide-react";
import { RegulatoryControlMatrixPanel } from "./RegulatoryControlMatrixPanel";
import type { AuditResult } from "../lib/auditEngine";
import type { RegulatoryControlMatrix } from "../lib/regulatoryControlMatrix";
import type { RegulatoryGraph, RegulatoryReadiness } from "../lib/regulatoryGraph";
import {
  downloadRegulatorySourceReviewPacketJson,
  type RegulatorySourceReviewPacket
} from "../lib/regulatorySourceReviewPacket";
import {
  downloadRegulatorySourceApprovalQueueJson,
  type RegulatorySourceApprovalQueue,
  type RegulatorySourceApprovalStatus
} from "../lib/regulatorySourceApproval";
import type { RegulatorySourceReview, RegulatorySourceReviewStatus } from "../lib/regulatorySourceReview";
import type { ProjectProfile } from "../lib/projectModel";
import type { RegulatorySourceApprovalSyncResult, RegulatorySourceReviewSyncResult } from "../lib/phase2Types";
import type { WorkspaceActionQueue, WorkspaceActionTarget } from "../lib/workspaceActionQueue";
import type { WorkspaceJourney, WorkspaceJourneyStatus } from "../lib/workspaceJourney";

type RegulatoryCommandCenterProps = {
  project: ProjectProfile;
  audit: AuditResult;
  graph: RegulatoryGraph;
  sourceReview: RegulatorySourceReview;
  sourceReviewApiBaseUrl: string;
  sourceReviewSyncResult: RegulatorySourceReviewSyncResult | null;
  sourceReviewSyncStatus: "idle" | "syncing" | "synced" | "error";
  sourceReviewSyncError: string;
  sourceReviewSyncRecoveryAction: string;
  sourceApprovalQueue: RegulatorySourceApprovalQueue;
  sourceApprovalApiBaseUrl: string;
  sourceApprovalSyncResult: RegulatorySourceApprovalSyncResult | null;
  sourceApprovalSyncStatus: "idle" | "syncing" | "synced" | "error";
  sourceApprovalSyncError: string;
  sourceApprovalSyncRecoveryAction: string;
  controlMatrix: RegulatoryControlMatrix;
  actionQueue: WorkspaceActionQueue;
  journey: WorkspaceJourney;
  sourceReviewPacket: RegulatorySourceReviewPacket | null;
  manifestHash?: string;
  onSourceReviewApiBaseUrlChange: (value: string) => void;
  onSyncSourceReviewLedger: () => Promise<void> | void;
  onSourceApprovalApiBaseUrlChange: (value: string) => void;
  onSyncSourceApprovalQueue: () => Promise<void> | void;
  onNavigate: (tab: WorkspaceActionTarget) => void;
};

export function RegulatoryCommandCenter({
  project,
  audit,
  graph,
  sourceReview,
  sourceReviewApiBaseUrl,
  sourceReviewSyncResult,
  sourceReviewSyncStatus,
  sourceReviewSyncError,
  sourceReviewSyncRecoveryAction,
  sourceApprovalQueue,
  sourceApprovalApiBaseUrl,
  sourceApprovalSyncResult,
  sourceApprovalSyncStatus,
  sourceApprovalSyncError,
  sourceApprovalSyncRecoveryAction,
  controlMatrix,
  actionQueue,
  journey,
  sourceReviewPacket,
  manifestHash,
  onSourceReviewApiBaseUrlChange,
  onSyncSourceReviewLedger,
  onSourceApprovalApiBaseUrlChange,
  onSyncSourceApprovalQueue,
  onNavigate
}: RegulatoryCommandCenterProps) {
  const topClauses = graph.matchedClauses.slice(0, 4);
  const topGaps = graph.evidenceGaps.slice(0, 8);
  const topSourceReviewItems = sourceReview.items.slice(0, 4);
  const nextJourneyTarget = journey.summary.nextTarget === "none" ? undefined : journey.summary.nextTarget;

  return (
    <section className="panel regulatory-command-center" aria-label="Regulatory Command Center">
      <header className="reg-command-header">
        <div>
          <p className="eyebrow">Regulatory Source Graph</p>
          <h2>Regulatory Command Center</h2>
          <p>
            Source-linked review triggers, evidence coverage, and counsel handoff status for {project.projectName || "this workspace"}.
          </p>
        </div>
        <div className={`reg-risk ${audit.riskLevel}`}>
          <span>Risk</span>
          <strong>{audit.riskLevel}</strong>
          <small>{audit.score}/100</small>
        </div>
      </header>

      <div className="reg-command-boundary">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>{graph.notLegalAdviceBoundary}</span>
      </div>

      <section className="workspace-journey" aria-label="Workspace Journey">
        <div className="reg-section-title">
          <ListChecks size={17} aria-hidden="true" />
          <h3>Workspace Journey</h3>
          <span className="action-count">{journey.summary.readyCount}/{journey.steps.length} ready</span>
        </div>
        <p>{journey.notLegalAdviceBoundary}</p>
        <div className="workspace-journey-list">
          {journey.steps.map((step, index) => (
            <article key={step.id} className={`workspace-journey-step ${step.status}`}>
              <span className="journey-step-index">{index + 1}</span>
              <div>
                <header>
                  <strong>{step.label}</strong>
                  <span>{formatJourneyStatus(step.status)}</span>
                </header>
                <p>{step.summary}</p>
                <small>{step.detail}</small>
              </div>
            </article>
          ))}
        </div>
        {nextJourneyTarget ? (
          <button type="button" className="secondary" onClick={() => onNavigate(nextJourneyTarget)}>
            <ListChecks size={14} aria-hidden="true" />
            Continue journey
          </button>
        ) : null}
      </section>

      <section className="workspace-action-queue" aria-label="Workspace Action Queue">
        <div className="reg-section-title">
          <ListChecks size={17} aria-hidden="true" />
          <h3>Workspace Action Queue</h3>
          <span className="action-count">{actionQueue.summary.totalCount} open</span>
        </div>
        <p>{actionQueue.notLegalAdviceBoundary}</p>
        <div className="workspace-action-list">
          {actionQueue.items.slice(0, 4).map((item) => (
            <article key={item.id} className={`workspace-action-item ${item.priority.toLowerCase()}`}>
              <header>
                <span>{item.priority}</span>
                <strong>{item.title}</strong>
              </header>
              <p>{item.summary}</p>
              <button type="button" className="secondary" onClick={() => onNavigate(item.target)}>
                <ListChecks size={14} aria-hidden="true" />
                {item.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="reg-command-metrics" aria-label="Regulatory readiness metrics">
        <Metric label="Jurisdictions" value={graph.jurisdictionSummaries.length} helper={project.jurisdictions.join(", ") || "not set"} />
        <Metric label="Source triggers" value={graph.matchedClauses.length} helper="matched to audit flags" />
        <Metric label="Evidence gaps" value={graph.evidenceGaps.length} helper="open source controls" />
        <Metric label="Manifest" value={manifestHash ? "ready" : "pending"} helper={manifestHash ? `${manifestHash.slice(0, 12)}...` : "calculating"} />
      </div>

      <RegulatoryControlMatrixPanel matrix={controlMatrix} />

      <section className={`reg-source-review ${sourceReview.status}`} aria-label="Source Review Ledger">
        <div className="reg-source-review-header">
          <div className="reg-section-title">
            <ShieldCheck size={17} aria-hidden="true" />
            <h3>Source Review Ledger</h3>
          </div>
          <button
            type="button"
            className="secondary"
            disabled={!sourceReviewPacket}
            onClick={() =>
              sourceReviewPacket &&
              downloadRegulatorySourceReviewPacketJson(`lexproof-${project.id}-source-review-packet.json`, sourceReviewPacket)
            }
          >
            <Download size={15} aria-hidden="true" />
            Download Source Review Packet JSON
          </button>
        </div>
        <div className="reg-source-review-summary">
          <Metric label="Reviewed sources" value={sourceReview.currentSourceCount} helper={`${sourceReview.totalSourceCount} matched`} />
          <Metric label="Review due" value={sourceReview.reviewDueCount} helper={`${sourceReview.reviewWindowDays}-day cadence`} />
          <Metric label="Metadata gaps" value={sourceReview.metadataMissingCount} helper="citation, URL, notes" />
        </div>
        <p>{sourceReview.notLegalAdviceBoundary}</p>
        <div className={`provider-policy-sync ${sourceReviewSyncStatus}`}>
          <label className="editor-field">
            <span>Source Review API base URL</span>
            <input
              type="url"
              value={sourceReviewApiBaseUrl}
              placeholder="http://127.0.0.1:8787"
              onChange={(event) => onSourceReviewApiBaseUrlChange(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary"
            onClick={onSyncSourceReviewLedger}
            disabled={sourceReviewSyncStatus === "syncing"}
          >
            <RefreshCcw size={16} aria-hidden="true" />
            {sourceReviewSyncStatus === "syncing" ? "Syncing Source Review Ledger" : "Sync Source Review Ledger"}
          </button>
          <small>
            Syncs reviewed source lineage metadata only. Matching behavior remains unchanged until a separate source approval gate
            records refreshed metadata.
          </small>
          {sourceReviewSyncStatus === "synced" && sourceReviewSyncResult ? (
            <span className="save-state">
              Source review ledger synced: {sourceReviewSyncResult.syncedCount} record
              {sourceReviewSyncResult.syncedCount === 1 ? "" : "s"}. Matching behavior unchanged. Ledger hash{" "}
              {sourceReviewSyncResult.ledgerHash.slice(0, 12)}...
            </span>
          ) : null}
          {sourceReviewSyncError ? (
            <div className="provider-policy-error" role="alert">
              <strong>{sourceReviewSyncError}</strong>
              {sourceReviewSyncRecoveryAction ? <span>{sourceReviewSyncRecoveryAction}</span> : null}
              <small>Not legal advice. Source review sync is audit preparation lineage metadata only.</small>
            </div>
          ) : null}
        </div>
        <div className="reg-source-review-list">
          {topSourceReviewItems.length === 0 ? (
            <p className="empty-state">No source review records matched current facts.</p>
          ) : null}
          {topSourceReviewItems.map((item) => (
            <article key={item.clauseId} className={`reg-source-review-item ${item.reviewStatus}`}>
              <header>
                <span>{formatSourceReviewStatus(item.reviewStatus)}</span>
                <strong>{item.jurisdiction}</strong>
              </header>
              <p>{item.citation}</p>
              <small>
                Effective {item.effectiveAsOf} · last reviewed {item.lastReviewedAt} · next review {item.nextReviewDueAt}
              </small>
              <small>{item.reviewerNotes}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={`source-approval-queue ${sourceApprovalQueue.status}`} aria-label="Source Update Approval Queue">
        <div className="reg-source-review-header">
          <div className="reg-section-title">
            <ShieldCheck size={17} aria-hidden="true" />
            <h3>Source Update Approval Queue</h3>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={() =>
              downloadRegulatorySourceApprovalQueueJson(`lexproof-${project.id}-source-approval-queue.json`, sourceApprovalQueue)
            }
          >
            <Download size={15} aria-hidden="true" />
            Download Source Approval Queue JSON
          </button>
        </div>
        <div className="reg-source-review-summary">
          <Metric label="Approval required" value={sourceApprovalQueue.approvalRequiredCount} helper="review-due sources" />
          <Metric label="Metadata required" value={sourceApprovalQueue.metadataRequiredCount} helper="source lineage gaps" />
          <Metric label="Open gates" value={sourceApprovalQueue.totalItemCount} helper={sourceApprovalQueue.status} />
        </div>
        <p>{sourceApprovalQueue.notLegalAdviceBoundary}</p>
        <div className={`provider-policy-sync ${sourceApprovalSyncStatus}`}>
          <label className="editor-field">
            <span>Source Approval API base URL</span>
            <input
              type="url"
              value={sourceApprovalApiBaseUrl}
              placeholder="http://127.0.0.1:8787"
              onChange={(event) => onSourceApprovalApiBaseUrlChange(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary"
            onClick={onSyncSourceApprovalQueue}
            disabled={sourceApprovalSyncStatus === "syncing"}
          >
            <RefreshCcw size={16} aria-hidden="true" />
            {sourceApprovalSyncStatus === "syncing" ? "Syncing Source Approval Queue" : "Sync Source Approval Queue"}
          </button>
          <small>
            Syncs source approval metadata only. Source matching remains gated until counsel or compliance review records refreshed
            metadata.
          </small>
          {sourceApprovalSyncStatus === "synced" && sourceApprovalSyncResult ? (
            <span className="save-state">
              Source approvals synced: {sourceApprovalSyncResult.syncedCount} record
              {sourceApprovalSyncResult.syncedCount === 1 ? "" : "s"}. Matching behavior unchanged. Queue hash{" "}
              {sourceApprovalSyncResult.queueHash.slice(0, 12)}...
            </span>
          ) : null}
          {sourceApprovalSyncError ? (
            <div className="provider-policy-error" role="alert">
              <strong>{sourceApprovalSyncError}</strong>
              {sourceApprovalSyncRecoveryAction ? <span>{sourceApprovalSyncRecoveryAction}</span> : null}
              <small>Not legal advice. Source approval sync is audit preparation workflow metadata only.</small>
            </div>
          ) : null}
        </div>
        <div className="source-approval-list">
          {sourceApprovalQueue.items.length === 0 ? (
            <p className="empty-state">No source update approval actions are open. Source matching remains tied to reviewed metadata.</p>
          ) : null}
          {sourceApprovalQueue.items.slice(0, 4).map((item) => (
            <article key={item.id} className={`source-approval-item ${item.approvalStatus}`}>
              <header>
                <span>{formatApprovalStatus(item.approvalStatus)}</span>
                <strong>{item.jurisdiction}</strong>
              </header>
              <p>{item.nextAction}</p>
              <small>{item.approvalGate}</small>
              <small>
                {item.citation} · last reviewed {item.lastReviewedAt} · next review {item.nextReviewDueAt}
              </small>
            </article>
          ))}
        </div>
      </section>

      <div className="reg-command-layout">
        <section className="reg-jurisdiction-matrix" aria-label="Jurisdiction risk matrix">
          <div className="reg-section-title">
            <Globe2 size={17} aria-hidden="true" />
            <h3>Jurisdiction risk matrix</h3>
          </div>
          <div className="reg-jurisdiction-list">
            {graph.jurisdictionSummaries.map((summary) => (
              <article key={summary.jurisdiction} className={`reg-jurisdiction-row ${summary.readiness}`}>
                <div>
                  <strong>{summary.jurisdiction}</strong>
                  <span>Local counsel route tracked</span>
                </div>
                <small>
                  {formatReadiness(summary.readiness)} · {summary.matchedClauseCount} triggers · {summary.missingEvidenceCount} gaps
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="reg-clause-panel" aria-label="Matched regulatory clauses">
          <div className="reg-section-title">
            <FileSearch size={17} aria-hidden="true" />
            <h3>Matched source clauses</h3>
          </div>
          <div className="reg-clause-list">
            {topClauses.length === 0 ? (
              <p className="empty-state">No source triggers matched current facts. Add jurisdictions and project facts to generate review prompts.</p>
            ) : null}
            {topClauses.map((clause) => (
              <article key={clause.clauseId} className={`reg-clause-card ${clause.coverageStatus}`}>
                <div className="reg-clause-meta">
                  <span>{clause.jurisdiction}</span>
                  <span>{clause.coverageStatus}</span>
                </div>
                <h4>{clause.citation}</h4>
                <p>{clause.summary}</p>
                <a href={clause.sourceUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} aria-hidden="true" />
                  {clause.sourceName}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="reg-gap-panel" aria-label="Evidence gap queue">
          <div className="reg-section-title">
            <AlertTriangle size={17} aria-hidden="true" />
            <h3>Evidence gap queue</h3>
          </div>
          <div className="reg-gap-list">
            {topGaps.length === 0 ? <p className="empty-state">No regulatory source evidence gaps currently open.</p> : null}
            {topGaps.map((gap) => (
              <article key={gap.id} className="reg-gap-row">
                <span className={`priority ${gap.priority}`}>{gap.priority}</span>
                <div>
                  <strong>{gap.title}</strong>
                  <p>{gap.jurisdiction} · {gap.citation}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="reg-action-bar" aria-label="Regulatory command actions">
        <button type="button" className="secondary" onClick={() => onNavigate("jurisdiction")}>
          <Globe2 size={16} aria-hidden="true" />
          Source packs
        </button>
        <button type="button" className="secondary" onClick={() => onNavigate("evidence")}>
          <ListChecks size={16} aria-hidden="true" />
          Resolve evidence
        </button>
        <button type="button" className="secondary" onClick={() => onNavigate("counsel")}>
          <FileSearch size={16} aria-hidden="true" />
          Open export
        </button>
      </div>
    </section>
  );
}

function Metric({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className="reg-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function formatReadiness(readiness: RegulatoryReadiness): string {
  if (readiness === "ready-for-counsel") {
    return "ready for counsel";
  }
  if (readiness === "partial-evidence") {
    return "partial evidence";
  }
  return "evidence gaps";
}

function formatSourceReviewStatus(status: RegulatorySourceReviewStatus): string {
  if (status === "metadata-missing") {
    return "metadata gap";
  }
  if (status === "review-due") {
    return "review due";
  }
  return "current";
}

function formatApprovalStatus(status: RegulatorySourceApprovalStatus): string {
  if (status === "metadata-required") {
    return "metadata required";
  }
  return "approval required";
}

function formatJourneyStatus(status: WorkspaceJourneyStatus): string {
  if (status === "needs-input") {
    return "needs input";
  }
  if (status === "needs-review") {
    return "needs review";
  }
  return status;
}
