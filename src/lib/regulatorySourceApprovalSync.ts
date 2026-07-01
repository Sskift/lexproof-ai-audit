import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification.js";
import type { RegulatorySourceApprovalRecord, RegulatorySourceApprovalSyncResult } from "./phase2Types.js";

export type RegulatorySourceApprovalSyncItem = {
  id: string;
  priority: "P0" | "P1";
  approvalStatus: "approval-required" | "metadata-required";
  reviewStatus: "current" | "review-due" | "metadata-missing";
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  reviewerNotes: string;
  nextAction: string;
  approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.";
  notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only.";
};

export type RegulatorySourceApprovalSyncQueue = {
  queueVersion: "lexproof-regulatory-source-approval-queue-v1";
  generatedAt: string;
  status: "empty" | "needs-approval" | "needs-metadata";
  totalItemCount: number;
  approvalRequiredCount: number;
  metadataRequiredCount: number;
  items: RegulatorySourceApprovalSyncItem[];
  notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only.";
};

export type CreateRegulatorySourceApprovalSyncInput = {
  workspaceId: string;
  queue: RegulatorySourceApprovalSyncQueue;
  createdBy: string;
  createdAt?: string;
};

const RECORD_BOUNDARY = "Not legal advice. Source approval records are audit preparation workflow metadata only." as const;
const QUEUE_BOUNDARY = "Not legal advice. Source update approvals are audit preparation workflow metadata only." as const;
const APPROVAL_GATE =
  "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata." as const;
const UNSAFE_ERROR =
  "Source approval records must not include credentials, private keys, raw KYC, personal data, or legal conclusions.";

export function createRegulatorySourceApprovalSyncResult(
  input: CreateRegulatorySourceApprovalSyncInput
): RegulatorySourceApprovalSyncResult {
  assertSafeSyncText([
    input.workspaceId,
    input.createdBy,
    input.queue?.generatedAt ?? "",
    input.queue?.status ?? "",
    ...(Array.isArray(input.queue?.items) ? input.queue.items.flatMap(createSafeScanFields) : [])
  ]);

  const workspaceId = normalizeRequired(input.workspaceId, "Workspace ID");
  const createdBy = normalizeRequired(input.createdBy, "Created by");
  const createdAt = input.createdAt ?? new Date().toISOString();
  const queue = normalizeQueue(input.queue);
  const queueHash = hashRegulatorySourceApprovalQueue(queue);

  const records = queue.items.map((item) => createRecord({ workspaceId, queueHash, item, createdBy, createdAt }));

  return {
    syncVersion: "lexproof-source-approval-sync-v1",
    workspaceId,
    queueHash,
    syncedCount: records.length,
    records,
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };
}

export function hashRegulatorySourceApprovalQueue(queue: RegulatorySourceApprovalSyncQueue): string {
  return sha256Hex(stableStringify(normalizeQueue(queue)));
}

function createRecord({
  workspaceId,
  queueHash,
  item,
  createdBy,
  createdAt
}: {
  workspaceId: string;
  queueHash: string;
  item: RegulatorySourceApprovalSyncItem;
  createdBy: string;
  createdAt: string;
}): RegulatorySourceApprovalRecord {
  return {
    recordVersion: "lexproof-source-approval-record-v1",
    id: `source-approval-record-${sha256Hex(stableStringify({ workspaceId, queueHash, itemId: item.id })).slice(0, 16)}`,
    workspaceId,
    queueHash,
    sourceApprovalItemId: item.id,
    clauseId: item.clauseId,
    jurisdiction: item.jurisdiction,
    regulator: item.regulator,
    citation: item.citation,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    priority: item.priority,
    approvalStatus: item.approvalStatus,
    reviewStatus: item.reviewStatus,
    effectiveAsOf: item.effectiveAsOf,
    lastReviewedAt: item.lastReviewedAt,
    nextReviewDueAt: item.nextReviewDueAt,
    reviewerNotes: item.reviewerNotes,
    nextAction: item.nextAction,
    approvalGate: APPROVAL_GATE,
    status: "pending-review",
    matchingBehaviorChanged: false,
    createdBy,
    createdAt,
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };
}

