import type { CounselPackVersionRecord } from "./counselPackVersions";
import type { CounselReviewItem, CounselReviewStatus } from "./counselReview";
import { redactDataBoundaryText } from "./dataBoundary";
import type { AIEventRecord, AIEventReviewStatus } from "./modelIntake";
import type { EvidenceItem, EvidenceStatus } from "./projectModel";
import type { RegulatorySourceReview, RegulatorySourceReviewAction } from "./regulatorySourceReview";

export type HumanReviewTargetType = "risk-flag" | "ai-event" | "evidence" | "clause-match" | "counsel-pack";

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

export type HumanReviewRecoveryItem = {
  itemVersion: "lexproof-human-review-recovery-item-v1";
  id: string;
  targetType: HumanReviewTargetType;
  targetId: string;
  sourceId: string;
  title: string;
  status: Extract<HumanReviewStatus, "needs-more-evidence" | "rejected">;
  priority: HumanReviewQueueItem["priority"];
  reviewer: string;
  decisionNote: string;
  dueAt: string;
  updatedAt: string;
  recoveryAction: string;
  notLegalAdviceBoundary: "Not legal advice. Human review recovery items are audit preparation workflow metadata only.";
};

export type HumanReviewRecoveryPacket = {
  packetVersion: "lexproof-human-review-recovery-packet-v1";
  projectId: string;
  projectName: string;
  generatedAt: string;
  packetHash: string;
  status: "ready" | "needs-recovery";
  summary: {
    totalRecoveryCount: number;
    returnedCount: number;
    rejectedCount: number;
    highestPriority: HumanReviewQueueItem["priority"] | "none";
    nextAction: string;
    notLegalAdviceBoundary: "Not legal advice. Human review recovery packets are audit preparation workflow metadata only.";
  };
  items: HumanReviewRecoveryItem[];
  notLegalAdviceBoundary: "Not legal advice. Human review recovery packets are audit preparation workflow metadata only.";
};

