import type { FastifyInstance } from "fastify";
import { validateEvidenceVaultStatusTransition } from "../src/lib/evidenceVaultWorkflow.js";
import {
  createEvidenceVaultStatusEffectFromHumanReview,
  createModelGatewayReviewStatusEffectFromHumanReview
} from "../src/lib/serverHumanReviewEffects.js";
import { createServerHumanReviewQueueView, type ServerHumanReviewQueueFilters } from "../src/lib/serverHumanReviewQueue.js";
import { createHumanReviewRecord, updateHumanReviewRecord } from "./humanReviewService.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import { createAuditLogRecord, type EvidenceVaultRecord, type HumanReviewRecord } from "../src/lib/phase2Types.js";

export type HumanReviewRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerHumanReviewRoutes(server: FastifyInstance, options: HumanReviewRoutesOptions): void {
  const { repository } = options;

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

  server.get<{ Params: { workspaceId: string }; Querystring: HumanReviewQueueQuery }>(
    "/api/workspaces/:workspaceId/reviews/queue",
    async (request, reply) => {
      try {
        const records = await repository.listHumanReviewRecords(request.params.workspaceId);
        return createServerHumanReviewQueueView({
          workspaceId: request.params.workspaceId,
          records,
          filters: createHumanReviewQueueFilters(request.query)
        });
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Human Review queue lookup failed.",
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
      const evidenceEffect = createEvidenceVaultStatusEffectFromHumanReview(updated);
      const existingEvidence = evidenceEffect
        ? await repository.findEvidenceVaultRecord(request.params.workspaceId, evidenceEffect.targetEvidenceId)
        : null;
      let updatedEvidence: EvidenceVaultRecord | null = null;
      const modelRunEffect = createModelGatewayReviewStatusEffectFromHumanReview(updated);
      const existingModelRun = modelRunEffect
        ? await repository.findModelGatewayRun(request.params.workspaceId, modelRunEffect.targetRunId)
        : null;
      const updatedModelRun =
        modelRunEffect && existingModelRun && existingModelRun.humanReviewStatus !== modelRunEffect.nextStatus
          ? {
              ...existingModelRun,
              humanReviewStatus: modelRunEffect.nextStatus
            }
          : null;

      if (evidenceEffect && existingEvidence && existingEvidence.status !== evidenceEffect.nextStatus) {
        const transition = validateEvidenceVaultStatusTransition(existingEvidence.status, evidenceEffect.nextStatus);

        if (!transition.valid) {
          return reply.status(409).send({
            error: transition.error,
            recoveryAction: transition.recoveryAction,
            notLegalAdviceBoundary: transition.notLegalAdviceBoundary
          });
        }

        updatedEvidence = updateEvidenceVaultRecordFromReview(existingEvidence, {
          status: evidenceEffect.nextStatus,
          sourceNote: evidenceEffect.summary
        });
      }

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
      if (evidenceEffect && existingEvidence && updatedEvidence) {
        await repository.updateEvidenceVaultRecord(updatedEvidence);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: updated.reviewerId,
            action: "evidence.review-status.synced",
            targetType: "evidence",
            targetId: updatedEvidence.id,
            beforeHash: sha256Hex(stableStringify(existingEvidence)),
            afterHash: sha256Hex(stableStringify(updatedEvidence)),
            summary: evidenceEffect.summary,
            createdAt: updated.updatedAt
          })
        );
      }
      if (modelRunEffect && existingModelRun && updatedModelRun) {
        await repository.saveModelGatewayRun(updatedModelRun);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: updated.reviewerId,
            action: "model.run.review-status.synced",
            targetType: "model-run",
            targetId: updatedModelRun.id,
            beforeHash: sha256Hex(stableStringify(existingModelRun)),
            afterHash: sha256Hex(stableStringify(updatedModelRun)),
            summary: modelRunEffect.summary,
            createdAt: updated.updatedAt
          })
        );
      }
      return updated;
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/reviews", async (request) =>
    repository.listHumanReviewRecords(request.params.workspaceId)
  );
}

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

type HumanReviewQueueQuery = {
  targetType?: string;
  status?: string;
  reviewerId?: string;
};

function updateEvidenceVaultRecordFromReview(
  record: EvidenceVaultRecord,
  input: Pick<EvidenceVaultRecord, "status" | "sourceNote">
): EvidenceVaultRecord {
  return {
    ...record,
    status: input.status,
    sourceNote: input.sourceNote,
    version: record.version + 1,
    updatedAt: new Date().toISOString()
  };
}

function createHumanReviewQueueFilters(query: HumanReviewQueueQuery): ServerHumanReviewQueueFilters {
  const filters: ServerHumanReviewQueueFilters = {};
  const targetType = query.targetType?.trim();
  const status = query.status?.trim();
  const reviewerId = query.reviewerId?.trim();

  if (targetType) {
    assertHumanReviewTargetType(targetType);
    filters.targetType = targetType;
  }

  if (status) {
    assertHumanReviewStatus(status);
    filters.status = status;
  }

  if (reviewerId) {
    filters.reviewerId = reviewerId;
  }

  return filters;
}

function assertHumanReviewTargetType(targetType: string): asserts targetType is HumanReviewRecord["targetType"] {
  if (!["risk-flag", "evidence", "model-run", "counsel-pack"].includes(targetType)) {
    throw new Error("Human review target type must be risk-flag, evidence, model-run, or counsel-pack.");
  }
}

function assertHumanReviewStatus(status: string): asserts status is HumanReviewRecord["status"] {
  if (!["requested", "under-review", "reviewed", "rejected", "needs-more-evidence"].includes(status)) {
    throw new Error("Human review status must be requested, under-review, reviewed, rejected, or needs-more-evidence.");
  }
}
