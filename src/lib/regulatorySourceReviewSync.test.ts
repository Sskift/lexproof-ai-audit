import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import {
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
});
