import { createHash } from "node:crypto";
import { validateModelGatewayBoundary, type ModelGatewayBoundaryInput } from "../src/lib/phase2ApiContracts.js";
import type { ModelGatewayProviderMetadata, ModelGatewayRun } from "../src/lib/phase2Types.js";
import {
  createModelGatewayProviderPolicyReport,
  defaultModelGatewayProviderAdapters,
  type ModelGatewayProviderPolicyReport,
  type ModelGatewayProviderPolicyAdapter
} from "../src/lib/modelGatewayProviderPolicy.js";

export type ModelGatewayAdapterDescriptor = ModelGatewayProviderPolicyAdapter;

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
      failureRun: ModelGatewayRun;
    };

const modelGatewayAdapters: ModelGatewayAdapterDescriptor[] = defaultModelGatewayProviderAdapters;

export function listModelGatewayAdapters(): ModelGatewayAdapterDescriptor[] {
  return modelGatewayAdapters.map((adapter) => ({ ...adapter }));
}

export function createServerModelGatewayProviderPolicyReport(createdAt?: string): ModelGatewayProviderPolicyReport {
  return createModelGatewayProviderPolicyReport({
    adapters: listModelGatewayAdapters(),
    modelConnectReceipt: null,
    generatedAt: createdAt
  });
}

export function createModelGatewayRun(input: CreateModelGatewayRunInput): ModelGatewayRunResult {
  const validation = validateModelGatewayBoundary(input);
  const adapter = modelGatewayAdapters.find((item) => item.provider === input.provider);

  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      failureRun: createFailureRun(input, {
        adapter,
        status: "blocked",
        errorCode: "MODEL_GATEWAY_POLICY_BLOCKED",
        retryState: "blocked-until-remediated",
        errors: validation.errors,
        remediationSteps: createBoundaryRemediationSteps(validation.errors)
      })
    };
  }

  if (!adapter?.enabled) {
    const errors = ["Only the mock Model Gateway adapter is enabled in Phase 2A. External provider proxying is deferred."];
    return {
      valid: false,
      errors,
      failureRun: createFailureRun(input, {
        adapter,
        status: "failed",
        errorCode: "MODEL_GATEWAY_ADAPTER_DISABLED",
        retryState: "blocked-until-policy-change",
        errors,
        remediationSteps: [
          "Use the mock local reviewer for this demo workspace.",
          "Approve server-side secret handling policy before enabling external provider proxying."
        ]
      })
    };
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const payloadHash = sha256Hex(stableStringify(input.payload));
  const sourceEvidenceHash = createSourceEvidenceHash(input.payload);
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
      providerLabel: adapter.label,
      model: input.model.trim(),
      purpose: input.purpose.trim(),
      status: "completed",
      redactionStatus: input.redactionStatus,
      payloadHash,
      responseHash,
      sourceEvidenceHash,
      providerMetadata: createProviderMetadata(adapter, input.allowedDataClasses),
      humanReviewStatus: "needs-review",
      attempt: 1,
      maxAttempts: 1,
      retryState: "not-needed",
      remediationSteps: [],
      createdAt,
      completedAt: createdAt,
      notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
    }
  };
}

function createFailureRun(
  input: CreateModelGatewayRunInput,
  options: {
    adapter: ModelGatewayAdapterDescriptor | undefined;
    status: "blocked" | "failed";
    errorCode: string;
    retryState: ModelGatewayRun["retryState"];
    errors: string[];
    remediationSteps: string[];
  }
): ModelGatewayRun {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const payloadHash = sha256Hex(stableStringify(input.payload));
  const sourceEvidenceHash = createSourceEvidenceHash(input.payload);
  const errorMessage = options.errors.join(" ");
  const idHash = sha256Hex(
    stableStringify({
      workspaceId: input.workspaceId,
      provider: input.provider,
      payloadHash,
      errorCode: options.errorCode,
      createdAt
    })
  );

  return {
    recordVersion: "lexproof-model-gateway-run-v1",
    id: `model-gateway-run-${idHash.slice(0, 16)}`,
    workspaceId: input.workspaceId,
    provider: input.provider,
    providerLabel: options.adapter?.label ?? input.provider,
    model: input.model.trim(),
    purpose: input.purpose.trim(),
    status: options.status,
    redactionStatus: input.redactionStatus,
    payloadHash,
    responseHash: "",
    sourceEvidenceHash,
    providerMetadata: createProviderMetadata(options.adapter, input.allowedDataClasses),
    humanReviewStatus: "needs-review",
    attempt: 1,
    maxAttempts: options.retryState === "blocked-until-remediated" ? 3 : 1,
    retryState: options.retryState,
    errorCode: options.errorCode,
    errorMessage,
    remediationSteps: [...options.remediationSteps],
    createdAt,
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

function createProviderMetadata(adapter: ModelGatewayAdapterDescriptor | undefined, allowedDataClasses: string[] = []): ModelGatewayProviderMetadata {
  return {
    adapterMode: adapter?.mode ?? "external-provider-placeholder",
    credentialPolicy: adapter?.credentialPolicy ?? "deferred until server-side secret policy is approved",
    secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
    allowedDataClasses: allowedDataClasses.map((item) => item.trim()).filter(Boolean)
  };
}

function createBoundaryRemediationSteps(errors: string[]): string[] {
  const steps: string[] = [];

  if (errors.some((error) => error.includes("Redaction Gate"))) {
    steps.push("Pass the Redaction Gate before creating a server Model Gateway run.");
  }

  if (errors.some((error) => error.includes("API keys") || error.includes("Raw KYC"))) {
    steps.push("Remove API keys, private keys, credentials, raw KYC, and personal data from the request metadata.");
  }

  if (errors.some((error) => error.includes("final legal decisions"))) {
    steps.push("Change the model purpose to draft audit preparation, not legal conclusion or launch approval.");
  }

  if (errors.some((error) => error.includes("Human review owner"))) {
    steps.push("Assign a human review owner before external reliance on model output.");
  }

  if (errors.some((error) => error.includes("Allowed data classes"))) {
    steps.push("Limit Model Gateway input to audit-prep metadata, evidence hashes, risk flag summaries, regulatory source references, or model receipts.");
  }

  return steps.length > 0 ? steps : ["Review Model Gateway boundary errors and retry after remediation."];
}

function createSourceEvidenceHash(payload: unknown): string {
  return sha256Hex(stableStringify(extractEvidenceHashMaterial(payload)));
}

function extractEvidenceHashMaterial(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") {
    return { evidence: "none" };
  }

  const maybePayload = payload as { evidenceVault?: unknown; evidenceItems?: unknown };

  return maybePayload.evidenceVault ?? maybePayload.evidenceItems ?? { evidence: "none" };
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
