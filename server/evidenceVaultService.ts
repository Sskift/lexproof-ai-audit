import { createHash } from "node:crypto";
import { validateEvidenceMetadataBoundary } from "../src/lib/evidenceUploadBoundary.js";
import { validateEvidenceUploadBoundary } from "../src/lib/phase2ApiContracts.js";
import type { EvidenceVaultRecord } from "../src/lib/phase2Types.js";

export type EvidenceVaultUploadInput = {
  workspaceId: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  owner: string;
  sourceNote: string;
  linkedRiskFlagIds: string[];
  linkedControlIds: string[];
  containsRawKycOrPersonalData: boolean;
  parentEvidenceId?: string;
  replacementReason?: string;
  baseVersion?: number;
  createdAt?: string;
};

export function createEvidenceVaultRecordFromUpload(input: EvidenceVaultUploadInput): EvidenceVaultRecord {
  const fileHash = createHash("sha256").update(input.bytes).digest("hex");
  const linkedControlIds = normalizeControlIds(input.linkedControlIds);
  const metadataBoundary = validateEvidenceMetadataBoundary({
    filename: input.filename,
    owner: input.owner,
    sourceNote: input.sourceNote,
    linkedRiskFlagIds: input.linkedRiskFlagIds,
    linkedControlIds,
    replacementReason: input.replacementReason
  });
  const validation = validateEvidenceUploadBoundary({
    workspaceId: input.workspaceId,
    filename: input.filename,
    byteSize: input.bytes.byteLength,
    declaredHash: fileHash,
    uploadMode: "multipart",
    includesRawDocumentContentInApiJson: false,
    containsRawKycOrPersonalData: input.containsRawKycOrPersonalData
  });

  if (!metadataBoundary.valid) {
    throw new Error(metadataBoundary.errors.join(" "));
  }

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    recordVersion: "lexproof-evidence-vault-record-v1",
    id: `evidence-vault-${fileHash.slice(0, 16)}`,
    workspaceId: input.workspaceId,
    filename: input.filename.trim(),
    mimeType: input.mimeType.trim() || "application/octet-stream",
    byteSize: input.bytes.byteLength,
    fileHash,
    storageMode: "server-vault",
    status: "received",
    owner: input.owner.trim(),
    sourceNote: input.sourceNote.trim(),
    version: input.baseVersion ? input.baseVersion + 1 : 1,
    linkedRiskFlagIds: [...input.linkedRiskFlagIds],
    linkedControlIds,
    containsRawKycOrPersonalData: false,
    parentEvidenceId: normalizeOptional(input.parentEvidenceId),
    supersededByEvidenceId: undefined,
    replacementReason: normalizeOptional(input.replacementReason),
    createdAt,
    updatedAt: createdAt
  };
}

export function supersedeEvidenceVaultRecord(
  record: EvidenceVaultRecord,
  replacement: EvidenceVaultRecord,
  replacementReason: string
): EvidenceVaultRecord {
  return {
    ...record,
    status: "superseded",
    supersededByEvidenceId: replacement.id,
    replacementReason: replacementReason.trim(),
    version: Math.max(record.version + 1, replacement.version),
    updatedAt: replacement.createdAt
  };
}

export function findDuplicateEvidenceVaultRecord(
  records: EvidenceVaultRecord[],
  candidate: Pick<EvidenceVaultRecord, "id" | "fileHash">
): EvidenceVaultRecord | null {
  return (
    records.find((record) => record.fileHash === candidate.fileHash && record.status !== "superseded") ?? null
  );
}

function normalizeOptional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeControlIds(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)));
}
