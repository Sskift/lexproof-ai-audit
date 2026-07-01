import { describe, expect, it, vi } from "vitest";
import { syncRegulatorySourceApprovalQueue } from "./regulatorySourceApprovalClient";
import type { RegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import type { RegulatorySourceApprovalSyncResult } from "./phase2Types";

const approvalQueue: RegulatorySourceApprovalQueue = {
  queueVersion: "lexproof-regulatory-source-approval-queue-v1",
  generatedAt: "2026-10-01T00:00:00.000Z",
  status: "needs-approval",
  totalItemCount: 1,
  approvalRequiredCount: 1,
  metadataRequiredCount: 0,
  items: [
    {
      id: "source-approval-control-eu-mica-title-ii-white-paper",
      priority: "P1",
      approvalStatus: "approval-required",
      reviewStatus: "review-due",
      clauseId: "control-eu-mica-title-ii-white-paper",
      jurisdiction: "European Union",
      regulator: "ESMA",
      citation: "Regulation (EU) 2023/1114, Title II",
      sourceName: "EUR-Lex",
      sourceUrl: "https://eur-lex.europa.eu/",
      effectiveAsOf: "2024-06-30",
      lastReviewedAt: "2026-06-01",
      nextReviewDueAt: "2026-09-01",
      reviewerNotes: "Review source freshness before counsel handoff.",
      nextAction: "Refresh and approve Regulation (EU) 2023/1114, Title II source metadata before it changes source matching.",
      approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
      notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only."
    }
  ],
  notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only."
};

const syncResult: RegulatorySourceApprovalSyncResult = {
  syncVersion: "lexproof-source-approval-sync-v1",
  workspaceId: "workspace-source",
  queueHash: "a".repeat(64),
  syncedCount: 1,
  records: [
    {
      recordVersion: "lexproof-source-approval-record-v1",
      id: "source-approval-record",
      workspaceId: "workspace-source",
      queueHash: "a".repeat(64),
      sourceApprovalItemId: "source-approval-control-eu-mica-title-ii-white-paper",
      clauseId: "control-eu-mica-title-ii-white-paper",
      jurisdiction: "European Union",
      regulator: "ESMA",
      citation: "Regulation (EU) 2023/1114, Title II",
      sourceName: "EUR-Lex",
      sourceUrl: "https://eur-lex.europa.eu/",
      priority: "P1",
      approvalStatus: "approval-required",
      reviewStatus: "review-due",
      effectiveAsOf: "2024-06-30",
      lastReviewedAt: "2026-06-01",
      nextReviewDueAt: "2026-09-01",
      reviewerNotes: "Review source freshness before counsel handoff.",
      nextAction: "Refresh and approve Regulation (EU) 2023/1114, Title II source metadata before it changes source matching.",
      approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
      status: "pending-review",
      matchingBehaviorChanged: false,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
    }
  ],
  notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
};

describe("regulatory source approval client", () => {
  it("posts whitelisted source approval queue metadata without raw source bodies or credentials", async () => {
    const queueWithUnsafeExtras = {
      ...approvalQueue,
      rawSourceBody: "raw source body should not be posted",
      apiKey: "sk-live-abcdef1234567890abcdef1234567890",
      items: [
        {
          ...approvalQueue.items[0],
          rawSourceBody: "raw KYC passport data",
          webhookSecret: "secret-key: abcdef1234567890"
        }
      ]
    };
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => syncResult
    })) as unknown as typeof fetch;

    const result = await syncRegulatorySourceApprovalQueue({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-source",
      queue: queueWithUnsafeExtras,
      createdBy: "Source reviewer",
      fetcher
    });

    expect(result).toBe(syncResult);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/workspaces/workspace-source/source-approvals");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
      createdBy: "Source reviewer",
      queue: approvalQueue
    });
    expect(String(init?.body)).not.toContain("rawSourceBody");
    expect(String(init?.body)).not.toContain("apiKey");
    expect(String(init?.body)).not.toContain("webhookSecret");
    expect(String(init?.body)).not.toContain("sk-live");
    expect(String(init?.body)).not.toContain("passport data");
  });

  it("rejects malformed source approval sync responses before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...syncResult, records: [{ ...syncResult.records[0], matchingBehaviorChanged: true }] })
    })) as unknown as typeof fetch;

    await expect(
      syncRegulatorySourceApprovalQueue({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        queue: approvalQueue,
        createdBy: "Source reviewer",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_APPROVAL_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source approval records."
    });
  });
});
