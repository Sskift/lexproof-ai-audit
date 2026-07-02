import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createEvidenceItemsFromTemplate } from "./evidenceTemplates";
import { createRegulatoryGraph } from "./regulatoryGraph";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

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

const daoGovernanceProject: ProjectProfile = {
  id: "project-dao-governance",
  projectName: "ClauseGuard DAO",
  entityType: "DAO tooling company",
  jurisdictions: ["United States", "United Kingdom"],
  assetModel: "Governance workflow with optional token-gated access",
  userType: "Protocol contributors and foundation counsel",
  custodyModel: "Non-custodial multisig review workflow",
  dataSensitivity: "Private contributor agreements and governance votes",
  aiUsage: "AI summarizes proposals, creates issue lineage, and drafts review comments",
  blockchainUse: "Hash of approved proposal versions and execution receipts",
  operatingStage: "Private beta with foundation partners",
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
    const firstP1Index = graph.evidenceGaps.findIndex((gap) => gap.priority === "P1");
    const usAssetClassificationGapIndex = graph.evidenceGaps.findIndex(
      (gap) => gap.clauseId === "us-sec-cftc-crypto-asset-interpretation"
    );

    expect(graph.evidenceGaps[0]?.priority).toBe("P0");
    expect(usAssetClassificationGapIndex).toBeGreaterThanOrEqual(0);
    if (firstP1Index !== -1) {
      expect(usAssetClassificationGapIndex).toBeLessThan(firstP1Index);
    }
    expect(graph.evidenceGaps[usAssetClassificationGapIndex]).toMatchObject({
      priority: "P0",
      jurisdiction: "United States",
      clauseId: "us-sec-cftc-crypto-asset-interpretation"
    });
    expect(graph.topActions.map((action) => action.action)).toEqual(
      expect.arrayContaining([
        "Prepare US accredited-investor verification and solicitation-controls evidence for counsel review.",
        "Prepare US crypto asset classification and offering analysis for counsel review.",
        "Prepare US Regulation D offering exemption and investor eligibility evidence for counsel review."
      ])
    );
  });

  it("matches US Regulation D accredited-investor source controls for tokenized private-credit RWA facts", () => {
    const audit = analyzeAuditProfile(baseProject);
    const graph = createRegulatoryGraph(baseProject, audit, baseProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["us-sec-reg-d-accredited-investor-verification"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-sec-reg-d-accredited-investor-verification")).toMatchObject({
      jurisdiction: "United States",
      regulator: "U.S. Securities and Exchange Commission",
      citation: "17 C.F.R. 230.501(a), 230.506(c)",
      sourceUrl: "https://www.ecfr.gov/current/title-17/chapter-II/part-230/subject-group-ECFR6e651a4c86c0174/section-230.506",
      topic: "asset-classification",
      coverageStatus: "missing",
      localCounselRole: "US private offering / securities counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "US Regulation D offering exemption and investor eligibility evidence",
        "US accredited-investor verification and solicitation-controls evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks US Regulation D source controls covered when RWA investor eligibility template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `us-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...baseProject,
      jurisdictions: ["United States"],
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-sec-reg-d-accredited-investor-verification")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Investor eligibility review"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "us-sec-reg-d-accredited-investor-verification" })])
    );
  });

  it("matches US OFAC virtual-currency sanctions controls for wallet-risk RWA facts", () => {
    const audit = analyzeAuditProfile(baseProject);
    const graph = createRegulatoryGraph(baseProject, audit, baseProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["us-ofac-virtual-currency-sanctions-compliance"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-ofac-virtual-currency-sanctions-compliance")).toMatchObject({
      jurisdiction: "United States",
      regulator: "U.S. Department of the Treasury / OFAC",
      citation: "OFAC Sanctions Compliance Guidance for the Virtual Currency Industry, October 2021",
      sourceUrl: "https://ofac.treasury.gov/media/913571/download?inline=",
      topic: "aml-cft",
      coverageStatus: "missing",
      localCounselRole: "US sanctions / virtual-currency compliance counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "US OFAC wallet sanctions screening and risk assessment evidence",
        "US OFAC blocked-property escalation and reporting evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks US OFAC sanctions controls covered when RWA wallet screening template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `us-ofac-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...baseProject,
      jurisdictions: ["United States"],
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-ofac-virtual-currency-sanctions-compliance")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Wallet sanctions screening and escalation controls"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "us-ofac-virtual-currency-sanctions-compliance" })])
    );
  });

  it("marks US crypto asset and EU MiCA issuance controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `rwa-issuance-template-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...baseProject,
      jurisdictions: ["United States", "European Union"],
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-sec-cftc-crypto-asset-interpretation")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining(["RWA disclosure assumptions memo", "Investor eligibility review"])
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-title-ii-white-paper")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining(["RWA disclosure assumptions memo", "Evidence anchor procedure"])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "us-sec-cftc-crypto-asset-interpretation" }),
        expect.objectContaining({ clauseId: "eu-mica-title-ii-white-paper" })
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
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

  it("marks Brazil VASP and crypto-security controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `br-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const brazilProject: ProjectProfile = {
      ...baseProject,
      id: "project-brazil-virtual-assets-covered",
      jurisdictions: ["Brazil"],
      assetModel: "Tokenized private credit note with yield and public token distribution",
      userType: "Retail users and qualified investors in Brazil",
      custodyModel: "Platform controls omnibus wallet and virtual asset transfer approvals",
      dataSensitivity: "KYC metadata, sanctions screening results, and wallet transaction history",
      aiUsage: "AI drafts evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor",
      operatingStage: "Planned public launch",
      evidenceItems
    };
    const audit = analyzeAuditProfile(brazilProject);
    const graph = createRegulatoryGraph(brazilProject, audit, brazilProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "br-bcb-virtual-asset-service-framework")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: [
        "Custody and signer control runbook",
        "Wallet sanctions screening and escalation controls"
      ]
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "br-cvm-crypto-asset-securities-guidance")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["RWA disclosure assumptions memo", "Investor eligibility review"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "br-bcb-virtual-asset-service-framework" }),
        expect.objectContaining({ clauseId: "br-cvm-crypto-asset-securities-guidance" })
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

  it("matches Hong Kong SFC VATP client asset custody controls without legal conclusions", () => {
    const hongKongProject: ProjectProfile = {
      ...baseProject,
      id: "project-hk-vatp-custody",
      projectName: "HarborBridge VATP Custody Review",
      jurisdictions: ["Hong Kong"],
      assetModel: "Virtual asset trading platform with token listing and retail virtual asset access",
      userType: "Hong Kong retail and professional investor client accounts",
      custodyModel: "Platform controls client virtual assets through an associated entity, omnibus wallets, cold storage, and withdrawal approvals",
      dataSensitivity: "KYC metadata, wallet transaction history, client asset reconciliation summaries, and sanctions-screening status",
      aiUsage: "AI drafts custody evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned public launch before Hong Kong counsel review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(hongKongProject);
    const graph = createRegulatoryGraph(hongKongProject, audit, hongKongProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["hk-sfc-vatp-client-asset-custody"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "hk-sfc-vatp-client-asset-custody")).toMatchObject({
      jurisdiction: "Hong Kong",
      regulator: "Securities and Futures Commission of Hong Kong",
      citation: "SFC Guidelines for Virtual Asset Trading Platform Operators, Part X",
      sourceUrl:
        "https://www.sfc.hk/-/media/EN/assets/components/codes/files-current/web/guidelines/Guidelines-for-Virtual-Asset-Trading-Platform-Operators/Guidelines-for-Virtual-Asset-Trading-Platform-Operators.pdf",
      coverageStatus: "missing",
      localCounselRole: "Hong Kong virtual asset trading platform counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Hong Kong VATP client asset custody and associated-entity evidence",
        "Hong Kong VATP wallet control, reconciliation, and compensation evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Hong Kong")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "Hong Kong virtual asset trading platform counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Hong Kong SFC VATP custody controls covered when RWA custody template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `hk-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const hongKongProject: ProjectProfile = {
      ...baseProject,
      id: "project-hk-vatp-custody-covered",
      projectName: "HarborBridge VATP Custody Review",
      jurisdictions: ["Hong Kong"],
      assetModel: "Virtual asset trading platform with token listing and retail virtual asset access",
      userType: "Hong Kong retail and professional investor client accounts",
      custodyModel: "Platform controls client virtual assets through an associated entity, omnibus wallets, cold storage, and withdrawal approvals",
      dataSensitivity: "KYC metadata, wallet transaction history, client asset reconciliation summaries, and sanctions-screening status",
      aiUsage: "AI drafts custody evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned public launch before Hong Kong counsel review",
      evidenceItems
    };
    const audit = analyzeAuditProfile(hongKongProject);
    const graph = createRegulatoryGraph(hongKongProject, audit, hongKongProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "hk-sfc-vatp-client-asset-custody")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Custody and signer control runbook"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "hk-sfc-vatp-client-asset-custody" })])
    );
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

  it("matches US advertising disclosure controls for cross-border marketing claims without legal conclusions", () => {
    const marketingProject: ProjectProfile = {
      ...baseProject,
      id: "project-cross-border-marketing-us",
      projectName: "SignalBridge Marketing Review",
      jurisdictions: ["United States", "United Kingdom", "United Arab Emirates"],
      assetModel: "Virtual asset public education and product-positioning campaign with paid creator endorsements and no token sale",
      userType: "US retail audience segments, community followers, and exchange listing reviewers",
      custodyModel: "No custody; campaign team cannot approve wallet transfers or hold client virtual assets",
      dataSensitivity: "Audience-segment summaries and approval metadata only; raw onboarding files excluded from demo evidence",
      aiUsage: "AI drafts promotion-risk summaries for human review and local counsel routing",
      blockchainUse: "Simulated hash receipt for approved campaign archive metadata",
      operatingStage: "Planned public marketing campaign with influencer endorsements before US, UK, and UAE counsel review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(marketingProject);
    const graph = createRegulatoryGraph(marketingProject, audit, marketingProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining([
        "us-ftc-endorsement-advertising-guides",
        "uk-fca-crypto-financial-promotions",
        "uae-vara-va-regulations-activity-scope",
        "uae-vara-marketing-regulations-2024"
      ])
    );
    expect(graph.matchedClauses.map((clause) => clause.clauseId)).not.toEqual(
      expect.arrayContaining(["us-sec-reg-d-accredited-investor-verification"])
    );
    expect(graph.matchedClauses.map((clause) => clause.clauseId)).not.toEqual(
      expect.arrayContaining(["us-ofac-virtual-currency-sanctions-compliance"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-ftc-endorsement-advertising-guides")).toMatchObject({
      jurisdiction: "United States",
      regulator: "Federal Trade Commission",
      citation: "16 C.F.R. Part 255",
      sourceUrl: "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255",
      coverageStatus: "missing",
      localCounselRole: "US advertising / consumer protection counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uae-vara-marketing-regulations-2024")).toMatchObject({
      jurisdiction: "United Arab Emirates",
      regulator: "Dubai Virtual Assets Regulatory Authority",
      citation: "VARA Regulations on the Marketing of Virtual Assets and Related Activities 2024",
      sourceUrl: "https://rulebooks.vara.ae/rulebook/marketing-regulations-0",
      coverageStatus: "missing",
      localCounselRole: "UAE virtual-asset marketing counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "US advertising claims substantiation and disclosure evidence",
        "US endorsement and material-connection disclosure evidence",
        "UAE VARA marketing approval and risk-warning evidence",
        "UAE VARA KOL, incentive, and marketing recordkeeping evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks UAE VARA marketing controls covered when approval and recordkeeping evidence is verified", () => {
    const evidenceItems: EvidenceItem[] = [
      {
        id: "uae-marketing-approval-record",
        label: "UAE VARA marketing approval and risk-warning archive",
        kind: "Archive",
        content:
          "Verified: VARA approval route, VASP approval, clear marketing label, risk warning, no guaranteed return claim, and UAE audience restrictions.",
        source: "regulatory control: control-uae-vara-marketing-regulations-2024",
        status: "verified" as const,
        owner: "Counsel"
      },
      {
        id: "uae-kol-incentive-recordkeeping",
        label: "UAE KOL incentive disclosure and 8-year recordkeeping log",
        kind: "Log",
        content:
          "Verified: KOL remuneration disclosure, incentive compliance confirmation, campaign distribution details, and eight year marketing recordkeeping owner.",
        source: "regulatory control: control-uae-vara-marketing-regulations-2024",
        status: "verified" as const,
        owner: "Compliance"
      }
    ];
    const marketingProject: ProjectProfile = {
      ...baseProject,
      id: "project-cross-border-marketing-uae-covered",
      projectName: "SignalBridge Marketing Review",
      jurisdictions: ["United Arab Emirates"],
      assetModel: "Virtual asset public education and product-positioning campaign with paid KOL endorsements and no token sale",
      userType: "UAE retail audience segments, community followers, and exchange listing reviewers",
      custodyModel: "No custody; campaign team cannot approve wallet transfers or hold client virtual assets",
      dataSensitivity: "Audience-segment summaries and approval metadata only; raw onboarding files excluded from demo evidence",
      aiUsage: "AI drafts promotion-risk summaries for human review and UAE counsel routing",
      blockchainUse: "Simulated hash receipt for approved campaign archive metadata",
      operatingStage: "Planned public marketing campaign with influencer incentives before UAE counsel review",
      evidenceItems
    };
    const audit = analyzeAuditProfile(marketingProject);
    const graph = createRegulatoryGraph(marketingProject, audit, marketingProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uae-vara-marketing-regulations-2024")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: [
        "UAE VARA marketing approval and risk-warning archive",
        "UAE KOL incentive disclosure and 8-year recordkeeping log"
      ]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "uae-vara-marketing-regulations-2024" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks cross-border marketing source controls covered when marketing template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("marketing-claims-review").map((item, index) => ({
      ...item,
      id: `marketing-template-${index + 1}`,
      status: "verified" as const
    }));
    const marketingProject: ProjectProfile = {
      ...baseProject,
      id: "project-cross-border-marketing-template-covered",
      projectName: "SignalBridge Marketing Review",
      jurisdictions: ["United States", "United Kingdom", "United Arab Emirates"],
      assetModel: "Virtual asset public education and product-positioning campaign with paid creator endorsements and no token sale",
      userType: "US, UK, and UAE retail audience segments, community followers, and exchange listing reviewers",
      custodyModel: "No custody; campaign team cannot approve wallet transfers or hold client virtual assets",
      dataSensitivity: "Audience-segment summaries and approval metadata only; raw onboarding files excluded from demo evidence",
      aiUsage: "AI drafts promotion-risk summaries for human review and local counsel routing",
      blockchainUse: "Simulated hash receipt for approved campaign archive metadata",
      operatingStage: "Planned public marketing campaign with influencer endorsements before US, UK, and UAE counsel review",
      evidenceItems
    };
    const audit = analyzeAuditProfile(marketingProject);
    const graph = createRegulatoryGraph(marketingProject, audit, marketingProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-ftc-endorsement-advertising-guides")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: [
        "Claims substantiation and risk disclosure register",
        "Creator endorsement and material connection log"
      ]
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-fca-crypto-financial-promotions")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["UK financial promotion approval pack"]
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uae-vara-va-regulations-activity-scope")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uae-vara-marketing-regulations-2024")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["UAE VARA approval and risk-warning archive", "UAE KOL incentive and recordkeeping log"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "us-ftc-endorsement-advertising-guides" }),
        expect.objectContaining({ clauseId: "uk-fca-crypto-financial-promotions" }),
        expect.objectContaining({ clauseId: "uae-vara-va-regulations-activity-scope" }),
        expect.objectContaining({ clauseId: "uae-vara-marketing-regulations-2024" })
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Swiss FINMA token classification controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `swiss-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const swissProject: ProjectProfile = {
      ...baseProject,
      id: "project-swiss-rwa-covered",
      jurisdictions: ["Switzerland"],
      assetModel: "Swiss tokenized private credit note with yield, asset-token economics, and fundraising assumptions",
      userType: "Swiss qualified investors and investor communications reviewers",
      custodyModel: "Foundation-governed wallet custody with signer approval evidence",
      dataSensitivity: "KYC metadata and wallet transaction history excluded from default exports",
      aiUsage: "AI drafts Swiss token classification evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor for Swiss counsel packet",
      operatingStage: "Planned Swiss offering review before local counsel reliance",
      evidenceItems
    };
    const audit = analyzeAuditProfile(swissProject);
    const graph = createRegulatoryGraph(swissProject, audit, swissProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ch-finma-ico-token-classification")).toMatchObject({
      jurisdiction: "Switzerland",
      regulator: "FINMA",
      citation: "FINMA ICO Guidelines, 16 February 2018",
      sourceUrl: "https://www.finma.ch/en/news/2018/02/20180216-mm-ico-wegleitung/",
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      localCounselRole: "Swiss DLT / financial services counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ch-finma-ico-token-classification")?.matchedEvidenceLabels).toEqual(
      expect.arrayContaining([
        "Swiss token classification memo",
        "Swiss offering, prospectus, and governance evidence"
      ])
    );
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "ch-finma-ico-token-classification" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches US and UK DAO governance source controls without legal conclusions", () => {
    const audit = analyzeAuditProfile(daoGovernanceProject);
    const graph = createRegulatoryGraph(daoGovernanceProject, audit, daoGovernanceProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining([
        "us-sec-dao-report-governance-token-review",
        "uk-law-commission-dao-scoping-paper"
      ])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-sec-dao-report-governance-token-review")).toMatchObject({
      jurisdiction: "United States",
      regulator: "U.S. Securities and Exchange Commission",
      citation: "SEC Release No. 81207, The DAO Report, July 25, 2017",
      sourceUrl: "https://www.sec.gov/files/litigation/investreport/34-81207.pdf",
      topic: "governance",
      coverageStatus: "missing",
      localCounselRole: "US DAO / digital asset securities counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-law-commission-dao-scoping-paper")).toMatchObject({
      jurisdiction: "United Kingdom",
      regulator: "Law Commission of England and Wales",
      citation: "Law Commission DAO scoping paper, 11 July 2024",
      sourceUrl: "https://lawcom.gov.uk/project/decentralised-autonomous-organisations-daos/",
      topic: "governance",
      coverageStatus: "missing",
      localCounselRole: "UK DAO / commercial law counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "US DAO token rights and participant-role evidence",
        "US DAO voting and execution-control evidence",
        "UK DAO structure and participant-liability evidence",
        "UK DAO governance rules and asset-control evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks DAO governance source controls covered when DAO template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("dao-governance-multisig").map((item, index) => ({
      ...item,
      id: `dao-template-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...daoGovernanceProject,
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-sec-dao-report-governance-token-review")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-law-commission-dao-scoping-paper")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "us-sec-dao-report-governance-token-review" }),
        expect.objectContaining({ clauseId: "uk-law-commission-dao-scoping-paper" })
      ])
    );
  });
});
