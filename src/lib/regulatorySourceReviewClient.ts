import type { RegulatorySourceReview, RegulatorySourceReviewAction, RegulatorySourceReviewItem } from "./regulatorySourceReview";
import type { RegulatorySourceReviewRecord, RegulatorySourceReviewSyncResult } from "./phase2Types";
import type { ServerRegulatorySourceReviewPacket, ServerRegulatorySourceReviewPacketRecord } from "./regulatorySourceReviewSync";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import { classifyDataBoundaryText, type ClassifiedDataClass } from "./dataClassification";
import {
  redactRegulatorySourceReviewPacket,
  redactRegulatorySourceReviewSyncResult
} from "./regulatorySourceReviewRedaction";

export type SyncRegulatorySourceReviewLedgerInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  sourceReview: RegulatorySourceReview;
  createdBy: string;
  fetcher?: typeof fetch;
};

export type FetchRegulatorySourceReviewPacketInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  fetcher?: typeof fetch;
};

const SOURCE_REVIEW_BOUNDARY = "Not legal advice. Source review metadata is audit preparation lineage only." as const;
const RECORD_BOUNDARY = "Not legal advice. Source review records are audit preparation lineage metadata only." as const;
const SERVER_PACKET_BOUNDARY = "Not legal advice. Server Source Review packets are audit preparation lineage metadata only." as const;
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const blockedSourceMetadataClasses: ClassifiedDataClass[] = ["credential-material", "private-key-material", "raw-kyc"];

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

  return redactRegulatorySourceReviewSyncResult(validateSyncResult(payload));
}

