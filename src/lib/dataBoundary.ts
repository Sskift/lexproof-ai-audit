import type { CounselReviewItem } from "./counselReview";
import type { CounselQuestion } from "./counselQuestions";
import {
  classifyDataBoundaryText,
  redactClassifiedText,
  type ClassifiedDataClass,
  type ClassifiedDataSeverity
} from "./dataClassification";
import type { AIEventRecord } from "./modelIntake";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type DataBoundaryClass = ClassifiedDataClass;
export type DataBoundarySeverity = ClassifiedDataSeverity;

export type DataBoundaryFinding = {
  sourceType: "project-profile" | "evidence" | "counsel-question" | "counsel-review" | "ai-event";
  sourceLabel: string;
  dataClass: DataBoundaryClass;
  severity: DataBoundarySeverity;
  matchCount: number;
  redactedSnippet: string;
  message: string;
};

export type DataBoundaryReport = {
  reportVersion: "lexproof-data-boundary-v1";
  status: "clean" | "needs-review" | "blocked";
  exportAllowed: boolean;
  detectedClasses: DataBoundaryClass[];
  blockerCount: number;
  warningCount: number;
  findings: DataBoundaryFinding[];
  remediation: string[];
  notLegalAdviceBoundary: "Not legal advice. Data boundary output is audit preparation material only.";
};

export type DataBoundaryReportInput = {
  project: ProjectProfile;
  evidenceItems: EvidenceItem[];
  counselQuestions: CounselQuestion[];
  counselReviews: CounselReviewItem[];
  aiEvents: AIEventRecord[];
};

type BoundarySource = {
  sourceType: DataBoundaryFinding["sourceType"];
  sourceLabel: string;
  text: string;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Data boundary output is audit preparation material only.";

export function createDataBoundaryReport(input: DataBoundaryReportInput): DataBoundaryReport {
  const findings = createBoundarySources(input).flatMap(scanBoundarySource);
  const blockerCount = findings.filter((finding) => finding.severity === "block").length;
  const warningCount = findings.filter((finding) => finding.severity === "warn").length;
  const status = blockerCount > 0 ? "blocked" : warningCount > 0 ? "needs-review" : "clean";

  return {
    reportVersion: "lexproof-data-boundary-v1",
    status,
    exportAllowed: blockerCount === 0,
    detectedClasses: unique(findings.map((finding) => finding.dataClass)),
    blockerCount,
    warningCount,
    findings,
    remediation: buildRemediation(findings),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function summarizeDataBoundaryForExport(report: DataBoundaryReport): string {
  const classes = report.detectedClasses.join(", ") || "none";
  const findings =
    report.findings
      .map(
        (finding) =>
          `- ${finding.severity} ${finding.dataClass} in ${finding.sourceType} "${finding.sourceLabel}": ${finding.message} (${finding.matchCount} match${finding.matchCount === 1 ? "" : "es"}; ${finding.redactedSnippet})`
      )
      .join("\n") || "- No data boundary findings detected.";
  const remediation = report.remediation.map((item) => `- ${item}`).join("\n");

  return [
    report.notLegalAdviceBoundary,
    `- Report version: ${report.reportVersion}`,
    `- Export status: ${report.status}`,
    `- Export allowed: ${report.exportAllowed ? "yes" : "no"}`,
    `- Blockers: ${report.blockerCount}`,
    `- Warnings: ${report.warningCount}`,
    `- Detected classes: ${classes}`,
    "",
    "### Data Boundary Findings",
    findings,
    "",
    "### Data Boundary Remediation",
    remediation
  ].join("\n");
}

export function redactDataBoundaryText(value: string): string {
  return redactClassifiedText(value);
}

function createBoundarySources({
  project,
  evidenceItems,
  counselQuestions,
  counselReviews,
  aiEvents
}: DataBoundaryReportInput): BoundarySource[] {
  return [
    {
      sourceType: "project-profile",
      sourceLabel: project.projectName || "Project profile",
      text: [
        project.projectName,
        project.entityType,
        project.jurisdictions.join(", "),
        project.assetModel,
        project.userType,
        project.custodyModel,
        project.dataSensitivity,
        project.aiUsage,
        project.blockchainUse,
        project.operatingStage
      ].join(" ")
    },
    ...evidenceItems.map((item, index): BoundarySource => ({
      sourceType: "evidence",
      sourceLabel: item.label || `Evidence ${index + 1}`,
      text: [item.label, item.kind, item.source, item.status, item.owner, item.content].filter(Boolean).join(" ")
    })),
    ...counselQuestions.map((item, index): BoundarySource => ({
      sourceType: "counsel-question",
      sourceLabel: item.relatedFlagId || item.source || `Counsel question ${index + 1}`,
      text: [item.question, item.source, item.status, item.priority].join(" ")
    })),
    ...counselReviews.map((item, index): BoundarySource => ({
      sourceType: "counsel-review",
      sourceLabel: item.title || item.flagId || `Counsel review ${index + 1}`,
      text: [
        item.title,
        item.owner,
        item.status,
        item.evidenceSummary,
        item.reviewer,
        item.reviewerNote,
        item.notLegalAdviceBoundary
      ].join(" ")
    })),
    ...aiEvents.map((item, index): BoundarySource => ({
      sourceType: "ai-event",
      sourceLabel: item.eventType || `AI event ${index + 1}`,
      text: [
        item.eventType,
        item.inputSummary,
        item.outputSummary,
        item.modelAction,
        item.humanReviewer,
        item.reviewStatus
      ].join(" ")
    }))
  ];
}

function scanBoundarySource(source: BoundarySource): DataBoundaryFinding[] {
  return classifyDataBoundaryText(source.text).map((finding) => ({
    sourceType: source.sourceType,
    sourceLabel: createSafeLabel(source.sourceLabel),
    dataClass: finding.dataClass,
    severity: finding.severity,
    matchCount: finding.matchCount,
    redactedSnippet: finding.redactedSnippet,
    message: finding.message
  }));
}

function createSafeLabel(label: string): string {
  const redacted = redactDataBoundaryText(label.trim() || "Unlabeled source");
  return redacted.length > 96 ? `${redacted.slice(0, 93)}...` : redacted;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function buildRemediation(findings: DataBoundaryFinding[]): string[] {
  if (findings.length === 0) {
    return ["No blocked data boundary findings detected; keep exports metadata-only and review before external handoff."];
  }

  const remediation: string[] = [];
  if (findings.some((finding) => finding.severity === "block")) {
    remediation.push("Remove or replace blocked materials with metadata-only summaries before export handoff.");
    remediation.push("Re-run the Export Safety Gate after removing secrets, credentials, or raw KYC material.");
  }

  if (findings.some((finding) => finding.severity === "warn")) {
    remediation.push("Confirm personal-data and KYC references are redacted, summarized, or counsel-approved before sharing.");
  }

  if (findings.some((finding) => finding.severity === "info")) {
    remediation.push("Confirm confidentiality labels and recipient scope before external distribution.");
  }

  return remediation;
}
