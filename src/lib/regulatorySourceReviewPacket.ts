import type {
  RegulatorySourceReview,
  RegulatorySourceReviewAction,
  RegulatorySourceReviewItem,
  RegulatorySourceReviewStatus
} from "./regulatorySourceReview";

export type RegulatorySourceReviewPacketAction = {
  id: string;
  priority: RegulatorySourceReviewAction["priority"];
  targetType: "clause-match";
  targetId: string;
  clauseId: string;
  sourceUrl: string;
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Source review packet actions are audit preparation workflow metadata only.";
};

export type RegulatorySourceReviewPacketRecord = {
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  reviewStatus: RegulatorySourceReviewStatus;
  reviewerNotes: string;
};

export type RegulatorySourceReviewPacket = {
  packetVersion: "lexproof-regulatory-source-review-packet-v1";
  projectId: string;
  projectName: string;
  generatedAt: string;
  status: RegulatorySourceReviewStatus;
  packetHash: string;
  summary: {
    totalSourceCount: number;
    currentSourceCount: number;
    reviewDueCount: number;
    metadataMissingCount: number;
    actionCount: number;
    reviewWindowDays: number;
  };
  actions: RegulatorySourceReviewPacketAction[];
  sourceRecords: RegulatorySourceReviewPacketRecord[];
  notLegalAdviceBoundary: "Not legal advice. Source review packets are audit preparation workflow metadata only.";
};

export type CreateRegulatorySourceReviewPacketInput = {
  projectId: string;
  projectName: string;
  sourceReview: RegulatorySourceReview;
  generatedAt?: string;
};

const PACKET_BOUNDARY = "Not legal advice. Source review packets are audit preparation workflow metadata only." as const;
const ACTION_BOUNDARY = "Not legal advice. Source review packet actions are audit preparation workflow metadata only." as const;

export async function createRegulatorySourceReviewPacket({
  projectId,
  projectName,
  sourceReview,
  generatedAt
}: CreateRegulatorySourceReviewPacketInput): Promise<RegulatorySourceReviewPacket> {
  const actions = sourceReview.actions.map(createPacketAction).sort(compareActions);
  const sourceRecords = sourceReview.items.map(createPacketRecord).sort(compareSourceRecords);
  const summary = {
    totalSourceCount: sourceReview.totalSourceCount,
    currentSourceCount: sourceReview.currentSourceCount,
    reviewDueCount: sourceReview.reviewDueCount,
    metadataMissingCount: sourceReview.metadataMissingCount,
    actionCount: actions.length,
    reviewWindowDays: sourceReview.reviewWindowDays
  };
  const hashPayload = {
    packetVersion: "lexproof-regulatory-source-review-packet-v1",
    projectId,
    projectName,
    status: sourceReview.status,
    summary,
    actions,
    sourceRecords,
    notLegalAdviceBoundary: PACKET_BOUNDARY
  };

  return {
    packetVersion: "lexproof-regulatory-source-review-packet-v1",
    projectId,
    projectName,
    generatedAt: generatedAt ?? new Date().toISOString(),
    status: sourceReview.status,
    packetHash: await sha256Hex(stableStringify(hashPayload)),
    summary,
    actions,
    sourceRecords,
    notLegalAdviceBoundary: PACKET_BOUNDARY
  };
}

export function exportRegulatorySourceReviewPacketJson(packet: RegulatorySourceReviewPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

export function downloadRegulatorySourceReviewPacketJson(filename: string, packet: RegulatorySourceReviewPacket): void {
  const blob = new Blob([exportRegulatorySourceReviewPacketJson(packet)], { type: "application/json;charset=utf-8" });
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

function createPacketAction(action: RegulatorySourceReviewAction): RegulatorySourceReviewPacketAction {
  return {
    id: action.id,
    priority: action.priority,
    targetType: "clause-match",
    targetId: action.clauseId,
    clauseId: action.clauseId,
    sourceUrl: action.sourceUrl,
    nextAction: action.action,
    notLegalAdviceBoundary: ACTION_BOUNDARY
  };
}

function createPacketRecord(item: RegulatorySourceReviewItem): RegulatorySourceReviewPacketRecord {
  return {
    clauseId: item.clauseId,
    jurisdiction: item.jurisdiction,
    regulator: item.regulator,
    citation: item.citation,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    effectiveAsOf: item.effectiveAsOf,
    lastReviewedAt: item.lastReviewedAt,
    nextReviewDueAt: item.nextReviewDueAt,
    reviewStatus: item.reviewStatus,
    reviewerNotes: item.reviewerNotes
  };
}

function compareActions(left: RegulatorySourceReviewPacketAction, right: RegulatorySourceReviewPacketAction): number {
  return `${left.priority}-${left.clauseId}-${left.nextAction}`.localeCompare(`${right.priority}-${right.clauseId}-${right.nextAction}`);
}

function compareSourceRecords(left: RegulatorySourceReviewPacketRecord, right: RegulatorySourceReviewPacketRecord): number {
  return `${left.reviewStatus}-${left.jurisdiction}-${left.citation}-${left.clauseId}`.localeCompare(
    `${right.reviewStatus}-${right.jurisdiction}-${right.citation}-${right.clauseId}`
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
