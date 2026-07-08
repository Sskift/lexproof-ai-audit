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

    const packetResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-source/source-approvals/packet"
    });
    expect(packetResponse.statusCode).toBe(200);
    expect(packetResponse.json()).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-server-source-approval-packet-v1",
        workspaceId: "workspace-source",
        status: "needs-approval",
        recordCount: 1,
        queueHashes: [body.queueHash],
        statusCounts: expect.objectContaining({ pendingReview: 1 }),
        approvalStatusCounts: expect.objectContaining({ approvalRequired: 1, metadataRequired: 0 }),
        reviewStatusCounts: expect.objectContaining({ reviewDue: 1 }),
        priorityCounts: expect.objectContaining({ P1: 1 }),
        matchingBehaviorChanged: false,
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Server Source Approval packets are audit preparation workflow metadata only."
      })
    );
    expect(packetResponse.json().records[0]).toEqual(
      expect.objectContaining({
        recordHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        reviewerNotesHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
        matchingBehaviorChanged: false
      })
    );
    expect(packetResponse.body).not.toContain("Review source freshness before counsel handoff.");
    expect(packetResponse.body).not.toContain("raw source body should be ignored");

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
        recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry."
      })
    );
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("passport data");

    await server.close();
  });

  it("rejects source approval sync payloads with invalid enum fields before defaulting them", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-source/source-approvals",
      payload: {
        createdBy: "Source reviewer",
        queue: {
          ...approvalQueue,
          status: "approved"
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: "Source approval queue status is invalid.",
        code: "SOURCE_APPROVAL_SYNC_FAILED",
        recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );

    await server.close();
  });

  it("rejects malformed source approval count fields before coercing them", async () => {
    const server = buildServer();
    const cases = [
      { totalItemCount: "1" },
      { approvalRequiredCount: -1 },
      { metadataRequiredCount: 0.5 }
    ];

    for (const queuePatch of cases) {
      const response = await server.inject({
        method: "POST",
        url: "/api/workspaces/workspace-source/source-approvals",
        payload: {
          createdBy: "Source reviewer",
          queue: {
            ...approvalQueue,
            ...queuePatch
          }
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          code: "SOURCE_APPROVAL_SYNC_FAILED",
          recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).toMatch(/Source approval .* count is invalid\./);
    }

    await server.close();
  });

  it("rejects incomplete source approval metadata before creating records or audit logs", async () => {
    const server = buildServer();
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const cases = [
      {
        workspaceId: "workspace-source-approval-items-not-array",
        queuePatch: {
          items: {
            rawSourceBody: `privateKey=${privateKey}`
          }
        },
        expectedError: "Source approval items must be an array.",
        blockedValue: privateKey
      },
      {
        workspaceId: "workspace-source-approval-missing-url",
        queuePatch: {
          items: [
            {
              ...approvalQueue.items[0],
              sourceUrl: " "
            }
          ]
        },
        expectedError: "Source approval item source URL must be a non-empty string.",
        blockedValue: ""
      },
      {
        workspaceId: "workspace-source-approval-secret-notes",
        queuePatch: {
          items: [
            {
              ...approvalQueue.items[0],
              reviewerNotes: [`privateKey=${privateKey}`]
            }
          ]
        },
        expectedError: "Source approval reviewer notes must be a non-empty string.",
        blockedValue: privateKey
      },
      {
        workspaceId: "workspace-source-approval-count-mismatch",
        queuePatch: {
          totalItemCount: approvalQueue.totalItemCount + 1
        },
        expectedError: "Source approval counts must match the approval item statuses.",
        blockedValue: ""
      }
    ];

    for (const item of cases) {
      const response = await server.inject({
        method: "POST",
        url: `/api/workspaces/${item.workspaceId}/source-approvals`,
        payload: {
          createdBy: "Source reviewer",
          queue: {
            ...approvalQueue,
            ...item.queuePatch
          }
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: item.expectedError,
          code: "SOURCE_APPROVAL_SYNC_FAILED",
          recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      if (item.blockedValue) {
        expect(response.body).not.toContain(item.blockedValue);
      }

      const listResponse = await server.inject({
        method: "GET",
        url: `/api/workspaces/${item.workspaceId}/source-approvals`
      });
      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json()).toEqual([]);

      const auditResponse = await server.inject({
        method: "GET",
        url: `/api/workspaces/${item.workspaceId}/audit-log`
      });
      expect(auditResponse.statusCode).toBe(200);
      expect(auditResponse.json()).toEqual([]);
    }

    await server.close();
  });

  it("rejects malformed source approval root payloads before creating records or audit logs", async () => {
    const server = buildServer();
    const cases: Array<{ payload?: unknown }> = [
      {},
      {
        payload: ["raw source body with apiKey=sk-live-abcdef1234567890abcdef1234567890"]
      }
    ];

    for (const [index, item] of cases.entries()) {
      const workspaceId = `workspace-source-approval-malformed-${index}`;
      const response = await server.inject({
        method: "POST",
        url: `/api/workspaces/${workspaceId}/source-approvals`,
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: "Source approval sync payload must be a JSON object.",
          code: "SOURCE_APPROVAL_SYNC_FAILED",
          recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("apiKey");

      const listResponse = await server.inject({
        method: "GET",
        url: `/api/workspaces/${workspaceId}/source-approvals`
      });
      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json()).toEqual([]);

      const auditResponse = await server.inject({
        method: "GET",
        url: `/api/workspaces/${workspaceId}/audit-log`
      });
      expect(auditResponse.statusCode).toBe(200);
      expect(auditResponse.json()).toEqual([]);
    }

    await server.close();
  });

  it("rejects source approval sync payloads that replace the Not legal advice boundary", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-source/source-approvals",
      payload: {
        createdBy: "Source reviewer",
        queue: {
          ...approvalQueue,
          notLegalAdviceBoundary: "Legal approval granted."
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: "Source approval queue is missing the required Not legal advice boundary.",
        code: "SOURCE_APPROVAL_SYNC_FAILED",
        recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );

    await server.close();
  });
});
