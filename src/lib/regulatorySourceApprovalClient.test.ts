import { describe, expect, it, vi } from "vitest";
import {
  fetchRegulatorySourceApprovalPacket,
  fetchRegulatorySourceApprovalRecords,
  syncRegulatorySourceApprovalQueue
} from "./regulatorySourceApprovalClient";
import type { RegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import type { RegulatorySourceApprovalSyncResult } from "./phase2Types";
import type { ServerRegulatorySourceApprovalPacket } from "./regulatorySourceApprovalSync";

const approvalQueue: RegulatorySourceApprovalQueue = {
  queueVersion: "lexproof-regulatory-source-approval-queue-v1",
  generatedAt: "2026-10-01T00:00:00.000Z",
  status: "needs-approval",
  queueHash: "b".repeat(64),
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

const sourceApprovalPacket: ServerRegulatorySourceApprovalPacket = {
  packetVersion: "lexproof-server-source-approval-packet-v1",
  workspaceId: "workspace-source",
  generatedAt: "2026-10-01T00:00:00.000Z",
  status: "needs-approval",
  recordCount: 1,
  queueHashes: ["a".repeat(64)],
  statusCounts: {
    pendingReview: 1
  },
  approvalStatusCounts: {
    approvalRequired: 1,
    metadataRequired: 0
  },
  reviewStatusCounts: {
    current: 0,
    reviewDue: 1,
    metadataMissing: 0
  },
  priorityCounts: {
    P0: 0,
    P1: 1
  },
  matchingBehaviorChanged: false,
  records: [
    {
      recordId: "source-approval-record",
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
      nextAction: "Refresh and approve source metadata before it changes source matching.",
      approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
      status: "pending-review",
      reviewerNotesHash: "2".repeat(64),
      recordHash: "3".repeat(64),
      matchingBehaviorChanged: false,
      notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
    }
  ],
  nextActions: ["Review refreshed source metadata in the Source Update Approval Queue before it can affect matching behavior."],
  packetHash: "4".repeat(64),
  notLegalAdviceBoundary: "Not legal advice. Server Source Approval packets are audit preparation workflow metadata only."
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

  it("rejects malformed local source approval collections and counts before posting", async () => {
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const cases = [
      {
        queuePatch: {
          items: {
            rawSourceBody: `privateKey=${privateKey}`
          }
        },
        expectedMessage: "Source approval items must be an array before sync."
      },
      {
        queuePatch: {
          queueHash: "not-a-hash"
        },
        expectedMessage: "Source approval queue hash must be a SHA-256 hex digest before sync."
      },
      {
        queuePatch: {
          items: [{ ...approvalQueue.items[0], approvalStatus: "approved-legal" }]
        },
        expectedMessage: "Source approval item 1 approval status is invalid before sync."
      },
      {
        queuePatch: {
          items: [{ ...approvalQueue.items[0], reviewerNotes: `Remove private key ${privateKey} before review.` }]
        },
        expectedMessage: "Source approval item 1 reviewer notes contains credentials, private-key material, or raw KYC before sync."
      },
      {
        queuePatch: {
          totalItemCount: approvalQueue.totalItemCount + 1
        },
        expectedMessage: "Source approval counts must match the approval item statuses before sync."
      }
    ];

    for (const item of cases) {
      const fetcher = vi.fn(async () => ({
        ok: true,
        json: async () => syncResult
      })) as unknown as typeof fetch;

      let thrown: unknown;
      try {
        await syncRegulatorySourceApprovalQueue({
          apiBaseUrl: "https://api.lexproof.test",
          workspaceId: "workspace-source",
          queue: {
            ...approvalQueue,
            ...item.queuePatch
          } as unknown as RegulatorySourceApprovalQueue,
          createdBy: "Source reviewer",
          fetcher
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toMatchObject({
        message: item.expectedMessage,
        code: "SOURCE_APPROVAL_SYNC_INVALID_PAYLOAD",
        recoveryAction: "Regenerate Source Approval Queue metadata from the current source review before syncing.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
      expect(JSON.stringify(thrown)).not.toContain(privateKey);
      expect(fetcher).not.toHaveBeenCalled();
    }
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

  it("rejects source approval sync responses with blank record next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...syncResult, records: [{ ...syncResult.records[0], nextAction: " " }] })
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

  it("redacts classified text from otherwise valid source approval sync responses before UI use", async () => {
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
            id: `source-approval-record ${privateKey}`,
            workspaceId: `workspace-source apiKey=${apiKey}`,
            sourceApprovalItemId: "source-approval raw_KYC passport A1234567",
            sourceName: "EUR-Lex reviewer@example.com",
            reviewerNotes: "Approve only after raw KYC passport A1234567 and reviewer@example.com are removed.",
            nextAction: `Remove legal conclusion and apiKey=${apiKey} before source approval handoff.`,
            createdBy: "reviewer@example.com"
          }
        ]
      })
    })) as unknown as typeof fetch;

    const result = await syncRegulatorySourceApprovalQueue({
      apiBaseUrl: "https://api.lexproof.test",
      workspaceId: "workspace-source",
      queue: approvalQueue,
      createdBy: "Source reviewer",
      fetcher
    });
    const serialized = JSON.stringify(result);

    expect(result.workspaceId).toBe("workspace-source [redacted-secret]");
    expect(result.queueHash).toBe(syncResult.queueHash);
    expect(result.records[0]).toMatchObject({
      id: "source-approval-record [redacted-private-key]",
      workspaceId: "workspace-source [redacted-secret]",
      sourceName: "EUR-Lex [redacted-email]",
      approvalGate: syncResult.records[0].approvalGate,
      createdBy: "[redacted-email]",
      notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
    });
    expect(result.records[0].sourceApprovalItemId).toContain("[redacted-raw-kyc]");
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

  it("rejects corrupted source approval sync counts before the UI trusts them", async () => {
    const fetchers: (typeof fetch)[] = [
      vi.fn(async () => ({ ok: true, json: async () => ({ ...syncResult, syncedCount: -1 }) })) as unknown as typeof fetch,
      vi.fn(async () => ({ ok: true, json: async () => ({ ...syncResult, syncedCount: 2 }) })) as unknown as typeof fetch,
      vi.fn(async () => ({ ok: true, json: async () => ({ ...syncResult, syncedCount: 0.5 }) })) as unknown as typeof fetch
    ];

    for (const fetcher of fetchers) {
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
    }
  });

  it("fetches persisted source approval records without posting source payloads", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => syncResult.records
    })) as unknown as typeof fetch;

    const records = await fetchRegulatorySourceApprovalRecords({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-source",
      fetcher
    });

    expect(records).toEqual(syncResult.records);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/workspaces/workspace-source/source-approvals");
    expect(init).toEqual({ method: "GET" });
    expect(JSON.stringify(init)).not.toContain("rawSourceBody");
    expect(JSON.stringify(init)).not.toContain("apiKey");
  });

  it("redacts classified text from otherwise valid persisted source approval records before UI use", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => [
        {
          ...syncResult.records[0],
          id: `source-approval-record ${privateKey}`,
          workspaceId: `workspace-source apiKey=${apiKey}`,
          sourceApprovalItemId: "source-approval raw_KYC passport A1234567",
          sourceName: "EUR-Lex reviewer@example.com",
          nextAction: `Remove legal conclusion, raw KYC passport A1234567, and apiKey=${apiKey} before approval.`,
          createdBy: "reviewer@example.com"
        }
      ]
    })) as unknown as typeof fetch;

    const records = await fetchRegulatorySourceApprovalRecords({
      apiBaseUrl: "https://api.lexproof.test",
      workspaceId: "workspace-source",
      fetcher
    });
    const serialized = JSON.stringify(records);

    expect(records[0]).toMatchObject({
      id: "source-approval-record [redacted-private-key]",
      workspaceId: "workspace-source [redacted-secret]",
      sourceName: "EUR-Lex [redacted-email]",
      approvalGate: syncResult.records[0].approvalGate,
      createdBy: "[redacted-email]"
    });
    expect(records[0].sourceApprovalItemId).toContain("[redacted-raw-kyc]");
    expect(records[0].nextAction).toContain("[redacted-legal-conclusion]");
    expect(serialized).toContain("[redacted-secret]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("A1234567");
    expect(serialized).not.toContain("reviewer@example.com");
    expect(serialized).not.toMatch(/\blegal conclusion\b/i);
  });

  it("rejects malformed persisted source approval records before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => [{ ...syncResult.records[0], matchingBehaviorChanged: true }]
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceApprovalRecords({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_APPROVAL_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source approval records."
    });
  });

  it("redacts unsafe API error text when persisted source approval refresh fails", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "Source approval refresh failed with raw KYC passport data and api key=sk-live-abcdef1234567890abcdef1234567890.",
        code: "SOURCE_APPROVAL_RECORD_REFRESH_REJECTED",
        recoveryAction:
          "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef and retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceApprovalRecords({
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_APPROVAL_RECORD_REFRESH_REJECTED",
      message: expect.stringContaining("[redacted-raw-kyc]"),
      recoveryAction: expect.stringContaining("[redacted-private-key]"),
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
  });

  it("fetches a server Source Approval packet without posting queue payloads or reviewer-note body text", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => sourceApprovalPacket
    })) as unknown as typeof fetch;

    const packet = await fetchRegulatorySourceApprovalPacket({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-source",
      fetcher
    });

    expect(packet).toBe(sourceApprovalPacket);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/workspaces/workspace-source/source-approvals/packet");
    expect(init).toEqual({ method: "GET" });
    expect(JSON.stringify(init)).not.toContain("Review source freshness before counsel handoff.");
    expect(JSON.stringify(packet)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal conclusion\b/i);
  });

  it("redacts classified text from otherwise valid server Source Approval packets before UI use", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...sourceApprovalPacket,
        workspaceId: `workspace-source apiKey=${apiKey}`,
        generatedAt: `2026-10-01T00:00:00.000Z private key ${privateKey}`,
        records: [
          {
            ...sourceApprovalPacket.records[0],
            recordId: "source-approval-record raw KYC passport A1234567",
            sourceApprovalItemId: `source-approval apiKey=${apiKey}`,
            sourceName: "EUR-Lex reviewer@example.com",
            nextAction: `Remove legal conclusion, raw_KYC passport A1234567, and apiKey=${apiKey} before handoff.`
          }
        ],
        nextActions: [`Review private key ${privateKey} and raw KYC passport A1234567 before source handoff.`]
      })
    })) as unknown as typeof fetch;

    const packet = await fetchRegulatorySourceApprovalPacket({
      apiBaseUrl: "https://api.lexproof.test",
      workspaceId: "workspace-source",
      fetcher
    });
    const serialized = JSON.stringify(packet);

    expect(packet.workspaceId).toBe("workspace-source [redacted-secret]");
    expect(packet.generatedAt).toContain("[redacted-private-key]");
    expect(packet.queueHashes).toEqual(sourceApprovalPacket.queueHashes);
    expect(packet.packetHash).toBe(sourceApprovalPacket.packetHash);
    expect(packet.records[0].reviewerNotesHash).toBe(sourceApprovalPacket.records[0].reviewerNotesHash);
    expect(packet.records[0].recordHash).toBe(sourceApprovalPacket.records[0].recordHash);
    expect(packet.records[0].approvalGate).toBe(sourceApprovalPacket.records[0].approvalGate);
    expect(packet.records[0].recordId).toContain("[redacted-raw-kyc]");
    expect(packet.records[0].sourceApprovalItemId).toBe("source-approval [redacted-secret]");
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

  it("rejects malformed server Source Approval packets before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...sourceApprovalPacket, matchingBehaviorChanged: true })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceApprovalPacket({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_APPROVAL_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source approval records."
    });
  });

  it("rejects server Source Approval packets with blank record next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...sourceApprovalPacket,
        records: [{ ...sourceApprovalPacket.records[0], nextAction: " " }]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceApprovalPacket({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_APPROVAL_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source approval records."
    });
  });

  it("rejects server Source Approval packets with blank next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...sourceApprovalPacket,
        nextActions: [
          "Review refreshed source metadata in the Source Update Approval Queue before it can affect matching behavior.",
          "   "
        ]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceApprovalPacket({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_APPROVAL_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source approval records."
    });
  });

  it("redacts unsafe API error text when source approval packet refresh fails", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "Source approval packet failed with raw KYC passport data and api key=sk-live-abcdef1234567890abcdef1234567890.",
        code: "SOURCE_APPROVAL_PACKET_REJECTED",
        recoveryAction: "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef and retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceApprovalPacket({
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_APPROVAL_PACKET_REJECTED",
      message: expect.stringContaining("[redacted-raw-kyc]"),
      recoveryAction: expect.stringContaining("[redacted-private-key]"),
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
  });

  it("rejects server Source Approval packets whose counts do not match records", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...sourceApprovalPacket,
        approvalStatusCounts: {
          ...sourceApprovalPacket.approvalStatusCounts,
          approvalRequired: 0
        }
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchRegulatorySourceApprovalPacket({
        apiBaseUrl: "https://api.lexproof.test",
        workspaceId: "workspace-source",
        fetcher
      })
    ).rejects.toMatchObject({
      code: "SOURCE_APPROVAL_SYNC_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only source approval records."
    });
  });
});
