import { describe, expect, it, vi } from "vitest";
import {
  applyAIEventReviewUpdate,
  buildModelIntakeSummary,
  createAIReviewEventFromRun,
  downloadModelIntakeJson,
  exportModelIntakeJson,
  hashAIEventRecord,
  validateModelConnectionProfile,
  type AIEventRecord,
  type ModelConnectionProfile
} from "./modelIntake";
import type { AIReviewResult } from "./aiReview";
import type { ModelReviewRun } from "./modelReviewLedger";

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

describe("applyAIEventReviewUpdate", () => {
  it("updates reviewer, review status, and timestamp without changing the source event record", () => {
    const updated = applyAIEventReviewUpdate(
      event,
      {
        humanReviewer: "Outside counsel",
        reviewStatus: "reviewed"
      },
      "2026-06-29T10:00:00.000Z"
    );

    expect(updated).toMatchObject({
      id: event.id,
      humanReviewer: "Outside counsel",
      reviewStatus: "reviewed",
      updatedAt: "2026-06-29T10:00:00.000Z"
    });
    expect(event.reviewStatus).toBe("needs-review");
    expect(event.updatedAt).toBeUndefined();
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

describe("downloadModelIntakeJson", () => {
  it("downloads model intake profile, events, and summary as JSON through a browser Blob", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:model-intake");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const summary = await buildModelIntakeSummary(profile, [event]);

    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadModelIntakeJson("model-intake.json", profile, [event], summary);

      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:model-intake");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });
});

describe("createAIReviewEventFromRun", () => {
  it("turns an AI review run receipt into a human-review AI event record", () => {
    const run: ModelReviewRun = {
      runVersion: "lexproof-ai-review-run-v1",
      runId: "ai-run-1234",
      generatedAt: "2026-06-29T09:00:00.000Z",
      projectId: "project-1",
      projectName: "YieldPassport",
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "needs-review",
      payloadHash: "a".repeat(64),
      responseHash: "b".repeat(64),
      riskFlagCount: 3,
      evidenceSummaryCount: 2,
      missingEvidenceCount: 1,
      boundary: "AI-assisted draft for audit preparation only. Not legal advice."
    };
    const result: AIReviewResult = {
      extractedFacts: ["Token yield memo references custody controls"],
      missingEvidence: ["Signer control policy"],
      draftQuestions: ["Which artifacts can be shared with counsel?"],
      suggestedRemediation: ["Collect signer approval policy"],
      modelBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
    };

    const event = createAIReviewEventFromRun(run, result, "Compliance");

    expect(event).toMatchObject({
      id: "ai-event-ai-run-1234",
      projectId: "project-1",
      eventType: "AI Review run",
      humanReviewer: "Compliance",
      reviewStatus: "needs-review",
      sourceRunId: "ai-run-1234",
      createdAt: "2026-06-29T09:00:00.000Z",
      updatedAt: "2026-06-29T09:00:00.000Z"
    });
    expect(event.inputSummary).toContain("2 evidence summaries");
    expect(event.inputSummary).toContain("3 risk flags");
    expect(event.inputSummary).toContain("redaction status needs-review");
    expect(event.inputSummary).toContain(run.payloadHash);
    expect(event.outputSummary).toContain("1 extracted facts");
    expect(event.outputSummary).toContain("1 missing evidence items");
    expect(event.outputSummary).toContain("1 draft counsel questions");
    expect(event.modelAction).toContain("Mock local reviewer");
    expect(event.modelAction).toContain("response SHA-256");
    expect(event.modelAction).toContain(run.boundary);
  });
});
