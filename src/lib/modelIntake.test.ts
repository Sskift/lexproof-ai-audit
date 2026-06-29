import { describe, expect, it } from "vitest";
import {
  buildModelIntakeSummary,
  exportModelIntakeJson,
  hashAIEventRecord,
  validateModelConnectionProfile,
  type AIEventRecord,
  type ModelConnectionProfile
} from "./modelIntake";

const profile: ModelConnectionProfile = {
  providerName: "OpenAI-compatible gateway",
  modelName: "gpt-audit-review",
  endpointType: "openai-compatible",
  useCase: "Evidence extraction and draft counsel questions",
  decisionRole: "human-review-support",
  dataClasses: ["evidence summaries", "policy metadata"],
  humanReviewOwner: "Compliance"
};

const event: AIEventRecord = {
  id: "event-1",
  projectId: "project-1",
  eventType: "evidence-review",
  inputSummary: "Review token terms and custody policy summary",
  outputSummary: "Drafted missing evidence question for wallet authority",
  modelAction: "Generated draft audit-prep questions",
  humanReviewer: "Compliance",
  reviewStatus: "needs-review",
  createdAt: "2026-06-29T00:00:00.000Z"
};

describe("validateModelConnectionProfile", () => {
  it("rejects missing connection fields and final legal-decision roles", () => {
    expect(
      validateModelConnectionProfile({
        providerName: "",
        modelName: "",
        endpointType: "openai-compatible",
        useCase: "",
        decisionRole: "final-legal-decision",
        dataClasses: ["raw KYC documents"],
        humanReviewOwner: ""
      })
    ).toEqual({
      valid: false,
      errors: [
        "Provider name is required.",
        "Model name is required.",
        "Use case is required.",
        "Human review owner is required.",
        "Models cannot be registered as final legal decision-makers.",
        "Raw KYC or personal data must not be routed into model intake."
      ]
    });
  });
});

describe("hashAIEventRecord", () => {
  it("creates stable event hashes and changes when model output changes", async () => {
    const firstHash = await hashAIEventRecord(event);
    const repeatHash = await hashAIEventRecord({ ...event });
    const changedHash = await hashAIEventRecord({ ...event, outputSummary: "Different model output" });

    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    expect(repeatHash).toBe(firstHash);
    expect(changedHash).not.toBe(firstHash);
  });
});

describe("buildModelIntakeSummary", () => {
  it("summarizes readiness, unresolved review work, and non-advice boundaries", async () => {
    const summary = await buildModelIntakeSummary(profile, [event]);

    expect(summary.readiness).toBe("needs-review");
    expect(summary.eventCount).toBe(1);
    expect(summary.unresolvedEventCount).toBe(1);
    expect(summary.handoffChecklist).toEqual(
      expect.arrayContaining([
        "Confirm model use remains audit preparation only.",
        "Resolve AI event review items before external reliance."
      ])
    );
    expect(summary.eventHashes[0]).toMatchObject({
      eventId: "event-1",
      hash: expect.stringMatching(/^[a-f0-9]{64}$/)
    });
    expect(summary.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(exportModelIntakeJson(profile, [event], summary)).toContain("\"modelIntakeVersion\": \"lexproof-model-intake-v1\"");
  });
});
