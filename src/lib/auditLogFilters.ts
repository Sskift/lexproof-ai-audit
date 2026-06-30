import type { AuditLogRecord } from "./phase2Types.js";

export type AuditLogFilterInput = {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
};

export type AuditLogFilters = {
  actorId?: string;
  action?: string;
  targetType?: AuditLogRecord["targetType"];
  targetId?: string;
};

export type AuditLogFilterValidation =
  | {
      valid: true;
      filters: AuditLogFilters;
    }
  | {
      valid: false;
      errors: string[];
    };

const auditLogTargetTypes: AuditLogRecord["targetType"][] = ["workspace", "evidence", "model-run", "human-review", "export"];

export function normalizeAuditLogFilters(input: AuditLogFilterInput): AuditLogFilterValidation {
  const filters: AuditLogFilters = {};
  const actorId = input.actorId?.trim();
  const action = input.action?.trim();
  const targetId = input.targetId?.trim();
  const targetType = input.targetType?.trim();

  if (actorId) {
    filters.actorId = actorId;
  }

  if (action) {
    filters.action = action;
  }

  if (targetId) {
    filters.targetId = targetId;
  }

  if (targetType) {
    if (!isAuditLogTargetType(targetType)) {
      return {
        valid: false,
        errors: ["Audit log target type must be workspace, evidence, model-run, human-review, or export."]
      };
    }
    filters.targetType = targetType;
  }

  return {
    valid: true,
    filters
  };
}

export function filterAuditLogRecords(records: AuditLogRecord[], filters: AuditLogFilters): AuditLogRecord[] {
  return records.filter((record) => {
    if (filters.actorId && record.actorId !== filters.actorId) {
      return false;
    }

    if (filters.action && record.action !== filters.action) {
      return false;
    }

    if (filters.targetType && record.targetType !== filters.targetType) {
      return false;
    }

    if (filters.targetId && record.targetId !== filters.targetId) {
      return false;
    }

    return true;
  });
}

function isAuditLogTargetType(value: string): value is AuditLogRecord["targetType"] {
  return auditLogTargetTypes.includes(value as AuditLogRecord["targetType"]);
}
