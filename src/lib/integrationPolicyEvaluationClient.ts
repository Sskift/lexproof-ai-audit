import { asSafeApiErrorResponse } from "./apiErrorClient";
import {
  isIntegrationPolicyEvaluationRecord,
  type IntegrationPolicyEvaluationReceiptBundle,
  type IntegrationPolicyEvaluationReceiptBundleRecord,
  type IntegrationPolicyEvaluationRecord,
  type IntegrationPolicyId,
  type IntegrationPolicyReceiptRecoveryItem,
  type IntegrationPolicyReceiptRecoveryPacket
} from "./integrationPolicyEvaluation";
import {
  redactIntegrationPolicyEvaluationReceiptBundle,
  redactIntegrationPolicyEvaluationRecord,
  redactIntegrationPolicyReceiptRecoveryPacket
} from "./integrationPolicyEvaluationRedaction";

export type FetchIntegrationPolicyEvaluationRecordsInput = {
  apiBaseUrl?: string;
  workspaceId: string;
  fetcher?: typeof fetch;
};

const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const RECEIPT_RECOVERY_PACKET_BOUNDARY =
  "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only." as const;
const RECEIPT_RECOVERY_ITEM_BOUNDARY =
  "Not legal advice. Integration policy receipt recovery items are audit preparation metadata only." as const;

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

  return validateIntegrationPolicyEvaluationRecords(payload).map(redactIntegrationPolicyEvaluationRecord);
}

