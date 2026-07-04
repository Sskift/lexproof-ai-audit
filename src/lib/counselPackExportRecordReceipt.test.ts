import { describe, expect, it, vi } from "vitest";
import {
  createCounselPackExportRecordReceipt,
  downloadCounselPackExportRecordReceiptJson,
  exportCounselPackExportRecordReceiptJson,
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
      recoveryAction: "Resolve blocked or evidence-needed counsel review items before external handoff."
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
        projectName: `Issuer ${apiKey}`,
        title: `Counsel Pack ${privateKey}`,
        artifactName: `artifact-${apiKey}.md`,
        createdBy: `Reviewer ${privateKey}`
      })
    );
    const json = exportCounselPackExportRecordReceiptJson(receipt);

    expect(json).toContain("lexproof-counsel-pack-export-record-receipt-v1");
    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain("# Counsel Pack");
  });

  it("exports and downloads receipt JSON", async () => {
    const receipt = await createCounselPackExportRecordReceipt(createRecord({ reviewSummary: cleanReviewSummary() }));
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
