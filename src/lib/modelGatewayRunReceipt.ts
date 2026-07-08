import { redactModelGatewayRunText } from "./modelGatewayRunRedaction.js";
import type { ModelGatewayRun, ModelGatewayRunSummary, ModelGatewayRetryState, ModelGatewayRunStatus } from "./phase2Types.js";

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

export type ModelGatewayRunRecoveryStatus = "blocked" | "retry-available" | "needs-human-review" | "ready";
export type ModelGatewayRunRecoveryPriority = "P0" | "P1" | "P2" | "P3";

export type ModelGatewayRunRecoveryPacketItem = {
  runId: string;
  providerLabel: string;
  model: string;
  status: ModelGatewayRunStatus;
  redactionStatus: ModelGatewayRun["redactionStatus"];
  humanReviewStatus: ModelGatewayRun["humanReviewStatus"];
  retryState: ModelGatewayRetryState;
  requiresHumanReview: boolean;
  recoveryStatus: ModelGatewayRunRecoveryStatus;
  priority: ModelGatewayRunRecoveryPriority;
  recoveryAction: string;
  hashes: {
    payloadHash: string;
    responseHash: string;
    sourceEvidenceHash: string;
  };
  errorCode?: string;
  errorMessage?: string;
  remediationSteps: string[];
  createdAt?: string;
  completedAt?: string;
  notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery items are audit preparation workflow metadata only.";
};

export type ModelGatewayRunRecoveryPacket = {
  packetVersion: "lexproof-model-gateway-run-recovery-packet-v1";
  workspaceId: string;
  generatedAt: string;
  packetHash: string;
  runCount: number;
  recoveryItemCount: number;
  blockedCount: number;
  retryAvailableCount: number;
  needsHumanReviewCount: number;
  readyCount: number;
  latestRunId?: string;
  nextActions: string[];
  items: ModelGatewayRunRecoveryPacketItem[];
  notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only.";
};

export type CreateModelGatewayRunRecoveryPacketOptions = {
  generatedAt?: string;
};

type ModelGatewayRunReceiptSource = ModelGatewayRun | ModelGatewayRunSummary;
type ModelGatewayRunReceiptSubject = Omit<ModelGatewayRunReceipt, "exportedAt" | "receiptHash">;
type ModelGatewayRunRecoveryPacketSubject = Omit<ModelGatewayRunRecoveryPacket, "generatedAt" | "packetHash">;

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Model Gateway run receipts are audit preparation metadata only.";
const SUMMARY_PURPOSE = "Persisted Model Gateway run summary for audit preparation and human review.";
const RECOVERY_PACKET_BOUNDARY =
  "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only." as const;
const RECOVERY_ITEM_BOUNDARY =
  "Not legal advice. Model Gateway run recovery items are audit preparation workflow metadata only." as const;

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
  const browser = resolveBrowserDownloadGlobals();
  const blob = new browser.Blob([exportModelGatewayRunReceiptJson(receipt)], { type: "application/json;charset=utf-8" });
  const url = browser.URL.createObjectURL(blob);
  const link = browser.document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  browser.document.body.appendChild(link);
  link.click();
  link.remove();
  browser.URL.revokeObjectURL(url);
}

export async function createModelGatewayRunRecoveryPacket(
  workspaceId: string,
  runs: ModelGatewayRunReceiptSource[],
  options: CreateModelGatewayRunRecoveryPacketOptions = {}
): Promise<ModelGatewayRunRecoveryPacket> {
  const items = runs.map(createRecoveryPacketItem).sort(compareRecoveryItems);
  const latestRun = findLatestRun(runs);
  const subject: ModelGatewayRunRecoveryPacketSubject = {
    packetVersion: "lexproof-model-gateway-run-recovery-packet-v1",
    workspaceId: sanitizeText(workspaceId),
    runCount: runs.length,
    recoveryItemCount: items.filter((item) => item.recoveryStatus !== "ready").length,
    blockedCount: items.filter((item) => item.recoveryStatus === "blocked").length,
    retryAvailableCount: items.filter((item) => item.recoveryStatus === "retry-available").length,
    needsHumanReviewCount: items.filter((item) => item.recoveryStatus === "needs-human-review").length,
    readyCount: items.filter((item) => item.recoveryStatus === "ready").length,
    ...(latestRun ? { latestRunId: sanitizeText(latestRun.id) } : {}),
    nextActions: createPacketNextActions(items),
    items,
    notLegalAdviceBoundary: RECOVERY_PACKET_BOUNDARY
  };

  return {
    ...subject,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    packetHash: await sha256Hex(stableStringify(subject))
  };
}

