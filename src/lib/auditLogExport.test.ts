import { describe, expect, it } from "vitest";
import { createAuditLogExport, exportAuditLogJson } from "./auditLogExport";
import type { AuditLogRecord } from "./phase2Types";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const walletAddress = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const afterHash = "b".repeat(64);

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
      targetTypes: ["integration-policy", "model-run", "workspace"],
      dataBoundaryStatus: "clean",
      integrityStatus: "verified",
      exportAllowed: true,
      boundaryBlockerCount: 0,
      boundaryWarningCount: 0,
      detectedClasses: [],
      nextActions: ["Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."]
    });
    expect(exportRecord.exportHash).toMatch(/^[a-f0-9]{64}$/);
    expect(exportRecord.integrityChainHash).toMatch(/^[a-f0-9]{64}$/);
    expect(exportRecord.integritySummary).toContain("metadata-only event hashes");
    expect(exportRecord.events.every((event) => /^[a-f0-9]{64}$/.test(event.entryHash))).toBe(true);
    expect(exportRecord.events.map((event) => event.id)).toEqual(["audit-log-1", "audit-log-2", "audit-log-3", "audit-log-4"]);
    expect(exportRecord.events[0].afterHash).toBe(afterHash);
    expect(exportRecord.events.at(-1)).toEqual(
      expect.objectContaining({
        targetType: "integration-policy",
        targetId: "integration-policy-evaluation-1",
        summary: "Evaluated object-storage integration policy as audit preparation metadata."
      })
    );
    expect(exportRecord.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps export and integrity chain hashes stable when only export time changes", () => {
    const records = [
      createRecord({ id: "audit-log-2", createdAt: "2026-06-30T00:00:02.000Z", action: "model.run.created" }),
      createRecord({ id: "audit-log-1", createdAt: "2026-06-30T00:00:01.000Z", action: "workspace.created" })
    ];
    const first = createAuditLogExport({
      workspaceId: "workspace-audit-export",
      records,
      exportedAt: "2026-06-30T00:01:00.000Z"
    });
    const second = createAuditLogExport({
      workspaceId: "workspace-audit-export",
      records: records.slice().reverse(),
      exportedAt: "2026-06-30T00:02:00.000Z"
    });

    expect(first.exportHash).toBe(second.exportHash);
    expect(first.integrityChainHash).toBe(second.integrityChainHash);
    expect(first.events.map((event) => event.entryHash)).toEqual(second.events.map((event) => event.entryHash));
  });

  it("changes export and integrity chain hashes when event metadata changes", () => {
    const first = createAuditLogExport({
      workspaceId: "workspace-audit-export",
      records: [createRecord({ id: "audit-log-1", summary: "Created secure review workspace." })],
      exportedAt: "2026-06-30T00:01:00.000Z"
    });
    const second = createAuditLogExport({
      workspaceId: "workspace-audit-export",
      records: [createRecord({ id: "audit-log-1", summary: "Created secure review workspace with updated metadata." })],
      exportedAt: "2026-06-30T00:01:00.000Z"
    });

    expect(first.events[0].entryHash).not.toBe(second.events[0].entryHash);
    expect(first.integrityChainHash).not.toBe(second.integrityChainHash);
    expect(first.exportHash).not.toBe(second.exportHash);
  });

  it("redacts secret-like text from summaries and identifiers before JSON export", () => {
    const exportRecord = createAuditLogExport({
      workspaceId: "workspace-audit-export",
      records: [
        createRecord({
          actorId: `reviewer ${apiKey}`,
          beforeHash: privateKey,
          afterHash: apiKey,
          summary: `Blocked ${apiKey}, private key ${privateKey}, raw_KYC passport A1234567, final-legal-decision, and passport data before handoff.`
        })
      ],
      exportedAt: "2026-06-30T00:01:00.000Z"
    });
    const json = exportAuditLogJson(exportRecord);

    expect(exportRecord).toEqual(
      expect.objectContaining({
        dataBoundaryStatus: "blocked",
        integrityStatus: "blocked",
        exportAllowed: false,
        boundaryBlockerCount: 7,
        boundaryWarningCount: 1,
        detectedClasses: ["credential-material", "personal-data", "private-key-material", "raw-kyc"]
      })
    );
    expect(exportRecord.boundaryFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "actorId", dataClass: "credential-material", severity: "block" }),
        expect.objectContaining({ field: "beforeHash", dataClass: "private-key-material", severity: "block" }),
        expect.objectContaining({ field: "afterHash", dataClass: "credential-material", severity: "block" }),
        expect.objectContaining({ field: "summary", dataClass: "raw-kyc", severity: "block" })
      ])
    );
    expect(exportRecord.remediation).toEqual([
      "Remove secrets, private-key material, and raw KYC references from Audit Log source records before handoff.",
      "Confirm wallet addresses, KYC references, and personal-data mentions are metadata-only or redacted before sharing."
    ]);
    expect(exportRecord.nextActions).toEqual([
      "Resolve Audit Log data-boundary blockers before downloading or sharing the export.",
      "Remove secrets, private-key material, and raw KYC references from Audit Log source records before handoff.",
      "Confirm wallet addresses, KYC references, and personal-data mentions are metadata-only or redacted before sharing."
    ]);
    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).toContain("[redacted-raw-kyc]");
    expect(json).toContain("[redacted-legal-conclusion]");
    expect(json).toContain("[redacted-identity-document]");
    expect(json).toContain("\"dataBoundaryStatus\": \"blocked\"");
    expect(json).not.toContain("[redacted-[redacted-raw-kyc]]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(json).not.toContain("raw_KYC");
    expect(json).not.toContain("raw-KYC");
    expect(json).not.toContain("A1234567");
    expect(json).not.toContain("passport data");
    expect(json).not.toContain("final-legal-decision");
  });

  it("marks wallet-address findings as review warnings without blocking the redacted export", () => {
    const exportRecord = createAuditLogExport({
      workspaceId: "workspace-audit-export",
      records: [
        createRecord({
          targetId: walletAddress,
          summary: `Reviewed public wallet ${walletAddress} as metadata only.`
        })
      ],
      exportedAt: "2026-06-30T00:01:00.000Z"
    });
    const json = exportAuditLogJson(exportRecord);

    expect(exportRecord).toEqual(
      expect.objectContaining({
        dataBoundaryStatus: "needs-review",
        integrityStatus: "needs-review",
        exportAllowed: true,
        boundaryBlockerCount: 0,
        boundaryWarningCount: 2,
        detectedClasses: ["wallet-address"]
      })
    );
    expect(exportRecord.boundaryFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "targetId", dataClass: "wallet-address", severity: "warn" }),
        expect.objectContaining({ field: "summary", dataClass: "wallet-address", severity: "warn" })
      ])
    );
    expect(exportRecord.nextActions).toEqual([
      "Confirm warning-level Audit Log metadata with the reviewer before external handoff.",
      "Confirm wallet addresses, KYC references, and personal-data mentions are metadata-only or redacted before sharing."
    ]);
    expect(json).toContain("[redacted-wallet-address]");
    expect(json).not.toContain(walletAddress);
  });

  it("exports an empty audit log with a clear non-advice boundary", () => {
    const exportRecord = createAuditLogExport({
      workspaceId: "workspace-empty",
      records: [],
      exportedAt: "2026-06-30T00:01:00.000Z"
    });

    expect(exportRecord.eventCount).toBe(0);
    expect(exportRecord.exportHash).toMatch(/^[a-f0-9]{64}$/);
    expect(exportRecord.integrityChainHash).toMatch(/^[a-f0-9]{64}$/);
    expect(exportRecord.integrityStatus).toBe("empty");
    expect(exportRecord.integritySummary).toContain("No server audit log events are available yet");
    expect(exportRecord.events).toEqual([]);
    expect(exportRecord.actionCounts).toEqual({});
    expect(exportRecord.firstEventAt).toBeUndefined();
    expect(exportRecord.lastEventAt).toBeUndefined();
    expect(exportRecord.dataBoundaryStatus).toBe("clean");
    expect(exportRecord.exportAllowed).toBe(true);
    expect(exportRecord.nextActions).toEqual([
      "Run Secure Review Journey or clear Audit Log filters before final handoff.",
      "Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."
    ]);
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
    afterHash,
    summary: "Created secure review workspace.",
    createdAt: "2026-06-30T00:00:01.000Z",
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata.",
    ...overrides
  };
}
