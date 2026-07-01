import type { HumanReviewQueueItem, HumanReviewStatus, HumanReviewTargetType } from "./humanReviewWorkflow";

export type HumanReviewQueueFilterValue = "all" | string;

export type HumanReviewQueueFilters = {
  targetType?: HumanReviewQueueFilterValue;
  status?: HumanReviewQueueFilterValue;
  reviewer?: HumanReviewQueueFilterValue;
  query?: string;
};

export type HumanReviewQueueFilterOptions = {
  targetTypes: HumanReviewTargetType[];
  statuses: HumanReviewStatus[];
  reviewers: string[];
};

const TARGET_TYPE_ORDER: HumanReviewTargetType[] = ["risk-flag", "ai-event", "evidence", "clause-match", "counsel-pack"];
const STATUS_ORDER: HumanReviewStatus[] = ["needs-review", "in-review", "needs-more-evidence", "reviewed", "rejected"];

export function filterHumanReviewQueueItems(
  items: HumanReviewQueueItem[],
  filters: HumanReviewQueueFilters
): HumanReviewQueueItem[] {
  const targetType = normalizeFilterValue(filters.targetType);
  const status = normalizeFilterValue(filters.status);
  const reviewer = normalizeFilterValue(filters.reviewer);
  const queryTerms = tokenize(filters.query ?? "");

  return items.filter((item) => {
    if (targetType && item.targetType !== targetType) {
      return false;
    }

    if (status && item.status !== status) {
      return false;
    }

    if (reviewer && item.reviewer !== reviewer) {
      return false;
    }

    if (queryTerms.length === 0) {
      return true;
    }

    const searchableText = tokenize(
      [
        item.id,
        item.projectId,
        item.targetType,
        item.targetId,
        item.sourceId,
        item.title,
        item.summary,
        item.priority,
        item.status,
        item.reviewer,
        item.decisionNote,
        item.dueAt,
        item.updatedAt
      ].join(" ")
    ).join(" ");

    return queryTerms.every((term) => searchableText.includes(term));
  });
}

export function createHumanReviewQueueFilterOptions(items: HumanReviewQueueItem[]): HumanReviewQueueFilterOptions {
  return {
    targetTypes: uniqueSorted(items.map((item) => item.targetType), TARGET_TYPE_ORDER),
    statuses: uniqueSorted(items.map((item) => item.status), STATUS_ORDER),
    reviewers: uniqueTextValues(items.map((item) => item.reviewer))
  };
}

function normalizeFilterValue(value: HumanReviewQueueFilterValue | undefined): string {
  const normalized = value?.trim() ?? "";
  return normalized === "all" ? "" : normalized;
}

function uniqueSorted<T extends string>(values: T[], preferredOrder: T[]): T[] {
  const present = new Set(values.filter(Boolean));
  const ordered = preferredOrder.filter((value) => present.has(value));
  const remaining = [...present].filter((value) => !preferredOrder.includes(value)).sort((left, right) => left.localeCompare(right));
  return [...ordered, ...remaining];
}

function uniqueTextValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}
