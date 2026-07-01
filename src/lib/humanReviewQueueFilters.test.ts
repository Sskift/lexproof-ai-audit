import { describe, expect, it } from "vitest";
import type { HumanReviewQueueItem } from "./humanReviewWorkflow";
import { createHumanReviewQueueFilterOptions, filterHumanReviewQueueItems } from "./humanReviewQueueFilters";

const reviewItems: HumanReviewQueueItem[] = [
  {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: "human-review-queue-evidence-evidence-1",
    projectId: "project-1",
    targetType: "evidence",
    targetId: "evidence-1",
    sourceId: "evidence-1",
    title: "Returned review memo",
    summary: "Markdown; requested; Custody support is missing from the evidence bundle.",
    priority: "P1",
    status: "needs-more-evidence",
    reviewer: "Compliance",
    decisionNote: "Return for missing custody support.",
    dueAt: "2026-07-05T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only."
  },
  {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: "human-review-queue-clause-match-source-review-us-ofac",
    projectId: "project-1",
    targetType: "clause-match",
    targetId: "source-review-us-ofac",
    sourceId: "us-ofac-virtual-currency",
    title: "OFAC virtual currency source refresh",
    summary: "Refresh source metadata before counsel handoff.",
    priority: "P1",
    status: "needs-review",
    reviewer: "Local counsel",
    decisionNote: "Not legal advice. Source review metadata is audit preparation lineage only.",
    dueAt: "2026-07-06T00:00:00.000Z",
    updatedAt: "2026-07-01T01:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only."
  },
  {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: "human-review-queue-ai-event-ai-event-1",
    projectId: "project-1",
    targetType: "ai-event",
    targetId: "ai-event-1",
    sourceId: "ai-event-1",
    title: "AI Review run",
    summary: "Draft counsel questions from model output.",
    priority: "P2",
    status: "reviewed",
    reviewer: "Compliance",
    decisionNote: "Reviewed model output for audit-prep handoff.",
    dueAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-01T02:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only."
  }
];

describe("human review queue filters", () => {
  it("filters queue items by target type, status, reviewer, and search tokens without creating legal conclusions", () => {
    const filtered = filterHumanReviewQueueItems(reviewItems, {
      targetType: "evidence",
      status: "needs-more-evidence",
      reviewer: "Compliance",
      query: "custody support"
    });

    expect(filtered.map((item) => item.id)).toEqual(["human-review-queue-evidence-evidence-1"]);
    expect(JSON.stringify(filtered)).toContain("Not legal advice");
    expect(JSON.stringify(filtered).toLowerCase()).not.toMatch(/\b(non-)?compliant\b/);
  });

  it("builds stable filter options from the available queue items", () => {
    expect(createHumanReviewQueueFilterOptions(reviewItems)).toEqual({
      targetTypes: ["ai-event", "evidence", "clause-match"],
      statuses: ["needs-review", "needs-more-evidence", "reviewed"],
      reviewers: ["Compliance", "Local counsel"]
    });
  });
});
