import type { CounselPackVersionRecord } from "./counselPackVersions";
import type { EvidenceManifest } from "./evidenceManifest";
import type { CounselPackExportRecord } from "./phase2Types";

export type ManifestDriftTargetStatus = "fresh" | "stale" | "missing" | "not-applicable";

export type ManifestDriftStatus = "ready" | "needs-review" | "needs-action" | "empty";

export type ManifestDriftTarget = {
  id: "counsel-pack-version" | "server-export-record" | "evidence-vault-sync";
  label: string;
  status: ManifestDriftTargetStatus;
  currentHash?: string;
  recordedHash?: string;
  currentItemCount: number;
  recordedItemCount?: number;
  matchedItemCount?: number;
  missingCurrentHashCount?: number;
  extraRecordedHashCount?: number;
  evidence: string;
  recoveryAction: string;
};

export type ManifestDriftReport = {
  reportVersion: "lexproof-manifest-drift-report-v1";
  projectId: string;
  generatedAt: string;
  status: ManifestDriftStatus;
  currentManifestHash: string | null;
  currentItemCount: number;
  targetCount: number;
  freshCount: number;
  staleCount: number;
  missingCount: number;
  targets: ManifestDriftTarget[];
  nextActions: string[];
  reportHash: string;
  notLegalAdviceBoundary: "Not legal advice. Manifest drift reports are audit preparation export-readiness metadata only.";
};

export type ManifestDriftVaultRecord = {
  status?: string;
  sourceNote?: string;
  fileHash?: string;
};

export type ManifestDriftVaultManifest = {
  bundleHash?: string;
  itemCount?: number;
};

