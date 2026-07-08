import { asSafeApiErrorResponse } from "./apiErrorClient";
import { normalizeAuditLogFilters, type AuditLogFilterInput } from "./auditLogFilters";
import type { AuditLogExportRecord } from "./auditLogExport";
import type { AuditLogRecoveryPacket, AuditLogRecoveryPacketItem } from "./auditLogRecoveryPacket";
import { redactAuditLogExportRecord, redactAuditLogRecord, redactAuditLogRecoveryPacket } from "./auditLogRedaction";
import type { AuditLogRecord } from "./phase2Types";

export type FetchAuditLogRecordsInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  filters?: AuditLogFilterInput;
  fetcher?: typeof fetch;
};

export type FetchAuditLogExportInput = FetchAuditLogRecordsInput;
export type FetchAuditLogRecoveryPacketInput = FetchAuditLogRecordsInput;

const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const AUDIT_LOG_BOUNDARY = "Not legal advice. Audit log records are review workspace metadata." as const;
const AUDIT_LOG_EXPORT_BOUNDARY = "Not legal advice. Audit Log exports are review workspace metadata only." as const;
const AUDIT_LOG_RECOVERY_PACKET_BOUNDARY = "Not legal advice. Audit Log recovery packets are review workspace metadata only." as const;
const AUDIT_LOG_RECOVERY_ITEM_BOUNDARY = "Not legal advice. Audit Log recovery items are review workspace metadata only." as const;

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

