import type {
  ChainAnchorPolicyContext,
  ChainAnchorPolicyControl,
  ChainAnchorPolicyDraft,
  ChainAnchorPolicyReport
} from "./chainAnchorPolicy";

export type FetchChainAnchorPolicyReportInput = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  context: ChainAnchorPolicyContext;
  policy: ChainAnchorPolicyDraft;
};

type ErrorResponse = {
  error?: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

type ChainAnchorPolicyStatus = "ready" | "needs-policy" | "blocked" | "disabled";

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Chain anchor policy is audit preparation metadata only.";
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only.";
const ALLOWED_STATUSES: ChainAnchorPolicyStatus[] = ["ready", "needs-policy", "blocked", "disabled"];

export class ChainAnchorPolicyClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(message: string, options?: Partial<Pick<ChainAnchorPolicyClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>) {
    super(message);
    this.name = "ChainAnchorPolicyClientError";
    this.code = options?.code ?? "CHAIN_ANCHOR_POLICY_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Retry chain anchor policy evaluation after the Phase 2 API is reachable.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchChainAnchorPolicyReport({
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis),
  context,
  policy
}: FetchChainAnchorPolicyReportInput): Promise<ChainAnchorPolicyReport> {
  if (!fetcher) {
    throw new ChainAnchorPolicyClientError("Fetch is required to evaluate chain anchor policy.", {
      code: "CHAIN_ANCHOR_POLICY_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildChainAnchorPolicyUrl(apiBaseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: createContextPayload(context),
      policy: createPolicyPayload(policy)
    })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asErrorResponse(payload);
    throw new ChainAnchorPolicyClientError(errorPayload.error ?? "Chain anchor policy evaluation failed.", {
      code: errorPayload.code ?? "CHAIN_ANCHOR_POLICY_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry chain anchor policy evaluation.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateChainAnchorPolicyReport(payload);
}

function buildChainAnchorPolicyUrl(apiBaseUrl: string | undefined): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/integrations/chain-anchor/policy`;
}

function createContextPayload(context: ChainAnchorPolicyContext): ChainAnchorPolicyContext {
  return {
    workspaceId: context.workspaceId,
    evidenceCount: context.evidenceCount,
    retentionStatus: context.retentionStatus,
    vaultSyncAllowed: context.vaultSyncAllowed,
    blockerCount: context.blockerCount,
    exportBlockerCount: context.exportBlockerCount,
    manifestHash: context.manifestHash,
    counselPackVersionCount: context.counselPackVersionCount,
    simulatedAnchorAvailable: context.simulatedAnchorAvailable
  };
}

function createPolicyPayload(policy: ChainAnchorPolicyDraft): ChainAnchorPolicyDraft {
  return {
    policyOwner: policy.policyOwner,
    targetNetwork: policy.targetNetwork,
    walletCustodyModel: policy.walletCustodyModel,
    signerRole: policy.signerRole,
    transactionLoggingApproved: policy.transactionLoggingApproved,
    privacyReviewApproved: policy.privacyReviewApproved,
    publicPayloadLimitedApproved: policy.publicPayloadLimitedApproved,
    userConsentApproved: policy.userConsentApproved,
    noRawEvidenceOnChainConfirmed: policy.noRawEvidenceOnChainConfirmed,
    humanReviewRequired: policy.humanReviewRequired,
    notes: policy.notes
  };
}

function validateChainAnchorPolicyReport(payload: unknown): ChainAnchorPolicyReport {
  if (!isRecord(payload)) {
    throw invalidResponseError("Chain anchor policy response must be a JSON object.");
  }

  if (payload.reportVersion !== "lexproof-chain-anchor-policy-v1") {
    throw invalidResponseError("Chain anchor policy response has an unsupported report version.");
  }

  if (payload.notLegalAdviceBoundary !== NOT_LEGAL_ADVICE_BOUNDARY) {
    throw invalidResponseError("Chain anchor policy response is missing the required Not legal advice boundary.");
  }

  if (payload.externalChainAnchoringAllowed !== false) {
    throw invalidResponseError("Chain anchor policy response must keep external chain anchoring disabled.");
  }

  if (payload.anchorMode !== "simulated-only") {
    throw invalidResponseError("Chain anchor policy response must keep anchor mode simulated-only.");
  }

  if (payload.overallStatus !== "ready" && payload.overallStatus !== "needs-policy" && payload.overallStatus !== "blocked") {
    throw invalidResponseError("Chain anchor policy response has an invalid overall status.");
  }

  if (
    payload.externalChainAnchoringStatus !== "needs-policy" &&
    payload.externalChainAnchoringStatus !== "policy-ready-not-enabled" &&
    payload.externalChainAnchoringStatus !== "blocked-by-metadata"
  ) {
    throw invalidResponseError("Chain anchor policy response has an invalid anchor status.");
  }

  if (!Array.isArray(payload.controls) || !payload.controls.every(isChainAnchorPolicyControl)) {
    throw invalidResponseError("Chain anchor policy response has invalid control metadata.");
  }

  if (!Array.isArray(payload.nextActions) || !payload.nextActions.every((action) => typeof action === "string")) {
    throw invalidResponseError("Chain anchor policy response has invalid next actions.");
  }

  return payload as ChainAnchorPolicyReport;
}

function isChainAnchorPolicyControl(value: unknown): value is ChainAnchorPolicyControl {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isChainAnchorPolicyStatus(value.status) &&
    typeof value.evidence === "string" &&
    typeof value.recoveryAction === "string"
  );
}

function isChainAnchorPolicyStatus(value: unknown): value is ChainAnchorPolicyStatus {
  return typeof value === "string" && ALLOWED_STATUSES.includes(value as ChainAnchorPolicyStatus);
}

function invalidResponseError(message: string): ChainAnchorPolicyClientError {
  return new ChainAnchorPolicyClientError(message, {
    code: "CHAIN_ANCHOR_POLICY_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning the metadata-only chain anchor policy contract.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function asErrorResponse(value: unknown): ErrorResponse {
  return isRecord(value) ? (value as ErrorResponse) : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
