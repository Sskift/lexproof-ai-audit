import type { AuditResult } from "./auditEngine";
import type { ProjectProfile } from "./projectModel";

export type CounselPackTemplateId =
  | "launch-review"
  | "rwa-tokenized-asset"
  | "ai-governance"
  | "custody-controls"
  | "marketing-claims";

export type CounselPackTemplate = {
  id: CounselPackTemplateId;
  title: string;
  summary: string;
  reviewAgenda: string[];
  evidenceFocus: string[];
  assumptionChecks: string[];
  notLegalAdviceBoundary: "Not legal advice. Export templates are audit preparation routing aids only.";
};

export const counselPackTemplates: CounselPackTemplate[] = [
  {
    id: "rwa-tokenized-asset",
    title: "Tokenized Asset / RWA Review",
    summary: "Focuses counsel review on asset terms, yield language, redemption mechanics, custody, and investor exposure.",
    reviewAgenda: [
      "Map tokenized asset terms, redemption assumptions, and yield disclosures to counsel review.",
      "Confirm issuer, counterparty, and asset-servicing responsibilities before external reliance.",
      "Route unresolved securities, commodities, and MiCA-style source triggers to local counsel."
    ],
    evidenceFocus: [
      "Offering/disclosure assumptions",
      "Asset ownership or servicing memo",
      "Redemption and transfer restrictions",
      "Investor eligibility and jurisdiction routing"
    ],
    assumptionChecks: [
      "No export statement should imply registration, exemption, or compliance status.",
      "Missing asset custody or servicing evidence must stay visible in the remediation queue."
    ],
    notLegalAdviceBoundary: "Not legal advice. Export templates are audit preparation routing aids only."
  },
  {
    id: "ai-governance",
    title: "AI Governance Review",
    summary: "Focuses counsel review on model purpose, data classes, redaction, human review, and model-event traceability.",
    reviewAgenda: [
      "Confirm model purpose, allowed data classes, redaction status, and human review owner.",
      "Check that model output is draft audit preparation and does not alter deterministic risk scoring.",
      "Review AI event hashes, unresolved events, provider boundaries, and failure remediation steps."
    ],
    evidenceFocus: [
      "Model intake profile",
      "Allowed data-class policy",
      "Redaction gate receipt",
      "Human review timeline for model outputs"
    ],
    assumptionChecks: [
      "The export must not store API keys or provider credentials.",
      "Model output must remain review support, not a final legal or compliance decision."
    ],
    notLegalAdviceBoundary: "Not legal advice. Export templates are audit preparation routing aids only."
  },
  {
    id: "custody-controls",
    title: "Custody Controls Review",
    summary: "Focuses counsel and compliance review on wallet authority, treasury operations, signer controls, and recovery paths.",
    reviewAgenda: [
      "Map wallet, treasury, and custody authority to named control owners.",
      "Confirm signer thresholds, escalation paths, and incident recovery evidence.",
      "Review custody-related risk flags without treating review status as legal approval."
    ],
    evidenceFocus: [
      "Wallet control policy",
      "Signer roster and threshold summary",
      "Incident response and recovery procedure",
      "Custody vendor or smart contract control memo"
    ],
    assumptionChecks: [
      "Do not include private keys, seed phrases, or wallet secrets in the export.",
      "Unverified signer or treasury controls must stay open in the evidence gap queue."
    ],
    notLegalAdviceBoundary: "Not legal advice. Export templates are audit preparation routing aids only."
  },
  {
    id: "marketing-claims",
    title: "Marketing Claims Review",
    summary: "Focuses review on public claims, promotional channels, risk disclosures, audience assumptions, and approval workflow.",
    reviewAgenda: [
      "Inventory public launch claims, yield references, testimonials, and social distribution channels.",
      "Confirm approval owners for marketing copy, website claims, and community announcements.",
      "Route source-triggered promotional risk flags to counsel without deciding legality."
    ],
    evidenceFocus: [
      "Marketing copy approval log",
      "Creator endorsement and material-connection disclosure log",
      "Website and social claims archive",
      "Risk disclosure checklist",
      "Audience and jurisdiction targeting notes"
    ],
    assumptionChecks: [
      "The export must not say claims are approved by regulators or counsel.",
      "Missing approval evidence must remain visible before external launch use."
    ],
    notLegalAdviceBoundary: "Not legal advice. Export templates are audit preparation routing aids only."
  },
  {
    id: "launch-review",
    title: "Launch Readiness Review",
    summary: "Focuses review on the full launch packet: project facts, risk flags, evidence gaps, reviewers, and handoff readiness.",
    reviewAgenda: [
      "Confirm project facts, jurisdictions, launch stage, and unresolved risk flags.",
      "Check evidence coverage, human review status, and manifest readiness before counsel handoff.",
      "Use source-linked issue cards as review prompts, not legal conclusions."
    ],
    evidenceFocus: [
      "Launch approval memo",
      "Jurisdiction routing notes",
      "Risk flag remediation queue",
      "Evidence manifest and export receipts"
    ],
    assumptionChecks: [
      "The export is a launch audit-prep packet, not approval to launch.",
      "Open evidence gaps and unresolved reviews must remain visible."
    ],
    notLegalAdviceBoundary: "Not legal advice. Export templates are audit preparation routing aids only."
  }
];

