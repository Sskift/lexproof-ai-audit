import type { CounselPackVersionRecord } from "./counselPackVersions";
import type { CounselReviewItem, CounselReviewStatus } from "./counselReview";
import { redactDataBoundaryText } from "./dataBoundary";
import type { EvidenceRecertificationQueue } from "./evidenceRecertification";
import type { EvidenceVaultControlCoverage } from "./evidenceVaultControlCoverage";
import type { EvidenceVaultLineageDigest } from "./evidenceVaultLineageDigest";
import type { ExportSafetyInventory, ExportSafetyInventoryStatus } from "./exportSafetyInventory";
import type { HumanReviewQueue } from "./humanReviewWorkflow";
import type { ManifestDriftReport } from "./manifestDrift";
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
  evidenceVaultControlCoverage?: EvidenceVaultControlCoverage | null;
  evidenceVaultLineageDigest?: EvidenceVaultLineageDigest | null;
  evidenceRecertificationQueue?: EvidenceRecertificationQueue | null;
  manifestDriftReport?: ManifestDriftReport | null;
  humanReviewQueue?: HumanReviewQueue | null;
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
  evidenceVaultControlCoverage,
  evidenceVaultLineageDigest,
  evidenceRecertificationQueue,
  manifestDriftReport,
  humanReviewQueue,
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
    ...(humanReviewQueue ? [createHumanReviewWorkflowItem(humanReviewQueue)] : []),
    createHashItem({
      id: "evidence-manifest",
      label: "Evidence Manifest",
      hash: manifestHash,
      recoveryAction: "Add metadata-only evidence and wait for the Evidence Manifest bundle hash.",
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests are audit preparation hash metadata only."
    }),
    ...(evidenceRecertificationQueue ? [createEvidenceRecertificationQueueItem(evidenceRecertificationQueue)] : []),
    ...(evidenceVaultLineageDigest ? [createEvidenceVaultLineageDigestItem(evidenceVaultLineageDigest)] : []),
    ...(evidenceVaultControlCoverage ? [createEvidenceVaultControlCoverageItem(evidenceVaultControlCoverage)] : []),
    ...(manifestDriftReport ? [createManifestDriftReportItem(manifestDriftReport)] : []),
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

function createEvidenceRecertificationQueueItem(
  queue: EvidenceRecertificationQueue
): CounselHandoffChecklistItem {
  const status: CounselHandoffChecklistItemStatus =
    queue.status === "needs-recertification" ? "needs-action" : queue.status === "monitoring" ? "needs-review" : "ready";

  return createItem({
    id: "evidence-recertification-queue",
    label: "Evidence Recertification Queue",
    status,
    evidence: [
      `Queue ${shortHash(queue.queueHash)} reports ${queue.summary.totalActionCount} open recertification action${
        queue.summary.totalActionCount === 1 ? "" : "s"
      }.`,
      `${queue.summary.overdueCount} overdue, ${queue.summary.expiringCount} due soon, ${queue.summary.sourceLinkedCount} source-linked, ${queue.summary.missingTimestampCount} missing timestamp.`
    ].join(" "),
    artifactHash: queue.queueHash,
    warningCount: queue.summary.totalActionCount,
    recoveryAction:
      queue.status === "needs-recertification"
        ? "Recertify stale or timestamp-missing reliance-ready evidence before final handoff."
        : queue.status === "monitoring"
          ? "Schedule due-soon evidence recertification before the next external handoff."
          : "Keep the recertification queue hash with the final handoff packet.",
    notLegalAdviceBoundary: queue.notLegalAdviceBoundary
  });
}

function createManifestDriftReportItem(report: ManifestDriftReport): CounselHandoffChecklistItem {
  const status: CounselHandoffChecklistItemStatus =
    report.status === "ready" ? "ready" : report.status === "needs-review" ? "needs-review" : "needs-action";

  return createItem({
    id: "manifest-drift-report",
    label: "Manifest Drift Guard",
    status,
    evidence: `${report.freshCount}/${report.targetCount} export targets match the current Evidence Manifest; ${report.staleCount} stale and ${report.missingCount} missing.`,
    artifactHash: report.reportHash,
    warningCount: report.staleCount + report.missingCount,
    recoveryAction:
      report.status === "ready" ? "Keep the drift report with the final handoff packet." : report.nextActions[0],
    notLegalAdviceBoundary: report.notLegalAdviceBoundary
  });
}

