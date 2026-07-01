import type { EvidenceItem, EvidenceStatus } from "./projectModel";

export type EvidenceRecertificationPriority = "P0" | "P1" | "P2";

export type EvidenceRecertificationStatus = "ready" | "monitoring" | "needs-recertification";

export type EvidenceRecertificationItem = {
  itemVersion: "lexproof-evidence-recertification-item-v1";
  id: string;
  priority: EvidenceRecertificationPriority;
  evidenceIndex: number;
  evidenceId: string;
  evidenceLabel: string;
  evidenceKind: string;
  owner: string;
  evidenceStatus: EvidenceStatus;
  lastReviewedAt: string;
  dueAt: string;
  ageDays: number;
  daysUntilDue: number;
  linkedControlIds: string[];
  linkedRiskIds: string[];
  reason: string;
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence recertification items are audit preparation workflow metadata only.";
};

export type EvidenceRecertificationQueue = {
  queueVersion: "lexproof-evidence-recertification-queue-v1";
  workspaceId: string;
  generatedAt: string;
  status: EvidenceRecertificationStatus;
  queueHash: string;
  policy: {
    recertificationIntervalDays: number;
    warningWindowDays: number;
  };
  summary: {
    totalActionCount: number;
    overdueCount: number;
    expiringCount: number;
    sourceLinkedCount: number;
    missingTimestampCount: number;
  };
  items: EvidenceRecertificationItem[];
  nextSteps: string[];
  notLegalAdviceBoundary: "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only.";
};

export type EvidenceRecertificationInput = {
  workspaceId: string;
  evidenceItems: EvidenceItem[];
  generatedAt?: string;
  recertificationIntervalDays?: number;
  warningWindowDays?: number;
};

const QUEUE_BOUNDARY = "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only." as const;
const ITEM_BOUNDARY = "Not legal advice. Evidence recertification items are audit preparation workflow metadata only." as const;
const DEFAULT_RECERTIFICATION_INTERVAL_DAYS = 90;
const DEFAULT_WARNING_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const RELIANCE_READY_STATUSES: EvidenceStatus[] = ["received", "under-review", "verified"];

