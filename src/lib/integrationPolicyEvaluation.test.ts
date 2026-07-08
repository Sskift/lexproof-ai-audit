import { describe, expect, it, vi } from "vitest";
import { createObjectStoragePolicyReport } from "./objectStoragePolicy";
import {
  createIntegrationPolicyEvaluationRecord,
  createIntegrationPolicyEvaluationReceiptBundle,
  createIntegrationPolicyReceiptRecoveryPacket,
  downloadIntegrationPolicyReceiptRecoveryPacketJson,
  exportIntegrationPolicyEvaluationReceiptBundleJson,
  exportIntegrationPolicyReceiptRecoveryPacketJson,
  isIntegrationPolicyEvaluationRecord
} from "./integrationPolicyEvaluation";
import type { IntegrationPolicyEvaluationRecord } from "./integrationPolicyEvaluation";

const report = createObjectStoragePolicyReport({
  context: {
    workspaceId: "workspace-integration-policy",
    evidenceCount: 2,
    retentionStatus: "ready",
    vaultSyncAllowed: true,
    blockerCount: 0,
    manifestHash: "a".repeat(64)
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
    notes: "Ready for future adapter review."
  }
});

describe("integration policy evaluation records", () => {
  it("creates stable metadata-only hashes for the same policy evaluation", async () => {
    const first = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: {
        workspaceId: "workspace-integration-policy",
        blockerCount: 0,
        evidenceCount: 2,
        manifestHash: "a".repeat(64),
        vaultSyncAllowed: true,
        retentionStatus: "ready"
      },
      policy: {
        policyOwner: "Storage owner",
        retentionDays: 365,
        deletionSlaDays: 30,
        lifecyclePolicyApproved: true
      },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T00:00:00.000Z"
    });
    const second = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: {
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        manifestHash: "a".repeat(64),
        evidenceCount: 2,
        blockerCount: 0,
        workspaceId: "workspace-integration-policy"
      },
      policy: {
        lifecyclePolicyApproved: true,
        deletionSlaDays: 30,
        retentionDays: 365,
        policyOwner: "Storage owner"
      },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T00:00:00.000Z"
    });

    expect(first).toEqual(second);
    expect(first).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-integration-policy-evaluation-record-v1",
        id: expect.stringMatching(/^integration-policy-evaluation-[a-f0-9]{16}$/),
        reportHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        contextHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        policyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        externalCapabilityAllowed: false,
        notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
      })
    );
    expect(isIntegrationPolicyEvaluationRecord(first)).toBe(true);
    expect(JSON.stringify(first)).not.toContain("sk-live");
    expect(JSON.stringify(first).toLowerCase()).not.toContain("legal opinion");
  });

  it("changes the policy hash when approved policy metadata changes", async () => {
    const original = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-integration-policy" },
      policy: { retentionDays: 365, apiKey: "sk-live-abcdef1234567890abcdef1234567890" },
      createdAt: "2026-07-03T00:00:00.000Z"
    });
    const changed = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-integration-policy" },
      policy: { retentionDays: 180, apiKey: "sk-live-abcdef1234567890abcdef1234567890" },
      createdAt: "2026-07-03T00:00:00.000Z"
    });

    expect(changed.policyHash).not.toBe(original.policyHash);
    expect(changed.id).not.toBe(original.id);
    expect(JSON.stringify(changed)).not.toContain("sk-live-abcdef");
  });

  it("rejects corrupted policy receipt count metadata instead of trusting impossible control totals", async () => {
    const record = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-integration-policy" },
      policy: { retentionDays: 365 },
      createdAt: "2026-07-03T00:00:00.000Z"
    });

    expect(isIntegrationPolicyEvaluationRecord({ ...record, approvedControlCount: -1 })).toBe(false);
    expect(isIntegrationPolicyEvaluationRecord({ ...record, approvedControlCount: 0.5 })).toBe(false);
    expect(
      isIntegrationPolicyEvaluationRecord({
        ...record,
        approvedControlCount: record.requiredControlCount + 1
      })
    ).toBe(false);
    await expect(
      createIntegrationPolicyEvaluationReceiptBundle({
        workspaceId: "workspace-integration-policy",
        records: [{ ...record, approvedControlCount: record.requiredControlCount + 1 }],
        generatedAt: "2026-07-03T00:02:00.000Z"
      })
    ).rejects.toThrow("Integration policy receipt bundles require valid metadata-only evaluation records.");
  });

  it("rejects missing workspace ids with a clear error", async () => {
    await expect(
      createIntegrationPolicyEvaluationRecord({
        workspaceId: " ",
        policyId: "object-storage",
        report,
        context: {},
        policy: {}
      })
    ).rejects.toThrow("Workspace ID is required for integration policy evaluation records.");
  });

  it("creates a stable metadata-only receipt bundle with missing policy recovery actions", async () => {
    const objectStorageRecord = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-integration-policy", manifestHash: "a".repeat(64) },
      policy: { policyOwner: "Storage owner", retentionDays: 365 },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T00:00:00.000Z"
    });
    const parserRecord: IntegrationPolicyEvaluationRecord = {
      recordVersion: "lexproof-integration-policy-evaluation-record-v1",
      id: "integration-policy-evaluation-parser",
      workspaceId: "workspace-integration-policy",
      policyId: "document-parser",
      reportVersion: "lexproof-document-parser-policy-v1",
      overallStatus: "blocked",
      approvedControlCount: 5,
      requiredControlCount: 9,
      externalCapabilityAllowed: false,
      externalCapabilityStatus: "blocked-by-raw-document-boundary",
      reportHash: "b".repeat(64),
      contextHash: "c".repeat(64),
      policyHash: "d".repeat(64),
      evaluatorId: "Parser owner sk-live-abcdef1234567890abcdef1234567890",
      source: "server",
      createdAt: "2026-07-03T00:01:00.000Z",
      nextActions: [
        "Remove private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa and raw KYC before parser review."
      ],
      notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
    };

    const first = await createIntegrationPolicyEvaluationReceiptBundle({
      workspaceId: "workspace-integration-policy",
      records: [parserRecord, objectStorageRecord],
      generatedAt: "2026-07-03T00:02:00.000Z"
    });
    const second = await createIntegrationPolicyEvaluationReceiptBundle({
      workspaceId: "workspace-integration-policy",
      records: [objectStorageRecord, parserRecord],
      generatedAt: "2026-07-03T00:03:00.000Z"
    });
    const json = exportIntegrationPolicyEvaluationReceiptBundleJson(first);

    expect(first).toEqual(
      expect.objectContaining({
        bundleVersion: "lexproof-integration-policy-evaluation-receipt-bundle-v1",
        workspaceId: "workspace-integration-policy",
        recordCount: 2,
        policyCount: 2,
        missingPolicyIds: ["chain-anchor", "grc-destination"],
        readyCount: 1,
        needsPolicyCount: 0,
        blockedCount: 1,
        externalEnablementAllowed: false,
        notLegalAdviceBoundary: "Not legal advice. Integration policy receipt bundles are audit preparation metadata only."
      })
    );
    expect(first.bundleHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.bundleHash).toBe(second.bundleHash);
    expect(first.records.map((record) => record.policyId)).toEqual(["object-storage", "document-parser"]);
    expect(first.nextActions).toEqual([
      "Evaluate missing server policy receipts before adapter enablement review: Chain Anchor Policy, GRC Destination Policy.",
      "Resolve blocked integration policy receipts before any external adapter enablement review.",
      "Keep external providers, storage, parsers, GRC destinations, and chain writes disabled until a separate enablement review."
    ]);
    expect(first.nextActions.every((action) => action.trim().length > 0)).toBe(true);
    expect(first.records.every((record) => record.nextActions.every((action) => action.trim().length > 0))).toBe(true);
    expect(json).toContain("lexproof-integration-policy-evaluation-receipt-bundle-v1");
    expect(json).toContain("[redacted-credential]");
    expect(json).toContain("[redacted-private-key-or-wallet-material]");
    expect(json).toContain("[redacted-sensitive-material]");
    expect(json).not.toContain("sk-live");
    expect(json).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(json.toLowerCase()).not.toContain("raw kyc");
  });

  it("creates a stable receipt recovery packet for missing, blocked, and stale receipts", async () => {
    const olderObjectStorageRecord = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-integration-policy", manifestHash: "a".repeat(64) },
      policy: { policyOwner: "Storage owner", retentionDays: 365 },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T00:00:00.000Z"
    });
    const latestObjectStorageRecord = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-integration-policy",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-integration-policy", manifestHash: "b".repeat(64) },
      policy: { policyOwner: "Storage owner", retentionDays: 180 },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T00:03:00.000Z"
    });
    const blockedParserRecord: IntegrationPolicyEvaluationRecord = {
      recordVersion: "lexproof-integration-policy-evaluation-record-v1",
      id: "integration-policy-evaluation-parser-blocked",
      workspaceId: "workspace-integration-policy",
      policyId: "document-parser",
      reportVersion: "lexproof-document-parser-policy-v1",
      overallStatus: "blocked",
      approvedControlCount: 2,
      requiredControlCount: 9,
      externalCapabilityAllowed: false,
      externalCapabilityStatus: "blocked-by-metadata",
      reportHash: "c".repeat(64),
      contextHash: "d".repeat(64),
      policyHash: "e".repeat(64),
      evaluatorId: "Parser owner",
      source: "server",
      createdAt: "2026-07-03T00:02:00.000Z",
      nextActions: [
        "Remove private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa and raw KYC before parser review."
      ],
      notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
    };

    const first = await createIntegrationPolicyReceiptRecoveryPacket({
      workspaceId: "workspace-integration-policy",
      records: [olderObjectStorageRecord, latestObjectStorageRecord, blockedParserRecord],
      generatedAt: "2026-07-03T00:04:00.000Z"
    });
    const second = await createIntegrationPolicyReceiptRecoveryPacket({
      workspaceId: "workspace-integration-policy",
      records: [blockedParserRecord, latestObjectStorageRecord, olderObjectStorageRecord],
      generatedAt: "2026-07-03T00:05:00.000Z"
    });
    const json = exportIntegrationPolicyReceiptRecoveryPacketJson(first);

    expect(first).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-integration-policy-receipt-recovery-packet-v1",
        workspaceId: "workspace-integration-policy",
        status: "missing-receipts",
        recordCount: 3,
        policyCount: 2,
        externalEnablementAllowed: false,
        notLegalAdviceBoundary: "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only."
      })
    );
    expect(first.summary).toEqual(
      expect.objectContaining({
        totalRecoveryCount: 4,
        missingPolicyCount: 2,
        blockedCount: 1,
        needsPolicyCount: 0,
        staleReceiptCount: 1,
        readyPolicyCount: 1,
        latestReceiptCount: 2,
        notLegalAdviceBoundary: "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only."
      })
    );
    expect(first.packetHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.packetHash).toBe(second.packetHash);
    expect(first.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          policyId: "chain-anchor",
          recordId: null,
          recoveryStatus: "missing-receipt",
          priority: "P0"
        }),
        expect.objectContaining({
          policyId: "document-parser",
          recordId: "integration-policy-evaluation-parser-blocked",
          recoveryStatus: "blocked",
          priority: "P0"
        }),
        expect.objectContaining({
          policyId: "object-storage",
          recordId: olderObjectStorageRecord.id,
          supersededByRecordId: latestObjectStorageRecord.id,
          recoveryStatus: "stale-receipt",
          priority: "P2"
        }),
        expect.objectContaining({
          policyId: "object-storage",
          recordId: latestObjectStorageRecord.id,
          recoveryStatus: "ready",
          priority: "P2"
        })
      ])
    );
    expect(first.nextActions.every((action) => action.trim().length > 0)).toBe(true);
    expect(json).toContain("lexproof-integration-policy-receipt-recovery-packet-v1");
    expect(json).toContain("[redacted-private-key-or-wallet-material]");
    expect(json).toContain("[redacted-sensitive-material]");
    expect(json).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(json.toLowerCase()).not.toContain("raw kyc");
  });

  it("creates an empty recovery packet that still lists missing integration policy receipts", async () => {
    const packet = await createIntegrationPolicyReceiptRecoveryPacket({
      workspaceId: "workspace-empty-policy",
      records: [],
      generatedAt: "2026-07-03T00:00:00.000Z"
    });

    expect(packet).toEqual(
      expect.objectContaining({
        status: "empty",
        recordCount: 0,
        policyCount: 0,
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    );
    expect(packet.summary).toMatchObject({
      totalRecoveryCount: 4,
      missingPolicyCount: 4,
      latestReceiptCount: 0
    });
    expect(packet.items).toHaveLength(4);
    expect(packet.items.every((item) => item.recoveryStatus === "missing-receipt")).toBe(true);
    expect(packet.nextActions).toEqual([
      "Evaluate object storage, document parser, chain anchor, and GRC destination policies before any adapter enablement review."
    ]);
  });

  it("downloads receipt recovery packet JSON in the browser", async () => {
    const packet = await createIntegrationPolicyReceiptRecoveryPacket({
      workspaceId: "workspace-download-policy",
      records: [],
      generatedAt: "2026-07-03T00:00:00.000Z"
    });
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const createElement = vi.fn(() => ({
      href: "",
      download: "",
      style: { display: "" },
      click,
      remove
    }));
    const createObjectURL = vi.fn(() => "blob:integration-policy-recovery");
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("Blob", Blob);
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("document", { body: { appendChild }, createElement });

    try {
      downloadIntegrationPolicyReceiptRecoveryPacketJson("integration-policy-recovery", packet);

      expect(createElement).toHaveBeenCalledWith("a");
      expect(appendChild).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(remove).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:integration-policy-recovery");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
