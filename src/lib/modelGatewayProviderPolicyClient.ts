import type {
  ModelGatewayProviderPolicyAdapterReport,
  ModelGatewayProviderPolicyControl,
  ModelGatewayProviderPolicyReport,
  ModelGatewayProviderPolicyStatus
} from "./modelGatewayProviderPolicy";

export type FetchModelGatewayProviderPolicyInput = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
};

type ErrorResponse = {
  error?: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Model Gateway provider policy is audit preparation metadata only.";
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only.";
const ALLOWED_STATUSES: ModelGatewayProviderPolicyStatus[] = ["ready", "needs-policy", "blocked", "disabled"];

export class ModelGatewayProviderPolicyClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(message: string, options?: Partial<Pick<ModelGatewayProviderPolicyClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>) {
    super(message);
    this.name = "ModelGatewayProviderPolicyClientError";
    this.code = options?.code ?? "MODEL_GATEWAY_POLICY_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Retry provider policy refresh after the Phase 2 API is reachable.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchModelGatewayProviderPolicy({
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchModelGatewayProviderPolicyInput = {}): Promise<ModelGatewayProviderPolicyReport> {
  if (!fetcher) {
    throw new ModelGatewayProviderPolicyClientError("Fetch is required to refresh Model Gateway provider policy.", {
      code: "MODEL_GATEWAY_POLICY_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildProviderPolicyUrl(apiBaseUrl), { method: "GET" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asErrorResponse(payload);
    throw new ModelGatewayProviderPolicyClientError(errorPayload.error ?? "Provider policy refresh failed.", {
      code: errorPayload.code ?? "MODEL_GATEWAY_POLICY_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry provider policy refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateProviderPolicyReport(payload);
}

function buildProviderPolicyUrl(apiBaseUrl: string | undefined): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/model-gateway/provider-policy`;
}

function validateProviderPolicyReport(payload: unknown): ModelGatewayProviderPolicyReport {
  if (!isRecord(payload)) {
    throw invalidResponseError("Provider policy response must be a JSON object.");
  }

  if (payload.reportVersion !== "lexproof-model-gateway-provider-policy-v1") {
    throw invalidResponseError("Provider policy response has an unsupported report version.");
  }

  if (payload.notLegalAdviceBoundary !== NOT_LEGAL_ADVICE_BOUNDARY) {
    throw invalidResponseError("Provider policy response is missing the required Not legal advice boundary.");
  }

  if (!isProviderPolicyStatus(payload.overallStatus)) {
    throw invalidResponseError("Provider policy response has an invalid overall status.");
  }

  if (!Array.isArray(payload.adapters) || !payload.adapters.every(isProviderPolicyAdapterReport)) {
    throw invalidResponseError("Provider policy response has invalid adapter metadata.");
  }

  if (!Array.isArray(payload.controls) || !payload.controls.every(isProviderPolicyControl)) {
    throw invalidResponseError("Provider policy response has invalid control metadata.");
  }

  if (!Array.isArray(payload.nextActions) || !payload.nextActions.every((action) => typeof action === "string")) {
    throw invalidResponseError("Provider policy response has invalid next actions.");
  }

  return payload as ModelGatewayProviderPolicyReport;
}

function isProviderPolicyAdapterReport(value: unknown): value is ModelGatewayProviderPolicyAdapterReport {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.provider === "string" &&
    typeof value.label === "string" &&
    typeof value.enabled === "boolean" &&
    typeof value.mode === "string" &&
    typeof value.credentialPolicy === "string" &&
    isProviderPolicyStatus(value.status) &&
    typeof value.readinessEvidence === "string" &&
    Array.isArray(value.requiredControls) &&
    value.requiredControls.every((control) => typeof control === "string") &&
    (value.disabledReason === undefined || typeof value.disabledReason === "string")
  );
}

function isProviderPolicyControl(value: unknown): value is ModelGatewayProviderPolicyControl {
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

function invalidResponseError(message: string): ModelGatewayProviderPolicyClientError {
  return new ModelGatewayProviderPolicyClientError(message, {
    code: "MODEL_GATEWAY_POLICY_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning the metadata-only provider policy contract.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function asErrorResponse(value: unknown): ErrorResponse {
  return isRecord(value) ? (value as ErrorResponse) : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
