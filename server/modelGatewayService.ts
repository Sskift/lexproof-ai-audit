import { createHash } from "node:crypto";
import { validateModelGatewayBoundary, type ModelGatewayBoundaryInput } from "../src/lib/phase2ApiContracts.js";
import type { ModelGatewayRun } from "../src/lib/phase2Types.js";

export type CreateModelGatewayRunInput = ModelGatewayBoundaryInput & {
  workspaceId: string;
  payload: unknown;
  createdAt?: string;
};

export type ModelGatewayRunResult =
  | {
      valid: true;
      run: ModelGatewayRun;
    }
  | {
      valid: false;
      errors: string[];
    };

export function createModelGatewayRun(input: CreateModelGatewayRunInput): ModelGatewayRunResult {
  const validation = validateModelGatewayBoundary(input);

  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const payloadHash = sha256Hex(stableStringify(input.payload));
  const responsePayload = createMockResponsePayload(input);
  const responseHash = sha256Hex(stableStringify(responsePayload));
  const idHash = sha256Hex(stableStringify({ workspaceId: input.workspaceId, payloadHash, responseHash, createdAt }));

  return {
    valid: true,
    run: {
      recordVersion: "lexproof-model-gateway-run-v1",
      id: `model-gateway-run-${idHash.slice(0, 16)}`,
      workspaceId: input.workspaceId,
      provider: input.provider,
      providerLabel: providerLabel(input.provider),
      model: input.model.trim(),
      purpose: input.purpose.trim(),
      status: "completed",
      redactionStatus: input.redactionStatus,
      payloadHash,
      responseHash,
      humanReviewStatus: "needs-review",
      createdAt,
      completedAt: createdAt,
      notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
    }
  };
}

function createMockResponsePayload(input: CreateModelGatewayRunInput) {
  return {
    provider: input.provider,
    model: input.model.trim(),
    status: "completed",
    message: "Mock model gateway receipt created for audit preparation and human review.",
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

function providerLabel(provider: CreateModelGatewayRunInput["provider"]): string {
  if (provider === "mock") {
    return "Mock local reviewer gateway";
  }

  if (provider === "enterprise-proxy") {
    return "Enterprise model proxy gateway";
  }

  return "OpenAI-compatible gateway";
}

function sha256Hex(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
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
