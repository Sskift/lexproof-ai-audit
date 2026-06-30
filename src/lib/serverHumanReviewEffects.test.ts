import { describe, expect, it } from "vitest";
import {
  createEvidenceVaultStatusEffectFromHumanReview,
  createModelGatewayReviewStatusEffectFromHumanReview
} from "./serverHumanReviewEffects";
import type { HumanReviewRecord } from "./phase2Types";

describe("server human review effects", () => {
  it("maps evidence-target review statuses to Evidence Vault status updates", () => {
    expect(
      createEvidenceVaultStatusEffectFromHumanReview(
        createReview({ targetType: "evidence", targetId: "evidence-vault-1", status: "needs-more-evidence" })
      )
    ).toEqual({
      targetEvidenceId: "evidence-vault-1",
      nextStatus: "requested",
      summary: "Human Review requested more evidence; returned Evidence Vault record to requested.",
      notLegalAdviceBoundary: "Not legal advice. Human review effects update audit preparation workflow metadata only."
    });

    expect(
      createEvidenceVaultStatusEffectFromHumanReview(
        createReview({ targetType: "evidence", targetId: "evidence-vault-1", status: "reviewed" })
      )
    ).toEqual(expect.objectContaining({ targetEvidenceId: "evidence-vault-1", nextStatus: "verified" }));
    expect(
      createEvidenceVaultStatusEffectFromHumanReview(
        createReview({ targetType: "evidence", targetId: "evidence-vault-1", status: "rejected" })
      )
    ).toEqual(expect.objectContaining({ targetEvidenceId: "evidence-vault-1", nextStatus: "rejected" }));
  });

  it("does not create an Evidence Vault effect for non-evidence review targets", () => {
    expect(
      createEvidenceVaultStatusEffectFromHumanReview(
        createReview({ targetType: "model-run", targetId: "model-gateway-run-1", status: "reviewed" })
      )
    ).toBeNull();
  });

  it("maps model-run review statuses to Model Gateway human-review status updates", () => {
    expect(
      createModelGatewayReviewStatusEffectFromHumanReview(
        createReview({ targetType: "model-run", targetId: "model-gateway-run-1", status: "reviewed" })
      )
    ).toEqual({
      targetRunId: "model-gateway-run-1",
      nextStatus: "reviewed",
      summary: "Human Review marked model run reviewed for audit-prep reliance.",
      notLegalAdviceBoundary: "Not legal advice. Human review effects update audit preparation workflow metadata only."
    });
    expect(
      createModelGatewayReviewStatusEffectFromHumanReview(
        createReview({ targetType: "model-run", targetId: "model-gateway-run-1", status: "rejected" })
      )
    ).toEqual(expect.objectContaining({ targetRunId: "model-gateway-run-1", nextStatus: "rejected" }));
    expect(
      createModelGatewayReviewStatusEffectFromHumanReview(
        createReview({ targetType: "model-run", targetId: "model-gateway-run-1", status: "needs-more-evidence" })
      )
    ).toEqual(expect.objectContaining({ targetRunId: "model-gateway-run-1", nextStatus: "needs-review" }));
  });

  it("does not create a Model Gateway effect for non-model-run review targets", () => {
    expect(
      createModelGatewayReviewStatusEffectFromHumanReview(
        createReview({ targetType: "evidence", targetId: "evidence-vault-1", status: "reviewed" })
      )
    ).toBeNull();
  });

  it("keeps the effect as workflow metadata, not legal approval", () => {
    const effect = createEvidenceVaultStatusEffectFromHumanReview(
      createReview({ targetType: "evidence", targetId: "evidence-vault-1", status: "reviewed" })
    );

    expect(JSON.stringify(effect).toLowerCase()).not.toContain("approved");
    expect(effect?.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(
      JSON.stringify(
        createModelGatewayReviewStatusEffectFromHumanReview(
          createReview({ targetType: "model-run", targetId: "model-gateway-run-1", status: "reviewed" })
        )
      ).toLowerCase()
    ).not.toContain("approved");
  });
});

function createReview(overrides: Partial<HumanReviewRecord> = {}): HumanReviewRecord {
  return {
    recordVersion: "lexproof-human-review-record-v1",
    id: "human-review-1",
    workspaceId: "workspace-review-effects",
    targetType: "evidence",
    targetId: "evidence-vault-1",
    reviewerId: "Compliance",
    status: "requested",
    comment: "Review evidence readiness.",
    createdAt: "2026-06-30T00:00:00.000Z",
    updatedAt: "2026-06-30T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status.",
    ...overrides
  };
}
