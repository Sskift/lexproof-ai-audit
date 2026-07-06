import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRiskSourceCitationControls } from "./sourceCitationControls";
import type { ProjectProfile } from "./projectModel";

const rwaProject: ProjectProfile = {
  id: "source-citation-rwa",
  projectName: "Global Yield Launch",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union", "United Kingdom"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata and wallet transaction history",
  aiUsage: "AI drafts evidence summaries for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createRiskSourceCitationControls", () => {
  it("maps each risk flag to source citation controls, evidence gaps, and counsel routes", () => {
    const audit = analyzeAuditProfile(rwaProject);
    const graph = createRegulatoryGraph(rwaProject, audit, rwaProject.evidenceItems);
    const controls = createRiskSourceCitationControls(audit, graph);
    const assetYieldControl = controls.find((control) => control.flagId === "asset-yield");

    expect(assetYieldControl).toMatchObject({
      flagTitle: "Yield-bearing or investment-like asset",
      coverageStatus: "missing",
      citationCount: expect.any(Number),
      nextAction: expect.stringContaining("open source-linked evidence request"),
      notLegalAdviceBoundary: "Not legal advice. Source citation controls are audit preparation prompts only."
    });
    expect(assetYieldControl?.citationCount).toBeGreaterThan(2);
    expect(assetYieldControl?.citations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jurisdiction: "European Union",
          citation: "Regulation (EU) 2023/1114, Title II",
          sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng"
        }),
        expect.objectContaining({
          jurisdiction: "United States",
          citation: "17 C.F.R. 230.501(a), 230.506(c)"
        })
      ])
    );
    expect(assetYieldControl?.topOpenEvidenceRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: "P0",
          status: "missing",
          citation: expect.any(String)
        })
      ])
    );
    expect(assetYieldControl?.localCounselRoutes).toEqual(
      expect.arrayContaining(["EU crypto-asset / data protection counsel", "US private offering / securities counsel"])
    );
    expect(JSON.stringify(assetYieldControl)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks a flag as partial when at least one mapped citation has supporting evidence", () => {
    const project: ProjectProfile = {
      ...rwaProject,
      evidenceItems: [
        {
          id: "mica-whitepaper",
          label: "MiCA white paper and public communication review",
          kind: "Counsel memo",
          source: "Regulation (EU) 2023/1114 Title II evidence request",
          content: "Crypto-asset white paper, public communication, risk disclosure, and management approval evidence.",
          status: "verified",
          owner: "Counsel"
        }
      ]
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);
    const assetYieldControl = createRiskSourceCitationControls(audit, graph).find(
      (control) => control.flagId === "asset-yield"
    );

    expect(assetYieldControl).toMatchObject({
      coverageStatus: "partial",
      nextAction: expect.stringContaining("open source-linked evidence request")
    });
    expect(assetYieldControl?.citations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          citation: "Regulation (EU) 2023/1114, Title II",
          coverageStatus: "covered",
          openEvidenceRequestCount: 0
        })
      ])
    );
  });

  it("keeps unmapped jurisdiction controls explicit without inventing legal conclusions", () => {
    const project: ProjectProfile = {
      ...rwaProject,
      jurisdictions: ["Mars Free Zone"]
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);
    const controls = createRiskSourceCitationControls(audit, graph);
    const assetYieldControl = controls.find((control) => control.flagId === "asset-yield");

    expect(assetYieldControl).toMatchObject({
      coverageStatus: "not-mapped",
      citationCount: 0,
      citations: [],
      topOpenEvidenceRequests: [],
      localCounselRoutes: [],
      nextAction:
        "No jurisdiction citation controls mapped to Yield-bearing or investment-like asset; review general source references before counsel handoff."
    });
  });
});
