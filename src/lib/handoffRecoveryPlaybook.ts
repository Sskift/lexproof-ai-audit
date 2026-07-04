import type { CounselHandoffChecklist, CounselHandoffChecklistItem } from "./counselHandoffChecklist";
import { redactDataBoundaryText } from "./dataBoundary";
import type { ExportSafetyInventory, ExportSafetyInventoryArtifact } from "./exportSafetyInventory";
import type { JudgeHandoffBundle, JudgeHandoffBundleArtifact } from "./judgeHandoffBundle";
import type { WorkspaceActionTarget } from "./workspaceActionQueue";

export type HandoffRecoverySeverity = "blocked" | "needs-action" | "needs-review";

export type HandoffRecoveryPlaybookStatus = "ready" | "needs-review" | "needs-action" | "blocked" | "calculating";

export type HandoffRecoveryStepSource =
  | "export-safety-inventory"
  | "judge-handoff-bundle"
  | "counsel-handoff-checklist"
  | "system";

export type HandoffRecoveryStep = {
  stepVersion: "lexproof-handoff-recovery-step-v1";
  id: string;
  rank: number;
  severity: HandoffRecoverySeverity;
  targetSurface: WorkspaceActionTarget;
  source: HandoffRecoveryStepSource;
  sourceArtifactId: string;
  sourceLabel: string;
  title: string;
  reason: string;
  recoveryAction: string;
  artifactHash?: string;
  notLegalAdviceBoundary: "Not legal advice. Handoff recovery steps are audit preparation workflow metadata only.";
};

export type HandoffRecoveryPlaybook = {
  playbookVersion: "lexproof-handoff-recovery-playbook-v1";
  workspaceId: string;
  projectName: string;
  generatedAt: string;
  playbookHash: string;
  status: HandoffRecoveryPlaybookStatus;
  exportHandoffAllowed: boolean;
  stepCount: number;
  blockedCount: number;
  needsActionCount: number;
  needsReviewCount: number;
  nextActions: string[];
  steps: HandoffRecoveryStep[];
  notLegalAdviceBoundary: "Not legal advice. Handoff Recovery Playbooks are audit preparation workflow metadata only.";
};

