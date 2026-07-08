import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { createEvidenceVaultRecordFromUpload } from "./evidenceVaultService";
import { registerHumanReviewRoutes } from "./humanReviewRoutes";
import { createModelGatewayRun } from "./modelGatewayService";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("Human Review route module", () => {
  it("registers review create, queue, list, and linked Evidence Vault status sync routes", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerHumanReviewRoutes(server, { repository });

    const evidence = createEvidenceVaultRecordFromUpload({
      workspaceId: "workspace-human-review-routes",
      filename: "custody-controls.pdf",
      mimeType: "application/pdf",
      bytes: new TextEncoder().encode("custody controls metadata"),
      owner: "Ops",
      sourceNote: "Initial custody control packet",
      linkedRiskFlagIds: ["custody-controls"],
      linkedControlIds: ["control-custody-controls"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-30T00:00:00.000Z"
    });
    await repository.saveEvidenceVaultRecord(evidence);

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-human-review-routes/reviews",
      payload: {
        targetType: "evidence",
        targetId: evidence.id,
        reviewerId: "Counsel",
        comment: "Review evidence metadata before counsel pack reliance."
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-human-review-record-v1",
        workspaceId: "workspace-human-review-routes",
        targetType: "evidence",
        targetId: evidence.id,
        reviewerId: "Counsel",
        status: "requested",
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      })
    );

    const queueResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-human-review-routes/reviews/queue?targetType=evidence&reviewerId=Counsel"
    });
    expect(queueResponse.statusCode).toBe(200);
    expect(queueResponse.json()).toEqual(
      expect.objectContaining({
        queueVersion: "lexproof-server-human-review-queue-v1",
        workspaceId: "workspace-human-review-routes",
        filters: { targetType: "evidence", reviewerId: "Counsel" },
        totalCount: 1,
        openCount: 1
      })
    );

    const updateResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-human-review-routes/reviews/${createResponse.json().id}`,
      payload: {
        status: "needs-more-evidence",
        comment: "Return this to the evidence owner for supporting material."
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual(expect.objectContaining({ status: "needs-more-evidence" }));

    expect(await repository.findEvidenceVaultRecord("workspace-human-review-routes", evidence.id)).toEqual(
      expect.objectContaining({
        id: evidence.id,
        status: "requested",
        sourceNote: "Human Review requested more evidence; returned Evidence Vault record to requested.",
        version: 2
      })
    );
    expect(await repository.listAuditLogRecords("workspace-human-review-routes")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "human-review.created", targetType: "human-review" }),
        expect.objectContaining({ action: "human-review.updated", targetId: createResponse.json().id }),
        expect.objectContaining({
          action: "evidence.review-status.synced",
          targetType: "evidence",
          targetId: evidence.id,
          summary: "Human Review requested more evidence; returned Evidence Vault record to requested."
        })
      ])
    );

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-human-review-routes/reviews" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([expect.objectContaining({ id: createResponse.json().id, status: "needs-more-evidence" })]);

    await server.close();
    await repository.close();
  });

  it("syncs linked model-run review status and rejects invalid queue filters with a non-advice boundary", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerHumanReviewRoutes(server, { repository });

    const runResult = createModelGatewayRun({
      workspaceId: "workspace-model-review-routes",
      provider: "mock",
      model: "lexproof-mock",
      purpose: "Draft audit preparation issue spotting for counsel review.",
      redactionStatus: "clean",
      includesCredentialMaterial: false,
      includesRawKycOrPersonalData: false,
      humanReviewOwner: "Counsel",
      allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
      payload: { projectName: "YieldPassport", issue: "Review model output reliance." },
      createdAt: "2026-06-30T00:00:00.000Z"
    });
    expect(runResult.valid).toBe(true);
    if (!runResult.valid) {
      throw new Error("Expected mock model gateway run to be valid.");
    }
    await repository.saveModelGatewayRun(runResult.run);

    const reviewResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-model-review-routes/reviews",
      payload: {
        targetType: "model-run",
        targetId: runResult.run.id,
        reviewerId: "Counsel",
        comment: "Review model output before audit-prep reliance."
      }
    });
    expect(reviewResponse.statusCode).toBe(201);

    const updateResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-model-review-routes/reviews/${reviewResponse.json().id}`,
      payload: {
        status: "rejected",
        comment: "Reject this model output for audit-prep reliance."
      }
    });
    expect(updateResponse.statusCode).toBe(200);

    expect(await repository.findModelGatewayRun("workspace-model-review-routes", runResult.run.id)).toEqual(
      expect.objectContaining({ id: runResult.run.id, humanReviewStatus: "rejected" })
    );
    expect(await repository.listAuditLogRecords("workspace-model-review-routes")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "model.run.review-status.synced",
          targetType: "model-run",
          targetId: runResult.run.id,
          summary: "Human Review rejected model run output; keep it out of audit-prep reliance."
        })
      ])
    );

    const invalidQueueResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-model-review-routes/reviews/queue?targetType=legal-opinion"
    });
    expect(invalidQueueResponse.statusCode).toBe(400);
    expect(invalidQueueResponse.json()).toEqual({
      error: "Human review target type must be risk-flag, evidence, model-run, clause-match, or counsel-pack.",
      code: "HUMAN_REVIEW_QUEUE_FAILED",
      recoveryAction: "Use targetType risk-flag, evidence, model-run, clause-match, or counsel-pack and a supported review status.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const repeatedTargetTypeResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-model-review-routes/reviews/queue?targetType=model-run&targetType=${encodeURIComponent(apiKey)}`
    });
    expect(repeatedTargetTypeResponse.statusCode).toBe(400);
    expect(repeatedTargetTypeResponse.json()).toEqual({
      error: "Human review targetType filter must be a single string.",
      code: "HUMAN_REVIEW_QUEUE_FAILED",
      recoveryAction: "Use targetType risk-flag, evidence, model-run, clause-match, or counsel-pack and a supported review status.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(repeatedTargetTypeResponse.body).not.toContain(apiKey);

    const repeatedStatusResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-model-review-routes/reviews/queue?status=requested&status=${encodeURIComponent(privateKey)}`
    });
    expect(repeatedStatusResponse.statusCode).toBe(400);
    expect(repeatedStatusResponse.json()).toEqual({
      error: "Human review status filter must be a single string.",
      code: "HUMAN_REVIEW_QUEUE_FAILED",
      recoveryAction: "Use targetType risk-flag, evidence, model-run, clause-match, or counsel-pack and a supported review status.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(repeatedStatusResponse.body).not.toContain(privateKey);

    const repeatedReviewerResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-model-review-routes/reviews/queue?reviewerId=Counsel&reviewerId=${encodeURIComponent(apiKey)}`
    });
    expect(repeatedReviewerResponse.statusCode).toBe(400);
    expect(repeatedReviewerResponse.json()).toEqual({
      error: "Human review reviewerId filter must be a single string.",
      code: "HUMAN_REVIEW_QUEUE_FAILED",
      recoveryAction: "Use targetType risk-flag, evidence, model-run, clause-match, or counsel-pack and a supported review status.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(repeatedReviewerResponse.body).not.toContain(apiKey);

    await server.close();
    await repository.close();
  });

  it("serves a standalone redacted Human Review recovery packet", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerHumanReviewRoutes(server, { repository });

    const rejectedResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-human-review-recovery/reviews",
      payload: {
        targetType: "evidence",
        targetId: "evidence-vault-unsafe",
        reviewerId: "ops@example.com",
        comment: "Review evidence metadata before export reliance."
      }
    });
    expect(rejectedResponse.statusCode).toBe(201);

    const returnedResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-human-review-recovery/reviews",
      payload: {
        targetType: "model-run",
        targetId: "model-gateway-run-unsafe",
        reviewerId: "Counsel",
        comment: "Review model run receipt before audit-prep reliance."
      }
    });
    expect(returnedResponse.statusCode).toBe(201);

    const reviewedResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-human-review-recovery/reviews",
      payload: {
        targetType: "risk-flag",
        targetId: "risk-ready",
        reviewerId: "Counsel",
        comment: "Review deterministic risk flag."
      }
    });
    expect(reviewedResponse.statusCode).toBe(201);

    const rejectedUpdateResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-human-review-recovery/reviews/${rejectedResponse.json().id}`,
      payload: {
        status: "rejected",
        comment: `Reject stale raw KYC packet with ${apiKey} and passport file; do not mark compliant.`
      }
    });
    expect(rejectedUpdateResponse.statusCode).toBe(200);

    const returnedUpdateResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-human-review-recovery/reviews/${returnedResponse.json().id}`,
      payload: {
        status: "needs-more-evidence",
        comment: `Needs source context before any legal approval claim involving ${privateKey}.`
      }
    });
    expect(returnedUpdateResponse.statusCode).toBe(200);

    const reviewedUpdateResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-human-review-recovery/reviews/${reviewedResponse.json().id}`,
      payload: {
        status: "reviewed",
        comment: "Closed as audit-prep workflow metadata."
      }
    });
    expect(reviewedUpdateResponse.statusCode).toBe(200);

    const recoveryResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-human-review-recovery/reviews/recovery"
    });
    const queueResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-human-review-recovery/reviews/queue"
    });

    expect(recoveryResponse.statusCode).toBe(200);
    expect(queueResponse.statusCode).toBe(200);
    expect(recoveryResponse.json()).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-server-human-review-recovery-packet-v1",
        workspaceId: "workspace-human-review-recovery",
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        status: "needs-recovery",
        summary: {
          totalRecoveryCount: 2,
          returnedCount: 1,
          rejectedCount: 1,
          nextAction:
            "evidence evidence-vault-unsafe: Create replacement Evidence Vault metadata before relying on this record for export readiness.",
          notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
        },
        nextActions: [
          "evidence evidence-vault-unsafe: Create replacement Evidence Vault metadata before relying on this record for export readiness.",
          "model-run model-gateway-run-unsafe: Attach missing evidence context before relying on the model run receipt."
        ],
        items: [
          expect.objectContaining({
            targetType: "evidence",
            status: "rejected",
            severity: "blocked",
            reviewerId: "[redacted-email]",
            reviewerComment: expect.stringContaining("[redacted-api-key]")
          }),
          expect.objectContaining({
            targetType: "model-run",
            status: "needs-more-evidence",
            severity: "needs-action",
            reviewerComment: expect.stringContaining("[redacted-private-key]")
          })
        ],
        notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
      })
    );
    expect(recoveryResponse.json().packetHash).toBe(queueResponse.json().recoveryPacket.packetHash);
    expect(recoveryResponse.body).not.toMatch(/sk-live|passport file|raw KYC packet|legal approval|\bcompliant\b|0xaaaaaaaa/i);

    await server.close();
    await repository.close();
  });

  it("creates and filters clause-match review records without treating source review as legal advice", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerHumanReviewRoutes(server, { repository });

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-clause-review-routes/reviews",
      payload: {
        targetType: "clause-match",
        targetId: "source-review-eu-mica-title-ii-white-paper",
        reviewerId: "Local counsel",
        comment: "Refresh source metadata before counsel handoff. Not legal advice."
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        targetType: "clause-match",
        targetId: "source-review-eu-mica-title-ii-white-paper",
        reviewerId: "Local counsel",
        status: "requested",
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      })
    );

    const queueResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-clause-review-routes/reviews/queue?targetType=clause-match&reviewerId=Local%20counsel"
    });

    expect(queueResponse.statusCode).toBe(200);
    expect(queueResponse.json()).toEqual(
      expect.objectContaining({
        filters: { targetType: "clause-match", reviewerId: "Local counsel" },
        totalCount: 1,
        openCount: 1,
        targetTypeCounts: { "clause-match": 1 },
        notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only."
      })
    );

    await server.close();
    await repository.close();
  });

  it("rejects malformed create and update payloads without mutating Human Review workflow state", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerHumanReviewRoutes(server, { repository });

    const createCases: Array<{ payload?: unknown; expectedError: string }> = [
      {
        expectedError: "Human review request payload must be a JSON object."
      },
      {
        payload: {
          targetType: "risk-flag",
          targetId: 42,
          reviewerId: "Counsel",
          comment: "Review deterministic risk flag for audit preparation.",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890"
        },
        expectedError: "Human review target ID must be a string."
      },
      {
        payload: {
          targetType: "risk-flag",
          targetId: "risk-1",
          reviewerId: "Counsel",
          comment: ["Create legal approval."]
        },
        expectedError: "Human review comment must be a string."
      }
    ];

    for (const [index, item] of createCases.entries()) {
      const workspaceId = `workspace-human-review-malformed-create-${index}`;
      const response = await server.inject({
        method: "POST",
        url: `/api/workspaces/${workspaceId}/reviews`,
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: item.expectedError,
          code: "HUMAN_REVIEW_CREATE_FAILED",
          recoveryAction: "Provide a supported review target, reviewer, and audit-prep comment before creating a review.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("apiKey");
      expect(await repository.listHumanReviewRecords(workspaceId)).toEqual([]);
      expect(await repository.listAuditLogRecords(workspaceId)).toEqual([]);
    }

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-human-review-malformed-update/reviews",
      payload: {
        targetType: "risk-flag",
        targetId: "risk-1",
        reviewerId: "Counsel",
        comment: "Review deterministic risk flag for audit preparation."
      }
    });
    expect(createResponse.statusCode).toBe(201);
    const reviewId = createResponse.json().id;

    const updateCases: Array<{ payload?: unknown; expectedError: string }> = [
      {
        expectedError: "Human review update payload must be a JSON object."
      },
      {
        payload: {
          status: 7,
          comment: "Review metadata only."
        },
        expectedError: "Human review status must be a string."
      },
      {
        payload: {
          status: "reviewed",
          comment: { rawKyc: "passport packet" }
        },
        expectedError: "Human review update comment must be a string."
      }
    ];

    for (const item of updateCases) {
      const response = await server.inject({
        method: "PATCH",
        url: `/api/workspaces/workspace-human-review-malformed-update/reviews/${reviewId}`,
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: item.expectedError,
          code: "HUMAN_REVIEW_UPDATE_FAILED",
          recoveryAction: "Use a supported review status and keep decisions as audit-prep workflow metadata.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("passport packet");
      expect(await repository.listHumanReviewRecords("workspace-human-review-malformed-update")).toEqual([
        expect.objectContaining({ id: reviewId, status: "requested", reviewerId: "Counsel" })
      ]);
    }
    expect(await repository.listAuditLogRecords("workspace-human-review-malformed-update")).toEqual([
      expect.objectContaining({ action: "human-review.created", targetId: reviewId })
    ]);

    await server.close();
    await repository.close();
  });

  it("returns typed audit-prep errors for invalid create, update, missing, and linked evidence sync failures", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerHumanReviewRoutes(server, { repository });

    const invalidCreateResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-human-review-errors/reviews",
      payload: {
        targetType: "legal-opinion",
        targetId: "risk-1",
        reviewerId: "Counsel",
        comment: "Create a legal approval."
      }
    });

    expect(invalidCreateResponse.statusCode).toBe(400);
    expect(invalidCreateResponse.json()).toEqual({
      error: "Human review target type must be risk-flag, evidence, model-run, clause-match, or counsel-pack.",
      code: "HUMAN_REVIEW_CREATE_FAILED",
      recoveryAction: "Provide a supported review target, reviewer, and audit-prep comment before creating a review.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const missingUpdateResponse = await server.inject({
      method: "PATCH",
      url: "/api/workspaces/workspace-human-review-errors/reviews/missing-review",
      payload: {
        status: "reviewed",
        comment: "Review metadata only."
      }
    });

    expect(missingUpdateResponse.statusCode).toBe(404);
    expect(missingUpdateResponse.json()).toEqual({
      error: "Human review record not found.",
      code: "HUMAN_REVIEW_NOT_FOUND",
      recoveryAction: "Create the human review record before updating it or verify the review ID.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const reviewResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-human-review-errors/reviews",
      payload: {
        targetType: "risk-flag",
        targetId: "risk-1",
        reviewerId: "Counsel",
        comment: "Review deterministic risk flag for audit preparation."
      }
    });
    expect(reviewResponse.statusCode).toBe(201);

    const invalidStatusResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-human-review-errors/reviews/${reviewResponse.json().id}`,
      payload: {
        status: "approved",
        comment: "Do not create legal approval states."
      }
    });

    expect(invalidStatusResponse.statusCode).toBe(400);
    expect(invalidStatusResponse.json()).toEqual({
      error: "Human review status must be requested, under-review, reviewed, rejected, or needs-more-evidence.",
      code: "HUMAN_REVIEW_UPDATE_FAILED",
      recoveryAction: "Use a supported review status and keep decisions as audit-prep workflow metadata.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(await repository.listHumanReviewRecords("workspace-human-review-errors")).toEqual([
      expect.objectContaining({ id: reviewResponse.json().id, status: "requested" })
    ]);

    const rejectedEvidence = createEvidenceVaultRecordFromUpload({
      workspaceId: "workspace-human-review-errors",
      filename: "rejected-custody-controls.pdf",
      mimeType: "application/pdf",
      bytes: new TextEncoder().encode("rejected custody controls metadata"),
      owner: "Ops",
      sourceNote: "Rejected evidence should require replacement.",
      linkedRiskFlagIds: ["custody-controls"],
      linkedControlIds: ["control-custody-controls"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-30T00:00:00.000Z"
    });
    await repository.saveEvidenceVaultRecord({ ...rejectedEvidence, status: "rejected" });

    const evidenceReviewResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-human-review-errors/reviews",
      payload: {
        targetType: "evidence",
        targetId: rejectedEvidence.id,
        reviewerId: "Counsel",
        comment: "Review rejected evidence status."
      }
    });
    expect(evidenceReviewResponse.statusCode).toBe(201);

    const blockedSyncResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-human-review-errors/reviews/${evidenceReviewResponse.json().id}`,
      payload: {
        status: "reviewed",
        comment: "Trying to mark rejected evidence as reviewed should be blocked."
      }
    });

    expect(blockedSyncResponse.statusCode).toBe(409);
    expect(blockedSyncResponse.json()).toEqual({
      error: "Rejected Evidence Vault records cannot be directly moved to verified.",
      code: "HUMAN_REVIEW_LINKED_EVIDENCE_TRANSITION_BLOCKED",
      recoveryAction: "Upload a replacement from the rejected evidence recovery flow so parent/child lineage is preserved.",
      notLegalAdviceBoundary: "Not legal advice. Evidence status transitions are audit preparation workflow metadata only."
    });

    await server.close();
    await repository.close();
  });
});
