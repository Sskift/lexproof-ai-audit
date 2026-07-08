import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification.js";
import type { RegulatorySourceReviewRecord, RegulatorySourceReviewSyncResult } from "./phase2Types.js";

export type RegulatorySourceReviewSyncStatus = "current" | "review-due" | "metadata-missing";

export type RegulatorySourceReviewSyncItem = {
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  reviewStatus: RegulatorySourceReviewSyncStatus;
  reviewerNotes: string;
};

export type RegulatorySourceReviewSyncAction = {
  id: string;
  priority: "P0" | "P1";
  action: string;
  clauseId: string;
  sourceUrl: string;
};

export type RegulatorySourceReviewSyncLedger = {
  status: RegulatorySourceReviewSyncStatus;
  totalSourceCount: number;
  currentSourceCount: number;
  reviewDueCount: number;
  metadataMissingCount: number;
  reviewWindowDays: number;
  items: RegulatorySourceReviewSyncItem[];
  actions: RegulatorySourceReviewSyncAction[];
  notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only.";
};

export type ServerRegulatorySourceReviewPacketStatus = "empty" | "ready" | "needs-review" | "metadata-needed";

export type ServerRegulatorySourceReviewPacketRecord = {
  recordId: string;
  ledgerHash: string;
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  reviewStatus: RegulatorySourceReviewRecord["reviewStatus"];
  priority: RegulatorySourceReviewRecord["priority"];
  effectiveAsOf: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  nextAction: string;
  status: RegulatorySourceReviewRecord["status"];
  reviewerNotesHash: string;
  recordHash: string;
  matchingBehaviorChanged: false;
  notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only.";
};

export type ServerRegulatorySourceReviewPacket = {
  packetVersion: "lexproof-server-source-review-packet-v1";
  workspaceId: string;
  generatedAt: string;
  status: ServerRegulatorySourceReviewPacketStatus;
  recordCount: number;
  ledgerHashes: string[];
  statusCounts: {
    current: number;
    pendingReview: number;
    metadataNeeded: number;
  };
  reviewStatusCounts: {
    current: number;
    reviewDue: number;
    metadataMissing: number;
  };
  priorityCounts: {
    P0: number;
    P1: number;
    P2: number;
  };
  matchingBehaviorChanged: false;
  records: ServerRegulatorySourceReviewPacketRecord[];
  nextActions: string[];
  packetHash: string;
  notLegalAdviceBoundary: "Not legal advice. Server Source Review packets are audit preparation lineage metadata only.";
};

export type CreateServerRegulatorySourceReviewPacketInput = {
  workspaceId: string;
  records: RegulatorySourceReviewRecord[];
  generatedAt?: string;
};

export type CreateRegulatorySourceReviewSyncInput = {
  workspaceId: string;
  sourceReview: RegulatorySourceReviewSyncLedger;
  createdBy: string;
  createdAt?: string;
};

const SOURCE_REVIEW_BOUNDARY = "Not legal advice. Source review metadata is audit preparation lineage only." as const;
const RECORD_BOUNDARY = "Not legal advice. Source review records are audit preparation lineage metadata only." as const;
const SERVER_PACKET_BOUNDARY = "Not legal advice. Server Source Review packets are audit preparation lineage metadata only." as const;
const UNSAFE_ERROR =
  "Source review records must not include credentials, private keys, raw KYC, personal data, or legal conclusions.";

export function createRegulatorySourceReviewSyncResult(
  input: CreateRegulatorySourceReviewSyncInput
): RegulatorySourceReviewSyncResult {
  assertSafeSyncText([
    input.workspaceId,
    input.createdBy,
    input.sourceReview?.status ?? "",
    ...(Array.isArray(input.sourceReview?.items) ? input.sourceReview.items.flatMap(createItemSafeScanFields) : []),
    ...(Array.isArray(input.sourceReview?.actions) ? input.sourceReview.actions.flatMap(createActionSafeScanFields) : [])
  ]);

  const workspaceId = normalizeRequired(input.workspaceId, "Workspace ID");
  const createdBy = normalizeRequired(input.createdBy, "Created by");
  const createdAt = input.createdAt ?? new Date().toISOString();
  const sourceReview = normalizeSourceReview(input.sourceReview);
  const ledgerHash = hashRegulatorySourceReviewLedger(sourceReview);
  const actionsByClauseId = new Map(sourceReview.actions.map((action) => [action.clauseId, action]));

  const records = sourceReview.items.map((item) =>
    createRecord({
      workspaceId,
      ledgerHash,
      item,
      action: actionsByClauseId.get(item.clauseId),
      createdBy,
      createdAt
    })
  );

  return {
    syncVersion: "lexproof-source-review-sync-v1",
    workspaceId,
    ledgerHash,
    syncedCount: records.length,
    records,
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };
}

