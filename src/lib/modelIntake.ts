import type { AIReviewResult } from "./aiReview";
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

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function hashAIEventRecord(event: AIEventRecord): Promise<string> {
  return sha256Hex(stableStringify(event));
}

export function applyAIEventReviewUpdate(
  event: AIEventRecord,
  updates: Partial<Pick<AIEventRecord, "humanReviewer" | "reviewStatus">>,
  updatedAt = new Date().toISOString()
): AIEventRecord {
  return {
    ...event,
    ...updates,
    humanReviewer: updates.humanReviewer?.trim() ?? event.humanReviewer,
    updatedAt
  };
}

export function createAIReviewEventFromRun(
  run: ModelReviewRun,
  result: AIReviewResult,
  humanReviewer: string
): AIEventRecord {
  return {
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
  };
}

export async function buildModelIntakeSummary(
  profile: ModelConnectionProfile,
  events: AIEventRecord[]
): Promise<ModelIntakeSummary> {
  const validation = validateModelConnectionProfile(profile);
  const blockers = validation.errors.filter((error) =>
    error === "Models cannot be registered as final legal decision-makers." || error === "Raw KYC or personal data must not be routed into model intake."
  );
  const unresolvedEventCount = events.filter((event) => event.reviewStatus === "needs-review").length;
  const readiness: ModelIntakeReadiness =
    blockers.length > 0 ? "blocked" : !validation.valid || unresolvedEventCount > 0 ? "needs-review" : "ready";

  return {
    modelIntakeVersion: "lexproof-model-intake-v1",
    readiness,
    eventCount: events.length,
    unresolvedEventCount,
    blockers,
    handoffChecklist: createHandoffChecklist(validation, unresolvedEventCount),
    eventHashes: await Promise.all(
      events.map(async (event) => ({
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
  return `${JSON.stringify({ modelIntakeVersion: "lexproof-model-intake-v1", profile, events, summary }, null, 2)}\n`;
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

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
