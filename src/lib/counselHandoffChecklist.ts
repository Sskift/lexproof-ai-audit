import type { CounselPackVersionRecord } from "./counselPackVersions";
import type { CounselReviewItem, CounselReviewStatus } from "./counselReview";
import { redactDataBoundaryText } from "./dataBoundary";
import type { ExportSafetyInventory, ExportSafetyInventoryStatus } from "./exportSafetyInventory";
import type { CounselPackExportRecord } from "./phase2Types";

export type CounselHandoffChecklistItemStatus = "ready" | "needs-review" | "needs-action" | "blocked";

export type CounselHandoffChecklistStatus = CounselHandoffChecklistItemStatus;

export type CounselHandoffChecklistItem = {
  id: string;
  label: string;
  status: CounselHandoffChecklistItemStatus;
  required: boolean;
  evidence: string;
  artifactHash?: string;
  blockerCount: number;
  warningCount: number;
  recoveryAction: string;
  notLegalAdviceBoundary: string;
};

export type CounselHandoffChecklist = {
  checklistVersion: "lexproof-counsel-handoff-checklist-v1";
  projectId: string;
  projectName: string;
  generatedAt: string;
  checklistHash: string;
  overallStatus: CounselHandoffChecklistStatus;
  handoffAllowed: boolean;
  itemCount: number;
  readyCount: number;
  needsReviewCount: number;
  needsActionCount: number;
  blockedCount: number;
  items: CounselHandoffChecklistItem[];
  blockers: string[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Counsel handoff checklists are audit preparation workflow metadata only.";
};

export type CounselHandoffChecklistInput = {
  projectId: string;
  projectName: string;
  manifestHash?: string;
  regulatorySourcePackHash?: string;
  submissionPackHash?: string;
  exportSafetyInventory: ExportSafetyInventory | null;
  counselReviews: CounselReviewItem[];
  counselPackVersions: CounselPackVersionRecord[];
  serverExportRecords: CounselPackExportRecord[];
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Counsel handoff checklists are audit preparation workflow metadata only." as const;

export async function createCounselHandoffChecklist({
  projectId,
  projectName,
  manifestHash,
  regulatorySourcePackHash,
  submissionPackHash,
  exportSafetyInventory,
  counselReviews,
  counselPackVersions,
  serverExportRecords,
  generatedAt = new Date().toISOString()
}: CounselHandoffChecklistInput): Promise<CounselHandoffChecklist> {
  const latestVersion = latestCounselPackVersion(counselPackVersions);
  const latestServerExport = latestServerExportRecord(serverExportRecords);
  const latestVersionFresh = isLatestVersionFresh(latestVersion, manifestHash, regulatorySourcePackHash);
  const items = [
    createCounselPackVersionItem(latestVersion, manifestHash, regulatorySourcePackHash),
    createCounselReviewStatusItem(counselReviews),
    createHashItem({
      id: "evidence-manifest",
      label: "Evidence Manifest",
      hash: manifestHash,
      recoveryAction: "Add metadata-only evidence and wait for the Evidence Manifest bundle hash.",
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests are audit preparation hash metadata only."
    }),
    createExportSafetyInventoryItem(exportSafetyInventory),
    createHashItem({
      id: "regulatory-source-pack",
      label: "Regulatory Source Pack",
      hash: regulatorySourcePackHash,
      recoveryAction: "Open Counsel Pack or Sources after the regulatory source graph finishes calculating.",
      notLegalAdviceBoundary: "Not legal advice. Regulatory source packs are audit preparation source-lineage metadata only."
    }),
    createServerExportRecordItem(latestServerExport, latestVersion, latestVersionFresh),
    createHashItem({
      id: "submission-pack",
      label: "Submission Pack",
      hash: submissionPackHash,
      recoveryAction: "Open Sources after manifest, source pack, and demo readiness metadata finish calculating.",
      notLegalAdviceBoundary: "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging only."
    })
  ].sort((left, right) => left.id.localeCompare(right.id));
  const readyCount = items.filter((item) => item.status === "ready").length;
  const needsReviewCount = items.filter((item) => item.status === "needs-review").length;
  const needsActionCount = items.filter((item) => item.status === "needs-action").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const overallStatus = createOverallStatus({ blockedCount, needsActionCount, needsReviewCount });
  const blockers = createBlockers(items);
  const nextActions = createNextActions(items);
  const hashPayload = {
    checklistVersion: "lexproof-counsel-handoff-checklist-v1",
    projectId: sanitize(projectId),
    projectName: sanitize(projectName),
    overallStatus,
    handoffAllowed: overallStatus === "ready",
    items,
    blockers,
    nextActions
  };

  return {
    checklistVersion: "lexproof-counsel-handoff-checklist-v1",
    projectId: sanitize(projectId),
    projectName: sanitize(projectName),
    generatedAt,
    checklistHash: await sha256Hex(stableStringify(hashPayload)),
    overallStatus,
    handoffAllowed: overallStatus === "ready",
    itemCount: items.length,
    readyCount,
    needsReviewCount,
    needsActionCount,
    blockedCount,
    items,
    blockers,
    nextActions,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportCounselHandoffChecklistJson(checklist: CounselHandoffChecklist): string {
  return `${JSON.stringify(checklist, null, 2)}\n`;
}

export function downloadCounselHandoffChecklistJson(filename: string, checklist: CounselHandoffChecklist): void {
  const blob = new Blob([exportCounselHandoffChecklistJson(checklist)], { type: "application/json;charset=utf-8" });
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

function createCounselPackVersionItem(
  latestVersion: CounselPackVersionRecord | undefined,
  manifestHash: string | undefined,
  regulatorySourcePackHash: string | undefined
): CounselHandoffChecklistItem {
  if (!latestVersion) {
    return createItem({
      id: "counsel-pack-version",
      label: "Counsel Pack Version",
      status: "needs-action",
      evidence: "No saved Counsel Pack version.",
      recoveryAction: "Save a Counsel Pack version to lock manifest, Markdown, source-pack, and review-status hashes.",
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
    });
  }

  const staleManifest = Boolean(manifestHash && latestVersion.manifestHash !== manifestHash);
  const staleSourcePack = Boolean(
    regulatorySourcePackHash && latestVersion.regulatorySourcePack?.packHash !== regulatorySourcePackHash
  );

  return createItem({
    id: "counsel-pack-version",
    label: "Counsel Pack Version",
    status: staleManifest || staleSourcePack ? "needs-review" : "ready",
    evidence: `Version ${latestVersion.version} saved with Markdown hash ${shortHash(latestVersion.markdownHash)}.`,
    artifactHash: latestVersion.markdownHash,
    warningCount: staleManifest || staleSourcePack ? 1 : 0,
    recoveryAction:
      staleManifest || staleSourcePack
        ? "Save a fresh Counsel Pack version after the latest manifest and source pack hashes are available."
        : "Keep this version record with the final handoff packet.",
    notLegalAdviceBoundary: latestVersion.notLegalAdviceBoundary
  });
}

function createCounselReviewStatusItem(counselReviews: CounselReviewItem[]): CounselHandoffChecklistItem {
  const statusCounts = counselReviews.reduce<Record<CounselReviewStatus, number>>(
    (counts, review) => {
      counts[review.status] += 1;
      return counts;
    },
    {
      "not-started": 0,
      "needs-evidence": 0,
      "ready-for-counsel": 0,
      reviewed: 0,
      blocked: 0
    }
  );
  const blockedCount = statusCounts.blocked;
  const needsActionCount = statusCounts["needs-evidence"];
  const needsReviewCount = statusCounts["not-started"] + statusCounts["ready-for-counsel"];
  const status =
    blockedCount > 0 ? "blocked" : needsActionCount > 0 ? "needs-action" : needsReviewCount > 0 ? "needs-review" : "ready";
  const total = counselReviews.length;

  return createItem({
    id: "counsel-review-status",
    label: "Counsel Review Status",
    status,
    evidence:
      total === 0
        ? "No deterministic risk review rows are currently open."
        : `${statusCounts.reviewed}/${total} reviewed, ${statusCounts["ready-for-counsel"]} ready for counsel, ${statusCounts["needs-evidence"]} need evidence, ${statusCounts.blocked} blocked.`,
    blockerCount: blockedCount,
    warningCount: needsActionCount + needsReviewCount,
    recoveryAction:
      blockedCount > 0
        ? "Resolve blocked review items before export reliance."
        : needsActionCount > 0
          ? "Add or replace evidence for review items marked needs-evidence."
          : needsReviewCount > 0
            ? "Route ready and not-started review rows through counsel or compliance review before final handoff."
            : "Keep review status metadata with the final handoff packet.",
    notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow metadata only."
  });
}

function createHashItem(input: {
  id: string;
  label: string;
  hash?: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;
}): CounselHandoffChecklistItem {
  return createItem({
    id: input.id,
    label: input.label,
    status: input.hash ? "ready" : "needs-action",
    evidence: input.hash ? `Hash ${shortHash(input.hash)} is available.` : "Hash is not available yet.",
    artifactHash: input.hash,
    recoveryAction: input.hash ? "Keep this artifact hash with the final handoff packet." : input.recoveryAction,
    notLegalAdviceBoundary: input.notLegalAdviceBoundary
  });
}

function createExportSafetyInventoryItem(
  inventory: ExportSafetyInventory | null
): CounselHandoffChecklistItem {
  if (!inventory) {
    return createItem({
      id: "export-safety-inventory",
      label: "Export Safety Inventory",
      status: "needs-action",
      evidence: "Export Safety Inventory is still calculating.",
      recoveryAction: "Open Sources after export artifact readiness finishes calculating.",
      notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only."
    });
  }

  const visibleBlockers = inventory.blockers.slice(0, 2);

  return createItem({
    id: "export-safety-inventory",
    label: "Export Safety Inventory",
    status: mapInventoryStatus(inventory.overallStatus),
    evidence: [
      `Inventory ${shortHash(inventory.inventoryHash)} reports handoff ${inventory.exportHandoffAllowed ? "allowed" : "blocked"}.`,
      visibleBlockers.length > 0 ? `Blockers: ${visibleBlockers.join(" ")}` : ""
    ]
      .filter(Boolean)
      .join(" "),
    artifactHash: inventory.inventoryHash,
    blockerCount: Math.max(inventory.blockedCount + inventory.missingRequiredCount, inventory.blockers.length),
    warningCount: inventory.needsReviewCount,
    recoveryAction:
      inventory.exportHandoffAllowed && inventory.overallStatus === "ready"
        ? "Keep the inventory JSON with the final handoff packet."
        : "Resolve Export Safety Inventory blockers before counsel or judge handoff.",
    notLegalAdviceBoundary: inventory.notLegalAdviceBoundary
  });
}

function createServerExportRecordItem(
  latestServerExport: CounselPackExportRecord | undefined,
  latestVersion: CounselPackVersionRecord | undefined,
  latestVersionFresh: boolean
): CounselHandoffChecklistItem {
  if (!latestServerExport) {
    return createItem({
      id: "server-export-record",
      label: "Server Export Record",
      status: "needs-review",
      required: false,
      evidence: "No metadata-only Phase 2 server export record has been created.",
      recoveryAction: "Create a metadata-only server export record after the latest Counsel Pack version is saved.",
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
    });
  }

  const staleVersion = Boolean(latestVersion && latestServerExport.version !== latestVersion.version);
  const staleArtifact = Boolean(latestVersion && latestServerExport.artifactHash !== latestVersion.markdownHash);
  const waitingOnFreshVersion = Boolean(latestVersion && !latestVersionFresh);

  return createItem({
    id: "server-export-record",
    label: "Server Export Record",
    status: staleVersion || staleArtifact || waitingOnFreshVersion ? "needs-review" : "ready",
    required: false,
    evidence: `Server export ${latestServerExport.id} records version ${latestServerExport.version}.`,
    artifactHash: latestServerExport.artifactHash,
    warningCount: staleVersion || staleArtifact || waitingOnFreshVersion ? 1 : 0,
    recoveryAction:
      waitingOnFreshVersion
        ? "Create a metadata-only server export record after the latest Counsel Pack version is saved."
        : staleVersion || staleArtifact
          ? "Create a fresh server export record from the latest Counsel Pack version."
        : "Keep this server export record with the final handoff packet.",
    notLegalAdviceBoundary: latestServerExport.notLegalAdviceBoundary
  });
}

function isLatestVersionFresh(
  latestVersion: CounselPackVersionRecord | undefined,
  manifestHash: string | undefined,
  regulatorySourcePackHash: string | undefined
): boolean {
  if (!latestVersion) {
    return false;
  }

  return (
    (!manifestHash || latestVersion.manifestHash === manifestHash) &&
    (!regulatorySourcePackHash || latestVersion.regulatorySourcePack?.packHash === regulatorySourcePackHash)
  );
}

function createItem({
  id,
  label,
  status,
  required = true,
  evidence,
  artifactHash,
  blockerCount = 0,
  warningCount = 0,
  recoveryAction,
  notLegalAdviceBoundary
}: {
  id: string;
  label: string;
  status: CounselHandoffChecklistItemStatus;
  required?: boolean;
  evidence: string;
  artifactHash?: string;
  blockerCount?: number;
  warningCount?: number;
  recoveryAction: string;
  notLegalAdviceBoundary: string;
}): CounselHandoffChecklistItem {
  return {
    id: sanitizeId(id),
    label: sanitize(label),
    status,
    required,
    evidence: sanitize(evidence),
    artifactHash: sanitizeHash(artifactHash),
    blockerCount,
    warningCount,
    recoveryAction: sanitize(recoveryAction),
    notLegalAdviceBoundary: sanitize(notLegalAdviceBoundary)
  };
}

function createOverallStatus(input: {
  blockedCount: number;
  needsActionCount: number;
  needsReviewCount: number;
}): CounselHandoffChecklistStatus {
  if (input.blockedCount > 0) {
    return "blocked";
  }
  if (input.needsActionCount > 0) {
    return "needs-action";
  }
  if (input.needsReviewCount > 0) {
    return "needs-review";
  }
  return "ready";
}

function createBlockers(items: CounselHandoffChecklistItem[]): string[] {
  return unique(
    items
      .filter((item) => item.status === "blocked")
      .map((item) => `${item.label}: ${item.recoveryAction}`)
  );
}

function createNextActions(items: CounselHandoffChecklistItem[]): string[] {
  const actionable = items
    .filter((item) => item.status !== "ready")
    .map((item) => `${item.label}: ${item.recoveryAction}`);
  return unique(actionable.length > 0 ? actionable : ["Keep exports metadata-only and re-run the handoff checklist before sharing."]);
}

function mapInventoryStatus(status: ExportSafetyInventoryStatus): CounselHandoffChecklistItemStatus {
  if (status === "blocked" || status === "needs-action" || status === "needs-review") {
    return status;
  }
  return "ready";
}

function latestCounselPackVersion(records: CounselPackVersionRecord[]): CounselPackVersionRecord | undefined {
  return [...records].sort((left, right) => right.version - left.version)[0];
}

function latestServerExportRecord(records: CounselPackExportRecord[]): CounselPackExportRecord | undefined {
  return [...records].sort((left, right) => right.version - left.version)[0];
}

function sanitize(value: string): string {
  return redactDataBoundaryText(
    value
      .replace(/\braw\s+KYC\s+packet\b/gi, "raw KYC material")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function sanitizeId(value: string): string {
  return (
    sanitize(value)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "handoff-item"
  );
}

function sanitizeHash(value?: string): string | undefined {
  const normalized = (value ?? "").replace(/\s+/g, "").trim().toLowerCase();
  return /^[a-f0-9]{8,128}$/.test(normalized) ? normalized : undefined;
}

function shortHash(value: string): string {
  return value.length > 16 ? `${value.slice(0, 12)}...${value.slice(-4)}` : value;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}