export type CreateHumanReviewQueueInput = {
  projectId: string;
  counselReviews: CounselReviewItem[];
  evidenceItems: EvidenceItem[];
  aiEvents: AIEventRecord[];
  sourceReview?: RegulatorySourceReview;
  sourceReviewUpdatedAt?: string;
  counselPackVersions?: CounselPackVersionRecord[];
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

export type CreateHumanReviewRecoveryPacketInput = {
  projectId: string;
  projectName: string;
  queue: HumanReviewQueue;
  generatedAt?: string;
};

const RECOVERY_PACKET_BOUNDARY = "Not legal advice. Human review recovery packets are audit preparation workflow metadata only." as const;
const RECOVERY_ITEM_BOUNDARY = "Not legal advice. Human review recovery items are audit preparation workflow metadata only." as const;
const HUMAN_REVIEW_DECISION_BOUNDARY =
  "Not legal advice. Human review decisions track audit preparation workflow status only." as const;
const humanReviewTargetTypes = ["risk-flag", "ai-event", "evidence", "clause-match", "counsel-pack"] as const;
const humanReviewStatuses = ["needs-review", "in-review", "needs-more-evidence", "reviewed", "rejected"] as const;
const LEGAL_CONCLUSION_PATTERN =
  /\b(final legal decision|legal opinion|legal approval|legally compliant|legally non-compliant|compliance decision)\b/gi;

export function createHumanReviewQueue(input: CreateHumanReviewQueueInput): HumanReviewQueue {
  const decisionsById = createLatestDecisionMap(input.decisions ?? []);
  const items = [
    ...input.counselReviews.map((review) => applyDecision(createRiskReviewQueueItem(review), decisionsById)),
    ...createSourceReviewQueueItems(input.projectId, input.sourceReview, input.sourceReviewUpdatedAt).map((item) => applyDecision(item, decisionsById)),
    ...input.aiEvents.map((event) => applyDecision(createAIEventQueueItem(event), decisionsById)),
    ...input.evidenceItems.map((item, index) => applyDecision(createEvidenceQueueItem(input.projectId, item, index), decisionsById)),
    ...(input.counselPackVersions ?? []).map((record) => applyDecision(createCounselPackQueueItem(input.projectId, record), decisionsById))
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
  const targetId = sanitize(item.targetId);
  const safeUpdatedAt = strictIsoTimestamp(updatedAt) ?? new Date().toISOString();
  const dueAt = strictIsoTimestamp(update.dueAt?.trim() || item.dueAt) ?? safeUpdatedAt;

  return {
    decisionVersion: "lexproof-human-review-decision-v1",
    id: decisionId(item.targetType, targetId),
    projectId: sanitize(item.projectId),
    targetType: item.targetType,
    targetId,
    title: sanitize(item.title),
    status: toHumanReviewStatus(update.status) ?? "needs-review",
    reviewer: sanitize(update.reviewer),
    decisionNote: sanitize(update.decisionNote),
    dueAt,
    updatedAt: safeUpdatedAt,
    notLegalAdviceBoundary: HUMAN_REVIEW_DECISION_BOUNDARY
  };
}

export function sanitizeHumanReviewDecision(decision: HumanReviewDecision): HumanReviewDecision {
  const targetType = toHumanReviewTargetType(decision.targetType) ?? "risk-flag";
  const targetId = sanitize(decision.targetId);

  return {
    decisionVersion: "lexproof-human-review-decision-v1",
    id: decisionId(targetType, targetId),
    projectId: sanitize(decision.projectId),
    targetType,
    targetId,
    title: sanitize(decision.title),
    status: toHumanReviewStatus(decision.status) ?? "needs-review",
    reviewer: sanitize(decision.reviewer),
    decisionNote: sanitize(decision.decisionNote),
    dueAt: strictIsoTimestamp(decision.dueAt) ?? sanitize(decision.dueAt),
    updatedAt: strictIsoTimestamp(decision.updatedAt) ?? sanitize(decision.updatedAt),
    notLegalAdviceBoundary: HUMAN_REVIEW_DECISION_BOUNDARY
  };
}

export function parseStoredHumanReviewDecisions(raw: string | null | undefined): HumanReviewDecision[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      const decision = normalizeHumanReviewDecision(item);
      return decision ? [decision] : [];
    });
  } catch {
    return [];
  }
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

export async function createHumanReviewRecoveryPacket(
  input: CreateHumanReviewRecoveryPacketInput
): Promise<HumanReviewRecoveryPacket> {
  const items = input.queue.items
    .filter((item): item is HumanReviewQueueItem & { status: HumanReviewRecoveryItem["status"] } =>
      item.status === "needs-more-evidence" || item.status === "rejected"
    )
    .map(createRecoveryItem)
    .sort(compareRecoveryItems);
  const returnedCount = items.filter((item) => item.status === "needs-more-evidence").length;
  const rejectedCount = items.filter((item) => item.status === "rejected").length;
  const highestPriority = items[0]?.priority ?? "none";
  const hashPayload = {
    packetVersion: "lexproof-human-review-recovery-packet-v1" as const,
    projectId: sanitize(input.projectId || input.queue.items[0]?.projectId || "local-workspace"),
    projectName: sanitize(input.projectName || "Untitled workspace"),
    status: items.length > 0 ? ("needs-recovery" as const) : ("ready" as const),
    summary: {
      totalRecoveryCount: items.length,
      returnedCount,
      rejectedCount,
      highestPriority,
      nextAction: createRecoveryNextAction(items),
      notLegalAdviceBoundary: RECOVERY_PACKET_BOUNDARY
    },
    items,
    notLegalAdviceBoundary: RECOVERY_PACKET_BOUNDARY
  };

  return {
    ...hashPayload,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    packetHash: await sha256Hex(stableStringify(hashPayload))
  };
}

