import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CounselPackPanel } from "./CounselPackPanel";
import type { SubmissionFit } from "../lib/auditEngine";
import { counselPackTemplates } from "../lib/counselPackTemplates";
import type { DataBoundaryReport } from "../lib/dataBoundary";
import type { CounselPackExportRecord } from "../lib/phase2Types";

const template = counselPackTemplates[0];

describe("CounselPackPanel", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("lists every server export recovery packet action before counsel handoff", async () => {
    vi.spyOn(globalThis.crypto.subtle, "digest").mockResolvedValue(new Uint8Array(32).buffer);

    render(
      <CounselPackPanel
        projectName="Recovery Desk"
        fit={submissionFit}
        manifest={null}
        regulatorySourcePack={null}
        versionMetadataReady={false}
        markdown="Not legal advice."
        counselQuestions={[]}
        counselReviews={[]}
        exportTemplates={[template]}
        selectedExportTemplate={template}
        recommendedExportTemplateId={template.id}
        dataBoundaryReport={cleanDataBoundaryReport}
        manifestDriftReport={null}
        handoffChecklist={null}
        counselPackVersions={[]}
        serverExportRecords={[
          createExportRecord({
            id: "counsel-pack-export-blocked",
            artifactName: "blocked-export.md",
            version: 1,
            reviewSummary: {
              total: 4,
              reviewed: 2,
              readyForCounsel: 1,
              needsEvidence: 1,
              blocked: 1,
              open: 2
            }
          }),
          createExportRecord({
            id: "counsel-pack-export-source-review",
            artifactName: "source-review-export.md",
            version: 2,
            sourceReviewStatus: "review-due"
          })
        ]}
        onSelectExportTemplate={vi.fn()}
        onAddQuestion={vi.fn()}
        onUpdateQuestion={vi.fn()}
        onRemoveQuestion={vi.fn()}
        onUpdateReview={vi.fn()}
        onSaveVersion={vi.fn()}
        onCreateServerExport={vi.fn()}
      />
    );

    const actions = within(
      await screen.findByRole("status", { name: /Server Export Recovery Packet actions/i })
    );

    expect(actions.getByText(/Export recovery active/i)).toBeInTheDocument();
    expect(actions.getByText(/Resolve blocked counsel review items before export recovery can clear./i)).toBeInTheDocument();
    expect(actions.getByText(/Refresh source review metadata before final external handoff./i)).toBeInTheDocument();
  });
});

const submissionFit: SubmissionFit = {
  targetHackathon: "BLI Legal Tech Hackathon 2",
  themeCoverage: [],
  requiredAssets: [],
  scorecard: {
    prizeToEffort: 5,
    deadlineRoom: 5,
    scopeFit: 5,
    implementationRisk: 2
  }
};

const cleanDataBoundaryReport: DataBoundaryReport = {
  reportVersion: "lexproof-data-boundary-v1",
  status: "clean",
  exportAllowed: true,
  detectedClasses: [],
  blockerCount: 0,
  warningCount: 0,
  findings: [],
  remediation: ["No blocked data boundary findings detected; keep exports metadata-only and review before external handoff."],
  notLegalAdviceBoundary: "Not legal advice. Data boundary output is audit preparation material only."
};

function createExportRecord(overrides: Partial<CounselPackExportRecord> = {}): CounselPackExportRecord {
  return {
    recordVersion: "lexproof-counsel-pack-export-record-v1",
    id: "counsel-pack-export-ready",
    workspaceId: "workspace-counsel-pack-panel",
    exportType: "counsel-pack",
    format: "markdown",
    version: 1,
    projectName: "Recovery Desk",
    title: "Recovery Desk Counsel Pack",
    artifactName: "recovery-desk-counsel-pack.md",
    manifestHash: "a".repeat(64),
    artifactHash: "b".repeat(64),
    artifactSize: 2048,
    riskLevel: "high",
    reviewSummary: {
      total: 3,
      reviewed: 3,
      readyForCounsel: 3,
      needsEvidence: 0,
      blocked: 0,
      open: 0
    },
    sourceCount: 6,
    sourcePackHash: "c".repeat(64),
    sourceReviewStatus: "current",
    jurisdictionReadinessDigest: {
      digestHash: "d".repeat(64),
      status: "ready-for-counsel",
      handoffAllowed: true,
      jurisdictionCount: 2,
      readyForCounselCount: 2,
      needsEvidenceCount: 0,
      needsSourceReviewCount: 0,
      metadataMissingCount: 0,
      openEvidenceRequestCount: 0,
      sourceFreshnessBlockerCount: 0,
      dueSoonSourceCount: 0,
      notLegalAdviceBoundary:
        "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
    },
    createdBy: "Compliance",
    status: "ready",
    createdAt: "2026-07-04T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only.",
    ...overrides
  };
}
