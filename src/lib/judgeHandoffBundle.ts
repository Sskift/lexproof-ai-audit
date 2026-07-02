import { redactClassifiedText } from "./dataClassification";
import type { DemoRunbook } from "./demoRunbook";
import type { ExportSafetyInventory, ExportSafetyInventoryStatus } from "./exportSafetyInventory";
import type { SubmissionExportSafetyStatus, SubmissionPack } from "./submissionPack";

export type JudgeHandoffBundleArtifactStatus = "ready" | "needs-review" | "needs-action" | "blocked" | "missing";

export type JudgeHandoffBundleArtifact = {
  id: "submission-pack" | "demo-runbook" | "export-safety-inventory";
  label: string;
  status: JudgeHandoffBundleArtifactStatus;
  artifactHash: string;
  recoveryAction: string;
  sourceSurface: "Sources";
  notLegalAdviceBoundary: string;
};

export type JudgeHandoffBundle = {
  bundleVersion: "lexproof-judge-handoff-bundle-v1";
  projectName: string;
  generatedAt: string;
  bundleHash: string;
  exportHandoffAllowed: boolean;
  artifactCount: number;
  readyCount: number;
  needsReviewCount: number;
  missingCount: number;
  blockedCount: number;
  artifacts: JudgeHandoffBundleArtifact[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Judge handoff bundles are audit preparation metadata only.";
};

export type CreateJudgeHandoffBundleInput = {
  projectName: string;
  submissionPack: SubmissionPack | null;
  demoRunbook: DemoRunbook | null;
  exportSafetyInventory: ExportSafetyInventory | null;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Judge handoff bundles are audit preparation metadata only." as const;

export async function createJudgeHandoffBundle({
  projectName,
  submissionPack,
  demoRunbook,
  exportSafetyInventory,
  generatedAt = new Date().toISOString()
}: CreateJudgeHandoffBundleInput): Promise<JudgeHandoffBundle> {
  const artifacts = [
    createSubmissionPackArtifact(submissionPack),
    createDemoRunbookArtifact(demoRunbook),
    createExportSafetyInventoryArtifact(exportSafetyInventory)
  ];
  const readyCount = artifacts.filter((artifact) => artifact.status === "ready").length;
  const needsReviewCount = artifacts.filter((artifact) => artifact.status === "needs-review").length;
  const missingCount = artifacts.filter((artifact) => artifact.status === "missing").length;
  const blockedCount = artifacts.filter((artifact) => artifact.status === "blocked").length;
  const nextActions = createNextActions({ submissionPack, demoRunbook, exportSafetyInventory, artifacts });
  const exportHandoffAllowed =
    artifacts.every((artifact) => artifact.status === "ready") &&
    Boolean(submissionPack?.exportSafetySummary.exportHandoffAllowed) &&
    demoRunbook?.status === "ready" &&
    Boolean(exportSafetyInventory?.exportHandoffAllowed);
  const hashPayload: Omit<JudgeHandoffBundle, "generatedAt" | "bundleHash"> = {
    bundleVersion: "lexproof-judge-handoff-bundle-v1",
    projectName: sanitize(projectName || submissionPack?.projectName || exportSafetyInventory?.projectName || "Untitled project"),
    exportHandoffAllowed,
    artifactCount: artifacts.length,
    readyCount,
    needsReviewCount,
    missingCount,
    blockedCount,
    artifacts,
    nextActions,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };

  return {
    ...hashPayload,
    generatedAt,
    bundleHash: await sha256Hex(stableStringify(hashPayload))
  };
}

export function exportJudgeHandoffBundleJson(bundle: JudgeHandoffBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function downloadJudgeHandoffBundleJson(filename: string, bundle: JudgeHandoffBundle): void {
  const blob = new Blob([exportJudgeHandoffBundleJson(bundle)], { type: "application/json;charset=utf-8" });
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

function createSubmissionPackArtifact(pack: SubmissionPack | null): JudgeHandoffBundleArtifact {
  const artifactHash = sanitizeHash(pack?.packHash ?? "");
  return {
    id: "submission-pack",
    label: "Submission Pack JSON",
    status: artifactHash ? mapSubmissionStatus(pack?.exportSafetySummary.status ?? "needs-action") : "missing",
    artifactHash,
    recoveryAction: sanitize(
      pack?.exportSafetySummary.nextActions[0] ?? "Open Sources after manifest and Regulatory Source Pack calculation completes."
    ),
    sourceSurface: "Sources",
    notLegalAdviceBoundary:
      pack?.notLegalAdviceBoundary ??
      "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only."
  };
}

function createDemoRunbookArtifact(runbook: DemoRunbook | null): JudgeHandoffBundleArtifact {
  const artifactHash = sanitizeHash(runbook?.runbookHash ?? "");
  return {
    id: "demo-runbook",
    label: "Demo Runbook JSON",
    status: artifactHash ? mapDemoRunbookStatus(runbook?.status ?? "needs-api") : "missing",
    artifactHash,
    recoveryAction: sanitize(
      runbook?.status === "ready"
        ? "Keep the Demo Runbook aligned with the current clean-clone script."
        : runbook?.nextActions[0] ?? "Complete Demo API preflight and download the Demo Runbook JSON before judge handoff."
    ),
    sourceSurface: "Sources",
    notLegalAdviceBoundary: runbook?.notLegalAdviceBoundary ?? "Not legal advice. Demo runbooks are audit preparation demo metadata only."
  };
}

function createExportSafetyInventoryArtifact(inventory: ExportSafetyInventory | null): JudgeHandoffBundleArtifact {
  const artifactHash = sanitizeHash(inventory?.inventoryHash ?? "");
  return {
    id: "export-safety-inventory",
    label: "Export Safety Inventory JSON",
    status: artifactHash ? mapInventoryStatus(inventory?.overallStatus ?? "needs-action") : "missing",
    artifactHash,
    recoveryAction: sanitize(
      inventory?.overallStatus === "ready"
        ? "Keep exports metadata-only and re-run inventory before external sharing."
        : inventory?.nextActions[0] ?? "Open Sources after export safety inventory calculation completes."
    ),
    sourceSurface: "Sources",
    notLegalAdviceBoundary:
      inventory?.notLegalAdviceBoundary ?? "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only."
  };
}

function createNextActions({
  submissionPack,
  demoRunbook,
  exportSafetyInventory,
  artifacts
}: {
  submissionPack: SubmissionPack | null;
  demoRunbook: DemoRunbook | null;
  exportSafetyInventory: ExportSafetyInventory | null;
  artifacts: JudgeHandoffBundleArtifact[];
}): string[] {
  const artifactActions = artifacts
    .filter((artifact) => artifact.status !== "ready")
    .map((artifact) => artifact.recoveryAction);
  const sourceActions = [
    ...(submissionPack?.exportSafetySummary.nextActions ?? []),
    ...(demoRunbook?.nextActions ?? []),
    ...(exportSafetyInventory?.nextActions.filter(() => exportSafetyInventory.overallStatus !== "ready") ?? [])
  ];
  const nextActions = unique([...sourceActions, ...artifactActions].map(sanitize).filter(Boolean));

  return nextActions.length > 0 ? nextActions : ["Judge Handoff Bundle is ready for metadata-only audit-prep review."];
}

function mapSubmissionStatus(status: SubmissionExportSafetyStatus): JudgeHandoffBundleArtifactStatus {
  if (status === "blocked") {
    return "blocked";
  }

  if (status === "ready") {
    return "ready";
  }

  return "needs-action";
}

function mapDemoRunbookStatus(status: DemoRunbook["status"]): JudgeHandoffBundleArtifactStatus {
  if (status === "blocked") {
    return "blocked";
  }

  if (status === "ready") {
    return "ready";
  }

  return "needs-action";
}

function mapInventoryStatus(status: ExportSafetyInventoryStatus): JudgeHandoffBundleArtifactStatus {
  return status;
}

function sanitizeHash(value: string): string {
  const normalized = value.replace(/\s+/g, "").trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : "";
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
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
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
