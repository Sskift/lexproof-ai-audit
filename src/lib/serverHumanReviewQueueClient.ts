import { asSafeApiErrorResponse } from "./apiErrorClient";
import type {
  ServerHumanReviewQueueFilters,
  ServerHumanReviewQueueView,
  ServerHumanReviewRecoveryItem,
  ServerHumanReviewRecoveryPacket
} from "./serverHumanReviewQueue";
import type { HumanReviewRecord } from "./phase2Types";
import {
  redactServerHumanReviewQueueView,
  redactServerHumanReviewRecoveryPacket
} from "./serverHumanReviewQueueRedaction";

export type FetchServerHumanReviewQueueViewInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  filters?: ServerHumanReviewQueueFilters;
  fetcher?: typeof fetch;
};

export type FetchServerHumanReviewRecoveryPacketInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  fetcher?: typeof fetch;
};

const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const QUEUE_BOUNDARY = "Not legal advice. Human review queues are audit preparation workflow metadata only." as const;
const RECORD_BOUNDARY = "Not legal advice. Human review records track audit preparation workflow status." as const;
const RECOVERY_PACKET_BOUNDARY =
  "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only." as const;
const RECOVERY_ITEM_BOUNDARY =
  "Not legal advice. Server Human Review recovery items are audit preparation workflow metadata only." as const;

export class ServerHumanReviewQueueClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(
    message: string,
    options?: Partial<Pick<ServerHumanReviewQueueClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>
  ) {
    super(message);
    this.name = "ServerHumanReviewQueueClientError";
    this.code = options?.code ?? "SERVER_HUMAN_REVIEW_QUEUE_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Start the Phase 2 API and retry Human Review queue refresh.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchServerHumanReviewQueueView({
  apiBaseUrl,
  workspaceId,
  filters,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchServerHumanReviewQueueViewInput): Promise<ServerHumanReviewQueueView> {
  if (!fetcher) {
    throw new ServerHumanReviewQueueClientError("Fetch is required to refresh the server Human Review queue.", {
      code: "SERVER_HUMAN_REVIEW_QUEUE_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildServerHumanReviewQueueUrl(apiBaseUrl, workspaceId, filters), { method: "GET" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new ServerHumanReviewQueueClientError(errorPayload.error ?? "Human Review queue refresh failed.", {
      code: errorPayload.code ?? "SERVER_HUMAN_REVIEW_QUEUE_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry Human Review queue refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactServerHumanReviewQueueView(validateServerHumanReviewQueueView(payload));
}

export async function fetchServerHumanReviewRecoveryPacket({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchServerHumanReviewRecoveryPacketInput): Promise<ServerHumanReviewRecoveryPacket> {
  if (!fetcher) {
    throw new ServerHumanReviewQueueClientError("Fetch is required to refresh the server Human Review recovery packet.", {
      code: "SERVER_HUMAN_REVIEW_RECOVERY_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildServerHumanReviewRecoveryPacketUrl(apiBaseUrl, workspaceId), { method: "GET" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new ServerHumanReviewQueueClientError(errorPayload.error ?? "Human Review recovery packet refresh failed.", {
      code: errorPayload.code ?? "SERVER_HUMAN_REVIEW_RECOVERY_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry Human Review recovery packet refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactServerHumanReviewRecoveryPacket(validateServerHumanReviewRecoveryPacket(payload));
}

export function buildServerHumanReviewQueueUrl(
  apiBaseUrl: string | undefined,
  workspaceId: string,
  filters?: ServerHumanReviewQueueFilters
): string {
  const workspace = workspaceId.trim();
  if (!workspace) {
    throw new ServerHumanReviewQueueClientError("Workspace ID is required to refresh the server Human Review queue.", {
      code: "SERVER_HUMAN_REVIEW_QUEUE_WORKSPACE_REQUIRED",
      recoveryAction: "Create or select a workspace before refreshing persisted Human Review recovery metadata."
    });
  }

  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  const query = buildQueueQuery(filters);
  return `${base}/api/workspaces/${encodeURIComponent(workspace)}/reviews/queue${query}`;
}

export function buildServerHumanReviewRecoveryPacketUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  const workspace = workspaceId.trim();
  if (!workspace) {
    throw new ServerHumanReviewQueueClientError("Workspace ID is required to refresh the server Human Review recovery packet.", {
      code: "SERVER_HUMAN_REVIEW_RECOVERY_WORKSPACE_REQUIRED",
      recoveryAction: "Create or select a workspace before refreshing persisted Human Review recovery metadata."
    });
  }

  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspace)}/reviews/recovery`;
}

function buildQueueQuery(filters: ServerHumanReviewQueueFilters | undefined): string {
  const search = new URLSearchParams();

  if (filters?.targetType) {
    search.set("targetType", filters.targetType);
  }
  if (filters?.status) {
    search.set("status", filters.status);
  }
  if (filters?.reviewerId?.trim()) {
    search.set("reviewerId", filters.reviewerId.trim());
  }

  const value = search.toString();
  return value ? `?${value}` : "";
}

function validateServerHumanReviewQueueView(payload: unknown): ServerHumanReviewQueueView {
  if (!isServerHumanReviewQueueView(payload)) {
    throw invalidResponseError("Human Review queue response has invalid metadata.");
  }

  return payload;
}

function validateServerHumanReviewRecoveryPacket(payload: unknown): ServerHumanReviewRecoveryPacket {
  if (!isServerHumanReviewRecoveryPacket(payload)) {
    throw invalidResponseError("Human Review recovery packet response has invalid metadata.");
  }

  return payload;
}

function isServerHumanReviewQueueView(value: unknown): value is ServerHumanReviewQueueView {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.queueVersion === "lexproof-server-human-review-queue-v1" &&
    typeof value.workspaceId === "string" &&
    isQueueFilters(value.filters) &&
    isNonNegativeInteger(value.totalCount) &&
    isNonNegativeInteger(value.openCount) &&
    isNonNegativeInteger(value.reviewedCount) &&
    isNonNegativeInteger(value.blockedCount) &&
    isCountMap(value.targetTypeCounts, isHumanReviewTargetType) &&
    isCountMap(value.statusCounts, isHumanReviewStatus) &&
    isCountMap(value.reviewerCounts, (key): key is string => key.length > 0) &&
    isNonEmptyStringArray(value.nextActions) &&
    isServerHumanReviewRecoveryPacket(value.recoveryPacket) &&
    Array.isArray(value.items) &&
    value.items.every(isHumanReviewRecord) &&
    value.notLegalAdviceBoundary === QUEUE_BOUNDARY
  );
}

function isServerHumanReviewRecoveryPacket(value: unknown): value is ServerHumanReviewRecoveryPacket {
  if (!isRecord(value)) {
    return false;
  }

  const summary = value.summary;
  return (
    value.packetVersion === "lexproof-server-human-review-recovery-packet-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.generatedAt === "string" &&
    isSha256(value.packetHash) &&
    (value.status === "ready" || value.status === "needs-recovery") &&
    isRecord(summary) &&
    isNonNegativeInteger(summary.totalRecoveryCount) &&
    isNonNegativeInteger(summary.returnedCount) &&
    isNonNegativeInteger(summary.rejectedCount) &&
    isNonEmptyString(summary.nextAction) &&
    summary.notLegalAdviceBoundary === RECOVERY_PACKET_BOUNDARY &&
    isNonEmptyStringArray(value.nextActions) &&
    Array.isArray(value.items) &&
    value.items.every(isServerHumanReviewRecoveryItem) &&
    value.notLegalAdviceBoundary === RECOVERY_PACKET_BOUNDARY
  );
}

function isServerHumanReviewRecoveryItem(value: unknown): value is ServerHumanReviewRecoveryItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.itemVersion === "lexproof-server-human-review-recovery-item-v1" &&
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    isHumanReviewTargetType(value.targetType) &&
    typeof value.targetId === "string" &&
    typeof value.targetLabel === "string" &&
    typeof value.reviewerId === "string" &&
    (value.status === "needs-more-evidence" || value.status === "rejected") &&
    (value.severity === "blocked" || value.severity === "needs-action") &&
    typeof value.reviewerComment === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.recoveryAction === "string" &&
    value.notLegalAdviceBoundary === RECOVERY_ITEM_BOUNDARY
  );
}

function isHumanReviewRecord(value: unknown): value is HumanReviewRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.recordVersion === "lexproof-human-review-record-v1" &&
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    isHumanReviewTargetType(value.targetType) &&
    typeof value.targetId === "string" &&
    typeof value.reviewerId === "string" &&
    isHumanReviewStatus(value.status) &&
    typeof value.comment === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    value.notLegalAdviceBoundary === RECORD_BOUNDARY
  );
}

function isQueueFilters(value: unknown): value is ServerHumanReviewQueueFilters {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.targetType === undefined || isHumanReviewTargetType(value.targetType)) &&
    (value.status === undefined || isHumanReviewStatus(value.status)) &&
    (value.reviewerId === undefined || typeof value.reviewerId === "string")
  );
}

function isHumanReviewTargetType(value: unknown): value is HumanReviewRecord["targetType"] {
  return (
    value === "risk-flag" ||
    value === "evidence" ||
    value === "model-run" ||
    value === "clause-match" ||
    value === "counsel-pack"
  );
}

function isHumanReviewStatus(value: unknown): value is HumanReviewRecord["status"] {
  return (
    value === "requested" ||
    value === "under-review" ||
    value === "reviewed" ||
    value === "rejected" ||
    value === "needs-more-evidence"
  );
}

function isCountMap(value: unknown, isAllowedKey: (key: string) => boolean): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([key, count]) => isAllowedKey(key) && isNonNegativeInteger(count));
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function invalidResponseError(message: string): ServerHumanReviewQueueClientError {
  return new ServerHumanReviewQueueClientError(message, {
    code: "SERVER_HUMAN_REVIEW_QUEUE_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning metadata-only Human Review queue and recovery packet records.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
