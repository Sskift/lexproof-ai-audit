import type { ChainAnchorPolicyReport } from "./chainAnchorPolicy.js";
import type { DocumentParserPolicyReport } from "./documentParserPolicy.js";
import type { GrcDestinationPolicyReport } from "./grcDestinationPolicy.js";
import type { ObjectStoragePolicyReport } from "./objectStoragePolicy.js";

export type IntegrationPolicyId = "object-storage" | "document-parser" | "chain-anchor" | "grc-destination";
type IntegrationPolicyEvaluationStatus = "ready" | "needs-policy" | "blocked" | "disabled";

export type IntegrationPolicyEvaluationRecord = {
  recordVersion: "lexproof-integration-policy-evaluation-record-v1";
  id: string;
  workspaceId: string;
  policyId: IntegrationPolicyId;
  reportVersion: string;
  overallStatus: Extract<IntegrationPolicyEvaluationStatus, "ready" | "needs-policy" | "blocked">;
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
  notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only.";
};

export type IntegrationPolicyEvaluationReport =
  | ObjectStoragePolicyReport
  | DocumentParserPolicyReport
  | ChainAnchorPolicyReport
  | GrcDestinationPolicyReport;

export type IntegrationPolicyEvaluationReceiptBundleRecord = Pick<
  IntegrationPolicyEvaluationRecord,
  | "id"
  | "policyId"
  | "reportVersion"
  | "overallStatus"
  | "approvedControlCount"
  | "requiredControlCount"
  | "externalCapabilityAllowed"
  | "externalCapabilityStatus"
  | "reportHash"
  | "contextHash"
  | "policyHash"
  | "evaluatorId"
  | "source"
  | "createdAt"
  | "nextActions"
>;

export type IntegrationPolicyEvaluationReceiptBundle = {
  bundleVersion: "lexproof-integration-policy-evaluation-receipt-bundle-v1";
  workspaceId: string;
  generatedAt: string;
  bundleHash: string;
  recordCount: number;
  policyCount: number;
  missingPolicyIds: IntegrationPolicyId[];
  readyCount: number;
  needsPolicyCount: number;
  blockedCount: number;
  externalEnablementAllowed: false;
  nextActions: string[];
  records: IntegrationPolicyEvaluationReceiptBundleRecord[];
  notLegalAdviceBoundary: "Not legal advice. Integration policy receipt bundles are audit preparation metadata only.";
};

export type IntegrationPolicyReceiptRecoveryStatus =
  | "missing-receipt"
  | "blocked"
  | "needs-policy"
  | "stale-receipt"
  | "ready";

export type IntegrationPolicyReceiptRecoveryPriority = "P0" | "P1" | "P2";

export type IntegrationPolicyReceiptRecoveryItem = {
  itemVersion: "lexproof-integration-policy-receipt-recovery-item-v1";
  policyId: IntegrationPolicyId;
  policyLabel: string;
  recordId: string | null;
  supersededByRecordId: string | null;
  reportVersion: string | null;
  overallStatus: IntegrationPolicyEvaluationRecord["overallStatus"] | "missing";
  reportHash: string | null;
  contextHash: string | null;
  policyHash: string | null;
  externalCapabilityAllowed: false;
  externalCapabilityStatus: string;
  recoveryStatus: IntegrationPolicyReceiptRecoveryStatus;
  priority: IntegrationPolicyReceiptRecoveryPriority;
  recoveryAction: string;
  notLegalAdviceBoundary: "Not legal advice. Integration policy receipt recovery items are audit preparation metadata only.";
};

export type IntegrationPolicyReceiptRecoveryPacketStatus =
  | "empty"
  | "missing-receipts"
  | "blocked"
  | "needs-policy"
  | "stale-receipts"
  | "ready";

export type IntegrationPolicyReceiptRecoveryPacketSummary = {
  totalRecoveryCount: number;
  missingPolicyCount: number;
  blockedCount: number;
  needsPolicyCount: number;
  staleReceiptCount: number;
  readyPolicyCount: number;
  latestReceiptCount: number;
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only.";
};

