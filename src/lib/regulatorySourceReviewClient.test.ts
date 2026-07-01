import { describe, expect, it, vi } from "vitest";
import { syncRegulatorySourceReviewLedger } from "./regulatorySourceReviewClient";
import type { RegulatorySourceReview } from "./regulatorySourceReview";
import type { RegulatorySourceReviewSyncResult } from "./phase2Types";

const sourceReview: RegulatorySourceReview = {
  status: "review-due",
  totalSourceCount: 1,
  currentSourceCount: 0,
  reviewDueCount: 1,
  metadataMissingCount: 0,
  reviewWindowDays: 90,
  items: [
    {
      clauseId: "control-eu-mica-title-ii-white-paper",
      jurisdiction: "European Union",
      regulator: "ESMA",
      citation: "Regulation (EU) 2023/1114, Title II",
      sourceName: "EUR-Lex",
      sourceUrl: "https://eur-lex.europa.eu/",
      effectiveAsOf: "2024-06-30",
      lastReviewedAt: "2026-06-01",
      nextReviewDueAt: "2026-09-01",
      reviewStatus: "review-due",
      reviewerNotes: "Review source freshness before counsel handoff."
    }
  ],
  actions: [
    {
      id: "source-review-control-eu-mica-title-ii-white-paper",
      priority: "P1",
      action: "Refresh Regulation (EU) 2023/1114, Title II source metadata before counsel handoff.",
      clauseId: "control-eu-mica-title-ii-white-paper",
      sourceUrl: "https://eur-lex.europa.eu/"
    }
  ],
  notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only."
};

const syncResult: RegulatorySourceReviewSyncResult = {
  syncVersion: "lexproof-source-review-sync-v1",
  workspaceId: "workspace-source",
  ledgerHash: "b".repeat(64),
  syncedCount: 1,
  records: [
    {
      recordVersion: "lexproof-source-review-record-v1",
      id: "source-review-record",
      workspaceId: "workspace-source",
      ledgerHash: "b".repeat(64),
      sourceReviewItemId: "source-review-control-eu-mica-title-ii-white-paper",
      clauseId: "control-eu-mica-title-ii-white-paper",
      jurisdiction: "European Union",
      regulator: "ESMA",
      citation: "Regulation (EU) 2023/1114, Title II",
      sourceName: "EUR-Lex",
      sourceUrl: "https://eur-lex.europa.eu/",
      reviewStatus: "review-due",
      priority: "P1",
      effectiveAsOf: "2024-06-30",
      lastReviewedAt: "2026-06-01",
      nextReviewDueAt: "2026-09-01",
      reviewerNotes: "Review source freshness before counsel handoff.",
      nextAction: "Refresh Regulation (EU) 2023/1114, Title II source metadata before counsel handoff.",
      status: "pending-review",
      matchingBehaviorChanged: false,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
    }
  ],
  notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
};

describe("regulatory source review client", () => {
  it("posts whitelisted source review ledger metadata without raw source bodies or credentials", async () => {
    const sourceReviewWithUnsafeExtras = {
      ...sourceReview,
      rawSourceBody: "raw source body should not be posted",
      apiKey: "sk-live-abcdef1234567890abcdef1234567890",
      items: [
        {
          ...sourceReview.items[0],
          rawSourceBody: "raw KYC passport data",
          webhookSecret: "secret-key: abcdef1234567890"
        }
      ]
    };
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => syncResult
    })) as unknown as typeof fetch;

    const result = await syncRegulatorySourceReviewLedger({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-source",
      sourceReview: sourceReviewWithUnsafeExtras,
      createdBy: "Source reviewer",
      fetcher
    });

    expect(result).toBe(syncResult);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/workspaces/workspace-source/source-reviews");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
      createdBy: "Source reviewer",
      sourceReview
    });
    expect(String(init?.body)).not.toContain("rawSourceBody");
    expect(String(init?.body)).not.toContain("apiKey");
    expect(String(init?.body)).not.toContain("webhookSecret");
    expect(String(init?.body)).not.toContain("sk-live");
    expect(String(init?.body)).not.toContain("passport data");
  });

  it("rejects malformed source review sync responses before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...syncResult, records: [{ ...syncResult.records[0], matchingBehaviorChanged: true }] })
    })) as unknown as typeof fetch;

    await expect(
      syncRegulatorySourceReviewLedger({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        sourceReview,
        createdBy: "Source reviewer",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_REVIEW_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source review records."
    });
  });
});
