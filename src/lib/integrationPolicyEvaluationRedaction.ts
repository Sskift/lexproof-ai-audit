import type {
  IntegrationPolicyEvaluationReceiptBundle,
  IntegrationPolicyEvaluationReceiptBundleRecord,
  IntegrationPolicyEvaluationRecord,
  IntegrationPolicyReceiptRecoveryItem,
  IntegrationPolicyReceiptRecoveryPacket,
  IntegrationPolicyReceiptRecoveryPacketSummary
} from "./integrationPolicyEvaluation";
import { redactIntegrationPolicyText } from "./integrationPolicyReportRedaction";

const RECEIPT_RECOVERY_BOUNDARY =
  "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only." as const;
const RECEIPT_RECOVERY_ITEM_BOUNDARY =
  "Not legal advice. Integration policy receipt recovery items are audit preparation metadata only." as const;

export function redactIntegrationPolicyEvaluationRecord<T extends IntegrationPolicyEvaluationRecord>(record: T): T {
  const id = redactIntegrationPolicyText(record.id);
  const workspaceId = redactIntegrationPolicyText(record.workspaceId);
  const reportVersion = redactIntegrationPolicyText(record.reportVersion);
  const externalCapabilityStatus = redactIntegrationPolicyText(record.externalCapabilityStatus);
  const evaluatorId = redactIntegrationPolicyText(record.evaluatorId);
  const createdAt = redactIntegrationPolicyText(record.createdAt);
  const nextActions = redactTextArray(record.nextActions);
  const changed =
    id !== record.id ||
    workspaceId !== record.workspaceId ||
    reportVersion !== record.reportVersion ||
    externalCapabilityStatus !== record.externalCapabilityStatus ||
    evaluatorId !== record.evaluatorId ||
    createdAt !== record.createdAt ||
    nextActions.changed;

  if (!changed) {
    return record;
  }

  return {
    ...record,
    id,
    workspaceId,
    reportVersion,
    externalCapabilityStatus,
    evaluatorId,
    createdAt,
    nextActions: nextActions.value
  };
}

export function redactIntegrationPolicyEvaluationReceiptBundle<T extends IntegrationPolicyEvaluationReceiptBundle>(
  bundle: T
): T {
  const workspaceId = redactIntegrationPolicyText(bundle.workspaceId);
  const generatedAt = redactIntegrationPolicyText(bundle.generatedAt);
  const nextActions = redactTextArray(bundle.nextActions);
  const records = redactReceiptBundleRecords(bundle.records);
  const changed =
    workspaceId !== bundle.workspaceId || generatedAt !== bundle.generatedAt || nextActions.changed || records.changed;

  if (!changed) {
    return bundle;
  }

  return {
    ...bundle,
    workspaceId,
    generatedAt,
    nextActions: nextActions.value,
    records: records.value
  };
}

export function redactIntegrationPolicyReceiptRecoveryPacket<T extends IntegrationPolicyReceiptRecoveryPacket>(
  packet: T
): T {
  const workspaceId = redactIntegrationPolicyText(packet.workspaceId);
  const generatedAt = redactIntegrationPolicyText(packet.generatedAt);
  const summary = redactIntegrationPolicyReceiptRecoverySummary(packet.summary);
  const items = redactReceiptRecoveryItems(packet.items);
  const nextActions = redactTextArray(packet.nextActions);
  const changed =
    workspaceId !== packet.workspaceId ||
    generatedAt !== packet.generatedAt ||
    summary !== packet.summary ||
    items.changed ||
    nextActions.changed ||
    packet.notLegalAdviceBoundary !== RECEIPT_RECOVERY_BOUNDARY;

  if (!changed) {
    return packet;
  }

  return {
    ...packet,
    workspaceId,
    generatedAt,
    summary,
    items: items.value,
    nextActions: nextActions.value,
    notLegalAdviceBoundary: RECEIPT_RECOVERY_BOUNDARY
  };
}

