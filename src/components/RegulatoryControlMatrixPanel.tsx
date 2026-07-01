import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  exportRegulatoryControlMatrixJson,
  type RegulatoryControlMatrix,
  type RegulatoryControlStatus
} from "../lib/regulatoryControlMatrix";
import {
  createRegulatoryControlMatrixFilterOptions,
  filterRegulatoryControlMatrixControls
} from "../lib/regulatoryControlMatrixFilters";

type RegulatoryControlMatrixPanelProps = {
  matrix: RegulatoryControlMatrix;
};

export function RegulatoryControlMatrixPanel({ matrix }: RegulatoryControlMatrixPanelProps) {
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [controlQuery, setControlQuery] = useState("");
  const filterOptions = useMemo(() => createRegulatoryControlMatrixFilterOptions(matrix.controls), [matrix.controls]);
  const filteredControls = useMemo(
    () =>
      filterRegulatoryControlMatrixControls(matrix.controls, {
        jurisdiction: jurisdictionFilter,
        topic: topicFilter,
        status: statusFilter,
        query: controlQuery
      }),
    [controlQuery, jurisdictionFilter, matrix.controls, statusFilter, topicFilter]
  );
  const previewControls = filteredControls.slice(0, 8);
  const counselRoutes = Array.from(new Set(matrix.controls.map((control) => control.localCounselRole))).slice(0, 4);
  const filtersActive =
    jurisdictionFilter !== "all" || topicFilter !== "all" || statusFilter !== "all" || controlQuery.trim().length > 0;

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

      <div className="reg-control-filters" aria-label="Control Matrix filters">
        <label>
          <span>Jurisdiction</span>
          <select
            aria-label="Control matrix jurisdiction"
            value={jurisdictionFilter}
            onChange={(event) => setJurisdictionFilter(event.target.value)}
          >
            <option value="all">All jurisdictions</option>
            {filterOptions.jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction} value={jurisdiction}>
                {jurisdiction}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Topic</span>
          <select
            aria-label="Control matrix topic"
            value={topicFilter}
            onChange={(event) => setTopicFilter(event.target.value)}
          >
            <option value="all">All topics</option>
            {filterOptions.topics.map((topic) => (
              <option key={topic} value={topic}>
                {formatTopic(topic)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select
            aria-label="Control matrix status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {filterOptions.statuses.map((status) => (
              <option key={status} value={status}>
                {formatControlStatus(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          <span>Search</span>
          <input
            aria-label="Search controls"
            type="search"
            value={controlQuery}
            placeholder="Search citation, counsel route, source, or next action"
            onChange={(event) => setControlQuery(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="secondary"
          disabled={!filtersActive}
          onClick={() => {
            setJurisdictionFilter("all");
            setTopicFilter("all");
            setStatusFilter("all");
            setControlQuery("");
          }}
        >
          Reset filters
        </button>
      </div>

      <div className="reg-control-filter-state">
        Showing {filteredControls.length} of {matrix.controls.length} controls. Filters change the on-screen view only; JSON export
        remains the full metadata-only control matrix.
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

      <div className="reg-control-list" role="list" aria-label="Filtered regulatory controls">
        {matrix.controls.length === 0 ? (
          <p className="empty-state">No regulatory controls matched current project facts. Add jurisdictions and launch details to generate controls.</p>
        ) : null}
        {matrix.controls.length > 0 && previewControls.length === 0 ? (
          <p className="empty-state">No controls match the current filters. Reset filters or search another source, counsel route, or next action.</p>
        ) : null}
        {previewControls.map((control) => (
          <article key={control.controlId} className={`reg-control-item ${control.status}`} role="listitem">
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

function formatTopic(topic: RegulatoryControlMatrix["controls"][number]["topic"]): string {
  return topic.replace(/-/g, " ");
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
