import type { AuditFlag, AuditResult, RemediationItem } from "./auditEngine";
import { redactClassifiedText } from "./dataClassification";
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

const COUNSEL_REVIEW_BOUNDARY = "Not legal advice. Counsel review status is audit preparation workflow only." as const;
const counselReviewStatuses = ["not-started", "needs-evidence", "ready-for-counsel", "reviewed", "blocked"] as const;
const counselReviewSeverities = ["info", "watch", "material", "critical"] as const;
const counselReviewOwners = ["Counsel", "Compliance", "Engineering", "Product"] as const;
const counselReviewPriorities = ["P0", "P1", "P2"] as const;
const legalConclusionPattern =
  /\b(final\s+legal\s+decision|legal\s+opinion|legal\s+approval|legally\s+compliant|legally\s+non-compliant|compliance\s+decision)\b/gi;

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
      notLegalAdviceBoundary: COUNSEL_REVIEW_BOUNDARY
    };
  });
}

export function sanitizeCounselReviewItem(item: CounselReviewItem): CounselReviewItem {
  return {
    id: sanitizeCounselReviewText(item.id) || "counsel-review",
    projectId: sanitizeCounselReviewText(item.projectId) || "project",
    flagId: sanitizeCounselReviewText(item.flagId) || "risk-flag",
    title: sanitizeCounselReviewText(item.title) || "Counsel review item",
    severity: item.severity,
    owner: item.owner,
    priority: item.priority,
    status: item.status,
    evidenceSummary: sanitizeCounselReviewText(item.evidenceSummary),
    reviewer: sanitizeCounselReviewText(item.reviewer),
    reviewerNote: sanitizeCounselReviewText(item.reviewerNote),
    updatedAt: sanitizeCounselReviewText(item.updatedAt),
    notLegalAdviceBoundary: COUNSEL_REVIEW_BOUNDARY
  };
}

export function parseStoredCounselReviews(raw: string | null | undefined): CounselReviewItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.flatMap((item) => {
          const review = normalizeStoredCounselReview(item);
          return review ? [review] : [];
        })
      : [];
  } catch {
    return [];
  }
}

export function mergeCounselReviewQueues(existing: CounselReviewItem[], incoming: CounselReviewItem[]): CounselReviewItem[] {
  const sanitizedExisting = existing.map(sanitizeCounselReviewItem);
  const sanitizedIncoming = incoming.map(sanitizeCounselReviewItem);
  const existingById = new Map(sanitizedExisting.map((item) => [item.id, item]));
  return sanitizedIncoming.map((item) => {
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

function normalizeStoredCounselReview(value: unknown): CounselReviewItem | null {
  if (!isRecord(value) || value.notLegalAdviceBoundary !== COUNSEL_REVIEW_BOUNDARY) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.projectId) ||
    !isNonEmptyString(value.flagId) ||
    !isNonEmptyString(value.title) ||
    typeof value.evidenceSummary !== "string" ||
    typeof value.reviewer !== "string" ||
    typeof value.reviewerNote !== "string" ||
    typeof value.updatedAt !== "string" ||
    !isOneOf(value.severity, counselReviewSeverities) ||
    !isOneOf(value.owner, counselReviewOwners) ||
    !isOneOf(value.priority, counselReviewPriorities) ||
    !isOneOf(value.status, counselReviewStatuses)
  ) {
    return null;
  }

  return sanitizeCounselReviewItem({
    id: value.id,
    projectId: value.projectId,
    flagId: value.flagId,
    title: value.title,
    severity: value.severity,
    owner: value.owner,
    priority: value.priority,
    status: value.status,
    evidenceSummary: value.evidenceSummary,
    reviewer: value.reviewer,
    reviewerNote: value.reviewerNote,
    updatedAt: value.updatedAt,
    notLegalAdviceBoundary: COUNSEL_REVIEW_BOUNDARY
  });
}

function sanitizeCounselReviewText(value: string): string {
  return redactClassifiedText(value)
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<const T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
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
