import { describe, expect, it } from "vitest";
import { createAuditLogExport, exportAuditLogJson } from "./auditLogExport";
import type { AuditLogRecord } from "./phase2Types";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";

describe("createAuditLogExport", () => {
  it("creates a metadata-only audit log export with stable event ordering and counts", () => {
    const exportRecord = createAuditLogExport({
      workspaceId: "workspace-audit-export",
      records: [
        createRecord({
          id: "audit-log-2",
          action: "model.run.created",
          targetType: "model-run",
          createdAt: "2026-06-30T00:00:02.000Z"
        }),
        createRecord({ id: "audit-log-1", action: "workspace.created", createdAt: "2026-06-30T00:00:01.000Z" }),
        createRecord({
          id: "audit-log-3",
          action: "model.run.created",
          targetType: "model-run",
          createdAt: "2026-06-30T00:00:03.000Z"
        }),
        createRecord({
          id: "audit-log-4",
          action: "integration-policy.evaluated",
          targetType: "integration-policy",
          targetId: "integration-policy-evaluation-1",
          summary: "Evaluated object-storage integration policy as audit preparation metadata.",
          createdAt: "2026-06-30T00:00:04.000Z"
        })
      ],
      exportedAt: "2026-06-30T00:01:00.000Z"
    });

    expect(exportRecord).toMatchObject({
      exportVersion: "lexproof-audit-log-export-v1",
      workspaceId: "workspace-audit-export",
      exportedAt: "2026-06-30T00:01:00.000Z",
      eventCount: 4,
      firstEventAt: "2026-06-30T00:00:01.000Z",
      lastEventAt: "2026-06-30T00:00:04.000Z",
      actionCounts: {
        "integration-policy.evaluated": 1,
        "model.run.created": 2,
        "workspace.created": 1
      },
      actors: ["Compliance"],
      targetTypes: ["integration-policy", "model-run", "workspace"]
    });
    expect(exportRecord.events.map((event) => event.id)).toEqual(["audit-log-1", "audit-log-2", "audit-log-3", "audit-log-4"]);
    expect(exportRecord.events.at(-1)).toEqual(
      expect.objectContaining({
        targetType: "integration-policy",
        targetId: "integration-policy-evaluation-1",
        summary: "Evaluated object-storage integration policy as audit preparation metadata."
      })
    );
    expect(exportRecord.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("redacts secret-like text from summaries and identifiers before JSON export", () => {
    const exportRecord = createAuditLogExport({
      workspaceId: "workspace-audit-export",
      records: [
        createRecord({
          actorId: `reviewer ${apiKey}`,
          beforeHash: privateKey,
          afterHash: apiKey,
          summary: `Blocked ${apiKey}, private key ${privateKey}, and raw KYC packet before handoff.`
        })
      ],
      exportedAt: "2026-06-30T00:01:00.000Z"
    });
    const json = exportAuditLogJson(exportRecord);

    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).toContain("[redacted-raw-kyc]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("exports an empty audit log with a clear non-advice boundary", () => {
    const exportRecord = createAuditLogExport({
      workspaceId: "workspace-empty",
      records: [],
      exportedAt: "2026-06-30T00:01:00.000Z"
    });

    expect(exportRecord.eventCount).toBe(0);
    expect(exportRecord.events).toEqual([]);
    expect(exportRecord.actionCounts).toEqual({});
    expect(exportRecord.firstEventAt).toBeUndefined();
    expect(exportRecord.lastEventAt).toBeUndefined();
    expect(exportAuditLogJson(exportRecord)).toContain("Not legal advice");
  });
});

function createRecord(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    recordVersion: "lexproof-audit-log-record-v1",
    id: "audit-log-1",
    workspaceId: "workspace-audit-export",
    actorId: "Compliance",
    action: "workspace.created",
    targetType: "workspace",
    targetId: "workspace-audit-export",
    beforeHash: "",
    afterHash: "b".repeat(64),
    summary: "Created secure review workspace.",
    createdAt: "2026-06-30T00:00:01.000Z",
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata.",
    ...overrides
  };
}
