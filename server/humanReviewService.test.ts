import { describe, expect, it } from "vitest";
import { createHumanReviewRecord, updateHumanReviewRecord, validateHumanReviewInput } from "./humanReviewService";

describe("Phase 2 human review service", () => {
  it("creates deterministic requested review records with non-advice boundaries", () => {
    const input = {
      workspaceId: "workspace-1",
      targetType: "model-run" as const,
      targetId: "model-run-1",
      reviewerId: "counsel-1",
      comment: "Review AI draft before export.",
      createdAt: "2026-06-29T10:00:00.000Z"
    };

    const first = createHumanReviewRecord(input);
    const second = createHumanReviewRecord(input);

    expect(first).toEqual(second);
    expect(first).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^human-review-[a-f0-9]{16}$/),
        status: "requested",
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      })
    );
  });

  it("updates review status and comment while preserving target metadata", () => {
    const created = createHumanReviewRecord({
      workspaceId: "workspace-1",
      targetType: "risk-flag",
      targetId: "custody",
      reviewerId: "compliance-1",
      comment: "Initial request.",
      createdAt: "2026-06-29T10:00:00.000Z"
    });

    const updated = updateHumanReviewRecord(created, {
      status: "needs-more-evidence",
      comment: "Need custody policy hash before review.",
      updatedAt: "2026-06-29T11:00:00.000Z"
    });

    expect(updated).toEqual({
      ...created,
      status: "needs-more-evidence",
      comment: "Need custody policy hash before review.",
      updatedAt: "2026-06-29T11:00:00.000Z"
    });
  });

  it("returns explicit validation errors for missing review metadata", () => {
    expect(
      validateHumanReviewInput({
        workspaceId: "",
        targetType: "evidence",
        targetId: "",
        reviewerId: "",
        comment: ""
      })
    ).toEqual({
      valid: false,
      errors: ["Workspace ID is required.", "Human review target ID is required.", "Human review reviewer ID is required."]
    });
  });
});
