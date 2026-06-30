import type { RegulatoryGraph } from "./regulatoryGraph";

export type RegulatorySourceReviewStatus = "current" | "review-due" | "metadata-missing";

export type RegulatorySourceReviewItem = {
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
};

export type RegulatorySourceReviewAction = {
  id: string;
  priority: "P0" | "P1";
  action: string;
  clauseId: string;
  sourceUrl: string;
};

export type RegulatorySourceReview = {
  status: RegulatorySourceReviewStatus;
  totalSourceCount: number;
  currentSourceCount: number;
  reviewDueCount: number;
  metadataMissingCount: number;
  reviewWindowDays: number;
  items: RegulatorySourceReviewItem[];
  actions: RegulatorySourceReviewAction[];
  notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only.";
};

export type RegulatorySourceReviewOptions = {
  asOf?: string;
  reviewWindowDays?: number;
};

const boundary = "Not legal advice. Source review metadata is audit preparation lineage only." as const;
const defaultReviewWindowDays = 90;
const oneDayMs = 24 * 60 * 60 * 1000;

export function createRegulatorySourceReview(
  graph: RegulatoryGraph,
  options: RegulatorySourceReviewOptions = {}
): RegulatorySourceReview {
  const reviewWindowDays = options.reviewWindowDays ?? defaultReviewWindowDays;
  const asOf = parseDate(options.asOf ?? new Date().toISOString());
  const items = graph.matchedClauses
    .map((clause) => {
      const missingMetadata = [clause.sourceUrl, clause.effectiveAsOf, clause.lastReviewedAt, clause.reviewerNotes].some(
        (value) => value.trim().length === 0
      );
      const lastReviewedAt = parseDate(clause.lastReviewedAt);
      const nextReviewDueAt = addDays(lastReviewedAt, reviewWindowDays);
      const reviewStatus: RegulatorySourceReviewStatus = missingMetadata
        ? "metadata-missing"
        : asOf.getTime() > nextReviewDueAt.getTime()
          ? "review-due"
          : "current";

      return {
        clauseId: clause.clauseId,
        jurisdiction: clause.jurisdiction,
        regulator: clause.regulator,
        citation: clause.citation,
        sourceName: clause.sourceName,
        sourceUrl: clause.sourceUrl,
        effectiveAsOf: clause.effectiveAsOf,
        lastReviewedAt: clause.lastReviewedAt,
        nextReviewDueAt: formatDate(nextReviewDueAt),
        reviewStatus,
        reviewerNotes: clause.reviewerNotes
      };
    })
    .sort(compareReviewItems);
  const metadataMissingCount = items.filter((item) => item.reviewStatus === "metadata-missing").length;
  const reviewDueCount = items.filter((item) => item.reviewStatus === "review-due").length;
  const currentSourceCount = items.filter((item) => item.reviewStatus === "current").length;

  return {
    status: metadataMissingCount > 0 ? "metadata-missing" : reviewDueCount > 0 ? "review-due" : "current",
    totalSourceCount: items.length,
    currentSourceCount,
    reviewDueCount,
    metadataMissingCount,
    reviewWindowDays,
    items,
    actions: createReviewActions(items),
    notLegalAdviceBoundary: boundary
  };
}

function createReviewActions(items: RegulatorySourceReviewItem[]): RegulatorySourceReviewAction[] {
  return items
    .filter((item) => item.reviewStatus !== "current")
    .slice(0, 5)
    .map((item) => ({
      id: `source-review-${item.clauseId}`,
      priority: item.reviewStatus === "metadata-missing" ? "P0" : "P1",
      action:
        item.reviewStatus === "metadata-missing"
          ? `Complete source metadata for ${item.citation}.`
          : `Refresh ${item.citation} source metadata before counsel handoff.`,
      clauseId: item.clauseId,
      sourceUrl: item.sourceUrl
    }));
}

function compareReviewItems(left: RegulatorySourceReviewItem, right: RegulatorySourceReviewItem): number {
  const status = statusWeight(left.reviewStatus) - statusWeight(right.reviewStatus);
  if (status !== 0) {
    return status;
  }
  return `${left.jurisdiction}-${left.citation}`.localeCompare(`${right.jurisdiction}-${right.citation}`);
}

function statusWeight(status: RegulatorySourceReviewStatus): number {
  if (status === "metadata-missing") {
    return 0;
  }
  if (status === "review-due") {
    return 1;
  }
  return 2;
}

function parseDate(value: string): Date {
  const [datePart] = value.split("T");
  return new Date(`${datePart}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * oneDayMs);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