export function hashRegulatorySourceReviewLedger(sourceReview: RegulatorySourceReviewSyncLedger): string {
  return sha256Hex(stableStringify(normalizeSourceReview(sourceReview)));
}

export function createServerRegulatorySourceReviewPacket(
  input: CreateServerRegulatorySourceReviewPacketInput
): ServerRegulatorySourceReviewPacket {
  const workspaceId = normalizeRequired(input.workspaceId, "Workspace ID");
  const records = sortSourceReviewRecords(input.records).map(createServerPacketRecord);
  const statusCounts = {
    current: records.filter((record) => record.status === "current").length,
    pendingReview: records.filter((record) => record.status === "pending-review").length,
    metadataNeeded: records.filter((record) => record.status === "metadata-needed").length
  };
  const reviewStatusCounts = {
    current: records.filter((record) => record.reviewStatus === "current").length,
    reviewDue: records.filter((record) => record.reviewStatus === "review-due").length,
    metadataMissing: records.filter((record) => record.reviewStatus === "metadata-missing").length
  };
  const priorityCounts = {
    P0: records.filter((record) => record.priority === "P0").length,
    P1: records.filter((record) => record.priority === "P1").length,
    P2: records.filter((record) => record.priority === "P2").length
  };
  const status = selectServerPacketStatus(records.length, statusCounts);
  const nextActions = createServerPacketNextActions(status);
  const hashPayload = {
    packetVersion: "lexproof-server-source-review-packet-v1" as const,
    workspaceId,
    status,
    recordCount: records.length,
    ledgerHashes: uniqueSorted(records.map((record) => record.ledgerHash)),
    statusCounts,
    reviewStatusCounts,
    priorityCounts,
    matchingBehaviorChanged: false as const,
    records,
    nextActions,
    notLegalAdviceBoundary: SERVER_PACKET_BOUNDARY
  };

  return {
    ...hashPayload,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    packetHash: sha256Hex(stableStringify(hashPayload))
  };
}

function createRecord({
  workspaceId,
  ledgerHash,
  item,
  action,
  createdBy,
  createdAt
}: {
  workspaceId: string;
  ledgerHash: string;
  item: RegulatorySourceReviewSyncItem;
  action?: RegulatorySourceReviewSyncAction;
  createdBy: string;
  createdAt: string;
}): RegulatorySourceReviewRecord {
  return {
    recordVersion: "lexproof-source-review-record-v1",
    id: `source-review-record-${sha256Hex(stableStringify({ workspaceId, ledgerHash, clauseId: item.clauseId })).slice(0, 16)}`,
    workspaceId,
    ledgerHash,
    sourceReviewItemId: `source-review-${item.clauseId}`,
    clauseId: item.clauseId,
    jurisdiction: item.jurisdiction,
    regulator: item.regulator,
    citation: item.citation,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    reviewStatus: item.reviewStatus,
    priority: action?.priority ?? "P2",
    effectiveAsOf: item.effectiveAsOf,
    lastReviewedAt: item.lastReviewedAt,
    nextReviewDueAt: item.nextReviewDueAt,
    reviewerNotes: item.reviewerNotes,
    nextAction: action?.action ?? "No source refresh action is open; keep source metadata on the review cadence.",
    status: item.reviewStatus === "metadata-missing" ? "metadata-needed" : item.reviewStatus === "review-due" ? "pending-review" : "current",
    matchingBehaviorChanged: false,
    createdBy,
    createdAt,
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };
}

