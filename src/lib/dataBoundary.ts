import type { CounselReviewItem } from "./counselReview";
import type { CounselQuestion } from "./counselQuestions";
import type { AIEventRecord } from "./modelIntake";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type DataBoundaryClass =
  | "public"
  | "confidential"
  | "personal-data"
  | "raw-kyc"
  | "credential-material"
  | "private-key-material";

export type DataBoundarySeverity = "block" | "warn" | "info";

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

const scanners: Array<{
  dataClass: Exclude<DataBoundaryClass, "public">;
  severity: DataBoundarySeverity;
  pattern: RegExp;
  message: string;
  allowNegatedRawKyc?: boolean;
}> = [
  {
    dataClass: "private-key-material",
    severity: "block",
    pattern: /0x[a-fA-F0-9]{64}/g,
    message: "Private-key-like material must be removed before export handoff."
  },
  {
    dataClass: "private-key-material",
    severity: "block",
    pattern: /\b(seed phrase|mnemonic|private key)\b/gi,
    message: "Secret phrase or private-key references must be removed before export handoff."
  },
  {
    dataClass: "credential-material",
    severity: "block",
    pattern: /\bsk-(?:live|test|proj|[a-z0-9])[-_A-Za-z0-9]{12,}\b/g,
    message: "API keys or credential-like tokens must be removed before export handoff."
  },
  {
    dataClass: "credential-material",
    severity: "block",
    pattern: /\b(api[_\-\s]?key|secret[_\-\s]?key|client secret|bearer token)\s*[:=]\s*[\w.\-]{8,}/gi,
    message: "Credential fields must be removed before export handoff."
  },
  {
    dataClass: "raw-kyc",
    severity: "block",
    pattern: /\b(raw\s+kyc|kyc\s+(packet|file|document|upload|room|dump|csv|spreadsheet))\b/gi,
    message: "Raw KYC material must stay outside Counsel Pack exports."
  },
  {
    dataClass: "personal-data",
    severity: "warn",
    pattern: /\b(passport\s+number|social security number|ssn|personal data|direct identifier|direct identifiers)\b/gi,
    message: "Personal-data references need human confirmation before export."
  },
  {
    dataClass: "personal-data",
    severity: "warn",
    pattern: /\bkyc\b/gi,
    message: "KYC references should remain metadata-only and require human confirmation before export.",
    allowNegatedRawKyc: true
  },
  {
    dataClass: "confidential",
    severity: "info",
    pattern: /\b(confidential|privileged|attorney-client|internal only)\b/gi,
    message: "Confidentiality labels should be confirmed before external handoff."
  }
];

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
  return value
    .replace(/0x[a-fA-F0-9]{64}/g, "[redacted-private-key]")
    .replace(/\b[a-fA-F0-9]{24,}\b/g, "[redacted-hex-material]")
    .replace(/\bsk-(?:live|test|proj|[a-z0-9])[-_A-Za-z0-9]{12,}\b/g, "[redacted-api-key]")
    .replace(/\b(api[_\-\s]?key|secret[_\-\s]?key|client secret|bearer token)(\s*[:=]\s*)[\w.\-]{8,}/gi, "$1$2[redacted-secret]")
    .replace(/\b(raw\s+kyc|kyc\s+(packet|file|document|upload|room|dump|csv|spreadsheet))\b/gi, "[redacted-raw-kyc]")
    .replace(/\b(passport\s+number|social security number|ssn)\b/gi, "[redacted-personal-data]");
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
  return scanners.flatMap((scanner) => {
    const matches = Array.from(source.text.matchAll(scanner.pattern)).filter((match) => {
      if (scanner.allowNegatedRawKyc) {
        return !isNegatedKycReference(source.text, match.index ?? 0);
      }
      return scanner.dataClass !== "raw-kyc" || !isNegatedKycReference(source.text, match.index ?? 0);
    });

    if (matches.length === 0) {
      return [];
    }

    return [
      {
        sourceType: source.sourceType,
        sourceLabel: createSafeLabel(source.sourceLabel),
        dataClass: scanner.dataClass,
        severity: scanner.severity,
        matchCount: matches.length,
        redactedSnippet: createRedactedSnippet(source.text, matches[0].index ?? 0),
        message: scanner.message
      }
    ];
  });
}

function isNegatedKycReference(text: string, matchIndex: number): boolean {
  const windowStart = Math.max(0, matchIndex - 32);
  const windowEnd = Math.min(text.length, matchIndex + 48);
  const window = text.slice(windowStart, windowEnd).toLowerCase();
  return /\b(no|without|exclude|excluded|excludes|excluding|not)\b.{0,24}\b(raw\s+)?kyc\b/.test(window);
}

function createSafeLabel(label: string): string {
  const redacted = redactDataBoundaryText(label.trim() || "Unlabeled source");
  return redacted.length > 96 ? `${redacted.slice(0, 93)}...` : redacted;
}

function createRedactedSnippet(text: string, matchIndex: number): string {
  const normalized = normalizeWhitespace(text);
  const start = Math.max(0, Math.min(matchIndex, normalized.length) - 52);
  const end = Math.min(normalized.length, start + 180);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${redactDataBoundaryText(normalized.slice(start, end))}${suffix}`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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
