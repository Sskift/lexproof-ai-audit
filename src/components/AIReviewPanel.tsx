import { Bot, ClipboardCheck, Sparkles } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import { ModelSettingsPanel } from "./ModelSettingsPanel";
import { createMissingEvidenceChecklist, type AIReviewResult } from "../lib/aiReview";
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

      <div className="review-actions">
        <button type="button" disabled={status === "running"} onClick={onRunReview}>
          <Sparkles size={16} aria-hidden="true" />
          {status === "running" ? "Running AI Review" : "Run AI Review"}
        </button>
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
