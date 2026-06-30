import { describe, expect, it } from "vitest";
import { createModelConnectReceipt, exportModelConnectReceiptJson } from "./modelConnect";
import { validateModelSettings } from "./modelProvider";

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

  it("exports a metadata-only Model Connect receipt JSON without session credentials", () => {
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

    const json = exportModelConnectReceiptJson(receipt);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(receipt);
    expect(parsed.notLegalAdviceBoundary).toBe("Not legal advice. Model Connect validates audit-prep routing only.");
    expect(json).toContain("\"receiptVersion\": \"lexproof-model-connect-receipt-v1\"");
    expect(json).not.toContain("sk-session-only");
    expect(json).not.toContain("apiKey");
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

  it("carries sanitized unsafe model metadata blockers without exposing pasted secrets", () => {
    const apiKeyInUrl = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const settings = {
      provider: "openai-compatible" as const,
      model: `raw KYC routing ${privateKey}`,
      baseUrl: `https://models.example.test/v1?api_key=${apiKeyInUrl}`,
      apiKey: "sk-session-only"
    };
    const receipt = createModelConnectReceipt({
      settings,
      settingsValidation: validateModelSettings(settings),
      redactionStatus: "clean",
      createdAt: "2026-06-30T00:00:00.000Z"
    });

    expect(receipt.status).toBe("blocked");
    expect(receipt.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("credential-material"),
        expect.stringContaining("private-key-material"),
        expect.stringContaining("raw-kyc")
      ])
    );
    expect(JSON.stringify(receipt)).not.toContain(apiKeyInUrl);
    expect(JSON.stringify(receipt)).not.toContain(privateKey);
    expect(JSON.stringify(receipt)).not.toContain("sk-session-only");
  });
});
