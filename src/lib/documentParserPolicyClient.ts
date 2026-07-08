import type {
  DocumentParserPolicyContext,
  DocumentParserPolicyControl,
  DocumentParserPolicyDraft,
  DocumentParserPolicyReport
} from "./documentParserPolicy";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import { redactIntegrationPolicyReport } from "./integrationPolicyReportRedaction";

export type FetchDocumentParserPolicyReportInput = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  context: DocumentParserPolicyContext;
  policy: DocumentParserPolicyDraft;
};

type DocumentParserPolicyStatus = "ready" | "needs-policy" | "blocked" | "disabled";

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Document parser policy is audit preparation metadata only.";
const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only.";
const ALLOWED_STATUSES: DocumentParserPolicyStatus[] = ["ready", "needs-policy", "blocked", "disabled"];

export class DocumentParserPolicyClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(message: string, options?: Partial<Pick<DocumentParserPolicyClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>) {
    super(message);
    this.name = "DocumentParserPolicyClientError";
    this.code = options?.code ?? "DOCUMENT_PARSER_POLICY_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Retry document parser policy evaluation after the Phase 2 API is reachable.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchDocumentParserPolicyReport({
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis),
  context,
  policy
}: FetchDocumentParserPolicyReportInput): Promise<DocumentParserPolicyReport> {
  if (!fetcher) {
    throw new DocumentParserPolicyClientError("Fetch is required to evaluate document parser policy.", {
      code: "DOCUMENT_PARSER_POLICY_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildDocumentParserPolicyUrl(apiBaseUrl), {
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
    throw new DocumentParserPolicyClientError(errorPayload.error ?? "Document parser policy evaluation failed.", {
      code: errorPayload.code ?? "DOCUMENT_PARSER_POLICY_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Start the Phase 2 API and retry document parser policy evaluation.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateDocumentParserPolicyReport(payload);
}

function buildDocumentParserPolicyUrl(apiBaseUrl: string | undefined): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/integrations/document-parser/policy`;
}

function createContextPayload(context: DocumentParserPolicyContext): DocumentParserPolicyContext {
  return {
    workspaceId: context.workspaceId,
    evidenceCount: context.evidenceCount,
    retentionStatus: context.retentionStatus,
    vaultSyncAllowed: context.vaultSyncAllowed,
    blockerCount: context.blockerCount,
    exportBlockerCount: context.exportBlockerCount,
    manifestHash: context.manifestHash
  };
}

function createPolicyPayload(policy: DocumentParserPolicyDraft): DocumentParserPolicyDraft {
  return {
    policyOwner: policy.policyOwner,
    maxDocumentSizeMb: policy.maxDocumentSizeMb,
    rawDocumentRetentionDays: policy.rawDocumentRetentionDays,
    deletionSlaDays: policy.deletionSlaDays,
    parsingPurpose: policy.parsingPurpose,
    redactionBeforeParsingApproved: policy.redactionBeforeParsingApproved,
    noTrainingUseConfirmed: policy.noTrainingUseConfirmed,
    accessLoggingApproved: policy.accessLoggingApproved,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed,
    humanReviewRequired: policy.humanReviewRequired,
    notes: policy.notes
  };
}

function validateDocumentParserPolicyReport(payload: unknown): DocumentParserPolicyReport {
  if (!isRecord(payload)) {
    throw invalidResponseError("Document parser policy response must be a JSON object.");
  }

  if (payload.reportVersion !== "lexproof-document-parser-policy-v1") {
    throw invalidResponseError("Document parser policy response has an unsupported report version.");
  }

  if (payload.notLegalAdviceBoundary !== NOT_LEGAL_ADVICE_BOUNDARY) {
    throw invalidResponseError("Document parser policy response is missing the required Not legal advice boundary.");
  }

  if (payload.externalDocumentParsingAllowed !== false) {
    throw invalidResponseError("Document parser policy response must keep external document parsing disabled.");
  }

  if (payload.overallStatus !== "ready" && payload.overallStatus !== "needs-policy" && payload.overallStatus !== "blocked") {
    throw invalidResponseError("Document parser policy response has an invalid overall status.");
  }

  if (
    payload.externalDocumentParsingStatus !== "needs-policy" &&
    payload.externalDocumentParsingStatus !== "policy-ready-not-enabled" &&
    payload.externalDocumentParsingStatus !== "blocked-by-metadata"
  ) {
    throw invalidResponseError("Document parser policy response has an invalid parser status.");
  }

  if (!Array.isArray(payload.controls) || !payload.controls.every(isDocumentParserPolicyControl)) {
    throw invalidResponseError("Document parser policy response has invalid control metadata.");
  }

  if (!isNonEmptyStringArray(payload.nextActions)) {
    throw invalidResponseError("Document parser policy response has invalid next actions.");
  }

  return redactIntegrationPolicyReport(payload as DocumentParserPolicyReport);
}

function isDocumentParserPolicyControl(value: unknown): value is DocumentParserPolicyControl {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isDocumentParserPolicyStatus(value.status) &&
    typeof value.evidence === "string" &&
    typeof value.recoveryAction === "string"
  );
}

function isDocumentParserPolicyStatus(value: unknown): value is DocumentParserPolicyStatus {
  return typeof value === "string" && ALLOWED_STATUSES.includes(value as DocumentParserPolicyStatus);
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((action) => typeof action === "string" && action.trim().length > 0)
  );
}

function invalidResponseError(message: string): DocumentParserPolicyClientError {
  return new DocumentParserPolicyClientError(message, {
    code: "DOCUMENT_PARSER_POLICY_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning the metadata-only document parser policy contract.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
