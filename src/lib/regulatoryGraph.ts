import { listRegulatoryClauses, type RegulatoryClause, type RegulatoryEvidenceRequest } from "../data/regulatoryClauses";
import type { AuditResult } from "./auditEngine";
import { createJurisdictionPacks } from "./jurisdictionPacks";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type RegulatoryCoverageStatus = "missing" | "partial" | "covered";
export type RegulatoryReadiness = "evidence-gaps" | "partial-evidence" | "ready-for-counsel";

export type RegulatoryEvidenceRequestStatus = {
  requestId: string;
  title: string;
  reason: string;
  priority: "P0" | "P1" | "P2";
  status: "missing" | "in-progress" | "covered";
  matchedEvidenceLabels: string[];
};

export type MatchedRegulatoryClause = {
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  sourceName: string;
  sourceUrl: string;
  citation: string;
  topic: RegulatoryClause["topic"];
  summary: string;
  matchedFlagIds: string[];
  matchedTriggerTerms: string[];
  evidenceRequestStatuses: RegulatoryEvidenceRequestStatus[];
  coverageStatus: RegulatoryCoverageStatus;
  coveredEvidenceCount: number;
  totalEvidenceRequestCount: number;
  matchedEvidenceLabels: string[];
  counselQuestions: string[];
  localCounselRole: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  reviewerNotes: string;
  notLegalAdviceBoundary: RegulatoryClause["notLegalAdviceBoundary"];
};

export type RegulatoryEvidenceGap = {
  id: string;
  clauseId: string;
  jurisdiction: string;
  citation: string;
  title: string;
  reason: string;
  priority: "P0" | "P1" | "P2";
  sourceUrl: string;
};

export type RegulatoryAction = {
  id: string;
  action: string;
  priority: "P0" | "P1" | "P2";
  jurisdiction: string;
  clauseId: string;
};

export type JurisdictionRegulatorySummary = {
  jurisdiction: string;
  matchedClauseCount: number;
  missingEvidenceCount: number;
  coveredEvidenceCount: number;
  readiness: RegulatoryReadiness;
  localCounselRole: string;
};

export type RegulatoryGraph = {
  graphVersion: "lexproof-regulatory-graph-v1";
  projectId: string;
  generatedAt: string;
  matchedClauses: MatchedRegulatoryClause[];
  jurisdictionSummaries: JurisdictionRegulatorySummary[];
  evidenceGaps: RegulatoryEvidenceGap[];
  topActions: RegulatoryAction[];
  notLegalAdviceBoundary: "Not legal advice. Regulatory graph output is audit preparation material only.";
};

export function createRegulatoryGraph(
  project: ProjectProfile,
  audit: AuditResult,
  evidenceItems: EvidenceItem[]
): RegulatoryGraph {
  const projectText = normalizeProjectText(project);
  const activeFlagIds = new Set(audit.flags.map((flag) => flag.id));
  const clauses = listRegulatoryClauses();
  const matchedClauses = clauses
    .filter((clause) => hasJurisdiction(project, clause.jurisdiction))
    .filter((clause) => matchesClause(clause, activeFlagIds, projectText))
    .map((clause) => createMatchedClause(clause, activeFlagIds, projectText, evidenceItems));
  const evidenceGaps = matchedClauses.flatMap(createEvidenceGaps).sort(compareEvidenceGaps);
  const jurisdictionSummaries = createJurisdictionSummaries(project, audit, matchedClauses, evidenceGaps);

  return {
    graphVersion: "lexproof-regulatory-graph-v1",
    projectId: project.id,
    generatedAt: new Date().toISOString(),
    matchedClauses,
    jurisdictionSummaries,
    evidenceGaps,
    topActions: evidenceGaps.slice(0, 6).map((gap) => ({
      id: `action-${gap.id}`,
      action: `Prepare ${gap.title} for counsel review.`,
      priority: gap.priority,
      jurisdiction: gap.jurisdiction,
      clauseId: gap.clauseId
    })),
    notLegalAdviceBoundary: "Not legal advice. Regulatory graph output is audit preparation material only."
  };
}

