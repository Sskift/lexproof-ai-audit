import { Bot, ClipboardCheck, Download, Fingerprint, ShieldAlert, Sparkles } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import { ModelSettingsPanel } from "./ModelSettingsPanel";
import { createMissingEvidenceChecklist, createRedactionReport, type AIReviewResult } from "../lib/aiReview";
import type { AuditResult } from "../lib/auditEngine";
import { createModelAccessWorkflow } from "../lib/modelAccessWorkflow";
import { createModelConnectionReadiness } from "../lib/modelConnectionReadiness";
import type { ModelIntakeSummary } from "../lib/modelIntake";
import { downloadModelReviewRunJson, type ModelReviewRun } from "../lib/modelReviewLedger";
import type { ModelSettings, ModelSettingsValidation } from "../lib/modelProvider";
import type { ProjectProfile } from "../lib/projectModel";

type AIReviewPanelProps = {
  project: ProjectProfile;
  audit: AuditResult;
  settings: ModelSettings;
  settingsValidation: ModelSettingsValidation;
  result: AIReviewResult | null;
  reviewRuns: ModelReviewRun[];
  modelIntakeSummary: ModelIntakeSummary | null;
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
  reviewRuns,
  modelIntakeSummary,
  status,
  error,
  onSettingsChange,
  onRunReview
}: AIReviewPanelProps) {
  const checklist = createMissingEvidenceChecklist(audit, project.evidenceItems);
  const redactionReport = createRedactionReport(project.evidenceItems);
  const redactionBlocked = redactionReport.status === "blocked";
  const modelConnectionReadiness = createModelConnectionReadiness(settings, settingsValidation, redactionReport);
  const modelAccessWorkflow = createModelAccessWorkflow({
    settings,
    settingsValidation,
    connectionReadiness: modelConnectionReadiness,
    modelIntakeSummary,
    runCount: reviewRuns.length
  });

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

      <section className={`review-section model-access-workflow ${modelAccessWorkflow.overallStatus}`}>
        <div className="split-title compact-title">
          <div>
            <ClipboardCheck size={17} aria-hidden="true" />
            <h3>Model Access Workflow</h3>
          </div>
          <span className={`workflow-status ${modelAccessWorkflow.overallStatus}`}>{modelAccessWorkflow.overallStatus}</span>
        </div>
        <div className="workflow-mode">
          <strong>{modelAccessWorkflow.currentMode}</strong>
          <span>{modelAccessWorkflow.notLegalAdviceBoundary}</span>
        </div>
        {modelAccessWorkflow.blockers.length > 0 ? (
          <ul className="validation-list">
            {modelAccessWorkflow.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        ) : null}
        <div className="workflow-steps">
          {modelAccessWorkflow.steps.map((step, index) => (
            <article key={step.title} className={`workflow-step ${step.status}`}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <small>{step.status}</small>
                <p>{step.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`review-section connection-readiness ${modelConnectionReadiness.status}`}>
        <div className="panel-title compact-title">
          <Bot size={17} aria-hidden="true" />
          <h3>Model Connection Readiness</h3>
        </div>
        <div className="connection-readiness-summary">
          <strong>{modelConnectionReadiness.headline}</strong>
          <span>{modelConnectionReadiness.detail}</span>
        </div>
        {modelConnectionReadiness.blockers.length > 0 ? (
          <ul className="validation-list">
            {modelConnectionReadiness.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        ) : null}
        <ul className="model-checklist compact-checklist">
          {modelConnectionReadiness.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

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

      <section className="review-section">
        <div className="panel-title compact-title">
          <Fingerprint size={17} aria-hidden="true" />
          <h3>AI Review Run Ledger</h3>
        </div>
        <p className="section-note">
          Local model-run receipts record payload and response hashes for audit preparation. They do not store API keys or raw
          model credentials.
        </p>
        <div className="run-ledger">
          {reviewRuns.length === 0 ? <p className="empty-state">No model review runs recorded for this project.</p> : null}
          {reviewRuns.map((run) => (
            <article key={run.runId} className="run-card">
              <header>
                <div>
                  <strong>{run.providerLabel}</strong>
                  <span>{run.model}</span>
                </div>
                <span className={`redaction-pill ${run.redactionStatus}`}>{statusLabel(run.redactionStatus)}</span>
              </header>
              <div className="run-facts">
                <RunFact label="Payload SHA-256" value={run.payloadHash} />
                <RunFact label="Response SHA-256" value={run.responseHash} />
                <RunFact label="Risk flags" value={String(run.riskFlagCount)} />
                <RunFact label="Evidence summaries" value={String(run.evidenceSummaryCount)} />
              </div>
              <small>
                {run.generatedAt} · {run.boundary}
              </small>
              <button type="button" className="secondary" onClick={() => downloadModelReviewRunJson(`${run.runId}.json`, run)}>
                <Download size={16} aria-hidden="true" />
                Download Run JSON
              </button>
            </article>
          ))}
        </div>
      </section>
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

function RunFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}
