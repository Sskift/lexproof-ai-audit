import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification.js";

type ChainAnchorPolicyStatus = "ready" | "needs-policy" | "blocked" | "disabled";
type ChainAnchorRetentionStatus = "ready" | "needs-review" | "blocked";

export type ChainAnchorPolicyContext = {
  workspaceId: string;
  evidenceCount: number;
  retentionStatus: ChainAnchorRetentionStatus;
  vaultSyncAllowed: boolean;
  blockerCount: number;
  exportBlockerCount: number;
  manifestHash?: string;
  counselPackVersionCount: number;
  simulatedAnchorAvailable: boolean;
};

export type ChainAnchorPolicyDraft = {
  policyOwner: string;
  targetNetwork: string;
  walletCustodyModel: string;
  signerRole: string;
  transactionLoggingApproved: boolean;
  privacyReviewApproved: boolean;
  publicPayloadLimitedApproved: boolean;
  userConsentApproved: boolean;
  noRawEvidenceOnChainConfirmed: boolean;
  humanReviewRequired: boolean;
  notes: string;
};

export type ChainAnchorPolicyControlId =
  | "metadata-boundary"
  | "retention-boundary"
  | "manifest-linkage"
  | "counsel-pack-version"
  | "network-scope"
  | "signing-controls"
  | "transaction-logging"
  | "privacy-review"
  | "public-payload-limit"
  | "user-consent"
  | "human-review-enforcement";

export type ChainAnchorPolicyControl = {
  id: ChainAnchorPolicyControlId;
  label: string;
  status: ChainAnchorPolicyStatus;
  evidence: string;
  recoveryAction: string;
};