export async function createEvidenceRecertificationQueue(
  input: EvidenceRecertificationInput
): Promise<EvidenceRecertificationQueue> {
  const generatedAt = normalizeDate(input.generatedAt) ?? new Date().toISOString();
  const generatedDate = new Date(generatedAt);
  const policy = {
    recertificationIntervalDays: normalizePositiveInteger(
      input.recertificationIntervalDays,
      DEFAULT_RECERTIFICATION_INTERVAL_DAYS
    ),
    warningWindowDays: normalizePositiveInteger(input.warningWindowDays, DEFAULT_WARNING_WINDOW_DAYS)
  };
  const items = input.evidenceItems
    .flatMap((item, index) => createRecertificationItem(item, index, generatedDate, policy))
    .sort(compareRecertificationItems);
  const overdueCount = items.filter((item) => item.daysUntilDue <= 0).length;
  const expiringCount = items.filter((item) => item.daysUntilDue > 0).length;
  const sourceLinkedCount = items.filter((item) => item.linkedControlIds.length > 0 || item.linkedRiskIds.length > 0).length;
  const missingTimestampCount = items.filter((item) => item.lastReviewedAt === "missing").length;
  const status: EvidenceRecertificationStatus =
    overdueCount > 0 || missingTimestampCount > 0 ? "needs-recertification" : expiringCount > 0 ? "monitoring" : "ready";
  const summary = {
    totalActionCount: items.length,
    overdueCount,
    expiringCount,
    sourceLinkedCount,
    missingTimestampCount
  };
  const nextSteps = createNextSteps(status, summary);
  const hashPayload = {
    queueVersion: "lexproof-evidence-recertification-queue-v1",
    workspaceId: normalizeWorkspaceId(input.workspaceId),
    status,
    policy,
    summary,
    items,
    nextSteps,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };

  return {
    queueVersion: "lexproof-evidence-recertification-queue-v1",
    workspaceId: normalizeWorkspaceId(input.workspaceId),
    generatedAt,
    status,
    queueHash: await sha256Hex(stableStringify(hashPayload)),
    policy,
    summary,
    items,
    nextSteps,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

export function exportEvidenceRecertificationJson(queue: EvidenceRecertificationQueue): string {
  return `${JSON.stringify(queue, null, 2)}\n`;
}

export function downloadEvidenceRecertificationJson(filename: string, queue: EvidenceRecertificationQueue): void {
  const blob = new Blob([exportEvidenceRecertificationJson(queue)], { type: "application/json;charset=utf-8" });
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

function createRecertificationItem(
  item: EvidenceItem,
  evidenceIndex: number,
  generatedDate: Date,
  policy: EvidenceRecertificationQueue["policy"]
): EvidenceRecertificationItem[] {
  const evidenceStatus = item.status ?? "draft";
  if (!RELIANCE_READY_STATUSES.includes(evidenceStatus)) {
    return [];
  }

  const lastReviewedDate = parseEvidenceDate(item.updatedAt) ?? parseEvidenceDate(item.addedAt);
  const sourceText = [item.source, item.label, item.kind].filter(Boolean).join(" ");
  const linkedControlIds = extractIds(sourceText, /control-[a-z0-9-]+/gi);
  const linkedRiskIds = extractRiskIds(sourceText);

  if (!lastReviewedDate) {
    return [
      createItem({
        item,
        evidenceIndex,
        priority: linkedControlIds.length > 0 || linkedRiskIds.length > 0 ? "P0" : "P1",
        lastReviewedAt: "missing",
        dueAt: "missing",
        ageDays: 0,
        daysUntilDue: 0,
        linkedControlIds,
        linkedRiskIds,
        reason: "Reliance-ready evidence is missing a review timestamp for recertification tracking.",
        nextAction: "Add a review timestamp or refresh this evidence before counsel/export reliance."
      })
    ];
  }

  const ageDays = Math.max(0, Math.floor((generatedDate.getTime() - lastReviewedDate.getTime()) / DAY_MS));
  const dueDate = new Date(lastReviewedDate.getTime() + policy.recertificationIntervalDays * DAY_MS);
  const daysUntilDue = Math.ceil((dueDate.getTime() - generatedDate.getTime()) / DAY_MS);

  if (daysUntilDue > policy.warningWindowDays) {
    return [];
  }

  const priority = createPriority(daysUntilDue, linkedControlIds, linkedRiskIds);
  const reason =
    daysUntilDue <= 0
      ? "Evidence exceeded the recertification window for audit-prep reliance."
      : "Evidence is approaching the recertification window for the next handoff.";
  const nextAction =
    priority === "P0"
      ? "Recertify source-linked evidence before counsel/export reliance."
      : priority === "P1"
        ? "Confirm owner and refresh evidence metadata before the next handoff."
        : "Schedule recertification before the due date.";

  return [
    createItem({
      item,
      evidenceIndex,
      priority,
      lastReviewedAt: lastReviewedDate.toISOString(),
      dueAt: dueDate.toISOString(),
      ageDays,
      daysUntilDue,
      linkedControlIds,
      linkedRiskIds,
      reason,
      nextAction
    })
  ];
}

function createItem(input: {
  item: EvidenceItem;
  evidenceIndex: number;
  priority: EvidenceRecertificationPriority;
  lastReviewedAt: string;
  dueAt: string;
  ageDays: number;
  daysUntilDue: number;
  linkedControlIds: string[];
  linkedRiskIds: string[];
  reason: string;
  nextAction: string;
}): EvidenceRecertificationItem {
  return {
    itemVersion: "lexproof-evidence-recertification-item-v1",
    id: `${input.priority.toLowerCase()}-${slug(input.item.label)}-${input.item.id ?? input.evidenceIndex + 1}`,
    priority: input.priority,
    evidenceIndex: input.evidenceIndex,
    evidenceId: input.item.id ?? `local-evidence-${input.evidenceIndex + 1}`,
    evidenceLabel: safeText(input.item.label || "Untitled evidence"),
    evidenceKind: safeText(input.item.kind || "Evidence"),
    owner: safeText(input.item.owner ?? "Founder"),
    evidenceStatus: input.item.status ?? "draft",
    lastReviewedAt: input.lastReviewedAt,
    dueAt: input.dueAt,
    ageDays: input.ageDays,
    daysUntilDue: input.daysUntilDue,
    linkedControlIds: input.linkedControlIds,
    linkedRiskIds: input.linkedRiskIds,
    reason: input.reason,
    nextAction: input.nextAction,
    notLegalAdviceBoundary: ITEM_BOUNDARY
  };
}

function createPriority(
  daysUntilDue: number,
  linkedControlIds: string[],
  linkedRiskIds: string[]
): EvidenceRecertificationPriority {
  if (daysUntilDue <= 0 && (linkedControlIds.length > 0 || linkedRiskIds.length > 0)) {
    return "P0";
  }
  if (daysUntilDue <= 0) {
    return "P1";
  }
  return "P2";
}

function createNextSteps(
  status: EvidenceRecertificationStatus,
  summary: EvidenceRecertificationQueue["summary"]
): string[] {
  if (status === "needs-recertification") {
    return [
      "Refresh P0/P1 evidence metadata before counsel/export reliance.",
      `${summary.sourceLinkedCount} source-linked recertification item${summary.sourceLinkedCount === 1 ? "" : "s"} should stay visible in handoff notes.`
    ];
  }
  if (status === "monitoring") {
    return ["Schedule upcoming recertification tasks before the next counsel handoff."];
  }
  return ["No recertification action is due for reliance-ready evidence."];
}

function compareRecertificationItems(left: EvidenceRecertificationItem, right: EvidenceRecertificationItem): number {
  const priorityOrder: Record<EvidenceRecertificationPriority, number> = { P0: 0, P1: 1, P2: 2 };
  return (
    priorityOrder[left.priority] - priorityOrder[right.priority] ||
    left.daysUntilDue - right.daysUntilDue ||
    `${left.evidenceLabel}-${left.evidenceId}`.localeCompare(`${right.evidenceLabel}-${right.evidenceId}`)
  );
}

function normalizeWorkspaceId(workspaceId: string): string {
  return workspaceId.trim() || "local-workspace";
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.trunc(value as number));
}

function normalizeDate(value: string | undefined): string | null {
  const parsed = parseEvidenceDate(value);
  return parsed?.toISOString() ?? null;
}

function parseEvidenceDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractIds(text: string, pattern: RegExp): string[] {
  return Array.from(new Set(text.match(pattern)?.map((item) => item.toLowerCase()) ?? [])).sort();
}

function extractRiskIds(text: string): string[] {
  const explicitIds = extractIds(text, /risk-[a-z0-9-]+/gi);
  const requirementMatches = Array.from(text.matchAll(/risk evidence requirement:\s*([a-z0-9-]+)/gi)).map(
    (match) => `risk-${match[1].toLowerCase()}`
  );
  return Array.from(new Set([...explicitIds, ...requirementMatches])).sort();
}

function safeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
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
