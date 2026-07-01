import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification.js";

type DocumentParserPolicyStatus = "ready" | "needs-policy" | "blocked" | "disabled";
type DocumentParserRetentionStatus = "ready" | "needs-review" | "blocked";

export type DocumentParserPolicyContext = {
  workspaceId: string;
  evidenceCount: number;
  retentionStatus: DocumentParserRetentionStatus;
  vaultSyncAllowed: boolean;
  blockerCount: number;
  exportBlockerCount: number;
  manifestHash?: string;
};

export type DocumentParserPolicyDraft = {
  policyOwner: string;
  maxDocumentSizeMb: number;
  rawDocumentRetentionDays: number;
  deletionSlaDays: number;
  parsingPurpose: string;
  redactionBeforeParsingApproved: boolean;
  noTrainingUseConfirmed: boolean;
  accessLoggingApproved: boolean;
  noSensitiveMaterialConfirmed: boolean;
  humanReviewRequired: boolean;
  notes: string;
};

export type DocumentParserPolicyControlId =
  | "metadata-boundary"
  | "retention-boundary"
  | "manifest-linkage"
  | "document-size-and-retention"
  | "deletion-sla"
  | "purpose-boundary"
  | "redaction-before-parsing"
  | "no-training-use"
  | "access-logging"
  | "no-sensitive-material"
  | "human-review-enforcement";

export type DocumentParserPolicyControl = {
  id: DocumentParserPolicyControlId;
  label: string;
  status: DocumentParserPolicyStatus;
  evidence: string;
  recoveryAction: string;
};

