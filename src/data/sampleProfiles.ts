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
    assetModel: "Governance workflow with optional token-gated access",
    userType: "Protocol contributors and foundation counsel",
    custodyModel: "Non-custodial multisig review workflow",
    dataSensitivity: "Private contributor agreements and governance votes",
    aiUsage: "AI summarizes proposals, creates issue lineage, and drafts review comments",
    blockchainUse: "Hash of approved proposal versions and execution receipts",
    operatingStage: "Private beta with foundation partners",
    evidenceItems: [
      { label: "DAO proposal", kind: "Markdown", content: "Protocol upgrade, quorum, signers, voting window" },
      { label: "Contributor agreement", kind: "Contract", content: "IP assignment, confidentiality, compensation terms" },
      { label: "Governance receipt", kind: "JSON", content: "Proposal hash, vote result, execution state" }
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
  }
];
