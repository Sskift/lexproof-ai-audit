import type { AuditInputProfile, EvidenceItem } from "./projectModel";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type { EvidenceItem } from "./projectModel";

export type AuditProfile = AuditInputProfile;

export type AuditFlag = {
  id: string;
  title: string;
  severity: "info" | "watch" | "material" | "critical";
  weight: number;
  rationale: string;
  source: string;
};

export type RemediationItem = {
  owner: "Counsel" | "Compliance" | "Engineering" | "Product";
  action: string;
  priority: "P0" | "P1" | "P2";
};

export type AuditResult = {
  score: number;
  riskLevel: RiskLevel;
  flags: AuditFlag[];
  remediation: RemediationItem[];
  sourcePack: SourceReference[];
};

export type SourceReference = {
  title: string;
  url: string;
  relevance: string;
};

export type SubmissionFit = {
  targetHackathon: string;
  themeCoverage: string[];
  requiredAssets: string[];
  scorecard: {
    prizeToEffort: number;
    deadlineRoom: number;
    scopeFit: number;
    implementationRisk: number;
  };
};

const SOURCE_PACK: SourceReference[] = [
  {
    title: "BLI Legal Tech Hackathon 2",
    url: "https://dorahacks.io/hackathon/legal-hack-2026/detail",
    relevance: "Official DoraHacks challenge page for prize, eligibility, deadline, and themes."
  },
  {
    title: "BLI Hackathon and resource hub",
    url: "https://bli.tools/hackathon/",
    relevance: "Organizer context for law, finance, compliance, mentoring, bounties, and global legal tech scope."
  },
  {
    title: "BLI disclaimer",
    url: "https://bli.tools/hackathon/",
    relevance: "BLI states it is not a law firm; the MVP mirrors that by producing audit prep, not legal advice."
  },
  {
    title: "Constellation Labs BLI 2025 highlights",
    url: "https://medium.com/constellationlabs/building-the-future-of-legal-innovation-highlights-from-the-blockchain-legal-institute-hackathon-c65899009f75",
    relevance: "Past BLI-adjacent builds rewarded verified data, digital evidence, and tamper-proof audit trails."
  }
];

const BASE_REMEDIATION: RemediationItem[] = [
  {
    owner: "Counsel",
    action: "Review generated issue list before any external statement or filing.",
    priority: "P1"
  },
  {
    owner: "Compliance",
    action: "Attach policy evidence and identify missing approvals in the evidence ledger.",
    priority: "P1"
  },
  {
    owner: "Engineering",
    action: "Hash each uploaded policy, memo, and workflow artifact before sharing a counsel pack.",
    priority: "P2"
  }
];

export function analyzeAuditProfile(profile: AuditProfile): AuditResult {
  const text = normalize(
    [
      profile.assetModel,
      profile.userType,
      profile.custodyModel,
      profile.dataSensitivity,
      profile.aiUsage,
      profile.blockchainUse,
      profile.operatingStage,
      profile.entityType,
      ...profile.jurisdictions
    ].join(" ")
  );

  const flags: AuditFlag[] = [];

  if (includesAny(text, ["yield", "private credit", "note", "rwa", "tokenized", "investment"])) {
    flags.push({
      id: "asset-yield",
      title: "Yield-bearing or investment-like asset",
      severity: "critical",
      weight: 30,
      rationale: "Tokenized yield, private credit, or investment language requires counsel review before launch.",
      source: "BLI themes include legal, finance, compliance, RWA, RegTech, Bitcoin, and Ethereum."
    });
  }

  if (
    includesAny(text, ["omnibus", "controls wallet", "platform controls", "escrow"]) ||
    (text.includes("custody") && !includesAny(text, ["no custody", "non-custodial", "without custody"]))
  ) {
    flags.push({
      id: "custody",
      title: "Custody or wallet control",
      severity: "critical",
      weight: 25,
      rationale: "Custody facts change operational, consumer protection, and financial compliance posture.",
      source: "BLI resource hub links custody, wallets, exchanges, and compliance materials."
    });
  }

  if (includesAny(text, ["retail", "consumer", "public launch", "public sale", "public offering", "non-accredited"])) {
    flags.push({
      id: "retail",
      title: "Retail or public-user exposure",
      severity: "material",
      weight: 17,
      rationale: "Retail availability raises disclosure, suitability, marketing, and consumer risk.",
      source: "BLI challenge targets practical legal and compliance solutions."
    });
  }

  if (includesAny(text, ["kyc", "accreditation", "transaction history", "personal", "sensitive", "ofac"])) {
    flags.push({
      id: "sensitive-data",
      title: "Sensitive compliance data",
      severity: "material",
      weight: 15,
      rationale: "KYC, sanctions, investor status, and wallet history require controlled evidence handling.",
      source: "BLI resource hub emphasizes compliance-USA and compliance-world research references."
    });
  }

  if (includesAny(text, ["public launch", "planned public", "mainnet", "production"])) {
    flags.push({
      id: "public-launch",
      title: "Near-term public launch",
      severity: "material",
      weight: 12,
      rationale: "Public launch timing compresses remediation and approval windows.",
      source: "BLI hackathon encourages impactful, production-relevant legal technology."
    });
  }

  if (includesAny(text, ["ai drafts", "ai summarizes", "ai flags", "agent", "llm"])) {
    flags.push({
      id: "ai-workflow",
      title: "AI-generated legal/compliance workflow",
      severity: flags.length > 0 ? "watch" : "info",
      weight: flags.length > 0 ? 7 : 4,
      rationale: "AI output needs source lineage, human review, and a clear non-advice boundary.",
      source: "BLI scope includes AI and legal technology."
    });
  }

  if (includesAny(text, ["hash", "anchor", "ethereum", "bitcoin", "blockchain", "registry"])) {
    flags.push({
      id: "evidence-anchor",
      title: "Blockchain evidence trail",
      severity: "info",
      weight: 3,
      rationale: "Evidence anchoring is useful when paired with clear source records and privacy controls.",
      source: "Past BLI projects used verified data, digital evidence, and tamper-proof audit trails."
    });
  }

  const score = clamp(flags.reduce((sum, flag) => sum + flag.weight, 0), 0, 100);
  const riskLevel = classifyRisk(score);

  return {
    score,
    riskLevel,
    flags,
    remediation: createRemediation(flags),
    sourcePack: SOURCE_PACK
  };
}