export type ChainAnchorPolicyReport = {
  reportVersion: "lexproof-chain-anchor-policy-v1";
  generatedAt: string;
  overallStatus: Extract<ChainAnchorPolicyStatus, "ready" | "needs-policy" | "blocked">;
  requiredControlCount: number;
  approvedControlCount: number;
  externalChainAnchoringAllowed: false;
  externalChainAnchoringStatus: "needs-policy" | "policy-ready-not-enabled" | "blocked-by-metadata";
  anchorMode: "simulated-only";
  controls: ChainAnchorPolicyControl[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Chain anchor policy is audit preparation metadata only.";
};

export type CreateChainAnchorPolicyReportInput = {
  context: ChainAnchorPolicyContext;
  policy: ChainAnchorPolicyDraft;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Chain anchor policy is audit preparation metadata only." as const;
const blockedPolicyMetadataClasses = new Set(["credential-material", "private-key-material", "raw-kyc"]);

export function createChainAnchorPolicyReport(
  input: CreateChainAnchorPolicyReportInput,
  generatedAt = new Date().toISOString()
): ChainAnchorPolicyReport {
  const normalizedContext = normalizeContext(input.context);
  const normalizedPolicy = normalizePolicyDraft(input.policy);
  const rawPolicyText = [
    input.policy.policyOwner,
    input.policy.targetNetwork,
    input.policy.walletCustodyModel,
    input.policy.signerRole,
    input.policy.notes
  ].join(" ");
  const metadataFindings = classifyDataBoundaryText(rawPolicyText);
  const hasBlockedMetadata =
    metadataFindings.some((finding) => blockedPolicyMetadataClasses.has(finding.dataClass)) || requestsRealChainWrite(rawPolicyText);
  const controls = createControls(normalizedContext, normalizedPolicy, hasBlockedMetadata);
  const requiredControls = controls.filter((control) => control.id !== "metadata-boundary");
  const requiredControlCount = requiredControls.length;
  const approvedControlCount = requiredControls.filter((control) => control.status === "ready").length;
  const overallStatus = createOverallStatus(hasBlockedMetadata, requiredControls, approvedControlCount, requiredControlCount);

  return {
    reportVersion: "lexproof-chain-anchor-policy-v1",
    generatedAt,
    overallStatus,
    requiredControlCount,
    approvedControlCount,
    externalChainAnchoringAllowed: false,
    externalChainAnchoringStatus: createExternalChainAnchoringStatus(overallStatus),
    anchorMode: "simulated-only",
    controls,
    nextActions: createNextActions(overallStatus, controls),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportChainAnchorPolicyJson(report: ChainAnchorPolicyReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function normalizeContext(context: ChainAnchorPolicyContext): ChainAnchorPolicyContext {
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
    manifestHash: isSha256(context.manifestHash) ? context.manifestHash.toLowerCase() : undefined,
    counselPackVersionCount: Number.isFinite(context.counselPackVersionCount)
      ? Math.max(0, Math.trunc(context.counselPackVersionCount))
      : 0,
    simulatedAnchorAvailable: context.simulatedAnchorAvailable === true
  };
}

function normalizePolicyDraft(policy: ChainAnchorPolicyDraft): ChainAnchorPolicyDraft {
  return {
    policyOwner: sanitize(policy.policyOwner),
    targetNetwork: sanitize(policy.targetNetwork),
    walletCustodyModel: sanitize(policy.walletCustodyModel),
    signerRole: sanitize(policy.signerRole),
    transactionLoggingApproved: policy.transactionLoggingApproved === true,
    privacyReviewApproved: policy.privacyReviewApproved === true,
    publicPayloadLimitedApproved: policy.publicPayloadLimitedApproved === true,
    userConsentApproved: policy.userConsentApproved === true,
    noRawEvidenceOnChainConfirmed: policy.noRawEvidenceOnChainConfirmed === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: sanitize(policy.notes)
  };
}

function createControls(
  context: ChainAnchorPolicyContext,
  policy: ChainAnchorPolicyDraft,
  hasBlockedMetadata: boolean
): ChainAnchorPolicyControl[] {
  return [
    {
      id: "metadata-boundary",
      label: "Policy metadata boundary",
      status: hasBlockedMetadata ? "blocked" : "ready",
      evidence: hasBlockedMetadata
        ? "Policy metadata contains blocked secret, private-key, raw KYC, personal-data, or real chain-write references."
        : "Policy metadata is limited to anchor readiness details and excludes wallet secrets, signed transactions, and raw evidence.",
      recoveryAction: hasBlockedMetadata
        ? "Remove credentials, private keys, raw KYC, personal data, and real chain-write instructions from anchor policy metadata."
        : "Keep anchor policy metadata free of credentials, private keys, raw KYC, personal data, raw evidence, and transaction payloads."
    },
    {
      id: "retention-boundary",
      label: "Retention boundary",
      status: createRetentionStatus(context),
      evidence: createRetentionEvidence(context),
      recoveryAction: "Resolve Evidence Retention and Export Safety blockers before any chain anchor enablement review."
    },
    {
      id: "manifest-linkage",
      label: "Manifest linkage",
      status: context.manifestHash && context.simulatedAnchorAvailable ? "ready" : "needs-policy",
      evidence:
        context.manifestHash && context.simulatedAnchorAvailable
          ? "Manifest hash is available for simulated anchor review."
          : "Evidence Manifest bundle hash is required before simulated anchor review.",
      recoveryAction: "Generate an Evidence Manifest and keep chain anchoring simulated until wallet signing review."
    },
    {
      id: "counsel-pack-version",
      label: "Counsel Pack version",
      status: context.counselPackVersionCount > 0 ? "ready" : "needs-policy",
      evidence:
        context.counselPackVersionCount > 0
          ? `${context.counselPackVersionCount} Counsel Pack version${context.counselPackVersionCount === 1 ? "" : "s"} available for anchor review.`
          : "Save a Counsel Pack version before treating anchor policy as ready.",
      recoveryAction: "Save a reviewed Counsel Pack version before anchor adapter review."
    },
    {
      id: "network-scope",
      label: "Anchor network scope",
      status: policy.targetNetwork.trim() && !requestsRealChainWrite(policy.targetNetwork) ? "ready" : "needs-policy",
      evidence:
        policy.targetNetwork.trim() && !requestsRealChainWrite(policy.targetNetwork)
          ? "Anchor network is defined for future policy review."
          : "Anchor network scope must be defined without requesting a live transaction.",
      recoveryAction: "Define a testnet or reviewed network label while keeping external chain writes disabled."
    },
    {
      id: "signing-controls",
      label: "Signing controls",
      status: policy.walletCustodyModel.trim() && policy.signerRole.trim() ? "ready" : "needs-policy",
      evidence:
        policy.walletCustodyModel.trim() && policy.signerRole.trim()
          ? "Wallet custody and signer role are described without collecting signing material."
          : "Wallet custody model and signer role are required before chain anchor review.",
      recoveryAction: "Document custody owner, signer role, and approval path without entering keys, seed phrases, or transaction payloads."
    },
    {
      id: "transaction-logging",
      label: "Transaction logging",
      status: policy.transactionLoggingApproved ? "ready" : "needs-policy",
      evidence: policy.transactionLoggingApproved
        ? "Transaction logging is approved for future chain anchor review."
        : "Transaction logging is not approved.",
      recoveryAction: "Approve metadata-only transaction logging before any chain anchor adapter review."
    },
    {
      id: "privacy-review",
      label: "Privacy review",
      status: policy.privacyReviewApproved ? "ready" : "needs-policy",
      evidence: policy.privacyReviewApproved
        ? "Privacy review is approved for future chain anchor review."
        : "Privacy review is not approved.",
      recoveryAction: "Keep privacy review mandatory before transaction enablement."
    },
    {
      id: "public-payload-limit",
      label: "Public payload limit",
      status: policy.publicPayloadLimitedApproved && policy.noRawEvidenceOnChainConfirmed ? "ready" : "needs-policy",
      evidence:
        policy.publicPayloadLimitedApproved && policy.noRawEvidenceOnChainConfirmed
          ? "Policy confirms only manifest hashes or receipt metadata may be considered for future public payloads."
          : "Policy must confirm public payloads exclude raw evidence, personal data, KYC, and legal conclusions.",
      recoveryAction: "Limit future public payloads to hashes and receipt metadata; keep raw evidence off-chain."
    },
    {
      id: "user-consent",
      label: "User consent recorded",
      status: policy.userConsentApproved ? "ready" : "needs-policy",
      evidence: policy.userConsentApproved
        ? "User consent workflow is approved for future chain anchor review."
        : "User consent workflow is not approved.",
      recoveryAction: "Record consent and operator approval requirements before anchor adapter review."
    },
    {
      id: "human-review-enforcement",
      label: "Human review enforcement",
      status: policy.humanReviewRequired ? "ready" : "needs-policy",
      evidence: policy.humanReviewRequired
        ? "Human review is mandatory before any external reliance on anchor receipts."
        : "Human review must be mandatory before anchor receipts are relied on.",
      recoveryAction: "Require human review for anchor policy changes, exceptions, and future transaction enablement."
    }
  ];
}

function createRetentionStatus(context: ChainAnchorPolicyContext): ChainAnchorPolicyControl["status"] {
  if (context.retentionStatus === "blocked" || context.blockerCount > 0 || context.exportBlockerCount > 0) {
    return "blocked";
  }

  if (context.evidenceCount > 0) {
    return "ready";
  }

  return "needs-policy";
}

function createRetentionEvidence(context: ChainAnchorPolicyContext): string {
  if (context.retentionStatus === "blocked" || context.blockerCount > 0 || context.exportBlockerCount > 0) {
    const blockers = Math.max(context.blockerCount, context.exportBlockerCount, 1);
    return `${blockers} retention or export blocker${blockers === 1 ? "" : "s"} must be remediated before chain anchor review.`;
  }

  if (context.evidenceCount === 0) {
    return "No metadata-only evidence records are available for chain anchor review.";
  }

  if (context.evidenceCount > 0) {
    return `${context.evidenceCount} metadata-only evidence record${context.evidenceCount === 1 ? "" : "s"} available with no hard retention or export blockers.`;
  }

  return "Evidence Retention Readiness still needs review before chain anchor policy approval.";
}

function createOverallStatus(
  hasBlockedMetadata: boolean,
  requiredControls: ChainAnchorPolicyControl[],
  approvedControlCount: number,
  requiredControlCount: number
): ChainAnchorPolicyReport["overallStatus"] {
  if (hasBlockedMetadata || requiredControls.some((control) => control.status === "blocked")) {
    return "blocked";
  }

  return approvedControlCount === requiredControlCount ? "ready" : "needs-policy";
}

function createExternalChainAnchoringStatus(
  status: ChainAnchorPolicyReport["overallStatus"]
): ChainAnchorPolicyReport["externalChainAnchoringStatus"] {
  if (status === "blocked") {
    return "blocked-by-metadata";
  }

  if (status === "ready") {
    return "policy-ready-not-enabled";
  }

  return "needs-policy";
}

function createNextActions(status: ChainAnchorPolicyReport["overallStatus"], controls: ChainAnchorPolicyControl[]): string[] {
  if (status === "blocked") {
    return ["Remove blocked metadata and resolve retention/export blockers before chain anchor adapter review."];
  }

  if (status === "ready") {
    return ["Keep chain anchoring simulated until a separate wallet signing and transaction enablement review."];
  }

  return controls
    .filter((control) => control.id !== "metadata-boundary" && control.status !== "ready")
    .map((control) => `${control.label}: ${control.recoveryAction}`);
}

function requestsRealChainWrite(value: string): boolean {
  return /\b(real\s+chain\s+write|signed\s+transaction|broadcast|submit\s+(?:a\s+)?transaction|write\s+to\s+chain|send\s+transaction)\b/i.test(value);
}

function isSha256(value: string | undefined): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}
