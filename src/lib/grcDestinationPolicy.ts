import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification.js";

type GrcDestinationPolicyStatus = "ready" | "needs-policy" | "blocked" | "disabled";

export type GrcDestinationExportSafetyStatus = "clean" | "needs-review" | "blocked";

export type GrcDestinationIntegrationAdapterStatus = "ready" | "needs-policy" | "blocked" | "disabled";

export type GrcDestinationPolicyContext = {
  workspaceId: string;
  remediationItemCount: number;
  exportSafetyStatus: GrcDestinationExportSafetyStatus;
  exportBlockerCount: number;
  integrationAdapterStatus: GrcDestinationIntegrationAdapterStatus;
  localTicketExportAvailable: boolean;
};

export type GrcDestinationPolicyDraft = {
  policyOwner: string;
  destinationSystem: string;
  destinationQueue: string;
  fieldMappingApproved: boolean;
  authenticationPolicyApproved: boolean;
  redactionPolicyApproved: boolean;
  ticketOwnershipApproved: boolean;
  retryAndAuditLoggingApproved: boolean;
  noSensitiveMaterialConfirmed: boolean;
  humanReviewRequired: boolean;
  notes: string;
};

export type GrcDestinationPolicyControlId =
  | "metadata-boundary"
  | "export-safety"
  | "remediation-queue"
  | "adapter-readiness"
  | "destination-scope"
  | "field-mapping"
  | "authentication-policy"
  | "redaction-policy"
  | "ticket-ownership"
  | "retry-audit-logging"
  | "human-review-enforcement";

export type GrcDestinationPolicyControl = {
  id: GrcDestinationPolicyControlId;
  label: string;
  status: GrcDestinationPolicyStatus;
  evidence: string;
  recoveryAction: string;
};

