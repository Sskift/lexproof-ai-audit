import type { RetentionPolicyAction, RetentionPolicyReport } from "./retentionPolicy";

export type EvidenceRetentionRemediationActionType =
  | "delete-or-replace"
  | "confirm-metadata-only"
  | "retain-metadata-only";

export type EvidenceRetentionRemediationPriority = "P0" | "P1" | "P2";

export type EvidenceRetentionRemediationItem = {
  itemVersion: "lexproof-evidence-retention-remediation-item-v1";
  id: string;
  priority: EvidenceRetentionRemediationPriority;
  evidenceLabel: string;
  owner: string;
  evidenceStatus: string;
  dataClass: RetentionPolicyAction["dataClass"];
  actionType: EvidenceRetentionRemediationActionType;
  reason: string;
  redactedSnippet: string;
  retentionWindow: string;
  deletionTrigger: string;
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence retention remediation items are audit preparation workflow metadata only.";
};

export type EvidenceRetentionRemediationQueue = {
  queueVersion: "lexproof-evidence-retention-remediation-queue-v1";
  workspaceId: string;
  generatedAt: string;
  status: RetentionPolicyReport["status"];
  queueHash: string;
  summary: {
    totalActionCount: number;
    blockedActionCount: number;
    reviewActionCount: number;
    readyActionCount: number;
    vaultSyncAllowed: boolean;
  };
  items: EvidenceRetentionRemediationItem[];
  nextSteps: string[];
  notLegalAdviceBoundary: "Not legal advice. Evidence retention remediation queues are audit preparation workflow metadata only.";
};

const QUEUE_BOUNDARY = "Not legal advice. Evidence retention remediation queues are audit preparation workflow metadata only." as const;
const ITEM_BOUNDARY = "Not legal advice. Evidence retention remediation items are audit preparation workflow metadata only." as const;

export async function createEvidenceRetentionRemediationQueue(
  report: RetentionPolicyReport,
  generatedAt = new Date().toISOString()
): Promise<EvidenceRetentionRemediationQueue> {
  const items = report.actions.map(createRemediationItem).sort(compareRemediationItems);
  const summary = {
    totalActionCount: items.length,
    blockedActionCount: report.blockerCount,
    reviewActionCount: report.reviewCount,
    readyActionCount: report.readyCount,
    vaultSyncAllowed: report.vaultSyncAllowed
  };
  const nextSteps = createQueueNextSteps(report);
  const hashPayload = {
    queueVersion: "lexproof-evidence-retention-remediation-queue-v1",
    workspaceId: report.workspaceId,
    status: report.status,
    summary,
    items,
    nextSteps,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };

  return {
    queueVersion: "lexproof-evidence-retention-remediation-queue-v1",
    workspaceId: report.workspaceId,
    generatedAt,
    status: report.status,
    queueHash: await sha256Hex(stableStringify(hashPayload)),
    summary,
    items,
    nextSteps,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

export function exportEvidenceRetentionRemediationJson(queue: EvidenceRetentionRemediationQueue): string {
  return `${JSON.stringify(queue, null, 2)}\n`;
}

export function downloadEvidenceRetentionRemediationJson(filename: string, queue: EvidenceRetentionRemediationQueue): void {
  const blob = new Blob([exportEvidenceRetentionRemediationJson(queue)], { type: "application/json;charset=utf-8" });
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

function createRemediationItem(action: RetentionPolicyAction, index: number): EvidenceRetentionRemediationItem {
  const priority = toPriority(action);
  const actionType = toActionType(action);

  return {
    itemVersion: "lexproof-evidence-retention-remediation-item-v1",
    id: `${priority.toLowerCase()}-${slug(action.evidenceLabel)}-${action.dataClass}-${index + 1}`,
    priority,
    evidenceLabel: action.evidenceLabel,
    owner: action.owner,
    evidenceStatus: action.evidenceStatus,
    dataClass: action.dataClass,
    actionType,
    reason: action.reason,
    redactedSnippet: action.redactedSnippet,
    retentionWindow: action.retentionWindow,
    deletionTrigger: action.deletionTrigger,
    nextAction: createNextAction(action, actionType),
    notLegalAdviceBoundary: ITEM_BOUNDARY
  };
}

function toPriority(action: RetentionPolicyAction): EvidenceRetentionRemediationPriority {
  if (action.severity === "block") {
    return "P0";
  }
  if (action.severity === "warn") {
    return "P1";
  }
  return "P2";
}

function toActionType(action: RetentionPolicyAction): EvidenceRetentionRemediationActionType {
  if (action.severity === "block") {
    return "delete-or-replace";
  }
  if (action.severity === "warn") {
    return "confirm-metadata-only";
  }
  return "retain-metadata-only";
}

function createNextAction(action: RetentionPolicyAction, actionType: EvidenceRetentionRemediationActionType): string {
  if (actionType === "delete-or-replace") {
    return `Delete or replace ${action.evidenceLabel} before Evidence Vault sync.`;
  }
  if (actionType === "confirm-metadata-only") {
    return `Confirm ${action.evidenceLabel} is metadata-only before Evidence Vault sync.`;
  }
  return `Keep ${action.evidenceLabel} as metadata-only evidence until workspace deletion or supersession.`;
}

function createQueueNextSteps(report: RetentionPolicyReport): string[] {
  if (report.status === "blocked") {
    return ["Work P0 items before Evidence Vault sync.", ...report.nextSteps];
  }
  if (report.status === "needs-review") {
    return ["Resolve P1 metadata confirmation before external handoff.", ...report.nextSteps];
  }
  return ["Keep P2 metadata-only retention actions visible during handoff.", ...report.nextSteps];
}

function compareRemediationItems(left: EvidenceRetentionRemediationItem, right: EvidenceRetentionRemediationItem): number {
  return `${left.priority}-${left.evidenceLabel}-${left.dataClass}-${left.actionType}-${left.id}`.localeCompare(
    `${right.priority}-${right.evidenceLabel}-${right.dataClass}-${right.actionType}-${right.id}`
  );
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

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 56) || "evidence"
  );
}
