import { asSafeApiErrorResponse } from "./apiErrorClient";
import { normalizeAuditLogFilters, type AuditLogFilterInput } from "./auditLogFilters";
import type { AuditLogRecord } from "./phase2Types";

export type FetchAuditLogRecordsInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  filters?: AuditLogFilterInput;
  fetcher?: typeof fetch;
};

const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const AUDIT_LOG_BOUNDARY = "Not legal advice. Audit log records are review workspace metadata." as const;

export class AuditLogClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(
    message: string,
    options?: Partial<Pick<AuditLogClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>
  ) {
    super(message);
    this.name = "AuditLogClientError";
    this.code = options?.code ?? "AUDIT_LOG_CLIENT_ERROR";
    this.recoveryAction = options?.recoveryAction ?? "Start the Phase 2 API and retry Audit Log refresh.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY;
  }
}

export async function fetchAuditLogRecords({
  apiBaseUrl,
  workspaceId,
  filters,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchAuditLogRecordsInput): Promise<AuditLogRecord[]> {
  if (!fetcher) {
    throw new AuditLogClientError("Fetch is required to refresh Audit Log records.", {
      code: "AUDIT_LOG_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildAuditLogRecordsUrl(apiBaseUrl, workspaceId, filters), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new AuditLogClientError(errorPayload.error ?? "Audit Log refresh failed.", {
      code: errorPayload.code ?? "AUDIT_LOG_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Use supported audit log filters and retry.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateAuditLogRecords(payload);
}

export function buildAuditLogRecordsUrl(
  apiBaseUrl: string | undefined,
  workspaceId: string,
  filters: AuditLogFilterInput = {}
): string {
  const validation = normalizeAuditLogFilters(filters);
  if (!validation.valid) {
    throw new AuditLogClientError(validation.errors.join(" "), {
      code: "AUDIT_LOG_FILTER_INVALID",
      recoveryAction: "Use supported audit log filters for actorId, action, targetType, or targetId."
    });
  }

  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  const params = new URLSearchParams();
  Object.entries(validation.filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/audit-log${query ? `?${query}` : ""}`;
}

function validateAuditLogRecords(payload: unknown): AuditLogRecord[] {
  if (!Array.isArray(payload)) {
    throw invalidResponseError("Audit Log refresh response must be a JSON array.");
  }

  if (!payload.every(isAuditLogRecord)) {
    throw invalidResponseError("Audit Log refresh response contains invalid metadata records.");
  }

  return payload;
}

function isAuditLogRecord(value: unknown): value is AuditLogRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.recordVersion === "lexproof-audit-log-record-v1" &&
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    typeof value.actorId === "string" &&
    typeof value.action === "string" &&
    isAuditLogTargetType(value.targetType) &&
    typeof value.targetId === "string" &&
    typeof value.beforeHash === "string" &&
    typeof value.afterHash === "string" &&
    typeof value.summary === "string" &&
    typeof value.createdAt === "string" &&
    value.notLegalAdviceBoundary === AUDIT_LOG_BOUNDARY
  );
}

function isAuditLogTargetType(value: unknown): value is AuditLogRecord["targetType"] {
  return (
    value === "workspace" ||
    value === "evidence" ||
    value === "model-run" ||
    value === "human-review" ||
    value === "export" ||
    value === "source-approval" ||
    value === "source-review" ||
    value === "integration-policy"
  );
}

function invalidResponseError(message: string): AuditLogClientError {
  return new AuditLogClientError(message, {
    code: "AUDIT_LOG_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning metadata-only Audit Log records.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
