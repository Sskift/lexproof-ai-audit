import type { CounselReviewItem, CounselReviewStatus } from "./counselReview";
import type { AIEventRecord, AIEventReviewStatus } from "./modelIntake";
import type { EvidenceItem, EvidenceStatus } from "./projectModel";
import type { RegulatorySourceReview, RegulatorySourceReviewAction } from "./regulatorySourceReview";

export type HumanReviewTargetType = "risk-flag" | "ai-event" | "evidence" | "clause-match";

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
  dueAt: string;
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
  dueAt: string;
  updatedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Human review decisions track audit preparation workflow status only.";
};

export type HumanReviewTimelineAction = "review.requested" | "review.decision.saved";

export type HumanReviewTimelineEntry = {
  timelineEntryVersion: "lexproof-human-review-timeline-entry-v1";
  id: string;
  projectId: string;
  targetType: HumanReviewTargetType;
  targetId: string;
  title: string;
  action: HumanReviewTimelineAction;
  status: HumanReviewStatus;
  reviewer: string;
  decisionNote: string;
  dueAt: string;
  updatedAt: string;
  auditLogId: string;
  notLegalAdviceBoundary: "Not legal advice. Human review timeline entries are audit preparation metadata only.";
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
  sourceReview?: RegulatorySourceReview;
  sourceReviewUpdatedAt?: string;
  decisions?: HumanReviewDecision[];
};

export type HumanReviewDecisionUpdate = Pick<HumanReviewDecision, "status" | "reviewer" | "decisionNote"> & {
  dueAt?: string;
};

export type CreateHumanReviewTimelineInput = {
  projectId: string;
  queue: HumanReviewQueue;
  decisions?: HumanReviewDecision[];
};

export function createHumanReviewQueue(input: CreateHumanReviewQueueInput): HumanReviewQueue {
  const decisionsById = createLatestDecisionMap(input.decisions ?? []);
  const items = [
    ...input.counselReviews.map((review) => applyDecision(createRiskReviewQueueItem(review), decisionsById)),
    ...createSourceReviewQueueItems(input.projectId, input.sourceReview, input.sourceReviewUpdatedAt).map((item) => applyDecision(item, decisionsById)),
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
    dueAt: update.dueAt?.trim() || item.dueAt,
    updatedAt,
    notLegalAdviceBoundary: "Not legal advice. Human review decisions track audit preparation workflow status only."
  };
}

export function createHumanReviewTimeline(input: CreateHumanReviewTimelineInput): HumanReviewTimelineEntry[] {
  const requestEntries = input.queue.items.map((item) =>
    createTimelineEntry({
      projectId: input.projectId,
      targetType: item.targetType,
      targetId: item.targetId,
      title: item.title,
      action: "review.requested",
      status: item.status,
      reviewer: item.reviewer,
      decisionNote: item.decisionNote,
      dueAt: item.dueAt,
      updatedAt: item.updatedAt || item.dueAt
    })
  );
  const itemsByTarget = new Map(input.queue.items.map((item) => [decisionId(item.targetType, item.targetId), item]));
  const decisionEntries = [...(input.decisions ?? [])]
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
    .map((decision) => {
      const item = itemsByTarget.get(decisionId(decision.targetType, decision.targetId));
      return createTimelineEntry({
        projectId: decision.projectId,
        targetType: decision.targetType,
        targetId: decision.targetId,
        title: item?.title ?? decision.title,
        action: "review.decision.saved",
        status: decision.status,
        reviewer: decision.reviewer,
        decisionNote: decision.decisionNote,
        dueAt: decision.dueAt,
        updatedAt: decision.updatedAt
      });
    });

  return [...requestEntries, ...decisionEntries].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
}

export function exportHumanReviewTimelineJson(entries: HumanReviewTimelineEntry[]): string {
  return `${JSON.stringify({ timelineVersion: "lexproof-human-review-timeline-v1", entries }, null, 2)}\n`;
}

