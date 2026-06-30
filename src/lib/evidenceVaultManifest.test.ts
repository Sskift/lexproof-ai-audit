import { describe, expect, it } from "vitest";
import type { EvidenceVaultRecord } from "./phase2Types";
import { createEvidenceVaultManifest, exportEvidenceVaultManifestJson } from "./evidenceVaultManifest";

describe("createEvidenceVaultManifest", () => {
  it("creates a deterministic metadata-only manifest for persisted Evidence Vault records", async () => {
    const records = [record({ id: "evidence-a", sourceNote: "Synthetic memo contents should not be exported." })];

    const first = await createEvidenceVaultManifest({ workspaceId: "workspace-vault-manifest", records });
    const second = await createEvidenceVaultManifest({ workspaceId: "workspace-vault-manifest", records });

    expect(first).toEqual(
      expect.objectContaining({
        manifestVersion: "lexproof-evidence-vault-manifest-v1",
        workspaceId: "workspace-vault-manifest",
        itemCount: 1,
        bundleHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
      })
    );
    expect(first.items[0]).toEqual({
      sequence: 1,
      evidenceId: "evidence-a",
      filename: "approval-memo.txt",
      mimeType: "text/plain",
      byteSize: 19,
      fileHash: "a".repeat(64),
      storageMode: "server-vault",
      status: "received",
      owner: "Compliance",
      version: 1,
      linkedRiskFlagIds: ["governance"],
      containsRawKycOrPersonalData: false
    });
    expect(second.bundleHash).toBe(first.bundleHash);

    const json = exportEvidenceVaultManifestJson(first);
    expect(json).toContain("\"bundleHash\"");
    expect(json).not.toContain("Synthetic memo contents");
    expect(json).not.toContain("raw KYC");
  });

  it("changes the bundle hash when review status, version, or lineage metadata changes", async () => {
    const original = await createEvidenceVaultManifest({
      workspaceId: "workspace-vault-manifest",
      records: [record({ id: "evidence-a", status: "received", version: 1 })]
    });
    const reviewed = await createEvidenceVaultManifest({
      workspaceId: "workspace-vault-manifest",
      records: [
        record({
          id: "evidence-a",
          status: "verified",
          version: 2,
          parentEvidenceId: "parent-a",
          replacementReason: "Reviewer requested narrower approval scope."
        })
      ]
    });

    expect(reviewed.items[0]).toEqual(
      expect.objectContaining({
        status: "verified",
        version: 2,
        parentEvidenceId: "parent-a",
        replacementReason: "Reviewer requested narrower approval scope."
      })
    );
    expect(reviewed.bundleHash).not.toBe(original.bundleHash);
  });

  it("uses a stable record order so repository ordering does not alter the bundle hash", async () => {
    const records = [
      record({ id: "evidence-b", filename: "b.txt", fileHash: "b".repeat(64), createdAt: "2026-06-30T02:00:00.000Z" }),
      record({ id: "evidence-a", filename: "a.txt", fileHash: "a".repeat(64), createdAt: "2026-06-30T01:00:00.000Z" })
    ];

    const first = await createEvidenceVaultManifest({ workspaceId: "workspace-vault-manifest", records });
    const second = await createEvidenceVaultManifest({ workspaceId: "workspace-vault-manifest", records: [...records].reverse() });

    expect(first.items.map((item) => item.evidenceId)).toEqual(["evidence-a", "evidence-b"]);
    expect(second.items.map((item) => item.evidenceId)).toEqual(["evidence-a", "evidence-b"]);
    expect(second.bundleHash).toBe(first.bundleHash);
  });
});

function record(overrides: Partial<EvidenceVaultRecord> = {}): EvidenceVaultRecord {
  return {
    recordVersion: "lexproof-evidence-vault-record-v1",
    id: "evidence-a",
    workspaceId: "workspace-vault-manifest",
    filename: "approval-memo.txt",
    mimeType: "text/plain",
    byteSize: 19,
    fileHash: "a".repeat(64),
    storageMode: "server-vault",
    status: "received",
    owner: "Compliance",
    sourceNote: "Metadata-only source note.",
    version: 1,
    linkedRiskFlagIds: ["governance"],
    containsRawKycOrPersonalData: false,
    createdAt: "2026-06-30T00:00:00.000Z",
    updatedAt: "2026-06-30T00:00:00.000Z",
    ...overrides
  };
}
