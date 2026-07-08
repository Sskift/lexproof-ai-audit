import type { EvidenceVaultManifest } from "./evidenceVaultManifest.js";
import {
  createEvidenceVaultLineageDigest,
  type EvidenceVaultLineageDigest,
  type EvidenceVaultLineageDigestStatus
} from "./evidenceVaultLineageDigest.js";
import type { EvidenceVaultRecord, EvidenceVaultStatus } from "./phase2Types.js";

export type EvidenceVaultLineageRecoveryStatus = EvidenceVaultLineageDigestStatus;
export type EvidenceVaultLineageRecoveryPriority = "P0" | "P1" | "P2";
export type EvidenceVaultLineageRecoveryItemStatus = EvidenceVaultStatus | "manifest-missing";

export type EvidenceVaultLineageRecoveryPacketItem = {
  itemVersion: "lexproof-evidence-vault-lineage-recovery-item-v1";
  evidenceId: string;
  filename: string;
  evidenceStatus: EvidenceVaultLineageRecoveryItemStatus;
  version: number;
  fileHash: string;
  linkedRiskFlagIds: string[];
  linkedControlIds: string[];
  recoveryStatus: Exclude<EvidenceVaultLineageRecoveryStatus, "empty" | "ready">;
  priority: EvidenceVaultLineageRecoveryPriority;
  recoveryAction: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery items are audit preparation metadata only.";
};

export type EvidenceVaultLineageRecoverySummary = {
  totalRecoveryCount: number;
  openRejectedCount: number;
  missingManifestCount: number;
  activeRecordCount: number;
  lineageLinkCount: number;
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only.";
};

export type EvidenceVaultLineageRecoveryPacket = {
  packetVersion: "lexproof-evidence-vault-lineage-recovery-packet-v1";
  workspaceId: string;
  generatedAt: string;
  status: EvidenceVaultLineageRecoveryStatus;
  lineageDigestHash: string;
  manifestHash: string | null;
  summary: EvidenceVaultLineageRecoverySummary;
  items: EvidenceVaultLineageRecoveryPacketItem[];
  nextActions: string[];
  packetHash: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only.";
};

export type CreateEvidenceVaultLineageRecoveryPacketInput = {
  workspaceId: string;
  records: EvidenceVaultRecord[];
  manifest?: Pick<EvidenceVaultManifest, "bundleHash" | "itemCount"> | null;
  generatedAt?: string;
};

type EvidenceVaultLineageRecoveryPacketSubject = Omit<EvidenceVaultLineageRecoveryPacket, "generatedAt" | "packetHash">;

type BrowserDownloadAnchor = {
  href: string;
  download: string;
  click: () => void;
};

type BrowserDownloadRuntime = {
  Blob: new (parts: string[], options?: { type?: string }) => unknown;
  URL: {
    createObjectURL: (blob: unknown) => string;
    revokeObjectURL: (url: string) => void;
  };
  document: {
    createElement: (tagName: "a") => BrowserDownloadAnchor;
  };
};

const PACKET_BOUNDARY = "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only." as const;
const ITEM_BOUNDARY = "Not legal advice. Evidence Vault lineage recovery items are audit preparation metadata only." as const;

export async function createEvidenceVaultLineageRecoveryPacket(
  input: CreateEvidenceVaultLineageRecoveryPacketInput
): Promise<EvidenceVaultLineageRecoveryPacket> {
  const digest = await createEvidenceVaultLineageDigest({
    workspaceId: input.workspaceId,
    records: input.records,
    manifest: input.manifest,
    generatedAt: input.generatedAt
  });
  const records = sortRecords(input.records);
  const items = createRecoveryItems(records, digest);
  const nextActions = createNextActions(digest.readinessStatus, items);
  const subject: EvidenceVaultLineageRecoveryPacketSubject = {
    packetVersion: "lexproof-evidence-vault-lineage-recovery-packet-v1",
    workspaceId: input.workspaceId,
    status: digest.readinessStatus,
    lineageDigestHash: digest.digestHash,
    manifestHash: digest.manifestHash,
    summary: {
      totalRecoveryCount: items.length,
      openRejectedCount: digest.lineageCounts.openRejectedRecords,
      missingManifestCount: digest.readinessStatus === "needs-manifest" ? 1 : 0,
      activeRecordCount: digest.lineageCounts.activeRecords,
      lineageLinkCount: digest.lineageCounts.lineageLinkCount,
      nextAction: nextActions[0],
      notLegalAdviceBoundary: PACKET_BOUNDARY
    },
    items,
    nextActions,
    notLegalAdviceBoundary: PACKET_BOUNDARY
  };

  return {
    ...subject,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    packetHash: await sha256Hex(stableStringify(subject))
  };
}

