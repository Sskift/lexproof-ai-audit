import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import {
  createDefaultCounselReviewItems,
  mergeCounselReviewQueues,
  type CounselReviewItem
} from "./counselReview";
import { createRiskEvidenceCoverage } from "./riskEvidence";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "project-review",
  projectName: "Counsel Review Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "Policy metadata only",
  aiUsage: "No model decisions",
  blockchainUse: "No chain writes",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      id: "terms",
      label: "Disclosure and eligibility memo",
      kind: "Markdown",
      content: "Token terms, disclosure, exemption, eligibility, redemption, and offering assumptions.",
      status: "verified",
      owner: "Counsel"
    }
  ]
};

describe("createDefaultCounselReviewItems", () => {
  it("creates counsel review statuses from active risk flags and evidence coverage", () => {
    const audit = analyzeAuditProfile(project);
    const coverage = createRiskEvidenceCoverage(audit, project.evidenceItems);

    const items = createDefaultCounselReviewItems(project, audit, coverage);

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "project-review-review-asset-yield",
          flagId: "asset-yield",
          title: "Yield-bearing or investment-like asset",
          owner: "Counsel",
          priority: "P0",
          status: "ready-for-counsel",
          evidenceSummary: "2/2 evidence requirements covered"
        }),
        expect.objectContaining({
          id: "project-review-review-custody",
          flagId: "custody",
          title: "Custody or wallet control",
          owner: "Compliance",
          priority: "P0",
          status: "needs-evidence",
          evidenceSummary: "0/2 evidence requirements covered"
        })
      ])
    );
    expect(items[0]?.notLegalAdviceBoundary).toBe("Not legal advice. Counsel review status is audit preparation workflow only.");
  });
});

describe("mergeCounselReviewQueues", () => {
  it("preserves human review edits while adding newly generated risk items", () => {
    const audit = analyzeAuditProfile(project);
    const incoming = createDefaultCounselReviewItems(project, audit, createRiskEvidenceCoverage(audit, project.evidenceItems));
    const existing: CounselReviewItem[] = [
      {
        ...incoming[0],
        status: "reviewed",
        reviewer: "Ana Counsel",
        reviewerNote: "Reviewed offering assumptions with outside counsel.",
        updatedAt: "2026-06-29T08:00:00.000Z"
      }
    ];

    const merged = mergeCounselReviewQueues(existing, incoming);

    expect(merged).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flagId: "asset-yield",
          status: "reviewed",
          reviewer: "Ana Counsel",
          reviewerNote: "Reviewed offering assumptions with outside counsel."
        }),
        expect.objectContaining({
          flagId: "custody",
          status: "needs-evidence"
        })
      ])
    );
  });

  it("drops stale review rows when a risk flag no longer exists", () => {
    const audit = analyzeAuditProfile(project);
    const incoming = createDefaultCounselReviewItems(project, audit, createRiskEvidenceCoverage(audit, project.evidenceItems));
    const stale: CounselReviewItem = {
      ...incoming[0],
      id: "project-review-review-removed-risk",
      flagId: "removed-risk",
      title: "Removed historical risk",
      status: "blocked"
    };

    const merged = mergeCounselReviewQueues([...incoming, stale], incoming);

    expect(merged.map((item) => item.flagId)).not.toContain("removed-risk");
  });
});
