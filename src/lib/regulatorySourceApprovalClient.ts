import type { RegulatorySourceApprovalItem, RegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import type { RegulatorySourceApprovalRecord, RegulatorySourceApprovalSyncResult } from "./phase2Types";

export type SyncRegulatorySourceApprovalQueueInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  queue: RegulatorySourceApprovalQueue;
  createdBy: string;
  fetcher?: typeof fetch;
};

type ErrorResponse = {
  error?: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

const QUEUE_BOUNDARY = "Not legal advice. Source update approvals are audit preparation workflow metadata only." as const;
const RECORD_BOUNDARY = "Not legal advice. Source approval records are audit preparation workflow metadata only." as const;
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const APPROVAL_GATE =
  "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata." as const;

export class RegulatorySourceApprovalClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(
    message: string,
    options?: Partial<Pick<RegulatorySourceApprovalClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>
  ) {
    super(message);
    this.name = "RegulatorySourceApprovalClientError";
    this.code = options?.code ?? "SOURCE_APPROVAL_SYNC_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Start the Phase 2 API and retry source approval sync.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function syncRegulatorySourceApprovalQueue({
  apiBaseUrl,
  workspaceId,
  queue,
  createdBy,
  fetcher = globalThis.fetch?.bind(globalThis)
}: SyncRegulatorySourceApprovalQueueInput): Promise<RegulatorySourceApprovalSyncResult> {
  if (!fetcher) {
    throw new RegulatorySourceApprovalClientError("Fetch is required to sync source approval records.", {
      code: "SOURCE_APPROVAL_SYNC_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildSourceApprovalUrl(apiBaseUrl, workspaceId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      createdBy: createdBy.trim() || "Compliance",
      queue: createQueuePayload(queue)
    })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asErrorResponse(payload);
    throw new RegulatorySourceApprovalClientError(errorPayload.error ?? "Source approval sync failed.", {
      code: errorPayload.code ?? "SOURCE_APPROVAL_SYNC_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry source approval sync.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateSyncResult(payload);
}

function buildSourceApprovalUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/source-approvals`;
}

function createQueuePayload(queue: RegulatorySourceApprovalQueue): RegulatorySourceApprovalQueue {
  return {
    queueVersion: "lexproof-regulatory-source-approval-queue-v1",
    generatedAt: queue.generatedAt,
    status: queue.status,
    totalItemCount: queue.totalItemCount,
    approvalRequiredCount: queue.approvalRequiredCount,
    metadataRequiredCount: queue.metadataRequiredCount,
    items: Array.isArray(queue.items) ? queue.items.map(createItemPayload) : [],
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

function createItemPayload(item: RegulatorySourceApprovalItem): RegulatorySourceApprovalItem {
  return {
    id: item.id,
    priority: item.priority,
    approvalStatus: item.approvalStatus,
    reviewStatus: item.reviewStatus,
    clauseId: item.clauseId,
    jurisdiction: item.jurisdiction,
    regulator: item.regulator,
    citation: item.citation,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    effectiveAsOf: item.effectiveAsOf,
    lastReviewedAt: item.lastReviewedAt,
    nextReviewDueAt: item.nextReviewDueAt,
    reviewerNotes: item.reviewerNotes,
    nextAction: item.nextAction,
    approvalGate: APPROVAL_GATE,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

function validateSyncResult(payload: unknown): RegulatorySourceApprovalSyncResult {
  if (!isRecord(payload)) {
    throw invalidResponseError("Source approval sync response must be a JSON object.");
  }

  if (payload.syncVersion !== "lexproof-source-approval-sync-v1") {
    throw invalidResponseError("Source approval sync response has an unsupported version.");
  }
  if (typeof payload.workspaceId !== "string" || !payload.workspaceId.trim()) {
    throw invalidResponseError("Source approval sync response is missing workspace metadata.");
  }
  if (typeof payload.queueHash !== "string" || !/^[a-f0-9]{64}$/.test(payload.queueHash)) {
    throw invalidResponseError("Source approval sync response is missing a valid queue hash.");
  }
  if (typeof payload.syncedCount !== "number") {
    throw invalidResponseError("Source approval sync response has an invalid synced count.");
  }
  if (payload.notLegalAdviceBoundary !== RECORD_BOUNDARY) {
    throw invalidResponseError("Source approval sync response is missing the Not legal advice boundary.");
  }
  if (!Array.isArray(payload.records) || !payload.records.every(isSourceApprovalRecord)) {
    throw invalidResponseError("Source approval sync response has invalid source approval records.");
  }

  return payload as RegulatorySourceApprovalSyncResult;
}

function isSourceApprovalRecord(value: unknown): value is RegulatorySourceApprovalRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.recordVersion === "lexproof-source-approval-record-v1" &&
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    typeof value.queueHash === "string" &&
    /^[a-f0-9]{64}$/.test(value.queueHash) &&
    typeof value.sourceApprovalItemId === "string" &&
    typeof value.clauseId === "string" &&
    typeof value.jurisdiction === "string" &&
    typeof value.regulator === "string" &&
    typeof value.citation === "string" &&
    typeof value.sourceName === "string" &&
    typeof value.sourceUrl === "string" &&
    (value.priority === "P0" || value.priority === "P1") &&
    (value.approvalStatus === "approval-required" || value.approvalStatus === "metadata-required") &&
    (value.reviewStatus === "current" || value.reviewStatus === "review-due" || value.reviewStatus === "metadata-missing") &&
    typeof value.effectiveAsOf === "string" &&
    typeof value.lastReviewedAt === "string" &&
    typeof value.nextReviewDueAt === "string" &&
    typeof value.reviewerNotes === "string" &&
    typeof value.nextAction === "string" &&
    value.approvalGate === APPROVAL_GATE &&
    value.status === "pending-review" &&
    value.matchingBehaviorChanged === false &&
    typeof value.createdBy === "string" &&
    typeof value.createdAt === "string" &&
    value.notLegalAdviceBoundary === RECORD_BOUNDARY
  );
}

function invalidResponseError(message: string): RegulatorySourceApprovalClientError {
  return new RegulatorySourceApprovalClientError(message, {
    code: "SOURCE_APPROVAL_SYNC_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning metadata-only source approval records.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function asErrorResponse(value: unknown): ErrorResponse {
  return isRecord(value) ? (value as ErrorResponse) : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
