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
  jurisdiction: "United States" | "European Union" | "United Kingdom" | "Singapore" | "Switzerland" | "United Arab Emirates";
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
        id: "eu-data-minimization-control",
        title: "Data minimization and model-call control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["sensitive-data", "ai-workflow"],
        evidenceKeywords: ["data minimization", "retention", "redaction", "model call", "personal data"]
      }
    ]
  },
  {
    jurisdiction: "United Kingdom",
    aliases: ["united kingdom", "uk", "great britain"],
    summary: "Prepare financial-promotion, retail access, custody resilience, and launch approval controls.",
    recommendedRole: "UK financial promotion / crypto counsel",
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
        id: "uk-operational-resilience-control",
        title: "Custody operational resilience control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody"],
        evidenceKeywords: ["custody boundaries", "signer", "operational resilience", "escalation", "wallet control"]
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
    jurisdiction: "Switzerland",
    aliases: ["switzerland", "swiss", "ch"],
    summary:
      "Prepare token classification, offering/prospectus intake, foundation governance, custody, and banking perimeter evidence for Swiss counsel.",
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
        id: "uae-marketing-custody-access-control",
        title: "Marketing, custody, and cross-border access control",
        owner: "Compliance",
        priority: "P1",
        relatedFlagIds: ["custody", "sensitive-data", "ai-workflow"],
        evidenceKeywords: ["marketing approval", "cross-border", "wallet control", "custody", "kyc", "redaction", "human review"]
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
    .map((control) => withEvidenceStatus(control, evidenceItems));

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

function withEvidenceStatus(control: ControlTemplate, evidenceItems: EvidenceItem[]): JurisdictionPackControl {
  const evidenceLabels = evidenceItems
    .filter((item) => isEvidenceReady(item) && matchesControl(control, item))
    .map((item) => item.label.trim())
    .filter(Boolean);

  return {
    ...control,
    status: evidenceLabels.length > 0 ? "evidence-ready" : "needs-evidence",
    evidenceLabels: Array.from(new Set(evidenceLabels))
  };
}

function matchesControl(control: ControlTemplate, item: EvidenceItem): boolean {
  const text = `${item.label} ${item.kind} ${item.source ?? ""} ${item.content}`.toLowerCase();
  return control.evidenceKeywords.some((keyword) => text.includes(keyword));
}

function isEvidenceReady(item: EvidenceItem): boolean {
  return item.status === "received" || item.status === "verified";
}

function matchPackTemplate(jurisdiction: string): PackTemplate | undefined {
  const normalized = jurisdiction.trim().toLowerCase();
  return PACK_TEMPLATES.find((template) => template.aliases.some((alias) => normalized.includes(alias) || normalized === alias));
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
