export type RegulatoryClauseTopic =
  | "asset-classification"
  | "marketing"
  | "activity-scope"
  | "custody"
  | "data"
  | "aml-cft"
  | "ai-governance"
  | "governance"
  | "operational-resilience"
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
    id: "us-cftc-ooki-dao-defi-derivatives-platform",
    jurisdiction: "United States",
    regulator: "Commodity Futures Trading Commission",
    sourceName: "CFTC bZeroX / Ooki DAO enforcement action and default judgment",
    sourceUrl: "https://www.cftc.gov/PressRoom/PressReleases/8590-22",
    citation: "CFTC Release No. 8590-22; CFTC v. Ooki DAO default judgment, June 8, 2023",
    topic: "governance",
    summary:
      "Prepare DAO protocol, leveraged or margined retail commodity transaction, trading-interface, FCM activity, BSA/CIP, control-transfer, and governance-participant evidence for US commodities and derivatives counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "leveraged retail commodity",
      "margined retail commodity",
      "leveraged",
      "margined",
      "perpetual",
      "defi trading",
      "trading platform",
      "fcm",
      "commodity interest",
      "customer identification program",
      "ooki",
      "bzerox"
    ],
    evidenceRequests: [
      {
        id: "us-cftc-dao-derivatives-platform-scope",
        title: "US CFTC DAO derivatives-platform scope evidence",
        reason:
          "DAO review needs protocol purpose, leveraged or margined retail commodity transaction assumptions, trading-interface scope, FCM activity, commodity-interest handling, and US user access evidence before counsel reliance.",
        priority: "P0",
        keywords: [
          "cftc dao derivatives",
          "leveraged retail commodity",
          "margined retail commodity",
          "defi trading",
          "trading platform",
          "fcm",
          "commodity interest",
          "us user access"
        ]
      },
      {
        id: "us-cftc-dao-bsa-control-transfer-governance",
        title: "US CFTC DAO BSA/CIP and governance-control evidence",
        reason:
          "Counsel needs BSA/CIP assumptions, protocol control-transfer history, governance-member participation, website/domain operation, proposal execution, and compliance-owner evidence without raw customer records.",
        priority: "P1",
        keywords: [
          "bsa cip",
          "customer identification program",
          "control transfer",
          "successor dao",
          "governance member",
          "website domain",
          "proposal execution",
          "no raw customer records"
        ]
      }
    ],
    counselQuestions: [
      "Which protocol, trading-interface, leverage, margin, commodity-interest, FCM, or US user-access assumptions should US commodities and derivatives counsel review?",
      "What evidence shows BSA/CIP boundaries, protocol control transfer, governance participation, and execution authority without storing raw customer records or implying legal approval?"
    ],
    localCounselRole: "US commodities / DAO derivatives counsel",
    effectiveAsOf: "2023-06-08",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against CFTC Release No. 8590-22 and CFTC v. Ooki DAO default-judgment materials for DAO protocol, leveraged or margined retail commodity transaction, FCM, BSA/CIP, control-transfer, and governance-participant evidence routing; route interpretation to US commodities and derivatives counsel.",
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
    id: "us-fincen-cvc-msb-bsa-travel-rule",
    jurisdiction: "United States",
    regulator: "Financial Crimes Enforcement Network (FinCEN)",
    sourceName: "Application of FinCEN's Regulations to Certain Business Models Involving Convertible Virtual Currencies",
    sourceUrl:
      "https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-certain-business-models",
    citation: "FinCEN FIN-2019-G001; 31 C.F.R. 1022.210; 31 C.F.R. 1010.410(e)-(f)",
    topic: "aml-cft",
    summary:
      "Prepare convertible virtual currency business-model, money transmission, MSB registration, AML program, transfer recordkeeping, and Travel Rule handoff evidence for US BSA/FinCEN counsel review.",
    triggerFlagIds: ["custody"],
    triggerKeywords: [
      "fincen",
      "cvc",
      "convertible virtual currency",
      "money transmission",
      "money services business",
      "msb",
      "hosted wallet",
      "customer wallet activity",
      "virtual asset transfer",
      "virtual asset transfer approvals",
      "wallet transaction history",
      "travel rule",
      "transmittal of funds"
    ],
    evidenceRequests: [
      {
        id: "us-fincen-cvc-msb-activity-scope-aml-program",
        title: "US FinCEN CVC MSB activity-scope and AML program evidence",
        reason:
          "US CVC review needs business-model, hosted-wallet, money-transmission, MSB registration, AML program, compliance officer, training, independent review, and transaction-monitoring evidence before counsel reliance.",
        priority: "P0",
        keywords: [
          "fincen",
          "cvc",
          "business model",
          "hosted wallet",
          "money transmission",
          "msb",
          "registration",
          "aml program",
          "compliance officer",
          "independent review",
          "transaction monitoring"
        ]
      },
      {
        id: "us-fincen-bsa-transfer-recordkeeping-travel-rule",
        title: "US FinCEN BSA transfer recordkeeping and Travel Rule handoff evidence",
        reason:
          "Counsel and compliance review need metadata-only transfer recordkeeping, originator/beneficiary information handling, SAR/CTR escalation, retention, and reviewer-owner evidence without raw KYC or full wallet histories.",
        priority: "P0",
        keywords: [
          "fincen bsa",
          "bsa transfer",
          "transfer recordkeeping",
          "transmittal recordkeeping",
          "sar and ctr",
          "cvc msb transfer"
        ]
      }
    ],
    counselQuestions: [
      "Which CVC business-model, hosted-wallet, money-transmission, MSB registration, or BSA AML program assumptions should US FinCEN/BSA counsel review?",
      "What transfer recordkeeping, Travel Rule, SAR/CTR escalation, retention, and reviewer-owner evidence should be retained without exporting raw KYC or full wallet histories?"
    ],
    localCounselRole: "US FinCEN / BSA virtual-currency counsel",
    effectiveAsOf: "2019-05-09",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against FinCEN FIN-2019-G001 and current eCFR MSB AML program plus funds-transfer recordkeeping references for CVC activity-scope and BSA evidence routing; route interpretation to US FinCEN/BSA counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-nydfs-bitlicense-custody-customer-protection",
    jurisdiction: "United States",
    regulator: "New York Department of Financial Services",
    sourceName: "NYDFS Virtual Currency Business Licensing and Updated Custodial Structures Guidance",
    sourceUrl: "https://www.dfs.ny.gov/virtual_currency_businesses",
    citation: "23 NYCRR Part 200; NYDFS Updated Guidance on Custodial Structures, September 30, 2025",
    topic: "custody",
    summary:
      "Prepare New York virtual-currency business activity, BitLicense or trust-company route, customer asset segregation, beneficial-interest, sub-custody, disclosure, reconciliation, and books-and-records evidence for NYDFS counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "new york",
      "nydfs",
      "bitlicense",
      "new york resident",
      "virtual currency business activity",
      "limited purpose trust company",
      "customer virtual currency",
      "customer asset segregation"
    ],
    evidenceRequests: [
      {
        id: "us-nydfs-vc-business-activity-license-route",
        title: "New York NYDFS virtual-currency business activity and license-route evidence",
        reason:
          "New York virtual-currency review needs activity-scope, New York user or resident access, BitLicense or trust-company route, NMLS/application owner, stablecoin or coin-listing assumptions, and money-transmission handoff evidence before counsel reliance.",
        priority: "P0",
        keywords: [
          "nydfs",
          "bitlicense",
          "new york virtual currency",
          "virtual currency business activity",
          "new york resident",
          "limited purpose trust company",
          "nmls",
          "license route"
        ]
      },
      {
        id: "us-nydfs-custody-segregation-beneficial-interest-disclosure",
        title: "New York NYDFS custody segregation, beneficial-interest, and disclosure evidence",
        reason:
          "NYDFS custody review needs customer virtual currency segregation, omnibus or per-customer wallet accounting, internal ledger, reconciliation, beneficial-interest disclosure, sub-custody approval, books and records, and no-proprietary-use evidence without raw KYC or wallet secrets.",
        priority: "P0",
        keywords: [
          "customer virtual currency",
          "segregation",
          "beneficial interest",
          "omnibus wallet",
          "internal ledger",
          "reconciliation",
          "sub-custody",
          "customer disclosure",
          "books and records",
          "proprietary use"
        ]
      }
    ],
    counselQuestions: [
      "Which New York virtual-currency business activity, New York resident access, BitLicense, trust-company, or money-transmission assumptions should NYDFS counsel review?",
      "What evidence shows customer virtual currency segregation, beneficial-interest disclosure, reconciliation, sub-custody approval, and no proprietary use without exporting raw KYC, customer records, or wallet secrets?"
    ],
    localCounselRole: "New York virtual-currency / NYDFS counsel",
    effectiveAsOf: "2025-09-30",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against the NYDFS virtual-currency business licensing page, 23 NYCRR Part 200 references, and NYDFS updated custodial-structures guidance dated September 30, 2025 for New York activity-scope, license-route, customer asset segregation, sub-custody, disclosure, reconciliation, and books-and-records evidence routing; route interpretation to New York virtual-currency counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-genius-payment-stablecoin-issuer-regime",
    jurisdiction: "United States",
    regulator: "U.S. Department of the Treasury / OCC / primary Federal payment stablecoin regulators",
    sourceName: "GENIUS Act payment stablecoin issuer framework and Treasury implementation rulemaking",
    sourceUrl: "https://home.treasury.gov/news/press-releases/sb0435",
    citation:
      "GENIUS Act, Pub. L. 119-27, 12 U.S.C. 5901 et seq.; Treasury GENIUS Act implementation NPRMs, 2026; OCC Bulletin 2026-3",
    topic: "activity-scope",
    summary:
      "Prepare payment stablecoin issuer, permitted-issuer route, reserve, redemption, BSA/AML, sanctions, state-or-federal oversight, custody, disclosure, and insolvency-priority evidence for US stablecoin counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "payment stablecoin",
      "genius act",
      "permitted payment stablecoin issuer",
      "stablecoin issuer",
      "state qualified payment stablecoin issuer",
      "payment stablecoin issuance",
      "stablecoin reserve",
      "stablecoin redemption"
    ],
    evidenceRequests: [
      {
        id: "us-genius-permitted-issuer-route-reserve-redemption",
        title: "US GENIUS Act permitted-issuer, reserve, and redemption evidence",
        reason:
          "US payment stablecoin review needs issuer status, federal or state route, payment-stablecoin definition, reserve-asset, redemption, monthly disclosure, custody, and insolvency-priority evidence before counsel reliance.",
        priority: "P0",
        keywords: [
          "genius act",
          "payment stablecoin",
          "permitted payment stablecoin issuer",
          "state qualified payment stablecoin issuer",
          "federal payment stablecoin regulator",
          "reserve assets",
          "redemption",
          "monthly disclosure",
          "custody",
          "insolvency priority"
        ]
      },
      {
        id: "us-genius-bsa-aml-sanctions-program",
        title: "US GENIUS Act BSA/AML and sanctions program evidence",
        reason:
          "Treasury implementation review needs metadata-only AML, sanctions, transaction-monitoring, suspicious-activity, compliance-owner, and no-raw-KYC evidence for permitted payment stablecoin issuer handoff.",
        priority: "P0",
        keywords: [
          "bsa",
          "aml",
          "sanctions compliance",
          "permitted payment stablecoin issuer",
          "transaction monitoring",
          "suspicious activity",
          "compliance officer",
          "no raw kyc",
          "ofac",
          "fincen"
        ]
      }
    ],
    counselQuestions: [
      "Which payment stablecoin issuance, permitted-issuer, federal or state oversight, reserve, redemption, or disclosure facts should US stablecoin counsel review?",
      "What BSA/AML, sanctions, transaction-monitoring, custody, and insolvency-priority evidence can be prepared without raw KYC, customer records, credentials, wallet secrets, or personal data?"
    ],
    localCounselRole: "US payment stablecoin / GENIUS Act counsel",
    effectiveAsOf: "2025-07-18",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against Treasury GENIUS Act implementation releases, Treasury state-similarity NPRM materials, and OCC Bulletin 2026-3 for payment stablecoin issuer, permitted-issuer route, reserve, redemption, BSA/AML, sanctions, custody, state/federal oversight, and evidence-routing metadata; route interpretation to US payment stablecoin counsel.",
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
    id: "eu-mica-decentralised-casp-perimeter",
    jurisdiction: "European Union",
    regulator: "European Union / ESMA",
    sourceName: "Regulation (EU) 2023/1114 on markets in crypto-assets - decentralised services and CASP perimeter",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
    citation: "Regulation (EU) 2023/1114, Recital 22 and Article 2(1)",
    topic: "governance",
    summary:
      "Prepare DAO decentralisation, intermediary-control, operator, front-end, admin-key, EU user-access, and crypto-asset service perimeter evidence for EU MiCA counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "dao",
      "decentralized autonomous",
      "decentralised autonomous",
      "decentralised",
      "decentralized",
      "governance workflow",
      "governance token",
      "protocol contributors",
      "front-end",
      "admin key",
      "crypto-asset service"
    ],
    evidenceRequests: [
      {
        id: "eu-mica-dao-decentralisation-intermediary-evidence",
        title: "EU MiCA DAO decentralisation and intermediary evidence",
        reason:
          "EU MiCA DAO review needs decentralisation claims, intermediary, operator, front-end, admin-key, upgrade, governance, and control-owner evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "decentralisation claims",
          "decentralization claims",
          "fully decentralised",
          "fully decentralized",
          "intermediary",
          "operator control",
          "front-end control",
          "admin keys",
          "protocol upgrades",
          "governance votes"
        ]
      },
      {
        id: "eu-mica-dao-casp-service-perimeter-evidence",
        title: "EU MiCA DAO crypto-asset service perimeter evidence",
        reason:
          "Counsel needs EU user access, crypto-asset service perimeter, custody, trading, exchange, advice, marketing, and responsible-owner evidence without raw customer records.",
        priority: "P1",
        keywords: [
          "eu user access",
          "crypto-asset service perimeter",
          "casp perimeter",
          "custody service",
          "trading service",
          "exchange service",
          "advice service",
          "marketing owner",
          "no raw customer records"
        ]
      }
    ],
    counselQuestions: [
      "Which DAO decentralisation, intermediary-control, operator, front-end, admin-key, governance, or upgrade facts should EU MiCA counsel review?",
      "What EU user-access, crypto-asset service perimeter, custody, trading, exchange, advice, marketing, and responsible-owner evidence can be prepared without raw customer records or implying legal approval?"
    ],
    localCounselRole: "EU MiCA DAO / CASP perimeter counsel",
    effectiveAsOf: "2024-12-30",
    lastReviewedAt: "2026-07-04",
    reviewerNotes:
      "Source metadata reviewed against Regulation (EU) 2023/1114 Recital 22 and Article 2(1) for DAO decentralisation, intermediary-control, crypto-asset service perimeter, and evidence-request routing; route interpretation to EU MiCA counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "eu-mica-art-emt-stablecoin-issuer-regime",
    jurisdiction: "European Union",
    regulator: "European Union / EBA / ESMA",
    sourceName: "MiCA asset-referenced token and e-money token issuer requirements",
    sourceUrl: "https://www.eba.europa.eu/regulation-and-policy/asset-referenced-and-e-money-tokens-mica",
    citation: "Regulation (EU) 2023/1114, Titles III-IV, Articles 16, 36, 39, 48, 49, 51, and 55",
    topic: "activity-scope",
    summary:
      "Prepare ART/EMT classification, issuer authorisation, white-paper notification, reserve, custody, redemption, recovery, and competent-authority handoff evidence for EU MiCA stablecoin counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "asset-referenced token",
      "asset referenced token",
      "art issuer",
      "e-money token",
      "electronic money token",
      "emt issuer",
      "euro stablecoin",
      "eur stablecoin",
      "mica stablecoin",
      "stablecoin issuer",
      "stablecoin reserve",
      "stablecoin redemption"
    ],
    evidenceRequests: [
      {
        id: "eu-mica-art-emt-authorisation-white-paper",
        title: "EU MiCA ART/EMT issuer authorisation and white-paper evidence",
        reason:
          "EU stablecoin issuer review needs ART/EMT classification, issuer type, home Member State, competent-authority notification, white-paper, management statement, and public-offer/admission-to-trading assumptions before counsel reliance.",
        priority: "P0",
        keywords: [
          "asset-referenced token",
          "e-money token",
          "art issuer",
          "emt issuer",
          "home member state",
          "competent authority",
          "white paper",
          "authorisation",
          "admission to trading",
          "public offer"
        ]
      },
      {
        id: "eu-mica-art-emt-reserve-redemption-recovery",
        title: "EU MiCA ART/EMT reserve, redemption, and recovery evidence",
        reason:
          "Counsel needs metadata-only reserve composition, operational segregation, custody, liquidity, redemption-right, par-value redemption, recovery-plan, redemption-plan, and no-raw-customer-record evidence for MiCA stablecoin issuer handoff.",
        priority: "P0",
        keywords: [
          "reserve assets",
          "reserve composition",
          "operational segregation",
          "custody of reserve assets",
          "redemption",
          "par value",
          "recovery plan",
          "redemption plan",
          "liquidity management",
          "no raw customer records"
        ]
      }
    ],
    counselQuestions: [
      "Which ART, EMT, issuer-authorisation, home Member State, white-paper, public-offer, or trading-admission assumptions should EU MiCA stablecoin counsel review?",
      "What reserve, custody, redemption, recovery, liquidity, and holder-rights evidence can be prepared without raw customer records, credentials, wallet secrets, or personal data?"
    ],
    localCounselRole: "EU MiCA stablecoin issuer counsel",
    effectiveAsOf: "2024-06-30",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against EBA ART/EMT MiCA materials and ESMA MiCA single rulebook entries for Articles 16, 36, 39, 48, 49, 51, and 55; route interpretation to EU MiCA stablecoin issuer counsel.",
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
        keywords: ["claim inventory", "claims substantiation", "advertising claim", "risk disclosure", "campaign channel"]
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
    id: "eu-mica-marketing-communications",
    jurisdiction: "European Union",
    regulator: "European Union / ESMA",
    sourceName: "Regulation (EU) 2023/1114 on markets in crypto-assets - marketing communications",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
    citation: "Regulation (EU) 2023/1114, Articles 7-8",
    topic: "marketing",
    summary:
      "Prepare crypto-asset marketing communication identification, white-paper consistency, publication timing, host Member State audience, and notification evidence for EU MiCA counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "marketing",
      "promotion",
      "campaign",
      "risk warning",
      "product-positioning",
      "crypto-asset marketing communication",
      "white paper consistency",
      "host member state",
      "member state audience"
    ],
    evidenceRequests: [
      {
        id: "eu-mica-marketing-identification-white-paper-consistency",
        title: "EU MiCA marketing communication identification and white-paper consistency evidence",
        reason:
          "EU crypto-asset marketing review needs marketing-communication labels, claim inventory, white-paper consistency, website/contact references, and reviewer-owner evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "eu mica marketing communication",
          "crypto-asset marketing communication",
          "white paper consistency",
          "communication label",
          "offeror website contact"
        ]
      },
      {
        id: "eu-mica-marketing-notification-publication-timing",
        title: "EU MiCA marketing notification and publication-timing evidence",
        reason:
          "Cross-border EU campaign review needs home/host Member State audience mapping, marketing notification assumptions, publication timing, and source-lineage evidence without raw user onboarding files.",
        priority: "P1",
        keywords: [
          "home member state notification",
          "host member state",
          "marketing communication notification",
          "publication timing",
          "member state audience"
        ]
      }
    ],
    counselQuestions: [
      "Which EU MiCA marketing communication, white-paper consistency, and publication-timing assumptions should EU crypto-asset counsel review?",
      "What evidence shows home or host Member State audience routing, notification assumptions, reviewer ownership, and source lineage without exporting raw audience files?"
    ],
    localCounselRole: "EU crypto-asset marketing counsel",
    effectiveAsOf: "2024-12-30",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against MiCA Articles 7-8 and ESMA's MiCA single rulebook entries for crypto-asset marketing communications, white-paper consistency, notification, host Member State, and publication-timing evidence routing; route interpretation to EU local counsel.",
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
    id: "eu-dora-ict-operational-resilience",
    jurisdiction: "European Union",
    regulator: "European Union / European Supervisory Authorities",
    sourceName: "Regulation (EU) 2022/2554 on digital operational resilience for the financial sector",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng",
    citation: "Regulation (EU) 2022/2554, DORA Articles 5-16, 17-23, and 28",
    topic: "operational-resilience",
    summary:
      "Prepare ICT risk management, major incident reporting, digital operational resilience testing, and ICT third-party risk evidence for EU financial-sector and CASP custody review.",
    triggerFlagIds: ["custody", "sensitive-data"],
    triggerKeywords: [
      "dora",
      "digital operational resilience",
      "ict risk",
      "incident reporting",
      "third-party risk",
      "casp",
      "crypto-asset service provider",
      "client crypto-asset",
      "custody administration"
    ],
    evidenceRequests: [
      {
        id: "eu-dora-ict-risk-management-incident-response",
        title: "EU DORA ICT risk management and incident-response evidence",
        reason:
          "EU operational-resilience review needs ICT risk-management policy, business-continuity runbook, incident classification, escalation owner, testing cadence, and recovery evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "ict risk management",
          "business continuity",
          "incident classification",
          "incident response",
          "escalation owner",
          "testing cadence",
          "recovery"
        ]
      },
      {
        id: "eu-dora-ict-third-party-register",
        title: "EU DORA ICT third-party service register evidence",
        reason:
          "CASP or custody workflows using cloud, wallet, analytics, or model vendors should retain ICT third-party service register, critical-function mapping, subcontracting, access logging, exit, and resilience-testing evidence.",
        priority: "P1",
        keywords: [
          "ict third-party service register",
          "critical function",
          "subcontracting",
          "access logging",
          "exit plan",
          "resilience testing",
          "vendor register"
        ]
      }
    ],
    counselQuestions: [
      "Which DORA ICT risk, incident reporting, testing, and third-party service controls should EU counsel or compliance reviewers map to this CASP or custody workflow?",
      "What evidence shows operational resilience, critical service dependencies, access logging, exit planning, and incident escalation without storing raw credentials or customer records?"
    ],
    localCounselRole: "EU DORA / operational resilience counsel",
    effectiveAsOf: "2025-01-17",
    lastReviewedAt: "2026-07-02",
    reviewerNotes:
      "Source metadata reviewed against the DORA regulation, European Commission DORA implementing/delegated acts page, and EBA operational-resilience materials for ICT risk, incident reporting, testing, and third-party risk evidence routing; route interpretation to EU local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "eu-tfr-crypto-asset-transfer-information",
    jurisdiction: "European Union",
    regulator: "European Union / European Banking Authority",
    sourceName: "Regulation (EU) 2023/1113 on information accompanying transfers of funds and certain crypto-assets",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1113/oj/eng",
    citation: "Regulation (EU) 2023/1113; EBA Travel Rule Guidelines under Regulation (EU) 2023/1113",
    topic: "aml-cft",
    summary:
      "Prepare crypto-asset transfer information, originator/beneficiary handling, missing or incomplete information escalation, and counterparty CASP workflow evidence for EU TFR/Travel Rule counsel review.",
    triggerFlagIds: ["custody", "sensitive-data"],
    triggerKeywords: [
      "transfer of crypto-assets",
      "crypto-asset transfer",
      "travel rule",
      "originator",
      "beneficiary",
      "counterparty casp",
      "casp",
      "wallet transaction history",
      "virtual asset transfer"
    ],
    evidenceRequests: [
      {
        id: "eu-tfr-crypto-asset-transfer-information-register",
        title: "EU TFR crypto-asset transfer information register",
        reason:
          "EU crypto-asset transfer review needs metadata-only transfer information mapping, counterparty CASP handling, Travel Rule transfer-information routing, and source-lineage evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "eu tfr",
          "regulation eu 2023/1113",
          "crypto-asset transfer information",
          "counterparty casp",
          "travel rule transfer information"
        ]
      },
      {
        id: "eu-tfr-missing-incomplete-transfer-information",
        title: "EU TFR missing or incomplete transfer-information handling evidence",
        reason:
          "Counsel and compliance review need procedures for missing or incomplete crypto-asset transfer information, escalation owners, rejection/return handling, retention, and reviewer notes without raw KYC or full wallet histories.",
        priority: "P1",
        keywords: [
          "eu tfr missing information",
          "missing incomplete information",
          "transfer information handling",
          "travel rule exception",
          "counterparty escalation"
        ]
      }
    ],
    counselQuestions: [
      "Which EU TFR crypto-asset transfer information, counterparty CASP, and originator/beneficiary handling assumptions should EU AML/CFT counsel review?",
      "What evidence shows missing or incomplete transfer-information escalation, rejection/return handling, retention, and reviewer ownership without exporting raw KYC or full wallet histories?"
    ],
    localCounselRole: "EU AML/CFT crypto-asset transfer counsel",
    effectiveAsOf: "2024-12-30",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against Regulation (EU) 2023/1113 and EBA Travel Rule Guidelines for crypto-asset transfer information, missing/incomplete information handling, and counterparty CASP evidence routing; route interpretation to EU AML/CFT counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "eu-dlt-pilot-regime-market-infrastructure",
    jurisdiction: "European Union",
    regulator: "European Union / ESMA",
    sourceName: "Regulation (EU) 2022/858 DLT Pilot Regime",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2022/858/oj/eng",
    citation: "Regulation (EU) 2022/858, Articles 2, 4, 5, 6, 7, 8, and 9",
    topic: "activity-scope",
    summary:
      "Prepare DLT financial-instrument perimeter, DLT market infrastructure permission or exemption, admitted-instrument, settlement, safekeeping, and liability-safeguard evidence for EU counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "dlt financial instrument",
      "dlt market infrastructure",
      "dlt mtf",
      "dlt tss",
      "dlt ss",
      "tokenized financial instrument",
      "tokenised financial instrument",
      "tokenized securities",
      "tokenised securities",
      "settlement",
      "market infrastructure",
      "private credit note"
    ],
    evidenceRequests: [
      {
        id: "eu-dlt-financial-instrument-perimeter",
        title: "EU DLT financial-instrument and market-infrastructure perimeter evidence",
        reason:
          "Counsel needs tokenized financial-instrument assumptions, DLT MTF/TSS/SS role, operator entity, competent authority route, and permission or exemption owner before external reliance.",
        priority: "P0",
        keywords: [
          "dlt pilot",
          "dlt financial instrument",
          "tokenized financial instrument",
          "tokenised financial instrument",
          "dlt mtf",
          "dlt tss",
          "dlt ss",
          "market infrastructure",
          "competent authority",
          "permission exemption"
        ]
      },
      {
        id: "eu-dlt-safeguards-settlement-liability",
        title: "EU DLT settlement, safekeeping, and liability safeguard evidence",
        reason:
          "Reviewers need settlement workflow, admitted-instrument perimeter, safekeeping controls, operational safeguards, liability chain, client disclosure, and ESMA or competent-authority handoff metadata without raw investor records.",
        priority: "P1",
        keywords: [
          "dlt settlement",
          "settlement workflow",
          "admitted instrument",
          "safekeeping",
          "liability",
          "operational safeguard",
          "client disclosure",
          "esma",
          "no raw investor records"
        ]
      }
    ],
    counselQuestions: [
      "Which tokenized financial-instrument, DLT MTF/TSS/SS, permission, or exemption assumptions should EU financial-instruments counsel review?",
      "What settlement, safekeeping, operational-safeguard, admitted-instrument, client-disclosure, and liability-chain evidence should be packaged without raw investor records?"
    ],
    localCounselRole: "EU DLT market infrastructure / financial instruments counsel",
    effectiveAsOf: "2023-03-23",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against Regulation (EU) 2022/858 for DLT financial-instrument, DLT market infrastructure status, permission or exemption, settlement, safekeeping, and liability safeguard evidence routing; route interpretation to EU local counsel.",
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
    id: "eu-ai-act-article-50-transparency-disclosure",
    jurisdiction: "European Union",
    regulator: "European Union",
    sourceName: "European Commission AI Act Service Desk Article 50",
    sourceUrl: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50",
    citation: "Regulation (EU) 2024/1689, Article 50",
    topic: "ai-governance",
    summary:
      "Prepare AI-user interaction disclosure, AI-generated output labelling, human editorial-control, and accessibility evidence for EU AI workflow transparency review without converting the output into legal advice.",
    triggerFlagIds: ["ai-workflow"],
    triggerKeywords: [
      "ai-assisted",
      "ai drafts",
      "ai-generated",
      "model",
      "human review",
      "source-linked counsel",
      "non-advice output",
      "first interaction",
      "ai disclosure"
    ],
    evidenceRequests: [
      {
        id: "eu-ai-act-article-50-user-interaction-disclosure",
        title: "EU AI Act Article 50 user-interaction disclosure evidence",
        reason:
          "EU AI workflow transparency review needs evidence that natural persons are told when they interact with an AI system, with timing, wording, accessibility, role owner, and exception routing captured before external reliance.",
        priority: "P1",
        keywords: [
          "article 50",
          "user interaction disclosure",
          "natural persons",
          "ai disclosure",
          "first interaction",
          "clear distinguishable accessible",
          "transparency notice",
          "role owner"
        ]
      },
      {
        id: "eu-ai-act-article-50-output-labelling-editorial-review",
        title: "EU AI Act AI-generated output labelling and editorial-control evidence",
        reason:
          "AI-generated or manipulated text/content needs labelling, machine-readable or detectable marking assumptions, human review or editorial-control owner, public-interest publication routing, and non-advice wording without raw matter text.",
        priority: "P1",
        keywords: [
          "ai-generated output",
          "output labelling",
          "machine-readable",
          "detectable",
          "editorial control",
          "human editorial review",
          "public interest",
          "not legal advice",
          "no raw matter text"
        ]
      }
    ],
    counselQuestions: [
      "What evidence shows EU-facing users receive clear AI-interaction disclosure at or before first interaction, and who owns accessibility and exception review?",
      "What evidence shows AI-generated text or other content is labelled, reviewed, and kept within audit-preparation / Not legal advice boundaries before any public or counsel handoff?"
    ],
    localCounselRole: "EU AI Act transparency / Article 50 counsel",
    effectiveAsOf: "2024-08-01",
    lastReviewedAt: "2026-07-06",
    reviewerNotes:
      "Source metadata reviewed against Regulation (EU) 2024/1689 Article 50 using the European Commission AI Act Service Desk and linked official text for AI interaction disclosure, AI-generated content labelling, timing, accessibility, and human editorial-control evidence routing; route interpretation to EU local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "eu-ai-act-administration-justice-adr-perimeter",
    jurisdiction: "European Union",
    regulator: "European Union",
    sourceName: "Regulation (EU) 2024/1689 high-risk AI systems for administration of justice",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
    citation: "Regulation (EU) 2024/1689, Article 6(2), Articles 26-27, and Annex III point 8(a)",
    topic: "ai-governance",
    summary:
      "Prepare administration-of-justice, alternative-dispute-resolution, role, human-oversight, logging, and fundamental-rights review evidence for EU AI legal workflow perimeter review without deciding high-risk status.",
    triggerFlagIds: [],
    triggerKeywords: [
      "legal operations ai workflow",
      "ai-assisted matter intake",
      "ai drafts issue-spotting",
      "source-linked counsel questions",
      "model-assisted legal",
      "judicial authority",
      "alternative dispute resolution",
      "applying the law"
    ],
    evidenceRequests: [
      {
        id: "eu-ai-act-justice-adr-perimeter",
        title: "EU AI Act justice and ADR perimeter evidence",
        reason:
          "EU AI legal workflow review needs intended-use, judicial-authority or on-behalf-of authority, ADR, legal-research, fact/law interpretation, concrete-fact application, provider/deployer role, and high-risk-perimeter evidence before counsel reliance.",
        priority: "P0",
        keywords: [
          "eu ai act justice",
          "annex iii point 8",
          "judicial authority",
          "on behalf of judicial authority",
          "alternative dispute resolution",
          "legal research",
          "interpreting facts and law",
          "applying law to concrete facts",
          "provider deployer role",
          "high-risk perimeter"
        ]
      },
      {
        id: "eu-ai-act-high-risk-oversight-fria",
        title: "EU AI Act high-risk oversight and fundamental-rights review evidence",
        reason:
          "If justice or ADR facts remain in scope, reviewers need deployer instructions, human oversight, logging, input-data controls, monitoring, escalation, fundamental-rights impact assessment routing, and output-use limits without raw matter text.",
        priority: "P1",
        keywords: [
          "article 26 deployer obligations",
          "article 27 fundamental rights",
          "fundamental rights impact assessment",
          "human oversight",
          "input data relevance",
          "logging",
          "monitoring",
          "incident escalation",
          "output use limits",
          "no raw matter text"
        ]
      }
    ],
    counselQuestions: [
      "Do any EU AI workflow facts involve a judicial authority, work performed on behalf of a judicial authority, or a similar alternative-dispute-resolution use case that needs high-risk perimeter review?",
      "What evidence shows human oversight, deployer instructions, logging, input-data boundaries, monitoring, escalation, and fundamental-rights review without exposing raw matter text or client identifiers?"
    ],
    localCounselRole: "EU AI Act high-risk / administration-of-justice counsel",
    effectiveAsOf: "2024-08-01",
    lastReviewedAt: "2026-07-06",
    reviewerNotes:
      "Source metadata reviewed against Regulation (EU) 2024/1689 Article 6(2), Articles 26-27, and Annex III point 8(a) for administration-of-justice, ADR, human-oversight, logging, and fundamental-rights evidence routing; route interpretation to EU local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-nist-ai-rmf-governance",
    jurisdiction: "United States",
    regulator: "National Institute of Standards and Technology",
    sourceName: "NIST Artificial Intelligence Risk Management Framework and Generative AI Profile",
    sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    citation: "NIST AI RMF 1.0 and NIST AI 600-1 Generative AI Profile",
    topic: "ai-governance",
    summary:
      "Prepare AI risk governance, model-use context, measurement, risk treatment, generative-AI output review, and human accountability evidence for US AI governance review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "legal operations ai workflow",
      "ai-assisted matter intake",
      "legal workflow",
      "generative ai",
      "model use limits",
      "permitted model use",
      "source-linked counsel"
    ],
    evidenceRequests: [
      {
        id: "us-nist-ai-rmf-govern-map-measure-manage",
        title: "US NIST AI RMF govern-map-measure-manage evidence",
        reason:
          "US AI governance review needs AI use-case context, risk owners, risk tolerance, measurement approach, model-limit decisions, and manage/monitor evidence before counsel or compliance reliance.",
        priority: "P1",
        keywords: [
          "nist ai rmf",
          "govern map measure manage",
          "ai risk owner",
          "model use limits",
          "risk measurement",
          "manage monitor"
        ]
      },
      {
        id: "us-nist-genai-output-review-provenance",
        title: "US NIST GenAI output review and provenance evidence",
        reason:
          "Generative-AI workflow review needs output review, unsupported-claim handling, source provenance, content-risk escalation, and human accountability evidence without exporting confidential matter text.",
        priority: "P1",
        keywords: [
          "nist ai 600-1",
          "generative ai profile",
          "output review",
          "unsupported claims",
          "source provenance",
          "human accountability"
        ]
      }
    ],
    counselQuestions: [
      "Which NIST AI RMF governance, mapping, measurement, and management assumptions should US AI governance reviewers inspect for this workflow?",
      "What evidence shows generative-AI outputs remain draft audit preparation with provenance, unsupported-claim handling, escalation, and accountable human review?"
    ],
    localCounselRole: "US AI governance / model risk counsel",
    effectiveAsOf: "2023-01-26",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against NIST AI RMF 1.0, NIST AI Resource Center AI RMF core functions, and NIST AI 600-1 Generative AI Profile for governance, context mapping, measurement, risk management, GenAI output review, and provenance evidence routing; route interpretation to US AI governance reviewers.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-nyc-local-law-144-aedt-employment-decision-governance",
    jurisdiction: "United States",
    regulator: "New York City Department of Consumer and Worker Protection",
    sourceName: "Automated Employment Decision Tools (AEDT)",
    sourceUrl: "https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page",
    citation: "New York City Local Law 144 of 2021 and DCWP AEDT rule, effective July 5, 2023",
    topic: "ai-governance",
    summary:
      "Prepare NYC AEDT hiring or promotion scoping, annual independent bias-audit evidence, public audit-summary metadata, 10-business-day notice workflow, job qualification or characteristic notice, alternative process or accommodation route, and AEDT data/source/retention request handling for counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "nyc",
      "new york city",
      "local law 144",
      "aedt",
      "automated employment decision tool",
      "automated employment decision tools",
      "employment decision",
      "hiring",
      "promotion",
      "candidate screening",
      "employee promotion",
      "bias audit",
      "independent auditor",
      "impact ratio",
      "selection rate",
      "scoring rate",
      "job qualifications",
      "alternative selection process",
      "reasonable accommodation",
      "data retention policy"
    ],
    evidenceRequests: [
      {
        id: "us-nyc-aedt-scope-bias-audit",
        title: "NYC AEDT scope and bias-audit evidence",
        reason:
          "NYC AEDT review needs hiring or promotion scope, AEDT output and decision role, independent auditor, bias-audit date within one year of use, data source explanation, selection or scoring rates, impact ratios, excluded categories, distribution date, and public summary metadata before counsel reliance.",
        priority: "P1",
        keywords: [
          "nyc aedt",
          "local law 144",
          "automated employment decision tool",
          "employment decision",
          "bias audit",
          "independent auditor",
          "selection rate",
          "scoring rate",
          "impact ratio",
          "distribution date",
          "public summary"
        ]
      },
      {
        id: "us-nyc-aedt-notice-data-retention",
        title: "NYC AEDT notice, accommodation, and data-retention request evidence",
        reason:
          "NYC AEDT audit-prep review needs notice to NYC-resident candidates or employees at least 10 business days before use, job qualifications or characteristics assessed, alternative selection process or accommodation instructions, AEDT data type/source, retention policy request handling, and no raw applicant or employee records in the packet.",
        priority: "P1",
        keywords: [
          "10 business days",
          "candidate notice",
          "employee notice",
          "job qualifications",
          "job characteristics",
          "alternative selection process",
          "reasonable accommodation",
          "data source",
          "data retention policy",
          "no raw applicant records",
          "no raw employee records"
        ]
      }
    ],
    counselQuestions: [
      "Does this workflow use an AEDT to screen NYC candidates for employment or employees for promotion, or is it limited to internal audit-prep drafting?",
      "What metadata shows annual independent bias-audit status, public summary, 10-business-day notice, accommodation or alternative process instructions, and data-retention request handling without storing raw applicant or employee records?"
    ],
    localCounselRole: "NYC AEDT / employment AI counsel",
    effectiveAsOf: "2023-07-05",
    lastReviewedAt: "2026-07-05",
    reviewerNotes:
      "Source metadata reviewed against NYC DCWP AEDT page, NYC Rules adopted rule, and NYC Council Local Law 144 text on 2026-07-05; route interpretation to NYC employment AI counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-colorado-admt-consequential-decision-governance",
    jurisdiction: "United States",
    regulator: "Colorado Attorney General / Colorado General Assembly",
    sourceName: "Colorado SB26-189 Automated Decision-Making Technology",
    sourceUrl: "https://leg.colorado.gov/bills/sb26-189",
    citation:
      "Colorado SB26-189, Automated Decision-Making Technology, signed May 14, 2026; operational provisions starting January 1, 2027",
    topic: "ai-governance",
    summary:
      "Prepare Colorado ADMT consequential-decision scoping, developer technical documentation, deployer notice, adverse-outcome explanation, personal-data correction, meaningful human review, and three-year record-retention evidence for counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "colorado",
      "admt",
      "automated decision-making",
      "automated decision making",
      "consequential decision",
      "meaningful human review",
      "personal data correction",
      "adverse outcome",
      "consumer notice",
      "employment",
      "housing",
      "financial service",
      "lending",
      "insurance",
      "health care",
      "essential government service"
    ],
    evidenceRequests: [
      {
        id: "us-co-admt-scope-technical-documentation",
        title: "Colorado ADMT scope and developer documentation evidence",
        reason:
          "Colorado ADMT review needs covered ADMT scope, personal-data input categories, intended uses, known limitations, deployer instructions, material-update handling, and human-review instructions before relying on AI workflow output.",
        priority: "P1",
        keywords: [
          "colorado admt",
          "covered admt",
          "technical documentation",
          "intended uses",
          "training data",
          "known limitations",
          "human review instructions",
          "material updates"
        ]
      },
      {
        id: "us-co-admt-deployer-notice-human-review-records",
        title: "Colorado ADMT notice, correction, human-review, and retention evidence",
        reason:
          "Colorado ADMT audit-prep review needs point-of-interaction notice, adverse-outcome explanation owner, personal-data request and correction workflow, meaningful human-review or reconsideration workflow, and three-year record-retention metadata without raw personal data.",
        priority: "P1",
        keywords: [
          "consumer notice",
          "adverse outcome",
          "plain language",
          "personal data correction",
          "meaningful human review",
          "reconsideration",
          "three-year records",
          "record retention"
        ]
      }
    ],
    counselQuestions: [
      "Does this AI workflow materially influence a Colorado consequential decision, or is it limited to internal audit-prep drafting?",
      "What evidence shows consumer notice, adverse-outcome explanation, personal-data correction, meaningful human review, and record-retention ownership without storing raw personal data?"
    ],
    localCounselRole: "Colorado ADMT / AI consumer-protection counsel",
    effectiveAsOf: "2027-01-01",
    lastReviewedAt: "2026-07-05",
    reviewerNotes:
      "Source metadata reviewed against Colorado General Assembly SB26-189 and the Colorado Attorney General ADMT rulemaking page on 2026-07-05; route interpretation to Colorado counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-california-ccpa-admt-consumer-rights-governance",
    jurisdiction: "United States",
    regulator: "California Privacy Protection Agency",
    sourceName: "CCPA Updates, Cybersecurity Audits, Risk Assessments, and Automated Decisionmaking Technology Regulations",
    sourceUrl: "https://cppa.ca.gov/regulations/ccpa_updates.html",
    citation:
      "California Privacy Protection Agency, CCPA Updates, Cybersecurity Audits, Risk Assessments, and Automated Decisionmaking Technology Regulations, effective January 1, 2026",
    topic: "ai-governance",
    summary:
      "Prepare California CCPA ADMT scoping, significant-decision risk assessment, access and opt-out request workflow, ADMT logic/output documentation, human involvement, secure request handling, and no-raw-personal-data evidence for counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "california",
      "ccpa",
      "cppa",
      "admt",
      "automated decisionmaking",
      "automated decision-making",
      "significant decision",
      "right to access admt",
      "request to opt-out of admt",
      "risk assessment",
      "human involvement",
      "financial or lending services",
      "housing",
      "education",
      "employment",
      "healthcare"
    ],
    evidenceRequests: [
      {
        id: "us-ca-ccpa-admt-scope-risk-assessment",
        title: "California CCPA ADMT scope and risk-assessment evidence",
        reason:
          "California CCPA ADMT review needs ADMT scope, significant-decision mapping, personal-information categories, logic assumptions and limitations, output use, human-involvement authority, and risk-assessment report metadata before counsel reliance.",
        priority: "P1",
        keywords: [
          "california ccpa admt",
          "significant decision",
          "risk assessment",
          "personal information categories",
          "logic assumptions",
          "known limitations",
          "output use",
          "human involvement",
          "human reviewer authority"
        ]
      },
      {
        id: "us-ca-ccpa-admt-access-opt-out-evidence",
        title: "California CCPA ADMT access, opt-out, and secure request evidence",
        reason:
          "California CCPA ADMT audit-prep review needs consumer access and opt-out request workflow, no-dark-pattern intake, verification handling, secure response channel, non-retaliation owner, and no raw personal data in the audit packet.",
        priority: "P1",
        keywords: [
          "right to access admt",
          "request to opt-out of admt",
          "consumer access",
          "opt-out workflow",
          "no dark patterns",
          "verification handling",
          "secure response",
          "non-retaliation",
          "no raw personal data"
        ]
      }
    ],
    counselQuestions: [
      "Does this AI workflow use ADMT to make or substantially replace human involvement in a California significant decision, or is it limited to internal audit-prep drafting?",
      "What evidence shows ADMT logic/output documentation, risk-assessment ownership, access and opt-out request handling, verification, secure response, and non-retaliation controls without storing raw personal data?"
    ],
    localCounselRole: "California CCPA / ADMT privacy counsel",
    effectiveAsOf: "2026-01-01",
    lastReviewedAt: "2026-07-05",
    reviewerNotes:
      "Source metadata reviewed against the CPPA CCPA Updates/Cyber/Risk/ADMT rulemaking page, FAQ, and approved regulations text on 2026-07-05; route interpretation to California privacy counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "us-aba-formal-opinion-512-generative-ai-law-practice",
    jurisdiction: "United States",
    regulator: "American Bar Association",
    sourceName: "Formal Opinion 512: Generative Artificial Intelligence Tools",
    sourceUrl:
      "https://www.americanbar.org/content/dam/aba/administrative/professional_responsibility/ethics-opinions/aba-formal-opinion-512.pdf",
    citation: "ABA Formal Opinion 512, Generative Artificial Intelligence Tools, July 29, 2024",
    topic: "ai-governance",
    summary:
      "Prepare legal-AI professional-responsibility evidence for competence, confidentiality, client communication, supervisory review, candor, and fee treatment before lawyer or counsel reliance.",
    triggerFlagIds: [],
    triggerKeywords: [
      "legal operations ai workflow",
      "ai-assisted matter intake",
      "legal workflow",
      "generative ai",
      "drafts issue-spotting",
      "source-linked counsel questions",
      "outside counsel",
      "lawyer",
      "client representation"
    ],
    evidenceRequests: [
      {
        id: "us-aba-gai-competence-confidentiality-evidence",
        title: "US legal AI competence and confidentiality evidence",
        reason:
          "Legal AI workflow review needs GAI tool capability/limit notes, prohibited-input rules, confidentiality controls, client-information exclusion, verification owner, and reviewer training evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "aba formal opinion 512",
          "gai tool capability",
          "model limitations",
          "confidentiality controls",
          "prohibited inputs",
          "client information exclusion",
          "verification owner",
          "reviewer training"
        ]
      },
      {
        id: "us-aba-gai-communication-supervision-candor-fee-evidence",
        title: "US legal AI communication, supervision, candor, and fee evidence",
        reason:
          "Counsel needs client-communication trigger, supervisory-review owner, outside-provider oversight, tribunal-candor check, fee/expense treatment, and no-confidential-matter-text evidence for legal AI handoff.",
        priority: "P1",
        keywords: [
          "client communication trigger",
          "supervisory review",
          "outside provider oversight",
          "tribunal candor",
          "fee treatment",
          "expense treatment",
          "no confidential matter text"
        ]
      }
    ],
    counselQuestions: [
      "Which competence, confidentiality, communication, supervision, candor, and fee assumptions should US professional-responsibility counsel review for this legal AI workflow?",
      "What metadata-only evidence shows GAI outputs stay draft audit preparation, confidential matter text is excluded, and reviewers verify outputs before lawyer or counsel reliance?"
    ],
    localCounselRole: "US legal AI professional responsibility counsel",
    effectiveAsOf: "2024-07-29",
    lastReviewedAt: "2026-07-04",
    reviewerNotes:
      "Source metadata reviewed against ABA Formal Opinion 512 for generative-AI competence, confidentiality, communication, supervision, candor, fee, and evidence-routing metadata; route interpretation to US professional-responsibility counsel.",
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
    id: "uk-fca-cryptoasset-aml-registration-travel-rule",
    jurisdiction: "United Kingdom",
    regulator: "Financial Conduct Authority",
    sourceName: "FCA cryptoassets AML/CTF regime, MLR registration expectations, and Travel Rule expectations",
    sourceUrl: "https://www.fca.org.uk/firms/financial-crime/money-laundering-terrorist-financing/cryptoassets-aml-ctf-regime",
    citation:
      "FCA Cryptoassets: AML/CTF regime; Cryptoassets: What we expect to see in your application for registration; FCA Travel Rule expectations, 17 August 2023",
    topic: "aml-cft",
    summary:
      "Prepare UK cryptoasset exchange provider or custodian wallet provider activity-scope, FCA MLR registration, business plan, AML/CTF/CPF framework, MLRO, BWRA/CRA, CDD/EDD, sanctions, transaction monitoring, SAR, Travel Rule originator/beneficiary data, outsourcing, record-retention, and no-raw-KYC evidence for UK financial-crime counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "united kingdom",
      "uk",
      "fca",
      "cryptoasset",
      "crypto asset",
      "mlr",
      "money laundering regulations",
      "cryptoasset exchange provider",
      "custodian wallet provider",
      "mlro",
      "business-wide risk assessment",
      "travel rule",
      "originator",
      "beneficiary",
      "suspicious activity report"
    ],
    evidenceRequests: [
      {
        id: "uk-fca-cryptoasset-mlr-registration-activity-scope",
        title: "UK FCA cryptoasset MLR registration and activity-scope evidence",
        reason:
          "UK cryptoasset review needs exchange-provider, custodian-wallet-provider, UK business, MLR registration, business-plan, management-structure, ownership/control, MLRO, AML framework, BWRA, CRA, outsourcing, and customer-journey evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "uk cryptoasset business",
          "uk fca mlr registration",
          "uk cryptoasset exchange provider",
          "uk custodian wallet provider",
          "uk business plan",
          "uk ownership control structure",
          "uk mlro",
          "uk business wide risk assessment",
          "uk customer risk assessment",
          "uk aml framework"
        ]
      },
      {
        id: "uk-fca-cryptoasset-aml-sar-travel-rule",
        title: "UK cryptoasset AML controls, SAR, sanctions, and Travel Rule evidence",
        reason:
          "Counsel and compliance review need UK CDD/EDD, PEP/sanctions screening, blockchain analytics and on-chain/off-chain transaction monitoring, SAR escalation, staff training, third-party tool configuration, Travel Rule originator/beneficiary data flow, missing-information handling, record retrieval, and raw-KYC exclusion evidence.",
        priority: "P1",
        keywords: [
          "uk cryptoasset travel rule",
          "uk originator beneficiary information",
          "uk suspicious activity reporting",
          "uk sanctions screening",
          "uk blockchain analytics",
          "uk transaction monitoring",
          "uk cdd edd",
          "uk travel rule data flow",
          "uk third-party tool configuration",
          "uk record retrieval"
        ]
      }
    ],
    counselQuestions: [
      "Which UK cryptoasset exchange-provider, custodian-wallet-provider, MLR registration, business-plan, ownership/control, MLRO, BWRA/CRA, outsourcing, and customer-journey assumptions should UK financial-crime counsel review?",
      "What metadata-only evidence shows UK CDD/EDD, PEP/sanctions screening, blockchain analytics, transaction monitoring, SAR escalation, staff training, Travel Rule originator/beneficiary data flow, missing-information handling, and record retrieval without raw KYC, wallet secrets, credentials, or customer records?"
    ],
    localCounselRole: "UK cryptoasset AML / financial crime counsel",
    effectiveAsOf: "2023-09-01",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against FCA Cryptoassets AML/CTF regime, FCA cryptoasset registration expectations, FCA Travel Rule expectations, and FCA Financial Crime Guide references for MLR registration, activity scope, AML/CTF/CPF framework, MLRO, risk assessments, CDD/EDD, sanctions, transaction monitoring, SAR, Travel Rule data, and evidence-routing metadata; route interpretation to UK financial-crime counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "uk-fca-qualifying-stablecoin-issuer-regime",
    jurisdiction: "United Kingdom",
    regulator: "Financial Conduct Authority / Bank of England",
    sourceName: "PS26/10 Stablecoin issuance and BoE/FCA joint systemic stablecoin approach",
    sourceUrl: "https://www.fca.org.uk/publication/policy/ps26-10.pdf",
    citation: "FCA PS26/10 Stablecoin issuance, 30 June 2026; BoE/FCA joint approach to systemic stablecoin issuers, June 2026",
    topic: "activity-scope",
    summary:
      "Prepare UK-issued qualifying stablecoin issuer, admission, backing-asset, redemption, safeguarding, disclosure, and systemic-transition evidence for UK stablecoin counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "uk qualifying stablecoin",
      "uk-issued qualifying stablecoin",
      "uk issued qualifying stablecoin",
      "qualifying stablecoin",
      "sterling stablecoin",
      "gbp stablecoin",
      "uk stablecoin issuer",
      "stablecoin issuance",
      "stablecoin backing",
      "stablecoin safeguarding",
      "stablecoin redemption",
      "systemic stablecoin issuer"
    ],
    evidenceRequests: [
      {
        id: "uk-stablecoin-issuer-permission-admission-disclosure",
        title: "UK qualifying stablecoin issuer permission, admission, and disclosure evidence",
        reason:
          "UK stablecoin issuer review needs UKQS issuer route, regulated activity assumptions, trading-admission or distribution scope, disclosure owner, governance owner, and FCA/BoE handoff metadata before counsel reliance.",
        priority: "P0",
        keywords: [
          "uk qualifying stablecoin",
          "ukqs issuer",
          "uk stablecoin issuer",
          "regulated activity",
          "admission to trading",
          "distribution scope",
          "disclosure owner",
          "governance owner",
          "fca boe handoff"
        ]
      },
      {
        id: "uk-stablecoin-backing-safeguarding-redemption",
        title: "UK qualifying stablecoin backing, safeguarding, and redemption evidence",
        reason:
          "Counsel needs metadata-only backing-asset, safeguarding, reconciliation, redemption, liquidity, recordkeeping, systemic-transition, and no-raw-customer-record evidence for UK stablecoin issuer handoff.",
        priority: "P0",
        keywords: [
          "stablecoin backing assets",
          "backing asset",
          "safeguarding",
          "reconciliation",
          "redemption",
          "liquidity",
          "recordkeeping",
          "systemic transition",
          "joint regulation",
          "no raw customer records"
        ]
      }
    ],
    counselQuestions: [
      "Which UK-issued qualifying stablecoin issuer, permission, admission, disclosure, or distribution assumptions should UK stablecoin counsel review?",
      "What backing-asset, safeguarding, redemption, reconciliation, recordkeeping, and systemic-transition evidence can be prepared without raw customer records, credentials, wallet secrets, or personal data?"
    ],
    localCounselRole: "UK qualifying stablecoin / FCA-BoE counsel",
    effectiveAsOf: "2026-06-30",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against FCA PS26/10 for non-systemic UK-issued qualifying stablecoin issuance, backing assets, redemption, safeguarding, and disclosures, plus BoE/FCA joint approach materials for systemic stablecoin issuer transition and supervisory coordination; route interpretation to UK stablecoin counsel.",
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
    triggerFlagIds: [],
    triggerKeywords: [
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
    id: "hk-sfc-tokenised-investment-products-secondary-trading",
    jurisdiction: "Hong Kong",
    regulator: "Securities and Futures Commission of Hong Kong",
    sourceName: "SFC tokenisation of authorised investment products and secondary trading circulars",
    sourceUrl: "https://apps.sfc.hk/edistributionWeb/api/circular/list-content/circular/doc?lang=EN&refNo=26EC22",
    citation:
      "SFC Circular Ref. 26EC22, Tokenisation of SFC-authorised investment products, 20 April 2026; SFC Circular Ref. 26EC23, Secondary trading of tokenised SFC-authorised investment products, 20 April 2026",
    topic: "activity-scope",
    summary:
      "Prepare Hong Kong tokenised SFC-authorised investment product, ownership-record, tokenisation-control, disclosure, consultation, and secondary-trading evidence for SFC counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "tokenised sfc-authorised investment product",
      "tokenized sfc-authorised investment product",
      "tokenised sfc-authorized investment product",
      "tokenized sfc-authorized investment product",
      "sfc-authorised investment product",
      "sfc-authorized investment product",
      "tokenised fund",
      "tokenized fund",
      "tokenised product",
      "tokenized product",
      "secondary trading",
      "price deviation alert",
      "indicative nav"
    ],
    evidenceRequests: [
      {
        id: "hk-sfc-tokenised-product-authorisation-consultation",
        title: "Hong Kong SFC tokenised product authorisation and consultation evidence",
        reason:
          "Hong Kong tokenised-product review needs underlying product authorisation assumptions, new or existing product status, prior consultation or approval route, SFC case-team handoff, and no-legal-conclusion boundary before counsel reliance.",
        priority: "P1",
        keywords: [
          "sfc-authorised investment product",
          "sfc-authorized investment product",
          "tokenised product",
          "tokenized product",
          "prior consultation",
          "prior approval",
          "case team",
          "product authorisation",
          "product authorization"
        ]
      },
      {
        id: "hk-sfc-tokenisation-arrangement-ownership-controls",
        title: "Hong Kong SFC tokenisation arrangement, ownership-record, and smart-contract evidence",
        reason:
          "Product-provider review needs token-holder ownership recordkeeping, operational soundness, service-provider compatibility, cybersecurity, data privacy, outage recovery, business-continuity, smart-contract integrity, and permissioned-control evidence without wallet secrets.",
        priority: "P1",
        keywords: [
          "ownership records",
          "token holder",
          "token-holder",
          "operational soundness",
          "cybersecurity",
          "data privacy",
          "business continuity",
          "smart contract integrity",
          "permissioned control"
        ]
      },
      {
        id: "hk-sfc-secondary-trading-fair-pricing-liquidity-disclosure",
        title: "Hong Kong SFC secondary trading fair-pricing, liquidity, and disclosure evidence",
        reason:
          "Secondary-trading review needs trading-channel scope, pre-launch testing, price-deviation alert, indicative NAV, market-maker and liquidity arrangements, trading suspension workflow, investor risk disclosure, client confirmation, notification, and contingency-plan evidence.",
        priority: "P1",
        keywords: [
          "secondary trading",
          "pre-launch testing",
          "price deviation alert",
          "indicative nav",
          "market maker",
          "liquidity",
          "trading suspension",
          "risk disclosure",
          "client confirmation",
          "contingency plan"
        ]
      }
    ],
    counselQuestions: [
      "Which Hong Kong SFC-authorised product, tokenisation feature, prior consultation, prior approval, or material-change assumptions should SFC products counsel review?",
      "What evidence shows ownership recordkeeping, operational soundness, smart-contract integrity, and permissioned controls without exposing wallet secrets or raw investor records?",
      "What secondary-trading evidence shows price-deviation alerts, indicative NAV, market making, liquidity, disclosure, client confirmation, and notification workflows before public reliance?"
    ],
    localCounselRole: "Hong Kong SFC tokenised products counsel",
    effectiveAsOf: "2026-04-20",
    lastReviewedAt: "2026-07-06",
    reviewerNotes:
      "Source metadata reviewed against SFC Circular Ref. 26EC22 on tokenisation of SFC-authorised investment products and official SFC Circular Ref. 26EC23 PDF on secondary trading for product-provider responsibility, ownership recordkeeping, cybersecurity/data-privacy/BCP controls, smart-contract integrity, consultation/approval routing, price-deviation alert, indicative NAV, market-maker, disclosure, client-confirmation, notification, and contingency evidence; route interpretation to Hong Kong SFC products counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "hk-hkma-stablecoin-issuer-regime",
    jurisdiction: "Hong Kong",
    regulator: "Hong Kong Monetary Authority",
    sourceName: "Regulatory Regime for Stablecoin Issuers",
    sourceUrl: "https://www.hkma.gov.hk/eng/key-functions/international-financial-centre/stablecoin-issuers/",
    citation:
      "Stablecoins Ordinance (Cap. 656); HKMA Regulatory Regime for Stablecoin Issuers, 1 August 2025; HKMA Supervisory and AML/CFT Guidelines, August 2025",
    topic: "activity-scope",
    summary:
      "Prepare fiat-referenced stablecoin issuance, HKMA licence, activity scope, reserve-asset backing, redemption, supervision, AML/CFT, and user-protection evidence for Hong Kong stablecoin issuer counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "stablecoin issuer",
      "fiat-referenced stablecoin",
      "frs issuer",
      "specified stablecoin",
      "stablecoins ordinance",
      "hkma licence",
      "hkma license",
      "regulated stablecoin activity",
      "reserve assets",
      "stablecoin manager"
    ],
    evidenceRequests: [
      {
        id: "hk-hkma-stablecoin-licensing-activity-scope",
        title: "Hong Kong HKMA stablecoin issuer licensing and activity-scope evidence",
        reason:
          "Hong Kong stablecoin issuer review needs fiat-referenced stablecoin scope, regulated stablecoin activity, HKMA licence or application route, principal-place-of-business, governance, controller, and responsible-person evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "stablecoin issuer",
          "fiat-referenced stablecoin",
          "stablecoins ordinance",
          "hkma licence",
          "hkma license",
          "regulated stablecoin activity",
          "licence application",
          "license application",
          "hong kong principal place"
        ]
      },
      {
        id: "hk-hkma-stablecoin-reserve-redemption-supervision",
        title: "Hong Kong HKMA stablecoin reserve, redemption, and supervision evidence",
        reason:
          "Counsel needs reserve-asset management, full-backing, segregation, safekeeping, qualified custodian, redemption, attestation, reporting, incident, and business-continuity evidence for HKMA supervisory review.",
        priority: "P1",
        keywords: [
          "reserve assets",
          "full backing",
          "redemption",
          "segregation",
          "safekeeping",
          "qualified custodian",
          "attestation",
          "reporting",
          "supervisory guideline"
        ]
      },
      {
        id: "hk-hkma-stablecoin-aml-cft-user-protection",
        title: "Hong Kong HKMA stablecoin AML/CFT and user-protection evidence",
        reason:
          "AML/CFT review needs risk assessment, customer due diligence, blockchain analytics, unhosted-wallet handling, suspicious-transaction reporting, recordkeeping, complaints, and no-raw-KYC evidence for local counsel handoff.",
        priority: "P1",
        keywords: [
          "aml cft",
          "ml tf",
          "customer due diligence",
          "blockchain analytics",
          "unhosted wallets",
          "suspicious transaction",
          "record keeping",
          "complaints handling",
          "no raw kyc"
        ]
      }
    ],
    counselQuestions: [
      "Which fiat-referenced stablecoin issuance, HKMA licence, application, controller, governance, or principal-place-of-business facts should Hong Kong stablecoin issuer counsel review?",
      "What reserve-asset, full-backing, redemption, attestation, AML/CFT, suspicious-transaction, recordkeeping, and user-protection evidence can be prepared without raw KYC or personal data?"
    ],
    localCounselRole: "Hong Kong stablecoin issuer / HKMA counsel",
    effectiveAsOf: "2025-08-01",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against HKMA stablecoin issuer regime page, Stablecoins Ordinance (Cap. 656) licensing note, HKMA supervisory guideline, HKMA AML/CFT guideline, and 2026 licensed-issuer press release for source-linked evidence routing; route interpretation to Hong Kong stablecoin issuer counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "jp-fsa-crypto-asset-custody-user-protection",
    jurisdiction: "Japan",
    regulator: "Financial Services Agency Japan",
    sourceName: "FSA Guidelines for Supervision of Crypto-Asset Exchange Service Providers and crypto asset regulatory framework overview",
    sourceUrl: "https://www.fsa.go.jp/common/law/guide/kaisya/e016.pdf",
    citation:
      "FSA Guidelines for Supervision of Crypto-Asset Exchange Service Providers; FSA Regulating the crypto assets landscape in Japan, December 2022",
    topic: "custody",
    summary:
      "Prepare crypto-asset exchange service scope, FSA registration, user-asset protection, segregated wallet, cold-wallet, reconciliation, leakage-response, and information-disclosure evidence for Japan counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch"],
    triggerKeywords: [
      "japan",
      "crypto-asset exchange",
      "crypto asset exchange",
      "cold wallet",
      "offline environment",
      "user assets",
      "segregated custody",
      "leakage response"
    ],
    evidenceRequests: [
      {
        id: "jp-fsa-registration-user-asset-protection",
        title: "Japan FSA registration and user-asset protection evidence",
        reason:
          "Japan crypto-asset custody review needs exchange-service scope, registration assumptions, user-asset protection, customer information, and reviewer-owner evidence before local counsel reliance.",
        priority: "P1",
        keywords: [
          "japan crypto asset exchange",
          "crypto-asset exchange",
          "fsa registration",
          "user asset protection",
          "customer asset",
          "information to users",
          "contract details"
        ]
      },
      {
        id: "jp-fsa-cold-wallet-reconciliation-leakage-response",
        title: "Japan cold-wallet segregation, reconciliation, and leakage-response evidence",
        reason:
          "Counsel and compliance review need segregated wallet, offline/cold-wallet management, daily reconciliation, leakage-risk response, internal-control, and audit evidence without wallet secrets.",
        priority: "P1",
        keywords: [
          "cold wallet",
          "offline environment",
          "segregated wallet",
          "daily reconciliation",
          "leakage response",
          "secret key controls",
          "separate management audit"
        ]
      }
    ],
    counselQuestions: [
      "Which crypto-asset exchange service, registration, user-asset protection, and information-disclosure assumptions should Japan counsel review?",
      "What evidence shows segregated custody, offline/cold-wallet management, reconciliation, leakage response, and internal audit without exposing wallet secrets or raw customer records?"
    ],
    localCounselRole: "Japan crypto-asset exchange / custody counsel",
    effectiveAsOf: "2020-05-01",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against FSA crypto-asset exchange supervision guidance and FSA 2022 regulatory framework overview for registration, user protection, segregation, cold-wallet/offline management, reconciliation, leakage-risk response, and evidence-routing metadata; route interpretation to Japan local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "ca-csa-ctp-pru-custody-investor-protection",
    jurisdiction: "Canada",
    regulator: "Canadian Securities Administrators",
    sourceName:
      "CSA Staff Notice 21-332 Crypto Asset Trading Platforms: Pre-Registration Undertakings and Joint CSA/IIROC Staff Notice 21-329",
    sourceUrl: "https://fcaa.gov.sk.ca/public/plugins/pdfs/6064/21_332_csa_staff_notice_february_22_2023_.pdf",
    citation:
      "CSA Staff Notice 21-332 Crypto Asset Trading Platforms: Pre-Registration Undertakings; Joint CSA/IIROC Staff Notice 21-329",
    topic: "custody",
    summary:
      "Prepare Canada crypto asset trading platform registration, PRU, client-asset custody, segregation, third-party custodian, no re-hypothecation, no leverage, VRCA consent, and investor-protection evidence for Canada counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch"],
    triggerKeywords: [
      "canada",
      "canadian",
      "crypto asset trading platform",
      "ctp",
      "pre-registration undertaking",
      "pru",
      "value-referenced crypto asset",
      "vrca",
      "stablecoin",
      "third-party custodian",
      "re-hypothecate"
    ],
    evidenceRequests: [
      {
        id: "ca-csa-registration-pru-investor-protection",
        title: "Canada CTP registration, PRU, and investor-protection evidence",
        reason:
          "Canada crypto asset trading platform review needs registration-status, enhanced PRU, Canadian-client access, no leverage, VRCA/proprietary-token consent, CCO, financial reporting, and investor-protection evidence before local counsel reliance.",
        priority: "P1",
        keywords: [
          "canada csa pru",
          "pre-registration undertaking",
          "registration application",
          "canadian client",
          "no leverage",
          "value-referenced crypto asset",
          "vrca",
          "prior written consent",
          "chief compliance officer",
          "financial information filing"
        ]
      },
      {
        id: "ca-csa-client-asset-custody-segregation",
        title: "Canada client-asset custody, segregation, and custodian evidence",
        reason:
          "Counsel and compliance review need client-asset segregation, trust/account designation, acceptable third-party custodian, 80 percent custodian allocation, no pledge or re-hypothecation, SOC 2/audited-financial-statement, insurance or alternative risk-mitigation, and CSA custodian-information access evidence without raw client records.",
        priority: "P1",
        keywords: [
          "acceptable third-party custodian",
          "third-party custodians to hold not less than 80%",
          "hold assets in trust",
          "separate and apart",
          "designated trust account",
          "pledge re-hypothecate",
          "soc 2",
          "audited financial statements",
          "insurance risk mitigation",
          "custodian information access"
        ]
      }
    ],
    counselQuestions: [
      "Which Canada CTP registration, enhanced PRU, Canadian-client access, leverage, VRCA, and proprietary-token assumptions should Canada counsel review?",
      "What metadata-only evidence shows Canadian client assets are segregated, held in trust or with an acceptable third-party custodian, not pledged or re-hypothecated, and supported by custodian assurance or insurance/risk-mitigation controls?"
    ],
    localCounselRole: "Canada crypto asset trading platform counsel",
    effectiveAsOf: "2023-02-22",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against CSA Staff Notice 21-332 and Joint CSA/IIROC Staff Notice 21-329 for registration/PRU routing, custody and segregation, acceptable third-party custodian, no pledge or re-hypothecation, no leverage, VRCA consent, insurance/risk mitigation, and evidence-routing metadata; route interpretation to Canada local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "au-asic-austrac-digital-asset-financial-services",
    jurisdiction: "Australia",
    regulator: "ASIC / AUSTRAC",
    sourceName:
      "ASIC INFO 225 Digital assets: Financial products and services; ASIC RG 133; AUSTRAC virtual asset designated services and obligations guidance",
    sourceUrl: "https://www.asic.gov.au/regulatory-resources/digital-transformation/digital-assets-financial-products-and-services/",
    citation:
      "ASIC INFO 225 Digital assets: Financial products and services; ASIC RG 133; AUSTRAC virtual asset designated services and obligations guidance",
    topic: "custody",
    summary:
      "Prepare Australia digital-asset financial product, AFS licensing, dealing, market-making, custodial/depository service, crypto custody-control, AUSTRAC VASP AML/CTF, CDD, travel-rule, reporting, and recordkeeping evidence for local counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "australia",
      "australian",
      "asic",
      "austrac",
      "digital asset",
      "crypto asset",
      "tokenised asset",
      "stablecoin",
      "afs licence",
      "custodial wallet",
      "virtual asset service provider",
      "vasp",
      "aml/ctf",
      "travel rule"
    ],
    evidenceRequests: [
      {
        id: "au-asic-digital-asset-financial-services-custody",
        title: "Australia ASIC digital-asset financial services and custody evidence",
        reason:
          "Australia digital-asset review needs financial-product, AFS licensing, dealing, market-making, custodial/depository service, client-asset separation, specialist custody infrastructure, cold-storage, signing-control, compensation, and independent assurance evidence before local counsel reliance.",
        priority: "P1",
        keywords: [
          "australia asic digital asset",
          "financial product",
          "afs licence",
          "dealing",
          "market making",
          "custodial depository service",
          "client assets separate",
          "crypto-asset custody",
          "specialist expertise",
          "cold storage",
          "single point of failure",
          "independent audit"
        ]
      },
      {
        id: "au-austrac-vasp-aml-ctf-program",
        title: "Australia AUSTRAC VASP AML/CTF, CDD, reporting, and recordkeeping evidence",
        reason:
          "Counsel and compliance review need AUSTRAC virtual asset service provider activity-scope, enrolment/registration, AML/CTF program, customer due diligence, travel-rule, suspicious matter, threshold-transaction, annual compliance, and seven-year recordkeeping evidence without raw KYC.",
        priority: "P1",
        keywords: [
          "austrac",
          "virtual asset service provider",
          "vasp",
          "aml/ctf program",
          "customer due diligence",
          "ongoing cdd",
          "suspicious matter report",
          "threshold transaction report",
          "travel rule",
          "seven years",
          "registration"
        ]
      }
    ],
    counselQuestions: [
      "Which Australia financial-product, AFS licensing, dealing, market-making, or custodial/depository service assumptions should digital-asset counsel review?",
      "What metadata-only evidence shows AUSTRAC virtual-asset service scope, AML/CTF program ownership, CDD, travel-rule, reporting, and recordkeeping controls without raw KYC, wallet secrets, or customer records?"
    ],
    localCounselRole: "Australia digital assets / AML-CTF counsel",
    effectiveAsOf: "2026-07-01",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against ASIC INFO 225, ASIC RG 133, and AUSTRAC virtual asset designated service and obligations guidance for financial-service scope, custody-control, AML/CTF, CDD, travel-rule, reporting, recordkeeping, and evidence-routing metadata; route interpretation to Australia local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "kr-fsc-kofiu-vasp-user-protection-aml",
    jurisdiction: "South Korea",
    regulator: "Financial Services Commission / KoFIU",
    sourceName:
      "Virtual Asset User Protection Act implementation, Enforcement Decree, and KoFIU VASP reporting / AML guidance",
    sourceUrl: "https://www.fsc.go.kr/eng/pr010101/82683",
    citation:
      "FSC Virtual Asset User Protection Act implementation; Enforcement Decree; KoFIU VASP reporting and AML guidance",
    topic: "custody",
    summary:
      "Prepare South Korea VASP registration/reporting, user deposit and virtual-asset segregation, bank deposit custody, 80 percent cold-wallet, insurance/reserve, abnormal transaction monitoring/reporting, user disclosure, AML/CFT CDD/EDD/STR, compliance system, major shareholder, ISMS, and real-name account change-reporting evidence for local counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "south korea",
      "korea",
      "korean",
      "fsc",
      "kofiu",
      "virtual asset user protection",
      "virtual asset service provider",
      "vasp",
      "real-name verified account",
      "cold wallet",
      "specified financial transaction information",
      "customer due diligence",
      "suspicious transaction report",
      "travel rule"
    ],
    evidenceRequests: [
      {
        id: "kr-fsc-user-asset-protection-custody",
        title: "Korea VASP user-asset protection, custody, and disclosure evidence",
        reason:
          "South Korea VASP review needs user deposits at banks, user virtual assets kept separate, type/volume custody records, 80 percent cold-wallet handling, insurance/reserve, abnormal trading surveillance/reporting, and user disclosure evidence before local counsel reliance.",
        priority: "P1",
        keywords: [
          "korea vasp user protection",
          "user deposits at banks",
          "separate from own funds",
          "users virtual assets separate",
          "80 percent cold wallet",
          "cold wallet",
          "insurance reserve",
          "hacking network malfunction",
          "abnormal trading monitoring",
          "korean language whitepaper",
          "user asset protection"
        ]
      },
      {
        id: "kr-kofiu-vasp-reporting-aml-cdd",
        title: "Korea KoFIU VASP reporting, AML/CFT, CDD, and STR evidence",
        reason:
          "Counsel and compliance review need KoFIU VASP reporting, compliance system, major shareholder, ISMS, executives/service-operation changes, real-name verified account, AML risk management, CDD/EDD, STR, and Travel Rule evidence without raw KYC or customer records.",
        priority: "P1",
        keywords: [
          "kofiu",
          "vasp reporting",
          "compliance system",
          "major shareholders",
          "isms",
          "real-name verified checking account",
          "aml management",
          "customer due diligence",
          "enhanced due diligence",
          "beneficial ownership",
          "suspicious transaction report",
          "travel rule",
          "korea vasp registration"
        ]
      }
    ],
    counselQuestions: [
      "Which South Korea VASP registration/reporting, user-asset custody, deposit custody, cold-wallet, insurance/reserve, suspicious or abnormal trading monitoring, and disclosure assumptions should local counsel review?",
      "What metadata-only evidence shows KoFIU reporting, AML/CFT, CDD/EDD, STR, Travel Rule, real-name account, ISMS, compliance system, shareholder, and operation change-reporting controls without raw KYC, customer records, wallet secrets, or identity files?"
    ],
    localCounselRole: "South Korea virtual asset / AML counsel",
    effectiveAsOf: "2024-07-19",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against FSC Virtual Asset User Protection Act implementation and Enforcement Decree plus KoFIU VASP reporting, CDD, EDD, and STR guidance for custody, segregation, cold-wallet, insurance/reserve, abnormal transaction monitoring, disclosure, reporting, AML/CFT, and evidence-routing metadata; route interpretation to South Korea local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "in-fiu-pmla-vda-aml-cft",
    jurisdiction: "India",
    regulator: "Financial Intelligence Unit - India / Ministry of Finance",
    sourceName: "PMLA virtual digital asset notification and FIU-IND AML/CFT guidelines for VDA service providers",
    sourceUrl: "https://fiuindia.gov.in/pdfs/AML_legislation/AMLCFTguidelines10032023.pdf",
    citation:
      "PMLA VDA Notification S.O. 1072(E), 7 March 2023; FIU-IND AML/CFT Guidelines for Reporting Entities Providing Services Related to VDAs, 10 March 2023",
    topic: "aml-cft",
    summary:
      "Prepare India VDA activity-scope, FIU-IND Reporting Entity registration, AML/CFT/CPF program, board/senior management policy controls, Designated Director / Principal Officer, KYC/CDD/EDD, sanctions and blockchain-analytics screening, STR/monthly reporting, risk assessment, record retention, Travel Rule/VDA transfer reporting, and no-raw-KYC evidence for local counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "india",
      "indian",
      "fiu-ind",
      "fiu ind",
      "pmla",
      "virtual digital asset",
      "vda",
      "vda service provider",
      "reporting entity",
      "fingate",
      "travel rule",
      "principal officer",
      "designated director",
      "suspicious transaction report"
    ],
    evidenceRequests: [
      {
        id: "in-fiu-vda-registration-activity-scope",
        title: "India VDA SP FIU-IND registration and activity-scope evidence",
        reason:
          "India VDA review needs exchange, transfer, safekeeping/administration/control-instrument, issuer offer-sale financial-service, Reporting Entity registration, bank/FI account disclosure, Designated Director / Principal Officer, AML/CFT/CPF program, and board/senior management policy evidence before local counsel reliance.",
        priority: "P1",
        keywords: [
          "india vda service provider",
          "india fiu-ind registration",
          "india pmla reporting entity",
          "designated director",
          "principal officer",
          "client money account",
          "aml/cft/cpf program",
          "board senior management",
          "india vda sp activity scope",
          "vda activity scope"
        ]
      },
      {
        id: "in-fiu-vda-aml-reporting-cdd-str-travel-rule",
        title: "India VDA AML/CFT reporting, CDD/EDD, STR, and Travel Rule evidence",
        reason:
          "Counsel and compliance review need KYC/CDD/EDD, beneficial ownership, no anonymous or fictitious wallets, sanctions and blockchain-analytics screening, transaction monitoring, monthly reporting, STR seven-working-day escalation, record retention, Travel Rule/VDA transfer reporting, and FINGate/reporting-format handoff without raw KYC.",
        priority: "P1",
        keywords: [
          "india vda aml cft",
          "fiu-ind reporting",
          "india suspicious transaction report",
          "india travel rule",
          "india transaction monitoring",
          "india risk assessment",
          "fingate vasp reporting",
          "ground of suspicion",
          "india record retention",
          "india no anonymous wallet",
          "india beneficial ownership"
        ]
      }
    ],
    counselQuestions: [
      "Which India VDA activity-scope, FIU-IND registration, Reporting Entity, AML/CFT/CPF program, Designated Director, Principal Officer, bank/FI account, or client-money assumptions should local counsel review?",
      "What metadata-only evidence shows KYC/CDD/EDD, beneficial ownership, sanctions/blockchain analytics screening, transaction monitoring, STR/monthly reporting, record retention, Travel Rule, FINGate reporting, and no anonymous or fictitious wallet controls without raw KYC, PAN/Aadhaar, OVDs, wallet secrets, or customer records?"
    ],
    localCounselRole: "India VDA / PMLA AML counsel",
    effectiveAsOf: "2023-03-10",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against India eGazette S.O. 1072(E), FIU-IND AML/CFT VDA guidelines, FIU-IND downloads registry, PIB enforcement press release, and VASP reporting-format manual for activity scope, registration, AML/CFT/CPF, KYC/CDD/EDD, reporting, recordkeeping, STR, risk assessment, Travel Rule, and evidence-routing metadata; route interpretation to India local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "th-sec-digital-asset-business-custody-aml",
    jurisdiction: "Thailand",
    regulator: "Thailand Securities and Exchange Commission / Anti-Money Laundering Office",
    sourceName: "Digital Asset Business Operators, custody amendments, and AMLO AML/CFT measures",
    sourceUrl: "https://www.sec.or.th/EN/pages/lawandregulations/digitalassetbusiness.aspx",
    citation:
      "Emergency Decree on Digital Asset Businesses B.E. 2561 (2018) Sections 7 and 26; SEC custody amendments effective 1 March 2022; SEC custodial wallet provider amendments effective 16 January 2025; AMLO AML/CFT Laws/Policy/Measures",
    topic: "custody",
    summary:
      "Prepare Thailand digital asset exchange, broker, dealer, custodial wallet provider, licensing, client-asset custody, transfer approval, daily reconciliation, AML/CDD, high-risk customer, and no-raw-KYC evidence for Thailand counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "thailand",
      "thai",
      "digital asset business",
      "digital asset exchange",
      "digital asset broker",
      "digital asset dealer",
      "digital asset custodial wallet provider",
      "custodial wallet provider",
      "client assets",
      "client asset custody",
      "hot wallet",
      "cold wallet",
      "amlo",
      "aml",
      "cdd",
      "enhanced due diligence"
    ],
    evidenceRequests: [
      {
        id: "th-sec-digital-asset-license-scope-custody",
        title: "Thailand digital asset business license, custody, and client-asset evidence",
        reason:
          "Thailand digital asset review needs exchange, broker, dealer, or custodial-wallet-provider scope, licensing route, SEC readiness, client-asset records, transfer approvals, daily reconciliation, and no-client-asset-use controls before local counsel reliance.",
        priority: "P1",
        keywords: [
          "thailand digital asset",
          "digital asset business",
          "digital asset exchange",
          "digital asset broker",
          "digital asset dealer",
          "license",
          "custody and signer control",
          "custody boundaries",
          "transfer controls",
          "client asset",
          "daily reconciliation",
          "custodial wallet provider"
        ]
      },
      {
        id: "th-amlo-digital-asset-aml-cdd-risk-controls",
        title: "Thailand AMLO AML/CDD and high-risk customer controls",
        reason:
          "Thailand review needs AML law financial-institution status, customer identification, CDD/EDD, beneficial ownership, high-risk area/customer handling, internal controls, training, reporting-owner, and no-raw-KYC handoff evidence.",
        priority: "P1",
        keywords: [
          "thailand amlo",
          "amlo",
          "aml",
          "cdd",
          "edd",
          "beneficial ownership",
          "high risk customer",
          "customer identification",
          "internal control",
          "training",
          "reporting owner",
          "no raw kyc"
        ]
      }
    ],
    counselQuestions: [
      "Which Thailand digital asset business activities, SEC license route, custodial-wallet-provider model, or client-asset custody assumptions need Thailand counsel review?",
      "What AML/CDD, high-risk customer, beneficial-owner, internal-control, and reporting evidence can be prepared without raw KYC or customer records?"
    ],
    localCounselRole: "Thailand digital asset / AML counsel",
    effectiveAsOf: "2022-03-01",
    lastReviewedAt: "2026-07-04",
    reviewerNotes:
      "Source metadata reviewed against the Thailand SEC Digital Asset Business Operators page, the Emergency Decree Sections 7 and 26, SEC custody amendment notices effective 1 March 2022 and 16 January 2025, and AMLO AML/CFT measures for licensing, client-asset custody, transfer approval, daily reconciliation, AML/CDD, high-risk customer, and no-raw-KYC evidence routing; route interpretation to Thailand local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "id-ojk-digital-financial-asset-crypto-trading",
    jurisdiction: "Indonesia",
    regulator: "Indonesia Financial Services Authority (OJK)",
    sourceName: "Digital Financial Asset and Crypto Asset Trading licensing, regulations, and whitelist",
    sourceUrl: "https://ojk.go.id/en/fungsi-utama/itsk/perizinan-itsk-aset-keuangan-digital-aset-kripto/default.aspx",
    citation:
      "OJK POJK Number 27 of 2024, as amended by POJK Number 23 of 2025; SEOJK Number 20/SEOJK.07/2024; OJK whitelist press release, 19 December 2025; POJK Number 16 of 2025",
    topic: "activity-scope",
    summary:
      "Prepare Indonesia digital financial asset and crypto asset trading operator licensing, PAKD/CPAKD whitelist, trading activity, product or instrument registration, reporting, governance, main-party competence, and consumer-protection evidence for Indonesia counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "indonesia",
      "indonesian",
      "ojk",
      "digital financial asset",
      "digital financial assets",
      "crypto asset trading",
      "crypto assets trading",
      "aset kripto",
      "aset keuangan digital",
      "pakd",
      "cpakd",
      "whitelist",
      "sprint",
      "pojk",
      "seojk",
      "consumer protection"
    ],
    evidenceRequests: [
      {
        id: "id-ojk-dfa-crypto-licensing-whitelist",
        title: "Indonesia OJK digital financial asset trading licensing and whitelist evidence",
        reason:
          "Indonesia digital financial asset review needs OJK transition scope, PAKD or CPAKD operator status, SPRINT licensing route, product or service channel, whitelist evidence, app or website mapping, consumer-protection owner, and unlicensed-promotion controls before local counsel reliance.",
        priority: "P1",
        keywords: [
          "indonesia digital financial asset",
          "indonesia crypto asset trading",
          "ojk",
          "pakd",
          "cpakd",
          "whitelist",
          "sprint",
          "license",
          "licensed registered",
          "official channels",
          "consumer protection"
        ]
      },
      {
        id: "id-ojk-dfa-crypto-governance-reporting",
        title: "Indonesia OJK trading governance, product, and reporting controls",
        reason:
          "Counsel and compliance review need POJK/SEOJK source mapping, product or instrument registration assumptions, trading and derivative activity scope, daily or monthly reporting, business-plan owner, main-party competence and compliance assessment, governance, integrity, and no-raw-KYC evidence.",
        priority: "P1",
        keywords: [
          "pojk 27",
          "pojk 23",
          "seojk 20",
          "business plan",
          "daily report",
          "monthly report",
          "product registration",
          "instrument registration",
          "main parties",
          "competence",
          "compliance assessment",
          "governance",
          "integrity",
          "no raw kyc"
        ]
      }
    ],
    counselQuestions: [
      "Which Indonesia digital financial asset or crypto asset trading activities, OJK licensing route, PAKD/CPAKD status, whitelist, app or website channel, or product/instrument assumptions need Indonesia counsel review?",
      "What governance, reporting, business-plan, main-party competence, consumer-protection, and no-raw-KYC evidence should be prepared before counsel or compliance handoff?"
    ],
    localCounselRole: "Indonesia digital financial asset / crypto regulatory counsel",
    effectiveAsOf: "2025-01-10",
    lastReviewedAt: "2026-07-04",
    reviewerNotes:
      "Source metadata reviewed against OJK licensing page, the January 10 2025 Bappebti-to-OJK transfer notice, POJK 27/2024 and POJK 23/2025 regulatory pages, the December 19 2025 OJK whitelist press release, and POJK 16/2025 governance and main-party competence notice for licensing, whitelist, trading scope, reporting, governance, consumer-protection, and no-raw-KYC evidence routing; route interpretation to Indonesia local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "my-sc-bnm-digital-asset-exchange-custody-aml",
    jurisdiction: "Malaysia",
    regulator: "Securities Commission Malaysia / Bank Negara Malaysia",
    sourceName: "Digital Assets regulation, Guidelines on Digital Assets, and AML/CFT - Digital Currencies",
    sourceUrl: "https://www.sc.com.my/digital-assets",
    citation:
      "Securities Commission Malaysia Digital Assets page; Guidelines on Digital Assets issued 28 October 2020, revised 19 August 2024; Bank Negara Malaysia AML/CFT - Digital Currencies (Sector 6) policy document",
    topic: "activity-scope",
    summary:
      "Prepare Malaysia digital asset exchange, digital broker, digital asset custodian, IEO, SC registration, regulated-player, tradeable-asset, BNM reporting-institution, AML/CFT, customer due diligence, STR, and no-raw-KYC evidence for Malaysia counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "malaysia",
      "malaysian",
      "securities commission malaysia",
      "sc malaysia",
      "bank negara malaysia",
      "bnm",
      "digital asset exchange",
      "digital asset custodian",
      "digital broker",
      "rmo-dax",
      "dax operator",
      "ieo",
      "digital currencies",
      "digital currency exchanger",
      "reporting institution",
      "aml/cft",
      "str",
      "shariah"
    ],
    evidenceRequests: [
      {
        id: "my-sc-dax-dac-registration-custody-scope",
        title: "Malaysia SC DAX/DAC registration, trading, and custody evidence",
        reason:
          "Malaysia digital asset review needs SC-regulated activity scope, RMO-DAX or digital broker model, Digital Asset Custodian registration route, official channels, tradeable-asset or IEO assumptions, custody safeguarding owner, and regulated-player source mapping before local counsel reliance.",
        priority: "P1",
        keywords: [
          "malaysia digital asset",
          "securities commission malaysia",
          "sc malaysia",
          "rmo-dax",
          "dax operator",
          "digital asset exchange",
          "digital broker",
          "digital asset custodian",
          "dac",
          "ieo",
          "tradeable asset",
          "shariah",
          "custody safeguarding",
          "official channels"
        ]
      },
      {
        id: "my-bnm-digital-currency-aml-cft-reporting",
        title: "Malaysia BNM digital currency AML/CFT reporting-institution controls",
        reason:
          "Counsel and compliance review need digital currency exchanger scope, AMLA reporting-institution handoff, customer identification, CDD/EDD, beneficial-owner, suspicious transaction reporting, compliance officer, recordkeeping, transparency, and no-raw-KYC evidence.",
        priority: "P1",
        keywords: [
          "bank negara malaysia",
          "bnm",
          "digital currencies",
          "digital currency exchanger",
          "reporting institution",
          "aml/cft",
          "aml cft",
          "customer identification",
          "cdd",
          "edd",
          "beneficial ownership",
          "suspicious transaction report",
          "str",
          "compliance officer",
          "recordkeeping",
          "transparency",
          "no raw kyc"
        ]
      }
    ],
    counselQuestions: [
      "Which Malaysia digital asset exchange, digital broker, digital asset custodian, IEO, tradeable-asset, official-channel, or SC registration assumptions need Malaysia counsel review?",
      "What BNM AML/CFT, reporting-institution, customer identification, CDD/EDD, STR, recordkeeping, and no-raw-KYC evidence should be prepared before counsel or compliance handoff?"
    ],
    localCounselRole: "Malaysia digital asset / AML counsel",
    effectiveAsOf: "2024-08-19",
    lastReviewedAt: "2026-07-04",
    reviewerNotes:
      "Source metadata reviewed against Securities Commission Malaysia Digital Assets and Guidelines on Digital Assets pages, including RMO-DAX, Digital Asset Custodian, IEO, regulated-player and tradeable-asset metadata, plus Bank Negara Malaysia AML/CFT - Digital Currencies (Sector 6) policy metadata for reporting-institution, transparency, AML/CFT, CDD, STR, and no-raw-KYC evidence routing; route interpretation to Malaysia local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "ph-bsp-vasp-casp-risk-management-aml",
    jurisdiction: "Philippines",
    regulator: "Bangko Sentral ng Pilipinas",
    sourceName: "Circular No. 1108 Guidelines for Virtual Asset Service Providers and Memorandum No. M-2026-003",
    sourceUrl: "https://www.bsp.gov.ph/Regulations/Issuances/2026/M-2026-003.pdf",
    citation:
      "Bangko Sentral ng Pilipinas Circular No. 1108, Guidelines for Virtual Asset Service Providers, 26 January 2021; BSP Memorandum No. M-2026-003, Reminders on Sound Risk Management Practices when Dealing with Virtual Asset Service Providers, 2026",
    topic: "activity-scope",
    summary:
      "Prepare Philippines VASP, CASP counterparty, BSP registration or Certificate of Authority, VA exchange, transfer, safekeeping, VA custodian, wallet security, AML/CFT, risk assessment, due diligence, transaction monitoring, STR, recordkeeping, retail access, and no-raw-KYC evidence for Philippines counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "philippines",
      "philippine",
      "bangko sentral",
      "bsp",
      "virtual asset service provider",
      "vasp",
      "crypto asset service provider",
      "casp",
      "certificate of authority",
      "money service business",
      "va custodian",
      "safekeeping",
      "aml/cft",
      "str",
      "offshore vasp"
    ],
    evidenceRequests: [
      {
        id: "ph-bsp-vasp-registration-activity-custody-scope",
        title: "Philippines BSP VASP registration, activity, and custody-scope evidence",
        reason:
          "Philippines virtual asset review needs BSP registration or Certificate of Authority route, VASP/CASP counterparty status, VA exchange, transfer, safekeeping or administration scope, VA custodian assumptions, wallet security owner, capital and operational-control handoff, and retail/offshore access controls before local counsel reliance.",
        priority: "P1",
        keywords: [
          "philippines vasp",
          "philippine vasp",
          "bangko sentral",
          "bsp",
          "certificate of authority",
          "money service business",
          "virtual asset service provider",
          "crypto asset service provider",
          "casp",
          "va exchange",
          "va transfer",
          "va custodian",
          "safekeeping",
          "wallet security",
          "offshore vasp",
          "retail access"
        ]
      },
      {
        id: "ph-bsp-aml-cft-due-diligence-monitoring",
        title: "Philippines BSP AML/CFT due-diligence, monitoring, and STR controls",
        reason:
          "Counsel and compliance review need VASP counterparty risk assessment, AML/CFT/CTPF process mapping, standard due diligence or EDD, proof-of-registration validation, adverse-media scan, FATF Recommendation 16/payment transparency, transaction monitoring, STR workflow, recordkeeping, staff training, and no-raw-KYC evidence.",
        priority: "P1",
        keywords: [
          "philippines aml cft",
          "bsp aml",
          "mtp program",
          "aml cft ctpf",
          "risk assessment",
          "due diligence",
          "edd",
          "proof of registration",
          "adverse media",
          "fatf recommendation 16",
          "payment transparency",
          "transaction monitoring",
          "suspicious transaction report",
          "str",
          "record keeping",
          "recordkeeping",
          "staff training",
          "no raw kyc"
        ]
      }
    ],
    counselQuestions: [
      "Which Philippines VASP, CASP counterparty, BSP registration or Certificate of Authority, VA exchange, transfer, safekeeping, VA custodian, wallet-security, retail-access, or offshore-VASP assumptions need Philippines counsel review?",
      "What AML/CFT/CTPF, due-diligence, EDD, proof-of-registration, adverse-media, payment-transparency, transaction-monitoring, STR, recordkeeping, staff-training, and no-raw-KYC evidence should be prepared before counsel or compliance handoff?"
    ],
    localCounselRole: "Philippines virtual asset / AML counsel",
    effectiveAsOf: "2026-01-01",
    lastReviewedAt: "2026-07-04",
    reviewerNotes:
      "Source metadata reviewed against BSP Circular No. 1108 for VASP activities, Certificate of Authority/MSB route, safekeeping and VA custodian scope, wallet security, internal control, AML, consumer-protection, and risk-management evidence routing, plus BSP Memorandum No. M-2026-003 for BSFI dealings with authorized VASPs/CASPs, proof-of-registration validation, retail/offshore VASP access, due diligence/EDD, payment transparency, transaction monitoring, STR, recordkeeping, and staff-training metadata; route interpretation to Philippines local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "za-fsca-fic-casp-licensing-travel-rule",
    jurisdiction: "South Africa",
    regulator: "Financial Sector Conduct Authority / Financial Intelligence Centre",
    sourceName: "FSCA crypto asset financial-product declaration and FIC Directive 9 Travel Rule",
    sourceUrl: "https://www.fic.gov.za/wp-content/uploads/2024/11/Directive-9-Travel-rule-relating-to-crypto-asset-transfers.pdf",
    citation:
      "FSCA General Notice 1350 of 2022, Declaration of a crypto asset as a financial product under the Financial Advisory and Intermediary Services Act, 19 October 2022; FSCA New Financial Services Providers page; FIC Directive 9 concerning the implementation of the Travel Rule relating to crypto asset transfers, 15 November 2024, effective 30 April 2025",
    topic: "activity-scope",
    summary:
      "Prepare South Africa CASP, crypto-asset financial-product, FSCA FSP licence, advice/intermediary/investment-management scope, FIC accountable-institution, Travel Rule, ordering/intermediary/recipient CASP, RMCP, counterparty due diligence, unhosted-wallet, secure transmission, recordkeeping, and no-raw-KYC evidence for South Africa counsel review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "south africa",
      "south african",
      "za",
      "rsa",
      "fsca",
      "fic",
      "crypto asset service provider",
      "casp",
      "financial product",
      "fais",
      "fsp licence",
      "travel rule",
      "directive 9",
      "risk management and compliance programme",
      "rmcp",
      "unhosted wallet"
    ],
    evidenceRequests: [
      {
        id: "za-fsca-casp-fsp-licensing-scope",
        title: "South Africa FSCA CASP/FSP licensing and activity-scope evidence",
        reason:
          "South Africa crypto asset review needs crypto-asset financial-product assumptions, CASP/FSP licence route, advice/intermediary/investment-management activity scope, business model, operational ability, fit-and-proper owner, and no-raw-KYC evidence before local counsel reliance.",
        priority: "P1",
        keywords: [
          "south africa casp",
          "south african casp",
          "za casp",
          "fsca",
          "crypto asset service provider",
          "financial product",
          "fais",
          "fsp licence",
          "fsp license",
          "financial services provider",
          "advice",
          "intermediary",
          "investment management",
          "business model",
          "operational ability",
          "fit and proper"
        ]
      },
      {
        id: "za-fic-travel-rule-rmcp-transfer-controls",
        title: "South Africa FIC Travel Rule, RMCP, and transfer-control evidence",
        reason:
          "Counsel and compliance review need ordering/intermediary/recipient CASP role mapping, originator and beneficiary information handling as metadata, counterparty CASP due diligence, secure transmission, incomplete-transfer suspend/return workflow, unhosted-wallet policy, RMCP owner, recordkeeping, and no-raw-KYC evidence.",
        priority: "P1",
        keywords: [
          "fic directive 9",
          "south africa travel rule",
          "travel rule",
          "ordering crypto asset service provider",
          "intermediary crypto asset service provider",
          "recipient crypto asset service provider",
          "originator",
          "beneficiary",
          "counterparty casp",
          "due diligence",
          "secure transmission",
          "recordkeeping",
          "risk management and compliance programme",
          "rmcp",
          "unhosted wallet",
          "no raw kyc"
        ]
      }
    ],
    counselQuestions: [
      "Which South Africa CASP, crypto-asset financial-product, FAIS/FSP licence, advice, intermediary, investment-management, business-model, or operational-ability assumptions need South Africa counsel review?",
      "What FIC Directive 9 Travel Rule, ordering/intermediary/recipient CASP, counterparty due-diligence, secure transmission, incomplete-transfer, unhosted-wallet, RMCP, recordkeeping, and no-raw-KYC evidence should be prepared before counsel or compliance handoff?"
    ],
    localCounselRole: "South Africa financial services / AML counsel",
    effectiveAsOf: "2025-04-30",
    lastReviewedAt: "2026-07-05",
    reviewerNotes:
      "Source metadata reviewed against the FSCA crypto asset financial-product declaration for crypto-asset definition and FAIS financial-product treatment, the FSCA New Financial Services Providers page for CASP licence routing, and FIC Directive 9 for Travel Rule scope, ordering/intermediary/recipient CASP obligations, counterparty due diligence, secure transmission, RMCP, unhosted-wallet, recordkeeping, and effective-date metadata; route interpretation to South Africa local counsel.",
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
    id: "ch-finma-stablecoin-guidance-06-2024",
    jurisdiction: "Switzerland",
    regulator: "FINMA",
    sourceName: "FINMA Guidance 06/2024 on stablecoins",
    sourceUrl: "https://www.finma.ch/en/news/2024/07/20240726-m-am-06-24-stablecoins/",
    citation: "FINMA Guidance 06/2024, Stablecoins, 26 July 2024",
    topic: "asset-classification",
    summary:
      "Prepare stablecoin redemption-claim, bank-guarantee, banking-law, collective-investment, AML, sanctions, and transfer-risk evidence for Swiss counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "stablecoin",
      "stable coin",
      "fiat peg",
      "redemption claim",
      "bank guarantee",
      "default guarantee",
      "deposit",
      "collective investment scheme",
      "anonymous transfer"
    ],
    evidenceRequests: [
      {
        id: "ch-stablecoin-issuer-guarantee-perimeter",
        title: "Swiss stablecoin issuer and bank-guarantee perimeter evidence",
        reason:
          "Swiss stablecoin review needs issuer, holder redemption claim, stabilisation mechanism, underlying assets, bank-guarantee, banking-law, and collective-investment perimeter assumptions before counsel reliance.",
        priority: "P1",
        keywords: [
          "stablecoin issuer",
          "redemption claim",
          "stabilisation mechanism",
          "underlying assets",
          "bank guarantee",
          "default guarantee",
          "banking law",
          "collective investment scheme"
        ]
      },
      {
        id: "ch-stablecoin-aml-sanctions-transfer-risk",
        title: "Swiss stablecoin AML, sanctions, and transfer-risk evidence",
        reason:
          "FINMA stablecoin review should preserve metadata-only evidence for money-laundering, terrorist-financing, sanctions-circumvention, holder identification, transfer-risk, and monitoring controls without raw customer records.",
        priority: "P1",
        keywords: [
          "stablecoin aml",
          "money laundering",
          "terrorist financing",
          "sanctions circumvention",
          "holder identification",
          "transfer risk",
          "anonymous transfer",
          "transaction monitoring"
        ]
      }
    ],
    counselQuestions: [
      "Which stablecoin redemption-claim, reserve, guarantee, banking-law, or collective-investment assumptions need Swiss counsel review?",
      "What AML, sanctions, holder-identification, transfer-risk, and monitoring evidence can be shared as metadata-only audit preparation?"
    ],
    localCounselRole: "Swiss stablecoin / financial services counsel",
    effectiveAsOf: "2024-07-26",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against FINMA Guidance 06/2024 on stablecoins for issuer, redemption-claim, default-guarantee, banking-law, collective-investment, AML, sanctions, and transfer-risk evidence routing; route interpretation to Swiss local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "uae-vara-va-regulations-activity-scope",
    jurisdiction: "United Arab Emirates",
    regulator: "Dubai Virtual Assets Regulatory Authority",
    sourceName: "VARA Virtual Assets and Related Activities Regulations 2023",
    sourceUrl: "https://rulebooks.vara.ae/rulebook/virtual-assets-and-related-activities-regulations-2023",
    citation: "VARA Virtual Assets and Related Activities Regulations 2023",
    topic: "activity-scope",
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
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against the current VARA rulebook page effective 19 June 2025 for activity-scope, issuance, licensing, AML/CFT, market-conduct, marketing-access, and counsel-handoff evidence routing; route interpretation to UAE local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "uae-vara-marketing-regulations-2024",
    jurisdiction: "United Arab Emirates",
    regulator: "Dubai Virtual Assets Regulatory Authority",
    sourceName: "Regulations on the Marketing of Virtual Assets and Related Activities 2024",
    sourceUrl: "https://rulebooks.vara.ae/rulebook/marketing-regulations-0",
    citation: "VARA Regulations on the Marketing of Virtual Assets and Related Activities 2024",
    topic: "marketing",
    summary:
      "Prepare UAE virtual-asset marketing approval, risk-warning, audience targeting, KOL remuneration, incentives, and marketing recordkeeping evidence for Dubai VARA counsel review.",
    triggerFlagIds: [],
    triggerKeywords: [
      "marketing",
      "promotion",
      "promotional",
      "advertising",
      "kol",
      "key opinion leader",
      "influencer",
      "endorsement",
      "incentive",
      "risk warning"
    ],
    evidenceRequests: [
      {
        id: "uae-vara-marketing-approval-risk-warning",
        title: "UAE VARA marketing approval and risk-warning evidence",
        reason:
          "UAE virtual-asset marketing review needs VASP approval route, audience targeting, promotional label, risk-warning, and misleading-claims control evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "vara approval",
          "vasp approval",
          "marketing approval",
          "approval route",
          "audience restrictions",
          "risk warning",
          "promotional label",
          "guaranteed return",
          "misleading"
        ]
      },
      {
        id: "uae-vara-kol-incentive-recordkeeping",
        title: "UAE VARA KOL, incentive, and marketing recordkeeping evidence",
        reason:
          "KOL, influencer, paid-post, incentive, and campaign-distribution workflows should retain remuneration disclosures, incentive confirmation, distribution details, and recordkeeping owner evidence for counsel review.",
        priority: "P1",
        keywords: [
          "kol",
          "key opinion leader",
          "influencer",
          "remuneration",
          "paid post",
          "incentive",
          "compliance confirmation",
          "recordkeeping",
          "marketing record",
          "distribution details",
          "eight year"
        ]
      }
    ],
    counselQuestions: [
      "Which VARA marketing approval, VASP approval, risk-warning, and audience-targeting assumptions should UAE counsel review?",
      "What KOL, incentive, remuneration-disclosure, distribution, and recordkeeping evidence should be retained without storing raw customer data or credentials?"
    ],
    localCounselRole: "UAE virtual-asset marketing counsel",
    effectiveAsOf: "2024-10-01",
    lastReviewedAt: "2026-07-01",
    reviewerNotes:
      "Source metadata reviewed against VARA Marketing Regulations 2024 for virtual-asset marketing scope, approval routing, risk-warning, KOL remuneration, incentive, and recordkeeping evidence routing; route interpretation to UAE local counsel.",
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
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against the current VARA Compliance and Risk Management Rulebook page effective 19 June 2025 for compliance management, MLRO/AML-CFT controls, CDD, Travel Rule, sanctions, books and records, audit, client virtual assets, proof-of-reserves, reconciliation, and counsel-handoff evidence routing; route interpretation to UAE local counsel.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
  },
  {
    id: "de-bafin-micar-casp-custody-authorisation",
    jurisdiction: "Germany",
    regulator: "BaFin / Deutsche Bundesbank",
    sourceName: "MiCAR services and activities in connection with crypto-assets",
    sourceUrl: "https://www.bafin.de/EN/Aufsicht/MiCAR/MiCAR_artikel_en.html",
    citation: "Regulation (EU) 2023/1114 Articles 60, 62, and 75; BaFin/Bundesbank MiCAR supervisory information",
    topic: "custody",
    summary:
      "Prepare Germany crypto-asset service scope, BaFin authorisation or Article 60 notification assumptions, custody safeguarding, client-position, segregation, return, AML/data, and local-counsel handoff evidence for Germany custody review.",
    triggerFlagIds: ["custody", "retail", "public-launch", "sensitive-data"],
    triggerKeywords: [
      "germany",
      "german",
      "deutschland",
      "bafin",
      "micar",
      "casp",
      "crypto custody",
      "crypto-asset service",
      "crypto asset service",
      "hosted wallet",
      "client crypto assets",
      "private cryptographic keys"
    ],
    evidenceRequests: [
      {
        id: "de-micar-casp-authorisation-notification-intake",
        title: "Germany MiCAR CASP authorisation and Article 60 notification evidence",
        reason:
          "Germany crypto-asset service review needs service scope, BaFin route, CASP authorisation or Article 60 notification assumptions, home Member State, German client access, and reviewer-owner evidence before counsel reliance.",
        priority: "P1",
        keywords: [
          "germany micar",
          "bafin",
          "casp authorisation",
          "article 60",
          "article 62",
          "notification",
          "home member state",
          "german client access",
          "germany service scope"
        ]
      },
      {
        id: "de-micar-custody-safeguarding-client-position",
        title: "Germany MiCAR custody safeguarding and client-position evidence",
        reason:
          "Custody review needs Article 75 custody policy, client-position register, statement cadence, segregation, return process, means-of-access handling, private-key exclusion, and no-raw-customer-record evidence.",
        priority: "P1",
        keywords: [
          "article 75",
          "custody policy",
          "client register",
          "position statement",
          "segregation",
          "return crypto assets",
          "means of access",
          "private cryptographic keys",
          "client crypto assets"
        ]
      }
    ],
    counselQuestions: [
      "Which Germany crypto-asset service scope, BaFin authorisation, Article 60 notification, or Article 62 application assumptions need local counsel review?",
      "What evidence shows custody policy, client-position records, segregation, return process, means-of-access handling, and private-key exclusion without storing raw customer records?"
    ],
    localCounselRole: "Germany BaFin / MiCAR crypto custody counsel",
    effectiveAsOf: "2024-12-30",
    lastReviewedAt: "2026-07-03",
    reviewerNotes:
      "Source metadata reviewed against BaFin/Bundesbank MiCAR supervisory information and BaFin crypto custody guidance for Germany service-scope, authorisation/notification, Article 75 custody, client-position, segregation, return, means-of-access, and evidence-routing prompts; route interpretation to Germany local counsel.",
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
        keywords: [
          "crypto security",
          "token rights",
          "investment expectation",
          "public distribution",
          "disclosure assumptions",
          "intermediary assumptions"
        ]
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