export function exportModelGatewayRunRecoveryPacketJson(packet: ModelGatewayRunRecoveryPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

export function downloadModelGatewayRunRecoveryPacketJson(
  filename: string,
  packet: ModelGatewayRunRecoveryPacket
): void {
  const browser = resolveBrowserDownloadGlobals();
  const blob = new browser.Blob([exportModelGatewayRunRecoveryPacketJson(packet)], {
    type: "application/json;charset=utf-8"
  });
  const url = browser.URL.createObjectURL(blob);
  const link = browser.document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  browser.document.body.appendChild(link);
  link.click();
  link.remove();
  browser.URL.revokeObjectURL(url);
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
  if (run.humanReviewStatus === "rejected") {
    return "Route the rejected model-run receipt back through Human Review before relying on model output.";
  }

  if (run.retryState === "blocked-until-policy-change") {
    return "Keep external provider proxying disabled until Model Gateway policy review clears retry.";
  }

  if (run.status === "blocked" || run.retryState === "blocked-until-remediated" || run.redactionStatus === "blocked") {
    return "Resolve Model Gateway remediation steps before retry, export handoff, or external reliance.";
  }

  if (run.status === "failed" || run.retryState === "retry-available") {
    return "Retry the Model Gateway run only after remediation and keep the failure receipt with the audit trail.";
  }

  if (run.humanReviewStatus === "needs-review") {
    return "Complete Human Review before relying on this AI-assisted draft.";
  }

  return "Keep this metadata-only receipt with the audit-preparation export packet.";
}

function isFullModelGatewayRun(run: ModelGatewayRunReceiptSource): run is ModelGatewayRun {
  return "recordVersion" in run && run.recordVersion === "lexproof-model-gateway-run-v1";
}

function createRecoveryPacketItem(run: ModelGatewayRunReceiptSource): ModelGatewayRunRecoveryPacketItem {
  const recoveryStatus = createRecoveryStatus(run);
  const fullRun = isFullModelGatewayRun(run);

  return {
    runId: sanitizeText(run.id),
    providerLabel: sanitizeText(run.providerLabel),
    model: sanitizeText(run.model),
    status: run.status,
    redactionStatus: run.redactionStatus,
    humanReviewStatus: run.humanReviewStatus,
    retryState: run.retryState,
    requiresHumanReview: fullRun ? run.humanReviewStatus === "needs-review" : run.requiresHumanReview,
    recoveryStatus,
    priority: priorityForRecoveryStatus(recoveryStatus),
    recoveryAction: createRecoveryAction(run),
    hashes: {
      payloadHash: run.payloadHash || "not-available",
      responseHash: run.responseHash || "not-available",
      sourceEvidenceHash: run.sourceEvidenceHash || "not-available"
    },
    ...(run.errorCode ? { errorCode: sanitizeText(run.errorCode) } : {}),
    ...(run.errorMessage ? { errorMessage: sanitizeText(run.errorMessage) } : {}),
    remediationSteps: run.remediationSteps.map(sanitizeText),
    ...(fullRun ? { createdAt: run.createdAt } : {}),
    ...(fullRun && run.completedAt ? { completedAt: run.completedAt } : {}),
    notLegalAdviceBoundary: RECOVERY_ITEM_BOUNDARY
  };
}

function createRecoveryStatus(run: ModelGatewayRunReceiptSource): ModelGatewayRunRecoveryStatus {
  if (
    run.humanReviewStatus === "rejected" ||
    run.status === "blocked" ||
    run.redactionStatus === "blocked" ||
    run.retryState === "blocked-until-remediated" ||
    run.retryState === "blocked-until-policy-change"
  ) {
    return "blocked";
  }

  if (run.status === "failed" || run.retryState === "retry-available") {
    return "retry-available";
  }

  if (run.humanReviewStatus === "needs-review" || (!isFullModelGatewayRun(run) && run.requiresHumanReview)) {
    return "needs-human-review";
  }

  return "ready";
}

function priorityForRecoveryStatus(status: ModelGatewayRunRecoveryStatus): ModelGatewayRunRecoveryPriority {
  if (status === "blocked") {
    return "P0";
  }
  if (status === "retry-available") {
    return "P1";
  }
  if (status === "needs-human-review") {
    return "P2";
  }
  return "P3";
}

function createPacketNextActions(items: ModelGatewayRunRecoveryPacketItem[]): string[] {
  const openActions = unique(items.filter((item) => item.recoveryStatus !== "ready").map((item) => item.recoveryAction));

  if (openActions.length === 0) {
    return ["Keep Model Gateway run receipts with the audit-preparation handoff packet."];
  }

  return openActions.slice(0, 6);
}

function findLatestRun(runs: ModelGatewayRunReceiptSource[]): ModelGatewayRunReceiptSource | undefined {
  return [...runs].sort((left, right) => {
    const created = getCreatedAt(right).localeCompare(getCreatedAt(left));
    if (created !== 0) {
      return created;
    }
    return left.id.localeCompare(right.id);
  })[0];
}

function compareRecoveryItems(left: ModelGatewayRunRecoveryPacketItem, right: ModelGatewayRunRecoveryPacketItem): number {
  const priority = recoveryStatusWeight(left.recoveryStatus) - recoveryStatusWeight(right.recoveryStatus);
  if (priority !== 0) {
    return priority;
  }

  const created = (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
  if (created !== 0) {
    return created;
  }

  return left.runId.localeCompare(right.runId);
}

function recoveryStatusWeight(status: ModelGatewayRunRecoveryStatus): number {
  if (status === "blocked") {
    return 0;
  }
  if (status === "retry-available") {
    return 1;
  }
  if (status === "needs-human-review") {
    return 2;
  }
  return 3;
}

function getCreatedAt(run: ModelGatewayRunReceiptSource): string {
  return isFullModelGatewayRun(run) ? run.createdAt : "";
}

type BrowserDownloadGlobals = {
  Blob: typeof Blob;
  URL: {
    createObjectURL(blob: Blob): string;
    revokeObjectURL(url: string): void;
  };
  document: {
    body: {
      appendChild(node: unknown): void;
    };
    createElement(tagName: "a"): {
      href: string;
      download: string;
      style: { display: string };
      click(): void;
      remove(): void;
    };
  };
};

function resolveBrowserDownloadGlobals(): BrowserDownloadGlobals {
  const globals = globalThis as typeof globalThis & Partial<BrowserDownloadGlobals>;
  if (!globals.Blob || !globals.URL || !globals.document) {
    throw new Error("Model Gateway run JSON download requires browser document APIs.");
  }
  return globals as BrowserDownloadGlobals;
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
  return redactModelGatewayRunText(value);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
