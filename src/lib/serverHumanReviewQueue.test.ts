import { describe, expect, it } from "vitest";
import {
  createServerHumanReviewQueueView,
  createServerHumanReviewRecoveryPacket,
  exportServerHumanReviewRecoveryPacketJson
} from "./serverHumanReviewQueue";
import type { HumanReviewRecord } from "./phase2Types";

describe("server human review queue view", () => {
  it("filters review records by target type, status, and reviewer with queue counts", () => {
    const view = createServerHumanReviewQueueView({
      workspaceId: "workspace-review-queue",
      records: [
        createReview({ id: "review-1", targetType: "model-run", status: "requested", reviewerId: "Compliance", updatedAt: "2026-06-30T00:00:03.000Z" }),
        createReview({
          id: "review-2",
          targetType: "evidence",
          targetId: "evidence-2",
          status: "needs-more-evidence",
          reviewerId: "Counsel",
          updatedAt: "2026-06-30T00:00:02.000Z"
        }),
        createReview({
          id: "review-3",
          targetType: "evidence",
          targetId: "evidence-3",
          status: "reviewed",
          reviewerId: "Counsel",
          updatedAt: "2026-06-30T00:00:01.000Z"
        }),
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
      recoveryPacket: expect.objectContaining({
        packetVersion: "lexproof-server-human-review-recovery-packet-v1",
        workspaceId: "workspace-review-queue",
        status: "needs-recovery",
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        summary: {
          totalRecoveryCount: 1,
          returnedCount: 1,
          rejectedCount: 0,
          nextAction:
            "evidence evidence-2: Return the linked Evidence Vault record to requested status and attach additional metadata before review.",
          notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
        },
        nextActions: [
          "evidence evidence-2: Return the linked Evidence Vault record to requested status and attach additional metadata before review."
        ],
        items: [
          expect.objectContaining({
            id: "review-2",
            targetType: "evidence",
            status: "needs-more-evidence",
            severity: "needs-action",
            notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery items are audit preparation workflow metadata only."
          })
        ],
        notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
      }),
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
        createReview({ id: "review-4", targetType: "counsel-pack", targetId: "counsel-pack-version-1", status: "rejected" })
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
    expect(view.recoveryPacket).toEqual(
      expect.objectContaining({
        status: "needs-recovery",
        summary: expect.objectContaining({
          totalRecoveryCount: 1,
          rejectedCount: 1,
          nextAction:
            "counsel-pack counsel-pack-version-1: Save a new Counsel Pack version after blockers are remediated and route it back through Human Review."
        }),
        items: [expect.objectContaining({ id: "review-4", status: "rejected", severity: "blocked" })]
      })
    );
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
    expect(view.recoveryPacket).toEqual(
      expect.objectContaining({
        status: "ready",
        summary: expect.objectContaining({
          totalRecoveryCount: 0,
          nextAction: "No returned or rejected server human review records currently need recovery."
        }),
        nextActions: ["No returned or rejected server human review records currently need recovery."],
        items: []
      })
    );
  });

  it("exports a stable redacted server recovery packet for returned and rejected records", () => {
    const records = [
      createReview({
        id: "review-1",
        targetType: "model-run",
        targetId: "model-gateway-run-1",
        reviewerId: "ops@example.com",
        status: "needs-more-evidence",
        comment: "Needs source memo from KYC document before any legal approval claim.",
        updatedAt: "2026-06-30T00:00:03.000Z"
      }),
      createReview({
        id: "review-2",
        targetType: "evidence",
        targetId: "evidence-vault-1",
        reviewerId: "Counsel",
        status: "rejected",
        comment:
          "Reject stale memo with sk-live-1234567890abcdef1234567890abcdef and passport file; do not mark compliant.",
        updatedAt: "2026-06-30T00:00:02.000Z"
      }),
      createReview({
        id: "review-3",
        targetType: "risk-flag",
        targetId: "risk-1",
        status: "reviewed",
        comment: "Closed for audit-prep workflow.",
        updatedAt: "2026-06-30T00:00:01.000Z"
      })
    ];

    const first = createServerHumanReviewRecoveryPacket({
      workspaceId: "workspace-review-queue",
      records,
      generatedAt: "2026-07-05T00:00:00.000Z"
    });
    const second = createServerHumanReviewRecoveryPacket({
      workspaceId: "workspace-review-queue",
      records,
      generatedAt: "2026-07-06T00:00:00.000Z"
    });
    const payload = exportServerHumanReviewRecoveryPacketJson(first);

    expect(first.packetHash).toMatch(/^[a-f0-9]{64}$/);
    expect(second.packetHash).toBe(first.packetHash);
    expect(first.status).toBe("needs-recovery");
    expect(first.summary).toEqual({
      totalRecoveryCount: 2,
      returnedCount: 1,
      rejectedCount: 1,
      nextAction:
        "evidence evidence-vault-1: Create replacement Evidence Vault metadata before relying on this record for export readiness.",
      notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
    });
    expect(first.nextActions).toEqual([
      "evidence evidence-vault-1: Create replacement Evidence Vault metadata before relying on this record for export readiness.",
      "model-run model-gateway-run-1: Attach missing evidence context before relying on the model run receipt."
    ]);
    expect(first.items.map((item) => `${item.status}:${item.targetLabel}`)).toEqual([
      "rejected:evidence evidence-vault-1",
      "needs-more-evidence:model-run model-gateway-run-1"
    ]);
    expect(first.items[0].reviewerComment).toContain("[redacted-api-key]");
    expect(first.items[0].reviewerComment).toContain("[redacted-identity-document]");
    expect(first.items[1].reviewerId).toBe("[redacted-email]");
    expect(payload).toContain("\"packetHash\"");
    expect(payload).toContain("Not legal advice");
    expect(payload).not.toMatch(/sk-live|passport file|legal approval|\bcompliant\b|\bnon-compliant\b/i);
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
