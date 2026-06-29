import type { AuditResult } from "./auditEngine";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type JurisdictionChecklistStatus = "review-needed" | "evidence-ready";

export type JurisdictionChecklistItem = {
  id: string;
  jurisdiction: "United States" | "European Union" | "United Kingdom" | "Other";
  title: string;
  reason: string;
  priority: "P0" | "P1" | "P2";
  status: JurisdictionChecklistStatus;
  source: string;
};

type ChecklistTemplate = Omit<JurisdictionChecklistItem, "status"> & {
  flagIds: string[];
  keywords: string[];
};

const SOURCE = "LexProof jurisdiction pack v0.1 for audit preparation. Not legal advice.";

const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: "us-offering-asset-classification",
    jurisdiction: "United States",
    title: "US offering and asset classification review",
    reason: "Prepare counsel review of offering flow, token terms, yield claims, user eligibility, and disclosure assumptions.",
    priority: "P0",
    source: SOURCE,
    flagIds: ["asset-yield", "retail", "public-launch"],
    keywords: ["offering", "asset classification", "token terms", "disclosure", "eligibility"]
  },
  {
    id: "us-custody-wallet-control",
    jurisdiction: "United States",
    title: "US custody and wallet-control evidence review",
    reason: "Prepare counsel and compliance review of signer control, wallet authority, withdrawal rights, and incident response evidence.",
    priority: "P0",
    source: SOURCE,
    flagIds: ["custody"],
    keywords: ["signer control", "wallet control", "withdrawal", "incident response", "custody controls"]
  },
  {
    id: "us-sensitive-data-handling",
    jurisdiction: "United States",
    title: "US sensitive data handling review",
    reason: "Prepare privacy and compliance review of KYC references, access controls, and export redaction assumptions.",
    priority: "P1",
    source: SOURCE,
    flagIds: ["sensitive-data"],
    keywords: ["kyc", "redaction", "access control", "data handling"]
  },
  {
    id: "eu-crypto-asset-disclosure",
    jurisdiction: "European Union",
    title: "EU crypto-asset disclosure readiness review",
    reason: "Prepare counsel review of crypto-asset disclosures, public communications, user exposure, and evidence provenance.",
    priority: "P1",
    source: SOURCE,
    flagIds: ["asset-yield", "retail", "evidence-anchor", "public-launch"],
    keywords: ["disclosure", "whitepaper", "public communication", "manifest", "provenance"]
  },
  {
    id: "eu-data-minimization",
    jurisdiction: "European Union",
    title: "EU data minimization and transfer review",
    reason: "Prepare privacy review of personal-data scope, redaction, retention, and model-call minimization assumptions.",
    priority: "P1",
    source: SOURCE,
    flagIds: ["sensitive-data", "ai-workflow"],
    keywords: ["data minimization", "retention", "redaction", "model call", "personal data"]
  },
  {
    id: "uk-financial-promotion-retail",
    jurisdiction: "United Kingdom",
    title: "UK financial promotion and retail exposure review",
    reason: "Prepare counsel review of retail access, marketing claims, investor eligibility, and approval gates before publication.",
    priority: "P1",
    source: SOURCE,
    flagIds: ["asset-yield", "retail", "public-launch"],
    keywords: ["marketing", "financial promotion", "eligibility", "approval gate", "retail"]
  },
  {
    id: "uk-custody-operational-controls",
    jurisdiction: "United Kingdom",
    title: "UK custody operational controls review",
    reason: "Prepare compliance review of custody boundaries, signer permissions, escalation paths, and operational resilience evidence.",
    priority: "P1",
    source: SOURCE,
    flagIds: ["custody"],
    keywords: ["custody boundaries", "signer", "operational resilience", "escalation", "wallet control"]
  }
];

export function createJurisdictionChecklist(project: ProjectProfile, audit: AuditResult): JurisdictionChecklistItem[] {
  const activeFlagIds = new Set(audit.flags.map((flag) => flag.id));
  const requestedJurisdictions = normalizeJurisdictions(project.jurisdictions);

  const checklist: JurisdictionChecklistItem[] = CHECKLIST_TEMPLATES.filter(
    (template) => requestedJurisdictions.has(template.jurisdiction) && template.flagIds.some((id) => activeFlagIds.has(id))
  ).map((template) => {
    const status: JurisdictionChecklistStatus = hasSupportingEvidence(template, project.evidenceItems)
      ? "evidence-ready"
      : "review-needed";
    return {
      ...withoutTemplateFields(template),
      status
    };
  });

  const unknownJurisdictions = project.jurisdictions.filter((jurisdiction) => !normalizeJurisdiction(jurisdiction));
  const fallbackItems = unknownJurisdictions.map((jurisdiction, index): JurisdictionChecklistItem => ({
    id: `other-${slug(jurisdiction)}-${index + 1}`,
    jurisdiction: "Other",
    title: `${jurisdiction.trim()} jurisdiction intake assumptions review`,
    reason: "Prepare local counsel review of jurisdiction assumptions, user exposure, evidence needs, and launch boundaries.",
    priority: "P2",
    status: "review-needed",
    source: SOURCE
  }));

  return [...checklist, ...fallbackItems];
}

function withoutTemplateFields(template: ChecklistTemplate): Omit<JurisdictionChecklistItem, "status"> {
  const { flagIds: _flagIds, keywords: _keywords, ...item } = template;
  return item;
}

function hasSupportingEvidence(template: ChecklistTemplate, evidenceItems: EvidenceItem[]): boolean {
  const evidenceText = evidenceItems
    .map((item) => `${item.label} ${item.kind} ${item.source ?? ""} ${item.content}`)
    .join(" ")
    .toLowerCase();
  return template.keywords.some((keyword) => evidenceText.includes(keyword));
}

function normalizeJurisdictions(jurisdictions: string[]): Set<JurisdictionChecklistItem["jurisdiction"]> {
  return new Set(jurisdictions.map(normalizeJurisdiction).filter((item): item is JurisdictionChecklistItem["jurisdiction"] => Boolean(item)));
}

function normalizeJurisdiction(value: string): JurisdictionChecklistItem["jurisdiction"] | null {
  const normalized = value.toLowerCase();
  if (normalized.includes("united states") || normalized === "us" || normalized === "usa") {
    return "United States";
  }
  if (normalized.includes("european union") || normalized === "eu") {
    return "European Union";
  }
  if (normalized.includes("united kingdom") || normalized === "uk" || normalized.includes("great britain")) {
    return "United Kingdom";
  }
  return null;
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
