import type {
  ObjectStoragePolicyContext,
  ObjectStoragePolicyControl,
  ObjectStoragePolicyDraft,
  ObjectStoragePolicyReport
} from "./objectStoragePolicy";
import type { IntegrationAdapterStatus } from "./integrationReadiness";
import { asSafeApiErrorResponse } from "./apiErrorClient";

export type FetchObjectStoragePolicyReportInput = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  context: ObjectStoragePolicyContext;
  policy: ObjectStoragePolicyDraft;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Object storage policy is audit preparation metadata only.";
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only.";
const ALLOWED_STATUSES: IntegrationAdapterStatus[] = ["ready", "needs-policy", "blocked", "disabled"];

export class ObjectStoragePolicyClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(message: string, options?: Partial<Pick<ObjectStoragePolicyClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>) {
    super(message);
    this.name = "ObjectStoragePolicyClientError";
    this.code = options?.code ?? "OBJECT_STORAGE_POLICY_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Retry object storage policy evaluation after the Phase 2 API is reachable.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchObjectStoragePolicyReport({
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis),
  context,
  policy
}: FetchObjectStoragePolicyReportInput): Promise<ObjectStoragePolicyReport> {
  if (!fetcher) {
    throw new ObjectStoragePolicyClientError("Fetch is required to evaluate object storage policy.", {
      code: "OBJECT_STORAGE_POLICY_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildObjectStoragePolicyUrl(apiBaseUrl), {
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
    throw new ObjectStoragePolicyClientError(errorPayload.error ?? "Object storage policy evaluation failed.", {
      code: errorPayload.code ?? "OBJECT_STORAGE_POLICY_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry object storage policy evaluation.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateObjectStoragePolicyReport(payload);
}

function buildObjectStoragePolicyUrl(apiBaseUrl: string | undefined): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/integrations/object-storage/policy`;
}

function createContextPayload(context: ObjectStoragePolicyContext): ObjectStoragePolicyContext {
  return {
    workspaceId: context.workspaceId,
    evidenceCount: context.evidenceCount,
    retentionStatus: context.retentionStatus,
    vaultSyncAllowed: context.vaultSyncAllowed,
    blockerCount: context.blockerCount,
    manifestHash: context.manifestHash
  };
}

function createPolicyPayload(policy: ObjectStoragePolicyDraft): ObjectStoragePolicyDraft {
  return {
    policyOwner: policy.policyOwner,
    retentionDays: policy.retentionDays,
    deletionSlaDays: policy.deletionSlaDays,
    encryptionAtRestApproved: policy.encryptionAtRestApproved,
    bucketAllowlistApproved: policy.bucketAllowlistApproved,
    accessLoggingApproved: policy.accessLoggingApproved,
    lifecyclePolicyApproved: policy.lifecyclePolicyApproved,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed,
    humanReviewRequired: policy.humanReviewRequired,
    notes: policy.notes
  };
}

function validateObjectStoragePolicyReport(payload: unknown): ObjectStoragePolicyReport {
  if (!isRecord(payload)) {
    throw invalidResponseError("Object storage policy response must be a JSON object.");
  }

  if (payload.reportVersion !== "lexproof-object-storage-policy-v1") {
    throw invalidResponseError("Object storage policy response has an unsupported report version.");
  }

  if (payload.notLegalAdviceBoundary !== NOT_LEGAL_ADVICE_BOUNDARY) {
    throw invalidResponseError("Object storage policy response is missing the required Not legal advice boundary.");
  }

  if (payload.externalObjectStorageAllowed !== false) {
    throw invalidResponseError("Object storage policy response must keep external object storage disabled.");
  }

  if (payload.overallStatus !== "ready" && payload.overallStatus !== "needs-policy" && payload.overallStatus !== "blocked") {
    throw invalidResponseError("Object storage policy response has an invalid overall status.");
  }

  if (
    payload.externalObjectStorageStatus !== "needs-policy" &&
    payload.externalObjectStorageStatus !== "policy-ready-not-enabled" &&
    payload.externalObjectStorageStatus !== "blocked-by-metadata"
  ) {
    throw invalidResponseError("Object storage policy response has an invalid storage status.");
  }

  if (!Array.isArray(payload.controls) || !payload.controls.every(isObjectStoragePolicyControl)) {
    throw invalidResponseError("Object storage policy response has invalid control metadata.");
  }

  if (!Array.isArray(payload.nextActions) || !payload.nextActions.every((action) => typeof action === "string")) {
    throw invalidResponseError("Object storage policy response has invalid next actions.");
  }

  return payload as ObjectStoragePolicyReport;
}

function isObjectStoragePolicyControl(value: unknown): value is ObjectStoragePolicyControl {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isIntegrationAdapterStatus(value.status) &&
    typeof value.evidence === "string" &&
    typeof value.recoveryAction === "string"
  );
}

function isIntegrationAdapterStatus(value: unknown): value is IntegrationAdapterStatus {
  return typeof value === "string" && ALLOWED_STATUSES.includes(value as IntegrationAdapterStatus);
}

function invalidResponseError(message: string): ObjectStoragePolicyClientError {
  return new ObjectStoragePolicyClientError(message, {
    code: "OBJECT_STORAGE_POLICY_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning the metadata-only object storage policy contract.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
