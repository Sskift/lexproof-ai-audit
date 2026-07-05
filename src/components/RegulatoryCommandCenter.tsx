import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, ExternalLink, FileSearch, Globe2, ListChecks, RefreshCcw, ShieldCheck, UserCheck } from "lucide-react";
import { JurisdictionEvidenceMapPanel } from "./JurisdictionEvidenceMapPanel";
import { RegulatoryControlMatrixPanel } from "./RegulatoryControlMatrixPanel";
import { SourceFreshnessBoardPanel } from "./SourceFreshnessBoardPanel";
import type { AuditResult } from "../lib/auditEngine";
import type { JurisdictionEvidenceMap } from "../lib/jurisdictionEvidenceMap";
import {
  downloadLocalCounselRoutingPlanJson,
  type LocalCounselRoutingPlan
} from "../lib/localCounselRouting";
import {
  downloadJurisdictionReadinessDigestJson,
  type JurisdictionReadinessDigest,
  type JurisdictionReadinessDigestStatus
} from "../lib/jurisdictionReadinessDigest";
import type { RegulatoryControlMatrix } from "../lib/regulatoryControlMatrix";
import type { RegulatoryGraph, RegulatoryReadiness } from "../lib/regulatoryGraph";
import {
  downloadRegulatorySourceReviewPacketJson,
  type RegulatorySourceReviewPacket
} from "../lib/regulatorySourceReviewPacket";
import {
  downloadRegulatorySourceCoverageJson,
  type RegulatorySourceCoverageReport,
  type RegulatorySourceCoverageStatus
} from "../lib/regulatorySourceCoverage";
import {
  downloadRegulatorySourceApprovalQueueJson,
  type RegulatorySourceApprovalQueue,
  type RegulatorySourceApprovalStatus
} from "../lib/regulatorySourceApproval";
import {
  createEvidenceRequestOperationFromSourceGapTriageItem,
  createSourceEvidenceGapTriage,
  downloadSourceEvidenceGapTriageJson,
  type SourceEvidenceGapTriage,
  type SourceEvidenceGapTriageItem
} from "../lib/sourceEvidenceGapTriage";
import type { RegulatorySourceReview, RegulatorySourceReviewStatus } from "../lib/regulatorySourceReview";
import type { SourceFreshnessBoard } from "../lib/sourceFreshnessBoard";
import type { ProjectProfile } from "../lib/projectModel";
import type {
  RegulatorySourceApprovalRecord,
  RegulatorySourceApprovalSyncResult,
  RegulatorySourceReviewSyncResult
} from "../lib/phase2Types";
import {
  createWorkspaceActionQueueExport,
  downloadWorkspaceActionQueueJson,
  type WorkspaceActionItem,
  type WorkspaceActionQueue,
  type WorkspaceActionQueueExport,
  type WorkspaceActionTarget
} from "../lib/workspaceActionQueue";
import {
  createWorkspaceCockpitHandoff,
  downloadWorkspaceCockpitHandoffJson,
  type WorkspaceCockpitBrief,
  type WorkspaceCockpitBriefStatus,
  type WorkspaceCockpitHandoff
} from "../lib/workspaceCockpitBrief";
import type { WorkspaceJourney, WorkspaceJourneyStatus } from "../lib/workspaceJourney";

