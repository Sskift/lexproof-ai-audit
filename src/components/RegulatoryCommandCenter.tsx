import { AlertTriangle, ExternalLink, FileSearch, Globe2, ListChecks, ShieldCheck } from "lucide-react";
import type { AuditResult } from "../lib/auditEngine";
import type { RegulatoryGraph, RegulatoryReadiness } from "../lib/regulatoryGraph";
import type { RegulatorySourceReview, RegulatorySourceReviewStatus } from "../lib/regulatorySourceReview";
import type { ProjectProfile } from "../lib/projectModel";

type RegulatoryCommandCenterProps = {
  project: ProjectProfile;
  audit: AuditResult;
  graph: RegulatoryGraph;
  sourceReview: RegulatorySourceReview;
  manifestHash?: string;
  onNavigate: (tab: "jurisdiction" | "risk" | "evidence" | "counsel") => void;
};

export function RegulatoryCommandCenter({
  project,
  audit,
  graph,
  sourceReview,
  manifestHash,
  onNavigate
}: RegulatoryCommandCenterProps) {
  const topClauses = graph.matchedClauses.slice(0, 4);
  const topGaps = graph.evidenceGaps.slice(0, 5);
  const topSourceReviewItems = sourceReview.items.slice(0, 4);

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

      <div className="reg-command-metrics" aria-label="Regulatory readiness metrics">
        <Metric label="Jurisdictions" value={graph.jurisdictionSummaries.length} helper={project.jurisdictions.join(", ") || "not set"} />
        <Metric label="Source triggers" value={graph.matchedClauses.length} helper="matched to audit flags" />
        <Metric label="Evidence gaps" value={graph.evidenceGaps.length} helper="open source controls" />
        <Metric label="Manifest" value={manifestHash ? "ready" : "pending"} helper={manifestHash ? `${manifestHash.slice(0, 12)}...` : "calculating"} />
      </div>

      <section className={`reg-source-review ${sourceReview.status}`} aria-label="Source Review Ledger">
        <div className="reg-section-title">
          <ShieldCheck size={17} aria-hidden="true" />
          <h3>Source Review Ledger</h3>
        </div>
        <div className="reg-source-review-summary">
          <Metric label="Reviewed sources" value={sourceReview.currentSourceCount} helper={`${sourceReview.totalSourceCount} matched`} />
          <Metric label="Review due" value={sourceReview.reviewDueCount} helper={`${sourceReview.reviewWindowDays}-day cadence`} />
          <Metric label="Metadata gaps" value={sourceReview.metadataMissingCount} helper="citation, URL, notes" />
        </div>
        <p>{sourceReview.notLegalAdviceBoundary}</p>
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