function createServerPacketRecord(record: RegulatorySourceReviewRecord): ServerRegulatorySourceReviewPacketRecord {
  const payload = {
    recordId: safeText(record.id),
    ledgerHash: preserveSha256(record.ledgerHash),
    clauseId: safeText(record.clauseId),
    jurisdiction: safeText(record.jurisdiction),
    regulator: safeText(record.regulator),
    citation: safeText(record.citation),
    sourceName: safeText(record.sourceName),
    sourceUrl: safeText(record.sourceUrl),
    reviewStatus: normalizeReviewStatus(record.reviewStatus),
    priority: normalizePriority(record.priority),
    effectiveAsOf: safeText(record.effectiveAsOf),
    lastReviewedAt: safeText(record.lastReviewedAt),
    nextReviewDueAt: safeText(record.nextReviewDueAt),
    nextAction: safeText(record.nextAction),
    status: normalizeRecordStatus(record.status),
    reviewerNotesHash: sha256Hex(safeText(record.reviewerNotes)),
    matchingBehaviorChanged: false as const,
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };

  return {
    ...payload,
    recordHash: sha256Hex(stableStringify(payload))
  };
}

function normalizeSourceReview(sourceReview: RegulatorySourceReviewSyncLedger): RegulatorySourceReviewSyncLedger {
  if (!sourceReview || sourceReview.notLegalAdviceBoundary !== SOURCE_REVIEW_BOUNDARY) {
    throw new Error("Source review ledger is missing the required Not legal advice boundary.");
  }

  if (!Array.isArray(sourceReview.items)) {
    throw new Error("Source review items must be an array.");
  }

  if (!Array.isArray(sourceReview.actions)) {
    throw new Error("Source review actions must be an array.");
  }

  const items = sourceReview.items.map(normalizeItem).sort(compareItems);
  const actions = sourceReview.actions.map(normalizeAction).sort(compareActions);
  const totalSourceCount = normalizeCount(sourceReview.totalSourceCount, "total source count");
  const currentSourceCount = normalizeCount(sourceReview.currentSourceCount, "current source count");
  const reviewDueCount = normalizeCount(sourceReview.reviewDueCount, "review due count");
  const metadataMissingCount = normalizeCount(sourceReview.metadataMissingCount, "metadata missing count");
  assertSourceReviewCounts({ totalSourceCount, currentSourceCount, reviewDueCount, metadataMissingCount, items });

  return {
    status: normalizeReviewStatus(sourceReview.status),
    totalSourceCount,
    currentSourceCount,
    reviewDueCount,
    metadataMissingCount,
    reviewWindowDays: normalizeCount(sourceReview.reviewWindowDays, "review window days"),
    items,
    actions,
    notLegalAdviceBoundary: SOURCE_REVIEW_BOUNDARY
  };
}

function assertSourceReviewCounts({
  totalSourceCount,
  currentSourceCount,
  reviewDueCount,
  metadataMissingCount,
  items
}: {
  totalSourceCount: number;
  currentSourceCount: number;
  reviewDueCount: number;
  metadataMissingCount: number;
  items: RegulatorySourceReviewSyncItem[];
}): void {
  const actualCurrentCount = items.filter((item) => item.reviewStatus === "current").length;
  const actualReviewDueCount = items.filter((item) => item.reviewStatus === "review-due").length;
  const actualMetadataMissingCount = items.filter((item) => item.reviewStatus === "metadata-missing").length;

  if (
    totalSourceCount !== items.length ||
    currentSourceCount !== actualCurrentCount ||
    reviewDueCount !== actualReviewDueCount ||
    metadataMissingCount !== actualMetadataMissingCount
  ) {
    throw new Error("Source review counts must match the review item statuses.");
  }
}

function normalizeItem(item: RegulatorySourceReviewSyncItem): RegulatorySourceReviewSyncItem {
  return {
    clauseId: safeText(item.clauseId),
    jurisdiction: safeText(item.jurisdiction),
    regulator: safeText(item.regulator),
    citation: safeText(item.citation),
    sourceName: safeText(item.sourceName),
    sourceUrl: safeText(item.sourceUrl),
    effectiveAsOf: safeText(item.effectiveAsOf),
    lastReviewedAt: safeText(item.lastReviewedAt),
    nextReviewDueAt: safeText(item.nextReviewDueAt),
    reviewStatus: normalizeReviewStatus(item.reviewStatus),
    reviewerNotes: safeText(item.reviewerNotes)
  };
}

