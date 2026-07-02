import type { AuditProfile } from "../lib/auditEngine";

export const sampleProfiles: AuditProfile[] = [
  {
    projectName: "YieldPassport",
    entityType: "Startup issuer",
    jurisdictions: ["United States", "European Union"],
    assetModel: "Tokenized private credit note with yield",
    userType: "Retail and accredited investors",
    custodyModel: "Platform controls omnibus wallet",
    dataSensitivity: "KYC, investor accreditation, transaction history",
    aiUsage: "AI drafts suitability memo and flags restricted investors",
    blockchainUse: "Ethereum evidence anchor and investor status registry",
    operatingStage: "Pilot with planned public launch",
    evidenceItems: [
      { label: "Issuer memo", kind: "PDF", content: "Yield terms, target users, redemption policy" },
      { label: "KYC policy", kind: "Policy", content: "OFAC screening, wallet risk score, accreditation checks" },
      { label: "Wallet policy", kind: "Runbook", content: "Signer controls, withdrawal queues, emergency pause process" }
    ]
  },
  {
    projectName: "ClauseGuard DAO",
    entityType: "DAO tooling company",
    jurisdictions: ["United States", "United Kingdom"],
    assetModel:
      "Governance workflow with optional token-gated access and a proposed DeFi trading module with leveraged or margined access assumptions held for counsel review",
    userType: "Protocol contributors and foundation counsel",
    custodyModel: "Non-custodial multisig review workflow",
    dataSensitivity: "Private contributor agreements and governance votes",
    aiUsage: "AI summarizes proposals, creates issue lineage, and drafts review comments",
    blockchainUse: "Hash of approved proposal versions and execution receipts",
    operatingStage: "Private beta with foundation partners",
    evidenceItems: [
      { label: "DAO proposal", kind: "Markdown", content: "Protocol upgrade, quorum, signers, voting window, and derivatives-module review boundary" },
      { label: "Contributor agreement", kind: "Contract", content: "IP assignment, confidentiality, compensation terms" },
      { label: "Governance receipt", kind: "JSON", content: "Proposal hash, vote result, execution state" },
      {
        label: "DAO derivatives module boundary note",
        kind: "Memo",
        content:
          "Synthetic module-scope note with no live trading, no customer records, no wallet secrets, and CFTC/FCM/BSA questions still routed to counsel."
      }
    ]
  },
  {
    projectName: "OpenClause Atlas",
    entityType: "Open-source research project",
    jurisdictions: ["United States"],
    assetModel: "No token sale or custody",
    userType: "Law students and educators",
    custodyModel: "No custody",
    dataSensitivity: "Public legal education materials",
    aiUsage: "AI summarizes public resources with source links",
    blockchainUse: "Optional hash of public lesson versions",
    operatingStage: "Research prototype",
    evidenceItems: [
      { label: "Public syllabus", kind: "Markdown", content: "Blockchain legal education outline" },
      { label: "Source bibliography", kind: "CSV", content: "BLI, SEC, FinCEN, UK manual, educator notes" }
    ]
  },
  {
    projectName: "LexAssist Evidence Desk",
    entityType: "Legal operations AI workflow",
    jurisdictions: ["United States", "European Union", "United Kingdom"],
    assetModel: "No token sale; AI-assisted matter intake and evidence review workflow",
    userType: "In-house counsel, compliance reviewers, and outside counsel",
    custodyModel: "No custody; workspace stores metadata-only evidence records",
    dataSensitivity: "Confidential matter summaries, privileged-review notes, and client identifiers excluded from demo evidence",
    aiUsage: "AI drafts issue-spotting notes, evidence requests, and source-linked counsel questions for human review",
    blockchainUse: "Simulated manifest anchor for exported audit-prep packets",
    operatingStage: "Internal pilot before counsel-supervised rollout",
    evidenceItems: [
      { label: "AI review SOP", kind: "Policy", content: "Human review owner, model use limits, redaction checks, escalation path" },
      { label: "Matter intake schema", kind: "JSON", content: "Synthetic intake fields, evidence metadata, reviewer assignment states" },
      { label: "Source review log", kind: "CSV", content: "Official-source citation, review date, reviewer notes, next review date" }
    ]
  },
  {
    projectName: "Brazil VASP Launch Review",
    entityType: "Virtual asset service provider",
    jurisdictions: ["Brazil"],
    assetModel: "Tokenized private credit note with yield and public token distribution",
    userType: "Retail users and qualified investors in Brazil",
    custodyModel: "Platform controls omnibus wallet and virtual asset transfer approvals",
    dataSensitivity: "KYC metadata, sanctions-screening status summaries, and wallet transaction history excluded from demo evidence",
    aiUsage: "AI drafts audit-prep evidence summaries for human review and local counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only counsel handoff",
    operatingStage: "Planned public launch before Brazil counsel review",
    evidenceItems: [
      { label: "Brazil launch fact sheet", kind: "Markdown", content: "Synthetic launch facts, product assumptions, review owner, and source references only." },
      { label: "Wallet governance summary", kind: "Runbook", content: "Synthetic wallet roles, escalation contacts, and transfer-review checkpoints without secrets." },
      { label: "Counsel source review log", kind: "CSV", content: "Official-source citation, review date, reviewer notes, and next review date." }
    ]
  },
  {
    projectName: "Helvetia Stablecoin Review",
    entityType: "Stablecoin issuer",
    jurisdictions: ["Switzerland"],
    assetModel: "Swiss CHF-referenced stablecoin pilot with holder redemption claim, reserve assets, and bank guarantee assumptions",
    userType: "Swiss qualified users, treasury partners, and issuer counsel reviewers",
    custodyModel: "Issuer coordinates wallet mint, burn, transfer, and reserve-reconciliation approvals through segregated operations",
    dataSensitivity: "Holder identification metadata, sanctions-screening status, and transfer-risk summaries excluded from default exports",
    aiUsage: "AI drafts Swiss stablecoin evidence summaries for human review and local counsel routing",
    blockchainUse: "Simulated manifest anchor for metadata-only stablecoin counsel handoff",
    operatingStage: "Planned stablecoin issuer and guarantee review before Swiss counsel reliance",
    evidenceItems: [
      {
        label: "FINMA source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "Stablecoin operations scope note",
        kind: "Markdown",
        content: "Synthetic issuer scope, review owner, and counsel handoff timing; control evidence still requested."
      },
      {
        label: "Swiss evidence backlog",
        kind: "Checklist",
        content: "Synthetic questions for Swiss counsel routing and pending evidence owners."
      }
    ]
  },
  {
    projectName: "HarborKey DPT Custody Review",
    entityType: "Digital payment token service provider",
    jurisdictions: ["Singapore"],
    assetModel: "Digital payment token custody and transfer service with customer asset safeguarding",
    userType: "Retail users, accredited investors, and Singapore payment services reviewers",
    custodyModel: "Platform controls omnibus wallets and safeguards customer DPT assets through segregated custody operations",
    dataSensitivity: "KYC metadata, sanctions-screening status summaries, and wallet transaction history excluded from demo evidence",
    aiUsage: "AI drafts custody evidence summaries for human review and Singapore counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only custody handoff",
    operatingStage: "Planned DPT custody launch before Singapore counsel review",
    evidenceItems: [
      {
        label: "MAS source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "DPT operations scope note",
        kind: "Markdown",
        content: "Synthetic service scope, review owner, and counsel handoff timing; control evidence still requested."
      },
      {
        label: "Counsel question backlog",
        kind: "Checklist",
        content: "Synthetic questions for Singapore local counsel routing and pending evidence owners."
      }
    ]
  },
  {
    projectName: "HarborBridge VATP Custody Review",
    entityType: "Virtual asset trading platform operator",
    jurisdictions: ["Hong Kong"],
    assetModel: "Virtual asset trading platform with token listing and retail virtual asset access",
    userType: "Hong Kong retail and professional investor client accounts",
    custodyModel: "Platform controls client virtual assets through an associated entity, omnibus wallets, cold storage, and withdrawal approvals",
    dataSensitivity: "KYC metadata, wallet transaction history, client asset reconciliation summaries, and sanctions-screening status excluded from demo evidence",
    aiUsage: "AI drafts custody evidence summaries for human review and Hong Kong counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only custody handoff",
    operatingStage: "Planned public launch before Hong Kong counsel review",
    evidenceItems: [
      {
        label: "SFC source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "VATP operations scope note",
        kind: "Markdown",
        content: "Synthetic service scope, review owner, and counsel handoff timing; custody control evidence still requested."
      },
      {
        label: "Counsel question backlog",
        kind: "Checklist",
        content: "Synthetic questions for Hong Kong local counsel routing and pending evidence owners."
      }
    ]
  },
  {
    projectName: "SakuraKey Crypto Custody Review",
    entityType: "Crypto-asset exchange custody operations team",
    jurisdictions: ["Japan"],
    assetModel: "Crypto-asset exchange custody and transfer service with customer asset safeguarding",
    userType: "Japan retail and professional crypto-asset customers, operations reviewers, and local counsel",
    custodyModel:
      "Platform manages customer crypto assets with segregated wallets, cold-wallet and offline management, withdrawal approvals, daily reconciliation, and leakage-response controls",
    dataSensitivity:
      "KYC metadata, customer asset balances, wallet transaction history, and secret-key material excluded from demo evidence",
    aiUsage: "AI drafts custody evidence summaries for human review and Japan counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only custody handoff",
    operatingStage: "Planned custody workflow review before Japan counsel signoff",
    evidenceItems: [
      {
        label: "FSA source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "Japan custody operations scope note",
        kind: "Markdown",
        content: "Synthetic service scope, cold-wallet boundary, reconciliation owner, and counsel handoff timing."
      },
      {
        label: "Leakage response checklist",
        kind: "Checklist",
        content: "Synthetic leakage-risk escalation, internal-control owner, and audit-readiness placeholders without wallet secrets."
      }
    ]
  },
  {
    projectName: "MapleVault CTP Custody Review",
    entityType: "Crypto asset trading platform operations team",
    jurisdictions: ["Canada"],
    assetModel: "Crypto asset trading platform with crypto contracts, custody, Canadian client access, and value-referenced crypto asset review assumptions",
    userType: "Canadian retail and permitted clients, platform operations reviewers, and local counsel",
    custodyModel:
      "Platform holds Canadian client crypto assets through segregated custody, acceptable third-party custodian controls, no re-hypothecation, no leverage, VRCA consent gates, and insurance or alternative risk-mitigation evidence",
    dataSensitivity:
      "KYC metadata, Canadian client balances, wallet transaction history, custodian account records, and secret material excluded from demo evidence",
    aiUsage: "AI drafts CTP custody evidence summaries for human review and Canada counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only custody handoff",
    operatingStage: "Planned CTP custody and PRU investor-protection review before Canada counsel signoff",
    evidenceItems: [
      {
        label: "CSA source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "Canada CTP operations scope note",
        kind: "Markdown",
        content: "Synthetic service scope, Canadian-client access, PRU owner, custodian boundary, and counsel handoff timing."
      },
      {
        label: "Custodian assurance checklist",
        kind: "Checklist",
        content: "Synthetic acceptable third-party custodian, SOC 2, audited financial statement, no re-hypothecation, insurance, and risk-mitigation placeholders without raw client records."
      }
    ]
  },
  {
    projectName: "SouthernCross Digital Asset Review",
    entityType: "Digital asset platform operations team",
    jurisdictions: ["Australia"],
    assetModel: "Tokenised yield product with stablecoin payment rails and Australian digital asset service review assumptions",
    userType: "Australian retail users, wholesale investors, compliance reviewers, and local counsel",
    custodyModel:
      "Platform controls client digital assets through omnibus wallets, cold-storage procedures, signer approvals, transfer controls, and external custody assurance placeholders",
    dataSensitivity:
      "CDD status summaries, wallet-risk metadata, transaction monitoring summaries, and customer records excluded from demo evidence",
    aiUsage: "AI drafts audit-prep evidence summaries for human review and Australia counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only ASIC/AUSTRAC handoff",
    operatingStage: "Planned Australian pilot before digital-asset and AML/CTF counsel review",
    evidenceItems: [
      {
        label: "Australia regulator source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date; control evidence remains requested."
      },
      {
        label: "Australia digital asset operations scope note",
        kind: "Markdown",
        content:
          "Synthetic service scope, custody boundary, reviewer owner, and counsel handoff timing; regulatory-control evidence remains requested."
      },
      {
        label: "Australia evidence backlog",
        kind: "Checklist",
        content:
          "Synthetic requested-control placeholders and evidence owners without identity files, wallet secrets, or customer records."
      }
    ]
  },
  {
    projectName: "HanRiver VASP User Protection Review",
    entityType: "Virtual asset service provider operations team",
    jurisdictions: ["South Korea"],
    assetModel: "Virtual asset exchange and wallet custody service with KRW real-name account review assumptions",
    userType: "Korean retail users, compliance reviewers, and local counsel",
    custodyModel:
      "Platform holds user virtual assets with wallet segregation, cold-wallet procedures, deposit-custody handoff, and incident compensation placeholders",
    dataSensitivity:
      "CDD status summaries, wallet-risk metadata, transaction monitoring summaries, and customer records excluded from demo evidence",
    aiUsage: "AI drafts audit-prep evidence summaries for human review and South Korea counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only FSC/KoFIU handoff",
    operatingStage: "Planned Korean VASP custody and AML review before local counsel signoff",
    evidenceItems: [
      {
        label: "Korea regulator source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date; control evidence remains requested."
      },
      {
        label: "Korea operations scope note",
        kind: "Markdown",
        content:
          "Synthetic service scope, custody boundary, reviewer owner, and counsel handoff timing; regulatory-control evidence remains requested."
      },
      {
        label: "Korea evidence backlog",
        kind: "Checklist",
        content:
          "Synthetic requested-control placeholders and evidence owners without identity files, wallet secrets, or customer records."
      }
    ]
  },
  {
    projectName: "Mumbai VDA PMLA Review",
    entityType: "Virtual digital asset service provider operations team",
    jurisdictions: ["India"],
    assetModel: "Virtual digital asset exchange, transfer, and custody service with issuer offer-sale review assumptions",
    userType: "Indian retail users, compliance reviewers, and local counsel",
    custodyModel:
      "Platform holds user VDA balances with hosted wallet controls, transfer approvals, custody boundary, and incident escalation placeholders",
    dataSensitivity:
      "CDD status summaries, wallet-risk metadata, transaction-monitoring summaries, and customer records excluded from demo evidence",
    aiUsage: "AI drafts audit-prep evidence summaries for human review and India counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only FIU-IND/PMLA handoff",
    operatingStage: "Planned India VDA AML/CFT review before local counsel signoff",
    evidenceItems: [
      {
        label: "India regulator source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date; control evidence remains requested."
      },
      {
        label: "India operations scope note",
        kind: "Markdown",
        content:
          "Synthetic service scope, custody boundary, reviewer owner, and counsel handoff timing; regulatory-control evidence remains requested."
      },
      {
        label: "India evidence backlog",
        kind: "Checklist",
        content:
          "Synthetic requested-control placeholders and evidence owners without identity files, wallet secrets, or customer records."
      }
    ]
  },
  {
    projectName: "Thames Cryptoasset AML Review",
    entityType: "Cryptoasset exchange and custody operations team",
    jurisdictions: ["United Kingdom"],
    assetModel: "Cryptoasset exchange, transfer, and hosted custody service with UK retail access assumptions",
    userType: "UK retail users, compliance reviewers, and local counsel",
    custodyModel:
      "Platform safeguards customer cryptoassets through hosted wallet controls, transfer approvals, custody boundary, and incident escalation placeholders",
    dataSensitivity:
      "CDD status summaries, wallet-risk metadata, transaction-monitoring summaries, and customer records excluded from demo evidence",
    aiUsage: "AI drafts audit-prep evidence summaries for human review and UK financial-crime counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only FCA/MLR handoff",
    operatingStage: "Planned UK cryptoasset AML and Travel Rule review before local counsel signoff",
    evidenceItems: [
      {
        label: "UK regulator source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date; control evidence remains requested."
      },
      {
        label: "UK operations scope note",
        kind: "Markdown",
        content:
          "Synthetic service scope, custody boundary, reviewer owner, and counsel handoff timing; regulatory-control evidence remains requested."
      },
      {
        label: "UK evidence backlog",
        kind: "Checklist",
        content:
          "Synthetic requested-control placeholders and evidence owners without identity files, wallet secrets, or customer records."
      }
    ]
  },
  {
    projectName: "Dubai VARA Operating Review",
    entityType: "Virtual asset service provider operations team",
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
    evidenceItems: [
      {
        label: "VARA regulator source inventory",
        kind: "CSV",
        content: "Official source names, URLs, review date, reviewer notes, next review date, and handoff owner."
      },
      {
        label: "UAE operations scope note",
        kind: "Markdown",
        content:
          "Synthetic operating narrative, reviewer owner, product team contact, and counsel handoff timing."
      },
      {
        label: "UAE evidence backlog",
        kind: "Checklist",
        content:
          "Synthetic pending-item owners, request dates, and evidence-intake placeholders without identity files, wallet secrets, or customer records."
      }
    ]
  },
  {
    projectName: "RhineVault MiCAR Custody Review",
    entityType: "Crypto-asset service provider custody operations team",
    jurisdictions: ["Germany"],
    assetModel:
      "Crypto-asset custody and transfer service with German client access, MiCAR CASP authorisation assumptions, and hosted wallet operations",
    userType: "German retail users, institutional treasury users, compliance reviewers, and local counsel",
    custodyModel:
      "Platform safeguards client crypto assets through hosted wallets, client-position records, segregation controls, withdrawal approvals, return-process placeholders, and means-of-access controls",
    dataSensitivity:
      "CDD status summaries, wallet-risk metadata, client-position summaries, and customer records excluded from demo evidence",
    aiUsage: "AI drafts Germany MiCAR custody evidence summaries for human review and BaFin counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only Germany MiCAR counsel handoff",
    operatingStage: "Planned Germany MiCAR CASP custody and Article 75 review before local counsel signoff",
    evidenceItems: [
      {
        label: "Germany regulator source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date; control evidence remains requested."
      },
      {
        label: "Germany custody operations scope note",
        kind: "Markdown",
        content:
          "Synthetic service scope, German client access assumptions, custody boundary, reviewer owner, and counsel handoff timing; regulatory-control evidence remains requested."
      },
      {
        label: "Germany MiCAR evidence backlog",
        kind: "Checklist",
        content:
          "Synthetic requested-control placeholders and evidence owners without identity files, wallet secrets, customer records, or private cryptographic material."
      }
    ]
  },
  {
    projectName: "SignalBridge Marketing Review",
    entityType: "Virtual asset marketing operations team",
    jurisdictions: ["United States", "European Union", "United Kingdom", "United Arab Emirates"],
    assetModel:
      "Virtual asset public education and product-positioning campaign with paid creator endorsements, KOL incentives, and no token sale in demo scope",
    userType: "US, EU, UK, and UAE retail audience segments, community followers, and exchange listing reviewers",
    custodyModel: "No custody; campaign team cannot approve wallet transfers or hold client virtual assets",
    dataSensitivity: "Audience-segment summaries and approval metadata only; raw onboarding files excluded from demo evidence",
    aiUsage: "AI drafts promotion-risk summaries for human review and local counsel routing",
    blockchainUse: "Simulated hash receipt for approved campaign archive metadata",
    operatingStage: "Planned public marketing campaign before US, EU MiCA, UK, and UAE VARA 2024 marketing counsel review",
    evidenceItems: [
      {
        label: "Claims inventory",
        kind: "CSV",
        content: "Synthetic claim IDs, channels, launch date, reviewer placeholder, and source owner.",
        source: "regulatory control: control-uae-vara-marketing-approval; risk evidence requirement: marketing-claims",
        status: "verified",
        owner: "Compliance",
        addedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        label: "Audience routing note",
        kind: "Markdown",
        content: "Synthetic jurisdiction targeting, geofence assumptions, VARA approval route placeholders, risk-warning checklist, and channel labels.",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Counsel review tracker",
        kind: "Runbook",
        content:
          "Synthetic review owner, pending decision states, KOL remuneration-disclosure owner, incentive confirmation placeholder, recordkeeping owner, and escalation timing.",
        status: "requested",
        owner: "Compliance"
      }
    ]
  }
];
