import { describe, expect, it, vi } from "vitest";
import {
  buildIntegrationPolicyEvaluationReceiptBundleUrl,
  buildIntegrationPolicyEvaluationRecordsUrl,
  fetchIntegrationPolicyEvaluationReceiptBundle,
  fetchIntegrationPolicyEvaluationRecords
} from "./integrationPolicyEvaluationClient";
import type { IntegrationPolicyEvaluationReceiptBundle, IntegrationPolicyEvaluationRecord } from "./integrationPolicyEvaluation";

const policyReceipt: IntegrationPolicyEvaluationRecord = {
  recordVersion: "lexproof-integration-policy-evaluation-record-v1",
  id: "integration-policy-evaluation-record-ui",
  workspaceId: "workspace-policy",
  policyId: "object-storage",
  reportVersion: "lexproof-object-storage-policy-v1",
  overallStatus: "ready",
  approvedControlCount: 10,
  requiredControlCount: 10,
  externalCapabilityAllowed: false,
  externalCapabilityStatus: "policy-ready-not-enabled",
  reportHash: "a".repeat(64),
  contextHash: "b".repeat(64),
  policyHash: "c".repeat(64),
  evaluatorId: "Integration policy evaluator",
  source: "server",
  createdAt: "2026-07-01T00:00:00.000Z",
  nextActions: ["Keep external object storage disabled until adapter enablement review."],
  notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
};

