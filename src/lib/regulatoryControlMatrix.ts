import type {
  MatchedRegulatoryClause,
  RegulatoryCoverageStatus,
  RegulatoryGraph,
  RegulatoryEvidenceRequestStatus
} from "./regulatoryGraph";
import type {
  RegulatorySourceReview,
  RegulatorySourceReviewItem,
  RegulatorySourceReviewStatus
} from "./regulatorySourceReview";

export type RegulatoryControlMatrixStatus =
  | "ready-for-counsel"
  | "needs-evidence"
  | "needs-source-review"
  | "metadata-missing"
  | "no-controls";

export type RegulatoryControlStatus =
  | "ready-for-counsel"
  | "needs-evidence"
  | "needs-source-review"
  | "metadata-missing";

export type RegulatoryControlPriority = "P0" | "P1" | "P2";

export type RegulatoryControlMatrixSummary = {
  totalControlCount: number;
  readyForCounselCount: number;
  needsEvidenceCount: number;
  needsSourceReviewCount: number;
  metadataMissingCount: number;
  openEvidenceRequestCount: number;
};

export type RegulatoryControlMatrixControl = {
  controlId: string;
  clauseId: string;
  jurisdiction: string;
  topic: MatchedRegulatoryClause["topic"];
  citation: string;
  sourceName: string;
  sourceUrl: string;
  localCounselRole: string;
  status: RegulatoryControlStatus;
  evidenceCoverageStatus: RegulatoryCoverageStatus;
  sourceReviewStatus: RegulatorySourceReviewStatus;
  coveredEvidenceCount: number;
  totalEvidenceRequestCount: number;
  openEvidenceRequestCount: number;
  highestPriority: RegulatoryControlPriority;
  evidenceRequestTitles: string[];
  matchedEvidenceLabels: string[];
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Regulatory controls are audit preparation workflow metadata only.";
};

export type RegulatoryControlMatrix = {
  matrixVersion: "lexproof-regulatory-control-matrix-v1";
  projectId: string;
  generatedAt: string;
  status: RegulatoryControlMatrixStatus;
  controlCount: number;
  summary: RegulatoryControlMatrixSummary;
  controls: RegulatoryControlMatrixControl[];
  notLegalAdviceBoundary: "Not legal advice. Regulatory control matrices are audit preparation workflow metadata only.";
};

export type CreateRegulatoryControlMatrixInput = {
  graph: RegulatoryGraph;
  sourceReview: RegulatorySourceReview;
  generatedAt?: string;
};

const controlBoundary = "Not legal advice. Regulatory controls are audit preparation workflow metadata only." as const;
const matrixBoundary = "Not legal advice. Regulatory control matrices are audit preparation workflow metadata only." as const;

export function createRegulatoryControlMatrix({
  graph,
  sourceReview,
  generatedAt = new Date().toISOString()
}: CreateRegulatoryControlMatrixInput): RegulatoryControlMatrix {
  const reviewItemsByClauseId = new Map(sourceReview.items.map((item) => [item.clauseId, item]));
  const controls = graph.matchedClauses
    .map((clause) => createControl(clause, reviewItemsByClauseId.get(clause.clauseId)))
    .sort(compareControls);
  const summary = createSummary(controls);

  return {
    matrixVersion: "lexproof-regulatory-control-matrix-v1",
    projectId: graph.projectId,
    generatedAt,
    status: createMatrixStatus(summary),
    controlCount: controls.length,
    summary,
    controls,
    notLegalAdviceBoundary: matrixBoundary
  };
}

export function exportRegulatoryControlMatrixJson(matrix: RegulatoryControlMatrix): string {
  return JSON.stringify(matrix, null, 2);
}

