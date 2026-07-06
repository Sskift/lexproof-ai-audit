import type { EvidenceRetentionRemediationItem, EvidenceRetentionRemediationQueue } from "./evidenceRetentionRemediation";
import type { RetentionPolicyReport } from "./retentionPolicy";

export type EvidenceDisposalRunbookStatus = "delete-required" | "metadata-review-required" | "retention-ready";

export type EvidenceDisposalRunbookTaskAction =
  | "delete-or-replace-before-vault-sync"
  | "confirm-metadata-only-scope"
  | "retain-metadata-until-workspace-deletion";

export type EvidenceDisposalRunbookTask = {
  taskVersion: "lexproof-evidence-disposal-task-v1";
  id: string;
  priority: EvidenceRetentionRemediationItem["priority"];
  evidenceLabel: string;
  owner: string;
  evidenceStatus: string;
  dataClass: EvidenceRetentionRemediationItem["dataClass"];
  action: EvidenceDisposalRunbookTaskAction;
  verificationEvidence: string;
  redactedSnippet: string;
  retentionWindow: string;
  deletionTrigger: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence disposal tasks are audit preparation workflow metadata only.";
};

export type EvidenceDisposalRunbook = {
  runbookVersion: "lexproof-evidence-disposal-runbook-v1";
  workspaceId: string;
  generatedAt: string;
  status: EvidenceDisposalRunbookStatus;
  runbookHash: string;
  rawEvidenceIncluded: false;
  deletionPerformed: false;
  summary: {
    evidenceCount: number;
    deletionRequiredCount: number;
    metadataReviewCount: number;
    retainedMetadataCount: number;
    vaultSyncAllowed: boolean;
  };
  tasks: EvidenceDisposalRunbookTask[];
  nextSteps: string[];
  notLegalAdviceBoundary: "Not legal advice. Evidence disposal runbooks are audit preparation workflow metadata only and do not perform deletion.";
};

const RUNBOOK_BOUNDARY =
  "Not legal advice. Evidence disposal runbooks are audit preparation workflow metadata only and do not perform deletion." as const;
const TASK_BOUNDARY = "Not legal advice. Evidence disposal tasks are audit preparation workflow metadata only." as const;

export async function createEvidenceDisposalRunbook(
  report: RetentionPolicyReport,
  queue: EvidenceRetentionRemediationQueue,
  generatedAt = new Date().toISOString()
): Promise<EvidenceDisposalRunbook> {
  const tasks = queue.items.map(createTask);
  const status = createRunbookStatus(queue);
  const summary = {
    evidenceCount: report.evidenceCount,
    deletionRequiredCount: tasks.filter((task) => task.action === "delete-or-replace-before-vault-sync").length,
    metadataReviewCount: tasks.filter((task) => task.action === "confirm-metadata-only-scope").length,
    retainedMetadataCount: tasks.filter((task) => task.action === "retain-metadata-until-workspace-deletion").length,
    vaultSyncAllowed: report.vaultSyncAllowed
  };
  const nextSteps = createNextSteps(status, queue);
  const hashPayload = {
    runbookVersion: "lexproof-evidence-disposal-runbook-v1",
    workspaceId: report.workspaceId,
    status,
    rawEvidenceIncluded: false,
    deletionPerformed: false,
    summary,
    tasks,
    nextSteps,
    notLegalAdviceBoundary: RUNBOOK_BOUNDARY
  };

  return {
    runbookVersion: "lexproof-evidence-disposal-runbook-v1",
    workspaceId: report.workspaceId,
    generatedAt,
    status,
    runbookHash: await sha256Hex(stableStringify(hashPayload)),
    rawEvidenceIncluded: false,
    deletionPerformed: false,
    summary,
    tasks,
    nextSteps,
    notLegalAdviceBoundary: RUNBOOK_BOUNDARY
  };
}

export function exportEvidenceDisposalRunbookJson(runbook: EvidenceDisposalRunbook): string {
  return `${JSON.stringify(runbook, null, 2)}\n`;
}

export function downloadEvidenceDisposalRunbookJson(filename: string, runbook: EvidenceDisposalRunbook): void {
  const blob = new Blob([exportEvidenceDisposalRunbookJson(runbook)], { type: "application/json;charset=utf-8" });
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

function createTask(item: EvidenceRetentionRemediationItem): EvidenceDisposalRunbookTask {
  const action = toTaskAction(item);

  return {
    taskVersion: "lexproof-evidence-disposal-task-v1",
    id: item.id.replace(/^(p[0-2])-/, "$1-disposal-"),
    priority: item.priority,
    evidenceLabel: item.evidenceLabel,
    owner: item.owner,
    evidenceStatus: item.evidenceStatus,
    dataClass: item.dataClass,
    action,
    verificationEvidence: createVerificationEvidence(action, item),
    redactedSnippet: item.redactedSnippet,
    retentionWindow: item.retentionWindow,
    deletionTrigger: item.deletionTrigger,
    notLegalAdviceBoundary: TASK_BOUNDARY
  };
}

function createRunbookStatus(queue: EvidenceRetentionRemediationQueue): EvidenceDisposalRunbookStatus {
  if (queue.summary.blockedActionCount > 0) {
    return "delete-required";
  }
  if (queue.summary.reviewActionCount > 0) {
    return "metadata-review-required";
  }
  return "retention-ready";
}

function toTaskAction(item: EvidenceRetentionRemediationItem): EvidenceDisposalRunbookTaskAction {
  if (item.actionType === "delete-or-replace") {
    return "delete-or-replace-before-vault-sync";
  }
  if (item.actionType === "confirm-metadata-only") {
    return "confirm-metadata-only-scope";
  }
  return "retain-metadata-until-workspace-deletion";
}

function createVerificationEvidence(action: EvidenceDisposalRunbookTaskAction, item: EvidenceRetentionRemediationItem): string {
  if (action === "delete-or-replace-before-vault-sync") {
    return `Record replacement metadata or reviewer deletion confirmation for ${item.evidenceLabel} before vault sync.`;
  }
  if (action === "confirm-metadata-only-scope") {
    return `Record human confirmation that ${item.evidenceLabel} contains metadata-only ${item.dataClass} references.`;
  }
  return `Keep ${item.evidenceLabel} linked to workspace deletion or supersession metadata.`;
}

function createNextSteps(status: EvidenceDisposalRunbookStatus, queue: EvidenceRetentionRemediationQueue): string[] {
  if (status === "delete-required") {
    return ["Complete P0 disposal tasks before Evidence Vault sync.", ...queue.nextSteps];
  }
  if (status === "metadata-review-required") {
    return ["Capture P1 reviewer confirmation before external handoff.", ...queue.nextSteps];
  }
  return ["Keep this runbook with the final handoff packet until workspace deletion.", ...queue.nextSteps];
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
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
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