export async function fetchAuditLogExport({
  apiBaseUrl,
  workspaceId,
  filters,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchAuditLogExportInput): Promise<AuditLogExportRecord> {
  if (!fetcher) {
    throw new AuditLogClientError("Fetch is required to refresh Audit Log export metadata.", {
      code: "AUDIT_LOG_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildAuditLogExportUrl(apiBaseUrl, workspaceId, filters), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new AuditLogClientError(errorPayload.error ?? "Audit Log export refresh failed.", {
      code: errorPayload.code ?? "AUDIT_LOG_EXPORT_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Use supported audit log export filters and retry.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return validateAuditLogExport(payload);
}

export async function fetchAuditLogRecoveryPacket({
  apiBaseUrl,
  workspaceId,
  filters,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchAuditLogRecoveryPacketInput): Promise<AuditLogRecoveryPacket> {
  if (!fetcher) {
    throw new AuditLogClientError("Fetch is required to refresh Audit Log recovery metadata.", {
      code: "AUDIT_LOG_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildAuditLogRecoveryPacketUrl(apiBaseUrl, workspaceId, filters), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new AuditLogClientError(errorPayload.error ?? "Audit Log recovery packet refresh failed.", {
      code: errorPayload.code ?? "AUDIT_LOG_RECOVERY_REFRESH_FAILED",
      recoveryAction: errorPayload.recoveryAction ?? "Use supported audit log recovery filters and retry.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactAuditLogRecoveryPacket(validateAuditLogRecoveryPacket(payload));
}

export function buildAuditLogRecordsUrl(
  apiBaseUrl: string | undefined,
  workspaceId: string,
  filters: AuditLogFilterInput = {}
): string {
  return buildAuditLogUrl(apiBaseUrl, workspaceId, filters, "");
}

export function buildAuditLogExportUrl(
  apiBaseUrl: string | undefined,
  workspaceId: string,
  filters: AuditLogFilterInput = {}
): string {
  return buildAuditLogUrl(apiBaseUrl, workspaceId, filters, "/export");
}

export function buildAuditLogRecoveryPacketUrl(
  apiBaseUrl: string | undefined,
  workspaceId: string,
  filters: AuditLogFilterInput = {}
): string {
  return buildAuditLogUrl(apiBaseUrl, workspaceId, filters, "/recovery");
}

function buildAuditLogUrl(
  apiBaseUrl: string | undefined,
  workspaceId: string,
  filters: AuditLogFilterInput,
  suffix: "" | "/export" | "/recovery"
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
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/audit-log${suffix}${query ? `?${query}` : ""}`;
}

function validateAuditLogRecords(payload: unknown): AuditLogRecord[] {
  if (!Array.isArray(payload)) {
    throw invalidResponseError("Audit Log refresh response must be a JSON array.");
  }

  if (!payload.every(isAuditLogRecord)) {
    throw invalidResponseError("Audit Log refresh response contains invalid metadata records.");
  }

  return payload.map(redactAuditLogRecord);
}

function validateAuditLogExport(payload: unknown): AuditLogExportRecord {
  if (!isAuditLogExportRecord(payload)) {
    throw invalidResponseError(
      "Audit Log export response contains invalid metadata.",
      "Verify the Phase 2 API is returning a metadata-only Audit Log export artifact."
    );
  }

  return redactAuditLogExportRecord(payload);
}

function validateAuditLogRecoveryPacket(payload: unknown): AuditLogRecoveryPacket {
  if (!isAuditLogRecoveryPacket(payload)) {
    throw invalidResponseError(
      "Audit Log recovery packet response contains invalid metadata.",
      "Verify the Phase 2 API is returning metadata-only Audit Log recovery packets with non-empty recovery actions."
    );
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

function isAuditLogExportRecord(value: unknown): value is AuditLogExportRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.exportVersion === "lexproof-audit-log-export-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.exportedAt === "string" &&
    isSha256Hex(value.exportHash) &&
    isSha256Hex(value.integrityChainHash) &&
    isAuditLogExportIntegrityStatus(value.integrityStatus) &&
    typeof value.integritySummary === "string" &&
    isNonNegativeInteger(value.eventCount) &&
    (value.firstEventAt === undefined || typeof value.firstEventAt === "string") &&
    (value.lastEventAt === undefined || typeof value.lastEventAt === "string") &&
    isStringNumberRecord(value.actionCounts) &&
    isStringArray(value.actors) &&
    Array.isArray(value.targetTypes) &&
    value.targetTypes.every(isAuditLogTargetType) &&
    isAuditLogExportBoundaryStatus(value.dataBoundaryStatus) &&
    typeof value.exportAllowed === "boolean" &&
    isNonNegativeInteger(value.boundaryBlockerCount) &&
    isNonNegativeInteger(value.boundaryWarningCount) &&
    Array.isArray(value.detectedClasses) &&
    value.detectedClasses.every(isClassifiedDataClass) &&
    Array.isArray(value.boundaryFindings) &&
    value.boundaryFindings.every(isAuditLogExportBoundaryFinding) &&
    isNonEmptyStringArray(value.remediation) &&
    isNonEmptyStringArray(value.nextActions) &&
    Array.isArray(value.events) &&
    value.events.length === value.eventCount &&
    value.events.every(isAuditLogExportEvent) &&
    value.notLegalAdviceBoundary === AUDIT_LOG_EXPORT_BOUNDARY
  );
}

function isAuditLogExportEvent(value: unknown): value is AuditLogExportRecord["events"][number] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.actorId === "string" &&
    typeof value.action === "string" &&
    isAuditLogTargetType(value.targetType) &&
    typeof value.targetId === "string" &&
    typeof value.beforeHash === "string" &&
    typeof value.afterHash === "string" &&
    typeof value.summary === "string" &&
    typeof value.createdAt === "string" &&
    isSha256Hex(value.entryHash)
  );
}

function isAuditLogExportBoundaryFinding(value: unknown): value is AuditLogExportRecord["boundaryFindings"][number] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.source === "workspace" || value.source === "event") &&
    (value.eventId === undefined || typeof value.eventId === "string") &&
    isAuditLogExportBoundaryField(value.field) &&
    isClassifiedDataClass(value.dataClass) &&
    isClassifiedDataSeverity(value.severity) &&
    isNonNegativeInteger(value.matchCount) &&
    typeof value.redactedSnippet === "string" &&
    typeof value.message === "string"
  );
}

function isAuditLogRecoveryPacket(value: unknown): value is AuditLogRecoveryPacket {
  if (!isRecord(value) || !isRecord(value.appliedFilters)) {
    return false;
  }

  const items = Array.isArray(value.items) ? value.items : [];
  const blockedCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "blocked").length;
  const needsReviewCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "needs-review").length;
  const emptyExportCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "empty").length;
  const recoveryItemCount = items.length;
  const eventCount = typeof value.eventCount === "number" ? value.eventCount : -1;

  return (
    value.packetVersion === "lexproof-audit-log-recovery-packet-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.generatedAt === "string" &&
    isSha256Hex(value.packetHash) &&
    isAuditLogRecoveryStatus(value.status) &&
    isNonNegativeInteger(value.eventCount) &&
    isNonNegativeInteger(value.recoveryItemCount) &&
    value.recoveryItemCount === recoveryItemCount &&
    isNonNegativeInteger(value.blockedCount) &&
    value.blockedCount === blockedCount &&
    isNonNegativeInteger(value.needsReviewCount) &&
    value.needsReviewCount === needsReviewCount &&
    isNonNegativeInteger(value.emptyExportCount) &&
    value.emptyExportCount === emptyExportCount &&
    isNonNegativeInteger(value.readyEventCount) &&
    value.readyEventCount <= eventCount &&
    typeof value.exportAllowed === "boolean" &&
    isSha256Hex(value.exportHash) &&
    isSha256Hex(value.integrityChainHash) &&
    isAuditLogAppliedFilters(value.appliedFilters) &&
    isNonEmptyStringArray(value.nextActions) &&
    items.every(isAuditLogRecoveryPacketItem) &&
    value.notLegalAdviceBoundary === AUDIT_LOG_RECOVERY_PACKET_BOUNDARY
  );
}

function isAuditLogRecoveryPacketItem(value: unknown): value is AuditLogRecoveryPacketItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.itemId === "string" &&
    (value.source === "export" || value.source === "boundary-finding") &&
    isAuditLogRecoveryItemStatus(value.recoveryStatus) &&
    isAuditLogRecoveryPriority(value.priority) &&
    typeof value.recoveryAction === "string" &&
    value.recoveryAction.trim().length > 0 &&
    (value.eventId === undefined || typeof value.eventId === "string") &&
    (value.action === undefined || typeof value.action === "string") &&
    (value.targetType === undefined || isAuditLogTargetType(value.targetType)) &&
    (value.targetId === undefined || typeof value.targetId === "string") &&
    (value.entryHash === undefined || isSha256Hex(value.entryHash)) &&
    (value.field === undefined || isAuditLogExportBoundaryField(value.field)) &&
    (value.dataClass === undefined || isClassifiedDataClass(value.dataClass)) &&
    (value.severity === undefined || isClassifiedDataSeverity(value.severity)) &&
    value.notLegalAdviceBoundary === AUDIT_LOG_RECOVERY_ITEM_BOUNDARY
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

function isAuditLogExportBoundaryStatus(value: unknown): value is AuditLogExportRecord["dataBoundaryStatus"] {
  return value === "clean" || value === "needs-review" || value === "blocked";
}

function isAuditLogExportIntegrityStatus(value: unknown): value is AuditLogExportRecord["integrityStatus"] {
  return value === "verified" || value === "needs-review" || value === "blocked" || value === "empty";
}

function isAuditLogRecoveryStatus(value: unknown): value is AuditLogRecoveryPacket["status"] {
  return value === "empty" || value === "blocked" || value === "needs-review" || value === "ready";
}

function isAuditLogRecoveryItemStatus(value: unknown): value is AuditLogRecoveryPacketItem["recoveryStatus"] {
  return value === "empty" || value === "blocked" || value === "needs-review";
}

function isAuditLogRecoveryPriority(value: unknown): value is AuditLogRecoveryPacketItem["priority"] {
  return value === "P0" || value === "P1" || value === "P2" || value === "P3";
}

function isAuditLogAppliedFilters(value: unknown): value is AuditLogRecoveryPacket["appliedFilters"] {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([key, filterValue]) =>
      (key === "actorId" || key === "action" || key === "targetType" || key === "targetId") &&
      typeof filterValue === "string" &&
      filterValue.trim().length > 0
  );
}

function isAuditLogExportBoundaryField(value: unknown): value is AuditLogExportRecord["boundaryFindings"][number]["field"] {
  return (
    value === "workspaceId" ||
    value === "id" ||
    value === "actorId" ||
    value === "action" ||
    value === "targetId" ||
    value === "beforeHash" ||
    value === "afterHash" ||
    value === "summary"
  );
}

function isClassifiedDataClass(value: unknown): value is AuditLogExportRecord["detectedClasses"][number] {
  return (
    value === "public" ||
    value === "confidential" ||
    value === "personal-data" ||
    value === "wallet-address" ||
    value === "raw-kyc" ||
    value === "credential-material" ||
    value === "private-key-material"
  );
}

function isClassifiedDataSeverity(value: unknown): value is AuditLogExportRecord["boundaryFindings"][number]["severity"] {
  return value === "block" || value === "warn" || value === "info";
}

function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isStringNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(isNonNegativeInteger);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function invalidResponseError(message: string, recoveryAction = "Verify the Phase 2 API is returning metadata-only Audit Log records."): AuditLogClientError {
  return new AuditLogClientError(message, {
    code: "AUDIT_LOG_INVALID_RESPONSE",
    recoveryAction,
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