function redactIntegrationPolicyReceiptRecoverySummary<T extends IntegrationPolicyReceiptRecoveryPacketSummary>(
  summary: T
): T {
  const nextAction = redactIntegrationPolicyText(summary.nextAction);
  const changed = nextAction !== summary.nextAction || summary.notLegalAdviceBoundary !== RECEIPT_RECOVERY_BOUNDARY;

  if (!changed) {
    return summary;
  }

  return {
    ...summary,
    nextAction,
    notLegalAdviceBoundary: RECEIPT_RECOVERY_BOUNDARY
  };
}

function redactReceiptRecoveryItems<T extends IntegrationPolicyReceiptRecoveryItem>(
  items: T[]
): { value: T[]; changed: boolean } {
  let changed = false;
  const value = items.map((item) => {
    const redacted = redactReceiptRecoveryItem(item);
    changed = changed || redacted.changed;
    return redacted.value;
  });

  return changed ? { value, changed: true } : { value: items, changed: false };
}

function redactReceiptRecoveryItem<T extends IntegrationPolicyReceiptRecoveryItem>(
  item: T
): { value: T; changed: boolean } {
  const policyLabel = redactIntegrationPolicyText(item.policyLabel);
  const recordId = item.recordId === null ? null : redactIntegrationPolicyText(item.recordId);
  const supersededByRecordId =
    item.supersededByRecordId === null ? null : redactIntegrationPolicyText(item.supersededByRecordId);
  const reportVersion = item.reportVersion === null ? null : redactIntegrationPolicyText(item.reportVersion);
  const externalCapabilityStatus = redactIntegrationPolicyText(item.externalCapabilityStatus);
  const recoveryAction = redactIntegrationPolicyText(item.recoveryAction);
  const changed =
    policyLabel !== item.policyLabel ||
    recordId !== item.recordId ||
    supersededByRecordId !== item.supersededByRecordId ||
    reportVersion !== item.reportVersion ||
    externalCapabilityStatus !== item.externalCapabilityStatus ||
    recoveryAction !== item.recoveryAction ||
    item.notLegalAdviceBoundary !== RECEIPT_RECOVERY_ITEM_BOUNDARY;

  if (!changed) {
    return { value: item, changed: false };
  }

  return {
    value: {
      ...item,
      policyLabel,
      recordId,
      supersededByRecordId,
      reportVersion,
      externalCapabilityStatus,
      recoveryAction,
      notLegalAdviceBoundary: RECEIPT_RECOVERY_ITEM_BOUNDARY
    },
    changed: true
  };
}

function redactReceiptBundleRecords<T extends IntegrationPolicyEvaluationReceiptBundleRecord>(
  records: T[]
): { value: T[]; changed: boolean } {
  let changed = false;
  const value = records.map((record) => {
    const redacted = redactReceiptBundleRecord(record);
    changed = changed || redacted.changed;
    return redacted.value;
  });

  return changed ? { value, changed: true } : { value: records, changed: false };
}

function redactReceiptBundleRecord<T extends IntegrationPolicyEvaluationReceiptBundleRecord>(
  record: T
): { value: T; changed: boolean } {
  const id = redactIntegrationPolicyText(record.id);
  const reportVersion = redactIntegrationPolicyText(record.reportVersion);
  const externalCapabilityStatus = redactIntegrationPolicyText(record.externalCapabilityStatus);
  const evaluatorId = redactIntegrationPolicyText(record.evaluatorId);
  const createdAt = redactIntegrationPolicyText(record.createdAt);
  const nextActions = redactTextArray(record.nextActions);
  const changed =
    id !== record.id ||
    reportVersion !== record.reportVersion ||
    externalCapabilityStatus !== record.externalCapabilityStatus ||
    evaluatorId !== record.evaluatorId ||
    createdAt !== record.createdAt ||
    nextActions.changed;

  if (!changed) {
    return { value: record, changed: false };
  }

  return {
    value: {
      ...record,
      id,
      reportVersion,
      externalCapabilityStatus,
      evaluatorId,
      createdAt,
      nextActions: nextActions.value
    },
    changed: true
  };
}

function redactTextArray(values: string[]): { value: string[]; changed: boolean } {
  let changed = false;
  const value = values.map((item) => {
    const redacted = redactIntegrationPolicyText(item);
    changed = changed || redacted !== item;
    return redacted;
  });

  return changed ? { value, changed: true } : { value: values, changed: false };
}
