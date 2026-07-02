import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerIntegrationPolicyRoutes } from "./integrationPolicyRoutes";

describe("integration policy route module", () => {
  it("evaluates object storage policy readiness without accepting raw evidence or enabling external storage", async () => {
    const server = Fastify({ logger: false });
    await registerIntegrationPolicyRoutes(server);

    const response = await server.inject({
      method: "POST",
      url: "/api/integrations/object-storage/policy",
      payload: {
        context: {
          workspaceId: "workspace-storage",
          evidenceCount: 2,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          manifestHash: "e".repeat(64),
          rawEvidenceBytes: "raw document content should never echo"
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
          notes: "Ready for future object storage review.",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890"
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-object-storage-policy-v1",
        overallStatus: "ready",
        externalObjectStorageAllowed: false,
        externalObjectStorageStatus: "policy-ready-not-enabled",
        notLegalAdviceBoundary: "Not legal advice. Object storage policy is audit preparation metadata only."
      })
    );
    expect(response.json().controls).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "retention-boundary", status: "ready" })])
    );
    expect(response.body).not.toContain("raw document content");
    expect(response.body).not.toContain("sk-live-abcdef");
    expect(response.body).not.toContain("apiKey");
    expect(response.body.toLowerCase()).not.toContain("legal opinion");

    await server.close();
  });

  it("returns typed recovery errors for malformed integration policy payloads without echoing unsafe material", async () => {
    const server = Fastify({ logger: false });
    await registerIntegrationPolicyRoutes(server);
    const cases = [
      {
        url: "/api/integrations/object-storage/policy",
        payload: { context: "raw KYC passport data sk-live-abcdef1234567890abcdef1234567890", policy: {} },
        expectedError: "Integration policy context must be a JSON object."
      },
      {
        url: "/api/integrations/document-parser/policy",
        payload: { context: {}, policy: ["private key 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"] },
        expectedError: "Integration policy draft must be a JSON object."
      },
      {
        url: "/api/integrations/chain-anchor/policy",
        payload: { context: "seed phrase abandon abandon abandon", policy: {} },
        expectedError: "Integration policy context must be a JSON object."
      },
      {
        url: "/api/integrations/grc-destination/policy",
        payload: { context: {}, policy: "create an external legal decision ticket" },
        expectedError: "Integration policy draft must be a JSON object."
      }
    ];

    for (const testCase of cases) {
      const response = await server.inject({
        method: "POST",
        url: testCase.url,
        payload: testCase.payload
      });
      const json = JSON.stringify(response.json());

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          code: "INTEGRATION_POLICY_INVALID_PAYLOAD",
          error: testCase.expectedError,
          recoveryAction:
            "Send metadata-only integration context and policy JSON objects without raw documents, credentials, raw KYC, personal data, private keys, wallet secrets, legal conclusions, or external write commands.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(json).not.toContain("sk-live-abcdef");
      expect(json).not.toContain("passport data");
      expect(json).not.toContain("0xabcdef");
      expect(json).not.toContain("seed phrase");
      expect(json).not.toContain("external legal decision");
    }

    await server.close();
  });
});
