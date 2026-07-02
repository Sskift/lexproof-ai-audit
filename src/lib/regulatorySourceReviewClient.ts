import type { RegulatorySourceReview, RegulatorySourceReviewAction, RegulatorySourceReviewItem } from "./regulatorySourceReview";
import type { RegulatorySourceReviewRecord, RegulatorySourceReviewSyncResult } from "./phase2Types";
import { asSafeApiErrorResponse } from "./apiErrorClient";

export type SyncRegulatorySourceReviewLedgerInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  sourceReview: RegulatorySourceReview;
  createdBy: string;
  fetcher?: typeof fetch;
};

const SOURCE_REVIEW_BOUNDARY = "Not legal advice. Source review metadata is audit preparation lineage only." as const;
const RECORD_BOUNDARY = "Not legal advice. Source review records are audit preparation lineage metadata only." as const;
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;

export class RegulatorySourceReviewClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(
    message: string,
    options?: Partial<Pick<RegulatorySourceReviewClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>
  ) {
    super(message);
    this.name = "RegulatorySourceReviewClientError";
    this.code = options?.code ?? "SOURCE_REVIEW_SYNC_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Start the Phase 2 API and retry source review sync.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function syncRegulatorySourceReviewLedger({
  apiBaseUrl,
  workspaceId,
  sourceReview,
  createdBy,
  fetcher = globalThis.fetch?.bind(globalThis)
}: SyncRegulatorySourceReviewLedgerInput): Promise<RegulatorySourceReviewSyncResult> {
  if (!fetcher) {
    throw new RegulatorySourceReviewClientError("Fetch is required to sync source review records.", {
      code: "SOURCE_REVIEW_SYNC_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildSourceReviewUrl(apiBaseUrl, workspaceId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      createdBy: createdBy.trim() || "Compliance",
      sourceReview: createSourceReviewPayload(sourceReview)
    })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new RegulatorySourceReviewClientError(errorPayload.error ?? "Source review sync failed.", {
      code: errorPayload.code ?? "SOURCE_REVIEW_SYNC_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry source review sync.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateSyncResult(payload);
}

function buildSourceReviewUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/source-reviews`;
}

function createSourceReviewPayload(sourceReview: RegulatorySourceReview): RegulatorySourceReview {
  return {
    status: sourceReview.status,
    totalSourceCount: sourceReview.totalSourceCount,
    currentSourceCount: sourceReview.currentSourceCount,
    reviewDueCount: sourceReview.reviewDueCount,
    metadataMissingCount: sourceReview.metadataMissingCount,
    reviewWindowDays: sourceReview.reviewWindowDays,
    items: Array.isArray(sourceReview.items) ? sourceReview.items.map(createItemPayload) : [],
    actions: Array.isArray(sourceReview.actions) ? sourceReview.actions.map(createActionPayload) : [],
    notLegalAdviceBoundary: SOURCE_REVIEW_BOUNDARY
  };
}

function createItemPayload(item: RegulatorySourceReviewItem): RegulatorySourceReviewItem {
  return {
    clauseId: item.clauseId,
    jurisdiction: item.jurisdiction,
    regulator: item.regulator,
    citation: item.citation,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    effectiveAsOf: item.effectiveAsOf,
    lastReviewedAt: item.lastReviewedAt,
    nextReviewDueAt: item.nextReviewDueAt,
    reviewStatus: item.reviewStatus,
    reviewerNotes: item.reviewerNotes
  };
}

function createActionPayload(action: RegulatorySourceReviewAction): RegulatorySourceReviewAction {
  return {
    id: action.id,
    priority: action.priority,
    action: action.action,
    clauseId: action.clauseId,
    sourceUrl: action.sourceUrl
  };
}

function validateSyncResult(payload: unknown): RegulatorySourceReviewSyncResult {
  if (!isRecord(payload)) {
    throw invalidResponseError("Source review sync response must be a JSON object.");
  }

  if (payload.syncVersion !== "lexproof-source-review-sync-v1") {
    throw invalidResponseError("Source review sync response has an unsupported version.");
  }
  if (typeof payload.workspaceId !== "string" || !payload.workspaceId.trim()) {
    throw invalidResponseError("Source review sync response is missing workspace metadata.");
  }
  if (typeof payload.ledgerHash !== "string" || !/^[a-f0-9]{64}$/.test(payload.ledgerHash)) {
    throw invalidResponseError("Source review sync response is missing a valid ledger hash.");
  }
  if (typeof payload.syncedCount !== "number") {
    throw invalidResponseError("Source review sync response has an invalid synced count.");
  }
  if (payload.notLegalAdviceBoundary !== RECORD_BOUNDARY) {
    throw invalidResponseError("Source review sync response is missing the Not legal advice boundary.");
  }
  if (!Array.isArray(payload.records) || !payload.records.every(isSourceReviewRecord)) {
    throw invalidResponseError("Source review sync response has invalid source review records.");
  }

  return payload as RegulatorySourceReviewSyncResult;
}

function isSourceReviewRecord(value: unknown): value is RegulatorySourceReviewRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.recordVersion === "lexproof-source-review-record-v1" &&
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    typeof value.ledgerHash === "string" &&
    /^[a-f0-9]{64}$/.test(value.ledgerHash) &&
    typeof value.sourceReviewItemId === "string" &&
    typeof value.clauseId === "string" &&
    typeof value.jurisdiction === "string" &&
    typeof value.regulator === "string" &&
    typeof value.citation === "string" &&
    typeof value.sourceName === "string" &&
    typeof value.sourceUrl === "string" &&
    (value.reviewStatus === "current" || value.reviewStatus === "review-due" || value.reviewStatus === "metadata-missing") &&
    (value.priority === "P0" || value.priority === "P1" || value.priority === "P2") &&
    typeof value.effectiveAsOf === "string" &&
    typeof value.lastReviewedAt === "string" &&
    typeof value.nextReviewDueAt === "string" &&
    typeof value.reviewerNotes === "string" &&
    typeof value.nextAction === "string" &&
    (value.status === "current" || value.status === "pending-review" || value.status === "metadata-needed") &&
    value.matchingBehaviorChanged === false &&
    typeof value.createdBy === "string" &&
    typeof value.createdAt === "string" &&
    value.notLegalAdviceBoundary === RECORD_BOUNDARY
  );
}

function invalidResponseError(message: string): RegulatorySourceReviewClientError {
  return new RegulatorySourceReviewClientError(message, {
    code: "SOURCE_REVIEW_SYNC_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning metadata-only source review records.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
