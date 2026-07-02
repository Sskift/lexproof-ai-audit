import { describe, expect, it, vi } from "vitest";
import {
  AuditLogClientError,
  buildAuditLogRecordsUrl,
  fetchAuditLogRecords
} from "./auditLogClient";
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
    expect(error.message).toContain("[redacted-personal-data]");
    expect(error.message).not.toContain("sk-live");
    expect(error.message).not.toContain("passport data");
    expect(error.recoveryAction).toContain("[redacted-private-key]");
    expect(error.notLegalAdviceBoundary).toBe("Not legal advice. This API creates audit preparation workflow records only.");
  });
});