export async function fetchIntegrationPolicyEvaluationReceiptBundle({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchIntegrationPolicyEvaluationRecordsInput): Promise<IntegrationPolicyEvaluationReceiptBundle> {
  if (!fetcher) {
    throw new IntegrationPolicyEvaluationClientError("Fetch is required to refresh the policy receipt bundle.", {
      code: "INTEGRATION_POLICY_EVALUATION_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildIntegrationPolicyEvaluationReceiptBundleUrl(apiBaseUrl, workspaceId), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new IntegrationPolicyEvaluationClientError(errorPayload.error ?? "Policy receipt bundle refresh failed.", {
      code: errorPayload.code ?? "INTEGRATION_POLICY_EVALUATION_BUNDLE_REFRESH_FAILED",
      recoveryAction:
        errorPayload.recoveryAction ?? "Start the Phase 2 API and retry policy receipt bundle refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactIntegrationPolicyEvaluationReceiptBundle(validateIntegrationPolicyEvaluationReceiptBundle(payload));
}

export async function fetchIntegrationPolicyReceiptRecoveryPacket({
  apiBaseUrl,
  workspaceId,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchIntegrationPolicyEvaluationRecordsInput): Promise<IntegrationPolicyReceiptRecoveryPacket> {
  if (!fetcher) {
    throw new IntegrationPolicyEvaluationClientError("Fetch is required to refresh the policy receipt recovery packet.", {
      code: "INTEGRATION_POLICY_EVALUATION_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client."
    });
  }

  const response = await fetcher(buildIntegrationPolicyReceiptRecoveryPacketUrl(apiBaseUrl, workspaceId), {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asSafeApiErrorResponse(payload);
    throw new IntegrationPolicyEvaluationClientError(errorPayload.error ?? "Policy receipt recovery packet refresh failed.", {
      code: errorPayload.code ?? "INTEGRATION_POLICY_EVALUATION_RECOVERY_REFRESH_FAILED",
      recoveryAction:
        errorPayload.recoveryAction ?? "Start the Phase 2 API and retry policy receipt recovery packet refresh.",
      notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactIntegrationPolicyReceiptRecoveryPacket(validateIntegrationPolicyReceiptRecoveryPacket(payload));
}

export function buildIntegrationPolicyEvaluationRecordsUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/integration-policy-evaluations`;
}

export function buildIntegrationPolicyEvaluationReceiptBundleUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  return `${buildIntegrationPolicyEvaluationRecordsUrl(apiBaseUrl, workspaceId)}/bundle`;
}

export function buildIntegrationPolicyReceiptRecoveryPacketUrl(apiBaseUrl: string | undefined, workspaceId: string): string {
  return `${buildIntegrationPolicyEvaluationRecordsUrl(apiBaseUrl, workspaceId)}/recovery`;
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

function validateIntegrationPolicyEvaluationReceiptBundle(payload: unknown): IntegrationPolicyEvaluationReceiptBundle {
  if (!isIntegrationPolicyEvaluationReceiptBundle(payload)) {
    throw invalidResponseError("Policy receipt bundle response must be metadata-only bundle JSON.");
  }

  return payload;
}

function validateIntegrationPolicyReceiptRecoveryPacket(payload: unknown): IntegrationPolicyReceiptRecoveryPacket {
  if (!isIntegrationPolicyReceiptRecoveryPacket(payload)) {
    throw invalidResponseError("Policy receipt recovery packet response must be metadata-only recovery JSON.");
  }

  return payload;
}

function isIntegrationPolicyEvaluationReceiptBundle(value: unknown): value is IntegrationPolicyEvaluationReceiptBundle {
  if (!isRecord(value)) {
    return false;
  }

  const records = Array.isArray(value.records) ? value.records : [];
  const policyIds = new Set(records.map((record) => (isRecord(record) ? record.policyId : undefined)));
  const readyCount = records.filter((record) => isRecord(record) && record.overallStatus === "ready").length;
  const needsPolicyCount = records.filter((record) => isRecord(record) && record.overallStatus === "needs-policy").length;
  const blockedCount = records.filter((record) => isRecord(record) && record.overallStatus === "blocked").length;

  return (
    value.bundleVersion === "lexproof-integration-policy-evaluation-receipt-bundle-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.generatedAt === "string" &&
    isSha256(value.bundleHash) &&
    isNonNegativeInteger(value.recordCount) &&
    value.recordCount === records.length &&
    isNonNegativeInteger(value.policyCount) &&
    value.policyCount === policyIds.size &&
    Array.isArray(value.missingPolicyIds) &&
    value.missingPolicyIds.every(isIntegrationPolicyId) &&
    isNonNegativeInteger(value.readyCount) &&
    value.readyCount === readyCount &&
    isNonNegativeInteger(value.needsPolicyCount) &&
    value.needsPolicyCount === needsPolicyCount &&
    isNonNegativeInteger(value.blockedCount) &&
    value.blockedCount === blockedCount &&
    value.externalEnablementAllowed === false &&
    isNonEmptyStringArray(value.nextActions) &&
    records.every(isIntegrationPolicyEvaluationReceiptBundleRecord) &&
    value.notLegalAdviceBoundary === "Not legal advice. Integration policy receipt bundles are audit preparation metadata only."
  );
}

function isIntegrationPolicyReceiptRecoveryPacket(value: unknown): value is IntegrationPolicyReceiptRecoveryPacket {
  if (!isRecord(value) || !isRecord(value.summary) || !Array.isArray(value.items)) {
    return false;
  }

  const items = value.items;
  const totalRecoveryCount = items.filter((item) => isRecord(item) && item.recoveryStatus !== "ready").length;
  const missingPolicyCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "missing-receipt").length;
  const blockedCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "blocked").length;
  const needsPolicyCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "needs-policy").length;
  const staleReceiptCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "stale-receipt").length;
  const readyPolicyCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "ready").length;

  return (
    value.packetVersion === "lexproof-integration-policy-receipt-recovery-packet-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.generatedAt === "string" &&
    isReceiptRecoveryPacketStatus(value.status) &&
    isNonNegativeInteger(value.recordCount) &&
    isNonNegativeInteger(value.policyCount) &&
    value.policyCount <= 4 &&
    value.externalEnablementAllowed === false &&
    isNonNegativeInteger(value.summary.totalRecoveryCount) &&
    value.summary.totalRecoveryCount === totalRecoveryCount &&
    isNonNegativeInteger(value.summary.missingPolicyCount) &&
    value.summary.missingPolicyCount === missingPolicyCount &&
    isNonNegativeInteger(value.summary.blockedCount) &&
    value.summary.blockedCount === blockedCount &&
    isNonNegativeInteger(value.summary.needsPolicyCount) &&
    value.summary.needsPolicyCount === needsPolicyCount &&
    isNonNegativeInteger(value.summary.staleReceiptCount) &&
    value.summary.staleReceiptCount === staleReceiptCount &&
    isNonNegativeInteger(value.summary.readyPolicyCount) &&
    value.summary.readyPolicyCount === readyPolicyCount &&
    isNonNegativeInteger(value.summary.latestReceiptCount) &&
    value.summary.latestReceiptCount === value.policyCount &&
    typeof value.summary.nextAction === "string" &&
    value.summary.nextAction.trim().length > 0 &&
    value.summary.notLegalAdviceBoundary === RECEIPT_RECOVERY_PACKET_BOUNDARY &&
    items.every(isIntegrationPolicyReceiptRecoveryItem) &&
    isNonEmptyStringArray(value.nextActions) &&
    isSha256(value.packetHash) &&
    value.notLegalAdviceBoundary === RECEIPT_RECOVERY_PACKET_BOUNDARY
  );
}

function isIntegrationPolicyReceiptRecoveryItem(value: unknown): value is IntegrationPolicyReceiptRecoveryItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.itemVersion === "lexproof-integration-policy-receipt-recovery-item-v1" &&
    isIntegrationPolicyId(value.policyId) &&
    typeof value.policyLabel === "string" &&
    value.policyLabel.trim().length > 0 &&
    (value.recordId === null || typeof value.recordId === "string") &&
    (value.supersededByRecordId === null || typeof value.supersededByRecordId === "string") &&
    (value.reportVersion === null || typeof value.reportVersion === "string") &&
    (value.overallStatus === "ready" ||
      value.overallStatus === "needs-policy" ||
      value.overallStatus === "blocked" ||
      value.overallStatus === "missing") &&
    (value.reportHash === null || isSha256(value.reportHash)) &&
    (value.contextHash === null || isSha256(value.contextHash)) &&
    (value.policyHash === null || isSha256(value.policyHash)) &&
    value.externalCapabilityAllowed === false &&
    typeof value.externalCapabilityStatus === "string" &&
    value.externalCapabilityStatus.trim().length > 0 &&
    isReceiptRecoveryStatus(value.recoveryStatus) &&
    isReceiptRecoveryPriority(value.priority) &&
    typeof value.recoveryAction === "string" &&
    value.recoveryAction.trim().length > 0 &&
    value.notLegalAdviceBoundary === RECEIPT_RECOVERY_ITEM_BOUNDARY
  );
}

function isIntegrationPolicyEvaluationReceiptBundleRecord(
  value: unknown
): value is IntegrationPolicyEvaluationReceiptBundleRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isIntegrationPolicyId(value.policyId) &&
    typeof value.reportVersion === "string" &&
    (value.overallStatus === "ready" || value.overallStatus === "needs-policy" || value.overallStatus === "blocked") &&
    isValidControlCountPair(value.approvedControlCount, value.requiredControlCount) &&
    value.externalCapabilityAllowed === false &&
    typeof value.externalCapabilityStatus === "string" &&
    isSha256(value.reportHash) &&
    isSha256(value.contextHash) &&
    isSha256(value.policyHash) &&
    typeof value.evaluatorId === "string" &&
    value.source === "server" &&
    typeof value.createdAt === "string" &&
    isNonEmptyStringArray(value.nextActions)
  );
}

function isIntegrationPolicyId(value: unknown): value is IntegrationPolicyId {
  return value === "object-storage" || value === "document-parser" || value === "chain-anchor" || value === "grc-destination";
}

function isReceiptRecoveryPacketStatus(value: unknown): value is IntegrationPolicyReceiptRecoveryPacket["status"] {
  return (
    value === "empty" ||
    value === "missing-receipts" ||
    value === "blocked" ||
    value === "needs-policy" ||
    value === "stale-receipts" ||
    value === "ready"
  );
}

function isReceiptRecoveryStatus(value: unknown): value is IntegrationPolicyReceiptRecoveryItem["recoveryStatus"] {
  return value === "missing-receipt" || value === "blocked" || value === "needs-policy" || value === "stale-receipt" || value === "ready";
}

function isReceiptRecoveryPriority(value: unknown): value is IntegrationPolicyReceiptRecoveryItem["priority"] {
  return value === "P0" || value === "P1" || value === "P2";
}

function isValidControlCountPair(approvedControlCount: unknown, requiredControlCount: unknown): boolean {
  return (
    isNonNegativeInteger(approvedControlCount) &&
    isNonNegativeInteger(requiredControlCount) &&
    approvedControlCount <= requiredControlCount
  );
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((action) => typeof action === "string" && action.trim().length > 0)
  );
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function invalidResponseError(message: string): IntegrationPolicyEvaluationClientError {
  return new IntegrationPolicyEvaluationClientError(message, {
    code: "INTEGRATION_POLICY_EVALUATION_INVALID_RESPONSE",
    recoveryAction: "Verify the Phase 2 API is returning metadata-only policy evaluation receipt records.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
