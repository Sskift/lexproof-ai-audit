import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import type { ProjectProfile } from "./projectModel";

const baseProject: ProjectProfile = {
  id: "project-regulatory-graph",
  projectName: "Global Yield Launch",
  entityType: "Startup issuer",
  jurisdictions: ["European Union", "United Kingdom", "Singapore", "Switzerland", "United Arab Emirates", "United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata and wallet transaction history",
  aiUsage: "AI drafts evidence summaries for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createRegulatoryGraph", () => {
  it("matches source-backed jurisdiction clauses without making legal conclusions", () => {
    const audit = analyzeAuditProfile(baseProject);
    const graph = createRegulatoryGraph(baseProject, audit, baseProject.evidenceItems);

    expect(graph.graphVersion).toBe("lexproof-regulatory-graph-v1");
    expect(graph.notLegalAdviceBoundary).toBe(
      "Not legal advice. Regulatory graph output is audit preparation material only."
    );
    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining([
        "eu-mica-title-ii-white-paper",
        "uk-fca-crypto-financial-promotions",
        "sg-mas-psn02-dpt-aml-cft",
        "ch-finma-ico-token-classification",
        "uae-vara-va-regulations-activity-scope",
        "us-sec-cftc-crypto-asset-interpretation"
      ])
    );

    const euClause = graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-title-ii-white-paper");
    expect(euClause).toMatchObject({
      jurisdiction: "European Union",
      citation: "Regulation (EU) 2023/1114, Title II",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
      coverageStatus: "missing"
    });

    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "European Union")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "EU crypto-asset / data protection counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks clause evidence covered when verified evidence matches source requests", () => {
    const project: ProjectProfile = {
      ...baseProject,
      jurisdictions: ["European Union", "United Kingdom"],
      evidenceItems: [
        {
          id: "mica-whitepaper",
          label: "MiCA white paper and public communication review",
          kind: "Counsel memo",
          source: "Regulation (EU) 2023/1114 Title II evidence request",
          content: "Crypto-asset white paper, public communication, risk disclosure, and management approval evidence.",
          status: "verified",
          owner: "Counsel"
        },
        {
          id: "fca-promo",
          label: "UK financial promotion approval pack",
          kind: "Review packet",
          source: "FCA PS23/6 cryptoasset financial promotions",
          content: "Fair clear not misleading review, risk warning, appropriateness assessment, and client categorisation evidence.",
          status: "received",
          owner: "Compliance"
        }
      ]
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-title-ii-white-paper")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["MiCA white paper and public communication review"]
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-fca-crypto-financial-promotions")).toMatchObject({
      coverageStatus: "covered",
      matchedEvidenceLabels: ["UK financial promotion approval pack"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clauseId: "eu-mica-title-ii-white-paper"
        }),
        expect.objectContaining({
          clauseId: "uk-fca-crypto-financial-promotions"
        })
      ])
    );
  });

  it("creates a prioritized evidence gap queue for unmatched source controls", () => {
    const audit = analyzeAuditProfile(baseProject);
    const graph = createRegulatoryGraph(baseProject, audit, baseProject.evidenceItems);

    expect(graph.evidenceGaps[0]).toMatchObject({
      priority: "P0",
      jurisdiction: "United States",
      clauseId: "us-sec-cftc-crypto-asset-interpretation"
    });
    expect(graph.topActions.map((action) => action.action)).toEqual(
      expect.arrayContaining([
        "Prepare US crypto asset classification and offering analysis for counsel review.",
        "Prepare EU crypto-asset white paper and public communication evidence for counsel review."
      ])
    );
  });
});
