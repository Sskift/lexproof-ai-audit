import { describe, expect, it } from "vitest";
import { createChainAnchorPolicyReport, exportChainAnchorPolicyJson } from "./chainAnchorPolicy";

describe("chain anchor policy", () => {
  it("evaluates required anchor controls without enabling external chain writes", () => {
    const report = createChainAnchorPolicyReport({
      context: {
        workspaceId: "workspace-anchor",
        evidenceCount: 2,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        exportBlockerCount: 0,
        manifestHash: "a".repeat(64),
        counselPackVersionCount: 1,
        simulatedAnchorAvailable: true
      },
      policy: {
        policyOwner: "Web3 operations",
        targetNetwork: "ethereum-sepolia",
        walletCustodyModel: "Multisig policy wallet controlled by compliance operations.",
        signerRole: "Compliance reviewer",
        transactionLoggingApproved: true,
        privacyReviewApproved: true,
        publicPayloadLimitedApproved: true,
        userConsentApproved: true,
        noRawEvidenceOnChainConfirmed: true,
        humanReviewRequired: true,
        notes: "Synthetic chain anchor policy metadata only."
      }
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-chain-anchor-policy-v1",
        overallStatus: "ready",
        externalChainAnchoringAllowed: false,
        externalChainAnchoringStatus: "policy-ready-not-enabled",
        anchorMode: "simulated-only",
        notLegalAdviceBoundary: "Not legal advice. Chain anchor policy is audit preparation metadata only."
      })
    );
    expect(report.requiredControlCount).toBe(10);
    expect(report.approvedControlCount).toBe(10);
    expect(report.nextActions).toContain(
      "Keep chain anchoring simulated until a separate wallet signing and transaction enablement review."
    );
    expect(report.controls.every((control) => control.status === "ready")).toBe(true);
    expect(exportChainAnchorPolicyJson(report)).toContain("lexproof-chain-anchor-policy-v1");
  });

  it("blocks unsafe anchor policy metadata without leaking private keys, credentials, raw KYC, or real-write instructions", () => {
    const report = createChainAnchorPolicyReport({
      context: {
        workspaceId: "workspace-anchor",
        evidenceCount: 1,
        retentionStatus: "blocked",
        vaultSyncAllowed: false,
        blockerCount: 1,
        exportBlockerCount: 1,
        manifestHash: "b".repeat(64),
        counselPackVersionCount: 0,
        simulatedAnchorAvailable: true
      },
      policy: {
        policyOwner: "sk-live-abcdef1234567890abcdef1234567890",
        targetNetwork: "mainnet",
        walletCustodyModel: "Private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        signerRole: "Submit a real chain write with raw KYC passport data.",
        transactionLoggingApproved: true,
        privacyReviewApproved: true,
        publicPayloadLimitedApproved: true,
        userConsentApproved: true,
        noRawEvidenceOnChainConfirmed: true,
        humanReviewRequired: true,
        notes: "Broadcast signed transaction now."
      }
    });

    const json = JSON.stringify(report);

    expect(report.overallStatus).toBe("blocked");
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "metadata-boundary", status: "blocked" })]));
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "retention-boundary", status: "blocked" })]));
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("0x1234567890abcdef");
    expect(json).not.toContain("passport data");
    expect(json.toLowerCase()).not.toContain("signed transaction");
  });

  it("blocks direct personal identifiers in anchor policy metadata before external chain review", () => {
    const report = createChainAnchorPolicyReport({
      context: {
        workspaceId: "workspace-anchor",
        evidenceCount: 2,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        exportBlockerCount: 0,
        manifestHash: "c".repeat(64),
        counselPackVersionCount: 1,
        simulatedAnchorAvailable: true
      },
      policy: {
        policyOwner: "Anchor owner jane.reviewer@example.com",
        targetNetwork: "ethereum-sepolia",
        walletCustodyModel: "Multisig policy wallet controlled by compliance operations.",
        signerRole: "Compliance reviewer",
        transactionLoggingApproved: true,
        privacyReviewApproved: true,
        publicPayloadLimitedApproved: true,
        userConsentApproved: true,
        noRawEvidenceOnChainConfirmed: true,
        humanReviewRequired: true,
        notes: "Escalate signing exceptions by phone +1 415 555 0100 before anchor adapter review."
      }
    });

    const json = JSON.stringify(report);

    expect(report.overallStatus).toBe("blocked");
    expect(report.externalChainAnchoringStatus).toBe("blocked-by-metadata");
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "metadata-boundary", status: "blocked" })]));
    expect(json).not.toContain("jane.reviewer@example.com");
    expect(json).not.toContain("+1 415 555 0100");
    expect(report.notLegalAdviceBoundary).toContain("Not legal advice");
  });
});
