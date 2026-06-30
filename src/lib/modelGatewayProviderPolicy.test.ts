import { describe, expect, it } from "vitest";
import type { ModelConnectReceipt } from "./modelConnect";
import {
  createModelGatewayProviderPolicyReport,
  defaultModelGatewayProviderAdapters,
  exportModelGatewayProviderPolicyJson
} from "./modelGatewayProviderPolicy";

const sessionReceipt: ModelConnectReceipt = {
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
};

describe("model gateway provider policy report", () => {
  it("keeps external provider adapters disabled until provider policy controls are approved", () => {
    const report = createModelGatewayProviderPolicyReport({
      adapters: defaultModelGatewayProviderAdapters,
      modelConnectReceipt: sessionReceipt,
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-model-gateway-provider-policy-v1",
        generatedAt: "2026-07-01T01:00:00.000Z",
        overallStatus: "needs-policy",
        enabledProviderCount: 1,
        deferredProviderCount: 2,
        notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
      })
    );
    expect(report.adapters.map((adapter) => [adapter.provider, adapter.status])).toEqual([
      ["mock", "ready"],
      ["openai-compatible", "needs-policy"],
      ["enterprise-proxy", "disabled"]
    ]);
    expect(report.controls.map((control) => [control.id, control.status])).toEqual([
      ["server-side-secret-policy", "needs-policy"],
      ["provider-allowlist", "needs-policy"],
      ["egress-logging", "needs-policy"],
      ["redaction-gate", "ready"],
      ["human-review-enforcement", "ready"]
    ]);
    expect(report.adapters.find((adapter) => adapter.provider === "openai-compatible")).toMatchObject({
      credentialPolicy: "deferred until server-side secret policy is approved",
      requiredControls: expect.arrayContaining(["server-side-secret-policy", "provider-allowlist", "egress-logging"])
    });
    expect(report.nextActions).toEqual(
      expect.arrayContaining([
        "Approve server-side secret policy before enabling OpenAI-compatible gateway.",
        "Keep external provider proxying disabled until provider allowlist and egress logging are reviewed."
      ])
    );
  });

  it("exports sanitized provider policy JSON without credential material or legal-advice claims", () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const report = createModelGatewayProviderPolicyReport({
      adapters: defaultModelGatewayProviderAdapters,
      modelConnectReceipt: {
        ...sessionReceipt,
        status: "blocked",
        blockers: [`Do not proxy ${apiKey} or private key ${privateKey}.`]
      },
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const json = exportModelGatewayProviderPolicyJson(report);

    expect(report.overallStatus).toBe("blocked");
    expect(json).toContain("lexproof-model-gateway-provider-policy-v1");
    expect(json).toContain("Not legal advice");
    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json.toLowerCase()).not.toContain("legal opinion");
    expect(json.toLowerCase()).not.toContain("final legal decision");
  });
});
