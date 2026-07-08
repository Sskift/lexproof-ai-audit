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
  jurisdictions: ["United States", "European Union", "United Kingdom"],
  assetModel:
    "No token sale; AI-assisted matter intake, evidence review, NYC AEDT hiring-screening scoping, California CCPA ADMT significant-decision scoping, and Colorado consequential-decision scoping workflow",
  userType: "In-house counsel and compliance reviewers",
  custodyModel: "No custody; metadata-only evidence records",
  dataSensitivity: "Confidential matter summaries with client identifiers excluded",
  aiUsage:
    "AI drafts issue-spotting notes, evidence requests, NYC AEDT bias-audit questions, California CCPA ADMT and Colorado ADMT scoping questions, and source-linked counsel questions for human review",
  blockchainUse: "Simulated manifest anchor",
  operatingStage: "Internal pilot before counsel-supervised rollout",
  evidenceItems: []
};

const marketingClaimsProject: ProjectProfile = {
  id: "template-marketing-claims",
  projectName: "SignalBridge Marketing Review",
  entityType: "Virtual asset marketing operations team",
  jurisdictions: ["United States", "European Union", "United Kingdom", "United Arab Emirates"],
  assetModel: "Virtual asset public education campaign with paid creator endorsements, KOL incentives, and no token sale",
  userType: "US, EU, UK, and UAE retail audience segments, creator followers, and exchange listing reviewers",
  custodyModel: "No custody; campaign team cannot approve wallet transfers or hold client virtual assets",
  dataSensitivity: "Audience-segment summaries and approval metadata only",
  aiUsage: "AI drafts promotion-risk summaries for human review and local counsel routing",
  blockchainUse: "Simulated hash receipt for approved campaign archive metadata",
  operatingStage: "Planned public marketing campaign before US, EU MiCA, UK, and UAE counsel review",
  evidenceItems: []
};

const daoGovernanceProject: ProjectProfile = {
  id: "template-dao-governance",
  projectName: "ClauseGuard DAO",
  entityType: "DAO foundation governance committee",
  jurisdictions: ["United States", "European Union", "United Kingdom"],
  assetModel: "Governance token and multisig execution workflow for protocol upgrades",
  userType: "DAO token holders, protocol contributors, and multisig signers",
  custodyModel: "DAO treasury controlled by multisig signer quorum",
  dataSensitivity: "Contributor agreement summaries only; personal records excluded",
  aiUsage: "AI drafts source-linked governance evidence requests for human review",
  blockchainUse: "Proposal hash, vote receipt, and simulated evidence manifest anchor",
  operatingStage: "Planned governance proposal before counsel review",
  evidenceItems: []
};

