import type { CounselPackExportRecord } from "./phase2Types";
import { sanitizeCounselPackVersionRecord, type CounselPackVersionRecord } from "./counselPackVersions";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import { parseCounselPackExportRecord } from "./counselPackExportRecords";
import type {
  CounselPackExportRecoveryPacket,
  CounselPackExportRecoveryPacketItem
} from "./counselPackExportRecordReceipt";
import { redactClassifiedText } from "./dataClassification";

export type CreateServerCounselPackExportInput = {
  workspaceId: string;
  versionRecord: CounselPackVersionRecord;
  createdBy: string;
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
};

export type FetchServerCounselPackExportRecoveryPacketInput = {
  workspaceId: string;
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
};

type ErrorResponse = {
  error?: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

const DEFAULT_API_ERROR_BOUNDARY = "Not legal advice. This API creates audit preparation workflow records only." as const;
const COUNSEL_PACK_EXPORT_RECOVERY_PACKET_BOUNDARY =
  "Not legal advice. Counsel Pack export recovery packets are audit preparation metadata only." as const;
const COUNSEL_PACK_EXPORT_RECOVERY_ITEM_BOUNDARY =
  "Not legal advice. Counsel Pack export recovery items are audit preparation workflow metadata only." as const;

const legalConclusionPattern =
  /\b(final[_\-\s]+legal[_\-\s]+decision|legal[_\-\s]+opinion|legal[_\-\s]+conclusion|legal[_\-\s]+approval|legally[_\-\s]+compliant|legally[_\-\s]+non[_\-\s]+compliant|compliance[_\-\s]+decision)\b/gi;

export type CounselPackExportClientErrorDetails = {
  message: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

export class CounselPackExportClientError extends Error {
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;

  constructor(details: CounselPackExportClientErrorDetails) {
    super(details.message);
    this.name = "CounselPackExportClientError";
    this.code = details.code;
    this.recoveryAction = details.recoveryAction;
    this.notLegalAdviceBoundary = details.notLegalAdviceBoundary;
  }
}

export async function createServerCounselPackExportRecord({
  workspaceId,
  versionRecord,
  createdBy,
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis)
}: CreateServerCounselPackExportInput): Promise<CounselPackExportRecord> {
  if (!fetcher) {
    throw new Error("Fetch is required to create a server Counsel Pack export record.");
  }
  if (!versionRecord.regulatorySourcePack?.packHash) {
    throw new Error("Save a fresh Counsel Pack version with Regulatory Source Pack metadata before server export.");
  }

  const safeVersionRecord = sanitizeCounselPackVersionRecord(versionRecord);
  const safeRegulatorySourcePack = safeVersionRecord.regulatorySourcePack;
  if (!safeRegulatorySourcePack?.packHash) {
    throw new Error("Save a fresh Counsel Pack version with Regulatory Source Pack metadata before server export.");
  }
  const createdByValue = sanitizeExportRequestText(createdBy) || "Compliance";

  const response = await fetcher(buildWorkspaceUrl(apiBaseUrl, workspaceId, "exports/counsel-pack"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectName: sanitizeExportRequestText(safeVersionRecord.projectName) || "Project",
      title: sanitizeExportRequestText(safeVersionRecord.title) || `Counsel Pack v${safeVersionRecord.version}`,
      format: "markdown",
      artifactName: `${slug(sanitizeExportRequestText(safeVersionRecord.projectName) || "lexproof")}-counsel-pack-v${safeVersionRecord.version}.md`,
      manifestHash: safeVersionRecord.manifestHash,
      artifactHash: safeVersionRecord.markdownHash,
      artifactSize: safeVersionRecord.markdownSize,
      riskLevel: safeVersionRecord.riskLevel,
      reviewSummary: safeVersionRecord.reviewSummary,
      sourceCount: safeVersionRecord.sourcePack.length,
      sourcePackHash: safeRegulatorySourcePack.packHash,
      sourceReviewStatus: safeRegulatorySourcePack.sourceReviewStatus,
      ...(safeVersionRecord.jurisdictionReadinessDigest
        ? { jurisdictionReadinessDigest: mapJurisdictionReadinessDigest(safeVersionRecord.jurisdictionReadinessDigest) }
        : {}),
      createdBy: createdByValue,
      includesRawKycOrPersonalData: false,
      includesCredentialMaterial: false
    })
  });

  const payload = (await response.json().catch(() => ({}))) as CounselPackExportRecord | ErrorResponse;

  if (!response.ok) {
    const safeError = asSafeApiErrorResponse(payload);
    throw new CounselPackExportClientError({
      message: safeError.error || "Server Counsel Pack export record creation failed.",
      code: safeError.code,
      recoveryAction: safeError.recoveryAction,
      notLegalAdviceBoundary: safeError.notLegalAdviceBoundary
    });
  }

  const record = parseCounselPackExportRecord(payload);
  if (!record) {
    throw new CounselPackExportClientError({
      message: "Server Counsel Pack export response did not match the metadata-only export record contract.",
      code: "COUNSEL_PACK_EXPORT_RESPONSE_INVALID",
      recoveryAction: "Retry after refreshing the Phase 2 API; do not store the invalid export response.",
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
    });
  }

  return record;
}