export function exportEvidenceVaultLineageRecoveryPacketJson(packet: EvidenceVaultLineageRecoveryPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

export function downloadEvidenceVaultLineageRecoveryPacketJson(
  filename: string,
  packet: EvidenceVaultLineageRecoveryPacket
): void {
  const runtime = globalThis as unknown as Partial<BrowserDownloadRuntime>;
  if (!runtime.Blob || !runtime.URL?.createObjectURL || !runtime.URL.revokeObjectURL || !runtime.document?.createElement) {
    return;
  }

  const blob = new runtime.Blob([exportEvidenceVaultLineageRecoveryPacketJson(packet)], {
    type: "application/json;charset=utf-8"
  });
  const url = runtime.URL.createObjectURL(blob);
  const anchor = runtime.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  runtime.URL.revokeObjectURL(url);
}

function createRecoveryItems(
  records: EvidenceVaultRecord[],
  digest: EvidenceVaultLineageDigest
): EvidenceVaultLineageRecoveryPacketItem[] {
  const items = records
    .filter((record) => record.status === "rejected" && !record.supersededByEvidenceId)
    .map(createRejectedEvidenceRecoveryItem);

  if (digest.readinessStatus === "needs-manifest") {
    items.push({
      itemVersion: "lexproof-evidence-vault-lineage-recovery-item-v1",
      evidenceId: "evidence-vault-manifest",
      filename: "Evidence Vault Manifest",
      evidenceStatus: "manifest-missing",
      version: 0,
      fileHash: "",
      linkedRiskFlagIds: digest.linkedRiskFlagIds,
      linkedControlIds: digest.linkedControlIds,
      recoveryStatus: "needs-manifest",
      priority: "P1",
      recoveryAction: "Refresh the Evidence Vault Manifest so lineage metadata is tied to a stable bundle hash.",
      notLegalAdviceBoundary: ITEM_BOUNDARY
    });
  }

  return items.sort(compareRecoveryItems);
}

function createRejectedEvidenceRecoveryItem(record: EvidenceVaultRecord): EvidenceVaultLineageRecoveryPacketItem {
  return {
    itemVersion: "lexproof-evidence-vault-lineage-recovery-item-v1",
    evidenceId: record.id,
    filename: record.filename,
    evidenceStatus: record.status,
    version: record.version,
    fileHash: record.fileHash,
    linkedRiskFlagIds: uniqueSorted(record.linkedRiskFlagIds),
    linkedControlIds: uniqueSorted(record.linkedControlIds),
    recoveryStatus: "needs-replacement",
    priority: "P0",
    recoveryAction: "Create metadata-only replacement evidence for this rejected vault record before final counsel handoff.",
    notLegalAdviceBoundary: ITEM_BOUNDARY
  };
}

function createNextActions(
  status: EvidenceVaultLineageRecoveryStatus,
  items: EvidenceVaultLineageRecoveryPacketItem[]
): string[] {
  if (status === "empty") {
    return ["Add metadata-only evidence records, then sync the Evidence Vault before counsel handoff."];
  }

  if (items.some((item) => item.recoveryStatus === "needs-replacement")) {
    return ["Create metadata-only replacement records for rejected vault evidence before final counsel handoff."];
  }

  if (items.some((item) => item.recoveryStatus === "needs-manifest") || status === "needs-manifest") {
    return ["Refresh the Evidence Vault Manifest so lineage metadata is tied to a stable bundle hash."];
  }

  return ["Keep the Evidence Vault lineage recovery packet with the final manifest and Counsel Pack handoff."];
}

function compareRecoveryItems(
  left: EvidenceVaultLineageRecoveryPacketItem,
  right: EvidenceVaultLineageRecoveryPacketItem
): number {
  return (
    priorityWeight(left.priority) - priorityWeight(right.priority) ||
    left.recoveryStatus.localeCompare(right.recoveryStatus) ||
    left.evidenceId.localeCompare(right.evidenceId)
  );
}

function priorityWeight(priority: EvidenceVaultLineageRecoveryPriority): number {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

function sortRecords(records: EvidenceVaultRecord[]): EvidenceVaultRecord[] {
  return [...records].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id) ||
      left.fileHash.localeCompare(right.fileHash)
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));
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
