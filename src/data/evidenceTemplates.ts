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
    triggerKeywords: ["yield", "rwa", "tokenized", "private credit", "note", "custody", "retail"],
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
          "Requested: document wallet authority, signer quorum, withdrawal approval, emergency pause, incident response, virtual asset service activity scope, authorization assumptions, custody boundaries, transfer controls, responsible owner, client virtual asset treatment, Japan crypto-asset exchange custody scope, Canada CTP PRU custody scope, Australia ASIC digital asset custody scope, Korea VASP user protection scope, cold-wallet/offline management, and proof of reserves evidence.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-eu-mica-casp-custody-administration; regulatory control: control-eu-dora-ict-operational-resilience; regulatory control: control-sg-mas-dpt-customer-asset-safeguards; regulatory control: control-hk-sfc-vatp-client-asset-custody; regulatory control: control-jp-fsa-crypto-asset-custody-user-protection; regulatory control: control-ca-csa-ctp-pru-custody-investor-protection; regulatory control: control-au-asic-austrac-digital-asset-financial-services; regulatory control: control-kr-fsc-kofiu-vasp-user-protection-aml; regulatory control: control-br-bcb-virtual-asset-service-framework; regulatory control: control-uae-vara-compliance-risk-management",
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
        content: "Requested: summarize proposal scope, quorum, voting window, affected contracts, and review assumptions.",
        source:
          "LexProof template: DAO Governance / Multisig Execution; regulatory control: control-us-sec-dao-report-governance-token-review; regulatory control: control-uk-law-commission-dao-scoping-paper",
        status: "requested",
        owner: "Product"
      },
      {
        label: "Multisig signer authority matrix",
        kind: "Policy",
        content: "Requested: document signer roles, quorum, emergency authority, replacement process, and approval evidence.",
        source:
          "LexProof template: DAO Governance / Multisig Execution; regulatory control: control-us-sec-dao-report-governance-token-review; regulatory control: control-uk-law-commission-dao-scoping-paper",
        status: "requested",
        owner: "Engineering"
      },
      {
        label: "Vote and execution receipt",
        kind: "JSON",
        content: "Requested: summarize proposal hash, vote result, execution status, block reference, and verification owner.",
        source:
          "LexProof template: DAO Governance / Multisig Execution; regulatory control: control-us-sec-dao-report-governance-token-review; regulatory control: control-uk-law-commission-dao-scoping-paper",
        status: "requested",
        owner: "Engineering"
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
