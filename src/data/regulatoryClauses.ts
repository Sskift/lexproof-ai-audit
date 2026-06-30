export type RegulatoryClauseTopic =
  | "asset-classification"
  | "marketing"
  | "custody"
  | "data"
  | "aml-cft"
  | "ai-governance"
  | "evidence";

export type RegulatoryEvidenceRequest = {
  id: string;
  title: string;
  reason: string;
  priority: "P0" | "P1" | "P2";
  keywords: string[];
};

export type RegulatoryClause = {
  id: string;
  jurisdiction: string;
  regulator: string;
  sourceName: string;
  sourceUrl: string;
  citation: string;
  topic: RegulatoryClauseTopic;
  summary: string;
  triggerFlagIds: string[];
  triggerKeywords: string[];
  evidenceRequests: RegulatoryEvidenceRequest[];
  counselQuestions: string[];
  localCounselRole: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only.";
};

export const REGULATORY_CLAUSES: RegulatoryClause[] = [
  {
    id: "us-sec-cftc-crypto-asset-interpretation",
    jurisdiction: "United States",
    regulator: "SEC / CFTC",
    sourceName: "Application of the Federal Securities Laws to Certain Types of Crypto Assets and Certain Transactions Involving Crypto Assets",
    sourceUrl: "https://www.sec.gov/files/rules/interp/2026/33-11412.pdf",
    citation: "SEC/CFTC Release Nos. 33-11412; 34-105020; File No. S7-2026-09",
    topic: "asset-classification",
    summary:
      "Review whether token terms, issuer promises, staking/yield mechanics, wrapping, airdrops, or secondary-market facts require US securities and commodities counsel analysis.",
    triggerFlagIds: ["asset-yield", "retail", "public-launch", "custody"],
    triggerKeywords: ["yield", "investment", "tokenized", "staking", "retail", "public launch", "issuer"],
    evidenceRequests: [
      {
        id: "us-crypto-asset-classification",
        title: "US crypto asset classification and offering analysis",
        reason:
          "Counsel needs token function, issuer promise, transfer, staking/yield, and public-offer facts before external reliance.",
        priority: "P0",
        keywords: ["classification", "howey", "token terms", "issuer promise", "offering", "staking", "yield"]
      },
      {
        id: "us-investor-disclosure-materials",
        title: "US investor disclosure and eligibility evidence",
        reason:
          "Retail, public launch, or investment-like language should be paired with reviewed disclosure, eligibility, and risk-factor evidence.",
        priority: "P0",
        keywords: ["disclosure", "eligibility", "investor", "risk factor", "registration", "exemption"]
      }
    ],
    counselQuestions: [
      "Which token characteristics, promises, or economic rights need US securities and commodities counsel review?",
      "What registration, exemption, or disclosure assumptions should be documented before public launch?"
    ],
    localCounselRole: "US securities / commodities counsel",
    effectiveAsOf: "2026-03-23",
    lastReviewedAt: "2026-06-30",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "eu-mica-title-ii-white-paper",
    jurisdiction: "European Union",
    regulator: "European Union",
    sourceName: "Regulation (EU) 2023/1114 on markets in crypto-assets",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
    citation: "Regulation (EU) 2023/1114, Title II",
    topic: "marketing",
    summary:
      "Prepare crypto-asset white paper, public communication, disclosure provenance, and management approval evidence for EU crypto-asset counsel review.",
    triggerFlagIds: ["asset-yield", "retail", "public-launch", "evidence-anchor"],
    triggerKeywords: ["european union", "eu", "whitepaper", "white paper", "public communication", "crypto-asset"],
    evidenceRequests: [
      {
        id: "eu-mica-white-paper-public-communication",
        title: "EU crypto-asset white paper and public communication evidence",
        reason:
          "EU launch review needs white paper, public communication, risk disclosure, and source-lineage support before external reliance.",
        priority: "P1",
        keywords: ["whitepaper", "white paper", "public communication", "disclosure", "risk disclosure"]
      },
      {
        id: "eu-mica-management-approval-provenance",
        title: "EU management approval and disclosure provenance evidence",
        reason:
          "Counsel needs evidence of approval, control owner, and manifest provenance for external crypto-asset communications.",
        priority: "P1",
        keywords: ["management approval", "provenance", "manifest", "source lineage"]
      }
    ],
    counselQuestions: [
      "Which MiCA white paper or public communication requirements should local EU counsel map to this launch?",
      "What evidence proves management review, source lineage, and risk-disclosure control?"
    ],
    localCounselRole: "EU crypto-asset / data protection counsel",
    effectiveAsOf: "2024-12-30",
    lastReviewedAt: "2026-06-30",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "uk-fca-crypto-financial-promotions",
    jurisdiction: "United Kingdom",
    regulator: "Financial Conduct Authority",
    sourceName: "PS23/6 Financial promotion rules for cryptoassets and FG23/3 guidance",
    sourceUrl: "https://www.fca.org.uk/publications/policy-statements/ps23-6-financial-promotion-rules-cryptoassets",
    citation: "FCA PS23/6 and FG23/3",
    topic: "marketing",
    summary:
      "Prepare UK cryptoasset financial promotion review materials, route evidence for fair-clear-not-misleading review, and document retail access controls.",
    triggerFlagIds: ["asset-yield", "retail", "public-launch"],
    triggerKeywords: ["united kingdom", "uk", "retail", "marketing", "promotion", "public launch"],
    evidenceRequests: [
      {
        id: "uk-fca-promotion-approval-pack",
        title: "UK financial promotion approval pack",
        reason:
          "Retail marketing needs reviewed promotion copy, approval route, risk warning, and restriction evidence before external reliance.",
        priority: "P1",
        keywords: ["financial promotion", "marketing approval", "approval pack", "risk warning", "fair clear not misleading"]
      },
      {
        id: "uk-fca-client-categorisation-appropriateness",
        title: "UK client categorisation and appropriateness evidence",
        reason:
          "Retail access should be paired with client categorisation, appropriateness, and positive-friction evidence for counsel review.",
        priority: "P1",
        keywords: ["client categorisation", "appropriateness", "positive friction", "eligibility", "retail"]
      }
    ],
    counselQuestions: [
      "Which communication route and approval route applies to UK-facing cryptoasset promotions?",
      "What evidence supports risk warnings, restrictions, client categorisation, and appropriateness controls?"
    ],
    localCounselRole: "UK financial promotion / crypto counsel",
    effectiveAsOf: "2023-10-08",
    lastReviewedAt: "2026-06-30",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "sg-mas-psn02-dpt-aml-cft",
    jurisdiction: "Singapore",
    regulator: "Monetary Authority of Singapore",
    sourceName: "Notice PSN02 and Guidelines to Notice PSN02 for digital payment token services",
    sourceUrl: "https://www.mas.gov.sg/regulation/notices/psn02-aml-cft-notice---digital-payment-token-service",
    citation: "MAS Notice PSN02 and Guidelines to Notice PSN02",
    topic: "aml-cft",
    summary:
      "Prepare digital payment token AML/CFT, customer due diligence, sanctions, transaction monitoring, and data-minimization evidence for Singapore counsel review.",
    triggerFlagIds: ["sensitive-data", "custody", "retail", "public-launch"],
    triggerKeywords: ["singapore", "dpt", "digital payment token", "kyc", "aml", "cft", "sanctions"],
    evidenceRequests: [
      {
        id: "sg-psn02-aml-risk-assessment",
        title: "Singapore DPT AML/CFT risk assessment and CDD evidence",
        reason:
          "Singapore digital payment token review needs AML/CFT risk assessment, CDD, sanctions, and transaction-monitoring handoff evidence.",
        priority: "P1",
        keywords: ["aml", "cft", "risk assessment", "cdd", "sanctions", "transaction monitoring"]
      },
      {
        id: "sg-psn02-data-redaction-handoff",
        title: "Singapore data redaction and model handoff evidence",
        reason:
          "KYC and wallet-history metadata should be separated from model payloads and export packets before counsel reliance.",
        priority: "P1",
        keywords: ["redaction", "data handling", "model payload", "kyc", "wallet history", "access control"]
      }
    ],
    counselQuestions: [
      "Which DPT service facts and AML/CFT controls need Singapore counsel review?",
      "How are KYC, sanctions, and wallet-history records separated from AI and export workflows?"
    ],
    localCounselRole: "Singapore fintech / digital asset counsel",
    effectiveAsOf: "2025-06-30",
    lastReviewedAt: "2026-06-30",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "ch-finma-ico-token-classification",
    jurisdiction: "Switzerland",
    regulator: "FINMA",
    sourceName: "FINMA ICO Guidelines",
    sourceUrl: "https://www.finma.ch/en/news/2018/02/20180216-mm-ico-wegleitung/",
    citation: "FINMA ICO Guidelines, 16 February 2018",
    topic: "asset-classification",
    summary:
      "Prepare payment, utility, asset, and hybrid-token classification evidence for Swiss DLT and financial services counsel review.",
    triggerFlagIds: ["asset-yield", "retail", "public-launch", "evidence-anchor"],
    triggerKeywords: ["switzerland", "swiss", "ico", "token classification", "asset token", "utility token", "payment token"],
    evidenceRequests: [
      {
        id: "ch-token-classification-memo",
        title: "Swiss token classification memo",
        reason:
          "Swiss review needs token function, economic rights, transfer, fundraising, and hybrid-token assumptions for counsel intake.",
        priority: "P1",
        keywords: ["token classification", "asset token", "utility token", "payment token", "hybrid", "fundraising"]
      },
      {
        id: "ch-prospectus-offering-governance",
        title: "Swiss offering, prospectus, and governance evidence",
        reason:
          "Public or investment-like launches need offering, prospectus-intake, foundation, and governance evidence for local counsel.",
        priority: "P1",
        keywords: ["prospectus", "offering memo", "foundation", "governance", "eligibility", "disclosure"]
      }
    ],
    counselQuestions: [
      "Which payment, utility, asset, or hybrid token features need Swiss counsel classification?",
      "What offering, foundation, governance, and prospectus assumptions should be included in the handoff?"
    ],
    localCounselRole: "Swiss DLT / financial services counsel",
    effectiveAsOf: "2018-02-16",
    lastReviewedAt: "2026-06-30",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "uae-vara-va-regulations-activity-scope",
    jurisdiction: "United Arab Emirates",
    regulator: "Dubai Virtual Assets Regulatory Authority",
    sourceName: "VARA Virtual Assets and Related Activities Regulations 2023",
    sourceUrl: "https://rulebooks.vara.ae/rulebook/virtual-assets-and-related-activities-regulations-2023",
    citation: "VARA Virtual Assets and Related Activities Regulations 2023",
    topic: "marketing",
    summary:
      "Prepare virtual asset issuance, activity scope, marketing, licensing, AML/CFT, market conduct, and confidentiality review evidence for UAE local counsel.",
    triggerFlagIds: ["asset-yield", "retail", "public-launch", "custody"],
    triggerKeywords: ["united arab emirates", "uae", "dubai", "virtual asset", "marketing", "issuance"],
    evidenceRequests: [
      {
        id: "uae-vara-activity-scope-licensing",
        title: "UAE virtual asset activity scope and licensing evidence",
        reason:
          "UAE review needs virtual asset activity scope, issuance, marketing, and licensing assumptions before external reliance.",
        priority: "P1",
        keywords: ["virtual asset", "activity scope", "issuance", "licensing", "regulated activity"]
      },
      {
        id: "uae-vara-marketing-access-control",
        title: "UAE marketing and cross-border access evidence",
        reason:
          "Retail or cross-border access needs marketing, promotion, eligibility, and access-control evidence for local counsel.",
        priority: "P1",
        keywords: ["marketing", "promotion", "cross-border", "eligibility", "access control", "retail"]
      }
    ],
    counselQuestions: [
      "Which virtual asset activity and licensing assumptions need UAE local counsel review?",
      "What marketing, cross-border access, and retail-control evidence should be included in the handoff?"
    ],
    localCounselRole: "UAE virtual-assets / financial regulatory counsel",
    effectiveAsOf: "2025-06-19",
    lastReviewedAt: "2026-06-30",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "uae-vara-compliance-risk-management",
    jurisdiction: "United Arab Emirates",
    regulator: "Dubai Virtual Assets Regulatory Authority",
    sourceName: "VARA Compliance and Risk Management Rulebook",
    sourceUrl: "https://rulebooks.vara.ae/rulebook/compliance-and-risk-management-rulebook",
    citation: "VARA Compliance and Risk Management Rulebook",
    topic: "custody",
    summary:
      "Prepare compliance management, AML/CFT, books and records, audit, client money, client virtual asset, and proof-of-reserves evidence for UAE review.",
    triggerFlagIds: ["custody", "sensitive-data", "public-launch"],
    triggerKeywords: ["uae", "dubai", "custody", "client virtual assets", "proof of reserves", "aml"],
    evidenceRequests: [
      {
        id: "uae-vara-compliance-risk-controls",
        title: "UAE compliance, AML/CFT, and audit control evidence",
        reason:
          "UAE operating review needs compliance management, AML/CFT, books and records, audit, and reporting evidence.",
        priority: "P1",
        keywords: ["compliance", "aml", "cft", "books and records", "audit", "reporting", "risk management"]
      },
      {
        id: "uae-vara-client-va-custody-controls",
        title: "UAE client virtual asset custody and proof-of-reserves evidence",
        reason:
          "Custody review needs client virtual asset treatment, reconciliation, wallet control, and proof-of-reserves evidence.",
        priority: "P1",
        keywords: ["client virtual asset", "proof of reserves", "reconciliation", "wallet control", "custody"]
      }
    ],
    counselQuestions: [
      "What compliance, AML/CFT, records, audit, and reporting controls should be ready for UAE counsel?",
      "How are client virtual assets, wallet controls, reconciliation, and proof-of-reserves evidence documented?"
    ],
    localCounselRole: "UAE virtual-assets / financial regulatory counsel",
    effectiveAsOf: "2025-06-19",
    lastReviewedAt: "2026-06-30",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  }
];

export function listRegulatoryClauses(): RegulatoryClause[] {
  return REGULATORY_CLAUSES;
}