export function downloadHumanReviewTimelineJson(filename: string, entries: HumanReviewTimelineEntry[]): void {
  const blob = new Blob([exportHumanReviewTimelineJson(entries)], { type: "application/json;charset=utf-8" });
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
    dueAt: createDueAt(review.updatedAt, review.priority),
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
    dueAt: createDueAt(event.updatedAt ?? event.createdAt, "P1"),
    updatedAt: event.updatedAt ?? event.createdAt,
    notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only."
  };
}

function createSourceReviewQueueItems(
  projectId: string,
  sourceReview: RegulatorySourceReview | undefined,
  updatedAt = new Date().toISOString()
): HumanReviewQueueItem[] {
  if (!sourceReview) {
    return [];
  }

  const reviewItemsByClauseId = new Map(sourceReview.items.map((item) => [item.clauseId, item]));

  return sourceReview.actions.map((action) => {
    const sourceItem = reviewItemsByClauseId.get(action.clauseId);

    return createSourceReviewQueueItem(projectId, action, {
      title: sourceItem?.citation ?? action.clauseId,
      updatedAt
    });
  });
}

function createSourceReviewQueueItem(
  projectId: string,
  action: RegulatorySourceReviewAction,
  input: { title: string; updatedAt: string }
): HumanReviewQueueItem {
  return {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: queueItemId("clause-match", action.id),
    projectId,
    targetType: "clause-match",
    targetId: action.id,
    sourceId: action.clauseId,
    title: input.title,
    summary: `${action.action} Source: ${action.sourceUrl}`,
    priority: action.priority,
    status: "needs-review",
    reviewer: "Local counsel",
    decisionNote: "Not legal advice. Source review metadata is audit preparation lineage only.",
    dueAt: createDueAt(input.updatedAt, action.priority),
    updatedAt: input.updatedAt,
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
    dueAt: createDueAt(item.updatedAt ?? item.addedAt ?? "", status === "requested" || status === "draft" ? "P1" : "P2"),
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
    dueAt: decision.dueAt,
    updatedAt: decision.updatedAt
  };
}

function createLatestDecisionMap(decisions: HumanReviewDecision[]): Map<string, HumanReviewDecision> {
  const decisionsById = new Map<string, HumanReviewDecision>();

  [...decisions]
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
    .forEach((decision) => {
      decisionsById.set(decisionId(decision.targetType, decision.targetId), decision);
    });

  return decisionsById;
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

function createDueAt(baseDate: string, priority: HumanReviewQueueItem["priority"]): string {
  const base = Number.isNaN(Date.parse(baseDate)) ? new Date() : new Date(baseDate);
  const dueDate = new Date(base);
  const days = priority === "P0" ? 2 : priority === "P1" ? 5 : 10;
  dueDate.setUTCDate(dueDate.getUTCDate() + days);
  return dueDate.toISOString();
}

function createTimelineEntry(input: Omit<HumanReviewTimelineEntry, "timelineEntryVersion" | "id" | "auditLogId" | "notLegalAdviceBoundary">): HumanReviewTimelineEntry {
  const hashParts = [
    input.projectId,
    input.targetType,
    input.targetId,
    input.action,
    input.status,
    input.reviewer,
    input.decisionNote,
    input.updatedAt
  ];

  return {
    timelineEntryVersion: "lexproof-human-review-timeline-entry-v1",
    id: `human-review-timeline-${hashId(hashParts)}`,
    ...input,
    auditLogId: `human-review-audit-${hashId([...hashParts, input.dueAt])}`,
    notLegalAdviceBoundary: "Not legal advice. Human review timeline entries are audit preparation metadata only."
  };
}

function hashId(parts: string[]): string {
  let hash = 0xcbf29ce484222325n;
  const payload = parts.map((part) => part.trim()).join("|");

  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }

  return hash.toString(16).padStart(16, "0").slice(0, 12);
}
