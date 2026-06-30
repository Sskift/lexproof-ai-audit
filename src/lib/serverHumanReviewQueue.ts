import type { HumanReviewRecord } from "./phase2Types.js";

export type ServerHumanReviewQueueFilters = {
  targetType?: HumanReviewRecord["targetType"];
  status?: HumanReviewRecord["status"];
  reviewerId?: string;
};

export type ServerHumanReviewQueueView = {
  queueVersion: "lexproof-server-human-review-queue-v1";
  workspaceId: string;
  filters: ServerHumanReviewQueueFilters;
  totalCount: number;
  openCount: number;
  reviewedCount: number;
  blockedCount: number;
  targetTypeCounts: Partial<Record<HumanReviewRecord["targetType"], number>>;
  statusCounts: Partial<Record<HumanReviewRecord["status"], number>>;
  reviewerCounts: Record<string, number>;
  nextActions: string[];
  items: HumanReviewRecord[];
  notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only.";
};

export type CreateServerHumanReviewQueueViewInput = {
  workspaceId: string;
  records: HumanReviewRecord[];
  filters?: ServerHumanReviewQueueFilters;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Human review queues are audit preparation workflow metadata only.";
const OPEN_STATUSES = new Set<HumanReviewRecord["status"]>(["requested", "under-review", "needs-more-evidence"]);
const BLOCKED_STATUSES = new Set<HumanReviewRecord["status"]>(["rejected"]);
const STATUS_SORT_RANK: Record<HumanReviewRecord["status"], number> = {
  "needs-more-evidence": 0,
  requested: 1,
  "under-review": 2,
  rejected: 3,
  reviewed: 4
};

export function createServerHumanReviewQueueView(input: CreateServerHumanReviewQueueViewInput): ServerHumanReviewQueueView {
  const filters = normalizeFilters(input.filters);
  const items = input.records.filter((record) => matchesFilters(record, filters)).sort(compareReviewRecords);
  const needsMoreEvidenceCount = items.filter((item) => item.status === "needs-more-evidence").length;
  const blockedCount = items.filter((item) => BLOCKED_STATUSES.has(item.status)).length;
  const openCount = items.filter((item) => OPEN_STATUSES.has(item.status)).length;

  return {
    queueVersion: "lexproof-server-human-review-queue-v1",
    workspaceId: input.workspaceId.trim(),
    filters,
    totalCount: items.length,
    openCount,
    reviewedCount: items.filter((item) => item.status === "reviewed").length,
    blockedCount,
    targetTypeCounts: countBy(items, (item) => item.targetType),
    statusCounts: countBy(items, (item) => item.status),
    reviewerCounts: countBy(items, (item) => item.reviewerId),
    nextActions: createNextActions(items.length, {
      blockedCount,
      needsMoreEvidenceCount,
      openCount
    }),
    items,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

function normalizeFilters(filters: ServerHumanReviewQueueFilters | undefined): ServerHumanReviewQueueFilters {
  const normalized: ServerHumanReviewQueueFilters = {};

  if (filters?.targetType) {
    normalized.targetType = filters.targetType;
  }

  if (filters?.status) {
    normalized.status = filters.status;
  }

  const reviewerId = filters?.reviewerId?.trim();
  if (reviewerId) {
    normalized.reviewerId = reviewerId;
  }

  return normalized;
}

function matchesFilters(record: HumanReviewRecord, filters: ServerHumanReviewQueueFilters): boolean {
  if (filters.targetType && record.targetType !== filters.targetType) {
    return false;
  }

  if (filters.status && record.status !== filters.status) {
    return false;
  }

  if (filters.reviewerId && record.reviewerId !== filters.reviewerId) {
    return false;
  }

  return true;
}

function compareReviewRecords(left: HumanReviewRecord, right: HumanReviewRecord): number {
  const status = STATUS_SORT_RANK[left.status] - STATUS_SORT_RANK[right.status];
  if (status !== 0) {
    return status;
  }

  const updatedAt = left.updatedAt.localeCompare(right.updatedAt);
  return updatedAt === 0 ? left.id.localeCompare(right.id) : updatedAt;
}

function countBy<T extends string>(items: HumanReviewRecord[], selectKey: (item: HumanReviewRecord) => T): Record<T, number> {
  return items
    .map(selectKey)
    .sort((left, right) => left.localeCompare(right))
    .reduce<Record<T, number>>((counts, key) => {
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {} as Record<T, number>);
}

function createNextActions(
  itemCount: number,
  counts: { blockedCount: number; needsMoreEvidenceCount: number; openCount: number }
): string[] {
  if (itemCount === 0) {
    return ["Create a human review request for evidence, model output, risk flags, or counsel pack handoff."];
  }

  const actions: string[] = [];

  if (counts.blockedCount > 0) {
    actions.push(
      `${formatCount(counts.blockedCount, "review item")} ${counts.blockedCount === 1 ? "is" : "are"} rejected and ${
        counts.blockedCount === 1 ? "needs" : "need"
      } recovery before export readiness.`
    );
  }

  if (counts.needsMoreEvidenceCount > 0) {
    actions.push(
      `${formatCount(counts.needsMoreEvidenceCount, "review item")} ${
        counts.needsMoreEvidenceCount === 1 ? "needs" : "need"
      } more evidence before counsel handoff.`
    );
  }

  const generalOpenCount = counts.openCount - counts.needsMoreEvidenceCount;
  if (generalOpenCount > 0) {
    actions.push(`${formatCount(generalOpenCount, "review item")} ${generalOpenCount === 1 ? "is" : "are"} still open.`);
  }

  if (actions.length === 0) {
    actions.push("All review items in this queue are closed for audit-preparation handoff.");
  }

  return actions;
}

function formatCount(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}
