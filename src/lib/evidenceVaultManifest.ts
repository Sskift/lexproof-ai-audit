import type { EvidenceVaultRecord } from "./phase2Types.js";

export type EvidenceVaultManifestItem = {
  sequence: number;
  evidenceId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  fileHash: string;
  storageMode: EvidenceVaultRecord["storageMode"];
  status: EvidenceVaultRecord["status"];
  owner: string;
  version: number;
  linkedRiskFlagIds: string[];
  containsRawKycOrPersonalData: boolean;
  parentEvidenceId?: string;
  supersededByEvidenceId?: string;
  replacementReason?: string;
};

export type EvidenceVaultManifest = {
  manifestVersion: "lexproof-evidence-vault-manifest-v1";
  workspaceId: string;
  generatedAt: string;
  itemCount: number;
  items: EvidenceVaultManifestItem[];
  bundleHash: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only.";
};

export type CreateEvidenceVaultManifestInput = {
  workspaceId: string;
  records: EvidenceVaultRecord[];
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Evidence manifests summarize audit preparation metadata only.";

export async function createEvidenceVaultManifest(input: CreateEvidenceVaultManifestInput): Promise<EvidenceVaultManifest> {
  const items = sortEvidenceRecords(input.records).map(createManifestItem);
  const hashPayload = {
    manifestVersion: "lexproof-evidence-vault-manifest-v1",
    workspaceId: input.workspaceId,
    items
  };

  return {
    manifestVersion: "lexproof-evidence-vault-manifest-v1",
    workspaceId: input.workspaceId,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    itemCount: items.length,
    items,
    bundleHash: await sha256Hex(stableStringify(hashPayload)),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportEvidenceVaultManifestJson(manifest: EvidenceVaultManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function createManifestItem(record: EvidenceVaultRecord, index: number): EvidenceVaultManifestItem {
  return {
    sequence: index + 1,
    evidenceId: record.id,
    filename: record.filename,
    mimeType: record.mimeType,
    byteSize: record.byteSize,
    fileHash: record.fileHash,
    storageMode: record.storageMode,
    status: record.status,
    owner: record.owner,
    version: record.version,
    linkedRiskFlagIds: [...record.linkedRiskFlagIds].sort((left, right) => left.localeCompare(right)),
    containsRawKycOrPersonalData: record.containsRawKycOrPersonalData,
    ...(record.parentEvidenceId ? { parentEvidenceId: record.parentEvidenceId } : {}),
    ...(record.supersededByEvidenceId ? { supersededByEvidenceId: record.supersededByEvidenceId } : {}),
    ...(record.replacementReason ? { replacementReason: record.replacementReason } : {})
  };
}

function sortEvidenceRecords(records: EvidenceVaultRecord[]): EvidenceVaultRecord[] {
  return [...records].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id) ||
      left.fileHash.localeCompare(right.fileHash)
  );
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
