import type { AIReviewResult } from "./aiReview";
import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification";
import type { ModelReviewRun } from "./modelReviewLedger";

export type ModelEndpointType = "mock" | "openai-compatible" | "enterprise-proxy";

export type ModelDecisionRole = "draft-assistant" | "risk-triage" | "human-review-support" | "final-legal-decision";

export type ModelConnectionProfile = {
  providerName: string;
  modelName: string;
  endpointType: ModelEndpointType;
  useCase: string;
  decisionRole: ModelDecisionRole;
  dataClasses: string[];
  humanReviewOwner: string;
};

export type ModelConnectionValidation = {
  valid: boolean;
  errors: string[];
};

export type AIEventReviewStatus = "needs-review" | "reviewed" | "rejected";

export type AIEventRecord = {
  id: string;
  projectId: string;
  eventType: string;
  inputSummary: string;
  outputSummary: string;
  modelAction: string;
  humanReviewer: string;
  reviewStatus: AIEventReviewStatus;
  sourceRunId?: string;
  createdAt: string;
  updatedAt?: string;
};

export type ModelIntakeReadiness = "ready" | "needs-review" | "blocked";

export type ModelIntakeSummary = {
  modelIntakeVersion: "lexproof-model-intake-v1";
  readiness: ModelIntakeReadiness;
  eventCount: number;
  unresolvedEventCount: number;
  blockers: string[];
  handoffChecklist: string[];
  eventHashes: Array<{
    eventId: string;
    hash: string;
  }>;
  notLegalAdviceBoundary: "Not legal advice. Model intake records are audit preparation materials for human review.";
};

const LEGAL_CONCLUSION_PATTERN =
  /\b(final legal decision|legal opinion|legal approval|legally compliant|legally non-compliant|compliance decision)\b/gi;
const MODEL_INTAKE_PROFILE_METADATA_ERROR =
  "Model intake profile metadata must not include credentials, private keys, wallet secrets, raw KYC, or personal data.";

