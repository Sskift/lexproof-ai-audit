import { describe, expect, it } from "vitest";
import { createWorkspaceJourney } from "./workspaceJourney";

describe("createWorkspaceJourney", () => {
  it("orders the review journey from project facts through counsel export with recoverable statuses", () => {
    const journey = createWorkspaceJourney({
      validation: {
        valid: false,
        errors: ["Project name is required.", "At least one jurisdiction is required."]
      },
      evidenceCount: 0,
      modelConnectStatus: "not-configured",
      regulatoryTriggerCount: 2,
      evidenceGapCount: 1,
      sourceReviewStatus: "review-due",
      humanReviewSummary: {
        totalCount: 3,
        openCount: 2,
        blockedCount: 1,
        reviewedCount: 0
      },
      exportAllowed: true,
      counselPackVersionCount: 0
    });

    expect(journey).toEqual(
      expect.objectContaining({
        journeyVersion: "lexproof-workspace-journey-v1",
        notLegalAdviceBoundary: "Not legal advice. Workspace journey status is audit preparation workflow metadata only."
      })
    );
    expect(journey.summary).toEqual({
      readyCount: 0,
      blockedCount: 2,
      nextTarget: "wizard",
      nextStepId: "project-facts",
      notLegalAdviceBoundary: "Not legal advice. Workspace journey status is audit preparation workflow metadata only."
    });
    expect(journey.steps.map((step) => [step.id, step.target, step.status])).toEqual([
      ["project-facts", "wizard", "blocked"],
      ["model-evidence-intake", "evidence", "needs-input"],
      ["risk-source-graph", "evidence", "needs-review"],
      ["human-review", "review", "blocked"],
      ["vault-manifest", "evidence", "needs-input"],
      ["counsel-export", "counsel", "needs-input"]
    ]);
    expect(JSON.stringify(journey)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the whole journey ready when manifest and export records are available", () => {
    const journey = createWorkspaceJourney({
      validation: {
        valid: true,
        errors: []
      },
      evidenceCount: 4,
      modelConnectStatus: "ready",
      regulatoryTriggerCount: 5,
      evidenceGapCount: 0,
      sourceReviewStatus: "current",
      humanReviewSummary: {
        totalCount: 4,
        openCount: 0,
        blockedCount: 0,
        reviewedCount: 4
      },
      manifestHash: "a".repeat(64),
      exportAllowed: true,
      counselPackVersionCount: 1
    });

    expect(journey.summary).toEqual(
      expect.objectContaining({
        readyCount: 6,
        blockedCount: 0,
        nextTarget: "none",
        nextStepId: "none"
      })
    );
    expect(journey.steps.every((step) => step.status === "ready")).toBe(true);
    expect(journey.steps[5]).toEqual(
      expect.objectContaining({
        id: "counsel-export",
        summary: "1 Counsel Pack version saved for export handoff."
      })
    );
  });
});