export async function fetchServerCounselPackExportRecoveryPacket({
  workspaceId,
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis)
}: FetchServerCounselPackExportRecoveryPacketInput): Promise<CounselPackExportRecoveryPacket> {
  if (!fetcher) {
    throw new CounselPackExportClientError({
      message: "Fetch is required to refresh the server Counsel Pack export recovery packet.",
      code: "COUNSEL_PACK_EXPORT_RECOVERY_FETCH_UNAVAILABLE",
      recoveryAction: "Run this action in a browser or provide a fetch-compatible API client.",
      notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
    });
  }

  const response = await fetcher(buildServerCounselPackExportRecoveryPacketUrl(apiBaseUrl, workspaceId), {
    method: "GET"
  });
  const payload = (await response.json().catch(() => ({}))) as CounselPackExportRecoveryPacket | ErrorResponse;

  if (!response.ok) {
    const safeError = asSafeApiErrorResponse(payload);
    throw new CounselPackExportClientError({
      message: safeError.error || "Server Counsel Pack export recovery packet refresh failed.",
      code: safeError.code ?? "COUNSEL_PACK_EXPORT_RECOVERY_REFRESH_FAILED",
      recoveryAction:
        safeError.recoveryAction ?? "Start the Phase 2 API and retry Counsel Pack export recovery packet refresh.",
      notLegalAdviceBoundary: safeError.notLegalAdviceBoundary ?? DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return redactCounselPackExportRecoveryPacket(validateCounselPackExportRecoveryPacket(payload));
}

export function buildServerCounselPackExportRecoveryPacketUrl(
  apiBaseUrl: string | undefined,
  workspaceId: string
): string {
  const workspace = workspaceId.trim();
  if (!workspace) {
    throw new CounselPackExportClientError({
      message: "Workspace ID is required to refresh the server Counsel Pack export recovery packet.",
      code: "COUNSEL_PACK_EXPORT_RECOVERY_WORKSPACE_REQUIRED",
      recoveryAction: "Create or select a workspace before refreshing persisted Counsel Pack export recovery metadata.",
      notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
    });
  }

  return buildWorkspaceUrl(apiBaseUrl, workspace, "exports/counsel-pack/recovery");
}

function mapJurisdictionReadinessDigest(
  digest: NonNullable<CounselPackVersionRecord["jurisdictionReadinessDigest"]>
): NonNullable<CounselPackExportRecord["jurisdictionReadinessDigest"]> {
  return {
    digestHash: digest.digestHash,
    status: digest.status,
    handoffAllowed: digest.handoffAllowed,
    jurisdictionCount: digest.jurisdictionCount,
    readyForCounselCount: digest.readyForCounselCount,
    needsEvidenceCount: digest.needsEvidenceCount,
    needsSourceReviewCount: digest.needsSourceReviewCount,
    metadataMissingCount: digest.metadataMissingCount,
    openEvidenceRequestCount: digest.openEvidenceRequestCount,
    sourceFreshnessBlockerCount: digest.sourceFreshnessBlockerCount,
    dueSoonSourceCount: digest.dueSoonSourceCount,
    notLegalAdviceBoundary:
      "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
  };
}

function buildWorkspaceUrl(apiBaseUrl: string | undefined, workspaceId: string, route: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/${route}`;
}

function validateCounselPackExportRecoveryPacket(payload: unknown): CounselPackExportRecoveryPacket {
  if (!isCounselPackExportRecoveryPacket(payload)) {
    throw invalidRecoveryPacketResponseError();
  }

  return payload;
}

function isCounselPackExportRecoveryPacket(value: unknown): value is CounselPackExportRecoveryPacket {
  if (!isRecord(value)) {
    return false;
  }

  const items = Array.isArray(value.items) ? value.items : [];
  const blockedCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "blocked").length;
  const needsSourceReviewCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "needs-source-review")
    .length;
  const needsReviewCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "needs-review").length;
  const readyCount = items.filter((item) => isRecord(item) && item.recoveryStatus === "ready").length;
  const recoveryItemCount = items.filter((item) => isRecord(item) && item.recoveryStatus !== "ready").length;

  return (
    value.packetVersion === "lexproof-counsel-pack-export-recovery-packet-v1" &&
    typeof value.workspaceId === "string" &&
    typeof value.generatedAt === "string" &&
    isSha256Hex(value.packetHash) &&
    isNonNegativeInteger(value.recordCount) &&
    value.recordCount === items.length &&
    isNonNegativeInteger(value.recoveryItemCount) &&
    value.recoveryItemCount === recoveryItemCount &&
    isNonNegativeInteger(value.blockedCount) &&
    value.blockedCount === blockedCount &&
    isNonNegativeInteger(value.needsSourceReviewCount) &&
    value.needsSourceReviewCount === needsSourceReviewCount &&
    isNonNegativeInteger(value.needsReviewCount) &&
    value.needsReviewCount === needsReviewCount &&
    isNonNegativeInteger(value.readyCount) &&
    value.readyCount === readyCount &&
    (value.latestExportRecordId === undefined || typeof value.latestExportRecordId === "string") &&
    isNonEmptyStringArray(value.nextActions) &&
    items.every(isCounselPackExportRecoveryPacketItem) &&
    value.notLegalAdviceBoundary === COUNSEL_PACK_EXPORT_RECOVERY_PACKET_BOUNDARY
  );
}

function isCounselPackExportRecoveryPacketItem(value: unknown): value is CounselPackExportRecoveryPacketItem {
  if (!isRecord(value) || !isRecord(value.hashes)) {
    return false;
  }

  return (
    typeof value.exportRecordId === "string" &&
    isPositiveInteger(value.version) &&
    typeof value.artifactName === "string" &&
    typeof value.createdAt === "string" &&
    isSourceReviewStatus(value.sourceReviewStatus) &&
    (value.jurisdictionReadinessStatus === undefined ||
      isJurisdictionReadinessStatus(value.jurisdictionReadinessStatus)) &&
    (value.jurisdictionHandoffAllowed === undefined || typeof value.jurisdictionHandoffAllowed === "boolean") &&
    isReviewSummary(value.reviewSummary) &&
    isRecoveryStatus(value.recoveryStatus) &&
    isRecoveryPriority(value.priority) &&
    typeof value.recoveryAction === "string" &&
    value.recoveryAction.trim().length > 0 &&
    isSha256Hex(value.hashes.manifestHash) &&
    isSha256Hex(value.hashes.artifactHash) &&
    isSha256Hex(value.hashes.sourcePackHash) &&
    value.notLegalAdviceBoundary === COUNSEL_PACK_EXPORT_RECOVERY_ITEM_BOUNDARY
  );
}

function redactCounselPackExportRecoveryPacket(
  packet: CounselPackExportRecoveryPacket
): CounselPackExportRecoveryPacket {
  return {
    ...packet,
    workspaceId: sanitizeExportRequestText(packet.workspaceId),
    generatedAt: sanitizeExportRequestText(packet.generatedAt),
    ...(packet.latestExportRecordId ? { latestExportRecordId: sanitizeExportRequestText(packet.latestExportRecordId) } : {}),
    nextActions: packet.nextActions.map(sanitizeExportRequestText).filter(Boolean),
    items: packet.items.map(redactCounselPackExportRecoveryPacketItem)
  };
}

function redactCounselPackExportRecoveryPacketItem(
  item: CounselPackExportRecoveryPacketItem
): CounselPackExportRecoveryPacketItem {
  return {
    ...item,
    exportRecordId: sanitizeExportRequestText(item.exportRecordId),
    artifactName: sanitizeExportRequestText(item.artifactName),
    createdAt: sanitizeExportRequestText(item.createdAt),
    recoveryAction: sanitizeExportRequestText(item.recoveryAction),
    reviewSummary: { ...item.reviewSummary },
    hashes: { ...item.hashes }
  };
}

function isReviewSummary(value: unknown): value is CounselPackExportRecord["reviewSummary"] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonNegativeInteger(value.total) &&
    isNonNegativeInteger(value.reviewed) &&
    isNonNegativeInteger(value.readyForCounsel) &&
    isNonNegativeInteger(value.needsEvidence) &&
    isNonNegativeInteger(value.blocked) &&
    isNonNegativeInteger(value.open)
  );
}

function isSourceReviewStatus(value: unknown): value is CounselPackExportRecord["sourceReviewStatus"] {
  return value === "current" || value === "review-due" || value === "metadata-missing";
}

function isJurisdictionReadinessStatus(
  value: unknown
): value is NonNullable<CounselPackExportRecord["jurisdictionReadinessDigest"]>["status"] {
  return (
    value === "ready-for-counsel" ||
    value === "needs-evidence" ||
    value === "needs-source-review" ||
    value === "metadata-missing" ||
    value === "no-jurisdictions"
  );
}

function isRecoveryStatus(value: unknown): value is CounselPackExportRecoveryPacketItem["recoveryStatus"] {
  return value === "blocked" || value === "needs-source-review" || value === "needs-review" || value === "ready";
}

function isRecoveryPriority(value: unknown): value is CounselPackExportRecoveryPacketItem["priority"] {
  return value === "P0" || value === "P1" || value === "P2" || value === "P3";
}

function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function invalidRecoveryPacketResponseError(): CounselPackExportClientError {
  return new CounselPackExportClientError({
    message: "Server Counsel Pack export recovery packet response did not match the metadata-only contract.",
    code: "COUNSEL_PACK_EXPORT_RECOVERY_RESPONSE_INVALID",
    recoveryAction:
      "Verify the Phase 2 API is returning metadata-only Counsel Pack export recovery packet records with non-empty next actions.",
    notLegalAdviceBoundary: DEFAULT_API_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "lexproof"
  );
}

function sanitizeExportRequestText(value: string): string {
  return redactClassifiedText(value)
    .replace(
      /\b(?:api[_\-\s]?key|apiKey|secret[_\-\s]?key|secretKey|client[_\-\s]?secret|client secret|clientSecret|bearer token|bearerToken|access[_\-\s]?token|accessToken|refresh[_\-\s]?token|refreshToken|session[_\-\s]?token|sessionToken|webhook[_\-\s]?secret|webhookSecret|password|passphrase)\s*[:=]\s*\[redacted-secret\]/gi,
      "[redacted-secret]"
    )
    .replace(/raw[_\-\s]+kyc/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-\[redacted-raw-kyc\]\]/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-raw-kyc\]\s+(?:packet|file|document|upload|room|dump|csv|spreadsheet|passport|data)\b/gi, "[redacted-raw-kyc]")
    .replace(/\bprivate\s+key\s+\[redacted-private-key\]/gi, "[redacted-private-key]")
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image|data)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}
