import { describe, expect, it } from "vitest";
import {
  buildOpenAICompatibleRequest,
  createMockModelProvider,
  createOpenAICompatibleModelProvider,
  DEFAULT_MODEL_SETTINGS,
  ModelProviderClientError,
  parseStoredModelSettings,
  sanitizeModelSettingsForStorage,
  validateModelSettings
} from "./modelProvider";
import type { AIReviewPayload } from "./aiReview";

const payload: AIReviewPayload = {
  boundary: "Not legal advice. AI-assisted draft for audit preparation only.",
  instructions: "Return JSON only.",
  project: {
    projectName: "Protocol Review",
    jurisdictions: ["United States"],
    assetModel: "Tokenized governance workflow",
    custodyModel: "No custody",
    dataSensitivity: "Public metadata only",
    aiUsage: "AI summarizes sources",
    blockchainUse: "Simulated hash anchor",
    operatingStage: "Private beta"
  },
  riskFlags: [{ id: "ai-workflow", title: "AI workflow", severity: "watch", rationale: "Needs review." }],
  evidenceSummaries: [{ label: "Policy", kind: "Markdown", status: "received", owner: "Counsel", contentPreview: "Human review policy" }],
  missingEvidenceChecklist: []
};

describe("parseStoredModelSettings", () => {
  it("restores non-secret provider metadata without restoring stored API keys", () => {
    const settings = parseStoredModelSettings(
      JSON.stringify({
        provider: "openai-compatible",
        model: "audit-prep-model",
        baseUrl: "https://models.example.com/v1",
        apiKey: "sk-live-abcdefghijklmnopqrstuvwxyz123456"
      })
    );

    expect(settings).toEqual({
      provider: "openai-compatible",
      model: "audit-prep-model",
      baseUrl: "https://models.example.com/v1"
    });
    expect(settings).not.toHaveProperty("apiKey");
  });

  it("falls back when stored settings are malformed or use an unsupported provider", () => {
    expect(parseStoredModelSettings("{not-json")).toEqual(DEFAULT_MODEL_SETTINGS);
    expect(parseStoredModelSettings(JSON.stringify({ provider: "enterprise-proxy", model: "managed-model" }))).toEqual(
      DEFAULT_MODEL_SETTINGS
    );
    expect(parseStoredModelSettings(JSON.stringify({ provider: "mock", model: 42 }))).toEqual(DEFAULT_MODEL_SETTINGS);
  });

  it("does not restore model metadata that contains credentials, private keys, or raw KYC references", () => {
    const apiKey = "sk-live-abcdefghijklmnopqrstuvwxyz123456";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const settings = parseStoredModelSettings(
      JSON.stringify({
        provider: "openai-compatible",
        model: `raw KYC routing ${privateKey}`,
        baseUrl: `https://models.example.com/v1?api_key=${apiKey}`,
        apiKey: "sk-session-only"
      })
    );

    expect(settings).toEqual(DEFAULT_MODEL_SETTINGS);
    expect(JSON.stringify(settings)).not.toContain(apiKey);
    expect(JSON.stringify(settings)).not.toContain(privateKey);
    expect(JSON.stringify(settings)).not.toMatch(/raw KYC/i);
  });
});

describe("sanitizeModelSettingsForStorage", () => {
  it("serializes only metadata fields and leaves session-only API keys out of localStorage payloads", () => {
    const stored = sanitizeModelSettingsForStorage({
      provider: "openai-compatible",
      model: "audit-prep-model",
      baseUrl: "https://models.example.com/v1",
      apiKey: "sk-live-abcdefghijklmnopqrstuvwxyz123456"
    });

    expect(stored).toEqual({
      provider: "openai-compatible",
      model: "audit-prep-model",
      baseUrl: "https://models.example.com/v1"
    });
    expect(stored).not.toHaveProperty("apiKey");
  });

  it("falls back to mock metadata instead of persisting unsafe provider settings", () => {
    const apiKey = "sk-live-abcdefghijklmnopqrstuvwxyz123456";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const stored = sanitizeModelSettingsForStorage({
      provider: "openai-compatible",
      model: `Counsel review model with raw KYC packet ${privateKey}`,
      baseUrl: `https://models.example.com/v1?api_key=${apiKey}`,
      apiKey: "sk-session-only"
    });

    expect(stored).toEqual(DEFAULT_MODEL_SETTINGS);
    expect(JSON.stringify(stored)).not.toContain(apiKey);
    expect(JSON.stringify(stored)).not.toContain(privateKey);
    expect(JSON.stringify(stored)).not.toMatch(/raw KYC|session-only/i);
  });
});

