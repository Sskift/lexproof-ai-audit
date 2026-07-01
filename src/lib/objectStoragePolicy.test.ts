import { describe, expect, it } from "vitest";
import { createObjectStoragePolicyReport, exportObjectStoragePolicyJson } from "./objectStoragePolicy";

describe("object storage policy", () => {
  it("evaluates required storage controls without enabling external object storage", () => {
    const report = createObjectStoragePolicyReport({
      context: {
        workspaceId: "workspace-storage",
        evidenceCount: 3,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        manifestHash: "a".repeat(64)
      },
      policy: {
        policyOwner: "Security operations",
        retentionDays: 365,
        deletionSlaDays: 30,
        encryptionAtRestApproved: true,
        bucketAllowlistApproved: true,
        accessLoggingApproved: true,
        lifecyclePolicyApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Synthetic object storage policy metadata only."
      }
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-object-storage-policy-v1",
        overallStatus: "ready",
        requiredControlCount: 10,
        approvedControlCount: 10,
        externalObjectStorageAllowed: false,
        externalObjectStorageStatus: "policy-ready-not-enabled",
        notLegalAdviceBoundary: "Not legal advice. Object storage policy is audit preparation metadata only."
      })
    );
    expect(report.nextActions).toContain("Keep external object storage disabled until a separate storage adapter enablement review.");
    expect(report.controls.every((control) => control.status === "ready")).toBe(true);
    expect(exportObjectStoragePolicyJson(report)).toContain("lexproof-object-storage-policy-v1");
  });

  it("blocks unsafe policy metadata without leaking credentials or raw KYC snippets", () => {
    const report = createObjectStoragePolicyReport({
      context: {
        workspaceId: "workspace-storage",
        evidenceCount: 1,
        retentionStatus: "blocked",
        vaultSyncAllowed: false,
        blockerCount: 1,
        manifestHash: "b".repeat(64)
      },
      policy: {
        policyOwner: "sk-live-abcdef1234567890abcdef1234567890",
        retentionDays: 365,
        deletionSlaDays: 30,
        encryptionAtRestApproved: true,
        bucketAllowlistApproved: true,
        accessLoggingApproved: true,
        lifecyclePolicyApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "raw KYC passport scan and private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      }
    });

    const json = JSON.stringify(report);

    expect(report.overallStatus).toBe("blocked");
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "metadata-boundary", status: "blocked" })]));
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "retention-boundary", status: "blocked" })]));
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("0x1234567890abcdef");
    expect(json).not.toContain("passport scan");
    expect(json.toLowerCase()).not.toContain("legal opinion");
  });
});
