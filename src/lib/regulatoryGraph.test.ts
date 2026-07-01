import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createEvidenceItemsFromTemplate } from "./evidenceTemplates";
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

const aiLegalWorkflowProject: ProjectProfile = {
  id: "project-ai-legal-workflow",
  projectName: "LexAssist Evidence Desk",
  entityType: "Legal operations AI workflow",
  jurisdictions: ["European Union", "United Kingdom"],
  assetModel: "No token sale; AI-assisted matter intake and evidence review workflow",
  userType: "In-house counsel, compliance reviewers, and outside counsel",
  custodyModel: "No custody; workspace stores metadata-only evidence records",
  dataSensitivity: "Confidential matter summaries, privileged-review notes, and client identifiers excluded from demo evidence",
  aiUsage: "AI drafts issue-spotting notes, evidence requests, and source-linked counsel questions for human review",
  blockchainUse: "Simulated manifest anchor for exported audit-prep packets",
  operatingStage: "Internal pilot before counsel-supervised rollout",
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
      matchedClauseCount: 3,
      missingEvidenceCount: 6,
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
        "Prepare EU CASP custody and administration policy evidence for counsel review."
      ])
    );
  });

  it("matches EU and UK AI legal workflow source controls without legal conclusions", () => {
    const audit = analyzeAuditProfile(aiLegalWorkflowProject);
    const graph = createRegulatoryGraph(aiLegalWorkflowProject, audit, aiLegalWorkflowProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["eu-ai-act-ai-literacy-governance", "uk-ico-ai-data-protection-governance"])
    );

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-ai-act-ai-literacy-governance")).toMatchObject({
      jurisdiction: "European Union",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
      citation: "Regulation (EU) 2024/1689, Article 4 and Chapter III",
      coverageStatus: "missing",
      localCounselRole: "EU AI governance / data protection counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-ico-ai-data-protection-governance")).toMatchObject({
      jurisdiction: "United Kingdom",
      sourceUrl:
        "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/",
      coverageStatus: "missing",
      localCounselRole: "UK AI / data protection counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "EU AI use policy and human oversight evidence",
        "EU AI source lineage and risk-control evidence",
        "UK AI data-protection and redaction evidence",
        "UK AI explainability and reviewer decision log"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks AI legal workflow source controls covered when AI template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("ai-compliance-workflow").map((item, index) => ({
      ...item,
      id: `ai-template-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...aiLegalWorkflowProject,
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-ai-act-ai-literacy-governance")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-ico-ai-data-protection-governance")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "eu-ai-act-ai-literacy-governance" }),
        expect.objectContaining({ clauseId: "uk-ico-ai-data-protection-governance" })
      ])
    );
  });

  it("matches EU MiCA custody and administration controls for platform wallet custody facts", () => {
    const custodyProject: ProjectProfile = {
      ...baseProject,
      id: "project-eu-casp-custody",
      jurisdictions: ["European Union"],
      assetModel: "EU tokenized private credit product with crypto-asset service provider custody",
      custodyModel: "Platform controls omnibus wallet and client crypto-asset custody administration",
      aiUsage: "Manual evidence summary only",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(custodyProject);
    const graph = createRegulatoryGraph(custodyProject, audit, custodyProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["eu-mica-casp-custody-administration"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-casp-custody-administration")).toMatchObject({
      jurisdiction: "European Union",
      topic: "custody",
      citation: "Regulation (EU) 2023/1114, Article 75",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
      coverageStatus: "missing",
      localCounselRole: "EU crypto-asset custody / CASP counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "EU CASP custody and administration policy evidence",
        "EU client crypto-asset safeguarding and access-control evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks EU MiCA custody controls covered when RWA custody template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const custodyProject: ProjectProfile = {
      ...baseProject,
      id: "project-eu-casp-custody-covered",
      jurisdictions: ["European Union"],
      assetModel: "EU tokenized private credit product with crypto-asset service provider custody",
      custodyModel: "Platform controls omnibus wallet and client crypto-asset custody administration",
      aiUsage: "Manual evidence summary only",
      evidenceItems
    };
    const audit = analyzeAuditProfile(custodyProject);
    const graph = createRegulatoryGraph(custodyProject, audit, custodyProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-casp-custody-administration")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Custody and signer control runbook"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "eu-mica-casp-custody-administration" })])
    );
  });

  it("does not match AI source controls for a manual EU and UK workflow", () => {
    const manualProject: ProjectProfile = {
      ...aiLegalWorkflowProject,
      id: "project-manual-workflow",
      entityType: "Legal operations workflow",
      aiUsage: "Manual evidence summary only",
      assetModel: "Internal matter intake and evidence review workflow",
      dataSensitivity: "Confidential matter summaries with personal identifiers excluded"
    };
    const audit = analyzeAuditProfile(manualProject);
    const graph = createRegulatoryGraph(manualProject, audit, manualProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).not.toEqual(
      expect.arrayContaining(["eu-ai-act-ai-literacy-governance", "uk-ico-ai-data-protection-governance"])
    );
  });

  it("matches Brazil virtual asset and crypto-security source controls without legal conclusions", () => {
    const brazilProject: ProjectProfile = {
      ...baseProject,
      id: "project-brazil-virtual-assets",
      jurisdictions: ["Brazil"],
      assetModel: "Tokenized private credit note with yield and public token distribution",
      userType: "Retail users and qualified investors in Brazil",
      custodyModel: "Platform controls omnibus wallet and virtual asset transfer approvals",
      dataSensitivity: "KYC metadata, sanctions screening results, and wallet transaction history",
      aiUsage: "AI drafts evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor",
      operatingStage: "Planned public launch",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(brazilProject);
    const graph = createRegulatoryGraph(brazilProject, audit, brazilProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining([
        "br-bcb-virtual-asset-service-framework",
        "br-cvm-crypto-asset-securities-guidance"
      ])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "br-bcb-virtual-asset-service-framework")).toMatchObject({
      jurisdiction: "Brazil",
      regulator: "Banco Central do Brasil",
      citation: "Law No. 14,478/2022 and Banco Central virtual asset service regulation",
      coverageStatus: "missing",
      localCounselRole: "Brazil virtual-assets / financial regulatory counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "br-cvm-crypto-asset-securities-guidance")).toMatchObject({
      jurisdiction: "Brazil",
      regulator: "Comissao de Valores Mobiliarios",
      citation: "CVM Guidance Opinion 40, 11 October 2022",
      coverageStatus: "missing",
      localCounselRole: "Brazil capital markets / crypto-asset counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Brazil virtual asset service scope and authorization intake",
        "Brazil crypto-security classification and disclosure evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches Singapore DPT customer asset safeguarding controls without legal conclusions", () => {
    const singaporeProject: ProjectProfile = {
      ...baseProject,
      id: "project-singapore-dpt-custody",
      projectName: "HarborKey DPT Custody Review",
      jurisdictions: ["Singapore"],
      assetModel: "Digital payment token service with customer asset custody and transfer approvals",
      userType: "Retail users and accredited investors in Singapore",
      custodyModel: "Platform controls omnibus wallets and safeguards customer DPT assets",
      dataSensitivity: "KYC metadata, sanctions screening status, and wallet transaction history excluded from model payloads",
      aiUsage: "AI drafts custody evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned DPT custody launch before Singapore counsel review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(singaporeProject);
    const graph = createRegulatoryGraph(singaporeProject, audit, singaporeProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["sg-mas-dpt-customer-asset-safeguards"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "sg-mas-dpt-customer-asset-safeguards")).toMatchObject({
      jurisdiction: "Singapore",
      regulator: "Monetary Authority of Singapore",
      citation: "MAS Guidelines PS-G03 on consumer protection safeguards by DPT service providers",
      sourceUrl:
        "https://www.mas.gov.sg/-/media/mas-media-library/regulation/guidelines/pso/ps-g03-guidelines-on-consumer-protection-measures-by-digital-payment-token-service-providers/ps-g03_guidelines-on-consumer-protection-safeguards-by-dpt-service-providers_vf.pdf",
      coverageStatus: "missing",
      localCounselRole: "Singapore DPT custody / payment services counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Singapore DPT customer asset segregation and safeguarding evidence",
        "Singapore DPT custody disclosure and reconciliation evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Singapore DPT safeguarding controls covered when RWA custody template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `sg-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const singaporeProject: ProjectProfile = {
      ...baseProject,
      id: "project-singapore-dpt-custody-covered",
      projectName: "HarborKey DPT Custody Review",
      jurisdictions: ["Singapore"],
      assetModel: "Digital payment token service with customer asset custody and transfer approvals",
      userType: "Retail users and accredited investors in Singapore",
      custodyModel: "Platform controls omnibus wallets and safeguards customer DPT assets",
      dataSensitivity: "KYC metadata, sanctions screening status, and wallet transaction history excluded from model payloads",
      aiUsage: "AI drafts custody evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned DPT custody launch before Singapore counsel review",
      evidenceItems
    };
    const audit = analyzeAuditProfile(singaporeProject);
    const graph = createRegulatoryGraph(singaporeProject, audit, singaporeProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "sg-mas-dpt-customer-asset-safeguards")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Custody and signer control runbook"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "sg-mas-dpt-customer-asset-safeguards" })])
    );
  });
});
