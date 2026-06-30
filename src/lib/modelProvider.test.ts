import { describe, expect, it } from "vitest";
import { buildOpenAICompatibleRequest, createMockModelProvider, validateModelSettings } from "./modelProvider";
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

describe("createMockModelProvider", () => {
  it("returns a deterministic JSON review for demos and tests", async () => {
    const response = await createMockModelProvider().completeReview(payload);
    const parsed = JSON.parse(response.content);

    expect(response.providerLabel).toBe("Mock local reviewer");
    expect(parsed.extractedFacts).toContain("Tokenized governance workflow");
    expect(parsed.draftQuestions.length).toBeGreaterThan(0);
  });
});
