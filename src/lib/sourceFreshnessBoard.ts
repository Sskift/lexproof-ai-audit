import { redactDataBoundaryText } from "./dataBoundary";
import type { RegulatorySourceReview, RegulatorySourceReviewItem, RegulatorySourceReviewStatus } from "./regulatorySourceReview";

export type SourceFreshnessReviewInput = RegulatorySourceReviewItem;

export type SourceFreshnessBoardLaneId = "metadata-missing" | "overdue" | "due-soon" | "scheduled";

export type SourceFreshnessBoardStatus = "empty" | "current" | "due-soon" | "attention-needed";

export type SourceFreshnessPriority = "P0" | "P1" | "P2";

export type SourceFreshnessBoardItem = {
  id: string;
  laneId: SourceFreshnessBoardLaneId;
  priority: SourceFreshnessPriority;
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  reviewStatus: RegulatorySourceReviewStatus;
  reviewerNotes: string;
  daysUntilReviewDue: number | null;
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Source freshness board items are audit preparation scheduling metadata only.";
};

export type SourceFreshnessBoardLane = {
  id: SourceFreshnessBoardLaneId;
  label: string;
  itemCount: number;
  items: SourceFreshnessBoardItem[];
};

export type SourceFreshnessBoard = {
  boardVersion: "lexproof-source-freshness-board-v1";
  generatedAt: string;
  asOf: string;
  dueSoonDays: number;
  boardHash: string;
  status: SourceFreshnessBoardStatus;
  laneCount: number;
  totalSourceCount: number;
  metadataMissingCount: number;
  overdueCount: number;
  dueSoonCount: number;
  scheduledCount: number;
  lanes: SourceFreshnessBoardLane[];
  notLegalAdviceBoundary: "Not legal advice. Source freshness boards are audit preparation scheduling metadata only.";
};

export type CreateSourceFreshnessBoardInput = {
  sourceReview: RegulatorySourceReview;
  asOf?: string;
  dueSoonDays?: number;
  generatedAt?: string;
};

const BOARD_BOUNDARY = "Not legal advice. Source freshness boards are audit preparation scheduling metadata only." as const;
const ITEM_BOUNDARY = "Not legal advice. Source freshness board items are audit preparation scheduling metadata only." as const;
const defaultDueSoonDays = 30;
const oneDayMs = 24 * 60 * 60 * 1000;

const laneLabels: Record<SourceFreshnessBoardLaneId, string> = {
  "metadata-missing": "Metadata missing",
  overdue: "Overdue",
  "due-soon": "Due soon",
  scheduled: "Scheduled"
};

const laneOrder: SourceFreshnessBoardLaneId[] = ["metadata-missing", "overdue", "due-soon", "scheduled"];

export async function createSourceFreshnessBoard({
  sourceReview,
  asOf = new Date().toISOString(),
  dueSoonDays = defaultDueSoonDays,
  generatedAt = new Date().toISOString()
}: CreateSourceFreshnessBoardInput): Promise<SourceFreshnessBoard> {
  const asOfDate = parseDate(asOf);
  const items = sourceReview.items.map((item) => createBoardItem(item, asOfDate, dueSoonDays)).sort(compareItems);
  const lanes = laneOrder.map((id) => {
    const laneItems = items.filter((item) => item.laneId === id);
    return {
      id,
      label: laneLabels[id],
      itemCount: laneItems.length,
      items: laneItems
    };
  });
  const metadataMissingCount = lanes.find((lane) => lane.id === "metadata-missing")?.itemCount ?? 0;
  const overdueCount = lanes.find((lane) => lane.id === "overdue")?.itemCount ?? 0;
  const dueSoonCount = lanes.find((lane) => lane.id === "due-soon")?.itemCount ?? 0;
  const scheduledCount = lanes.find((lane) => lane.id === "scheduled")?.itemCount ?? 0;
  const status = createBoardStatus({ totalSourceCount: items.length, metadataMissingCount, overdueCount, dueSoonCount });
  const hashPayload = {
    boardVersion: "lexproof-source-freshness-board-v1",
    asOf: formatDate(asOfDate),
    dueSoonDays,
    status,
    laneCount: lanes.length,
    totalSourceCount: items.length,
    metadataMissingCount,
    overdueCount,
    dueSoonCount,
    scheduledCount,
    lanes
  };

  return {
    boardVersion: "lexproof-source-freshness-board-v1",
    generatedAt,
    asOf: formatDate(asOfDate),
    dueSoonDays,
    boardHash: await sha256Hex(stableStringify(hashPayload)),
    status,
    laneCount: lanes.length,
    totalSourceCount: items.length,
    metadataMissingCount,
    overdueCount,
    dueSoonCount,
    scheduledCount,
    lanes,
    notLegalAdviceBoundary: BOARD_BOUNDARY
  };
}

