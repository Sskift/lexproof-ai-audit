import type { AIReviewPayload } from "./aiReview";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import { classifyDataBoundaryText, type ClassifiedDataClass } from "./dataClassification";

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

const DEFAULT_MODEL_PROVIDER_ERROR_BOUNDARY =
  "Not legal advice. Model provider errors are audit preparation workflow metadata only.";

export class ModelProviderClientError extends Error {
  code: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;

  constructor(message: string, options?: Partial<Pick<ModelProviderClientError, "code" | "recoveryAction" | "notLegalAdviceBoundary">>) {
    super(message);
    this.name = "ModelProviderClientError";
    this.code = options?.code ?? "MODEL_PROVIDER_CLIENT_ERROR";
    this.recoveryAction =
      options?.recoveryAction ??
      "Check the provider Base URL, model name, and session-only API key, then retry after Redaction Gate passes.";
    this.notLegalAdviceBoundary = options?.notLegalAdviceBoundary ?? DEFAULT_MODEL_PROVIDER_ERROR_BOUNDARY;
  }
}

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

  errors.push(...createModelMetadataBoundaryErrors(settings));

  return {
    valid: errors.length === 0,
    errors
  };
}

const modelMetadataBlockedClasses: ClassifiedDataClass[] = [
  "credential-material",
  "private-key-material",
  "raw-kyc"
];

function createModelMetadataBoundaryErrors(settings: ModelSettings): string[] {
  const metadataText = [settings.model, settings.baseUrl ?? ""].join(" ");
  const blockedClasses = new Set(
    classifyDataBoundaryText(metadataText)
      .map((finding) => finding.dataClass)
      .filter((dataClass) => modelMetadataBlockedClasses.includes(dataClass))
  );

  return modelMetadataBlockedClasses
    .filter((dataClass) => blockedClasses.has(dataClass))
    .map(
      (dataClass) =>
        `Model settings metadata contains ${dataClass}. Remove credentials, private keys, or raw KYC from model name and endpoint metadata before validating Model Connect.`
    );
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
      let response: Response;
      try {
        response = await fetcher(request.url, request.init);
      } catch {
        throw new ModelProviderClientError("Model provider request could not reach the configured endpoint.", {
          code: "MODEL_PROVIDER_NETWORK_ERROR",
          recoveryAction:
            "Check the provider Base URL, CORS policy, model endpoint availability, and session-only API key before retrying.",
          notLegalAdviceBoundary: DEFAULT_MODEL_PROVIDER_ERROR_BOUNDARY
        });
      }

      if (!response.ok) {
        const errorPayload = asSafeApiErrorResponse(await readModelProviderErrorPayload(response));
        throw new ModelProviderClientError(errorPayload.error ?? `Model request failed with status ${response.status}.`, {
          code: errorPayload.code ?? "MODEL_PROVIDER_REQUEST_FAILED",
          recoveryAction:
            errorPayload.recoveryAction ??
            "Check the provider Base URL, model name, and session-only API key, then retry after Redaction Gate passes.",
          notLegalAdviceBoundary: errorPayload.notLegalAdviceBoundary ?? DEFAULT_MODEL_PROVIDER_ERROR_BOUNDARY
        });
      }

      const data = await readOpenAICompatibleSuccessPayload(response);
      const content = extractOpenAICompatibleMessageContent(data);
      assertAuditPrepJsonContent(content);
      return {
        providerLabel: settings.model,
        content
      };
    }
  };
}

async function readModelProviderErrorPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

async function readOpenAICompatibleSuccessPayload(response: Response): Promise<Record<string, unknown>> {
  try {
    const payload = (await response.json()) as unknown;
    if (isRecord(payload)) {
      return payload;
    }
  } catch {
    // Fall through to the typed client error below so raw parser messages are never exposed.
  }

  throw new ModelProviderClientError("Model provider response was not valid OpenAI-compatible JSON.", {
    code: "MODEL_PROVIDER_INVALID_RESPONSE",
    recoveryAction:
      "Confirm the provider returns an OpenAI-compatible chat completions JSON body with choices[0].message.content.",
    notLegalAdviceBoundary: DEFAULT_MODEL_PROVIDER_ERROR_BOUNDARY
  });
}

function extractOpenAICompatibleMessageContent(payload: Record<string, unknown>): string {
  const choices = payload.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : undefined;
  const message = isRecord(firstChoice) ? firstChoice.message : undefined;
  const content = isRecord(message) ? message.content : undefined;

  if (typeof content === "string" && content.trim()) {
    return content;
  }

  throw new ModelProviderClientError("Model provider response was missing audit-prep content.", {
    code: "MODEL_PROVIDER_INVALID_RESPONSE",
    recoveryAction:
      "Confirm the provider returns choices[0].message.content as a JSON object string with extractedFacts, missingEvidence, draftQuestions, and suggestedRemediation arrays.",
    notLegalAdviceBoundary: DEFAULT_MODEL_PROVIDER_ERROR_BOUNDARY
  });
}

function assertAuditPrepJsonContent(content: string): void {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (isRecord(parsed)) {
      return;
    }
  } catch {
    // Fall through to the typed client error below so unsafe model text is never echoed.
  }

  throw new ModelProviderClientError("Model provider response content was not valid audit-prep JSON.", {
    code: "MODEL_PROVIDER_INVALID_OUTPUT",
    recoveryAction:
      "Return JSON only with extractedFacts, missingEvidence, draftQuestions, and suggestedRemediation arrays; do not return legal conclusions.",
    notLegalAdviceBoundary: DEFAULT_MODEL_PROVIDER_ERROR_BOUNDARY
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
