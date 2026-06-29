import type { CounselReviewItem, CounselReviewStatus } from "./counselReview";
import type { AIEventRecord, AIEventReviewStatus } from "./modelIntake";
import type { EvidenceItem, EvidenceStatus } from "./projectModel";

export type HumanReviewTargetType = "risk-flag" | "ai-event" | "evidence";

export type HumanReviewStatus = "needs-review" | "in-review" | "needs-more-evidence" | "reviewed" | "rejected";

export type HumanReviewQueueItem = {
  queueVersion: "lexproof-human-review-queue-item-v1";
  id: string;
  projectId: string;
  targetType: HumanReviewTargetType;
  targetId: string;
  sourceId: string;
  title: string;
  summary: string;
  priority: "P0" | "P1" | "P2";
  status: HumanReviewStatus;
  reviewer: string;
  decisionNote: string;
  updatedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only.";
};

export type HumanReviewDecision = {
  decisionVersion: "lexproof-human-review-decision-v1";
  id: string;
  projectId: string;
  targetType: HumanReviewTargetType;
  targetId: string;
  title: string;
  status: HumanReviewStatus;
  reviewer: string;
  decisionNote: string;
  updatedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Human review decisions track audit preparation workflow status only.";
};

export type HumanReviewWorkflowSummary = {
  totalCount: number;
  openCount: number;
  reviewedCount: number;
  blockedCount: number;
  notLegalAdviceBoundary: "Not legal advice. Human review workflow status is audit preparation workflow only.";
};

export type HumanReviewQueue = {
  queueVersion: "lexproof-human-review-queue-v1";
  items: HumanReviewQueueItem[];
  summary: HumanReviewWorkflowSummary;
};

export type CreateHumanReviewQueueInput = {
  projectId: string;
  counselReviews: CounselReviewItem[];
  evidenceItems: EvidenceItem[];
  aiEvents: AIEventRecord[];
  decisions?: HumanReviewDecision[];
};

export type HumanReviewDecisionUpdate = Pick<HumanReviewDecision, "status" | "reviewer" | "decisionNote">;

export function createHumanReviewQueue(input: CreateHumanReviewQueueInput): HumanReviewQueue {
  const decisionsById = new Map((input.decisions ?? []).map((decision) => [decision.id, decision]));
  const items = [
    ...input.counselReviews.map((review) => applyDecision(createRiskReviewQueueItem(review), decisionsById)),
    ...input.aiEvents.map((event) => applyDecision(createAIEventQueueItem(event), decisionsById)),
    ...input.evidenceItems.map((item, index) => applyDecision(createEvidenceQueueItem(input.projectId, item, index), decisionsById))
  ];

  return {
    queueVersion: "lexproof-human-review-queue-v1",
    items,
    summary: createSummary(items)
  };
}

export function createHumanReviewDecision(
  item: HumanReviewQueueItem,
  update: HumanReviewDecisionUpdate,
  updatedAt = new Date().toISOString()
): HumanReviewDecision {
  return {
    decisionVersion: "lexproof-human-review-decision-v1",
    id: decisionId(item.targetType, item.targetId),
    projectId: item.projectId,
    targetType: item.targetType,
    targetId: item.targetId,
    title: item.title,
    status: update.status,
    reviewer: update.reviewer.trim(),
    decisionNote: update.decisionNote.trim(),
    updatedAt,
    notLegalAdviceBoundary: "Not legal advice. Human review decisions track audit preparation workflow status only."
  };
}

export function humanReviewStatusToAIEventStatus(status: HumanReviewStatus): AIEventReviewStatus {
  if (status === "reviewed") {
    return "reviewed";
  }
  if (status === "rejected") {
    return "rejected";
  }
  return "needs-review";
}

export function humanReviewStatusToEvidenceStatus(status: HumanReviewStatus): EvidenceStatus {
  if (status === "reviewed") {
    return "verified";
  }
  if (status === "needs-more-evidence") {
    return "requested";
  }
  if (status === "rejected") {
    return "draft";
  }
  return "received";
}