export type GrcDestinationPolicyReport = {
  reportVersion: "lexproof-grc-destination-policy-v1";
  generatedAt: string;
  overallStatus: Extract<GrcDestinationPolicyStatus, "ready" | "needs-policy" | "blocked">;
  requiredControlCount: number;
  approvedControlCount: number;
  externalGrcTicketCreationAllowed: false;
  externalGrcTicketCreationStatus: "needs-policy" | "policy-ready-not-enabled" | "blocked-by-metadata";
  exportMode: "metadata-only-json";
  controls: GrcDestinationPolicyControl[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. GRC destination policy is audit preparation metadata only.";
};

export type CreateGrcDestinationPolicyReportInput = {
  context: GrcDestinationPolicyContext;
  policy: GrcDestinationPolicyDraft;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. GRC destination policy is audit preparation metadata only." as const;
const blockedPolicyMetadataClasses = new Set(["credential-material", "private-key-material", "raw-kyc"]);

export function createGrcDestinationPolicyReport(
  input: CreateGrcDestinationPolicyReportInput,
  generatedAt = new Date().toISOString()
): GrcDestinationPolicyReport {
  const normalizedContext = normalizeContext(input.context);
  const normalizedPolicy = normalizePolicyDraft(input.policy);
  const rawPolicyText = [
    input.policy.policyOwner,
    input.policy.destinationSystem,
    input.policy.destinationQueue,
    input.policy.notes
  ].join(" ");
  const metadataFindings = classifyDataBoundaryText(rawPolicyText);
  const hasBlockedMetadata =
    metadataFindings.some((finding) => blockedPolicyMetadataClasses.has(finding.dataClass)) ||
    requestsExternalTicketWrite(rawPolicyText);
  const controls = createControls(normalizedContext, normalizedPolicy, hasBlockedMetadata);
  const requiredControls = controls.filter((control) => control.id !== "metadata-boundary");
  const requiredControlCount = requiredControls.length;
  const approvedControlCount = requiredControls.filter((control) => control.status === "ready").length;
  const overallStatus = createOverallStatus(hasBlockedMetadata, requiredControls, approvedControlCount, requiredControlCount);

  return {
    reportVersion: "lexproof-grc-destination-policy-v1",
    generatedAt,
    overallStatus,
    requiredControlCount,
    approvedControlCount,
    externalGrcTicketCreationAllowed: false,
    externalGrcTicketCreationStatus: createExternalGrcTicketCreationStatus(overallStatus),
    exportMode: "metadata-only-json",
    controls,
    nextActions: createNextActions(overallStatus, controls),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportGrcDestinationPolicyJson(report: GrcDestinationPolicyReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function normalizeContext(context: GrcDestinationPolicyContext): GrcDestinationPolicyContext {
  return {
    workspaceId: sanitize(context.workspaceId),
    remediationItemCount: Number.isFinite(context.remediationItemCount)
      ? Math.max(0, Math.trunc(context.remediationItemCount))
      : 0,
    exportSafetyStatus: isExportSafetyStatus(context.exportSafetyStatus) ? context.exportSafetyStatus : "needs-review",
    exportBlockerCount: Number.isFinite(context.exportBlockerCount) ? Math.max(0, Math.trunc(context.exportBlockerCount)) : 0,
    integrationAdapterStatus: isAdapterStatus(context.integrationAdapterStatus) ? context.integrationAdapterStatus : "blocked",
    localTicketExportAvailable: context.localTicketExportAvailable === true
  };
}

function normalizePolicyDraft(policy: GrcDestinationPolicyDraft): GrcDestinationPolicyDraft {
  return {
    policyOwner: sanitize(policy.policyOwner),
    destinationSystem: sanitize(policy.destinationSystem),
    destinationQueue: sanitize(policy.destinationQueue),
    fieldMappingApproved: policy.fieldMappingApproved === true,
    authenticationPolicyApproved: policy.authenticationPolicyApproved === true,
    redactionPolicyApproved: policy.redactionPolicyApproved === true,
    ticketOwnershipApproved: policy.ticketOwnershipApproved === true,
    retryAndAuditLoggingApproved: policy.retryAndAuditLoggingApproved === true,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: sanitize(policy.notes)
  };
}

function createControls(
  context: GrcDestinationPolicyContext,
  policy: GrcDestinationPolicyDraft,
  hasBlockedMetadata: boolean
): GrcDestinationPolicyControl[] {
  return [
    {
      id: "metadata-boundary",
      label: "Policy metadata boundary",
      status: hasBlockedMetadata ? "blocked" : "ready",
      evidence: hasBlockedMetadata
        ? "Policy metadata contains blocked secret, private-key, raw KYC, personal-data, or external ticket-write references."
        : "Policy metadata is limited to destination readiness details and excludes credentials, raw ticket bodies, raw KYC, and external write payloads.",
      recoveryAction: hasBlockedMetadata
        ? "Remove credentials, private keys, raw KYC, personal data, and external ticket-write instructions from destination policy metadata."
        : "Keep destination policy metadata free of credentials, private keys, raw KYC, personal data, raw ticket bodies, and write instructions."
    },
    {
      id: "export-safety",
      label: "Export safety gate",
      status: createExportSafetyStatus(context),
      evidence: createExportSafetyEvidence(context),
      recoveryAction: "Resolve Export Safety blockers before any GRC destination adapter review."
    },
    {
      id: "remediation-queue",
      label: "Remediation queue",
      status: context.remediationItemCount > 0 ? "ready" : "needs-policy",
      evidence:
        context.remediationItemCount > 0
          ? `${context.remediationItemCount} remediation item${context.remediationItemCount === 1 ? "" : "s"} available for metadata-only ticket routing.`
          : "No remediation queue items are available for GRC destination review.",
      recoveryAction: "Run Risk Audit and create remediation queue items before destination policy approval."
    },
    {
      id: "adapter-readiness",
      label: "Local ticket export readiness",
      status: createAdapterReadinessStatus(context),
      evidence: createAdapterReadinessEvidence(context),
      recoveryAction: "Keep local GRC ticket export available before reviewing any external destination adapter."
    },
    {
      id: "destination-scope",
      label: "Destination scope",
      status: createDestinationScopeStatus(policy),
      evidence:
        policy.destinationSystem.trim() && policy.destinationQueue.trim() && !requestsExternalTicketWrite(policy.destinationQueue)
          ? "Destination system and queue are defined for future adapter review."
          : "Destination system and queue must be defined without requesting external ticket creation.",
      recoveryAction: "Document destination system and queue as metadata only; do not enter webhook URLs, ticket payloads, or write commands."
    },
    {
      id: "field-mapping",
      label: "Field mapping",
      status: policy.fieldMappingApproved ? "ready" : "needs-policy",
      evidence: policy.fieldMappingApproved
        ? "Field mapping is approved for future GRC destination review."
        : "Destination field mapping is not approved.",
      recoveryAction: "Approve how risk flags, remediation owners, and manifest hashes map to destination fields."
    },
    {
      id: "authentication-policy",
      label: "Authentication policy",
      status: policy.authenticationPolicyApproved ? "ready" : "needs-policy",
      evidence: policy.authenticationPolicyApproved
        ? "Authentication policy is approved without collecting credentials in the browser."
        : "Authentication policy is not approved.",
      recoveryAction: "Approve server-side credential custody and never paste API keys or webhook secrets into this workspace."
    },
    {
      id: "redaction-policy",
      label: "Export redaction",
      status: policy.redactionPolicyApproved && policy.noSensitiveMaterialConfirmed ? "ready" : "needs-policy",
      evidence:
        policy.redactionPolicyApproved && policy.noSensitiveMaterialConfirmed
          ? "Export redaction is approved and sensitive material exclusion is confirmed."
          : "Export redaction and sensitive material exclusion must both be approved.",
      recoveryAction: "Confirm destination exports are metadata-only and exclude raw evidence, raw KYC, personal data, and legal conclusions."
    },
    {
      id: "ticket-ownership",
      label: "Ticket ownership",
      status: policy.ticketOwnershipApproved ? "ready" : "needs-policy",
      evidence: policy.ticketOwnershipApproved
        ? "Ticket ownership is approved for future GRC destination review."
        : "Ticket ownership is not approved.",
      recoveryAction: "Assign queue owners and escalation owners before destination adapter enablement."
    },
    {
      id: "retry-audit-logging",
      label: "Retry and audit logging",
      status: policy.retryAndAuditLoggingApproved ? "ready" : "needs-policy",
      evidence: policy.retryAndAuditLoggingApproved
        ? "Retry and audit logging are approved for future GRC destination review."
        : "Retry and audit logging are not approved.",
      recoveryAction: "Approve retry limits, failure capture, and audit log retention before destination adapter enablement."
    },
    {
      id: "human-review-enforcement",
      label: "Human review enforcement",
      status: policy.humanReviewRequired ? "ready" : "needs-policy",
      evidence: policy.humanReviewRequired
        ? "Human review is mandatory before any external GRC destination reliance."
        : "Human review must be mandatory before destination policy can be relied on.",
      recoveryAction: "Require human review for destination mapping, rejected exports, and future adapter enablement."
    }
  ];
}

function createExportSafetyStatus(context: GrcDestinationPolicyContext): GrcDestinationPolicyControl["status"] {
  if (context.exportSafetyStatus === "blocked" || context.exportBlockerCount > 0) {
    return "blocked";
  }

  return context.exportSafetyStatus === "clean" ? "ready" : "needs-policy";
}

function createExportSafetyEvidence(context: GrcDestinationPolicyContext): string {
  if (context.exportSafetyStatus === "blocked" || context.exportBlockerCount > 0) {
    const blockers = Math.max(context.exportBlockerCount, 1);
    return `${blockers} export blocker${blockers === 1 ? "" : "s"} must be remediated before GRC destination review.`;
  }

  if (context.exportSafetyStatus === "clean") {
    return "Export Safety Gate is clean for metadata-only remediation routing.";
  }

  return "Export Safety Gate needs human review before GRC destination policy approval.";
}

function createAdapterReadinessStatus(context: GrcDestinationPolicyContext): GrcDestinationPolicyControl["status"] {
  if (context.integrationAdapterStatus === "blocked") {
    return "blocked";
  }

  if (context.integrationAdapterStatus === "disabled") {
    return "disabled";
  }

  return context.localTicketExportAvailable || context.integrationAdapterStatus === "ready" ? "ready" : "needs-policy";
}

function createAdapterReadinessEvidence(context: GrcDestinationPolicyContext): string {
  if (context.integrationAdapterStatus === "blocked") {
    return "GRC ticket export adapter has blocking readiness issues.";
  }

  if (context.integrationAdapterStatus === "disabled") {
    return "GRC ticket export adapter is disabled because no remediation queue is available.";
  }

  if (context.localTicketExportAvailable || context.integrationAdapterStatus === "ready") {
    return "Local metadata-only GRC ticket export is available for destination policy review.";
  }

  return "GRC ticket export adapter still needs policy approval.";
}

function createDestinationScopeStatus(policy: GrcDestinationPolicyDraft): GrcDestinationPolicyControl["status"] {
  if (requestsExternalTicketWrite(`${policy.destinationSystem} ${policy.destinationQueue}`)) {
    return "blocked";
  }

  return policy.destinationSystem.trim() && policy.destinationQueue.trim() ? "ready" : "needs-policy";
}

function createOverallStatus(
  hasBlockedMetadata: boolean,
  requiredControls: GrcDestinationPolicyControl[],
  approvedControlCount: number,
  requiredControlCount: number
): GrcDestinationPolicyReport["overallStatus"] {
  if (hasBlockedMetadata || requiredControls.some((control) => control.status === "blocked")) {
    return "blocked";
  }

  return approvedControlCount === requiredControlCount ? "ready" : "needs-policy";
}

function createExternalGrcTicketCreationStatus(
  status: GrcDestinationPolicyReport["overallStatus"]
): GrcDestinationPolicyReport["externalGrcTicketCreationStatus"] {
  if (status === "blocked") {
    return "blocked-by-metadata";
  }

  if (status === "ready") {
    return "policy-ready-not-enabled";
  }

  return "needs-policy";
}

function createNextActions(status: GrcDestinationPolicyReport["overallStatus"], controls: GrcDestinationPolicyControl[]): string[] {
  if (status === "blocked") {
    return ["Remove blocked destination metadata and resolve export safety blockers before GRC destination adapter review."];
  }

  if (status === "ready") {
    return ["Keep external GRC ticket creation disabled until a separate destination adapter enablement review."];
  }

  return controls
    .filter((control) => control.id !== "metadata-boundary" && control.status !== "ready")
    .map((control) => `${control.label}: ${control.recoveryAction}`);
}

function requestsExternalTicketWrite(value: string): boolean {
  return /\b(create|open|submit|sync|push|send|write)\s+(?:real\s+|external\s+)?(?:jira\s+|linear\s+|servicenow\s+|grc\s+)?tickets?\b|\b(?:external\s+ticket\s+creation|create\s+external\s+(?:jira\s+)?tickets?)\b/i.test(
    value
  );
}

function isExportSafetyStatus(value: unknown): value is GrcDestinationExportSafetyStatus {
  return value === "clean" || value === "needs-review" || value === "blocked";
}

function isAdapterStatus(value: unknown): value is GrcDestinationIntegrationAdapterStatus {
  return value === "ready" || value === "needs-policy" || value === "blocked" || value === "disabled";
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}