export function getCounselPackTemplateById(id: CounselPackTemplateId): CounselPackTemplate {
  return counselPackTemplates.find((template) => template.id === id) ?? counselPackTemplates[0];
}

export function recommendCounselPackTemplate(project: ProjectProfile, _audit: AuditResult): CounselPackTemplate {
  const rwaTerms = ["rwa", "tokenized", "tokenised", "private credit", "yield", "note", "redemption"];
  const projectText = [
    project.assetModel,
    project.userType,
    project.custodyModel,
    project.dataSensitivity,
    project.aiUsage,
    project.blockchainUse,
    project.operatingStage
  ]
    .join(" ")
    .toLowerCase();
  const hasNoCustody = /\b(no custody|non-custodial|self-custody only)\b/.test(projectText);
  const hasNoAi = /\b(no ai|no model|without ai)\b/.test(project.aiUsage.toLowerCase());
  const assetModelText = project.assetModel.toLowerCase();
  const rwaPrimaryAssetBoost = score(assetModelText, rwaTerms) > 0 ? 4 : 0;
  const rwaScore = score(projectText, rwaTerms) + rwaPrimaryAssetBoost;
  const custodyScore = hasNoCustody ? 0 : score(projectText, ["custody", "wallet", "omnibus", "multisig", "treasury", "signer"], 2);

  const scores: Record<CounselPackTemplateId, number> = {
    "launch-review": score(projectText, ["launch", "planned", "beta", "production", "go-live"]),
    "rwa-tokenized-asset": rwaScore,
    "ai-governance": hasNoAi ? 0 : score(projectText, ["ai ", "model", "redaction", "data class", "model output", "provider"], 2),
    "custody-controls": custodyScore,
    "marketing-claims": score(projectText, ["marketing", "promotional", "promotion", "campaign", "claim", "testimonial", "social"], 3)
  };

  const [recommendedId] = (Object.entries(scores) as Array<[CounselPackTemplateId, number]>).sort(
    ([leftId, leftScore], [rightId, rightScore]) => rightScore - leftScore || templateOrder(leftId) - templateOrder(rightId)
  )[0];

  return getCounselPackTemplateById(recommendedId);
}

function score(text: string, terms: string[], weight = 1): number {
  return terms.reduce((total, term) => total + (text.includes(term) ? weight : 0), 0);
}

function templateOrder(id: CounselPackTemplateId): number {
  return counselPackTemplates.findIndex((template) => template.id === id);
}
