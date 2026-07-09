import type { AuditFlag, AuditResult } from "./auditEngine";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type JurisdictionPackControlStatus = "needs-evidence" | "evidence-ready";

export type JurisdictionPackControl = {
  id: string;
  title: string;
  owner: "Counsel" | "Compliance" | "Engineering" | "Product";
  priority: "P0" | "P1" | "P2";
  relatedFlagIds: string[];
  evidenceKeywords: string[];
  status: JurisdictionPackControlStatus;
  evidenceLabels: string[];
};

export type LocalCounselRoute = {
  recommendedRole: string;
  trigger: string;
  handoffNote: string;
};

export type JurisdictionPack = {
  id: string;
  packVersion: "lexproof-jurisdiction-pack-v1";
  jurisdiction: string;
  summary: string;
  controls: JurisdictionPackControl[];
  localCounselRoute: LocalCounselRoute;
  source: "LexProof jurisdiction pack v1 for audit preparation. Not legal advice.";
  notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only.";
};

type ControlTemplate = Omit<JurisdictionPackControl, "status" | "evidenceLabels">;

type PackTemplate = {
  jurisdiction:
    | "United States"
    | "European Union"
    | "United Kingdom"
    | "Singapore"
    | "Hong Kong"
    | "Japan"
    | "Canada"
    | "Australia"
    | "South Korea"
    | "India"
    | "Thailand"
    | "Indonesia"
    | "Malaysia"
    | "Philippines"
    | "South Africa"
    | "Switzerland"
    | "Germany"
    | "United Arab Emirates"
    | "Brazil";
  aliases: string[];
  summary: string;
  recommendedRole: string;
  controls: ControlTemplate[];
};

const SOURCE: JurisdictionPack["source"] = "LexProof jurisdiction pack v1 for audit preparation. Not legal advice.";

