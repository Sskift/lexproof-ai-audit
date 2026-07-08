import { redactClassifiedText } from "./dataClassification.js";
import type { CounselPackExportRecord } from "./phase2Types.js";

const COUNSEL_PACK_EXPORT_BOUNDARY = "Not legal advice. Counsel Pack export records are audit preparation metadata only." as const;
const JURISDICTION_READINESS_BOUNDARY =
  "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only." as const;
const exportFormats = ["markdown", "print-pdf"] as const;
const riskLevels = ["low", "moderate", "high", "critical"] as const;
const sourceReviewStatuses = ["current", "review-due", "metadata-missing"] as const;
const jurisdictionReadinessStatuses = [
  "ready-for-counsel",
  "needs-evidence",
  "needs-source-review",
  "metadata-missing",
  "no-jurisdictions"
] as const;
const sha256HexPattern = /^[a-f0-9]{64}$/;
const legalConclusionPattern =
  /\b(final[_\-\s]+legal[_\-\s]+decision|legal[_\-\s]+opinion|legal[_\-\s]+conclusion|legal[_\-\s]+approval|legally[_\-\s]+compliant|legally[_\-\s]+non[_\-\s]+compliant|compliance[_\-\s]+decision)\b/gi;

export function parseStoredCounselPackExportRecords(raw: string | null | undefined): CounselPackExportRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.flatMap((item) => {
          const record = parseCounselPackExportRecord(item);
          return record ? [record] : [];
        })
      : [];
  } catch {
    return [];
  }
}

export function parseCounselPackExportRecord(value: unknown): CounselPackExportRecord | null {
  if (!isRecord(value) || value.recordVersion !== "lexproof-counsel-pack-export-record-v1") {
    return null;
  }
  if (value.notLegalAdviceBoundary !== COUNSEL_PACK_EXPORT_BOUNDARY) {
    return null;
  }

  const reviewSummary = parseReviewSummary(value.reviewSummary);
  const jurisdictionReadinessDigest =
    value.jurisdictionReadinessDigest === undefined
      ? undefined
      : parseJurisdictionReadinessDigest(value.jurisdictionReadinessDigest);

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.workspaceId) ||
    value.exportType !== "counsel-pack" ||
    !isOneOf(value.format, exportFormats) ||
    !isPositiveInteger(value.version) ||
    !isNonEmptyString(value.projectName) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.artifactName) ||
    !isSha256Hex(value.manifestHash) ||
    !isSha256Hex(value.artifactHash) ||
    !isPositiveInteger(value.artifactSize) ||
    !isOneOf(value.riskLevel, riskLevels) ||
    !reviewSummary ||
    !isCount(value.sourceCount) ||
    !isSha256Hex(value.sourcePackHash) ||
    !isOneOf(value.sourceReviewStatus, sourceReviewStatuses) ||
    jurisdictionReadinessDigest === null ||
    !isNonEmptyString(value.createdBy) ||
    value.status !== "ready" ||
    !isStrictIsoTimestamp(value.createdAt)
  ) {
    return null;
  }

  return sanitizeCounselPackExportRecord({
    recordVersion: "lexproof-counsel-pack-export-record-v1",
    id: value.id,
    workspaceId: value.workspaceId,
    exportType: "counsel-pack",
    format: value.format,
    version: value.version,
    projectName: value.projectName,
    title: value.title,
    artifactName: value.artifactName,
    manifestHash: value.manifestHash,
    artifactHash: value.artifactHash,
    artifactSize: value.artifactSize,
    riskLevel: value.riskLevel,
    reviewSummary,
    sourceCount: value.sourceCount,
    sourcePackHash: value.sourcePackHash,
    sourceReviewStatus: value.sourceReviewStatus,
    ...(jurisdictionReadinessDigest ? { jurisdictionReadinessDigest } : {}),
    createdBy: value.createdBy,
    status: "ready",
    createdAt: value.createdAt,
    notLegalAdviceBoundary: COUNSEL_PACK_EXPORT_BOUNDARY
  });
}

