import type { ChainAnchorPolicyReport } from "./chainAnchorPolicy";
import { redactDataBoundaryText } from "./dataBoundary";
import type { DocumentParserPolicyReport } from "./documentParserPolicy";
import type { GrcDestinationPolicyReport } from "./grcDestinationPolicy";
import type { IntegrationPolicyEvaluationRecord, IntegrationPolicyId } from "./integrationPolicyEvaluation";
import type { IntegrationAdapterId, IntegrationAdapterStatus, IntegrationReadinessRegistry } from "./integrationReadiness";
import type { ModelGatewayProviderPolicyReport } from "./modelGatewayProviderPolicy";
import type { ModelGatewaySecretPolicyReport } from "./modelGatewaySecretPolicy";
import type { ObjectStoragePolicyReport } from "./objectStoragePolicy";

export type IntegrationEnablementPolicyReportId =
  | "provider-policy"
  | "secret-policy"
  | "object-storage-policy"
  | "document-parser-policy"
  | "chain-anchor-policy"
  | "grc-destination-policy";

export type IntegrationEnablementPolicyReportSummary = {
  id: IntegrationEnablementPolicyReportId;
  label: string;
  reportVersion: string;
  status: IntegrationAdapterStatus;
  requiredControlCount: number;
  approvedControlCount: number;
  blockedControlCount: number;
  externalCapability: string;
  externalCapabilityAllowed: false;
  externalCapabilityStatus: string;
  nextActions: string[];
  notLegalAdviceBoundary: string;
};

export type IntegrationEnablementPolicyEvaluationSummary = {
  id: string;
  policyId: IntegrationPolicyEvaluationRecord["policyId"];
  reportVersion: string;
  status: Exclude<IntegrationAdapterStatus, "disabled">;
  approvedControlCount: number;
  requiredControlCount: number;
  externalCapabilityAllowed: false;
  externalCapabilityStatus: string;
  reportHash: string;
  contextHash: string;
  policyHash: string;
  evaluatorId: string;
  source: "server";
  createdAt: string;
  nextActions: string[];
  notLegalAdviceBoundary: string;
};

export type IntegrationPolicyReceiptCoverageStatus = "covered" | "missing" | "needs-policy" | "blocked";

export type IntegrationEnablementPolicyReceiptCoverage = {
  policyId: IntegrationPolicyId;
  policyReportId: Extract<
    IntegrationEnablementPolicyReportId,
    "object-storage-policy" | "document-parser-policy" | "chain-anchor-policy" | "grc-destination-policy"
  >;
  label: string;
  coverageStatus: IntegrationPolicyReceiptCoverageStatus;
  latestRecordId: string | null;
  latestRecordStatus: Exclude<IntegrationAdapterStatus, "disabled"> | "missing";
  externalCapabilityAllowed: false;
  externalCapabilityStatus: string;
  reportHash: string | null;
  contextHash: string | null;
  policyHash: string | null;
  source: "server" | "missing";
  recoveryAction: string;
  notLegalAdviceBoundary: string;
};

export type IntegrationEnablementAdapterSummary = {
  id: IntegrationAdapterId;
  label: string;
  status: IntegrationAdapterStatus;
  readinessEvidence: string;
  requiredPolicy: string;
  blockerCount: number;
  blockers: string[];
  recoveryAction: string;
  disabledReason?: string;
  notLegalAdviceBoundary: string;
};

