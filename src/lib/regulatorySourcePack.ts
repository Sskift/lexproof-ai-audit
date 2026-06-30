import type {
  JurisdictionRegulatorySummary,
  MatchedRegulatoryClause,
  RegulatoryEvidenceGap,
  RegulatoryEvidenceRequestStatus,
  RegulatoryGraph
} from "./regulatoryGraph";
import type { RegulatorySourceReview, RegulatorySourceReviewAction, RegulatorySourceReviewItem } from "./regulatorySourceReview";

export type RegulatorySourcePackClause = {
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  sourceName: string;
  sourceUrl: string;
  citation: string;
  topic: MatchedRegulatoryClause["topic"];
  summary: string;
  coverageStatus: MatchedRegulatoryClause["coverageStatus"];
  coveredEvidenceCount: number;
  totalEvidenceRequestCount: number;
  matchedFlagIds: string[];
  matchedTriggerTerms: string[];
  matchedEvidenceLabels: string[];
  evidenceRequests: RegulatoryEvidenceRequestStatus[];
  counselQuestions: string[];
  localCounselRole: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  reviewerNotes: string;
  notLegalAdviceBoundary: MatchedRegulatoryClause["notLegalAdviceBoundary"];
};

export type RegulatorySourcePackReview = {
  status: RegulatorySourceReview["status"];
  totalSourceCount: number;
  currentSourceCount: number;
  reviewDueCount: number;
  metadataMissingCount: number;
  reviewWindowDays: number;
  items: RegulatorySourceReviewItem[];
  actions: RegulatorySourceReviewAction[];
  notLegalAdviceBoundary: RegulatorySourceReview["notLegalAdviceBoundary"];
};

export type RegulatorySourcePack = {
  packVersion: "lexproof-regulatory-source-pack-v1";
  projectId: string;
  generatedAt: string;
  sourceCount: number;
  evidenceGapCount: number;
  jurisdictionSummaries: JurisdictionRegulatorySummary[];
  clauses: RegulatorySourcePackClause[];
  evidenceGaps: RegulatoryEvidenceGap[];
  sourceReview: RegulatorySourcePackReview;
  packHash: string;
  notLegalAdviceBoundary: "Not legal advice. Regulatory source packs are audit preparation materials only.";
};

