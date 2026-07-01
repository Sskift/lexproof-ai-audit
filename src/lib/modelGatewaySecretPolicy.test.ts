import { describe, expect, it } from "vitest";
import { createModelGatewaySecretPolicyReport, exportModelGatewaySecretPolicyJson } from "./modelGatewaySecretPolicy";

describe("model gateway secret policy", () => {
  it("evaluates all required secret controls without enabling external provider proxying", () => {
    const report = createModelGatewaySecretPolicyReport({
      policyOwner: "Security lead",
      kmsBackedStorageApproved: true,
      rotationDays: 30,
      accessReviewCadence: "quarterly",
      providerAllowlistApproved: true,
      egressLoggingApproved: true,
      incidentResponseRunbookApproved: true,
      noClientSecretPersistence: true,
      humanReviewRequired: true,
      notes: "Policy review complete for future server gateway enablement."
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-model-gateway-secret-policy-v1",
        overallStatus: "ready",
        requiredControlCount: 7,
        approvedControlCount: 7,
        externalProviderProxyingAllowed: false,
        externalProviderProxyingStatus: "policy-ready-not-enabled",
        notLegalAdviceBoundary: "Not legal advice. Model Gateway secret policy is audit preparation metadata only."
      })
    );
    expect(report.nextActions).toContain("Keep external provider proxying disabled until an adapter enablement change is reviewed.");
    expect(report.controls.every((control) => control.status === "ready")).toBe(true);
    expect(exportModelGatewaySecretPolicyJson(report)).toContain("lexproof-model-gateway-secret-policy-v1");
  });

  it("blocks unsafe secret policy metadata without leaking credentials or raw KYC snippets", () => {
    const report = createModelGatewaySecretPolicyReport({
      policyOwner: "sk-live-abcdef1234567890abcdef1234567890",
      kmsBackedStorageApproved: true,
      rotationDays: 365,
      accessReviewCadence: "annual",
      providerAllowlistApproved: false,
      egressLoggingApproved: false,
      incidentResponseRunbookApproved: false,
      noClientSecretPersistence: false,
      humanReviewRequired: false,
      notes: "raw KYC passport scan and private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    });

    const json = JSON.stringify(report);

    expect(report.overallStatus).toBe("blocked");
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "metadata-boundary", status: "blocked" })]));
    expect(report.nextActions).toEqual(expect.arrayContaining(["Remove credentials, private keys, and raw KYC references from policy metadata."]));
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("0x1234567890abcdef");
    expect(json).not.toContain("passport scan");
    expect(json.toLowerCase()).not.toContain("legal opinion");
  });
});
