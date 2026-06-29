import { Bot, ClipboardCheck, ShieldAlert, Sparkles } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import { ModelSettingsPanel } from "./ModelSettingsPanel";
import { createMissingEvidenceChecklist, createRedactionReport, type AIReviewResult } from "../lib/aiReview";
import type { AuditResult } from "../lib/auditEngine";
import type { ModelSettings, ModelSettingsValidation } from "../lib/modelProvider";
import type { ProjectProfile } from "../lib/projectModel";

type AIReviewPanelProps = {
  project: ProjectProfile;
  audit: AuditResult;
  settings: ModelSettings;
  settingsValidation: ModelSettingsValidation;
  result: AIReviewResult | null;
  status: "idle" | "running" | "complete" | "error";
  error: string;
  onSettingsChange: (settings: ModelSettings) => void;
  onRunReview: () => void;
};

export function AIReviewPanel({
  project,
  audit,
  settings,
  settingsValidation,
  result,
  status,
  error,
  onSettingsChange,
  onRunReview
}: AIReviewPanelProps) {
  const checklist = createMissingEvidenceChecklist(audit, project.evidenceItems);
  const redactionReport = createRedactionReport(project.evidenceItems);
  const redactionBlocked = redactionReport.status === "blocked";

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={Bot}
        title="AI Review"
        subtitle="Use a controlled model workflow to extract facts, draft questions, and surface missing evidence for counsel review."
      />

      <div className="notice-banner">
        <Sparkles size={18} aria-hidden="true" />
        <p>AI-assisted draft for audit preparation only. Not legal advice. Deterministic risk scoring remains separate.</p>
      </div>

      <ModelSettingsPanel settings={settings} validation={settingsValidation} onChange={onSettingsChange} />

      <section className={`review-section redaction-gate ${redactionReport.status}`}>
        <div className="panel-title compact-title">
          <ShieldAlert size={17} aria-hidden="true" />
          <h3>Redaction Gate</h3>
        </div>
        <div className="redaction-summary">
          <div>
            <span>Review model payload</span>
            <strong>{statusLabel(redactionReport.status)}</strong>
          </div>
          <p>{redactionReport.boundary}</p>
        </div>
        <div className="redaction-preview-grid">
          {redactionReport.evidencePreview.length === 0 ? (
            <p className="empty-state">No evidence summaries will be sent to the model.</p>
          ) : null}
          {redactionReport.evidencePreview.map((item) => (
            <article key={`${item.label}-${item.kind}`} className="redaction-preview">
              <strong>{item.label}</strong>
              <small>
                {item.kind} · {item.status} · {item.owner} · redactions {item.redactionCount}
              </small>
              <p>{item.contentPreview || "No evidence content preview."}</p>
            </article>
          ))}
        </div>
        {redactionReport.findings.length > 0 ? (
          <ul className="redaction-findings">
            {redactionReport.findings.map((finding) => (
              <li key={`${finding.evidenceLabel}-${finding.category}`}>
                <strong>{finding.severity === "block" ? "Block" : "Review"}:</strong> {finding.evidenceLabel} ·{" "}
                {finding.category} · {finding.message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="review-actions">
        <button type="button" disabled={status === "running" || redactionBlocked} onClick={onRunReview}>
          <Sparkles size={16} aria-hidden="true" />
          {status === "running" ? "Running AI Review" : "Run AI Review"}
        </button>
        {redactionBlocked ? <span className="error-text">Redaction Gate blocked this model call.</span> : null}
        {error ? <span className="error-text">{error}</span> : null}
      </div>

      <section className="review-section">
        <div className="panel-title compact-title">
          <ClipboardCheck size={17} aria-hidden="true" />
          <h3>Missing Evidence Checklist</h3>
        </div>
        <div className="checklist-grid">
          {checklist.length === 0 ? <p className="empty-state">No missing evidence requirements generated from current flags.</p> : null}
          {checklist.map((item) => (
            <article key={item.id} className={`checklist-item ${item.status}`}>
              <span className={`priority ${item.priority}`}>{item.priority}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
                <small>
                  {item.relatedFlagId} · {item.status}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {result ? (
        <section className="review-section">
          <h3>{result.modelBoundary}</h3>
          <div className="ai-output-grid">
            <ReviewList title="Extracted Facts" items={result.extractedFacts} />
            <ReviewList title="AI Missing Evidence" items={result.missingEvidence} />
            <ReviewList title="Draft Counsel Questions" items={result.draftQuestions} />
            <ReviewList title="Suggested Remediation" items={result.suggestedRemediation} />
          </div>
        </section>
      ) : null}
    </section>
  );
}

function statusLabel(status: string): string {
  if (status === "blocked") {
    return "Blocked";
  }
  if (status === "needs-review") {
    return "Needs review";
  }
  return "Clean";
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="review-card">
      <h4>{title}</h4>
      <ul>
        {items.length === 0 ? <li>No model suggestion returned.</li> : null}
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
