import type { RedactionReport } from "./aiReview";
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
    model: input.settings.model.trim(),
    endpointHost: endpointHost(input.settings),
    status: blockers.length === 0 ? "ready" : "blocked",
    mode: input.settings.provider === "mock" ? "local-mock" : "session-openai-compatible",
    blockers,
    createdAt: input.createdAt ?? new Date().toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only."
  };
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