export type CreateHandoffRecoveryPlaybookInput = {
  workspaceId: string;
  projectName: string;
  exportSafetyInventory: ExportSafetyInventory | null;
  judgeHandoffBundle: JudgeHandoffBundle | null;
  counselHandoffChecklist?: CounselHandoffChecklist | null;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Handoff Recovery Playbooks are audit preparation workflow metadata only." as const;
const STEP_BOUNDARY = "Not legal advice. Handoff recovery steps are audit preparation workflow metadata only." as const;

export async function createHandoffRecoveryPlaybook({
  workspaceId,
  projectName,
  exportSafetyInventory,
  judgeHandoffBundle,
  counselHandoffChecklist,
  generatedAt = new Date().toISOString()
}: CreateHandoffRecoveryPlaybookInput): Promise<HandoffRecoveryPlaybook> {
  const calculating = !exportSafetyInventory || !judgeHandoffBundle || !counselHandoffChecklist;
  const rawSteps = calculating
    ? [createCalculatingStep()]
    : [
        ...createExportSafetySteps(exportSafetyInventory),
        ...createJudgeHandoffSteps(judgeHandoffBundle),
        ...createCounselChecklistSteps(counselHandoffChecklist)
      ];
  const steps = rankSteps(dedupeSteps(rawSteps));
  const blockedCount = steps.filter((step) => step.severity === "blocked").length;
  const needsActionCount = steps.filter((step) => step.severity === "needs-action").length;
  const needsReviewCount = steps.filter((step) => step.severity === "needs-review").length;
  const status = calculating ? "calculating" : createStatus({ blockedCount, needsActionCount, needsReviewCount });
  const exportHandoffAllowed =
    !calculating &&
    Boolean(exportSafetyInventory.exportHandoffAllowed) &&
    Boolean(judgeHandoffBundle.exportHandoffAllowed) &&
    Boolean(counselHandoffChecklist.handoffAllowed);
  const nextActions = createNextActions(status, steps);
  const hashPayload = {
    playbookVersion: "lexproof-handoff-recovery-playbook-v1" as const,
    workspaceId: sanitize(workspaceId),
    projectName: sanitize(projectName),
    status,
    exportHandoffAllowed,
    steps,
    nextActions
  };

  return {
    ...hashPayload,
    generatedAt,
    playbookHash: await sha256Hex(stableStringify(hashPayload)),
    stepCount: steps.length,
    blockedCount,
    needsActionCount,
    needsReviewCount,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportHandoffRecoveryPlaybookJson(playbook: HandoffRecoveryPlaybook): string {
  return `${JSON.stringify(playbook, null, 2)}\n`;
}

export function downloadHandoffRecoveryPlaybookJson(filename: string, playbook: HandoffRecoveryPlaybook): void {
  const blob = new Blob([exportHandoffRecoveryPlaybookJson(playbook)], { type: "application/json;charset=utf-8" });
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

function createExportSafetySteps(inventory: ExportSafetyInventory): HandoffRecoveryStep[] {
  const boundaryStep =
    inventory.boundaryBlockerCount > 0
      ? [
          createStep({
            id: "export-boundary-blockers",
            severity: "blocked",
            targetSurface: "evidence",
            source: "export-safety-inventory",
            sourceArtifactId: "data-boundary",
            sourceLabel: "Data Boundary",
            title: "Resolve export data boundary blockers",
            reason: `${inventory.boundaryBlockerCount} blocker${inventory.boundaryBlockerCount === 1 ? "" : "s"} must be removed or redacted before handoff.`,
            recoveryAction: "Remove secrets, private-key material, raw KYC, personal data, and raw evidence from workspace metadata before export.",
            artifactHash: inventory.inventoryHash
          })
        ]
      : [];

  return [
    ...boundaryStep,
    ...inventory.artifacts
      .filter((artifact) => artifact.status !== "ready")
      .map((artifact) => createExportArtifactStep(artifact, inventory.inventoryHash))
  ];
}

function createExportArtifactStep(artifact: ExportSafetyInventoryArtifact, inventoryHash: string): HandoffRecoveryStep {
  const primaryReason =
    artifact.blockers[0] ??
    artifact.warnings[0] ??
    `${artifact.label} is ${formatStatus(artifact.status)} for the current export handoff.`;

  return createStep({
    id: `export-${artifact.id}`,
    severity: mapArtifactStatus(artifact.status),
    targetSurface: targetForExportArtifact(artifact),
    source: "export-safety-inventory",
    sourceArtifactId: artifact.id,
    sourceLabel: artifact.label,
    title: `Recover ${artifact.label}`,
    reason: primaryReason,
    recoveryAction: artifact.recoveryAction,
    artifactHash: artifact.artifactHash ?? inventoryHash
  });
}

function createJudgeHandoffSteps(bundle: JudgeHandoffBundle): HandoffRecoveryStep[] {
  return bundle.artifacts
    .filter((artifact) => artifact.status !== "ready")
    .map((artifact) => createJudgeArtifactStep(artifact, bundle.bundleHash));
}

function createJudgeArtifactStep(artifact: JudgeHandoffBundleArtifact, bundleHash: string): HandoffRecoveryStep {
  return createStep({
    id: `judge-${artifact.id}`,
    severity: mapJudgeArtifactStatus(artifact.status),
    targetSurface: targetForJudgeArtifact(artifact),
    source: "judge-handoff-bundle",
    sourceArtifactId: artifact.id,
    sourceLabel: artifact.label,
    title: `Recover ${artifact.label}`,
    reason: `${artifact.label} is ${formatStatus(artifact.status)} in the Judge Handoff Bundle.`,
    recoveryAction: artifact.recoveryAction,
    artifactHash: artifact.artifactHash || bundleHash
  });
}

function createCounselChecklistSteps(checklist: CounselHandoffChecklist): HandoffRecoveryStep[] {
  return checklist.items
    .filter((item) => item.status !== "ready")
    .map((item) => createCounselChecklistStep(item, checklist.checklistHash));
}

function createCounselChecklistStep(item: CounselHandoffChecklistItem, checklistHash: string): HandoffRecoveryStep {
  return createStep({
    id: `counsel-checklist-${item.id}`,
    severity: mapChecklistItemStatus(item.status),
    targetSurface: targetForChecklistItem(item),
    source: "counsel-handoff-checklist",
    sourceArtifactId: item.id,
    sourceLabel: item.label,
    title: `Recover ${item.label}`,
    reason: item.evidence,
    recoveryAction: item.recoveryAction,
    artifactHash: item.artifactHash ?? checklistHash
  });
}

function createCalculatingStep(): HandoffRecoveryStep {
  return createStep({
    id: "sources-artifacts-calculating",
    severity: "needs-action",
    targetSurface: "sources",
    source: "system",
    sourceArtifactId: "sources",
    sourceLabel: "Sources artifacts",
    title: "Wait for Sources handoff artifacts",
    reason: "Export Safety Inventory, Judge Handoff Bundle, or Counsel Handoff Checklist is still calculating.",
    recoveryAction: "Keep Sources open until the handoff recovery playbook receives current artifact hashes."
  });
}

function createStep(input: Omit<HandoffRecoveryStep, "stepVersion" | "rank" | "notLegalAdviceBoundary">): HandoffRecoveryStep {
  return {
    stepVersion: "lexproof-handoff-recovery-step-v1",
    rank: 0,
    id: sanitizeId(input.id),
    severity: input.severity,
    targetSurface: input.targetSurface,
    source: input.source,
    sourceArtifactId: sanitizeId(input.sourceArtifactId),
    sourceLabel: safeText(input.sourceLabel),
    title: safeText(input.title),
    reason: safeText(input.reason),
    recoveryAction: safeText(input.recoveryAction),
    artifactHash: input.artifactHash ? sanitizeHash(input.artifactHash) : undefined,
    notLegalAdviceBoundary: STEP_BOUNDARY
  };
}

function dedupeSteps(steps: HandoffRecoveryStep[]): HandoffRecoveryStep[] {
  const byAction = new Map<string, HandoffRecoveryStep>();

  for (const step of steps) {
    const key = step.recoveryAction.toLowerCase();
    const current = byAction.get(key);
    if (!current || compareSteps(step, current) < 0) {
      byAction.set(key, step);
    }
  }

  return [...byAction.values()];
}

function rankSteps(steps: HandoffRecoveryStep[]): HandoffRecoveryStep[] {
  return steps
    .sort(compareSteps)
    .map((step, index) => ({
      ...step,
      rank: index + 1
    }));
}

function compareSteps(left: HandoffRecoveryStep, right: HandoffRecoveryStep): number {
  return (
    severityRank(left.severity) - severityRank(right.severity) ||
    sourceRank(left.source) - sourceRank(right.source) ||
    targetRank(left.targetSurface) - targetRank(right.targetSurface) ||
    left.sourceLabel.localeCompare(right.sourceLabel) ||
    left.id.localeCompare(right.id)
  );
}

function createStatus({
  blockedCount,
  needsActionCount,
  needsReviewCount
}: {
  blockedCount: number;
  needsActionCount: number;
  needsReviewCount: number;
}): HandoffRecoveryPlaybookStatus {
  if (blockedCount > 0) {
    return "blocked";
  }

  if (needsActionCount > 0) {
    return "needs-action";
  }

  if (needsReviewCount > 0) {
    return "needs-review";
  }

  return "ready";
}

function createNextActions(status: HandoffRecoveryPlaybookStatus, steps: HandoffRecoveryStep[]): string[] {
  if (status === "ready") {
    return ["Handoff recovery is clear; keep the playbook with the final metadata-only export packet."];
  }

  return unique(
    steps
      .sort(compareSteps)
      .slice(0, 5)
      .map((step) => `${step.sourceLabel}: ${step.recoveryAction}`)
  );
}

function mapArtifactStatus(status: ExportSafetyInventoryArtifact["status"]): HandoffRecoverySeverity {
  if (status === "blocked") {
    return "blocked";
  }

  if (status === "needs-review") {
    return "needs-review";
  }

  return "needs-action";
}

function mapJudgeArtifactStatus(status: JudgeHandoffBundleArtifact["status"]): HandoffRecoverySeverity {
  if (status === "blocked") {
    return "blocked";
  }

  if (status === "needs-review") {
    return "needs-review";
  }

  return "needs-action";
}

function mapChecklistItemStatus(status: CounselHandoffChecklistItem["status"]): HandoffRecoverySeverity {
  if (status === "blocked") {
    return "blocked";
  }

  if (status === "needs-review") {
    return "needs-review";
  }

  return "needs-action";
}

function targetForExportArtifact(artifact: ExportSafetyInventoryArtifact): WorkspaceActionTarget {
  if (
    artifact.id.includes("evidence") ||
    artifact.id.includes("manifest") ||
    artifact.category === "evidence"
  ) {
    return "evidence";
  }

  if (artifact.id.includes("counsel") || artifact.category === "counsel-export") {
    return "counsel";
  }

  if (artifact.id.includes("model")) {
    return "ai";
  }

  if (artifact.id.includes("grc")) {
    return "risk";
  }

  if (artifact.category === "source-lineage") {
    return "jurisdiction";
  }

  if (artifact.category === "review-workflow") {
    return "review";
  }

  if (artifact.category === "integration-readiness") {
    return "wizard";
  }

  return "sources";
}

function targetForJudgeArtifact(artifact: JudgeHandoffBundleArtifact): WorkspaceActionTarget {
  if (artifact.id === "counsel-handoff-checklist") {
    return "counsel";
  }

  return "sources";
}

function targetForChecklistItem(item: CounselHandoffChecklistItem): WorkspaceActionTarget {
  if (
    item.id.includes("evidence") ||
    item.id.includes("manifest") ||
    item.id.includes("vault") ||
    item.id.includes("recertification")
  ) {
    return "evidence";
  }

  if (item.id.includes("review")) {
    return "review";
  }

  if (item.id.includes("counsel") || item.id.includes("server-export")) {
    return "counsel";
  }

  if (item.id.includes("source")) {
    return "jurisdiction";
  }

  return "sources";
}

function severityRank(severity: HandoffRecoverySeverity): number {
  if (severity === "blocked") {
    return 0;
  }

  if (severity === "needs-action") {
    return 1;
  }

  return 2;
}

function sourceRank(source: HandoffRecoveryStepSource): number {
  if (source === "export-safety-inventory") {
    return 0;
  }

  if (source === "counsel-handoff-checklist") {
    return 1;
  }

  if (source === "judge-handoff-bundle") {
    return 2;
  }

  return 3;
}

function targetRank(target: WorkspaceActionTarget): number {
  const order: WorkspaceActionTarget[] = ["evidence", "counsel", "review", "ai", "model", "jurisdiction", "risk", "sources", "wizard"];
  const index = order.indexOf(target);
  return index === -1 ? order.length : index;
}

function formatStatus(status: string): string {
  return status.replace(/-/g, " ");
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function safeText(value: string): string {
  return redactDataBoundaryText(sanitize(value));
}

function sanitize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function sanitizeId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "handoff-recovery"
  );
}

function sanitizeHash(value: string): string {
  return /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : "";
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
