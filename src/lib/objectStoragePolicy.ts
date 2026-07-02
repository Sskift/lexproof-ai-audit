import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification.js";

type ObjectStoragePolicyStatus = "ready" | "needs-policy" | "blocked" | "disabled";
type ObjectStorageRetentionStatus = "ready" | "needs-review" | "blocked";

export type ObjectStoragePolicyContext = {
  workspaceId: string;
  evidenceCount: number;
  retentionStatus: ObjectStorageRetentionStatus;
  vaultSyncAllowed: boolean;
  blockerCount: number;
  manifestHash?: string;
};

export type ObjectStoragePolicyDraft = {
  policyOwner: string;
  retentionDays: number;
  deletionSlaDays: number;
  encryptionAtRestApproved: boolean;
  bucketAllowlistApproved: boolean;
  accessLoggingApproved: boolean;
  lifecyclePolicyApproved: boolean;
  noSensitiveMaterialConfirmed: boolean;
  humanReviewRequired: boolean;
  notes: string;
};

export type ObjectStoragePolicyControlId =
  | "metadata-boundary"
  | "retention-boundary"
  | "manifest-linkage"
  | "retention-window"
  | "deletion-sla"
  | "encryption-at-rest"
  | "bucket-allowlist"
  | "access-logging"
  | "lifecycle-policy"
  | "no-sensitive-material"
  | "human-review-enforcement";

export type ObjectStoragePolicyControl = {
  id: ObjectStoragePolicyControlId;
  label: string;
  status: ObjectStoragePolicyStatus;
  evidence: string;
  recoveryAction: string;
};

