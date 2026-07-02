import type { EvidenceVaultManifest } from "./evidenceVaultManifest.js";
import type { EvidenceVaultRecord, EvidenceVaultStatus } from "./phase2Types.js";

export type EvidenceVaultLineageDigestStatus = "empty" | "ready" | "needs-replacement" | "needs-manifest";

export type EvidenceVaultLineageLink = {
  parentEvidenceId: string;
  replacementEvidenceId: string;
  parentStatus: EvidenceVaultStatus;
  replacementStatus: EvidenceVaultStatus;
  replacementVersion: number;
  replacementReasonHash?: string;
};

export type EvidenceVaultLineageCounts = {
  activeRecords: number;
  replacedRecords: number;
  openRejectedRecords: number;
  lineageLinkCount: number;
  linkedControlCount: number;
  linkedRiskFlagCount: number;
};

export type EvidenceVaultLineageDigest = {
  digestVersion: "lexproof-evidence-vault-lineage-digest-v1";
  workspaceId: string;
  generatedAt: string;
  readinessStatus: EvidenceVaultLineageDigestStatus;
  manifestHash: string | null;
  itemCount: number;
  statusCounts: Partial<Record<EvidenceVaultStatus, number>>;
  lineageCounts: EvidenceVaultLineageCounts;
  lineageLinks: EvidenceVaultLineageLink[];
  activeEvidenceIds: string[];
  openRejectedEvidenceIds: string[];
  linkedControlIds: string[];
  linkedRiskFlagIds: string[];
  nextActions: string[];
  digestHash: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only.";
};

export type CreateEvidenceVaultLineageDigestInput = {
  workspaceId: string;
  records: EvidenceVaultRecord[];
  manifest?: Pick<EvidenceVaultManifest, "bundleHash" | "itemCount"> | null;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE_BOUNDARY =
  "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only.";

export async function createEvidenceVaultLineageDigest(
  input: CreateEvidenceVaultLineageDigestInput
): Promise<EvidenceVaultLineageDigest> {
  const records = sortRecords(input.records);
  const statusCounts = countStatuses(records);
  const activeEvidenceIds = records.filter(isActiveRecord).map((record) => record.id);
  const openRejectedEvidenceIds = records.filter((record) => record.status === "rejected" && !record.supersededByEvidenceId).map((record) => record.id);
  const lineageLinks = await createLineageLinks(records);
  const linkedControlIds = uniqueSorted(records.flatMap((record) => readStringArray(record.linkedControlIds)));
  const linkedRiskFlagIds = uniqueSorted(records.flatMap((record) => readStringArray(record.linkedRiskFlagIds)));
  const lineageCounts: EvidenceVaultLineageCounts = {
    activeRecords: activeEvidenceIds.length,
    replacedRecords: records.filter((record) => record.status === "superseded" || Boolean(record.supersededByEvidenceId)).length,
    openRejectedRecords: openRejectedEvidenceIds.length,
    lineageLinkCount: lineageLinks.length,
    linkedControlCount: linkedControlIds.length,
    linkedRiskFlagCount: linkedRiskFlagIds.length
  };
  const readinessStatus = determineReadinessStatus(records, input.manifest, lineageCounts);
  const nextActions = createNextActions(readinessStatus);
  const hashPayload = {
    digestVersion: "lexproof-evidence-vault-lineage-digest-v1" as const,
    workspaceId: input.workspaceId,
    readinessStatus,
    manifestHash: input.manifest?.bundleHash ?? null,
    itemCount: input.manifest?.itemCount ?? records.length,
    statusCounts,
    lineageCounts,
    lineageLinks,
    activeEvidenceIds,
    openRejectedEvidenceIds,
    linkedControlIds,
    linkedRiskFlagIds,
    nextActions
  };

  return {
    ...hashPayload,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    digestHash: await sha256Hex(stableStringify(hashPayload)),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportEvidenceVaultLineageDigestJson(digest: EvidenceVaultLineageDigest): string {
  return `${JSON.stringify(digest, null, 2)}\n`;
}

export function downloadEvidenceVaultLineageDigestJson(filename: string, digest: EvidenceVaultLineageDigest): void {
  const blob = new Blob([exportEvidenceVaultLineageDigestJson(digest)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function createLineageLinks(records: EvidenceVaultRecord[]): Promise<EvidenceVaultLineageLink[]> {
  const byId = new Map(records.map((record) => [record.id, record]));
  const links = await Promise.all(
    records
      .filter((record) => Boolean(record.parentEvidenceId))
      .map(async (record) => {
        const parent = record.parentEvidenceId ? byId.get(record.parentEvidenceId) : undefined;
        return {
          parentEvidenceId: record.parentEvidenceId ?? "",
          replacementEvidenceId: record.id,
          parentStatus: parent?.status ?? "rejected",
          replacementStatus: record.status,
          replacementVersion: record.version,
          ...(record.replacementReason ? { replacementReasonHash: await sha256Hex(record.replacementReason) } : {})
        };
      })
  );

  return links.sort(
    (left, right) =>
      left.parentEvidenceId.localeCompare(right.parentEvidenceId) ||
      left.replacementEvidenceId.localeCompare(right.replacementEvidenceId)
  );
}

function countStatuses(records: EvidenceVaultRecord[]): Partial<Record<EvidenceVaultStatus, number>> {
  return records.reduce<Partial<Record<EvidenceVaultStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
    return counts;
  }, {});
}

function determineReadinessStatus(
  records: EvidenceVaultRecord[],
  manifest: Pick<EvidenceVaultManifest, "bundleHash" | "itemCount"> | null | undefined,
  counts: EvidenceVaultLineageCounts
): EvidenceVaultLineageDigestStatus {
  if (records.length === 0) {
    return "empty";
  }

  if (counts.openRejectedRecords > 0) {
    return "needs-replacement";
  }

  if (!manifest?.bundleHash) {
    return "needs-manifest";
  }

  return "ready";
}

function createNextActions(status: EvidenceVaultLineageDigestStatus): string[] {
  if (status === "empty") {
    return ["Add metadata-only evidence records, then sync the Evidence Vault before counsel handoff."];
  }

  if (status === "needs-replacement") {
    return ["Create metadata-only replacement records for rejected evidence before final counsel handoff."];
  }

  if (status === "needs-manifest") {
    return ["Refresh the Evidence Vault Manifest so lineage metadata is tied to a stable bundle hash."];
  }

  return ["Keep the active replacement evidence linked to the final Evidence Manifest and Counsel Pack handoff."];
}

function isActiveRecord(record: EvidenceVaultRecord): boolean {
  return record.status !== "rejected" && record.status !== "superseded";
}

function sortRecords(records: EvidenceVaultRecord[]): EvidenceVaultRecord[] {
  return [...records].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id) ||
      left.fileHash.localeCompare(right.fileHash)
  );
}

function readStringArray(values: unknown): string[] {
  return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string") : [];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((left, right) => left.localeCompare(right));
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
