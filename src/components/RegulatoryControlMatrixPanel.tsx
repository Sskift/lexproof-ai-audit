import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import {
  exportRegulatoryControlMatrixJson,
  type RegulatoryControlMatrix,
  type RegulatoryControlStatus
} from "../lib/regulatoryControlMatrix";

type RegulatoryControlMatrixPanelProps = {
  matrix: RegulatoryControlMatrix;
};

export function RegulatoryControlMatrixPanel({ matrix }: RegulatoryControlMatrixPanelProps) {
  const previewControls = matrix.controls.slice(0, 5);
  const counselRoutes = Array.from(new Set(matrix.controls.map((control) => control.localCounselRole))).slice(0, 4);

  return (
    <section className={`reg-control-matrix ${matrix.status}`} aria-label="Regulatory Control Matrix">
      <div className="reg-control-header">
        <div className="reg-section-title">
          <FileSpreadsheet size={17} aria-hidden="true" />
          <h3>Regulatory Control Matrix</h3>
        </div>
        <button type="button" className="secondary" onClick={() => downloadMatrix(matrix)}>
          <Download size={15} aria-hidden="true" />
          Download Control Matrix JSON
        </button>
      </div>

      <div className="reg-control-boundary">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>{matrix.notLegalAdviceBoundary}</span>
      </div>

      <div className="reg-control-summary">
        <MatrixFact label="Status" value={formatMatrixStatus(matrix.status)} helper={`${matrix.controlCount} controls`} />
        <MatrixFact
          label="Evidence gaps"
          value={matrix.summary.needsEvidenceCount}
          helper={`${matrix.summary.openEvidenceRequestCount} open requests`}
        />
        <MatrixFact label="Source review" value={matrix.summary.needsSourceReviewCount} helper="refresh before counsel handoff" />
        <MatrixFact label="Counsel routes" value={counselRoutes.length || "None"} helper={counselRoutes.join(", ") || "No matched routes"} />
      </div>

      <div className="reg-control-list">
        {previewControls.length === 0 ? (
          <p className="empty-state">No regulatory controls matched current project facts. Add jurisdictions and launch details to generate controls.</p>
        ) : null}
        {previewControls.map((control) => (
          <article key={control.controlId} className={`reg-control-item ${control.status}`}>
            <header>
              <span className={`priority ${control.highestPriority}`}>{control.highestPriority}</span>
              <strong>{control.localCounselRole}</strong>
              <small>{formatControlStatus(control.status)}</small>
            </header>
            <p>{control.citation}</p>
            <div className="reg-control-meta">
              <span>{control.jurisdiction}</span>
              <span>{control.evidenceCoverageStatus}</span>
              <span>{control.sourceReviewStatus}</span>
            </div>
            <small>{control.nextAction}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function MatrixFact({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className="reg-control-fact">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function downloadMatrix(matrix: RegulatoryControlMatrix) {
  const blob = new Blob([exportRegulatoryControlMatrixJson(matrix)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lexproof-${matrix.projectId}-regulatory-control-matrix.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatMatrixStatus(status: RegulatoryControlMatrix["status"]): string {
  if (status === "needs-evidence") {
    return "needs evidence";
  }
  if (status === "needs-source-review") {
    return "needs source review";
  }
  if (status === "metadata-missing") {
    return "metadata missing";
  }
  if (status === "no-controls") {
    return "no controls";
  }
  return "ready for counsel";
}

function formatControlStatus(status: RegulatoryControlStatus): string {
  if (status === "needs-evidence") {
    return "evidence needed";
  }
  if (status === "needs-source-review") {
    return "needs source review";
  }
  if (status === "metadata-missing") {
    return "metadata missing";
  }
  return "ready for counsel";
}