export function validateModelConnectionProfile(profile: Partial<ModelConnectionProfile>): ModelConnectionValidation {
  const errors: string[] = [];

  if (!hasText(profile.providerName)) {
    errors.push("Provider name is required.");
  }

  if (!hasText(profile.modelName)) {
    errors.push("Model name is required.");
  }

  if (!hasText(profile.useCase)) {
    errors.push("Use case is required.");
  }

  if (!hasText(profile.humanReviewOwner)) {
    errors.push("Human review owner is required.");
  }

  if (profile.decisionRole === "final-legal-decision") {
    errors.push("Models cannot be registered as final legal decision-makers.");
  }

  if ((profile.dataClasses ?? []).some((dataClass) => /\b(raw\s+kyc|passport|ssn|social security|personal data)\b/i.test(dataClass))) {
    errors.push("Raw KYC or personal data must not be routed into model intake.");
  }

  if (containsBlockedProfileMetadata(profile)) {
    errors.push(MODEL_INTAKE_PROFILE_METADATA_ERROR);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function hashAIEventRecord(event: AIEventRecord): Promise<string> {
  return sha256Hex(stableStringify(sanitizeAIEventRecord(event)));
}

export function applyAIEventReviewUpdate(
  event: AIEventRecord,
  updates: Partial<Pick<AIEventRecord, "humanReviewer" | "reviewStatus">>,
  updatedAt = new Date().toISOString()
): AIEventRecord {
  return sanitizeAIEventRecord({
    ...event,
    ...updates,
    humanReviewer: updates.humanReviewer ?? event.humanReviewer,
    updatedAt
  });
}

export function createAIReviewEventFromRun(
  run: ModelReviewRun,
  result: AIReviewResult,
  humanReviewer: string
): AIEventRecord {
  return sanitizeAIEventRecord({
    id: `ai-event-${run.runId}`,
    projectId: run.projectId,
    eventType: "AI Review run",
    inputSummary: [
      `${run.evidenceSummaryCount} evidence summaries`,
      `${run.riskFlagCount} risk flags`,
      `redaction status ${run.redactionStatus}`,
      `payload SHA-256 ${run.payloadHash}`
    ].join("; "),
    outputSummary: [
      `${result.extractedFacts.length} extracted facts`,
      `${result.missingEvidence.length} missing evidence items`,
      `${result.draftQuestions.length} draft counsel questions`,
      `${result.suggestedRemediation.length} remediation suggestions`
    ].join("; "),
    modelAction: `${run.providerLabel} ${run.model} produced an audit-prep review draft; response SHA-256 ${run.responseHash}; ${run.boundary}`,
    humanReviewer: humanReviewer.trim() || "Compliance",
    reviewStatus: "needs-review",
    sourceRunId: run.runId,
    createdAt: run.generatedAt,
    updatedAt: run.generatedAt
  });
}

export async function buildModelIntakeSummary(
  profile: ModelConnectionProfile,
  events: AIEventRecord[]
): Promise<ModelIntakeSummary> {
  const validation = validateModelConnectionProfile(profile);
  const blockers = validation.errors.filter((error) =>
    error === "Models cannot be registered as final legal decision-makers." ||
    error === "Raw KYC or personal data must not be routed into model intake." ||
    error === MODEL_INTAKE_PROFILE_METADATA_ERROR
  );
  const sanitizedEvents = events.map(sanitizeAIEventRecord);
  const unresolvedEventCount = sanitizedEvents.filter((event) => event.reviewStatus === "needs-review").length;
  const readiness: ModelIntakeReadiness =
    blockers.length > 0 ? "blocked" : !validation.valid || unresolvedEventCount > 0 ? "needs-review" : "ready";

  return {
    modelIntakeVersion: "lexproof-model-intake-v1",
    readiness,
    eventCount: sanitizedEvents.length,
    unresolvedEventCount,
    blockers,
    handoffChecklist: createHandoffChecklist(validation, unresolvedEventCount),
    eventHashes: await Promise.all(
      sanitizedEvents.map(async (event) => ({
        eventId: event.id,
        hash: await hashAIEventRecord(event)
      }))
    ),
    notLegalAdviceBoundary: "Not legal advice. Model intake records are audit preparation materials for human review."
  };
}

export function exportModelIntakeJson(
  profile: ModelConnectionProfile,
  events: AIEventRecord[],
  summary: ModelIntakeSummary
): string {
  return `${JSON.stringify(
    {
      modelIntakeVersion: "lexproof-model-intake-v1",
      profile: sanitizeModelConnectionProfile(profile),
      events: events.map(sanitizeAIEventRecord),
      summary: sanitizeModelIntakeSummary(summary)
    },
    null,
    2
  )}\n`;
}

export function downloadModelIntakeJson(
  filename: string,
  profile: ModelConnectionProfile,
  events: AIEventRecord[],
  summary: ModelIntakeSummary
): void {
  const blob = new Blob([exportModelIntakeJson(profile, events, summary)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createHandoffChecklist(validation: ModelConnectionValidation, unresolvedEventCount: number): string[] {
  const checklist = [
    "Confirm model use remains audit preparation only.",
    "Verify API keys and provider credentials are not stored in the intake record.",
    "Route model outputs to a named human reviewer before external reliance."
  ];

  if (!validation.valid) {
    checklist.push("Resolve model connection profile validation errors.");
  }

  if (unresolvedEventCount > 0) {
    checklist.push("Resolve AI event review items before external reliance.");
  }

  return checklist;
}

function sanitizeModelConnectionProfile(profile: ModelConnectionProfile): ModelConnectionProfile {
  return {
    providerName: sanitizeText(profile.providerName),
    modelName: sanitizeText(profile.modelName),
    endpointType: profile.endpointType,
    useCase: sanitizeText(profile.useCase),
    decisionRole: profile.decisionRole,
    dataClasses: profile.dataClasses.map(sanitizeText).filter(Boolean),
    humanReviewOwner: sanitizeText(profile.humanReviewOwner)
  };
}

export function sanitizeAIEventRecord(event: AIEventRecord): AIEventRecord {
  return {
    id: sanitizeText(event.id),
    projectId: sanitizeText(event.projectId),
    eventType: sanitizeText(event.eventType),
    inputSummary: sanitizeText(event.inputSummary),
    outputSummary: sanitizeText(event.outputSummary),
    modelAction: sanitizeText(event.modelAction),
    humanReviewer: sanitizeText(event.humanReviewer),
    reviewStatus: event.reviewStatus,
    ...(event.sourceRunId ? { sourceRunId: sanitizeText(event.sourceRunId) } : {}),
    createdAt: sanitizeText(event.createdAt),
    ...(event.updatedAt ? { updatedAt: sanitizeText(event.updatedAt) } : {})
  };
}

function sanitizeModelIntakeSummary(summary: ModelIntakeSummary): ModelIntakeSummary {
  return {
    ...summary,
    blockers: summary.blockers.map(sanitizeText).filter(Boolean),
    handoffChecklist: summary.handoffChecklist.map(sanitizeText).filter(Boolean),
    eventHashes: summary.eventHashes.map((item) => ({
      eventId: sanitizeText(item.eventId),
      hash: sanitizeHash(item.hash)
    })),
    notLegalAdviceBoundary: "Not legal advice. Model intake records are audit preparation materials for human review."
  };
}

function sanitizeHash(value: string): string {
  const hash = value.trim();
  return /^[a-f0-9]{64}$/.test(hash) ? hash : sanitizeText(hash);
}

function sanitizeText(value: string): string {
  const { text, protectedHashes } = protectSha256Hashes(value.replace(/\s+/g, " ").trim());
  const redacted = redactClassifiedText(text)
    .replace(/\b(bearer token)(\s+)[\w.\-]{8,}/gi, "$1$2[redacted-secret]")
    .replace(/\b(seed phrase|mnemonic|private key)\b/gi, "[redacted-private-key]")
    .replace(/\b(passport data|passport document|passport file)\b/gi, "[redacted-personal-data]")
    .replace(LEGAL_CONCLUSION_PATTERN, "[redacted-legal-conclusion]")
    .trim();

  return protectedHashes.reduce((current, hash, index) => current.replace(`LEXPROOF_SHA256_TOKEN_${index}`, hash), redacted);
}

function protectSha256Hashes(value: string): { text: string; protectedHashes: string[] } {
  const protectedHashes: string[] = [];
  const text = value.replace(/\b(SHA-256\s+)([a-f0-9]{64})\b/gi, (match) => {
    protectedHashes.push(match);
    return `LEXPROOF_SHA256_TOKEN_${protectedHashes.length - 1}`;
  });

  return { text, protectedHashes };
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function containsBlockedProfileMetadata(profile: Partial<ModelConnectionProfile>): boolean {
  const metadata = [profile.providerName, profile.modelName, profile.useCase, profile.humanReviewOwner]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  return classifyDataBoundaryText(metadata).some((finding) => finding.severity === "block");
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
