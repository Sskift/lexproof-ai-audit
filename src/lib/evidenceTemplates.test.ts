import { describe, expect, it } from "vitest";
import { createEvidenceItemsFromTemplate, listEvidenceTemplates, recommendEvidenceTemplates } from "./evidenceTemplates";
import type { ProjectProfile } from "./projectModel";

const yieldProject: ProjectProfile = {
  id: "template-yield",
  projectName: "Yield Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata only",
  aiUsage: "AI flags missing approvals",
  blockchainUse: "Ethereum evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("evidence templates", () => {
  it("lists the three hackathon-critical evidence template scenarios", () => {
    const templates = listEvidenceTemplates();

    expect(templates.map((template) => template.id)).toEqual(
      expect.arrayContaining(["tokenized-yield-rwa", "dao-governance-multisig", "ai-compliance-workflow"])
    );
    expect(templates.every((template) => template.items.length >= 3)).toBe(true);
    expect(templates.every((template) => template.notLegalAdviceBoundary.includes("Not legal advice"))).toBe(true);
  });

  it("recommends the tokenized yield and RWA template for yield/custody facts", () => {
    const recommended = recommendEvidenceTemplates(yieldProject);

    expect(recommended[0]).toMatchObject({
      id: "tokenized-yield-rwa",
      title: "Tokenized Yield / RWA Issuance"
    });
    expect(recommended.map((template) => template.id)).not.toContain("dao-governance-multisig");
  });

  it("instantiates requested evidence items without raw KYC or private data", () => {
    const items = createEvidenceItemsFromTemplate("tokenized-yield-rwa");

    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining(["RWA disclosure assumptions memo", "Custody and signer control runbook", "Investor eligibility review"])
    );
    expect(items.every((item) => item.status === "requested")).toBe(true);
    expect(JSON.stringify(items).toLowerCase()).not.toContain("passport");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("private key");
  });
});
