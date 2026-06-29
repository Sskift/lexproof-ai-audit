import type { AuditResult } from "./auditEngine";
import type { EvidenceItem } from "./projectModel";

export type EvidenceRequirementStatus = "missing" | "in-progress" | "covered";

export type EvidenceRequirement = {
  id: string;
  title: string;
  reason: string;
  priority: "P0" | "P1" | "P2";
  relatedFlagId: string;
  keywords: string[];
};

export type RiskEvidenceRequirement = Omit<EvidenceRequirement, "keywords"> & {
  status: EvidenceRequirementStatus;
  matchedEvidenceLabels: string[];
};

export type RiskEvidenceCoverage = {
  flagId: string;
  flagTitle: string;
  coverageStatus: "missing" | "partial" | "complete";
  coveredCount: number;
  totalCount: number;
  requirements: RiskEvidenceRequirement[];
  notLegalAdviceBoundary: "Not legal advice. Evidence coverage is audit preparation status only.";
};

export type MissingEvidenceItem = {
  id: string;
  title: string;
  reason: string;
  priority: "P0" | "P1" | "P2";
  relatedFlagId: string;
  status: "missing" | "covered";
};

const REQUIREMENTS_BY_FLAG: Record<string, EvidenceRequirement[]> = {
  "asset-yield": [
    {
      id: "asset-classification",
      title: "Asset classification memo",
      reason: "Yield, private-credit, tokenized, or investment-like facts need counsel classification before external claims.",
      priority: "P0",
      relatedFlagId: "asset-yield",
      keywords: ["asset classification", "token terms", "yield terms", "offering"]
    },
    {
      id: "disclosure-assumptions",
      title: "Disclosure and exemption assumptions",
      reason: "Counsel needs the assumptions behind offering, eligibility, and disclosure language.",
      priority: "P0",
      relatedFlagId: "asset-yield",
      keywords: ["disclosure", "exemption", "eligibility", "redemption"]
    }
  ],
  custody: [
    {
      id: "signer-control",
      title: "Signer control policy",
      reason: "Wallet control and withdrawal authority need explicit signer, approval, and emergency boundaries.",
      priority: "P0",
      relatedFlagId: "custody",
      keywords: ["signer", "withdrawal", "wallet control", "multisig"]
    },
    {
      id: "incident-response",
      title: "Custody incident response runbook",
      reason: "Operational custody risk requires escalation and incident response evidence.",
      priority: "P1",
      relatedFlagId: "custody",
      keywords: ["incident", "pause", "emergency", "response"]
    }
  ],
  retail: [
    {
      id: "user-eligibility",
      title: "User eligibility and marketing review",
      reason: "Retail or public-user exposure needs support for suitability, marketing, and user-screening assumptions.",
      priority: "P1",
      relatedFlagId: "retail",
      keywords: ["eligibility", "marketing", "retail", "suitability"]
    }
  ],
  "sensitive-data": [
    {
      id: "data-redaction",
      title: "Data handling and redaction policy",
      reason: "KYC, sanctions, investor status, and wallet history should be separated from exportable audit records.",
      priority: "P1",
      relatedFlagId: "sensitive-data",
      keywords: ["redaction", "data handling", "access control", "kyc"]
    }
  ],
  "public-launch": [
    {
      id: "launch-approval",
      title: "Launch approval checklist",
      reason: "Public launch timing compresses review windows and should have explicit signoff gates.",
      priority: "P1",
      relatedFlagId: "public-launch",
      keywords: ["launch approval", "signoff", "approval", "go-live"]
    }
  ],
  "ai-workflow": [
    {
      id: "human-review",
      title: "Human review policy for AI output",
      reason: "AI-generated legal or compliance workflow needs source lineage and human approval.",
      priority: "P1",
      relatedFlagId: "ai-workflow",
      keywords: ["human review", "approval", "source lineage", "ai policy"]
    }
  ],
  "evidence-anchor": [
    {
      id: "anchor-procedure",
      title: "Evidence hash and anchor procedure",
      reason: "Hashing and anchoring should document what is hashed, what is public, and what remains private.",
      priority: "P2",
      relatedFlagId: "evidence-anchor",
      keywords: ["hash", "anchor", "manifest", "receipt"]
    }
  ]
};

export function createRiskEvidenceCoverage(audit: AuditResult, evidenceItems: EvidenceItem[]): RiskEvidenceCoverage[] {
  return audit.flags.map((flag) => {
    const requirements = (REQUIREMENTS_BY_FLAG[flag.id] ?? []).map((requirement) =>
      createRequirementCoverage(requirement, evidenceItems)
    );
    const coveredCount = requirements.filter((requirement) => requirement.status === "covered").length;
    const hasProgress = requirements.some((requirement) => requirement.status !== "missing");

    return {
      flagId: flag.id,
      flagTitle: flag.title,
      coverageStatus: coveredCount === requirements.length && requirements.length > 0 ? "complete" : hasProgress ? "partial" : "missing",
      coveredCount,
      totalCount: requirements.length,
      requirements,
      notLegalAdviceBoundary: "Not legal advice. Evidence coverage is audit preparation status only."
    };
  });
}

export function createMissingEvidenceChecklist(audit: AuditResult, evidenceItems: EvidenceItem[]): MissingEvidenceItem[] {
  return createRiskEvidenceCoverage(audit, evidenceItems).flatMap((coverage) =>
    coverage.requirements.map((requirement) => ({
      id: requirement.id,
      title: requirement.title,
      reason: requirement.reason,
      priority: requirement.priority,
      relatedFlagId: requirement.relatedFlagId,
      status: requirement.status === "covered" ? "covered" : "missing"
    }))
  );
}

function createRequirementCoverage(requirement: EvidenceRequirement, evidenceItems: EvidenceItem[]): RiskEvidenceRequirement {
  const matchedItems = evidenceItems.filter((item) => matchesRequirement(requirement, item));
  const coveredItems = matchedItems.filter((item) => isCoveredEvidenceStatus(item.status));

  return {
    id: requirement.id,
    title: requirement.title,
    reason: requirement.reason,
    priority: requirement.priority,
    relatedFlagId: requirement.relatedFlagId,
    status: coveredItems.length > 0 ? "covered" : matchedItems.length > 0 ? "in-progress" : "missing",
    matchedEvidenceLabels: uniqueLabels(coveredItems.length > 0 ? coveredItems : matchedItems)
  };
}

function matchesRequirement(requirement: EvidenceRequirement, item: EvidenceItem): boolean {
  const text = `${item.label} ${item.kind} ${item.source ?? ""} ${item.content}`.toLowerCase();
  return requirement.keywords.some((keyword) => text.includes(keyword));
}

function isCoveredEvidenceStatus(status: EvidenceItem["status"]): boolean {
  return status === "received" || status === "verified";
}

function uniqueLabels(items: EvidenceItem[]): string[] {
  return Array.from(new Set(items.map((item) => item.label.trim()).filter(Boolean)));
}
