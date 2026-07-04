import { describe, expect, it } from "vitest";
import {
  createModelGatewayRunReceipt,
  exportModelGatewayRunReceiptJson,
  type ModelGatewayRunReceipt
} from "./modelGatewayRunReceipt";
import type { ModelGatewayRun, ModelGatewayRunSummary } from "./phase2Types";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";

describe("model gateway run receipt", () => {
  it("creates a metadata-only receipt with a stable receipt hash", async () => {
    const first = await createModelGatewayRunReceipt(createRun(), { exportedAt: "2026-07-04T00:00:00.000Z" });
    const second = await createModelGatewayRunReceipt(createRun(), { exportedAt: "2026-07-04T00:01:00.000Z" });

    expect(first).toMatchObject({
      receiptVersion: "lexproof-model-gateway-run-receipt-v1",
      runId: "model-gateway-run-receipt",
      workspaceId: "workspace-receipt",
      status: "completed",
      humanReviewStatus: "needs-review",
      requiresHumanReview: true,
      retryState: "not-needed",
      providerPolicy: {
        provider: "mock",
        adapterMode: "local-mock",
        credentialPolicy: "no credentials accepted",
        secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
        allowedDataClasses: ["audit-prep metadata", "evidence hashes"]
      },
      hashes: {
        payloadHash: "c".repeat(64),
        responseHash: "d".repeat(64),
        sourceEvidenceHash: "e".repeat(64)
      },
      recoveryAction: "Complete Human Review before relying on this AI-assisted draft."
    } satisfies Partial<ModelGatewayRunReceipt>);
    expect(first.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(first.receiptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.receiptHash).toBe(second.receiptHash);
    expect(first.exportedAt).not.toBe(second.exportedAt);
  });

  it("changes the receipt hash when run hashes change", async () => {
    const first = await createModelGatewayRunReceipt(createRun({ responseHash: "d".repeat(64) }));
    const second = await createModelGatewayRunReceipt(createRun({ responseHash: "f".repeat(64) }));

    expect(first.receiptHash).not.toBe(second.receiptHash);
  });

  it("creates a downloadable receipt from persisted run summaries", async () => {
    const receipt = await createModelGatewayRunReceipt(createRunSummary(), {
      workspaceId: "workspace-summary",
      exportedAt: "2026-07-04T00:00:00.000Z"
    });
    const json = exportModelGatewayRunReceiptJson(receipt);

    expect(receipt.workspaceId).toBe("workspace-summary");
    expect(receipt.providerPolicy.provider).toBe("not-in-summary");
    expect(receipt.providerPolicy.allowedDataClasses).toEqual(["metadata-only model-run summary"]);
    expect(receipt.purpose).toBe("Persisted Model Gateway run summary for audit preparation and human review.");
    expect(json).toContain("lexproof-model-gateway-run-receipt-v1");
    expect(json).toContain("Not legal advice");
  });

  it("redacts unsafe failure text before export", async () => {
    const receipt = await createModelGatewayRunReceipt(
      createRun({
        status: "blocked",
        retryState: "blocked-until-remediated",
        errorCode: "MODEL_GATEWAY_POLICY_BLOCKED",
        errorMessage: `Request included ${apiKey} and private key ${privateKey}.`,
        remediationSteps: [`Remove ${apiKey} and private key ${privateKey} before retry.`],
        responseHash: ""
      })
    );
    const json = exportModelGatewayRunReceiptJson(receipt);

    expect(receipt.recoveryAction).toContain("Resolve Model Gateway remediation steps");
    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });
});

function createRun(overrides: Partial<ModelGatewayRun> = {}): ModelGatewayRun {
  return {
    recordVersion: "lexproof-model-gateway-run-v1",
    id: "model-gateway-run-receipt",
    workspaceId: "workspace-receipt",
    provider: "mock",
    providerLabel: "Mock local reviewer gateway",
    model: "lexproof-mock",
    purpose: "Create server-side model gateway receipt for audit preparation and human review.",
    status: "completed",
    redactionStatus: "clean",
    payloadHash: "c".repeat(64),
    responseHash: "d".repeat(64),
    sourceEvidenceHash: "e".repeat(64),
    providerMetadata: {
      adapterMode: "local-mock",
      credentialPolicy: "no credentials accepted",
      secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
      allowedDataClasses: ["audit-prep metadata", "evidence hashes"]
    },
    humanReviewStatus: "needs-review",
    attempt: 1,
    maxAttempts: 1,
    retryState: "not-needed",
    remediationSteps: [],
    createdAt: "2026-07-04T00:00:00.000Z",
    completedAt: "2026-07-04T00:00:01.000Z",
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice.",
    ...overrides
  };
}

function createRunSummary(overrides: Partial<ModelGatewayRunSummary> = {}): ModelGatewayRunSummary {
  return {
    id: "model-gateway-run-summary",
    providerLabel: "Mock local reviewer gateway",
    model: "lexproof-mock",
    status: "completed",
    redactionStatus: "clean",
    humanReviewStatus: "reviewed",
    payloadHash: "c".repeat(64),
    responseHash: "d".repeat(64),
    sourceEvidenceHash: "e".repeat(64),
    retryState: "not-needed",
    remediationSteps: [],
    requiresHumanReview: false,
    boundary: "AI-assisted draft for audit preparation only. Not legal advice.",
    ...overrides
  };
}