type RegulatoryCommandCenterProps = {
  project: ProjectProfile;
  audit: AuditResult;
  graph: RegulatoryGraph;
  sourceReview: RegulatorySourceReview;
  sourceReviewAsOf: string;
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
  sourceApprovalRecords: RegulatorySourceApprovalRecord[];
  sourceApprovalRecordRefreshStatus: "idle" | "syncing" | "synced" | "error";
  sourceApprovalRecordRefreshError: string;
  sourceApprovalRecordRefreshRecoveryAction: string;
  controlMatrix: RegulatoryControlMatrix;
  jurisdictionEvidenceMap: JurisdictionEvidenceMap | null;
  jurisdictionReadinessDigest: JurisdictionReadinessDigest | null;
  sourceFreshnessBoard: SourceFreshnessBoard | null;
  sourceCoverageReport: RegulatorySourceCoverageReport | null;
  localCounselRoutingPlan: LocalCounselRoutingPlan | null;
  actionQueue: WorkspaceActionQueue;
  cockpitBrief: WorkspaceCockpitBrief;
  journey: WorkspaceJourney;
  sourceReviewPacket: RegulatorySourceReviewPacket | null;
  manifestHash?: string;
  exportAllowed: boolean;
  counselPackVersionCount: number;
  humanReviewOpenCount: number;
  humanReviewBlockedCount: number;
  onSourceReviewApiBaseUrlChange: (value: string) => void;
  onSourceReviewAsOfChange: (value: string) => void;
  onSyncSourceReviewLedger: () => Promise<void> | void;
  onSourceApprovalApiBaseUrlChange: (value: string) => void;
  onSyncSourceApprovalQueue: () => Promise<void> | void;
  onRefreshSourceApprovalRecords: () => Promise<void> | void;
  onNavigate: (tab: WorkspaceActionTarget) => void;
  onRequestSourceGapEvidence: (item: SourceEvidenceGapTriageItem) => void;
};

