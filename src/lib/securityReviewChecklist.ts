import { redactDataBoundaryText } from "./dataBoundary";
import type { DataBoundaryReport } from "./dataBoundary";
import type { ModelConnectReceipt } from "./modelConnect";
import type { RetentionPolicyReport } from "./retentionPolicy";

export type SecurityReviewArea = "model-provider" | "evidence-storage" | "anchor-integration";

export type SecurityReviewStatus = "ready" | "needs-review" | "blocked";

export type SecurityReviewChecklistItem = {
  id: string;
  area: SecurityReviewArea;
  title: string;
  status: SecurityReviewStatus;
  evidence: string;
  recoveryAction: string;
  requiredBeforeRealIntegration: string;
  notLegalAdviceBoundary: "Not legal advice. Security review checklist items are audit preparation metadata only.";
};

export type SecurityReviewChecklistReport = {
  reportVersion: "lexproof-security-review-checklist-v1";
  overallStatus: SecurityReviewStatus;
  readyCount: number;
  reviewCount: number;
  blockerCount: number;
  items: SecurityReviewChecklistItem[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Security review checklist output is audit preparation metadata only.";
};

export type SecurityReviewChecklistInput = {
  modelConnectReceipt: ModelConnectReceipt | null;
  retentionPolicyReport: RetentionPolicyReport;
  dataBoundaryReport: DataBoundaryReport;
  evidenceCount: number;
  manifestHash?: string;
};

const REPORT_NOT_LEGAL_ADVICE = "Not legal advice. Security review checklist output is audit preparation metadata only.";
const ITEM_NOT_LEGAL_ADVICE = "Not legal advice. Security review checklist items are audit preparation metadata only.";

export function createSecurityReviewChecklist(input: SecurityReviewChecklistInput): SecurityReviewChecklistReport {
  const items = [
    createModelProviderItem(input.modelConnectReceipt),
    createEvidenceStorageItem(input.retentionPolicyReport, input.dataBoundaryReport, input.evidenceCount),
    createAnchorIntegrationItem(input.manifestHash)
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "needs-review").length;
  const blockerCount = items.filter((item) => item.status === "blocked").length;

  return {
    reportVersion: "lexproof-security-review-checklist-v1",
    overallStatus: blockerCount > 0 ? "blocked" : reviewCount > 0 ? "needs-review" : "ready",
    readyCount,
    reviewCount,
    blockerCount,
    items,
    nextActions: createNextActions(items),
    notLegalAdviceBoundary: REPORT_NOT_LEGAL_ADVICE
  };
}

function createModelProviderItem(receipt: ModelConnectReceipt | null): SecurityReviewChecklistItem {
  if (!receipt) {
    return createItem({
      id: "model-provider-secret-boundary",
      area: "model-provider",
      title: "Model provider",
      status: "blocked",
      evidence: "Model Connect has not been validated for this workspace.",
      recoveryAction: "Validate Model Connect with the mock reviewer or session-only model settings before gateway review.",
      requiredBeforeRealIntegration: "Server-side secret policy, provider allowlist, and disabled-by-default external adapters."
    });
  }

  if (receipt.status === "blocked") {
    return createItem({
      id: "model-provider-secret-boundary",
      area: "model-provider",
      title: "Model provider",
      status: "blocked",
      evidence: `Model Connect blocked: ${sanitize(receipt.blockers.join(" ") || "configuration or redaction checks failed")}.`,
      recoveryAction: "Resolve Model Connect blockers before using model output in review workflow.",
      requiredBeforeRealIntegration: "Server-side secret policy, provider allowlist, and disabled-by-default external adapters."
    });
  }

  if (receipt.mode === "session-openai-compatible") {
    return createItem({
      id: "model-provider-secret-boundary",
      area: "model-provider",
      title: "Model provider",
      status: "needs-review",
      evidence: `${sanitize(receipt.providerLabel)} is validated as a session-only route for ${sanitize(receipt.endpointHost)}.`,
      recoveryAction: "Approve a server-side secret policy before enabling this provider through Model Gateway.",
      requiredBeforeRealIntegration: "KMS-backed credential storage, provider egress logging, and human-review enforcement."
    });
  }

  return createItem({
    id: "model-provider-secret-boundary",
    area: "model-provider",
    title: "Model provider",
    status: "ready",
    evidence: `${sanitize(receipt.providerLabel)} validated with no provider credentials accepted or persisted.`,
    recoveryAction: "Keep deterministic risk scoring outside model output and route model drafts to human review.",
    requiredBeforeRealIntegration: "Server-side secret policy remains required before real external provider calls."
  });
}

function createEvidenceStorageItem(
  retentionPolicyReport: RetentionPolicyReport,
  dataBoundaryReport: DataBoundaryReport,
  evidenceCount: number
): SecurityReviewChecklistItem {
  if (retentionPolicyReport.status === "blocked" || dataBoundaryReport.status === "blocked") {
    return createItem({
      id: "evidence-storage-retention-boundary",
      area: "evidence-storage",
      title: "Evidence storage",
      status: "blocked",
      evidence: `Retention blockers: ${retentionPolicyReport.blockerCount}; export blockers: ${dataBoundaryReport.blockerCount}.`,
      recoveryAction: "Remove blocked materials before Evidence Vault sync or export handoff.",
      requiredBeforeRealIntegration: "Retention, deletion, and access policy approval before raw object storage."
    });
  }

  if (evidenceCount === 0 || retentionPolicyReport.status === "needs-review" || dataBoundaryReport.status === "needs-review") {
    return createItem({
      id: "evidence-storage-retention-boundary",
      area: "evidence-storage",
      title: "Evidence storage",
      status: "needs-review",
      evidence:
        evidenceCount === 0
          ? "No metadata-only evidence has been added yet."
          : `Retention status ${retentionPolicyReport.status}; export status ${dataBoundaryReport.status}.`,
      recoveryAction: "Add metadata-only evidence and confirm personal-data, KYC, or confidentiality references before vault sync.",
      requiredBeforeRealIntegration: "Retention, deletion, and access policy approval before raw object storage."
    });
  }

  return createItem({
    id: "evidence-storage-retention-boundary",
    area: "evidence-storage",
    title: "Evidence storage",
    status: "ready",
    evidence: `${evidenceCount} metadata-only evidence record${evidenceCount === 1 ? "" : "s"} can sync without blocked data classes.`,
    recoveryAction: "Continue with metadata-only Evidence Vault sync; keep raw files outside LexProof.",
    requiredBeforeRealIntegration: "Retention, deletion, and access policy approval before raw object storage."
  });
}

function createAnchorIntegrationItem(manifestHash?: string): SecurityReviewChecklistItem {
  if (!manifestHash) {
    return createItem({
      id: "anchor-integration-boundary",
      area: "anchor-integration",
      title: "Anchor integration",
      status: "needs-review",
      evidence: "Evidence Manifest hash is not ready yet.",
      recoveryAction: "Generate an Evidence Manifest before creating simulated anchor receipts.",
      requiredBeforeRealIntegration: "Privacy review, wallet signing controls, transaction logging, and user consent before real chain writes."
    });
  }

  return createItem({
    id: "anchor-integration-boundary",
    area: "anchor-integration",
    title: "Anchor integration",
    status: "ready",
    evidence: `Manifest ${manifestHash.slice(0, 12)}... is ready for simulated receipt handoff only.`,
    recoveryAction: "Use simulated receipts for audit-prep handoff; do not claim a real on-chain write.",
    requiredBeforeRealIntegration: "Privacy review, wallet signing controls, transaction logging, and user consent before real chain writes."
  });
}

function createItem(input: Omit<SecurityReviewChecklistItem, "notLegalAdviceBoundary">): SecurityReviewChecklistItem {
  return {
    ...input,
    evidence: sanitize(input.evidence),
    recoveryAction: sanitize(input.recoveryAction),
    requiredBeforeRealIntegration: sanitize(input.requiredBeforeRealIntegration),
    notLegalAdviceBoundary: ITEM_NOT_LEGAL_ADVICE
  };
}

function createNextActions(items: SecurityReviewChecklistItem[]): string[] {
  const actionItems = items.filter((item) => item.status !== "ready");

  if (actionItems.length === 0) {
    return ["Security review checklist is ready for audit-prep demo flow. Keep real integrations disabled until their policies are approved."];
  }

  return actionItems.map((item) => `${item.title}: ${item.recoveryAction}`);
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
}
