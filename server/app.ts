import Fastify from "fastify";
import { createModelGatewayRun } from "./modelGatewayService.js";
import { createModelGatewayRunSummary, type HumanReviewRecord, type ModelGatewayRun } from "../src/lib/phase2Types.js";
import { createHumanReviewRecord, updateHumanReviewRecord } from "./humanReviewService.js";

export function buildServer() {
  const server = Fastify({ logger: false });
  const modelRuns = new Map<string, ModelGatewayRun[]>();
  const humanReviews = new Map<string, HumanReviewRecord[]>();

  server.get("/api/health", async () => ({
    status: "ok",
    service: "lexproof-secure-review-workspace-api",
    version: "lexproof-phase-2-backend-v1",
    capabilities: {
      modelGateway: "mock-run-ready",
      evidenceVault: "metadata-hashing-ready",
      humanReview: "in-memory-ready",
      auditLog: "contract-only"
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

      modelRuns.set(request.params.workspaceId, [...(modelRuns.get(request.params.workspaceId) ?? []), result.run]);
      return reply.status(201).send(result.run);
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/model-runs", async (request) =>
    (modelRuns.get(request.params.workspaceId) ?? []).map(createModelGatewayRunSummary)
  );

  server.get<{ Params: { workspaceId: string; runId: string } }>(
    "/api/workspaces/:workspaceId/model-runs/:runId",
    async (request, reply) => {
      const run = (modelRuns.get(request.params.workspaceId) ?? []).find((item) => item.id === request.params.runId);
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
        humanReviews.set(request.params.workspaceId, [...(humanReviews.get(request.params.workspaceId) ?? []), review]);
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
      const reviews = humanReviews.get(request.params.workspaceId) ?? [];
      const reviewIndex = reviews.findIndex((item) => item.id === request.params.reviewId);

      if (reviewIndex === -1) {
        return reply.status(404).send({ error: "Human review record not found." });
      }

      const updated = updateHumanReviewRecord(reviews[reviewIndex], {
        status: request.body.status,
        comment: request.body.comment,
        reviewerId: request.body.reviewerId
      });
      const nextReviews = [...reviews];
      nextReviews[reviewIndex] = updated;
      humanReviews.set(request.params.workspaceId, nextReviews);
      return updated;
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/reviews", async (request) =>
    humanReviews.get(request.params.workspaceId) ?? []
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
