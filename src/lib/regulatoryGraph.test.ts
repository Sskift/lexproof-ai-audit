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
  jurisdictions: ["United States", "European Union", "United Kingdom"],
  assetModel: "No token sale; AI-assisted matter intake, evidence review, and Colorado consequential-decision scoping workflow",
  userType: "In-house counsel, compliance reviewers, and outside counsel",
  custodyModel: "No custody; workspace stores metadata-only evidence records",
  dataSensitivity: "Confidential matter summaries, privileged-review notes, and client identifiers excluded from demo evidence",
  aiUsage:
    "AI drafts issue-spotting notes, evidence requests, Colorado ADMT consequential-decision scoping questions, and source-linked counsel questions for human review",
  blockchainUse: "Simulated manifest anchor for exported audit-prep packets",
  operatingStage: "Internal pilot before counsel-supervised rollout",
  evidenceItems: []
};

const daoGovernanceProject: ProjectProfile = {
  id: "project-dao-governance",
  projectName: "ClauseGuard DAO",
  entityType: "DAO tooling company",
  jurisdictions: ["United States", "European Union", "United Kingdom"],
  assetModel:
    "Governance workflow with optional token-gated access, EU user-access assumptions, decentralisation claims, and a proposed DeFi trading module with leveraged or margined access assumptions held for counsel review",
  userType: "Protocol contributors, EU token holders, and foundation counsel",
  custodyModel: "Non-custodial multisig review workflow with front-end operator and admin-key assumptions documented for review",
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
        "eu-dora-ict-operational-resilience",
        "eu-tfr-crypto-asset-transfer-information",
        "eu-dlt-pilot-regime-market-infrastructure",
        "uk-fca-crypto-financial-promotions",
        "uk-fca-cryptoasset-aml-registration-travel-rule",
        "sg-mas-psn02-dpt-aml-cft",
        "ch-finma-ico-token-classification",
        "uae-vara-va-regulations-activity-scope",
        "us-sec-cftc-crypto-asset-interpretation",
        "us-fincen-cvc-msb-bsa-travel-rule"
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
      matchedClauseCount: 6,
      missingEvidenceCount: 12,
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

  it("matches UK FCA cryptoasset AML registration and Travel Rule source controls without legal conclusions", () => {
    const ukProject: ProjectProfile = {
      ...baseProject,
      id: "project-uk-cryptoasset-aml",
      projectName: "Thames Cryptoasset AML Review",
      jurisdictions: ["United Kingdom"],
      entityType: "Cryptoasset exchange and custody operations team",
      assetModel: "Cryptoasset exchange, transfer, and hosted custody service with UK retail access assumptions",
      userType: "UK retail users, compliance reviewers, and local counsel",
      custodyModel:
        "Platform safeguards customer cryptoassets through hosted wallet controls, transfer approvals, custody boundary, and incident escalation placeholders",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and transaction-monitoring summaries",
      aiUsage: "AI drafts UK cryptoasset AML evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned UK cryptoasset AML and Travel Rule review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(ukProject);
    const graph = createRegulatoryGraph(ukProject, audit, ukProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["uk-fca-cryptoasset-aml-registration-travel-rule"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-fca-cryptoasset-aml-registration-travel-rule")).toMatchObject({
      jurisdiction: "United Kingdom",
      regulator: "Financial Conduct Authority",
      sourceUrl: "https://www.fca.org.uk/firms/financial-crime/money-laundering-terrorist-financing/cryptoassets-aml-ctf-regime",
      citation:
        "FCA Cryptoassets: AML/CTF regime; Cryptoassets: What we expect to see in your application for registration; FCA Travel Rule expectations, 17 August 2023",
      topic: "aml-cft",
      coverageStatus: "missing",
      localCounselRole: "UK cryptoasset AML / financial crime counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "UK FCA cryptoasset MLR registration and activity-scope evidence",
        "UK cryptoasset AML controls, SAR, sanctions, and Travel Rule evidence"
      ])
    );
    const ukSummary = graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "United Kingdom");
    expect(ukSummary).toMatchObject({
      readiness: "evidence-gaps"
    });
    expect(ukSummary?.matchedClauseCount).toBeGreaterThanOrEqual(1);
    expect(ukSummary?.missingEvidenceCount).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks UK FCA cryptoasset AML and Travel Rule controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `uk-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const ukProject: ProjectProfile = {
      ...baseProject,
      id: "project-uk-cryptoasset-aml-covered",
      jurisdictions: ["UK"],
      assetModel: "Cryptoasset exchange, transfer, and hosted custody service with UK retail access assumptions",
      userType: "UK retail users, compliance reviewers, and local counsel",
      custodyModel: "Platform safeguards customer cryptoassets through hosted wallet controls and transfer approvals",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and transaction-monitoring summaries",
      aiUsage: "AI drafts UK cryptoasset AML evidence summaries for human review",
      operatingStage: "Planned UK cryptoasset AML and Travel Rule review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(ukProject);
    const graph = createRegulatoryGraph(ukProject, audit, ukProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-fca-cryptoasset-aml-registration-travel-rule")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["UK FCA cryptoasset AML registration and Travel Rule register"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "uk-fca-cryptoasset-aml-registration-travel-rule" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches New York NYDFS BitLicense and custody customer-protection source controls without legal conclusions", () => {
    const nyProject: ProjectProfile = {
      ...baseProject,
      id: "project-new-york-vc-custody",
      projectName: "Hudson RWA Custody Review",
      jurisdictions: ["United States"],
      entityType: "Virtual currency custody and tokenized private-credit operations team",
      assetModel:
        "Tokenized private credit note with New York resident access, BitLicense planning, stablecoin rails, and virtual currency business activity assumptions",
      userType: "New York residents, accredited investors, compliance reviewers, and local counsel",
      custodyModel:
        "Platform maintains custody or control of customer virtual currency through omnibus wallet accounting, internal ledger reconciliation, sub-custody planning, and no proprietary use controls",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, customer records excluded, and wallet secrets excluded",
      aiUsage: "AI drafts NYDFS custody evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-application NYDFS BitLicense and custody customer-protection review before New York counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(nyProject);
    const graph = createRegulatoryGraph(nyProject, audit, nyProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["us-nydfs-bitlicense-custody-customer-protection"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-nydfs-bitlicense-custody-customer-protection")).toMatchObject({
      jurisdiction: "United States",
      regulator: "New York Department of Financial Services",
      sourceUrl: "https://www.dfs.ny.gov/virtual_currency_businesses",
      citation: "23 NYCRR Part 200; NYDFS Updated Guidance on Custodial Structures, September 30, 2025",
      topic: "custody",
      coverageStatus: "missing",
      localCounselRole: "New York virtual-currency / NYDFS counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "New York NYDFS virtual-currency business activity and license-route evidence",
        "New York NYDFS custody segregation, beneficial-interest, and disclosure evidence"
      ])
    );
    expect(JSON.stringify(graph)).toContain("Not legal advice");
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks New York NYDFS BitLicense and custody controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `nydfs-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const nyProject: ProjectProfile = {
      ...baseProject,
      id: "project-new-york-vc-custody-covered",
      jurisdictions: ["United States"],
      assetModel:
        "Tokenized private credit note with New York resident access, BitLicense planning, and virtual currency business activity assumptions",
      userType: "New York residents, accredited investors, compliance reviewers, and local counsel",
      custodyModel:
        "Platform maintains custody or control of customer virtual currency through omnibus wallet accounting, internal ledger reconciliation, sub-custody planning, and no proprietary use controls",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, customer records excluded, and wallet secrets excluded",
      aiUsage: "AI drafts NYDFS custody evidence summaries for human review",
      operatingStage: "Pre-application NYDFS BitLicense and custody customer-protection review before New York counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(nyProject);
    const graph = createRegulatoryGraph(nyProject, audit, nyProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-nydfs-bitlicense-custody-customer-protection")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["New York NYDFS BitLicense and custody customer-protection register"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "us-nydfs-bitlicense-custody-customer-protection" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches US GENIUS Act payment stablecoin issuer controls without legal conclusions", () => {
    const stablecoinProject: ProjectProfile = {
      ...baseProject,
      id: "project-us-genius-stablecoin",
      projectName: "LibertyDollar Stablecoin Review",
      jurisdictions: ["United States"],
      entityType: "Payment stablecoin issuer",
      assetModel:
        "US payment stablecoin issuer pilot with GENIUS Act permitted payment stablecoin issuer route, reserve assets, redemption, and monthly disclosure assumptions",
      userType: "US retail users, treasury partners, compliance reviewers, and US stablecoin counsel",
      custodyModel:
        "Issuer coordinates mint, burn, wallet operations, reserve safekeeping, custody handoff, redemption workflow, and sanctions escalation through metadata-only controls",
      dataSensitivity: "Customer-risk metadata, AML alert summaries, sanctions-screening status, and customer records excluded",
      aiUsage: "AI drafts GENIUS Act stablecoin evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-application US payment stablecoin issuer review before counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(stablecoinProject);
    const graph = createRegulatoryGraph(stablecoinProject, audit, stablecoinProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["us-genius-payment-stablecoin-issuer-regime"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-genius-payment-stablecoin-issuer-regime")).toMatchObject({
      jurisdiction: "United States",
      regulator: "U.S. Department of the Treasury / OCC / primary Federal payment stablecoin regulators",
      sourceUrl: "https://home.treasury.gov/news/press-releases/sb0435",
      citation:
        "GENIUS Act, Pub. L. 119-27, 12 U.S.C. 5901 et seq.; Treasury GENIUS Act implementation NPRMs, 2026; OCC Bulletin 2026-3",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "US payment stablecoin / GENIUS Act counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "US GENIUS Act permitted-issuer, reserve, and redemption evidence",
        "US GENIUS Act BSA/AML and sanctions program evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "United States")).toMatchObject({
      readiness: "evidence-gaps",
      localCounselRole: "US securities / fintech counsel"
    });
    expect(JSON.stringify(graph)).toContain("Not legal advice");
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks US GENIUS Act stablecoin controls covered when RWA stablecoin template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `us-genius-stablecoin-template-${index + 1}`,
      status: "verified" as const
    }));
    const stablecoinProject: ProjectProfile = {
      ...baseProject,
      id: "project-us-genius-stablecoin-covered",
      projectName: "LibertyDollar Stablecoin Review",
      jurisdictions: ["United States"],
      entityType: "Payment stablecoin issuer",
      assetModel:
        "US payment stablecoin issuer with GENIUS Act permitted issuer route, reserve assets, redemption, and monthly disclosure review",
      userType: "US retail users, treasury partners, compliance reviewers, and local counsel",
      custodyModel: "Issuer coordinates stablecoin mint, burn, reserve safekeeping, custody, redemption, and sanctions review",
      dataSensitivity: "Customer-risk metadata and AML alert summaries excluded from exported demo evidence",
      aiUsage: "AI drafts GENIUS Act stablecoin evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-application US payment stablecoin issuer review before counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(stablecoinProject);
    const graph = createRegulatoryGraph(stablecoinProject, audit, stablecoinProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-genius-payment-stablecoin-issuer-regime")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "US GENIUS Act permitted issuer and reserve register",
        "US GENIUS Act BSA AML and sanctions program register"
      ])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "us-genius-payment-stablecoin-issuer-regime" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches EU MiCA ART/EMT stablecoin issuer controls without legal conclusions", () => {
    const euStablecoinProject: ProjectProfile = {
      ...baseProject,
      id: "project-eu-mica-stablecoin",
      projectName: "EuroMint MiCA Stablecoin Review",
      jurisdictions: ["European Union"],
      entityType: "ART / EMT stablecoin issuer",
      assetModel:
        "EU MiCA stablecoin issuer pilot assessing asset-referenced token and e-money token classification, white paper, reserve assets, redemption, and recovery-plan assumptions",
      userType: "EU retail users, treasury partners, compliance reviewers, and EU MiCA stablecoin counsel",
      custodyModel:
        "Issuer coordinates mint, burn, reserve custody, reserve segregation, liquidity management, redemption workflow, and holder communications through metadata-only controls",
      dataSensitivity: "Holder-risk metadata, reserve attestations, redemption summaries, and customer records excluded",
      aiUsage: "AI drafts MiCA ART EMT issuer evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-notification EU MiCA ART EMT stablecoin issuer review before counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(euStablecoinProject);
    const graph = createRegulatoryGraph(euStablecoinProject, audit, euStablecoinProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["eu-mica-art-emt-stablecoin-issuer-regime"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-art-emt-stablecoin-issuer-regime")).toMatchObject({
      jurisdiction: "European Union",
      regulator: "European Union / EBA / ESMA",
      sourceUrl: "https://www.eba.europa.eu/regulation-and-policy/asset-referenced-and-e-money-tokens-mica",
      citation: "Regulation (EU) 2023/1114, Titles III-IV, Articles 16, 36, 39, 48, 49, 51, and 55",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "EU MiCA stablecoin issuer counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "EU MiCA ART/EMT issuer authorisation and white-paper evidence",
        "EU MiCA ART/EMT reserve, redemption, and recovery evidence"
      ])
    );
    expect(JSON.stringify(graph)).toContain("Not legal advice");
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks EU MiCA ART/EMT stablecoin controls covered when RWA stablecoin template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `eu-mica-stablecoin-template-${index + 1}`,
      status: "verified" as const
    }));
    const euStablecoinProject: ProjectProfile = {
      ...baseProject,
      id: "project-eu-mica-stablecoin-covered",
      projectName: "EuroMint MiCA Stablecoin Review",
      jurisdictions: ["European Union"],
      entityType: "ART / EMT stablecoin issuer",
      assetModel:
        "EU MiCA stablecoin issuer with asset-referenced token, e-money token, white paper, reserve assets, redemption, and recovery-plan review",
      userType: "EU retail users, treasury partners, compliance reviewers, and EU local counsel",
      custodyModel: "Issuer coordinates reserve custody, reserve segregation, redemption workflow, and holder communications",
      dataSensitivity: "Holder-risk metadata and redemption summaries excluded from exported demo evidence",
      aiUsage: "AI drafts MiCA ART EMT stablecoin evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-notification EU MiCA ART EMT stablecoin issuer review before counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(euStablecoinProject);
    const graph = createRegulatoryGraph(euStablecoinProject, audit, euStablecoinProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-art-emt-stablecoin-issuer-regime")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "EU MiCA ART EMT issuer authorisation and white paper register",
        "EU MiCA stablecoin reserve redemption and recovery register"
      ])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "eu-mica-art-emt-stablecoin-issuer-regime" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches UK qualifying stablecoin issuer controls without legal conclusions", () => {
    const ukStablecoinProject: ProjectProfile = {
      ...baseProject,
      id: "project-uk-stablecoin-issuer",
      projectName: "SterlingMint Stablecoin Review",
      jurisdictions: ["United Kingdom"],
      entityType: "UK qualifying stablecoin issuer",
      assetModel:
        "UK-issued qualifying stablecoin pilot assessing sterling stablecoin issuance, UKQS issuer route, admission scope, backing assets, safeguarding, redemption, disclosure, and systemic-transition assumptions",
      userType: "UK retail users, treasury partners, compliance reviewers, and UK stablecoin counsel",
      custodyModel:
        "Issuer coordinates mint, burn, backing-asset safeguarding, reconciliation, liquidity, redemption workflow, and holder communications through metadata-only controls",
      dataSensitivity: "Holder-risk metadata, backing-asset attestations, redemption summaries, and customer records excluded",
      aiUsage: "AI drafts UK qualifying stablecoin evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-application UK qualifying stablecoin issuer review before counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(ukStablecoinProject);
    const graph = createRegulatoryGraph(ukStablecoinProject, audit, ukStablecoinProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["uk-fca-qualifying-stablecoin-issuer-regime"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-fca-qualifying-stablecoin-issuer-regime")).toMatchObject({
      jurisdiction: "United Kingdom",
      regulator: "Financial Conduct Authority / Bank of England",
      sourceUrl: "https://www.fca.org.uk/publication/policy/ps26-10.pdf",
      citation: "FCA PS26/10 Stablecoin issuance, 30 June 2026; BoE/FCA joint approach to systemic stablecoin issuers, June 2026",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "UK qualifying stablecoin / FCA-BoE counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "UK qualifying stablecoin issuer permission, admission, and disclosure evidence",
        "UK qualifying stablecoin backing, safeguarding, and redemption evidence"
      ])
    );
    expect(JSON.stringify(graph)).toContain("Not legal advice");
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks UK qualifying stablecoin controls covered when RWA stablecoin template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `uk-stablecoin-template-${index + 1}`,
      status: "verified" as const
    }));
    const ukStablecoinProject: ProjectProfile = {
      ...baseProject,
      id: "project-uk-stablecoin-issuer-covered",
      projectName: "SterlingMint Stablecoin Review",
      jurisdictions: ["United Kingdom"],
      entityType: "UK qualifying stablecoin issuer",
      assetModel:
        "UK qualifying stablecoin issuer with UKQS issuer route, admission scope, backing assets, safeguarding, redemption, disclosure, and systemic-transition review",
      userType: "UK retail users, treasury partners, compliance reviewers, and UK stablecoin counsel",
      custodyModel: "Issuer coordinates backing-asset safeguarding, reconciliation, liquidity, redemption, and holder communications",
      dataSensitivity: "Holder-risk metadata and redemption summaries excluded from exported demo evidence",
      aiUsage: "AI drafts UK qualifying stablecoin evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-application UK qualifying stablecoin issuer review before counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(ukStablecoinProject);
    const graph = createRegulatoryGraph(ukStablecoinProject, audit, ukStablecoinProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-fca-qualifying-stablecoin-issuer-regime")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "UK qualifying stablecoin issuer permission and disclosure register",
        "UK qualifying stablecoin backing safeguarding and redemption register"
      ])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "uk-fca-qualifying-stablecoin-issuer-regime" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches Germany BaFin MiCAR CASP custody source controls without legal conclusions", () => {
    const deProject: ProjectProfile = {
      ...baseProject,
      id: "project-germany-micar-custody",
      projectName: "RhineVault MiCAR Custody Review",
      jurisdictions: ["Germany"],
      entityType: "Crypto-asset service provider custody operations team",
      assetModel: "Crypto-asset custody and transfer service with German client access and MiCAR CASP authorisation assumptions",
      userType: "German retail users, institutional treasury users, compliance reviewers, and local counsel",
      custodyModel:
        "Platform safeguards client crypto assets through hosted wallets, client-position records, segregation controls, withdrawal approvals, return-process placeholders, and means-of-access controls",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, client-position summaries, and customer records excluded",
      aiUsage: "AI drafts Germany MiCAR custody evidence summaries for human review and BaFin counsel routing",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Germany MiCAR CASP custody and Article 75 review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(deProject);
    const graph = createRegulatoryGraph(deProject, audit, deProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["de-bafin-micar-casp-custody-authorisation"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "de-bafin-micar-casp-custody-authorisation")).toMatchObject({
      jurisdiction: "Germany",
      regulator: "BaFin / Deutsche Bundesbank",
      citation: "Regulation (EU) 2023/1114 Articles 60, 62, and 75; BaFin/Bundesbank MiCAR supervisory information",
      topic: "custody",
      coverageStatus: "missing",
      localCounselRole: "Germany BaFin / MiCAR crypto custody counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Germany MiCAR CASP authorisation and Article 60 notification evidence",
        "Germany MiCAR custody safeguarding and client-position evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Germany")).toMatchObject({
      readiness: "evidence-gaps",
      localCounselRole: "Germany BaFin / MiCAR crypto custody counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Germany BaFin MiCAR CASP custody controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `de-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const deProject: ProjectProfile = {
      ...baseProject,
      id: "project-germany-micar-covered",
      jurisdictions: ["DE"],
      assetModel: "Crypto-asset custody and transfer service with Germany MiCAR CASP authorisation assumptions",
      userType: "German retail users, compliance reviewers, and local counsel",
      custodyModel: "Platform safeguards client crypto assets through hosted wallets, client-position records, and segregation controls",
      dataSensitivity: "CDD status summaries and wallet-risk metadata",
      aiUsage: "AI drafts Germany MiCAR custody evidence summaries for human review",
      operatingStage: "Planned Germany MiCAR CASP custody review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(deProject);
    const graph = createRegulatoryGraph(deProject, audit, deProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "de-bafin-micar-casp-custody-authorisation")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Germany BaFin MiCAR CASP custody and Article 60/62 register"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "de-bafin-micar-casp-custody-authorisation" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("does not let evidence linked to another regulatory control cover Germany MiCAR custody requests", () => {
    const crossLinkedEvidence: EvidenceItem = {
      id: "hkma-stablecoin-note-with-germany-keywords",
      label: "HKMA stablecoin reserve note with imported custody keywords",
      kind: "Register",
      source: "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-hk-hkma-stablecoin-issuer-regime",
      content:
        "Germany MiCAR, BaFin, CASP authorisation, Article 60 notification, home Member State, German client access, Article 75 custody policy, client register, position statement, segregation, return crypto assets, means of access, private cryptographic keys, and client crypto assets.",
      status: "verified",
      owner: "Compliance"
    };
    const deProject: ProjectProfile = {
      ...baseProject,
      id: "project-germany-micar-control-scoped",
      jurisdictions: ["Germany"],
      assetModel: "Crypto-asset custody and transfer service with Germany MiCAR CASP authorisation assumptions",
      userType: "German retail users, compliance reviewers, and local counsel",
      custodyModel: "Platform safeguards client crypto assets through hosted wallets, client-position records, and segregation controls",
      dataSensitivity: "CDD status summaries and wallet-risk metadata",
      aiUsage: "AI drafts Germany MiCAR custody evidence summaries for human review",
      operatingStage: "Planned Germany MiCAR CASP custody review before local counsel signoff",
      evidenceItems: [crossLinkedEvidence]
    };
    const audit = analyzeAuditProfile(deProject);
    const graph = createRegulatoryGraph(deProject, audit, deProject.evidenceItems);
    const germanyClause = graph.matchedClauses.find((clause) => clause.clauseId === "de-bafin-micar-casp-custody-authorisation");

    expect(germanyClause).toMatchObject({
      coverageStatus: "missing",
      coveredEvidenceCount: 0,
      matchedEvidenceLabels: []
    });
    expect(graph.evidenceGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clauseId: "de-bafin-micar-casp-custody-authorisation",
          title: "Germany MiCAR CASP authorisation and Article 60 notification evidence"
        }),
        expect.objectContaining({
          clauseId: "de-bafin-micar-casp-custody-authorisation",
          title: "Germany MiCAR custody safeguarding and client-position evidence"
        })
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
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
        "Prepare US FinCEN CVC MSB activity-scope and AML program evidence for counsel review.",
        "Prepare US FinCEN BSA transfer recordkeeping and Travel Rule handoff evidence for counsel review."
      ])
    );
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining(["US Regulation D offering exemption and investor eligibility evidence"])
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
      matchedEvidenceLabels: expect.arrayContaining(["Wallet sanctions screening and escalation controls"])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "us-ofac-virtual-currency-sanctions-compliance" })])
    );
  });

  it("matches US FinCEN CVC MSB and BSA transfer controls for custody and wallet-transfer facts", () => {
    const audit = analyzeAuditProfile(baseProject);
    const graph = createRegulatoryGraph(baseProject, audit, baseProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["us-fincen-cvc-msb-bsa-travel-rule"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-fincen-cvc-msb-bsa-travel-rule")).toMatchObject({
      jurisdiction: "United States",
      regulator: "Financial Crimes Enforcement Network (FinCEN)",
      citation: "FinCEN FIN-2019-G001; 31 C.F.R. 1022.210; 31 C.F.R. 1010.410(e)-(f)",
      sourceUrl:
        "https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-certain-business-models",
      topic: "aml-cft",
      coverageStatus: "missing",
      localCounselRole: "US FinCEN / BSA virtual-currency counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "US FinCEN CVC MSB activity-scope and AML program evidence",
        "US FinCEN BSA transfer recordkeeping and Travel Rule handoff evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks US FinCEN controls covered when RWA BSA transfer evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `us-fincen-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...baseProject,
      jurisdictions: ["United States"],
      custodyModel: "Platform hosted wallet controls omnibus CVC wallets and virtual asset transfer approvals",
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-fincen-cvc-msb-bsa-travel-rule")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining(["US FinCEN CVC MSB and BSA transfer control register"])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "us-fincen-cvc-msb-bsa-travel-rule" })])
    );
  });

  it("marks US crypto asset, EU MiCA issuance, and EU DLT Pilot controls covered when RWA template evidence is verified", () => {
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
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-dlt-pilot-regime-market-infrastructure")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["EU DLT Pilot Regime market infrastructure perimeter register"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "us-sec-cftc-crypto-asset-interpretation" }),
        expect.objectContaining({ clauseId: "eu-mica-title-ii-white-paper" }),
        expect.objectContaining({ clauseId: "eu-dlt-pilot-regime-market-infrastructure" })
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches EU DLT Pilot Regime market-infrastructure review for tokenized financial-instrument facts", () => {
    const dltProject: ProjectProfile = {
      ...baseProject,
      id: "project-eu-dlt-pilot",
      projectName: "EuroPilot DLT Market Review",
      jurisdictions: ["European Union"],
      entityType: "DLT market infrastructure pilot operator",
      assetModel:
        "Tokenized financial instrument and DLT market infrastructure pilot for private credit note settlement review",
      userType: "EU professional participants and counsel reviewers",
      custodyModel: "DLT TSS settlement workflow with safekeeping controls and admitted instrument perimeter review",
      dataSensitivity: "Metadata-only participant summaries with raw investor records excluded",
      aiUsage: "AI drafts DLT Pilot evidence requests for human review",
      blockchainUse: "Simulated DLT settlement receipt and manifest anchor",
      operatingStage: "Pilot before competent authority and ESMA handoff review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(dltProject);
    const graph = createRegulatoryGraph(dltProject, audit, dltProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-dlt-pilot-regime-market-infrastructure")).toMatchObject({
      jurisdiction: "European Union",
      regulator: "European Union / ESMA",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2022/858/oj/eng",
      citation: "Regulation (EU) 2022/858, Articles 2, 4, 5, 6, 7, 8, and 9",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "EU DLT market infrastructure / financial instruments counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "EU DLT financial-instrument and market-infrastructure perimeter evidence",
        "EU DLT settlement, safekeeping, and liability safeguard evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches ABA, US NIST, Colorado ADMT, EU, and UK AI legal workflow source controls without legal conclusions", () => {
    const audit = analyzeAuditProfile(aiLegalWorkflowProject);
    const graph = createRegulatoryGraph(aiLegalWorkflowProject, audit, aiLegalWorkflowProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining([
        "us-aba-formal-opinion-512-generative-ai-law-practice",
        "us-nist-ai-rmf-governance",
        "us-colorado-admt-consequential-decision-governance",
        "eu-ai-act-ai-literacy-governance",
        "uk-ico-ai-data-protection-governance"
      ])
    );

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-aba-formal-opinion-512-generative-ai-law-practice")).toMatchObject({
      jurisdiction: "United States",
      regulator: "American Bar Association",
      sourceUrl:
        "https://www.americanbar.org/content/dam/aba/administrative/professional_responsibility/ethics-opinions/aba-formal-opinion-512.pdf",
      citation: "ABA Formal Opinion 512, Generative Artificial Intelligence Tools, July 29, 2024",
      topic: "ai-governance",
      coverageStatus: "missing",
      localCounselRole: "US legal AI professional responsibility counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-nist-ai-rmf-governance")).toMatchObject({
      jurisdiction: "United States",
      regulator: "National Institute of Standards and Technology",
      sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
      citation: "NIST AI RMF 1.0 and NIST AI 600-1 Generative AI Profile",
      topic: "ai-governance",
      coverageStatus: "missing",
      localCounselRole: "US AI governance / model risk counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-colorado-admt-consequential-decision-governance")).toMatchObject({
      jurisdiction: "United States",
      regulator: "Colorado Attorney General / Colorado General Assembly",
      sourceUrl: "https://leg.colorado.gov/bills/sb26-189",
      citation:
        "Colorado SB26-189, Automated Decision-Making Technology, signed May 14, 2026; operational provisions starting January 1, 2027",
      topic: "ai-governance",
      coverageStatus: "missing",
      localCounselRole: "Colorado ADMT / AI consumer-protection counsel"
    });
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
        "US legal AI competence and confidentiality evidence",
        "US legal AI communication, supervision, candor, and fee evidence",
        "US NIST AI RMF govern-map-measure-manage evidence",
        "US NIST GenAI output review and provenance evidence",
        "Colorado ADMT scope and developer documentation evidence",
        "Colorado ADMT notice, correction, human-review, and retention evidence",
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

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-aba-formal-opinion-512-generative-ai-law-practice")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "AI system use policy",
        "Human review approval log",
        "US legal AI ethics and professional responsibility register"
      ])
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-ai-act-ai-literacy-governance")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-nist-ai-rmf-governance")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "AI system use policy",
        "NIST GenAI output review and provenance register"
      ])
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-colorado-admt-consequential-decision-governance")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "Colorado ADMT scope and developer documentation register",
        "Colorado ADMT notice and meaningful human review register"
      ])
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uk-ico-ai-data-protection-governance")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "us-aba-formal-opinion-512-generative-ai-law-practice" }),
        expect.objectContaining({ clauseId: "us-nist-ai-rmf-governance" }),
        expect.objectContaining({ clauseId: "us-colorado-admt-consequential-decision-governance" }),
        expect.objectContaining({ clauseId: "eu-ai-act-ai-literacy-governance" }),
        expect.objectContaining({ clauseId: "uk-ico-ai-data-protection-governance" })
      ])
    );
  });

  it("matches EU MiCA custody, DORA, and TFR controls for platform wallet custody facts", () => {
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
      expect.arrayContaining([
        "eu-mica-casp-custody-administration",
        "eu-dora-ict-operational-resilience",
        "eu-tfr-crypto-asset-transfer-information"
      ])
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
        "EU client crypto-asset safeguarding and access-control evidence",
        "EU DORA ICT risk management and incident-response evidence",
        "EU DORA ICT third-party service register evidence",
        "EU TFR crypto-asset transfer information register",
        "EU TFR missing or incomplete transfer-information handling evidence"
      ])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-dora-ict-operational-resilience")).toMatchObject({
      jurisdiction: "European Union",
      topic: "operational-resilience",
      citation: "Regulation (EU) 2022/2554, DORA Articles 5-16, 17-23, and 28",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng",
      coverageStatus: "missing",
      localCounselRole: "EU DORA / operational resilience counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-tfr-crypto-asset-transfer-information")).toMatchObject({
      jurisdiction: "European Union",
      topic: "aml-cft",
      citation: "Regulation (EU) 2023/1113; EBA Travel Rule Guidelines under Regulation (EU) 2023/1113",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1113/oj/eng",
      coverageStatus: "missing",
      localCounselRole: "EU AML/CFT crypto-asset transfer counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks EU MiCA custody, DORA, and TFR controls covered when RWA custody template evidence is verified", () => {
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
      matchedEvidenceLabels: expect.arrayContaining(["Custody and signer control runbook"])
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-dora-ict-operational-resilience")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Custody and signer control runbook", "EU DORA ICT resilience register"]
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-tfr-crypto-asset-transfer-information")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["EU TFR Travel Rule transfer information register"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "eu-mica-casp-custody-administration" }),
        expect.objectContaining({ clauseId: "eu-dora-ict-operational-resilience" }),
        expect.objectContaining({ clauseId: "eu-tfr-crypto-asset-transfer-information" })
      ])
    );
  });

  it("matches Japan FSA crypto-asset custody source controls without legal conclusions", () => {
    const japanProject: ProjectProfile = {
      ...baseProject,
      id: "project-japan-crypto-custody",
      jurisdictions: ["Japan"],
      entityType: "Crypto-asset exchange custody operations team",
      assetModel: "Crypto asset exchange custody and transfer service with customer asset safeguarding",
      userType: "Japan retail and professional crypto-asset customers",
      custodyModel:
        "Platform manages customer crypto assets with segregated custody, cold wallet offline environment, daily reconciliation, and leakage response controls",
      aiUsage: "Manual evidence summary only",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(japanProject);
    const graph = createRegulatoryGraph(japanProject, audit, japanProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["jp-fsa-crypto-asset-custody-user-protection"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "jp-fsa-crypto-asset-custody-user-protection")).toMatchObject({
      jurisdiction: "Japan",
      regulator: "Financial Services Agency Japan",
      sourceUrl: "https://www.fsa.go.jp/common/law/guide/kaisya/e016.pdf",
      citation:
        "FSA Guidelines for Supervision of Crypto-Asset Exchange Service Providers; FSA Regulating the crypto assets landscape in Japan, December 2022",
      topic: "custody",
      coverageStatus: "missing",
      localCounselRole: "Japan crypto-asset exchange / custody counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Japan FSA registration and user-asset protection evidence",
        "Japan cold-wallet segregation, reconciliation, and leakage-response evidence"
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Japan FSA custody controls covered when RWA custody template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `japan-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const japanProject: ProjectProfile = {
      ...baseProject,
      id: "project-japan-crypto-custody-covered",
      jurisdictions: ["Japan"],
      entityType: "Crypto-asset exchange custody operations team",
      assetModel: "Crypto asset exchange custody and transfer service with customer asset safeguarding",
      custodyModel:
        "Platform manages customer crypto assets with segregated custody, cold wallet offline environment, daily reconciliation, and leakage response controls",
      aiUsage: "Manual evidence summary only",
      evidenceItems
    };
    const audit = analyzeAuditProfile(japanProject);
    const graph = createRegulatoryGraph(japanProject, audit, japanProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "jp-fsa-crypto-asset-custody-user-protection")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining(["Japan crypto-asset custody and leakage response register"])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "jp-fsa-crypto-asset-custody-user-protection" })])
    );
  });

  it("matches Canada CSA CTP PRU custody controls without legal conclusions", () => {
    const canadaProject: ProjectProfile = {
      ...baseProject,
      id: "project-canada-ctp-custody",
      projectName: "MapleVault CTP Custody Review",
      jurisdictions: ["Canada"],
      entityType: "Crypto asset trading platform operations team",
      assetModel: "Crypto asset trading platform with crypto contracts, custody, Canadian client access, and VRCA review assumptions",
      userType: "Canadian retail and permitted clients",
      custodyModel:
        "Platform holds Canadian client crypto assets through segregated custody, acceptable third-party custodian controls, no re-hypothecation, no leverage, and VRCA consent gates",
      aiUsage: "AI drafts CTP custody evidence summaries for human review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(canadaProject);
    const graph = createRegulatoryGraph(canadaProject, audit, canadaProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["ca-csa-ctp-pru-custody-investor-protection"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ca-csa-ctp-pru-custody-investor-protection")).toMatchObject({
      jurisdiction: "Canada",
      regulator: "Canadian Securities Administrators",
      sourceUrl: "https://fcaa.gov.sk.ca/public/plugins/pdfs/6064/21_332_csa_staff_notice_february_22_2023_.pdf",
      citation:
        "CSA Staff Notice 21-332 Crypto Asset Trading Platforms: Pre-Registration Undertakings; Joint CSA/IIROC Staff Notice 21-329",
      topic: "custody",
      coverageStatus: "missing",
      localCounselRole: "Canada crypto asset trading platform counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Canada CTP registration, PRU, and investor-protection evidence",
        "Canada client-asset custody, segregation, and custodian evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Canada")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "Canada crypto asset trading platform counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Canada CSA CTP custody controls covered when RWA custody template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `canada-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const canadaProject: ProjectProfile = {
      ...baseProject,
      id: "project-canada-ctp-custody-covered",
      projectName: "MapleVault CTP Custody Review",
      jurisdictions: ["Canada"],
      entityType: "Crypto asset trading platform operations team",
      assetModel: "Crypto asset trading platform with crypto contracts, custody, Canadian client access, and VRCA review assumptions",
      userType: "Canadian retail and permitted clients",
      custodyModel:
        "Platform holds Canadian client crypto assets through segregated custody, acceptable third-party custodian controls, no re-hypothecation, no leverage, and VRCA consent gates",
      aiUsage: "AI drafts CTP custody evidence summaries for human review",
      evidenceItems
    };
    const audit = analyzeAuditProfile(canadaProject);
    const graph = createRegulatoryGraph(canadaProject, audit, canadaProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ca-csa-ctp-pru-custody-investor-protection")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Canada CTP PRU custody and investor-protection register"]
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "ca-csa-ctp-pru-custody-investor-protection" })])
    );
  });

  it("matches Australia ASIC and AUSTRAC digital asset source controls without legal conclusions", () => {
    const australiaProject: ProjectProfile = {
      ...baseProject,
      id: "project-australia-digital-assets",
      projectName: "SouthernCross Digital Asset Review",
      jurisdictions: ["Australia"],
      entityType: "Digital asset platform operations team",
      assetModel: "Tokenised yield product with stablecoin payment rails and Australian digital asset service review assumptions",
      userType: "Australian retail users and wholesale investors",
      custodyModel: "Platform controls client digital assets through omnibus wallets, cold storage, and signer approvals",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and transaction monitoring summaries",
      aiUsage: "AI drafts Australia digital asset evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Australian pilot before digital-asset and AML/CTF counsel review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(australiaProject);
    const graph = createRegulatoryGraph(australiaProject, audit, australiaProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["au-asic-austrac-digital-asset-financial-services"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "au-asic-austrac-digital-asset-financial-services")).toMatchObject({
      jurisdiction: "Australia",
      regulator: "ASIC / AUSTRAC",
      sourceUrl: "https://www.asic.gov.au/regulatory-resources/digital-transformation/digital-assets-financial-products-and-services/",
      citation:
        "ASIC INFO 225 Digital assets: Financial products and services; ASIC RG 133; AUSTRAC virtual asset designated services and obligations guidance",
      topic: "custody",
      coverageStatus: "missing",
      localCounselRole: "Australia digital assets / AML-CTF counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Australia ASIC digital-asset financial services and custody evidence",
        "Australia AUSTRAC VASP AML/CTF, CDD, reporting, and recordkeeping evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Australia")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "Australia digital assets / AML-CTF counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Australia ASIC and AUSTRAC controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `australia-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const australiaProject: ProjectProfile = {
      ...baseProject,
      id: "project-australia-digital-assets-covered",
      projectName: "SouthernCross Digital Asset Review",
      jurisdictions: ["Australia"],
      entityType: "Digital asset platform operations team",
      assetModel: "Tokenised yield product with stablecoin payment rails and Australian digital asset service review assumptions",
      userType: "Australian retail users and wholesale investors",
      custodyModel: "Platform controls client digital assets through omnibus wallets, cold storage, and signer approvals",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and transaction monitoring summaries",
      aiUsage: "AI drafts Australia digital asset evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Australian pilot before digital-asset and AML/CTF counsel review",
      evidenceItems
    };
    const audit = analyzeAuditProfile(australiaProject);
    const graph = createRegulatoryGraph(australiaProject, audit, australiaProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "au-asic-austrac-digital-asset-financial-services")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "Custody and signer control runbook",
        "Australia digital asset financial services and VASP AML register"
      ])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "au-asic-austrac-digital-asset-financial-services" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches South Korea FSC and KoFIU VASP source controls without legal conclusions", () => {
    const koreaProject: ProjectProfile = {
      ...baseProject,
      id: "project-korea-vasp-user-protection",
      projectName: "HanRiver VASP User Protection Review",
      jurisdictions: ["South Korea"],
      entityType: "Virtual asset service provider operations team",
      assetModel: "Virtual asset exchange and wallet custody service with KRW real-name account review assumptions",
      userType: "Korean retail users and compliance reviewers",
      custodyModel:
        "Platform holds user virtual assets with wallet segregation, cold wallet procedures, deposit custody handoff, and incident compensation placeholders",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and transaction monitoring summaries",
      aiUsage: "AI drafts South Korea VASP evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Korean VASP custody and AML review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(koreaProject);
    const graph = createRegulatoryGraph(koreaProject, audit, koreaProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["kr-fsc-kofiu-vasp-user-protection-aml"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "kr-fsc-kofiu-vasp-user-protection-aml")).toMatchObject({
      jurisdiction: "South Korea",
      regulator: "Financial Services Commission / KoFIU",
      sourceUrl: "https://www.fsc.go.kr/eng/pr010101/82683",
      citation:
        "FSC Virtual Asset User Protection Act implementation; Enforcement Decree; KoFIU VASP reporting and AML guidance",
      topic: "custody",
      coverageStatus: "missing",
      localCounselRole: "South Korea virtual asset / AML counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Korea VASP user-asset protection, custody, and disclosure evidence",
        "Korea KoFIU VASP reporting, AML/CFT, CDD, and STR evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "South Korea")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "South Korea virtual asset / AML counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks South Korea FSC and KoFIU controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `korea-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const koreaProject: ProjectProfile = {
      ...baseProject,
      id: "project-korea-vasp-user-protection-covered",
      projectName: "HanRiver VASP User Protection Review",
      jurisdictions: ["Korea"],
      entityType: "Virtual asset service provider operations team",
      assetModel: "Virtual asset exchange and wallet custody service with KRW real-name account review assumptions",
      userType: "Korean retail users and compliance reviewers",
      custodyModel:
        "Platform holds user virtual assets with wallet segregation, cold wallet procedures, deposit custody handoff, and incident compensation placeholders",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and transaction monitoring summaries",
      aiUsage: "AI drafts Korea VASP evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Korean VASP custody and AML review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(koreaProject);
    const graph = createRegulatoryGraph(koreaProject, audit, koreaProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "kr-fsc-kofiu-vasp-user-protection-aml")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "Custody and signer control runbook",
        "Korea VASP user protection and AML reporting register"
      ])
    });
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "South Korea")).toMatchObject({
      readiness: "ready-for-counsel",
      coveredEvidenceCount: 2,
      missingEvidenceCount: 0
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "kr-fsc-kofiu-vasp-user-protection-aml" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches India FIU-IND and PMLA VDA source controls without legal conclusions", () => {
    const indiaProject: ProjectProfile = {
      ...baseProject,
      id: "project-india-vda-pmla",
      projectName: "Mumbai VDA PMLA Review",
      jurisdictions: ["India"],
      entityType: "Virtual digital asset service provider operations team",
      assetModel: "Virtual digital asset exchange, transfer, and custody service with issuer offer-sale review assumptions",
      userType: "Indian retail users and compliance reviewers",
      custodyModel: "Platform holds user VDA balances with hosted wallet controls, transfer approvals, custody boundary, and incident escalation placeholders",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and transaction-monitoring summaries",
      aiUsage: "AI drafts India VDA AML/CFT evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned India VDA AML/CFT review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(indiaProject);
    const graph = createRegulatoryGraph(indiaProject, audit, indiaProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(expect.arrayContaining(["in-fiu-pmla-vda-aml-cft"]));
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "in-fiu-pmla-vda-aml-cft")).toMatchObject({
      jurisdiction: "India",
      regulator: "Financial Intelligence Unit - India / Ministry of Finance",
      sourceUrl: "https://fiuindia.gov.in/pdfs/AML_legislation/AMLCFTguidelines10032023.pdf",
      citation:
        "PMLA VDA Notification S.O. 1072(E), 7 March 2023; FIU-IND AML/CFT Guidelines for Reporting Entities Providing Services Related to VDAs, 10 March 2023",
      topic: "aml-cft",
      coverageStatus: "missing",
      localCounselRole: "India VDA / PMLA AML counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "India VDA SP FIU-IND registration and activity-scope evidence",
        "India VDA AML/CFT reporting, CDD/EDD, STR, and Travel Rule evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "India")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "India VDA / PMLA AML counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks India FIU-IND and PMLA VDA controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `india-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const indiaProject: ProjectProfile = {
      ...baseProject,
      id: "project-india-vda-pmla-covered",
      projectName: "Mumbai VDA PMLA Review",
      jurisdictions: ["IN"],
      entityType: "Virtual digital asset service provider operations team",
      assetModel: "Virtual digital asset exchange, transfer, and custody service with issuer offer-sale review assumptions",
      userType: "Indian retail users and compliance reviewers",
      custodyModel: "Platform holds user VDA balances with hosted wallet controls, transfer approvals, custody boundary, and incident escalation placeholders",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and transaction-monitoring summaries",
      aiUsage: "AI drafts India VDA AML/CFT evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned India VDA AML/CFT review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(indiaProject);
    const graph = createRegulatoryGraph(indiaProject, audit, indiaProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "in-fiu-pmla-vda-aml-cft")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "Custody and signer control runbook",
        "India VDA SP FIU-IND registration and AML reporting register"
      ])
    });
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "India")).toMatchObject({
      readiness: "ready-for-counsel",
      coveredEvidenceCount: 2,
      missingEvidenceCount: 0
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "in-fiu-pmla-vda-aml-cft" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches Thailand SEC digital asset business custody and AMLO controls without legal conclusions", () => {
    const thailandProject: ProjectProfile = {
      ...baseProject,
      id: "project-thailand-digital-asset-custody",
      projectName: "Bangkok Digital Asset Custody Review",
      jurisdictions: ["Thailand"],
      entityType: "Digital asset exchange, broker, dealer, and custody operations team",
      assetModel: "Digital asset business with exchange, broker, dealer, and custodial wallet provider review assumptions",
      userType: "Thai retail users, compliance reviewers, and local counsel",
      custodyModel:
        "Platform holds client assets through hot wallet and cold wallet controls with transfer approvals, client asset custody records, and daily reconciliation placeholders",
      dataSensitivity: "CDD status summaries, high-risk customer metadata, wallet-risk metadata, and customer records excluded",
      aiUsage: "AI drafts Thailand digital asset custody and AMLO CDD evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Thailand digital asset business custody and AML/CDD review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(thailandProject);
    const graph = createRegulatoryGraph(thailandProject, audit, thailandProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["th-sec-digital-asset-business-custody-aml"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "th-sec-digital-asset-business-custody-aml")).toMatchObject({
      jurisdiction: "Thailand",
      regulator: "Thailand Securities and Exchange Commission / Anti-Money Laundering Office",
      sourceUrl: "https://www.sec.or.th/EN/pages/lawandregulations/digitalassetbusiness.aspx",
      citation:
        "Emergency Decree on Digital Asset Businesses B.E. 2561 (2018) Sections 7 and 26; SEC custody amendments effective 1 March 2022; SEC custodial wallet provider amendments effective 16 January 2025; AMLO AML/CFT Laws/Policy/Measures",
      topic: "custody",
      coverageStatus: "missing",
      localCounselRole: "Thailand digital asset / AML counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Thailand digital asset business license, custody, and client-asset evidence",
        "Thailand AMLO AML/CDD and high-risk customer controls"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Thailand")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "Thailand digital asset / AML counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Thailand digital asset custody and AML controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `thailand-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const thailandProject: ProjectProfile = {
      ...baseProject,
      id: "project-thailand-digital-asset-custody-covered",
      projectName: "Bangkok Digital Asset Custody Review",
      jurisdictions: ["TH"],
      entityType: "Digital asset exchange, broker, dealer, and custody operations team",
      assetModel: "Digital asset business with exchange, broker, dealer, and custodial wallet provider review assumptions",
      userType: "Thai retail users, compliance reviewers, and local counsel",
      custodyModel:
        "Platform holds client assets through hot wallet and cold wallet controls with transfer approvals, client asset custody records, and daily reconciliation placeholders",
      dataSensitivity: "CDD status summaries, high-risk customer metadata, wallet-risk metadata, and customer records excluded",
      aiUsage: "AI drafts Thailand digital asset custody and AMLO CDD evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Thailand digital asset business custody and AML/CDD review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(thailandProject);
    const graph = createRegulatoryGraph(thailandProject, audit, thailandProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "th-sec-digital-asset-business-custody-aml")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "Custody and signer control runbook",
        "Thailand digital asset custody and AML/CDD register"
      ])
    });
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Thailand")).toMatchObject({
      readiness: "ready-for-counsel",
      coveredEvidenceCount: 2,
      missingEvidenceCount: 0
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "th-sec-digital-asset-business-custody-aml" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches Indonesia OJK digital financial asset trading controls without legal conclusions", () => {
    const indonesiaProject: ProjectProfile = {
      ...baseProject,
      id: "project-indonesia-dfa-crypto-trading",
      projectName: "Jakarta Digital Financial Asset Review",
      jurisdictions: ["Indonesia"],
      entityType: "Digital financial asset and crypto asset trading operator",
      assetModel:
        "Indonesia digital financial asset trading platform with crypto asset trading, PAKD and CPAKD whitelist review, and product registration assumptions",
      userType: "Indonesian retail users, compliance reviewers, and local counsel",
      custodyModel: "Platform supports user crypto asset trading with official app and website channels and metadata-only custody boundary notes",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and customer records excluded from evidence handoff",
      aiUsage: "AI drafts OJK licensing, whitelist, governance, and reporting evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Indonesia OJK digital financial asset and crypto asset trading review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(indonesiaProject);
    const graph = createRegulatoryGraph(indonesiaProject, audit, indonesiaProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["id-ojk-digital-financial-asset-crypto-trading"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "id-ojk-digital-financial-asset-crypto-trading")).toMatchObject({
      jurisdiction: "Indonesia",
      regulator: "Indonesia Financial Services Authority (OJK)",
      sourceUrl: "https://ojk.go.id/en/fungsi-utama/itsk/perizinan-itsk-aset-keuangan-digital-aset-kripto/default.aspx",
      citation:
        "OJK POJK Number 27 of 2024, as amended by POJK Number 23 of 2025; SEOJK Number 20/SEOJK.07/2024; OJK whitelist press release, 19 December 2025; POJK Number 16 of 2025",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "Indonesia digital financial asset / crypto regulatory counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Indonesia OJK digital financial asset trading licensing and whitelist evidence",
        "Indonesia OJK trading governance, product, and reporting controls"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Indonesia")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "Indonesia digital financial asset / crypto regulatory counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Indonesia OJK digital financial asset trading controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `indonesia-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const indonesiaProject: ProjectProfile = {
      ...baseProject,
      id: "project-indonesia-dfa-crypto-trading-covered",
      projectName: "Jakarta Digital Financial Asset Review",
      jurisdictions: ["ID"],
      entityType: "Digital financial asset and crypto asset trading operator",
      assetModel:
        "Indonesia digital financial asset trading platform with crypto asset trading, PAKD and CPAKD whitelist review, and product registration assumptions",
      userType: "Indonesian retail users, compliance reviewers, and local counsel",
      custodyModel: "Platform supports user crypto asset trading with official app and website channels and metadata-only custody boundary notes",
      dataSensitivity: "CDD status summaries, wallet-risk metadata, and customer records excluded from evidence handoff",
      aiUsage: "AI drafts OJK licensing, whitelist, governance, and reporting evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Indonesia OJK digital financial asset and crypto asset trading review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(indonesiaProject);
    const graph = createRegulatoryGraph(indonesiaProject, audit, indonesiaProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "id-ojk-digital-financial-asset-crypto-trading")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Indonesia OJK digital financial asset trading and whitelist register"]
    });
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Indonesia")).toMatchObject({
      readiness: "ready-for-counsel",
      coveredEvidenceCount: 2,
      missingEvidenceCount: 0
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "id-ojk-digital-financial-asset-crypto-trading" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches Malaysia SC digital asset and BNM AML/CFT controls without legal conclusions", () => {
    const malaysiaProject: ProjectProfile = {
      ...baseProject,
      id: "project-malaysia-digital-asset-exchange",
      projectName: "Kuala Lumpur Digital Asset Exchange Review",
      jurisdictions: ["Malaysia"],
      entityType: "Digital asset exchange, digital broker, and custody operations team",
      assetModel:
        "Malaysia digital asset exchange with RMO-DAX, digital broker, Digital Asset Custodian, IEO, and tradeable asset review assumptions",
      userType: "Malaysian retail users, compliance reviewers, and local counsel",
      custodyModel:
        "Platform supports official app and website trading channels with hosted custody, transfer approvals, custody safeguarding, and recordkeeping placeholders",
      dataSensitivity: "CDD status summaries, STR workflow metadata, wallet-risk metadata, and customer records excluded",
      aiUsage: "AI drafts Malaysia SC and BNM AML/CFT evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Malaysia digital asset exchange and custody review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(malaysiaProject);
    const graph = createRegulatoryGraph(malaysiaProject, audit, malaysiaProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["my-sc-bnm-digital-asset-exchange-custody-aml"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "my-sc-bnm-digital-asset-exchange-custody-aml")).toMatchObject({
      jurisdiction: "Malaysia",
      regulator: "Securities Commission Malaysia / Bank Negara Malaysia",
      sourceUrl: "https://www.sc.com.my/digital-assets",
      citation:
        "Securities Commission Malaysia Digital Assets page; Guidelines on Digital Assets issued 28 October 2020, revised 19 August 2024; Bank Negara Malaysia AML/CFT - Digital Currencies (Sector 6) policy document",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "Malaysia digital asset / AML counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Malaysia SC DAX/DAC registration, trading, and custody evidence",
        "Malaysia BNM digital currency AML/CFT reporting-institution controls"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Malaysia")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "Malaysia digital asset / AML counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Malaysia SC/BNM digital asset controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `malaysia-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const malaysiaProject: ProjectProfile = {
      ...baseProject,
      id: "project-malaysia-digital-asset-exchange-covered",
      projectName: "Kuala Lumpur Digital Asset Exchange Review",
      jurisdictions: ["MY"],
      entityType: "Digital asset exchange, digital broker, and custody operations team",
      assetModel:
        "Malaysia digital asset exchange with RMO-DAX, digital broker, Digital Asset Custodian, IEO, and tradeable asset review assumptions",
      userType: "Malaysian retail users, compliance reviewers, and local counsel",
      custodyModel:
        "Platform supports official app and website trading channels with hosted custody, transfer approvals, custody safeguarding, and recordkeeping placeholders",
      dataSensitivity: "CDD status summaries, STR workflow metadata, wallet-risk metadata, and customer records excluded",
      aiUsage: "AI drafts Malaysia SC and BNM AML/CFT evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned Malaysia digital asset exchange and custody review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(malaysiaProject);
    const graph = createRegulatoryGraph(malaysiaProject, audit, malaysiaProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "my-sc-bnm-digital-asset-exchange-custody-aml")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["Malaysia digital asset exchange custody and AML/CFT register"]
    });
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Malaysia")).toMatchObject({
      readiness: "ready-for-counsel",
      coveredEvidenceCount: 2,
      missingEvidenceCount: 0
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "my-sc-bnm-digital-asset-exchange-custody-aml" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
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
      expect.arrayContaining([
        "us-nist-ai-rmf-governance",
        "eu-ai-act-ai-literacy-governance",
        "uk-ico-ai-data-protection-governance"
      ])
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
      matchedEvidenceLabels: expect.arrayContaining([
        "Custody and signer control runbook",
        "Wallet sanctions screening and escalation controls"
      ])
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
      matchedEvidenceLabels: expect.arrayContaining(["Custody and signer control runbook"])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "hk-sfc-vatp-client-asset-custody" })])
    );
  });

  it("matches Hong Kong HKMA stablecoin issuer controls without pulling in VATP custody controls", () => {
    const hongKongStablecoinProject: ProjectProfile = {
      ...baseProject,
      id: "project-hk-stablecoin-issuer",
      projectName: "HarborMint Stablecoin Issuer Review",
      jurisdictions: ["Hong Kong"],
      entityType: "Fiat-referenced stablecoin issuer",
      assetModel:
        "Fiat-referenced stablecoin issuer with HKD and USD reference-currency assumptions, specified stablecoin issuance, reserve assets, redemption, and HKMA licence application planning",
      userType: "Hong Kong treasury partners, distribution reviewers, compliance reviewers, and local counsel",
      custodyModel:
        "Reserve assets are planned for segregated safekeeping with qualified custodians; no exchange-platform customer wallet operations in this demo",
      dataSensitivity: "CDD status summaries, AML/CFT alert summaries, complaints metadata, and customer records excluded",
      aiUsage: "AI drafts HKMA stablecoin issuer evidence summaries for human review and Hong Kong counsel routing",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-application HKMA stablecoin issuer licensing and supervision review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(hongKongStablecoinProject);
    const graph = createRegulatoryGraph(hongKongStablecoinProject, audit, hongKongStablecoinProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["hk-hkma-stablecoin-issuer-regime"])
    );
    expect(graph.matchedClauses.map((clause) => clause.clauseId)).not.toEqual(
      expect.arrayContaining(["hk-sfc-vatp-client-asset-custody"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "hk-hkma-stablecoin-issuer-regime")).toMatchObject({
      jurisdiction: "Hong Kong",
      regulator: "Hong Kong Monetary Authority",
      citation:
        "Stablecoins Ordinance (Cap. 656); HKMA Regulatory Regime for Stablecoin Issuers, 1 August 2025; HKMA Supervisory and AML/CFT Guidelines, August 2025",
      sourceUrl: "https://www.hkma.gov.hk/eng/key-functions/international-financial-centre/stablecoin-issuers/",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "Hong Kong stablecoin issuer / HKMA counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Hong Kong HKMA stablecoin issuer licensing and activity-scope evidence",
        "Hong Kong HKMA stablecoin reserve, redemption, and supervision evidence",
        "Hong Kong HKMA stablecoin AML/CFT and user-protection evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Hong Kong")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 3,
      readiness: "evidence-gaps",
      localCounselRole: "Hong Kong stablecoin issuer / HKMA counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Hong Kong HKMA stablecoin issuer controls covered when RWA stablecoin template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `hk-stablecoin-template-${index + 1}`,
      status: "verified" as const
    }));
    const hongKongStablecoinProject: ProjectProfile = {
      ...baseProject,
      id: "project-hk-stablecoin-issuer-covered",
      jurisdictions: ["Hong Kong"],
      entityType: "Fiat-referenced stablecoin issuer",
      assetModel:
        "Fiat-referenced stablecoin issuer with specified stablecoin issuance, reserve assets, redemption, and HKMA licence application planning",
      userType: "Hong Kong treasury partners, compliance reviewers, and local counsel",
      custodyModel: "Reserve assets are planned for segregated safekeeping with qualified custodians; no client virtual asset custody",
      dataSensitivity: "CDD status summaries and AML/CFT alert summaries excluded from exported demo evidence",
      aiUsage: "AI drafts HKMA stablecoin issuer evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Pre-application HKMA stablecoin issuer review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(hongKongStablecoinProject);
    const graph = createRegulatoryGraph(hongKongStablecoinProject, audit, hongKongStablecoinProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "hk-hkma-stablecoin-issuer-regime")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 3,
      totalEvidenceRequestCount: 3,
      matchedEvidenceLabels: expect.arrayContaining([
        "Hong Kong HKMA stablecoin issuer licensing and scope register",
        "Hong Kong HKMA stablecoin reserve, redemption, and AML/CFT register"
      ])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "hk-hkma-stablecoin-issuer-regime" })])
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
      matchedEvidenceLabels: expect.arrayContaining(["Custody and signer control runbook"])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "sg-mas-dpt-customer-asset-safeguards" })])
    );
  });

  it("marks Singapore PSN02 AML/CFT controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `sg-psn02-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const singaporeProject: ProjectProfile = {
      ...baseProject,
      id: "project-singapore-psn02-covered",
      projectName: "HarborKey DPT AML Review",
      jurisdictions: ["Singapore"],
      assetModel: "Digital payment token service with customer wallet activity and transfer approvals",
      userType: "Retail users and accredited investors in Singapore",
      custodyModel: "Platform controls omnibus wallets and safeguards customer DPT assets",
      dataSensitivity: "KYC metadata, sanctions screening status, and wallet transaction history excluded from model payloads",
      aiUsage: "AI drafts Singapore DPT evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor only",
      operatingStage: "Planned DPT launch before Singapore counsel review",
      evidenceItems
    };
    const audit = analyzeAuditProfile(singaporeProject);
    const graph = createRegulatoryGraph(singaporeProject, audit, singaporeProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "sg-mas-psn02-dpt-aml-cft")).toMatchObject({
      jurisdiction: "Singapore",
      regulator: "Monetary Authority of Singapore",
      citation: "MAS Notice PSN02 and Guidelines to Notice PSN02",
      sourceUrl: "https://www.mas.gov.sg/regulation/notices/psn02-aml-cft-notice---digital-payment-token-service",
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      localCounselRole: "Singapore fintech / digital asset counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "sg-mas-psn02-dpt-aml-cft")?.matchedEvidenceLabels).toEqual(
      expect.arrayContaining(["Singapore DPT CDD and model handoff register"])
    );
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "sg-mas-psn02-dpt-aml-cft" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches US, EU, UK, and UAE marketing source controls for cross-border marketing claims without legal conclusions", () => {
    const marketingProject: ProjectProfile = {
      ...baseProject,
      id: "project-cross-border-marketing-us",
      projectName: "SignalBridge Marketing Review",
      jurisdictions: ["United States", "European Union", "United Kingdom", "United Arab Emirates"],
      assetModel: "Virtual asset public education and product-positioning campaign with paid creator endorsements and no token sale",
      userType: "US, EU, UK, and UAE retail audience segments, community followers, and exchange listing reviewers",
      custodyModel: "No custody; campaign team cannot approve wallet transfers or hold client virtual assets",
      dataSensitivity: "Audience-segment summaries and approval metadata only; raw onboarding files excluded from demo evidence",
      aiUsage: "AI drafts promotion-risk summaries for human review and local counsel routing",
      blockchainUse: "Simulated hash receipt for approved campaign archive metadata",
      operatingStage: "Planned public marketing campaign with influencer endorsements before US, EU MiCA, UK, and UAE counsel review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(marketingProject);
    const graph = createRegulatoryGraph(marketingProject, audit, marketingProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining([
        "us-ftc-endorsement-advertising-guides",
        "eu-mica-marketing-communications",
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
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-marketing-communications")).toMatchObject({
      jurisdiction: "European Union",
      regulator: "European Union / ESMA",
      citation: "Regulation (EU) 2023/1114, Articles 7-8",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
      topic: "marketing",
      coverageStatus: "missing",
      localCounselRole: "EU crypto-asset marketing counsel"
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
        "EU MiCA marketing communication identification and white-paper consistency evidence",
        "EU MiCA marketing notification and publication-timing evidence",
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
      jurisdictions: ["United States", "European Union", "United Kingdom", "United Arab Emirates"],
      assetModel: "Virtual asset public education and product-positioning campaign with paid creator endorsements and no token sale",
      userType: "US, EU, UK, and UAE retail audience segments, community followers, and exchange listing reviewers",
      custodyModel: "No custody; campaign team cannot approve wallet transfers or hold client virtual assets",
      dataSensitivity: "Audience-segment summaries and approval metadata only; raw onboarding files excluded from demo evidence",
      aiUsage: "AI drafts promotion-risk summaries for human review and local counsel routing",
      blockchainUse: "Simulated hash receipt for approved campaign archive metadata",
      operatingStage: "Planned public marketing campaign with influencer endorsements before US, EU MiCA, UK, and UAE counsel review",
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
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-marketing-communications")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: ["EU MiCA marketing communication review pack"]
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
        expect.objectContaining({ clauseId: "eu-mica-marketing-communications" }),
        expect.objectContaining({ clauseId: "uk-fca-crypto-financial-promotions" }),
        expect.objectContaining({ clauseId: "uae-vara-va-regulations-activity-scope" }),
        expect.objectContaining({ clauseId: "uae-vara-marketing-regulations-2024" })
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches Swiss FINMA token classification and stablecoin guidance controls without legal conclusions", () => {
    const swissProject: ProjectProfile = {
      ...baseProject,
      id: "project-swiss-stablecoin",
      projectName: "Helvetia Stablecoin Review",
      jurisdictions: ["Switzerland"],
      assetModel:
        "Swiss CHF-referenced stablecoin pilot with holder redemption claim, reserve assets, bank guarantee assumptions, payment token, utility token, and asset token classification questions",
      userType: "Swiss qualified users, treasury partners, and issuer counsel reviewers",
      custodyModel: "Issuer coordinates wallet mint, burn, transfer, and reserve-reconciliation approvals through segregated operations",
      dataSensitivity: "Holder identification metadata, sanctions-screening status, and transfer-risk summaries excluded from default exports",
      aiUsage: "AI drafts Swiss stablecoin evidence summaries for human review",
      blockchainUse: "Simulated manifest anchor for Swiss counsel packet",
      operatingStage: "Planned stablecoin issuer and guarantee review before Swiss counsel reliance",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(swissProject);
    const graph = createRegulatoryGraph(swissProject, audit, swissProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["ch-finma-ico-token-classification", "ch-finma-stablecoin-guidance-06-2024"])
    );
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ch-finma-stablecoin-guidance-06-2024")).toMatchObject({
      jurisdiction: "Switzerland",
      regulator: "FINMA",
      sourceName: "FINMA Guidance 06/2024 on stablecoins",
      sourceUrl: "https://www.finma.ch/en/news/2024/07/20240726-m-am-06-24-stablecoins/",
      citation: "FINMA Guidance 06/2024, Stablecoins, 26 July 2024",
      topic: "asset-classification",
      coverageStatus: "missing",
      coveredEvidenceCount: 0,
      totalEvidenceRequestCount: 2,
      localCounselRole: "Swiss stablecoin / financial services counsel",
      effectiveAsOf: "2024-07-26",
      lastReviewedAt: "2026-07-03"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Swiss token classification memo",
        "Swiss offering, prospectus, and governance evidence",
        "Swiss stablecoin issuer and bank-guarantee perimeter evidence",
        "Swiss stablecoin AML, sanctions, and transfer-risk evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Switzerland")).toMatchObject({
      matchedClauseCount: 2,
      missingEvidenceCount: 4,
      readiness: "evidence-gaps",
      localCounselRole: "Swiss DLT / financial services counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Swiss FINMA token classification and stablecoin controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `swiss-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const swissProject: ProjectProfile = {
      ...baseProject,
      id: "project-swiss-rwa-covered",
      jurisdictions: ["Switzerland"],
      assetModel:
        "Swiss tokenized private credit note with yield, asset-token economics, fundraising assumptions, CHF stablecoin reserve assets, holder redemption claim, and bank guarantee assumptions",
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
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ch-finma-stablecoin-guidance-06-2024")).toMatchObject({
      jurisdiction: "Switzerland",
      regulator: "FINMA",
      citation: "FINMA Guidance 06/2024, Stablecoins, 26 July 2024",
      sourceUrl: "https://www.finma.ch/en/news/2024/07/20240726-m-am-06-24-stablecoins/",
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      localCounselRole: "Swiss stablecoin / financial services counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ch-finma-stablecoin-guidance-06-2024")?.matchedEvidenceLabels).toEqual(
      expect.arrayContaining([
        "Swiss stablecoin issuer and bank guarantee perimeter memo",
        "Swiss stablecoin AML and sanctions transfer-risk register"
      ])
    );
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "ch-finma-ico-token-classification" }),
        expect.objectContaining({ clauseId: "ch-finma-stablecoin-guidance-06-2024" })
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches UAE VARA operating source controls without triggering marketing-only regulations", () => {
    const uaeProject: ProjectProfile = {
      ...baseProject,
      id: "project-uae-vara-operating",
      projectName: "Dubai VARA Operating Review",
      jurisdictions: ["United Arab Emirates"],
      assetModel: "Dubai virtual asset issuance, exchange, transfer, and custody service with activity-scope and licensing assumptions",
      userType: "UAE institutional treasury partners, compliance reviewers, operations owners, and local counsel",
      custodyModel:
        "Platform safeguards client virtual assets through hosted wallet controls, reconciliation, withdrawal approvals, and proof-of-reserves placeholders",
      dataSensitivity:
        "CDD status summaries, wallet-risk metadata, transaction-monitoring summaries, and customer records excluded from demo evidence",
      aiUsage: "AI drafts audit-prep evidence summaries for human review and UAE counsel routing",
      blockchainUse: "Simulated evidence anchor for metadata-only VARA counsel handoff",
      operatingStage: "Pre-production VARA operating, AML/CFT, and custody workflow review before local counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(uaeProject);
    const graph = createRegulatoryGraph(uaeProject, audit, uaeProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining(["uae-vara-va-regulations-activity-scope", "uae-vara-compliance-risk-management"])
    );
    expect(graph.matchedClauses.map((clause) => clause.clauseId)).not.toContain("uae-vara-marketing-regulations-2024");
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uae-vara-va-regulations-activity-scope")).toMatchObject({
      jurisdiction: "United Arab Emirates",
      regulator: "Dubai Virtual Assets Regulatory Authority",
      citation: "VARA Virtual Assets and Related Activities Regulations 2023",
      sourceUrl: "https://rulebooks.vara.ae/rulebook/virtual-assets-and-related-activities-regulations-2023",
      topic: "activity-scope",
      coverageStatus: "missing",
      coveredEvidenceCount: 0,
      totalEvidenceRequestCount: 2,
      localCounselRole: "UAE virtual-assets / financial regulatory counsel",
      effectiveAsOf: "2025-06-19",
      lastReviewedAt: "2026-07-03"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uae-vara-compliance-risk-management")).toMatchObject({
      jurisdiction: "United Arab Emirates",
      regulator: "Dubai Virtual Assets Regulatory Authority",
      citation: "VARA Compliance and Risk Management Rulebook",
      sourceUrl: "https://rulebooks.vara.ae/rulebook/compliance-and-risk-management-rulebook",
      topic: "custody",
      coverageStatus: "missing",
      coveredEvidenceCount: 0,
      totalEvidenceRequestCount: 2,
      localCounselRole: "UAE virtual-assets / financial regulatory counsel",
      effectiveAsOf: "2025-06-19",
      lastReviewedAt: "2026-07-03"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "UAE virtual asset activity scope and licensing evidence",
        "UAE marketing and cross-border access evidence",
        "UAE compliance, AML/CFT, and audit control evidence",
        "UAE client virtual asset custody and proof-of-reserves evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "United Arab Emirates")).toMatchObject({
      matchedClauseCount: 2,
      missingEvidenceCount: 4,
      readiness: "evidence-gaps",
      localCounselRole: "UAE virtual-assets / financial regulatory counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks UAE VARA compliance and risk controls covered when RWA template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `uae-rwa-template-${index + 1}`,
      status: "verified" as const
    }));
    const uaeProject: ProjectProfile = {
      ...baseProject,
      id: "project-uae-rwa-covered",
      jurisdictions: ["United Arab Emirates"],
      assetModel: "Dubai tokenized private credit note with yield and virtual asset issuance assumptions",
      userType: "UAE retail and qualified investor review audience",
      custodyModel: "UAE platform wallet operations with client virtual asset treatment and proof of reserves review",
      dataSensitivity: "KYC metadata and wallet transaction history excluded from default exports",
      aiUsage: "AI drafts UAE VARA evidence summaries for human review",
      blockchainUse: "Simulated evidence anchor for UAE counsel packet",
      operatingStage: "Planned public launch before UAE local counsel reliance",
      evidenceItems
    };
    const audit = analyzeAuditProfile(uaeProject);
    const graph = createRegulatoryGraph(uaeProject, audit, uaeProject.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uae-vara-compliance-risk-management")).toMatchObject({
      jurisdiction: "United Arab Emirates",
      regulator: "Dubai Virtual Assets Regulatory Authority",
      citation: "VARA Compliance and Risk Management Rulebook",
      sourceUrl: "https://rulebooks.vara.ae/rulebook/compliance-and-risk-management-rulebook",
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      localCounselRole: "UAE virtual-assets / financial regulatory counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "uae-vara-compliance-risk-management")?.matchedEvidenceLabels).toEqual(
      expect.arrayContaining([
        "Custody and signer control runbook",
        "Wallet sanctions screening and escalation controls"
      ])
    );
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "uae-vara-compliance-risk-management" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches US CFTC, US SEC, EU MiCA, and UK DAO governance source controls without legal conclusions", () => {
    const audit = analyzeAuditProfile(daoGovernanceProject);
    const graph = createRegulatoryGraph(daoGovernanceProject, audit, daoGovernanceProject.evidenceItems);

    expect(graph.matchedClauses.map((clause) => clause.clauseId)).toEqual(
      expect.arrayContaining([
        "us-sec-dao-report-governance-token-review",
        "us-cftc-ooki-dao-defi-derivatives-platform",
        "eu-mica-decentralised-casp-perimeter",
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
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-cftc-ooki-dao-defi-derivatives-platform")).toMatchObject({
      jurisdiction: "United States",
      regulator: "Commodity Futures Trading Commission",
      citation: "CFTC Release No. 8590-22; CFTC v. Ooki DAO default judgment, June 8, 2023",
      sourceUrl: "https://www.cftc.gov/PressRoom/PressReleases/8590-22",
      topic: "governance",
      coverageStatus: "missing",
      localCounselRole: "US commodities / DAO derivatives counsel"
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-decentralised-casp-perimeter")).toMatchObject({
      jurisdiction: "European Union",
      regulator: "European Union / ESMA",
      citation: "Regulation (EU) 2023/1114, Recital 22 and Article 2(1)",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
      topic: "governance",
      coverageStatus: "missing",
      localCounselRole: "EU MiCA DAO / CASP perimeter counsel"
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
        "US CFTC DAO derivatives-platform scope evidence",
        "US CFTC DAO BSA/CIP and governance-control evidence",
        "EU MiCA DAO decentralisation and intermediary evidence",
        "EU MiCA DAO crypto-asset service perimeter evidence",
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
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "us-cftc-ooki-dao-defi-derivatives-platform")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2
    });
    expect(graph.matchedClauses.find((clause) => clause.clauseId === "eu-mica-decentralised-casp-perimeter")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining(["EU MiCA decentralisation and CASP perimeter register"])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clauseId: "us-sec-dao-report-governance-token-review" }),
        expect.objectContaining({ clauseId: "us-cftc-ooki-dao-defi-derivatives-platform" }),
        expect.objectContaining({ clauseId: "eu-mica-decentralised-casp-perimeter" }),
        expect.objectContaining({ clauseId: "uk-law-commission-dao-scoping-paper" })
      ])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches Philippines BSP VASP source controls through the PH jurisdiction alias without legal conclusions", () => {
    const project: ProjectProfile = {
      ...baseProject,
      id: "project-ph-vasp",
      projectName: "Manila VASP Custody Review",
      jurisdictions: ["PH"],
      assetModel: "Philippines VASP, CASP counterparty, VA exchange, transfer, safekeeping, and VA custodian review",
      userType: "Philippine retail users and compliance reviewers",
      custodyModel: "Platform controls hosted wallets, VA transfer approval, wallet security, and custody operations",
      dataSensitivity: "CDD status summaries, STR workflow metadata, and customer records excluded",
      aiUsage: "AI drafts BSP VASP/CASP evidence summaries for human review",
      operatingStage: "Planned Philippines public launch before counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ph-bsp-vasp-casp-risk-management-aml")).toMatchObject({
      jurisdiction: "Philippines",
      regulator: "Bangko Sentral ng Pilipinas",
      citation:
        "Bangko Sentral ng Pilipinas Circular No. 1108, Guidelines for Virtual Asset Service Providers, 26 January 2021; BSP Memorandum No. M-2026-003, Reminders on Sound Risk Management Practices when Dealing with Virtual Asset Service Providers, 2026",
      sourceUrl: "https://www.bsp.gov.ph/Regulations/Issuances/2026/M-2026-003.pdf",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "Philippines virtual asset / AML counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "Philippines BSP VASP registration, activity, and custody-scope evidence",
        "Philippines BSP AML/CFT due-diligence, monitoring, and STR controls"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "Philippines")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "Philippines virtual asset / AML counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks Philippines BSP VASP source controls covered when template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `ph-template-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...baseProject,
      id: "project-ph-vasp-covered",
      projectName: "Manila VASP Custody Review",
      jurisdictions: ["Philippines"],
      assetModel: "Philippines VASP, CASP counterparty, VA exchange, transfer, safekeeping, and VA custodian review",
      userType: "Philippine retail users and compliance reviewers",
      custodyModel: "Platform controls hosted wallets, VA transfer approval, wallet security, and custody operations",
      dataSensitivity: "CDD status summaries, STR workflow metadata, and customer records excluded",
      aiUsage: "AI drafts BSP VASP/CASP evidence summaries for human review",
      operatingStage: "Planned Philippines public launch before counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "ph-bsp-vasp-casp-risk-management-aml")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining([
        "Philippines BSP VASP custody and AML/CFT risk-management register"
      ])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "ph-bsp-vasp-casp-risk-management-aml" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("matches South Africa FSCA/FIC CASP source controls through the ZA jurisdiction alias without legal conclusions", () => {
    const project: ProjectProfile = {
      ...baseProject,
      id: "project-za-casp",
      projectName: "Cape Town CASP Travel Rule Review",
      jurisdictions: ["ZA"],
      assetModel: "South Africa CASP, crypto asset financial product, FAIS/FSP licence, transfer, and custody review",
      userType: "South African retail users and compliance reviewers",
      custodyModel: "Platform controls hosted crypto asset transfers, counterparty CASP checks, and unhosted wallet review",
      dataSensitivity: "Originator and beneficiary metadata summaries, RMCP notes, and customer records excluded",
      aiUsage: "AI drafts FSCA/FIC CASP evidence summaries for human review",
      operatingStage: "Planned South Africa public launch before counsel signoff",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "za-fsca-fic-casp-licensing-travel-rule")).toMatchObject({
      jurisdiction: "South Africa",
      regulator: "Financial Sector Conduct Authority / Financial Intelligence Centre",
      citation:
        "FSCA General Notice 1350 of 2022, Declaration of a crypto asset as a financial product under the Financial Advisory and Intermediary Services Act, 19 October 2022; FSCA New Financial Services Providers page; FIC Directive 9 concerning the implementation of the Travel Rule relating to crypto asset transfers, 15 November 2024, effective 30 April 2025",
      sourceUrl: "https://www.fic.gov.za/wp-content/uploads/2024/11/Directive-9-Travel-rule-relating-to-crypto-asset-transfers.pdf",
      topic: "activity-scope",
      coverageStatus: "missing",
      localCounselRole: "South Africa financial services / AML counsel"
    });
    expect(graph.evidenceGaps.map((gap) => gap.title)).toEqual(
      expect.arrayContaining([
        "South Africa FSCA CASP/FSP licensing and activity-scope evidence",
        "South Africa FIC Travel Rule, RMCP, and transfer-control evidence"
      ])
    );
    expect(graph.jurisdictionSummaries.find((summary) => summary.jurisdiction === "South Africa")).toMatchObject({
      matchedClauseCount: 1,
      missingEvidenceCount: 2,
      readiness: "evidence-gaps",
      localCounselRole: "South Africa financial services / AML counsel"
    });
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks South Africa FSCA/FIC CASP source controls covered when template evidence is verified", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `za-template-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...baseProject,
      id: "project-za-casp-covered",
      projectName: "Cape Town CASP Travel Rule Review",
      jurisdictions: ["South Africa"],
      assetModel: "South Africa CASP, crypto asset financial product, FAIS/FSP licence, transfer, and custody review",
      userType: "South African retail users and compliance reviewers",
      custodyModel: "Platform controls hosted crypto asset transfers, counterparty CASP checks, and unhosted wallet review",
      dataSensitivity: "Originator and beneficiary metadata summaries, RMCP notes, and customer records excluded",
      aiUsage: "AI drafts FSCA/FIC CASP evidence summaries for human review",
      operatingStage: "Planned South Africa public launch before counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);

    expect(graph.matchedClauses.find((clause) => clause.clauseId === "za-fsca-fic-casp-licensing-travel-rule")).toMatchObject({
      coverageStatus: "covered",
      coveredEvidenceCount: 2,
      totalEvidenceRequestCount: 2,
      matchedEvidenceLabels: expect.arrayContaining(["South Africa CASP licensing and Travel Rule RMCP register"])
    });
    expect(graph.evidenceGaps).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ clauseId: "za-fsca-fic-casp-licensing-travel-rule" })])
    );
    expect(JSON.stringify(graph)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });
});