function createControl(
  clause: MatchedRegulatoryClause,
  reviewItem: RegulatorySourceReviewItem | undefined
): RegulatoryControlMatrixControl {
  const openEvidenceRequests = clause.evidenceRequestStatuses.filter((request) => request.status !== "covered");
  const highestPriority = getHighestPriority(openEvidenceRequests);
  const sourceReviewStatus = reviewItem?.reviewStatus ?? "metadata-missing";
  const status = createControlStatus(clause.coverageStatus, sourceReviewStatus);

  return {
    controlId: `control-${clause.clauseId}`,
    clauseId: clause.clauseId,
    jurisdiction: clause.jurisdiction,
    topic: clause.topic,
    citation: clause.citation,
    sourceName: clause.sourceName,
    sourceUrl: clause.sourceUrl,
    localCounselRole: clause.localCounselRole,
    status,
    evidenceCoverageStatus: clause.coverageStatus,
    sourceReviewStatus,
    coveredEvidenceCount: clause.coveredEvidenceCount,
    totalEvidenceRequestCount: clause.totalEvidenceRequestCount,
    openEvidenceRequestCount: openEvidenceRequests.length,
    highestPriority,
    evidenceRequestTitles: openEvidenceRequests.map((request) => request.title),
    matchedEvidenceLabels: clause.matchedEvidenceLabels,
    nextAction: createNextAction(status, clause, reviewItem, openEvidenceRequests),
    notLegalAdviceBoundary: controlBoundary
  };
}

function createControlStatus(
  coverageStatus: RegulatoryCoverageStatus,
  sourceReviewStatus: RegulatorySourceReviewStatus
): RegulatoryControlStatus {
  if (sourceReviewStatus === "metadata-missing") {
    return "metadata-missing";
  }
  if (coverageStatus !== "covered") {
    return "needs-evidence";
  }
  if (sourceReviewStatus === "review-due") {
    return "needs-source-review";
  }
  return "ready-for-counsel";
}

function createNextAction(
  status: RegulatoryControlStatus,
  clause: MatchedRegulatoryClause,
  reviewItem: RegulatorySourceReviewItem | undefined,
  openEvidenceRequests: RegulatoryEvidenceRequestStatus[]
): string {
  if (status === "metadata-missing") {
    return `Complete source metadata for ${reviewItem?.citation ?? clause.citation} before counsel handoff.`;
  }
  if (status === "needs-source-review") {
    return `Refresh ${reviewItem?.citation ?? clause.citation} source metadata before counsel handoff.`;
  }
  if (status === "ready-for-counsel") {
    return `Route ${clause.localCounselRole} control to counsel review with covered evidence.`;
  }

  const requestTitle = openEvidenceRequests[0]?.title ?? "source evidence request";
  return `Prepare ${requestTitle} for ${clause.localCounselRole} review.`;
}

function createSummary(controls: RegulatoryControlMatrixControl[]): RegulatoryControlMatrixSummary {
  return {
    totalControlCount: controls.length,
    readyForCounselCount: controls.filter((control) => control.status === "ready-for-counsel").length,
    needsEvidenceCount: controls.filter((control) => control.status === "needs-evidence").length,
    needsSourceReviewCount: controls.filter((control) => control.status === "needs-source-review").length,
    metadataMissingCount: controls.filter((control) => control.status === "metadata-missing").length,
    openEvidenceRequestCount: controls.reduce((sum, control) => sum + control.openEvidenceRequestCount, 0)
  };
}

function createMatrixStatus(summary: RegulatoryControlMatrixSummary): RegulatoryControlMatrixStatus {
  if (summary.totalControlCount === 0) {
    return "no-controls";
  }
  if (summary.metadataMissingCount > 0) {
    return "metadata-missing";
  }
  if (summary.needsEvidenceCount > 0) {
    return "needs-evidence";
  }
  if (summary.needsSourceReviewCount > 0) {
    return "needs-source-review";
  }
  return "ready-for-counsel";
}

function getHighestPriority(requests: RegulatoryEvidenceRequestStatus[]): RegulatoryControlPriority {
  return requests
    .map((request) => request.priority)
    .sort((left, right) => priorityWeight(left) - priorityWeight(right))[0] ?? "P2";
}

function compareControls(left: RegulatoryControlMatrixControl, right: RegulatoryControlMatrixControl): number {
  const status = statusWeight(left.status) - statusWeight(right.status);
  if (status !== 0) {
    return status;
  }

  const priority = priorityWeight(left.highestPriority) - priorityWeight(right.highestPriority);
  if (priority !== 0) {
    return priority;
  }

  return `${left.jurisdiction}-${left.citation}`.localeCompare(`${right.jurisdiction}-${right.citation}`);
}

function statusWeight(status: RegulatoryControlStatus): number {
  if (status === "metadata-missing") {
    return 0;
  }
  if (status === "needs-evidence") {
    return 1;
  }
  if (status === "needs-source-review") {
    return 2;
  }
  return 3;
}

function priorityWeight(priority: RegulatoryControlPriority): number {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}
