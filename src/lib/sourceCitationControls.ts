import type { AuditResult } from "./auditEngine";
import type { MatchedRegulatoryClause, RegulatoryGraph } from "./regulatoryGraph";

export type RiskSourceCitationCoverageStatus = "not-mapped" | "missing" | "partial" | "covered";

export type RiskSourceCitationRequest = {
  clauseId: string;
  requestId: string;
  title: string;
  priority: "P0" | "P1" | "P2";
  status: "missing" | "in-progress";
  jurisdiction: string;
  citation: string;
};

export type RiskSourceCitationReference = {
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  coverageStatus: MatchedRegulatoryClause["coverageStatus"];
  openEvidenceRequestCount: number;
  localCounselRole: string;
  lastReviewedAt: string;
};

export type RiskSourceCitationControl = {
  flagId: string;
  flagTitle: string;
  coverageStatus: RiskSourceCitationCoverageStatus;
  citationCount: number;
  citations: RiskSourceCitationReference[];
  topOpenEvidenceRequests: RiskSourceCitationRequest[];
  localCounselRoutes: string[];
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Source citation controls are audit preparation prompts only.";
};

export function createRiskSourceCitationControls(
  audit: AuditResult,
  graph: RegulatoryGraph
): RiskSourceCitationControl[] {
  return audit.flags.map((flag) => {
    const clauses = graph.matchedClauses
      .filter((clause) => clause.matchedFlagIds.includes(flag.id))
      .sort(compareClauses);
    const openRequests = clauses.flatMap(createOpenRequests).sort(compareOpenRequests);
    const citations = clauses.map((clause) => ({
      clauseId: clause.clauseId,
      jurisdiction: clause.jurisdiction,
      regulator: clause.regulator,
      citation: clause.citation,
      sourceName: clause.sourceName,
      sourceUrl: clause.sourceUrl,
      coverageStatus: clause.coverageStatus,
      openEvidenceRequestCount: clause.evidenceRequestStatuses.filter((request) => request.status !== "covered").length,
      localCounselRole: clause.localCounselRole,
      lastReviewedAt: clause.lastReviewedAt
    }));
    const coverageStatus = summarizeCoverage(clauses);

    return {
      flagId: flag.id,
      flagTitle: flag.title,
      coverageStatus,
      citationCount: citations.length,
      citations,
      topOpenEvidenceRequests: openRequests.slice(0, 3),
      localCounselRoutes: unique(citations.map((citation) => citation.localCounselRole)).sort(),
      nextAction: createNextAction(flag.title, coverageStatus, citations.length, openRequests.length),
      notLegalAdviceBoundary: "Not legal advice. Source citation controls are audit preparation prompts only."
    };
  });
}

function createOpenRequests(clause: MatchedRegulatoryClause): RiskSourceCitationRequest[] {
  return clause.evidenceRequestStatuses
    .filter(isOpenEvidenceRequest)
    .map((request) => ({
      clauseId: clause.clauseId,
      requestId: request.requestId,
      title: request.title,
      priority: request.priority,
      status: request.status,
      jurisdiction: clause.jurisdiction,
      citation: clause.citation
    }));
}

function isOpenEvidenceRequest(
  request: MatchedRegulatoryClause["evidenceRequestStatuses"][number]
): request is MatchedRegulatoryClause["evidenceRequestStatuses"][number] & { status: "missing" | "in-progress" } {
  return request.status !== "covered";
}

function summarizeCoverage(clauses: MatchedRegulatoryClause[]): RiskSourceCitationCoverageStatus {
  if (clauses.length === 0) {
    return "not-mapped";
  }

  if (clauses.every((clause) => clause.coverageStatus === "covered")) {
    return "covered";
  }

  if (clauses.every((clause) => clause.coverageStatus === "missing")) {
    return "missing";
  }

  return "partial";
}

function createNextAction(
  flagTitle: string,
  coverageStatus: RiskSourceCitationCoverageStatus,
  citationCount: number,
  openRequestCount: number
): string {
  if (coverageStatus === "not-mapped") {
    return `No jurisdiction citation controls mapped to ${flagTitle}; review general source references before counsel handoff.`;
  }

  if (coverageStatus === "covered") {
    return `Keep ${citationCount} source citation control${citationCount === 1 ? "" : "s"} attached to ${flagTitle} in the counsel packet.`;
  }

  return `Prepare ${openRequestCount} open source-linked evidence request${openRequestCount === 1 ? "" : "s"} for ${flagTitle} before counsel review.`;
}

function compareClauses(left: MatchedRegulatoryClause, right: MatchedRegulatoryClause): number {
  return `${left.jurisdiction}-${left.citation}-${left.clauseId}`.localeCompare(
    `${right.jurisdiction}-${right.citation}-${right.clauseId}`
  );
}

function compareOpenRequests(left: RiskSourceCitationRequest, right: RiskSourceCitationRequest): number {
  return (
    priorityRank(left.priority) - priorityRank(right.priority) ||
    `${left.jurisdiction}-${left.citation}-${left.title}`.localeCompare(`${right.jurisdiction}-${right.citation}-${right.title}`)
  );
}

function priorityRank(priority: RiskSourceCitationRequest["priority"]): number {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
