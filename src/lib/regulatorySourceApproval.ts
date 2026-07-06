import type {
  RegulatorySourceReview,
  RegulatorySourceReviewItem,
  RegulatorySourceReviewStatus
} from "./regulatorySourceReview";
import { hashRegulatorySourceApprovalQueue, type RegulatorySourceApprovalSyncQueue } from "./regulatorySourceApprovalSync";

export type RegulatorySourceApprovalStatus = "approval-required" | "metadata-required";
export type RegulatorySourceApprovalQueueStatus = "empty" | "needs-approval" | "needs-metadata";
export type RegulatorySourceApprovalPriority = "P0" | "P1";

export type RegulatorySourceApprovalItem = {
  id: string;
  priority: RegulatorySourceApprovalPriority;
  approvalStatus: RegulatorySourceApprovalStatus;
  reviewStatus: RegulatorySourceReviewStatus;
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  reviewerNotes: string;
  nextAction: string;
  approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.";
  notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only.";
};

export type RegulatorySourceApprovalQueue = {
  queueVersion: "lexproof-regulatory-source-approval-queue-v1";
  generatedAt: string;
  status: RegulatorySourceApprovalQueueStatus;
  queueHash: string;
  totalItemCount: number;
  approvalRequiredCount: number;
  metadataRequiredCount: number;
  items: RegulatorySourceApprovalItem[];
  notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only.";
};

export type RegulatorySourceApprovalQueueOptions = {
  generatedAt?: string;
};

const boundary = "Not legal advice. Source update approvals are audit preparation workflow metadata only." as const;
const approvalGate =
  "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata." as const;

export function createRegulatorySourceApprovalQueue(
  sourceReview: RegulatorySourceReview,
  options: RegulatorySourceApprovalQueueOptions = {}
): RegulatorySourceApprovalQueue {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const items = sourceReview.items.filter((item) => item.reviewStatus !== "current").map(createApprovalItem).sort(compareItems);
  const metadataRequiredCount = items.filter((item) => item.approvalStatus === "metadata-required").length;
  const approvalRequiredCount = items.filter((item) => item.approvalStatus === "approval-required").length;
  const queuePayload: RegulatorySourceApprovalSyncQueue = {
    queueVersion: "lexproof-regulatory-source-approval-queue-v1",
    generatedAt,
    status: metadataRequiredCount > 0 ? "needs-metadata" : approvalRequiredCount > 0 ? "needs-approval" : "empty",
    totalItemCount: items.length,
    approvalRequiredCount,
    metadataRequiredCount,
    items,
    notLegalAdviceBoundary: boundary
  };

  return {
    ...queuePayload,
    queueHash: hashRegulatorySourceApprovalQueue(queuePayload)
  };
}

export function exportRegulatorySourceApprovalQueueJson(queue: RegulatorySourceApprovalQueue): string {
  return `${JSON.stringify(queue, null, 2)}\n`;
}

export function downloadRegulatorySourceApprovalQueueJson(filename: string, queue: RegulatorySourceApprovalQueue): void {
  const blob = new Blob([exportRegulatorySourceApprovalQueueJson(queue)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createApprovalItem(item: RegulatorySourceReviewItem): RegulatorySourceApprovalItem {
  const approvalStatus: RegulatorySourceApprovalStatus =
    item.reviewStatus === "metadata-missing" ? "metadata-required" : "approval-required";

  return {
    id: `source-approval-${item.clauseId}`,
    priority: approvalStatus === "metadata-required" ? "P0" : "P1",
    approvalStatus,
    reviewStatus: item.reviewStatus,
    clauseId: item.clauseId,
    jurisdiction: item.jurisdiction,
    regulator: item.regulator,
    citation: item.citation,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    effectiveAsOf: item.effectiveAsOf,
    lastReviewedAt: item.lastReviewedAt,
    nextReviewDueAt: item.nextReviewDueAt,
    reviewerNotes: item.reviewerNotes,
    nextAction:
      approvalStatus === "metadata-required"
        ? `Complete and approve source metadata for ${item.citation} before it changes source matching.`
        : `Refresh and approve ${item.citation} source metadata before it changes source matching.`,
    approvalGate,
    notLegalAdviceBoundary: boundary
  };
}

function compareItems(left: RegulatorySourceApprovalItem, right: RegulatorySourceApprovalItem): number {
  const priority = priorityWeight(left.priority) - priorityWeight(right.priority);
  if (priority !== 0) {
    return priority;
  }

  return `${left.jurisdiction}-${left.citation}-${left.clauseId}`.localeCompare(
    `${right.jurisdiction}-${right.citation}-${right.clauseId}`
  );
}

function priorityWeight(priority: RegulatorySourceApprovalPriority): number {
  return priority === "P0" ? 0 : 1;
}
