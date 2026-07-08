import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import {
  createDefaultCounselReviewItems,
  mergeCounselReviewQueues,
  parseStoredCounselReviews,
  sanitizeCounselReviewItem,
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

describe("stored counsel review recovery", () => {
  it("sanitizes persisted counsel review text fields before restoring them", () => {
    const restored = parseStoredCounselReviews(
      JSON.stringify([
        {
          id: "review-secret-sk-live123456789012",
          projectId: "project-review",
          flagId: "sensitive-data",
          title: "Final legal decision after raw KYC packet review",
          severity: "critical",
          owner: "Compliance",
          priority: "P0",
          status: "needs-evidence",
          evidenceSummary:
            "Passport file and 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef were attached.",
          reviewer: "ana@example.com",
          reviewerNote: "apiKey=supersecretvalue; legal opinion says legally compliant.",
          updatedAt: "2026-06-29T08:00:00.000Z",
          rawEvidenceAttachment: "must not survive",
          notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
        }
      ])
    );

    expect(restored).toHaveLength(1);
    expect(JSON.stringify(restored[0])).not.toContain("sk-live123456789012");
    expect(JSON.stringify(restored[0])).not.toContain("supersecretvalue");
    expect(JSON.stringify(restored[0])).not.toContain("0x1234567890abcdef");
    expect(JSON.stringify(restored[0])).not.toContain("raw KYC packet");
    expect(JSON.stringify(restored[0])).not.toContain("Passport file");
    expect(JSON.stringify(restored[0])).not.toContain("legal opinion");
    expect(JSON.stringify(restored[0])).not.toContain("ana@example.com");
    expect(restored[0]).not.toHaveProperty("rawEvidenceAttachment");
    expect(restored[0]?.notLegalAdviceBoundary).toBe("Not legal advice. Counsel review status is audit preparation workflow only.");
  });

  it("drops malformed stored counsel reviews and invalid workflow enums", () => {
    const valid: CounselReviewItem = {
      id: "review-valid",
      projectId: "project-review",
      flagId: "asset-yield",
      title: "Yield-bearing or investment-like asset",
      severity: "material",
      owner: "Counsel",
      priority: "P1",
      status: "ready-for-counsel",
      evidenceSummary: "1/2 evidence requirements covered",
      reviewer: "",
      reviewerNote: "",
      updatedAt: "2026-06-29T08:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
    };

    expect(
      parseStoredCounselReviews(
        JSON.stringify([
          valid,
          { ...valid, id: "bad-boundary", notLegalAdviceBoundary: "Legal advice approved." },
          { ...valid, id: "bad-status", status: "approved" },
          { ...valid, id: "bad-severity", severity: "urgent" },
          { ...valid, id: "bad-owner", owner: "Outside Counsel" },
          { ...valid, id: "bad-priority", priority: "P3" },
          { ...valid, id: "", title: "Missing id" }
        ])
      )
    ).toEqual([valid]);
    expect(parseStoredCounselReviews("{not-json")).toEqual([]);
  });

  it("sanitizes counsel review edits without changing workflow metadata", () => {
    const item = sanitizeCounselReviewItem({
      id: "review-valid",
      projectId: "project-review",
      flagId: "asset-yield",
      title: "Legal approval requested",
      severity: "material",
      owner: "Counsel",
      priority: "P1",
      status: "blocked",
      evidenceSummary: "Passport document cannot be shared.",
      reviewer: "Counsel reviewer",
      reviewerNote: "Compliance decision references raw KYC dump.",
      updatedAt: "2026-06-29T08:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
    });

    expect(item.title).toContain("[redacted-legal-conclusion]");
    expect(item.evidenceSummary).toContain("[redacted-identity-document]");
    expect(item.reviewerNote).toContain("[redacted-legal-conclusion]");
    expect(item.reviewerNote).toContain("[redacted-raw-kyc]");
    expect(item.status).toBe("blocked");
    expect(item.notLegalAdviceBoundary).toBe("Not legal advice. Counsel review status is audit preparation workflow only.");
  });
});
