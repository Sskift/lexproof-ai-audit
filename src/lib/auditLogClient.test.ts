import { describe, expect, it, vi } from "vitest";
import {
  AuditLogClientError,
  buildAuditLogExportUrl,
  buildAuditLogRecordsUrl,
  buildAuditLogRecoveryPacketUrl,
  fetchAuditLogExport,
  fetchAuditLogRecoveryPacket,
  fetchAuditLogRecords
} from "./auditLogClient";
import type { AuditLogExportRecord } from "./auditLogExport";
import type { AuditLogRecoveryPacket } from "./auditLogRecoveryPacket";
import type { AuditLogRecord } from "./phase2Types";

const auditLogRecord: AuditLogRecord = {
  recordVersion: "lexproof-audit-log-record-v1",
  id: "audit-log-client-1",
  workspaceId: "workspace-audit-client",
  actorId: "Compliance",
  action: "human-review.updated",
  targetType: "human-review",
  targetId: "human-review-1",
  beforeHash: "requested",
  afterHash: "reviewed",
  summary: "Updated human review status to reviewed.",
  createdAt: "2026-07-03T00:00:00.000Z",
  notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
};

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const auditLogExportRecord: AuditLogExportRecord = {
  exportVersion: "lexproof-audit-log-export-v1",
  workspaceId: "workspace-audit-client",
  exportedAt: "2026-07-03T00:01:00.000Z",
  exportHash: "a".repeat(64),
  integrityChainHash: "b".repeat(64),
  integrityStatus: "verified",
  integritySummary: "Audit log chain verified across 1 metadata-only event hash.",
  eventCount: 1,
  firstEventAt: "2026-07-03T00:00:00.000Z",
  lastEventAt: "2026-07-03T00:00:00.000Z",
  actionCounts: { "human-review.updated": 1 },
  actors: ["Compliance"],
  targetTypes: ["human-review"],
  dataBoundaryStatus: "clean",
  exportAllowed: true,
  boundaryBlockerCount: 0,
  boundaryWarningCount: 0,
  detectedClasses: [],
  boundaryFindings: [],
  remediation: ["Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."],
  nextActions: ["Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."],
  events: [
    {
      id: "audit-log-client-1",
      actorId: "Compliance",
      action: "human-review.updated",
      targetType: "human-review",
      targetId: "human-review-1",
      beforeHash: "requested",
      afterHash: "reviewed",
      summary: "Updated human review status to reviewed.",
      createdAt: "2026-07-03T00:00:00.000Z",
      entryHash: "c".repeat(64)
    }
  ],
  notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only."
};

const auditLogRecoveryPacket: AuditLogRecoveryPacket = {
  packetVersion: "lexproof-audit-log-recovery-packet-v1",
  workspaceId: "workspace-audit-client",
  generatedAt: "2026-07-03T00:02:00.000Z",
  packetHash: "d".repeat(64),
  status: "empty",
  eventCount: 0,
  recoveryItemCount: 1,
  blockedCount: 0,
  needsReviewCount: 0,
  emptyExportCount: 1,
  readyEventCount: 0,
  exportAllowed: true,
  exportHash: "a".repeat(64),
  integrityChainHash: "b".repeat(64),
  appliedFilters: { targetType: "source-review" },
  nextActions: [
    "Run Secure Review Journey or clear Audit Log filters before final handoff.",
    "Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."
  ],
  items: [
    {
      itemId: "audit-log-empty-export",
      source: "export",
      recoveryStatus: "empty",
      priority: "P1",
      recoveryAction: "Run Secure Review Journey or clear Audit Log filters before final handoff.",
      notLegalAdviceBoundary: "Not legal advice. Audit Log recovery items are review workspace metadata only."
    }
  ],
  notLegalAdviceBoundary: "Not legal advice. Audit Log recovery packets are review workspace metadata only."
};

