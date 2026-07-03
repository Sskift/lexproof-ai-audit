import { redactDataBoundaryText } from "./dataBoundary";
import type { MatchedRegulatoryClause, RegulatoryGraph } from "./regulatoryGraph";
import type { RegulatorySourceReview, RegulatorySourceReviewStatus } from "./regulatorySourceReview";

export type RegulatorySourceCoverageStatus =
  | "no-source-coverage"
  | "ready-for-counsel"
  | "needs-evidence"
  | "needs-source-review"
  | "metadata-missing";

export type RegulatorySourceCoveragePriority = "P0" | "P1" | "P2";

export type RegulatorySourceCoverageJurisdiction = {
  jurisdiction: string;
  status: RegulatorySourceCoverageStatus;
  priority: RegulatorySourceCoveragePriority;
  matchedClauseCount: number;
  sourceCount: number;
  currentSourceCount: number;
  reviewDueCount: number;
  metadataMissingCount: number;
  openEvidenceRequestCount: number;
  coveredEvidenceRequestCount: number;
  totalEvidenceRequestCount: number;
  localCounselRoles: string[];
  nextAction: string;
};

export type RegulatorySourceCoverageAction = {
  id: string;
  jurisdiction: string;
  priority: RegulatorySourceCoveragePriority;
  status: RegulatorySourceCoverageStatus;
  action: string;
};

export type RegulatorySourceCoverageReport = {
  reportVersion: "lexproof-regulatory-source-coverage-v1";
  projectId: string;
  generatedAt: string;
  status: RegulatorySourceCoverageStatus;
  reportHash: string;
  jurisdictionCount: number;
  sourceCount: number;
  currentSourceCount: number;
  reviewDueCount: number;
  metadataMissingCount: number;
  openEvidenceRequestCount: number;
  coveredEvidenceRequestCount: number;
  totalEvidenceRequestCount: number;
  jurisdictions: RegulatorySourceCoverageJurisdiction[];
  actions: RegulatorySourceCoverageAction[];
  notLegalAdviceBoundary: "Not legal advice. Regulatory source coverage is audit preparation metadata only.";
};

export type CreateRegulatorySourceCoverageReportInput = {
  graph: RegulatoryGraph;
  sourceReview: RegulatorySourceReview;
  generatedAt?: string;
};

const REPORT_BOUNDARY = "Not legal advice. Regulatory source coverage is audit preparation metadata only." as const;

export async function createRegulatorySourceCoverageReport({
  graph,
  sourceReview,
  generatedAt = new Date().toISOString()
}: CreateRegulatorySourceCoverageReportInput): Promise<RegulatorySourceCoverageReport> {
  const reviewStatusByClauseId = new Map(sourceReview.items.map((item) => [item.clauseId, item.reviewStatus]));
  const jurisdictions = createJurisdictionRows(graph, reviewStatusByClauseId);
  const counts = summarizeJurisdictions(jurisdictions);
  const status = createReportStatus(jurisdictions);
  const actions = createActions(jurisdictions);
  const hashPayload = {
    reportVersion: "lexproof-regulatory-source-coverage-v1",
    projectId: graph.projectId,
    status,
    jurisdictionCount: jurisdictions.length,
    ...counts,
    jurisdictions,
    actions
  };

  return {
    reportVersion: "lexproof-regulatory-source-coverage-v1",
    projectId: graph.projectId,
    generatedAt,
    status,
    reportHash: await sha256Hex(stableStringify(hashPayload)),
    jurisdictionCount: jurisdictions.length,
    ...counts,
    jurisdictions,
    actions,
    notLegalAdviceBoundary: REPORT_BOUNDARY
  };
}

