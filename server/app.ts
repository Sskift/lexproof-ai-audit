import Fastify from "fastify";
import { createModelGatewayRun } from "./modelGatewayService.js";
import { createMemoryReviewWorkspaceRepository, type ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { createAuditLogRecord, createModelGatewayRunSummary, type HumanReviewRecord } from "../src/lib/phase2Types.js";
import { createHumanReviewRecord, updateHumanReviewRecord } from "./humanReviewService.js";

export type BuildServerOptions = {
  repository?: ReviewWorkspaceRepository;
};

export function buildServer(options: BuildServerOptions = {}) {
  const server = Fastify({ logger: false });
  const repository = options.repository ?? createMemoryReviewWorkspaceRepository();

  server.addHook("onClose", async () => {
    await repository.close();
  });

  server.get("/api/health", async () => ({
    status: "ok",
    service: "lexproof-secure-review-workspace-api",
    version: "lexproof-phase-2-backend-v1",
    capabilities: {
      modelGateway: "mock-run-ready",
      evidenceVault: "metadata-hashing-ready",
      humanReview: "repository-ready",
      auditLog: "repository-ready"
    },
    notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
  }));

  server.post<{ Params: { workspaceId: string }; Body: ModelGatewayRequestBody }>(
    "/api/workspaces/:workspaceId/model-runs",
    async (request, reply) => {
      const result = createModelGatewayRun({
        workspaceId: request.params.workspaceId,
        provider: request.body.provider,
        model: request.body.model,
        purpose: request.body.purpose,
        redactionStatus: request.body.redactionStatus,
        includesCredentialMaterial: request.body.includesCredentialMaterial,
        includesRawKycOrPersonalData: request.body.includesRawKycOrPersonalData,
        humanReviewOwner: request.body.humanReviewOwner,
        payload: request.body.payload
      });

      if (!result.valid) {
        return reply.status(400).send({
          error: "Model Gateway boundary failed.",
          errors: result.errors,
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }

      await repository.saveModelGatewayRun(result.run);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: request.params.workspaceId,
          actorId: "system",
          action: "model.run.created",
          targetType: "model-run",
          targetId: result.run.id,
          beforeHash: "",
          afterHash: result.run.responseHash,
          summary: "Created mock model gateway run for audit preparation.",
          createdAt: result.run.createdAt
        })
      );
      return reply.status(201).send(result.run);
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/model-runs", async (request) =>
    (await repository.listModelGatewayRuns(request.params.workspaceId)).map(createModelGatewayRunSummary)
  );

  server.get<{ Params: { workspaceId: string; runId: string } }>(
    "/api/workspaces/:workspaceId/model-runs/:runId",
    async (request, reply) => {
      const run = await repository.findModelGatewayRun(request.params.workspaceId, request.params.runId);
      if (!run) {
        return reply.status(404).send({ error: "Model Gateway run not found." });
      }
      return run;
    }
  );

  server.post<{ Params: { workspaceId: string }; Body: HumanReviewRequestBody }>(
    "/api/workspaces/:workspaceId/reviews",
    async (request, reply) => {
      try {
        const review = createHumanReviewRecord({
          workspaceId: request.params.workspaceId,
          targetType: request.body.targetType,
          targetId: request.body.targetId,
          reviewerId: request.body.reviewerId,
          comment: request.body.comment
        });
        await repository.saveHumanReviewRecord(review);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: review.reviewerId,
            action: "human-review.created",
            targetType: "human-review",
            targetId: review.id,
            beforeHash: "",
            afterHash: review.id,
            summary: "Created human review request.",
            createdAt: review.createdAt
          })
        );
        return reply.status(201).send(review);
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Human review request failed.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }
    }
  );

  server.patch<{ Params: { workspaceId: string; reviewId: string }; Body: HumanReviewUpdateBody }>(
    "/api/workspaces/:workspaceId/reviews/:reviewId",
    async (request, reply) => {
      const reviews = await repository.listHumanReviewRecords(request.params.workspaceId);
      const reviewIndex = reviews.findIndex((item) => item.id === request.params.reviewId);

      if (reviewIndex === -1) {
        return reply.status(404).send({ error: "Human review record not found." });
      }

      const updated = updateHumanReviewRecord(reviews[reviewIndex], {
        status: request.body.status,
        comment: request.body.comment,
        reviewerId: request.body.reviewerId
      });
      await repository.updateHumanReviewRecord(updated);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: request.params.workspaceId,
          actorId: updated.reviewerId,
          action: "human-review.updated",
          targetType: "human-review",
          targetId: updated.id,
          beforeHash: reviews[reviewIndex].status,
          afterHash: updated.status,
          summary: `Updated human review status to ${updated.status}.`,
          createdAt: updated.updatedAt
        })
      );
      return updated;
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/reviews", async (request) =>
    repository.listHumanReviewRecords(request.params.workspaceId)
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/audit-log", async (request) =>
    repository.listAuditLogRecords(request.params.workspaceId)
  );

  return server;
}

type ModelGatewayRequestBody = {
  provider: "mock" | "openai-compatible" | "enterprise-proxy";
  model: string;
  purpose: string;
  redactionStatus: "clean" | "needs-review" | "blocked";
  includesCredentialMaterial: boolean;
  includesRawKycOrPersonalData: boolean;
  humanReviewOwner: string;
  payload: unknown;
};

type HumanReviewRequestBody = {
  targetType: HumanReviewRecord["targetType"];
  targetId: string;
  reviewerId: string;
  comment: string;
};

type HumanReviewUpdateBody = {
  status?: HumanReviewRecord["status"];
  comment?: string;
  reviewerId?: string;
};
