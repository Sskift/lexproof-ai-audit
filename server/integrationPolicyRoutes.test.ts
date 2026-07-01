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
});
