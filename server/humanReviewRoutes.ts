import type { FastifyInstance } from "fastify";
import { validateEvidenceVaultStatusTransition } from "../src/lib/evidenceVaultWorkflow.js";
import {
  createEvidenceVaultStatusEffectFromHumanReview,
  createModelGatewayReviewStatusEffectFromHumanReview
} from "../src/lib/serverHumanReviewEffects.js";
import {
  createServerHumanReviewQueueView,
  createServerHumanReviewRecoveryPacket,
  type ServerHumanReviewQueueFilters
} from "../src/lib/serverHumanReviewQueue.js";
import { createHumanReviewRecord, updateHumanReviewRecord } from "./humanReviewService.js";
import { createApiErrorResponse } from "./apiError.js";
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
        const payload = parseHumanReviewRequestBody(request.body);
        const review = createHumanReviewRecord({
          workspaceId: request.params.workspaceId,
          targetType: payload.targetType,
          targetId: payload.targetId,
          reviewerId: payload.reviewerId,
          comment: payload.comment
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
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "HUMAN_REVIEW_CREATE_FAILED",
            fallbackMessage: "Human review request failed.",
            recoveryAction: "Provide a supported review target, reviewer, and audit-prep comment before creating a review."
          })
        );
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
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "HUMAN_REVIEW_QUEUE_FAILED",
            fallbackMessage: "Human Review queue lookup failed.",
            recoveryAction: "Use targetType risk-flag, evidence, model-run, clause-match, or counsel-pack and a supported review status."
          })
        );
      }
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/reviews/recovery", async (request, reply) => {
    try {
      const records = await repository.listHumanReviewRecords(request.params.workspaceId);

      return createServerHumanReviewRecoveryPacket({
        workspaceId: request.params.workspaceId,
        records
      });
    } catch (error) {
      return reply.status(400).send(
        createApiErrorResponse({
          error,
          code: "HUMAN_REVIEW_RECOVERY_FAILED",
          fallbackMessage: "Human Review recovery packet lookup failed.",
          recoveryAction: "Refresh server Human Review records before downloading recovery metadata."
        })
      );
    }
  });

  server.patch<{ Params: { workspaceId: string; reviewId: string }; Body: HumanReviewUpdateBody }>(
    "/api/workspaces/:workspaceId/reviews/:reviewId",
    async (request, reply) => {
      const reviews = await repository.listHumanReviewRecords(request.params.workspaceId);
      const reviewIndex = reviews.findIndex((item) => item.id === request.params.reviewId);

      if (reviewIndex === -1) {
        return reply.status(404).send(createHumanReviewNotFoundError());
      }

      try {
        const payload = parseHumanReviewUpdateBody(request.body);

        const updated = updateHumanReviewRecord(reviews[reviewIndex], {
          status: payload.status,
          comment: payload.comment,
          reviewerId: payload.reviewerId
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
            return reply.status(409).send(createLinkedEvidenceTransitionError(transition));
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
      } catch (error) {
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "HUMAN_REVIEW_UPDATE_FAILED",
            fallbackMessage: "Human review update failed.",
            recoveryAction: "Use a supported review status and keep decisions as audit-prep workflow metadata."
          })
        );
      }
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/reviews", async (request) =>
    repository.listHumanReviewRecords(request.params.workspaceId)
  );
}

type HumanReviewRequestBody = unknown;

type ParsedHumanReviewRequestBody = {
  targetType: HumanReviewRecord["targetType"];
  targetId: string;
  reviewerId: string;
  comment: string;
};

type HumanReviewUpdateBody = unknown;

type ParsedHumanReviewUpdateBody = {
  status?: HumanReviewRecord["status"];
  comment?: string;
  reviewerId?: string;
};

type HumanReviewQueueQuery = {
  targetType?: unknown;
  status?: unknown;
  reviewerId?: unknown;
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

function parseHumanReviewRequestBody(value: unknown): ParsedHumanReviewRequestBody {
  if (!isRecord(value)) {
    throw new Error("Human review request payload must be a JSON object.");
  }

  const targetType = stringField(value.targetType, "Human review target type must be a string.");
  assertHumanReviewTargetType(targetType);

  return {
    targetType,
    targetId: stringField(value.targetId, "Human review target ID must be a string."),
    reviewerId: stringField(value.reviewerId, "Human review reviewer ID must be a string."),
    comment: stringField(value.comment, "Human review comment must be a string.")
  };
}

function parseHumanReviewUpdateBody(value: unknown): ParsedHumanReviewUpdateBody {
  if (!isRecord(value)) {
    throw new Error("Human review update payload must be a JSON object.");
  }

  return {
    status: optionalHumanReviewStatusField(value.status),
    comment: optionalStringField(value.comment, "Human review update comment must be a string."),
    reviewerId: optionalStringField(value.reviewerId, "Human review update reviewer ID must be a string.")
  };
}

function createHumanReviewQueueFilters(query: HumanReviewQueueQuery): ServerHumanReviewQueueFilters {
  const filters: ServerHumanReviewQueueFilters = {};
  const targetType = optionalQueryStringField(query.targetType, "targetType");
  const status = optionalQueryStringField(query.status, "status");
  const reviewerId = optionalQueryStringField(query.reviewerId, "reviewerId");

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

function optionalQueryStringField(value: unknown, field: keyof HumanReviewQueueQuery): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Human review ${field} filter must be a single string.`);
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function optionalHumanReviewStatusField(value: unknown): HumanReviewRecord["status"] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const status = stringField(value, "Human review status must be a string.");
  assertHumanReviewStatus(status);
  return status;
}

function optionalStringField(value: unknown, message: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return stringField(value, message);
}

function stringField(value: unknown, message: string): string {
  if (typeof value === "string") {
    return value;
  }

  throw new Error(message);
}

function assertHumanReviewTargetType(targetType: string): asserts targetType is HumanReviewRecord["targetType"] {
  if (!["risk-flag", "evidence", "model-run", "clause-match", "counsel-pack"].includes(targetType)) {
    throw new Error("Human review target type must be risk-flag, evidence, model-run, clause-match, or counsel-pack.");
  }
}

function assertHumanReviewStatus(status: string): asserts status is HumanReviewRecord["status"] {
  if (!["requested", "under-review", "reviewed", "rejected", "needs-more-evidence"].includes(status)) {
    throw new Error("Human review status must be requested, under-review, reviewed, rejected, or needs-more-evidence.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createHumanReviewNotFoundError() {
  return createApiErrorResponse({
    error: new Error("Human review record not found."),
    code: "HUMAN_REVIEW_NOT_FOUND",
    fallbackMessage: "Human review record not found.",
    recoveryAction: "Create the human review record before updating it or verify the review ID."
  });
}

function createLinkedEvidenceTransitionError(transition: {
  error: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;
}) {
  return {
    ...createApiErrorResponse({
      error: new Error(transition.error),
      code: "HUMAN_REVIEW_LINKED_EVIDENCE_TRANSITION_BLOCKED",
      fallbackMessage: "Linked Evidence Vault status transition failed.",
      recoveryAction: transition.recoveryAction
    }),
    notLegalAdviceBoundary: transition.notLegalAdviceBoundary
  };
}
