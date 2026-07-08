import type { FastifyInstance } from "fastify";
import { createApiErrorResponse } from "./apiError.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { createAuditLogRecord } from "../src/lib/phase2Types.js";
import {
  createRegulatorySourceApprovalSyncResult,
  createServerRegulatorySourceApprovalPacket,
  type RegulatorySourceApprovalSyncItem,
  type RegulatorySourceApprovalSyncQueue
} from "../src/lib/regulatorySourceApprovalSync.js";

export type SourceApprovalRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerSourceApprovalRoutes(server: FastifyInstance, options: SourceApprovalRoutesOptions): void {
  const { repository } = options;

  server.post<{ Params: { workspaceId: string }; Body: SourceApprovalSyncRequestBody }>(
    "/api/workspaces/:workspaceId/source-approvals",
    async (request, reply) => {
      try {
        const payload = parseSourceApprovalSyncRequestBody(request.body);
        const result = createRegulatorySourceApprovalSyncResult({
          workspaceId: request.params.workspaceId,
          queue: createQueuePayload(payload.queue),
          createdBy: stringField(payload.createdBy, "Compliance"),
          createdAt: new Date().toISOString()
        });

        await Promise.all(result.records.map((record) => repository.saveRegulatorySourceApprovalRecord(record)));
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: stringField(payload.createdBy, "Compliance"),
            action: "source-approval.synced",
            targetType: "source-approval",
            targetId: result.queueHash,
            beforeHash: "",
            afterHash: sha256Hex(stableStringify(result.records.map((record) => record.id))),
            summary: `Synced ${result.syncedCount} source approval metadata record${result.syncedCount === 1 ? "" : "s"}.`,
            createdAt: new Date().toISOString()
          })
        );

        return reply.status(201).send(result);
      } catch (error) {
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "SOURCE_APPROVAL_SYNC_FAILED",
            fallbackMessage: "Source approval sync failed.",
            recoveryAction: "Remove credentials, raw KYC, personal data, legal conclusions, and raw source bodies, then retry."
          })
        );
      }
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/source-approvals", async (request) =>
    repository.listRegulatorySourceApprovalRecords(request.params.workspaceId)
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/source-approvals/packet", async (request) => {
    const records = await repository.listRegulatorySourceApprovalRecords(request.params.workspaceId);
    return createServerRegulatorySourceApprovalPacket({
      workspaceId: request.params.workspaceId,
      records
    });
  });
}

type SourceApprovalSyncRequestBody = unknown;

type ParsedSourceApprovalSyncRequestBody = {
  createdBy?: unknown;
  queue?: unknown;
};

function parseSourceApprovalSyncRequestBody(value: unknown): ParsedSourceApprovalSyncRequestBody {
  if (!isRecord(value)) {
    throw new Error("Source approval sync payload must be a JSON object.");
  }

  return {
    createdBy: value.createdBy,
    queue: value.queue
  };
}

function createQueuePayload(value: unknown): RegulatorySourceApprovalSyncQueue {
  if (!isRecord(value)) {
    throw new Error("Source approval queue is required.");
  }

  const items = arrayField(value.items, "Source approval items").map(createItemPayload);
  return {
    queueVersion: stringField(value.queueVersion) as RegulatorySourceApprovalSyncQueue["queueVersion"],
    generatedAt: stringField(value.generatedAt),
    status: queueStatusField(value.status),
    totalItemCount: numberField(value.totalItemCount, "Source approval total item count is invalid."),
    approvalRequiredCount: numberField(value.approvalRequiredCount, "Source approval required count is invalid."),
    metadataRequiredCount: numberField(value.metadataRequiredCount, "Source approval metadata required count is invalid."),
    items,
    notLegalAdviceBoundary: stringField(value.notLegalAdviceBoundary) as RegulatorySourceApprovalSyncQueue["notLegalAdviceBoundary"]
  };
}

function createItemPayload(value: unknown): RegulatorySourceApprovalSyncItem {
  if (!isRecord(value)) {
    throw new Error("Source approval item must be a JSON object.");
  }

  return {
    id: requiredStringField(value.id, "Source approval item ID"),
    priority: priorityField(value.priority),
    approvalStatus: approvalStatusField(value.approvalStatus),
    reviewStatus: reviewStatusField(value.reviewStatus),
    clauseId: requiredStringField(value.clauseId, "Source approval item clause ID"),
    jurisdiction: requiredStringField(value.jurisdiction, "Source approval item jurisdiction"),
    regulator: requiredStringField(value.regulator, "Source approval item regulator"),
    citation: requiredStringField(value.citation, "Source approval item citation"),
    sourceName: requiredStringField(value.sourceName, "Source approval item source name"),
    sourceUrl: requiredStringField(value.sourceUrl, "Source approval item source URL"),
    effectiveAsOf: requiredStringField(value.effectiveAsOf, "Source approval item effective date"),
    lastReviewedAt: requiredStringField(value.lastReviewedAt, "Source approval item last reviewed date"),
    nextReviewDueAt: requiredStringField(value.nextReviewDueAt, "Source approval item next review due date"),
    reviewerNotes: requiredStringField(value.reviewerNotes, "Source approval reviewer notes"),
    nextAction: requiredStringField(value.nextAction, "Source approval next action"),
    approvalGate: stringField(value.approvalGate) as RegulatorySourceApprovalSyncItem["approvalGate"],
    notLegalAdviceBoundary: stringField(value.notLegalAdviceBoundary) as RegulatorySourceApprovalSyncItem["notLegalAdviceBoundary"]
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

function queueStatusField(value: unknown): RegulatorySourceApprovalSyncQueue["status"] {
  if (value === "empty" || value === "needs-approval" || value === "needs-metadata") {
    return value;
  }
  throw new Error("Source approval queue status is invalid.");
}

function priorityField(value: unknown): RegulatorySourceApprovalSyncItem["priority"] {
  if (value === "P0" || value === "P1") {
    return value;
  }
  throw new Error("Source approval priority is invalid.");
}

function approvalStatusField(value: unknown): RegulatorySourceApprovalSyncItem["approvalStatus"] {
  if (value === "approval-required" || value === "metadata-required") {
    return value;
  }
  throw new Error("Source approval status is invalid.");
}

function reviewStatusField(value: unknown): RegulatorySourceApprovalSyncItem["reviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw new Error("Source review status is invalid.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
