import { describe, expect, it } from "vitest";
import { createAuditLogExport } from "./auditLogExport";
import { createAuditLogRecoveryPacket, exportAuditLogRecoveryPacketJson } from "./auditLogRecoveryPacket";
import type { AuditLogRecord } from "./phase2Types";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("audit log recovery packet", () => {
  it("creates a ready packet from a clean Audit Log export without adding recovery items", async () => {
    const exportRecord = createAuditLogExport({
      workspaceId: "workspace-audit-recovery",
      records: [createRecord()],
      exportedAt: "2026-07-05T00:00:00.000Z"
    });

    const packet = await createAuditLogRecoveryPacket(exportRecord, {
      generatedAt: "2026-07-05T00:01:00.000Z",
      filters: { targetType: "workspace" }
    });

    expect(packet).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-audit-log-recovery-packet-v1",
        workspaceId: "workspace-audit-recovery",
        generatedAt: "2026-07-05T00:01:00.000Z",
        status: "ready",
        eventCount: 1,
        recoveryItemCount: 0,
        blockedCount: 0,
        needsReviewCount: 0,
        emptyExportCount: 0,
        readyEventCount: 1,
        exportAllowed: true,
        exportHash: exportRecord.exportHash,
        integrityChainHash: exportRecord.integrityChainHash,
        appliedFilters: { targetType: "workspace" },
        nextActions: ["Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."],
        items: [],
        notLegalAdviceBoundary: "Not legal advice. Audit Log recovery packets are review workspace metadata only."
      })
    );
    expect(packet.packetHash).toMatch(/^[a-f0-9]{64}$/);
    expect(exportAuditLogRecoveryPacketJson(packet)).toContain("Not legal advice");
  });

  it("creates blocked recovery items from data-boundary findings without leaking unsafe text", async () => {
    const exportRecord = createAuditLogExport({
      workspaceId: `workspace-audit-recovery ${apiKey}`,
      records: [
        createRecord({
          actorId: `Compliance ${apiKey}`,
          targetId: `evidence-${privateKey}`,
          beforeHash: privateKey,
          afterHash: apiKey,
          summary: `Blocked raw_KYC passport A1234567, private key ${privateKey}, final-legal-decision, passport data, and apiKey=${apiKey}.`
        })
      ],
      exportedAt: "2026-07-05T00:00:00.000Z"
    });

    const packet = await createAuditLogRecoveryPacket(exportRecord, {
      generatedAt: "2026-07-05T00:01:00.000Z"
    });
    const serialized = JSON.stringify(packet);

    expect(packet.status).toBe("blocked");
    expect(packet.exportAllowed).toBe(false);
    expect(packet.recoveryItemCount).toBeGreaterThan(0);
    expect(packet.blockedCount).toBeGreaterThan(0);
    expect(packet.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "boundary-finding",
          recoveryStatus: "blocked",
          priority: "P0",
          recoveryAction: "Remove Audit Log data-boundary blockers before downloading or sharing the export.",
          notLegalAdviceBoundary: "Not legal advice. Audit Log recovery items are review workspace metadata only."
        })
      ])
    );
    expect(serialized).toContain("[redacted-api-key]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("raw_KYC");
    expect(serialized).not.toContain("A1234567");
    expect(serialized).not.toContain("passport data");
    expect(serialized).not.toContain("final-legal-decision");
  });

  it("creates an empty packet with a filter recovery action and stable hash across generatedAt changes", async () => {
    const exportRecord = createAuditLogExport({
      workspaceId: "workspace-audit-empty",
      records: [],
      exportedAt: "2026-07-05T00:00:00.000Z"
    });

    const first = await createAuditLogRecoveryPacket(exportRecord, {
      generatedAt: "2026-07-05T00:01:00.000Z",
      filters: { targetType: "source-review" }
    });
    const second = await createAuditLogRecoveryPacket(exportRecord, {
      generatedAt: "2026-07-05T00:02:00.000Z",
      filters: { targetType: "source-review" }
    });

    expect(first.packetHash).toBe(second.packetHash);
    expect(first).toEqual(
      expect.objectContaining({
        status: "empty",
        eventCount: 0,
        recoveryItemCount: 1,
        emptyExportCount: 1,
        readyEventCount: 0,
        appliedFilters: { targetType: "source-review" },
        notLegalAdviceBoundary: "Not legal advice. Audit Log recovery packets are review workspace metadata only."
      })
    );
    expect(first.items).toEqual([
      expect.objectContaining({
        source: "export",
        recoveryStatus: "empty",
        priority: "P1",
        recoveryAction: "Run Secure Review Journey or clear Audit Log filters before final handoff."
      })
    ]);
  });
});

function createRecord(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    recordVersion: "lexproof-audit-log-record-v1",
    id: "audit-log-recovery-1",
    workspaceId: "workspace-audit-recovery",
    actorId: "Compliance",
    action: "workspace.created",
    targetType: "workspace",
    targetId: "workspace-audit-recovery",
    beforeHash: "",
    afterHash: "b".repeat(64),
    summary: "Created secure review workspace.",
    createdAt: "2026-07-05T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata.",
    ...overrides
  };
}