export async function fetchRegulatorySourceReviewPacket({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchRegulatorySourceReviewPacketInput): Promise<ServerRegulatorySourceReviewPacket> {
  if (!fetcher) {
    throw new RegulatorySourceReviewClientError("Fetch is required to refresh the source review packet.", {
      code: "SOURCE_REVIEW_PACKET_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildSourceReviewPacketUrl(apiBaseUrl, workspaceId), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new RegulatorySourceReviewClientError(errorPayload.error ?? "Source review packet refresh failed.", {
      code: errorPayload.code ?? "SOURCE_REVIEW_PACKET_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry source review packet refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactRegulatorySourceReviewPacket(validateSourceReviewPacket(payload));
}

function buildSourceReviewUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/source-reviews`;
}

function buildSourceReviewPacketUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  return `${buildSourceReviewUrl(apiBaseUrl, workspaceId)}/packet`;
}

function createSourceReviewPayload(sourceReview: RegulatorySourceReview): RegulatorySourceReview {
  if (sourceReview.notLegalAdviceBoundary !== SOURCE_REVIEW_BOUNDARY) {
    throw invalidSourceReviewPayloadError("Source review metadata is missing the Not legal advice boundary before sync.");
  }

  const items = arrayField(sourceReview.items, "Source review items").map(createItemPayload);
  const actions = arrayField(sourceReview.actions, "Source review actions").map(createActionPayload);
  const counts = {
    totalSourceCount: parseNonNegativeInteger(sourceReview.totalSourceCount, "Source review total source count"),
    currentSourceCount: parseNonNegativeInteger(sourceReview.currentSourceCount, "Source review current source count"),
    reviewDueCount: parseNonNegativeInteger(sourceReview.reviewDueCount, "Source review due count"),
    metadataMissingCount: parseNonNegativeInteger(sourceReview.metadataMissingCount, "Source review metadata missing count")
  };
  assertSourceReviewCounts(counts, items);

  return {
    status: parseSourceReviewStatus(sourceReview.status, "Source review status"),
    totalSourceCount: counts.totalSourceCount,
    currentSourceCount: counts.currentSourceCount,
    reviewDueCount: counts.reviewDueCount,
    metadataMissingCount: counts.metadataMissingCount,
    reviewWindowDays: parsePositiveInteger(sourceReview.reviewWindowDays, "Source review window days"),
    items,
    actions,
    notLegalAdviceBoundary: SOURCE_REVIEW_BOUNDARY
  };
}

function assertSourceReviewCounts(
  sourceReview: Pick<RegulatorySourceReview, "totalSourceCount" | "currentSourceCount" | "reviewDueCount" | "metadataMissingCount">,
  items: RegulatorySourceReviewItem[]
): void {
  const currentSourceCount = items.filter((item) => item.reviewStatus === "current").length;
  const reviewDueCount = items.filter((item) => item.reviewStatus === "review-due").length;
  const metadataMissingCount = items.filter((item) => item.reviewStatus === "metadata-missing").length;

  if (
    sourceReview.totalSourceCount !== items.length ||
    sourceReview.currentSourceCount !== currentSourceCount ||
    sourceReview.reviewDueCount !== reviewDueCount ||
    sourceReview.metadataMissingCount !== metadataMissingCount
  ) {
    throw invalidSourceReviewPayloadError("Source review counts must match the review item statuses before sync.");
  }
}

function createItemPayload(value: unknown, index: number): RegulatorySourceReviewItem {
  if (!isRecord(value)) {
    throw invalidSourceReviewPayloadError(`Source review item ${index + 1} must be a metadata object before sync.`);
  }

  return {
    clauseId: parseMetadataString(value.clauseId, `Source review item ${index + 1} clause id`),
    jurisdiction: parseMetadataString(value.jurisdiction, `Source review item ${index + 1} jurisdiction`),
    regulator: parseMetadataString(value.regulator, `Source review item ${index + 1} regulator`),
    citation: parseMetadataString(value.citation, `Source review item ${index + 1} citation`),
    sourceName: parseMetadataString(value.sourceName, `Source review item ${index + 1} source name`),
    sourceUrl: parseMetadataString(value.sourceUrl, `Source review item ${index + 1} source URL`),
    effectiveAsOf: parseMetadataString(value.effectiveAsOf, `Source review item ${index + 1} effective date`),
    lastReviewedAt: parseMetadataString(value.lastReviewedAt, `Source review item ${index + 1} last reviewed date`),
    nextReviewDueAt: parseMetadataString(value.nextReviewDueAt, `Source review item ${index + 1} next review due date`),
    reviewStatus: parseSourceReviewStatus(value.reviewStatus, `Source review item ${index + 1} review status`),
    reviewerNotes: parseMetadataString(value.reviewerNotes, `Source review item ${index + 1} reviewer notes`)
  };
}

function createActionPayload(value: unknown, index: number): RegulatorySourceReviewAction {
  if (!isRecord(value)) {
    throw invalidSourceReviewPayloadError(`Source review action ${index + 1} must be a metadata object before sync.`);
  }

  return {
    id: parseMetadataString(value.id, `Source review action ${index + 1} id`),
    priority: parseSourceReviewActionPriority(value.priority, `Source review action ${index + 1} priority`),
    action: parseMetadataString(value.action, `Source review action ${index + 1} action`),
    clauseId: parseMetadataString(value.clauseId, `Source review action ${index + 1} clause id`),
    sourceUrl: parseMetadataString(value.sourceUrl, `Source review action ${index + 1} source URL`)
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
  if (payload.notLegalAdviceBoundary !== RECORD_BOUNDARY) {
    throw invalidResponseError("Source review sync response is missing the Not legal advice boundary.");
  }
  if (!Array.isArray(payload.records) || !payload.records.every(isSourceReviewRecord)) {
    throw invalidResponseError("Source review sync response has invalid source review records.");
  }
  if (!isNonNegativeInteger(payload.syncedCount) || payload.syncedCount !== payload.records.length) {
    throw invalidResponseError("Source review sync response has an invalid synced count.");
  }

  return payload as RegulatorySourceReviewSyncResult;
}

function validateSourceReviewPacket(payload: unknown): ServerRegulatorySourceReviewPacket {
  if (!isServerSourceReviewPacket(payload)) {
    throw invalidResponseError("Source review packet response has invalid metadata.");
  }

  return payload;
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
    isNonEmptyString(value.nextAction) &&
    (value.status === "current" || value.status === "pending-review" || value.status === "metadata-needed") &&
    value.matchingBehaviorChanged === false &&
    typeof value.createdBy === "string" &&
    typeof value.createdAt === "string" &&
    value.notLegalAdviceBoundary === RECORD_BOUNDARY
  );
}

function isServerSourceReviewPacket(value: unknown): value is ServerRegulatorySourceReviewPacket {
  if (!isRecord(value)) {
    return false;
  }

  const statusCounts = value.statusCounts;
  const reviewStatusCounts = value.reviewStatusCounts;
  const priorityCounts = value.priorityCounts;

  return (
    value.packetVersion === "lexproof-server-source-review-packet-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.generatedAt === "string" &&
    (value.status === "empty" ||
      value.status === "ready" ||
      value.status === "needs-review" ||
      value.status === "metadata-needed") &&
    isNonNegativeInteger(value.recordCount) &&
    Array.isArray(value.ledgerHashes) &&
    value.ledgerHashes.every(isSha256) &&
    isRecord(statusCounts) &&
    isNonNegativeInteger(statusCounts.current) &&
    isNonNegativeInteger(statusCounts.pendingReview) &&
    isNonNegativeInteger(statusCounts.metadataNeeded) &&
    isRecord(reviewStatusCounts) &&
    isNonNegativeInteger(reviewStatusCounts.current) &&
    isNonNegativeInteger(reviewStatusCounts.reviewDue) &&
    isNonNegativeInteger(reviewStatusCounts.metadataMissing) &&
    isRecord(priorityCounts) &&
    isNonNegativeInteger(priorityCounts.P0) &&
    isNonNegativeInteger(priorityCounts.P1) &&
    isNonNegativeInteger(priorityCounts.P2) &&
    value.matchingBehaviorChanged === false &&
    Array.isArray(value.records) &&
    value.records.length === value.recordCount &&
    value.records.every(isServerSourceReviewPacketRecord) &&
    hasSourceReviewPacketCountConsistency(
      value.records as ServerRegulatorySourceReviewPacketRecord[],
      statusCounts,
      reviewStatusCounts,
      priorityCounts
    ) &&
    isNonEmptyStringArray(value.nextActions) &&
    isSha256(value.packetHash) &&
    value.notLegalAdviceBoundary === SERVER_PACKET_BOUNDARY
  );
}

function isServerSourceReviewPacketRecord(value: unknown): value is ServerRegulatorySourceReviewPacketRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.recordId === "string" &&
    isSha256(value.ledgerHash) &&
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
    isNonEmptyString(value.nextAction) &&
    (value.status === "current" || value.status === "pending-review" || value.status === "metadata-needed") &&
    isSha256(value.reviewerNotesHash) &&
    isSha256(value.recordHash) &&
    value.matchingBehaviorChanged === false &&
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

function invalidSourceReviewPayloadError(message: string): RegulatorySourceReviewClientError {
  return new RegulatorySourceReviewClientError(message, {
    code: "SOURCE_REVIEW_SYNC_INVALID_PAYLOAD",
    recoveryAction: "Regenerate Source Review Ledger metadata from the current source graph before syncing.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function parseMetadataString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw invalidSourceReviewPayloadError(`${label} must be a string before sync.`);
  }

  if (hasBlockedSourceMetadata(value)) {
    throw invalidSourceReviewPayloadError(`${label} contains credentials, private-key material, or raw KYC before sync.`);
  }

  return value;
}

function parseSourceReviewStatus(value: unknown, label: string): RegulatorySourceReviewItem["reviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw invalidSourceReviewPayloadError(`${label} is invalid before sync.`);
}

function parseSourceReviewActionPriority(value: unknown, label: string): RegulatorySourceReviewAction["priority"] {
  if (value === "P0" || value === "P1") {
    return value;
  }
  throw invalidSourceReviewPayloadError(`${label} is invalid before sync.`);
}

function parseNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  throw invalidSourceReviewPayloadError(`${label} must be a non-negative integer before sync.`);
}

function parsePositiveInteger(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  throw invalidSourceReviewPayloadError(`${label} must be a positive integer before sync.`);
}

function hasBlockedSourceMetadata(value: string): boolean {
  return classifyDataBoundaryText(value).some((finding) => blockedSourceMetadataClasses.includes(finding.dataClass));
}

function hasSourceReviewPacketCountConsistency(
  records: ServerRegulatorySourceReviewPacketRecord[],
  statusCounts: Record<string, unknown>,
  reviewStatusCounts: Record<string, unknown>,
  priorityCounts: Record<string, unknown>
): boolean {
  return (
    statusCounts.current === records.filter((record) => record.status === "current").length &&
    statusCounts.pendingReview === records.filter((record) => record.status === "pending-review").length &&
    statusCounts.metadataNeeded === records.filter((record) => record.status === "metadata-needed").length &&
    reviewStatusCounts.current === records.filter((record) => record.reviewStatus === "current").length &&
    reviewStatusCounts.reviewDue === records.filter((record) => record.reviewStatus === "review-due").length &&
    reviewStatusCounts.metadataMissing === records.filter((record) => record.reviewStatus === "metadata-missing").length &&
    priorityCounts.P0 === records.filter((record) => record.priority === "P0").length &&
    priorityCounts.P1 === records.filter((record) => record.priority === "P1").length &&
    priorityCounts.P2 === records.filter((record) => record.priority === "P2").length
  );
}

function arrayField(value: unknown, label: string): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  throw invalidSourceReviewPayloadError(`${label} must be an array before sync.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