export async function createEvidenceHash(items: EvidenceItem[]): Promise<string> {
  const payload = JSON.stringify(
    items.map((item) => ({
      label: item.label.trim(),
      kind: item.kind.trim(),
      content: item.content.trim()
    }))
  );
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildCounselMemo(profile: AuditProfile, audit: AuditResult, evidenceHash: string): string {
  const flags = audit.flags.map((flag) => `- [${flag.severity}] ${flag.title}: ${flag.rationale}`).join("\n");
  const tasks = audit.remediation.map((item) => `- ${item.priority} ${item.owner}: ${item.action}`).join("\n");
  const sources = audit.sourcePack.map((source) => `- ${source.title}: ${source.url}`).join("\n");

  return [
    `# ${profile.projectName} Legal Audit Prep Memo`,
    "",
    "Not legal advice. This memo is an audit preparation artifact for counsel and compliance review.",
    "",
    `Target hackathon: BLI Legal Tech Hackathon 2`,
    `Risk posture: ${audit.riskLevel} (${audit.score}/100)`,
    `Evidence bundle SHA-256: ${evidenceHash}`,
    "",
    "## Profile",
    `- Entity: ${profile.entityType}`,
    `- Jurisdictions: ${profile.jurisdictions.join(", ")}`,
    `- Asset model: ${profile.assetModel}`,
    `- Users: ${profile.userType}`,
    `- Custody: ${profile.custodyModel}`,
    `- Data: ${profile.dataSensitivity}`,
    `- AI usage: ${profile.aiUsage}`,
    `- Blockchain use: ${profile.blockchainUse}`,
    "",
    "## Flags",
    flags || "- No material flags detected in the current facts.",
    "",
    "## Handoff Tasks",
    tasks,
    "",
    "## Source Pack",
    sources
  ].join("\n");
}

export function createSubmissionFit(): SubmissionFit {
  return {
    targetHackathon: "BLI Legal Tech Hackathon 2",
    themeCoverage: ["Legal", "Compliance", "AI", "RegTech", "Blockchain", "Finance", "RWA"],
    requiredAssets: ["Public GitHub repository", "Demo video", "BUIDL submission", "Clear README", "Audit source pack"],
    scorecard: {
      prizeToEffort: 9,
      deadlineRoom: 10,
      scopeFit: 9,
      implementationRisk: 7
    }
  };
}

function createRemediation(flags: AuditFlag[]): RemediationItem[] {
  const remediation = [...BASE_REMEDIATION];
  const ids = new Set(flags.map((flag) => flag.id));

  if (ids.has("asset-yield")) {
    remediation.unshift({
      owner: "Counsel",
      action: "Classify the asset, offering flow, disclosure obligations, and exemption assumptions.",
      priority: "P0"
    });
  }

  if (ids.has("custody")) {
    remediation.unshift({
      owner: "Compliance",
      action: "Document custody boundaries, signer controls, withdrawal authority, and incident response.",
      priority: "P0"
    });
  }

  if (ids.has("sensitive-data")) {
    remediation.push({
      owner: "Engineering",
      action: "Separate raw KYC data from hashed audit receipts and restrict exported counsel packs.",
      priority: "P1"
    });
  }

  if (ids.has("ai-workflow")) {
    remediation.push({
      owner: "Product",
      action: "Add human approval checkpoints and source citations to every AI-generated recommendation.",
      priority: "P1"
    });
  }

  return remediation;
}

function classifyRisk(score: number): RiskLevel {
  if (score >= 85) {
    return "critical";
  }
  if (score >= 60) {
    return "high";
  }
  if (score >= 35) {
    return "moderate";
  }
  return "low";
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function normalize(value: string): string {
  return value.toLowerCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
