import { describe, expect, it } from "vitest";
import { buildServer } from "./app";

const approvalQueue = {
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

describe("source approval routes", () => {
  it("syncs source approval records without raw source bodies or matching behavior changes", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-source/source-approvals",
      payload: {
        createdBy: "Source reviewer",
        queue: {
          ...approvalQueue,
          rawSourceBody: "raw source body should be ignored",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890",
          items: [
            {
              ...approvalQueue.items[0],
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
        syncVersion: "lexproof-source-approval-sync-v1",
        workspaceId: "workspace-source",
        syncedCount: 1,
        queueHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
      })
    );
    expect(body.records[0]).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-source-approval-record-v1",
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
      url: "/api/workspaces/workspace-source/source-approvals"
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
          action: "source-approval.synced",
          targetType: "source-approval",
          summary: "Synced 1 source approval metadata record."
        })
      ])
    );

    await server.close();
  });

  it("blocks unsafe source approval metadata without echoing secrets", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-source/source-approvals",
      payload: {
        createdBy: "Source reviewer",
        queue: {
          ...approvalQueue,
          items: [
            {
              ...approvalQueue.items[0],
              sourceName: "sk-live-abcdef1234567890abcdef1234567890",
              reviewerNotes: "Use raw KYC passport data."
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
        code: "SOURCE_APPROVAL_SYNC_FAILED",
        recoveryAction: "Remove credentials, raw KYC, personal data, legal conclusions, and raw source bodies, then retry."
      })
    );
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("passport data");

    await server.close();
  });
});
