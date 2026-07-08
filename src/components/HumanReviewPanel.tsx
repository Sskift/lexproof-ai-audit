import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Download, History, RefreshCw, ShieldAlert, UserCheck } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  createHumanReviewRecoveryPacket,
  createHumanReviewTimeline,
  downloadHumanReviewRecoveryPacketJson,
  downloadHumanReviewTimelineJson,
  type HumanReviewDecision,
  type HumanReviewDecisionUpdate,
  type HumanReviewQueue,
  type HumanReviewQueueItem,
  type HumanReviewRecoveryPacket,
  type HumanReviewStatus,
  type HumanReviewTimelineEntry
} from "../lib/humanReviewWorkflow";
import { createHumanReviewQueueFilterOptions, filterHumanReviewQueueItems } from "../lib/humanReviewQueueFilters";
import {
  exportServerHumanReviewRecoveryPacketJson,
  type ServerHumanReviewRecoveryPacket,
  type ServerHumanReviewQueueView
} from "../lib/serverHumanReviewQueue";
import {
  fetchServerHumanReviewQueueView,
  ServerHumanReviewQueueClientError
} from "../lib/serverHumanReviewQueueClient";

type HumanReviewPanelProps = {
  queue: HumanReviewQueue;
  decisions: HumanReviewDecision[];
  projectId: string;
  projectName: string;
  onSaveDecision: (item: HumanReviewQueueItem, update: HumanReviewDecisionUpdate) => void;
};

const statuses: HumanReviewStatus[] = ["needs-review", "in-review", "needs-more-evidence", "reviewed", "rejected"];
type ServerQueueRefreshStatus = "idle" | "syncing" | "synced" | "error";

