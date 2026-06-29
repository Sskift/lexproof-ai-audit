import { describe, expect, it } from "vitest";
import { createModelGatewayRun } from "./modelGatewayService";

describe("Phase 2 model gateway service", () => {
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
      payload: { projectName: "YieldPassport", riskFlags: ["custody"] },
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
      payload: { projectName: "YieldPassport" },
      createdAt: "2026-06-29T10:00:00.000Z"
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        "Model Gateway request must pass the Redaction Gate before provider calls.",
        "Model Gateway requests must not include API keys, private keys, or credential material.",
        "Raw KYC or personal data cannot be sent through the Model Gateway draft.",
        "Model Gateway purpose cannot request final legal decisions.",
        "Human review owner is required before external reliance on model output."
      ]
    });
  });
});
