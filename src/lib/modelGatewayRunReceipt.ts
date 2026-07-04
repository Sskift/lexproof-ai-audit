import { redactDataBoundaryText } from "./dataBoundary";
import type { ModelGatewayRun, ModelGatewayRunSummary, ModelGatewayRetryState, ModelGatewayRunStatus } from "./phase2Types";

export type ModelGatewayRunReceiptProviderPolicy = {
  provider: ModelGatewayRun["provider"] | "not-in-summary";
  adapterMode: ModelGatewayRun["providerMetadata"]["adapterMode"] | "not-in-summary";
  credentialPolicy: string;
  secretPolicy: string;
  allowedDataClasses: string[];
};

export type ModelGatewayRunReceipt = {
  receiptVersion: "lexproof-model-gateway-run-receipt-v1";
  runId: string;
  workspaceId: string;
  status: ModelGatewayRunStatus;
  providerLabel: string;
  model: string;
  purpose: string;
  redactionStatus: ModelGatewayRun["redactionStatus"];
  humanReviewStatus: ModelGatewayRun["humanReviewStatus"];
  requiresHumanReview: boolean;
  retryState: ModelGatewayRetryState;
  attempt: number | null;
  maxAttempts: number | null;
  hashes: {
    payloadHash: string;
    responseHash: string;
    sourceEvidenceHash: string;
  };
  providerPolicy: ModelGatewayRunReceiptProviderPolicy;
  errorCode?: string;
  errorMessage?: string;
  remediationSteps: string[];
  recoveryAction: string;
  createdAt?: string;
  completedAt?: string;
  exportedAt: string;
  receiptHash: string;
  notLegalAdviceBoundary: "Not legal advice. Model Gateway run receipts are audit preparation metadata only.";
};

export type CreateModelGatewayRunReceiptOptions = {
  workspaceId?: string;
  exportedAt?: string;
};

type ModelGatewayRunReceiptSource = ModelGatewayRun | ModelGatewayRunSummary;
type ModelGatewayRunReceiptSubject = Omit<ModelGatewayRunReceipt, "exportedAt" | "receiptHash">;

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Model Gateway run receipts are audit preparation metadata only.";
const SUMMARY_PURPOSE = "Persisted Model Gateway run summary for audit preparation and human review.";

export async function createModelGatewayRunReceipt(
  run: ModelGatewayRunReceiptSource,
  options: CreateModelGatewayRunReceiptOptions = {}
): Promise<ModelGatewayRunReceipt> {
  const subject = createReceiptSubject(run, options);
  const receiptHash = await sha256Hex(stableStringify(subject));

  return {
    ...subject,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    receiptHash
  };
}

export function exportModelGatewayRunReceiptJson(receipt: ModelGatewayRunReceipt): string {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function downloadModelGatewayRunReceiptJson(filename: string, receipt: ModelGatewayRunReceipt): void {
  const blob = new Blob([exportModelGatewayRunReceiptJson(receipt)], { type: "application/json;charset=utf-8" });
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

function createReceiptSubject(
  run: ModelGatewayRunReceiptSource,
  options: CreateModelGatewayRunReceiptOptions
): ModelGatewayRunReceiptSubject {
  const fullRun = isFullModelGatewayRun(run);
  const workspaceId = fullRun ? run.workspaceId : sanitizeText(options.workspaceId?.trim() || "unscoped-workspace");

  return {
    receiptVersion: "lexproof-model-gateway-run-receipt-v1",
    runId: sanitizeText(run.id),
    workspaceId: sanitizeText(workspaceId),
    status: run.status,
    providerLabel: sanitizeText(run.providerLabel),
    model: sanitizeText(run.model),
    purpose: sanitizeText(fullRun ? run.purpose : SUMMARY_PURPOSE),
    redactionStatus: run.redactionStatus,
    humanReviewStatus: run.humanReviewStatus,
    requiresHumanReview: fullRun ? run.humanReviewStatus === "needs-review" : run.requiresHumanReview,
    retryState: run.retryState,
    attempt: fullRun ? run.attempt : null,
    maxAttempts: fullRun ? run.maxAttempts : null,
    hashes: {
      payloadHash: run.payloadHash || "not-available",
      responseHash: run.responseHash || "not-available",
      sourceEvidenceHash: run.sourceEvidenceHash || "not-available"
    },
    providerPolicy: fullRun ? createFullProviderPolicy(run) : createSummaryProviderPolicy(),
    ...(run.errorCode ? { errorCode: sanitizeText(run.errorCode) } : {}),
    ...(run.errorMessage ? { errorMessage: sanitizeText(run.errorMessage) } : {}),
    remediationSteps: run.remediationSteps.map(sanitizeText),
    recoveryAction: createRecoveryAction(run),
    ...(fullRun ? { createdAt: run.createdAt } : {}),
    ...(fullRun && run.completedAt ? { completedAt: run.completedAt } : {}),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

function createFullProviderPolicy(run: ModelGatewayRun): ModelGatewayRunReceiptProviderPolicy {
  const providerMetadata = run.providerMetadata;

  return {
    provider: run.provider,
    adapterMode: providerMetadata.adapterMode,
    credentialPolicy: sanitizeText(providerMetadata.credentialPolicy),
    secretPolicy: sanitizeText(providerMetadata.secretPolicy),
    allowedDataClasses: providerMetadata.allowedDataClasses.map(sanitizeText)
  };
}

function createSummaryProviderPolicy(): ModelGatewayRunReceiptProviderPolicy {
  return {
    provider: "not-in-summary",
    adapterMode: "not-in-summary",
    credentialPolicy: "Server run summaries do not expose credentials; LexProof receipts do not store provider secrets.",
    secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
    allowedDataClasses: ["metadata-only model-run summary"]
  };
}

function createRecoveryAction(run: ModelGatewayRunReceiptSource): string {
  if (run.status === "blocked" || run.status === "failed" || run.retryState !== "not-needed") {
    return "Resolve Model Gateway remediation steps before retry, export handoff, or external reliance.";
  }

  if (run.humanReviewStatus === "rejected") {
    return "Route the rejected model-run receipt back through Human Review before relying on model output.";
  }

  if (run.humanReviewStatus === "needs-review") {
    return "Complete Human Review before relying on this AI-assisted draft.";
  }

  return "Keep this metadata-only receipt with the audit-preparation export packet.";
}

function isFullModelGatewayRun(run: ModelGatewayRunReceiptSource): run is ModelGatewayRun {
  return "recordVersion" in run && run.recordVersion === "lexproof-model-gateway-run-v1";
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

function sanitizeText(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
}
