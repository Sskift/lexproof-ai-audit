import type { FastifyInstance } from "fastify";
import { createApiErrorResponse } from "./apiError.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { createAuditLogRecord } from "../src/lib/phase2Types.js";
import {
  createServerRegulatorySourceReviewPacket,
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

export function registerSourceReviewRoutes(server: FastifyInstance, options: SourceReviewRoutesOptions): void {
  const { repository } = options;

  server.post<{ Params: { workspaceId: string }; Body: SourceReviewSyncRequestBody }>(
    "/api/workspaces/:workspaceId/source-reviews",
    async (request, reply) => {
      try {
        const payload = parseSourceReviewSyncRequestBody(request.body);
        const result = createRegulatorySourceReviewSyncResult({
          workspaceId: request.params.workspaceId,
          sourceReview: createSourceReviewPayload(payload.sourceReview),
          createdBy: stringField(payload.createdBy, "Compliance"),
          createdAt: new Date().toISOString()
        } satisfies CreateRegulatorySourceReviewSyncInput);

        await Promise.all(result.records.map((record) => repository.saveRegulatorySourceReviewRecord(record)));
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: stringField(payload.createdBy, "Compliance"),
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

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/source-reviews/packet", async (request) => {
    const records = await repository.listRegulatorySourceReviewRecords(request.params.workspaceId);
    return createServerRegulatorySourceReviewPacket({
      workspaceId: request.params.workspaceId,
      records
    });
  });
}

type SourceReviewSyncRequestBody = unknown;

type ParsedSourceReviewSyncRequestBody = {
  createdBy?: unknown;
  sourceReview?: unknown;
};

function parseSourceReviewSyncRequestBody(value: unknown): ParsedSourceReviewSyncRequestBody {
  if (!isRecord(value)) {
    throw new Error("Source review sync payload must be a JSON object.");
  }

  return {
    createdBy: value.createdBy,
    sourceReview: value.sourceReview
  };
}

function createSourceReviewPayload(value: unknown): RegulatorySourceReviewSyncLedger {
  if (!isRecord(value)) {
    throw new Error("Source review ledger is required.");
  }

  const items = arrayField(value.items, "Source review items").map(createItemPayload);
  const actions = arrayField(value.actions, "Source review actions").map(createActionPayload);

  return {
    status: reviewStatusField(value.status),
    totalSourceCount: numberField(value.totalSourceCount, "Source review total source count is invalid."),
    currentSourceCount: numberField(value.currentSourceCount, "Source review current source count is invalid."),
    reviewDueCount: numberField(value.reviewDueCount, "Source review due count is invalid."),
    metadataMissingCount: numberField(value.metadataMissingCount, "Source review metadata missing count is invalid."),
    reviewWindowDays: numberField(value.reviewWindowDays, "Source review window days is invalid."),
    items,
    actions,
    notLegalAdviceBoundary: stringField(value.notLegalAdviceBoundary) as RegulatorySourceReviewSyncLedger["notLegalAdviceBoundary"]
  };
}

function createItemPayload(value: unknown): RegulatorySourceReviewSyncItem {
  if (!isRecord(value)) {
    throw new Error("Source review item must be a JSON object.");
  }

  return {
    clauseId: requiredStringField(value.clauseId, "Source review item clause ID"),
    jurisdiction: requiredStringField(value.jurisdiction, "Source review item jurisdiction"),
    regulator: requiredStringField(value.regulator, "Source review item regulator"),
    citation: requiredStringField(value.citation, "Source review item citation"),
    sourceName: requiredStringField(value.sourceName, "Source review item source name"),
    sourceUrl: requiredStringField(value.sourceUrl, "Source review item source URL"),
    effectiveAsOf: requiredStringField(value.effectiveAsOf, "Source review item effective date"),
    lastReviewedAt: requiredStringField(value.lastReviewedAt, "Source review item last reviewed date"),
    nextReviewDueAt: requiredStringField(value.nextReviewDueAt, "Source review item next review due date"),
    reviewStatus: reviewStatusField(value.reviewStatus),
    reviewerNotes: requiredStringField(value.reviewerNotes, "Source review reviewer notes")
  };
}

function createActionPayload(value: unknown): RegulatorySourceReviewSyncAction {
  if (!isRecord(value)) {
    throw new Error("Source review action must be a JSON object.");
  }

  return {
    id: requiredStringField(value.id, "Source review action ID"),
    priority: actionPriorityField(value.priority),
    action: requiredStringField(value.action, "Source review action text"),
    clauseId: requiredStringField(value.clauseId, "Source review action clause ID"),
    sourceUrl: requiredStringField(value.sourceUrl, "Source review action source URL")
  };
}

function stringField(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : fallback;
}

function requiredStringField(value: unknown, label: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.replace(/\s+/g, " ").trim();
  }

  throw new Error(`${label} must be a non-empty string.`);
}

function arrayField(value: unknown, label: string): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  throw new Error(`${label} must be an array.`);
}

function numberField(value: unknown, message: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  throw new Error(message);
}

function reviewStatusField(value: unknown): RegulatorySourceReviewSyncStatus {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw new Error("Source review status is invalid.");
}

function actionPriorityField(value: unknown): RegulatorySourceReviewSyncAction["priority"] {
  if (value === "P0" || value === "P1") {
    return value;
  }
  throw new Error("Source review action priority is invalid.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
