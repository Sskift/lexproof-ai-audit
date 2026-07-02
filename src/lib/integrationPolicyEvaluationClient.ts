import { asSafeApiErrorResponse } from "./apiErrorClient";
import {
  isIntegrationPolicyEvaluationRecord,
  type IntegrationPolicyEvaluationRecord
} from "./integrationPolicyEvaluation";

export type FetchIntegrationPolicyEvaluationRecordsInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  fetcher?: typeof fetch;
};

const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;

export class IntegrationPolicyEvaluationClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(
    message: string,
    options?: Partial<Pick<IntegrationPolicyEvaluationClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>
  ) {
    super(message);
    this.name = "IntegrationPolicyEvaluationClientError";
    this.code = options?.code ?? "INTEGRATION_POLICY_EVALUATION_CLIENT_ERROR";
    this.recoveryAction =
      options?.recoveryAction ?? "Start the Phase 2 API and retry policy evaluation receipt refresh.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchIntegrationPolicyEvaluationRecords({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchIntegrationPolicyEvaluationRecordsInput): Promise<IntegrationPolicyEvaluationRecord[]> {
  if (!fetcher) {
    throw new IntegrationPolicyEvaluationClientError("Fetch is required to refresh policy evaluation receipts.", {
      code: "INTEGRATION_POLICY_EVALUATION_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildIntegrationPolicyEvaluationRecordsUrl(apiBaseUrl, workspaceId), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new IntegrationPolicyEvaluationClientError(errorPayload.error ?? "Policy evaluation receipt refresh failed.", {
      code: errorPayload.code ?? "INTEGRATION_POLICY_EVALUATION_REFRESH_FAILED",
      recoveryAction:
        errorPayload.recoveryAction ?? "Start the Phase 2 API and retry policy evaluation receipt refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateIntegrationPolicyEvaluationRecords(payload);
}

export function buildIntegrationPolicyEvaluationRecordsUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/integration-policy-evaluations`;
}

function validateIntegrationPolicyEvaluationRecords(payload: unknown): IntegrationPolicyEvaluationRecord[] {
  if (!Array.isArray(payload)) {
    throw invalidResponseError("Policy evaluation receipt response must be a JSON array.");
  }

  if (!payload.every(isIntegrationPolicyEvaluationRecord)) {
    throw invalidResponseError("Policy evaluation receipt response contains invalid metadata records.");
  }

  return payload;
}

function invalidResponseError(message: string): IntegrationPolicyEvaluationClientError {
  return new IntegrationPolicyEvaluationClientError(message, {
    code: "INTEGRATION_POLICY_EVALUATION_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning metadata-only policy evaluation receipt records.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}
