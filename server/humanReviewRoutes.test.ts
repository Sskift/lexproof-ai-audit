import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { createEvidenceVaultRecordFromUpload } from "./evidenceVaultService";
import { registerHumanReviewRoutes } from "./humanReviewRoutes";
import { createModelGatewayRun } from "./modelGatewayService";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

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
      error: "Human review target type must be risk-flag, evidence, model-run, or counsel-pack.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
    await repository.close();
  });
});
