import { describe, expect, it } from "vitest";
import { createCounselPackExportRecord } from "./counselPackExportService";

const baseInput = {
  workspaceId: "workspace-export",
  projectName: "YieldPassport",
  title: "YieldPassport Counsel Pack v1",
  format: "markdown" as const,
  version: 1,
  artifactName: "yieldpassport-counsel-pack.md",
  manifestHash: "a".repeat(64),
  artifactHash: "b".repeat(64),
  artifactSize: 4096,
  riskLevel: "critical" as const,
  reviewSummary: {
    total: 7,
    reviewed: 1,
    readyForCounsel: 2,
    needsEvidence: 3,
    blocked: 1,
    open: 6
  },
  sourceCount: 4,
  sourcePackHash: "c".repeat(64),
  sourceReviewStatus: "review-due" as const,
  createdBy: "Compliance",
  includesRawKycOrPersonalData: false,
  includesCredentialMaterial: false,
  createdAt: "2026-06-30T08:30:00.000Z"
};

describe("counsel pack export service", () => {
  it("creates server-side metadata-only Counsel Pack export records", () => {
    const record = createCounselPackExportRecord(baseInput);

    expect(record).toEqual({
      recordVersion: "lexproof-counsel-pack-export-record-v1",
      id: expect.stringMatching(/^counsel-pack-export-[a-f0-9]{16}$/),
      workspaceId: "workspace-export",
      exportType: "counsel-pack",
      format: "markdown",
      version: 1,
      projectName: "YieldPassport",
      title: "YieldPassport Counsel Pack v1",
      artifactName: "yieldpassport-counsel-pack.md",
      manifestHash: "a".repeat(64),
      artifactHash: "b".repeat(64),
      artifactSize: 4096,
      riskLevel: "critical",
      reviewSummary: {
        total: 7,
        reviewed: 1,
        readyForCounsel: 2,
        needsEvidence: 3,
        blocked: 1,
        open: 6
      },
      sourceCount: 4,
      sourcePackHash: "c".repeat(64),
      sourceReviewStatus: "review-due",
      createdBy: "Compliance",
      status: "ready",
      createdAt: "2026-06-30T08:30:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
    });
    expect(JSON.stringify(record).toLowerCase()).not.toContain("api_key");
    expect(JSON.stringify(record)).not.toContain("# Counsel Pack");
  });

  it("rejects raw content, credential material, raw KYC flags, and invalid hashes", () => {
    expect(() =>
      createCounselPackExportRecord({
        ...baseInput,
        manifestHash: "not-a-hash",
        artifactHash: "also-not-a-hash",
        sourcePackHash: "not-a-source-pack-hash",
        includesRawKycOrPersonalData: true,
        includesCredentialMaterial: true,
        rawMarkdown: "# Counsel Pack\n\nsk-live-secret should never be accepted"
      })
    ).toThrow(
      [
        "Manifest hash must be a SHA-256 hex digest.",
        "Artifact hash must be a SHA-256 hex digest.",
        "Source pack hash must be a SHA-256 hex digest.",
        "Counsel Pack export records must not include raw KYC or personal data.",
        "Counsel Pack export records must not include API keys, private keys, or credential material.",
        "Server export records accept hashes and metadata only, not raw Markdown or PDF content."
      ].join(" ")
    );
  });
});