describe("audit log client", () => {
  it("fetches filtered Audit Log records with query filters and no raw payload body", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => [auditLogRecord]
    })) as unknown as typeof fetch;

    const records = await fetchAuditLogRecords({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-audit-client",
      filters: {
        actorId: " Compliance ",
        targetType: " human-review ",
        action: "human-review.updated",
        targetId: "human-review-1"
      },
      fetcher
    });

    expect(records).toEqual([auditLogRecord]);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe(
      "https://api.lexproof.test/api/workspaces/workspace-audit-client/audit-log?actorId=Compliance&action=human-review.updated&targetId=human-review-1&targetType=human-review"
    );
    expect(init).toEqual({ method: "GET" });
    expect(JSON.stringify(init)).not.toContain("apiKey");
    expect(JSON.stringify(init)).not.toContain("rawKyc");
  });

  it("fetches filtered Audit Log export metadata with integrity chain fields", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => auditLogExportRecord
    })) as unknown as typeof fetch;

    const exportRecord = await fetchAuditLogExport({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-audit-client",
      filters: {
        actorId: " Compliance ",
        targetType: " human-review ",
        action: "human-review.updated",
        targetId: "human-review-1"
      },
      fetcher
    });

    expect(exportRecord).toEqual(auditLogExportRecord);
    expect(exportRecord.exportHash).toMatch(/^[a-f0-9]{64}$/);
    expect(exportRecord.integrityChainHash).toMatch(/^[a-f0-9]{64}$/);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe(
      "https://api.lexproof.test/api/workspaces/workspace-audit-client/audit-log/export?actorId=Compliance&action=human-review.updated&targetId=human-review-1&targetType=human-review"
    );
    expect(init).toEqual({ method: "GET" });
    expect(JSON.stringify(init)).not.toContain("apiKey");
    expect(JSON.stringify(init)).not.toContain("rawKyc");
  });

  it("fetches filtered Audit Log recovery packet metadata with non-empty actions", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => auditLogRecoveryPacket
    })) as unknown as typeof fetch;

    const packet = await fetchAuditLogRecoveryPacket({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-audit-client",
      filters: { targetType: " source-review " },
      fetcher
    });

    expect(packet).toEqual(auditLogRecoveryPacket);
    expect(packet.packetHash).toMatch(/^[a-f0-9]{64}$/);
    expect(packet.recoveryItemCount).toBe(1);
    expect(packet.nextActions.every((action) => action.trim().length > 0)).toBe(true);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe(
      "https://api.lexproof.test/api/workspaces/workspace-audit-client/audit-log/recovery?targetType=source-review"
    );
    expect(init).toEqual({ method: "GET" });
    expect(JSON.stringify(init)).not.toContain("apiKey");
    expect(JSON.stringify(init)).not.toContain("rawKyc");
    expect(buildAuditLogRecoveryPacketUrl("", "workspace-audit-client", { targetType: "source-review" })).toBe(
      "/api/workspaces/workspace-audit-client/audit-log/recovery?targetType=source-review"
    );
  });

  it("rejects unsupported target filters before calling the API", async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;

    await expect(
      fetchAuditLogRecords({
        workspaceId: "workspace-audit-client",
        filters: { targetType: "legal-opinion" },
        fetcher
      })
    ).rejects.toBeInstanceOf(AuditLogClientError);

    expect(fetcher).not.toHaveBeenCalled();
    expect(() =>
      buildAuditLogRecordsUrl("https://api.lexproof.test", "workspace-audit-client", { targetType: "legal-opinion" })
    ).toThrow(/target type must be workspace/i);
    expect(() =>
      buildAuditLogExportUrl("https://api.lexproof.test", "workspace-audit-client", { targetType: "legal-opinion" })
    ).toThrow(/target type must be workspace/i);
    expect(() =>
      buildAuditLogRecoveryPacketUrl("https://api.lexproof.test", "workspace-audit-client", { targetType: "legal-opinion" })
    ).toThrow(/target type must be workspace/i);
  });

  it("rejects malformed Audit Log records before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => [{ ...auditLogRecord, notLegalAdviceBoundary: "Legal approval." }]
    })) as unknown as typeof fetch;

    await expect(
      fetchAuditLogRecords({
        workspaceId: "workspace-audit-client",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "AUDIT_LOG_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Audit Log records."
    });
  });

  it("redacts classified text from otherwise valid Audit Log records before UI use", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => [
        {
          ...auditLogRecord,
          actorId: `Compliance ${apiKey}`,
          targetId: `human-review-${privateKey}`,
          beforeHash: privateKey,
          afterHash: apiKey,
          summary: `Blocked raw_KYC passport A1234567, private key ${privateKey}, final-legal-decision, passport data, and apiKey=${apiKey}.`
        }
      ]
    })) as unknown as typeof fetch;

    const records = await fetchAuditLogRecords({
      workspaceId: "workspace-audit-client",
      fetcher
    });

    expect(records).toEqual([
      expect.objectContaining({
        actorId: "Compliance [redacted-api-key]",
        targetId: "human-review-[redacted-private-key]",
        beforeHash: "[redacted-private-key]",
        afterHash: "[redacted-api-key]",
        summary: expect.stringContaining("[redacted-raw-kyc]"),
        notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
      })
    ]);
    expect(JSON.stringify(records)).toContain("[redacted-legal-conclusion]");
    expect(JSON.stringify(records)).toContain("[redacted-identity-document]");
    expect(JSON.stringify(records)).not.toContain(apiKey);
    expect(JSON.stringify(records)).not.toContain(privateKey);
    expect(JSON.stringify(records)).not.toContain("apiKey");
    expect(JSON.stringify(records)).not.toContain("raw_KYC");
    expect(JSON.stringify(records)).not.toContain("raw-KYC");
    expect(JSON.stringify(records)).not.toContain("A1234567");
    expect(JSON.stringify(records)).not.toContain("passport data");
    expect(JSON.stringify(records)).not.toContain("final-legal-decision");
  });

  it("rejects malformed Audit Log export artifacts before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...auditLogExportRecord,
        integrityChainHash: "not-a-hash"
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchAuditLogExport({
        workspaceId: "workspace-audit-client",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "AUDIT_LOG_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning a metadata-only Audit Log export artifact."
    });
  });

  it("rejects Audit Log export artifacts with blank recovery next actions", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...auditLogExportRecord,
        nextActions: ["Keep Audit Log exports metadata-only and re-run the boundary check before external handoff.", "   "]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchAuditLogExport({
        workspaceId: "workspace-audit-client",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "AUDIT_LOG_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning a metadata-only Audit Log export artifact."
    });
  });

  it("rejects malformed Audit Log recovery packets before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...auditLogRecoveryPacket,
        recoveryItemCount: 2
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchAuditLogRecoveryPacket({
        workspaceId: "workspace-audit-client",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "AUDIT_LOG_INVALID_RESPONSE",
      recoveryAction:
        "Verify the Phase 2 API is returning metadata-only Audit Log recovery packets with non-empty recovery actions."
    });
  });

  it("rejects Audit Log recovery packets with blank next actions", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...auditLogRecoveryPacket,
        nextActions: ["Run Secure Review Journey or clear Audit Log filters before final handoff.", "  "]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchAuditLogRecoveryPacket({
        workspaceId: "workspace-audit-client",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "AUDIT_LOG_INVALID_RESPONSE",
      recoveryAction:
        "Verify the Phase 2 API is returning metadata-only Audit Log recovery packets with non-empty recovery actions."
    });
  });

  it("redacts classified text from otherwise valid Audit Log export artifacts before UI use", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...auditLogExportRecord,
        workspaceId: `workspace-audit-client ${apiKey} legal conclusion`,
        integritySummary: `Verified event hash after raw_KYC passport A1234567, legal conclusion, passport data, and apiKey=${apiKey}.`,
        actionCounts: { [`human-review.updated ${apiKey} legal conclusion`]: 1 },
        actors: [`Compliance ${apiKey}`],
        dataBoundaryStatus: "blocked",
        integrityStatus: "blocked",
        exportAllowed: false,
        boundaryBlockerCount: 3,
        boundaryWarningCount: 1,
        detectedClasses: ["credential-material", "private-key-material", "raw-kyc"],
        boundaryFindings: [
          {
            source: "event",
            eventId: `audit-log-client-${privateKey}`,
            field: "summary",
            dataClass: "credential-material",
            severity: "block",
            matchCount: 1,
            redactedSnippet: `summary copied apiKey=${apiKey}, raw_KYC passport A1234567, legal conclusion, and passport data`,
            message: `Credential field apiKey=${apiKey} and legal conclusion must be removed before export.`
          }
        ],
        remediation: [
          `Remove private key ${privateKey}, raw_KYC data, legal conclusion, and passport data before handoff.`
        ],
        nextActions: [
          `Resolve apiKey=${apiKey}, private key ${privateKey}, final-legal-decision, and passport data before sharing.`
        ],
        events: [
          {
            ...auditLogExportRecord.events[0],
            id: `audit-log-client-${apiKey}`,
            actorId: `Compliance ${apiKey}`,
            action: `human-review.updated ${apiKey}`,
            targetId: `human-review-${privateKey}`,
            beforeHash: privateKey,
            afterHash: apiKey,
            summary: `Blocked raw_KYC passport A1234567, private key ${privateKey}, final-legal-decision, passport data, and apiKey=${apiKey}.`
          }
        ]
      })
    })) as unknown as typeof fetch;

    const exportRecord = await fetchAuditLogExport({
      workspaceId: "workspace-audit-client",
      fetcher
    });
    const serialized = JSON.stringify(exportRecord);

    expect(exportRecord).toEqual(
      expect.objectContaining({
        workspaceId: "workspace-audit-client [redacted-api-key] [redacted-legal-conclusion]",
        integrityStatus: "blocked",
        dataBoundaryStatus: "blocked",
        exportAllowed: false,
        actionCounts: { "human-review.updated [redacted-api-key] [redacted-legal-conclusion]": 1 },
        actors: ["Compliance [redacted-api-key]"],
        remediation: [
          "Remove [redacted-private-key], [redacted-raw-kyc], [redacted-legal-conclusion], and [redacted-identity-document] before handoff."
        ],
        nextActions: [
          "Resolve [redacted-secret], [redacted-private-key], [redacted-legal-conclusion], and [redacted-identity-document] before sharing."
        ],
        notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only."
      })
    );
    expect(exportRecord.boundaryFindings[0]).toEqual(
      expect.objectContaining({
        eventId: "audit-log-client-[redacted-private-key]",
        redactedSnippet:
          "summary copied [redacted-secret], [redacted-raw-kyc] [redacted-passport-id], [redacted-legal-conclusion], and [redacted-identity-document]",
        message: "Credential field [redacted-secret] and [redacted-legal-conclusion] must be removed before export."
      })
    );
    expect(exportRecord.events[0]).toEqual(
      expect.objectContaining({
        id: "audit-log-client-[redacted-api-key]",
        actorId: "Compliance [redacted-api-key]",
        action: "human-review.updated [redacted-api-key]",
        targetId: "human-review-[redacted-private-key]",
        beforeHash: "[redacted-private-key]",
        afterHash: "[redacted-api-key]",
        summary:
          "Blocked [redacted-raw-kyc] [redacted-passport-id], [redacted-private-key], [redacted-legal-conclusion], [redacted-identity-document], and [redacted-secret]"
      })
    );
    expect(serialized).toContain("[redacted-api-key]");
    expect(serialized).toContain("[redacted-secret]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).toContain("[redacted-legal-conclusion]");
    expect(serialized).toContain("[redacted-identity-document]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("apiKey");
    expect(serialized).not.toContain("raw_KYC");
    expect(serialized).not.toContain("raw-KYC");
    expect(serialized).not.toContain("A1234567");
    expect(serialized).not.toContain("passport data");
    expect(serialized).not.toContain("legal conclusion");
    expect(serialized).not.toContain("final-legal-decision");
  });

  it("redacts classified text from otherwise valid Audit Log recovery packets before UI use", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...auditLogRecoveryPacket,
        workspaceId: `workspace-audit-client ${apiKey} legal conclusion`,
        appliedFilters: { actorId: `Compliance ${apiKey}`, targetType: "human-review" },
        nextActions: [
          `Resolve apiKey=${apiKey}, private key ${privateKey}, final-legal-decision, and passport data before sharing.`
        ],
        items: [
          {
            ...auditLogRecoveryPacket.items[0],
            itemId: `audit-log-empty-${apiKey}`,
            recoveryAction: `Remove private key ${privateKey}, raw_KYC data, legal conclusion, and passport data before handoff.`,
            eventId: `audit-log-client-${privateKey}`,
            action: `human-review.updated ${apiKey}`,
            targetType: "human-review",
            targetId: `human-review-${privateKey}`,
            entryHash: "e".repeat(64)
          }
        ]
      })
    })) as unknown as typeof fetch;

    const packet = await fetchAuditLogRecoveryPacket({
      workspaceId: "workspace-audit-client",
      fetcher
    });
    const serialized = JSON.stringify(packet);

    expect(packet).toEqual(
      expect.objectContaining({
        workspaceId: "workspace-audit-client [redacted-api-key] [redacted-legal-conclusion]",
        appliedFilters: { actorId: "Compliance [redacted-api-key]", targetType: "human-review" },
        nextActions: [
          "Resolve [redacted-secret], [redacted-private-key], [redacted-legal-conclusion], and [redacted-identity-document] before sharing."
        ],
        notLegalAdviceBoundary: "Not legal advice. Audit Log recovery packets are review workspace metadata only."
      })
    );
    expect(packet.items[0]).toEqual(
      expect.objectContaining({
        itemId: "audit-log-empty-[redacted-api-key]",
        recoveryAction:
          "Remove [redacted-private-key], [redacted-raw-kyc], [redacted-legal-conclusion], and [redacted-identity-document] before handoff.",
        eventId: "audit-log-client-[redacted-private-key]",
        action: "human-review.updated [redacted-api-key]",
        targetId: "human-review-[redacted-private-key]",
        notLegalAdviceBoundary: "Not legal advice. Audit Log recovery items are review workspace metadata only."
      })
    );
    expect(serialized).toContain("[redacted-api-key]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).toContain("[redacted-legal-conclusion]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("apiKey");
    expect(serialized).not.toContain("raw_KYC");
    expect(serialized).not.toContain("passport data");
    expect(serialized).not.toContain("final-legal-decision");
  });

  it("redacts unsafe API error text when Audit Log refresh fails", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error:
          "Audit log filter failed with api_key=sk-live-abcdef1234567890abcdef1234567890 and passport data.",
        code: "AUDIT_LOG_FILTER_FAILED",
        recoveryAction:
          "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef and retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    })) as unknown as typeof fetch;

    let caught: unknown;
    try {
      await fetchAuditLogRecords({
        workspaceId: "workspace-audit-client",
        fetcher
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AuditLogClientError);
    const error = caught as AuditLogClientError;
    expect(error.code).toBe("AUDIT_LOG_FILTER_FAILED");
    expect(error.message).toContain("[redacted-secret]");
    expect(error.message).toContain("[redacted-identity-document]");
    expect(error.message).not.toContain("sk-live");
    expect(error.message).not.toContain("passport data");
    expect(error.recoveryAction).toContain("[redacted-private-key]");
    expect(error.notLegalAdviceBoundary).toBe("Not legal advice. This API creates audit preparation workflow records only.");
  });

  it("redacts unsafe API error text when Audit Log export refresh fails", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "Audit log export failed with api_key=sk-live-abcdef1234567890abcdef1234567890.",
        code: "AUDIT_LOG_EXPORT_FAILED",
        recoveryAction:
          "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef and retry export.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    })) as unknown as typeof fetch;

    let caught: unknown;
    try {
      await fetchAuditLogExport({
        workspaceId: "workspace-audit-client",
        fetcher
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AuditLogClientError);
    const error = caught as AuditLogClientError;
    expect(error.code).toBe("AUDIT_LOG_EXPORT_FAILED");
    expect(error.message).toContain("[redacted-secret]");
    expect(error.message).not.toContain("sk-live");
    expect(error.recoveryAction).toContain("[redacted-private-key]");
    expect(error.notLegalAdviceBoundary).toBe("Not legal advice. This API creates audit preparation workflow records only.");
  });
});
