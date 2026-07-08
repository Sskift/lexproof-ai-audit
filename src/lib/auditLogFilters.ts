import type { AuditLogRecord } from "./phase2Types.js";

export type AuditLogFilterInput = {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
};

export type AuditLogRuntimeFilterInput = {
  actorId?: unknown;
  action?: unknown;
  targetType?: unknown;
  targetId?: unknown;
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

const auditLogTargetTypes: AuditLogRecord["targetType"][] = [
  "workspace",
  "evidence",
  "model-run",
  "human-review",
  "source-approval",
  "source-review",
  "integration-policy",
  "export"
];

export function normalizeAuditLogFilters(input: AuditLogRuntimeFilterInput): AuditLogFilterValidation {
  const filters: AuditLogFilters = {};
  const parsed = parseAuditLogFilterInput(input);

  if (!parsed.valid) {
    return parsed;
  }

  const { actorId, action, targetId, targetType } = parsed.filters;

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
        errors: [
          "Audit log target type must be workspace, evidence, model-run, human-review, source-approval, source-review, integration-policy, or export."
        ]
      };
    }
    filters.targetType = targetType;
  }

  return {
    valid: true,
    filters
  };
}

function parseAuditLogFilterInput(input: AuditLogRuntimeFilterInput): ParsedAuditLogFilterInput {
  const actorId = parseOptionalFilterValue("actorId", input.actorId);
  const action = parseOptionalFilterValue("action", input.action);
  const targetId = parseOptionalFilterValue("targetId", input.targetId);
  const targetType = parseOptionalFilterValue("targetType", input.targetType);
  const errors = [actorId, action, targetId, targetType].flatMap((result) => (result.valid ? [] : result.errors));

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return {
    valid: true,
    filters: {
      ...createParsedFilterEntry("actorId", actorId),
      ...createParsedFilterEntry("action", action),
      ...createParsedFilterEntry("targetId", targetId),
      ...createParsedFilterEntry("targetType", targetType)
    }
  };
}

function createParsedFilterEntry(
  key: "actorId" | "action" | "targetId" | "targetType",
  result: ParsedFilterValue
): Partial<ParsedAuditLogFilterValues> {
  return result.valid && result.value ? { [key]: result.value } : {};
}

type ParsedAuditLogFilterInput =
  | {
      valid: true;
      filters: ParsedAuditLogFilterValues;
    }
  | {
      valid: false;
      errors: string[];
    };

type ParsedAuditLogFilterValues = {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
};

type ParsedFilterValue =
  | {
      valid: true;
      value?: string;
    }
  | {
      valid: false;
      errors: string[];
    };

function parseOptionalFilterValue(field: keyof AuditLogRuntimeFilterInput, value: unknown): ParsedFilterValue {
  if (value === undefined || value === null) {
    return { valid: true };
  }

  if (typeof value !== "string") {
    return {
      valid: false,
      errors: [`Audit log ${field} filter must be a single string.`]
    };
  }

  const normalized = value.trim();
  return normalized ? { valid: true, value: normalized } : { valid: true };
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