describe("evidence templates", () => {
  it("lists the hackathon-critical evidence template scenarios", () => {
    const templates = listEvidenceTemplates();

    expect(templates.map((template) => template.id)).toEqual(
      expect.arrayContaining([
        "tokenized-yield-rwa",
        "dao-governance-multisig",
        "ai-compliance-workflow",
        "marketing-claims-review"
      ])
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
    const investorEligibilityReview = items.find((item) => item.label === "Investor eligibility review");
    const walletSanctionsControls = items.find((item) => item.label === "Wallet sanctions screening and escalation controls");
    const cvcTransferControls = items.find(
      (item) => item.label === "US FinCEN CVC MSB and BSA transfer control register"
    );
    const nydfsCustodyControls = items.find(
      (item) => item.label === "New York NYDFS BitLicense and custody customer-protection register"
    );

    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "RWA disclosure assumptions memo",
        "Custody and signer control runbook",
        "EU DORA ICT resilience register",
        "EU TFR Travel Rule transfer information register",
        "EU DLT Pilot Regime market infrastructure perimeter register",
        "Investor eligibility review",
        "Hong Kong HKMA stablecoin issuer licensing and scope register",
        "Hong Kong HKMA stablecoin reserve, redemption, and AML/CFT register",
        "Singapore DPT CDD and model handoff register",
        "UK FCA cryptoasset AML registration and Travel Rule register",
        "UK qualifying stablecoin issuer permission and disclosure register",
        "UK qualifying stablecoin backing safeguarding and redemption register",
        "Japan crypto-asset custody and leakage response register",
        "Canada CTP PRU custody and investor-protection register",
        "Australia digital asset financial services and VASP AML register",
        "Korea VASP user protection and AML reporting register",
        "EU MiCA ART EMT issuer authorisation and white paper register",
        "EU MiCA stablecoin reserve redemption and recovery register",
        "India VDA SP FIU-IND registration and AML reporting register",
        "Thailand digital asset custody and AML/CDD register",
        "Indonesia OJK digital financial asset trading and whitelist register",
        "Malaysia digital asset exchange custody and AML/CFT register",
        "Philippines BSP VASP custody and AML/CFT risk-management register",
        "South Africa CASP licensing and Travel Rule RMCP register",
        "US FinCEN CVC MSB and BSA transfer control register",
        "New York NYDFS BitLicense and custody customer-protection register",
        "US GENIUS Act permitted issuer and reserve register",
        "US GENIUS Act BSA AML and sanctions program register",
        "Wallet sanctions screening and escalation controls"
      ])
    );
    expect(items.every((item) => item.status === "requested")).toBe(true);
    expect(investorEligibilityReview?.content).toContain("Regulation D");
    expect(investorEligibilityReview?.content).toContain("Rule 506(c)");
    expect(investorEligibilityReview?.content).toContain("accredited investor verification");
    expect(investorEligibilityReview?.content).toContain("without customer identity records");
    expect(walletSanctionsControls?.content).toContain("OFAC sanctions screening");
    expect(walletSanctionsControls?.content).toContain("blocked property escalation");
    expect(walletSanctionsControls?.content).toContain("without raw KYC or wallet secrets");
    expect(cvcTransferControls?.content).toContain("FinCEN CVC business model");
    expect(cvcTransferControls?.content).toContain("MSB registration handoff");
    expect(cvcTransferControls?.content).toContain("Travel Rule transmittal recordkeeping");
    expect(cvcTransferControls?.content).toContain("without raw KYC or full wallet histories");
    expect(nydfsCustodyControls?.content).toContain("New York virtual currency business activity");
    expect(nydfsCustodyControls?.content).toContain("BitLicense or limited purpose trust company route");
    expect(nydfsCustodyControls?.content).toContain("customer virtual currency segregation");
    expect(nydfsCustodyControls?.content).toContain("no raw KYC, wallet secrets, customer records, or personal data");
    expect(serializedSources).toContain("regulatory control: control-us-sec-cftc-crypto-asset-interpretation");
    expect(serializedSources).toContain("regulatory control: control-eu-mica-title-ii-white-paper");
    expect(serializedSources).toContain("regulatory control: control-eu-mica-casp-custody-administration");
    expect(serializedSources).toContain("regulatory control: control-eu-dora-ict-operational-resilience");
    expect(serializedSources).toContain("regulatory control: control-eu-tfr-crypto-asset-transfer-information");
    expect(serializedSources).toContain("regulatory control: control-eu-dlt-pilot-regime-market-infrastructure");
    expect(serializedSources).toContain("regulatory control: control-sg-mas-psn02-dpt-aml-cft");
    expect(serializedSources).toContain("regulatory control: control-sg-mas-dpt-customer-asset-safeguards");
    expect(serializedSources).toContain("regulatory control: control-uk-fca-cryptoasset-aml-registration-travel-rule");
    expect(serializedSources).toContain("regulatory control: control-uk-fca-qualifying-stablecoin-issuer-regime");
    expect(serializedSources).toContain("regulatory control: control-jp-fsa-crypto-asset-custody-user-protection");
    expect(serializedSources).toContain("regulatory control: control-ca-csa-ctp-pru-custody-investor-protection");
    expect(serializedSources).toContain("regulatory control: control-au-asic-austrac-digital-asset-financial-services");
    expect(serializedSources).toContain("regulatory control: control-kr-fsc-kofiu-vasp-user-protection-aml");
    expect(serializedSources).toContain("regulatory control: control-in-fiu-pmla-vda-aml-cft");
    expect(serializedSources).toContain("regulatory control: control-th-sec-digital-asset-business-custody-aml");
    expect(serializedSources).toContain("regulatory control: control-id-ojk-digital-financial-asset-crypto-trading");
    expect(serializedSources).toContain("regulatory control: control-my-sc-bnm-digital-asset-exchange-custody-aml");
    expect(serializedSources).toContain("regulatory control: control-ph-bsp-vasp-casp-risk-management-aml");
    expect(serializedSources).toContain("regulatory control: control-za-fsca-fic-casp-licensing-travel-rule");
    expect(serializedSources).toContain("regulatory control: control-br-bcb-virtual-asset-service-framework");
    expect(serializedSources).toContain("regulatory control: control-br-cvm-crypto-asset-securities-guidance");
    expect(serializedSources).toContain("regulatory control: control-ch-finma-ico-token-classification");
    expect(serializedSources).toContain("regulatory control: control-ch-finma-stablecoin-guidance-06-2024");
    expect(serializedSources).toContain("regulatory control: control-eu-mica-art-emt-stablecoin-issuer-regime");
    expect(serializedSources).toContain("regulatory control: control-hk-hkma-stablecoin-issuer-regime");
    expect(serializedSources).toContain("regulatory control: control-uae-vara-va-regulations-activity-scope");
    expect(serializedSources).toContain("regulatory control: control-uae-vara-compliance-risk-management");
    expect(serializedSources).toContain("regulatory control: control-us-sec-reg-d-accredited-investor-verification");
    expect(serializedSources).toContain("regulatory control: control-us-ofac-virtual-currency-sanctions-compliance");
    expect(serializedSources).toContain("regulatory control: control-us-fincen-cvc-msb-bsa-travel-rule");
    expect(serializedSources).toContain("regulatory control: control-us-nydfs-bitlicense-custody-customer-protection");
    expect(serializedSources).toContain("regulatory control: control-us-genius-payment-stablecoin-issuer-regime");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("passport");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("private key");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("api key");
    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Swiss stablecoin issuer and bank guarantee perimeter memo",
        "Swiss stablecoin AML and sanctions transfer-risk register",
        "UK qualifying stablecoin issuer permission and disclosure register",
        "UK qualifying stablecoin backing safeguarding and redemption register",
        "Hong Kong HKMA stablecoin issuer licensing and scope register",
        "Hong Kong HKMA stablecoin reserve, redemption, and AML/CFT register"
      ])
    );
  });

  it("recommends AI workflow evidence with ABA, US NIST, NYC AEDT, California CCPA ADMT, Colorado ADMT, EU, and UK regulatory control links", () => {
    const recommended = recommendEvidenceTemplates(aiLegalWorkflowProject);
    const items = createEvidenceItemsFromTemplate("ai-compliance-workflow");
    const serializedSources = items.map((item) => item.source ?? "").join("\n");

    expect(recommended[0]).toMatchObject({
      id: "ai-compliance-workflow",
      title: "AI Legal / Compliance Workflow"
    });
    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "AI system use policy",
        "NIST GenAI output review and provenance register",
        "NYC AEDT scope and bias audit register",
        "NYC AEDT notice and data retention request register",
        "Colorado ADMT scope and developer documentation register",
        "Colorado ADMT notice and meaningful human review register",
        "California CCPA ADMT scope and risk assessment register",
        "California CCPA ADMT access and opt-out workflow register",
        "EU AI Act provider QMS and risk-management register",
        "EU AI Act technical documentation and data-governance register",
        "EU AI Act justice and ADR perimeter memo",
        "EU AI Act high-risk oversight and fundamental-rights register",
        "US legal AI ethics and professional responsibility register"
      ])
    );
    expect(serializedSources).toContain("regulatory control: control-us-aba-formal-opinion-512-generative-ai-law-practice");
    expect(serializedSources).toContain("regulatory control: control-us-nist-ai-rmf-governance");
    expect(serializedSources).toContain("regulatory control: control-us-nyc-local-law-144-aedt-employment-decision-governance");
    expect(serializedSources).toContain("regulatory control: control-us-colorado-admt-consequential-decision-governance");
    expect(serializedSources).toContain("regulatory control: control-us-california-ccpa-admt-consumer-rights-governance");
    expect(serializedSources).toContain("regulatory control: control-eu-ai-act-ai-literacy-governance");
    expect(serializedSources).toContain("regulatory control: control-eu-ai-act-high-risk-provider-quality-documentation");
    expect(serializedSources).toContain("regulatory control: control-eu-ai-act-administration-justice-adr-perimeter");
    expect(serializedSources).toContain("regulatory control: control-uk-ico-ai-data-protection-governance");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("passport");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("private key");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("api key");
  });

  it("recommends marketing claims evidence with US, EU, UK, and UAE regulatory control links", () => {
    const recommended = recommendEvidenceTemplates(marketingClaimsProject);
    const items = createEvidenceItemsFromTemplate("marketing-claims-review");
    const serializedSources = items.map((item) => item.source ?? "").join("\n");

    expect(recommended[0]).toMatchObject({
      id: "marketing-claims-review",
      title: "Marketing Claims Review"
    });
    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Claims substantiation and risk disclosure register",
        "Creator endorsement and material connection log",
        "Investment adviser advertisement and promoter review file",
        "Investment adviser performance presentation support file",
        "UK financial promotion approval pack",
        "EU MiCA marketing communication review pack",
        "UAE VARA approval and risk-warning archive",
        "UAE KOL incentive and recordkeeping log"
      ])
    );
    expect(serializedSources).toContain("regulatory control: control-us-ftc-endorsement-advertising-guides");
    expect(serializedSources).toContain("regulatory control: control-us-sec-investment-adviser-marketing-rule");
    expect(serializedSources).toContain("regulatory control: control-eu-mica-marketing-communications");
    expect(serializedSources).toContain("regulatory control: control-uk-fca-crypto-financial-promotions");
    expect(serializedSources).toContain("regulatory control: control-uae-vara-va-regulations-activity-scope");
    expect(serializedSources).toContain("regulatory control: control-uae-vara-marketing-regulations-2024");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("passport");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("private key");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("api key");
  });

  it("recommends DAO governance evidence with US CFTC, US SEC, EU MiCA, and UK regulatory control links", () => {
    const recommended = recommendEvidenceTemplates(daoGovernanceProject);
    const items = createEvidenceItemsFromTemplate("dao-governance-multisig");
    const serializedSources = items.map((item) => item.source ?? "").join("\n");

    expect(recommended[0]).toMatchObject({
      id: "dao-governance-multisig",
      title: "DAO Governance / Multisig Execution"
    });
    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Governance proposal record",
        "Multisig signer authority matrix",
        "Vote and execution receipt",
        "EU MiCA decentralisation and CASP perimeter register",
        "DAO derivatives platform boundary and BSA/CIP review register",
        "Contributor agreement summary"
      ])
    );
    expect(serializedSources).toContain("regulatory control: control-us-sec-dao-report-governance-token-review");
    expect(serializedSources).toContain("regulatory control: control-us-cftc-ooki-dao-defi-derivatives-platform");
    expect(serializedSources).toContain("regulatory control: control-eu-mica-decentralised-casp-perimeter");
    expect(serializedSources).toContain("regulatory control: control-uk-law-commission-dao-scoping-paper");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("passport");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("private key");
    expect(JSON.stringify(items).toLowerCase()).not.toContain("api key");
  });
});
