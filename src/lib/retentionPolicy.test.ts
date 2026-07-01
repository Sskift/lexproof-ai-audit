import { describe, expect, it } from "vitest";
import {
  createRetentionPolicyReport,
  exportRetentionPolicyJson,
  type RetentionPolicyInput
} from "./retentionPolicy";
import type { EvidenceItem } from "./projectModel";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const walletAddress = "0x1111111111111111111111111111111111111111";

describe("createRetentionPolicyReport", () => {
  it("blocks vault sync when evidence includes private keys, credentials, or raw KYC without leaking raw values", () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          id: "unsafe-retention",
          label: "Unsafe retention packet",
          kind: "Text",
          source: "raw KYC room",
          content: `Developer pasted private key ${privateKey}, API key ${apiKey}, and raw KYC packet.`,
          status: "draft",
          owner: "Engineering"
        }
      ])
    );

    expect(report.status).toBe("blocked");
    expect(report.vaultSyncAllowed).toBe(false);
    expect(report.blockerCount).toBeGreaterThanOrEqual(3);
    expect(report.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceLabel: "Unsafe retention packet",
          action: "block-vault-sync",
          severity: "block"
        })
      ])
    );
    expect(JSON.stringify(report)).not.toContain(privateKey);
    expect(JSON.stringify(report)).not.toContain(apiKey);
    expect(JSON.stringify(report)).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("keeps local file metadata evidence ready without raw file retention", () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          id: "local-file",
          label: "launch-approval.pdf",
          kind: "Local file metadata",
          source: "local file: launch-approval.pdf",
          content:
            "File name: launch-approval.pdf\nFile size: 2048 bytes\nFile type: application/pdf\nFile SHA-256: " +
            "b".repeat(64) +
            "\nRaw file content is not stored in LexProof.",
          status: "received",
          owner: "Compliance"
        }
      ])
    );

    expect(report.status).toBe("ready");
    expect(report.vaultSyncAllowed).toBe(true);
    expect(report.reviewCount).toBe(0);
    expect(report.actions[0]).toMatchObject({
      action: "keep-metadata-only",
      severity: "info",
      retentionWindow: "metadata-only until audit workspace deletion"
    });
    expect(report.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("requires human review for personal-data references but allows metadata-only sync", () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          label: "Privacy retention note",
          kind: "Markdown",
          content: "Mentions passport number handling and personal data categories without raw values.",
          status: "received",
          owner: "Compliance"
        }
      ])
    );

    expect(report.status).toBe("needs-review");
    expect(report.vaultSyncAllowed).toBe(true);
    expect(report.reviewCount).toBeGreaterThanOrEqual(1);
    expect(report.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "review-before-vault-sync",
          severity: "warn"
        })
      ])
    );
  });

  it("uses shared classification warnings for wallet addresses and direct identifiers before vault sync", () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          label: "Wallet signer memo",
          kind: "Markdown",
          content: `Treasury signer wallet ${walletAddress} and contact jane.founder@example.com require review before handoff.`,
          status: "received",
          owner: "Compliance"
        }
      ])
    );

    expect(report.status).toBe("needs-review");
    expect(report.vaultSyncAllowed).toBe(true);
    expect(report.reviewCount).toBe(2);
    expect(report.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dataClass: "wallet-address",
          action: "review-before-vault-sync",
          severity: "warn",
          redactedSnippet: expect.stringContaining("[redacted-wallet-address]")
        }),
        expect.objectContaining({
          dataClass: "personal-data",
          action: "review-before-vault-sync",
          severity: "warn",
          redactedSnippet: expect.stringContaining("[redacted-email]")
        })
      ])
    );
    expect(report.nextSteps).toContain(
      "Confirm wallet-address, personal-data, KYC, or confidentiality references are metadata-only before sync."
    );
    expect(JSON.stringify(report)).not.toContain(walletAddress);
    expect(JSON.stringify(report)).not.toContain("jane.founder@example.com");
  });
});

describe("exportRetentionPolicyJson", () => {
  it("exports retention readiness JSON without raw secrets", () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          label: "Unsafe retention packet",
          kind: "Text",
          content: `Do not retain API key ${apiKey} or private key ${privateKey}.`,
          status: "draft",
          owner: "Engineering"
        }
      ])
    );

    const json = exportRetentionPolicyJson(report);

    expect(json).toContain("lexproof-retention-policy-v1");
    expect(json).toContain("Not legal advice");
    expect(json).toContain("block-vault-sync");
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });
});

function withInput(evidenceItems: EvidenceItem[]): RetentionPolicyInput {
  return {
    workspaceId: "workspace-retention",
    evidenceItems
  };
}
