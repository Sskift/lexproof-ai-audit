import type { AuditResult } from "./auditEngine";
import type { ModelProvider } from "./modelProvider";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type MissingEvidenceItem = {
  id: string;
  title: string;
  reason: string;
  priority: "P0" | "P1" | "P2";
  relatedFlagId: string;
  status: "missing" | "covered";
};

export type AIReviewPayload = {
  boundary: string;
  instructions: string;
  project: {
    projectName: string;
    jurisdictions: string[];
    assetModel: string;
    custodyModel: string;
    dataSensitivity: string;
    aiUsage: string;
    blockchainUse: string;
    operatingStage: string;
  };
  riskFlags: Array<{
    id: string;
    title: string;
    severity: string;
    rationale: string;
  }>;
  evidenceSummaries: Array<{
    label: string;
    kind: string;
    status: string;
    owner: string;
    contentPreview: string;
  }>;
  missingEvidenceChecklist: MissingEvidenceItem[];
};

export type RedactionFinding = {
  evidenceLabel: string;
  category: "private-key-like value" | "secret phrase reference" | "raw KYC reference" | "personal-data reference";
  severity: "block" | "warn";
  matchCount: number;
  message: string;
};

export type RedactionReport = {
  status: "clean" | "needs-review" | "blocked";
  boundary: "Not legal advice. Inspect evidence summaries before sending them to any model.";
  findings: RedactionFinding[];
  evidencePreview: Array<{
    label: string;
    kind: string;
    status: string;
    owner: string;
    contentPreview: string;
    redactionCount: number;
  }>;
};

export type AIReviewResult = {
  extractedFacts: string[];
  missingEvidence: string[];
  draftQuestions: string[];
  suggestedRemediation: string[];
  modelBoundary: "AI-assisted draft for audit preparation only. Not legal advice.";
};

