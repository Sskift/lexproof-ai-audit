import { describe, expect, it, vi } from "vitest";
import type { AuditResult } from "./auditEngine";
import type { CounselReviewItem } from "./counselReview";
import type { EvidenceManifest } from "./evidenceManifest";
import {
  createCounselPackDiff,
  createCounselPackVersionRecord,
  downloadCounselPackVersionJson,
  exportCounselPackVersionJson
} from "./counselPackVersions";
import type { ProjectProfile } from "./projectModel";
import type { RegulatorySourcePack } from "./regulatorySourcePack";

const project: ProjectProfile = {
  id: "project-export",
  projectName: "Export Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "Policy metadata only",
  aiUsage: "AI drafts audit-prep questions",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Private beta",
  evidenceItems: []
};

const audit: AuditResult = {
  score: 72,
  riskLevel: "high",
  flags: [],
  remediation: [],
  sourcePack: [
    {
      title: "SEC Framework for Investment Contract Analysis",
      url: "https://www.sec.gov/corpfin/framework-investment-contract-analysis-digital-assets",
      relevance: "Investment contract framework source."
    },
    {
      title: "CFTC virtual currency customer advisory",
      url: "https://www.cftc.gov/",
      relevance: "Virtual currency risk advisory source."
    }
  ]
};

const manifest: EvidenceManifest = {
  manifestVersion: "lexproof-manifest-v1",
  generatedAt: "2026-06-30T00:00:00.000Z",
  projectId: project.id,
  projectName: project.projectName,
  riskLevel: "high",
  riskScore: 72,
  itemCount: 1,
  items: [],
  bundleHash: "a".repeat(64)
};

const reviews: CounselReviewItem[] = [
  {
    id: "review-custody",
    projectId: project.id,
    flagId: "custody",
    title: "Custody or wallet control",
    severity: "critical",
    owner: "Compliance",
    priority: "P0",
    status: "needs-evidence",
    evidenceSummary: "0/2 evidence requirements covered",
    reviewer: "Outside counsel",
    reviewerNote: "Need custody runbook.",
    updatedAt: "2026-06-30T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
  }
];

const regulatorySourcePack: RegulatorySourcePack = {
  packVersion: "lexproof-regulatory-source-pack-v1",
  projectId: project.id,
  generatedAt: "2026-06-30T00:15:00.000Z",
  sourceCount: 4,
  evidenceGapCount: 2,
  jurisdictionSummaries: [],
  clauses: [],
  evidenceGaps: [],
  sourceReview: {
    status: "current",
    totalSourceCount: 4,
    currentSourceCount: 4,
    reviewDueCount: 0,
    metadataMissingCount: 0,
    reviewWindowDays: 90,
    items: [],
    actions: [],
    notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only."
  },
  packHash: "c".repeat(64),
  notLegalAdviceBoundary: "Not legal advice. Regulatory source packs are audit preparation materials only."
};

