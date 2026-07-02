import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification.js";
import type { ModelGatewayProviderPolicyStatus } from "./modelGatewayProviderPolicy.js";

export type ModelGatewaySecretPolicyAccessReviewCadence = "none" | "monthly" | "quarterly" | "annual";

export type ModelGatewaySecretPolicyDraft = {
  policyOwner: string;
  kmsBackedStorageApproved: boolean;
  rotationDays: number;
  accessReviewCadence: ModelGatewaySecretPolicyAccessReviewCadence;
  providerAllowlistApproved: boolean;
  egressLoggingApproved: boolean;
  incidentResponseRunbookApproved: boolean;
  noClientSecretPersistence: boolean;
  humanReviewRequired: boolean;
  notes: string;
};

export type ModelGatewaySecretPolicyControlId =
  | "metadata-boundary"
  | "kms-secret-storage"
  | "secret-rotation"
  | "access-review"
  | "provider-allowlist"
  | "egress-logging"
  | "no-client-persistence"
  | "human-review-enforcement";

export type ModelGatewaySecretPolicyControl = {
  id: ModelGatewaySecretPolicyControlId;
  label: string;
  status: ModelGatewayProviderPolicyStatus;
  evidence: string;
  recoveryAction: string;
};

export type ModelGatewaySecretPolicyReport = {
  reportVersion: "lexproof-model-gateway-secret-policy-v1";
  generatedAt: string;
  overallStatus: Extract<ModelGatewayProviderPolicyStatus, "ready" | "needs-policy" | "blocked">;
  requiredControlCount: number;
  approvedControlCount: number;
  externalProviderProxyingAllowed: false;
  externalProviderProxyingStatus: "needs-policy" | "policy-ready-not-enabled" | "blocked-by-metadata";
  controls: ModelGatewaySecretPolicyControl[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Model Gateway secret policy is audit preparation metadata only.";
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Model Gateway secret policy is audit preparation metadata only." as const;
const REQUIRED_CONTROL_COUNT = 7;
const blockedPolicyMetadataClasses = new Set(["credential-material", "private-key-material", "raw-kyc", "personal-data"]);

export function createModelGatewaySecretPolicyReport(
  input: ModelGatewaySecretPolicyDraft,
  generatedAt = new Date().toISOString()
): ModelGatewaySecretPolicyReport {
  const rawPolicyText = `${input.policyOwner} ${input.notes}`;
  const normalized = normalizePolicyDraft(input);
  const metadataFindings = classifyDataBoundaryText(rawPolicyText);
  const hasBlockedMetadata = metadataFindings.some((finding) => blockedPolicyMetadataClasses.has(finding.dataClass));
  const controls = createControls(normalized, hasBlockedMetadata);
  const requiredControls = controls.filter((control) => control.id !== "metadata-boundary");
  const approvedControlCount = requiredControls.filter((control) => control.status === "ready").length;
  const overallStatus = createOverallStatus(hasBlockedMetadata, approvedControlCount);

  return {
    reportVersion: "lexproof-model-gateway-secret-policy-v1",
    generatedAt,
    overallStatus,
    requiredControlCount: REQUIRED_CONTROL_COUNT,
    approvedControlCount,
    externalProviderProxyingAllowed: false,
    externalProviderProxyingStatus: createProxyingStatus(overallStatus),
    controls,
    nextActions: createNextActions(overallStatus, controls),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportModelGatewaySecretPolicyJson(report: ModelGatewaySecretPolicyReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function normalizePolicyDraft(input: ModelGatewaySecretPolicyDraft): ModelGatewaySecretPolicyDraft {
  return {
    policyOwner: sanitize(input.policyOwner),
    kmsBackedStorageApproved: input.kmsBackedStorageApproved === true,
    rotationDays: Number.isFinite(input.rotationDays) ? Math.max(0, Math.trunc(input.rotationDays)) : 0,
    accessReviewCadence: input.accessReviewCadence,
    providerAllowlistApproved: input.providerAllowlistApproved === true,
    egressLoggingApproved: input.egressLoggingApproved === true,
    incidentResponseRunbookApproved: input.incidentResponseRunbookApproved === true,
    noClientSecretPersistence: input.noClientSecretPersistence === true,
    humanReviewRequired: input.humanReviewRequired === true,
    notes: sanitize(input.notes)
  };
}

function createControls(input: ModelGatewaySecretPolicyDraft, hasBlockedMetadata: boolean): ModelGatewaySecretPolicyControl[] {
  const controls: ModelGatewaySecretPolicyControl[] = [
    {
      id: "metadata-boundary",
      label: "Policy metadata boundary",
      status: hasBlockedMetadata ? "blocked" : "ready",
      evidence: hasBlockedMetadata
        ? "Policy metadata contains blocked secret, private-key, raw KYC, or personal-data references."
        : "Policy metadata is limited to audit-prep routing details and excludes provider credentials.",
      recoveryAction: hasBlockedMetadata
        ? "Remove credentials, private keys, raw KYC, and personal data from policy metadata."
        : "Keep policy metadata free of credentials, private keys, raw KYC, and personal data."
    },
    {
      id: "kms-secret-storage",
      label: "KMS-backed secret storage",
      status: input.kmsBackedStorageApproved ? "ready" : "needs-policy",
      evidence: input.kmsBackedStorageApproved
        ? "KMS-backed provider credential storage is approved for future server gateway review."
        : "KMS-backed provider credential storage has not been approved.",
      recoveryAction: input.kmsBackedStorageApproved
        ? "Keep KMS-backed secret storage mandatory before adapter enablement."
        : "Approve KMS-backed storage, scoped access, and no raw secret echoing before external provider proxying."
    },
    {
      id: "secret-rotation",
      label: "Secret rotation",
      status: input.rotationDays > 0 && input.rotationDays <= 90 ? "ready" : "needs-policy",
      evidence:
        input.rotationDays > 0 && input.rotationDays <= 90
          ? `Secret rotation is set to every ${input.rotationDays} days.`
          : "Secret rotation must be set to 90 days or less.",
      recoveryAction: "Define secret rotation at 90 days or less before external provider proxying."
    },
    {
      id: "access-review",
      label: "Access review",
      status: input.accessReviewCadence === "monthly" || input.accessReviewCadence === "quarterly" ? "ready" : "needs-policy",
      evidence:
        input.accessReviewCadence === "monthly" || input.accessReviewCadence === "quarterly"
          ? `Access review cadence is ${input.accessReviewCadence}.`
          : "Access review cadence must be monthly or quarterly.",
      recoveryAction: "Set a monthly or quarterly access review cadence for model provider secret access."
    },
    {
      id: "provider-allowlist",
      label: "Provider allowlist",
      status: input.providerAllowlistApproved ? "ready" : "needs-policy",
      evidence: input.providerAllowlistApproved
        ? "Provider allowlist is approved for future server gateway review."
        : "Provider allowlist is not approved.",
      recoveryAction: "Approve provider destinations, model IDs, jurisdiction routing, and data-class limits."
    },
    {
      id: "egress-logging",
      label: "Egress logging",
      status: input.egressLoggingApproved && input.incidentResponseRunbookApproved ? "ready" : "needs-policy",
      evidence:
        input.egressLoggingApproved && input.incidentResponseRunbookApproved
          ? "Metadata-only egress logging and incident response runbook are approved."
          : "Metadata-only egress logging and incident response runbook are not both approved.",
      recoveryAction: "Approve metadata-only egress logs, retry limits, incident response, and receipt retention."
    },
    {
      id: "no-client-persistence",
      label: "No client secret persistence",
      status: input.noClientSecretPersistence ? "ready" : "needs-policy",
      evidence: input.noClientSecretPersistence
        ? "Policy forbids browser persistence of provider credentials."
        : "Policy must explicitly forbid browser persistence of provider credentials.",
      recoveryAction: "Require session-only client handling and server-side secret storage before future external calls."
    },
    {
      id: "human-review-enforcement",
      label: "Human review enforcement",
      status: input.humanReviewRequired ? "ready" : "needs-policy",
      evidence: input.humanReviewRequired
        ? "Model output remains draft audit preparation and requires human review."
        : "Human review must be mandatory before model output enters counsel handoff.",
      recoveryAction: "Require human review before any model output is used in audit-prep exports."
    }
  ];

  return controls;
}

function createOverallStatus(hasBlockedMetadata: boolean, approvedControlCount: number): ModelGatewaySecretPolicyReport["overallStatus"] {
  if (hasBlockedMetadata) {
    return "blocked";
  }

  return approvedControlCount === REQUIRED_CONTROL_COUNT ? "ready" : "needs-policy";
}

function createProxyingStatus(status: ModelGatewaySecretPolicyReport["overallStatus"]): ModelGatewaySecretPolicyReport["externalProviderProxyingStatus"] {
  if (status === "blocked") {
    return "blocked-by-metadata";
  }

  if (status === "ready") {
    return "policy-ready-not-enabled";
  }

  return "needs-policy";
}

function createNextActions(
  status: ModelGatewaySecretPolicyReport["overallStatus"],
  controls: ModelGatewaySecretPolicyControl[]
): string[] {
  if (status === "blocked") {
    return ["Remove credentials, private keys, raw KYC, and personal data from policy metadata."];
  }

  if (status === "ready") {
    return ["Keep external provider proxying disabled until an adapter enablement change is reviewed."];
  }

  return controls
    .filter((control) => control.id !== "metadata-boundary" && control.status !== "ready")
    .map((control) => `${control.label}: ${control.recoveryAction}`);
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}
