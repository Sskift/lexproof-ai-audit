import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRiskIssueCards } from "./riskExplainers";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "risk-explainers",
  projectName: "Yield Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata and wallet transaction history",
  aiUsage: "AI drafts suitability memo and flags restricted investors",
  blockchainUse: "Ethereum evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createRiskIssueCards", () => {
  it("links each deterministic risk flag to source references and trigger facts", () => {
    const audit = analyzeAuditProfile(project);
    const cards = createRiskIssueCards(project, audit);
    const assetCard = cards.find((card) => card.flagId === "asset-yield");

    expect(assetCard).toMatchObject({
      title: "Yield-bearing or investment-like asset",
      whyTriggered: expect.arrayContaining(["Asset model: Tokenized private credit note with yield"]),
      sourceReferences: [
        expect.objectContaining({
          title: "BLI Legal Tech Hackathon 2",
          url: expect.stringContaining("https://")
        })
      ]
    });
    expect(cards.every((card) => card.notLegalAdviceBoundary.includes("audit preparation"))).toBe(true);
  });

  it("uses the current project facts rather than model output to explain AI workflow risk", () => {
    const audit = analyzeAuditProfile(project);
    const cards = createRiskIssueCards(project, audit);

    expect(cards.find((card) => card.flagId === "ai-workflow")?.whyTriggered).toEqual(
      expect.arrayContaining(["AI usage: AI drafts suitability memo and flags restricted investors"])
    );
  });
});