describe("validateModelSettings", () => {
  it("accepts mock settings without an API key", () => {
    expect(validateModelSettings({ provider: "mock", model: "lexproof-mock" })).toEqual({ valid: true, errors: [] });
  });

  it("requires endpoint, model, and API key for OpenAI-compatible settings", () => {
    expect(validateModelSettings({ provider: "openai-compatible", model: "", baseUrl: "" })).toEqual({
      valid: false,
      errors: ["Base URL is required for OpenAI-compatible providers.", "Model name is required.", "API key is required for live model calls."]
    });
  });

  it("blocks unsafe model metadata without treating the session-only API key field as leaked metadata", () => {
    const apiKeyInUrl = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const validation = validateModelSettings({
      provider: "openai-compatible",
      model: `raw KYC routing ${privateKey}`,
      baseUrl: `https://models.example.com/v1?api_key=${apiKeyInUrl}`,
      apiKey: "sk-session-only"
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual([
      "Model settings metadata contains credential-material. Remove credentials, private keys, or raw KYC from model name and endpoint metadata before validating Model Connect.",
      "Model settings metadata contains private-key-material. Remove credentials, private keys, or raw KYC from model name and endpoint metadata before validating Model Connect.",
      "Model settings metadata contains raw-kyc. Remove credentials, private keys, or raw KYC from model name and endpoint metadata before validating Model Connect."
    ]);
    expect(JSON.stringify(validation)).not.toContain(apiKeyInUrl);
    expect(JSON.stringify(validation)).not.toContain(privateKey);
    expect(JSON.stringify(validation)).not.toContain("sk-session-only");
  });
});

describe("buildOpenAICompatibleRequest", () => {
  it("builds a chat completions request without storing credentials in the payload", () => {
    const request = buildOpenAICompatibleRequest(
      {
        provider: "openai-compatible",
        baseUrl: "https://models.example.com/v1",
        model: "legal-review-model",
        apiKey: "sk-test"
      },
      payload
    );

    expect(request.url).toBe("https://models.example.com/v1/chat/completions");
    expect(request.init.method).toBe("POST");
    expect(request.init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer sk-test"
    });
    expect(JSON.stringify(request.init.body)).not.toContain("sk-test");
    expect(JSON.parse(request.init.body as string)).toMatchObject({
      model: "legal-review-model",
      response_format: { type: "json_object" }
    });
  });
});

describe("createOpenAICompatibleModelProvider", () => {
  it("turns malformed provider success bodies into a safe recoverable client error", async () => {
    const fetcher = async () =>
      new Response("not-json with sk-live-abcdefghijklmnopqrstuvwxyz123456 and final legal decision", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    let thrown: unknown;
    try {
      await createOpenAICompatibleModelProvider(
        {
          provider: "openai-compatible",
          baseUrl: "https://models.example.com/v1",
          model: "legal-review-model",
          apiKey: "sk-session-only"
        },
        fetcher as typeof fetch
      ).completeReview(payload);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ModelProviderClientError);
    const error = thrown as ModelProviderClientError;
    expect(error).toMatchObject({
      name: "ModelProviderClientError",
      code: "MODEL_PROVIDER_INVALID_RESPONSE",
      message: "Model provider response was not valid OpenAI-compatible JSON.",
      notLegalAdviceBoundary: "Not legal advice. Model provider errors are audit preparation workflow metadata only."
    });
    expect(error.recoveryAction).toContain("choices[0].message.content");
    expect(JSON.stringify(error)).not.toMatch(/sk-live|final legal decision/i);
  });

  it("rejects non-JSON model content instead of recording an empty successful AI review", async () => {
    const apiKey = "sk-live-abcdefghijklmnopqrstuvwxyz123456";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const fetcher = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `final legal decision: legally compliant. api_key=${apiKey}. private key ${privateKey}.`
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    let thrown: unknown;
    try {
      await createOpenAICompatibleModelProvider(
        {
          provider: "openai-compatible",
          baseUrl: "https://models.example.com/v1",
          model: "legal-review-model",
          apiKey: "sk-session-only"
        },
        fetcher as typeof fetch
      ).completeReview(payload);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ModelProviderClientError);
    const error = thrown as ModelProviderClientError;
    expect(error).toMatchObject({
      name: "ModelProviderClientError",
      code: "MODEL_PROVIDER_INVALID_OUTPUT",
      message: "Model provider response content was not valid audit-prep JSON.",
      notLegalAdviceBoundary: "Not legal advice. Model provider errors are audit preparation workflow metadata only."
    });
    expect(error.recoveryAction).toContain("Return JSON only");
    const serialized = JSON.stringify({
      message: error.message,
      code: error.code,
      recoveryAction: error.recoveryAction,
      notLegalAdviceBoundary: error.notLegalAdviceBoundary
    });
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/legally compliant|final legal decision/i);
  });

  it("turns provider network failures into a safe recoverable client error", async () => {
    const apiKey = "sk-live-abcdefghijklmnopqrstuvwxyz123456";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const fetcher = async () => {
      throw new Error(`Failed to fetch with api_key=${apiKey}, private key ${privateKey}, and legal opinion request.`);
    };

    let thrown: unknown;
    try {
      await createOpenAICompatibleModelProvider(
        {
          provider: "openai-compatible",
          baseUrl: "https://offline-model.example.com/v1",
          model: "legal-review-model",
          apiKey: "sk-session-only"
        },
        fetcher as typeof fetch
      ).completeReview(payload);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ModelProviderClientError);
    const error = thrown as ModelProviderClientError;
    expect(error).toMatchObject({
      name: "ModelProviderClientError",
      code: "MODEL_PROVIDER_NETWORK_ERROR",
      message: "Model provider request could not reach the configured endpoint.",
      notLegalAdviceBoundary: "Not legal advice. Model provider errors are audit preparation workflow metadata only."
    });
    expect(error.recoveryAction).toContain("Check the provider Base URL");
    const serialized = JSON.stringify(error);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/legal opinion/i);
  });

  it("surfaces safe provider request failures without leaking secrets, raw KYC, or legal conclusions", async () => {
    const apiKey = "sk-live-abcdefghijklmnopqrstuvwxyz123456";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const fetcher = async () =>
      new Response(
        JSON.stringify({
          error: `Provider rejected api_key=${apiKey} after raw KYC passport data and private key ${privateKey}; final legal decision required.`,
          code: "MODEL_PROVIDER_REJECTED",
          recoveryAction: `Remove passport data, rotate private key ${privateKey}, and retry without legal opinion reliance.`,
          notLegalAdviceBoundary: "Not legal advice. Model provider errors are audit preparation workflow metadata only."
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );

    let thrown: unknown;
    try {
      await createOpenAICompatibleModelProvider(
        {
          provider: "openai-compatible",
          baseUrl: "https://models.example.com/v1",
          model: "legal-review-model",
          apiKey: "sk-session-only"
        },
        fetcher as typeof fetch
      ).completeReview(payload);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ModelProviderClientError);
    const error = thrown as ModelProviderClientError;
    expect(error).toMatchObject({
      name: "ModelProviderClientError",
      code: "MODEL_PROVIDER_REJECTED",
      notLegalAdviceBoundary: "Not legal advice. Model provider errors are audit preparation workflow metadata only."
    });
    expect(error.recoveryAction).toContain("retry");
    const serialized = JSON.stringify({
      message: error.message,
      code: error.code,
      recoveryAction: error.recoveryAction,
      notLegalAdviceBoundary: error.notLegalAdviceBoundary
    });
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/raw KYC|passport data|legal opinion|final legal decision/i);
  });
});

describe("createMockModelProvider", () => {
  it("returns a deterministic JSON review for demos and tests", async () => {
    const response = await createMockModelProvider().completeReview(payload);
    const parsed = JSON.parse(response.content);

    expect(response.providerLabel).toBe("Mock local reviewer");
    expect(parsed.extractedFacts).toContain("Tokenized governance workflow");
    expect(parsed.draftQuestions.length).toBeGreaterThan(0);
  });
});
