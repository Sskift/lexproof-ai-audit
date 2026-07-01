import type { FastifyInstance } from "fastify";
import { createApiErrorResponse } from "./apiError.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { createAuditLogRecord } from "../src/lib/phase2Types.js";
import {
  createRegulatorySourceReviewSyncResult,
  type CreateRegulatorySourceReviewSyncInput,
  type RegulatorySourceReviewSyncAction,
  type RegulatorySourceReviewSyncItem,
  type RegulatorySourceReviewSyncLedger,
  type RegulatorySourceReviewSyncStatus
} from "../src/lib/regulatorySourceReviewSync.js";

export type SourceReviewRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

const SOURCE_REVIEW_BOUNDARY = "Not legal advice. Source review metadata is audit preparation lineage only." as const;

export function registerSourceReviewRoutes(server: FastifyInstance, options: SourceReviewRoutesOptions): void {
  const { repository } = options;

  server.post<{ Params: { workspaceId: string }; Body: SourceReviewSyncRequestBody }>(
    "/api/workspaces/:workspaceId/source-reviews",
    async (request, reply) => {
      try {
        const result = createRegulatorySourceReviewSyncResult({
          workspaceId: request.params.workspaceId,
          sourceReview: createSourceReviewPayload(request.body?.sourceReview),
          createdBy: stringField(request.body?.createdBy, "Compliance"),
          createdAt: new Date().toISOString()
        } satisfies CreateRegulatorySourceReviewSyncInput);

        await Promise.all(result.records.map((record) => repository.saveRegulatorySourceReviewRecord(record)));
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: stringField(request.body?.createdBy, "Compliance"),
            action: "source-review.synced",
            targetType: "source-review",
            targetId: result.ledgerHash,
            beforeHash: "",
            afterHash: sha256Hex(stableStringify(result.records.map((record) => record.id))),
            summary: `Synced ${result.syncedCount} source review metadata record${result.syncedCount === 1 ? "" : "s"}.`,
            createdAt: new Date().toISOString()
          })
        );

        return reply.status(201).send(result);
      } catch (error) {
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "SOURCE_REVIEW_SYNC_FAILED",
            fallbackMessage: "Source review sync failed.",
            recoveryAction: "Remove credentials, raw KYC, personal data, legal conclusions, and raw source bodies, then retry."
          })
        );
      }
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/source-reviews", async (request) =>
    repository.listRegulatorySourceReviewRecords(request.params.workspaceId)
  );
}

type SourceReviewSyncRequestBody = {
  createdBy?: unknown;
  sourceReview?: unknown;
};

function createSourceReviewPayload(value: unknown): RegulatorySourceReviewSyncLedger {
  if (!isRecord(value)) {
    throw new Error("Source review ledger is required.");
  }

  return {
    status: reviewStatusField(value.status),
    totalSourceCount: numberField(value.totalSourceCount),
    currentSourceCount: numberField(value.currentSourceCount),
    reviewDueCount: numberField(value.reviewDueCount),
    metadataMissingCount: numberField(value.metadataMissingCount),
    reviewWindowDays: numberField(value.reviewWindowDays),
    items: Array.isArray(value.items) ? value.items.map(createItemPayload) : [],
    actions: Array.isArray(value.actions) ? value.actions.map(createActionPayload) : [],
    notLegalAdviceBoundary: SOURCE_REVIEW_BOUNDARY
  };
}

function createItemPayload(value: unknown): RegulatorySourceReviewSyncItem {
  if (!isRecord(value)) {
    throw new Error("Source review item must be a JSON object.");
  }

  return {
    clauseId: stringField(value.clauseId),
    jurisdiction: stringField(value.jurisdiction),
    regulator: stringField(value.regulator),
    citation: stringField(value.citation),
    sourceName: stringField(value.sourceName),
    sourceUrl: stringField(value.sourceUrl),
    effectiveAsOf: stringField(value.effectiveAsOf),
    lastReviewedAt: stringField(value.lastReviewedAt),
    nextReviewDueAt: stringField(value.nextReviewDueAt),
    reviewStatus: reviewStatusField(value.reviewStatus),
    reviewerNotes: stringField(value.reviewerNotes)
  };
}

function createActionPayload(value: unknown): RegulatorySourceReviewSyncAction {
  if (!isRecord(value)) {
    throw new Error("Source review action must be a JSON object.");
  }

  return {
    id: stringField(value.id),
    priority: value.priority === "P0" ? "P0" : "P1",
    action: stringField(value.action),
    clauseId: stringField(value.clauseId),
    sourceUrl: stringField(value.sourceUrl)
  };
}

function stringField(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : fallback;
}

function numberField(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function reviewStatusField(value: unknown): RegulatorySourceReviewSyncStatus {
  if (value === "current" || value === "metadata-missing") {
    return value;
  }
  return "review-due";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
