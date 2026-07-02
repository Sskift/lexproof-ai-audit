import { asSafeApiErrorResponse } from "./apiErrorClient";
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

  return validateModelGatewayRunSummaries(payload);
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

  return validateModelGatewayRun(payload);
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
    typeof value.payloadHash === "string" &&
    typeof value.responseHash === "string" &&
    typeof value.sourceEvidenceHash === "string" &&
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
    typeof value.payloadHash === "string" &&
    typeof value.responseHash === "string" &&
    typeof value.sourceEvidenceHash === "string" &&
    isProviderMetadata(value.providerMetadata) &&
    isHumanReviewStatus(value.humanReviewStatus) &&
    typeof value.attempt === "number" &&
    typeof value.maxAttempts === "number" &&
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
