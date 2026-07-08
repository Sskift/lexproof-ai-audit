import type { HumanReviewRecord } from "./phase2Types.js";

export type ServerHumanReviewQueueFilters = {
  targetType?: HumanReviewRecord["targetType"];
  status?: HumanReviewRecord["status"];
  reviewerId?: string;
};

export type ServerHumanReviewQueueView = {
  queueVersion: "lexproof-server-human-review-queue-v1";
  workspaceId: string;
  filters: ServerHumanReviewQueueFilters;
  totalCount: number;
  openCount: number;
  reviewedCount: number;
  blockedCount: number;
  targetTypeCounts: Partial<Record<HumanReviewRecord["targetType"], number>>;
  statusCounts: Partial<Record<HumanReviewRecord["status"], number>>;
  reviewerCounts: Record<string, number>;
  nextActions: string[];
  recoveryPacket: ServerHumanReviewRecoveryPacket;
  items: HumanReviewRecord[];
  notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only.";
};

export type CreateServerHumanReviewQueueViewInput = {
  workspaceId: string;
  records: HumanReviewRecord[];
  filters?: ServerHumanReviewQueueFilters;
  generatedAt?: string;
};

export type ServerHumanReviewRecoveryStatus = Extract<HumanReviewRecord["status"], "needs-more-evidence" | "rejected">;

export type ServerHumanReviewRecoverySeverity = "blocked" | "needs-action";

export type ServerHumanReviewRecoveryItem = {
  itemVersion: "lexproof-server-human-review-recovery-item-v1";
  id: string;
  workspaceId: string;
  targetType: HumanReviewRecord["targetType"];
  targetId: string;
  targetLabel: string;
  reviewerId: string;
  status: ServerHumanReviewRecoveryStatus;
  severity: ServerHumanReviewRecoverySeverity;
  reviewerComment: string;
  createdAt: string;
  updatedAt: string;
  recoveryAction: string;
  notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery items are audit preparation workflow metadata only.";
};

export type ServerHumanReviewRecoveryPacket = {
  packetVersion: "lexproof-server-human-review-recovery-packet-v1";
  workspaceId: string;
  generatedAt: string;
  packetHash: string;
  status: "ready" | "needs-recovery";
  summary: {
    totalRecoveryCount: number;
    returnedCount: number;
    rejectedCount: number;
    nextAction: string;
    notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only.";
  };
  nextActions: string[];
  items: ServerHumanReviewRecoveryItem[];
  notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only.";
};

