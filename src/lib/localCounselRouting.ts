import type { MatchedRegulatoryClause, RegulatoryEvidenceGap, RegulatoryGraph } from "./regulatoryGraph";
import type { RegulatorySourceReview, RegulatorySourceReviewStatus } from "./regulatorySourceReview";

export type LocalCounselRoutingStatus = "needs-evidence" | "needs-source-review" | "ready-for-counsel";
export type LocalCounselRoutePriority = "P0" | "P1" | "P2";
export type LocalCounselRouteSourceReviewStatus = RegulatorySourceReviewStatus | "not-tracked";

export type LocalCounselRoute = {
  id: string;
  jurisdiction: string;
  localCounselRole: string;
  priority: LocalCounselRoutePriority;
  status: LocalCounselRoutingStatus;
  sourceReviewStatus: LocalCounselRouteSourceReviewStatus;
  matchedClauseIds: string[];
  citations: string[];
  sourceUrls: string[];
  topics: MatchedRegulatoryClause["topic"][];
  evidenceGapCount: number;
  evidenceGapTitles: string[];
  counselQuestions: string[];
  matchedEvidenceLabels: string[];
  nextAction: string;
};

export type LocalCounselRoutingPlan = {
  planVersion: "lexproof-local-counsel-routing-v1";
  projectId: string;
  generatedAt: string;
  routeCount: number;
  prioritySummary: Record<LocalCounselRoutePriority, number>;
  routes: LocalCounselRoute[];
  planHash: string;
  notLegalAdviceBoundary: "Not legal advice. Local counsel routing plans are audit preparation workflow metadata only.";
};

