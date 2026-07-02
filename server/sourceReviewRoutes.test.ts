import { describe, expect, it } from "vitest";
import { buildServer } from "./app";

const sourceReview = {
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

describe("source review routes", () => {
  it("syncs source review ledger records without raw source bodies or matching behavior changes", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-source/source-reviews",
      payload: {
        createdBy: "Source reviewer",
        sourceReview: {
          ...sourceReview,
          rawSourceBody: "raw source body should be ignored",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890",
          items: [
            {
              ...sourceReview.items[0],
              rawSourceBody: "raw source body should be ignored",
              webhookSecret: "secret-key: abcdef1234567890"
            }
          ]
        }
      }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    const json = JSON.stringify(body);

    expect(body).toEqual(
      expect.objectContaining({
        syncVersion: "lexproof-source-review-sync-v1",
        workspaceId: "workspace-source",
        syncedCount: 1,
        ledgerHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
      })
    );
    expect(body.records[0]).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-source-review-record-v1",
        workspaceId: "workspace-source",
        status: "pending-review",
        matchingBehaviorChanged: false,
        createdBy: "Source reviewer"
      })
    );
    expect(json).not.toContain("raw source body should be ignored");
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("secret-key");

    const listResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-source/source-reviews"
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toHaveLength(1);

    const auditResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-source/audit-log"
    });
    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "source-review.synced",
          targetType: "source-review",
          summary: "Synced 1 source review metadata record."
        })
      ])
    );

    await server.close();
  });

  it("blocks unsafe source review metadata without echoing secrets", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-source/source-reviews",
      payload: {
        createdBy: "Source reviewer",
        sourceReview: {
          ...sourceReview,
          items: [
            {
              ...sourceReview.items[0],
              sourceName: "sk-live-abcdef1234567890abcdef1234567890",
              reviewerNotes: "Use raw KYC passport data and decide compliance."
            }
          ]
        }
      }
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    const json = JSON.stringify(body);

    expect(body).toEqual(
      expect.objectContaining({
        code: "SOURCE_REVIEW_SYNC_FAILED",
        recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry."
      })
    );
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("passport data");

    await server.close();
  });

  it("rejects source review sync payloads that omit the Not legal advice boundary", async () => {
    const server = buildServer();

    const sourceReviewWithoutBoundary: Partial<typeof sourceReview> = { ...sourceReview };
    delete sourceReviewWithoutBoundary.notLegalAdviceBoundary;
    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-source/source-reviews",
      payload: {
        createdBy: "Source reviewer",
        sourceReview: sourceReviewWithoutBoundary
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: "Source review ledger is missing the required Not legal advice boundary.",
        code: "SOURCE_REVIEW_SYNC_FAILED",
        recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );

    await server.close();
  });
});
