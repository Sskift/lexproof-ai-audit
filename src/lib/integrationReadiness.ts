import { redactDataBoundaryText } from "./dataBoundary";
import type { ModelConnectReceipt } from "./modelConnect";
import type { SecurityReviewArea, SecurityReviewChecklistItem, SecurityReviewChecklistReport } from "./securityReviewChecklist";

export type IntegrationAdapterId =
  | "server-model-provider"
  | "object-storage-vault"
  | "chain-anchor"
  | "document-parser-ocr"
  | "grc-ticket-export";

export type IntegrationAdapterCategory =
  | "model-provider"
  | "evidence-storage"
  | "anchor"
  | "document-processing"
  | "workflow-export";

export type IntegrationAdapterStatus = "ready" | "needs-policy" | "blocked" | "disabled";

export type IntegrationReadinessAdapter = {
  id: IntegrationAdapterId;
  label: string;
  category: IntegrationAdapterCategory;
  status: IntegrationAdapterStatus;
  readinessEvidence: string;
  validationErrors: string[];
  recoveryAction: string;
  requiredPolicy: string;
  disabledReason?: string;
  notLegalAdviceBoundary: "Not legal advice. Integration adapter readiness is audit preparation metadata only.";
};

export type IntegrationReadinessRegistry = {
  registryVersion: "lexproof-integration-readiness-registry-v1";
  overallStatus: IntegrationAdapterStatus;
  readyCount: number;
  needsPolicyCount: number;
  blockedCount: number;
  disabledCount: number;
  adapters: IntegrationReadinessAdapter[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Integration readiness output is audit preparation metadata only.";
};

export type IntegrationReadinessInput = {
  securityReviewChecklist: SecurityReviewChecklistReport;
  modelConnectReceipt: ModelConnectReceipt | null;
  evidenceCount: number;
  manifestHash?: string;
  remediationItemCount: number;
  counselPackVersionCount: number;
};

const REGISTRY_NOT_LEGAL_ADVICE = "Not legal advice. Integration readiness output is audit preparation metadata only.";
const ADAPTER_NOT_LEGAL_ADVICE = "Not legal advice. Integration adapter readiness is audit preparation metadata only.";

export function createIntegrationReadinessRegistry(input: IntegrationReadinessInput): IntegrationReadinessRegistry {
  const modelItem = findSecurityItem(input.securityReviewChecklist, "model-provider");
  const storageItem = findSecurityItem(input.securityReviewChecklist, "evidence-storage");
  const anchorItem = findSecurityItem(input.securityReviewChecklist, "anchor-integration");

  const adapters: IntegrationReadinessAdapter[] = [
    createServerModelProviderAdapter(modelItem, input.modelConnectReceipt),
    createObjectStorageAdapter(storageItem, input.evidenceCount),
    createChainAnchorAdapter(anchorItem, input.evidenceCount, input.manifestHash),
    createDocumentParserAdapter(storageItem),
    createGrcTicketExportAdapter(storageItem, input.remediationItemCount, input.counselPackVersionCount)
  ];
  const readyCount = adapters.filter((adapter) => adapter.status === "ready").length;
  const needsPolicyCount = adapters.filter((adapter) => adapter.status === "needs-policy").length;
  const blockedCount = adapters.filter((adapter) => adapter.status === "blocked").length;
  const disabledCount = adapters.filter((adapter) => adapter.status === "disabled").length;

  return {
    registryVersion: "lexproof-integration-readiness-registry-v1",
    overallStatus: createOverallStatus({ readyCount, needsPolicyCount, blockedCount, disabledCount }),
    readyCount,
    needsPolicyCount,
    blockedCount,
    disabledCount,
    adapters,
    nextActions: createNextActions(adapters),
    notLegalAdviceBoundary: REGISTRY_NOT_LEGAL_ADVICE
  };
}

function createServerModelProviderAdapter(
  modelItem: SecurityReviewChecklistItem,
  receipt: ModelConnectReceipt | null
): IntegrationReadinessAdapter {
  if (modelItem.status === "blocked") {
    return createAdapter({
      id: "server-model-provider",
      label: "Server model provider",
      category: "model-provider",
      status: "blocked",
      readinessEvidence: modelItem.evidence,
      validationErrors: [modelItem.evidence],
      recoveryAction: "Validate Model Connect before enabling this adapter.",
      requiredPolicy: "Server-side secret policy, provider allowlist, egress logging, and human-review enforcement."
    });
  }

  if (receipt?.mode === "session-openai-compatible") {
    return createAdapter({
      id: "server-model-provider",
      label: "Server model provider",
      category: "model-provider",
      status: "needs-policy",
      readinessEvidence: `${receipt.providerLabel} is validated for session-only use; server proxying is still disabled.`,
      validationErrors: [],
      recoveryAction: "Approve KMS-backed secret storage and server egress logging before enabling provider proxying.",
      requiredPolicy: "KMS-backed credential storage, provider allowlist, request logging, retry policy, and human-review routing."
    });
  }

  return createAdapter({
    id: "server-model-provider",
    label: "Server model provider",
    category: "model-provider",
    status: "disabled",
    readinessEvidence: "Local mock route is ready; the real server provider remains disabled by default.",
    validationErrors: [],
    recoveryAction: "Keep using the local mock path until a server-side provider policy is approved.",
    requiredPolicy: "Server-side secret policy and provider allowlist must be approved before external model calls.",
    disabledReason: "External model provider adapters are disabled by default."
  });
}

function createObjectStorageAdapter(storageItem: SecurityReviewChecklistItem, evidenceCount: number): IntegrationReadinessAdapter {
  if (storageItem.status === "blocked") {
    return createAdapter({
      id: "object-storage-vault",
      label: "Object storage vault",
      category: "evidence-storage",
      status: "blocked",
      readinessEvidence: storageItem.evidence,
      validationErrors: [storageItem.evidence],
      recoveryAction: "Remove blocked materials before enabling this adapter.",
      requiredPolicy: "Retention, deletion, access control, and object lifecycle policy."
    });
  }

  if (evidenceCount === 0) {
    return createAdapter({
      id: "object-storage-vault",
      label: "Object storage vault",
      category: "evidence-storage",
      status: "blocked",
      readinessEvidence: "No metadata-only evidence records are available for vault handoff.",
      validationErrors: ["Add at least one metadata-only evidence item before object storage review."],
      recoveryAction: "Add metadata-only evidence before enabling this adapter.",
      requiredPolicy: "Retention, deletion, access control, and object lifecycle policy."
    });
  }

  return createAdapter({
    id: "object-storage-vault",
    label: "Object storage vault",
    category: "evidence-storage",
    status: "needs-policy",
    readinessEvidence: `${evidenceCount} metadata-only evidence record${evidenceCount === 1 ? "" : "s"} passed current vault blockers.`,
    validationErrors: [],
    recoveryAction: "Approve retention and deletion policy before sending raw objects to external storage.",
    requiredPolicy: "Retention, deletion, access control, object lifecycle, and audit-log retention policy."
  });
}

function createChainAnchorAdapter(
  anchorItem: SecurityReviewChecklistItem,
  evidenceCount: number,
  manifestHash?: string
): IntegrationReadinessAdapter {
  if (evidenceCount <= 0) {
    return createAdapter({
      id: "chain-anchor",
      label: "Chain anchor",
      category: "anchor",
      status: "blocked",
      readinessEvidence: "No metadata-only evidence records are available for anchor review.",
      validationErrors: ["Add at least one metadata-only evidence item before chain anchor policy review."],
      recoveryAction: "Add metadata-only evidence in the Evidence Ledger before enabling this adapter.",
      requiredPolicy: "Wallet signing controls, privacy review, transaction logging, and user consent."
    });
  }

  if (!manifestHash) {
    return createAdapter({
      id: "chain-anchor",
      label: "Chain anchor",
      category: "anchor",
      status: "blocked",
      readinessEvidence: anchorItem.evidence,
      validationErrors: ["Generate an Evidence Manifest hash before anchor review."],
      recoveryAction: "Generate an Evidence Manifest before enabling this adapter.",
      requiredPolicy: "Wallet signing controls, privacy review, transaction logging, and user consent."
    });
  }

  return createAdapter({
    id: "chain-anchor",
    label: "Chain anchor",
    category: "anchor",
    status: "needs-policy",
    readinessEvidence: `Manifest ${manifestHash.slice(0, 12)}... is available for simulated receipt handoff.`,
    validationErrors: [],
    recoveryAction: "Keep anchor receipts simulated until wallet signing and privacy controls are approved.",
    requiredPolicy: "Wallet signing controls, privacy review, transaction logging, and user consent for external chain transactions."
  });
}

function createDocumentParserAdapter(storageItem: SecurityReviewChecklistItem): IntegrationReadinessAdapter {
  if (storageItem.status === "blocked") {
    return createAdapter({
      id: "document-parser-ocr",
      label: "Document parser / OCR",
      category: "document-processing",
      status: "blocked",
      readinessEvidence: storageItem.evidence,
      validationErrors: [storageItem.evidence],
      recoveryAction: "Remove blocked materials before enabling this adapter.",
      requiredPolicy: "Raw-document privacy handling, retention, OCR logging, and deletion policy."
    });
  }

  return createAdapter({
    id: "document-parser-ocr",
    label: "Document parser / OCR",
    category: "document-processing",
    status: "disabled",
    readinessEvidence: "Raw document ingestion and OCR are intentionally disabled in this phase.",
    validationErrors: [],
    recoveryAction: "Keep evidence metadata-only until raw-document handling policy is approved.",
    requiredPolicy: "Raw-document privacy handling, retention, OCR logging, and deletion policy.",
    disabledReason: "Raw document processing is not approved for this workspace."
  });
}

function createGrcTicketExportAdapter(
  storageItem: SecurityReviewChecklistItem,
  remediationItemCount: number,
  counselPackVersionCount: number
): IntegrationReadinessAdapter {
  if (storageItem.status === "blocked") {
    return createAdapter({
      id: "grc-ticket-export",
      label: "GRC ticket export",
      category: "workflow-export",
      status: "blocked",
      readinessEvidence: storageItem.evidence,
      validationErrors: [storageItem.evidence],
      recoveryAction: "Remove blocked materials before enabling this adapter.",
      requiredPolicy: "Destination field mapping, ticket ownership, and export redaction policy."
    });
  }

  if (remediationItemCount === 0) {
    return createAdapter({
      id: "grc-ticket-export",
      label: "GRC ticket export",
      category: "workflow-export",
      status: "disabled",
      readinessEvidence: "No remediation queue items are available for ticket export.",
      validationErrors: ["Create remediation queue items before GRC ticket export."],
      recoveryAction: "Run Risk Audit or add remediation work before enabling this adapter.",
      requiredPolicy: "Destination field mapping, ticket ownership, and export redaction policy.",
      disabledReason: "No remediation queue exists yet."
    });
  }

  return createAdapter({
    id: "grc-ticket-export",
    label: "GRC ticket export",
    category: "workflow-export",
    status: "ready",
    readinessEvidence: `${remediationItemCount} remediation items and ${counselPackVersionCount} Counsel Pack version${
      counselPackVersionCount === 1 ? "" : "s"
    } are available for metadata-only ticket routing.`,
    validationErrors: [],
    recoveryAction: "Export metadata-only remediation queue items; keep raw evidence outside ticket payloads.",
    requiredPolicy: "Destination field mapping, ticket ownership, export redaction policy, and reviewer assignment."
  });
}

function createAdapter(
  input: Omit<IntegrationReadinessAdapter, "notLegalAdviceBoundary">
): IntegrationReadinessAdapter {
  return {
    ...input,
    readinessEvidence: sanitize(input.readinessEvidence),
    validationErrors: input.validationErrors.map(sanitize),
    recoveryAction: sanitize(input.recoveryAction),
    requiredPolicy: sanitize(input.requiredPolicy),
    disabledReason: input.disabledReason ? sanitize(input.disabledReason) : undefined,
    notLegalAdviceBoundary: ADAPTER_NOT_LEGAL_ADVICE
  };
}

function findSecurityItem(
  report: SecurityReviewChecklistReport,
  area: SecurityReviewArea
): SecurityReviewChecklistItem {
  const item = report.items.find((candidate) => candidate.area === area);
  if (item) {
    return item;
  }

  return {
    id: `${area}-missing`,
    area,
    title: area,
    status: "blocked",
    evidence: "Security review checklist item is missing.",
    recoveryAction: "Regenerate the security review checklist.",
    requiredBeforeRealIntegration: "Security review checklist must be present before integration readiness.",
    notLegalAdviceBoundary: "Not legal advice. Security review checklist items are audit preparation metadata only."
  };
}

function createOverallStatus(counts: {
  readyCount: number;
  needsPolicyCount: number;
  blockedCount: number;
  disabledCount: number;
}): IntegrationAdapterStatus {
  if (counts.blockedCount > 0) {
    return "blocked";
  }

  if (counts.needsPolicyCount > 0) {
    return "needs-policy";
  }

  if (counts.readyCount > 0) {
    return "ready";
  }

  return "disabled";
}

function createNextActions(adapters: IntegrationReadinessAdapter[]): string[] {
  const actions = adapters
    .filter((adapter) => adapter.status !== "ready")
    .map((adapter) => `${adapter.label}: ${adapter.recoveryAction}`);

  return actions.length > 0
    ? actions
    : ["Integration registry is ready for metadata-only demo export. Keep external adapters behind policy review."];
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
}
