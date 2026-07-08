import { describe, expect, it, vi } from "vitest";
import { fetchChainAnchorPolicyReport } from "./chainAnchorPolicyClient";
import type { ChainAnchorPolicyContext, ChainAnchorPolicyReport } from "./chainAnchorPolicy";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const readyReport: ChainAnchorPolicyReport = {
  reportVersion: "lexproof-chain-anchor-policy-v1",
  generatedAt: "2026-07-01T00:00:00.000Z",
  overallStatus: "ready",
  requiredControlCount: 10,
  approvedControlCount: 10,
  externalChainAnchoringAllowed: false,
  externalChainAnchoringStatus: "policy-ready-not-enabled",
  anchorMode: "simulated-only",
  controls: [
    {
      id: "manifest-linkage",
      label: "Manifest linkage",
      status: "ready",
      evidence: "Manifest hash is available for simulated anchor review.",
      recoveryAction: "Keep chain writes disabled until wallet signing review."
    }
  ],
  nextActions: ["Keep chain anchoring simulated until a separate wallet signing and transaction enablement review."],
  notLegalAdviceBoundary: "Not legal advice. Chain anchor policy is audit preparation metadata only."
};

describe("chain anchor policy client", () => {
  it("posts anchor policy metadata without sending wallet secrets, raw evidence, or signed transactions", async () => {
    const contextWithUnsafeExtras: ChainAnchorPolicyContext & { rawEvidenceBody: string } = {
      workspaceId: "workspace-anchor",
      evidenceCount: 2,
      retentionStatus: "ready",
      vaultSyncAllowed: true,
      blockerCount: 0,
      exportBlockerCount: 0,
      manifestHash: "c".repeat(64),
      counselPackVersionCount: 1,
      simulatedAnchorAvailable: true,
      rawEvidenceBody: "raw evidence should not be posted"
    };
    const policyWithUnsafeExtras = {
      policyOwner: "Web3 owner",
      targetNetwork: "ethereum-sepolia",
      walletCustodyModel: "Multisig policy wallet",
      signerRole: "Compliance reviewer",
      transactionLoggingApproved: true,
      privacyReviewApproved: true,
      publicPayloadLimitedApproved: true,
      userConsentApproved: true,
      noRawEvidenceOnChainConfirmed: true,
      humanReviewRequired: true,
      notes: "Prepared for future chain anchor adapter review.",
      privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      signedTransaction: "0xf86c...",
      apiKey: "sk-live-abcdef1234567890abcdef1234567890"
    };
    const fetcherMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> => ({
      ok: true,
      json: async () => readyReport
    }) as Response);

    const report = await fetchChainAnchorPolicyReport({
      apiBaseUrl: "https://api.lexproof.test/",
      fetcher: fetcherMock as unknown as typeof fetch,
      context: contextWithUnsafeExtras,
      policy: policyWithUnsafeExtras
    });

    expect(report).toBe(readyReport);
    expect(fetcherMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetcherMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/integrations/chain-anchor/policy");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
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
        policyOwner: "Web3 owner",
        targetNetwork: "ethereum-sepolia",
        walletCustodyModel: "Multisig policy wallet",
        signerRole: "Compliance reviewer",
        transactionLoggingApproved: true,
        privacyReviewApproved: true,
        publicPayloadLimitedApproved: true,
        userConsentApproved: true,
        noRawEvidenceOnChainConfirmed: true,
        humanReviewRequired: true,
        notes: "Prepared for future chain anchor adapter review."
      }
    });
    expect(String(init?.body)).not.toContain("rawEvidenceBody");
    expect(String(init?.body)).not.toContain("privateKey");
    expect(String(init?.body)).not.toContain("signedTransaction");
    expect(String(init?.body)).not.toContain("apiKey");
    expect(String(init?.body)).not.toContain("sk-");
    expect(String(init?.body)).not.toContain("0x1234567890abcdef");
  });

  it("rejects malformed anchor policy responses before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...readyReport, externalChainAnchoringAllowed: true })
    })) as unknown as typeof fetch;

    await expect(
      fetchChainAnchorPolicyReport({
        apiBaseUrl: "https://api.lexproof.test",
        fetcher,
        context: {
          workspaceId: "workspace-anchor",
          evidenceCount: 1,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          exportBlockerCount: 0,
          manifestHash: "c".repeat(64),
          counselPackVersionCount: 1,
          simulatedAnchorAvailable: true
        },
        policy: {
          policyOwner: "Web3 owner",
          targetNetwork: "ethereum-sepolia",
          walletCustodyModel: "Multisig policy wallet",
          signerRole: "Compliance reviewer",
          transactionLoggingApproved: true,
          privacyReviewApproved: true,
          publicPayloadLimitedApproved: true,
          userConsentApproved: true,
          noRawEvidenceOnChainConfirmed: true,
          humanReviewRequired: true,
          notes: ""
        }
      })
    ).rejects.toMatchObject({
      code: "CHAIN_ANCHOR_POLICY_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning the metadata-only chain anchor policy contract."
    });
  });

  it("rejects anchor policy responses with blank next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...readyReport,
        nextActions: ["Keep chain anchoring simulated until a separate wallet signing and transaction enablement review.", "   "]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchChainAnchorPolicyReport({
        apiBaseUrl: "https://api.lexproof.test",
        fetcher,
        context: {
          workspaceId: "workspace-anchor",
          evidenceCount: 1,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          exportBlockerCount: 0,
          manifestHash: "c".repeat(64),
          counselPackVersionCount: 1,
          simulatedAnchorAvailable: true
        },
        policy: {
          policyOwner: "Web3 owner",
          targetNetwork: "ethereum-sepolia",
          walletCustodyModel: "Multisig policy wallet",
          signerRole: "Compliance reviewer",
          transactionLoggingApproved: true,
          privacyReviewApproved: true,
          publicPayloadLimitedApproved: true,
          userConsentApproved: true,
          noRawEvidenceOnChainConfirmed: true,
          humanReviewRequired: true,
          notes: ""
        }
      })
    ).rejects.toMatchObject({
      code: "CHAIN_ANCHOR_POLICY_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning the metadata-only chain anchor policy contract."
    });
  });

  it("redacts classified text from otherwise valid anchor policy responses before UI use", async () => {
    const pollutedReport: ChainAnchorPolicyReport = {
      ...readyReport,
      controls: [
        {
          ...readyReport.controls[0],
          label: `Manifest linkage ${apiKey}`,
          evidence: `Anchor evidence copied raw KYC packet and apiKey=${apiKey} before a final legal decision.`,
          recoveryAction: `Remove private key ${privateKey} and passport data before anchor review.`
        }
      ],
      nextActions: [`Resolve apiKey=${apiKey}, raw KYC packet, and legal approval before simulated anchor review.`]
    };
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => pollutedReport
    })) as unknown as typeof fetch;

    const report = await fetchChainAnchorPolicyReport({
      apiBaseUrl: "https://api.lexproof.test",
      fetcher,
      context: {
        workspaceId: "workspace-anchor",
        evidenceCount: 1,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        exportBlockerCount: 0,
        manifestHash: "c".repeat(64),
        counselPackVersionCount: 1,
        simulatedAnchorAvailable: true
      },
      policy: {
        policyOwner: "Web3 owner",
        targetNetwork: "ethereum-sepolia",
        walletCustodyModel: "Multisig policy wallet",
        signerRole: "Compliance reviewer",
        transactionLoggingApproved: true,
        privacyReviewApproved: true,
        publicPayloadLimitedApproved: true,
        userConsentApproved: true,
        noRawEvidenceOnChainConfirmed: true,
        humanReviewRequired: true,
        notes: ""
      }
    });
    const serialized = JSON.stringify(report);

    expect(report).not.toBe(pollutedReport);
    expect(report.controls[0].evidence).toContain("[redacted-raw-kyc]");
    expect(report.nextActions[0]).toContain("[redacted-legal-conclusion]");
    expect(serialized).toContain("[redacted-api-key]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/raw KYC packet|passport data|final legal decision|legal approval/i);
  });
});