export type CreateServerHumanReviewRecoveryPacketInput = {
  workspaceId: string;
  records: HumanReviewRecord[];
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Human review queues are audit preparation workflow metadata only.";
const RECOVERY_PACKET_BOUNDARY = "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only.";
const RECOVERY_ITEM_BOUNDARY = "Not legal advice. Server Human Review recovery items are audit preparation workflow metadata only.";
const OPEN_STATUSES = new Set<HumanReviewRecord["status"]>(["requested", "under-review", "needs-more-evidence"]);
const BLOCKED_STATUSES = new Set<HumanReviewRecord["status"]>(["rejected"]);
const STATUS_SORT_RANK: Record<HumanReviewRecord["status"], number> = {
  "needs-more-evidence": 0,
  requested: 1,
  "under-review": 2,
  rejected: 3,
  reviewed: 4
};

export function createServerHumanReviewQueueView(input: CreateServerHumanReviewQueueViewInput): ServerHumanReviewQueueView {
  const filters = normalizeFilters(input.filters);
  const items = input.records.filter((record) => matchesFilters(record, filters)).sort(compareReviewRecords);
  const needsMoreEvidenceCount = items.filter((item) => item.status === "needs-more-evidence").length;
  const blockedCount = items.filter((item) => BLOCKED_STATUSES.has(item.status)).length;
  const openCount = items.filter((item) => OPEN_STATUSES.has(item.status)).length;

  return {
    queueVersion: "lexproof-server-human-review-queue-v1",
    workspaceId: input.workspaceId.trim(),
    filters,
    totalCount: items.length,
    openCount,
    reviewedCount: items.filter((item) => item.status === "reviewed").length,
    blockedCount,
    targetTypeCounts: countBy(items, (item) => item.targetType),
    statusCounts: countBy(items, (item) => item.status),
    reviewerCounts: countBy(items, (item) => item.reviewerId),
    nextActions: createNextActions(items.length, {
      blockedCount,
      needsMoreEvidenceCount,
      openCount
    }),
    recoveryPacket: createServerHumanReviewRecoveryPacket({
      workspaceId: input.workspaceId,
      records: items,
      generatedAt: input.generatedAt
    }),
    items,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function createServerHumanReviewRecoveryPacket(
  input: CreateServerHumanReviewRecoveryPacketInput
): ServerHumanReviewRecoveryPacket {
  const workspaceId = sanitizeText(input.workspaceId || "local-workspace", "local-workspace");
  const items = input.records
    .filter((record): record is HumanReviewRecord & { status: ServerHumanReviewRecoveryStatus } =>
      record.status === "needs-more-evidence" || record.status === "rejected"
    )
    .map(createRecoveryItem)
    .sort(compareRecoveryItems);
  const returnedCount = items.filter((item) => item.status === "needs-more-evidence").length;
  const rejectedCount = items.filter((item) => item.status === "rejected").length;
  const summary: ServerHumanReviewRecoveryPacket["summary"] = {
    totalRecoveryCount: items.length,
    returnedCount,
    rejectedCount,
    nextAction: createRecoveryNextAction(items),
    notLegalAdviceBoundary: RECOVERY_PACKET_BOUNDARY
  };
  const nextActions = createRecoveryNextActions(items, summary.nextAction);
  const hashPayload: Omit<ServerHumanReviewRecoveryPacket, "generatedAt" | "packetHash"> = {
    packetVersion: "lexproof-server-human-review-recovery-packet-v1",
    workspaceId,
    status: items.length > 0 ? ("needs-recovery" as const) : ("ready" as const),
    summary,
    nextActions,
    items,
    notLegalAdviceBoundary: RECOVERY_PACKET_BOUNDARY
  };

  return {
    ...hashPayload,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    packetHash: stableHash(stableStringify(hashPayload))
  };
}

export function exportServerHumanReviewRecoveryPacketJson(packet: ServerHumanReviewRecoveryPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

function normalizeFilters(filters: ServerHumanReviewQueueFilters | undefined): ServerHumanReviewQueueFilters {
  const normalized: ServerHumanReviewQueueFilters = {};

  if (filters?.targetType) {
    normalized.targetType = filters.targetType;
  }

  if (filters?.status) {
    normalized.status = filters.status;
  }

  const reviewerId = filters?.reviewerId?.trim();
  if (reviewerId) {
    normalized.reviewerId = reviewerId;
  }

  return normalized;
}

function matchesFilters(record: HumanReviewRecord, filters: ServerHumanReviewQueueFilters): boolean {
  if (filters.targetType && record.targetType !== filters.targetType) {
    return false;
  }

  if (filters.status && record.status !== filters.status) {
    return false;
  }

  if (filters.reviewerId && record.reviewerId !== filters.reviewerId) {
    return false;
  }

  return true;
}

function compareReviewRecords(left: HumanReviewRecord, right: HumanReviewRecord): number {
  const status = STATUS_SORT_RANK[left.status] - STATUS_SORT_RANK[right.status];
  if (status !== 0) {
    return status;
  }

  const updatedAt = left.updatedAt.localeCompare(right.updatedAt);
  return updatedAt === 0 ? left.id.localeCompare(right.id) : updatedAt;
}

function countBy<T extends string>(items: HumanReviewRecord[], selectKey: (item: HumanReviewRecord) => T): Record<T, number> {
  return items
    .map(selectKey)
    .sort((left, right) => left.localeCompare(right))
    .reduce<Record<T, number>>((counts, key) => {
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {} as Record<T, number>);
}

function createNextActions(
  itemCount: number,
  counts: { blockedCount: number; needsMoreEvidenceCount: number; openCount: number }
): string[] {
  if (itemCount === 0) {
    return ["Create a human review request for evidence, model output, risk flags, or counsel pack handoff."];
  }

  const actions: string[] = [];

  if (counts.blockedCount > 0) {
    actions.push(
      `${formatCount(counts.blockedCount, "review item")} ${counts.blockedCount === 1 ? "is" : "are"} rejected and ${
        counts.blockedCount === 1 ? "needs" : "need"
      } recovery before export readiness.`
    );
  }

  if (counts.needsMoreEvidenceCount > 0) {
    actions.push(
      `${formatCount(counts.needsMoreEvidenceCount, "review item")} ${
        counts.needsMoreEvidenceCount === 1 ? "needs" : "need"
      } more evidence before counsel handoff.`
    );
  }

  const generalOpenCount = counts.openCount - counts.needsMoreEvidenceCount;
  if (generalOpenCount > 0) {
    actions.push(`${formatCount(generalOpenCount, "review item")} ${generalOpenCount === 1 ? "is" : "are"} still open.`);
  }

  if (actions.length === 0) {
    actions.push("All review items in this queue are closed for audit-preparation handoff.");
  }

  return actions;
}

function formatCount(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function createRecoveryItem(record: HumanReviewRecord & { status: ServerHumanReviewRecoveryStatus }): ServerHumanReviewRecoveryItem {
  return {
    itemVersion: "lexproof-server-human-review-recovery-item-v1",
    id: sanitizeText(record.id, "human-review-record"),
    workspaceId: sanitizeText(record.workspaceId, "local-workspace"),
    targetType: record.targetType,
    targetId: sanitizeText(record.targetId, "review-target"),
    targetLabel: createTargetLabel(record),
    reviewerId: sanitizeText(record.reviewerId || "Unassigned reviewer", "Unassigned reviewer"),
    status: record.status,
    severity: record.status === "rejected" ? "blocked" : "needs-action",
    reviewerComment: sanitizeText(record.comment || "No reviewer comment recorded.", "No reviewer comment recorded."),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    recoveryAction: createRecoveryAction(record),
    notLegalAdviceBoundary: RECOVERY_ITEM_BOUNDARY
  };
}

function createTargetLabel(record: Pick<HumanReviewRecord, "targetType" | "targetId">): string {
  return sanitizeText(`${record.targetType} ${record.targetId}`, "review target");
}

function createRecoveryAction(record: HumanReviewRecord & { status: ServerHumanReviewRecoveryStatus }): string {
  if (record.targetType === "evidence" && record.status === "rejected") {
    return "Create replacement Evidence Vault metadata before relying on this record for export readiness.";
  }

  if (record.targetType === "evidence") {
    return "Return the linked Evidence Vault record to requested status and attach additional metadata before review.";
  }

  if (record.targetType === "model-run" && record.status === "rejected") {
    return "Create or rerun a replacement model output receipt and route it through Human Review before audit-prep reliance.";
  }

  if (record.targetType === "model-run") {
    return "Attach missing evidence context before relying on the model run receipt.";
  }

  if (record.targetType === "clause-match") {
    return "Refresh source metadata or route the clause-match record to local counsel before source handoff.";
  }

  if (record.targetType === "counsel-pack") {
    return "Save a new Counsel Pack version after blockers are remediated and route it back through Human Review.";
  }

  return "Attach missing evidence or reviewer context before external audit-prep handoff.";
}

function createRecoveryNextAction(items: ServerHumanReviewRecoveryItem[]): string {
  if (items.length === 0) {
    return "No returned or rejected server human review records currently need recovery.";
  }

  const first = items[0];
  return `${first.targetLabel}: ${first.recoveryAction}`;
}

function createRecoveryNextActions(items: ServerHumanReviewRecoveryItem[], summaryNextAction: string): string[] {
  return Array.from(
    new Set([
      summaryNextAction,
      ...items.map((item) => `${item.targetLabel}: ${item.recoveryAction}`)
    ])
  ).filter((action) => action.trim().length > 0);
}

function compareRecoveryItems(left: ServerHumanReviewRecoveryItem, right: ServerHumanReviewRecoveryItem): number {
  return (
    recoveryStatusWeight(left.status) - recoveryStatusWeight(right.status) ||
    left.updatedAt.localeCompare(right.updatedAt) ||
    left.id.localeCompare(right.id)
  );
}

function recoveryStatusWeight(status: ServerHumanReviewRecoveryStatus): number {
  return status === "rejected" ? 0 : 1;
}

function sanitizeText(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, " ").trim() || fallback;

  return normalized
    .replace(/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9]+ )*PRIVATE KEY-----/gi, "[redacted-private-key]")
    .replace(/\b(?:seed phrase|mnemonic|recovery phrase|wallet secret(?: phrase)?|private key)\b(?:\s*[:=]?\s*[a-z]+(?:\s+[a-z]+){2,23})?/gi, "[redacted-private-key]")
    .replace(/\b0x[a-fA-F0-9]{64}\b/g, "[redacted-private-key]")
    .replace(/\bsk-(?:live|test|proj|[a-z0-9])[-_A-Za-z0-9]{12,}\b/g, "[redacted-api-key]")
    .replace(/\b(?:bearer|basic)\s+[A-Za-z0-9._~+/=-]{12,}\b/gi, "[redacted-secret]")
    .replace(/\b(?:raw\s+kyc|kyc\s+(packet|file|document|upload|room|dump|csv|spreadsheet))\b/gi, "[redacted-raw-kyc]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:passport(?:\s+(?:number|no\.?|id))?\s+(?:[A-Z]{1,3}\d{5,9}|\d{6,12})|passport\s+(?:file|document|record))\b/gi, "[redacted-identity-document]")
    .replace(/\b(?:legal approval|legal conclusion|non-compliant|compliant|approved)\b/gi, "review-state");
}

function stableHash(payload: string): string {
  const seeds = [0xcbf29ce484222325n, 0x84222325cbf29ce4n, 0x9e3779b185ebca87n, 0xc2b2ae3d27d4eb4fn];
  return seeds.map((seed) => fnv1a64(payload, seed)).join("");
}

function fnv1a64(payload: string, seed: bigint): string {
  let hash = seed;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = (hash * prime) & mask;
  }

  return hash.toString(16).padStart(16, "0");
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