function createMatchedClause(
  clause: RegulatoryClause,
  activeFlagIds: Set<string>,
  projectText: string,
  evidenceItems: EvidenceItem[]
): MatchedRegulatoryClause {
  const evidenceRequestStatuses = clause.evidenceRequests.map((request) =>
    createEvidenceRequestStatus(clause, request, evidenceItems)
  );
  const coveredEvidenceCount = evidenceRequestStatuses.filter((request) => request.status === "covered").length;
  const totalEvidenceRequestCount = evidenceRequestStatuses.length;
  const matchedEvidenceLabels = unique(evidenceRequestStatuses.flatMap((request) => request.matchedEvidenceLabels));

  return {
    clauseId: clause.id,
    jurisdiction: clause.jurisdiction,
    regulator: clause.regulator,
    sourceName: clause.sourceName,
    sourceUrl: clause.sourceUrl,
    citation: clause.citation,
    topic: clause.topic,
    summary: clause.summary,
    matchedFlagIds: clause.triggerFlagIds.filter((flagId) => activeFlagIds.has(flagId)),
    matchedTriggerTerms: clause.triggerKeywords.filter((keyword) => projectText.includes(keyword.toLowerCase())),
    evidenceRequestStatuses,
    coverageStatus:
      coveredEvidenceCount === totalEvidenceRequestCount && totalEvidenceRequestCount > 0
        ? "covered"
        : coveredEvidenceCount > 0 || evidenceRequestStatuses.some((request) => request.status === "in-progress")
          ? "partial"
          : "missing",
    coveredEvidenceCount,
    totalEvidenceRequestCount,
    matchedEvidenceLabels,
    counselQuestions: clause.counselQuestions,
    localCounselRole: clause.localCounselRole,
    effectiveAsOf: clause.effectiveAsOf,
    lastReviewedAt: clause.lastReviewedAt,
    reviewerNotes: clause.reviewerNotes,
    notLegalAdviceBoundary: clause.notLegalAdviceBoundary
  };
}

function createEvidenceRequestStatus(
  clause: RegulatoryClause,
  request: RegulatoryEvidenceRequest,
  evidenceItems: EvidenceItem[]
): RegulatoryEvidenceRequestStatus {
  const matchedItems = createCandidateEvidenceItems(clause, evidenceItems).filter((item) => evidenceMatchesRequest(item, request));
  const coveredItems = matchedItems.filter((item) => item.status === "received" || item.status === "verified");

  return {
    requestId: request.id,
    title: request.title,
    reason: request.reason,
    priority: request.priority,
    status: coveredItems.length > 0 ? "covered" : matchedItems.length > 0 ? "in-progress" : "missing",
    matchedEvidenceLabels: unique((coveredItems.length > 0 ? coveredItems : matchedItems).map((item) => item.label.trim()).filter(Boolean))
  };
}

function createEvidenceGaps(clause: MatchedRegulatoryClause): RegulatoryEvidenceGap[] {
  return clause.evidenceRequestStatuses
    .filter((request) => request.status !== "covered")
    .map((request) => ({
      id: `${clause.clauseId}-${request.requestId}`,
      clauseId: clause.clauseId,
      jurisdiction: clause.jurisdiction,
      citation: clause.citation,
      title: request.title,
      reason: request.reason,
      priority: request.priority,
      sourceUrl: clause.sourceUrl
    }));
}

function createJurisdictionSummaries(
  project: ProjectProfile,
  audit: AuditResult,
  matchedClauses: MatchedRegulatoryClause[],
  evidenceGaps: RegulatoryEvidenceGap[]
): JurisdictionRegulatorySummary[] {
  const packRoles = new Map(
    createJurisdictionPacks(project, audit).map((pack) => [pack.jurisdiction, pack.localCounselRoute.recommendedRole])
  );

  return project.jurisdictions.map((jurisdiction, index) => {
    const canonical = canonicalJurisdiction(jurisdiction, matchedClauses) ?? (jurisdiction.trim() || `Other jurisdiction ${index + 1}`);
    const clauses = matchedClauses.filter((clause) => clause.jurisdiction === canonical);
    const missingEvidenceCount = evidenceGaps.filter((gap) => gap.jurisdiction === canonical).length;
    const coveredEvidenceCount = clauses.reduce((sum, clause) => sum + clause.coveredEvidenceCount, 0);
    const packRole = packRoles.get(canonical);

    return {
      jurisdiction: canonical,
      matchedClauseCount: clauses.length,
      missingEvidenceCount,
      coveredEvidenceCount,
      readiness:
        clauses.length > 0 && missingEvidenceCount === 0
          ? "ready-for-counsel"
          : coveredEvidenceCount > 0
            ? "partial-evidence"
            : "evidence-gaps",
      localCounselRole:
        clauses.length === 1
          ? (clauses[0]?.localCounselRole ?? packRole ?? "Local counsel")
          : (packRole ?? clauses[0]?.localCounselRole ?? "Local counsel")
    };
  });
}

function hasJurisdiction(project: ProjectProfile, clauseJurisdiction: string): boolean {
  const aliases = jurisdictionAliases(clauseJurisdiction);
  return project.jurisdictions.some((jurisdiction) => aliases.includes(normalize(jurisdiction)));
}

