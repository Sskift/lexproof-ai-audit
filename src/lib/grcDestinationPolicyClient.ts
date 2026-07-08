import type {
  GrcDestinationPolicyContext,
  GrcDestinationPolicyControl,
  GrcDestinationPolicyDraft,
  GrcDestinationPolicyReport
} from "./grcDestinationPolicy";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import { redactIntegrationPolicyReport } from "./integrationPolicyReportRedaction";

export type FetchGrcDestinationPolicyReportInput = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  context: GrcDestinationPolicyContext;
  policy: GrcDestinationPolicyDraft;
};

type GrcDestinationPolicyStatus = "ready" | "needs-policy" | "blocked" | "disabled";

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. GRC destination policy is audit preparation metadata only.";
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only.";
const ALLOWED_STATUSES: GrcDestinationPolicyStatus[] = ["ready", "needs-policy", "blocked", "disabled"];

export class GrcDestinationPolicyClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(message: string, options?: Partial<Pick<GrcDestinationPolicyClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>) {
    super(message);
    this.name = "GrcDestinationPolicyClientError";
    this.code = options?.code ?? "GRC_DESTINATION_POLICY_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Retry GRC destination policy evaluation after the Phase 2 API is reachable.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchGrcDestinationPolicyReport({
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis),
  context,
  policy
}: FetchGrcDestinationPolicyReportInput): Promise<GrcDestinationPolicyReport> {
  if (!fetcher) {
    throw new GrcDestinationPolicyClientError("Fetch is required to evaluate GRC destination policy.", {
      code: "GRC_DESTINATION_POLICY_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildGrcDestinationPolicyUrl(apiBaseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: createContextPayload(context),
      policy: createPolicyPayload(policy)
    })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new GrcDestinationPolicyClientError(errorPayload.error ?? "GRC destination policy evaluation failed.", {
      code: errorPayload.code ?? "GRC_DESTINATION_POLICY_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry GRC destination policy evaluation.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateGrcDestinationPolicyReport(payload);
}

function buildGrcDestinationPolicyUrl(apiBaseUrl: string | undefined): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/integrations/grc-destination/policy`;
}

function createContextPayload(context: GrcDestinationPolicyContext): GrcDestinationPolicyContext {
  return {
    workspaceId: context.workspaceId,
    remediationItemCount: context.remediationItemCount,
    exportSafetyStatus: context.exportSafetyStatus,
    exportBlockerCount: context.exportBlockerCount,
    integrationAdapterStatus: context.integrationAdapterStatus,
    localTicketExportAvailable: context.localTicketExportAvailable
  };
}

function createPolicyPayload(policy: GrcDestinationPolicyDraft): GrcDestinationPolicyDraft {
  return {
    policyOwner: policy.policyOwner,
    destinationSystem: policy.destinationSystem,
    destinationQueue: policy.destinationQueue,
    fieldMappingApproved: policy.fieldMappingApproved,
    authenticationPolicyApproved: policy.authenticationPolicyApproved,
    redactionPolicyApproved: policy.redactionPolicyApproved,
    ticketOwnershipApproved: policy.ticketOwnershipApproved,
    retryAndAuditLoggingApproved: policy.retryAndAuditLoggingApproved,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed,
    humanReviewRequired: policy.humanReviewRequired,
    notes: policy.notes
  };
}

function validateGrcDestinationPolicyReport(payload: unknown): GrcDestinationPolicyReport {
  if (!isRecord(payload)) {
    throw invalidResponseError("GRC destination policy response must be a JSON object.");
  }

  if (payload.reportVersion !== "lexproof-grc-destination-policy-v1") {
    throw invalidResponseError("GRC destination policy response has an unsupported report version.");
  }

  if (payload.notLegalAdviceBoundary !== NOT_LEGAL_ADVICE_BOUNDARY) {
    throw invalidResponseError("GRC destination policy response is missing the required Not legal advice boundary.");
  }

  if (payload.externalGrcTicketCreationAllowed !== false) {
    throw invalidResponseError("GRC destination policy response must keep external GRC ticket creation disabled.");
  }

  if (payload.exportMode !== "metadata-only-json") {
    throw invalidResponseError("GRC destination policy response must keep export mode metadata-only.");
  }

  if (payload.overallStatus !== "ready" && payload.overallStatus !== "needs-policy" && payload.overallStatus !== "blocked") {
    throw invalidResponseError("GRC destination policy response has an invalid overall status.");
  }

  if (
    payload.externalGrcTicketCreationStatus !== "needs-policy" &&
    payload.externalGrcTicketCreationStatus !== "policy-ready-not-enabled" &&
    payload.externalGrcTicketCreationStatus !== "blocked-by-metadata"
  ) {
    throw invalidResponseError("GRC destination policy response has an invalid ticket creation status.");
  }

  if (!Array.isArray(payload.controls) || !payload.controls.every(isGrcDestinationPolicyControl)) {
    throw invalidResponseError("GRC destination policy response has invalid control metadata.");
  }

  if (!isNonEmptyStringArray(payload.nextActions)) {
    throw invalidResponseError("GRC destination policy response has invalid next actions.");
  }

  return redactIntegrationPolicyReport(payload as GrcDestinationPolicyReport);
}

function isGrcDestinationPolicyControl(value: unknown): value is GrcDestinationPolicyControl {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isGrcDestinationPolicyStatus(value.status) &&
    typeof value.evidence === "string" &&
    typeof value.recoveryAction === "string"
  );
}

function isGrcDestinationPolicyStatus(value: unknown): value is GrcDestinationPolicyStatus {
  return typeof value === "string" && ALLOWED_STATUSES.includes(value as GrcDestinationPolicyStatus);
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((action) => typeof action === "string" && action.trim().length > 0)
  );
}

function invalidResponseError(message: string): GrcDestinationPolicyClientError {
  return new GrcDestinationPolicyClientError(message, {
    code: "GRC_DESTINATION_POLICY_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning the metadata-only GRC destination policy contract.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