type EvidenceRequirement = {
  id: string;
  title: string;
  reason: string;
  priority: "P0" | "P1" | "P2";
  relatedFlagId: string;
  keywords: string[];
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

export function createMissingEvidenceChecklist(audit: AuditResult, evidenceItems: EvidenceItem[]): MissingEvidenceItem[] {
  return audit.flags.flatMap((flag) =>
    (REQUIREMENTS_BY_FLAG[flag.id] ?? []).map((requirement) => ({
      id: requirement.id,
      title: requirement.title,
      reason: requirement.reason,
      priority: requirement.priority,
      relatedFlagId: requirement.relatedFlagId,
      status: isRequirementCovered(requirement, evidenceItems) ? "covered" : "missing"
    }))
  );
}

export function buildAIReviewPayload(project: ProjectProfile, audit: AuditResult, evidenceItems: EvidenceItem[]): AIReviewPayload {
  return {
    boundary: "Not legal advice. AI output is an audit preparation draft for counsel and compliance review.",
    instructions:
      "Return JSON only with extractedFacts, missingEvidence, draftQuestions, and suggestedRemediation arrays. Do not make legal conclusions.",
    project: {
      projectName: project.projectName,
      jurisdictions: project.jurisdictions,
      assetModel: project.assetModel,
      custodyModel: project.custodyModel,
      dataSensitivity: project.dataSensitivity,
      aiUsage: project.aiUsage,
      blockchainUse: project.blockchainUse,
      operatingStage: project.operatingStage
    },
    riskFlags: audit.flags.map((flag) => ({
      id: flag.id,
      title: flag.title,
      severity: flag.severity,
      rationale: flag.rationale
    })),
    evidenceSummaries: evidenceItems.map((item) => ({
      label: item.label,
      kind: item.kind,
      status: item.status ?? "draft",
      owner: item.owner ?? "Founder",
      contentPreview: createEvidencePreview(item.content)
    })),
    missingEvidenceChecklist: createMissingEvidenceChecklist(audit, evidenceItems)
  };
}

export function createRedactionReport(evidenceItems: EvidenceItem[]): RedactionReport {
  const findings = evidenceItems.flatMap((item) => createRedactionFindings(item));
  const hasBlocker = findings.some((finding) => finding.severity === "block");
  const hasWarning = findings.some((finding) => finding.severity === "warn");

  return {
    status: hasBlocker ? "blocked" : hasWarning ? "needs-review" : "clean",
    boundary: "Not legal advice. Inspect evidence summaries before sending them to any model.",
    findings,
    evidencePreview: evidenceItems.map((item) => {
      const contentPreview = createEvidencePreview(item.content);
      return {
        label: item.label,
        kind: item.kind,
        status: item.status ?? "draft",
        owner: item.owner ?? "Founder",
        contentPreview,
        redactionCount: countRedactions(contentPreview)
      };
    })
  };
}

export async function runAIReview(
  project: ProjectProfile,
  audit: AuditResult,
  evidenceItems: EvidenceItem[],
  provider: ModelProvider
): Promise<AIReviewResult> {
  const payload = buildAIReviewPayload(project, audit, evidenceItems);
  const response = await provider.completeReview(payload);
  const parsed = parseAIReviewJson(response.content);
  const deterministicMissing = payload.missingEvidenceChecklist
    .filter((item) => item.status === "missing")
    .map((item) => item.title);

  return {
    ...parsed,
    missingEvidence: mergeUnique([...parsed.missingEvidence, ...deterministicMissing])
  };
}

export function parseAIReviewJson(content: string): AIReviewResult {
  const data = parseJsonObject(content);
  return {
    extractedFacts: toStringArray(data.extractedFacts),
    missingEvidence: toStringArray(data.missingEvidence),
    draftQuestions: toStringArray(data.draftQuestions),
    suggestedRemediation: toStringArray(data.suggestedRemediation),
    modelBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

function createEvidencePreview(content: string): string {
  return redactSensitiveContent(content).slice(0, 280);
}

export function redactSensitiveContent(content: string): string {
  return content
    .replace(/0x[a-fA-F0-9]{64}/g, "[redacted-private-key]")
    .replace(/\b(raw\s+kyc|passport\s+number|social security number|ssn)\b/gi, "[redacted-personal-data]")
    .replace(/\b(seed phrase|mnemonic|private key)\b/gi, "[redacted-secret]");
}

function createRedactionFindings(item: EvidenceItem): RedactionFinding[] {
  const findings: RedactionFinding[] = [];

  addFinding(findings, item, /0x[a-fA-F0-9]{64}/g, "private-key-like value", "block", "Private-key-like material must be removed before model review.");
  addFinding(findings, item, /\b(seed phrase|mnemonic|private key)\b/gi, "secret phrase reference", "block", "Secret phrase references must be removed before model review.");
  addFinding(findings, item, /\b(raw\s+kyc|kyc)\b/gi, "raw KYC reference", "warn", "KYC references need human review and should not expose raw files to a model.");
  addFinding(
    findings,
    item,
    /\b(passport\s+number|social security number|ssn|personal data)\b/gi,
    "personal-data reference",
    "warn",
    "Personal-data references need redaction or confirmation before model review."
  );

  return findings;
}

function addFinding(
  findings: RedactionFinding[],
  item: EvidenceItem,
  pattern: RegExp,
  category: RedactionFinding["category"],
  severity: RedactionFinding["severity"],
  message: string
): void {
  const context = `${item.label} ${item.kind} ${item.content}`;
  const matches = context.match(pattern);
  if (!matches?.length) {
    return;
  }

  findings.push({
    evidenceLabel: item.label,
    category,
    severity,
    matchCount: matches.length,
    message
  });
}

function countRedactions(content: string): number {
  return (content.match(/\[redacted-[^\]]+\]/g) ?? []).length;
}

function isRequirementCovered(requirement: EvidenceRequirement, evidenceItems: EvidenceItem[]): boolean {
  const evidenceText = evidenceItems
    .map((item) => `${item.label} ${item.kind} ${item.source ?? ""} ${item.content}`)
    .join(" ")
    .toLowerCase();
  return requirement.keywords.some((keyword) => evidenceText.includes(keyword));
}

function parseJsonObject(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function mergeUnique(values: string[]): string[] {
  return Array.from(new Set(values));
}
