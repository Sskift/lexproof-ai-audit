import { describe, expect, it, vi } from "vitest";
import { fetchModelGatewayProviderPolicy } from "./modelGatewayProviderPolicyClient";
import type { ModelGatewayProviderPolicyReport } from "./modelGatewayProviderPolicy";

const providerPolicyReport: ModelGatewayProviderPolicyReport = {
  reportVersion: "lexproof-model-gateway-provider-policy-v1",
  generatedAt: "2026-06-30T00:00:00.000Z",
  overallStatus: "needs-policy",
  enabledProviderCount: 1,
  deferredProviderCount: 2,
  adapters: [
    {
      provider: "mock",
      label: "Mock local reviewer gateway",
      enabled: true,
      mode: "local-mock",
      credentialPolicy: "no credentials accepted",
      status: "ready",
      readinessEvidence: "Mock local reviewer gateway is enabled for metadata-only mock review.",
      requiredControls: ["redaction-gate", "human-review-enforcement"]
    },
    {
      provider: "openai-compatible",
      label: "OpenAI-compatible gateway",
      enabled: false,
      mode: "external-provider-placeholder",
      credentialPolicy: "deferred until server-side secret policy is approved",
      status: "disabled",
      readinessEvidence: "OpenAI-compatible gateway remains disabled until policy approval.",
      requiredControls: ["server-side-secret-policy", "provider-allowlist", "egress-logging", "redaction-gate", "human-review-enforcement"],
      disabledReason: "External provider proxying is disabled until controls are approved."
    }
  ],
  controls: [
    {
      id: "server-side-secret-policy",
      label: "Server-side secret policy",
      status: "needs-policy",
      evidence: "No KMS-backed provider credential storage or secret rotation policy is approved yet.",
      recoveryAction: "Approve KMS-backed secret storage before external provider proxying."
    }
  ],
  nextActions: ["Keep external provider proxying disabled until provider allowlist and egress logging are reviewed."],
  notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
};

describe("model gateway provider policy client", () => {
  it("fetches the metadata-only provider policy report from the configured API base URL", async () => {
    const fetcher = vi.fn(async () => jsonResponse(providerPolicyReport, 200)) as unknown as typeof fetch;

    const report = await fetchModelGatewayProviderPolicy({
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith("https://api.lexproof.test/api/model-gateway/provider-policy", { method: "GET" });
    expect(report).toEqual(providerPolicyReport);
    expect(JSON.stringify(report).toLowerCase()).not.toContain("sk-live");
    expect(JSON.stringify(report).toLowerCase()).not.toContain("private key");
  });

  it("posts only Model Connect receipt metadata when refreshing receipt-aware server policy", async () => {
    const fetcher = vi.fn(async (_input: Parameters<typeof fetch>[0], _init?: Parameters<typeof fetch>[1]) =>
      jsonResponse(
        {
          ...providerPolicyReport,
          adapters: providerPolicyReport.adapters.map((adapter) =>
            adapter.provider === "openai-compatible" ? { ...adapter, status: "needs-policy", disabledReason: undefined } : adapter
          )
        },
        200
      )
    );

    const report = await fetchModelGatewayProviderPolicy({
      apiBaseUrl: "https://api.lexproof.test",
      fetcher: fetcher as unknown as typeof fetch,
      modelConnectReceipt: {
        receiptVersion: "lexproof-model-connect-receipt-v1",
        provider: "openai-compatible",
        providerLabel: "OpenAI-compatible session model",
        model: "gpt-review",
        endpointHost: "api.example.test",
        status: "ready",
        mode: "session-openai-compatible",
        blockers: [],
        createdAt: "2026-07-01T00:00:00.000Z",
        notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only."
      }
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.lexproof.test/api/model-gateway/provider-policy");
    expect(init).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(String(init?.body)).toContain("\"provider\":\"openai-compatible\"");
    expect(String(init?.body)).toContain("\"mode\":\"session-openai-compatible\"");
    expect(String(init?.body)).not.toContain("apiKey");
    expect(String(init?.body)).not.toContain("endpointHost");
    expect(report.adapters.find((adapter) => adapter.provider === "openai-compatible")?.status).toBe("needs-policy");
  });

  it("surfaces typed server errors with recovery guidance and the audit-prep boundary", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: "Provider policy API is unavailable.",
          code: "MODEL_GATEWAY_POLICY_UNAVAILABLE",
          recoveryAction: "Start the Phase 2 API and retry provider policy refresh.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        },
        503
      )
    ) as unknown as typeof fetch;

    await expect(fetchModelGatewayProviderPolicy({ fetcher })).rejects.toMatchObject({
      name: "ModelGatewayProviderPolicyClientError",
      message: "Provider policy API is unavailable.",
      code: "MODEL_GATEWAY_POLICY_UNAVAILABLE",
      recoveryAction: "Start the Phase 2 API and retry provider policy refresh.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
  });

  it("rejects malformed or unsafe provider policy responses before the UI can trust them", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          ...providerPolicyReport,
          notLegalAdviceBoundary: "Final legal decision approved."
        },
        200
      )
    ) as unknown as typeof fetch;

    await expect(fetchModelGatewayProviderPolicy({ fetcher })).rejects.toThrow(
      "Provider policy response is missing the required Not legal advice boundary."
    );
  });
});

function jsonResponse(payload: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}
