import { CalendarClock, Download, ShieldCheck } from "lucide-react";
import {
  downloadSourceFreshnessBoardJson,
  type SourceFreshnessBoard,
  type SourceFreshnessBoardStatus
} from "../lib/sourceFreshnessBoard";

type SourceFreshnessBoardPanelProps = {
  board: SourceFreshnessBoard;
  projectId: string;
};

export function SourceFreshnessBoardPanel({ board, projectId }: SourceFreshnessBoardPanelProps) {
  return (
    <section className={`source-freshness-board ${board.status}`} aria-label="Source Freshness Board">
      <div className="source-freshness-header">
        <div className="reg-section-title">
          <CalendarClock size={17} aria-hidden="true" />
          <h3>Source Freshness Board</h3>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadSourceFreshnessBoardJson(`lexproof-${projectId}-source-freshness-board.json`, board)}
        >
          <Download size={15} aria-hidden="true" />
          Download Source Freshness Board JSON
        </button>
      </div>

      <div className="reg-control-boundary">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>{board.notLegalAdviceBoundary}</span>
      </div>

      <div className="source-freshness-summary">
        <FreshnessFact label="Status" value={formatBoardStatus(board.status)} helper={`as of ${board.asOf}`} />
        <FreshnessFact label="Overdue" value={board.overdueCount} helper="refresh before handoff" />
        <FreshnessFact label="Due soon" value={board.dueSoonCount} helper={`${board.dueSoonDays}-day window`} />
        <FreshnessFact label="Board hash" value={board.boardHash.slice(0, 12)} helper="metadata-only SHA-256" />
      </div>

      <div className="source-freshness-lanes" role="list" aria-label="Source freshness lanes">
        {board.lanes.map((lane) => (
          <article key={lane.id} className={`source-freshness-lane ${lane.id}`} role="listitem">
            <header>
              <strong>{lane.label}</strong>
              <span>{lane.itemCount}</span>
            </header>
            <div className="source-freshness-items">
              {lane.items.length === 0 ? <p className="source-freshness-empty">No source records in this lane.</p> : null}
              {lane.items.slice(0, 3).map((item) => (
                <div key={item.id} className={`source-freshness-item ${item.priority.toLowerCase()}`}>
                  <header>
                    <span>{item.priority}</span>
                    <strong>{item.jurisdiction}</strong>
                  </header>
                  <p>{item.citation}</p>
                  <small>
                    Last reviewed {item.lastReviewedAt || "metadata missing"}; next review{" "}
                    {item.nextReviewDueAt || "metadata missing"}
                  </small>
                  <small>{formatDueDistance(item.daysUntilReviewDue)}</small>
                  <small>{item.nextAction}</small>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FreshnessFact({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className="source-freshness-fact">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function formatBoardStatus(status: SourceFreshnessBoardStatus): string {
  if (status === "attention-needed") {
    return "attention needed";
  }
  if (status === "due-soon") {
    return "due soon";
  }
  if (status === "empty") {
    return "empty";
  }
  return "current";
}

function formatDueDistance(daysUntilReviewDue: number | null): string {
  if (daysUntilReviewDue === null) {
    return "Review date metadata missing.";
  }
  if (daysUntilReviewDue < 0) {
    return `${Math.abs(daysUntilReviewDue)} day${Math.abs(daysUntilReviewDue) === 1 ? "" : "s"} overdue.`;
  }
  if (daysUntilReviewDue === 0) {
    return "Review due today.";
  }
  return `${daysUntilReviewDue} day${daysUntilReviewDue === 1 ? "" : "s"} until review due.`;
}
