import { describe, expect, it, vi } from "vitest";
import {
  buildIntegrationPolicyEvaluationRecordsUrl,
  fetchIntegrationPolicyEvaluationRecords
} from "./integrationPolicyEvaluationClient";
import type { IntegrationPolicyEvaluationRecord } from "./integrationPolicyEvaluation";

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

  it("builds workspace-scoped receipt URLs with encoded workspace IDs", () => {
    expect(buildIntegrationPolicyEvaluationRecordsUrl("https://api.lexproof.test///", "workspace with spaces")).toBe(
      "https://api.lexproof.test/api/workspaces/workspace%20with%20spaces/integration-policy-evaluations"
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
