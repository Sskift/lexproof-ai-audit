import type { RegulatorySourceApprovalItem, RegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import type { RegulatorySourceApprovalRecord, RegulatorySourceApprovalSyncResult } from "./phase2Types";
import type { ServerRegulatorySourceApprovalPacket, ServerRegulatorySourceApprovalPacketRecord } from "./regulatorySourceApprovalSync";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import { classifyDataBoundaryText, type ClassifiedDataClass } from "./dataClassification";
import {
  redactRegulatorySourceApprovalPacket,
  redactRegulatorySourceApprovalRecords,
  redactRegulatorySourceApprovalSyncResult
} from "./regulatorySourceApprovalRedaction";

export type SyncRegulatorySourceApprovalQueueInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  queue: RegulatorySourceApprovalQueue;
  createdBy: string;
  fetcher?: typeof fetch;
};

export type FetchRegulatorySourceApprovalRecordsInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  fetcher?: typeof fetch;
};

export type FetchRegulatorySourceApprovalPacketInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  fetcher?: typeof fetch;
};

const QUEUE_BOUNDARY = "Not legal advice. Source update approvals are audit preparation workflow metadata only." as const;
const RECORD_BOUNDARY = "Not legal advice. Source approval records are audit preparation workflow metadata only." as const;
const SERVER_PACKET_BOUNDARY = "Not legal advice. Server Source Approval packets are audit preparation workflow metadata only." as const;
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const APPROVAL_GATE =
  "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata." as const;