export function sanitizeCounselPackExportRecord(record: CounselPackExportRecord): CounselPackExportRecord {
  const jurisdictionReadinessDigest = record.jurisdictionReadinessDigest
    ? sanitizeJurisdictionReadinessDigest(record.jurisdictionReadinessDigest)
    : undefined;

  return {
    recordVersion: "lexproof-counsel-pack-export-record-v1",
    id: sanitizeExportRecordText(record.id) || "counsel-pack-export",
    workspaceId: sanitizeExportRecordText(record.workspaceId) || "workspace",
    exportType: "counsel-pack",
    format: record.format,
    version: record.version,
    projectName: sanitizeExportRecordText(record.projectName) || "Project",
    title: sanitizeExportRecordText(record.title) || `Counsel Pack v${record.version}`,
    artifactName: sanitizeExportRecordText(record.artifactName) || `counsel-pack-v${record.version}.md`,
    manifestHash: record.manifestHash,
    artifactHash: record.artifactHash,
    artifactSize: record.artifactSize,
    riskLevel: record.riskLevel,
    reviewSummary: { ...record.reviewSummary },
    sourceCount: record.sourceCount,
    sourcePackHash: record.sourcePackHash,
    sourceReviewStatus: record.sourceReviewStatus,
    ...(jurisdictionReadinessDigest ? { jurisdictionReadinessDigest } : {}),
    createdBy: sanitizeExportRecordText(record.createdBy) || "Compliance",
    status: "ready",
    createdAt: sanitizeExportRecordText(record.createdAt),
    notLegalAdviceBoundary: COUNSEL_PACK_EXPORT_BOUNDARY
  };
}

function parseReviewSummary(value: unknown): CounselPackExportRecord["reviewSummary"] | null {
  if (
    !isRecord(value) ||
    !isCount(value.total) ||
    !isCount(value.reviewed) ||
    !isCount(value.readyForCounsel) ||
    !isCount(value.needsEvidence) ||
    !isCount(value.blocked) ||
    !isCount(value.open)
  ) {
    return null;
  }

  return {
    total: value.total,
    reviewed: value.reviewed,
    readyForCounsel: value.readyForCounsel,
    needsEvidence: value.needsEvidence,
    blocked: value.blocked,
    open: value.open
  };
}

function parseJurisdictionReadinessDigest(
  value: unknown
): NonNullable<CounselPackExportRecord["jurisdictionReadinessDigest"]> | null {
  if (
    !isRecord(value) ||
    value.notLegalAdviceBoundary !== JURISDICTION_READINESS_BOUNDARY ||
    !isSha256Hex(value.digestHash) ||
    !isOneOf(value.status, jurisdictionReadinessStatuses) ||
    typeof value.handoffAllowed !== "boolean" ||
    !isCount(value.jurisdictionCount) ||
    !isCount(value.readyForCounselCount) ||
    !isCount(value.needsEvidenceCount) ||
    !isCount(value.needsSourceReviewCount) ||
    !isCount(value.metadataMissingCount) ||
    !isCount(value.openEvidenceRequestCount) ||
    !isCount(value.sourceFreshnessBlockerCount) ||
    !isCount(value.dueSoonSourceCount)
  ) {
    return null;
  }

  return sanitizeJurisdictionReadinessDigest({
    digestHash: value.digestHash,
    status: value.status,
    handoffAllowed: value.handoffAllowed,
    jurisdictionCount: value.jurisdictionCount,
    readyForCounselCount: value.readyForCounselCount,
    needsEvidenceCount: value.needsEvidenceCount,
    needsSourceReviewCount: value.needsSourceReviewCount,
    metadataMissingCount: value.metadataMissingCount,
    openEvidenceRequestCount: value.openEvidenceRequestCount,
    sourceFreshnessBlockerCount: value.sourceFreshnessBlockerCount,
    dueSoonSourceCount: value.dueSoonSourceCount,
    notLegalAdviceBoundary: JURISDICTION_READINESS_BOUNDARY
  });
}

function sanitizeJurisdictionReadinessDigest(
  digest: NonNullable<CounselPackExportRecord["jurisdictionReadinessDigest"]>
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
    notLegalAdviceBoundary: JURISDICTION_READINESS_BOUNDARY
  };
}

function sanitizeExportRecordText(value: string): string {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<const T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && sha256HexPattern.test(value);
}

function isStrictIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}
