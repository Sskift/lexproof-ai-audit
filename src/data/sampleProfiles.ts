import type { AuditProfile } from "../lib/auditEngine";

export const sampleProfiles: AuditProfile[] = [
  {
    projectName: "YieldPassport",
    entityType: "Startup issuer",
    jurisdictions: ["United States", "European Union"],
    assetModel: "Tokenized private credit note with yield, New York resident access, and BitLicense planning assumptions",
    userType: "Retail users, New York residents, and accredited investors",
    custodyModel:
      "Platform controls omnibus wallet custody for customer virtual currency with internal ledger reconciliation, sub-custody planning, and no proprietary use controls",
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
    jurisdictions: ["United States", "European Union", "United Kingdom"],
    assetModel:
      "Governance workflow with optional token-gated access, EU user-access assumptions, decentralisation claims, and a proposed DeFi trading module with leveraged or margined access assumptions held for counsel review",
    userType: "Protocol contributors, EU token holders, and foundation counsel",
    custodyModel: "Non-custodial multisig review workflow with front-end operator and admin-key assumptions documented for review",
    dataSensitivity: "Private contributor agreements and governance votes",
    aiUsage: "AI summarizes proposals, creates issue lineage, and drafts review comments",
    blockchainUse: "Hash of approved proposal versions and execution receipts",
    operatingStage: "Private beta with foundation partners",
    evidenceItems: [
      {
        label: "DAO proposal",
        kind: "Markdown",
        content:
          "Protocol upgrade, quorum, signers, voting window, EU MiCA decentralisation assumptions, and derivatives-module review boundary"
      },
      { label: "Contributor agreement", kind: "Contract", content: "IP assignment, confidentiality, compensation terms" },
      { label: "Governance receipt", kind: "JSON", content: "Proposal hash, vote result, execution state" },
      {
        label: "EU MiCA perimeter note",
        kind: "Memo",
        content:
          "Synthetic decentralisation and CASP perimeter note with EU user-access assumptions, front-end operator boundary, admin-key review, no raw customer records, and no legal conclusion."
      },
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
    projectName: "LibertyDollar Stablecoin Review",
    entityType: "Payment stablecoin issuer",
    jurisdictions: ["United States"],
    assetModel:
      "US payment stablecoin issuer pilot with GENIUS Act permitted payment stablecoin issuer route, reserve assets, redemption, and monthly disclosure assumptions",
    userType: "US retail users, treasury partners, compliance reviewers, and US stablecoin counsel",
    custodyModel:
      "Issuer coordinates mint, burn, wallet operations, reserve safekeeping, custody handoff, redemption workflow, and sanctions escalation through metadata-only controls",
    dataSensitivity: "Customer-risk metadata, AML alert summaries, sanctions-screening status, and customer records excluded from default exports",
    aiUsage: "AI drafts GENIUS Act stablecoin evidence summaries for human review and US counsel routing",
    blockchainUse: "Simulated manifest anchor for metadata-only US stablecoin counsel handoff",
    operatingStage: "Pre-application US payment stablecoin issuer review before counsel signoff",
    evidenceItems: [
      {
        label: "Official-source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "Operating scope note",
        kind: "Markdown",
        content: "Synthetic operating assumptions, review owner, and counsel handoff timing; control evidence still requested."
      },
      {
        label: "Counsel evidence backlog",
        kind: "Checklist",
        content: "Synthetic pending evidence owners and intake timing without customer records."
      }
    ]
  },
  {
    projectName: "EuroMint MiCA Stablecoin Review",
    entityType: "ART / EMT stablecoin issuer",
    jurisdictions: ["European Union"],
    assetModel:
      "EU MiCA stablecoin issuer pilot assessing asset-referenced token and e-money token classification, white paper, reserve assets, redemption, and recovery-plan assumptions",
    userType: "EU retail users, treasury partners, compliance reviewers, and EU MiCA stablecoin counsel",
    custodyModel:
      "Issuer coordinates mint, burn, reserve custody, reserve segregation, liquidity management, redemption workflow, and holder communications through metadata-only controls",
    dataSensitivity: "Holder-risk metadata, reserve attestations, redemption summaries, and customer records excluded from default exports",
    aiUsage: "AI drafts MiCA ART/EMT issuer evidence summaries for human review and EU counsel routing",
    blockchainUse: "Simulated manifest anchor for metadata-only EU stablecoin counsel handoff",
    operatingStage: "Pre-notification EU MiCA ART/EMT stablecoin issuer review before counsel signoff",
    evidenceItems: [
      {
        label: "Official-source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "Operating scope note",
        kind: "Markdown",
        content: "Synthetic operating assumptions, review owner, and counsel handoff timing; control evidence still requested."
      },
      {
        label: "Counsel evidence backlog",
        kind: "Checklist",
        content: "Synthetic pending evidence owners and intake timing without customer records."
      }
    ]
  },
  {
    projectName: "SterlingMint Stablecoin Review",
    entityType: "UK qualifying stablecoin issuer",
    jurisdictions: ["United Kingdom"],
    assetModel:
      "UK-issued qualifying stablecoin pilot assessing sterling stablecoin issuance, issuer permissions, admission scope, backing assets, safeguarding, redemption, disclosure, and systemic-transition assumptions",
    userType: "UK retail users, treasury partners, compliance reviewers, and UK stablecoin counsel",
    custodyModel:
      "Issuer coordinates mint, burn, backing-asset safeguarding, reconciliation, liquidity, redemption workflow, and holder communications through metadata-only controls",
    dataSensitivity: "Holder-risk metadata, backing-asset attestations, redemption summaries, and customer records excluded from default exports",
    aiUsage: "AI drafts UK qualifying stablecoin evidence summaries for human review and UK counsel routing",
    blockchainUse: "Simulated manifest anchor for metadata-only UK stablecoin counsel handoff",
    operatingStage: "Pre-application UK qualifying stablecoin issuer review before counsel signoff",
    evidenceItems: [
      {
        label: "Official-source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "Operating scope note",
        kind: "Markdown",
        content: "Synthetic operating assumptions, review owner, and counsel handoff timing; control evidence still requested."
      },
      {
        label: "Counsel evidence backlog",
        kind: "Checklist",
        content: "Synthetic pending evidence owners and intake timing without customer records."
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
    projectName: "HarborMint Stablecoin Issuer Review",
    entityType: "Fiat-referenced stablecoin issuer",
    jurisdictions: ["Hong Kong"],
    assetModel:
      "Fiat-referenced stablecoin issuer with HKD and USD reference-currency assumptions, specified stablecoin issuance, reserve assets, redemption, and HKMA licence application planning",
    userType: "Hong Kong treasury partners, distribution reviewers, compliance reviewers, and local counsel",
    custodyModel:
      "Reserve assets are planned for segregated safekeeping with qualified custodians; no exchange-platform customer wallet operations in this demo",
    dataSensitivity: "CDD status summaries, AML/CFT alert summaries, complaints metadata, and customer records excluded from demo evidence",
    aiUsage: "AI drafts HKMA stablecoin issuer evidence summaries for human review and Hong Kong counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only HKMA stablecoin counsel handoff",
    operatingStage: "Pre-application HKMA stablecoin issuer licensing and supervision review before local counsel signoff",
    evidenceItems: [
      {
        label: "HKMA stablecoin source inventory",
        kind: "CSV",
        content: "Official-source citation, review date, reviewer notes, and next review date."
      },
      {
        label: "Reference-currency scope note",
        kind: "Markdown",
        content: "Synthetic issuer scope, reference-currency assumptions, review owner, and counsel handoff timing; detailed control registers still requested."
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
    projectName: "Bangkok Digital Asset Custody Review",
    entityType: "Digital asset business operator operations team",
    jurisdictions: ["Thailand"],
    assetModel:
      "Thailand digital asset exchange, broker, dealer, and custodial wallet provider launch assumptions with tokenized yield access held for counsel review",
    userType: "Thai retail users, compliance reviewers, operations owners, and local counsel",
    custodyModel:
      "Platform holds client digital assets through hosted wallets, client-asset records, withdrawal approvals, transfer controls, daily reconciliation, and no client-asset-use placeholders",
    dataSensitivity:
      "CDD status summaries, beneficial-owner review metadata, wallet-risk summaries, and customer records excluded from demo evidence",
    aiUsage: "AI drafts Thailand digital asset custody and AML evidence summaries for human review and local counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only SEC/AMLO handoff",
    operatingStage: "Planned Thailand digital asset business launch before SEC and AMLO counsel review",
    evidenceItems: [
      {
        label: "Thailand regulator source inventory",
        kind: "CSV",
        content: "Official-source citation metadata, review date, reviewer notes, and next review date; operational proof remains requested.",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Thailand custody operations scope note",
        kind: "Markdown",
        content:
          "Synthetic service narrative, reviewer role, product team contact, and counsel handoff timing; detailed registers remain requested.",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Thailand AML evidence backlog",
        kind: "Checklist",
        content:
          "Synthetic backlog placeholders for compliance reviewers without identity files, wallet secrets, or customer records.",
        status: "requested",
        owner: "Compliance"
      }
    ]
  },
  {
    projectName: "Jakarta OJK Crypto Trading Review",
    entityType: "Digital financial asset trading platform operations team",
    jurisdictions: ["Indonesia"],
    assetModel:
      "Indonesia digital financial asset and crypto asset trading service with PAKD/CPAKD operator status, SPRINT licensing route, whitelist, and product or instrument registration assumptions",
    userType: "Indonesian retail users, compliance reviewers, operations owners, and local counsel",
    custodyModel:
      "Platform coordinates trading, wallet transfer approvals, official app and website channels, consumer-protection workflow, and reporting placeholders",
    dataSensitivity:
      "CDD status summaries, consumer complaint metadata, wallet-risk summaries, and customer records excluded from demo evidence",
    aiUsage: "AI drafts Indonesia OJK licensing, whitelist, governance, and reporting evidence summaries for human review and local counsel routing",
    blockchainUse: "Simulated evidence anchor for metadata-only OJK handoff",
    operatingStage: "Planned Indonesia digital financial asset trading review before OJK counsel signoff",
    evidenceItems: [
      {
        label: "Indonesia OJK source inventory",
        kind: "CSV",
        content: "Official-source citation metadata, review date, reviewer notes, and next review date; operational proof remains requested.",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Indonesia trading operations scope note",
        kind: "Markdown",
        content:
          "Synthetic service narrative, reviewer role, product team contact, and counsel handoff timing; detailed registers remain requested.",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Indonesia governance evidence backlog",
        kind: "Checklist",
        content:
          "Synthetic backlog placeholders for compliance reviewers without identity files, wallet secrets, or customer records.",
        status: "requested",
        owner: "Compliance"
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