export type IntegrationEnablementDossier = {
  dossierVersion: "lexproof-integration-enablement-dossier-v1";
  generatedAt: string;
  dossierHash: string;
  overallStatus: IntegrationAdapterStatus;
  registryStatus: IntegrationAdapterStatus;
  adapterCount: number;
  readyCount: number;
  needsPolicyCount: number;
  blockedCount: number;
  disabledCount: number;
  policyReportCount: number;
  policyEvaluationRecordCount: number;
  policyReceiptCoverageCount: number;
  policyReceiptPresentCount: number;
  policyReceiptCoveredCount: number;
  policyReceiptMissingCount: number;
  policyReceiptBlockedCount: number;
  externalEnablementAllowed: false;
  externalEnablementStatus: "disabled-by-default" | "blocked-by-policy" | "needs-policy-review";
  adapters: IntegrationEnablementAdapterSummary[];
  policyReports: IntegrationEnablementPolicyReportSummary[];
  policyEvaluationRecords: IntegrationEnablementPolicyEvaluationSummary[];
  policyReceiptCoverage: IntegrationEnablementPolicyReceiptCoverage[];
  blockerCount: number;
  blockers: string[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Integration enablement dossiers are audit preparation metadata only.";
};

export type IntegrationEnablementGateItemStatus = "blocked" | "needs-policy" | "missing-receipt" | "disabled";
export type IntegrationEnablementGateItemPriority = "P0" | "P1" | "P2";

export type IntegrationEnablementGateItem = {
  id: string;
  label: string;
  source: "adapter" | "policy-report" | "server-receipt" | "external-disable";
  status: IntegrationEnablementGateItemStatus;
  priority: IntegrationEnablementGateItemPriority;
  blocker: string;
  recoveryAction: string;
  externalCapabilityAllowed: false;
  externalCapabilityStatus: string;
  referenceHash: string | null;
  notLegalAdviceBoundary: string;
};

export type IntegrationEnablementGate = {
  gateVersion: "lexproof-integration-enablement-gate-v1";
  generatedAt: string;
  gateHash: string;
  dossierHash: string;
  gateStatus: IntegrationAdapterStatus;
  externalEnablementAllowed: false;
  externalEnablementStatus: IntegrationEnablementDossier["externalEnablementStatus"];
  queueItemCount: number;
  blockerCount: number;
  needsPolicyCount: number;
  missingReceiptCount: number;
  coveredReceiptCount: number;
  queueItems: IntegrationEnablementGateItem[];
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Integration enablement gates are audit preparation workflow metadata only.";
};

export type CreateIntegrationEnablementDossierInput = {
  registry: IntegrationReadinessRegistry;
  providerPolicyReport: ModelGatewayProviderPolicyReport;
  secretPolicyReport: ModelGatewaySecretPolicyReport;
  objectStoragePolicyReport: ObjectStoragePolicyReport;
  documentParserPolicyReport: DocumentParserPolicyReport;
  chainAnchorPolicyReport: ChainAnchorPolicyReport;
  grcDestinationPolicyReport: GrcDestinationPolicyReport;
  policyEvaluationRecords?: IntegrationPolicyEvaluationRecord[];
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Integration enablement dossiers are audit preparation metadata only." as const;
const GATE_BOUNDARY = "Not legal advice. Integration enablement gates are audit preparation workflow metadata only." as const;
const DEFAULT_NEXT_ACTION =
  "Keep all external adapters disabled until adapter enablement review, secret handling, retention, audit logging, and human review controls are approved.";
const RECEIPT_BOUNDARY = "Not legal advice. Integration policy receipt coverage is audit preparation metadata only.";
const receiptPolicyReports: Array<{
  policyId: IntegrationPolicyId;
  policyReportId: IntegrationEnablementPolicyReceiptCoverage["policyReportId"];
  label: string;
}> = [
  { policyId: "object-storage", policyReportId: "object-storage-policy", label: "Object Storage Policy" },
  { policyId: "document-parser", policyReportId: "document-parser-policy", label: "Document Parser Policy" },
  { policyId: "chain-anchor", policyReportId: "chain-anchor-policy", label: "Chain Anchor Policy" },
  { policyId: "grc-destination", policyReportId: "grc-destination-policy", label: "GRC Destination Policy" }
];

export async function createIntegrationEnablementDossier({
  registry,
  providerPolicyReport,
  secretPolicyReport,
  objectStoragePolicyReport,
  documentParserPolicyReport,
  chainAnchorPolicyReport,
  grcDestinationPolicyReport,
  policyEvaluationRecords = [],
  generatedAt = new Date().toISOString()
}: CreateIntegrationEnablementDossierInput): Promise<IntegrationEnablementDossier> {
  const adapters = registry.adapters.map((adapter) => ({
    id: adapter.id,
    label: sanitize(adapter.label),
    status: normalizeStatus(adapter.status),
    readinessEvidence: sanitize(adapter.readinessEvidence),
    requiredPolicy: sanitize(adapter.requiredPolicy),
    blockerCount: adapter.status === "blocked" ? Math.max(1, adapter.validationErrors.length) : adapter.validationErrors.length,
    blockers: adapter.validationErrors.map(sanitize).filter(Boolean),
    recoveryAction: sanitize(adapter.recoveryAction),
    disabledReason: adapter.disabledReason ? sanitize(adapter.disabledReason) : undefined,
    notLegalAdviceBoundary: sanitize(adapter.notLegalAdviceBoundary)
  }));
  const policyReports = [
    summarizeProviderPolicy(providerPolicyReport),
    summarizePolicyReport({
      id: "secret-policy",
      label: "Model Gateway Secret Policy",
      report: secretPolicyReport,
      externalCapability: "Server model provider proxying",
      externalCapabilityStatus: secretPolicyReport.externalProviderProxyingStatus
    }),
    summarizePolicyReport({
      id: "object-storage-policy",
      label: "Object Storage Policy",
      report: objectStoragePolicyReport,
      externalCapability: "External object storage writes",
      externalCapabilityStatus: objectStoragePolicyReport.externalObjectStorageStatus
    }),
    summarizePolicyReport({
      id: "document-parser-policy",
      label: "Document Parser Policy",
      report: documentParserPolicyReport,
      externalCapability: "External document parsing",
      externalCapabilityStatus: documentParserPolicyReport.externalDocumentParsingStatus
    }),
    summarizePolicyReport({
      id: "chain-anchor-policy",
      label: "Chain Anchor Policy",
      report: chainAnchorPolicyReport,
      externalCapability: "External chain anchoring",
      externalCapabilityStatus: chainAnchorPolicyReport.externalChainAnchoringStatus
    }),
    summarizePolicyReport({
      id: "grc-destination-policy",
      label: "GRC Destination Policy",
      report: grcDestinationPolicyReport,
      externalCapability: "External GRC ticket creation",
      externalCapabilityStatus: grcDestinationPolicyReport.externalGrcTicketCreationStatus
    })
  ];
  const evaluationRecords = policyEvaluationRecords
    .map(summarizePolicyEvaluationRecord)
    .sort((left, right) => `${right.createdAt}-${right.id}`.localeCompare(`${left.createdAt}-${left.id}`));
  const policyReceiptCoverage = createPolicyReceiptCoverage(evaluationRecords);
  const blockedCount = adapters.filter((adapter) => adapter.status === "blocked").length;
  const needsPolicyCount = adapters.filter((adapter) => adapter.status === "needs-policy").length;
  const readyCount = adapters.filter((adapter) => adapter.status === "ready").length;
  const disabledCount = adapters.filter((adapter) => adapter.status === "disabled").length;
  const policyBlockedCount = policyReports.filter((report) => report.status === "blocked").length;
  const policyNeedsReviewCount = policyReports.filter((report) => report.status === "needs-policy").length;
  const blockers = collectBlockers(adapters, policyReports);
  const receiptBlockedCount = policyReceiptCoverage.filter((coverage) => coverage.coverageStatus === "blocked").length;
  const receiptPresentCount = policyReceiptCoverage.filter((coverage) => coverage.source === "server").length;
  const receiptCoveredCount = policyReceiptCoverage.filter((coverage) => coverage.coverageStatus === "covered").length;
  const receiptMissingCount = policyReceiptCoverage.filter((coverage) => coverage.coverageStatus === "missing").length;
  const receiptNeedsPolicyCount = policyReceiptCoverage.filter((coverage) => coverage.coverageStatus === "needs-policy").length;
  const nextActions = createNextActions(registry.nextActions, policyReports, policyReceiptCoverage);
  const overallStatus = createOverallStatus(
    blockedCount + policyBlockedCount + receiptBlockedCount,
    needsPolicyCount + policyNeedsReviewCount + receiptMissingCount + receiptNeedsPolicyCount,
    readyCount
  );
  const hashPayload = {
    dossierVersion: "lexproof-integration-enablement-dossier-v1",
    overallStatus,
    registryStatus: normalizeStatus(registry.overallStatus),
    adapters,
    policyReports,
    policyEvaluationRecords: evaluationRecords,
    policyReceiptCoverage,
    blockers,
    nextActions,
    externalEnablementAllowed: false
  };

  return {
    dossierVersion: "lexproof-integration-enablement-dossier-v1",
    generatedAt,
    dossierHash: await sha256Hex(stableStringify(hashPayload)),
    overallStatus,
    registryStatus: normalizeStatus(registry.overallStatus),
    adapterCount: adapters.length,
    readyCount,
    needsPolicyCount,
    blockedCount,
    disabledCount,
    policyReportCount: policyReports.length,
    policyEvaluationRecordCount: evaluationRecords.length,
    policyReceiptCoverageCount: policyReceiptCoverage.length,
    policyReceiptPresentCount: receiptPresentCount,
    policyReceiptCoveredCount: receiptCoveredCount,
    policyReceiptMissingCount: receiptMissingCount,
    policyReceiptBlockedCount: receiptBlockedCount,
    externalEnablementAllowed: false,
    externalEnablementStatus: createExternalEnablementStatus(
      blockedCount + policyBlockedCount + receiptBlockedCount,
      needsPolicyCount + policyNeedsReviewCount + receiptMissingCount + receiptNeedsPolicyCount
    ),
    adapters,
    policyReports,
    policyEvaluationRecords: evaluationRecords,
    policyReceiptCoverage,
    blockerCount: blockers.length,
    blockers,
    nextActions,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export async function createIntegrationEnablementGate(
  dossier: IntegrationEnablementDossier,
  generatedAt = new Date().toISOString()
): Promise<IntegrationEnablementGate> {
  const queueItems = [
    ...dossier.adapters.flatMap(createAdapterGateItems),
    ...dossier.policyReports.flatMap(createPolicyReportGateItems),
    ...dossier.policyReceiptCoverage.flatMap(createPolicyReceiptGateItems)
  ].sort(compareGateItems);

  const fallbackQueueItem: IntegrationEnablementGateItem = {
    id: "external-adapter-enable-review",
    label: "External Adapter Enablement Review",
    source: "external-disable",
    status: "disabled",
    priority: "P2",
    blocker: "External adapter enablement remains disabled by default.",
    recoveryAction: DEFAULT_NEXT_ACTION,
    externalCapabilityAllowed: false,
    externalCapabilityStatus: dossier.externalEnablementStatus,
    referenceHash: dossier.dossierHash,
    notLegalAdviceBoundary: GATE_BOUNDARY
  };
  const finalQueueItems = queueItems.length > 0 ? queueItems : [fallbackQueueItem];
  const blockerCount = finalQueueItems.filter((item) => item.status === "blocked").length;
  const needsPolicyCount = finalQueueItems.filter((item) => item.status === "needs-policy").length;
  const missingReceiptCount = finalQueueItems.filter((item) => item.status === "missing-receipt").length;
  const gateStatus = createGateStatus(blockerCount, needsPolicyCount + missingReceiptCount, dossier);
  const hashPayload = {
    gateVersion: "lexproof-integration-enablement-gate-v1",
    dossierHash: dossier.dossierHash,
    gateStatus,
    externalEnablementAllowed: false,
    externalEnablementStatus: dossier.externalEnablementStatus,
    queueItems: finalQueueItems,
    blockerCount,
    needsPolicyCount,
    missingReceiptCount,
    coveredReceiptCount: dossier.policyReceiptCoveredCount,
    notLegalAdviceBoundary: GATE_BOUNDARY
  };

  return {
    gateVersion: "lexproof-integration-enablement-gate-v1",
    generatedAt,
    gateHash: await sha256Hex(stableStringify(hashPayload)),
    dossierHash: dossier.dossierHash,
    gateStatus,
    externalEnablementAllowed: false,
    externalEnablementStatus: dossier.externalEnablementStatus,
    queueItemCount: finalQueueItems.length,
    blockerCount,
    needsPolicyCount,
    missingReceiptCount,
    coveredReceiptCount: dossier.policyReceiptCoveredCount,
    queueItems: finalQueueItems,
    nextAction: finalQueueItems[0]?.recoveryAction ?? DEFAULT_NEXT_ACTION,
    notLegalAdviceBoundary: GATE_BOUNDARY
  };
}

function summarizePolicyEvaluationRecord(record: IntegrationPolicyEvaluationRecord): IntegrationEnablementPolicyEvaluationSummary {
  return {
    id: sanitize(record.id),
    policyId: record.policyId,
    reportVersion: sanitize(record.reportVersion),
    status: normalizeNonDisabledStatus(record.overallStatus),
    approvedControlCount: Math.max(0, Math.trunc(record.approvedControlCount)),
    requiredControlCount: Math.max(0, Math.trunc(record.requiredControlCount)),
    externalCapabilityAllowed: false,
    externalCapabilityStatus: sanitize(record.externalCapabilityStatus),
    reportHash: preserveSha256(record.reportHash),
    contextHash: preserveSha256(record.contextHash),
    policyHash: preserveSha256(record.policyHash),
    evaluatorId: sanitize(record.evaluatorId),
    source: "server",
    createdAt: sanitize(record.createdAt),
    nextActions: record.nextActions.map(sanitize).filter(Boolean),
    notLegalAdviceBoundary: sanitize(record.notLegalAdviceBoundary)
  };
}

function createPolicyReceiptCoverage(
  records: IntegrationEnablementPolicyEvaluationSummary[]
): IntegrationEnablementPolicyReceiptCoverage[] {
  return receiptPolicyReports.map(({ policyId, policyReportId, label }) => {
    const latestRecord = records.find((record) => record.policyId === policyId);

    if (!latestRecord) {
      return {
        policyId,
        policyReportId,
        label,
        coverageStatus: "missing",
        latestRecordId: null,
        latestRecordStatus: "missing",
        externalCapabilityAllowed: false,
        externalCapabilityStatus: "missing-server-receipt",
        reportHash: null,
        contextHash: null,
        policyHash: null,
        source: "missing",
        recoveryAction: `Evaluate ${label} against the Phase 2 API or refresh policy receipts before adapter enablement review.`,
        notLegalAdviceBoundary: RECEIPT_BOUNDARY
      };
    }

    const coverageStatus = createReceiptCoverageStatus(latestRecord.status);

    return {
      policyId,
      policyReportId,
      label,
      coverageStatus,
      latestRecordId: latestRecord.id,
      latestRecordStatus: latestRecord.status,
      externalCapabilityAllowed: false,
      externalCapabilityStatus: latestRecord.externalCapabilityStatus,
      reportHash: latestRecord.reportHash,
      contextHash: latestRecord.contextHash,
      policyHash: latestRecord.policyHash,
      source: "server",
      recoveryAction: createReceiptCoverageRecoveryAction(label, coverageStatus, latestRecord.nextActions),
      notLegalAdviceBoundary: RECEIPT_BOUNDARY
    };
  });
}

function createReceiptCoverageStatus(
  status: Exclude<IntegrationAdapterStatus, "disabled">
): IntegrationPolicyReceiptCoverageStatus {
  if (status === "ready") {
    return "covered";
  }
  return status;
}

function createReceiptCoverageRecoveryAction(
  label: string,
  coverageStatus: IntegrationPolicyReceiptCoverageStatus,
  nextActions: string[]
): string {
  if (coverageStatus === "covered") {
    return `${label} has a server policy receipt; keep external capability disabled until adapter enablement review.`;
  }

  if (nextActions.length > 0) {
    return `${label}: ${nextActions[0]}`;
  }

  return `Resolve ${label} server receipt status before adapter enablement review.`;
}

export function exportIntegrationEnablementDossierJson(dossier: IntegrationEnablementDossier): string {
  return `${JSON.stringify(dossier, null, 2)}\n`;
}

export function exportIntegrationEnablementGateJson(gate: IntegrationEnablementGate): string {
  return `${JSON.stringify(gate, null, 2)}\n`;
}

export function downloadIntegrationEnablementDossierJson(filename: string, dossier: IntegrationEnablementDossier): void {
  const blob = new Blob([exportIntegrationEnablementDossierJson(dossier)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadIntegrationEnablementGateJson(filename: string, gate: IntegrationEnablementGate): void {
  const blob = new Blob([exportIntegrationEnablementGateJson(gate)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function summarizeProviderPolicy(report: ModelGatewayProviderPolicyReport): IntegrationEnablementPolicyReportSummary {
  const blockedControlCount = report.controls.filter((control) => control.status === "blocked").length;
  const blockedAdapterCount = report.adapters.filter((adapter) => adapter.status === "blocked").length;

  return {
    id: "provider-policy",
    label: "Model Gateway Provider Policy",
    reportVersion: report.reportVersion,
    status: normalizeStatus(report.overallStatus),
    requiredControlCount: report.controls.length,
    approvedControlCount: report.controls.filter((control) => control.status === "ready").length,
    blockedControlCount: blockedControlCount + blockedAdapterCount,
    externalCapability: "External model provider proxying",
    externalCapabilityAllowed: false,
    externalCapabilityStatus: "disabled-by-default",
    nextActions: report.nextActions.map(sanitize).filter(Boolean),
    notLegalAdviceBoundary: sanitize(report.notLegalAdviceBoundary)
  };
}

function summarizePolicyReport({
  id,
  label,
  report,
  externalCapability,
  externalCapabilityStatus
}: {
  id: Exclude<IntegrationEnablementPolicyReportId, "provider-policy">;
  label: string;
  report:
    | ModelGatewaySecretPolicyReport
    | ObjectStoragePolicyReport
    | DocumentParserPolicyReport
    | ChainAnchorPolicyReport
    | GrcDestinationPolicyReport;
  externalCapability: string;
  externalCapabilityStatus: string;
}): IntegrationEnablementPolicyReportSummary {
  return {
    id,
    label,
    reportVersion: report.reportVersion,
    status: normalizeStatus(report.overallStatus),
    requiredControlCount: report.requiredControlCount,
    approvedControlCount: report.approvedControlCount,
    blockedControlCount: report.controls.filter((control) => control.status === "blocked").length,
    externalCapability,
    externalCapabilityAllowed: false,
    externalCapabilityStatus: sanitize(externalCapabilityStatus),
    nextActions: report.nextActions.map(sanitize).filter(Boolean),
    notLegalAdviceBoundary: sanitize(report.notLegalAdviceBoundary)
  };
}

function collectBlockers(
  adapters: IntegrationEnablementAdapterSummary[],
  reports: IntegrationEnablementPolicyReportSummary[]
): string[] {
  return unique([
    ...adapters.flatMap((adapter) =>
      adapter.status === "blocked"
        ? adapter.blockers.length > 0
          ? adapter.blockers
          : [`${adapter.label}: ${adapter.recoveryAction}`]
        : []
    ),
    ...reports.flatMap((report) =>
      report.status === "blocked"
        ? report.nextActions.length > 0
          ? report.nextActions.map((action) => `${report.label}: ${action}`)
          : [`${report.label}: blocked policy report requires review.`]
        : []
    )
  ]);
}

function createNextActions(
  registryActions: string[],
  policyReports: IntegrationEnablementPolicyReportSummary[],
  policyReceiptCoverage: IntegrationEnablementPolicyReceiptCoverage[]
): string[] {
  const policyActions = policyReports.flatMap((report) =>
    report.status === "ready" ? [] : report.nextActions.slice(0, 2).map((action) => `${report.label}: ${action}`)
  );
  const receiptActions = policyReceiptCoverage.flatMap((coverage) =>
    coverage.coverageStatus === "covered" ? [] : [coverage.recoveryAction]
  );

  return unique([
    DEFAULT_NEXT_ACTION,
    ...registryActions.map(sanitize).filter(Boolean),
    ...policyActions.map(sanitize).filter(Boolean),
    ...receiptActions.map(sanitize).filter(Boolean)
  ]);
}

function createOverallStatus(blockedCount: number, needsPolicyCount: number, readyCount: number): IntegrationAdapterStatus {
  if (blockedCount > 0) {
    return "blocked";
  }

  if (needsPolicyCount > 0) {
    return "needs-policy";
  }

  if (readyCount > 0) {
    return "ready";
  }

  return "disabled";
}

function createExternalEnablementStatus(
  blockedCount: number,
  needsPolicyCount: number
): IntegrationEnablementDossier["externalEnablementStatus"] {
  if (blockedCount > 0) {
    return "blocked-by-policy";
  }

  if (needsPolicyCount > 0) {
    return "needs-policy-review";
  }

  return "disabled-by-default";
}

function createAdapterGateItems(adapter: IntegrationEnablementAdapterSummary): IntegrationEnablementGateItem[] {
  if (adapter.status !== "blocked" && adapter.status !== "needs-policy") {
    return [];
  }

  return [
    {
      id: `adapter-${adapter.id}`,
      label: adapter.label,
      source: "adapter",
      status: adapter.status,
      priority: adapter.status === "blocked" ? "P0" : "P1",
      blocker: adapter.blockers[0] ?? adapter.requiredPolicy,
      recoveryAction: adapter.recoveryAction,
      externalCapabilityAllowed: false,
      externalCapabilityStatus: adapter.disabledReason ?? adapter.status,
      referenceHash: null,
      notLegalAdviceBoundary: adapter.notLegalAdviceBoundary
    }
  ];
}

function createPolicyReportGateItems(report: IntegrationEnablementPolicyReportSummary): IntegrationEnablementGateItem[] {
  if (report.status !== "blocked" && report.status !== "needs-policy") {
    return [];
  }

  return [
    {
      id: `policy-${report.id}`,
      label: report.label,
      source: "policy-report",
      status: report.status,
      priority: report.status === "blocked" ? "P0" : "P1",
      blocker: `${report.approvedControlCount}/${report.requiredControlCount} controls ready for ${report.externalCapability}.`,
      recoveryAction: report.nextActions[0] ?? `Resolve ${report.label} before adapter enablement review.`,
      externalCapabilityAllowed: false,
      externalCapabilityStatus: report.externalCapabilityStatus,
      referenceHash: null,
      notLegalAdviceBoundary: report.notLegalAdviceBoundary
    }
  ];
}

function createPolicyReceiptGateItems(coverage: IntegrationEnablementPolicyReceiptCoverage): IntegrationEnablementGateItem[] {
  if (coverage.coverageStatus === "covered") {
    return [];
  }

  const status: IntegrationEnablementGateItemStatus =
    coverage.coverageStatus === "missing" ? "missing-receipt" : coverage.coverageStatus;

  return [
    {
      id: `receipt-${coverage.policyId}`,
      label: coverage.label,
      source: "server-receipt",
      status,
      priority: status === "blocked" ? "P0" : "P1",
      blocker:
        status === "missing-receipt"
          ? `${coverage.label} is missing a server policy receipt.`
          : `${coverage.label} server policy receipt is ${coverage.coverageStatus}.`,
      recoveryAction: coverage.recoveryAction,
      externalCapabilityAllowed: false,
      externalCapabilityStatus: coverage.externalCapabilityStatus,
      referenceHash: coverage.reportHash,
      notLegalAdviceBoundary: coverage.notLegalAdviceBoundary
    }
  ];
}

function createGateStatus(
  blockerCount: number,
  policyOrReceiptGapCount: number,
  dossier: IntegrationEnablementDossier
): IntegrationAdapterStatus {
  if (blockerCount > 0) {
    return "blocked";
  }

  if (policyOrReceiptGapCount > 0) {
    return "needs-policy";
  }

  if (dossier.policyReceiptCoverageCount > 0 && dossier.policyReceiptCoveredCount === dossier.policyReceiptCoverageCount) {
    return "ready";
  }

  return "disabled";
}

function compareGateItems(left: IntegrationEnablementGateItem, right: IntegrationEnablementGateItem): number {
  const priority = priorityWeight(left.priority) - priorityWeight(right.priority);

  if (priority !== 0) {
    return priority;
  }

  return left.label.localeCompare(right.label);
}

function priorityWeight(priority: IntegrationEnablementGateItemPriority): number {
  if (priority === "P0") {
    return 0;
  }

  if (priority === "P1") {
    return 1;
  }

  return 2;
}

function normalizeStatus(value: string): IntegrationAdapterStatus {
  if (value === "ready" || value === "needs-policy" || value === "blocked" || value === "disabled") {
    return value;
  }

  return "blocked";
}

function normalizeNonDisabledStatus(value: string): Exclude<IntegrationAdapterStatus, "disabled"> {
  if (value === "ready" || value === "needs-policy" || value === "blocked") {
    return value;
  }

  return "blocked";
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
}

function preserveSha256(value: string): string {
  const normalized = value.trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : "[invalid-hash]";
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}
