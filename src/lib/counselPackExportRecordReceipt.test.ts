import { describe, expect, it, vi } from "vitest";
import {
  createCounselPackExportRecoveryPacket,
  createCounselPackExportRecordReceipt,
  downloadCounselPackExportRecoveryPacketJson,
  downloadCounselPackExportRecordReceiptJson,
  exportCounselPackExportRecoveryPacketJson,
  exportCounselPackExportRecordReceiptJson,
  type CounselPackExportRecoveryPacket,
  type CounselPackExportRecordReceipt
} from "./counselPackExportRecordReceipt";
import type { CounselPackExportRecord } from "./phase2Types";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("counsel pack export record receipt", () => {
  it("creates a metadata-only receipt with a stable receipt hash", async () => {
    const first = await createCounselPackExportRecordReceipt(createRecord(), {
      exportedAt: "2026-07-04T00:00:00.000Z"
    });
    const second = await createCounselPackExportRecordReceipt(createRecord(), {
      exportedAt: "2026-07-04T00:01:00.000Z"
    });

    expect(first).toMatchObject({
      receiptVersion: "lexproof-counsel-pack-export-record-receipt-v1",
      exportRecordId: "counsel-pack-export-receipt",
      workspaceId: "workspace-receipt",
      exportType: "counsel-pack",
      format: "markdown",
      status: "ready",
      version: 2,
      riskLevel: "high",
      hashes: {
        manifestHash: "a".repeat(64),
        artifactHash: "b".repeat(64),
        sourcePackHash: "c".repeat(64)
      },
      jurisdictionReadinessDigest: expect.objectContaining({
        digestHash: "d".repeat(64),
        status: "needs-evidence",
        handoffAllowed: false
      }),
      recoveryAction: "Resolve jurisdiction readiness blockers before external handoff."
    } satisfies Partial<CounselPackExportRecordReceipt>);
    expect(first.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(first.receiptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.receiptHash).toBe(second.receiptHash);
    expect(first.exportedAt).not.toBe(second.exportedAt);
  });

  it("changes the receipt hash when export record hashes change", async () => {
    const first = await createCounselPackExportRecordReceipt(createRecord({ artifactHash: "b".repeat(64) }));
    const second = await createCounselPackExportRecordReceipt(createRecord({ artifactHash: "d".repeat(64) }));

    expect(first.receiptHash).not.toBe(second.receiptHash);
  });

  it("redacts unsafe text before JSON export", async () => {
    const receipt = await createCounselPackExportRecordReceipt(
      createRecord({
        projectName: `Issuer apiKey=${apiKey} legal conclusion`,
        title: `Counsel Pack raw_KYC passport A1234567 ${privateKey}`,
        artifactName: `artifact-final legal decision-${apiKey}.md`,
        createdBy: `Reviewer ${privateKey} passport data`
      })
    );
    const json = exportCounselPackExportRecordReceiptJson(receipt);

    expect(json).toContain("lexproof-counsel-pack-export-record-receipt-v1");
    expect(json).toContain("[redacted-secret]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).toContain("[redacted-raw-kyc]");
    expect(json).toContain("[redacted-legal-conclusion]");
    expect(json).toContain("[redacted-identity-document]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toMatch(/apiKey|raw_KYC|A1234567|legal conclusion|final legal decision|passport data/i);
    expect(json).not.toContain("# Counsel Pack");
  });

  it("exports and downloads receipt JSON", async () => {
    const receipt = await createCounselPackExportRecordReceipt(
      createRecord({ reviewSummary: cleanReviewSummary(), jurisdictionReadinessDigest: cleanJurisdictionReadinessDigest() })
    );
    const json = exportCounselPackExportRecordReceiptJson(receipt);

    expect(json).toContain("\"receiptVersion\": \"lexproof-counsel-pack-export-record-receipt-v1\"");
    expect(json).toContain("\"receiptHash\"");
    expect(json).toContain("Keep this metadata-only receipt");
    expect(json).toContain("Not legal advice");

    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:counsel-pack-export-record-receipt");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadCounselPackExportRecordReceiptJson("counsel-pack-export-record-receipt.json", receipt);
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:counsel-pack-export-record-receipt");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("creates a stable metadata-only recovery packet across export records", async () => {
    const blockedRecord = createRecord({
      id: `counsel-pack-export-blocked-apiKey=${apiKey}`,
      version: 1,
      artifactName: `blocked-raw_KYC passport A1234567 legal conclusion.md`,
      createdAt: "2026-07-04T00:00:00.000Z",
      reviewSummary: {
        total: 4,
        reviewed: 2,
        readyForCounsel: 1,
        needsEvidence: 1,
        blocked: 1,
        open: 2
      }
    });
    const sourceReviewRecord = createRecord({
      id: "counsel-pack-export-source-review",
      version: 2,
      artifactName: "source-review final legal decision.md",
      createdAt: "2026-07-05T00:00:00.000Z",
      reviewSummary: cleanReviewSummary(),
      jurisdictionReadinessDigest: cleanJurisdictionReadinessDigest(),
      sourceReviewStatus: "review-due"
    });
    const readyRecord = createRecord({
      id: "counsel-pack-export-ready raw_KYC passport A1234567",
      version: 3,
      artifactName: "ready.md",
      createdAt: "2026-07-06T00:00:00.000Z",
      reviewSummary: cleanReviewSummary(),
      jurisdictionReadinessDigest: cleanJurisdictionReadinessDigest()
    });

    const first = await createCounselPackExportRecoveryPacket("workspace-receipt", [readyRecord, sourceReviewRecord, blockedRecord], {
      generatedAt: "2026-07-07T00:00:00.000Z"
    });
    const second = await createCounselPackExportRecoveryPacket("workspace-receipt", [blockedRecord, readyRecord, sourceReviewRecord], {
      generatedAt: "2026-07-07T00:01:00.000Z"
    });
    const json = exportCounselPackExportRecoveryPacketJson(first);

    expect(first).toMatchObject({
      packetVersion: "lexproof-counsel-pack-export-recovery-packet-v1",
      workspaceId: "workspace-receipt",
      recordCount: 3,
      recoveryItemCount: 2,
      blockedCount: 1,
      needsSourceReviewCount: 1,
      needsReviewCount: 0,
      readyCount: 1,
      latestExportRecordId: expect.stringContaining("[redacted-raw-kyc]"),
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack export recovery packets are audit preparation metadata only."
    } satisfies Partial<CounselPackExportRecoveryPacket>);
    expect(first.items.map((item) => item.recoveryStatus)).toEqual(["blocked", "needs-source-review", "ready"]);
    expect(first.items[0]).toEqual(
      expect.objectContaining({
        priority: "P0",
        recoveryAction: "Resolve blocked counsel review items before export recovery can clear."
      })
    );
    expect(first.items[1]).toEqual(
      expect.objectContaining({
        priority: "P1",
        recoveryAction: "Refresh source review metadata before final external handoff."
      })
    );
    expect(first.nextActions).toEqual([
      "Resolve blocked counsel review items before export recovery can clear.",
      "Refresh source review metadata before final external handoff."
    ]);
    expect(first.nextActions.every((action) => action.trim().length > 0)).toBe(true);
    expect(first.packetHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.packetHash).toBe(second.packetHash);
    expect(first.generatedAt).not.toBe(second.generatedAt);
    expect(json).toContain("[redacted-secret]");
    expect(json).toContain("[redacted-raw-kyc]");
    expect(json).toContain("[redacted-legal-conclusion]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toMatch(/apiKey|raw_KYC|A1234567|legal conclusion|final legal decision/i);
    expect(json).not.toContain("# Counsel Pack");
  });

  it("exports and downloads recovery packet JSON", async () => {
    const packet = await createCounselPackExportRecoveryPacket("workspace-receipt", [
      createRecord({ reviewSummary: cleanReviewSummary(), jurisdictionReadinessDigest: cleanJurisdictionReadinessDigest() })
    ]);
    const json = exportCounselPackExportRecoveryPacketJson(packet);

    expect(json).toContain("\"packetVersion\": \"lexproof-counsel-pack-export-recovery-packet-v1\"");
    expect(json).toContain("\"packetHash\"");
    expect(json).toContain("Keep the latest metadata-only export receipt");
    expect(json).toContain("Not legal advice");

    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:counsel-pack-export-recovery-packet");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadCounselPackExportRecoveryPacketJson("counsel-pack-export-recovery-packet.json", packet);
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:counsel-pack-export-recovery-packet");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });
});

function createRecord(overrides: Partial<CounselPackExportRecord> = {}): CounselPackExportRecord {
  return {
    recordVersion: "lexproof-counsel-pack-export-record-v1",
    id: "counsel-pack-export-receipt",
    workspaceId: "workspace-receipt",
    exportType: "counsel-pack",
    format: "markdown",
    version: 2,
    projectName: "Receipt Desk",
    title: "Receipt Desk Counsel Pack v2",
    artifactName: "receipt-desk-counsel-pack-v2.md",
    manifestHash: "a".repeat(64),
    artifactHash: "b".repeat(64),
    artifactSize: 2048,
    riskLevel: "high",
    reviewSummary: {
      total: 3,
      reviewed: 1,
      readyForCounsel: 1,
      needsEvidence: 1,
      blocked: 0,
      open: 2
    },
    sourceCount: 6,
    sourcePackHash: "c".repeat(64),
    sourceReviewStatus: "current",
    jurisdictionReadinessDigest: {
      digestHash: "d".repeat(64),
      status: "needs-evidence",
      handoffAllowed: false,
      jurisdictionCount: 2,
      readyForCounselCount: 0,
      needsEvidenceCount: 2,
      needsSourceReviewCount: 0,
      metadataMissingCount: 0,
      openEvidenceRequestCount: 8,
      sourceFreshnessBlockerCount: 1,
      dueSoonSourceCount: 0,
      notLegalAdviceBoundary:
        "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
    },
    createdBy: "Compliance",
    status: "ready",
    createdAt: "2026-07-04T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only.",
    ...overrides
  };
}

function cleanReviewSummary(): CounselPackExportRecord["reviewSummary"] {
  return {
    total: 3,
    reviewed: 3,
    readyForCounsel: 0,
    needsEvidence: 0,
    blocked: 0,
    open: 0
  };
}

function cleanJurisdictionReadinessDigest(): NonNullable<CounselPackExportRecord["jurisdictionReadinessDigest"]> {
  return {
    digestHash: "e".repeat(64),
    status: "ready-for-counsel",
    handoffAllowed: true,
    jurisdictionCount: 2,
    readyForCounselCount: 2,
    needsEvidenceCount: 0,
    needsSourceReviewCount: 0,
    metadataMissingCount: 0,
    openEvidenceRequestCount: 0,
    sourceFreshnessBlockerCount: 0,
    dueSoonSourceCount: 0,
    notLegalAdviceBoundary:
      "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
  };
}