function normalizeQueue(queue: RegulatorySourceApprovalSyncQueue): RegulatorySourceApprovalSyncQueue {
  if (!queue || queue.queueVersion !== "lexproof-regulatory-source-approval-queue-v1") {
    throw new Error("Source approval queue must use lexproof-regulatory-source-approval-queue-v1.");
  }

  if (queue.notLegalAdviceBoundary !== QUEUE_BOUNDARY) {
    throw new Error("Source approval queue is missing the required Not legal advice boundary.");
  }

  const items = Array.isArray(queue.items) ? queue.items.map(normalizeItem) : [];

  return {
    queueVersion: "lexproof-regulatory-source-approval-queue-v1",
    generatedAt: normalizeRequired(queue.generatedAt, "Queue generated at"),
    status: normalizeQueueStatus(queue.status),
    totalItemCount: Number(queue.totalItemCount),
    approvalRequiredCount: Number(queue.approvalRequiredCount),
    metadataRequiredCount: Number(queue.metadataRequiredCount),
    items,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

function normalizeItem(item: RegulatorySourceApprovalSyncItem): RegulatorySourceApprovalSyncItem {
  if (!item || item.notLegalAdviceBoundary !== QUEUE_BOUNDARY) {
    throw new Error("Source approval item is missing the required Not legal advice boundary.");
  }

  if (item.approvalGate !== APPROVAL_GATE) {
    throw new Error("Source approval item is missing the required matching behavior gate.");
  }

  return {
    id: safeText(item.id),
    priority: normalizePriority(item.priority),
    approvalStatus: normalizeApprovalStatus(item.approvalStatus),
    reviewStatus: normalizeReviewStatus(item.reviewStatus),
    clauseId: safeText(item.clauseId),
    jurisdiction: safeText(item.jurisdiction),
    regulator: safeText(item.regulator),
    citation: safeText(item.citation),
    sourceName: safeText(item.sourceName),
    sourceUrl: safeText(item.sourceUrl),
    effectiveAsOf: safeText(item.effectiveAsOf),
    lastReviewedAt: safeText(item.lastReviewedAt),
    nextReviewDueAt: safeText(item.nextReviewDueAt),
    reviewerNotes: safeText(item.reviewerNotes),
    nextAction: safeText(item.nextAction),
    approvalGate: APPROVAL_GATE,
    notLegalAdviceBoundary: QUEUE_BOUNDARY
  };
}

function createSafeScanFields(item: RegulatorySourceApprovalSyncItem): string[] {
  return [
    item.id,
    item.clauseId,
    item.jurisdiction,
    item.regulator,
    item.citation,
    item.sourceName,
    item.sourceUrl,
    item.reviewerNotes,
    item.nextAction
  ];
}

function assertSafeSyncText(fields: string[]): void {
  const text = fields.join(" ");
  const findings = classifyDataBoundaryText(text);
  const hasBlockedClass = findings.some((finding) =>
    ["credential-material", "private-key-material", "raw-kyc", "personal-data"].includes(finding.dataClass)
  );

  if (hasBlockedClass || requestsLegalConclusion(text)) {
    throw new Error(UNSAFE_ERROR);
  }
}

function requestsLegalConclusion(text: string): boolean {
  return /\b(compliant|non-compliant|legal conclusion|launch approval|final legal decision|determine legality)\b/i.test(text);
}

function safeText(value: string): string {
  return redactClassifiedText(String(value ?? "").replace(/\s+/g, " ").trim());
}

function normalizeRequired(value: string, label: string): string {
  const normalized = safeText(value);
  if (!normalized) {
    throw new Error(`${label} is required for source approval sync.`);
  }
  return normalized;
}

function normalizeQueueStatus(value: RegulatorySourceApprovalSyncQueue["status"]): RegulatorySourceApprovalSyncQueue["status"] {
  if (value === "empty" || value === "needs-approval" || value === "needs-metadata") {
    return value;
  }
  throw new Error("Source approval queue status is invalid.");
}

function normalizePriority(value: RegulatorySourceApprovalSyncItem["priority"]): RegulatorySourceApprovalSyncItem["priority"] {
  if (value === "P0" || value === "P1") {
    return value;
  }
  throw new Error("Source approval priority is invalid.");
}

function normalizeApprovalStatus(
  value: RegulatorySourceApprovalSyncItem["approvalStatus"]
): RegulatorySourceApprovalSyncItem["approvalStatus"] {
  if (value === "approval-required" || value === "metadata-required") {
    return value;
  }
  throw new Error("Source approval status is invalid.");
}

function normalizeReviewStatus(
  value: RegulatorySourceApprovalSyncItem["reviewStatus"]
): RegulatorySourceApprovalSyncItem["reviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw new Error("Source review status is invalid.");
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

function sha256Hex(payload: string): string {
  const bytes = new TextEncoder().encode(payload);
  const words = createSha256Words(bytes);
  return words.map((word) => word.toString(16).padStart(8, "0")).join("");
}

function createSha256Words(bytes: Uint8Array): number[] {
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const length = bytes.length;
  const paddedLength = Math.ceil((length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[length] = 0x80;
  const bitLength = length * 8;
  const dataView = new DataView(padded.buffer);
  dataView.setUint32(paddedLength - 4, bitLength, false);

  for (let chunk = 0; chunk < paddedLength; chunk += 64) {
    const words = new Array<number>(64).fill(0);
    for (let index = 0; index < 16; index += 1) {
      words[index] = dataView.getUint32(chunk + index * 4, false);
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = add32(words[index - 16], s0, words[index - 7], s1);
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = add32(h, s1, choice, constants[index], words[index]);
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = add32(s0, majority);
      h = g;
      g = f;
      f = e;
      e = add32(d, temp1);
      d = c;
      c = b;
      b = a;
      a = add32(temp1, temp2);
    }

    hash[0] = add32(hash[0], a);
    hash[1] = add32(hash[1], b);
    hash[2] = add32(hash[2], c);
    hash[3] = add32(hash[3], d);
    hash[4] = add32(hash[4], e);
    hash[5] = add32(hash[5], f);
    hash[6] = add32(hash[6], g);
    hash[7] = add32(hash[7], h);
  }

  return hash;
}

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function add32(...values: number[]): number {
  return values.reduce((sum, value) => (sum + value) >>> 0, 0);
}