function createEvidenceVaultLineageDigestItem(
  digest: EvidenceVaultLineageDigest
): CounselHandoffChecklistItem {
  const status: CounselHandoffChecklistItemStatus =
    digest.readinessStatus === "ready" ? "ready" : "needs-action";
  const needsActionCount =
    digest.readinessStatus === "ready"
      ? 0
      : Math.max(1, digest.lineageCounts.openRejectedRecords + (digest.manifestHash ? 0 : 1));

  return createItem({
    id: "evidence-vault-lineage-digest",
    label: "Evidence Vault Lineage Digest",
    status,
    evidence: [
      `Digest ${shortHash(digest.digestHash)} reports ${digest.lineageCounts.activeRecords} active, ${digest.lineageCounts.replacedRecords} replaced, ${digest.lineageCounts.openRejectedRecords} open rejected, and ${digest.lineageCounts.lineageLinkCount} lineage links.`,
      `Manifest hash: ${digest.manifestHash ? shortHash(digest.manifestHash) : "missing"}.`
    ].join(" "),
    artifactHash: digest.digestHash,
    warningCount: needsActionCount,
    recoveryAction:
      digest.readinessStatus === "ready"
        ? "Keep the Evidence Vault Lineage Digest hash with the final handoff packet."
        : digest.readinessStatus === "needs-replacement"
          ? "Create metadata-only replacement records for rejected vault evidence before final handoff."
          : digest.readinessStatus === "needs-manifest"
            ? "Refresh the Evidence Vault Manifest so lineage metadata is tied to a stable bundle hash."
            : "Sync metadata-only Evidence Vault records before final handoff.",
    notLegalAdviceBoundary: digest.notLegalAdviceBoundary
  });
}

function createEvidenceVaultControlCoverageItem(
  coverage: EvidenceVaultControlCoverage
): CounselHandoffChecklistItem {
  const readinessCounts = coverage.controls.reduce(
    (counts, control) => {
      counts[control.readiness] += 1;
      return counts;
    },
    {
      "ready-for-handoff": 0,
      "needs-review": 0,
      "needs-manifest-link": 0,
      "needs-vault-record": 0
    } satisfies Record<EvidenceVaultControlCoverage["controls"][number]["readiness"], number>
  );
  const needsActionCount = readinessCounts["needs-manifest-link"] + readinessCounts["needs-vault-record"];
  const needsReviewCount = readinessCounts["needs-review"];
  const status: CounselHandoffChecklistItemStatus =
    coverage.controlCount === 0 || needsActionCount > 0 ? "needs-action" : needsReviewCount > 0 ? "needs-review" : "ready";
  const firstRecoveryControl =
    coverage.controls.find((control) => control.readiness !== "ready-for-handoff") ?? coverage.controls[0];
  const controlIds = coverage.controls
    .filter((control) => control.readiness !== "ready-for-handoff")
    .map((control) => control.controlId)
    .slice(0, 3);

  return createItem({
    id: "evidence-vault-control-coverage",
    label: "Evidence Vault Control Coverage",
    status,
    evidence: [
      `${readinessCounts["ready-for-handoff"]}/${coverage.controlCount} controls ready for handoff.`,
      `needs review: ${readinessCounts["needs-review"]}; needs manifest link: ${readinessCounts["needs-manifest-link"]}; needs vault record: ${readinessCounts["needs-vault-record"]}.`,
      controlIds.length > 0 ? `Open controls: ${controlIds.join(", ")}.` : ""
    ]
      .filter(Boolean)
      .join(" "),
    warningCount: needsActionCount + needsReviewCount,
    recoveryAction:
      status === "ready"
        ? "Keep verified vault evidence linked in the Counsel Pack and source handoff."
        : firstRecoveryControl?.nextAction ?? "Sync Evidence Vault control coverage before final handoff.",
    notLegalAdviceBoundary: coverage.notLegalAdviceBoundary
  });
}

function createHumanReviewWorkflowItem(queue: HumanReviewQueue): CounselHandoffChecklistItem {
  const { totalCount, openCount, reviewedCount, blockedCount } = queue.summary;
  const status: CounselHandoffChecklistItemStatus =
    blockedCount > 0 ? "blocked" : openCount > 0 ? "needs-review" : "ready";

  return createItem({
    id: "human-review-workflow",
    label: "Human Review Workflow",
    status,
    evidence: `${reviewedCount}/${totalCount} reviewed, ${openCount} open review item${openCount === 1 ? "" : "s"}, ${blockedCount} blocked.`,
    blockerCount: blockedCount,
    warningCount: openCount,
    recoveryAction:
      blockedCount > 0
        ? "Resolve rejected or returned Human Review items before final handoff."
        : openCount > 0
          ? "Complete Human Review queue items before external reliance."
          : "Keep Human Review timeline metadata with the final handoff packet.",
    notLegalAdviceBoundary: queue.summary.notLegalAdviceBoundary
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
