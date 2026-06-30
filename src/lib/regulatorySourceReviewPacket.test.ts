import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import { createRegulatorySourceReviewPacket, exportRegulatorySourceReviewPacketJson } from "./regulatorySourceReviewPacket";
import type { ProjectProfile } from "./projectModel";

const globalLaunchProject: ProjectProfile = {
  id: "project-source-review-packet",
  projectName: "Global Yield Source Review",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union", "United Kingdom", "Singapore"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata only",
  aiUsage: "AI drafts evidence summaries for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createRegulatorySourceReviewPacket", () => {
  it("exports a stable metadata-only source review action packet without legal conclusions", async () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-15T00:00:00.000Z",
      reviewWindowDays: 90
    });

    const packet = await createRegulatorySourceReviewPacket({
      projectId: globalLaunchProject.id,
      projectName: globalLaunchProject.projectName,
      sourceReview,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });
    const samePacket = await createRegulatorySourceReviewPacket({
      projectId: globalLaunchProject.id,
      projectName: globalLaunchProject.projectName,
      sourceReview,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });

    expect(packet.packetVersion).toBe("lexproof-regulatory-source-review-packet-v1");
    expect(packet.packetHash).toMatch(/^[a-f0-9]{64}$/);
    expect(packet.packetHash).toBe(samePacket.packetHash);
    expect(packet.summary).toEqual(
      expect.objectContaining({
        actionCount: sourceReview.actions.length,
        reviewDueCount: sourceReview.reviewDueCount,
        metadataMissingCount: sourceReview.metadataMissingCount,
        currentSourceCount: sourceReview.currentSourceCount
      })
    );
    expect(packet.actions[0]).toEqual(
      expect.objectContaining({
        priority: "P1",
        targetType: "clause-match",
        nextAction: expect.stringContaining("Refresh")
      })
    );
    expect(packet.notLegalAdviceBoundary).toBe(
      "Not legal advice. Source review packets are audit preparation workflow metadata only."
    );
    expect(JSON.stringify(packet)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("changes the packet hash when a source review action changes", async () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-15T00:00:00.000Z",
      reviewWindowDays: 90
    });
    const packet = await createRegulatorySourceReviewPacket({
      projectId: globalLaunchProject.id,
      projectName: globalLaunchProject.projectName,
      sourceReview,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });
    const updatedPacket = await createRegulatorySourceReviewPacket({
      projectId: globalLaunchProject.id,
      projectName: globalLaunchProject.projectName,
      sourceReview: {
        ...sourceReview,
        actions: sourceReview.actions.map((action, index) =>
          index === 0 ? { ...action, action: `${action.action} Confirm regulator source URL.` } : action
        )
      },
      generatedAt: "2026-10-15T00:00:00.000Z"
    });

    expect(updatedPacket.packetHash).not.toBe(packet.packetHash);
  });

  it("serializes packet JSON with the hash and non-advice boundary", async () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-07-15T00:00:00.000Z",
      reviewWindowDays: 90
    });
    const packet = await createRegulatorySourceReviewPacket({
      projectId: globalLaunchProject.id,
      projectName: globalLaunchProject.projectName,
      sourceReview,
      generatedAt: "2026-07-15T00:00:00.000Z"
    });

    const json = exportRegulatorySourceReviewPacketJson(packet);

    expect(json).toContain("\"packetVersion\": \"lexproof-regulatory-source-review-packet-v1\"");
    expect(json).toContain(`"packetHash": "${packet.packetHash}"`);
    expect(json).toContain("Not legal advice. Source review packets are audit preparation workflow metadata only.");
    expect(json.endsWith("\n")).toBe(true);
  });
});