export function exportSourceFreshnessBoardJson(board: SourceFreshnessBoard): string {
  return `${JSON.stringify(board, null, 2)}\n`;
}

export function downloadSourceFreshnessBoardJson(filename: string, board: SourceFreshnessBoard): void {
  const blob = new Blob([exportSourceFreshnessBoardJson(board)], { type: "application/json;charset=utf-8" });
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

function createBoardItem(
  item: RegulatorySourceReviewItem,
  asOfDate: Date,
  dueSoonDays: number
): SourceFreshnessBoardItem {
  const nextReviewDueAt = sanitize(item.nextReviewDueAt);
  const daysUntilReviewDue = nextReviewDueAt ? daysBetween(asOfDate, parseDate(nextReviewDueAt)) : null;
  const laneId = createLaneId(item.reviewStatus, daysUntilReviewDue, dueSoonDays);
  const citation = sanitize(item.citation);

  return {
    id: `source-freshness-${sanitize(item.clauseId)}`,
    laneId,
    priority: createPriority(laneId),
    clauseId: sanitize(item.clauseId),
    jurisdiction: sanitize(item.jurisdiction),
    regulator: sanitize(item.regulator),
    citation,
    sourceName: sanitize(item.sourceName),
    sourceUrl: sanitize(item.sourceUrl),
    effectiveAsOf: sanitize(item.effectiveAsOf),
    lastReviewedAt: sanitize(item.lastReviewedAt),
    nextReviewDueAt,
    reviewStatus: item.reviewStatus,
    reviewerNotes: sanitize(item.reviewerNotes),
    daysUntilReviewDue,
    nextAction: createNextAction(laneId, citation),
    notLegalAdviceBoundary: ITEM_BOUNDARY
  };
}

function createLaneId(
  reviewStatus: RegulatorySourceReviewStatus,
  daysUntilReviewDue: number | null,
  dueSoonDays: number
): SourceFreshnessBoardLaneId {
  if (reviewStatus === "metadata-missing" || daysUntilReviewDue === null) {
    return "metadata-missing";
  }
  if (reviewStatus === "review-due" || daysUntilReviewDue < 0) {
    return "overdue";
  }
  if (daysUntilReviewDue <= dueSoonDays) {
    return "due-soon";
  }
  return "scheduled";
}

function createPriority(laneId: SourceFreshnessBoardLaneId): SourceFreshnessPriority {
  if (laneId === "metadata-missing") {
    return "P0";
  }
  if (laneId === "overdue" || laneId === "due-soon") {
    return "P1";
  }
  return "P2";
}

function createNextAction(laneId: SourceFreshnessBoardLaneId, citation: string): string {
  if (laneId === "metadata-missing") {
    return `Complete source metadata for ${citation} before counsel handoff.`;
  }
  if (laneId === "overdue") {
    return `Refresh ${citation} source metadata before counsel handoff.`;
  }
  if (laneId === "due-soon") {
    return `Schedule source freshness review for ${citation}.`;
  }
  return `Keep ${citation} in the source review calendar.`;
}

function createBoardStatus(input: {
  totalSourceCount: number;
  metadataMissingCount: number;
  overdueCount: number;
  dueSoonCount: number;
}): SourceFreshnessBoardStatus {
  if (input.totalSourceCount === 0) {
    return "empty";
  }
  if (input.metadataMissingCount > 0 || input.overdueCount > 0) {
    return "attention-needed";
  }
  if (input.dueSoonCount > 0) {
    return "due-soon";
  }
  return "current";
}

function compareItems(left: SourceFreshnessBoardItem, right: SourceFreshnessBoardItem): number {
  const lane = laneOrder.indexOf(left.laneId) - laneOrder.indexOf(right.laneId);
  if (lane !== 0) {
    return lane;
  }
  const priority = priorityWeight(left.priority) - priorityWeight(right.priority);
  if (priority !== 0) {
    return priority;
  }
  const leftDue = left.daysUntilReviewDue ?? Number.NEGATIVE_INFINITY;
  const rightDue = right.daysUntilReviewDue ?? Number.NEGATIVE_INFINITY;
  if (leftDue !== rightDue) {
    return leftDue - rightDue;
  }
  return `${left.jurisdiction}-${left.citation}-${left.clauseId}`.localeCompare(
    `${right.jurisdiction}-${right.citation}-${right.clauseId}`
  );
}

function priorityWeight(priority: SourceFreshnessPriority): number {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

function parseDate(value: string): Date {
  const [datePart] = value.split("T");
  return new Date(`${datePart}T00:00:00.000Z`);
}

function daysBetween(left: Date, right: Date): number {
  return Math.round((right.getTime() - left.getTime()) / oneDayMs);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\bnon-compliant\b|\bcompliant\b/gi, "review-state").replace(/\s+/g, " ").trim());
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}
