import { describe, expect, it, vi } from "vitest";
import { CounselPackExportClientError, createServerCounselPackExportRecord } from "./counselPackExportClient";
import type { CounselPackVersionRecord } from "./counselPackVersions";

const versionRecord: CounselPackVersionRecord = {
  recordVersion: "lexproof-counsel-pack-version-v1",
  id: "counsel-pack-version-local",
  projectId: "workspace-export",
  projectName: "YieldPassport",
  version: 2,
  title: "YieldPassport Counsel Pack v2",
  manifestHash: "a".repeat(64),
  markdownHash: "b".repeat(64),
  markdownSize: 4096,
  riskLevel: "critical",
  reviewSummary: {
    total: 7,
    reviewed: 1,
    readyForCounsel: 2,
    needsEvidence: 3,
    blocked: 1,
    open: 6
  },
  reviewStatuses: [],
  sourcePack: [
    { title: "SEC Framework", url: "https://www.sec.gov/" },
    { title: "CFTC Advisory", url: "https://www.cftc.gov/" }
  ],
  regulatorySourcePack: {
    packVersion: "lexproof-regulatory-source-pack-v1",
    packHash: "c".repeat(64),
    sourceCount: 6,
    evidenceGapCount: 2,
    sourceReviewStatus: "review-due",
    currentSourceCount: 5,
    reviewDueCount: 1,
    metadataMissingCount: 0,
    reviewWindowDays: 90,
    notLegalAdviceBoundary: "Not legal advice. Regulatory source pack snapshot is audit preparation source-lineage metadata only."
  },
  jurisdictionReadinessDigest: {
    digestVersion: "lexproof-jurisdiction-readiness-digest-v1",
    digestHash: "d".repeat(64),
    status: "needs-evidence",
    handoffAllowed: false,
    jurisdictionCount: 2,
    readyForCounselCount: 0,
    needsEvidenceCount: 2,
    needsSourceReviewCount: 0,
    metadataMissingCount: 0,
    openEvidenceRequestCount: 8,
    sourceFreshnessBlockerCount: 1,
    dueSoonSourceCount: 0,
    notLegalAdviceBoundary:
      "Not legal advice. Jurisdiction readiness digest snapshots are audit preparation workflow metadata only."
  },
  exportedAt: "2026-06-30T08:30:00.000Z",
  notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
};

describe("counsel pack export client", () => {
  it("creates server export records from local version metadata without raw Markdown", async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({
        projectName: "YieldPassport",
        title: "YieldPassport Counsel Pack v2",
        format: "markdown",
        artifactName: "yieldpassport-counsel-pack-v2.md",
        manifestHash: "a".repeat(64),
        artifactHash: "b".repeat(64),
        artifactSize: 4096,
        riskLevel: "critical",
        reviewSummary: versionRecord.reviewSummary,
        sourceCount: 2,
        sourcePackHash: "c".repeat(64),
        sourceReviewStatus: "review-due",
        jurisdictionReadinessDigest: {
          digestHash: "d".repeat(64),
          status: "needs-evidence",
          handoffAllowed: false,
          jurisdictionCount: 2,
          readyForCounselCount: 0,
          needsEvidenceCount: 2,
          needsSourceReviewCount: 0,
          metadataMissingCount: 0,
          openEvidenceRequestCount: 8,
          sourceFreshnessBlockerCount: 1,
          dueSoonSourceCount: 0,
          notLegalAdviceBoundary:
            "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
        },
        createdBy: "Compliance",
        includesRawKycOrPersonalData: false,
        includesCredentialMaterial: false
      });
      expect(JSON.stringify(body)).not.toContain("# Counsel Pack");
      return {
        ok: true,
        json: async () => ({
          recordVersion: "lexproof-counsel-pack-export-record-v1",
          id: "counsel-pack-export-server",
          workspaceId: "workspace-export",
          version: 1,
          notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
        })
      } as Response;
    });

    const record = await createServerCounselPackExportRecord({
      workspaceId: "workspace-export",
      versionRecord,
      createdBy: "Compliance",
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.lexproof.test/api/workspaces/workspace-export/exports/counsel-pack",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(record).toEqual(expect.objectContaining({ id: "counsel-pack-export-server" }));
  });

  it("surfaces server-side export boundary errors with remediation text", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "Artifact hash must be a SHA-256 hex digest.",
        code: "COUNSEL_PACK_EXPORT_INVALID_HASH",
        recoveryAction: "Save a fresh Counsel Pack version before creating a server export record.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    })) as unknown as typeof fetch;

    const exportAttempt = createServerCounselPackExportRecord({
      workspaceId: "workspace-export",
      versionRecord,
      createdBy: "Compliance",
      fetcher
    });

    await expect(exportAttempt).rejects.toBeInstanceOf(CounselPackExportClientError);
    await expect(exportAttempt).rejects.toMatchObject({
      name: "CounselPackExportClientError",
      message: "Artifact hash must be a SHA-256 hex digest.",
      code: "COUNSEL_PACK_EXPORT_INVALID_HASH",
      recoveryAction: "Save a fresh Counsel Pack version before creating a server export record.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
  });

  it("redacts unsafe server export error payloads before surfacing them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error:
          "Server export blocked raw KYC passport data, api key=sk-live-abcdef1234567890abcdef1234567890, and private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef.",
        code: "COUNSEL_PACK_EXPORT_BOUNDARY_FAILED",
        recoveryAction: "Remove seed phrase material before final legal decision.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    })) as unknown as typeof fetch;

    const exportAttempt = createServerCounselPackExportRecord({
      workspaceId: "workspace-export",
      versionRecord,
      createdBy: "Compliance",
      fetcher
    });

    await expect(exportAttempt).rejects.toBeInstanceOf(CounselPackExportClientError);
    await expect(exportAttempt).rejects.toMatchObject({
      name: "CounselPackExportClientError",
      code: "COUNSEL_PACK_EXPORT_BOUNDARY_FAILED",
      recoveryAction: "Remove [redacted-private-key] material before [redacted-legal-conclusion].",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only.",
      message: expect.stringContaining("[redacted-raw-kyc]")
    });

    await expect(
      createServerCounselPackExportRecord({
        workspaceId: "workspace-export",
        versionRecord,
        createdBy: "Compliance",
        fetcher
      })
    ).rejects.not.toThrow(/passport data|sk-live-abcdef|0x1234567890abcdef|seed phrase|final legal decision/i);
  });
});
