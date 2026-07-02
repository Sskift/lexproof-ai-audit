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
    | "Switzerland"
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