export function exportRegulatorySourceCoverageJson(report: RegulatorySourceCoverageReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function downloadRegulatorySourceCoverageJson(filename: string, report: RegulatorySourceCoverageReport): void {
  const blob = new Blob([exportRegulatorySourceCoverageJson(report)], { type: "application/json;charset=utf-8" });
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

function createJurisdictionRows(
  graph: RegulatoryGraph,
  reviewStatusByClauseId: Map<string, RegulatorySourceReviewStatus>
): RegulatorySourceCoverageJurisdiction[] {
  const clausesByJurisdiction = new Map<string, MatchedRegulatoryClause[]>();

  for (const clause of graph.matchedClauses) {
    const jurisdiction = sanitize(clause.jurisdiction);
    clausesByJurisdiction.set(jurisdiction, [...(clausesByJurisdiction.get(jurisdiction) ?? []), clause]);
  }

  const jurisdictions = new Set([
    ...graph.jurisdictionSummaries.map((summary) => sanitize(summary.jurisdiction)),
    ...clausesByJurisdiction.keys()
  ]);

  return [...jurisdictions].sort((left, right) => left.localeCompare(right)).map((jurisdiction) => {
    const clauses = clausesByJurisdiction.get(jurisdiction) ?? [];
    const sourceStatuses = clauses.map((clause) => reviewStatusByClauseId.get(clause.clauseId) ?? "metadata-missing");
    const openEvidenceRequestCount = clauses.reduce(
      (sum, clause) => sum + clause.evidenceRequestStatuses.filter((request) => request.status !== "covered").length,
      0
    );
    const coveredEvidenceRequestCount = clauses.reduce(
      (sum, clause) => sum + clause.evidenceRequestStatuses.filter((request) => request.status === "covered").length,
      0
    );
    const totalEvidenceRequestCount = clauses.reduce((sum, clause) => sum + clause.evidenceRequestStatuses.length, 0);
    const metadataMissingCount = sourceStatuses.filter((status) => status === "metadata-missing").length;
    const reviewDueCount = sourceStatuses.filter((status) => status === "review-due").length;
    const currentSourceCount = sourceStatuses.filter((status) => status === "current").length;
    const status = createJurisdictionStatus({ clauses, metadataMissingCount, reviewDueCount, openEvidenceRequestCount });

    return {
      jurisdiction,
      status,
      priority: createPriority(status),
      matchedClauseCount: clauses.length,
      sourceCount: clauses.length,
      currentSourceCount,
      reviewDueCount,
      metadataMissingCount,
      openEvidenceRequestCount,
      coveredEvidenceRequestCount,
      totalEvidenceRequestCount,
      localCounselRoles: unique(clauses.map((clause) => sanitize(clause.localCounselRole)).filter(Boolean)),
      nextAction: createNextAction(jurisdiction, status),
    };
  });
}

function createJurisdictionStatus(input: {
  clauses: MatchedRegulatoryClause[];
  metadataMissingCount: number;
  reviewDueCount: number;
  openEvidenceRequestCount: number;
}): RegulatorySourceCoverageStatus {
  if (input.clauses.length === 0) {
    return "no-source-coverage";
  }
  if (input.metadataMissingCount > 0) {
    return "metadata-missing";
  }
  if (input.reviewDueCount > 0) {
    return "needs-source-review";
  }
  if (input.openEvidenceRequestCount > 0) {
    return "needs-evidence";
  }
  return "ready-for-counsel";
}

function createReportStatus(jurisdictions: RegulatorySourceCoverageJurisdiction[]): RegulatorySourceCoverageStatus {
  if (jurisdictions.length === 0 || jurisdictions.every((item) => item.status === "no-source-coverage")) {
    return "no-source-coverage";
  }
  const priorityOrder: RegulatorySourceCoverageStatus[] = [
    "metadata-missing",
    "needs-source-review",
    "needs-evidence",
    "no-source-coverage",
    "ready-for-counsel"
  ];
  return [...jurisdictions].sort(
    (left, right) => priorityOrder.indexOf(left.status) - priorityOrder.indexOf(right.status)
  )[0].status;
}

function createPriority(status: RegulatorySourceCoverageStatus): RegulatorySourceCoveragePriority {
  if (status === "metadata-missing" || status === "no-source-coverage") {
    return "P0";
  }
  if (status === "needs-source-review" || status === "needs-evidence") {
    return "P1";
  }
  return "P2";
}

function createNextAction(jurisdiction: string, status: RegulatorySourceCoverageStatus): string {
  if (status === "no-source-coverage") {
    return `Add source-backed regulatory controls or narrow ${jurisdiction} from the project facts before counsel handoff.`;
  }
  if (status === "metadata-missing") {
    return `Complete source URL, citation, effective date, and reviewer metadata for ${jurisdiction}.`;
  }
  if (status === "needs-source-review") {
    return `Refresh due source-review metadata for ${jurisdiction} before relying on the source pack.`;
  }
  if (status === "needs-evidence") {
    return `Prepare open source-linked evidence requests for ${jurisdiction} before counsel review.`;
  }
  return `Route ${jurisdiction} source coverage and evidence metadata to local counsel review.`;
}

function createActions(jurisdictions: RegulatorySourceCoverageJurisdiction[]): RegulatorySourceCoverageAction[] {
  return jurisdictions
    .filter((item) => item.status !== "ready-for-counsel")
    .sort(compareJurisdictions)
    .slice(0, 6)
    .map((item) => ({
      id: `reg-source-coverage-${slugify(item.jurisdiction)}`,
      jurisdiction: item.jurisdiction,
      priority: item.priority,
      status: item.status,
      action: item.nextAction
    }));
}

function compareJurisdictions(left: RegulatorySourceCoverageJurisdiction, right: RegulatorySourceCoverageJurisdiction): number {
  const priority = priorityWeight(left.priority) - priorityWeight(right.priority);
  if (priority !== 0) {
    return priority;
  }
  const blockers =
    right.metadataMissingCount +
    right.reviewDueCount +
    right.openEvidenceRequestCount -
    (left.metadataMissingCount + left.reviewDueCount + left.openEvidenceRequestCount);
  if (blockers !== 0) {
    return blockers;
  }
  return left.jurisdiction.localeCompare(right.jurisdiction);
}

function summarizeJurisdictions(jurisdictions: RegulatorySourceCoverageJurisdiction[]) {
  return {
    sourceCount: sum(jurisdictions, (item) => item.sourceCount),
    currentSourceCount: sum(jurisdictions, (item) => item.currentSourceCount),
    reviewDueCount: sum(jurisdictions, (item) => item.reviewDueCount),
    metadataMissingCount: sum(jurisdictions, (item) => item.metadataMissingCount),
    openEvidenceRequestCount: sum(jurisdictions, (item) => item.openEvidenceRequestCount),
    coveredEvidenceRequestCount: sum(jurisdictions, (item) => item.coveredEvidenceRequestCount),
    totalEvidenceRequestCount: sum(jurisdictions, (item) => item.totalEvidenceRequestCount)
  };
}

function sum(
  jurisdictions: RegulatorySourceCoverageJurisdiction[],
  pick: (item: RegulatorySourceCoverageJurisdiction) => number
): number {
  return jurisdictions.reduce((total, item) => total + pick(item), 0);
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function priorityWeight(priority: RegulatorySourceCoveragePriority): number {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\bnon-compliant\b|\bcompliant\b/gi, "review-state").replace(/\s+/g, " ").trim());
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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
