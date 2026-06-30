import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createEvidenceVaultRecordFromUpload,
  findDuplicateEvidenceVaultRecord,
  supersedeEvidenceVaultRecord
} from "./evidenceVaultService";

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
      status: "received",
      owner: "Compliance",
      sourceNote: "Board approval memo for counsel review.",
      version: 1,
      linkedRiskFlagIds: ["governance"],
      containsRawKycOrPersonalData: false,
      parentEvidenceId: undefined,
      supersededByEvidenceId: undefined,
      replacementReason: undefined,
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

  it("links replacement records to a rejected parent without hiding the superseded record", () => {
    const original = createEvidenceVaultRecordFromUpload({
      workspaceId: "workspace-1",
      filename: "approval-memo-v1.txt",
      mimeType: "text/plain",
      bytes: new TextEncoder().encode("board approval memo v1"),
      owner: "Compliance",
      sourceNote: "Original memo.",
      linkedRiskFlagIds: ["governance"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-29T10:00:00.000Z"
    });
    const rejected = { ...original, status: "rejected" as const, version: 2 };
    const replacement = createEvidenceVaultRecordFromUpload({
      workspaceId: "workspace-1",
      filename: "approval-memo-v2.txt",
      mimeType: "text/plain",
      bytes: new TextEncoder().encode("board approval memo v2 with remediation"),
      owner: "Compliance",
      sourceNote: "Replacement memo.",
      linkedRiskFlagIds: ["governance"],
      containsRawKycOrPersonalData: false,
      parentEvidenceId: rejected.id,
      replacementReason: "Reviewer rejected the first memo as incomplete.",
      baseVersion: rejected.version,
      createdAt: "2026-06-29T11:00:00.000Z"
    });

    const superseded = supersedeEvidenceVaultRecord(rejected, replacement, "Reviewer rejected the first memo as incomplete.");

    expect(replacement).toEqual(
      expect.objectContaining({
        status: "received",
        parentEvidenceId: rejected.id,
        replacementReason: "Reviewer rejected the first memo as incomplete.",
        version: 3
      })
    );
    expect(superseded).toEqual(
      expect.objectContaining({
        id: rejected.id,
        status: "superseded",
        supersededByEvidenceId: replacement.id,
        replacementReason: "Reviewer rejected the first memo as incomplete.",
        version: 3
      })
    );
    expect(JSON.stringify(replacement)).not.toContain("board approval memo v2 with remediation");
  });

  it("detects active duplicate evidence hashes before a second vault record is stored", () => {
    const existing = createEvidenceVaultRecordFromUpload({
      workspaceId: "workspace-1",
      filename: "approval-memo.txt",
      mimeType: "text/plain",
      bytes: new TextEncoder().encode("same memo"),
      owner: "Compliance",
      sourceNote: "Existing memo.",
      linkedRiskFlagIds: ["governance"],
      containsRawKycOrPersonalData: false
    });
    const duplicate = createEvidenceVaultRecordFromUpload({
      workspaceId: "workspace-1",
      filename: "approval-memo-copy.txt",
      mimeType: "text/plain",
      bytes: new TextEncoder().encode("same memo"),
      owner: "Compliance",
      sourceNote: "Duplicate memo.",
      linkedRiskFlagIds: ["governance"],
      containsRawKycOrPersonalData: false
    });

    expect(findDuplicateEvidenceVaultRecord([existing], duplicate)).toEqual(existing);
    expect(findDuplicateEvidenceVaultRecord([{ ...existing, status: "superseded" }], duplicate)).toBeNull();
  });
});
