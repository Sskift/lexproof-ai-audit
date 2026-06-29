import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createEvidenceVaultRecordFromUpload } from "./evidenceVaultService";

describe("Phase 2 evidence vault service", () => {
  it("creates metadata-only evidence records with server-side SHA-256 hashes", () => {
    const bytes = new TextEncoder().encode("board approval memo");
    const record = createEvidenceVaultRecordFromUpload({
      workspaceId: "workspace-1",
      filename: "approval-memo.txt",
      mimeType: "text/plain",
      bytes,
      owner: "Compliance",
      sourceNote: "Board approval memo for counsel review.",
      linkedRiskFlagIds: ["governance"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-29T10:00:00.000Z"
    });

    expect(record).toEqual({
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: "evidence-vault-c9a300de7aadae3b",
      workspaceId: "workspace-1",
      filename: "approval-memo.txt",
      mimeType: "text/plain",
      byteSize: bytes.byteLength,
      fileHash: createHash("sha256").update(bytes).digest("hex"),
      storageMode: "server-vault",
      status: "submitted",
      owner: "Compliance",
      sourceNote: "Board approval memo for counsel review.",
      version: 1,
      linkedRiskFlagIds: ["governance"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    });
    expect(JSON.stringify(record)).not.toContain("board approval memo");
  });

  it("blocks raw KYC or personal data before creating evidence vault records", () => {
    expect(() =>
      createEvidenceVaultRecordFromUpload({
        workspaceId: "workspace-1",
        filename: "passport.pdf",
        mimeType: "application/pdf",
        bytes: new Uint8Array([1, 2, 3]),
        owner: "Founder",
        sourceNote: "Passport scan",
        linkedRiskFlagIds: ["kyc"],
        containsRawKycOrPersonalData: true,
        createdAt: "2026-06-29T10:00:00.000Z"
      })
    ).toThrow("Raw KYC or personal data cannot be accepted in the Phase 2 evidence upload draft.");
  });
});
