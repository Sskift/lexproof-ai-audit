import type { AuditResult } from "./auditEngine";
import {
  buildAIReviewPayload,
  parseAIReviewJson,
  redactSensitiveContent,
  type AIReviewPayload,
  type AIReviewResult,
  type RedactionReport
} from "./aiReview";
import type { ModelProvider } from "./modelProvider";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type ModelReviewRun = {
  runVersion: "lexproof-ai-review-run-v1";
  runId: string;
  generatedAt: string;
  projectId: string;
  projectName: string;
  providerLabel: string;
  model: string;
  redactionStatus: RedactionReport["status"];
  payloadHash: string;
  responseHash: string;
  riskFlagCount: number;
  evidenceSummaryCount: number;
  missingEvidenceCount: number;
  boundary: "AI-assisted draft for audit preparation only. Not legal advice.";
};

export type CreateModelReviewRunInput = {
  payload: AIReviewPayload;
  responseContent: string;
  providerLabel: string;
  model: string;
  redactionStatus: RedactionReport["status"];
  projectId?: string;
  generatedAt?: string;
};

export type RunAIReviewLedgerOptions = {
  model: string;
  redactionStatus: RedactionReport["status"];
  generatedAt?: string;
};

export async function createModelReviewRun(input: CreateModelReviewRunInput): Promise<ModelReviewRun> {
  const payloadHash = await sha256Hex(stableStringify(input.payload));
  const responseHash = await sha256Hex(input.responseContent);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const runIdHash = await sha256Hex(stableStringify({ generatedAt, payloadHash, responseHash }));

  return {
    runVersion: "lexproof-ai-review-run-v1",
    runId: `ai-run-${runIdHash.slice(0, 16)}`,
    generatedAt,
    projectId: input.projectId ?? "unscoped-project",
    projectName: createSafeLedgerDisplayText(input.payload.project.projectName),
    providerLabel: createSafeLedgerDisplayText(input.providerLabel),
    model: createSafeLedgerDisplayText(input.model),
    redactionStatus: input.redactionStatus,
    payloadHash,
    responseHash,
    riskFlagCount: input.payload.riskFlags.length,
    evidenceSummaryCount: input.payload.evidenceSummaries.length,
    missingEvidenceCount: input.payload.missingEvidenceChecklist.length,
    boundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

export function parseStoredModelReviewRuns(raw: string | null | undefined): ModelReviewRun[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      const run = sanitizeModelReviewRun(item);
      return run ? [run] : [];
    });
  } catch {
    return [];
  }
}

export function sanitizeModelReviewRun(value: unknown): ModelReviewRun | null {
  return normalizeModelReviewRun(value);
}

export async function runAIReviewWithLedger(
  project: ProjectProfile,
  audit: AuditResult,
  evidenceItems: EvidenceItem[],
  provider: ModelProvider,
  options: RunAIReviewLedgerOptions
): Promise<{ result: AIReviewResult; run: ModelReviewRun }> {
  const payload = buildAIReviewPayload(project, audit, evidenceItems);
  const response = await provider.completeReview(payload);
  const parsed = parseAIReviewJson(response.content);
  const deterministicMissing = payload.missingEvidenceChecklist
    .filter((item) => item.status === "missing")
    .map((item) => item.title);
  const result = {
    ...parsed,
    missingEvidence: mergeUnique([...parsed.missingEvidence, ...deterministicMissing])
  };
  const run = await createModelReviewRun({
    payload,
    responseContent: response.content,
    providerLabel: response.providerLabel || provider.providerLabel,
    model: options.model,
    redactionStatus: options.redactionStatus,
    projectId: project.id,
    generatedAt: options.generatedAt
  });

  return { result, run };
}

export function exportModelReviewRunJson(run: ModelReviewRun): string {
  const normalizedRun = sanitizeModelReviewRun(run);
  if (!normalizedRun) {
    throw new Error("Model review run export requires a valid metadata-only run.");
  }

  return `${JSON.stringify(normalizedRun, null, 2)}\n`;
}

export function downloadModelReviewRunJson(filename: string, run: ModelReviewRun): void {
  const blob = new Blob([exportModelReviewRunJson(run)], { type: "application/json;charset=utf-8" });
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

function mergeUnique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeModelReviewRun(value: unknown): ModelReviewRun | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Partial<Record<keyof ModelReviewRun, unknown>>;
  if (record.runVersion !== "lexproof-ai-review-run-v1") {
    return null;
  }

  const runId = strictRunId(record.runId);
  const generatedAt = strictIsoTimestamp(record.generatedAt);
  const projectId = safeRequiredText(record.projectId);
  const projectName = safeRequiredText(record.projectName);
  const providerLabel = safeRequiredText(record.providerLabel);
  const model = safeRequiredText(record.model);
  const redactionStatus = strictRedactionStatus(record.redactionStatus);
  const payloadHash = strictSha256(record.payloadHash);
  const responseHash = strictSha256(record.responseHash);
  const riskFlagCount = strictCount(record.riskFlagCount);
  const evidenceSummaryCount = strictCount(record.evidenceSummaryCount);
  const missingEvidenceCount = strictCount(record.missingEvidenceCount);

  if (
    !runId ||
    !generatedAt ||
    !projectId ||
    !projectName ||
    !providerLabel ||
    !model ||
    !redactionStatus ||
    !payloadHash ||
    !responseHash ||
    riskFlagCount === null ||
    evidenceSummaryCount === null ||
    missingEvidenceCount === null ||
    record.boundary !== "AI-assisted draft for audit preparation only. Not legal advice."
  ) {
    return null;
  }

  return {
    runVersion: "lexproof-ai-review-run-v1",
    runId,
    generatedAt,
    projectId,
    projectName,
    providerLabel,
    model,
    redactionStatus,
    payloadHash,
    responseHash,
    riskFlagCount,
    evidenceSummaryCount,
    missingEvidenceCount,
    boundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

function createSafeLedgerDisplayText(value: string): string {
  return redactSensitiveContent(value).replace(/\s+/g, " ").trim();
}

function safeRequiredText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const text = createSafeLedgerDisplayText(value);
  return text.length > 0 ? text : null;
}

function strictRunId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const runId = value.trim();
  return /^ai-run-[a-f0-9]{16}$/.test(runId) ? runId : null;
}

function strictIsoTimestamp(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const timestamp = value.trim();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp) && !Number.isNaN(Date.parse(timestamp))
    ? timestamp
    : null;
}

function strictRedactionStatus(value: unknown): RedactionReport["status"] | null {
  return value === "clean" || value === "needs-review" || value === "blocked" ? value : null;
}

function strictSha256(value: unknown): string | null {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

function strictCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 100_000 ? value : null;
}