const blockedSourceMetadataClasses: ClassifiedDataClass[] = ["credential-material", "private-key-material", "raw-kyc"];

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
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new RegulatorySourceApprovalClientError(errorPayload.error ?? "Source approval sync failed.", {
      code: errorPayload.code ?? "SOURCE_APPROVAL_SYNC_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry source approval sync.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactRegulatorySourceApprovalSyncResult(validateSyncResult(payload));
}

export async function fetchRegulatorySourceApprovalRecords({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchRegulatorySourceApprovalRecordsInput): Promise<RegulatorySourceApprovalRecord[]> {
  if (!fetcher) {
    throw new RegulatorySourceApprovalClientError("Fetch is required to refresh source approval records.", {
      code: "SOURCE_APPROVAL_RECORDS_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildSourceApprovalUrl(apiBaseUrl, workspaceId), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new RegulatorySourceApprovalClientError(errorPayload.error ?? "Source approval record refresh failed.", {
      code: errorPayload.code ?? "SOURCE_APPROVAL_RECORD_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry source approval record refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactRegulatorySourceApprovalRecords(validateSourceApprovalRecords(payload));
}

export async function fetchRegulatorySourceApprovalPacket({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchRegulatorySourceApprovalPacketInput): Promise<ServerRegulatorySourceApprovalPacket> {
  if (!fetcher) {
    throw new RegulatorySourceApprovalClientError("Fetch is required to refresh the source approval packet.", {
      code: "SOURCE_APPROVAL_PACKET_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildSourceApprovalPacketUrl(apiBaseUrl, workspaceId), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new RegulatorySourceApprovalClientError(errorPayload.error ?? "Source approval packet refresh failed.", {
      code: errorPayload.code ?? "SOURCE_APPROVAL_PACKET_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry source approval packet refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactRegulatorySourceApprovalPacket(validateSourceApprovalPacket(payload));
}

function buildSourceApprovalUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/source-approvals`;
}

function buildSourceApprovalPacketUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  return `${buildSourceApprovalUrl(apiBaseUrl, workspaceId)}/packet`;
}

function createQueuePayload(queue: RegulatorySourceApprovalQueue): RegulatorySourceApprovalQueue {
  if (queue.queueVersion !== "lexproof-regulatory-source-approval-queue-v1") {
    throw invalidSourceApprovalPayloadError("Source approval queue has an unsupported version before sync.");
  }
  if (queue.notLegalAdviceBoundary !== QUEUE_BOUNDARY) {
    throw invalidSourceApprovalPayloadError("Source approval queue is missing the Not legal advice boundary before sync.");
  }

  const items = arrayField(queue.items, "Source approval items").map(createItemPayload);
  const counts = {
    totalItemCount: parseNonNegativeInteger(queue.totalItemCount, "Source approval total item count"),
    approvalRequiredCount: parseNonNegativeInteger(queue.approvalRequiredCount, "Source approval required count"),
    metadataRequiredCount: parseNonNegativeInteger(queue.metadataRequiredCount, "Source approval metadata required count")
  };
  assertSourceApprovalCounts(counts, items);

  return {
    queueVersion: "lexproof-regulatory-source-approval-queue-v1",
    generatedAt: parseMetadataString(queue.generatedAt, "Source approval generated timestamp"),
    status: parseQueueStatus(queue.status, "Source approval queue status"),
    queueHash: parseSha256(queue.queueHash, "Source approval queue hash"),
    totalItemCount: counts.totalItemCount,
    approvalRequiredCount: counts.approvalRequiredCount,
    metadataRequiredCount: counts.metadataRequiredCount,
    items,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

function assertSourceApprovalCounts(
  queue: Pick<RegulatorySourceApprovalQueue, "totalItemCount" | "approvalRequiredCount" | "metadataRequiredCount">,
  items: RegulatorySourceApprovalItem[]
): void {
  const approvalRequiredCount = items.filter((item) => item.approvalStatus === "approval-required").length;
  const metadataRequiredCount = items.filter((item) => item.approvalStatus === "metadata-required").length;

  if (
    queue.totalItemCount !== items.length ||
    queue.approvalRequiredCount !== approvalRequiredCount ||
    queue.metadataRequiredCount !== metadataRequiredCount
  ) {
    throw invalidSourceApprovalPayloadError("Source approval counts must match the approval item statuses before sync.");
  }
}

function createItemPayload(value: unknown, index: number): RegulatorySourceApprovalItem {
  if (!isRecord(value)) {
    throw invalidSourceApprovalPayloadError(`Source approval item ${index + 1} must be a metadata object before sync.`);
  }

  return {
    id: parseMetadataString(value.id, `Source approval item ${index + 1} id`),
    priority: parseSourceApprovalPriority(value.priority, `Source approval item ${index + 1} priority`),
    approvalStatus: parseSourceApprovalStatus(value.approvalStatus, `Source approval item ${index + 1} approval status`),
    reviewStatus: parseSourceReviewStatus(value.reviewStatus, `Source approval item ${index + 1} review status`),
    clauseId: parseMetadataString(value.clauseId, `Source approval item ${index + 1} clause id`),
    jurisdiction: parseMetadataString(value.jurisdiction, `Source approval item ${index + 1} jurisdiction`),
    regulator: parseMetadataString(value.regulator, `Source approval item ${index + 1} regulator`),
    citation: parseMetadataString(value.citation, `Source approval item ${index + 1} citation`),
    sourceName: parseMetadataString(value.sourceName, `Source approval item ${index + 1} source name`),
    sourceUrl: parseMetadataString(value.sourceUrl, `Source approval item ${index + 1} source URL`),
    effectiveAsOf: parseMetadataString(value.effectiveAsOf, `Source approval item ${index + 1} effective date`),
    lastReviewedAt: parseMetadataString(value.lastReviewedAt, `Source approval item ${index + 1} last reviewed date`),
    nextReviewDueAt: parseMetadataString(value.nextReviewDueAt, `Source approval item ${index + 1} next review due date`),
    reviewerNotes: parseMetadataString(value.reviewerNotes, `Source approval item ${index + 1} reviewer notes`),
    nextAction: parseMetadataString(value.nextAction, `Source approval item ${index + 1} next action`),
    approvalGate: parseApprovalGate(value.approvalGate, `Source approval item ${index + 1} approval gate`),
    notLegalAdviceBoundary: parseItemBoundary(value.notLegalAdviceBoundary, `Source approval item ${index + 1} boundary`)
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
  if (payload.notLegalAdviceBoundary !== RECORD_BOUNDARY) {
    throw invalidResponseError("Source approval sync response is missing the Not legal advice boundary.");
  }
  if (!Array.isArray(payload.records) || !payload.records.every(isSourceApprovalRecord)) {
    throw invalidResponseError("Source approval sync response has invalid source approval records.");
  }
  if (!isNonNegativeInteger(payload.syncedCount) || payload.syncedCount !== payload.records.length) {
    throw invalidResponseError("Source approval sync response has an invalid synced count.");
  }

  return payload as RegulatorySourceApprovalSyncResult;
}

function validateSourceApprovalRecords(payload: unknown): RegulatorySourceApprovalRecord[] {
  if (!Array.isArray(payload)) {
    throw invalidResponseError("Source approval record refresh response must be a JSON array.");
  }

  if (!payload.every(isSourceApprovalRecord)) {
    throw invalidResponseError("Source approval record refresh response has invalid metadata records.");
  }

  return payload;
}

function validateSourceApprovalPacket(payload: unknown): ServerRegulatorySourceApprovalPacket {
  if (!isServerSourceApprovalPacket(payload)) {
    throw invalidResponseError("Source approval packet response has invalid metadata.");
  }

  return payload;
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
    isNonEmptyString(value.nextAction) &&
    value.approvalGate === APPROVAL_GATE &&
    value.status === "pending-review" &&
    value.matchingBehaviorChanged === false &&
    typeof value.createdBy === "string" &&
    typeof value.createdAt === "string" &&
    value.notLegalAdviceBoundary === RECORD_BOUNDARY
  );
}

function isServerSourceApprovalPacket(value: unknown): value is ServerRegulatorySourceApprovalPacket {
  if (!isRecord(value)) {
    return false;
  }

  const statusCounts = value.statusCounts;
  const approvalStatusCounts = value.approvalStatusCounts;
  const reviewStatusCounts = value.reviewStatusCounts;
  const priorityCounts = value.priorityCounts;

  return (
    value.packetVersion === "lexproof-server-source-approval-packet-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.generatedAt === "string" &&
    (value.status === "empty" ||
      value.status === "ready" ||
      value.status === "needs-approval" ||
      value.status === "metadata-needed") &&
    isNonNegativeInteger(value.recordCount) &&
    Array.isArray(value.queueHashes) &&
    value.queueHashes.every(isSha256) &&
    isRecord(statusCounts) &&
    isNonNegativeInteger(statusCounts.pendingReview) &&
    isRecord(approvalStatusCounts) &&
    isNonNegativeInteger(approvalStatusCounts.approvalRequired) &&
    isNonNegativeInteger(approvalStatusCounts.metadataRequired) &&
    isRecord(reviewStatusCounts) &&
    isNonNegativeInteger(reviewStatusCounts.current) &&
    isNonNegativeInteger(reviewStatusCounts.reviewDue) &&
    isNonNegativeInteger(reviewStatusCounts.metadataMissing) &&
    isRecord(priorityCounts) &&
    isNonNegativeInteger(priorityCounts.P0) &&
    isNonNegativeInteger(priorityCounts.P1) &&
    value.matchingBehaviorChanged === false &&
    Array.isArray(value.records) &&
    value.records.length === value.recordCount &&
    value.records.every(isServerSourceApprovalPacketRecord) &&
    hasSourceApprovalPacketCountConsistency(
      value.records as ServerRegulatorySourceApprovalPacketRecord[],
      statusCounts,
      approvalStatusCounts,
      reviewStatusCounts,
      priorityCounts
    ) &&
    isNonEmptyStringArray(value.nextActions) &&
    isSha256(value.packetHash) &&
    value.notLegalAdviceBoundary === SERVER_PACKET_BOUNDARY
  );
}

function isServerSourceApprovalPacketRecord(value: unknown): value is ServerRegulatorySourceApprovalPacketRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.recordId === "string" &&
    isSha256(value.queueHash) &&
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
    isNonEmptyString(value.nextAction) &&
    value.approvalGate === APPROVAL_GATE &&
    value.status === "pending-review" &&
    isSha256(value.reviewerNotesHash) &&
    isSha256(value.recordHash) &&
    value.matchingBehaviorChanged === false &&
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

function invalidSourceApprovalPayloadError(message: string): RegulatorySourceApprovalClientError {
  return new RegulatorySourceApprovalClientError(message, {
    code: "SOURCE_APPROVAL_SYNC_INVALID_PAYLOAD",
    recoveryAction: "Regenerate Source Approval Queue metadata from the current source review before syncing.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function parseMetadataString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw invalidSourceApprovalPayloadError(`${label} must be a string before sync.`);
  }

  if (hasBlockedSourceMetadata(value)) {
    throw invalidSourceApprovalPayloadError(`${label} contains credentials, private-key material, or raw KYC before sync.`);
  }

  return value;
}

function parseQueueStatus(value: unknown, label: string): RegulatorySourceApprovalQueue["status"] {
  if (value === "empty" || value === "needs-approval" || value === "needs-metadata") {
    return value;
  }
  throw invalidSourceApprovalPayloadError(`${label} is invalid before sync.`);
}

function parseSourceApprovalPriority(value: unknown, label: string): RegulatorySourceApprovalItem["priority"] {
  if (value === "P0" || value === "P1") {
    return value;
  }
  throw invalidSourceApprovalPayloadError(`${label} is invalid before sync.`);
}

function parseSourceApprovalStatus(value: unknown, label: string): RegulatorySourceApprovalItem["approvalStatus"] {
  if (value === "approval-required" || value === "metadata-required") {
    return value;
  }
  throw invalidSourceApprovalPayloadError(`${label} is invalid before sync.`);
}

function parseSourceReviewStatus(value: unknown, label: string): RegulatorySourceApprovalItem["reviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw invalidSourceApprovalPayloadError(`${label} is invalid before sync.`);
}

function parseApprovalGate(value: unknown, label: string): RegulatorySourceApprovalItem["approvalGate"] {
  if (value === APPROVAL_GATE) {
    return value;
  }
  throw invalidSourceApprovalPayloadError(`${label} is invalid before sync.`);
}

function parseItemBoundary(value: unknown, label: string): RegulatorySourceApprovalItem["notLegalAdviceBoundary"] {
  if (value === QUEUE_BOUNDARY) {
    return value;
  }
  throw invalidSourceApprovalPayloadError(`${label} is missing the Not legal advice boundary before sync.`);
}

function parseNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  throw invalidSourceApprovalPayloadError(`${label} must be a non-negative integer before sync.`);
}

function parseSha256(value: unknown, label: string): string {
  if (typeof value === "string" && /^[a-f0-9]{64}$/.test(value)) {
    return value;
  }
  throw invalidSourceApprovalPayloadError(`${label} must be a SHA-256 hex digest before sync.`);
}

function hasBlockedSourceMetadata(value: string): boolean {
  return classifyDataBoundaryText(value).some((finding) => blockedSourceMetadataClasses.includes(finding.dataClass));
}

function hasSourceApprovalPacketCountConsistency(
  records: ServerRegulatorySourceApprovalPacketRecord[],
  statusCounts: Record<string, unknown>,
  approvalStatusCounts: Record<string, unknown>,
  reviewStatusCounts: Record<string, unknown>,
  priorityCounts: Record<string, unknown>
): boolean {
  return (
    statusCounts.pendingReview === records.filter((record) => record.status === "pending-review").length &&
    approvalStatusCounts.approvalRequired === records.filter((record) => record.approvalStatus === "approval-required").length &&
    approvalStatusCounts.metadataRequired === records.filter((record) => record.approvalStatus === "metadata-required").length &&
    reviewStatusCounts.current === records.filter((record) => record.reviewStatus === "current").length &&
    reviewStatusCounts.reviewDue === records.filter((record) => record.reviewStatus === "review-due").length &&
    reviewStatusCounts.metadataMissing === records.filter((record) => record.reviewStatus === "metadata-missing").length &&
    priorityCounts.P0 === records.filter((record) => record.priority === "P0").length &&
    priorityCounts.P1 === records.filter((record) => record.priority === "P1").length
  );
}

function arrayField(value: unknown, label: string): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  throw invalidSourceApprovalPayloadError(`${label} must be an array before sync.`);
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
