import { describe, expect, it } from "vitest";
import { createModelConnectReceipt } from "./modelConnect";

describe("model connect receipts", () => {
  it("creates a session-only OpenAI-compatible receipt without exposing the API key", () => {
    const receipt = createModelConnectReceipt({
      settings: {
        provider: "openai-compatible",
        model: "gpt-audit-review",
        baseUrl: "https://models.example.test/v1",
        apiKey: "sk-session-only"
      },
      settingsValidation: { valid: true, errors: [] },
      redactionStatus: "clean",
      createdAt: "2026-06-30T00:00:00.000Z"
    });

    expect(receipt).toEqual({
      receiptVersion: "lexproof-model-connect-receipt-v1",
      provider: "openai-compatible",
      providerLabel: "OpenAI-compatible session model",
      model: "gpt-audit-review",
      endpointHost: "models.example.test",
      status: "ready",
      mode: "session-openai-compatible",
      blockers: [],
      createdAt: "2026-06-30T00:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only."
    });
    expect(JSON.stringify(receipt)).not.toContain("sk-session-only");
  });

  it("blocks model connect when settings or redaction gate are not ready", () => {
    const receipt = createModelConnectReceipt({
      settings: {
        provider: "openai-compatible",
        model: "",
        baseUrl: "",
        apiKey: ""
      },
      settingsValidation: {
        valid: false,
        errors: ["Base URL is required for OpenAI-compatible providers.", "Model name is required."]
      },
      redactionStatus: "blocked",
      createdAt: "2026-06-30T00:00:00.000Z"
    });

    expect(receipt.status).toBe("blocked");
    expect(receipt.blockers).toEqual([
      "Base URL is required for OpenAI-compatible providers.",
      "Model name is required.",
      "Redaction Gate blocked this model connection."
    ]);
  });
});
