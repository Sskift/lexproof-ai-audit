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

const aiLegalWorkflowProject: ProjectProfile = {
  id: "template-ai-workflow",
  projectName: "LexAssist Evidence Desk",
  entityType: "Legal operations AI workflow",
  jurisdictions: ["European Union", "United Kingdom"],
  assetModel: "No token sale; AI-assisted matter intake and evidence review workflow",
  userType: "In-house counsel and compliance reviewers",
  custodyModel: "No custody; metadata-only evidence records",
  dataSensitivity: "Confidential matter summaries with client identifiers excluded",
  aiUsage: "AI drafts issue-spotting notes, evidence requests, and source-linked counsel questions for human review",
  blockchainUse: "Simulated manifest anchor",
  operatingStage: "Internal pilot before counsel-supervised rollout",
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
    const serializedSources = items.map((item) => item.source ?? "").join("\n");

    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "RWA disclosure assumptions memo",
        "Custody and signer control runbook",
        "Investor eligibility review",
        "Wallet sanctions screening and escalation controls"
      ])
    );
    expect(items.every((item) => item.status === "requested")).toBe(true);
    expect(serializedSources).toContain("regulatory control: control-eu-mica-casp-custody-administration");
    expect(serializedSources).toContain("regulatory control: control-sg-mas-dpt-customer-asset-safeguards");
    expect(serializedSources).toContain("regulatory control: control-br-bcb-virtual-asset-service-framework");
    expect(serializedSources).toContain("regulatory control: control-br-cvm-crypto-asset-securities-guidance");
    expect(serializedSources).toContain("regulatory control: control-us-sec-reg-d-accredited-investor-verification");
    expect(serializedSources).toContain("regulatory control: control-us-ofac-virtual-currency-sanctions-compliance");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("passport");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("private key");
  });

  it("recommends AI workflow evidence with regulatory control links", () => {
    const recommended = recommendEvidenceTemplates(aiLegalWorkflowProject);
    const items = createEvidenceItemsFromTemplate("ai-compliance-workflow");
    const serializedSources = items.map((item) => item.source ?? "").join("\n");

    expect(recommended[0]).toMatchObject({
      id: "ai-compliance-workflow",
      title: "AI Legal / Compliance Workflow"
    });
    expect(serializedSources).toContain("regulatory control: control-eu-ai-act-ai-literacy-governance");
    expect(serializedSources).toContain("regulatory control: control-uk-ico-ai-data-protection-governance");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("passport");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("private key");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("api key");
  });
});
