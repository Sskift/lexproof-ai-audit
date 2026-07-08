import type { CounselPackExportRecord } from "./phase2Types";
import { sanitizeCounselPackVersionRecord, type CounselPackVersionRecord } from "./counselPackVersions";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import { parseCounselPackExportRecord } from "./counselPackExportRecords";
import { redactClassifiedText } from "./dataClassification";

export type CreateServerCounselPackExportInput = {
  workspaceId: string;
  versionRecord: CounselPackVersionRecord;
  createdBy: string;
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
};

type ErrorResponse = {
  error?: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

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
