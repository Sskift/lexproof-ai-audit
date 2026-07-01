import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import { createRegulatorySourceApprovalSyncResult } from "./regulatorySourceApprovalSync";
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
});
