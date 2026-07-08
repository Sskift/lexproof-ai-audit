import type {
  IntegrationPolicyEvaluationReceiptBundle,
  IntegrationPolicyEvaluationReceiptBundleRecord,
  IntegrationPolicyEvaluationRecord
} from "./integrationPolicyEvaluation";
import { redactIntegrationPolicyText } from "./integrationPolicyReportRedaction";

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
