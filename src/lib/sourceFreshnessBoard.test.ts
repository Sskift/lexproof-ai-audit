import { describe, expect, it } from "vitest";
import {
  createSourceFreshnessBoard,
  exportSourceFreshnessBoardJson,
  type SourceFreshnessReviewInput
} from "./sourceFreshnessBoard";
import type { RegulatorySourceReview } from "./regulatorySourceReview";

describe("createSourceFreshnessBoard", () => {
  it("groups source review records into metadata, overdue, due-soon, and scheduled lanes with a stable hash", async () => {
    const first = await createSourceFreshnessBoard({
      sourceReview: sourceReviewWithItems([metadataMissingSource(), overdueSource(), dueSoonSource(), scheduledSource()]),
      asOf: "2026-07-01T00:00:00.000Z",
      dueSoonDays: 30,
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const second = await createSourceFreshnessBoard({
      sourceReview: sourceReviewWithItems([scheduledSource(), dueSoonSource(), overdueSource(), metadataMissingSource()]),
      asOf: "2026-07-01T00:00:00.000Z",
      dueSoonDays: 30,
      generatedAt: "2026-07-01T02:00:00.000Z"
    });

    expect(first.boardHash).toBe(second.boardHash);
    expect(first.boardHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toEqual(
      expect.objectContaining({
        boardVersion: "lexproof-source-freshness-board-v1",
        status: "attention-needed",
        laneCount: 4,
        totalSourceCount: 4,
        metadataMissingCount: 1,
        overdueCount: 1,
        dueSoonCount: 1,
        scheduledCount: 1,
        notLegalAdviceBoundary: "Not legal advice. Source freshness boards are audit preparation scheduling metadata only."
      })
    );
    expect(first.lanes.map((lane) => lane.id)).toEqual(["metadata-missing", "overdue", "due-soon", "scheduled"]);
    expect(first.lanes.map((lane) => lane.items[0]?.citation)).toEqual([
      "Missing metadata citation",
      "Overdue source citation",
      "Due soon source citation",
      "Scheduled source citation"
    ]);
    expect(first.lanes[1]?.items[0]).toEqual(
      expect.objectContaining({
        daysUntilReviewDue: -21,
        priority: "P1",
        nextAction: "Refresh Overdue source citation source metadata before counsel handoff."
      })
    );
  });

  it("keeps exported source freshness boards redacted and free of legal conclusions", async () => {
    const board = await createSourceFreshnessBoard({
      sourceReview: sourceReviewWithItems([
        overdueSource({
          reviewerNotes: "Remove sk-live-abcdef1234567890abcdef1234567890 before review. Do not call it compliant."
        })
      ]),
      asOf: "2026-07-01T00:00:00.000Z",
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const json = exportSourceFreshnessBoardJson(board);

    expect(json).toContain("[redacted-api-key]");
    expect(json).not.toContain("sk-live-abcdef1234567890");
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
    expect(json).toContain("Not legal advice");
  });
});

function sourceReviewWithItems(items: SourceFreshnessReviewInput[]): RegulatorySourceReview {
  return {
    status: items.some((item) => item.reviewStatus === "metadata-missing")
      ? "metadata-missing"
      : items.some((item) => item.reviewStatus === "review-due")
        ? "review-due"
        : "current",
    totalSourceCount: items.length,
    currentSourceCount: items.filter((item) => item.reviewStatus === "current").length,
    reviewDueCount: items.filter((item) => item.reviewStatus === "review-due").length,
    metadataMissingCount: items.filter((item) => item.reviewStatus === "metadata-missing").length,
    reviewWindowDays: 90,
    items,
    actions: [],
    notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only."
  };
}

function metadataMissingSource(overrides: Partial<SourceFreshnessReviewInput> = {}): SourceFreshnessReviewInput {
  return source({
    clauseId: "metadata-missing-source",
    citation: "Missing metadata citation",
    nextReviewDueAt: "",
    reviewStatus: "metadata-missing",
    reviewerNotes: "",
    ...overrides
  });
}

function overdueSource(overrides: Partial<SourceFreshnessReviewInput> = {}): SourceFreshnessReviewInput {
  return source({
    clauseId: "overdue-source",
    citation: "Overdue source citation",
    nextReviewDueAt: "2026-06-10",
    reviewStatus: "review-due",
    ...overrides
  });
}

function dueSoonSource(overrides: Partial<SourceFreshnessReviewInput> = {}): SourceFreshnessReviewInput {
  return source({
    clauseId: "due-soon-source",
    citation: "Due soon source citation",
    nextReviewDueAt: "2026-07-20",
    reviewStatus: "current",
    ...overrides
  });
}

function scheduledSource(overrides: Partial<SourceFreshnessReviewInput> = {}): SourceFreshnessReviewInput {
  return source({
    clauseId: "scheduled-source",
    citation: "Scheduled source citation",
    nextReviewDueAt: "2026-10-01",
    reviewStatus: "current",
    ...overrides
  });
}

function source(overrides: Partial<SourceFreshnessReviewInput>): SourceFreshnessReviewInput {
  return {
    clauseId: "source",
    jurisdiction: "United States",
    regulator: "Source regulator",
    citation: "Source citation",
    sourceName: "Reviewed source",
    sourceUrl: "https://example.test/source",
    effectiveAsOf: "2026-01-01",
    lastReviewedAt: "2026-04-01",
    nextReviewDueAt: "2026-07-01",
    reviewStatus: "current",
    reviewerNotes: "Reviewed metadata for source lineage.",
    ...overrides
  };
}
