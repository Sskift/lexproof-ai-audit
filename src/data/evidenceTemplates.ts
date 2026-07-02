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
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-br-cvm-crypto-asset-securities-guidance",
        status: "requested",
        owner: "Counsel"
      },
      {
        label: "Custody and signer control runbook",
        kind: "Runbook",
        content:
          "Requested: document wallet authority, signer quorum, withdrawal approval, emergency pause, incident response, virtual asset service activity scope, authorization assumptions, custody boundaries, transfer controls, and responsible owner.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-eu-mica-casp-custody-administration; regulatory control: control-sg-mas-dpt-customer-asset-safeguards; regulatory control: control-hk-sfc-vatp-client-asset-custody; regulatory control: control-br-bcb-virtual-asset-service-framework",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Investor eligibility review",
        kind: "Checklist",
        content:
          "Requested: summarize eligibility assumptions, investor communication, risk factor coverage, approval route, distribution boundary, retail restrictions, user restrictions, screening boundary, and marketing approval status.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-sec-reg-d-accredited-investor-verification; regulatory control: control-br-cvm-crypto-asset-securities-guidance",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Wallet sanctions screening and escalation controls",
        kind: "Policy",
        content:
          "Requested: summarize OFAC sanctions screening, AML/CFT handoff, transaction review handoff, customer protection, data minimization, wallet screening, geolocation controls, blocked property escalation, reporting, recordkeeping, and reviewer owner without raw KYC or wallet secrets.",
        source:
          "LexProof template: Tokenized Yield / RWA Issuance; regulatory control: control-us-ofac-virtual-currency-sanctions-compliance; regulatory control: control-br-bcb-virtual-asset-service-framework",
        status: "requested",
        owner: "Compliance"
      },
      {
        label: "Evidence anchor procedure",
        kind: "Procedure",
        content: "Requested: define what is hashed, what is public, what remains private, and who approves any anchor receipt.",
        source: "LexProof template: Tokenized Yield / RWA Issuance",
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
        source: "LexProof template: DAO Governance / Multisig Execution",
        status: "requested",
        owner: "Product"
      },
      {
        label: "Multisig signer authority matrix",
        kind: "Policy",
        content: "Requested: document signer roles, quorum, emergency authority, replacement process, and approval evidence.",
        source: "LexProof template: DAO Governance / Multisig Execution",
        status: "requested",
        owner: "Engineering"
      },
      {
        label: "Vote and execution receipt",
        kind: "JSON",
        content: "Requested: summarize proposal hash, vote result, execution status, block reference, and verification owner.",
        source: "LexProof template: DAO Governance / Multisig Execution",
        status: "requested",
        owner: "Engineering"
      },
      {
        label: "Contributor agreement summary",
        kind: "Summary",
        content: "Requested: summarize assignment, confidentiality, compensation, and contributor review status without personal records.",
        source: "LexProof template: DAO Governance / Multisig Execution",
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
          "Requested: define AI system use policy, permitted model use, prohibited inputs, review owner, human review, escalation, and non-advice output boundary.",
        source:
          "LexProof template: AI Legal / Compliance Workflow; regulatory control: control-eu-ai-act-ai-literacy-governance",
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
  }
];