const PACK_TEMPLATES: PackTemplate[] = [
  {
    jurisdiction: "United States",
    aliases: ["united states", "usa", "us"],
    summary: "Prepare issue-specific review for offering, custody, data handling, AI output, and public launch controls.",
    recommendedRole: "US securities / fintech counsel",
    controls: [
      {
        id: "us-offering-disclosure-control",
        title: "Offering and disclosure control",
        owner: "Counsel",
        priority: "P0",
        relatedFlagIds: ["asset-yield", "retail", "public-launch"],
        evidenceKeywords: ["disclosure approval", "offering memo", "eligibility review", "go-live signoff", "token terms"]
      },
      {
        id: "us-reg-d-accredited-investor-verification-control",
        title: "Regulation D eligibility and accredited-investor verification control",
        owner: "Counsel",
        priority: "P0",
        relatedFlagIds: ["asset-yield", "retail", "public-launch"],
        evidenceKeywords: [
          "control-us-sec-reg-d-accredited-investor-verification",
          "regulation d",
          "rule 506",
          "offering exemption",
          "private placement",
          "investor eligibility",
          "accredited investor",
          "purchaser status",
          "subscription",
          "solicitation"
        ]
      },
      {
        id: "us-ftc-endorsement-advertising-control",
        title: "FTC advertising claims and endorsement disclosure control",
        owner: "Compliance",
        priority: "P0",
        relatedFlagIds: ["retail", "public-launch"],
        evidenceKeywords: [
          "control-us-ftc-endorsement-advertising-guides",
          "ftc",
          "advertising",
          "advertising claim",
          "claim inventory",
          "claims substantiation",
          "risk disclosure",
          "campaign channel",
          "endorsement",
          "testimonial",
          "material connection",
          "creator disclosure",
          "influencer",
          "approval routing",
          "monitoring owner"
        ]
      },
      {
        id: "us-sec-investment-adviser-marketing-rule-control",
        title: "SEC investment adviser marketing advertisement and promoter control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["retail", "public-launch"],
        evidenceKeywords: [
          "control-us-sec-investment-adviser-marketing-rule",
          "investment adviser marketing",
          "adviser advertisement",
          "advertisement inventory",
          "advisory services",
          "private fund investor audience",
          "testimonial",
          "endorsement",
          "promoter compensation",
          "material conflict disclosure",
          "written agreement",
          "disqualification screening",
          "form adv reporting",
          "performance results",
          "gross performance",
          "net performance",
          "hypothetical performance",
          "books and records",
          "recordkeeping owner"
        ]
      },
      {
        id: "us-cftc-dao-derivatives-platform-control",
        title: "DAO derivatives-platform and FCM/BSA control",
        owner: "Counsel",
        priority: "P0",
        relatedFlagIds: ["retail", "sensitive-data"],
        evidenceKeywords: [
          "cftc dao derivatives",
          "leveraged retail commodity",
          "margined retail commodity",
          "defi trading",
          "trading platform",
          "fcm",
          "commodity interest",
          "bsa cip",
          "customer identification program",
          "control transfer",
          "successor dao"
        ]
      },
      {
        id: "us-ofac-virtual-currency-sanctions-control",
        title: "OFAC virtual-currency sanctions screening and blocked-property control",
        owner: "Compliance",
        priority: "P0",
        relatedFlagIds: ["custody", "sensitive-data"],
        evidenceKeywords: [
          "control-us-ofac-virtual-currency-sanctions-compliance",
          "ofac",
          "sanctions screening",
          "wallet screening",
          "wallet risk",
          "geolocation",
          "blocked property",
          "reporting",
          "recordkeeping",
          "escalation",
          "reviewer owner"
        ]
      },
      {
        id: "us-fincen-cvc-msb-bsa-transfer-control",
        title: "FinCEN CVC MSB and BSA transfer-recordkeeping control",
        owner: "Compliance",
        priority: "P0",
        relatedFlagIds: ["custody", "sensitive-data"],
        evidenceKeywords: [
          "control-us-fincen-cvc-msb-bsa-travel-rule",
          "fincen",
          "cvc",
          "convertible virtual currency",
          "business model",
          "hosted wallet",
          "money transmission",
          "msb",
          "aml program",
          "compliance officer",
          "transaction monitoring",
          "sar and ctr",
          "travel rule",
          "transmittal recordkeeping",
          "originator",
          "beneficiary",
          "retention owner",
          "reviewer owner"
        ]
      },
      {
        id: "us-nydfs-bitlicense-custody-customer-protection-control",
        title: "NYDFS BitLicense and custody customer-protection control",
        owner: "Compliance",
        priority: "P0",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "control-us-nydfs-bitlicense-custody-customer-protection",
          "new york",
          "nydfs",
          "bitlicense",
          "limited purpose trust company",
          "nmls",
          "money transmission",
          "customer virtual currency segregation",
          "omnibus wallet",
          "per-customer wallet",
          "internal ledger",
          "reconciliation",
          "beneficial interest disclosure",
          "sub-custody approval",
          "books and records",
          "no proprietary use",
          "reviewer owner"
        ]
      },
      {
        id: "us-genius-payment-stablecoin-issuer-control",
        title: "GENIUS Act payment stablecoin issuer control",
        owner: "Compliance",
        priority: "P0",
        relatedFlagIds: ["custody", "sensitive-data", "public-launch"],
        evidenceKeywords: [
          "control-us-genius-payment-stablecoin-issuer-regime",
          "genius act",
          "payment stablecoin",
          "payment stablecoin issuer",
          "permitted payment stablecoin issuer",
          "state qualified payment stablecoin issuer",
          "federal payment stablecoin regulator",
          "reserve assets",
          "redemption",
          "monthly disclosure",
          "custody",
          "insolvency priority",
          "bsa aml",
          "sanctions compliance",
          "transaction monitoring",
          "suspicious activity",
          "compliance officer",
          "customer-risk metadata boundary",
          "independent review"
        ]
      },
      {
        id: "us-custody-control",
        title: "Custody and wallet authority control",
        owner: "Compliance",
        priority: "P0",
        relatedFlagIds: ["custody"],
        evidenceKeywords: ["signer control", "wallet control", "withdrawal authority", "incident response"]
      },
      {
        id: "us-data-export-control",
        title: "Sensitive data export control",
        owner: "Engineering",
        priority: "P1",
        relatedFlagIds: ["sensitive-data", "ai-workflow"],
        evidenceKeywords: ["redaction", "access control", "data handling", "model payload"]
      },
      {
        id: "us-aba-formal-opinion-512-legal-ai-control",
        title: "ABA Formal Opinion 512 legal AI professional-responsibility control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["ai-workflow", "sensitive-data"],
        evidenceKeywords: [
          "control-us-aba-formal-opinion-512-generative-ai-law-practice",
          "aba formal opinion 512",
          "gai tool capability",
          "model limitations",
          "confidentiality controls",
          "prohibited inputs",
          "client information exclusion",
          "verification owner",
          "reviewer training",
          "client communication trigger",
          "supervisory review",
          "outside provider oversight",
          "tribunal candor",
          "fee treatment",
          "expense treatment",
          "no confidential matter text"
        ]
      },
      {
        id: "us-nist-ai-rmf-governance-control",
        title: "NIST AI RMF governance and GenAI provenance control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["ai-workflow", "sensitive-data"],
        evidenceKeywords: [
          "control-us-nist-ai-rmf-governance",
          "nist ai rmf",
          "nist ai 600-1",
          "generative ai profile",
          "use-case context",
          "ai risk owner",
          "risk measurement",
          "model use limits",
          "manage-monitor evidence",
          "output review",
          "unsupported claims",
          "source provenance",
          "content-risk escalation",
          "human accountability",
          "confidential matter text exclusion"
        ]
      }
    ]
  },
  {
    jurisdiction: "European Union",
    aliases: ["european union", "eu"],
    summary: "Prepare disclosure provenance, privacy minimization, AI review, and evidence publication boundaries.",
    recommendedRole: "EU crypto-asset / data protection counsel",
    controls: [
      {
        id: "eu-disclosure-provenance-control",
        title: "Crypto-asset disclosure provenance control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "retail", "public-launch", "evidence-anchor"],
        evidenceKeywords: ["whitepaper", "disclosure", "public communication", "manifest", "provenance"]
      },
      {
        id: "eu-mica-marketing-communications-control",
        title: "MiCA marketing communications and white-paper consistency control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["retail", "public-launch"],
        evidenceKeywords: [
          "control-eu-mica-marketing-communications",
          "eu mica marketing",
          "marketing communication",
          "crypto-asset marketing communication",
          "white paper consistency",
          "communication label",
          "offeror website contact",
          "home member state",
          "host member state",
          "member state audience",
          "marketing communication notification",
          "publication timing",
          "source-lineage evidence",
          "reviewer owner"
        ]
      },
      {
        id: "eu-mica-article-75-casp-custody-control",
        title: "MiCA Article 75 CASP custody and administration control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody"],
        evidenceKeywords: [
          "control-eu-mica-casp-custody-administration",
          "mica article 75",
          "casp",
          "crypto-asset service provider",
          "custody administration",
          "custody policy",
          "wallet authority",
          "signer quorum",
          "means of access",
          "return procedure",
          "client crypto-asset",
          "safeguarding",
          "withdrawal approval",
          "emergency pause",
          "incident response",
          "reconciliation",
          "delegation",
          "custody and signer control"
        ]
      },
      {
        id: "eu-dora-ict-operational-resilience-control",
        title: "DORA ICT operational resilience control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data"],
        evidenceKeywords: [
          "control-eu-dora-ict-operational-resilience",
          "dora",
          "digital operational resilience",
          "ict risk",
          "ict risk management",
          "business continuity",
          "incident classification",
          "incident response",
          "escalation owner",
          "testing cadence",
          "recovery",
          "ict third-party service register",
          "critical function",
          "subcontracting",
          "access logging",
          "exit plan",
          "resilience testing",
          "vendor register"
        ]
      },
      {
        id: "eu-tfr-crypto-asset-transfer-information-control",
        title: "TFR crypto-asset transfer information control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data"],
        evidenceKeywords: [
          "control-eu-tfr-crypto-asset-transfer-information",
          "eu tfr",
          "regulation eu 2023/1113",
          "crypto-asset transfer information",
          "transfer of crypto-assets",
          "travel rule",
          "travel rule transfer information",
          "counterparty casp",
          "originator",
          "beneficiary",
          "missing incomplete information",
          "transfer information handling",
          "travel rule exception",
          "counterparty escalation",
          "rejection or return handling",
          "retention owner",
          "reviewer owner"
        ]
      },
      {
        id: "eu-dlt-pilot-market-infrastructure-control",
        title: "DLT Pilot market-infrastructure perimeter control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "custody", "evidence-anchor"],
        evidenceKeywords: [
          "control-eu-dlt-pilot-regime-market-infrastructure",
          "eu dlt pilot",
          "regulation eu 2022/858",
          "dlt financial instrument",
          "tokenized financial instrument",
          "tokenised financial instrument",
          "dlt market infrastructure",
          "dlt mtf",
          "dlt tss",
          "dlt ss",
          "market infrastructure",
          "competent authority",
          "permission exemption",
          "admitted instrument",
          "settlement workflow",
          "safekeeping",
          "liability",
          "operational safeguard",
          "client disclosure",
          "esma",
          "no raw investor records"
        ]
      },
      {
        id: "eu-mica-art-emt-stablecoin-issuer-control",
        title: "MiCA ART/EMT stablecoin issuer control",
        owner: "Counsel",
        priority: "P0",
        relatedFlagIds: ["asset-yield", "custody", "public-launch"],
        evidenceKeywords: [
          "control-eu-mica-art-emt-stablecoin-issuer-regime",
          "asset-referenced token",
          "asset referenced token",
          "e-money token",
          "electronic money token",
          "art issuer",
          "emt issuer",
          "mica stablecoin",
          "stablecoin issuer",
          "home member state",
          "competent authority",
          "authorisation",
          "notification route",
          "white paper",
          "public offer",
          "admission to trading",
          "reserve composition",
          "reserve segregation",
          "reserve custody",
          "liquidity management",
          "redemption rights",
          "par-value redemption",
          "recovery plan",
          "redemption plan"
        ]
      },
      {
        id: "eu-data-minimization-control",
        title: "Data minimization and model-call control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["sensitive-data", "ai-workflow"],
        evidenceKeywords: ["data minimization", "retention", "redaction", "model call", "personal data"]
      },
      {
        id: "eu-ai-act-ai-literacy-governance-control",
        title: "AI Act AI-literacy and human-oversight governance control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["ai-workflow", "sensitive-data"],
        evidenceKeywords: [
          "control-eu-ai-act-ai-literacy-governance",
          "article 4",
          "ai literacy",
          "ai system use policy",
          "permitted model use",
          "prohibited inputs",
          "human review",
          "review owner",
          "non-advice output boundary",
          "human oversight",
          "oversight",
          "escalation",
          "source lineage",
          "risk management",
          "unsupported claims",
          "audit log",
          "review log",
          "source-linked counsel",
          "reviewer authority"
        ]
      },
      {
        id: "eu-ai-act-high-risk-provider-quality-documentation-control",
        title: "AI Act high-risk provider QMS and technical-documentation control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["ai-workflow", "sensitive-data"],
        evidenceKeywords: [
          "control-eu-ai-act-high-risk-provider-quality-documentation",
          "high-risk ai provider",
          "provider role",
          "intended purpose",
          "risk management system",
          "quality management system",
          "instructions for use",
          "human oversight",
          "provider conformity file",
          "technical documentation",
          "data governance",
          "training data governance",
          "validation data",
          "test data",
          "record-keeping logs",
          "accuracy robustness cybersecurity",
          "no raw personal data"
        ]
      },
      {
        id: "eu-ai-act-article-50-transparency-disclosure-control",
        title: "AI Act Article 50 transparency and AI-output labelling control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["ai-workflow", "sensitive-data"],
        evidenceKeywords: [
          "control-eu-ai-act-article-50-transparency-disclosure",
          "article 50",
          "user interaction disclosure",
          "natural persons notice",
          "ai disclosure wording",
          "first interaction timing",
          "clear distinguishable accessible format",
          "exception routing",
          "non-advice output boundary",
          "ai-generated output labelling",
          "machine-readable",
          "detectable marking",
          "human editorial review",
          "editorial control owner",
          "public interest publication routing",
          "not legal advice wording"
        ]
      },
      {
        id: "eu-ai-act-justice-adr-perimeter-control",
        title: "AI Act justice/ADR perimeter and fundamental-rights control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["ai-workflow", "sensitive-data"],
        evidenceKeywords: [
          "control-eu-ai-act-administration-justice-adr-perimeter",
          "justice and adr perimeter",
          "article 6(2)",
          "annex iii point 8(a)",
          "judicial authority",
          "on-behalf-of judicial authority",
          "alternative dispute resolution",
          "legal research",
          "interpreting facts and law",
          "applying law to concrete facts",
          "provider and deployer role",
          "high-risk perimeter",
          "article 26 deployer obligations",
          "article 27 fundamental rights",
          "fundamental rights impact assessment",
          "deployer instructions",
          "input data relevance",
          "incident escalation",
          "output use limits",
          "reviewer authority"
        ]
      }
    ]
  },
  {
    jurisdiction: "United Kingdom",
    aliases: ["united kingdom", "uk", "great britain"],
    summary:
      "Prepare financial-promotion, retail access, custody resilience, MLR registration, AML/CTF/CPF, Travel Rule, AI data-protection, and launch approval controls.",
    recommendedRole: "UK financial promotion / crypto / AI data protection counsel",
    controls: [
      {
        id: "uk-promotion-approval-control",
        title: "Financial promotion and approval control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "retail", "public-launch"],
        evidenceKeywords: ["marketing approval", "financial promotion", "eligibility", "approval gate"]
      },
      {
        id: "uk-fca-crypto-financial-promotions-control",
        title: "FCA cryptoasset financial promotions approval and retail-access control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["retail", "public-launch"],
        evidenceKeywords: [
          "control-uk-fca-crypto-financial-promotions",
          "fca cryptoasset financial promotions",
          "financial promotion copy",
          "approval pack owner",
          "clear-and-balanced review",
          "client categorisation",
          "appropriateness",
          "positive friction",
          "eligibility assumptions",
          "retail-access restrictions"
        ]
      },
      {
        id: "uk-operational-resilience-control",
        title: "Custody operational resilience control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody"],
        evidenceKeywords: ["custody boundaries", "signer", "operational resilience", "escalation", "wallet control"]
      },
      {
        id: "uk-fca-mlr-registration-activity-scope-control",
        title: "FCA MLR registration and cryptoasset activity-scope control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
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
        id: "uk-cryptoasset-aml-travel-rule-control",
        title: "UK cryptoasset AML, SAR, sanctions, and Travel Rule control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
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
      },
      {
        id: "uk-ico-ai-data-protection-governance-control",
        title: "ICO AI data-protection and reviewer-decision governance control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["ai-workflow", "sensitive-data"],
        evidenceKeywords: [
          "control-uk-ico-ai-data-protection-governance",
          "ico ai",
          "ai data protection",
          "data protection",
          "personal data",
          "model payload redaction",
          "redaction",
          "excluded data categories",
          "approved evidence summaries",
          "data protection boundary",
          "personal data exclusion",
          "source lineage",
          "explainability",
          "reviewer",
          "approval log",
          "human review",
          "decision log",
          "review notes",
          "fairness",
          "transparency",
          "lawfulness",
          "security",
          "data minimisation",
          "data minimization"
        ]
      },
      {
        id: "uk-qualifying-stablecoin-issuer-control",
        title: "UK qualifying stablecoin issuer control",
        owner: "Counsel",
        priority: "P0",
        relatedFlagIds: ["asset-yield", "custody", "public-launch"],
        evidenceKeywords: [
          "control-uk-fca-qualifying-stablecoin-issuer-regime",
          "uk qualifying stablecoin",
          "ukqs issuer",
          "uk stablecoin issuer",
          "regulated activity",
          "admission to trading",
          "distribution scope",
          "disclosure owner",
          "governance owner",
          "fca boe handoff",
          "stablecoin backing assets",
          "backing asset",
          "safeguarding",
          "reconciliation",
          "redemption",
          "liquidity",
          "recordkeeping",
          "systemic transition",
          "joint regulation"
        ]
      }
    ]
  },
  {
    jurisdiction: "Singapore",
    aliases: ["singapore", "sg"],
    summary:
      "Prepare product-scope, token distribution, custody, AML/data, and AI review handoff controls for Singapore local counsel.",
    recommendedRole: "Singapore fintech / digital asset counsel",
    controls: [
      {
        id: "sg-product-scope-launch-control",
        title: "Product scope and launch-intake control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "retail", "public-launch"],
        evidenceKeywords: ["product scope", "launch approval", "offering memo", "eligibility", "marketing approval", "token terms"]
      },
      {
        id: "sg-custody-aml-data-control",
        title: "Custody, AML, and data handoff control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "ai-workflow"],
        evidenceKeywords: ["custody", "wallet control", "aml", "kyc", "redaction", "model payload", "human review"]
      }
    ]
  },
  {
    jurisdiction: "Hong Kong",
    aliases: ["hong kong", "hk", "hong kong sar"],
    summary:
      "Prepare VATP client-asset custody, wallet governance, reconciliation, compensation, AML/data, and public access controls for Hong Kong local counsel.",
    recommendedRole: "Hong Kong virtual asset trading platform counsel",
    controls: [
      {
        id: "hk-vatp-client-asset-custody-control",
        title: "VATP client asset custody control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "client asset",
          "client virtual asset",
          "associated entity",
          "segregation",
          "safeguarding",
          "wallet authority",
          "custody and signer control"
        ]
      },
      {
        id: "hk-vatp-wallet-compensation-control",
        title: "Wallet governance and compensation arrangement control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "public-launch"],
        evidenceKeywords: [
          "cold storage",
          "key management",
          "reconciliation",
          "internal audit",
          "monitoring",
          "incident response",
          "compensation arrangement",
          "custody and signer control"
        ]
      },
      {
        id: "hk-hkma-stablecoin-issuer-control",
        title: "HKMA stablecoin issuer licensing, reserve, and AML/CFT control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "retail", "public-launch", "sensitive-data"],
        evidenceKeywords: [
          "hong kong stablecoin issuer",
          "fiat-referenced stablecoin",
          "stablecoins ordinance",
          "hkma licence",
          "regulated stablecoin activity",
          "reserve assets",
          "full backing",
          "redemption",
          "aml cft",
          "customer due diligence",
          "blockchain analytics",
          "suspicious transaction",
          "record keeping"
        ]
      }
    ]
  },
  {
    jurisdiction: "Japan",
    aliases: ["japan", "jp"],
    summary:
      "Prepare crypto-asset exchange service scope, user-asset protection, segregated custody, cold-wallet/offline management, reconciliation, leakage-response, AML/data, and local counsel handoff controls for Japan.",
    recommendedRole: "Japan crypto-asset exchange / custody counsel",
    controls: [
      {
        id: "jp-fsa-registration-user-asset-control",
        title: "FSA registration and user-asset protection control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "japan crypto asset exchange",
          "fsa registration",
          "user asset protection",
          "information to users",
          "contract details",
          "custody and signer control"
        ]
      },
      {
        id: "jp-cold-wallet-leakage-response-control",
        title: "Cold-wallet, reconciliation, and leakage-response control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data"],
        evidenceKeywords: [
          "cold wallet",
          "offline environment",
          "segregated wallet",
          "daily reconciliation",
          "leakage response",
          "separate management audit",
          "custody and signer control"
        ]
      }
    ]
  },
  {
    jurisdiction: "Canada",
    aliases: ["canada", "ca", "canadian"],
    summary:
      "Prepare crypto asset trading platform registration, enhanced PRU, client-asset custody and segregation, acceptable third-party custodian, no re-hypothecation, no leverage, VRCA consent, investor-protection, and local counsel handoff controls for Canada.",
    recommendedRole: "Canada crypto asset trading platform counsel",
    controls: [
      {
        id: "ca-csa-registration-pru-control",
        title: "CSA registration and PRU investor-protection control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "canada csa pru",
          "pre-registration undertaking",
          "registration application",
          "canadian client",
          "no leverage",
          "value-referenced crypto asset",
          "prior written consent"
        ]
      },
      {
        id: "ca-client-asset-custody-segregation-control",
        title: "Client-asset custody, segregation, and custodian assurance control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data"],
        evidenceKeywords: [
          "acceptable third-party custodian",
          "third-party custodians to hold not less than 80%",
          "hold assets in trust",
          "separate and apart",
          "designated trust account",
          "pledge re-hypothecate",
          "soc 2",
          "insurance risk mitigation"
        ]
      }
    ]
  },
  {
    jurisdiction: "Australia",
    aliases: ["australia", "au", "australian"],
    summary:
      "Prepare digital-asset financial-services scope, AFS licensing assumptions, crypto custody controls, AUSTRAC VASP AML/CTF, CDD, travel-rule, reporting, recordkeeping, and local counsel handoff controls for Australia.",
    recommendedRole: "Australia digital assets / AML-CTF counsel",
    controls: [
      {
        id: "au-asic-financial-services-custody-control",
        title: "ASIC digital-asset financial services and custody control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "australia asic digital asset",
          "afs licence",
          "financial product",
          "custodial depository service",
          "client assets separate",
          "cold storage",
          "independent audit"
        ]
      },
      {
        id: "au-austrac-vasp-aml-ctf-control",
        title: "AUSTRAC VASP AML/CTF, CDD, and recordkeeping control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
          "austrac",
          "virtual asset service provider",
          "aml/ctf program",
          "customer due diligence",
          "travel rule",
          "suspicious matter report",
          "threshold transaction report",
          "seven years"
        ]
      }
    ]
  },
  {
    jurisdiction: "South Korea",
    aliases: ["south korea", "korea", "kr", "republic of korea", "korean"],
    summary:
      "Prepare VASP registration/reporting, user-asset protection, deposit custody, cold-wallet, insurance/reserve, abnormal transaction monitoring, AML/CFT, CDD/EDD, STR, real-name account, and local counsel handoff controls for South Korea.",
    recommendedRole: "South Korea virtual asset / AML counsel",
    controls: [
      {
        id: "kr-fsc-user-asset-protection-custody-control",
        title: "FSC user-asset protection and custody control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "korea vasp user protection",
          "user deposits at banks",
          "users virtual assets separate",
          "80 percent cold wallet",
          "cold wallet",
          "insurance reserve",
          "abnormal trading monitoring",
          "korean language whitepaper"
        ]
      },
      {
        id: "kr-kofiu-vasp-reporting-aml-control",
        title: "KoFIU VASP reporting, AML/CFT, CDD, and STR control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
          "kofiu",
          "vasp reporting",
          "compliance system",
          "major shareholders",
          "isms",
          "real-name verified checking account",
          "customer due diligence",
          "suspicious transaction report",
          "travel rule"
        ]
      }
    ]
  },
  {
    jurisdiction: "India",
    aliases: ["india", "in", "indian", "bharat"],
    summary:
      "Prepare VDA activity-scope, FIU-IND Reporting Entity registration, AML/CFT/CPF program, Designated Director / Principal Officer, KYC/CDD/EDD, STR/reporting, risk assessment, Travel Rule, record-retention, and local counsel handoff controls for India.",
    recommendedRole: "India VDA / PMLA AML counsel",
    controls: [
      {
        id: "in-fiu-registration-activity-scope-control",
        title: "FIU-IND Reporting Entity registration and activity-scope control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
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
        id: "in-vda-aml-reporting-cdd-str-control",
        title: "India VDA AML/CFT reporting, CDD/EDD, STR, and Travel Rule control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
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
    ]
  },
  {
    jurisdiction: "Thailand",
    aliases: ["thailand", "thai", "th"],
    summary:
      "Prepare digital asset business licensing, exchange/broker/dealer scope, custodial wallet provider, client-asset custody, AML/CDD, high-risk customer, and no-raw-KYC handoff controls for Thailand.",
    recommendedRole: "Thailand digital asset / AML counsel",
    controls: [
      {
        id: "th-sec-digital-asset-business-custody-control",
        title: "SEC digital asset business license and client-asset custody control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "control-th-sec-digital-asset-business-custody-aml",
          "thailand digital asset business",
          "digital asset exchange",
          "digital asset broker",
          "digital asset dealer",
          "custodial wallet provider",
          "sec license route",
          "client asset records",
          "daily reconciliation",
          "transfer approval",
          "client asset use prohibition"
        ]
      },
      {
        id: "th-amlo-aml-cdd-high-risk-control",
        title: "AMLO AML/CDD and high-risk customer control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
          "control-th-sec-digital-asset-business-custody-aml",
          "amlo",
          "cdd edd",
          "beneficial ownership",
          "high-risk customer",
          "customer identification",
          "internal control",
          "training",
          "reporting owner"
        ]
      }
    ]
  },
  {
    jurisdiction: "Indonesia",
    aliases: ["indonesia", "indonesian", "id", "ri"],
    summary:
      "Prepare OJK digital financial asset and crypto asset trading licensing, PAKD/CPAKD whitelist, SPRINT, product/instrument registration, reporting, governance, main-party competence, consumer-protection, and no-raw-KYC handoff controls for Indonesia.",
    recommendedRole: "Indonesia digital financial asset / crypto regulatory counsel",
    controls: [
      {
        id: "id-ojk-dfa-crypto-licensing-whitelist-control",
        title: "OJK digital financial asset trading licensing and whitelist control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "control-id-ojk-digital-financial-asset-crypto-trading",
          "indonesia digital financial asset trading",
          "indonesia crypto asset trading",
          "ojk",
          "pakd",
          "cpakd",
          "whitelist",
          "sprint licensing route",
          "licensed registered operator",
          "official app and website",
          "consumer protection"
        ]
      },
      {
        id: "id-ojk-dfa-governance-reporting-control",
        title: "OJK product, reporting, governance, and main-party control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
          "control-id-ojk-digital-financial-asset-crypto-trading",
          "pojk 27",
          "pojk 23",
          "seojk 20",
          "product registration",
          "instrument registration",
          "daily report",
          "monthly report",
          "business plan",
          "main parties",
          "competence",
          "compliance assessment",
          "governance",
          "integrity"
        ]
      }
    ]
  },
  {
    jurisdiction: "Malaysia",
    aliases: ["malaysia", "malaysian", "my"],
    summary:
      "Prepare SC Malaysia digital asset exchange, digital broker, Digital Asset Custodian, IEO, tradeable-asset, BNM reporting-institution, AML/CFT, STR, recordkeeping, and no-raw-KYC handoff controls for Malaysia.",
    recommendedRole: "Malaysia digital asset / AML counsel",
    controls: [
      {
        id: "my-sc-dax-dac-registration-custody-control",
        title: "SC DAX/DAC registration, trading, and custody control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "control-my-sc-bnm-digital-asset-exchange-custody-aml",
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
          "official channels",
          "custody safeguarding"
        ]
      },
      {
        id: "my-bnm-aml-cft-reporting-control",
        title: "BNM digital currency AML/CFT reporting-institution control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
          "control-my-sc-bnm-digital-asset-exchange-custody-aml",
          "bank negara malaysia",
          "bnm",
          "digital currency exchanger",
          "reporting institution",
          "aml cft",
          "customer identification",
          "cdd edd",
          "beneficial ownership",
          "suspicious transaction report",
          "str",
          "compliance officer",
          "recordkeeping",
          "transparency"
        ]
      }
    ]
  },
  {
    jurisdiction: "Philippines",
    aliases: ["philippines", "philippine", "ph"],
    summary:
      "Prepare BSP VASP registration, CASP counterparty, VA exchange/transfer/safekeeping, VA custodian, wallet security, AML/CFT, due-diligence, transaction-monitoring, STR, recordkeeping, and no-raw-KYC handoff controls for the Philippines.",
    recommendedRole: "Philippines virtual asset / AML counsel",
    controls: [
      {
        id: "ph-bsp-vasp-registration-custody-control",
        title: "BSP VASP registration, activity, and custody-scope control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "control-ph-bsp-vasp-casp-risk-management-aml",
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
          "retail access"
        ]
      },
      {
        id: "ph-bsp-aml-cft-monitoring-control",
        title: "BSP AML/CFT due-diligence, monitoring, and STR control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
          "control-ph-bsp-vasp-casp-risk-management-aml",
          "philippines aml cft",
          "bsp aml",
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
          "recordkeeping",
          "staff training"
        ]
      }
    ]
  },
  {
    jurisdiction: "South Africa",
    aliases: ["south africa", "south african", "za", "rsa"],
    summary:
      "Prepare FSCA CASP/FSP licensing, crypto-asset financial-product, FIC Travel Rule, RMCP, counterparty due-diligence, transfer-control, unhosted-wallet, recordkeeping, and no-raw-KYC handoff controls for South Africa.",
    recommendedRole: "South Africa financial services / AML counsel",
    controls: [
      {
        id: "za-fsca-casp-fsp-licensing-control",
        title: "FSCA CASP/FSP licensing and activity-scope control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
          "control-za-fsca-fic-casp-licensing-travel-rule",
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
        id: "za-fic-travel-rule-rmcp-control",
        title: "FIC Travel Rule, RMCP, and transfer-control evidence",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail"],
        evidenceKeywords: [
          "control-za-fsca-fic-casp-licensing-travel-rule",
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
    ]
  },
  {
    jurisdiction: "Switzerland",
    aliases: ["switzerland", "swiss", "ch"],
    summary:
      "Prepare token classification, offering/prospectus intake, stablecoin issuer, bank-guarantee, AML/sanctions, foundation governance, custody, and banking perimeter evidence for Swiss counsel.",
    recommendedRole: "Swiss DLT / financial services counsel",
    controls: [
      {
        id: "ch-token-classification-control",
        title: "Token classification and prospectus-intake control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "retail", "public-launch"],
        evidenceKeywords: ["token classification", "prospectus", "offering memo", "eligibility", "disclosure", "token terms"]
      },
      {
        id: "ch-stablecoin-issuer-guarantee-perimeter-control",
        title: "Stablecoin issuer and bank-guarantee perimeter control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "retail", "public-launch"],
        evidenceKeywords: [
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
        id: "ch-stablecoin-aml-sanctions-transfer-risk-control",
        title: "Stablecoin AML, sanctions, and transfer-risk control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["retail", "custody", "sensitive-data"],
        evidenceKeywords: [
          "stablecoin aml",
          "money laundering",
          "terrorist financing",
          "sanctions circumvention",
          "holder identification",
          "transfer risk",
          "anonymous transfer",
          "transaction monitoring"
        ]
      },
      {
        id: "ch-foundation-custody-control",
        title: "Foundation, custody, and banking perimeter control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "evidence-anchor"],
        evidenceKeywords: ["foundation", "custody", "wallet control", "banking", "manifest", "anchor", "governance"]
      }
    ]
  },
  {
    jurisdiction: "Germany",
    aliases: ["germany", "de", "deutschland", "german"],
    summary:
      "Prepare BaFin/MiCAR crypto-asset service scope, authorisation or Article 60 notification, custody safeguarding, AML/data, client-position, and local counsel handoff controls.",
    recommendedRole: "Germany BaFin / MiCAR crypto custody counsel",
    controls: [
      {
        id: "de-bafin-micar-casp-authorisation-control",
        title: "BaFin MiCAR CASP authorisation and notification control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["custody", "retail", "public-launch"],
        evidenceKeywords: [
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
        id: "de-bafin-custody-safeguarding-control",
        title: "MiCAR custody safeguarding and client-position control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data"],
        evidenceKeywords: [
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
    ]
  },
  {
    jurisdiction: "United Arab Emirates",
    aliases: ["united arab emirates", "uae", "dubai", "abu dhabi"],
    summary:
      "Prepare virtual-asset activity scope, marketing, custody, cross-border access, and data/model handoff controls for UAE local counsel.",
    recommendedRole: "UAE virtual-assets / financial regulatory counsel",
    controls: [
      {
        id: "uae-virtual-asset-scope-control",
        title: "Virtual asset activity scope control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "retail", "public-launch"],
        evidenceKeywords: ["virtual asset", "activity scope", "offering memo", "eligibility", "launch approval", "token terms"]
      },
      {
        id: "uae-marketing-approval-audience-control",
        title: "Marketing approval and audience-control control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["retail", "public-launch"],
        evidenceKeywords: [
          "vara approval",
          "vasp approval",
          "marketing approval",
          "approval route",
          "risk warning",
          "audience restrictions",
          "promotional label"
        ]
      },
      {
        id: "uae-vara-2024-marketing-regulations-control",
        title: "VARA 2024 marketing approval, KOL, and recordkeeping control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["retail", "public-launch"],
        evidenceKeywords: [
          "control-uae-vara-marketing-regulations-2024",
          "vara approval",
          "vasp approval",
          "approval route",
          "promotional label",
          "guaranteed return claim",
          "misleading-claim checks",
          "kol",
          "key opinion leader",
          "remuneration",
          "paid post scope",
          "incentive compliance confirmation",
          "recordkeeping owner",
          "marketing record",
          "distribution details",
          "eight year archive"
        ]
      },
      {
        id: "uae-kol-incentive-recordkeeping-control",
        title: "KOL, incentive, and marketing recordkeeping control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["retail", "public-launch"],
        evidenceKeywords: [
          "kol",
          "key opinion leader",
          "influencer",
          "remuneration",
          "incentive",
          "compliance confirmation",
          "recordkeeping",
          "marketing record",
          "distribution details",
          "eight year"
        ]
      },
      {
        id: "uae-marketing-custody-access-control",
        title: "Marketing, custody, and cross-border access control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "ai-workflow"],
        evidenceKeywords: ["marketing approval", "cross-border", "wallet control", "custody", "kyc", "redaction", "human review"]
      }
    ]
  },
  {
    jurisdiction: "Brazil",
    aliases: ["brazil", "br", "brasil"],
    summary:
      "Prepare virtual asset service authorization, AML/CFT, crypto-security classification, disclosure, and public distribution evidence for Brazil counsel.",
    recommendedRole: "Brazil virtual-assets / capital markets counsel",
    controls: [
      {
        id: "br-vasp-authorization-aml-control",
        title: "Virtual asset service authorization and AML/CFT control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "retail", "public-launch"],
        evidenceKeywords: ["virtual asset service", "authorization", "aml", "cft", "kyc", "sanctions", "transaction monitoring"]
      },
      {
        id: "br-crypto-security-disclosure-control",
        title: "Crypto-security classification and disclosure control",
        owner: "Counsel",
        priority: "P1",
        relatedFlagIds: ["asset-yield", "retail", "public-launch", "evidence-anchor"],
        evidenceKeywords: ["crypto security", "token classification", "public offering", "disclosure", "distribution", "investment"]
      }
    ]
  }
];

export function createJurisdictionPacks(project: ProjectProfile, audit: AuditResult): JurisdictionPack[] {
  return project.jurisdictions.map((jurisdiction, index) => {
    const template = matchPackTemplate(jurisdiction);
    return template
      ? createKnownPack(template, audit, project.evidenceItems)
      : createFallbackPack(jurisdiction, audit.flags, index + 1);
  });
}

function createKnownPack(template: PackTemplate, audit: AuditResult, evidenceItems: EvidenceItem[]): JurisdictionPack {
  const activeFlagIds = new Set(audit.flags.map((flag) => flag.id));
  const controls = template.controls
    .filter((control) => control.relatedFlagIds.some((flagId) => activeFlagIds.has(flagId)))
    .map((control) => withEvidenceStatus(control, evidenceItems, template.aliases));

  return {
    id: slug(template.jurisdiction),
    packVersion: "lexproof-jurisdiction-pack-v1",
    jurisdiction: template.jurisdiction,
    summary: template.summary,
    controls,
    localCounselRoute: {
      recommendedRole: template.recommendedRole,
      trigger: audit.flags[0]?.title ?? "Jurisdiction-specific review",
      handoffNote: "Route pack, evidence labels, open questions, and manifest hash to local counsel before external reliance."
    },
    source: SOURCE,
    notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
  };
}

function createFallbackPack(jurisdiction: string, flags: AuditFlag[], sequence: number): JurisdictionPack {
  const trimmed = jurisdiction.trim() || `Other jurisdiction ${sequence}`;
  return {
    id: `other-${slug(trimmed)}-${sequence}`,
    packVersion: "lexproof-jurisdiction-pack-v1",
    jurisdiction: trimmed,
    summary: "Prepare local counsel intake for jurisdiction assumptions, user exposure, evidence needs, and launch boundaries.",
    controls: [
      {
        id: `other-${slug(trimmed)}-intake-control`,
        title: "Local counsel intake control",
        owner: "Counsel",
        priority: "P2",
        relatedFlagIds: flags.map((flag) => flag.id),
        evidenceKeywords: ["local counsel", "jurisdiction assumptions", "launch boundaries"],
        status: "needs-evidence",
        evidenceLabels: []
      }
    ],
    localCounselRoute: {
      recommendedRole: "Local counsel",
      trigger: "Unmapped jurisdiction",
      handoffNote: "Ask local counsel to map product facts, evidence needs, and user exposure before relying on global assumptions."
    },
    source: SOURCE,
    notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
  };
}

function withEvidenceStatus(control: ControlTemplate, evidenceItems: EvidenceItem[], jurisdictionAliases: string[]): JurisdictionPackControl {
  const evidenceLabels = evidenceItems
    .filter((item) => isEvidenceReady(item) && matchesControl(control, item, jurisdictionAliases))
    .map((item) => item.label.trim())
    .filter(Boolean);

  return {
    ...control,
    status: evidenceLabels.length > 0 ? "evidence-ready" : "needs-evidence",
    evidenceLabels: Array.from(new Set(evidenceLabels))
  };
}

function matchesControl(control: ControlTemplate, item: EvidenceItem, jurisdictionAliases: string[]): boolean {
  const text = `${item.label} ${item.kind} ${item.source ?? ""} ${item.content}`.toLowerCase();
  const itemControlIds = extractRegulatoryControlIds(text);
  const controlIds = control.evidenceKeywords
    .filter((keyword) => keyword.startsWith("control-"))
    .map((keyword) => keyword.toLowerCase());

  if (itemControlIds.length > 0 && controlIds.length > 0) {
    return controlIds.some((controlId) => itemControlIds.includes(controlId));
  }

  if (controlIds.length > 0 && !matchesJurisdictionText(text, jurisdictionAliases)) {
    return false;
  }

  return control.evidenceKeywords.some((keyword) => text.includes(keyword));
}

function extractRegulatoryControlIds(text: string): string[] {
  if (!text.includes("control-")) {
    return [];
  }
  return Array.from(text.matchAll(/\bcontrol-[a-z0-9-]+\b/gi)).map((match) => match[0].toLowerCase());
}

function matchesJurisdictionText(text: string, jurisdictionAliases: string[]): boolean {
  return jurisdictionAliases.some((alias) => {
    const normalizedAlias = alias.trim().toLowerCase();
    if (!normalizedAlias || normalizedAlias.length <= 2) {
      return false;
    }
    return text.includes(normalizedAlias);
  });
}

function isEvidenceReady(item: EvidenceItem): boolean {
  return item.status === "received" || item.status === "verified";
}

function matchPackTemplate(jurisdiction: string): PackTemplate | undefined {
  const normalized = jurisdiction.trim().toLowerCase();
  return PACK_TEMPLATES.find((template) => template.aliases.some((alias) => aliasMatchesJurisdiction(normalized, alias)));
}

function aliasMatchesJurisdiction(normalizedJurisdiction: string, alias: string): boolean {
  const normalizedAlias = alias.trim().toLowerCase();
  if (!normalizedAlias) {
    return false;
  }
  if (normalizedAlias.length <= 2) {
    return normalizedJurisdiction === normalizedAlias;
  }
  return normalizedJurisdiction.includes(normalizedAlias);
}

function slug(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "jurisdiction"
  );
}
