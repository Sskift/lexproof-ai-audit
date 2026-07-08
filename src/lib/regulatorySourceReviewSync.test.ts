import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import {
  createServerRegulatorySourceReviewPacket,
  createRegulatorySourceReviewSyncResult,
  hashRegulatorySourceReviewLedger
} from "./regulatorySourceReviewSync";
import type { ProjectProfile } from "./projectModel";

const globalLaunchProject: ProjectProfile = {
  id: "project-source-review-sync",
  projectName: "Global Source Review Sync",
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

function createDueSourceReview() {
  const audit = analyzeAuditProfile(globalLaunchProject);
  const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
  return createRegulatorySourceReview(graph, {
    asOf: "2026-10-01T00:00:00.000Z",
    reviewWindowDays: 90
  });
}

describe("regulatory source review sync", () => {
  it("creates metadata-only source review records with a stable ledger hash", () => {
    const sourceReview = createDueSourceReview();

    const first = createRegulatorySourceReviewSyncResult({
      workspaceId: "workspace-source-review",
      sourceReview,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z"
    });
    const second = createRegulatorySourceReviewSyncResult({
      workspaceId: "workspace-source-review",
      sourceReview,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z"
    });

    expect(first).toEqual(
      expect.objectContaining({
        syncVersion: "lexproof-source-review-sync-v1",
        workspaceId: "workspace-source-review",
        syncedCount: sourceReview.totalSourceCount,
        ledgerHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
      })
    );
    expect(first.ledgerHash).toBe(second.ledgerHash);
    expect(first.ledgerHash).toBe(hashRegulatorySourceReviewLedger(sourceReview));
    expect(first.records[0]).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-source-review-record-v1",
        workspaceId: "workspace-source-review",
        status: expect.stringMatching(/current|pending-review|metadata-needed/),
        matchingBehaviorChanged: false,
        createdBy: "Source reviewer",
        notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
      })
    );
    expect(JSON.stringify(first)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("changes the ledger hash when reviewed source metadata changes", () => {
    const sourceReview = createDueSourceReview();
    const changedSourceReview = {
      ...sourceReview,
      items: [
        {
          ...sourceReview.items[0],
          reviewerNotes: `${sourceReview.items[0].reviewerNotes} Freshness check routed to local counsel.`
        },
        ...sourceReview.items.slice(1)
      ]
    };

    expect(hashRegulatorySourceReviewLedger(changedSourceReview)).not.toBe(hashRegulatorySourceReviewLedger(sourceReview));
  });

  it("creates a stable server Source Review packet without reviewer-note body text", () => {
    const sourceReview = createDueSourceReview();
    const syncResult = createRegulatorySourceReviewSyncResult({
      workspaceId: "workspace-source-review",
      sourceReview,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z"
    });
    const first = createServerRegulatorySourceReviewPacket({
      workspaceId: "workspace-source-review",
      records: syncResult.records,
      generatedAt: "2026-10-01T00:00:00.000Z"
    });
    const second = createServerRegulatorySourceReviewPacket({
      workspaceId: "workspace-source-review",
      records: [...syncResult.records].reverse(),
      generatedAt: "2026-10-02T00:00:00.000Z"
    });
    const payload = JSON.stringify(first);

    expect(first).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-server-source-review-packet-v1",
        workspaceId: "workspace-source-review",
        status: "needs-review",
        recordCount: syncResult.records.length,
        ledgerHashes: [syncResult.ledgerHash],
        matchingBehaviorChanged: false,
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Server Source Review packets are audit preparation lineage metadata only."
      })
    );
    expect(first.packetHash).toBe(second.packetHash);
    expect(first.statusCounts.pendingReview).toBeGreaterThan(0);
    expect(first.reviewStatusCounts.reviewDue).toBeGreaterThan(0);
    expect(first.nextActions.every((action) => action.trim().length > 0)).toBe(true);
    expect(first.records[0]).toEqual(
      expect.objectContaining({
        recordHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        reviewerNotesHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        matchingBehaviorChanged: false
      })
    );
    expect(payload).not.toContain(sourceReview.items[0].reviewerNotes);
    expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b|final legal decision/i);
  });

  it("blocks unsafe source review metadata before records are created", () => {
    const sourceReview = createDueSourceReview();

    expect(() =>
      createRegulatorySourceReviewSyncResult({
        workspaceId: "workspace-source-review",
        sourceReview: {
          ...sourceReview,
          items: [
            {
              ...sourceReview.items[0],
              sourceName: "sk-live-abcdef1234567890abcdef1234567890",
              reviewerNotes: "Use raw KYC passport data and make a final legal decision."
            },
            ...sourceReview.items.slice(1)
          ]
        },
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source review records must not include credentials, private keys, raw KYC, personal data, or legal conclusions.");
  });

  it("rejects corrupted source review actions instead of normalizing priority silently", () => {
    const sourceReview = createDueSourceReview();
    const corruptedSourceReview = {
      ...sourceReview,
      actions: [
        {
          ...sourceReview.actions[0],
          priority: "P9"
        },
        ...sourceReview.actions.slice(1)
      ]
    } as unknown as typeof sourceReview;

    expect(() =>
      createRegulatorySourceReviewSyncResult({
        workspaceId: "workspace-source-review",
        sourceReview: corruptedSourceReview,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source review action priority is invalid.");
  });

  it("rejects corrupted source review count metadata instead of coercing values", () => {
    const sourceReview = createDueSourceReview();
    const corruptedCountReview = {
      ...sourceReview,
      totalSourceCount: String(sourceReview.totalSourceCount)
    } as unknown as typeof sourceReview;
    const corruptedWindowReview = {
      ...sourceReview,
      reviewWindowDays: -1
    } as unknown as typeof sourceReview;

    expect(() =>
      createRegulatorySourceReviewSyncResult({
        workspaceId: "workspace-source-review",
        sourceReview: corruptedCountReview,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source review total source count is invalid.");

    expect(() =>
      createRegulatorySourceReviewSyncResult({
        workspaceId: "workspace-source-review",
        sourceReview: corruptedWindowReview,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source review review window days is invalid.");
  });

  it("rejects non-array source review collections and mismatched status counts", () => {
    const sourceReview = createDueSourceReview();
    const nonArrayItemsReview = {
      ...sourceReview,
      items: {
        rawSourceBody: "apiKey=sk-live-abcdef1234567890abcdef1234567890"
      }
    } as unknown as typeof sourceReview;
    const nonArrayActionsReview = {
      ...sourceReview,
      actions: "apiKey=sk-live-abcdef1234567890abcdef1234567890"
    } as unknown as typeof sourceReview;
    const mismatchedCountsReview = {
      ...sourceReview,
      reviewDueCount: sourceReview.reviewDueCount + 1
    } as unknown as typeof sourceReview;

    expect(() =>
      createRegulatorySourceReviewSyncResult({
        workspaceId: "workspace-source-review",
        sourceReview: nonArrayItemsReview,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source review items must be an array.");

    expect(() =>
      createRegulatorySourceReviewSyncResult({
        workspaceId: "workspace-source-review",
        sourceReview: nonArrayActionsReview,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source review actions must be an array.");

    expect(() =>
      createRegulatorySourceReviewSyncResult({
        workspaceId: "workspace-source-review",
        sourceReview: mismatchedCountsReview,
        createdBy: "Source reviewer",
        createdAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source review counts must match the review item statuses.");
  });

  it("rejects corrupted server source review records instead of normalizing status silently", () => {
    const sourceReview = createDueSourceReview();
    const syncResult = createRegulatorySourceReviewSyncResult({
      workspaceId: "workspace-source-review",
      sourceReview,
      createdBy: "Source reviewer",
      createdAt: "2026-10-01T00:00:00.000Z"
    });
    const corruptedRecord = {
      ...syncResult.records[0],
      status: "approved"
    } as unknown as typeof syncResult.records[number];

    expect(() =>
      createServerRegulatorySourceReviewPacket({
        workspaceId: "workspace-source-review",
        records: [corruptedRecord],
        generatedAt: "2026-10-01T00:00:00.000Z"
      })
    ).toThrow("Source review record status is invalid.");
  });
});
