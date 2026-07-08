import { describe, expect, it, vi } from "vitest";
import {
  buildServerHumanReviewRecoveryPacketUrl,
  buildServerHumanReviewQueueUrl,
  fetchServerHumanReviewRecoveryPacket,
  fetchServerHumanReviewQueueView,
  ServerHumanReviewQueueClientError
} from "./serverHumanReviewQueueClient";
import type { ServerHumanReviewQueueView } from "./serverHumanReviewQueue";

describe("server human review queue client", () => {
  it("builds a filtered server Human Review queue URL", () => {
    expect(
      buildServerHumanReviewQueueUrl("https://api.lexproof.test/", "workspace human review", {
        targetType: "evidence",
        status: "needs-more-evidence",
        reviewerId: "Counsel"
      })
    ).toBe(
      "https://api.lexproof.test/api/workspaces/workspace%20human%20review/reviews/queue?targetType=evidence&status=needs-more-evidence&reviewerId=Counsel"
    );
  });

  it("builds a standalone server Human Review recovery packet URL", () => {
    expect(buildServerHumanReviewRecoveryPacketUrl("https://api.lexproof.test/", "workspace human review")).toBe(
      "https://api.lexproof.test/api/workspaces/workspace%20human%20review/reviews/recovery"
    );
  });

  it("fetches a metadata-only server recovery packet from the Human Review queue", async () => {
    const fetcher = vi.fn(async () => jsonResponse(createQueuePayload()));

    const view = await fetchServerHumanReviewQueueView({
      apiBaseUrl: "https://api.lexproof.test",
      workspaceId: "workspace-review",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith("https://api.lexproof.test/api/workspaces/workspace-review/reviews/queue", {
      method: "GET"
    });
    expect(view.recoveryPacket).toMatchObject({
      packetVersion: "lexproof-server-human-review-recovery-packet-v1",
      status: "needs-recovery",
      summary: {
        totalRecoveryCount: 1,
        returnedCount: 1,
        rejectedCount: 0,
        nextAction: "evidence evidence-1: Return the linked Evidence Vault record to requested status."
      },
      nextActions: ["evidence evidence-1: Return the linked Evidence Vault record to requested status."],
      notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
    });
    expect(JSON.stringify(view)).not.toMatch(/raw KYC|private key|legal approval/i);
  });

  it("fetches a metadata-only server recovery packet from the standalone route", async () => {
    const fetcher = vi.fn(async () => jsonResponse(createQueuePayload().recoveryPacket));

    const packet = await fetchServerHumanReviewRecoveryPacket({
      apiBaseUrl: "https://api.lexproof.test",
      workspaceId: "workspace-review",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith("https://api.lexproof.test/api/workspaces/workspace-review/reviews/recovery", {
      method: "GET"
    });
    expect(packet).toMatchObject({
      packetVersion: "lexproof-server-human-review-recovery-packet-v1",
      workspaceId: "workspace-review",
      status: "needs-recovery",
      summary: {
        totalRecoveryCount: 1,
        returnedCount: 1,
        rejectedCount: 0,
        nextAction: "evidence evidence-1: Return the linked Evidence Vault record to requested status."
      },
      nextActions: ["evidence evidence-1: Return the linked Evidence Vault record to requested status."],
      notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
    });
  });

  it("redacts classified text from otherwise valid server queue and recovery packet responses before UI use", async () => {
    const payload = createQueuePayload();
    payload.workspaceId = "workspace-review apiKey=sk-live-abcdef1234567890abcdef1234567890";
    payload.filters = {
      reviewerId: "reviewer@example.com"
    };
    payload.reviewerCounts = {
      "reviewer@example.com": 1
    };
    payload.nextActions = [
      "Remove raw KYC passport A1234567 and private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef before review."
    ];
    payload.recoveryPacket.workspaceId = "workspace-review raw KYC passport A1234567";
    payload.recoveryPacket.generatedAt = "2026-07-08T00:00:00.000Z legal opinion";
    payload.recoveryPacket.summary.nextAction = "Do not treat this returned review as a final legal decision.";
    payload.recoveryPacket.nextActions = ["Remove apiKey=sk-live-abcdef1234567890abcdef1234567890 before retry."];
    payload.recoveryPacket.items[0] = {
      ...payload.recoveryPacket.items[0],
      id: "review-1 apiKey=sk-live-abcdef1234567890abcdef1234567890",
      workspaceId: "workspace-review raw KYC passport A1234567",
      targetId: "evidence-1 passport file",
      targetLabel: "evidence evidence-1 passport file",
      reviewerId: "reviewer@example.com",
      reviewerComment: "Needs raw KYC passport A1234567 and apiKey=sk-live-abcdef1234567890abcdef1234567890.",
      createdAt: "2026-07-08T00:00:00.000Z legal conclusion",
      updatedAt: "2026-07-08T00:00:00.000Z legal approval",
      recoveryAction:
        "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef before counsel handoff."
    };
    payload.items[0] = {
      ...payload.items[0],
      id: "review-1 apiKey=sk-live-abcdef1234567890abcdef1234567890",
      workspaceId: "workspace-review raw KYC passport A1234567",
      targetId: "evidence-1 passport file",
      reviewerId: "reviewer@example.com",
      comment: "Needs raw KYC passport A1234567 before legal opinion.",
      createdAt: "2026-07-08T00:00:00.000Z legal conclusion",
      updatedAt: "2026-07-08T00:00:00.000Z final legal decision"
    };
    const fetcher = vi.fn(async () => jsonResponse(payload));

    const view = await fetchServerHumanReviewQueueView({
      workspaceId: "workspace-review",
      fetcher
    });

    expect(view.workspaceId).toContain("[redacted-secret]");
    expect(view.filters.reviewerId).toBe("[redacted-email]");
    expect(view.reviewerCounts).toEqual({ "[redacted-email]": 1 });
    expect(view.nextActions.join(" ")).toContain("[redacted-raw-kyc]");
    expect(view.nextActions.join(" ")).toContain("[redacted-passport-id]");
    expect(view.nextActions.join(" ")).toContain("[redacted-private-key]");
    expect(view.recoveryPacket.workspaceId).toContain("[redacted-raw-kyc]");
    expect(view.recoveryPacket.generatedAt).toContain("[redacted-legal-conclusion]");
    expect(view.recoveryPacket.summary.nextAction).toContain("[redacted-legal-conclusion]");
    expect(view.recoveryPacket.nextActions.join(" ")).toContain("[redacted-secret]");
    expect(view.recoveryPacket.items[0].id).toContain("[redacted-secret]");
    expect(view.recoveryPacket.items[0].targetId).toContain("[redacted-identity-document]");
    expect(view.recoveryPacket.items[0].reviewerId).toBe("[redacted-email]");
    expect(view.recoveryPacket.items[0].reviewerComment).toContain("[redacted-raw-kyc]");
    expect(view.recoveryPacket.items[0].reviewerComment).toContain("[redacted-secret]");
    expect(view.recoveryPacket.items[0].recoveryAction).toContain("[redacted-private-key]");
    expect(view.items[0].reviewerId).toBe("[redacted-email]");
    expect(view.items[0].comment).toContain("[redacted-raw-kyc]");
    expect(view.items[0].comment).toContain("[redacted-legal-conclusion]");
    expect(JSON.stringify(view)).not.toMatch(
      /sk-live-abcdef|raw KYC|passport A1234567|passport file|reviewer@example\.com|private key|legal opinion|legal conclusion|legal approval|final legal decision/i
    );
    expect(view.recoveryPacket.notLegalAdviceBoundary).toBe(
      "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
    );
    expect(view.notLegalAdviceBoundary).toBe(
      "Not legal advice. Human review queues are audit preparation workflow metadata only."
    );
  });

  it("redacts classified text from standalone server recovery packets before UI use", async () => {
    const payload = createQueuePayload().recoveryPacket;
    payload.workspaceId = "workspace-review raw KYC passport A1234567";
    payload.generatedAt = "2026-07-08T00:00:00.000Z legal opinion";
    payload.summary.nextAction = "Do not treat this returned review as a final legal decision.";
    payload.nextActions = ["Remove apiKey=sk-live-abcdef1234567890abcdef1234567890 before retry."];
    payload.items[0] = {
      ...payload.items[0],
      id: "review-1 apiKey=sk-live-abcdef1234567890abcdef1234567890",
      workspaceId: "workspace-review raw KYC passport A1234567",
      targetId: "evidence-1 passport file",
      targetLabel: "evidence evidence-1 passport file",
      reviewerId: "reviewer@example.com",
      reviewerComment: "Needs raw KYC passport A1234567 and apiKey=sk-live-abcdef1234567890abcdef1234567890.",
      createdAt: "2026-07-08T00:00:00.000Z legal conclusion",
      updatedAt: "2026-07-08T00:00:00.000Z legal approval",
      recoveryAction:
        "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef before counsel handoff."
    };
    const fetcher = vi.fn(async () => jsonResponse(payload));

    const packet = await fetchServerHumanReviewRecoveryPacket({
      workspaceId: "workspace-review",
      fetcher
    });

    expect(packet.workspaceId).toContain("[redacted-raw-kyc]");
    expect(packet.generatedAt).toContain("[redacted-legal-conclusion]");
    expect(packet.summary.nextAction).toContain("[redacted-legal-conclusion]");
    expect(packet.nextActions.join(" ")).toContain("[redacted-secret]");
    expect(packet.items[0].id).toContain("[redacted-secret]");
    expect(packet.items[0].targetId).toContain("[redacted-identity-document]");
    expect(packet.items[0].reviewerId).toBe("[redacted-email]");
    expect(packet.items[0].reviewerComment).toContain("[redacted-raw-kyc]");
    expect(packet.items[0].reviewerComment).toContain("[redacted-secret]");
    expect(packet.items[0].recoveryAction).toContain("[redacted-private-key]");
    expect(JSON.stringify(packet)).not.toMatch(
      /sk-live-abcdef|raw KYC|passport A1234567|passport file|reviewer@example\.com|private key|legal opinion|legal conclusion|legal approval|final legal decision/i
    );
  });

  it("rejects queue responses that omit the recovery packet boundary", async () => {
    const payload = createQueuePayload();
    (payload.recoveryPacket as { notLegalAdviceBoundary: string }).notLegalAdviceBoundary = "Legal approval.";
    const fetcher = vi.fn(async () => jsonResponse(payload));

    await expect(
      fetchServerHumanReviewQueueView({
        workspaceId: "workspace-review",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SERVER_HUMAN_REVIEW_QUEUE_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Human Review queue and recovery packet records."
    });
  });

  it("rejects standalone recovery packet responses that omit non-empty next actions", async () => {
    const payload = createQueuePayload().recoveryPacket;
    payload.nextActions = [];
    const fetcher = vi.fn(async () => jsonResponse(payload));

    await expect(
      fetchServerHumanReviewRecoveryPacket({
        workspaceId: "workspace-review",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SERVER_HUMAN_REVIEW_QUEUE_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Human Review queue and recovery packet records."
    });
  });

  it("rejects queue responses that have empty or blank next actions", async () => {
    const emptyQueueNextActions = vi.fn(async () => jsonResponse({ ...createQueuePayload(), nextActions: [] }));
    const blankQueueNextActions = vi.fn(async () =>
      jsonResponse({ ...createQueuePayload(), nextActions: ["1 review item needs more evidence before counsel handoff.", "  "] })
    );
    const emptyRecoveryNextActionsPayload = createQueuePayload();
    emptyRecoveryNextActionsPayload.recoveryPacket.nextActions = [];
    const emptyRecoveryNextActions = vi.fn(async () => jsonResponse(emptyRecoveryNextActionsPayload));
    const blankRecoverySummaryPayload = createQueuePayload();
    blankRecoverySummaryPayload.recoveryPacket.summary.nextAction = " ";
    const blankRecoverySummary = vi.fn(async () => jsonResponse(blankRecoverySummaryPayload));

    await expect(
      fetchServerHumanReviewQueueView({ workspaceId: "workspace-review", fetcher: emptyQueueNextActions })
    ).rejects.toMatchObject({
      code: "SERVER_HUMAN_REVIEW_QUEUE_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Human Review queue and recovery packet records."
    });
    await expect(
      fetchServerHumanReviewQueueView({ workspaceId: "workspace-review", fetcher: blankQueueNextActions })
    ).rejects.toMatchObject({
      code: "SERVER_HUMAN_REVIEW_QUEUE_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Human Review queue and recovery packet records."
    });
    await expect(
      fetchServerHumanReviewQueueView({ workspaceId: "workspace-review", fetcher: emptyRecoveryNextActions })
    ).rejects.toMatchObject({
      code: "SERVER_HUMAN_REVIEW_QUEUE_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Human Review queue and recovery packet records."
    });
    await expect(
      fetchServerHumanReviewQueueView({ workspaceId: "workspace-review", fetcher: blankRecoverySummary })
    ).rejects.toMatchObject({
      code: "SERVER_HUMAN_REVIEW_QUEUE_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Human Review queue and recovery packet records."
    });
  });

  it("redacts unsafe API error recovery text before surfacing it", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: "Queue failed because private key abc was included.",
          code: "HUMAN_REVIEW_QUEUE_FAILED",
          recoveryAction: "Remove raw KYC passport file and private key before legal approval.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        },
        400
      )
    );

    await expect(fetchServerHumanReviewQueueView({ workspaceId: "workspace-review", fetcher })).rejects.toMatchObject({
      name: "ServerHumanReviewQueueClientError",
      code: "HUMAN_REVIEW_QUEUE_FAILED",
      recoveryAction: expect.stringContaining("[redacted-raw-kyc]"),
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    try {
      await fetchServerHumanReviewQueueView({ workspaceId: "workspace-review", fetcher });
    } catch (error) {
      expect(error).toBeInstanceOf(ServerHumanReviewQueueClientError);
      expect(String((error as ServerHumanReviewQueueClientError).recoveryAction)).not.toMatch(
        /passport file|private key|legal approval/i
      );
    }
  });
});

function createQueuePayload(): ServerHumanReviewQueueView {
  return {
    queueVersion: "lexproof-server-human-review-queue-v1",
    workspaceId: "workspace-review",
    filters: {},
    totalCount: 1,
    openCount: 1,
    reviewedCount: 0,
    blockedCount: 0,
    targetTypeCounts: {
      evidence: 1
    },
    statusCounts: {
      "needs-more-evidence": 1
    },
    reviewerCounts: {
      Counsel: 1
    },
    nextActions: ["1 review item needs more evidence before counsel handoff."],
    recoveryPacket: {
      packetVersion: "lexproof-server-human-review-recovery-packet-v1",
      workspaceId: "workspace-review",
      generatedAt: "2026-07-08T00:00:00.000Z",
      packetHash: "b".repeat(64),
      status: "needs-recovery",
      summary: {
        totalRecoveryCount: 1,
        returnedCount: 1,
        rejectedCount: 0,
        nextAction: "evidence evidence-1: Return the linked Evidence Vault record to requested status.",
        notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
      },
      nextActions: ["evidence evidence-1: Return the linked Evidence Vault record to requested status."],
      items: [
        {
          itemVersion: "lexproof-server-human-review-recovery-item-v1",
          id: "review-1",
          workspaceId: "workspace-review",
          targetType: "evidence",
          targetId: "evidence-1",
          targetLabel: "evidence evidence-1",
          reviewerId: "Counsel",
          status: "needs-more-evidence",
          severity: "needs-action",
          reviewerComment: "Needs additional metadata before counsel handoff.",
          createdAt: "2026-07-08T00:00:00.000Z",
          updatedAt: "2026-07-08T00:00:00.000Z",
          recoveryAction: "Return the linked Evidence Vault record to requested status.",
          notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery items are audit preparation workflow metadata only."
        }
      ],
      notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
    },
    items: [
      {
        recordVersion: "lexproof-human-review-record-v1",
        id: "review-1",
        workspaceId: "workspace-review",
        targetType: "evidence",
        targetId: "evidence-1",
        reviewerId: "Counsel",
        status: "needs-more-evidence",
        comment: "Needs additional metadata before counsel handoff.",
        createdAt: "2026-07-08T00:00:00.000Z",
        updatedAt: "2026-07-08T00:00:00.000Z",
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      }
    ],
    notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only."
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}
