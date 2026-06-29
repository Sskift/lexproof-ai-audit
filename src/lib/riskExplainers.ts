import type { AuditResult, SourceReference } from "./auditEngine";
import type { ProjectProfile } from "./projectModel";

export type RiskIssueCard = {
  flagId: string;
  title: string;
  severity: AuditResult["flags"][number]["severity"];
  rationale: string;
  whyTriggered: string[];
  sourceReferences: SourceReference[];
  notLegalAdviceBoundary: "Not legal advice. This issue card explains deterministic audit preparation triggers only.";
};

type FactProbe = {
  flagId: string;
  label: string;
  value: (project: ProjectProfile) => string;
  terms: string[];
};

const FACT_PROBES: FactProbe[] = [
  {
    flagId: "asset-yield",
    label: "Asset model",
    value: (project) => project.assetModel,
    terms: ["yield", "private credit", "note", "rwa", "tokenized", "investment"]
  },
  {
    flagId: "custody",
    label: "Custody model",
    value: (project) => project.custodyModel,
    terms: ["omnibus", "controls wallet", "platform controls", "escrow", "custody"]
  },
  {
    flagId: "retail",
    label: "User exposure",
    value: (project) => project.userType,
    terms: ["retail", "consumer", "public", "non-accredited"]
  },
  {
    flagId: "retail",
    label: "Operating stage",
    value: (project) => project.operatingStage,
    terms: ["public launch", "public sale", "public offering"]
  },
  {
    flagId: "sensitive-data",
    label: "Data sensitivity",
    value: (project) => project.dataSensitivity,
    terms: ["kyc", "accreditation", "transaction history", "personal", "sensitive", "ofac"]
  },
  {
    flagId: "public-launch",
    label: "Operating stage",
    value: (project) => project.operatingStage,
    terms: ["public launch", "planned public", "mainnet", "production"]
  },
  {
    flagId: "ai-workflow",
    label: "AI usage",
    value: (project) => project.aiUsage,
    terms: ["ai drafts", "ai summarizes", "ai flags", "agent", "llm", "ai"]
  },
  {
    flagId: "evidence-anchor",
    label: "Blockchain use",
    value: (project) => project.blockchainUse,
    terms: ["hash", "anchor", "ethereum", "bitcoin", "blockchain", "registry"]
  }
];

export function createRiskIssueCards(project: ProjectProfile, audit: AuditResult): RiskIssueCard[] {
  return audit.flags.map((flag) => ({
    flagId: flag.id,
    title: flag.title,
    severity: flag.severity,
    rationale: flag.rationale,
    whyTriggered: createWhyTriggered(project, flag.id),
    sourceReferences: createSourceReferences(flag.source, audit.sourcePack),
    notLegalAdviceBoundary: "Not legal advice. This issue card explains deterministic audit preparation triggers only."
  }));
}

function createWhyTriggered(project: ProjectProfile, flagId: string): string[] {
  const triggers = FACT_PROBES.filter((probe) => probe.flagId === flagId)
    .filter((probe) => containsAny(probe.value(project), probe.terms))
    .map((probe) => `${probe.label}: ${probe.value(project)}`);

  return triggers.length > 0 ? triggers : ["Current project facts matched deterministic audit rules."];
}

function createSourceReferences(flagSource: string, sourcePack: SourceReference[]): SourceReference[] {
  const lowerSource = flagSource.toLowerCase();
  const source = sourcePack.find((item) => lowerSource.includes(item.title.toLowerCase())) ?? matchBySourceText(lowerSource, sourcePack);
  return source ? [source] : sourcePack.slice(0, 1);
}

function matchBySourceText(flagSource: string, sourcePack: SourceReference[]): SourceReference | undefined {
  if (flagSource.includes("themes") || flagSource.includes("challenge")) {
    return sourcePack.find((source) => source.title === "BLI Legal Tech Hackathon 2");
  }
  if (flagSource.includes("resource hub") || flagSource.includes("compliance")) {
    return sourcePack.find((source) => source.title === "BLI Hackathon and resource hub");
  }
  if (flagSource.includes("not a law firm") || flagSource.includes("not legal advice")) {
    return sourcePack.find((source) => source.title === "BLI disclaimer");
  }
  if (flagSource.includes("past bli") || flagSource.includes("tamper-proof")) {
    return sourcePack.find((source) => source.title === "Constellation Labs BLI 2025 highlights");
  }
  return undefined;
}

function containsAny(value: string, terms: string[]): boolean {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}
