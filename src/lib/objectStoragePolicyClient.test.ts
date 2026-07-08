import { describe, expect, it, vi } from "vitest";
import { fetchObjectStoragePolicyReport } from "./objectStoragePolicyClient";
import type { ObjectStoragePolicyContext, ObjectStoragePolicyReport } from "./objectStoragePolicy";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const readyReport: ObjectStoragePolicyReport = {
  reportVersion: "lexproof-object-storage-policy-v1",
  generatedAt: "2026-07-01T00:00:00.000Z",
  overallStatus: "ready",
  requiredControlCount: 10,
  approvedControlCount: 10,
  externalObjectStorageAllowed: false,
  externalObjectStorageStatus: "policy-ready-not-enabled",
  controls: [
    {
      id: "retention-boundary",
      label: "Retention boundary",
      status: "ready",
      evidence: "Retention policy is ready for metadata-only vault handoff.",
      recoveryAction: "Keep raw object storage disabled until adapter enablement review."
    }
  ],
  nextActions: ["Keep external object storage disabled until a separate storage adapter enablement review."],
  notLegalAdviceBoundary: "Not legal advice. Object storage policy is audit preparation metadata only."
};

describe("object storage policy client", () => {
  it("posts storage policy metadata without sending raw evidence or credentials", async () => {
    const policyWithUnexpectedRawFields = {
      policyOwner: "Storage owner",
      retentionDays: 365,
      deletionSlaDays: 30,
      encryptionAtRestApproved: true,
      bucketAllowlistApproved: true,
      accessLoggingApproved: true,
      lifecyclePolicyApproved: true,
      noSensitiveMaterialConfirmed: true,
      humanReviewRequired: true,
      notes: "Prepared for future storage adapter review.",
      rawEvidenceBody: "raw document text should not be posted",
      apiKey: "sk-live-abcdef1234567890abcdef1234567890"
    };
    const contextWithUnexpectedRawFields: ObjectStoragePolicyContext & { rawEvidenceBytes: string } = {
      workspaceId: "workspace-storage",
      evidenceCount: 2,
      retentionStatus: "ready",
      vaultSyncAllowed: true,
      blockerCount: 0,
      manifestHash: "c".repeat(64),
      rawEvidenceBytes: "not allowed"
    };
    const fetcherMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> => ({
      ok: true,
      json: async () => readyReport
    }) as Response);

    const report = await fetchObjectStoragePolicyReport({
      apiBaseUrl: "https://api.lexproof.test/",
      fetcher: fetcherMock as unknown as typeof fetch,
      context: contextWithUnexpectedRawFields,
      policy: policyWithUnexpectedRawFields
    });

    expect(report).toBe(readyReport);
    expect(fetcherMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetcherMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/integrations/object-storage/policy");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
      context: {
        workspaceId: "workspace-storage",
        evidenceCount: 2,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        manifestHash: "c".repeat(64)
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
        notes: "Prepared for future storage adapter review."
      }
    });
    expect(String(init?.body)).not.toContain("raw document text");
    expect(String(init?.body)).not.toContain("apiKey");
    expect(String(init?.body)).not.toContain("sk-live");
  });

  it("rejects malformed storage policy responses before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...readyReport, externalObjectStorageAllowed: true })
    })) as unknown as typeof fetch;

    await expect(
      fetchObjectStoragePolicyReport({
        fetcher,
        context: {
          workspaceId: "workspace-storage",
          evidenceCount: 1,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          manifestHash: "d".repeat(64)
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
          notes: ""
        }
      })
    ).rejects.toMatchObject({
      code: "OBJECT_STORAGE_POLICY_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning the metadata-only object storage policy contract."
    });
  });

  it("rejects storage policy responses with blank next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...readyReport,
        nextActions: ["Keep external object storage disabled until a separate storage adapter enablement review.", "   "]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchObjectStoragePolicyReport({
        fetcher,
        context: {
          workspaceId: "workspace-storage",
          evidenceCount: 1,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          manifestHash: "d".repeat(64)
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
          notes: ""
        }
      })
    ).rejects.toMatchObject({
      code: "OBJECT_STORAGE_POLICY_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning the metadata-only object storage policy contract."
    });
  });

  it("redacts classified text from otherwise valid storage policy responses before UI use", async () => {
    const pollutedReport: ObjectStoragePolicyReport = {
      ...readyReport,
      controls: [
        {
          ...readyReport.controls[0],
          label: `Retention boundary ${apiKey}`,
          evidence: `Raw KYC packet and apiKey=${apiKey} were copied into server policy evidence before a final legal decision.`,
          recoveryAction: `Remove private key ${privateKey} and passport data before storage handoff.`
        }
      ],
      nextActions: [`Resolve apiKey=${apiKey}, raw KYC packet, and final legal decision before adapter review.`]
    };
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => pollutedReport
    })) as unknown as typeof fetch;

    const report = await fetchObjectStoragePolicyReport({
      fetcher,
      context: {
        workspaceId: "workspace-storage",
        evidenceCount: 1,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        manifestHash: "d".repeat(64)
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
        notes: ""
      }
    });
    const serialized = JSON.stringify(report);

    expect(report).not.toBe(pollutedReport);
    expect(report.controls[0].evidence).toContain("[redacted-raw-kyc]");
    expect(report.nextActions[0]).toContain("[redacted-legal-conclusion]");
    expect(serialized).toContain("[redacted-api-key]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/raw KYC packet|passport data|final legal decision/i);
  });

  it("redacts unsafe API error payload text before surfacing policy failure guidance", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error:
          "Object storage policy failed with raw KYC passport data and api key=sk-live-abcdef1234567890abcdef1234567890.",
        code: "INTEGRATION_POLICY_INVALID_PAYLOAD",
        recoveryAction:
          "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef before final legal decision.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchObjectStoragePolicyReport({
        fetcher,
        context: {
          workspaceId: "workspace-storage",
          evidenceCount: 1,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          manifestHash: "d".repeat(64)
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
          notes: ""
        }
      })
    ).rejects.toMatchObject({
      code: "INTEGRATION_POLICY_INVALID_PAYLOAD",
      message: expect.stringContaining("[redacted-raw-kyc]"),
      recoveryAction: expect.stringContaining("[redacted-private-key]"),
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await expect(
      fetchObjectStoragePolicyReport({
        fetcher,
        context: {
          workspaceId: "workspace-storage",
          evidenceCount: 1,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          manifestHash: "d".repeat(64)
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
          notes: ""
        }
      })
    ).rejects.not.toThrow(/passport data|sk-live-abcdef|0x1234567890abcdef|final legal decision/i);
  });
});
