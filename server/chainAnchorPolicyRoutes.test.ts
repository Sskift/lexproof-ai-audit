import { describe, expect, it } from "vitest";
import { buildServer } from "./app";

describe("chain anchor policy route", () => {
  it("evaluates anchor policy readiness without accepting wallet secrets or enabling chain writes", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/integrations/chain-anchor/policy",
      payload: {
        context: {
          workspaceId: "workspace-anchor",
          evidenceCount: 2,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          exportBlockerCount: 0,
          manifestHash: "d".repeat(64),
          counselPackVersionCount: 1,
          simulatedAnchorAvailable: true,
          rawEvidenceBody: "raw evidence should be ignored"
        },
        policy: {
          policyOwner: "Web3 operations",
          targetNetwork: "ethereum-sepolia",
          walletCustodyModel: "Multisig policy wallet",
          signerRole: "Compliance reviewer",
          transactionLoggingApproved: true,
          privacyReviewApproved: true,
          publicPayloadLimitedApproved: true,
          userConsentApproved: true,
          noRawEvidenceOnChainConfirmed: true,
          humanReviewRequired: true,
          notes: "Metadata-only anchor policy.",
          privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          signedTransaction: "0xf86c should be ignored",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890"
        }
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    const json = JSON.stringify(body);

    expect(body).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-chain-anchor-policy-v1",
        overallStatus: "ready",
        externalChainAnchoringAllowed: false,
        externalChainAnchoringStatus: "policy-ready-not-enabled",
        anchorMode: "simulated-only",
        notLegalAdviceBoundary: "Not legal advice. Chain anchor policy is audit preparation metadata only."
      })
    );
    expect(json).not.toContain("raw evidence should be ignored");
    expect(json).not.toContain("0x1234567890abcdef");
    expect(json).not.toContain("0xf86c");
    expect(json).not.toContain("sk-live-abcdef");

    await server.close();
  });
});
