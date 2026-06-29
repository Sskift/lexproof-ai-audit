import type { AIReviewPayload } from "./aiReview";

export type ModelProviderKind = "mock" | "openai-compatible";

export type ModelSettings = {
  provider: ModelProviderKind;
  model: string;
  baseUrl?: string;
  apiKey?: string;
};

export type ModelSettingsValidation = {
  valid: boolean;
  errors: string[];
};

export type ModelProviderResponse = {
  providerLabel: string;
  content: string;
};

export type ModelProvider = {
  providerLabel: string;
  completeReview: (payload: AIReviewPayload) => Promise<ModelProviderResponse>;
};

export function validateModelSettings(settings: ModelSettings): ModelSettingsValidation {
  const errors: string[] = [];

  if (settings.provider === "openai-compatible" && !settings.baseUrl?.trim()) {
    errors.push("Base URL is required for OpenAI-compatible providers.");
  }

  if (!settings.model.trim()) {
    errors.push("Model name is required.");
  }

  if (settings.provider === "openai-compatible" && !settings.apiKey?.trim()) {
    errors.push("API key is required for live model calls.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function buildOpenAICompatibleRequest(settings: ModelSettings, payload: AIReviewPayload) {
  const baseUrl = settings.baseUrl?.replace(/\/+$/, "") ?? "";

  return {
    url: `${baseUrl}/chat/completions`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey ?? ""}`
      },
      body: JSON.stringify({
        model: settings.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an audit preparation assistant. Return JSON only. Do not provide legal advice, legal conclusions, or final determinations."
          },
          {
            role: "user",
            content: JSON.stringify(payload)
          }
        ]
      })
    } satisfies RequestInit
  };
}

export function createMockModelProvider(): ModelProvider {
  return {
    providerLabel: "Mock local reviewer",
    async completeReview(payload) {
      const firstFlag = payload.riskFlags[0];
      return {
        providerLabel: "Mock local reviewer",
        content: JSON.stringify({
          extractedFacts: [
            payload.project.assetModel,
            payload.project.custodyModel,
            `${payload.project.operatingStage} across ${payload.project.jurisdictions.join(", ")}`
          ].filter(Boolean),
          missingEvidence: payload.missingEvidenceChecklist
            .filter((item) => item.status === "missing")
            .slice(0, 5)
            .map((item) => item.title),
          draftQuestions: [
            firstFlag ? `What evidence supports the ${firstFlag.title} assumption?` : "Which facts still need counsel review?",
            "Which artifacts can be shared with counsel without exposing raw KYC or personal data?"
          ],
          suggestedRemediation: [
            "Attach missing policy evidence before external launch claims.",
            "Route AI-assisted observations to counsel or compliance for human review."
          ]
        })
      };
    }
  };
}

export function createOpenAICompatibleModelProvider(settings: ModelSettings, fetcher = globalThis.fetch): ModelProvider {
  return {
    providerLabel: settings.model || "OpenAI-compatible model",
    async completeReview(payload) {
      const request = buildOpenAICompatibleRequest(settings, payload);
      const response = await fetcher(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Model request failed with status ${response.status}.`);
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return {
        providerLabel: settings.model,
        content: data.choices?.[0]?.message?.content ?? "{}"
      };
    }
  };
}
