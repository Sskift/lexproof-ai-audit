import type { FastifyInstance } from "fastify";
import { createApiErrorResponse } from "./apiError.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { createAuditLogRecord } from "../src/lib/phase2Types.js";
import {
  createRegulatorySourceApprovalSyncResult,
  type RegulatorySourceApprovalSyncItem,
  type RegulatorySourceApprovalSyncQueue
} from "../src/lib/regulatorySourceApprovalSync.js";

export type SourceApprovalRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

const QUEUE_BOUNDARY = "Not legal advice. Source update approvals are audit preparation workflow metadata only." as const;
const APPROVAL_GATE =
  "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata." as const;

export function registerSourceApprovalRoutes(server: FastifyInstance, options: SourceApprovalRoutesOptions): void {
  const { repository } = options;

  server.post<{ Params: { workspaceId: string }; Body: SourceApprovalSyncRequestBody }>(
    "/api/workspaces/:workspaceId/source-approvals",
    async (request, reply) => {
      try {
        const result = createRegulatorySourceApprovalSyncResult({
          workspaceId: request.params.workspaceId,
          queue: createQueuePayload(request.body?.queue),
          createdBy: stringField(request.body?.createdBy, "Compliance"),
          createdAt: new Date().toISOString()
        });

        await Promise.all(result.records.map((record) => repository.saveRegulatorySourceApprovalRecord(record)));
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: stringField(request.body?.createdBy, "Compliance"),
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
}

type SourceApprovalSyncRequestBody = {
  createdBy?: unknown;
  queue?: unknown;
};

function createQueuePayload(value: unknown): RegulatorySourceApprovalSyncQueue {
  if (!isRecord(value)) {
    throw new Error("Source approval queue is required.");
  }

  const items = Array.isArray(value.items) ? value.items.map(createItemPayload) : [];
  return {
    queueVersion: "lexproof-regulatory-source-approval-queue-v1",
    generatedAt: stringField(value.generatedAt),
    status: queueStatusField(value.status),
    totalItemCount: numberField(value.totalItemCount),
    approvalRequiredCount: numberField(value.approvalRequiredCount),
    metadataRequiredCount: numberField(value.metadataRequiredCount),
    items,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

function createItemPayload(value: unknown): RegulatorySourceApprovalSyncItem {
  if (!isRecord(value)) {
    throw new Error("Source approval item must be a JSON object.");
  }

  return {
    id: stringField(value.id),
    priority: priorityField(value.priority),
    approvalStatus: approvalStatusField(value.approvalStatus),
    reviewStatus: reviewStatusField(value.reviewStatus),
    clauseId: stringField(value.clauseId),
    jurisdiction: stringField(value.jurisdiction),
    regulator: stringField(value.regulator),
    citation: stringField(value.citation),
    sourceName: stringField(value.sourceName),
    sourceUrl: stringField(value.sourceUrl),
    effectiveAsOf: stringField(value.effectiveAsOf),
    lastReviewedAt: stringField(value.lastReviewedAt),
    nextReviewDueAt: stringField(value.nextReviewDueAt),
    reviewerNotes: stringField(value.reviewerNotes),
    nextAction: stringField(value.nextAction),
    approvalGate: APPROVAL_GATE,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

function stringField(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : fallback;
}

function numberField(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function queueStatusField(value: unknown): RegulatorySourceApprovalSyncQueue["status"] {
  if (value === "empty" || value === "needs-approval" || value === "needs-metadata") {
    return value;
  }
  return "empty";
}

function priorityField(value: unknown): RegulatorySourceApprovalSyncItem["priority"] {
  return value === "P0" ? "P0" : "P1";
}

function approvalStatusField(value: unknown): RegulatorySourceApprovalSyncItem["approvalStatus"] {
  return value === "metadata-required" ? "metadata-required" : "approval-required";
}

function reviewStatusField(value: unknown): RegulatorySourceApprovalSyncItem["reviewStatus"] {
  if (value === "current" || value === "metadata-missing") {
    return value;
  }
  return "review-due";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
