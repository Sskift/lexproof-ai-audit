import type { RedactionReport } from "./aiReview";
import { redactClassifiedText } from "./dataClassification";
import type { ModelSettings, ModelSettingsValidation } from "./modelProvider";

export type ModelConnectReceipt = {
  receiptVersion: "lexproof-model-connect-receipt-v1";
  provider: ModelSettings["provider"];
  providerLabel: string;
  model: string;
  endpointHost: string;
  status: "ready" | "blocked";
  mode: "local-mock" | "session-openai-compatible";
  blockers: string[];
  createdAt: string;
  notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only.";
};

export type CreateModelConnectReceiptInput = {
  settings: ModelSettings;
  settingsValidation: ModelSettingsValidation;
  redactionStatus: RedactionReport["status"];
  createdAt?: string;
};

export function createModelConnectReceipt(input: CreateModelConnectReceiptInput): ModelConnectReceipt {
  const blockers = [
    ...input.settingsValidation.errors,
    ...(input.redactionStatus === "blocked" ? ["Redaction Gate blocked this model connection."] : [])
  ];

  return {
    receiptVersion: "lexproof-model-connect-receipt-v1",
    provider: input.settings.provider,
    providerLabel: providerLabel(input.settings),
    model: sanitizeReceiptText(input.settings.model.trim()),
    endpointHost: sanitizeReceiptText(endpointHost(input.settings)),
    status: blockers.length === 0 ? "ready" : "blocked",
    mode: input.settings.provider === "mock" ? "local-mock" : "session-openai-compatible",
    blockers: blockers.map(sanitizeReceiptText),
    createdAt: input.createdAt ?? new Date().toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only."
  };
}

export function exportModelConnectReceiptJson(receipt: ModelConnectReceipt): string {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function downloadModelConnectReceiptJson(filename: string, receipt: ModelConnectReceipt): void {
  const blob = new Blob([exportModelConnectReceiptJson(receipt)], { type: "application/json;charset=utf-8" });
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

function providerLabel(settings: ModelSettings): string {
  if (settings.provider === "mock") {
    return "Mock local reviewer";
  }

  return "OpenAI-compatible session model";
}

function endpointHost(settings: ModelSettings): string {
  if (settings.provider === "mock") {
    return "local mock";
  }

  try {
    return settings.baseUrl ? new URL(settings.baseUrl).host : "";
  } catch {
    return settings.baseUrl?.trim() ?? "";
  }
}

function sanitizeReceiptText(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}