function normalizeAction(action: RegulatorySourceReviewSyncAction): RegulatorySourceReviewSyncAction {
  return {
    id: safeText(action.id),
    priority: normalizeActionPriority(action.priority),
    action: safeText(action.action),
    clauseId: safeText(action.clauseId),
    sourceUrl: safeText(action.sourceUrl)
  };
}

function createItemSafeScanFields(item: RegulatorySourceReviewSyncItem): string[] {
  return [
    item.clauseId,
    item.jurisdiction,
    item.regulator,
    item.citation,
    item.sourceName,
    item.sourceUrl,
    item.effectiveAsOf,
    item.lastReviewedAt,
    item.nextReviewDueAt,
    item.reviewerNotes
  ];
}

function createActionSafeScanFields(action: RegulatorySourceReviewSyncAction): string[] {
  return [action.id, action.action, action.clauseId, action.sourceUrl];
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
  return /\b(compliant|non-compliant|legal conclusion|launch approval|final legal decision|determine legality|decide compliance)\b/i.test(text);
}

function safeText(value: string): string {
  return redactClassifiedText(String(value ?? "").replace(/\s+/g, " ").trim());
}

function preserveSha256(value: string): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : safeText(normalized);
}

function normalizeRequired(value: string, label: string): string {
  const normalized = safeText(value);
  if (!normalized) {
    throw new Error(`${label} is required for source review sync.`);
  }
  return normalized;
}

function normalizeCount(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  throw new Error(`Source review ${label} is invalid.`);
}

function normalizeReviewStatus(value: RegulatorySourceReviewSyncStatus): RegulatorySourceReviewSyncStatus {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw new Error("Source review status is invalid.");
}

function normalizePriority(value: RegulatorySourceReviewRecord["priority"]): RegulatorySourceReviewRecord["priority"] {
  if (value === "P0" || value === "P1" || value === "P2") {
    return value;
  }
  throw new Error("Source review priority is invalid.");
}

function normalizeRecordStatus(value: RegulatorySourceReviewRecord["status"]): RegulatorySourceReviewRecord["status"] {
  if (value === "current" || value === "pending-review" || value === "metadata-needed") {
    return value;
  }
  throw new Error("Source review record status is invalid.");
}

function normalizeActionPriority(value: RegulatorySourceReviewSyncAction["priority"]): RegulatorySourceReviewSyncAction["priority"] {
  if (value === "P0" || value === "P1") {
    return value;
  }
  throw new Error("Source review action priority is invalid.");
}

function compareItems(left: RegulatorySourceReviewSyncItem, right: RegulatorySourceReviewSyncItem): number {
  return `${left.clauseId}-${left.jurisdiction}`.localeCompare(`${right.clauseId}-${right.jurisdiction}`);
}

function compareActions(left: RegulatorySourceReviewSyncAction, right: RegulatorySourceReviewSyncAction): number {
  return `${left.clauseId}-${left.id}`.localeCompare(`${right.clauseId}-${right.id}`);
}

function sortSourceReviewRecords(records: RegulatorySourceReviewRecord[]): RegulatorySourceReviewRecord[] {
  return [...records].sort(
    (left, right) =>
      left.ledgerHash.localeCompare(right.ledgerHash) ||
      left.clauseId.localeCompare(right.clauseId) ||
      left.id.localeCompare(right.id)
  );
}

function selectServerPacketStatus(
  recordCount: number,
  counts: ServerRegulatorySourceReviewPacket["statusCounts"]
): ServerRegulatorySourceReviewPacketStatus {
  if (recordCount === 0) {
    return "empty";
  }

  if (counts.metadataNeeded > 0) {
    return "metadata-needed";
  }

  if (counts.pendingReview > 0) {
    return "needs-review";
  }

  return "ready";
}

function createServerPacketNextActions(status: ServerRegulatorySourceReviewPacketStatus): string[] {
  if (status === "empty") {
    return ["Sync Source Review Ledger metadata before counsel handoff."];
  }

  if (status === "metadata-needed") {
    return ["Fill missing source metadata, then sync the Source Review Ledger before final handoff."];
  }

  if (status === "needs-review") {
    return ["Refresh due source metadata with counsel or compliance review before final handoff."];
  }

  return ["Keep the server Source Review packet with the Counsel Pack handoff and preserve matching behavior controls."];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((left, right) => left.localeCompare(right));
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
