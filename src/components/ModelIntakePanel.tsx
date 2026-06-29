import { useEffect, useState } from "react";
import { Bot, Download, Fingerprint, ListChecks, PlusCircle, ShieldAlert } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  buildModelIntakeSummary,
  downloadModelIntakeJson,
  validateModelConnectionProfile,
  type AIEventRecord,
  type AIEventReviewStatus,
  type ModelConnectionProfile,
  type ModelDecisionRole,
  type ModelEndpointType,
  type ModelIntakeSummary
} from "../lib/modelIntake";

type ModelIntakePanelProps = {
  projectId: string;
  profile: ModelConnectionProfile;
  events: AIEventRecord[];
  onProfileChange: (profile: ModelConnectionProfile) => void;
  onAddEvent: (event: AIEventRecord) => void;
  onUpdateEvent: (id: string, updates: Partial<Pick<AIEventRecord, "humanReviewer" | "reviewStatus">>) => void;
};

type EventFormState = {
  eventType: string;
  inputSummary: string;
  outputSummary: string;
  modelAction: string;
  humanReviewer: string;
  reviewStatus: AIEventReviewStatus;
};

const blankEventForm: EventFormState = {
  eventType: "",
  inputSummary: "",
  outputSummary: "",
  modelAction: "",
  humanReviewer: "",
  reviewStatus: "needs-review"
};