export type ObjectStoragePolicyReport = {
  reportVersion: "lexproof-object-storage-policy-v1";
  generatedAt: string;
  overallStatus: Extract<ObjectStoragePolicyStatus, "ready" | "needs-policy" | "blocked">;
  requiredControlCount: number;
  approvedControlCount: number;
  externalObjectStorageAllowed: false;
  externalObjectStorageStatus: "needs-policy" | "policy-ready-not-enabled" | "blocked-by-metadata";
  controls: ObjectStoragePolicyControl[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Object storage policy is audit preparation metadata only.";
};

export type CreateObjectStoragePolicyReportInput = {
  context: ObjectStoragePolicyContext;
  policy: ObjectStoragePolicyDraft;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Object storage policy is audit preparation metadata only." as const;
const blockedPolicyMetadataClasses = new Set(["credential-material", "private-key-material", "raw-kyc", "personal-data"]);

export function createObjectStoragePolicyReport(
  input: CreateObjectStoragePolicyReportInput,
  generatedAt = new Date().toISOString()
): ObjectStoragePolicyReport {
  const normalizedContext = normalizeContext(input.context);
  const normalizedPolicy = normalizePolicyDraft(input.policy);
  const metadataFindings = classifyDataBoundaryText(`${input.policy.policyOwner} ${input.policy.notes}`);
  const hasBlockedMetadata = metadataFindings.some((finding) => blockedPolicyMetadataClasses.has(finding.dataClass));
  const controls = createControls(normalizedContext, normalizedPolicy, hasBlockedMetadata);
  const requiredControls = controls.filter((control) => control.id !== "metadata-boundary");
  const requiredControlCount = requiredControls.length;
  const approvedControlCount = requiredControls.filter((control) => control.status === "ready").length;
  const overallStatus = createOverallStatus(hasBlockedMetadata, requiredControls, approvedControlCount, requiredControlCount);

  return {
    reportVersion: "lexproof-object-storage-policy-v1",
    generatedAt,
    overallStatus,
    requiredControlCount,
    approvedControlCount,
    externalObjectStorageAllowed: false,
    externalObjectStorageStatus: createExternalStorageStatus(overallStatus),
    controls,
    nextActions: createNextActions(overallStatus, controls),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportObjectStoragePolicyJson(report: ObjectStoragePolicyReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function normalizeContext(context: ObjectStoragePolicyContext): ObjectStoragePolicyContext {
  return {
    workspaceId: sanitize(context.workspaceId),
    evidenceCount: Number.isFinite(context.evidenceCount) ? Math.max(0, Math.trunc(context.evidenceCount)) : 0,
    retentionStatus:
      context.retentionStatus === "ready" || context.retentionStatus === "needs-review" || context.retentionStatus === "blocked"
        ? context.retentionStatus
        : "needs-review",
    vaultSyncAllowed: context.vaultSyncAllowed === true,
    blockerCount: Number.isFinite(context.blockerCount) ? Math.max(0, Math.trunc(context.blockerCount)) : 0,
    manifestHash: isSha256(context.manifestHash) ? context.manifestHash.toLowerCase() : undefined
  };
}

function normalizePolicyDraft(policy: ObjectStoragePolicyDraft): ObjectStoragePolicyDraft {
  return {
    policyOwner: sanitize(policy.policyOwner),
    retentionDays: Number.isFinite(policy.retentionDays) ? Math.max(0, Math.trunc(policy.retentionDays)) : 0,
    deletionSlaDays: Number.isFinite(policy.deletionSlaDays) ? Math.max(0, Math.trunc(policy.deletionSlaDays)) : 0,
    encryptionAtRestApproved: policy.encryptionAtRestApproved === true,
    bucketAllowlistApproved: policy.bucketAllowlistApproved === true,
    accessLoggingApproved: policy.accessLoggingApproved === true,
    lifecyclePolicyApproved: policy.lifecyclePolicyApproved === true,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: sanitize(policy.notes)
  };
}

function createControls(
  context: ObjectStoragePolicyContext,
  policy: ObjectStoragePolicyDraft,
  hasBlockedMetadata: boolean
): ObjectStoragePolicyControl[] {
  return [
    {
      id: "metadata-boundary",
      label: "Policy metadata boundary",
      status: hasBlockedMetadata ? "blocked" : "ready",
      evidence: hasBlockedMetadata
        ? "Policy metadata contains blocked secret, private-key, raw KYC, or personal-data references."
        : "Policy metadata is limited to storage routing details and excludes raw evidence bytes.",
      recoveryAction: hasBlockedMetadata
        ? "Remove credentials, private keys, raw KYC, and personal data from object storage policy metadata."
        : "Keep policy metadata free of credentials, private keys, raw KYC, personal data, and raw evidence content."
    },
    {
      id: "retention-boundary",
      label: "Retention boundary",
      status: createRetentionStatus(context),
      evidence: createRetentionEvidence(context),
      recoveryAction: "Resolve Evidence Retention blockers and keep vault sync metadata-only before any storage adapter enablement."
    },
    {
      id: "manifest-linkage",
      label: "Manifest linkage",
      status: context.manifestHash ? "ready" : "needs-policy",
      evidence: context.manifestHash
        ? `Evidence Manifest ${context.manifestHash.slice(0, 12)}... is available for storage handoff.`
        : "Evidence Manifest bundle hash is required before object storage review.",
      recoveryAction: "Generate an Evidence Manifest and server Vault Manifest before object storage adapter review."
    },
    {
      id: "retention-window",
      label: "Retention window",
      status: policy.retentionDays > 0 && policy.retentionDays <= 1095 ? "ready" : "needs-policy",
      evidence:
        policy.retentionDays > 0 && policy.retentionDays <= 1095
          ? `Retention window is set to ${policy.retentionDays} days.`
          : "Retention window must be defined and limited to 1095 days or less.",
      recoveryAction: "Define a bounded retention window before external object storage."
    },
    {
      id: "deletion-sla",
      label: "Deletion SLA",
      status: policy.deletionSlaDays > 0 && policy.deletionSlaDays <= 30 ? "ready" : "needs-policy",
      evidence:
        policy.deletionSlaDays > 0 && policy.deletionSlaDays <= 30
          ? `Deletion SLA is set to ${policy.deletionSlaDays} days.`
          : "Deletion SLA must be 30 days or less.",
      recoveryAction: "Define deletion, supersession, and workspace-deletion triggers before external storage."
    },
    {
      id: "encryption-at-rest",
      label: "Encryption at rest",
      status: policy.encryptionAtRestApproved ? "ready" : "needs-policy",
      evidence: policy.encryptionAtRestApproved
        ? "Encryption at rest is approved for future object storage review."
        : "Encryption at rest is not approved.",
      recoveryAction: "Approve encryption at rest and key ownership before storage adapter enablement."
    },
    {
      id: "bucket-allowlist",
      label: "Bucket allowlist",
      status: policy.bucketAllowlistApproved ? "ready" : "needs-policy",
      evidence: policy.bucketAllowlistApproved ? "Bucket allowlist is approved." : "Bucket allowlist is not approved.",
      recoveryAction: "Approve allowed buckets, regions, tenant scope, and destination labels before storage adapter enablement."
    },
    {
      id: "access-logging",
      label: "Access logging",
      status: policy.accessLoggingApproved ? "ready" : "needs-policy",
      evidence: policy.accessLoggingApproved
        ? "Metadata-only access logging is approved."
        : "Metadata-only access logging is not approved.",
      recoveryAction: "Approve metadata-only access logs, actor IDs, and audit-log retention before storage adapter enablement."
    },
    {
      id: "lifecycle-policy",
      label: "Lifecycle policy",
      status: policy.lifecyclePolicyApproved ? "ready" : "needs-policy",
      evidence: policy.lifecyclePolicyApproved
        ? "Object lifecycle policy is approved."
        : "Object lifecycle policy is not approved.",
      recoveryAction: "Approve object versioning, supersession, deletion, and recovery lifecycle controls."
    },
    {
      id: "no-sensitive-material",
      label: "No sensitive material",
      status: policy.noSensitiveMaterialConfirmed ? "ready" : "needs-policy",
      evidence: policy.noSensitiveMaterialConfirmed
        ? "Policy confirms raw KYC, private keys, credentials, and personal data stay out of storage handoff."
        : "Policy must confirm blocked data classes stay out of storage handoff.",
      recoveryAction: "Confirm storage handoff stays metadata-only unless a reviewed raw-document policy exists."
    },
    {
      id: "human-review-enforcement",
      label: "Human review enforcement",
      status: policy.humanReviewRequired ? "ready" : "needs-policy",
      evidence: policy.humanReviewRequired
        ? "Storage handoff requires human review before external reliance."
        : "Human review must be mandatory before storage handoff.",
      recoveryAction: "Require human review for storage adapter changes and exception handling."
    }
  ];
}

function createRetentionStatus(context: ObjectStoragePolicyContext): ObjectStoragePolicyControl["status"] {
  if (context.retentionStatus === "blocked" || context.blockerCount > 0) {
    return "blocked";
  }

  if (context.retentionStatus === "ready" && context.vaultSyncAllowed && context.evidenceCount > 0) {
    return "ready";
  }

  return "needs-policy";
}

function createRetentionEvidence(context: ObjectStoragePolicyContext): string {
  if (context.retentionStatus === "blocked" || context.blockerCount > 0) {
    return `${context.blockerCount || 1} retention blocker${context.blockerCount === 1 ? "" : "s"} must be remediated before storage review.`;
  }

  if (context.evidenceCount === 0) {
    return "No metadata-only evidence records are available for object storage review.";
  }

  if (context.retentionStatus === "ready" && context.vaultSyncAllowed) {
    return `${context.evidenceCount} metadata-only evidence record${context.evidenceCount === 1 ? "" : "s"} passed retention blockers.`;
  }

  return "Evidence Retention Readiness still needs review before object storage policy approval.";
}

function createOverallStatus(
  hasBlockedMetadata: boolean,
  requiredControls: ObjectStoragePolicyControl[],
  approvedControlCount: number,
  requiredControlCount: number
): ObjectStoragePolicyReport["overallStatus"] {
  if (hasBlockedMetadata || requiredControls.some((control) => control.status === "blocked")) {
    return "blocked";
  }

  return approvedControlCount === requiredControlCount ? "ready" : "needs-policy";
}

function createExternalStorageStatus(status: ObjectStoragePolicyReport["overallStatus"]): ObjectStoragePolicyReport["externalObjectStorageStatus"] {
  if (status === "blocked") {
    return "blocked-by-metadata";
  }

  if (status === "ready") {
    return "policy-ready-not-enabled";
  }

  return "needs-policy";
}

function createNextActions(status: ObjectStoragePolicyReport["overallStatus"], controls: ObjectStoragePolicyControl[]): string[] {
  if (status === "blocked") {
    return ["Remove blocked data classes and resolve retention blockers before object storage adapter review."];
  }

  if (status === "ready") {
    return ["Keep external object storage disabled until a separate storage adapter enablement review."];
  }

  return controls
    .filter((control) => control.id !== "metadata-boundary" && control.status !== "ready")
    .map((control) => `${control.label}: ${control.recoveryAction}`);
}

function isSha256(value: string | undefined): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}