export function RegulatoryCommandCenter({
  project,
  audit,
  graph,
  sourceReview,
  sourceReviewAsOf,
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
  sourceApprovalRecords,
  sourceApprovalRecordRefreshStatus,
  sourceApprovalRecordRefreshError,
  sourceApprovalRecordRefreshRecoveryAction,
  controlMatrix,
  jurisdictionEvidenceMap,
  jurisdictionReadinessDigest,
  sourceFreshnessBoard,
  sourceCoverageReport,
  localCounselRoutingPlan,
  actionQueue,
  cockpitBrief,
  journey,
  sourceReviewPacket,
  manifestHash,
  exportAllowed,
  counselPackVersionCount,
  humanReviewOpenCount,
  humanReviewBlockedCount,
  onSourceReviewApiBaseUrlChange,
  onSourceReviewAsOfChange,
  onSyncSourceReviewLedger,
  onSourceApprovalApiBaseUrlChange,
  onSyncSourceApprovalQueue,
  onRefreshSourceApprovalRecords,
  onNavigate,
  onRequestSourceGapEvidence
}: RegulatoryCommandCenterProps) {
  const topClauses = graph.matchedClauses.slice(0, 6);
  const topGaps = graph.evidenceGaps.slice(0, 12);
  const topSourceReviewItems = sourceReview.items.slice(0, 4);
  const topSourceApprovalRecords = sourceApprovalRecords.slice(0, 4);
  const topCounselRoutes = localCounselRoutingPlan?.routes.slice(0, 4) ?? [];
  const nextJourneyTarget = journey.summary.nextTarget === "none" ? undefined : journey.summary.nextTarget;
  const [sourceGapTriage, setSourceGapTriage] = useState<SourceEvidenceGapTriage | null>(null);
  const [focusedActionId, setFocusedActionId] = useState<string | null>(null);
  const [cockpitHandoff, setCockpitHandoff] = useState<WorkspaceCockpitHandoff | null>(null);
  const [buildingCockpitHandoff, setBuildingCockpitHandoff] = useState(false);
  const [actionQueueExport, setActionQueueExport] = useState<WorkspaceActionQueueExport | null>(null);
  const [buildingActionQueueExport, setBuildingActionQueueExport] = useState(false);
  const sourceGapTriageRef = useRef<HTMLElement | null>(null);
  const sourceApprovalQueueRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSourceGapTriage(null);
    createSourceEvidenceGapTriage({ graph, maxItems: 6 }).then((triage) => {
      if (!cancelled) {
        setSourceGapTriage(triage);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [graph]);

  const handleActionQueueClick = (item: WorkspaceActionItem) => {
    if (item.focusTarget === "source-gap-triage") {
      setFocusedActionId(item.id);
      sourceGapTriageRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      sourceGapTriageRef.current?.focus?.({ preventScroll: true });
      return;
    }
    if (item.focusTarget === "source-approval-queue") {
      setFocusedActionId(item.id);
      sourceApprovalQueueRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      sourceApprovalQueueRef.current?.focus?.({ preventScroll: true });
      return;
    }

    onNavigate(item.target);
  };

  const downloadCockpitHandoff = async () => {
    setBuildingCockpitHandoff(true);

    try {
      const handoff = await createWorkspaceCockpitHandoff({
        projectId: project.id,
        projectName: project.projectName,
        riskLevel: audit.riskLevel,
        riskScore: audit.score,
        evidenceCount: project.evidenceItems.length,
        humanReviewOpenCount,
        humanReviewBlockedCount,
        manifestHash,
        exportAllowed,
        counselPackVersionCount,
        journey,
        actionQueue,
        cockpitBrief
      });
      setCockpitHandoff(handoff);
      downloadWorkspaceCockpitHandoffJson(`lexproof-${project.id}-workspace-cockpit-handoff.json`, handoff);
    } finally {
      setBuildingCockpitHandoff(false);
    }
  };

  const downloadActionQueueExport = async () => {
    setBuildingActionQueueExport(true);

    try {
      const queueExport = await createWorkspaceActionQueueExport({
        workspaceId: project.id,
        projectName: project.projectName,
        queue: actionQueue
      });
      setActionQueueExport(queueExport);
      downloadWorkspaceActionQueueJson(`lexproof-${project.id}-workspace-action-queue.json`, queueExport);
    } finally {
      setBuildingActionQueueExport(false);
    }
  };

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

      <section className={`workspace-cockpit-brief ${cockpitBrief.status}`} aria-label="Workspace Cockpit Brief">
        <div className="cockpit-brief-copy">
          <span>{formatCockpitStatus(cockpitBrief.status)}</span>
          <h3>{cockpitBrief.headline}</h3>
          <p>{cockpitBrief.summary}</p>
          <small>{cockpitBrief.notLegalAdviceBoundary}</small>
        </div>
        <div className="cockpit-brief-facts" aria-label="Workspace cockpit facts">
          {cockpitBrief.facts.map((fact) => (
            <div key={fact.label} className={`cockpit-brief-fact ${fact.status}`}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
              <small>{fact.helper}</small>
            </div>
          ))}
        </div>
        <div className="cockpit-handoff-actions">
          {cockpitHandoff ? <small>Cockpit handoff hash {cockpitHandoff.handoffHash.slice(0, 12)}...</small> : null}
          {cockpitBrief.nextAction ? (
            <button
              type="button"
              className="secondary"
              title={cockpitBrief.nextAction.title}
              onClick={() => onNavigate(cockpitBrief.nextAction!.target)}
            >
              <ListChecks size={14} aria-hidden="true" />
              Open next action
            </button>
          ) : null}
          <button type="button" className="secondary" disabled={buildingCockpitHandoff} onClick={() => void downloadCockpitHandoff()}>
            <Download size={14} aria-hidden="true" />
            {buildingCockpitHandoff ? "Building Handoff" : "Download Cockpit Handoff JSON"}
          </button>
        </div>
      </section>

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
        <div className="workspace-action-queue-header">
          <div className="reg-section-title">
            <ListChecks size={17} aria-hidden="true" />
            <h3>Workspace Action Queue</h3>
            <span className="action-count">{actionQueue.summary.totalCount} open</span>
          </div>
          <div className="workspace-action-queue-export">
            {actionQueueExport ? <small>Action queue hash {actionQueueExport.queueHash.slice(0, 12)}...</small> : null}
            <button type="button" className="secondary" onClick={downloadActionQueueExport} disabled={buildingActionQueueExport}>
              <Download size={14} aria-hidden="true" />
              {buildingActionQueueExport ? "Preparing Action Queue JSON" : "Download Action Queue JSON"}
            </button>
          </div>
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
              <button type="button" className="secondary" onClick={() => handleActionQueueClick(item)}>
                <ListChecks size={14} aria-hidden="true" />
                {item.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      {sourceGapTriage ? (
        <section
          ref={sourceGapTriageRef}
          tabIndex={-1}
          className={`source-gap-triage ${sourceGapTriage.status} ${
            focusedActionId === "resolve-regulatory-evidence-gaps" ? "action-focus" : ""
          }`}
          aria-label="Source Evidence Gap Triage"
        >
          <div className="reg-source-review-header">
            <div className="reg-section-title">
              <AlertTriangle size={17} aria-hidden="true" />
              <h3>Source Evidence Gap Triage</h3>
            </div>
            <div className="source-gap-triage-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => downloadSourceEvidenceGapTriageJson(`lexproof-${project.id}-source-gap-triage.json`, sourceGapTriage)}
              >
                <Download size={15} aria-hidden="true" />
                Download Source Gap Triage JSON
              </button>
              <button type="button" className="secondary" onClick={() => onNavigate("evidence")}>
                <ListChecks size={15} aria-hidden="true" />
                Open Evidence
              </button>
            </div>
          </div>
          <div className="source-gap-triage-summary">
            <Metric label="Open gaps" value={sourceGapTriage.totalGapCount} helper={`${sourceGapTriage.visibleGapCount} shown`} />
            <Metric label="P0" value={sourceGapTriage.p0Count} helper="highest-priority requests" />
            <Metric label="Jurisdictions" value={sourceGapTriage.jurisdictionCount} helper="source-linked" />
            <Metric label="Triage hash" value={sourceGapTriage.triageHash.slice(0, 12)} helper="metadata-only" />
          </div>
          <p>{sourceGapTriage.notLegalAdviceBoundary}</p>
          <strong className="source-gap-next-action">{sourceGapTriage.nextAction}</strong>
          <div className="source-gap-triage-list">
            {sourceGapTriage.items.length === 0 ? (
              <p className="empty-state">No source evidence gaps are open in the current graph.</p>
            ) : null}
            {sourceGapTriage.items.map((item) => {
              const requestOperation = createEvidenceRequestOperationFromSourceGapTriageItem(project.evidenceItems, item);
              const isRequested = requestOperation.operation === "refresh";

              return (
                <article key={item.id} className={`source-gap-triage-item ${item.priority.toLowerCase()}`}>
                  <header>
                    <span>{item.priority}</span>
                    <strong>{item.title}</strong>
                  </header>
                  <p>{item.reason}</p>
                  <small>
                    {item.jurisdiction} · {item.citation}
                  </small>
                  <small>{item.localCounselRole}</small>
                  {isRequested ? (
                    <small className="source-gap-request-state">Requested in Ledger · {requestOperation.controlId}</small>
                  ) : null}
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} aria-hidden="true" />
                    {item.sourceName}
                  </a>
                  <div className="source-gap-draft">
                    <span>Evidence draft</span>
                    <strong>{item.evidenceLedgerDraft.label}</strong>
                    <small>{item.evidenceLedgerDraft.content}</small>
                  </div>
                  <button type="button" className="secondary" onClick={() => onRequestSourceGapEvidence(item)}>
                    <ListChecks size={14} aria-hidden="true" />
                    {isRequested ? "Open Request" : "Request Evidence"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="reg-command-metrics" aria-label="Regulatory readiness metrics">
        <Metric label="Jurisdictions" value={graph.jurisdictionSummaries.length} helper={project.jurisdictions.join(", ") || "not set"} />
        <Metric label="Source triggers" value={graph.matchedClauses.length} helper="matched to audit flags" />
        <Metric label="Evidence gaps" value={graph.evidenceGaps.length} helper="open source controls" />
        <Metric label="Manifest" value={manifestHash ? "ready" : "pending"} helper={manifestHash ? `${manifestHash.slice(0, 12)}...` : "calculating"} />
      </div>

      <RegulatoryControlMatrixPanel matrix={controlMatrix} />

      {jurisdictionEvidenceMap ? (
        <JurisdictionEvidenceMapPanel map={jurisdictionEvidenceMap} projectId={project.id} />
      ) : null}

      {jurisdictionReadinessDigest ? (
        <section
          className={`jurisdiction-readiness-digest ${jurisdictionReadinessDigest.status}`}
          aria-label="Jurisdiction Readiness Digest"
        >
          <div className="reg-source-review-header">
            <div className="reg-section-title">
              <Globe2 size={17} aria-hidden="true" />
              <h3>Jurisdiction Readiness Digest</h3>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                downloadJurisdictionReadinessDigestJson(
                  `lexproof-${project.id}-jurisdiction-readiness-digest.json`,
                  jurisdictionReadinessDigest
                )
              }
            >
              <Download size={15} aria-hidden="true" />
              Download Jurisdiction Digest JSON
            </button>
          </div>
          <div className="reg-source-review-summary">
            <Metric
              label="Handoff"
              value={jurisdictionReadinessDigest.handoffAllowed ? "allowed" : "blocked"}
              helper={formatDigestStatus(jurisdictionReadinessDigest.status)}
            />
            <Metric
              label="Jurisdictions"
              value={jurisdictionReadinessDigest.jurisdictionCount}
              helper={`${jurisdictionReadinessDigest.summary.openEvidenceRequestCount} open evidence requests`}
            />
            <Metric
              label="Source blockers"
              value={jurisdictionReadinessDigest.summary.sourceFreshnessBlockerCount}
              helper={`${jurisdictionReadinessDigest.summary.dueSoonSourceCount} due soon`}
            />
            <Metric label="Digest hash" value={jurisdictionReadinessDigest.digestHash.slice(0, 12)} helper="metadata-only" />
          </div>
          <p>{jurisdictionReadinessDigest.notLegalAdviceBoundary}</p>
          <strong className={`digest-handoff ${jurisdictionReadinessDigest.handoffAllowed ? "allowed" : "blocked"}`}>
            {jurisdictionReadinessDigest.handoffAllowed ? "Handoff allowed" : "Handoff blocked"}
          </strong>
          <div className="jurisdiction-digest-list">
            {jurisdictionReadinessDigest.jurisdictions.slice(0, 4).map((item) => (
              <article key={item.jurisdiction} className={`jurisdiction-digest-row ${item.status}`}>
                <header>
                  <span>{formatDigestStatus(item.status)}</span>
                  <strong>{item.jurisdiction}</strong>
                </header>
                <p>{item.nextAction}</p>
                <small>
                  {item.controlCount} controls · {item.openEvidenceRequestCount} evidence requests ·{" "}
                  {item.sourceFreshnessBlockerCount} source blockers
                </small>
                <small>{item.localCounselRoles.join(", ") || "Local counsel route pending"}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {sourceCoverageReport ? (
        <section className={`reg-source-coverage ${sourceCoverageReport.status}`} aria-label="Regulatory Source Coverage">
          <div className="reg-source-review-header">
            <div className="reg-section-title">
              <FileSearch size={17} aria-hidden="true" />
              <h3>Regulatory Source Coverage</h3>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                downloadRegulatorySourceCoverageJson(
                  `lexproof-${project.id}-regulatory-source-coverage.json`,
                  sourceCoverageReport
                )
              }
            >
              <Download size={15} aria-hidden="true" />
              Download Source Coverage JSON
            </button>
          </div>
          <div className="reg-source-review-summary source-coverage-summary">
            <Metric
              label="Jurisdictions"
              value={sourceCoverageReport.jurisdictionCount}
              helper={formatCoverageStatus(sourceCoverageReport.status)}
            />
            <Metric label="Sources" value={sourceCoverageReport.sourceCount} helper={`${sourceCoverageReport.currentSourceCount} current`} />
            <Metric
              label="Open evidence"
              value={sourceCoverageReport.openEvidenceRequestCount}
              helper={`${sourceCoverageReport.coveredEvidenceRequestCount}/${sourceCoverageReport.totalEvidenceRequestCount} covered`}
            />
            <Metric label="Report hash" value={sourceCoverageReport.reportHash.slice(0, 12)} helper="metadata-only" />
          </div>
          <p>{sourceCoverageReport.notLegalAdviceBoundary}</p>
          <div className="source-coverage-grid">
            {sourceCoverageReport.jurisdictions.slice(0, 6).map((item) => (
              <article key={item.jurisdiction} className={`source-coverage-card ${item.status}`}>
                <header>
                  <span>{item.priority}</span>
                  <strong>{item.jurisdiction}</strong>
                </header>
                <p>{item.nextAction}</p>
                <small>
                  {formatCoverageStatus(item.status)} · {item.sourceCount} source{item.sourceCount === 1 ? "" : "s"} ·{" "}
                  {item.openEvidenceRequestCount} open evidence request{item.openEvidenceRequestCount === 1 ? "" : "s"}
                </small>
                <small>{item.localCounselRoles.join(", ") || "Local counsel route pending"}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {localCounselRoutingPlan ? (
        <section className="local-counsel-routing" aria-label="Local Counsel Routing Plan">
          <div className="reg-source-review-header">
            <div className="reg-section-title">
              <UserCheck size={17} aria-hidden="true" />
              <h3>Local Counsel Routing Plan</h3>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                downloadLocalCounselRoutingPlanJson(`lexproof-${project.id}-local-counsel-routing.json`, localCounselRoutingPlan)
              }
            >
              <Download size={15} aria-hidden="true" />
              Download Local Counsel Routing JSON
            </button>
          </div>
          <div className="reg-source-review-summary">
            <Metric label="Routes" value={localCounselRoutingPlan.routeCount} helper="jurisdiction + counsel role" />
            <Metric label="P0" value={localCounselRoutingPlan.prioritySummary.P0} helper="evidence blockers" />
            <Metric label="P1" value={localCounselRoutingPlan.prioritySummary.P1} helper="review or gap work" />
            <Metric label="Plan hash" value={localCounselRoutingPlan.planHash.slice(0, 12)} helper="metadata-only" />
          </div>
          <p>{localCounselRoutingPlan.notLegalAdviceBoundary}</p>
          <div className="source-approval-list">
            {topCounselRoutes.map((route) => (
              <article key={route.id} className={`source-approval-item ${route.status}`}>
                <header>
                  <span>{route.priority}</span>
                  <strong>{route.jurisdiction}</strong>
                </header>
                <p>{route.localCounselRole}</p>
                <small>
                  {formatLocalCounselStatus(route.status)} · source review {formatLocalCounselSourceStatus(route.sourceReviewStatus)} ·{" "}
                  {route.evidenceGapCount} evidence gap{route.evidenceGapCount === 1 ? "" : "s"}
                </small>
                <small>{route.nextAction}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {sourceFreshnessBoard ? (
        <SourceFreshnessBoardPanel board={sourceFreshnessBoard} projectId={project.id} />
      ) : null}

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
          <label className="editor-field">
            <span>Source review as-of date</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              value={sourceReviewAsOf}
              onChange={(event) => onSourceReviewAsOfChange(event.target.value)}
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

      <section
        ref={sourceApprovalQueueRef}
        tabIndex={-1}
        className={`source-approval-queue ${sourceApprovalQueue.status} ${
          focusedActionId === "approve-source-updates" ? "action-focus" : ""
        }`}
        aria-label="Source Update Approval Queue"
      >
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
          <button
            type="button"
            className="secondary"
            onClick={onRefreshSourceApprovalRecords}
            disabled={sourceApprovalRecordRefreshStatus === "syncing" || sourceApprovalSyncStatus === "syncing"}
          >
            <RefreshCcw size={16} aria-hidden="true" />
            {sourceApprovalRecordRefreshStatus === "syncing" ? "Refreshing Source Approval Records" : "Refresh Source Approval Records"}
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
          {sourceApprovalRecordRefreshStatus === "synced" ? (
            <span className="save-state">
              Source approval records refreshed: {sourceApprovalRecords.length} persisted record
              {sourceApprovalRecords.length === 1 ? "" : "s"}. Matching behavior unchanged.
            </span>
          ) : null}
          {sourceApprovalSyncError ? (
            <div className="provider-policy-error" role="alert">
              <strong>{sourceApprovalSyncError}</strong>
              {sourceApprovalSyncRecoveryAction ? <span>{sourceApprovalSyncRecoveryAction}</span> : null}
              <small>Not legal advice. Source approval sync is audit preparation workflow metadata only.</small>
            </div>
          ) : null}
          {sourceApprovalRecordRefreshError ? (
            <div className="provider-policy-error" role="alert">
              <strong>{sourceApprovalRecordRefreshError}</strong>
              {sourceApprovalRecordRefreshRecoveryAction ? <span>{sourceApprovalRecordRefreshRecoveryAction}</span> : null}
              <small>Not legal advice. Source approval record refresh is audit preparation workflow metadata only.</small>
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
        {topSourceApprovalRecords.length ? (
          <section className="source-approval-records" aria-label="Persisted Source Approval Records">
            <div className="reg-section-title">
              <ListChecks size={16} aria-hidden="true" />
              <h4>Persisted Source Approval Records</h4>
            </div>
            <div className="source-approval-list">
              {topSourceApprovalRecords.map((record) => (
                <article key={record.id} className={`source-approval-item ${record.approvalStatus}`}>
                  <header>
                    <span>{formatApprovalStatus(record.approvalStatus)}</span>
                    <strong>{record.jurisdiction}</strong>
                  </header>
                  <p>{record.nextAction}</p>
                  <small>
                    {record.citation} · queue {record.queueHash.slice(0, 12)}... · status {record.status}
                  </small>
                  <small>{record.notLegalAdviceBoundary}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}
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

function formatLocalCounselStatus(status: LocalCounselRoutingPlan["routes"][number]["status"]): string {
  if (status === "needs-source-review") {
    return "needs source review";
  }
  if (status === "ready-for-counsel") {
    return "ready for counsel";
  }
  return "needs evidence";
}

function formatLocalCounselSourceStatus(status: LocalCounselRoutingPlan["routes"][number]["sourceReviewStatus"]): string {
  if (status === "metadata-missing") {
    return "metadata missing";
  }
  if (status === "review-due") {
    return "review due";
  }
  if (status === "not-tracked") {
    return "not tracked";
  }
  return "current";
}

function formatDigestStatus(status: JurisdictionReadinessDigestStatus): string {
  if (status === "ready-for-counsel") {
    return "ready for counsel";
  }
  if (status === "needs-evidence") {
    return "needs evidence";
  }
  if (status === "needs-source-review") {
    return "needs source review";
  }
  if (status === "metadata-missing") {
    return "metadata missing";
  }
  return "no jurisdictions";
}

function formatCoverageStatus(status: RegulatorySourceCoverageStatus): string {
  if (status === "ready-for-counsel") {
    return "ready for counsel";
  }
  if (status === "needs-evidence") {
    return "needs evidence";
  }
  if (status === "needs-source-review") {
    return "needs source review";
  }
  if (status === "metadata-missing") {
    return "metadata missing";
  }
  return "no source coverage";
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

function formatCockpitStatus(status: WorkspaceCockpitBriefStatus): string {
  if (status === "needs-action") {
    return "needs action";
  }

  return status;
}