export function ModelIntakePanel({
  projectId,
  profile,
  events,
  onProfileChange,
  onAddEvent,
  onUpdateEvent
}: ModelIntakePanelProps) {
  const [eventForm, setEventForm] = useState<EventFormState>(blankEventForm);
  const [summary, setSummary] = useState<ModelIntakeSummary | null>(null);
  const validation = validateModelConnectionProfile(profile);

  useEffect(() => {
    let live = true;
    setSummary(null);
    buildModelIntakeSummary(profile, events).then((nextSummary) => {
      if (live) {
        setSummary(nextSummary);
      }
    });
    return () => {
      live = false;
    };
  }, [events, profile]);

  const updateProfile = (updates: Partial<ModelConnectionProfile>) => onProfileChange({ ...profile, ...updates });

  const addEvent = () => {
    const now = new Date().toISOString();
    onAddEvent({
      id: `ai-event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      projectId,
      eventType: eventForm.eventType.trim() || "AI event",
      inputSummary: eventForm.inputSummary.trim(),
      outputSummary: eventForm.outputSummary.trim(),
      modelAction: eventForm.modelAction.trim(),
      humanReviewer: eventForm.humanReviewer.trim() || profile.humanReviewOwner || "Compliance",
      reviewStatus: eventForm.reviewStatus,
      createdAt: now,
      updatedAt: now
    });
    setEventForm(blankEventForm);
  };

  const downloadIntake = () => {
    if (!summary) {
      return;
    }

    downloadModelIntakeJson(`${projectId || "project"}-model-intake.json`, profile, events, summary);
  };

  const eventHashes = new Map(summary?.eventHashes.map((item) => [item.eventId, item.hash]) ?? []);

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={Bot}
        title="Model Intake"
        subtitle="Register model connection boundaries and AI event records before counsel or compliance reliance."
      />

      <div className="notice-banner">
        <ShieldAlert size={18} aria-hidden="true" />
        <p>AI events are audit-prep records for human review. Not legal advice, not KYC, and not final adjudication.</p>
      </div>

      <section className="model-settings">
        <div className="panel-title compact-title">
          <Bot size={17} aria-hidden="true" />
          <h3>Connection Profile</h3>
        </div>
        <div className="settings-grid">
          <div>
            <label className="field-label" htmlFor="intake-provider-name">
              Provider name
            </label>
            <input
              id="intake-provider-name"
              value={profile.providerName}
              onChange={(event) => updateProfile({ providerName: event.target.value })}
              placeholder="OpenAI-compatible gateway"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="intake-model-name">
              Intake model name
            </label>
            <input
              id="intake-model-name"
              value={profile.modelName}
              onChange={(event) => updateProfile({ modelName: event.target.value })}
              placeholder="gpt-audit-review"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="intake-endpoint-type">
              Endpoint type
            </label>
            <select
              id="intake-endpoint-type"
              value={profile.endpointType}
              onChange={(event) => updateProfile({ endpointType: event.target.value as ModelEndpointType })}
            >
              <option value="mock">Mock</option>
              <option value="openai-compatible">OpenAI-compatible</option>
              <option value="enterprise-proxy">Enterprise proxy</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="intake-decision-role">
              Decision role
            </label>
            <select
              id="intake-decision-role"
              value={profile.decisionRole}
              onChange={(event) => updateProfile({ decisionRole: event.target.value as ModelDecisionRole })}
            >
              <option value="draft-assistant">Draft assistant</option>
              <option value="risk-triage">Risk triage</option>
              <option value="human-review-support">Human review support</option>
              <option value="final-legal-decision">Final legal decision</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="intake-use-case">
              Model use case
            </label>
            <input
              id="intake-use-case"
              value={profile.useCase}
              onChange={(event) => updateProfile({ useCase: event.target.value })}
              placeholder="Evidence extraction and draft counsel questions"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="intake-review-owner">
              Human review owner
            </label>
            <input
              id="intake-review-owner"
              value={profile.humanReviewOwner}
              onChange={(event) => updateProfile({ humanReviewOwner: event.target.value })}
              placeholder="Compliance"
            />
          </div>
          <div className="full-width">
            <label className="field-label" htmlFor="intake-data-classes">
              Allowed data classes
            </label>
            <input
              id="intake-data-classes"
              value={profile.dataClasses.join(", ")}
              onChange={(event) =>
                updateProfile({
                  dataClasses: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                })
              }
              placeholder="evidence summaries, policy metadata"
            />
          </div>
        </div>
        {validation.errors.length > 0 ? (
          <ul className="validation-list">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        <p className="save-state">Connection profiles store no API keys. Live credentials remain session-only in AI Review settings.</p>
      </section>

      <section className="review-section">
        <div className="panel-title compact-title">
          <PlusCircle size={17} aria-hidden="true" />
          <h3>AI Event Intake</h3>
        </div>
        <div className="model-event-form">
          <div>
            <label className="field-label" htmlFor="ai-event-type">
              AI event type
            </label>
            <input
              id="ai-event-type"
              value={eventForm.eventType}
              onChange={(event) => setEventForm((current) => ({ ...current, eventType: event.target.value }))}
              placeholder="Evidence review"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ai-event-review-status">
              Event review status
            </label>
            <select
              id="ai-event-review-status"
              value={eventForm.reviewStatus}
              onChange={(event) =>
                setEventForm((current) => ({ ...current, reviewStatus: event.target.value as AIEventReviewStatus }))
              }
            >
              <option value="needs-review">needs-review</option>
              <option value="reviewed">reviewed</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="ai-event-input-summary">
              Event input summary
            </label>
            <textarea
              id="ai-event-input-summary"
              value={eventForm.inputSummary}
              onChange={(event) => setEventForm((current) => ({ ...current, inputSummary: event.target.value }))}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ai-event-output-summary">
              Event output summary
            </label>
            <textarea
              id="ai-event-output-summary"
              value={eventForm.outputSummary}
              onChange={(event) => setEventForm((current) => ({ ...current, outputSummary: event.target.value }))}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ai-event-model-action">
              Model action
            </label>
            <input
              id="ai-event-model-action"
              value={eventForm.modelAction}
              onChange={(event) => setEventForm((current) => ({ ...current, modelAction: event.target.value }))}
              placeholder="Generated draft audit-prep questions"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ai-event-human-reviewer">
              Event human reviewer
            </label>
            <input
              id="ai-event-human-reviewer"
              value={eventForm.humanReviewer}
              onChange={(event) => setEventForm((current) => ({ ...current, humanReviewer: event.target.value }))}
              placeholder={profile.humanReviewOwner || "Compliance"}
            />
          </div>
          <button type="button" onClick={addEvent}>
            <PlusCircle size={16} aria-hidden="true" />
            Add AI event
          </button>
        </div>
      </section>

      <section className="review-section">
        <div className="panel-title compact-title">
          <ListChecks size={17} aria-hidden="true" />
          <h3>Intake Readiness</h3>
        </div>
        <div className={`model-readiness ${summary?.readiness ?? "needs-review"}`}>
          <strong>{summary?.readiness ?? "calculating"}</strong>
          <span>
            {summary?.eventCount ?? events.length} events · {summary?.unresolvedEventCount ?? 0} unresolved
          </span>
        </div>
        <ul className="model-checklist">
          {(summary?.handoffChecklist ?? ["Confirm model use remains audit preparation only."]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="model-intake-actions">
          <button type="button" className="secondary" disabled={!summary} onClick={downloadIntake}>
            <Download size={16} aria-hidden="true" />
            Download Model Intake JSON
          </button>
        </div>
        <small>{summary?.notLegalAdviceBoundary ?? "Not legal advice. Model intake records are audit preparation materials."}</small>
      </section>

      <section className="review-section">
        <div className="panel-title compact-title">
          <Fingerprint size={17} aria-hidden="true" />
          <h3>AI Event Ledger</h3>
        </div>
        <div className="run-ledger">
          {events.length === 0 ? <p className="empty-state">No AI event records registered for this project.</p> : null}
          {events.map((event, index) => (
            <article key={event.id} className="run-card">
              <header>
                <div>
                  <strong>{event.eventType}</strong>
                  <span>{event.modelAction || "Model action pending"}</span>
                </div>
                <span className={`redaction-pill ${event.reviewStatus}`}>{event.reviewStatus}</span>
              </header>
              <p>{event.outputSummary || "No model output summary recorded."}</p>
              <p className="model-event-input">Input: {event.inputSummary || "No input summary recorded."}</p>
              <div className="event-review-controls">
                <div>
                  <label className="field-label" htmlFor={`ai-event-${event.id}-status`}>
                    Review status for AI event {index + 1}
                  </label>
                  <select
                    id={`ai-event-${event.id}-status`}
                    value={event.reviewStatus}
                    onChange={(changeEvent) =>
                      onUpdateEvent(event.id, { reviewStatus: changeEvent.target.value as AIEventReviewStatus })
                    }
                  >
                    <option value="needs-review">needs-review</option>
                    <option value="reviewed">reviewed</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor={`ai-event-${event.id}-reviewer`}>
                    Reviewer for AI event {index + 1}
                  </label>
                  <input
                    id={`ai-event-${event.id}-reviewer`}
                    value={event.humanReviewer}
                    onChange={(changeEvent) => onUpdateEvent(event.id, { humanReviewer: changeEvent.target.value })}
                    placeholder={profile.humanReviewOwner || "Compliance"}
                  />
                </div>
              </div>
              <div className="run-facts">
                <RunFact label="Human reviewer" value={event.humanReviewer || "Unassigned"} />
                <RunFact label="Event SHA-256" value={eventHashes.get(event.id) ?? "Calculating"} />
              </div>
              <small>
                {event.createdAt} · Not legal advice. AI event output requires human review.
              </small>
            </article>
          ))}
        </div>
      </section>
    </section>
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
