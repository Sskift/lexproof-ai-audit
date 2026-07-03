import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { buildMarkdownCounselPack } from "./counselPack";
import {
  getCounselPackTemplateById,
  recommendCounselPackTemplate,
  type CounselPackTemplateId
} from "./counselPackTemplates";
import { createEvidenceManifest } from "./evidenceManifest";
import type { ProjectProfile } from "./projectModel";

const baseProject: ProjectProfile = {
  id: "project-template",
  projectName: "Template Review Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC summaries excluded from exports",
  aiUsage: "AI drafts compliance review questions",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("Counsel Pack export templates", () => {
  it.each([
    ["Tokenized Asset / RWA Review", "rwa-tokenized-asset"],
    ["AI Governance Review", "ai-governance"],
    ["Custody Controls Review", "custody-controls"],
    ["Marketing Claims Review", "marketing-claims"],
    ["Launch Readiness Review", "launch-review"]
  ] satisfies Array<[string, CounselPackTemplateId]>)("recommends %s from project facts", (_label, expectedTemplateId) => {
    const project = projectForTemplate(expectedTemplateId);
    const audit = analyzeAuditProfile(project);

    const recommendation = recommendCounselPackTemplate(project, audit);

    expect(recommendation.id).toBe(expectedTemplateId);
    expect(recommendation.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(recommendation.reviewAgenda.length).toBeGreaterThanOrEqual(3);
  });

  it("adds a template-specific agenda and evidence focus to generated Markdown without hiding missing evidence", async () => {
    const audit = analyzeAuditProfile(baseProject);
    const manifest = await createEvidenceManifest(baseProject, audit, baseProject.evidenceItems);
    const template = getCounselPackTemplateById("rwa-tokenized-asset");

    const markdown = buildMarkdownCounselPack(baseProject, audit, manifest, [], [], undefined, undefined, template);

    expect(markdown).toContain("## Export Template");
    expect(markdown).toContain("Tokenized Asset / RWA Review");
    expect(markdown).toContain("Not legal advice. Export templates are audit preparation routing aids only.");
    expect(markdown).toContain("### Template Review Agenda");
    expect(markdown).toContain("Map tokenized asset terms, redemption assumptions, and yield disclosures to counsel review.");
    expect(markdown).toContain("### Template Evidence Focus");
    expect(markdown).toContain("Offering/disclosure assumptions");
    expect(markdown).toContain("## Evidence Manifest");
    expect(markdown).toContain("- No evidence items have been added yet.");
  });

  it("keeps tokenized private credit projects on the RWA template when custody controls are in scope", () => {
    const project: ProjectProfile = {
      ...baseProject,
      assetModel: "Tokenized private credit note with yield, New York resident access, and BitLicense planning assumptions",
      userType: "Retail users, New York residents, and accredited investors",
      custodyModel:
        "Platform controls omnibus wallet custody for customer virtual currency with internal ledger reconciliation, sub-custody planning, and no proprietary use controls"
    };
    const audit = analyzeAuditProfile(project);

    const recommendation = recommendCounselPackTemplate(project, audit);

    expect(recommendation.id).toBe("rwa-tokenized-asset");
    expect(recommendation.notLegalAdviceBoundary).toContain("Not legal advice");
  });
});

function projectForTemplate(templateId: CounselPackTemplateId): ProjectProfile {
  if (templateId === "ai-governance") {
    return {
      ...baseProject,
      assetModel: "AI legal compliance review workflow",
      custodyModel: "No custody",
      aiUsage: "AI reviews evidence and drafts legal/compliance notes",
      blockchainUse: "No chain anchoring"
    };
  }

  if (templateId === "custody-controls") {
    return {
      ...baseProject,
      assetModel: "DAO governance token",
      userType: "Institutional counterparties",
      custodyModel: "Platform controls omnibus wallet and multisig treasury",
      aiUsage: "No AI usage"
    };
  }

  if (templateId === "marketing-claims") {
    return {
      ...baseProject,
      assetModel: "Community token with promotional campaign",
      userType: "Retail users",
      custodyModel: "No custody",
      aiUsage: "No AI usage",
      operatingStage: "Marketing campaign before public launch"
    };
  }

  if (templateId === "launch-review") {
    return {
      ...baseProject,
      assetModel: "Protocol utility token",
      userType: "Developers only",
      custodyModel: "No custody",
      aiUsage: "No AI usage",
      operatingStage: "Planned public launch"
    };
  }

  return baseProject;
}
