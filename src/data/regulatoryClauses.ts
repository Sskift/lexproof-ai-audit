export type RegulatoryClauseTopic =
  | "asset-classification"
  | "marketing"
  | "custody"
  | "data"
  | "aml-cft"
  | "ai-governance"
  | "governance"
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
  reviewerNotes: string;
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
    reviewerNotes:
      "Source metadata reviewed for citation, URL, trigger facts, and evidence-request routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-sec-dao-report-governance-token-review",
    jurisdiction: "United States",
    regulator: "U.S. Securities and Exchange Commission",
    sourceName: "Report of Investigation Pursuant to Section 21(a): The DAO",
    sourceUrl: "https://www.sec.gov/files/litigation/investreport/34-81207.pdf",
    citation: "SEC Release No. 81207, The DAO Report, July 25, 2017",
    topic: "governance",
    summary:
      "Prepare DAO token, governance-rights, voting, project-funding, participant-role, and execution-control evidence for US digital asset securities counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "dao",
      "decentralized autonomous",
      "decentralised autonomous",
      "token-gated",
      "governance token",
      "governance workflow",
      "voting window"
    ],
    evidenceRequests: [
      {
        id: "us-dao-token-rights-participant-roles",
        title: "US DAO token rights and participant-role evidence",
        reason:
          "DAO review needs governance-token rights, participant roles, project-funding assumptions, contributor authority, and secondary-transfer facts before counsel reliance.",
        priority: "P0",
        keywords: ["governance proposal", "proposal scope", "token-gated", "governance token", "participant", "contributor", "project funding"]
      },
      {
        id: "us-dao-voting-execution-controls",
        title: "US DAO voting and execution-control evidence",
        reason:
          "Counsel needs voting, quorum, signer, multisig, execution, proposal-hash, and emergency authority evidence for DAO governance review.",
        priority: "P1",
        keywords: ["quorum", "voting window", "vote", "execution", "signer", "multisig", "proposal hash", "emergency authority"]
      }
    ],
    counselQuestions: [
      "Which DAO token, participant-role, voting, funding, or transfer facts should US digital asset securities counsel review?",
      "What evidence connects proposal approval, signer authority, execution receipts, and participant communications without treating the workflow as legally approved?"
    ],
    localCounselRole: "US DAO / digital asset securities counsel",
    effectiveAsOf: "2017-07-25",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed against SEC Release No. 81207 for DAO token, voting, capital-raising, participant-role, and execution-control evidence routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-sec-reg-d-accredited-investor-verification",
    jurisdiction: "United States",
    regulator: "U.S. Securities and Exchange Commission",
    sourceName: "Regulation D Rule 506(c) and accredited investor definitions",
    sourceUrl:
      "https://www.ecfr.gov/current/title-17/chapter-II/part-230/subject-group-ECFR6e651a4c86c0174/section-230.506",
    citation: "17 C.F.R. 230.501(a), 230.506(c)",
    topic: "asset-classification",
    summary:
      "Prepare private offering, accredited-investor, solicitation, eligibility, subscription, and verification evidence for US securities counsel review of tokenized private-credit or RWA launch facts.",
    triggerFlagIds: ["asset-yield"],
    triggerKeywords: [
      "accredited investor",
      "accredited investors",
      "private credit",
      "private offering",
      "regulation d",
      "rule 506",
      "subscription",
      "investor eligibility"
    ],
    evidenceRequests: [
      {
        id: "us-reg-d-offering-exemption-investor-eligibility",
        title: "US Regulation D offering exemption and investor eligibility evidence",
        reason:
          "US RWA or tokenized private-credit review needs offering route, exemption assumptions, purchaser eligibility, restriction, and subscription-flow evidence before counsel reliance.",
        priority: "P0",
        keywords: [
          "regulation d",
          "rule 506",
          "offering exemption",
          "private placement",
          "investor eligibility",
          "eligibility",
          "subscription"
        ]
      },
      {
        id: "us-accredited-investor-verification-solicitation-controls",
        title: "US accredited-investor verification and solicitation-controls evidence",
        reason:
          "If public communications or broader solicitation are in scope, counsel needs accredited-investor verification, solicitation-control, purchaser-status, and approval-route evidence.",
        priority: "P0",
        keywords: [
          "accredited investor",
          "verification",
          "general solicitation",
          "solicitation",
          "purchaser status",
          "approval route",
          "investor eligibility review"
        ]
      }
    ],
    counselQuestions: [
      "Which private-offering, purchaser-eligibility, solicitation, or investor-verification assumptions should US securities counsel review?",
      "What evidence shows the offering route, subscription flow, purchaser status, restrictions, and communication approvals without treating the project as legally approved?"
    ],
    localCounselRole: "US private offering / securities counsel",
    effectiveAsOf: "2026-07-01",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed against current eCFR Rule 506(c) and Rule 501(a) references for accredited-investor and offering-evidence routing; route interpretation to US securities counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-ofac-virtual-currency-sanctions-compliance",
    jurisdiction: "United States",
    regulator: "U.S. Department of the Treasury / OFAC",
    sourceName: "Sanctions Compliance Guidance for the Virtual Currency Industry",
    sourceUrl: "https://ofac.treasury.gov/media/913571/download?inline=",
    citation: "OFAC Sanctions Compliance Guidance for the Virtual Currency Industry, October 2021",
    topic: "aml-cft",
    summary:
      "Prepare virtual-currency sanctions risk assessment, wallet screening, geolocation, blocked-property escalation, reporting, and recordkeeping evidence for US sanctions counsel review.",
    triggerFlagIds: ["custody", "sensitive-data"],
    triggerKeywords: [
      "ofac",
      "sanctions",
      "sanctions screening",
      "wallet risk",
      "wallet transaction history",
      "blocked property",
      "virtual currency sanctions"
    ],
    evidenceRequests: [
      {
        id: "us-ofac-wallet-sanctions-screening-risk-assessment",
        title: "US OFAC wallet sanctions screening and risk assessment evidence",
        reason:
          "US virtual-currency sanctions review needs wallet-screening scope, onboarding and transaction screening, geolocation, risk assessment, and internal-control evidence before counsel reliance.",
        priority: "P0",
        keywords: [
          "ofac",
          "sanctions screening",
          "wallet screening",
          "wallet risk",
          "risk assessment",
          "geolocation",
          "internal controls"
        ]
      },
      {
        id: "us-ofac-blocked-property-escalation-reporting",
        title: "US OFAC blocked-property escalation and reporting evidence",
        reason:
          "Counsel and compliance review need blocked-property escalation, denial of access, reporting, licensing, recordkeeping, audit, and reviewer-owner evidence for virtual-currency workflows.",
        priority: "P0",
        keywords: [
          "blocked property",
          "blocking",
          "deny access",
          "reporting",
          "recordkeeping",
          "licensing",
          "escalation",
          "reviewer owner"
        ]
      }
    ],
    counselQuestions: [
      "Which wallet-screening, geolocation, sanctions-list, and transaction-monitoring controls should US sanctions counsel review?",
      "What blocked-property, reporting, recordkeeping, escalation, and reviewer-owner evidence should be retained without storing raw KYC or wallet secrets?"
    ],
    localCounselRole: "US sanctions / virtual-currency compliance counsel",
    effectiveAsOf: "2021-10-15",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed against OFAC virtual-currency sanctions compliance guidance for wallet screening, sanctions-risk assessment, blocked-property handling, reporting, and recordkeeping evidence routing; route interpretation to US sanctions counsel.",
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
    reviewerNotes:
      "Source metadata reviewed for citation, URL, trigger facts, and evidence-request routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-ftc-endorsement-advertising-guides",
    jurisdiction: "United States",
    regulator: "Federal Trade Commission",
    sourceName: "Guides Concerning the Use of Endorsements and Testimonials in Advertising",
    sourceUrl: "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255",
    citation: "16 C.F.R. Part 255",
    topic: "marketing",
    summary:
      "Prepare advertising claims, endorsement, testimonial, material-connection, disclosure, and substantiation evidence for US marketing and consumer-protection counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "marketing",
      "promotion",
      "promotional",
      "claim",
      "claims",
      "advertising",
      "endorsement",
      "testimonial",
      "influencer",
      "creator",
      "material connection"
    ],
    evidenceRequests: [
      {
        id: "us-advertising-claims-substantiation-disclosure",
        title: "US advertising claims substantiation and disclosure evidence",
        reason:
          "US marketing review needs claim inventory, substantiation source, risk disclosure, channel, audience, and reviewer evidence before external reliance.",
        priority: "P0",
        keywords: ["claim inventory", "claims substantiation", "advertising claim", "risk disclosure", "reviewer", "channel", "audience"]
      },
      {
        id: "us-endorsement-material-connection-disclosure",
        title: "US endorsement and material-connection disclosure evidence",
        reason:
          "Endorsement or creator-led campaigns should retain material-connection disclosures, testimonial controls, approval routing, and monitoring evidence for counsel review.",
        priority: "P0",
        keywords: ["endorsement", "testimonial", "material connection", "creator", "influencer", "approval routing", "monitoring"]
      }
    ],
    counselQuestions: [
      "Which advertising claims, endorsements, testimonials, or creator disclosures should US advertising counsel review?",
      "What evidence supports claim substantiation, material-connection disclosures, channel approvals, and monitoring before launch?"
    ],
    localCounselRole: "US advertising / consumer protection counsel",
    effectiveAsOf: "2023-07-26",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed against FTC Endorsement Guides, 16 C.F.R. Part 255, for claims, endorsements, material connections, and evidence-request routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "eu-mica-casp-custody-administration",
    jurisdiction: "European Union",
    regulator: "European Union / ESMA",
    sourceName: "Regulation (EU) 2023/1114 on markets in crypto-assets",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
    citation: "Regulation (EU) 2023/1114, Article 75",
    topic: "custody",
    summary:
      "Prepare crypto-asset service provider custody and administration evidence for EU local counsel review, including custody policy, client-asset access controls, return procedures, and delegation assumptions.",
    triggerFlagIds: ["custody"],
    triggerKeywords: [
      "casp",
      "crypto-asset service provider",
      "client crypto-asset",
      "custody administration",
      "omnibus wallet",
      "wallet custody"
    ],
    evidenceRequests: [
      {
        id: "eu-mica-casp-custody-policy",
        title: "EU CASP custody and administration policy evidence",
        reason:
          "EU custody review needs custody agreement, policy summary, wallet authority, signer quorum, means-of-access, and return procedure evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "custody agreement",
          "custody policy",
          "wallet authority",
          "signer quorum",
          "means of access",
          "return procedure",
          "custody and signer control"
        ]
      },
      {
        id: "eu-mica-client-asset-safeguarding",
        title: "EU client crypto-asset safeguarding and access-control evidence",
        reason:
          "Counsel needs client crypto-asset safeguarding, withdrawal approval, emergency pause, incident response, reconciliation, and delegation evidence for custody review.",
        priority: "P1",
        keywords: [
          "client crypto-asset",
          "safeguarding",
          "withdrawal approval",
          "emergency pause",
          "incident response",
          "reconciliation",
          "delegation",
          "custody and signer control"
        ]
      }
    ],
    counselQuestions: [
      "Which MiCA custody and administration obligations should EU local counsel map to this wallet or CASP operating model?",
      "What evidence shows client crypto-assets, wallet authority, access controls, return procedures, and delegation assumptions are ready for review?"
    ],
    localCounselRole: "EU crypto-asset custody / CASP counsel",
    effectiveAsOf: "2024-12-30",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed against MiCA Article 75 custody and administration routing plus ESMA MiCA materials; route interpretation and applicability to EU local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "eu-ai-act-ai-literacy-governance",
    jurisdiction: "European Union",
    regulator: "European Union",
    sourceName: "Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
    citation: "Regulation (EU) 2024/1689, Article 4 and Chapter III",
    topic: "ai-governance",
    summary:
      "Prepare AI literacy, human oversight, source lineage, and risk-control evidence for EU AI workflow review without treating the system output as legal advice.",
    triggerFlagIds: ["ai-workflow"],
    triggerKeywords: ["ai-assisted", "ai drafts", "model", "human review", "source-linked counsel"],
    evidenceRequests: [
      {
        id: "eu-ai-act-ai-use-policy-human-oversight",
        title: "EU AI use policy and human oversight evidence",
        reason:
          "EU AI workflow review needs permitted-use, model-limit, human-review owner, oversight, escalation, and non-advice boundary evidence.",
        priority: "P1",
        keywords: ["ai system use policy", "permitted model use", "human review", "review owner", "non-advice", "oversight", "escalation"]
      },
      {
        id: "eu-ai-act-source-lineage-risk-controls",
        title: "EU AI source lineage and risk-control evidence",
        reason:
          "AI-assisted review should show source lineage, risk management, unsupported-claim handling, audit logs, and reviewer control before counsel reliance.",
        priority: "P1",
        keywords: ["source lineage", "risk management", "unsupported claims", "audit log", "review log", "risk-control"]
      }
    ],
    counselQuestions: [
      "Which AI literacy, human oversight, and source-lineage controls should EU counsel review for this workflow?",
      "What evidence shows model outputs remain draft audit preparation with reviewer authority and escalation paths?"
    ],
    localCounselRole: "EU AI governance / data protection counsel",
    effectiveAsOf: "2024-08-01",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed for citation, URL, Article 4 AI literacy, Chapter III high-risk governance context, and evidence-request routing; route interpretation to local counsel.",
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
    reviewerNotes:
      "Source metadata reviewed for citation, URL, trigger facts, and evidence-request routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "uk-law-commission-dao-scoping-paper",
    jurisdiction: "United Kingdom",
    regulator: "Law Commission of England and Wales",
    sourceName: "Decentralised autonomous organisations (DAOs): scoping paper",
    sourceUrl: "https://lawcom.gov.uk/project/decentralised-autonomous-organisations-daos/",
    citation: "Law Commission DAO scoping paper, 11 July 2024",
    topic: "governance",
    summary:
      "Prepare DAO structure, participant-liability, governance-rule, asset-control, and legal-characterisation evidence for UK commercial and crypto counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "dao",
      "decentralized autonomous",
      "decentralised autonomous",
      "governance workflow",
      "token-gated",
      "multisig",
      "protocol contributors"
    ],
    evidenceRequests: [
      {
        id: "uk-dao-structure-participant-liability",
        title: "UK DAO structure and participant-liability evidence",
        reason:
          "DAO scoping review needs structure, participant role, contributor, foundation, liability, and legal-characterisation evidence before counsel handoff.",
        priority: "P1",
        keywords: ["dao", "participant", "contributor", "foundation", "liability", "legal status", "entity structure", "agreement"]
      },
      {
        id: "uk-dao-governance-asset-control",
        title: "UK DAO governance rules and asset-control evidence",
        reason:
          "Counsel needs governance rules, voting, quorum, multisig signer, asset-control, execution, and emergency-authority evidence for DAO review.",
        priority: "P1",
        keywords: ["governance proposal", "quorum", "vote", "voting window", "multisig", "signer", "asset control", "execution", "emergency authority"]
      }
    ],
    counselQuestions: [
      "Which DAO structure, participant-role, liability, governance-rule, and asset-control facts should UK counsel review?",
      "What evidence shows how proposals, votes, signers, contributors, and execution receipts are governed without implying legal approval?"
    ],
    localCounselRole: "UK DAO / commercial law counsel",
    effectiveAsOf: "2024-07-11",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed against the Law Commission DAO scoping project page for DAO characterisation, participant-exposure, governance, and asset-control evidence routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "uk-ico-ai-data-protection-governance",
    jurisdiction: "United Kingdom",
    regulator: "Information Commissioner's Office",
    sourceName: "Guidance on AI and data protection",
    sourceUrl:
      "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/",
    citation: "ICO Guidance on AI and data protection",
    topic: "data",
    summary:
      "Prepare AI data-protection governance, redaction, transparency, fairness, explainability, and reviewer decision-log evidence for UK counsel review.",
    triggerFlagIds: ["ai-workflow"],
    triggerKeywords: ["ai", "data protection", "personal data", "model", "human review", "legal workflow"],
    evidenceRequests: [
      {
        id: "uk-ico-ai-data-protection-redaction",
        title: "UK AI data-protection and redaction evidence",
        reason:
          "UK AI workflow review needs model-payload redaction, excluded data categories, approved evidence summaries, and data-protection boundary evidence.",
        priority: "P1",
        keywords: ["model payload redaction", "redaction", "excluded data categories", "approved evidence summaries", "data protection", "personal data"]
      },
      {
        id: "uk-ico-ai-explainability-review-log",
        title: "UK AI explainability and reviewer decision log",
        reason:
          "AI-assisted decisions and recommendations should have source lineage, explainability notes, reviewer decisions, approval logs, and override history.",
        priority: "P1",
        keywords: ["source lineage", "explainability", "reviewer", "approval log", "human review", "decision log", "review notes"]
      }
    ],
    counselQuestions: [
      "Which AI data-protection, transparency, fairness, and data-minimisation issues should UK counsel review?",
      "What redaction, source-lineage, and reviewer decision evidence should be retained before counsel handoff?"
    ],
    localCounselRole: "UK AI / data protection counsel",
    effectiveAsOf: "2023-03-15",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed for updated ICO AI guidance structure, fairness, transparency, lawfulness, security and data-minimisation routing; route interpretation to local counsel.",
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
    reviewerNotes:
      "Source metadata reviewed for citation, URL, trigger facts, and evidence-request routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "sg-mas-dpt-customer-asset-safeguards",
    jurisdiction: "Singapore",
    regulator: "Monetary Authority of Singapore",
    sourceName: "Guidelines on Consumer Protection Safeguards by Digital Payment Token Service Providers",
    sourceUrl:
      "https://www.mas.gov.sg/-/media/mas-media-library/regulation/guidelines/pso/ps-g03-guidelines-on-consumer-protection-measures-by-digital-payment-token-service-providers/ps-g03_guidelines-on-consumer-protection-safeguards-by-dpt-service-providers_vf.pdf",
    citation: "MAS Guidelines PS-G03 on consumer protection safeguards by DPT service providers",
    topic: "custody",
    summary:
      "Prepare Singapore DPT customer-asset safeguarding, segregation, custody disclosure, reconciliation, and transfer-control evidence for local counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch"],
    triggerKeywords: [
      "digital payment token",
      "dpt",
      "customer asset",
      "customer assets",
      "customer dpt",
      "customer dpt assets",
      "asset safeguarding",
      "safeguards customer",
      "segregation",
      "custody disclosure",
      "omnibus wallets"
    ],
    evidenceRequests: [
      {
        id: "sg-dpt-customer-asset-segregation-safeguarding",
        title: "Singapore DPT customer asset segregation and safeguarding evidence",
        reason:
          "Singapore DPT custody review needs customer asset segregation, safeguarding, wallet authority, signer quorum, and transfer-control evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "customer asset",
          "customer assets",
          "segregation",
          "safeguarding",
          "wallet authority",
          "signer quorum",
          "transfer control",
          "custody and signer control"
        ]
      },
      {
        id: "sg-dpt-custody-disclosure-reconciliation",
        title: "Singapore DPT custody disclosure and reconciliation evidence",
        reason:
          "Counsel needs custody arrangement disclosure, reconciliation, withdrawal approval, emergency pause, incident response, and customer asset return evidence for Singapore review.",
        priority: "P1",
        keywords: [
          "custody disclosure",
          "reconciliation",
          "withdrawal approval",
          "emergency pause",
          "incident response",
          "return",
          "custody and signer control"
        ]
      }
    ],
    counselQuestions: [
      "Which MAS DPT customer-asset safeguarding and segregation controls should Singapore counsel review for this custody model?",
      "What evidence shows custody disclosure, reconciliation, wallet authority, transfer approvals, and customer asset return paths are ready for review?"
    ],
    localCounselRole: "Singapore DPT custody / payment services counsel",
    effectiveAsOf: "2024-10-04",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed from MAS PS-G03 consumer protection safeguards and MAS DPT regulatory measures; route applicability and implementation timing to Singapore local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "hk-sfc-vatp-client-asset-custody",
    jurisdiction: "Hong Kong",
    regulator: "Securities and Futures Commission of Hong Kong",
    sourceName: "Guidelines for Virtual Asset Trading Platform Operators",
    sourceUrl:
      "https://www.sfc.hk/-/media/EN/assets/components/codes/files-current/web/guidelines/Guidelines-for-Virtual-Asset-Trading-Platform-Operators/Guidelines-for-Virtual-Asset-Trading-Platform-Operators.pdf",
    citation: "SFC Guidelines for Virtual Asset Trading Platform Operators, Part X",
    topic: "custody",
    summary:
      "Prepare Hong Kong VATP client-asset custody, associated-entity trust holding, wallet segregation, reconciliation, cold-storage, key-control, monitoring, and compensation evidence for local counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "hong kong",
      "hk",
      "vatp",
      "virtual asset trading platform",
      "client virtual assets",
      "client asset",
      "client assets",
      "associated entity",
      "cold storage",
      "compensation arrangement"
    ],
    evidenceRequests: [
      {
        id: "hk-vatp-client-asset-associated-entity-custody",
        title: "Hong Kong VATP client asset custody and associated-entity evidence",
        reason:
          "Hong Kong VATP custody review needs associated-entity trust holding, client asset segregation, safeguarding, wallet authority, and withdrawal-control evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "associated entity",
          "client asset",
          "client assets",
          "client virtual assets",
          "segregation",
          "safeguarding",
          "wallet authority",
          "withdrawal approval",
          "custody and signer control"
        ]
      },
      {
        id: "hk-vatp-wallet-reconciliation-compensation",
        title: "Hong Kong VATP wallet control, reconciliation, and compensation evidence",
        reason:
          "Counsel needs wallet segregation, cold-storage, key-management, reconciliation, internal audit, monitoring, incident response, and compensation-arrangement evidence for Hong Kong VATP review.",
        priority: "P1",
        keywords: [
          "cold storage",
          "key management",
          "reconciliation",
          "internal audit",
          "monitoring",
          "incident response",
          "compensation arrangement",
          "custody and signer control"
        ]
      }
    ],
    counselQuestions: [
      "Which SFC VATP client-asset custody, associated-entity, segregation, and wallet-control requirements should Hong Kong counsel review?",
      "What reconciliation, cold-storage, key-management, internal-audit, and compensation-arrangement evidence should be included without storing raw wallet secrets or KYC?"
    ],
    localCounselRole: "Hong Kong virtual asset trading platform counsel",
    effectiveAsOf: "2023-06-01",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed against SFC VATP Guidelines Part X for client asset custody, associated-entity trust holding, segregation, cold-storage, reconciliation, monitoring, and compensation evidence routing; route interpretation to Hong Kong local counsel.",
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
    reviewerNotes:
      "Source metadata reviewed for citation, URL, trigger facts, and evidence-request routing; route interpretation to local counsel.",
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
    reviewerNotes:
      "Source metadata reviewed for citation, URL, trigger facts, and evidence-request routing; route interpretation to local counsel.",
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
    reviewerNotes:
      "Source metadata reviewed for citation, URL, trigger facts, and evidence-request routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "br-bcb-virtual-asset-service-framework",
    jurisdiction: "Brazil",
    regulator: "Banco Central do Brasil",
    sourceName: "Virtual assets regulation",
    sourceUrl: "https://www.bcb.gov.br/en/financialstability/virtualassets",
    citation: "Law No. 14,478/2022 and Banco Central virtual asset service regulation",
    topic: "aml-cft",
    summary:
      "Prepare virtual asset service scope, authorization, AML/CFT, customer protection, sanctions, transaction monitoring, and operational governance evidence for Brazil counsel review.",
    triggerFlagIds: ["custody", "sensitive-data", "retail", "public-launch"],
    triggerKeywords: ["brazil", "brasil", "virtual asset service", "vasp", "kyc", "aml", "cft", "sanctions"],
    evidenceRequests: [
      {
        id: "br-vasp-scope-authorization-intake",
        title: "Brazil virtual asset service scope and authorization intake",
        reason:
          "Brazil virtual asset review needs activity scope, authorization assumptions, custody boundaries, transfer controls, and responsible owner evidence.",
        priority: "P1",
        keywords: ["virtual asset service", "authorization", "activity scope", "custody boundaries", "transfer controls", "responsible owner"]
      },
      {
        id: "br-vasp-aml-cft-monitoring-evidence",
        title: "Brazil AML/CFT, sanctions, and monitoring evidence",
        reason:
          "Counsel and compliance review need AML/CFT, sanctions, transaction-monitoring, customer-protection, and data-minimization handoff evidence.",
        priority: "P1",
        keywords: ["aml", "cft", "sanctions", "transaction monitoring", "customer protection", "data minimization"]
      }
    ],
    counselQuestions: [
      "Which virtual asset service activities, authorization assumptions, and custody boundaries need Brazil counsel review?",
      "What AML/CFT, sanctions, monitoring, customer-protection, and data-minimization evidence should be included before handoff?"
    ],
    localCounselRole: "Brazil virtual-assets / financial regulatory counsel",
    effectiveAsOf: "2026-02-02",
    lastReviewedAt: "2026-06-30",
    reviewerNotes:
      "Source metadata reviewed for Banco Central virtual asset service regulation, Law No. 14,478/2022 routing, trigger facts, and evidence-request mapping; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "br-cvm-crypto-asset-securities-guidance",
    jurisdiction: "Brazil",
    regulator: "Comissao de Valores Mobiliarios",
    sourceName: "CVM Guidance Opinion 40 on crypto-assets and securities markets",
    sourceUrl: "https://conteudo.cvm.gov.br/legislacao/pareceres-orientacao/pare040.html",
    citation: "CVM Guidance Opinion 40, 11 October 2022",
    topic: "asset-classification",
    summary:
      "Prepare crypto-asset securities characterization, public distribution, disclosure, intermediary, and investor communication evidence for Brazil capital-markets counsel review.",
    triggerFlagIds: ["asset-yield", "retail", "public-launch", "evidence-anchor"],
    triggerKeywords: ["brazil", "brasil", "crypto asset", "security token", "public distribution", "investment", "tokenized"],
    evidenceRequests: [
      {
        id: "br-cvm-crypto-security-classification",
        title: "Brazil crypto-security classification and disclosure evidence",
        reason:
          "Brazil capital-markets review needs token rights, investment expectation, public distribution, disclosure, and intermediary assumptions before external reliance.",
        priority: "P1",
        keywords: ["crypto security", "token rights", "investment expectation", "public distribution", "disclosure", "intermediary"]
      },
      {
        id: "br-cvm-public-communication-review",
        title: "Brazil investor communication and distribution review evidence",
        reason:
          "Retail or public distribution should be paired with reviewed investor communication, risk-factor, eligibility, and approval-route evidence.",
        priority: "P1",
        keywords: ["investor communication", "risk factor", "eligibility", "approval route", "distribution", "retail"]
      }
    ],
    counselQuestions: [
      "Which token rights, yield mechanics, or distribution facts should Brazil capital-markets counsel review under CVM crypto-asset guidance?",
      "What disclosure, investor communication, intermediary, and approval-route evidence should be retained before launch?"
    ],
    localCounselRole: "Brazil capital markets / crypto-asset counsel",
    effectiveAsOf: "2022-10-11",
    lastReviewedAt: "2026-06-30",
    reviewerNotes:
      "Source metadata reviewed for CVM Guidance Opinion 40 citation, URL, token/securities characterization triggers, and evidence-request routing; route interpretation to local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  }
];

export function listRegulatoryClauses(): RegulatoryClause[] {
  return REGULATORY_CLAUSES;
}
