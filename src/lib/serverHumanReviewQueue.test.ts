import { describe, expect, it } from "vitest";
import { createServerHumanReviewQueueView } from "./serverHumanReviewQueue";
import type { HumanReviewRecord } from "./phase2Types";

describe("server human review queue view", () => {
  it("filters review records by target type, status, and reviewer with queue counts", () => {
    const view = createServerHumanReviewQueueView({
      workspaceId: "workspace-review-queue",
      records: [
        createReview({ id: "review-1", targetType: "model-run", status: "requested", reviewerId: "Compliance", updatedAt: "2026-06-30T00:00:03.000Z" }),
        createReview({ id: "review-2", targetType: "evidence", status: "needs-more-evidence", reviewerId: "Counsel", updatedAt: "2026-06-30T00:00:02.000Z" }),
        createReview({ id: "review-3", targetType: "evidence", status: "reviewed", reviewerId: "Counsel", updatedAt: "2026-06-30T00:00:01.000Z" }),
        createReview({ id: "review-4", targetType: "counsel-pack", status: "rejected", reviewerId: "Compliance", updatedAt: "2026-06-30T00:00:04.000Z" })
      ],
      filters: {
        targetType: "evidence",
        reviewerId: "Counsel"
      }
    });

    expect(view).toEqual({
      queueVersion: "lexproof-server-human-review-queue-v1",
      workspaceId: "workspace-review-queue",
      filters: {
        targetType: "evidence",
        reviewerId: "Counsel"
      },
      totalCount: 2,
      openCount: 1,
      reviewedCount: 1,
      blockedCount: 0,
      targetTypeCounts: {
        evidence: 2
      },
      statusCounts: {
        "needs-more-evidence": 1,
        reviewed: 1
      },
      reviewerCounts: {
        Counsel: 2
      },
      nextActions: [
        "1 review item needs more evidence before counsel handoff."
      ],
      items: [
        expect.objectContaining({ id: "review-2", status: "needs-more-evidence" }),
        expect.objectContaining({ id: "review-3", status: "reviewed" })
      ],
      notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only."
    });
  });

  it("summarizes all review target types without treating reviewed records as legal approval", () => {
    const view = createServerHumanReviewQueueView({
      workspaceId: "workspace-review-queue",
      records: [
        createReview({ id: "review-1", targetType: "model-run", status: "requested" }),
        createReview({ id: "review-2", targetType: "evidence", status: "under-review" }),
        createReview({ id: "review-3", targetType: "risk-flag", status: "reviewed" }),
        createReview({ id: "review-4", targetType: "counsel-pack", status: "rejected" })
      ]
    });

    expect(view.totalCount).toBe(4);
    expect(view.openCount).toBe(2);
    expect(view.reviewedCount).toBe(1);
    expect(view.blockedCount).toBe(1);
    expect(view.targetTypeCounts).toEqual({
      "counsel-pack": 1,
      evidence: 1,
      "model-run": 1,
      "risk-flag": 1
    });
    expect(view.nextActions).toEqual([
      "1 review item is rejected and needs recovery before export readiness.",
      "2 review items are still open."
    ]);
    expect(JSON.stringify(view).toLowerCase()).not.toContain("approved");
    expect(view.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("returns an empty queue with an actionable next step", () => {
    const view = createServerHumanReviewQueueView({
      workspaceId: "workspace-empty",
      records: []
    });

    expect(view).toMatchObject({
      totalCount: 0,
      openCount: 0,
      reviewedCount: 0,
      blockedCount: 0,
      targetTypeCounts: {},
      statusCounts: {},
      reviewerCounts: {},
      nextActions: ["Create a human review request for evidence, model output, risk flags, or counsel pack handoff."]
    });
  });
});

function createReview(overrides: Partial<HumanReviewRecord> = {}): HumanReviewRecord {
  return {
    recordVersion: "lexproof-human-review-record-v1",
    id: "review-1",
    workspaceId: "workspace-review-queue",
    targetType: "model-run",
    targetId: "model-gateway-run-1",
    reviewerId: "Compliance",
    status: "requested",
    comment: "Review audit-prep material before handoff.",
    createdAt: "2026-06-30T00:00:00.000Z",
    updatedAt: "2026-06-30T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status.",
    ...overrides
  };
}
