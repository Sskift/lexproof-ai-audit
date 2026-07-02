import { describe, expect, it } from "vitest";
import { createObjectStoragePolicyReport } from "./objectStoragePolicy";
import {
  createIntegrationPolicyEvaluationRecord,
  isIntegrationPolicyEvaluationRecord
} from "./integrationPolicyEvaluation";

const report = createObjectStoragePolicyReport({
  context: {
    workspaceId: "workspace-integration-policy",
    evidenceCount: 2,
    retentionStatus: "ready",
    vaultSyncAllowed: true,
    blockerCount: 0,
    manifestHash: "a".repeat(64)
  },
  policy: {
    policyOwner: "Storage owner",
    retentionDays: 365,
    deletionSlaDays: 30,
    encryptionAtRestApproved: true,
    bucketAllowlistApproved: true,
    accessLoggingApproved: true,
    lifecyclePolicyApproved: true,
    noSensitiveMaterialConfirmed: true,
    humanReviewRequired: true,
    notes: "Ready for future adapter review."
  }
});

describe("integration policy evaluation records", () => {
  it("creates stable metadata-only hashes for the same policy evaluation", async () => {
    const first = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: {
        workspaceId: "workspace-integration-policy",
        blockerCount: 0,
        evidenceCount: 2,
        manifestHash: "a".repeat(64),
        vaultSyncAllowed: true,
        retentionStatus: "ready"
      },
      policy: {
        policyOwner: "Storage owner",
        retentionDays: 365,
        deletionSlaDays: 30,
        lifecyclePolicyApproved: true
      },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T00:00:00.000Z"
    });
    const second = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: {
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        manifestHash: "a".repeat(64),
        evidenceCount: 2,
        blockerCount: 0,
        workspaceId: "workspace-integration-policy"
      },
      policy: {
        lifecyclePolicyApproved: true,
        deletionSlaDays: 30,
        retentionDays: 365,
        policyOwner: "Storage owner"
      },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T00:00:00.000Z"
    });

    expect(first).toEqual(second);
    expect(first).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-integration-policy-evaluation-record-v1",
        id: expect.stringMatching(/^integration-policy-evaluation-[a-f0-9]{16}$/),
        reportHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        contextHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        policyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        externalCapabilityAllowed: false,
        notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
      })
    );
    expect(isIntegrationPolicyEvaluationRecord(first)).toBe(true);
    expect(JSON.stringify(first)).not.toContain("sk-live");
    expect(JSON.stringify(first).toLowerCase()).not.toContain("legal opinion");
  });

  it("changes the policy hash when approved policy metadata changes", async () => {
    const original = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-integration-policy" },
      policy: { retentionDays: 365, apiKey: "sk-live-abcdef1234567890abcdef1234567890" },
      createdAt: "2026-07-03T00:00:00.000Z"
    });
    const changed = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-integration-policy" },
      policy: { retentionDays: 180, apiKey: "sk-live-abcdef1234567890abcdef1234567890" },
      createdAt: "2026-07-03T00:00:00.000Z"
    });

    expect(changed.policyHash).not.toBe(original.policyHash);
    expect(changed.id).not.toBe(original.id);
    expect(JSON.stringify(changed)).not.toContain("sk-live-abcdef");
  });

  it("rejects missing workspace ids with a clear error", async () => {
    await expect(
      createIntegrationPolicyEvaluationRecord({
        workspaceId: " ",
        policyId: "object-storage",
        report,
        context: {},
        policy: {}
      })
    ).rejects.toThrow("Workspace ID is required for integration policy evaluation records.");
  });
});