export type IntegrationPolicyReceiptRecoveryPacket = {
  packetVersion: "lexproof-integration-policy-receipt-recovery-packet-v1";
  workspaceId: string;
  generatedAt: string;
  status: IntegrationPolicyReceiptRecoveryPacketStatus;
  recordCount: number;
  policyCount: number;
  externalEnablementAllowed: false;
  summary: IntegrationPolicyReceiptRecoveryPacketSummary;
  items: IntegrationPolicyReceiptRecoveryItem[];
  nextActions: string[];
  packetHash: string;
  notLegalAdviceBoundary: "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only.";
};

export type CreateIntegrationPolicyEvaluationRecordInput = {
  workspaceId: string;
  policyId: IntegrationPolicyId;
  report: IntegrationPolicyEvaluationReport;
  context: Record<string, unknown>;
  policy: Record<string, unknown>;
  evaluatorId?: string;
  createdAt?: string;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Integration policy evaluation records are audit preparation metadata only." as const;
const RECEIPT_BUNDLE_NOT_LEGAL_ADVICE =
  "Not legal advice. Integration policy receipt bundles are audit preparation metadata only." as const;
const RECEIPT_RECOVERY_NOT_LEGAL_ADVICE =
  "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only." as const;
const RECEIPT_RECOVERY_ITEM_NOT_LEGAL_ADVICE =
  "Not legal advice. Integration policy receipt recovery items are audit preparation metadata only." as const;
const INTEGRATION_POLICY_IDS: IntegrationPolicyId[] = ["object-storage", "document-parser", "chain-anchor", "grc-destination"];

export async function createIntegrationPolicyEvaluationRecord({
  workspaceId,
  policyId,
  report,
  context,
  policy,
  evaluatorId = "Integration policy evaluator",
  createdAt = new Date().toISOString()
}: CreateIntegrationPolicyEvaluationRecordInput): Promise<IntegrationPolicyEvaluationRecord> {
  const normalizedWorkspaceId = sanitize(workspaceId);
  if (!normalizedWorkspaceId) {
    throw new Error("Workspace ID is required for integration policy evaluation records.");
  }

  const summary = summarizePolicyReport(policyId, report);
  const reportHash = await sha256Hex(stableStringify(summary.hashReport));
  const contextHash = await sha256Hex(stableStringify(redactMetadataObject(context)));
  const policyHash = await sha256Hex(stableStringify(redactMetadataObject(policy)));
  const idHash = await sha256Hex(
    stableStringify({
      workspaceId: normalizedWorkspaceId,
      policyId,
      reportHash,
      contextHash,
      policyHash,
      createdAt
    })
  );

  return {
    recordVersion: "lexproof-integration-policy-evaluation-record-v1",
    id: `integration-policy-evaluation-${idHash.slice(0, 16)}`,
    workspaceId: normalizedWorkspaceId,
    policyId,
    reportVersion: summary.reportVersion,
    overallStatus: summary.overallStatus,
    approvedControlCount: summary.approvedControlCount,
    requiredControlCount: summary.requiredControlCount,
    externalCapabilityAllowed: false,
    externalCapabilityStatus: summary.externalCapabilityStatus,
    reportHash,
    contextHash,
    policyHash,
    evaluatorId: sanitize(evaluatorId) || "Integration policy evaluator",
    source: "server",
    createdAt,
    nextActions: summary.nextActions,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function isIntegrationPolicyEvaluationRecord(value: unknown): value is IntegrationPolicyEvaluationRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.recordVersion === "lexproof-integration-policy-evaluation-record-v1" &&
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    isIntegrationPolicyId(value.policyId) &&
    typeof value.reportVersion === "string" &&
    (value.overallStatus === "ready" || value.overallStatus === "needs-policy" || value.overallStatus === "blocked") &&
    isValidControlCountPair(value.approvedControlCount, value.requiredControlCount) &&
    value.externalCapabilityAllowed === false &&
    typeof value.externalCapabilityStatus === "string" &&
    isSha256(value.reportHash) &&
    isSha256(value.contextHash) &&
    isSha256(value.policyHash) &&
    typeof value.evaluatorId === "string" &&
    value.source === "server" &&
    typeof value.createdAt === "string" &&
    isNonEmptyStringArray(value.nextActions) &&
    value.notLegalAdviceBoundary === NOT_LEGAL_ADVICE
  );
}

export async function createIntegrationPolicyEvaluationReceiptBundle(input: {
  workspaceId: string;
  records: IntegrationPolicyEvaluationRecord[];
  generatedAt?: string;
}): Promise<IntegrationPolicyEvaluationReceiptBundle> {
  const workspaceId = sanitize(input.workspaceId) || "local-workspace";
  const records = input.records
    .filter((record) => record.workspaceId === workspaceId)
    .map(validateReceiptBundleRecord)
    .map(toBundleRecord)
    .sort(compareBundleRecords);
  const policyIds = Array.from(new Set(records.map((record) => record.policyId))).sort(comparePolicyIds);
  const missingPolicyIds = INTEGRATION_POLICY_IDS.filter((policyId) => !policyIds.includes(policyId));
  const readyCount = records.filter((record) => record.overallStatus === "ready").length;
  const needsPolicyCount = records.filter((record) => record.overallStatus === "needs-policy").length;
  const blockedCount = records.filter((record) => record.overallStatus === "blocked").length;
  const nextActions = createReceiptBundleNextActions(records, missingPolicyIds);
  const hashPayload = {
    bundleVersion: "lexproof-integration-policy-evaluation-receipt-bundle-v1" as const,
    workspaceId,
    recordCount: records.length,
    policyCount: policyIds.length,
    missingPolicyIds,
    readyCount,
    needsPolicyCount,
    blockedCount,
    externalEnablementAllowed: false as const,
    nextActions,
    records,
    notLegalAdviceBoundary: RECEIPT_BUNDLE_NOT_LEGAL_ADVICE
  };

  return {
    ...hashPayload,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    bundleHash: await sha256Hex(stableStringify(hashPayload))
  };
}

export function exportIntegrationPolicyEvaluationReceiptBundleJson(
  bundle: IntegrationPolicyEvaluationReceiptBundle
): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function downloadIntegrationPolicyEvaluationReceiptBundleJson(
  filename: string,
  bundle: IntegrationPolicyEvaluationReceiptBundle
): void {
  const browser = resolveBrowserDownloadGlobals();
  const blob = new browser.Blob([exportIntegrationPolicyEvaluationReceiptBundleJson(bundle)], {
    type: "application/json;charset=utf-8"
  });
  const url = browser.URL.createObjectURL(blob);
  const link = browser.document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  browser.document.body.appendChild(link);
  link.click();
  link.remove();
  browser.URL.revokeObjectURL(url);
}

export async function createIntegrationPolicyReceiptRecoveryPacket(input: {
  workspaceId: string;
  records: IntegrationPolicyEvaluationRecord[];
  generatedAt?: string;
}): Promise<IntegrationPolicyReceiptRecoveryPacket> {
  const workspaceId = sanitize(input.workspaceId) || "local-workspace";
  const records = input.records
    .filter((record) => record.workspaceId === workspaceId)
    .map(validateReceiptBundleRecord)
    .sort(compareRecoveryRecords);
  const latestRecords = createLatestReceiptMap(records);
  const items = createReceiptRecoveryItems(records, latestRecords).sort(compareRecoveryItems);
  const summary = createReceiptRecoverySummary(items, latestRecords.size);
  const status = createReceiptRecoveryPacketStatus(summary, records.length);
  const nextActions = createReceiptRecoveryNextActions(items, summary, records.length);
  const hashPayload = {
    packetVersion: "lexproof-integration-policy-receipt-recovery-packet-v1" as const,
    workspaceId,
    status,
    recordCount: records.length,
    policyCount: latestRecords.size,
    externalEnablementAllowed: false as const,
    summary,
    items,
    nextActions,
    notLegalAdviceBoundary: RECEIPT_RECOVERY_NOT_LEGAL_ADVICE
  };

  return {
    ...hashPayload,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    packetHash: await sha256Hex(stableStringify(hashPayload))
  };
}

export function exportIntegrationPolicyReceiptRecoveryPacketJson(packet: IntegrationPolicyReceiptRecoveryPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

export function downloadIntegrationPolicyReceiptRecoveryPacketJson(
  filename: string,
  packet: IntegrationPolicyReceiptRecoveryPacket
): void {
  const browser = resolveBrowserDownloadGlobals();
  const blob = new browser.Blob([exportIntegrationPolicyReceiptRecoveryPacketJson(packet)], {
    type: "application/json;charset=utf-8"
  });
  const url = browser.URL.createObjectURL(blob);
  const link = browser.document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  browser.document.body.appendChild(link);
  link.click();
  link.remove();
  browser.URL.revokeObjectURL(url);
}

function toBundleRecord(record: IntegrationPolicyEvaluationRecord): IntegrationPolicyEvaluationReceiptBundleRecord {
  return {
    id: sanitize(record.id),
    policyId: record.policyId,
    reportVersion: sanitize(record.reportVersion),
    overallStatus: record.overallStatus,
    approvedControlCount: record.approvedControlCount,
    requiredControlCount: record.requiredControlCount,
    externalCapabilityAllowed: false,
    externalCapabilityStatus: sanitize(record.externalCapabilityStatus),
    reportHash: record.reportHash,
    contextHash: record.contextHash,
    policyHash: record.policyHash,
    evaluatorId: sanitize(record.evaluatorId) || "Integration policy evaluator",
    source: "server",
    createdAt: sanitize(record.createdAt),
    nextActions: record.nextActions.map(sanitize).filter(Boolean)
  };
}

function validateReceiptBundleRecord(record: IntegrationPolicyEvaluationRecord): IntegrationPolicyEvaluationRecord {
  if (!isIntegrationPolicyEvaluationRecord(record)) {
    throw new Error("Integration policy receipt bundles require valid metadata-only evaluation records.");
  }

  return record;
}

function createLatestReceiptMap(records: IntegrationPolicyEvaluationRecord[]): Map<IntegrationPolicyId, IntegrationPolicyEvaluationRecord> {
  const latestRecords = new Map<IntegrationPolicyId, IntegrationPolicyEvaluationRecord>();

  for (const record of records) {
    const existing = latestRecords.get(record.policyId);
    if (!existing || compareLatestReceipt(record, existing) > 0) {
      latestRecords.set(record.policyId, record);
    }
  }

  return latestRecords;
}

function createReceiptRecoveryItems(
  records: IntegrationPolicyEvaluationRecord[],
  latestRecords: Map<IntegrationPolicyId, IntegrationPolicyEvaluationRecord>
): IntegrationPolicyReceiptRecoveryItem[] {
  const items: IntegrationPolicyReceiptRecoveryItem[] = [];

  for (const policyId of INTEGRATION_POLICY_IDS) {
    const latestRecord = latestRecords.get(policyId);
    items.push(latestRecord ? createLatestReceiptRecoveryItem(latestRecord) : createMissingReceiptRecoveryItem(policyId));
  }

  const latestRecordIds = new Set(Array.from(latestRecords.values()).map((record) => record.id));
  for (const staleRecord of records.filter((record) => !latestRecordIds.has(record.id))) {
    const supersededByRecordId = latestRecords.get(staleRecord.policyId)?.id ?? null;
    items.push(createStaleReceiptRecoveryItem(staleRecord, supersededByRecordId));
  }

  return items;
}

function createMissingReceiptRecoveryItem(policyId: IntegrationPolicyId): IntegrationPolicyReceiptRecoveryItem {
  return {
    itemVersion: "lexproof-integration-policy-receipt-recovery-item-v1",
    policyId,
    policyLabel: labelPolicyId(policyId),
    recordId: null,
    supersededByRecordId: null,
    reportVersion: null,
    overallStatus: "missing",
    reportHash: null,
    contextHash: null,
    policyHash: null,
    externalCapabilityAllowed: false,
    externalCapabilityStatus: "missing-server-receipt",
    recoveryStatus: "missing-receipt",
    priority: "P0",
    recoveryAction: `Evaluate ${labelPolicyId(policyId)} on the server before any adapter enablement review.`,
    notLegalAdviceBoundary: RECEIPT_RECOVERY_ITEM_NOT_LEGAL_ADVICE
  };
}

function createLatestReceiptRecoveryItem(record: IntegrationPolicyEvaluationRecord): IntegrationPolicyReceiptRecoveryItem {
  const recoveryStatus = createLatestReceiptRecoveryStatus(record);

  return {
    itemVersion: "lexproof-integration-policy-receipt-recovery-item-v1",
    policyId: record.policyId,
    policyLabel: labelPolicyId(record.policyId),
    recordId: sanitize(record.id),
    supersededByRecordId: null,
    reportVersion: sanitize(record.reportVersion),
    overallStatus: record.overallStatus,
    reportHash: record.reportHash,
    contextHash: record.contextHash,
    policyHash: record.policyHash,
    externalCapabilityAllowed: false,
    externalCapabilityStatus: sanitize(record.externalCapabilityStatus),
    recoveryStatus,
    priority: priorityForReceiptRecoveryStatus(recoveryStatus),
    recoveryAction: createLatestReceiptRecoveryAction(record, recoveryStatus),
    notLegalAdviceBoundary: RECEIPT_RECOVERY_ITEM_NOT_LEGAL_ADVICE
  };
}

function createStaleReceiptRecoveryItem(
  record: IntegrationPolicyEvaluationRecord,
  supersededByRecordId: string | null
): IntegrationPolicyReceiptRecoveryItem {
  return {
    itemVersion: "lexproof-integration-policy-receipt-recovery-item-v1",
    policyId: record.policyId,
    policyLabel: labelPolicyId(record.policyId),
    recordId: sanitize(record.id),
    supersededByRecordId: supersededByRecordId ? sanitize(supersededByRecordId) : null,
    reportVersion: sanitize(record.reportVersion),
    overallStatus: record.overallStatus,
    reportHash: record.reportHash,
    contextHash: record.contextHash,
    policyHash: record.policyHash,
    externalCapabilityAllowed: false,
    externalCapabilityStatus: sanitize(record.externalCapabilityStatus),
    recoveryStatus: "stale-receipt",
    priority: "P2",
    recoveryAction: `Use the latest ${labelPolicyId(record.policyId)} receipt before adapter enablement review; keep this older receipt only for audit lineage.`,
    notLegalAdviceBoundary: RECEIPT_RECOVERY_ITEM_NOT_LEGAL_ADVICE
  };
}

function createLatestReceiptRecoveryStatus(record: IntegrationPolicyEvaluationRecord): IntegrationPolicyReceiptRecoveryStatus {
  if (record.overallStatus === "blocked") {
    return "blocked";
  }
  if (record.overallStatus === "needs-policy") {
    return "needs-policy";
  }
  return "ready";
}

function createLatestReceiptRecoveryAction(
  record: IntegrationPolicyEvaluationRecord,
  recoveryStatus: IntegrationPolicyReceiptRecoveryStatus
): string {
  if (recoveryStatus === "blocked" || recoveryStatus === "needs-policy") {
    return sanitize(record.nextActions[0] ?? "Refresh this integration policy receipt before adapter enablement review.");
  }

  return `Keep the latest ${labelPolicyId(record.policyId)} receipt with the disabled-adapter enablement dossier.`;
}

function createReceiptRecoverySummary(
  items: IntegrationPolicyReceiptRecoveryItem[],
  latestReceiptCount: number
): IntegrationPolicyReceiptRecoveryPacketSummary {
  const totalRecoveryCount = items.filter((item) => item.recoveryStatus !== "ready").length;
  const missingPolicyCount = items.filter((item) => item.recoveryStatus === "missing-receipt").length;
  const blockedCount = items.filter((item) => item.recoveryStatus === "blocked").length;
  const needsPolicyCount = items.filter((item) => item.recoveryStatus === "needs-policy").length;
  const staleReceiptCount = items.filter((item) => item.recoveryStatus === "stale-receipt").length;
  const readyPolicyCount = items.filter((item) => item.recoveryStatus === "ready").length;

  return {
    totalRecoveryCount,
    missingPolicyCount,
    blockedCount,
    needsPolicyCount,
    staleReceiptCount,
    readyPolicyCount,
    latestReceiptCount,
    nextAction: createReceiptRecoverySummaryAction({
      totalRecoveryCount,
      missingPolicyCount,
      blockedCount,
      needsPolicyCount,
      staleReceiptCount
    }),
    notLegalAdviceBoundary: RECEIPT_RECOVERY_NOT_LEGAL_ADVICE
  };
}

function createReceiptRecoverySummaryAction({
  totalRecoveryCount,
  missingPolicyCount,
  blockedCount,
  needsPolicyCount,
  staleReceiptCount
}: Pick<
  IntegrationPolicyReceiptRecoveryPacketSummary,
  "totalRecoveryCount" | "missingPolicyCount" | "blockedCount" | "needsPolicyCount" | "staleReceiptCount"
>): string {
  if (totalRecoveryCount === 0) {
    return "Keep integration adapters disabled and attach the latest policy receipts to the enablement dossier.";
  }
  if (missingPolicyCount > 0) {
    return "Evaluate every missing server integration policy before any adapter enablement review.";
  }
  if (blockedCount > 0) {
    return "Resolve blocked integration policy receipts before any external adapter enablement review.";
  }
  if (needsPolicyCount > 0) {
    return "Complete needs-policy controls and refresh the affected integration policy receipts.";
  }
  if (staleReceiptCount > 0) {
    return "Use only the latest receipt per integration policy for enablement review and keep older receipts for audit lineage.";
  }
  return "Keep integration adapters disabled and attach the latest policy receipts to the enablement dossier.";
}

function createReceiptRecoveryPacketStatus(
  summary: IntegrationPolicyReceiptRecoveryPacketSummary,
  recordCount: number
): IntegrationPolicyReceiptRecoveryPacketStatus {
  if (recordCount === 0) {
    return "empty";
  }
  if (summary.missingPolicyCount > 0) {
    return "missing-receipts";
  }
  if (summary.blockedCount > 0) {
    return "blocked";
  }
  if (summary.needsPolicyCount > 0) {
    return "needs-policy";
  }
  if (summary.staleReceiptCount > 0) {
    return "stale-receipts";
  }
  return "ready";
}

function createReceiptRecoveryNextActions(
  items: IntegrationPolicyReceiptRecoveryItem[],
  summary: IntegrationPolicyReceiptRecoveryPacketSummary,
  recordCount: number
): string[] {
  if (recordCount === 0) {
    return [
      "Evaluate object storage, document parser, chain anchor, and GRC destination policies before any adapter enablement review."
    ];
  }

  const actions = unique(items.filter((item) => item.recoveryStatus !== "ready").map((item) => item.recoveryAction));
  actions.push(summary.nextAction);
  actions.push("Keep external providers, storage, parsers, GRC destinations, and chain writes disabled until a separate enablement review.");
  return unique(actions);
}

function compareRecoveryRecords(
  left: IntegrationPolicyEvaluationRecord,
  right: IntegrationPolicyEvaluationRecord
): number {
  const policy = comparePolicyIds(left.policyId, right.policyId);
  if (policy !== 0) {
    return policy;
  }
  return compareLatestReceipt(left, right);
}

function compareLatestReceipt(left: IntegrationPolicyEvaluationRecord, right: IntegrationPolicyEvaluationRecord): number {
  const time = left.createdAt.localeCompare(right.createdAt);
  return time === 0 ? left.id.localeCompare(right.id) : time;
}

function compareRecoveryItems(left: IntegrationPolicyReceiptRecoveryItem, right: IntegrationPolicyReceiptRecoveryItem): number {
  const status = recoveryStatusWeight(left.recoveryStatus) - recoveryStatusWeight(right.recoveryStatus);
  if (status !== 0) {
    return status;
  }
  const policy = comparePolicyIds(left.policyId, right.policyId);
  if (policy !== 0) {
    return policy;
  }
  return (left.recordId ?? "").localeCompare(right.recordId ?? "");
}

function recoveryStatusWeight(status: IntegrationPolicyReceiptRecoveryStatus): number {
  if (status === "missing-receipt") {
    return 0;
  }
  if (status === "blocked") {
    return 1;
  }
  if (status === "needs-policy") {
    return 2;
  }
  if (status === "stale-receipt") {
    return 3;
  }
  return 4;
}

function priorityForReceiptRecoveryStatus(status: IntegrationPolicyReceiptRecoveryStatus): IntegrationPolicyReceiptRecoveryPriority {
  if (status === "missing-receipt" || status === "blocked") {
    return "P0";
  }
  if (status === "needs-policy") {
    return "P1";
  }
  return "P2";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function createReceiptBundleNextActions(
  records: IntegrationPolicyEvaluationReceiptBundleRecord[],
  missingPolicyIds: IntegrationPolicyId[]
): string[] {
  if (records.length === 0) {
    return ["Evaluate server integration policies before any adapter enablement review."];
  }

  const actions: string[] = [];
  if (missingPolicyIds.length > 0) {
    actions.push(
      `Evaluate missing server policy receipts before adapter enablement review: ${missingPolicyIds
        .map(labelPolicyId)
        .join(", ")}.`
    );
  }

  if (records.some((record) => record.overallStatus === "blocked")) {
    actions.push("Resolve blocked integration policy receipts before any external adapter enablement review.");
  }

  if (records.some((record) => record.overallStatus === "needs-policy")) {
    actions.push("Complete needs-policy controls and refresh persisted receipts before adapter enablement review.");
  }

  actions.push("Keep external providers, storage, parsers, GRC destinations, and chain writes disabled until a separate enablement review.");
  return actions;
}

function compareBundleRecords(
  left: IntegrationPolicyEvaluationReceiptBundleRecord,
  right: IntegrationPolicyEvaluationReceiptBundleRecord
): number {
  const policy = comparePolicyIds(left.policyId, right.policyId);
  if (policy !== 0) {
    return policy;
  }
  const time = left.createdAt.localeCompare(right.createdAt);
  return time === 0 ? left.id.localeCompare(right.id) : time;
}

function comparePolicyIds(left: IntegrationPolicyId, right: IntegrationPolicyId): number {
  return INTEGRATION_POLICY_IDS.indexOf(left) - INTEGRATION_POLICY_IDS.indexOf(right);
}

function labelPolicyId(policyId: IntegrationPolicyId): string {
  if (policyId === "object-storage") {
    return "Object Storage Policy";
  }
  if (policyId === "document-parser") {
    return "Document Parser Policy";
  }
  if (policyId === "chain-anchor") {
    return "Chain Anchor Policy";
  }
  return "GRC Destination Policy";
}

type BrowserDownloadGlobals = {
  Blob: typeof Blob;
  URL: {
    createObjectURL(blob: Blob): string;
    revokeObjectURL(url: string): void;
  };
  document: {
    body: {
      appendChild(node: unknown): void;
    };
    createElement(tagName: "a"): {
      href: string;
      download: string;
      style: { display: string };
      click(): void;
      remove(): void;
    };
  };
};

function resolveBrowserDownloadGlobals(): BrowserDownloadGlobals {
  const globals = globalThis as typeof globalThis & Partial<BrowserDownloadGlobals>;
  if (!globals.Blob || !globals.URL || !globals.document) {
    throw new Error("Integration Policy receipt bundle download requires browser document APIs.");
  }
  return globals as BrowserDownloadGlobals;
}

function summarizePolicyReport(policyId: IntegrationPolicyId, report: IntegrationPolicyEvaluationReport) {
  const reportVersion = sanitize(report.reportVersion);
  const overallStatus = normalizeStatus(report.overallStatus);
  const approvedControlCount = safeCount(report.approvedControlCount);
  const requiredControlCount = safeCount(report.requiredControlCount);
  const nextActions = report.nextActions.map(sanitize).filter(Boolean);
  const recoveryActions =
    nextActions.length > 0
      ? nextActions
      : ["Keep external integration adapters disabled until a separate enablement review."];
  const externalCapabilityStatus = getExternalCapabilityStatus(policyId, report);

  return {
    reportVersion,
    overallStatus,
    approvedControlCount,
    requiredControlCount,
    externalCapabilityStatus,
    nextActions: recoveryActions,
    hashReport: {
      reportVersion,
      overallStatus,
      approvedControlCount,
      requiredControlCount,
      externalCapabilityStatus,
      controls: report.controls.map((control: IntegrationPolicyEvaluationReport["controls"][number]) => ({
        id: sanitize(control.id),
        status: normalizeStatus(control.status),
        label: sanitize(control.label),
        evidence: sanitize(control.evidence),
        recoveryAction: sanitize(control.recoveryAction)
      })),
      nextActions: recoveryActions
    }
  };
}

function getExternalCapabilityStatus(policyId: IntegrationPolicyId, report: IntegrationPolicyEvaluationReport): string {
  if (policyId === "object-storage" && "externalObjectStorageStatus" in report) {
    return sanitize(report.externalObjectStorageStatus);
  }
  if (policyId === "document-parser" && "externalDocumentParsingStatus" in report) {
    return sanitize(report.externalDocumentParsingStatus);
  }
  if (policyId === "chain-anchor" && "externalChainAnchoringStatus" in report) {
    return sanitize(report.externalChainAnchoringStatus);
  }
  if (policyId === "grc-destination" && "externalGrcTicketCreationStatus" in report) {
    return sanitize(report.externalGrcTicketCreationStatus);
  }

  return "blocked-by-metadata";
}

function redactMetadataObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isUnsafeKey(key))
      .map(([key, item]) => [key, redactValue(item)])
  );
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitize(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (isRecord(value)) {
    return redactMetadataObject(value);
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  return "";
}

function isUnsafeKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("apikey") ||
    normalized.includes("api_key") ||
    normalized.includes("secret") ||
    normalized.includes("privatekey") ||
    normalized.includes("private_key") ||
    normalized.includes("rawevidence") ||
    normalized.includes("rawdocument") ||
    normalized.includes("rawkyc") ||
    normalized.includes("signedtransaction")
  );
}

function normalizeStatus(
  status: IntegrationPolicyEvaluationStatus
): Extract<IntegrationPolicyEvaluationStatus, "ready" | "needs-policy" | "blocked"> {
  if (status === "ready" || status === "needs-policy" || status === "blocked") {
    return status;
  }
  return "blocked";
}

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function isValidControlCountPair(approved: unknown, required: unknown): boolean {
  return isNonNegativeInteger(approved) && isNonNegativeInteger(required) && approved <= required;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function sanitize(value: string): string {
  return value
    .replace(/sk-[a-z0-9_-]{12,}/gi, "[redacted-credential]")
    .replace(/0x[a-f0-9]{40,}/gi, "[redacted-private-key-or-wallet-material]")
    .replace(/\b(passport|ssn|seed phrase|private key|api key|raw kyc)\b/gi, "[redacted-sensitive-material]")
    .trim();
}

function isIntegrationPolicyId(value: unknown): value is IntegrationPolicyId {
  return value === "object-storage" || value === "document-parser" || value === "chain-anchor" || value === "grc-destination";
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
