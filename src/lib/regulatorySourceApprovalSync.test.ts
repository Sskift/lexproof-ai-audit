import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import {
  createRegulatorySourceApprovalSyncResult,
  createServerRegulatorySourceApprovalPacket,
  hashRegulatorySourceApprovalQueue
} from "./regulatorySourceApprovalSync";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import type { ProjectProfile } from "./projectModel";

const globalLaunchProject: ProjectProfile = {
  id: "project-source-approval-sync",
  projectName: "Global Source Approval Sync",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union", "United Kingdom", "Singapore"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata only",
  aiUsage: "AI drafts source summaries for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

function createDueApprovalQueue() {
  const audit = analyzeAuditProfile(globalLaunchProject);
  const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
  const sourceReview = createRegulatorySourceReview(graph, {
    asOf: "2026-10-01T00:00:00.000Z",
    reviewWindowDays: 90
  });
  return createRegulatorySourceApprovalQueue(sourceReview, {
    generatedAt: "2026-10-01T00:00:00.000Z"
  });
}

describe("regulatory source approval sync", () => {
  it("creates metadata-only server approval records without changing source matching behavior", () => {
    const queue = createDueApprovalQueue();

    const result = createRegulatorySourceApprovalSyncResult({
      workspaceId: "workspace-source-sync",
      queue,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z"
    });

    expect(result).toEqual(
      expect.objectContaining({
        syncVersion: "lexproof-source-approval-sync-v1",
        workspaceId: "workspace-source-sync",
        syncedCount: queue.totalItemCount,
        queueHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
      })
    );
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-source-approval-record-v1",
        workspaceId: "workspace-source-sync",
        createdBy: "Source reviewer",
        status: "pending-review",
        matchingBehaviorChanged: false,
        approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
        notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
      })
    );
    expect(JSON.stringify(result)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("blocks unsafe source approval metadata without leaking credentials or raw KYC text", () => {
    const queue = createDueApprovalQueue();
    const unsafeQueue = {
      ...queue,
      items: [
        {
          ...queue.items[0],
          sourceName: "sk-live-abcdef1234567890abcdef1234567890",
          reviewerNotes: "Use raw KYC passport data and private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        },
        ...queue.items.slice(1)
      ]
    };

    expect(() =>
      createRegulatorySourceApprovalSyncResult({
        workspaceId: "workspace-source-sync",
        queue: unsafeQueue,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source approval records must not include credentials, private keys, raw KYC, personal data, or legal conclusions.");
  });

  it("blocks credential-like source metadata before output redaction", () => {
    const queue = createDueApprovalQueue();

    expect(() =>
      createRegulatorySourceApprovalSyncResult({
        workspaceId: "workspace-source-sync",
        queue: {
          ...queue,
          items: [
            {
              ...queue.items[0],
              sourceName: "sk-live-abcdef1234567890abcdef1234567890",
              reviewerNotes: "Review source freshness before counsel handoff."
            },
            ...queue.items.slice(1)
          ]
        },
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source approval records must not include credentials, private keys, raw KYC, personal data, or legal conclusions.");
  });

  it("hashes approval queue content independently from generatedAt", () => {
    const queue = createDueApprovalQueue();
    const regeneratedQueue = {
      ...queue,
      generatedAt: "2026-10-02T00:00:00.000Z"
    };
    const changedQueue = {
      ...queue,
      items: [
        {
          ...queue.items[0],
          nextAction: `${queue.items[0].nextAction} Route to refreshed source owner.`
        },
        ...queue.items.slice(1)
      ]
    };

    expect(hashRegulatorySourceApprovalQueue(regeneratedQueue)).toBe(hashRegulatorySourceApprovalQueue(queue));
    expect(hashRegulatorySourceApprovalQueue(changedQueue)).not.toBe(hashRegulatorySourceApprovalQueue(queue));
  });

  it("creates a stable server Source Approval packet without reviewer-note body text", () => {
    const queue = createDueApprovalQueue();
    const result = createRegulatorySourceApprovalSyncResult({
      workspaceId: "workspace-source-sync",
      queue,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z"
    });
    const first = createServerRegulatorySourceApprovalPacket({
      workspaceId: "workspace-source-sync",
      records: result.records,
      generatedAt: "2026-10-01T00:00:00.000Z"
    });
    const second = createServerRegulatorySourceApprovalPacket({
      workspaceId: "workspace-source-sync",
      records: [...result.records].reverse(),
      generatedAt: "2026-10-02T00:00:00.000Z"
    });

    expect(first).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-server-source-approval-packet-v1",
        workspaceId: "workspace-source-sync",
        recordCount: result.records.length,
        queueHashes: [result.queueHash],
        statusCounts: expect.objectContaining({ pendingReview: result.records.length }),
        matchingBehaviorChanged: false,
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Server Source Approval packets are audit preparation workflow metadata only."
      })
    );
    expect(first.packetHash).toBe(second.packetHash);
    expect(first.approvalStatusCounts.approvalRequired + first.approvalStatusCounts.metadataRequired).toBe(result.records.length);
    expect(first.nextActions.every((action) => action.trim().length > 0)).toBe(true);
    expect(first.records[0]).toEqual(
      expect.objectContaining({
        queueHash: result.queueHash,
        reviewerNotesHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        recordHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        matchingBehaviorChanged: false
      })
    );
    expect(JSON.stringify(first)).not.toContain(result.records[0].reviewerNotes);
    expect(JSON.stringify(first)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal conclusion\b/i);
  });

  it("rejects corrupted source approval count metadata instead of coercing values", () => {
    const queue = createDueApprovalQueue();
    const corruptedTotalQueue = {
      ...queue,
      totalItemCount: String(queue.totalItemCount)
    } as unknown as typeof queue;
    const corruptedApprovalQueue = {
      ...queue,
      approvalRequiredCount: -1
    } as unknown as typeof queue;

    expect(() =>
      createRegulatorySourceApprovalSyncResult({
        workspaceId: "workspace-source-sync",
        queue: corruptedTotalQueue,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source approval total item count is invalid.");

    expect(() =>
      createRegulatorySourceApprovalSyncResult({
        workspaceId: "workspace-source-sync",
        queue: corruptedApprovalQueue,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source approval approval required count is invalid.");
  });

  it("rejects non-array source approval collections and mismatched status counts", () => {
    const queue = createDueApprovalQueue();
    const nonArrayItemsQueue = {
      ...queue,
      items: {
        rawSourceBody: "privateKey=0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      }
    } as unknown as typeof queue;
    const mismatchedCountsQueue = {
      ...queue,
      totalItemCount: queue.totalItemCount + 1
    } as unknown as typeof queue;

    expect(() =>
      createRegulatorySourceApprovalSyncResult({
        workspaceId: "workspace-source-sync",
        queue: nonArrayItemsQueue,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source approval items must be an array.");

    expect(() =>
      createRegulatorySourceApprovalSyncResult({
        workspaceId: "workspace-source-sync",
        queue: mismatchedCountsQueue,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source approval counts must match the approval item statuses.");
  });

  it("rejects corrupted server approval records instead of normalizing status silently", () => {
    const queue = createDueApprovalQueue();
    const result = createRegulatorySourceApprovalSyncResult({
      workspaceId: "workspace-source-sync",
      queue,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z"
    });
    const corruptedRecord = {
      ...result.records[0],
      status: "approved"
    } as unknown as typeof result.records[number];

    expect(() =>
      createServerRegulatorySourceApprovalPacket({
        workspaceId: "workspace-source-sync",
        records: [corruptedRecord],
        generatedAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source approval record status is invalid.");
  });
});
