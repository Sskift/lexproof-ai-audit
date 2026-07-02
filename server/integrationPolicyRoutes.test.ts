import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerIntegrationPolicyRoutes } from "./integrationPolicyRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

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
            "Send metadata-only integration context and policy JSON objects without raw documents, credentials, [redacted-raw-kyc], personal data, private keys, wallet secrets, legal conclusions, or external write commands.",
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

  it("persists workspace policy evaluation receipts and audit log records without storing unsafe payload material", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerIntegrationPolicyRoutes(server, { repository });

    const response = await server.inject({
      method: "POST",
      url: "/api/integrations/grc-destination/policy",
      payload: {
        actorId: "GRC owner",
        context: {
          workspaceId: "workspace-policy-receipts",
          remediationItemCount: 4,
          exportSafetyStatus: "clean",
          exportBlockerCount: 0,
          integrationAdapterStatus: "ready",
          localTicketExportAvailable: true,
          rawTicketBody: "raw ticket body should never be stored"
        },
        policy: {
          policyOwner: "GRC owner",
          destinationSystem: "jira",
          destinationQueue: "LEGAL-AUDIT",
          fieldMappingApproved: true,
          authenticationPolicyApproved: true,
          redactionPolicyApproved: true,
          ticketOwnershipApproved: true,
          retryAndAuditLoggingApproved: true,
          noSensitiveMaterialConfirmed: true,
          humanReviewRequired: true,
          notes: "Ready for future destination adapter review.",
          webhookSecret: "sk-live-abcdef1234567890abcdef1234567890"
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-grc-destination-policy-v1",
        overallStatus: "ready",
        externalGrcTicketCreationAllowed: false,
        evaluationRecord: expect.objectContaining({
          recordVersion: "lexproof-integration-policy-evaluation-record-v1",
          workspaceId: "workspace-policy-receipts",
          policyId: "grc-destination",
          reportHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          contextHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          policyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          externalCapabilityAllowed: false,
          notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
        })
      })
    );
    expect(response.body).not.toContain("raw ticket body should never be stored");
    expect(response.body).not.toContain("webhookSecret");
    expect(response.body).not.toContain("sk-live-abcdef");

    const listResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-policy-receipts/integration-policy-evaluations"
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([
      expect.objectContaining({
        id: response.json().evaluationRecord.id,
        policyId: "grc-destination",
        overallStatus: "ready"
      })
    ]);
    expect(listResponse.body).not.toContain("raw ticket body");
    expect(listResponse.body).not.toContain("sk-live-abcdef");

    expect(await repository.listAuditLogRecords("workspace-policy-receipts")).toEqual([
      expect.objectContaining({
        action: "integration-policy.evaluated",
        targetType: "integration-policy",
        targetId: response.json().evaluationRecord.id,
        summary: "Evaluated grc-destination integration policy as audit preparation metadata."
      })
    ]);

    await server.close();
  });
});