export type DocumentParserPolicyReport = {
  reportVersion: "lexproof-document-parser-policy-v1";
  generatedAt: string;
  overallStatus: Extract<DocumentParserPolicyStatus, "ready" | "needs-policy" | "blocked">;
  requiredControlCount: number;
  approvedControlCount: number;
  externalDocumentParsingAllowed: false;
  externalDocumentParsingStatus: "needs-policy" | "policy-ready-not-enabled" | "blocked-by-metadata";
  controls: DocumentParserPolicyControl[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Document parser policy is audit preparation metadata only.";
};

export type CreateDocumentParserPolicyReportInput = {
  context: DocumentParserPolicyContext;
  policy: DocumentParserPolicyDraft;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Document parser policy is audit preparation metadata only." as const;
const blockedPolicyMetadataClasses = new Set(["credential-material", "private-key-material", "raw-kyc"]);

export function createDocumentParserPolicyReport(
  input: CreateDocumentParserPolicyReportInput,
  generatedAt = new Date().toISOString()
): DocumentParserPolicyReport {
  const normalizedContext = normalizeContext(input.context);
  const normalizedPolicy = normalizePolicyDraft(input.policy);
  const metadataFindings = classifyDataBoundaryText(`${input.policy.policyOwner} ${input.policy.parsingPurpose} ${input.policy.notes}`);
  const hasBlockedMetadata =
    metadataFindings.some((finding) => blockedPolicyMetadataClasses.has(finding.dataClass)) ||
    requestsFinalLegalDecision(input.policy.parsingPurpose);
  const controls = createControls(normalizedContext, normalizedPolicy, hasBlockedMetadata);
  const requiredControls = controls.filter((control) => control.id !== "metadata-boundary");
  const requiredControlCount = requiredControls.length;
  const approvedControlCount = requiredControls.filter((control) => control.status === "ready").length;
  const overallStatus = createOverallStatus(hasBlockedMetadata, requiredControls, approvedControlCount, requiredControlCount);

  return {
    reportVersion: "lexproof-document-parser-policy-v1",
    generatedAt,
    overallStatus,
    requiredControlCount,
    approvedControlCount,
    externalDocumentParsingAllowed: false,
    externalDocumentParsingStatus: createExternalDocumentParsingStatus(overallStatus),
    controls,
    nextActions: createNextActions(overallStatus, controls),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportDocumentParserPolicyJson(report: DocumentParserPolicyReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function normalizeContext(context: DocumentParserPolicyContext): DocumentParserPolicyContext {
  return {
    workspaceId: sanitize(context.workspaceId),
    evidenceCount: Number.isFinite(context.evidenceCount) ? Math.max(0, Math.trunc(context.evidenceCount)) : 0,
    retentionStatus:
      context.retentionStatus === "ready" || context.retentionStatus === "needs-review" || context.retentionStatus === "blocked"
        ? context.retentionStatus
        : "needs-review",
    vaultSyncAllowed: context.vaultSyncAllowed === true,
    blockerCount: Number.isFinite(context.blockerCount) ? Math.max(0, Math.trunc(context.blockerCount)) : 0,
    exportBlockerCount: Number.isFinite(context.exportBlockerCount) ? Math.max(0, Math.trunc(context.exportBlockerCount)) : 0,
    manifestHash: isSha256(context.manifestHash) ? context.manifestHash.toLowerCase() : undefined
  };
}

function normalizePolicyDraft(policy: DocumentParserPolicyDraft): DocumentParserPolicyDraft {
  return {
    policyOwner: sanitize(policy.policyOwner),
    maxDocumentSizeMb: Number.isFinite(policy.maxDocumentSizeMb) ? Math.max(0, Math.trunc(policy.maxDocumentSizeMb)) : 0,
    rawDocumentRetentionDays: Number.isFinite(policy.rawDocumentRetentionDays)
      ? Math.max(0, Math.trunc(policy.rawDocumentRetentionDays))
      : 0,
    deletionSlaDays: Number.isFinite(policy.deletionSlaDays) ? Math.max(0, Math.trunc(policy.deletionSlaDays)) : 0,
    parsingPurpose: sanitize(policy.parsingPurpose),
    redactionBeforeParsingApproved: policy.redactionBeforeParsingApproved === true,
    noTrainingUseConfirmed: policy.noTrainingUseConfirmed === true,
    accessLoggingApproved: policy.accessLoggingApproved === true,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: sanitize(policy.notes)
  };
}

function createControls(
  context: DocumentParserPolicyContext,
  policy: DocumentParserPolicyDraft,
  hasBlockedMetadata: boolean
): DocumentParserPolicyControl[] {
  return [
    {
      id: "metadata-boundary",
      label: "Policy metadata boundary",
      status: hasBlockedMetadata ? "blocked" : "ready",
      evidence: hasBlockedMetadata
        ? "Policy metadata contains blocked secret, private-key, raw KYC, or legal-decision references."
        : "Policy metadata is limited to parser routing details and excludes raw document content.",
      recoveryAction: hasBlockedMetadata
        ? "Remove credentials, private keys, raw KYC references, and final legal-decision requests from parser policy metadata."
        : "Keep parser policy metadata free of credentials, private keys, raw KYC, personal data, and raw document text."
    },
    {
      id: "retention-boundary",
      label: "Retention boundary",
      status: createRetentionStatus(context),
      evidence: createRetentionEvidence(context),
      recoveryAction: "Resolve Evidence Retention and Export Safety blockers before any parser adapter enablement review."
    },
    {
      id: "manifest-linkage",
      label: "Manifest linkage",
      status: context.manifestHash ? "ready" : "needs-policy",
      evidence: context.manifestHash
        ? `Evidence Manifest ${context.manifestHash.slice(0, 12)}... is available for parser review.`
        : "Evidence Manifest bundle hash is required before document parser review.",
      recoveryAction: "Generate an Evidence Manifest before document parser adapter review."
    },
    {
      id: "document-size-and-retention",
      label: "Document size and raw retention",
      status: policy.maxDocumentSizeMb > 0 && policy.maxDocumentSizeMb <= 25 && policy.rawDocumentRetentionDays >= 0 && policy.rawDocumentRetentionDays <= 30
        ? "ready"
        : "needs-policy",
      evidence:
        policy.maxDocumentSizeMb > 0 && policy.maxDocumentSizeMb <= 25 && policy.rawDocumentRetentionDays >= 0 && policy.rawDocumentRetentionDays <= 30
          ? `Parser review caps documents at ${policy.maxDocumentSizeMb} MB and raw retention at ${policy.rawDocumentRetentionDays} days.`
          : "Parser review requires a size cap of 25 MB or less and raw retention of 30 days or less.",
      recoveryAction: "Define bounded size and raw-document retention limits before parser adapter enablement."
    },
    {
      id: "deletion-sla",
      label: "Deletion SLA",
      status: policy.deletionSlaDays > 0 && policy.deletionSlaDays <= 14 ? "ready" : "needs-policy",
      evidence:
        policy.deletionSlaDays > 0 && policy.deletionSlaDays <= 14
          ? `Parser deletion SLA is set to ${policy.deletionSlaDays} days.`
          : "Parser deletion SLA must be defined and 14 days or less.",
      recoveryAction: "Define deletion, supersession, and workspace-deletion triggers before parser adapter enablement."
    },
    {
      id: "purpose-boundary",
      label: "Parsing purpose boundary",
      status: policy.parsingPurpose && !requestsFinalLegalDecision(policy.parsingPurpose) ? "ready" : "needs-policy",
      evidence:
        policy.parsingPurpose && !requestsFinalLegalDecision(policy.parsingPurpose)
          ? "Parsing purpose is defined for audit-preparation metadata extraction."
          : "Parsing purpose must be limited to audit-preparation metadata and must not request legal decisions.",
      recoveryAction: "Limit parser use to source citations, metadata extraction, and audit-prep summaries for human review."
    },
    {
      id: "redaction-before-parsing",
      label: "Redaction before parsing",
      status: policy.redactionBeforeParsingApproved ? "ready" : "needs-policy",
      evidence: policy.redactionBeforeParsingApproved
        ? "Redaction before parsing is approved."
        : "Redaction before parsing is not approved.",
      recoveryAction: "Approve redaction before parsing before parser adapter enablement."
    },
    {
      id: "no-training-use",
      label: "No model training use",
      status: policy.noTrainingUseConfirmed ? "ready" : "needs-policy",
      evidence: policy.noTrainingUseConfirmed
        ? "Policy confirms parser outputs are not used for model training."
        : "No-training-use confirmation is missing.",
      recoveryAction: "Confirm parser outputs and metadata are excluded from model training."
    },
    {
      id: "access-logging",
      label: "Parser access logging",
      status: policy.accessLoggingApproved ? "ready" : "needs-policy",
      evidence: policy.accessLoggingApproved
        ? "Metadata-only parser access logging is approved."
        : "Parser access logging is not approved.",
      recoveryAction: "Approve metadata-only parser access logs, actor IDs, and audit-log retention."
    },
    {
      id: "no-sensitive-material",
      label: "No sensitive material",
      status: policy.noSensitiveMaterialConfirmed ? "ready" : "needs-policy",
      evidence: policy.noSensitiveMaterialConfirmed
        ? "Policy confirms raw KYC, private keys, credentials, and personal data stay out of parser policy requests."
        : "Policy must confirm blocked data classes stay out of parser policy requests.",
      recoveryAction: "Confirm parser requests stay metadata-only unless a reviewed raw-document adapter policy exists."
    },
    {
      id: "human-review-enforcement",
      label: "Human review enforcement",
      status: policy.humanReviewRequired ? "ready" : "needs-policy",
      evidence: policy.humanReviewRequired
        ? "Parser output requires human review before external reliance."
        : "Human review must be mandatory before parser output is relied on.",
      recoveryAction: "Require human review for parser output, exceptions, and policy changes."
    }
  ];
}

function createRetentionStatus(context: DocumentParserPolicyContext): DocumentParserPolicyControl["status"] {
  if (context.retentionStatus === "blocked" || context.blockerCount > 0 || context.exportBlockerCount > 0) {
    return "blocked";
  }

  if (context.retentionStatus === "ready" && context.vaultSyncAllowed && context.evidenceCount > 0) {
    return "ready";
  }

  return "needs-policy";
}

function createRetentionEvidence(context: DocumentParserPolicyContext): string {
  if (context.exportBlockerCount > 0) {
    return `${context.exportBlockerCount} export safety blocker${context.exportBlockerCount === 1 ? "" : "s"} must be remediated before parser review.`;
  }

  if (context.retentionStatus === "blocked" || context.blockerCount > 0) {
    return `${context.blockerCount || 1} retention blocker${context.blockerCount === 1 ? "" : "s"} must be remediated before parser review.`;
  }

  if (context.evidenceCount === 0) {
    return "No metadata-only evidence records are available for parser review.";
  }

  if (context.retentionStatus === "ready" && context.vaultSyncAllowed) {
    return `${context.evidenceCount} metadata-only evidence record${context.evidenceCount === 1 ? "" : "s"} passed retention blockers.`;
  }

  return "Evidence Retention Readiness still needs review before parser policy approval.";
}

function createOverallStatus(
  hasBlockedMetadata: boolean,
  requiredControls: DocumentParserPolicyControl[],
  approvedControlCount: number,
  requiredControlCount: number
): DocumentParserPolicyReport["overallStatus"] {
  if (hasBlockedMetadata || requiredControls.some((control) => control.status === "blocked")) {
    return "blocked";
  }

  return approvedControlCount === requiredControlCount ? "ready" : "needs-policy";
}

function createExternalDocumentParsingStatus(
  status: DocumentParserPolicyReport["overallStatus"]
): DocumentParserPolicyReport["externalDocumentParsingStatus"] {
  if (status === "blocked") {
    return "blocked-by-metadata";
  }

  if (status === "ready") {
    return "policy-ready-not-enabled";
  }

  return "needs-policy";
}

function createNextActions(status: DocumentParserPolicyReport["overallStatus"], controls: DocumentParserPolicyControl[]): string[] {
  if (status === "blocked") {
    return ["Remove blocked data classes and resolve retention/export blockers before document parser adapter review."];
  }

  if (status === "ready") {
    return ["Keep external document parsing disabled until a separate raw-document adapter enablement review."];
  }

  return controls
    .filter((control) => control.id !== "metadata-boundary" && control.status !== "ready")
    .map((control) => `${control.label}: ${control.recoveryAction}`);
}

function requestsFinalLegalDecision(value: string): boolean {
  return /\b(final\s+legal\s+decision|legal\s+opinion|legal\s+advice|approve\s+launch|approval\s+decision)\b/i.test(value);
}

function isSha256(value: string | undefined): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}
