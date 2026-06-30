import { describe, expect, it } from "vitest";
import { filterAuditLogRecords, normalizeAuditLogFilters } from "./auditLogFilters";
import type { AuditLogRecord } from "./phase2Types";

describe("audit log filters", () => {
  it("filters audit log records by actor, action, target type, and target ID", () => {
    const records = [
      createRecord({ id: "audit-log-1", actorId: "Compliance", action: "workspace.created", targetType: "workspace", targetId: "workspace-1" }),
      createRecord({ id: "audit-log-2", actorId: "Counsel", action: "human-review.updated", targetType: "human-review", targetId: "review-1" }),
      createRecord({ id: "audit-log-3", actorId: "Counsel", action: "evidence.updated", targetType: "evidence", targetId: "evidence-1" })
    ];

    expect(
      filterAuditLogRecords(records, {
        actorId: "Counsel",
        targetType: "evidence",
        action: "evidence.updated",
        targetId: "evidence-1"
      })
    ).toEqual([records[2]]);
  });

  it("normalizes blank filters and rejects unsupported target types with a clear error", () => {
    expect(normalizeAuditLogFilters({ actorId: "  ", targetType: " evidence " })).toEqual({
      valid: true,
      filters: { targetType: "evidence" }
    });

    expect(normalizeAuditLogFilters({ targetType: "legal-opinion" })).toEqual({
      valid: false,
      errors: ["Audit log target type must be workspace, evidence, model-run, human-review, or export."]
    });
  });
});

function createRecord(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    recordVersion: "lexproof-audit-log-record-v1",
    id: "audit-log",
    workspaceId: "workspace-audit-filter",
    actorId: "Compliance",
    action: "workspace.created",
    targetType: "workspace",
    targetId: "workspace-audit-filter",
    beforeHash: "",
    afterHash: "a".repeat(64),
    summary: "Created secure review workspace.",
    createdAt: "2026-06-30T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata.",
    ...overrides
  };
}