export function exportHumanReviewRecoveryPacketJson(packet: HumanReviewRecoveryPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

export function downloadHumanReviewRecoveryPacketJson(filename: string, packet: HumanReviewRecoveryPacket): void {
  const blob = new Blob([exportHumanReviewRecoveryPacketJson(packet)], { type: "application/json;charset=utf-8" });
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
    return "rejected";
  }
  if (status === "in-review") {
    return "under-review";
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

function normalizeHumanReviewDecision(value: unknown): HumanReviewDecision | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Partial<Record<keyof HumanReviewDecision, unknown>>;
  const targetType = toHumanReviewTargetType(record.targetType);
  const targetId = requiredDecisionText(record.targetId);
  const projectId = requiredDecisionText(record.projectId);
  const title = requiredDecisionText(record.title);
  const status = toHumanReviewStatus(record.status);
  const reviewer = optionalDecisionText(record.reviewer);
  const decisionNote = optionalDecisionText(record.decisionNote);
  const dueAt = strictIsoTimestamp(record.dueAt);
  const updatedAt = strictIsoTimestamp(record.updatedAt);

  if (
    record.decisionVersion !== "lexproof-human-review-decision-v1" ||
    record.notLegalAdviceBoundary !== HUMAN_REVIEW_DECISION_BOUNDARY ||
    !targetType ||
    !targetId ||
    !projectId ||
    !title ||
    !status ||
    reviewer === null ||
    decisionNote === null ||
    !dueAt ||
    !updatedAt
  ) {
    return null;
  }

  const id = decisionId(targetType, targetId);
  if (record.id !== id) {
    return null;
  }

  return sanitizeHumanReviewDecision({
    decisionVersion: "lexproof-human-review-decision-v1",
    id,
    projectId,
    targetType,
    targetId,
    title,
    status,
    reviewer,
    decisionNote,
    dueAt,
    updatedAt,
    notLegalAdviceBoundary: HUMAN_REVIEW_DECISION_BOUNDARY
  });
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

function createCounselPackQueueItem(projectId: string, record: CounselPackVersionRecord): HumanReviewQueueItem {
  const openReviewItems = formatCount(record.reviewSummary.open, "open review item");
  const reviewedItems = `${record.reviewSummary.reviewed}/${record.reviewSummary.total} counsel review items reviewed`;
  const sourceReviewStatus = record.regulatorySourcePack?.sourceReviewStatus ?? "metadata-missing";
  const priority = counselPackPriority(record);

  return {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: queueItemId("counsel-pack", record.id),
    projectId,
    targetType: "counsel-pack",
    targetId: record.id,
    sourceId: record.manifestHash,
    title: record.title,
    summary: `${record.riskLevel} risk export; ${openReviewItems}; ${reviewedItems}; manifest ${shortHash(
      record.manifestHash
    )}; markdown ${shortHash(record.markdownHash)}; source review ${sourceReviewStatus}. Not legal advice.`,
    priority,
    status: "needs-review",
    reviewer: "Counsel",
    decisionNote: "Review Counsel Pack export metadata before external handoff. Not legal advice.",
    dueAt: createDueAt(record.exportedAt, priority),
    updatedAt: record.exportedAt,
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
  if (status === "under-review") {
    return "in-review";
  }
  if (status === "rejected") {
    return "rejected";
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

function counselPackPriority(record: CounselPackVersionRecord): HumanReviewQueueItem["priority"] {
  if (record.riskLevel === "critical" || record.reviewSummary.blocked > 0) {
    return "P0";
  }

  if (record.riskLevel === "high" || record.reviewSummary.open > 0 || record.regulatorySourcePack?.sourceReviewStatus !== "current") {
    return "P1";
  }

  return "P2";
}

function shortHash(value: string): string {
  return value.slice(0, 8);
}

function formatCount(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function createRecoveryItem(item: HumanReviewQueueItem & { status: HumanReviewRecoveryItem["status"] }): HumanReviewRecoveryItem {
  return {
    itemVersion: "lexproof-human-review-recovery-item-v1",
    id: sanitize(item.id),
    targetType: item.targetType,
    targetId: sanitize(item.targetId),
    sourceId: sanitize(item.sourceId),
    title: sanitize(item.title),
    status: item.status,
    priority: item.priority,
    reviewer: sanitize(item.reviewer || "Unassigned reviewer"),
    decisionNote: sanitize(item.decisionNote || "No reviewer note recorded."),
    dueAt: item.dueAt,
    updatedAt: item.updatedAt,
    recoveryAction: recoveryActionFor(item),
    notLegalAdviceBoundary: RECOVERY_ITEM_BOUNDARY
  };
}

function recoveryActionFor(item: HumanReviewQueueItem & { status: HumanReviewRecoveryItem["status"] }): string {
  if (item.targetType === "evidence" && item.status === "rejected") {
    return "Create replacement evidence metadata before vault sync or export reliance.";
  }

  if (item.targetType === "evidence") {
    return "Return linked evidence to requested status and attach additional metadata before review.";
  }

  if (item.targetType === "ai-event") {
    return item.status === "rejected"
      ? "Re-run or replace the model output and route the new draft through human review before reliance."
      : "Add missing evidence or reviewer context before relying on the model output.";
  }

  if (item.targetType === "clause-match") {
    return "Refresh source metadata or route the clause-match item to local counsel before source handoff.";
  }

  if (item.targetType === "counsel-pack") {
    return "Save a new Counsel Pack version after blockers are remediated and route it back through review.";
  }

  return "Attach missing evidence or reviewer context before external audit-prep handoff.";
}

function createRecoveryNextAction(items: HumanReviewRecoveryItem[]): string {
  if (items.length === 0) {
    return "No returned or rejected human review items currently need recovery.";
  }

  const first = items[0];
  return `${first.title}: ${first.recoveryAction}`;
}

function compareRecoveryItems(left: HumanReviewRecoveryItem, right: HumanReviewRecoveryItem): number {
  return (
    recoveryStatusWeight(left.status) - recoveryStatusWeight(right.status) ||
    priorityWeight(left.priority) - priorityWeight(right.priority) ||
    left.dueAt.localeCompare(right.dueAt) ||
    left.title.localeCompare(right.title)
  );
}

function recoveryStatusWeight(status: HumanReviewRecoveryItem["status"]): number {
  return status === "rejected" ? 0 : 1;
}

function priorityWeight(priority: HumanReviewQueueItem["priority"]): number {
  return { P0: 0, P1: 1, P2: 2 }[priority];
}

async function sha256Hex(payload: string): Promise<string> {
  const encoded = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function requiredDecisionText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const text = sanitize(value);
  return text.length > 0 ? text : null;
}

function optionalDecisionText(value: unknown): string | null {
  return typeof value === "string" ? sanitize(value) : null;
}

function toHumanReviewTargetType(value: unknown): HumanReviewTargetType | null {
  return typeof value === "string" && humanReviewTargetTypes.includes(value as HumanReviewTargetType)
    ? (value as HumanReviewTargetType)
    : null;
}

function toHumanReviewStatus(value: unknown): HumanReviewStatus | null {
  return typeof value === "string" && humanReviewStatuses.includes(value as HumanReviewStatus) ? (value as HumanReviewStatus) : null;
}

function strictIsoTimestamp(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const timestamp = value.trim();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp) && !Number.isNaN(Date.parse(timestamp))
    ? timestamp
    : null;
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim())
    .replace(/\b(passport|driver'?s? license|national id)(?:\s+(file|document|record))?\b/gi, "[redacted-identity-document]")
    .replace(LEGAL_CONCLUSION_PATTERN, "[redacted-legal-conclusion]");
}