export type CreateManifestDriftReportInput = {
  projectId: string;
  manifest: EvidenceManifest | null;
  latestCounselPackVersion?: CounselPackVersionRecord | null;
  latestServerExportRecord?: CounselPackExportRecord | null;
  vaultManifest?: ManifestDriftVaultManifest | null;
  vaultRecords?: ManifestDriftVaultRecord[];
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Manifest drift reports are audit preparation export-readiness metadata only." as const;

export async function createManifestDriftReport({
  projectId,
  manifest,
  latestCounselPackVersion,
  latestServerExportRecord,
  vaultManifest,
  vaultRecords = [],
  generatedAt = new Date().toISOString()
}: CreateManifestDriftReportInput): Promise<ManifestDriftReport> {
  const currentHashes = manifest?.items.map((item) => item.contentHash) ?? [];
  const targets = manifest?.bundleHash
    ? [
        createCounselPackVersionTarget(manifest, latestCounselPackVersion),
        createServerExportTarget(manifest, latestServerExportRecord),
        createEvidenceVaultTarget(manifest, vaultManifest, vaultRecords)
      ]
    : [createCalculatingTarget("counsel-pack-version"), createCalculatingTarget("server-export-record"), createCalculatingTarget("evidence-vault-sync")];
  const currentItemCount = currentHashes.length;
  const freshCount = targets.filter((target) => target.status === "fresh").length;
  const staleCount = targets.filter((target) => target.status === "stale").length;
  const missingCount = targets.filter((target) => target.status === "missing").length;
  const status = createReportStatus({ currentItemCount, staleCount, missingCount });
  const nextActions = createNextActions(status, targets);
  const hashPayload = {
    reportVersion: "lexproof-manifest-drift-report-v1" as const,
    projectId: sanitize(projectId),
    status,
    currentManifestHash: manifest?.bundleHash ?? null,
    currentItemCount,
    targets,
    nextActions
  };

  return {
    ...hashPayload,
    generatedAt,
    targetCount: targets.length,
    freshCount,
    staleCount,
    missingCount,
    reportHash: await sha256Hex(stableStringify(hashPayload)),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportManifestDriftReportJson(report: ManifestDriftReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function downloadManifestDriftReportJson(filename: string, report: ManifestDriftReport): void {
  const blob = new Blob([exportManifestDriftReportJson(report)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createCounselPackVersionTarget(
  manifest: EvidenceManifest,
  latestVersion: CounselPackVersionRecord | null | undefined
): ManifestDriftTarget {
  if (!latestVersion) {
    return {
      id: "counsel-pack-version",
      label: "Counsel Pack Version",
      status: "missing",
      currentHash: manifest.bundleHash,
      currentItemCount: manifest.itemCount,
      evidence: "No saved Counsel Pack version is tied to the current Evidence Manifest.",
      recoveryAction: "Open Counsel Pack and save a Pack Version after evidence edits settle."
    };
  }

  const fresh = latestVersion.manifestHash === manifest.bundleHash;

  return {
    id: "counsel-pack-version",
    label: "Counsel Pack Version",
    status: fresh ? "fresh" : "stale",
    currentHash: manifest.bundleHash,
    recordedHash: latestVersion.manifestHash,
    currentItemCount: manifest.itemCount,
    evidence: fresh
      ? `Version ${latestVersion.version} is tied to the current Evidence Manifest.`
      : `Version ${latestVersion.version} was saved against an older Evidence Manifest.`,
    recoveryAction: fresh
      ? "Keep the version record with the current counsel handoff packet."
      : "Save a fresh Counsel Pack version before external counsel or judge handoff."
  };
}

function createServerExportTarget(
  manifest: EvidenceManifest,
  latestServerExport: CounselPackExportRecord | null | undefined
): ManifestDriftTarget {
  if (!latestServerExport) {
    return {
      id: "server-export-record",
      label: "Server Export Record",
      status: "missing",
      currentHash: manifest.bundleHash,
      currentItemCount: manifest.itemCount,
      evidence: "No server Counsel Pack export record is tied to the current Evidence Manifest.",
      recoveryAction: "Create a metadata-only server export record after saving the latest Pack Version."
    };
  }

  const fresh = latestServerExport.manifestHash === manifest.bundleHash;

  return {
    id: "server-export-record",
    label: "Server Export Record",
    status: fresh ? "fresh" : "stale",
    currentHash: manifest.bundleHash,
    recordedHash: latestServerExport.manifestHash,
    currentItemCount: manifest.itemCount,
    evidence: fresh
      ? `Server export v${latestServerExport.version} points at the current Evidence Manifest.`
      : `Server export v${latestServerExport.version} points at an older Evidence Manifest.`,
    recoveryAction: fresh
      ? "Keep the server export receipt with the final handoff packet."
      : "Create a new metadata-only server export record after saving the fresh Pack Version."
  };
}

function createEvidenceVaultTarget(
  manifest: EvidenceManifest,
  vaultManifest: ManifestDriftVaultManifest | null | undefined,
  vaultRecords: ManifestDriftVaultRecord[]
): ManifestDriftTarget {
  const currentHashes = uniqueSorted(manifest.items.map((item) => item.contentHash));
  const vaultHashes = uniqueSorted(vaultRecords.filter(isActiveVaultRecord).flatMap(extractLocalContentHashes));

  if (vaultHashes.length === 0) {
    return {
      id: "evidence-vault-sync",
      label: "Evidence Vault Sync",
      status: "missing",
      currentHash: manifest.bundleHash,
      recordedHash: vaultManifest?.bundleHash,
      currentItemCount: manifest.itemCount,
      recordedItemCount: vaultManifest?.itemCount,
      evidence: "No refreshed Evidence Vault records contain local content hash lineage for the current ledger.",
      recoveryAction: "Sync or refresh Evidence Vault metadata after the latest evidence edits."
    };
  }

  const missingCurrentHashCount = currentHashes.filter((hash) => !vaultHashes.includes(hash)).length;
  const extraRecordedHashCount = vaultHashes.filter((hash) => !currentHashes.includes(hash)).length;
  const matchedItemCount = currentHashes.length - missingCurrentHashCount;
  const fresh = missingCurrentHashCount === 0 && extraRecordedHashCount === 0 && currentHashes.length === vaultHashes.length;

  return {
    id: "evidence-vault-sync",
    label: "Evidence Vault Sync",
    status: fresh ? "fresh" : "stale",
    currentHash: manifest.bundleHash,
    recordedHash: vaultManifest?.bundleHash,
    currentItemCount: manifest.itemCount,
    recordedItemCount: vaultManifest?.itemCount ?? vaultHashes.length,
    matchedItemCount,
    missingCurrentHashCount,
    extraRecordedHashCount,
    evidence: fresh
      ? `${matchedItemCount}/${currentHashes.length} current evidence item hashes are represented in refreshed vault metadata.`
      : `${matchedItemCount}/${currentHashes.length} current evidence item hashes are represented in refreshed vault metadata.`,
    recoveryAction: fresh
      ? "Keep the Evidence Vault manifest and lineage digest with the final handoff packet."
      : "Sync Evidence Vault metadata again so vault lineage reflects the current ledger."
  };
}

function createCalculatingTarget(id: ManifestDriftTarget["id"]): ManifestDriftTarget {
  const labels: Record<ManifestDriftTarget["id"], string> = {
    "counsel-pack-version": "Counsel Pack Version",
    "server-export-record": "Server Export Record",
    "evidence-vault-sync": "Evidence Vault Sync"
  };

  return {
    id,
    label: labels[id],
    status: "not-applicable",
    currentItemCount: 0,
    evidence: "Evidence Manifest is still calculating.",
    recoveryAction: "Wait for the current Evidence Manifest bundle hash before evaluating export drift."
  };
}

function createReportStatus({
  currentItemCount,
  staleCount,
  missingCount
}: {
  currentItemCount: number;
  staleCount: number;
  missingCount: number;
}): ManifestDriftStatus {
  if (currentItemCount === 0) {
    return "empty";
  }

  if (missingCount > 0) {
    return "needs-action";
  }

  if (staleCount > 0) {
    return "needs-review";
  }

  return "ready";
}

function createNextActions(status: ManifestDriftStatus, targets: ManifestDriftTarget[]): string[] {
  if (status === "empty") {
    return ["Add metadata-only evidence before locking counsel, vault, or export artifacts."];
  }

  const actionable = targets
    .filter((target) => target.status === "missing" || target.status === "stale")
    .map((target) => target.recoveryAction);

  if (actionable.length > 0) {
    return uniqueSorted(actionable);
  }

  return ["Keep the drift report with the final export handoff packet."];
}

function isActiveVaultRecord(record: ManifestDriftVaultRecord): boolean {
  return record.status !== "superseded";
}

function extractLocalContentHashes(record: ManifestDriftVaultRecord): string[] {
  const sourceNote = record.sourceNote ?? "";
  return Array.from(sourceNote.matchAll(/Local content SHA-256:\s*([a-f0-9]{64})/gi)).map((match) => match[1].toLowerCase());
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean).map((value) => value.toLowerCase()))].sort((left, right) => left.localeCompare(right));
}

function sanitize(value: string): string {
  return value.trim();
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
