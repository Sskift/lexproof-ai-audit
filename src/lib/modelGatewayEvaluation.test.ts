import { describe, expect, it } from "vitest";
import {
  createModelGatewayEvaluationRecord,
  exportModelGatewayEvaluationJson,
  type ModelGatewayEvaluationRecord
} from "./modelGatewayEvaluation";
import type { ModelGatewayRun } from "./phase2Types";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";

describe("createModelGatewayEvaluationRecord", () => {
  it("creates a metadata-only evaluation artifact for completed runs", () => {
    const evaluation = createModelGatewayEvaluationRecord(createRun());

    expect(evaluation).toMatchObject({
      evaluationVersion: "lexproof-model-gateway-evaluation-v1",
      runId: "model-gateway-run-eval",
      workspaceId: "workspace-eval",
      status: "completed",
      providerLabel: "Mock local reviewer gateway",
      model: "lexproof-mock",
      adapterMode: "local-mock",
      humanReviewStatus: "needs-review",
      requiresHumanReview: true,
      retryState: "not-needed",
      hashes: {
        payloadHash: "c".repeat(64),
        responseHash: "d".repeat(64),
        sourceEvidenceHash: "e".repeat(64)
      },
      reviewerAction: "send-to-human-review"
    } satisfies Partial<ModelGatewayEvaluationRecord>);
    expect(evaluation.allowedDataClasses).toEqual(["audit-prep metadata", "evidence hashes"]);
    expect(evaluation.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("redacts unsafe failure text before JSON export", () => {
    const evaluation = createModelGatewayEvaluationRecord(
      createRun({
        status: "blocked",
        retryState: "blocked-until-remediated",
        errorCode: "MODEL_GATEWAY_POLICY_BLOCKED",
        errorMessage: `Request included ${apiKey} and private key ${privateKey}.`,
        remediationSteps: [`Remove ${apiKey} and private key ${privateKey} before retry.`],
        responseHash: "",
        completedAt: undefined
      })
    );
    const json = exportModelGatewayEvaluationJson(evaluation);

    expect(evaluation.reviewerAction).toBe("resolve-remediation");
    expect(json).toContain("lexproof-model-gateway-evaluation-v1");
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
    id: "model-gateway-run-eval",
    workspaceId: "workspace-eval",
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
    createdAt: "2026-06-30T00:00:00.000Z",
    completedAt: "2026-06-30T00:00:01.000Z",
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice.",
    ...overrides
  };
}
