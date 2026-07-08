import { asSafeApiErrorResponse } from "./apiErrorClient";
import {
  redactModelGatewayRun,
  redactModelGatewayRunRecoveryPacket,
  redactModelGatewayRunSummary
} from "./modelGatewayRunRedaction";
import type { ModelGatewayRunRecoveryPacket, ModelGatewayRunRecoveryPacketItem } from "./modelGatewayRunReceipt";
import type { ModelGatewayRun, ModelGatewayRunSummary } from "./phase2Types";

export type FetchModelGatewayRunsInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  fetcher?: typeof fetch;
};

export type FetchModelGatewayRunInput = FetchModelGatewayRunsInput & {
  runId: string;
};

const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const MODEL_GATEWAY_RUN_BOUNDARY = "AI-assisted draft for audit preparation only. Not legal advice." as const;

export class ModelGatewayRunClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(message: string, options?: Partial<Pick<ModelGatewayRunClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>) {
    super(message);
    this.name = "ModelGatewayRunClientError";
    this.code = options?.code ?? "MODEL_GATEWAY_RUN_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Start the Phase 2 API and retry Model Gateway run refresh.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchModelGatewayRuns({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchModelGatewayRunsInput): Promise<ModelGatewayRunSummary[]> {
  if (!fetcher) {
    throw new ModelGatewayRunClientError("Fetch is required to refresh Model Gateway run records.", {
      code: "MODEL_GATEWAY_RUN_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildModelGatewayRunsUrl(apiBaseUrl, workspaceId), { method: "GET" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw clientErrorFromPayload(payload, "Model Gateway run refresh failed.", "MODEL_GATEWAY_RUN_REFRESH_FAILED");
  }

  return validateModelGatewayRunSummaries(payload).map(redactModelGatewayRunSummary);
}

export async function fetchModelGatewayRun({
  apiBaseUrl,
  workspaceId,
  runId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchModelGatewayRunInput): Promise<ModelGatewayRun> {
  if (!fetcher) {
    throw new ModelGatewayRunClientError("Fetch is required to look up a Model Gateway run record.", {
      code: "MODEL_GATEWAY_RUN_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildModelGatewayRunUrl(apiBaseUrl, workspaceId, runId), { method: "GET" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw clientErrorFromPayload(payload, "Model Gateway run lookup failed.", "MODEL_GATEWAY_RUN_LOOKUP_FAILED");
  }

  return redactModelGatewayRun(validateModelGatewayRun(payload));
}

export async function fetchModelGatewayRunRecoveryPacket({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchModelGatewayRunsInput): Promise<ModelGatewayRunRecoveryPacket> {
  if (!fetcher) {
    throw new ModelGatewayRunClientError("Fetch is required to refresh the Model Gateway run recovery packet.", {
      code: "MODEL_GATEWAY_RUN_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildModelGatewayRunRecoveryPacketUrl(apiBaseUrl, workspaceId), { method: "GET" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw clientErrorFromPayload(payload, "Model Gateway run recovery packet refresh failed.", "MODEL_GATEWAY_RUN_RECOVERY_REFRESH_FAILED");
  }

  return redactModelGatewayRunRecoveryPacket(validateModelGatewayRunRecoveryPacket(payload));
}

export function buildModelGatewayRunsUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  const workspace = workspaceId.trim();
  if (!workspace) {
    throw new ModelGatewayRunClientError("Workspace ID is required to refresh Model Gateway run records.", {
      code: "MODEL_GATEWAY_RUN_WORKSPACE_REQUIRED",
      recoveryAction: "Create or select a Secure Review Workspace before refreshing Model Gateway run records."
    });
  }

  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspace)}/model-runs`;
}

export function buildModelGatewayRunRecoveryPacketUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  return `${buildModelGatewayRunsUrl(apiBaseUrl, workspaceId)}/recovery`;
}

export function buildModelGatewayRunUrl(apiBaseUrl: string | undefined, workspaceId: string, runId: string): string {
  const run = runId.trim();
  if (!run) {
    throw new ModelGatewayRunClientError("Model Gateway run ID is required for lookup.", {
      code: "MODEL_GATEWAY_RUN_ID_REQUIRED",
      recoveryAction: "Select a persisted Model Gateway run before lookup."
    });
  }

  return `${buildModelGatewayRunsUrl(apiBaseUrl, workspaceId)}/${encodeURIComponent(run)}`;
}

function validateModelGatewayRunSummaries(payload: unknown): ModelGatewayRunSummary[] {
  if (!Array.isArray(payload)) {
    throw invalidResponseError("Model Gateway run refresh response must be a JSON array.");
  }

  if (!payload.every(isModelGatewayRunSummary)) {
    throw invalidResponseError("Model Gateway run refresh response contains invalid metadata records.");
  }

  return payload;
}

function validateModelGatewayRun(payload: unknown): ModelGatewayRun {
  if (!isModelGatewayRun(payload)) {
    throw invalidResponseError("Model Gateway run lookup response contains invalid metadata.");
  }

  return payload;
}

function validateModelGatewayRunRecoveryPacket(payload: unknown): ModelGatewayRunRecoveryPacket {
  if (!isModelGatewayRunRecoveryPacket(payload)) {
    throw invalidResponseError("Model Gateway run recovery packet response contains invalid metadata.");
  }

  return payload;
}

function isModelGatewayRunSummary(value: unknown): value is ModelGatewayRunSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.providerLabel === "string" &&
    typeof value.model === "string" &&
    isRunStatus(value.status) &&
    isRedactionStatus(value.redactionStatus) &&
    isHumanReviewStatus(value.humanReviewStatus) &&
    isSha256(value.payloadHash) &&
    isModelGatewayResponseHash(value.responseHash) &&
    isSha256(value.sourceEvidenceHash) &&
    isRetryState(value.retryState) &&
    (value.errorCode === undefined || typeof value.errorCode === "string") &&
    (value.errorMessage === undefined || typeof value.errorMessage === "string") &&
    Array.isArray(value.remediationSteps) &&
    value.remediationSteps.every((step) => typeof step === "string") &&
    typeof value.requiresHumanReview === "boolean" &&
    value.boundary === MODEL_GATEWAY_RUN_BOUNDARY
  );
}

function isModelGatewayRun(value: unknown): value is ModelGatewayRun {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.recordVersion === "lexproof-model-gateway-run-v1" &&
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    isProvider(value.provider) &&
    typeof value.providerLabel === "string" &&
    typeof value.model === "string" &&
    typeof value.purpose === "string" &&
    isRunStatus(value.status) &&
    isRedactionStatus(value.redactionStatus) &&
    isSha256(value.payloadHash) &&
    isModelGatewayResponseHash(value.responseHash) &&
    isSha256(value.sourceEvidenceHash) &&
    isProviderMetadata(value.providerMetadata) &&
    isHumanReviewStatus(value.humanReviewStatus) &&
    isPositiveInteger(value.attempt) &&
    isPositiveInteger(value.maxAttempts) &&
    value.attempt <= value.maxAttempts &&
    isRetryState(value.retryState) &&
    (value.errorCode === undefined || typeof value.errorCode === "string") &&
    (value.errorMessage === undefined || typeof value.errorMessage === "string") &&
    Array.isArray(value.remediationSteps) &&
    value.remediationSteps.every((step) => typeof step === "string") &&
    typeof value.createdAt === "string" &&
    (value.completedAt === undefined || typeof value.completedAt === "string") &&
    value.notLegalAdviceBoundary === MODEL_GATEWAY_RUN_BOUNDARY
  );
}

function isModelGatewayRunRecoveryPacket(value: unknown): value is ModelGatewayRunRecoveryPacket {
  if (!isRecord(value)) {
    return false;
  }

  const items = Array.isArray(value.items) ? value.items : [];
  const blockedCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "blocked").length;
  const retryAvailableCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "retry-available").length;
  const needsHumanReviewCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "needs-human-review").length;
  const readyCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "ready").length;
  const recoveryItemCount = items.filter((item) => isRecord(item) && item.recoveryStatus !== "ready").length;

  return (
    value.packetVersion === "lexproof-model-gateway-run-recovery-packet-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.generatedAt === "string" &&
    isSha256(value.packetHash) &&
    isNonNegativeInteger(value.runCount) &&
    value.runCount === items.length &&
    isNonNegativeInteger(value.recoveryItemCount) &&
    value.recoveryItemCount === recoveryItemCount &&
    isNonNegativeInteger(value.blockedCount) &&
    value.blockedCount === blockedCount &&
    isNonNegativeInteger(value.retryAvailableCount) &&
    value.retryAvailableCount === retryAvailableCount &&
    isNonNegativeInteger(value.needsHumanReviewCount) &&
    value.needsHumanReviewCount === needsHumanReviewCount &&
    isNonNegativeInteger(value.readyCount) &&
    value.readyCount === readyCount &&
    (value.latestRunId === undefined || typeof value.latestRunId === "string") &&
    isNonEmptyStringArray(value.nextActions) &&
    items.every(isModelGatewayRunRecoveryPacketItem) &&
    value.notLegalAdviceBoundary === "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
  );
}

function isModelGatewayRunRecoveryPacketItem(value: unknown): value is ModelGatewayRunRecoveryPacketItem {
  if (!isRecord(value) || !isRecord(value.hashes)) {
    return false;
  }

  return (
    typeof value.runId === "string" &&
    typeof value.providerLabel === "string" &&
    typeof value.model === "string" &&
    isRunStatus(value.status) &&
    isRedactionStatus(value.redactionStatus) &&
    isHumanReviewStatus(value.humanReviewStatus) &&
    isRetryState(value.retryState) &&
    typeof value.requiresHumanReview === "boolean" &&
    isRecoveryStatus(value.recoveryStatus) &&
    isRecoveryPriority(value.priority) &&
    typeof value.recoveryAction === "string" &&
    isRecoveryHash(value.hashes.payloadHash) &&
    isRecoveryHash(value.hashes.responseHash) &&
    isRecoveryHash(value.hashes.sourceEvidenceHash) &&
    (value.errorCode === undefined || typeof value.errorCode === "string") &&
    (value.errorMessage === undefined || typeof value.errorMessage === "string") &&
    Array.isArray(value.remediationSteps) &&
    value.remediationSteps.every((step) => typeof step === "string") &&
    (value.createdAt === undefined || typeof value.createdAt === "string") &&
    (value.completedAt === undefined || typeof value.completedAt === "string") &&
    value.notLegalAdviceBoundary ===
      "Not legal advice. Model Gateway run recovery items are audit preparation workflow metadata only."
  );
}

function isProviderMetadata(value: unknown): value is ModelGatewayRun["providerMetadata"] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.adapterMode === "local-mock" || value.adapterMode === "external-provider-placeholder") &&
    (value.credentialPolicy === "no credentials accepted" ||
      value.credentialPolicy === "deferred until server-side secret policy is approved") &&
    value.secretPolicy === "No model provider secrets are accepted or persisted by the server gateway." &&
    Array.isArray(value.allowedDataClasses) &&
    value.allowedDataClasses.every((item) => typeof item === "string")
  );
}

function isProvider(value: unknown): value is ModelGatewayRun["provider"] {
  return value === "mock" || value === "openai-compatible" || value === "enterprise-proxy";
}

function isRunStatus(value: unknown): value is ModelGatewayRunSummary["status"] {
  return value === "queued" || value === "blocked" || value === "completed" || value === "failed";
}

function isRedactionStatus(value: unknown): value is ModelGatewayRunSummary["redactionStatus"] {
  return value === "clean" || value === "needs-review" || value === "blocked";
}

function isHumanReviewStatus(value: unknown): value is ModelGatewayRunSummary["humanReviewStatus"] {
  return value === "not-required" || value === "needs-review" || value === "reviewed" || value === "rejected";
}

function isRetryState(value: unknown): value is ModelGatewayRunSummary["retryState"] {
  return (
    value === "not-needed" ||
    value === "retry-available" ||
    value === "blocked-until-remediated" ||
    value === "blocked-until-policy-change"
  );
}

function isRecoveryStatus(value: unknown): value is ModelGatewayRunRecoveryPacketItem["recoveryStatus"] {
  return value === "blocked" || value === "retry-available" || value === "needs-human-review" || value === "ready";
}

function isRecoveryPriority(value: unknown): value is ModelGatewayRunRecoveryPacketItem["priority"] {
  return value === "P0" || value === "P1" || value === "P2" || value === "P3";
}

function clientErrorFromPayload(payload: unknown, fallbackMessage: string, fallbackCode: string): ModelGatewayRunClientError {
  const errorPayload = asSafeApiErrorResponse(payload);
  return new ModelGatewayRunClientError(errorPayload.error ?? fallbackMessage, {
    code: errorPayload.code ?? fallbackCode,
    recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry Model Gateway run refresh.",
    notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
  });
}

function invalidResponseError(message: string): ModelGatewayRunClientError {
  return new ModelGatewayRunClientError(message, {
    code: "MODEL_GATEWAY_RUN_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning metadata-only Model Gateway run records.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isModelGatewayResponseHash(value: unknown): value is string {
  return value === "" || isSha256(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
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

function isRecoveryHash(value: unknown): value is string {
  return value === "not-available" || isSha256(value);
}
