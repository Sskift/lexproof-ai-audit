import type { AuditFlag, AuditResult, RemediationItem } from "./auditEngine";
import type { ProjectProfile } from "./projectModel";
import type { RiskEvidenceCoverage } from "./riskEvidence";

export type CounselReviewStatus = "not-started" | "needs-evidence" | "ready-for-counsel" | "reviewed" | "blocked";

export type CounselReviewItem = {
  id: string;
  projectId: string;
  flagId: string;
  title: string;
  severity: AuditFlag["severity"];
  owner: RemediationItem["owner"];
  priority: RemediationItem["priority"];
  status: CounselReviewStatus;
  evidenceSummary: string;
  reviewer: string;
  reviewerNote: string;
  updatedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only.";
};

export function createDefaultCounselReviewItems(
  project: ProjectProfile,
  audit: AuditResult,
  evidenceCoverage: RiskEvidenceCoverage[]
): CounselReviewItem[] {
  const coverageByFlag = new Map(evidenceCoverage.map((coverage) => [coverage.flagId, coverage]));
  const now = project.updatedAt ?? project.createdAt ?? "";

  return audit.flags.map((flag) => {
    const coverage = coverageByFlag.get(flag.id);
    return {
      id: `${project.id}-review-${flag.id}`,
      projectId: project.id,
      flagId: flag.id,
      title: flag.title,
      severity: flag.severity,
      owner: ownerForFlag(flag.id),
      priority: priorityForFlag(flag),
      status: statusForCoverage(coverage),
      evidenceSummary: evidenceSummary(coverage),
      reviewer: "",
      reviewerNote: "",
      updatedAt: now,
      notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
    };
  });
}

export function mergeCounselReviewQueues(existing: CounselReviewItem[], incoming: CounselReviewItem[]): CounselReviewItem[] {
  const existingById = new Map(existing.map((item) => [item.id, item]));
  return incoming.map((item) => {
    const prior = existingById.get(item.id);
    if (!prior) {
      return item;
    }

    return {
      ...item,
      status: prior.status,
      reviewer: prior.reviewer,
      reviewerNote: prior.reviewerNote,
      updatedAt: prior.updatedAt
    };
  });
}

function statusForCoverage(coverage: RiskEvidenceCoverage | undefined): CounselReviewStatus {
  if (!coverage || coverage.totalCount === 0) {
    return "not-started";
  }
  return coverage.coverageStatus === "complete" ? "ready-for-counsel" : "needs-evidence";
}

function evidenceSummary(coverage: RiskEvidenceCoverage | undefined): string {
  if (!coverage) {
    return "0/0 evidence requirements mapped";
  }
  return `${coverage.coveredCount}/${coverage.totalCount} evidence requirements covered`;
}

function priorityForFlag(flag: AuditFlag): RemediationItem["priority"] {
  if (flag.severity === "critical") {
    return "P0";
  }
  if (flag.severity === "material" || flag.severity === "watch") {
    return "P1";
  }
  return "P2";
}

function ownerForFlag(flagId: string): RemediationItem["owner"] {
  if (flagId === "custody" || flagId === "sensitive-data") {
    return "Compliance";
  }
  if (flagId === "ai-workflow") {
    return "Product";
  }
  if (flagId === "evidence-anchor") {
    return "Engineering";
  }
  return "Counsel";
}
