import { Download, GitBranch } from "lucide-react";
import {
  downloadManifestDriftReportJson,
  type ManifestDriftReport,
  type ManifestDriftStatus,
  type ManifestDriftTargetStatus
} from "../lib/manifestDrift";

type ManifestDriftGuardPanelProps = {
  projectName: string;
  report: ManifestDriftReport | null;
};

export function ManifestDriftGuardPanel({ projectName, report }: ManifestDriftGuardPanelProps) {
  const status = report?.status ?? "needs-action";
  const visibleTargets = report?.targets ?? [];

  return (
    <section className={`manifest-drift-panel ${status}`} role="region" aria-label="Manifest Drift Guard">
      <div className="manifest-drift-header">
        <div className="panel-title compact-title">
          <GitBranch size={17} aria-hidden="true" />
          <h3>Manifest Drift Guard</h3>
        </div>
        <span className={`manifest-drift-status ${status}`}>{formatReportStatus(status)}</span>
      </div>
      <p className="section-note">
        {report?.notLegalAdviceBoundary ??
          "Not legal advice. Manifest drift reports are audit preparation export-readiness metadata only."}
      </p>

      {!report ? <p className="empty-state">Manifest drift report is calculating from current evidence and export metadata.</p> : null}

      {report ? (
        <>
          <div className="manifest-drift-summary">
            <DriftFact label="Report hash" value={report.reportHash} wide />
            <DriftFact label="Current manifest" value={report.currentManifestHash ?? "calculating"} wide />
            <DriftFact label="Items" value={String(report.currentItemCount)} />
            <DriftFact label="Fresh" value={String(report.freshCount)} />
            <DriftFact label="Stale" value={String(report.staleCount)} />
            <DriftFact label="Missing" value={String(report.missingCount)} />
          </div>
          <div className="manifest-drift-actions">
            <div>
              <strong>{formatReportStatus(report.status)}</strong>
              <span>{report.nextActions[0]}</span>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => downloadManifestDriftReportJson(`${slug(projectName)}-manifest-drift-report.json`, report)}
            >
              <Download size={16} aria-hidden="true" />
              Download Manifest Drift JSON
            </button>
          </div>
          <div className="manifest-drift-targets">
            {visibleTargets.map((target) => (
              <article key={target.id} className={`manifest-drift-target ${target.status}`}>
                <header>
                  <strong>{target.label}</strong>
                  <span>{formatTargetStatus(target.status)}</span>
                </header>
                <p>{target.evidence}</p>
                <div className="manifest-drift-hashes">
                  <DriftFact label="Current" value={target.currentHash ?? "not available"} />
                  <DriftFact label="Recorded" value={target.recordedHash ?? "not available"} />
                  <DriftFact label="Matched" value={formatMatchedCount(target)} />
                </div>
                <small>{target.recoveryAction}</small>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function DriftFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "wide" : ""}>
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function formatReportStatus(status: ManifestDriftStatus): string {
  if (status === "ready") {
    return "Drift clear";
  }
  if (status === "needs-review") {
    return "Drift needs review";
  }
  if (status === "empty") {
    return "No evidence locked";
  }
  return "Drift needs action";
}

function formatTargetStatus(status: ManifestDriftTargetStatus): string {
  if (status === "not-applicable") {
    return "not applicable";
  }
  return status;
}

function formatMatchedCount(target: ManifestDriftReport["targets"][number]): string {
  if (typeof target.matchedItemCount === "number") {
    return `${target.matchedItemCount}/${target.currentItemCount}`;
  }
  return `${target.status === "fresh" ? target.currentItemCount : 0}/${target.currentItemCount}`;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "lexproof"
  );
}