function matchesClause(clause: RegulatoryClause, activeFlagIds: Set<string>, projectText: string): boolean {
  return (
    clause.triggerFlagIds.some((flagId) => activeFlagIds.has(flagId)) ||
    clause.triggerKeywords.some((keyword) => projectText.includes(keyword.toLowerCase()))
  );
}

function evidenceMatchesRequest(item: EvidenceItem, request: RegulatoryEvidenceRequest): boolean {
  const text = normalize(stripMachineControlIds([item.label, item.kind, item.source, item.content].filter(Boolean).join(" ")));
  return request.keywords.some((keyword) => keywordMatchesEvidenceText(keyword, text));
}

function createCandidateEvidenceItems(clause: RegulatoryClause, evidenceItems: EvidenceItem[]): EvidenceItem[] {
  const clauseControlId = `control-${clause.id}`;
  const explicitlyLinkedItems = evidenceItems.filter((item) => extractRegulatoryControlIds(item).includes(clauseControlId));

  if (explicitlyLinkedItems.length > 0) {
    return explicitlyLinkedItems;
  }

  return evidenceItems.filter((item) => extractRegulatoryControlIds(item).length === 0);
}

function extractRegulatoryControlIds(item: EvidenceItem): string[] {
  const text = [item.source, item.content].filter(Boolean).join(" ");
  const matches = Array.from(text.matchAll(/\bcontrol-[a-z0-9-]+\b/gi)).map((match) => match[0].toLowerCase());
  return unique(matches);
}

function normalizeProjectText(project: ProjectProfile): string {
  return normalize(
    [
      project.projectName,
      project.entityType,
      project.assetModel,
      project.userType,
      project.custodyModel,
      project.dataSensitivity,
      project.aiUsage,
      project.blockchainUse,
      project.operatingStage,
      ...project.jurisdictions
    ].join(" ")
  );
}

function jurisdictionAliases(jurisdiction: string): string[] {
  const normalized = normalize(jurisdiction);
  const aliases: Record<string, string[]> = {
    "united states": ["united states", "usa", "us"],
    "european union": ["european union", "eu"],
    "united kingdom": ["united kingdom", "uk", "great britain"],
    singapore: ["singapore", "sg"],
    "hong kong": ["hong kong", "hk", "hong kong sar"],
    japan: ["japan", "jp"],
    canada: ["canada", "ca", "canadian"],
    australia: ["australia", "au", "australian"],
    "south korea": ["south korea", "korea", "kr", "republic of korea", "korean"],
    korea: ["south korea", "korea", "kr", "republic of korea", "korean"],
    kr: ["south korea", "korea", "kr", "republic of korea", "korean"],
    india: ["india", "in", "indian", "bharat"],
    in: ["india", "in", "indian", "bharat"],
    bharat: ["india", "in", "indian", "bharat"],
    thailand: ["thailand", "thai", "th"],
    thai: ["thailand", "thai", "th"],
    th: ["thailand", "thai", "th"],
    switzerland: ["switzerland", "swiss", "ch"],
    germany: ["germany", "de", "deutschland", "german"],
    de: ["germany", "de", "deutschland", "german"],
    deutschland: ["germany", "de", "deutschland", "german"],
    "united arab emirates": ["united arab emirates", "uae", "dubai", "abu dhabi"],
    brazil: ["brazil", "br", "brasil"]
  };
  return aliases[normalized] ?? [normalized];
}

function canonicalJurisdiction(jurisdiction: string, clauses: MatchedRegulatoryClause[]): string | null {
  const aliases = jurisdictionAliases(jurisdiction);
  return clauses.find((clause) => aliases.includes(normalize(clause.jurisdiction)))?.jurisdiction ?? null;
}

function compareEvidenceGaps(left: RegulatoryEvidenceGap, right: RegulatoryEvidenceGap): number {
  const priority = priorityWeight(left.priority) - priorityWeight(right.priority);
  if (priority !== 0) {
    return priority;
  }
  return `${left.jurisdiction}-${left.title}`.localeCompare(`${right.jurisdiction}-${right.title}`);
}

function priorityWeight(priority: "P0" | "P1" | "P2"): number {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function stripMachineControlIds(value: string): string {
  return value.replace(/\bcontrol-[a-z0-9-]+\b/gi, " ");
}

function keywordMatchesEvidenceText(keyword: string, text: string): boolean {
  const normalized = normalize(keyword);
  if (!normalized) {
    return false;
  }
  if (normalized.includes(" ")) {
    return text.includes(normalized);
  }
  return new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i").test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
