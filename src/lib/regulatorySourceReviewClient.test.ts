import { describe, expect, it, vi } from "vitest";
import { fetchRegulatorySourceReviewPacket, syncRegulatorySourceReviewLedger } from "./regulatorySourceReviewClient";
import type { RegulatorySourceReview } from "./regulatorySourceReview";
import type { RegulatorySourceReviewSyncResult } from "./phase2Types";
import type { ServerRegulatorySourceReviewPacket } from "./regulatorySourceReviewSync";

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

const sourceReviewPacket: ServerRegulatorySourceReviewPacket = {
  packetVersion: "lexproof-server-source-review-packet-v1",
  workspaceId: "workspace-source",
  generatedAt: "2026-10-01T00:00:00.000Z",
  status: "needs-review",
  recordCount: 1,
  ledgerHashes: ["b".repeat(64)],
  statusCounts: {
    current: 0,
    pendingReview: 1,
    metadataNeeded: 0
  },
  reviewStatusCounts: {
    current: 0,
    reviewDue: 1,
    metadataMissing: 0
  },
  priorityCounts: {
    P0: 0,
    P1: 1,
    P2: 0
  },
  matchingBehaviorChanged: false,
  records: [
    {
      recordId: "source-review-record",
      ledgerHash: "b".repeat(64),
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
      nextAction: "Refresh Regulation (EU) 2023/1114, Title II source metadata before counsel handoff.",
      status: "pending-review",
      reviewerNotesHash: "c".repeat(64),
      recordHash: "d".repeat(64),
      matchingBehaviorChanged: false,
      notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
    }
  ],
  nextActions: ["Refresh due source metadata with counsel or compliance review before final handoff."],
  packetHash: "e".repeat(64),
  notLegalAdviceBoundary: "Not legal advice. Server Source Review packets are audit preparation lineage metadata only."
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

  it("rejects malformed local source review collections and counts before posting", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const cases = [
      {
        sourceReviewPatch: {
          items: {
            rawSourceBody: `apiKey=${apiKey}`
          }
        },
        expectedMessage: "Source review items must be an array before sync."
      },
      {
        sourceReviewPatch: {
          actions: `apiKey=${apiKey}`
        },
        expectedMessage: "Source review actions must be an array before sync."
      },
      {
        sourceReviewPatch: {
          items: [{ ...sourceReview.items[0], reviewStatus: "final-legal-approved" }]
        },
        expectedMessage: "Source review item 1 review status is invalid before sync."
      },
      {
        sourceReviewPatch: {
          items: [{ ...sourceReview.items[0], reviewerNotes: `Refresh source after removing apiKey=${apiKey}.` }]
        },
        expectedMessage: "Source review item 1 reviewer notes contains credentials, private-key material, or raw KYC before sync."
      },
      {
        sourceReviewPatch: {
          actions: [{ ...sourceReview.actions[0], priority: "P9" }]
        },
        expectedMessage: "Source review action 1 priority is invalid before sync."
      },
      {
        sourceReviewPatch: {
          totalSourceCount: sourceReview.totalSourceCount + 1
        },
        expectedMessage: "Source review counts must match the review item statuses before sync."
      }
    ];

    for (const item of cases) {
      const fetcher = vi.fn(async () => ({
        ok: true,
        json: async () => syncResult
      })) as unknown as typeof fetch;

      let thrown: unknown;
      try {
        await syncRegulatorySourceReviewLedger({
          apiBaseUrl: "https://api.lexproof.test",
          workspaceId: "workspace-source",
          sourceReview: {
            ...sourceReview,
            ...item.sourceReviewPatch
          } as unknown as RegulatorySourceReview,
          createdBy: "Source reviewer",
          fetcher
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toMatchObject({
        message: item.expectedMessage,
        code: "SOURCE_REVIEW_SYNC_INVALID_PAYLOAD",
        recoveryAction: "Regenerate Source Review Ledger metadata from the current source graph before syncing.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
      expect(JSON.stringify(thrown)).not.toContain(apiKey);
      expect(fetcher).not.toHaveBeenCalled();
    }
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

  it("rejects source review sync responses with blank record next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...syncResult, records: [{ ...syncResult.records[0], nextAction: " " }] })
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

  it("redacts classified text from otherwise valid source review sync responses before UI use", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...syncResult,
        workspaceId: `workspace-source apiKey=${apiKey}`,
        records: [
          {
            ...syncResult.records[0],
            id: `source-review-record ${privateKey}`,
            workspaceId: `workspace-source apiKey=${apiKey}`,
            sourceReviewItemId: "source-review raw_KYC passport A1234567",
            sourceName: "EUR-Lex reviewer@example.com",
            reviewerNotes: "Refresh raw KYC passport A1234567 with reviewer@example.com before handoff.",
            nextAction: `Remove legal conclusion and apiKey=${apiKey} before source review handoff.`,
            createdBy: "reviewer@example.com"
          }
        ]
      })
    })) as unknown as typeof fetch;

    const result = await syncRegulatorySourceReviewLedger({
      apiBaseUrl: "https://api.lexproof.test",
      workspaceId: "workspace-source",
      sourceReview,
      createdBy: "Source reviewer",
      fetcher
    });
    const serialized = JSON.stringify(result);

    expect(result.workspaceId).toBe("workspace-source [redacted-secret]");
    expect(result.ledgerHash).toBe(syncResult.ledgerHash);
    expect(result.records[0]).toMatchObject({
      id: "source-review-record [redacted-private-key]",
      workspaceId: "workspace-source [redacted-secret]",
      sourceName: "EUR-Lex [redacted-email]",
      createdBy: "[redacted-email]",
      notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
    });
    expect(result.records[0].sourceReviewItemId).toContain("[redacted-raw-kyc]");
    expect(result.records[0].reviewerNotes).toContain("[redacted-passport-id]");
    expect(result.records[0].nextAction).toContain("[redacted-legal-conclusion]");
    expect(serialized).toContain("[redacted-secret]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("A1234567");
    expect(serialized).not.toContain("reviewer@example.com");
    expect(serialized).not.toMatch(/\blegal conclusion\b/i);
  });

  it("rejects corrupted source review sync counts before the UI trusts them", async () => {
    const fetchers: (typeof fetch)[] = [
      vi.fn(async () => ({ ok: true, json: async () => ({ ...syncResult, syncedCount: -1 }) })) as unknown as typeof fetch,
      vi.fn(async () => ({ ok: true, json: async () => ({ ...syncResult, syncedCount: 2 }) })) as unknown as typeof fetch,
      vi.fn(async () => ({ ok: true, json: async () => ({ ...syncResult, syncedCount: 0.5 }) })) as unknown as typeof fetch
    ];

    for (const fetcher of fetchers) {
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
    }
  });

  it("fetches a server Source Review packet without posting ledger payloads or reviewer-note body text", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => sourceReviewPacket
    })) as unknown as typeof fetch;

    const packet = await fetchRegulatorySourceReviewPacket({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-source",
      fetcher
    });

    expect(packet).toBe(sourceReviewPacket);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/workspaces/workspace-source/source-reviews/packet");
    expect(init).toEqual({ method: "GET" });
    expect(JSON.stringify(init)).not.toContain("Review source freshness before counsel handoff.");
    expect(JSON.stringify(packet)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal conclusion\b/i);
  });

  it("rejects malformed server Source Review packets before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...sourceReviewPacket, matchingBehaviorChanged: true })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceReviewPacket({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_REVIEW_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source review records."
    });
  });

  it("rejects server Source Review packets with blank record next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...sourceReviewPacket,
        records: [{ ...sourceReviewPacket.records[0], nextAction: " " }]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceReviewPacket({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_REVIEW_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source review records."
    });
  });

  it("redacts classified text from otherwise valid server Source Review packets before UI use", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...sourceReviewPacket,
        workspaceId: `workspace-source apiKey=${apiKey}`,
        generatedAt: `2026-10-01T00:00:00.000Z private key ${privateKey}`,
        records: [
          {
            ...sourceReviewPacket.records[0],
            recordId: "source-review-record raw KYC passport A1234567",
            sourceName: "EUR-Lex reviewer@example.com",
            nextAction: `Remove legal conclusion, raw_KYC passport A1234567, and apiKey=${apiKey} before handoff.`
          }
        ],
        nextActions: [`Refresh private key ${privateKey} and raw KYC passport A1234567 before source handoff.`]
      })
    })) as unknown as typeof fetch;

    const packet = await fetchRegulatorySourceReviewPacket({
      apiBaseUrl: "https://api.lexproof.test",
      workspaceId: "workspace-source",
      fetcher
    });
    const serialized = JSON.stringify(packet);

    expect(packet.workspaceId).toBe("workspace-source [redacted-secret]");
    expect(packet.generatedAt).toContain("[redacted-private-key]");
    expect(packet.ledgerHashes).toEqual(sourceReviewPacket.ledgerHashes);
    expect(packet.packetHash).toBe(sourceReviewPacket.packetHash);
    expect(packet.records[0].reviewerNotesHash).toBe(sourceReviewPacket.records[0].reviewerNotesHash);
    expect(packet.records[0].recordHash).toBe(sourceReviewPacket.records[0].recordHash);
    expect(packet.records[0].recordId).toContain("[redacted-raw-kyc]");
    expect(packet.records[0].sourceName).toBe("EUR-Lex [redacted-email]");
    expect(packet.records[0].nextAction).toContain("[redacted-legal-conclusion]");
    expect(packet.nextActions[0]).toContain("[redacted-private-key]");
    expect(serialized).toContain("[redacted-secret]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("A1234567");
    expect(serialized).not.toContain("reviewer@example.com");
    expect(serialized).not.toMatch(/\blegal conclusion\b/i);
  });

  it("rejects server Source Review packets with blank next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...sourceReviewPacket,
        nextActions: ["Refresh due source metadata with counsel or compliance review before final handoff.", "   "]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceReviewPacket({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_REVIEW_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source review records."
    });
  });

  it("rejects server Source Review packets whose counts do not match records", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...sourceReviewPacket,
        statusCounts: {
          ...sourceReviewPacket.statusCounts,
          pendingReview: 0
        }
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceReviewPacket({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_REVIEW_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source review records."
    });
  });

  it("redacts unsafe API error text when source review packet refresh fails", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "Source review packet failed with raw KYC passport data and api key=sk-live-abcdef1234567890abcdef1234567890.",
        code: "SOURCE_REVIEW_PACKET_REJECTED",
        recoveryAction: "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef and retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceReviewPacket({
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_REVIEW_PACKET_REJECTED",
      message: expect.stringContaining("[redacted-raw-kyc]"),
      recoveryAction: expect.stringContaining("[redacted-private-key]"),
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
  });
});
