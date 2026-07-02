import { redactClassifiedText } from "./dataClassification";
import type { CounselHandoffChecklist, CounselHandoffChecklistStatus } from "./counselHandoffChecklist";
import type { DemoRunbook } from "./demoRunbook";
import type { ExportSafetyInventory, ExportSafetyInventoryStatus } from "./exportSafetyInventory";
import type { SubmissionExportSafetyStatus, SubmissionPack } from "./submissionPack";

export type JudgeHandoffBundleArtifactStatus = "ready" | "needs-review" | "needs-action" | "blocked" | "missing";

export type JudgeHandoffBundleArtifact = {
  id: "submission-pack" | "demo-runbook" | "export-safety-inventory" | "counsel-handoff-checklist";
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

export type JudgeHandoffReadinessStatus = "ready" | "needs-action" | "blocked";

export type JudgeHandoffRecoverySurface = "counsel-pack" | "judge-demo-readiness" | "sources-export-safety";

export type JudgeHandoffRecoveryAction = {
  actionVersion: "lexproof-judge-handoff-recovery-v1";
  id: JudgeHandoffBundleArtifact["id"];
  label: string;
  status: JudgeHandoffBundleArtifactStatus;
  targetSurface: JudgeHandoffRecoverySurface;
  buttonLabel: string;
  reason: string;
  recoveryAction: string;
  notLegalAdviceBoundary: "Not legal advice. Judge handoff recovery actions are audit preparation workflow metadata only.";
};

export type JudgeHandoffReadinessGate = {
  gateVersion: "lexproof-judge-handoff-readiness-v1";
  status: JudgeHandoffReadinessStatus;
  readyForJudgeHandoff: boolean;
  summary: string;
  primaryAction: JudgeHandoffRecoveryAction | null;
  actions: JudgeHandoffRecoveryAction[];
  notLegalAdviceBoundary: "Not legal advice. Judge handoff readiness is audit preparation workflow metadata only.";
};

export type CreateJudgeHandoffBundleInput = {
  projectName: string;
  submissionPack: SubmissionPack | null;
  demoRunbook: DemoRunbook | null;
  exportSafetyInventory: ExportSafetyInventory | null;
  counselHandoffChecklist?: CounselHandoffChecklist | null;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Judge handoff bundles are audit preparation metadata only." as const;
const READINESS_BOUNDARY = "Not legal advice. Judge handoff readiness is audit preparation workflow metadata only." as const;
const RECOVERY_BOUNDARY =
  "Not legal advice. Judge handoff recovery actions are audit preparation workflow metadata only." as const;

export async function createJudgeHandoffBundle({
  projectName,
  submissionPack,
  demoRunbook,
  exportSafetyInventory,
  counselHandoffChecklist,
  generatedAt = new Date().toISOString()
}: CreateJudgeHandoffBundleInput): Promise<JudgeHandoffBundle> {
  const artifacts = [
    createSubmissionPackArtifact(submissionPack),
    createDemoRunbookArtifact(demoRunbook),
    createExportSafetyInventoryArtifact(exportSafetyInventory),
    ...(counselHandoffChecklist ? [createCounselHandoffChecklistArtifact(counselHandoffChecklist)] : [])
  ];
  const readyCount = artifacts.filter((artifact) => artifact.status === "ready").length;
  const needsReviewCount = artifacts.filter((artifact) => artifact.status === "needs-review").length;
  const missingCount = artifacts.filter((artifact) => artifact.status === "missing").length;
  const blockedCount = artifacts.filter((artifact) => artifact.status === "blocked").length;
  const nextActions = createNextActions({
    submissionPack,
    demoRunbook,
    exportSafetyInventory,
    counselHandoffChecklist,
    artifacts
  });
  const exportHandoffAllowed =
    artifacts.every((artifact) => artifact.status === "ready") &&
    Boolean(submissionPack?.exportSafetySummary.exportHandoffAllowed) &&
    demoRunbook?.status === "ready" &&
    Boolean(exportSafetyInventory?.exportHandoffAllowed) &&
    (!counselHandoffChecklist || counselHandoffChecklist.handoffAllowed);
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

export function createJudgeHandoffReadinessGate(bundle: JudgeHandoffBundle | null): JudgeHandoffReadinessGate {
  if (!bundle) {
    return {
      gateVersion: "lexproof-judge-handoff-readiness-v1",
      status: "needs-action",
      readyForJudgeHandoff: false,
      summary: "Judge Handoff Bundle is still calculating from Sources artifacts.",
      primaryAction: null,
      actions: [],
      notLegalAdviceBoundary: READINESS_BOUNDARY
    };
  }

  const actions = bundle.artifacts
    .filter((artifact) => artifact.status !== "ready")
    .map(createRecoveryAction)
    .sort(compareRecoveryActions);
  const status = bundle.exportHandoffAllowed ? "ready" : actions.some((action) => action.status === "blocked") ? "blocked" : "needs-action";

  return {
    gateVersion: "lexproof-judge-handoff-readiness-v1",
    status,
    readyForJudgeHandoff: bundle.exportHandoffAllowed,
    summary: createReadinessSummary({ bundle, actionCount: actions.length, status }),
    primaryAction: actions[0] ?? null,
    actions,
    notLegalAdviceBoundary: READINESS_BOUNDARY
  };
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

function createCounselHandoffChecklistArtifact(checklist: CounselHandoffChecklist): JudgeHandoffBundleArtifact {
  const artifactHash = sanitizeHash(checklist.checklistHash);
  return {
    id: "counsel-handoff-checklist",
    label: "Counsel Handoff Checklist JSON",
    status: artifactHash ? mapCounselHandoffChecklistStatus(checklist.overallStatus) : "missing",
    artifactHash,
    recoveryAction: sanitize(
      checklist.handoffAllowed
        ? "Keep the Counsel Handoff Checklist with the final judge packet."
        : checklist.nextActions[0] ?? "Open Counsel Pack and resolve final handoff checklist blockers."
    ),
    sourceSurface: "Sources",
    notLegalAdviceBoundary: checklist.notLegalAdviceBoundary
  };
}

function createRecoveryAction(artifact: JudgeHandoffBundleArtifact): JudgeHandoffRecoveryAction {
  const target = recoveryTargetForArtifact(artifact);

  return {
    actionVersion: "lexproof-judge-handoff-recovery-v1",
    id: artifact.id,
    label: artifact.label,
    status: artifact.status,
    targetSurface: target.targetSurface,
    buttonLabel: target.buttonLabel,
    reason: target.reason,
    recoveryAction: artifact.recoveryAction,
    notLegalAdviceBoundary: RECOVERY_BOUNDARY
  };
}

function recoveryTargetForArtifact(artifact: JudgeHandoffBundleArtifact): Pick<
  JudgeHandoffRecoveryAction,
  "targetSurface" | "buttonLabel" | "reason"
> {
  if (artifact.id === "submission-pack") {
    return {
      targetSurface: "counsel-pack",
      buttonLabel: "Open Counsel Pack",
      reason: "Resolve saved version, server export, and export-safety blockers before judge handoff."
    };
  }

  if (artifact.id === "demo-runbook") {
    return {
      targetSurface: "judge-demo-readiness",
      buttonLabel: "Open Judge Demo Readiness",
      reason: "Complete demo API preflight and runbook readiness before judge handoff."
    };
  }

  if (artifact.id === "counsel-handoff-checklist") {
    return {
      targetSurface: "counsel-pack",
      buttonLabel: "Open Counsel Handoff Checklist",
      reason: "Resolve final checklist blockers before judge handoff."
    };
  }

  return {
    targetSurface: "sources-export-safety",
    buttonLabel: "Review Export Safety Inventory",
    reason: "Inspect export blockers and data-boundary findings before external sharing."
  };
}

function createReadinessSummary({
  bundle,
  actionCount,
  status
}: {
  bundle: JudgeHandoffBundle;
  actionCount: number;
  status: JudgeHandoffReadinessStatus;
}): string {
  if (bundle.exportHandoffAllowed) {
    return "Judge Handoff Bundle is ready for metadata-only judge handoff.";
  }

  const plural = actionCount === 1 ? "artifact needs" : "artifacts need";
  const severity = status === "blocked" ? "blocked" : "needs action";

  return `${actionCount} judge handoff ${plural} recovery before export handoff is allowed (${severity}).`;
}

function compareRecoveryActions(left: JudgeHandoffRecoveryAction, right: JudgeHandoffRecoveryAction): number {
  const priority = {
    blocked: 0,
    missing: 1,
    "needs-action": 2,
    "needs-review": 3,
    ready: 4
  } satisfies Record<JudgeHandoffBundleArtifactStatus, number>;

  return priority[left.status] - priority[right.status];
}

function createNextActions({
  submissionPack,
  demoRunbook,
  exportSafetyInventory,
  counselHandoffChecklist,
  artifacts
}: {
  submissionPack: SubmissionPack | null;
  demoRunbook: DemoRunbook | null;
  exportSafetyInventory: ExportSafetyInventory | null;
  counselHandoffChecklist?: CounselHandoffChecklist | null;
  artifacts: JudgeHandoffBundleArtifact[];
}): string[] {
  const artifactActions = artifacts
    .filter((artifact) => artifact.status !== "ready")
    .map((artifact) => artifact.recoveryAction);
  const sourceActions = [
    ...(submissionPack?.exportSafetySummary.nextActions ?? []),
    ...(demoRunbook?.nextActions ?? []),
    ...(exportSafetyInventory?.nextActions.filter(() => exportSafetyInventory.overallStatus !== "ready") ?? []),
    ...(counselHandoffChecklist?.nextActions.filter(() => !counselHandoffChecklist.handoffAllowed) ?? [])
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

function mapCounselHandoffChecklistStatus(status: CounselHandoffChecklistStatus): JudgeHandoffBundleArtifactStatus {
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
