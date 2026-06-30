import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceApprovalQueue, exportRegulatorySourceApprovalQueueJson } from "./regulatorySourceApproval";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import type { ProjectProfile } from "./projectModel";

const globalLaunchProject: ProjectProfile = {
  id: "project-source-approval",
  projectName: "Global Source Approval",
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

describe("createRegulatorySourceApprovalQueue", () => {
  it("creates a metadata-only approval queue for due source refreshes without legal conclusions", () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-01T00:00:00.000Z",
      reviewWindowDays: 90
    });

    const queue = createRegulatorySourceApprovalQueue(sourceReview, {
      generatedAt: "2026-10-01T00:00:00.000Z"
    });

    expect(queue).toEqual(
      expect.objectContaining({
        queueVersion: "lexproof-regulatory-source-approval-queue-v1",
        status: "needs-approval",
        generatedAt: "2026-10-01T00:00:00.000Z",
        approvalRequiredCount: sourceReview.reviewDueCount,
        metadataRequiredCount: 0,
        notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only."
      })
    );
    expect(queue.items[0]).toEqual(
      expect.objectContaining({
        priority: "P1",
        approvalStatus: "approval-required",
        reviewStatus: "review-due",
        nextAction: expect.stringContaining("Refresh and approve"),
        approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata."
      })
    );
    expect(JSON.stringify(queue)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("exports the source approval queue as stable metadata-only JSON", () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-01T00:00:00.000Z",
      reviewWindowDays: 90
    });
    const queue = createRegulatorySourceApprovalQueue(sourceReview, {
      generatedAt: "2026-10-01T00:00:00.000Z"
    });

    const json = exportRegulatorySourceApprovalQueueJson(queue);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(queue);
    expect(json).toContain("\"queueVersion\": \"lexproof-regulatory-source-approval-queue-v1\"");
    expect(json).toContain("\"notLegalAdviceBoundary\": \"Not legal advice. Source update approvals are audit preparation workflow metadata only.\"");
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
  });
});
