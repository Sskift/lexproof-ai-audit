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

    const packetResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-source/source-reviews/packet"
    });
    expect(packetResponse.statusCode).toBe(200);
    expect(packetResponse.json()).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-server-source-review-packet-v1",
        workspaceId: "workspace-source",
        status: "needs-review",
        recordCount: 1,
        ledgerHashes: [body.ledgerHash],
        statusCounts: expect.objectContaining({ pendingReview: 1 }),
        reviewStatusCounts: expect.objectContaining({ reviewDue: 1 }),
        priorityCounts: expect.objectContaining({ P1: 1 }),
        matchingBehaviorChanged: false,
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Server Source Review packets are audit preparation lineage metadata only."
      })
    );
    expect(packetResponse.json().records[0]).toEqual(
      expect.objectContaining({
        recordHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        reviewerNotesHash: expect.stringMatching(/^[a-f0-9]{64}$/),
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

  it("rejects source review sync payloads with invalid enum fields before defaulting them", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-source/source-reviews",
      payload: {
        createdBy: "Source reviewer",
        sourceReview: {
          ...sourceReview,
          actions: [
            {
              ...sourceReview.actions[0],
              priority: "P9"
            }
          ]
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: "Source review action priority is invalid.",
        code: "SOURCE_REVIEW_SYNC_FAILED",
        recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );

    await server.close();
  });

  it("rejects malformed source review count fields before coercing them", async () => {
    const server = buildServer();
    const cases = [
      { totalSourceCount: "1" },
      { currentSourceCount: -1 },
      { reviewDueCount: 0.5 },
      { reviewWindowDays: "90" }
    ];

    for (const sourceReviewPatch of cases) {
      const response = await server.inject({
        method: "POST",
        url: "/api/workspaces/workspace-source/source-reviews",
        payload: {
          createdBy: "Source reviewer",
          sourceReview: {
            ...sourceReview,
            ...sourceReviewPatch
          }
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          code: "SOURCE_REVIEW_SYNC_FAILED",
          recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).toMatch(/Source review .* (count|days) is invalid\./);
    }

    await server.close();
  });

  it("rejects incomplete source review metadata before creating records or audit logs", async () => {
    const server = buildServer();
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const cases = [
      {
        workspaceId: "workspace-source-review-items-not-array",
        sourceReviewPatch: {
          items: {
            rawSourceBody: `apiKey=${apiKey}`
          }
        },
        expectedError: "Source review items must be an array.",
        blockedValue: apiKey
      },
      {
        workspaceId: "workspace-source-review-actions-not-array",
        sourceReviewPatch: {
          actions: `apiKey=${apiKey}`
        },
        expectedError: "Source review actions must be an array.",
        blockedValue: apiKey
      },
      {
        workspaceId: "workspace-source-review-missing-url",
        sourceReviewPatch: {
          items: [
            {
              ...sourceReview.items[0],
              sourceUrl: " "
            }
          ]
        },
        expectedError: "Source review item source URL must be a non-empty string.",
        blockedValue: ""
      },
      {
        workspaceId: "workspace-source-review-secret-action",
        sourceReviewPatch: {
          actions: [
            {
              ...sourceReview.actions[0],
              action: [`apiKey=${apiKey}`]
            }
          ]
        },
        expectedError: "Source review action text must be a non-empty string.",
        blockedValue: apiKey
      },
      {
        workspaceId: "workspace-source-review-count-mismatch",
        sourceReviewPatch: {
          totalSourceCount: sourceReview.totalSourceCount + 1
        },
        expectedError: "Source review counts must match the review item statuses.",
        blockedValue: ""
      }
    ];

    for (const item of cases) {
      const response = await server.inject({
        method: "POST",
        url: `/api/workspaces/${item.workspaceId}/source-reviews`,
        payload: {
          createdBy: "Source reviewer",
          sourceReview: {
            ...sourceReview,
            ...item.sourceReviewPatch
          }
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: item.expectedError,
          code: "SOURCE_REVIEW_SYNC_FAILED",
          recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      if (item.blockedValue) {
        expect(response.body).not.toContain(item.blockedValue);
      }

      const listResponse = await server.inject({
        method: "GET",
        url: `/api/workspaces/${item.workspaceId}/source-reviews`
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

  it("rejects malformed source review root payloads before creating records or audit logs", async () => {
    const server = buildServer();
    const cases: Array<{ payload?: unknown }> = [
      {},
      {
        payload: ["raw source body with apiKey=sk-live-abcdef1234567890abcdef1234567890"]
      }
    ];

    for (const [index, item] of cases.entries()) {
      const workspaceId = `workspace-source-review-malformed-${index}`;
      const response = await server.inject({
        method: "POST",
        url: `/api/workspaces/${workspaceId}/source-reviews`,
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: "Source review sync payload must be a JSON object.",
          code: "SOURCE_REVIEW_SYNC_FAILED",
          recoveryAction: "Remove credentials, [redacted-raw-kyc], personal data, legal conclusions, and raw source bodies, then retry.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("apiKey");

      const listResponse = await server.inject({
        method: "GET",
        url: `/api/workspaces/${workspaceId}/source-reviews`
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
