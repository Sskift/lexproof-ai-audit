import type { EvidenceItem } from "../lib/projectModel";

export type EvidenceTemplate = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  triggerKeywords: string[];
  notLegalAdviceBoundary: string;
  items: EvidenceItem[];
};

export const evidenceTemplates: EvidenceTemplate[] = [
  {
    id: "tokenized-yield-rwa",
    title: "Tokenized Yield / RWA Issuance",
    shortLabel: "tokenized yield / RWA",
    description: "Disclosure, eligibility, custody, and anchor evidence requests for tokenized yield or RWA launch review.",
    triggerKeywords: ["yield", "rwa", "tokenized", "private credit", "note", "stablecoin", "fiat-referenced", "custody", "retail"],
    notLegalAdviceBoundary: "Not legal advice. These are evidence requests for counsel and compliance audit preparation.",
    items: [
      {
        label: "RWA disclosure assumptions memo",
        kind: "Memo",
        content:
          "Requested: summarize token terms, yield assumptions, redemption language, crypto security classification, token rights, investment expectation, public distribution, disclosure assumptions, intermediary assumptions, and review owner.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-sec-cftc-crypto-asset-interpretation; regulatory control: control-eu-mica-title-ii-white-paper; regulatory control: control-br-cvm-crypto-asset-securities-guidance",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Custody and signer control runbook",
        kind: "Runbook",
        content:
          "Requested: document wallet authority, signer quorum, withdrawal approval, emergency pause, incident response, virtual asset service activity scope, authorization assumptions, custody boundaries, transfer controls, responsible owner, client virtual asset treatment, Japan crypto-asset exchange custody scope, Canada CTP PRU custody scope, Australia ASIC digital asset custody scope, Korea VASP user protection scope, India VDA SP activity scope, cold-wallet/offline management, and proof of reserves evidence.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-eu-mica-casp-custody-administration; regulatory control: control-eu-dora-ict-operational-resilience; regulatory control: control-sg-mas-dpt-customer-asset-safeguards; regulatory control: control-hk-sfc-vatp-client-asset-custody; regulatory control: control-jp-fsa-crypto-asset-custody-user-protection; regulatory control: control-ca-csa-ctp-pru-custody-investor-protection; regulatory control: control-au-asic-austrac-digital-asset-financial-services; regulatory control: control-kr-fsc-kofiu-vasp-user-protection-aml; regulatory control: control-in-fiu-pmla-vda-aml-cft; regulatory control: control-de-bafin-micar-casp-custody-authorisation; regulatory control: control-br-bcb-virtual-asset-service-framework; regulatory control: control-uae-vara-va-regulations-activity-scope; regulatory control: control-uae-vara-compliance-risk-management",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "EU DORA ICT resilience register",
        kind: "Register",
        content:
          "Requested: summarize ICT risk management, business continuity, incident classification, incident response, escalation owner, testing cadence, critical function mapping, ICT third-party service register, subcontracting, access logging, exit plan, resilience testing, and recovery evidence without credentials or raw customer records.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-eu-dora-ict-operational-resilience",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "EU TFR Travel Rule transfer information register",
        kind: "Register",
        content:
          "Requested: summarize EU TFR, Regulation EU 2023/1113, crypto-asset transfer information, Travel Rule transfer information, counterparty CASP handling, originator and beneficiary information mapping, EU TFR missing information, missing incomplete information, transfer information handling, travel rule exception, counterparty escalation, rejection or return handling, retention owner, reviewer owner, and source-lineage evidence without raw KYC or full wallet histories.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-eu-tfr-crypto-asset-transfer-information",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "EU DLT Pilot Regime market infrastructure perimeter register",
        kind: "Register",
        content:
          "Requested: summarize EU DLT Pilot Regime, Regulation EU 2022/858, DLT financial instrument, tokenized financial instrument, DLT market infrastructure, DLT MTF, DLT TSS, DLT SS, competent authority permission or exemption route, admitted instrument perimeter, settlement workflow, safekeeping controls, liability chain, client disclosure, ESMA handoff, reviewer owner, and no raw investor records, raw KYC, credentials, wallet secrets, or personal data.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-eu-dlt-pilot-regime-market-infrastructure",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Investor eligibility review",
        kind: "Checklist",
        content:
          "Requested: summarize eligibility assumptions, investor communication, risk factor coverage, approval route, distribution boundary, retail restrictions, user restrictions, screening boundary, and marketing approval status.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-sec-cftc-crypto-asset-interpretation; regulatory control: control-us-sec-reg-d-accredited-investor-verification; regulatory control: control-br-cvm-crypto-asset-securities-guidance",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Swiss token classification memo",
        kind: "Memo",
        content:
          "Requested: summarize Swiss token classification assumptions, payment token, utility token, asset token, hybrid token, fundraising mechanics, economic rights, transfer features, and Swiss counsel review owner.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-ch-finma-ico-token-classification",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Swiss offering, prospectus, and governance evidence",
        kind: "Checklist",
        content:
          "Requested: summarize Swiss prospectus intake, foundation governance, FINMA classification handoff, Swiss counsel review owner, and local evidence-retention assumptions.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-ch-finma-ico-token-classification",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Swiss stablecoin issuer and bank guarantee perimeter memo",
        kind: "Memo",
        content:
          "Requested: summarize Swiss stablecoin issuer, holder redemption claim, stabilisation mechanism, underlying assets, bank guarantee, default guarantee, banking law perimeter, collective investment scheme perimeter, reserve owner, guarantee provider, and Swiss counsel review owner.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-ch-finma-stablecoin-guidance-06-2024",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Swiss stablecoin AML and sanctions transfer-risk register",
        kind: "Register",
        content:
          "Requested: summarize Swiss stablecoin AML, money laundering, terrorist financing, sanctions circumvention, holder identification, anonymous transfer prevention, transfer risk, transaction monitoring, blocked-transfer escalation, reviewer owner, and no raw customer records, credentials, or wallet secrets.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-ch-finma-stablecoin-guidance-06-2024",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Hong Kong HKMA stablecoin issuer licensing and scope register",
        kind: "Register",
        content:
          "Requested: summarize Hong Kong stablecoin issuer, fiat-referenced stablecoin, specified stablecoin, Stablecoins Ordinance, HKMA licence, regulated stablecoin activity, licence application, Hong Kong principal place of business, controller, chief executive, stablecoin manager, governance owner, and counsel review owner.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-hk-hkma-stablecoin-issuer-regime",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Hong Kong HKMA stablecoin reserve, redemption, and AML/CFT register",
        kind: "Register",
        content:
          "Requested: summarize HKMA stablecoin reserve assets, full backing, redemption, reserve safekeeping, qualified custodian, attestation, reporting, supervisory guideline, AML CFT, ML TF risk assessment, customer due diligence, blockchain analytics, unhosted wallets, suspicious transaction reporting, record keeping, complaints handling, reviewer owner, and no raw KYC, credentials, wallet secrets, customer records, or personal data.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-hk-hkma-stablecoin-issuer-regime",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Singapore DPT CDD and model handoff register",
        kind: "Register",
        content:
          "Requested: summarize Singapore DPT CDD handoff, wallet history metadata boundary, MAS PSN02 review owner, and evidence-export exclusion notes.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-sg-mas-psn02-dpt-aml-cft",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "UK FCA cryptoasset AML registration and Travel Rule register",
        kind: "Register",
        content:
          "Requested: summarize UK cryptoasset business, UK FCA MLR registration, UK cryptoasset exchange provider, UK custodian wallet provider, UK business plan, UK ownership control structure, UK MLRO, UK business wide risk assessment, UK customer risk assessment, UK AML framework, UK cryptoasset Travel Rule, UK originator beneficiary information, UK suspicious activity reporting, UK sanctions screening, UK blockchain analytics, UK transaction monitoring, UK CDD EDD, UK Travel Rule data flow, UK third-party tool configuration, UK record retrieval, reviewer owner, and no raw KYC, wallet secrets, credentials, customer records, or private cryptographic material.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-uk-fca-cryptoasset-aml-registration-travel-rule",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Japan crypto-asset custody and leakage response register",
        kind: "Register",
        content:
          "Requested: summarize Japan crypto asset exchange service scope, FSA registration assumptions, user asset protection, information to users, segregated wallet handling, cold wallet and offline environment controls, daily reconciliation, leakage response, separate management audit, reviewer owner, and wallet-secret exclusion.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-jp-fsa-crypto-asset-custody-user-protection",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Canada CTP PRU custody and investor-protection register",
        kind: "Register",
        content:
          "Requested: summarize Canada CSA PRU, pre-registration undertaking, registration application, Canadian client access, no leverage, value-referenced crypto asset and VRCA prior written consent, proprietary-token restriction, chief compliance officer, financial information filing, acceptable third-party custodian, third-party custodians to hold not less than 80%, hold assets in trust, separate and apart, designated trust account, pledge re-hypothecate restriction, SOC 2, audited financial statements, insurance risk mitigation, custodian information access, reviewer owner, and raw-client-record exclusion.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-ca-csa-ctp-pru-custody-investor-protection",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Australia digital asset financial services and VASP AML register",
        kind: "Register",
        content:
          "Requested: summarize Australia ASIC digital asset financial product assumptions, AFS licence handoff, dealing, market making, custodial depository service, client assets separate, crypto-asset custody specialist expertise, cold storage, signing single point of failure controls, compensation or insurance assumptions, independent audit, AUSTRAC virtual asset service provider scope, registration, AML/CTF program, customer due diligence, ongoing CDD, travel rule, suspicious matter report, threshold transaction report, annual compliance reporting, seven years recordkeeping, reviewer owner, and raw KYC, wallet-secret, and customer-record exclusions.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-au-asic-austrac-digital-asset-financial-services",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Korea VASP user protection and AML reporting register",
        kind: "Register",
        content:
          "Requested: summarize Korea VASP user protection, user deposits at banks, separate from own funds, users virtual assets separate, 80 percent cold wallet, cold wallet, insurance reserve, hacking network malfunction response, abnormal trading monitoring, Korean language whitepaper, user asset protection, KoFIU, VASP reporting, compliance system, major shareholders, ISMS, real-name verified checking account, AML management, customer due diligence, enhanced due diligence, beneficial ownership, suspicious transaction report, travel rule, registration, reviewer owner, and no raw KYC, customer records, identity files, or wallet secrets.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-kr-fsc-kofiu-vasp-user-protection-aml",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Germany BaFin MiCAR CASP custody and Article 60/62 register",
        kind: "Register",
        content:
          "Requested: summarize Germany MiCAR service scope, BaFin review owner, CASP authorisation, Article 60 notification, Article 62 application assumptions, home Member State, German client access, Article 75 custody policy, client register, position statement, segregation, return crypto assets, means of access, private cryptographic keys, client crypto assets, reviewer owner, and no raw KYC, wallet secrets, credentials, customer records, or private cryptographic material.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-de-bafin-micar-casp-custody-authorisation",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "India VDA SP FIU-IND registration and AML reporting register",
        kind: "Register",
        content:
          "Requested: summarize India VDA service provider, India FIU-IND registration, India PMLA reporting entity, VDA activity scope, exchange between VDAs and fiat, VDA transfer, safekeeping administration control instruments, issuer offer sale financial services, client money account disclosure, Designated Director, Principal Officer, AML/CFT/CPF program, board senior management policies, India VDA AML CFT, FIU-IND reporting, India suspicious transaction report, India Travel Rule, India transaction monitoring, India risk assessment, FINGate VASP reporting, Ground of Suspicion, record retention, no anonymous wallet, beneficial ownership, sanctions screening, blockchain analytics screening, reviewer owner, and no raw KYC, PAN, Aadhaar, OVDs, wallet secrets, or customer records.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-in-fiu-pmla-vda-aml-cft",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "US FinCEN CVC MSB and BSA transfer control register",
        kind: "Register",
        content:
          "Requested: summarize FinCEN CVC business model, hosted wallet boundary, money transmission assumptions, MSB registration handoff, AML program, compliance officer, training, independent review, transaction monitoring, SAR and CTR escalation, Travel Rule transmittal recordkeeping, originator and beneficiary information handling, retention owner, and reviewer owner without raw KYC or full wallet histories.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-fincen-cvc-msb-bsa-travel-rule",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "New York NYDFS BitLicense and custody customer-protection register",
        kind: "Register",
        content:
          "Requested: summarize New York virtual currency business activity, New York resident access, BitLicense or limited purpose trust company route, NMLS application owner, money transmission handoff, customer virtual currency segregation, omnibus wallet or per-customer wallet accounting, internal ledger, reconciliation, beneficial interest disclosure, sub-custody approval, books and records, no proprietary use, reviewer owner, and no raw KYC, wallet secrets, customer records, or personal data.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-nydfs-bitlicense-custody-customer-protection",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "US GENIUS Act permitted issuer and reserve register",
        kind: "Register",
        content:
          "Requested: summarize US payment stablecoin issuer, GENIUS Act payment stablecoin definition, permitted payment stablecoin issuer route, federal or state qualified issuer route, primary regulator handoff, reserve assets, redemption, monthly disclosure, custody, insolvency-priority evidence, reviewer owner, and no raw KYC, credentials, wallet secrets, customer records, or personal data.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-genius-payment-stablecoin-issuer-regime",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "US GENIUS Act BSA AML and sanctions program register",
        kind: "Register",
        content:
          "Requested: summarize permitted payment stablecoin issuer BSA AML program, sanctions compliance program, FinCEN and OFAC implementation review, compliance officer, transaction monitoring, suspicious activity escalation, customer-risk metadata boundary, training, independent review, reviewer owner, and no raw KYC, credentials, wallet secrets, customer records, or personal data.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-genius-payment-stablecoin-issuer-regime",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Wallet sanctions screening and escalation controls",
        kind: "Policy",
        content:
          "Requested: summarize OFAC sanctions screening, AML/CFT handoff, transaction review handoff, customer protection, data minimization, wallet screening, geolocation controls, blocked property escalation, reporting, recordkeeping, VARA books and records, audit reporting, risk management owner, and reviewer owner without raw KYC or wallet secrets.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-ofac-virtual-currency-sanctions-compliance; regulatory control: control-br-bcb-virtual-asset-service-framework; regulatory control: control-uae-vara-compliance-risk-management",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Evidence anchor procedure",
        kind: "Procedure",
        content:
          "Requested: define what is hashed, what is public, what remains private, management approval, manifest provenance, source lineage, and who approves any anchor receipt.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-eu-mica-title-ii-white-paper",
        status: "requested",
        owner: "Engineering"
      }
    ]
  },
  {
    id: "dao-governance-multisig",
    title: "DAO Governance / Multisig Execution",
    shortLabel: "DAO governance / multisig",
    description: "Governance proposal, vote, signer authority, and execution evidence requests for DAO or foundation workflows.",
    triggerKeywords: ["dao", "governance", "multisig", "proposal", "vote", "signer", "execution"],
    notLegalAdviceBoundary: "Not legal advice. These are governance evidence requests for audit preparation.",
    items: [
      {
        label: "Governance proposal record",
        kind: "Markdown",
        content:
          "Requested: summarize proposal scope, quorum, voting window, affected contracts, protocol purpose, trading-interface exclusions, and review assumptions.",
        source:
          "LexProof template: DAO Governance / Multisig Execution; regulatory control: control-us-sec-dao-report-governance-token-review; regulatory control: control-us-cftc-ooki-dao-defi-derivatives-platform; regulatory control: control-uk-law-commission-dao-scoping-paper",
        status: "requested",
        owner: "Product"
      },
      {
        label: "Multisig signer authority matrix",
        kind: "Policy",
        content: "Requested: document signer roles, quorum, emergency authority, replacement process, and approval evidence.",
        source:
          "LexProof template: DAO Governance / Multisig Execution; regulatory control: control-us-sec-dao-report-governance-token-review; regulatory control: control-us-cftc-ooki-dao-defi-derivatives-platform; regulatory control: control-uk-law-commission-dao-scoping-paper",
        status: "requested",
        owner: "Engineering"
      },
      {
        label: "Vote and execution receipt",
        kind: "JSON",
        content: "Requested: summarize proposal hash, vote result, execution status, block reference, and verification owner.",
        source:
          "LexProof template: DAO Governance / Multisig Execution; regulatory control: control-us-sec-dao-report-governance-token-review; regulatory control: control-us-cftc-ooki-dao-defi-derivatives-platform; regulatory control: control-uk-law-commission-dao-scoping-paper",
        status: "requested",
        owner: "Engineering"
      },
      {
        label: "DAO derivatives platform boundary and BSA/CIP review register",
        kind: "Register",
        content:
          "Requested: summarize CFTC DAO derivatives review assumptions, leveraged retail commodity transaction exclusions, margined retail commodity transaction exclusions, DeFi trading platform boundary, FCM activity assumptions, commodity interest handling, US user access, BSA CIP and customer identification program boundary, control transfer, successor DAO governance member participation, website domain operation, proposal execution, compliance owner, and no raw customer records, credentials, KYC files, wallet secrets, or personal data.",
        source:
          "LexProof template: DAO Governance / Multisig Execution; regulatory control: control-us-cftc-ooki-dao-defi-derivatives-platform",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Contributor agreement summary",
        kind: "Summary",
        content: "Requested: summarize assignment, confidentiality, compensation, and contributor review status without personal records.",
        source:
          "LexProof template: DAO Governance / Multisig Execution; regulatory control: control-us-sec-dao-report-governance-token-review; regulatory control: control-uk-law-commission-dao-scoping-paper",
        status: "requested",
        owner: "Counsel"
      }
    ]
  },
  {
    id: "ai-compliance-workflow",
    title: "AI Legal / Compliance Workflow",
    shortLabel: "AI compliance workflow",
    description: "Human review, source lineage, model payload, and approval evidence requests for AI-assisted compliance workflows.",
    triggerKeywords: ["ai", "llm", "agent", "model", "drafts", "summarizes", "flags", "legal workflow"],
    notLegalAdviceBoundary: "Not legal advice. These are AI workflow evidence requests for audit preparation.",
    items: [
      {
        label: "AI system use policy",
        kind: "Policy",
        content:
          "Requested: define AI system use policy, permitted model use, prohibited inputs, review owner, human review, escalation, non-advice output boundary, NIST AI RMF use-case context, AI risk owner, risk measurement, model use limits, and manage-monitor evidence.",
        source:
          "LexProof template: AI Legal / Compliance Workflow; regulatory control: control-eu-ai-act-ai-literacy-governance; regulatory control: control-us-nist-ai-rmf-governance",
        status: "requested",
        owner: "Product"
      },
      {
        label: "Human review approval log",
        kind: "Log",
        content:
          "Requested: summarize reviewer role, approval status, human review decision log, escalation path, issue override process, and review notes.",
        source:
          "LexProof template: AI Legal / Compliance Workflow; regulatory control: control-eu-ai-act-ai-literacy-governance; regulatory control: control-uk-ico-ai-data-protection-governance",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Source lineage register",
        kind: "Register",
        content:
          "Requested: list source lineage, retrieval dates, assumptions, unsupported claims, risk-control handling, and counsel review notes.",
        source:
          "LexProof template: AI Legal / Compliance Workflow; regulatory control: control-eu-ai-act-ai-literacy-governance; regulatory control: control-uk-ico-ai-data-protection-governance",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "NIST GenAI output review and provenance register",
        kind: "Register",
        content:
          "Requested: document NIST AI 600-1, generative AI profile, output review, unsupported claims, source provenance, content-risk escalation, human accountability, reviewer owner, and confidential matter text exclusion.",
        source:
          "LexProof template: AI Legal / Compliance Workflow; regulatory control: control-us-nist-ai-rmf-governance",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Model payload redaction checklist",
        kind: "Checklist",
        content:
          "Requested: document model payload redaction, excluded data categories, approved evidence summaries, data protection boundary, personal data exclusion, and reviewer signoff.",
        source:
          "LexProof template: AI Legal / Compliance Workflow; regulatory control: control-uk-ico-ai-data-protection-governance",
        status: "requested",
        owner: "Compliance"
      }
    ]
  },
  {
    id: "marketing-claims-review",
    title: "Marketing Claims Review",
    shortLabel: "marketing claims",
    description:
      "Claims, endorsement, financial promotion, VARA approval, KOL incentive, and activity-scope evidence requests for cross-border virtual asset campaigns.",
    triggerKeywords: [
      "marketing",
      "promotion",
      "claims",
      "advertising",
      "endorsement",
      "creator",
      "kol",
      "incentive",
      "campaign",
      "financial promotion",
      "risk warning"
    ],
    notLegalAdviceBoundary: "Not legal advice. These are marketing evidence requests for audit preparation.",
    items: [
      {
        label: "Claims substantiation and risk disclosure register",
        kind: "Register",
        content:
          "Requested: document claim inventory, claims substantiation sources, advertising claim owners, risk disclosure, channel, audience, reviewer, and source-lineage notes.",
        source:
          "LexProof template: Campaign Claims Review; regulatory control: control-us-ftc-endorsement-advertising-guides",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Creator endorsement and material connection log",
        kind: "Log",
        content:
          "Requested: document endorsement, testimonial, material connection, creator disclosure, approval routing, monitoring owner, and retained review evidence.",
        source:
          "LexProof template: Campaign Claims Review; regulatory control: control-us-ftc-endorsement-advertising-guides",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "UK financial promotion approval pack",
        kind: "Checklist",
        content:
          "Requested: summarize financial promotion copy, approval pack owner, clear-and-balanced review, client categorisation, appropriateness, positive friction, eligibility assumptions, and retail-access restrictions.",
        source:
          "LexProof template: Campaign Claims Review; regulatory control: control-uk-fca-crypto-financial-promotions",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "EU MiCA marketing communication review pack",
        kind: "Checklist",
        content:
          "Requested: summarize EU MiCA marketing communication labels, crypto-asset marketing communication copy, white paper consistency, communication label, offeror website contact, home Member State notification, host Member State, member state audience, marketing communication notification, publication timing, source-lineage evidence, and reviewer owner without raw audience onboarding files.",
        source:
          "LexProof template: Campaign Claims Review; regulatory control: control-eu-mica-marketing-communications",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "UAE activity scope and access control memo",
        kind: "Memo",
        content:
          "Requested: summarize virtual asset activity scope, issuance assumptions, licensing assumptions, regulated activity mapping, cross-border access control, and counsel review owner.",
        source:
          "LexProof template: Campaign Claims Review; regulatory control: control-uae-vara-va-regulations-activity-scope",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "UAE VARA approval and risk-warning archive",
        kind: "Archive",
        content:
          "Requested: document VARA approval route, VASP approval route, approval route owner, promotional label, guaranteed return claim controls, misleading-claim checks, and UAE review owner.",
        source:
          "LexProof template: Campaign Claims Review; regulatory control: control-uae-vara-marketing-regulations-2024",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "UAE KOL incentive and recordkeeping log",
        kind: "Log",
        content:
          "Requested: document KOL and key opinion leader remuneration, paid post scope, incentive compliance confirmation, recordkeeping owner, marketing record, distribution details, and eight year archive assumptions.",
        source:
          "LexProof template: Campaign Claims Review; regulatory control: control-uae-vara-marketing-regulations-2024",
        status: "requested",
        owner: "Compliance"
      }
    ]
  }
];