export function humanReviewStatusToCounselReviewStatus(status: HumanReviewStatus): CounselReviewStatus {
  if (status === "reviewed") {
    return "reviewed";
  }
  if (status === "needs-more-evidence") {
    return "needs-evidence";
  }
  if (status === "rejected") {
    return "blocked";
  }
  return "ready-for-counsel";
}

function createRiskReviewQueueItem(review: CounselReviewItem): HumanReviewQueueItem {
  return {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: queueItemId("risk-flag", review.flagId),
    projectId: review.projectId,
    targetType: "risk-flag",
    targetId: review.flagId,
    sourceId: review.id,
    title: review.title,
    summary: `${review.severity} risk; ${review.evidenceSummary}`,
    priority: review.priority,
    status: statusFromCounselReview(review.status),
    reviewer: review.reviewer,
    decisionNote: review.reviewerNote,
    updatedAt: review.updatedAt,
    notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only."
  };
}

function createAIEventQueueItem(event: AIEventRecord): HumanReviewQueueItem {
  return {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: queueItemId("ai-event", event.id),
    projectId: event.projectId,
    targetType: "ai-event",
    targetId: event.id,
    sourceId: event.id,
    title: event.eventType,
    summary: event.outputSummary || event.modelAction || "AI event output requires human review.",
    priority: "P1",
    status: statusFromAIEvent(event.reviewStatus),
    reviewer: event.humanReviewer,
    decisionNote: "",
    updatedAt: event.updatedAt ?? event.createdAt,
    notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only."
  };
}

function createEvidenceQueueItem(projectId: string, item: EvidenceItem, index: number): HumanReviewQueueItem {
  const targetId = item.id ?? `evidence-${index + 1}`;
  const status = item.status ?? "draft";

  return {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: queueItemId("evidence", targetId),
    projectId,
    targetType: "evidence",
    targetId,
    sourceId: targetId,
    title: item.label || `Evidence ${index + 1}`,
    summary: `${item.kind || "Evidence"}; ${status}; ${(item.content || "No evidence summary.").slice(0, 140)}`,
    priority: status === "requested" || status === "draft" ? "P1" : "P2",
    status: statusFromEvidence(status),
    reviewer: item.owner ?? "Compliance",
    decisionNote: "",
    updatedAt: item.updatedAt ?? item.addedAt ?? "",
    notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only."
  };
}

function applyDecision(item: HumanReviewQueueItem, decisionsById: Map<string, HumanReviewDecision>): HumanReviewQueueItem {
  const decision = decisionsById.get(decisionId(item.targetType, item.targetId));
  if (!decision) {
    return item;
  }

  return {
    ...item,
    status: decision.status,
    reviewer: decision.reviewer,
    decisionNote: decision.decisionNote,
    updatedAt: decision.updatedAt
  };
}

function createSummary(items: HumanReviewQueueItem[]): HumanReviewWorkflowSummary {
  return {
    totalCount: items.length,
    openCount: items.filter((item) => item.status !== "reviewed" && item.status !== "rejected").length,
    reviewedCount: items.filter((item) => item.status === "reviewed").length,
    blockedCount: items.filter((item) => item.status === "rejected").length,
    notLegalAdviceBoundary: "Not legal advice. Human review workflow status is audit preparation workflow only."
  };
}

function statusFromCounselReview(status: CounselReviewStatus): HumanReviewStatus {
  if (status === "reviewed") {
    return "reviewed";
  }
  if (status === "blocked") {
    return "rejected";
  }
  if (status === "needs-evidence") {
    return "needs-more-evidence";
  }
  return "needs-review";
}

function statusFromAIEvent(status: AIEventReviewStatus): HumanReviewStatus {
  if (status === "reviewed") {
    return "reviewed";
  }
  if (status === "rejected") {
    return "rejected";
  }
  return "needs-review";
}

function statusFromEvidence(status: EvidenceStatus): HumanReviewStatus {
  if (status === "verified") {
    return "reviewed";
  }
  if (status === "requested" || status === "draft") {
    return "needs-more-evidence";
  }
  return "needs-review";
}

function queueItemId(targetType: HumanReviewTargetType, targetId: string): string {
  return `human-review-queue-${targetType}-${targetId}`;
}

function decisionId(targetType: HumanReviewTargetType, targetId: string): string {
  return `human-review-${targetType}-${targetId}`;
}