export type CreateLocalCounselRoutingPlanInput = {
  graph: RegulatoryGraph;
  sourceReview: RegulatorySourceReview;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Local counsel routing plans are audit preparation workflow metadata only." as const;

export async function createLocalCounselRoutingPlan({
  graph,
  sourceReview,
  generatedAt
}: CreateLocalCounselRoutingPlanInput): Promise<LocalCounselRoutingPlan> {
  const sourceReviewByClauseId = new Map(sourceReview.items.map((item) => [item.clauseId, item]));
  const gapsByClauseId = groupEvidenceGaps(graph.evidenceGaps);
  const routeGroups = new Map<string, MatchedRegulatoryClause[]>();

  for (const clause of graph.matchedClauses) {
    const key = `${clause.jurisdiction}::${clause.localCounselRole}`;
    routeGroups.set(key, [...(routeGroups.get(key) ?? []), clause]);
  }

  const routes = Array.from(routeGroups.entries())
    .map(([key, clauses]) => createRoute(key, clauses, gapsByClauseId, sourceReviewByClauseId))
    .sort(compareRoutes);
  const prioritySummary = createPrioritySummary(routes);
  const hashPayload = {
    planVersion: "lexproof-local-counsel-routing-v1",
    projectId: graph.projectId,
    routeCount: routes.length,
    prioritySummary,
    routes,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };

  return {
    planVersion: "lexproof-local-counsel-routing-v1",
    projectId: graph.projectId,
    generatedAt: generatedAt ?? new Date().toISOString(),
    routeCount: routes.length,
    prioritySummary,
    routes,
    planHash: await sha256Hex(stableStringify(hashPayload)),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportLocalCounselRoutingPlanJson(plan: LocalCounselRoutingPlan): string {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export function downloadLocalCounselRoutingPlanJson(filename: string, plan: LocalCounselRoutingPlan): void {
  const blob = new Blob([exportLocalCounselRoutingPlanJson(plan)], { type: "application/json;charset=utf-8" });
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

function createRoute(
  key: string,
  clauses: MatchedRegulatoryClause[],
  gapsByClauseId: Map<string, RegulatoryEvidenceGap[]>,
  sourceReviewByClauseId: Map<string, RegulatorySourceReview["items"][number]>
): LocalCounselRoute {
  const [jurisdiction, localCounselRole] = key.split("::");
  const matchedClauseIds = clauses.map((clause) => clause.clauseId).sort();
  const evidenceGaps = matchedClauseIds.flatMap((clauseId) => gapsByClauseId.get(clauseId) ?? []);
  const sourceReviewStatus = selectRouteSourceReviewStatus(
    matchedClauseIds.map((clauseId) => sourceReviewByClauseId.get(clauseId)?.reviewStatus ?? "not-tracked")
  );
  const status = selectRouteStatus(evidenceGaps.length, sourceReviewStatus);
  const priority = selectRoutePriority(evidenceGaps, sourceReviewStatus);

  return {
    id: createRouteId(jurisdiction, localCounselRole),
    jurisdiction,
    localCounselRole,
    priority,
    status,
    sourceReviewStatus,
    matchedClauseIds,
    citations: unique(clauses.map((clause) => clause.citation)).sort(),
    sourceUrls: unique(clauses.map((clause) => clause.sourceUrl)).sort(),
    topics: unique(clauses.map((clause) => clause.topic)).sort(),
    evidenceGapCount: evidenceGaps.length,
    evidenceGapTitles: unique(evidenceGaps.map((gap) => gap.title)).sort(),
    counselQuestions: unique(clauses.flatMap((clause) => clause.counselQuestions).map(sanitizeRoutingText)).sort(),
    matchedEvidenceLabels: unique(clauses.flatMap((clause) => clause.matchedEvidenceLabels)).sort(),
    nextAction: selectNextAction(status)
  };
}

function groupEvidenceGaps(gaps: RegulatoryEvidenceGap[]): Map<string, RegulatoryEvidenceGap[]> {
  const byClauseId = new Map<string, RegulatoryEvidenceGap[]>();
  for (const gap of gaps) {
    byClauseId.set(gap.clauseId, [...(byClauseId.get(gap.clauseId) ?? []), gap]);
  }
  return byClauseId;
}

function selectRouteSourceReviewStatus(
  statuses: LocalCounselRouteSourceReviewStatus[]
): LocalCounselRouteSourceReviewStatus {
  if (statuses.includes("metadata-missing")) {
    return "metadata-missing";
  }
  if (statuses.includes("review-due")) {
    return "review-due";
  }
  if (statuses.includes("current")) {
    return "current";
  }
  return "not-tracked";
}

function selectRouteStatus(
  evidenceGapCount: number,
  sourceReviewStatus: LocalCounselRouteSourceReviewStatus
): LocalCounselRoutingStatus {
  if (evidenceGapCount > 0) {
    return "needs-evidence";
  }
  if (sourceReviewStatus === "metadata-missing" || sourceReviewStatus === "review-due") {
    return "needs-source-review";
  }
  return "ready-for-counsel";
}

function selectRoutePriority(
  evidenceGaps: RegulatoryEvidenceGap[],
  sourceReviewStatus: LocalCounselRouteSourceReviewStatus
): LocalCounselRoutePriority {
  if (evidenceGaps.some((gap) => gap.priority === "P0") || sourceReviewStatus === "metadata-missing") {
    return "P0";
  }
  if (evidenceGaps.length > 0 || sourceReviewStatus === "review-due") {
    return "P1";
  }
  return "P2";
}

function selectNextAction(status: LocalCounselRoutingStatus): string {
  if (status === "needs-evidence") {
    return "Prepare missing evidence for local counsel review.";
  }
  if (status === "needs-source-review") {
    return "Refresh source metadata before local counsel handoff.";
  }
  return "Route compiled source and evidence metadata to local counsel.";
}

function createPrioritySummary(routes: LocalCounselRoute[]): Record<LocalCounselRoutePriority, number> {
  return {
    P0: routes.filter((route) => route.priority === "P0").length,
    P1: routes.filter((route) => route.priority === "P1").length,
    P2: routes.filter((route) => route.priority === "P2").length
  };
}

function compareRoutes(left: LocalCounselRoute, right: LocalCounselRoute): number {
  const priority = priorityWeight(left.priority) - priorityWeight(right.priority);
  if (priority !== 0) {
    return priority;
  }
  const status = statusWeight(left.status) - statusWeight(right.status);
  if (status !== 0) {
    return status;
  }
  return `${left.jurisdiction}-${left.localCounselRole}`.localeCompare(`${right.jurisdiction}-${right.localCounselRole}`);
}

function priorityWeight(priority: LocalCounselRoutePriority): number {
  if (priority === "P0") {
    return 0;
  }
  if (priority === "P1") {
    return 1;
  }
  return 2;
}

function statusWeight(status: LocalCounselRoutingStatus): number {
  if (status === "needs-evidence") {
    return 0;
  }
  if (status === "needs-source-review") {
    return 1;
  }
  return 2;
}

function createRouteId(jurisdiction: string, localCounselRole: string): string {
  return `local-counsel-${slugify(jurisdiction)}-${slugify(localCounselRole)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function sanitizeRoutingText(value: string): string {
  return value
    .replace(/\blegally approved\b/gi, "a legal conclusion")
    .replace(/\braw KYC\b/gi, "restricted identity material")
    .replace(/\bprivate key\b/gi, "restricted signing material");
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
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