export function HumanReviewPanel({ queue, decisions, projectId, projectName, onSaveDecision }: HumanReviewPanelProps) {
  const [savedTitle, setSavedTitle] = useState("");
  const [saveGuidance, setSaveGuidance] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [reviewQuery, setReviewQuery] = useState("");
  const [recoveryPacket, setRecoveryPacket] = useState<HumanReviewRecoveryPacket | null>(null);
  const [buildingRecoveryPacket, setBuildingRecoveryPacket] = useState(false);
  const [serverQueueApiBaseUrl, setServerQueueApiBaseUrl] = useState("");
  const [serverQueueView, setServerQueueView] = useState<ServerHumanReviewQueueView | null>(null);
  const [serverQueueRefreshStatus, setServerQueueRefreshStatus] = useState<ServerQueueRefreshStatus>("idle");
  const [serverQueueRefreshError, setServerQueueRefreshError] = useState("");
  const [serverQueueRefreshRecoveryAction, setServerQueueRefreshRecoveryAction] = useState("");
  const timeline = createHumanReviewTimeline({
    projectId: queue.items[0]?.projectId ?? "",
    queue,
    decisions
  });
  const savedDecisionCount = decisions.length;
  const recoveryCount = queue.items.filter((item) => item.status === "needs-more-evidence" || item.status === "rejected").length;
  const returnedCount = queue.items.filter((item) => item.status === "needs-more-evidence").length;
  const rejectedCount = queue.items.filter((item) => item.status === "rejected").length;
  const filterOptions = useMemo(() => createHumanReviewQueueFilterOptions(queue.items), [queue.items]);
  const filteredItems = useMemo(
    () =>
      filterHumanReviewQueueItems(queue.items, {
        targetType: targetTypeFilter,
        status: statusFilter,
        reviewer: reviewerFilter,
        query: reviewQuery
      }),
    [queue.items, reviewQuery, reviewerFilter, statusFilter, targetTypeFilter]
  );
  const hasActiveFilters =
    targetTypeFilter !== "all" || statusFilter !== "all" || reviewerFilter !== "all" || reviewQuery.trim().length > 0;

  useEffect(() => {
    setServerQueueView(null);
    setServerQueueRefreshStatus("idle");
    setServerQueueRefreshError("");
    setServerQueueRefreshRecoveryAction("");
  }, [projectId]);

  const saveDecision = (item: HumanReviewQueueItem, update: HumanReviewDecisionUpdate) => {
    onSaveDecision(item, update);
    setSavedTitle(item.title);
    setSaveGuidance(reviewDecisionGuidance(item, update.status));
  };

  const resetFilters = () => {
    setTargetTypeFilter("all");
    setStatusFilter("all");
    setReviewerFilter("all");
    setReviewQuery("");
  };

  const downloadRecoveryPacket = async () => {
    setBuildingRecoveryPacket(true);

    try {
      const packet = await createHumanReviewRecoveryPacket({
        projectId: queue.items[0]?.projectId ?? "local-workspace",
        projectName,
        queue
      });
      setRecoveryPacket(packet);
      downloadHumanReviewRecoveryPacketJson("human-review-recovery-packet.json", packet);
    } finally {
      setBuildingRecoveryPacket(false);
    }
  };

  const refreshServerHumanReviewQueue = async () => {
    setServerQueueRefreshStatus("syncing");
    setServerQueueRefreshError("");
    setServerQueueRefreshRecoveryAction("");

    try {
      const queueView = await fetchServerHumanReviewQueueView({
        apiBaseUrl: serverQueueApiBaseUrl,
        workspaceId: projectId
      });
      setServerQueueView(queueView);
      setServerQueueRefreshStatus("synced");
    } catch (error) {
      setServerQueueView(null);
      setServerQueueRefreshStatus("error");
      if (error instanceof ServerHumanReviewQueueClientError) {
        setServerQueueRefreshError(error.message);
        setServerQueueRefreshRecoveryAction(error.recoveryAction);
        return;
      }
      setServerQueueRefreshError(error instanceof Error ? error.message : "Human Review queue refresh failed.");
      setServerQueueRefreshRecoveryAction("Start the Phase 2 API and retry Human Review queue refresh.");
    }
  };

  const downloadServerRecoveryPacket = () => {
    if (!serverQueueView) {
      return;
    }

    downloadServerHumanReviewRecoveryPacketJson(
      `${slug(projectName)}-server-human-review-recovery-packet.json`,
      serverQueueView.recoveryPacket
    );
  };

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={UserCheck}
        title="Human Review"
        subtitle="Route risk flags, source clause matches, evidence records, and AI event outputs through named reviewer decisions before external reliance."
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

      <HumanReviewRecoveryPacketPanel
        recoveryCount={recoveryCount}
        returnedCount={returnedCount}
        rejectedCount={rejectedCount}
        recoveryPacket={recoveryPacket}
        buildingRecoveryPacket={buildingRecoveryPacket}
        onDownload={downloadRecoveryPacket}
      />

      <ServerHumanReviewRecoveryPacketPanel
        apiBaseUrl={serverQueueApiBaseUrl}
        queueView={serverQueueView}
        status={serverQueueRefreshStatus}
        error={serverQueueRefreshError}
        recoveryAction={serverQueueRefreshRecoveryAction}
        onApiBaseUrlChange={setServerQueueApiBaseUrl}
        onRefresh={() => void refreshServerHumanReviewQueue()}
        onDownload={downloadServerRecoveryPacket}
      />

      <HumanReviewTimelinePanel timeline={timeline} savedDecisionCount={savedDecisionCount} />

      {savedTitle ? (
        <p className="save-state">
          Human review decision saved for {savedTitle}. {saveGuidance}
        </p>
      ) : null}

      <div className="human-review-filters" aria-label="Human review queue filters">
        <label className="editor-field" htmlFor="human-review-target-type-filter">
          <span className="field-label">Target type</span>
          <select
            id="human-review-target-type-filter"
            aria-label="Human review target type"
            value={targetTypeFilter}
            onChange={(event) => setTargetTypeFilter(event.target.value)}
          >
            <option value="all">All target types</option>
            {filterOptions.targetTypes.map((targetType) => (
              <option key={targetType} value={targetType}>
                {labelForTarget(targetType)}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-field" htmlFor="human-review-status-filter">
          <span className="field-label">Status</span>
          <select
            id="human-review-status-filter"
            aria-label="Human review status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {filterOptions.statuses.map((nextStatus) => (
              <option key={nextStatus} value={nextStatus}>
                {nextStatus}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-field" htmlFor="human-review-reviewer-filter">
          <span className="field-label">Reviewer</span>
          <select
            id="human-review-reviewer-filter"
            aria-label="Human review reviewer"
            value={reviewerFilter}
            onChange={(event) => setReviewerFilter(event.target.value)}
          >
            <option value="all">All reviewers</option>
            {filterOptions.reviewers.map((reviewer) => (
              <option key={reviewer} value={reviewer}>
                {reviewer}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-field" htmlFor="human-review-search-filter">
          <span className="field-label">Search</span>
          <input
            id="human-review-search-filter"
            aria-label="Search human review queue"
            value={reviewQuery}
            onChange={(event) => setReviewQuery(event.target.value)}
            placeholder="Search target, note, reviewer, or summary"
          />
        </label>
        <button type="button" className="secondary" onClick={resetFilters} disabled={!hasActiveFilters}>
          Reset filters
        </button>
        <p>
          Showing {filteredItems.length} of {queue.items.length} review items. Filters change the on-screen queue only;
          timeline export remains the full metadata-only review timeline. Not legal advice.
        </p>
      </div>

      <div className="human-review-queue" role="list" aria-label="Filtered human review queue">
        {queue.items.length === 0 ? <p className="empty-state">No human review targets are currently queued.</p> : null}
        {queue.items.length > 0 && filteredItems.length === 0 ? (
          <p className="empty-state">No human review items match the current filters. Reset filters or search another target, reviewer, or decision note.</p>
        ) : null}
        {filteredItems.map((item, index) => (
          <HumanReviewCard key={item.id} item={item} sequence={index + 1} onSave={saveDecision} />
        ))}
      </div>
    </section>
  );
}

function ServerHumanReviewRecoveryPacketPanel({
  apiBaseUrl,
  queueView,
  status,
  error,
  recoveryAction,
  onApiBaseUrlChange,
  onRefresh,
  onDownload
}: {
  apiBaseUrl: string;
  queueView: ServerHumanReviewQueueView | null;
  status: ServerQueueRefreshStatus;
  error: string;
  recoveryAction: string;
  onApiBaseUrlChange: (value: string) => void;
  onRefresh: () => void;
  onDownload: () => void;
}) {
  const packet = queueView?.recoveryPacket ?? null;
  const recoveryCount = packet?.summary.totalRecoveryCount ?? 0;
  const isSyncing = status === "syncing";

  return (
    <section
      className={`human-review-recovery-packet server-human-review-recovery ${recoveryCount > 0 ? "needs-recovery" : "ready"}`}
      aria-label="Server Human Review Recovery Packet"
    >
      <div>
        <ShieldAlert size={17} aria-hidden="true" />
        <div>
          <h3>Server Human Review Recovery Packet</h3>
          <p>
            {packet
              ? `${recoveryCount} persisted returned or rejected review item${recoveryCount === 1 ? "" : "s"} need recovery.`
              : "Refresh the Phase 2 Human Review queue to verify persisted review recovery before handoff."}
          </p>
          <small>{packet?.notLegalAdviceBoundary ?? "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."}</small>
        </div>
      </div>
      {packet ? (
        <div className="server-human-review-recovery-facts">
          <SummaryStat label="Server queue" value={queueView?.totalCount ?? 0} />
          <SummaryStat label="Returned" value={packet.summary.returnedCount} />
          <SummaryStat label="Rejected" value={packet.summary.rejectedCount} />
        </div>
      ) : null}
      {packet ? (
        <p className="server-human-review-next-action">
          <strong>{packet.status === "needs-recovery" ? "Server recovery active" : "Server recovery clear"}</strong>
          <small>Packet hash {packet.packetHash.slice(0, 12)}...</small>
        </p>
      ) : null}
      {packet ? (
        <div className="server-human-review-packet-actions" role="status" aria-label="Server Human Review recovery actions">
          <strong>Recovery actions</strong>
          {packet.nextActions.map((action) => (
            <span key={action}>{action}</span>
          ))}
        </div>
      ) : null}
      {error ? (
        <p className="save-state server-human-review-error" role="status">
          {error}
          {recoveryAction ? <small>{recoveryAction}</small> : null}
          <small>Not legal advice. Human Review queue refresh is metadata-only.</small>
        </p>
      ) : null}
      <div className="server-human-review-controls">
        <label className="editor-field" htmlFor="server-human-review-api-base">
          <span className="field-label">Server Human Review API base URL</span>
          <input
            id="server-human-review-api-base"
            value={apiBaseUrl}
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
            placeholder="/api on same host, or http://127.0.0.1:8787"
          />
        </label>
        <button type="button" className="secondary" onClick={onRefresh} disabled={isSyncing}>
          <RefreshCw size={15} aria-hidden="true" />
          {isSyncing ? "Refreshing Server Queue" : "Refresh Server Human Review Queue"}
        </button>
        <button type="button" className="secondary" onClick={onDownload} disabled={!packet}>
          <Download size={15} aria-hidden="true" />
          Download Server Recovery Packet JSON
        </button>
      </div>
    </section>
  );
}

function HumanReviewRecoveryPacketPanel({
  recoveryCount,
  returnedCount,
  rejectedCount,
  recoveryPacket,
  buildingRecoveryPacket,
  onDownload
}: {
  recoveryCount: number;
  returnedCount: number;
  rejectedCount: number;
  recoveryPacket: HumanReviewRecoveryPacket | null;
  buildingRecoveryPacket: boolean;
  onDownload: () => void;
}) {
  return (
    <section className={`human-review-recovery-packet ${recoveryCount > 0 ? "needs-recovery" : "ready"}`} aria-label="Human Review Recovery Packet">
      <div>
        <ShieldAlert size={17} aria-hidden="true" />
        <div>
          <h3>Human Review Recovery Packet</h3>
          <p>
            {recoveryCount > 0
              ? `${recoveryCount} returned or rejected review item${recoveryCount === 1 ? "" : "s"} need recovery before handoff.`
              : "No returned or rejected review items currently need recovery."}
          </p>
          <small>
            {returnedCount} returned · {rejectedCount} rejected · Not legal advice.
          </small>
        </div>
      </div>
      <div className="human-review-recovery-actions">
        {recoveryPacket ? <small>Recovery packet hash {recoveryPacket.packetHash.slice(0, 12)}...</small> : null}
        <button type="button" className="secondary" onClick={onDownload} disabled={recoveryCount === 0 || buildingRecoveryPacket}>
          <Download size={15} aria-hidden="true" />
          {buildingRecoveryPacket ? "Preparing Recovery Packet" : "Download Recovery Packet JSON"}
        </button>
      </div>
    </section>
  );
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "lexproof";
}

function downloadServerHumanReviewRecoveryPacketJson(filename: string, packet: ServerHumanReviewRecoveryPacket): void {
  const blob = new Blob([exportServerHumanReviewRecoveryPacketJson(packet)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
    <article className={`human-review-card ${status}`} role="listitem">
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
  if (targetType === "clause-match") {
    return "Clause match";
  }
  if (targetType === "counsel-pack") {
    return "Counsel Pack";
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
    return "Rejected from review. Linked evidence is marked rejected for replacement recovery. Not legal advice.";
  }

  if (status === "reviewed") {
    return "Linked evidence is marked verified for audit preparation handoff. Not legal advice.";
  }

  return "Linked evidence remains in review workflow status. Not legal advice.";
}
