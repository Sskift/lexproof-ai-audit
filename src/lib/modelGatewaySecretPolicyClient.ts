import type {
  ModelGatewaySecretPolicyControl,
  ModelGatewaySecretPolicyDraft,
  ModelGatewaySecretPolicyReport
} from "./modelGatewaySecretPolicy";
import type { ModelGatewayProviderPolicyStatus } from "./modelGatewayProviderPolicy";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import { redactIntegrationPolicyReport } from "./integrationPolicyReportRedaction";

export type FetchModelGatewaySecretPolicyReportInput = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  policy: ModelGatewaySecretPolicyDraft;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Model Gateway secret policy is audit preparation metadata only.";
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only.";
const ALLOWED_STATUSES: ModelGatewayProviderPolicyStatus[] = ["ready", "needs-policy", "blocked", "disabled"];

export class ModelGatewaySecretPolicyClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(message: string, options?: Partial<Pick<ModelGatewaySecretPolicyClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>) {
    super(message);
    this.name = "ModelGatewaySecretPolicyClientError";
    this.code = options?.code ?? "MODEL_GATEWAY_SECRET_POLICY_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Retry secret policy evaluation after the Phase 2 API is reachable.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchModelGatewaySecretPolicyReport({
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis),
  policy
}: FetchModelGatewaySecretPolicyReportInput): Promise<ModelGatewaySecretPolicyReport> {
  if (!fetcher) {
    throw new ModelGatewaySecretPolicyClientError("Fetch is required to evaluate Model Gateway secret policy.", {
      code: "MODEL_GATEWAY_SECRET_POLICY_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildSecretPolicyUrl(apiBaseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ policy: createSecretPolicyPayload(policy) })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new ModelGatewaySecretPolicyClientError(errorPayload.error ?? "Secret policy evaluation failed.", {
      code: errorPayload.code ?? "MODEL_GATEWAY_SECRET_POLICY_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry secret policy evaluation.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateSecretPolicyReport(payload);
}

function buildSecretPolicyUrl(apiBaseUrl: string | undefined): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/model-gateway/secret-policy`;
}

function createSecretPolicyPayload(policy: ModelGatewaySecretPolicyDraft): ModelGatewaySecretPolicyDraft {
  return {
    policyOwner: policy.policyOwner,
    kmsBackedStorageApproved: policy.kmsBackedStorageApproved,
    rotationDays: policy.rotationDays,
    accessReviewCadence: policy.accessReviewCadence,
    providerAllowlistApproved: policy.providerAllowlistApproved,
    egressLoggingApproved: policy.egressLoggingApproved,
    incidentResponseRunbookApproved: policy.incidentResponseRunbookApproved,
    noClientSecretPersistence: policy.noClientSecretPersistence,
    humanReviewRequired: policy.humanReviewRequired,
    notes: policy.notes
  };
}

function validateSecretPolicyReport(payload: unknown): ModelGatewaySecretPolicyReport {
  if (!isRecord(payload)) {
    throw invalidResponseError("Secret policy response must be a JSON object.");
  }

  if (payload.reportVersion !== "lexproof-model-gateway-secret-policy-v1") {
    throw invalidResponseError("Secret policy response has an unsupported report version.");
  }

  if (payload.notLegalAdviceBoundary !== NOT_LEGAL_ADVICE_BOUNDARY) {
    throw invalidResponseError("Secret policy response is missing the required Not legal advice boundary.");
  }

  if (payload.externalProviderProxyingAllowed !== false) {
    throw invalidResponseError("Secret policy response must keep external provider proxying disabled.");
  }

  if (payload.overallStatus !== "ready" && payload.overallStatus !== "needs-policy" && payload.overallStatus !== "blocked") {
    throw invalidResponseError("Secret policy response has an invalid overall status.");
  }

  if (
    payload.externalProviderProxyingStatus !== "needs-policy" &&
    payload.externalProviderProxyingStatus !== "policy-ready-not-enabled" &&
    payload.externalProviderProxyingStatus !== "blocked-by-metadata"
  ) {
    throw invalidResponseError("Secret policy response has an invalid proxying status.");
  }

  if (!Array.isArray(payload.controls) || !payload.controls.every(isSecretPolicyControl)) {
    throw invalidResponseError("Secret policy response has invalid control metadata.");
  }

  if (!isNonEmptyStringArray(payload.nextActions)) {
    throw invalidResponseError("Secret policy response has invalid next actions.");
  }

  return redactIntegrationPolicyReport(payload as ModelGatewaySecretPolicyReport);
}

function isSecretPolicyControl(value: unknown): value is ModelGatewaySecretPolicyControl {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isProviderPolicyStatus(value.status) &&
    typeof value.evidence === "string" &&
    typeof value.recoveryAction === "string"
  );
}

function isProviderPolicyStatus(value: unknown): value is ModelGatewayProviderPolicyStatus {
  return typeof value === "string" && ALLOWED_STATUSES.includes(value as ModelGatewayProviderPolicyStatus);
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((action) => typeof action === "string" && action.trim().length > 0)
  );
}

function invalidResponseError(message: string): ModelGatewaySecretPolicyClientError {
  return new ModelGatewaySecretPolicyClientError(message, {
    code: "MODEL_GATEWAY_SECRET_POLICY_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning the metadata-only secret policy contract.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