export type CreateRegulatorySourcePackInput = {
  graph: RegulatoryGraph;
  sourceReview: RegulatorySourceReview;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Regulatory source packs are audit preparation materials only.";

export async function createRegulatorySourcePack({
  graph,
  sourceReview,
  generatedAt
}: CreateRegulatorySourcePackInput): Promise<RegulatorySourcePack> {
  const clauses = graph.matchedClauses.map(createClausePackItem).sort(compareClauses);
  const evidenceGaps = [...graph.evidenceGaps].sort(compareEvidenceGaps);
  const jurisdictionSummaries = [...graph.jurisdictionSummaries].sort((left, right) =>
    left.jurisdiction.localeCompare(right.jurisdiction)
  );
  const review = createSourceReviewPack(sourceReview);
  const hashPayload = {
    packVersion: "lexproof-regulatory-source-pack-v1",
    projectId: graph.projectId,
    sourceCount: clauses.length,
    evidenceGapCount: evidenceGaps.length,
    jurisdictionSummaries,
    clauses,
    evidenceGaps,
    sourceReview: review,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };

  return {
    packVersion: "lexproof-regulatory-source-pack-v1",
    projectId: graph.projectId,
    generatedAt: generatedAt ?? new Date().toISOString(),
    sourceCount: clauses.length,
    evidenceGapCount: evidenceGaps.length,
    jurisdictionSummaries,
    clauses,
    evidenceGaps,
    sourceReview: review,
    packHash: await sha256Hex(stableStringify(hashPayload)),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportRegulatorySourcePackJson(pack: RegulatorySourcePack): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

export function downloadRegulatorySourcePackJson(filename: string, pack: RegulatorySourcePack): void {
  const blob = new Blob([exportRegulatorySourcePackJson(pack)], { type: "application/json;charset=utf-8" });
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

function createClausePackItem(clause: MatchedRegulatoryClause): RegulatorySourcePackClause {
  return {
    clauseId: clause.clauseId,
    jurisdiction: clause.jurisdiction,
    regulator: clause.regulator,
    sourceName: clause.sourceName,
    sourceUrl: clause.sourceUrl,
    citation: clause.citation,
    topic: clause.topic,
    summary: clause.summary,
    coverageStatus: clause.coverageStatus,
    coveredEvidenceCount: clause.coveredEvidenceCount,
    totalEvidenceRequestCount: clause.totalEvidenceRequestCount,
    matchedFlagIds: [...clause.matchedFlagIds].sort(),
    matchedTriggerTerms: [...clause.matchedTriggerTerms].sort(),
    matchedEvidenceLabels: [...clause.matchedEvidenceLabels].sort(),
    evidenceRequests: clause.evidenceRequestStatuses.map(createEvidenceRequestPackItem).sort(compareEvidenceRequests),
    counselQuestions: [...clause.counselQuestions],
    localCounselRole: clause.localCounselRole,
    effectiveAsOf: clause.effectiveAsOf,
    lastReviewedAt: clause.lastReviewedAt,
    reviewerNotes: clause.reviewerNotes,
    notLegalAdviceBoundary: clause.notLegalAdviceBoundary
  };
}

function createEvidenceRequestPackItem(request: RegulatoryEvidenceRequestStatus): RegulatoryEvidenceRequestStatus {
  return {
    requestId: request.requestId,
    title: request.title,
    reason: request.reason,
    priority: request.priority,
    status: request.status,
    matchedEvidenceLabels: [...request.matchedEvidenceLabels].sort()
  };
}

function createSourceReviewPack(review: RegulatorySourceReview): RegulatorySourcePackReview {
  return {
    status: review.status,
    totalSourceCount: review.totalSourceCount,
    currentSourceCount: review.currentSourceCount,
    reviewDueCount: review.reviewDueCount,
    metadataMissingCount: review.metadataMissingCount,
    reviewWindowDays: review.reviewWindowDays,
    items: [...review.items].sort(compareSourceReviewItems),
    actions: [...review.actions].sort(compareSourceReviewActions),
    notLegalAdviceBoundary: review.notLegalAdviceBoundary
  };
}

function compareClauses(left: RegulatorySourcePackClause, right: RegulatorySourcePackClause): number {
  return `${left.jurisdiction}-${left.citation}-${left.clauseId}`.localeCompare(
    `${right.jurisdiction}-${right.citation}-${right.clauseId}`
  );
}

function compareEvidenceRequests(
  left: RegulatoryEvidenceRequestStatus,
  right: RegulatoryEvidenceRequestStatus
): number {
  return `${left.priority}-${left.title}-${left.requestId}`.localeCompare(`${right.priority}-${right.title}-${right.requestId}`);
}

function compareEvidenceGaps(left: RegulatoryEvidenceGap, right: RegulatoryEvidenceGap): number {
  return `${left.priority}-${left.jurisdiction}-${left.title}-${left.id}`.localeCompare(
    `${right.priority}-${right.jurisdiction}-${right.title}-${right.id}`
  );
}

function compareSourceReviewItems(left: RegulatorySourceReviewItem, right: RegulatorySourceReviewItem): number {
  return `${left.reviewStatus}-${left.jurisdiction}-${left.citation}-${left.clauseId}`.localeCompare(
    `${right.reviewStatus}-${right.jurisdiction}-${right.citation}-${right.clauseId}`
  );
}

function compareSourceReviewActions(left: RegulatorySourceReviewAction, right: RegulatorySourceReviewAction): number {
  return `${left.priority}-${left.action}-${left.id}`.localeCompare(`${right.priority}-${right.action}-${right.id}`);
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
