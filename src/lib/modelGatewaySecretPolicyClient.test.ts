import { describe, expect, it, vi } from "vitest";
import { fetchModelGatewaySecretPolicyReport } from "./modelGatewaySecretPolicyClient";
import type { ModelGatewaySecretPolicyReport } from "./modelGatewaySecretPolicy";

const secretPolicyReport: ModelGatewaySecretPolicyReport = {
  reportVersion: "lexproof-model-gateway-secret-policy-v1",
  generatedAt: "2026-07-01T00:00:00.000Z",
  overallStatus: "ready",
  requiredControlCount: 7,
  approvedControlCount: 7,
  externalProviderProxyingAllowed: false,
  externalProviderProxyingStatus: "policy-ready-not-enabled",
  controls: [
    {
      id: "kms-secret-storage",
      label: "KMS-backed secret storage",
      status: "ready",
      evidence: "KMS-backed provider credential storage is approved for future server gateway review.",
      recoveryAction: "Keep KMS-backed secret storage mandatory before adapter enablement."
    }
  ],
  nextActions: ["Keep external provider proxying disabled until an adapter enablement change is reviewed."],
  notLegalAdviceBoundary: "Not legal advice. Model Gateway secret policy is audit preparation metadata only."
};

describe("model gateway secret policy client", () => {
  it("posts secret policy metadata without sending provider credentials", async () => {
    const fetcher = vi.fn(async (_input: Parameters<typeof fetch>[0], _init?: Parameters<typeof fetch>[1]) =>
      jsonResponse(secretPolicyReport, 200)
    );
    const policyWithUnexpectedSecretField = {
      policyOwner: "Security lead",
      kmsBackedStorageApproved: true,
      rotationDays: 30,
      accessReviewCadence: "quarterly" as const,
      providerAllowlistApproved: true,
      egressLoggingApproved: true,
      incidentResponseRunbookApproved: true,
      noClientSecretPersistence: true,
      humanReviewRequired: true,
      notes: "Prepared for future adapter review.",
      apiKey: "sk-live-abcdef1234567890abcdef1234567890"
    };

    const report = await fetchModelGatewaySecretPolicyReport({
      apiBaseUrl: "https://api.lexproof.test",
      fetcher: fetcher as unknown as typeof fetch,
      policy: policyWithUnexpectedSecretField
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.lexproof.test/api/model-gateway/secret-policy");
    expect(init).toEqual(expect.objectContaining({ method: "POST", headers: { "Content-Type": "application/json" } }));
    expect(String(init?.body)).toContain("\"policyOwner\":\"Security lead\"");
    expect(String(init?.body)).not.toContain("apiKey");
    expect(String(init?.body)).not.toContain("sk-live-abcdef");
    expect(report.externalProviderProxyingAllowed).toBe(false);
  });

  it("rejects malformed secret policy reports before the UI trusts them", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          ...secretPolicyReport,
          notLegalAdviceBoundary: "Legal approval granted."
        },
        200
      )
    ) as unknown as typeof fetch;

    await expect(
      fetchModelGatewaySecretPolicyReport({
        fetcher,
        policy: {
          policyOwner: "Security",
          kmsBackedStorageApproved: true,
          rotationDays: 30,
          accessReviewCadence: "quarterly",
          providerAllowlistApproved: true,
          egressLoggingApproved: true,
          incidentResponseRunbookApproved: true,
          noClientSecretPersistence: true,
          humanReviewRequired: true,
          notes: ""
        }
      })
    ).rejects.toThrow("Secret policy response is missing the required Not legal advice boundary.");
  });
});

function jsonResponse(payload: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}