describe("integration policy evaluation client", () => {
  it("fetches persisted policy evaluation receipts without posting raw payloads", async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> => ({
      ok: true,
      json: async () => [policyReceipt]
    }) as Response);

    const records = await fetchIntegrationPolicyEvaluationRecords({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-policy",
      fetcher: fetcher as unknown as typeof fetch
    });

    expect(records).toEqual([policyReceipt]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/workspaces/workspace-policy/integration-policy-evaluations");
    expect(init).toEqual({ method: "GET" });
    expect(JSON.stringify(init)).not.toContain("rawEvidence");
    expect(JSON.stringify(init)).not.toContain("apiKey");
  });

  it("redacts classified text from otherwise valid persisted policy evaluation receipts before UI use", async () => {
    const unsafeReceipt: IntegrationPolicyEvaluationRecord = {
      ...policyReceipt,
      id: "integration-policy-evaluation-record-ui apiKey=sk-live-abcdef1234567890abcdef1234567890",
      workspaceId: "workspace-policy raw KYC passport A1234567",
      reportVersion: "lexproof-object-storage-policy-v1 legal opinion",
      externalCapabilityStatus:
        "policy-ready-not-enabled private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      evaluatorId: "integration-owner@example.com",
      createdAt: "2026-07-01T00:00:00.000Z final legal decision",
      nextActions: [
        "Remove apiKey=sk-live-abcdef1234567890abcdef1234567890 before adapter review.",
        "Do not upload raw KYC passport A1234567.",
        "Do not present a legal conclusion as adapter approval."
      ]
    };
    const fetcher = vi.fn(async (): Promise<Response> => ({
      ok: true,
      json: async () => [unsafeReceipt]
    }) as Response);

    const records = await fetchIntegrationPolicyEvaluationRecords({
      workspaceId: "workspace-policy",
      fetcher: fetcher as unknown as typeof fetch
    });

    const [record] = records;
    expect(record.id).toContain("[redacted-secret]");
    expect(record.workspaceId).toContain("[redacted-raw-kyc]");
    expect(record.workspaceId).toContain("[redacted-passport-id]");
    expect(record.reportVersion).toContain("[redacted-legal-conclusion]");
    expect(record.externalCapabilityStatus).toContain("[redacted-private-key]");
    expect(record.evaluatorId).toBe("[redacted-email]");
    expect(record.createdAt).toContain("[redacted-legal-conclusion]");
    expect(record.nextActions.join(" ")).toContain("[redacted-secret]");
    expect(record.nextActions.join(" ")).toContain("[redacted-raw-kyc]");
    expect(record.nextActions.join(" ")).toContain("[redacted-legal-conclusion]");
    expect(JSON.stringify(records)).not.toMatch(
      /sk-live-abcdef|raw KYC|passport A1234567|integration-owner@example\.com|final legal decision|legal opinion|legal conclusion/i
    );
    expect(record.externalCapabilityAllowed).toBe(false);
    expect(record.notLegalAdviceBoundary).toBe(
      "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
    );
  });

  it("builds workspace-scoped receipt URLs with encoded workspace IDs", () => {
    expect(buildIntegrationPolicyEvaluationRecordsUrl("https://api.lexproof.test///", "workspace with spaces")).toBe(
      "https://api.lexproof.test/api/workspaces/workspace%20with%20spaces/integration-policy-evaluations"
    );
    expect(buildIntegrationPolicyEvaluationReceiptBundleUrl("https://api.lexproof.test///", "workspace with spaces")).toBe(
      "https://api.lexproof.test/api/workspaces/workspace%20with%20spaces/integration-policy-evaluations/bundle"
    );
  });

  it("fetches a persisted metadata-only policy receipt bundle without enabling external adapters", async () => {
    const bundle = createReceiptBundle();
    const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> => ({
      ok: true,
      json: async () => bundle
    }) as Response);

    const result = await fetchIntegrationPolicyEvaluationReceiptBundle({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: "workspace-policy",
      fetcher: fetcher as unknown as typeof fetch
    });

    expect(result).toEqual(bundle);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.lexproof.test/api/workspaces/workspace-policy/integration-policy-evaluations/bundle",
      { method: "GET" }
    );
    expect(result.externalEnablementAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/rawEvidence|apiKey|private key|raw KYC/i);
  });

  it("redacts classified text from otherwise valid persisted policy receipt bundles before UI use", async () => {
    const unsafeBundle = createReceiptBundle();
    unsafeBundle.workspaceId = "workspace-policy apiKey=sk-live-abcdef1234567890abcdef1234567890";
    unsafeBundle.generatedAt = "2026-07-01T00:00:00.000Z raw KYC passport A1234567";
    unsafeBundle.nextActions = [
      "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef.",
      "Do not treat this receipt as a legal opinion."
    ];
    unsafeBundle.records = [
      {
        ...unsafeBundle.records[0],
        id: "integration-policy-evaluation-record-ui apiKey=sk-live-abcdef1234567890abcdef1234567890",
        reportVersion: "lexproof-object-storage-policy-v1 final legal decision",
        externalCapabilityStatus: "policy-ready-not-enabled raw KYC passport A1234567",
        evaluatorId: "integration-owner@example.com",
        createdAt: "2026-07-01T00:00:00.000Z legal conclusion",
        nextActions: ["Remove apiKey=sk-live-abcdef1234567890abcdef1234567890 before adapter review."]
      }
    ];
    const fetcher = vi.fn(async (): Promise<Response> => ({
      ok: true,
      json: async () => unsafeBundle
    }) as Response);

    const result = await fetchIntegrationPolicyEvaluationReceiptBundle({
      workspaceId: "workspace-policy",
      fetcher: fetcher as unknown as typeof fetch
    });

    expect(result.workspaceId).toContain("[redacted-secret]");
    expect(result.generatedAt).toContain("[redacted-raw-kyc]");
    expect(result.generatedAt).toContain("[redacted-passport-id]");
    expect(result.nextActions.join(" ")).toContain("[redacted-private-key]");
    expect(result.nextActions.join(" ")).toContain("[redacted-legal-conclusion]");
    expect(result.records[0].id).toContain("[redacted-secret]");
    expect(result.records[0].reportVersion).toContain("[redacted-legal-conclusion]");
    expect(result.records[0].externalCapabilityStatus).toContain("[redacted-raw-kyc]");
    expect(result.records[0].externalCapabilityStatus).toContain("[redacted-passport-id]");
    expect(result.records[0].evaluatorId).toBe("[redacted-email]");
    expect(result.records[0].createdAt).toContain("[redacted-legal-conclusion]");
    expect(result.records[0].nextActions.join(" ")).toContain("[redacted-secret]");
    expect(JSON.stringify(result)).not.toMatch(
      /sk-live-abcdef|raw KYC|passport A1234567|integration-owner@example\.com|final legal decision|legal opinion|legal conclusion/i
    );
    expect(result.externalEnablementAllowed).toBe(false);
    expect(result.notLegalAdviceBoundary).toBe(
      "Not legal advice. Integration policy receipt bundles are audit preparation metadata only."
    );
  });

  it("rejects malformed receipt responses before the UI trusts them", async () => {
    const fetcher = vi.fn(async (): Promise<Response> => ({
      ok: true,
      json: async () => [{ ...policyReceipt, externalCapabilityAllowed: true }]
    }) as Response);

    await expect(
      fetchIntegrationPolicyEvaluationRecords({
        workspaceId: "workspace-policy",
        fetcher: fetcher as unknown as typeof fetch
      })
    ).rejects.toMatchObject({
      code: "INTEGRATION_POLICY_EVALUATION_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only policy evaluation receipt records.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
  });

  it("rejects corrupted receipt control counts before the UI trusts them", async () => {
    const fetchers = [
      vi.fn(async (): Promise<Response> => ({
        ok: true,
        json: async () => [{ ...policyReceipt, approvedControlCount: -1 }]
      }) as Response),
      vi.fn(async (): Promise<Response> => ({
        ok: true,
        json: async () => [{ ...policyReceipt, approvedControlCount: 0.5 }]
      }) as Response),
      vi.fn(async (): Promise<Response> => ({
        ok: true,
        json: async () => [{ ...policyReceipt, approvedControlCount: 11, requiredControlCount: 10 }]
      }) as Response)
    ];

    for (const fetcher of fetchers) {
      await expect(
        fetchIntegrationPolicyEvaluationRecords({
          workspaceId: "workspace-policy",
          fetcher: fetcher as unknown as typeof fetch
        })
      ).rejects.toMatchObject({
        code: "INTEGRATION_POLICY_EVALUATION_INVALID_RESPONSE",
        recoveryAction: "Verify the Phase 2 API is returning metadata-only policy evaluation receipt records.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
    }
  });

  it("rejects malformed receipt bundles before the UI trusts them", async () => {
    const fetchers = [
      vi.fn(async (): Promise<Response> => ({
        ok: true,
        json: async () => ({ ...createReceiptBundle(), externalEnablementAllowed: true })
      }) as Response),
      vi.fn(async (): Promise<Response> => ({
        ok: true,
        json: async () => ({ ...createReceiptBundle(), recordCount: 99 })
      }) as Response),
      vi.fn(async (): Promise<Response> => ({
        ok: true,
        json: async () => ({
          ...createReceiptBundle(),
          records: [{ ...createReceiptBundle().records[0], externalCapabilityAllowed: true }]
        })
      }) as Response)
    ];

    for (const fetcher of fetchers) {
      await expect(
        fetchIntegrationPolicyEvaluationReceiptBundle({
          workspaceId: "workspace-policy",
          fetcher: fetcher as unknown as typeof fetch
        })
      ).rejects.toMatchObject({
        code: "INTEGRATION_POLICY_EVALUATION_INVALID_RESPONSE",
        recoveryAction: "Verify the Phase 2 API is returning metadata-only policy evaluation receipt records.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
    }
  });

  it("rejects receipt bundles with blank next actions before the UI trusts them", async () => {
    const fetchers = [
      vi.fn(async (): Promise<Response> => ({
        ok: true,
        json: async () => ({
          ...createReceiptBundle(),
          nextActions: ["Evaluate missing server policy receipts before adapter enablement review.", "   "]
        })
      }) as Response),
      vi.fn(async (): Promise<Response> => ({
        ok: true,
        json: async () => {
          const bundle = createReceiptBundle();
          return {
            ...bundle,
            records: [{ ...bundle.records[0], nextActions: ["   "] }]
          };
        }
      }) as Response)
    ];

    for (const fetcher of fetchers) {
      await expect(
        fetchIntegrationPolicyEvaluationReceiptBundle({
          workspaceId: "workspace-policy",
          fetcher: fetcher as unknown as typeof fetch
        })
      ).rejects.toMatchObject({
        code: "INTEGRATION_POLICY_EVALUATION_INVALID_RESPONSE",
        recoveryAction: "Verify the Phase 2 API is returning metadata-only policy evaluation receipt records.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
    }
  });

  it("redacts unsafe API error payloads while preserving recovery guidance", async () => {
    const fetcher = vi.fn(async (): Promise<Response> => ({
      ok: false,
      json: async () => ({
        error: "Policy receipt refresh failed with raw KYC passport and api key=sk-live-abcdef1234567890abcdef1234567890.",
        code: "INTEGRATION_POLICY_RECEIPT_REJECTED",
        recoveryAction:
          "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef and retry.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    }) as Response);

    await expect(
      fetchIntegrationPolicyEvaluationRecords({
        workspaceId: "workspace-policy",
        fetcher: fetcher as unknown as typeof fetch
      })
    ).rejects.toMatchObject({
      code: "INTEGRATION_POLICY_RECEIPT_REJECTED",
      message: expect.stringContaining("[redacted-raw-kyc]"),
      recoveryAction: expect.stringContaining("[redacted-private-key]"),
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
  });
});

function createReceiptBundle(): IntegrationPolicyEvaluationReceiptBundle {
  return {
    bundleVersion: "lexproof-integration-policy-evaluation-receipt-bundle-v1",
    workspaceId: "workspace-policy",
    generatedAt: "2026-07-01T00:00:00.000Z",
    bundleHash: "d".repeat(64),
    recordCount: 1,
    policyCount: 1,
    missingPolicyIds: ["document-parser", "chain-anchor", "grc-destination"],
    readyCount: 1,
    needsPolicyCount: 0,
    blockedCount: 0,
    externalEnablementAllowed: false,
    nextActions: ["Evaluate missing server policy receipts before adapter enablement review."],
    records: [
      {
        id: policyReceipt.id,
        policyId: policyReceipt.policyId,
        reportVersion: policyReceipt.reportVersion,
        overallStatus: policyReceipt.overallStatus,
        approvedControlCount: policyReceipt.approvedControlCount,
        requiredControlCount: policyReceipt.requiredControlCount,
        externalCapabilityAllowed: false,
        externalCapabilityStatus: policyReceipt.externalCapabilityStatus,
        reportHash: policyReceipt.reportHash,
        contextHash: policyReceipt.contextHash,
        policyHash: policyReceipt.policyHash,
        evaluatorId: policyReceipt.evaluatorId,
        source: "server",
        createdAt: policyReceipt.createdAt,
        nextActions: policyReceipt.nextActions
      }
    ],
    notLegalAdviceBoundary: "Not legal advice. Integration policy receipt bundles are audit preparation metadata only."
  };
}
