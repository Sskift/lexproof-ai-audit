import { describe, expect, it } from "vitest";
import { createModelGatewayRun, listModelGatewayAdapters } from "./modelGatewayService";

describe("Phase 2 model gateway service", () => {
  it("lists provider adapters with only the mock adapter enabled for Phase 2A", () => {
    expect(listModelGatewayAdapters()).toEqual([
      {
        provider: "mock",
        label: "Mock local reviewer gateway",
        enabled: true,
        mode: "local-mock",
        credentialPolicy: "no credentials accepted"
      },
      {
        provider: "openai-compatible",
        label: "OpenAI-compatible gateway",
        enabled: false,
        mode: "external-provider-placeholder",
        credentialPolicy: "deferred until server-side secret policy is approved"
      },
      {
        provider: "enterprise-proxy",
        label: "Enterprise model proxy gateway",
        enabled: false,
        mode: "external-provider-placeholder",
        credentialPolicy: "deferred until server-side secret policy is approved"
      }
    ]);
  });

  it("creates deterministic mock run receipts with hashes and human review status", () => {
    const input = {
      workspaceId: "workspace-1",
      provider: "mock" as const,
      model: "lexproof-mock",
      purpose: "Draft audit preparation issue spotting for counsel review.",
      redactionStatus: "clean" as const,
      includesCredentialMaterial: false,
      includesRawKycOrPersonalData: false,
      humanReviewOwner: "Compliance",
      allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
      payload: {
        projectName: "YieldPassport",
        riskFlags: ["custody"],
        evidenceVault: {
          bundleHash: "a".repeat(64),
          records: [{ fileHash: "b".repeat(64), status: "verified" }]
        }
      },
      createdAt: "2026-06-29T10:00:00.000Z"
    };

    const first = createModelGatewayRun(input);
    const second = createModelGatewayRun(input);

    expect(first).toEqual(second);
    expect(first).toEqual({
      valid: true,
      run: expect.objectContaining({
        id: expect.stringMatching(/^model-gateway-run-[a-f0-9]{16}$/),
        providerLabel: "Mock local reviewer gateway",
        status: "completed",
        humanReviewStatus: "needs-review",
        payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        responseHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        sourceEvidenceHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        providerMetadata: {
          adapterMode: "local-mock",
          credentialPolicy: "no credentials accepted",
          secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
          allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"]
        },
        attempt: 1,
        maxAttempts: 1,
        retryState: "not-needed",
        remediationSteps: [],
        notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
      })
    });
  });

  it("returns boundary errors instead of creating runs when model gateway policy fails", () => {
    const result = createModelGatewayRun({
      workspaceId: "workspace-1",
      provider: "openai-compatible",
      model: "gpt-4.1-mini",
      purpose: "Make final legal decision for launch approval.",
      redactionStatus: "blocked",
      includesCredentialMaterial: true,
      includesRawKycOrPersonalData: true,
      humanReviewOwner: "",
      allowedDataClasses: [],
      payload: { projectName: "YieldPassport" },
      createdAt: "2026-06-29T10:00:00.000Z"
    });

    expect(result.valid).toBe(false);
    if (result.valid) {
      throw new Error("Expected blocked result.");
    }
    expect(result.errors).toEqual([
        "Model Gateway request must pass the Redaction Gate before provider calls.",
        "Model Gateway requests must not include API keys, private keys, or credential material.",
        "Raw KYC or personal data cannot be sent through the Model Gateway draft.",
        "Model Gateway purpose cannot request final legal decisions.",
        "Human review owner is required before external reliance on model output.",
        "Allowed data classes are required before Model Gateway runs.",
        "Allowed data classes must be limited to audit-prep metadata, evidence hashes, risk flag summaries, regulatory source references, or model receipts."
    ]);
    expect(result.failureRun).toEqual(
      expect.objectContaining({
        provider: "openai-compatible",
        status: "blocked",
        responseHash: "",
        humanReviewStatus: "needs-review",
        errorCode: "MODEL_GATEWAY_POLICY_BLOCKED",
        errorMessage: expect.stringContaining("Redaction Gate"),
        retryState: "blocked-until-remediated",
        remediationSteps: expect.arrayContaining([
          "Pass the Redaction Gate before creating a server Model Gateway run.",
          "Remove API keys, private keys, credentials, raw KYC, and personal data from the request metadata.",
          "Assign a human review owner before external reliance on model output."
        ])
      })
    );
    expect(JSON.stringify(result.failureRun).toLowerCase()).not.toContain("api_key");
  });

  it("blocks non-mock provider adapters even when redaction and review boundaries pass", () => {
    const result = createModelGatewayRun({
      workspaceId: "workspace-1",
      provider: "openai-compatible",
      model: "gpt-4.1-mini",
      purpose: "Draft audit preparation issue spotting for counsel review.",
      redactionStatus: "clean",
      includesCredentialMaterial: false,
      includesRawKycOrPersonalData: false,
      humanReviewOwner: "Compliance",
      allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
      payload: { projectName: "YieldPassport" },
      createdAt: "2026-06-29T10:00:00.000Z"
    });

    expect(result.valid).toBe(false);
    if (result.valid) {
      throw new Error("Expected disabled adapter result.");
    }
    expect(result.errors).toEqual(["Only the mock Model Gateway adapter is enabled in Phase 2A. External provider proxying is deferred."]);
    expect(result.failureRun).toEqual(
      expect.objectContaining({
        provider: "openai-compatible",
        status: "failed",
        errorCode: "MODEL_GATEWAY_ADAPTER_DISABLED",
        retryState: "blocked-until-policy-change",
        remediationSteps: [
          "Use the mock local reviewer for this demo workspace.",
          "Approve server-side secret handling policy before enabling external provider proxying."
        ]
      })
    );
  });
});
