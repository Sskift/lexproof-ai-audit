import type { AuditResult } from "./auditEngine";
import { redactClassifiedText } from "./dataClassification";
import type { ModelProvider } from "./modelProvider";
import type { EvidenceItem, ProjectProfile } from "./projectModel";
import { createMissingEvidenceChecklist } from "./riskEvidence";
import type { MissingEvidenceItem } from "./riskEvidence";

export { createMissingEvidenceChecklist };
export type { MissingEvidenceItem };

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

const legalConclusionPattern =
  /\b(final legal decision|legal opinion|legal approval|legally compliant|legally non-compliant|compliance decision)\b/gi;

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
    extractedFacts: toSafeModelOutputArray(data.extractedFacts),
    missingEvidence: toSafeModelOutputArray(data.missingEvidence),
    draftQuestions: toSafeModelOutputArray(data.draftQuestions),
    suggestedRemediation: toSafeModelOutputArray(data.suggestedRemediation),
    modelBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

function createEvidencePreview(content: string): string {
  return redactSensitiveContent(content).slice(0, 280);
}

export function redactSensitiveContent(content: string): string {
  return redactClassifiedText(content)
    .replace(/\b(passport data|passport document|passport file)\b/gi, "[redacted-personal-data]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]");
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

function parseJsonObject(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function toSafeModelOutputArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => redactSensitiveContent(item).replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 0);
}

function mergeUnique(values: string[]): string[] {
  return Array.from(new Set(values));
}