describe("counsel pack version records", () => {
  it("creates deterministic version records with manifest hash, regulatory source pack hash, review summary, and non-advice boundary", async () => {
    const record = await createCounselPackVersionRecord({
      project,
      audit,
      manifest,
      regulatorySourcePack,
      markdown: "# Counsel Pack\n\nNot legal advice.",
      counselReviews: reviews,
      previousVersions: [],
      exportedAt: "2026-06-30T01:00:00.000Z"
    });

    expect(record).toEqual({
      recordVersion: "lexproof-counsel-pack-version-v1",
      id: expect.stringMatching(/^counsel-pack-version-[a-f0-9]{16}$/),
      projectId: "project-export",
      projectName: "Export Desk",
      version: 1,
      title: "Export Desk Counsel Pack v1",
      manifestHash: "a".repeat(64),
      markdownHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      markdownSize: "# Counsel Pack\n\nNot legal advice.".length,
      riskLevel: "high",
      reviewSummary: {
        total: 1,
        reviewed: 0,
        readyForCounsel: 0,
        needsEvidence: 1,
        blocked: 0,
        open: 1
      },
      reviewStatuses: [
        {
          flagId: "custody",
          title: "Custody or wallet control",
          status: "needs-evidence",
          reviewer: "Outside counsel",
          evidenceSummary: "0/2 evidence requirements covered"
        }
      ],
      sourcePack: [
        {
          title: "SEC Framework for Investment Contract Analysis",
          url: "https://www.sec.gov/corpfin/framework-investment-contract-analysis-digital-assets"
        },
        {
          title: "CFTC virtual currency customer advisory",
          url: "https://www.cftc.gov/"
        }
      ],
      regulatorySourcePack: {
        packVersion: "lexproof-regulatory-source-pack-v1",
        packHash: "c".repeat(64),
        sourceCount: 4,
        evidenceGapCount: 2,
        sourceReviewStatus: "current",
        currentSourceCount: 4,
        reviewDueCount: 0,
        metadataMissingCount: 0,
        reviewWindowDays: 90,
        notLegalAdviceBoundary: "Not legal advice. Regulatory source pack snapshot is audit preparation source-lineage metadata only."
      },
      exportedAt: "2026-06-30T01:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
    });
    expect(JSON.stringify(record).toLowerCase()).not.toContain("api_key");
  });

  it("diffs version records when review status and manifest hash change", async () => {
    const previous = await createCounselPackVersionRecord({
      project,
      audit,
      manifest,
      regulatorySourcePack,
      markdown: "# Counsel Pack\n\nVersion one.",
      counselReviews: reviews,
      previousVersions: [],
      exportedAt: "2026-06-30T01:00:00.000Z"
    });
    const next = await createCounselPackVersionRecord({
      project,
      audit,
      manifest: { ...manifest, bundleHash: "b".repeat(64), itemCount: 2 },
      regulatorySourcePack: { ...regulatorySourcePack, packHash: "d".repeat(64), evidenceGapCount: 3 },
      markdown: "# Counsel Pack\n\nVersion two.",
      counselReviews: [{ ...reviews[0], status: "reviewed", reviewerNote: "Reviewed for handoff." }],
      previousVersions: [previous],
      exportedAt: "2026-06-30T02:00:00.000Z"
    });

    expect(next.version).toBe(2);
    expect(next.diffFromPrevious).toEqual({
      diffVersion: "lexproof-counsel-pack-version-diff-v1",
      previousVersion: 1,
      nextVersion: 2,
      manifestHashChanged: true,
      markdownHashChanged: true,
      regulatorySourcePackHashChanged: true,
      reviewStatusChanges: [
        {
          flagId: "custody",
          title: "Custody or wallet control",
          from: "needs-evidence",
          to: "reviewed"
        }
      ],
      addedSourceCount: 0,
      removedSourceCount: 0,
      summary: "Manifest changed; Markdown changed; Source pack changed; 1 review status changed; 0 sources added; 0 sources removed.",
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack version diffs are audit preparation change metadata only."
    });
    expect(createCounselPackDiff(previous, next)).toEqual(next.diffFromPrevious);
  });

  it("exports and downloads version JSON without raw Markdown content", async () => {
    const record = await createCounselPackVersionRecord({
      project,
      audit,
      manifest,
      regulatorySourcePack,
      markdown: "# Counsel Pack\n\nSensitive draft text should be hashed only.",
      counselReviews: reviews,
      previousVersions: [],
      exportedAt: "2026-06-30T01:00:00.000Z"
    });
    const json = exportCounselPackVersionJson(record);

    expect(json).toContain("\"recordVersion\": \"lexproof-counsel-pack-version-v1\"");
    expect(json).toContain("\"markdownHash\"");
    expect(json).not.toContain("Sensitive draft text should be hashed only");

    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:counsel-pack-version");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadCounselPackVersionJson("counsel-pack-version.json", record);
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:counsel-pack-version");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });
});
