import { redactClassifiedText } from "./dataClassification";
import type {
  EvidenceVaultManifestResponse,
  EvidenceVaultRecordResponse,
  EvidenceVaultReplacementResult,
  EvidenceVaultSyncResult
} from "./evidenceVaultClient";

const SYNC_BOUNDARY = "Not legal advice. Evidence Vault sync creates audit preparation metadata only." as const;
const MANIFEST_BOUNDARY = "Not legal advice. Evidence manifests summarize audit preparation metadata only." as const;
const REPLACEMENT_BOUNDARY = "Not legal advice. Evidence replacement records are audit preparation metadata only." as const;
const legalConclusionPattern =
  /\b(final legal decision|legal opinion|legal conclusion|legally compliant|legally non-compliant|compliance decision|legal approval)\b/gi;

export function redactEvidenceVaultSyncResult(result: EvidenceVaultSyncResult): EvidenceVaultSyncResult {
  const records = mapPossiblyChanged(result.records, redactEvidenceVaultRecordResponse);
  const manifest = redactEvidenceVaultManifestResponse(result.manifest);
  const syncedAt = redactEvidenceVaultText(result.syncedAt);
  const changed =
    records.changed ||
    manifest !== result.manifest ||
    syncedAt !== result.syncedAt ||
    result.notLegalAdviceBoundary !== SYNC_BOUNDARY;

  if (!changed) {
    return result;
  }

  return {
    ...result,
    records: records.value,
    manifest,
    syncedAt,
    notLegalAdviceBoundary: SYNC_BOUNDARY
  };
}

export function redactEvidenceVaultRecordResponses(records: EvidenceVaultRecordResponse[]): EvidenceVaultRecordResponse[] {
  const redacted = mapPossiblyChanged(records, redactEvidenceVaultRecordResponse);
  return redacted.changed ? redacted.value : records;
}

export function redactEvidenceVaultRecordResponse(record: EvidenceVaultRecordResponse): EvidenceVaultRecordResponse {
  const redacted = redactEvidenceVaultRecordShape(record);

  return JSON.stringify(redacted) === JSON.stringify(record) ? record : (redacted as EvidenceVaultRecordResponse);
}

export function redactEvidenceVaultManifestResponse(manifest: EvidenceVaultManifestResponse): EvidenceVaultManifestResponse {
  const workspaceId = redactEvidenceVaultText(manifest.workspaceId);
  const generatedAt = redactEvidenceVaultText(manifest.generatedAt);
  const items = mapPossiblyChanged(manifest.items, redactEvidenceVaultManifestItem);
  const bundleHash = redactEvidenceVaultHash(manifest.bundleHash);
  const changed =
    workspaceId !== manifest.workspaceId ||
    generatedAt !== manifest.generatedAt ||
    items.changed ||
    bundleHash !== manifest.bundleHash ||
    manifest.notLegalAdviceBoundary !== MANIFEST_BOUNDARY;

  if (!changed) {
    return manifest;
  }

  return {
    ...manifest,
    workspaceId,
    generatedAt,
    items: items.value,
    bundleHash,
    notLegalAdviceBoundary: MANIFEST_BOUNDARY
  };
}

export function redactEvidenceVaultReplacementResult(result: EvidenceVaultReplacementResult): EvidenceVaultReplacementResult {
  const superseded = redactEvidenceVaultRecordResponse(result.superseded);
  const replacement = redactEvidenceVaultRecordResponse(result.replacement);
  const changed =
    superseded !== result.superseded ||
    replacement !== result.replacement ||
    result.notLegalAdviceBoundary !== REPLACEMENT_BOUNDARY;

  if (!changed) {
    return result;
  }

  return {
    ...result,
    superseded,
    replacement,
    notLegalAdviceBoundary: REPLACEMENT_BOUNDARY
  };
}

function redactEvidenceVaultManifestItem(
  item: EvidenceVaultManifestResponse["items"][number]
): { value: EvidenceVaultManifestResponse["items"][number]; changed: boolean } {
  const redacted: Record<string, unknown> = { ...item };

  redactStringFields(redacted, [
    "evidenceId",
    "filename",
    "mimeType",
    "owner",
    "parentEvidenceId",
    "supersededByEvidenceId",
    "replacementReason"
  ]);

  if (typeof redacted.fileHash === "string") {
    redacted.fileHash = redactEvidenceVaultHash(redacted.fileHash);
  }
  if (Array.isArray(redacted.linkedRiskFlagIds)) {
    redacted.linkedRiskFlagIds = redacted.linkedRiskFlagIds.map((value) =>
      typeof value === "string" ? redactEvidenceVaultText(value) : value
    );
  }
  if (Array.isArray(redacted.linkedControlIds)) {
    redacted.linkedControlIds = redacted.linkedControlIds.map((value) =>
      typeof value === "string" ? redactEvidenceVaultText(value) : value
    );
  }

  return {
    value: redacted as EvidenceVaultManifestResponse["items"][number],
    changed: JSON.stringify(redacted) !== JSON.stringify(item)
  };
}

function redactEvidenceVaultRecordShape(record: EvidenceVaultRecordResponse): Record<string, unknown> {
  const redacted: Record<string, unknown> = { ...record };

  redactStringFields(redacted, [
    "id",
    "workspaceId",
    "filename",
    "mimeType",
    "owner",
    "sourceNote",
    "parentEvidenceId",
    "supersededByEvidenceId",
    "replacementReason",
    "createdAt",
    "updatedAt"
  ]);

  if (typeof redacted.fileHash === "string") {
    redacted.fileHash = redactEvidenceVaultHash(redacted.fileHash);
  }
  if (Array.isArray(redacted.linkedRiskFlagIds)) {
    redacted.linkedRiskFlagIds = redacted.linkedRiskFlagIds.map((value) =>
      typeof value === "string" ? redactEvidenceVaultText(value) : value
    );
  }
  if (Array.isArray(redacted.linkedControlIds)) {
    redacted.linkedControlIds = redacted.linkedControlIds.map((value) =>
      typeof value === "string" ? redactEvidenceVaultText(value) : value
    );
  }

  return redacted;
}

function redactStringFields(record: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    if (typeof record[field] === "string") {
      record[field] = redactEvidenceVaultText(record[field]);
    }
  }
}

function mapPossiblyChanged<T>(
  values: T[],
  mapper: (value: T) => T | { value: T; changed: boolean }
): { value: T[]; changed: boolean } {
  let changed = false;
  const mapped = values.map((value) => {
    const result = mapper(value);
    if (isMappedResult(result)) {
      changed = changed || result.changed;
      return result.value;
    }

    changed = changed || result !== value;
    return result;
  });

  return changed ? { value: mapped, changed: true } : { value: values, changed: false };
}

function isMappedResult<T>(value: T | { value: T; changed: boolean }): value is { value: T; changed: boolean } {
  return Boolean(value && typeof value === "object" && "value" in value && "changed" in value);
}

function redactEvidenceVaultHash(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (/^[a-f0-9]{64}$/.test(normalized)) {
    return normalized;
  }

  return redactEvidenceVaultText(value);
}

function redactEvidenceVaultText(value: string): string {
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
