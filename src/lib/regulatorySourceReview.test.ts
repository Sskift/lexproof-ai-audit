import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import type { ProjectProfile } from "./projectModel";

const globalLaunchProject: ProjectProfile = {
  id: "project-source-review",
  projectName: "Global Source Review",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union", "United Kingdom", "Singapore", "Switzerland", "United Arab Emirates"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata only",
  aiUsage: "AI drafts source summaries for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createRegulatorySourceReview", () => {
  it("summarizes matched source review metadata without making legal conclusions", () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const review = createRegulatorySourceReview(graph, {
      asOf: "2026-07-15T00:00:00.000Z",
      reviewWindowDays: 90
    });

    expect(review.status).toBe("current");
    expect(review.notLegalAdviceBoundary).toBe("Not legal advice. Source review metadata is audit preparation lineage only.");
    expect(review.totalSourceCount).toBe(graph.matchedClauses.length);
    expect(review.reviewDueCount).toBe(0);
    expect(review.items[0]).toEqual(
      expect.objectContaining({
        clauseId: expect.any(String),
        sourceUrl: expect.stringMatching(/^https:\/\//),
        effectiveAsOf: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        lastReviewedAt: "2026-06-30",
        nextReviewDueAt: "2026-09-28",
        reviewStatus: "current",
        reviewerNotes: expect.stringContaining("local counsel")
      })
    );
    expect(JSON.stringify(review)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("flags source metadata for review when the review window has elapsed", () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const review = createRegulatorySourceReview(graph, {
      asOf: "2026-10-01T00:00:00.000Z",
      reviewWindowDays: 90
    });

    expect(review.status).toBe("review-due");
    expect(review.reviewDueCount).toBeGreaterThan(0);
    expect(review.actions[0]).toEqual(
      expect.objectContaining({
        priority: "P1",
        action: expect.stringContaining("Refresh")
      })
    );
    expect(review.items.every((item) => item.reviewStatus === "review-due")).toBe(true);
  });
});
