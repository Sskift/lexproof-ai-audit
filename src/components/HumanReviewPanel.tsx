import { useState } from "react";
import { ClipboardCheck, Download, History, ShieldAlert, UserCheck } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  createHumanReviewTimeline,
  downloadHumanReviewTimelineJson,
  type HumanReviewDecision,
  type HumanReviewDecisionUpdate,
  type HumanReviewQueue,
  type HumanReviewQueueItem,
  type HumanReviewStatus,
  type HumanReviewTimelineEntry
} from "../lib/humanReviewWorkflow";

type HumanReviewPanelProps = {
  queue: HumanReviewQueue;
  decisions: HumanReviewDecision[];
  onSaveDecision: (item: HumanReviewQueueItem, update: HumanReviewDecisionUpdate) => void;
};

const statuses: HumanReviewStatus[] = ["needs-review", "in-review", "needs-more-evidence", "reviewed", "rejected"];

export function HumanReviewPanel({ queue, decisions, onSaveDecision }: HumanReviewPanelProps) {
  const [savedTitle, setSavedTitle] = useState("");
  const [saveGuidance, setSaveGuidance] = useState("");
  const timeline = createHumanReviewTimeline({
    projectId: queue.items[0]?.projectId ?? "",
    queue,
    decisions
  });
  const savedDecisionCount = decisions.length;

  const saveDecision = (item: HumanReviewQueueItem, update: HumanReviewDecisionUpdate) => {
    onSaveDecision(item, update);
    setSavedTitle(item.title);
    setSaveGuidance(reviewDecisionGuidance(item, update.status));
  };

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={UserCheck}
        title="Human Review"
        subtitle="Route risk flags, evidence records, and AI event outputs through named reviewer decisions before external reliance."
      />

      <div className="notice-banner">
        <ShieldAlert size={18} aria-hidden="true" />
        <p>Not legal advice. Human review decisions track audit preparation workflow status only.</p>
      </div>

      <div className="human-review-summary">
        <SummaryStat label="Queue items" value={queue.summary.totalCount} />
        <SummaryStat label="Needs reviewer" value={queue.summary.openCount} />
        <SummaryStat label="Reviewed items" value={queue.summary.reviewedCount} />
        <SummaryStat label="Rejected or blocked" value={queue.summary.blockedCount} />
      </div>

      <HumanReviewTimelinePanel timeline={timeline} savedDecisionCount={savedDecisionCount} />

      {savedTitle ? (
        <p className="save-state">
          Human review decision saved for {savedTitle}. {saveGuidance}
        </p>
      ) : null}

      <div className="human-review-queue">
        {queue.items.length === 0 ? <p className="empty-state">No human review targets are currently queued.</p> : null}
        {queue.items.map((item, index) => (
          <HumanReviewCard key={item.id} item={item} sequence={index + 1} onSave={saveDecision} />
        ))}
      </div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HumanReviewCard({
  item,
  sequence,
  onSave
}: {
  item: HumanReviewQueueItem;
  sequence: number;
  onSave: (item: HumanReviewQueueItem, update: HumanReviewDecisionUpdate) => void;
}) {
  const [status, setStatus] = useState<HumanReviewStatus>(item.status);
  const [reviewer, setReviewer] = useState(item.reviewer);
  const [decisionNote, setDecisionNote] = useState(item.decisionNote);
  const [dueDate, setDueDate] = useState(toDateInputValue(item.dueAt));
  const fieldLabel = item.title || `review item ${sequence}`;

  return (
    <article className={`human-review-card ${status}`}>
      <header>
        <span className={`priority ${item.priority}`}>{item.priority}</span>
        <div>
          <strong>{item.title}</strong>
          <small>
            {labelForTarget(item.targetType)} · Due {formatDate(item.dueAt)} · {item.summary}
          </small>
        </div>
        <span className={`redaction-pill ${status}`}>{status}</span>
      </header>

      <div className="human-review-grid">
        <label className="editor-field" htmlFor={`human-review-${sequence}-status`}>
          <span className="field-label">Status</span>
          <select
            id={`human-review-${sequence}-status`}
            aria-label={`Status for ${fieldLabel}`}
            value={status}
            onChange={(event) => setStatus(event.target.value as HumanReviewStatus)}
          >
            {statuses.map((nextStatus) => (
              <option key={nextStatus} value={nextStatus}>
                {nextStatus}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-field" htmlFor={`human-review-${sequence}-reviewer`}>
          <span className="field-label">Reviewer</span>
          <input
            id={`human-review-${sequence}-reviewer`}
            aria-label={`Reviewer for ${fieldLabel}`}
            value={reviewer}
            onChange={(event) => setReviewer(event.target.value)}
            placeholder="Counsel, compliance, or review owner"
          />
        </label>
        <label className="editor-field" htmlFor={`human-review-${sequence}-due`}>
          <span className="field-label">Due date</span>
          <input
            id={`human-review-${sequence}-due`}
            aria-label={`Due date for ${fieldLabel}`}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <label className="editor-field review-note-field" htmlFor={`human-review-${sequence}-note`}>
          <span className="field-label">Decision note</span>
          <textarea
            id={`human-review-${sequence}-note`}
            aria-label={`Decision note for ${fieldLabel}`}
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            placeholder="Decision, blocker, or evidence request"
          />
        </label>
      </div>

      <div className="inline-actions">
        <small>{item.notLegalAdviceBoundary}</small>
        <button
          type="button"
          className="secondary"
          onClick={() => onSave(item, { status, reviewer, decisionNote, dueAt: fromDateInputValue(dueDate, item.dueAt) })}
          aria-label={`Save decision for ${fieldLabel}`}
        >
          <ClipboardCheck size={16} aria-hidden="true" />
          Save decision
        </button>
      </div>
    </article>
  );
}

function HumanReviewTimelinePanel({
  timeline,
  savedDecisionCount
}: {
  timeline: HumanReviewTimelineEntry[];
  savedDecisionCount: number;
}) {
  const decisionEntries = timeline.filter((entry) => entry.action === "review.decision.saved").slice(-4).reverse();

  return (
    <section className="human-review-timeline">
      <div className="split-title compact-title">
        <div>
          <History size={17} aria-hidden="true" />
          <h3>Human Review Timeline</h3>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadHumanReviewTimelineJson("human-review-timeline.json", timeline)}
        >
          <Download size={15} aria-hidden="true" />
          Download Review Timeline JSON
        </button>
      </div>
      <p>
        {savedDecisionCount} saved decisions · {timeline.length} timeline entries with audit log IDs. Not legal advice.
      </p>
      {decisionEntries.length === 0 ? (
        <p className="empty-state">No saved review decisions yet.</p>
      ) : (
        <div className="timeline-list">
          {decisionEntries.map((entry) => (
            <div key={entry.id} className="timeline-row">
              <span className={`redaction-pill ${entry.status}`}>{entry.status}</span>
              <div>
                <strong>{entry.title}</strong>
                <small>
                  {entry.reviewer || "Unassigned"} · Due {formatDate(entry.dueAt)} · {entry.auditLogId}
                </small>
                {entry.decisionNote ? <p>{entry.decisionNote}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function labelForTarget(targetType: HumanReviewQueueItem["targetType"]): string {
  if (targetType === "risk-flag") {
    return "Risk flag";
  }
  if (targetType === "ai-event") {
    return "AI event";
  }
  return "Evidence";
}

function formatDate(value: string): string {
  return value.slice(0, 10);
}

function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

function fromDateInputValue(value: string, fallback: string): string {
  if (!value.trim()) {
    return fallback;
  }

  return `${value}T00:00:00.000Z`;
}

function reviewDecisionGuidance(item: HumanReviewQueueItem, status: HumanReviewStatus): string {
  if (item.targetType !== "evidence") {
    return "Not legal advice; this is an audit preparation workflow status.";
  }

  if (status === "needs-more-evidence") {
    return "Returned for more evidence. Linked evidence is moved back to requested status. Not legal advice.";
  }

  if (status === "rejected") {
    return "Rejected from review. Linked evidence is moved to draft for rework. Not legal advice.";
  }

  if (status === "reviewed") {
    return "Linked evidence is marked verified for audit preparation handoff. Not legal advice.";
  }

  return "Linked evidence remains in review workflow status. Not legal advice.";
}
