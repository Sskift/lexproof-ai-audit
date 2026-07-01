import type { DataBoundaryReport } from "./dataBoundary";
import { redactDataBoundaryText } from "./dataBoundary";
import type { SourceFreshnessBoard } from "./sourceFreshnessBoard";

export type ExportSafetyArtifactCategory =
  | "evidence"
  | "counsel-export"
  | "source-lineage"
  | "review-workflow"
  | "integration-readiness"
  | "submission"
  | "security";

export type ExportSafetyExportMode = "metadata-only-json" | "audit-prep-markdown" | "browser-print-pdf" | "simulated-receipt-json";

export type ExportSafetyArtifactStatus = "ready" | "needs-review" | "needs-action" | "blocked";

export type ExportSafetyInventoryStatus = "ready" | "needs-review" | "needs-action" | "blocked";

export type ExportSafetyArtifactInput = {
  id: string;
  label: string;
  category: ExportSafetyArtifactCategory;
  exportMode: ExportSafetyExportMode;
  required: boolean;
  available: boolean;
  artifactHash?: string;
  metadataOnly: boolean;
  rawContentIncluded: boolean;
  warnings?: string[];
  blockers?: string[];
  recoveryAction: string;
  notLegalAdviceBoundary: string;
};

export type ExportSafetyInventoryArtifact = {
  id: string;
  label: string;
  category: ExportSafetyArtifactCategory;
  exportMode: ExportSafetyExportMode;
  status: ExportSafetyArtifactStatus;
  required: boolean;
  available: boolean;
  artifactHash?: string;
  metadataOnly: boolean;
  rawContentIncluded: boolean;
  blockers: string[];
  warnings: string[];
  recoveryAction: string;
  notLegalAdviceBoundary: string;
};

