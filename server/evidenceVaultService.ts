import { createHash } from "node:crypto";
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
  containsRawKycOrPersonalData: boolean;
  createdAt?: string;
};

export function createEvidenceVaultRecordFromUpload(input: EvidenceVaultUploadInput): EvidenceVaultRecord {
  const fileHash = createHash("sha256").update(input.bytes).digest("hex");
  const validation = validateEvidenceUploadBoundary({
    workspaceId: input.workspaceId,
    filename: input.filename,
    byteSize: input.bytes.byteLength,
    declaredHash: fileHash,
    uploadMode: "multipart",
    includesRawDocumentContentInApiJson: false,
    containsRawKycOrPersonalData: input.containsRawKycOrPersonalData
  });

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
    status: "submitted",
    owner: input.owner.trim(),
    sourceNote: input.sourceNote.trim(),
    version: 1,
    linkedRiskFlagIds: [...input.linkedRiskFlagIds],
    containsRawKycOrPersonalData: false,
    createdAt,
    updatedAt: createdAt
  };
}