export type ExportSafetyInventory = {
  inventoryVersion: "lexproof-export-safety-inventory-v1";
  workspaceId: string;
  projectName: string;
  generatedAt: string;
  inventoryHash: string;
  overallStatus: ExportSafetyInventoryStatus;
  exportHandoffAllowed: boolean;
  artifactCount: number;
  readyCount: number;
  needsReviewCount: number;
  missingRequiredCount: number;
  blockedCount: number;
  boundaryStatus: DataBoundaryReport["status"];
  boundaryBlockerCount: number;
  boundaryWarningCount: number;
  detectedClasses: DataBoundaryReport["detectedClasses"];
  artifacts: ExportSafetyInventoryArtifact[];
  blockers: string[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only.";
};

export type CreateExportSafetyInventoryInput = {
  workspaceId: string;
  projectName: string;
  dataBoundaryReport: DataBoundaryReport;
  artifacts: ExportSafetyArtifactInput[];
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only." as const;

export async function createExportSafetyInventory({
  workspaceId,
  projectName,
  dataBoundaryReport,
  artifacts,
  generatedAt = new Date().toISOString()
}: CreateExportSafetyInventoryInput): Promise<ExportSafetyInventory> {
  const normalizedArtifacts = artifacts.map((artifact) => normalizeArtifact(artifact, dataBoundaryReport)).sort(compareArtifact);
  const readyCount = normalizedArtifacts.filter((artifact) => artifact.status === "ready").length;
  const needsReviewCount = normalizedArtifacts.filter((artifact) => artifact.status === "needs-review").length;
  const missingRequiredCount = normalizedArtifacts.filter((artifact) => artifact.required && artifact.status === "needs-action").length;
  const blockedCount = normalizedArtifacts.filter((artifact) => artifact.status === "blocked").length;
  const blockers = collectBlockers(normalizedArtifacts, dataBoundaryReport);
  const nextActions = createNextActions(normalizedArtifacts, dataBoundaryReport);
  const overallStatus = createOverallStatus({ blockedCount, missingRequiredCount, needsReviewCount, boundaryStatus: dataBoundaryReport.status });
  const hashPayload = {
    inventoryVersion: "lexproof-export-safety-inventory-v1",
    workspaceId: sanitize(workspaceId),
    projectName: sanitize(projectName),
    overallStatus,
    boundaryStatus: dataBoundaryReport.status,
    boundaryBlockerCount: dataBoundaryReport.blockerCount,
    boundaryWarningCount: dataBoundaryReport.warningCount,
    detectedClasses: dataBoundaryReport.detectedClasses.slice().sort(),
    artifacts: normalizedArtifacts,
    blockers,
    nextActions,
    exportHandoffAllowed: blockedCount === 0 && missingRequiredCount === 0 && dataBoundaryReport.exportAllowed
  };

  return {
    inventoryVersion: "lexproof-export-safety-inventory-v1",
    workspaceId: sanitize(workspaceId),
    projectName: sanitize(projectName),
    generatedAt,
    inventoryHash: await sha256Hex(stableStringify(hashPayload)),
    overallStatus,
    exportHandoffAllowed: blockedCount === 0 && missingRequiredCount === 0 && dataBoundaryReport.exportAllowed,
    artifactCount: normalizedArtifacts.length,
    readyCount,
    needsReviewCount,
    missingRequiredCount,
    blockedCount,
    boundaryStatus: dataBoundaryReport.status,
    boundaryBlockerCount: dataBoundaryReport.blockerCount,
    boundaryWarningCount: dataBoundaryReport.warningCount,
    detectedClasses: dataBoundaryReport.detectedClasses.slice().sort(),
    artifacts: normalizedArtifacts,
    blockers,
    nextActions,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportSafetyInventoryJson(inventory: ExportSafetyInventory): string {
  return `${JSON.stringify(inventory, null, 2)}\n`;
}

export function downloadExportSafetyInventoryJson(filename: string, inventory: ExportSafetyInventory): void {
  const blob = new Blob([exportSafetyInventoryJson(inventory)], { type: "application/json;charset=utf-8" });
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

export function createSourceFreshnessBoardExportArtifact(
  sourceFreshnessBoard: SourceFreshnessBoard | null | undefined
): ExportSafetyArtifactInput {
  const hasBoard = Boolean(sourceFreshnessBoard?.boardHash);
  const status = sourceFreshnessBoard?.status;
  const warnings =
    hasBoard && status && status !== "current"
      ? [`Source Freshness Board status is ${status}; review lanes before counsel handoff.`]
      : [];

  return {
    id: "source-freshness-board",
    label: "Source Freshness Board JSON",
    category: "source-lineage",
    exportMode: "metadata-only-json",
    required: false,
    available: hasBoard,
    artifactHash: sourceFreshnessBoard?.boardHash,
    metadataOnly: true,
    rawContentIncluded: false,
    warnings,
    recoveryAction: hasBoard
      ? "Review the Source Freshness Board lanes before external handoff."
      : "Open the Regulatory Command Center after source review calculation completes.",
    notLegalAdviceBoundary:
      sourceFreshnessBoard?.notLegalAdviceBoundary ??
      "Not legal advice. Source freshness boards are audit preparation scheduling metadata only."
  };
}

function normalizeArtifact(
  artifact: ExportSafetyArtifactInput,
  dataBoundaryReport: DataBoundaryReport
): ExportSafetyInventoryArtifact {
  const blockers = [
    ...(artifact.blockers ?? []),
    ...(!artifact.metadataOnly ? ["Artifact is not marked metadata-only or audit-prep safe."] : []),
    ...(artifact.rawContentIncluded ? ["Artifact reports raw content included and cannot be used for external handoff."] : []),
    ...(dataBoundaryReport.exportAllowed
      ? []
      : dataBoundaryReport.findings
          .filter((finding) => finding.severity === "block")
          .map((finding) => `${finding.sourceLabel}: ${finding.message} (${finding.redactedSnippet})`))
  ].map(sanitize);
  const warnings = [
    ...(artifact.warnings ?? []),
    ...(dataBoundaryReport.status === "needs-review" ? dataBoundaryReport.remediation : [])
  ].map(sanitize);
  const available = artifact.available === true;
  const status = createArtifactStatus({ available, required: artifact.required, blockers, warnings });

  return {
    id: sanitizeId(artifact.id),
    label: sanitize(artifact.label),
    category: artifact.category,
    exportMode: artifact.exportMode,
    status,
    required: artifact.required === true,
    available,
    artifactHash: sanitizeHash(artifact.artifactHash),
    metadataOnly: artifact.metadataOnly === true,
    rawContentIncluded: artifact.rawContentIncluded === true,
    blockers,
    warnings,
    recoveryAction: sanitize(artifact.recoveryAction),
    notLegalAdviceBoundary: sanitize(artifact.notLegalAdviceBoundary)
  };
}

function createArtifactStatus(input: {
  available: boolean;
  required: boolean;
  blockers: string[];
  warnings: string[];
}): ExportSafetyArtifactStatus {
  if (input.blockers.length > 0) {
    return "blocked";
  }

  if (!input.available) {
    return input.required ? "needs-action" : "needs-review";
  }

  if (input.warnings.length > 0) {
    return "needs-review";
  }

  return "ready";
}

function createOverallStatus(input: {
  blockedCount: number;
  missingRequiredCount: number;
  needsReviewCount: number;
  boundaryStatus: DataBoundaryReport["status"];
}): ExportSafetyInventoryStatus {
  if (input.blockedCount > 0 || input.boundaryStatus === "blocked") {
    return "blocked";
  }

  if (input.missingRequiredCount > 0) {
    return "needs-action";
  }

  if (input.needsReviewCount > 0 || input.boundaryStatus === "needs-review") {
    return "needs-review";
  }

  return "ready";
}

function collectBlockers(artifacts: ExportSafetyInventoryArtifact[], report: DataBoundaryReport): string[] {
  return unique([
    ...artifacts.flatMap((artifact) => artifact.blockers.map((blocker) => `${artifact.label}: ${blocker}`)),
    ...report.remediation.filter(() => report.status === "blocked").map(sanitize)
  ]);
}

function createNextActions(artifacts: ExportSafetyInventoryArtifact[], report: DataBoundaryReport): string[] {
  const artifactActions = artifacts
    .filter((artifact) => artifact.status !== "ready")
    .map((artifact) => `${artifact.label}: ${artifact.recoveryAction}`);
  const boundaryActions =
    report.status === "clean"
      ? ["Keep exports metadata-only and re-run inventory before external sharing."]
      : report.remediation.map(sanitize);

  return unique([...artifactActions, ...boundaryActions]);
}

function compareArtifact(left: ExportSafetyInventoryArtifact, right: ExportSafetyInventoryArtifact): number {
  return left.id.localeCompare(right.id);
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
}

function sanitizeId(value: string): string {
  return (
    sanitize(value)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "export-artifact"
  );
}

function sanitizeHash(value?: string): string | undefined {
  const normalized = (value ?? "").replace(/\s+/g, "").trim().toLowerCase();
  if (/^[a-f0-9]{8,128}$/.test(normalized)) {
    return normalized;
  }

  const redacted = sanitize(value ?? "").toLowerCase();
  return /^[a-f0-9]{8,128}$/.test(redacted) ? redacted : undefined;
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
