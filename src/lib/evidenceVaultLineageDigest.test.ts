import { describe, expect, it } from "vitest";
import {
  createEvidenceVaultLineageDigest,
  exportEvidenceVaultLineageDigestJson
} from "./evidenceVaultLineageDigest";
import type { EvidenceVaultManifest } from "./evidenceVaultManifest";
import type { EvidenceVaultRecord } from "./phase2Types";

describe("createEvidenceVaultLineageDigest", () => {
  it("creates a stable metadata-only lineage digest without source note body text", async () => {
    const records = [replacementRecord(), rejectedParentRecord(), verifiedRecord()];

    const first = await createEvidenceVaultLineageDigest({
      workspaceId: "workspace-lineage",
      records,
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const second = await createEvidenceVaultLineageDigest({
      workspaceId: "workspace-lineage",
      records: [...records].reverse(),
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-02T09:00:00.000Z"
    });

    expect(first.digestHash).toBe(second.digestHash);
    expect(first.statusCounts).toMatchObject({ verified: 1, superseded: 1, received: 1 });
    expect(first.lineageCounts).toEqual({
      activeRecords: 2,
      replacedRecords: 1,
      openRejectedRecords: 0,
      lineageLinkCount: 1,
      linkedControlCount: 2,
      linkedRiskFlagCount: 2
    });
    expect(first.lineageLinks).toEqual([
      expect.objectContaining({
        parentEvidenceId: "evidence-parent",
        replacementEvidenceId: "evidence-replacement",
        replacementReasonHash: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    ]);
    expect(first.nextActions).toEqual(["Keep the active replacement evidence linked to the final Evidence Manifest and Counsel Pack handoff."]);
    expect(first.notLegalAdviceBoundary).toMatch(/Not legal advice/i);

    const json = exportEvidenceVaultLineageDigestJson(first);
    expect(json).toContain("Not legal advice");
    expect(json).not.toContain("Raw source note that should never appear");
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|legal approval/i);
  });

  it("changes the digest hash and recovery actions when rejected evidence has no replacement", async () => {
    const withReplacement = await createEvidenceVaultLineageDigest({
      workspaceId: "workspace-lineage",
      records: [rejectedParentRecord(), replacementRecord()],
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const openRejected = await createEvidenceVaultLineageDigest({
      workspaceId: "workspace-lineage",
      records: [{ ...rejectedParentRecord(), status: "rejected", supersededByEvidenceId: undefined }],
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });

    expect(openRejected.digestHash).not.toBe(withReplacement.digestHash);
    expect(openRejected.lineageCounts.openRejectedRecords).toBe(1);
    expect(openRejected.readinessStatus).toBe("needs-replacement");
    expect(openRejected.nextActions).toContain(
      "Create metadata-only replacement records for rejected evidence before final counsel handoff."
    );
  });

  it("treats missing linked risk and control arrays as empty metadata", async () => {
    const legacyRecord = record({
      id: "legacy-record",
      linkedRiskFlagIds: undefined as unknown as string[],
      linkedControlIds: undefined as unknown as string[]
    });

    const digest = await createEvidenceVaultLineageDigest({
      workspaceId: "workspace-lineage",
      records: [legacyRecord],
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });

    expect(digest.linkedControlIds).toEqual([]);
    expect(digest.linkedRiskFlagIds).toEqual([]);
    expect(digest.lineageCounts.linkedControlCount).toBe(0);
    expect(digest.lineageCounts.linkedRiskFlagCount).toBe(0);
  });
});

function manifest(bundleHash: string): EvidenceVaultManifest {
  return {
    manifestVersion: "lexproof-evidence-vault-manifest-v1",
    workspaceId: "workspace-lineage",
    generatedAt: "2026-07-02T00:00:00.000Z",
    itemCount: 3,
    items: [],
    bundleHash,
    notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
  };
}

function rejectedParentRecord(): EvidenceVaultRecord {
  return record({
    id: "evidence-parent",
    filename: "claims-inventory.md",
    fileHash: "a".repeat(64),
    status: "superseded",
    linkedRiskFlagIds: ["marketing-claims"],
    linkedControlIds: ["control-us-sec-marketing-claim-review"],
    supersededByEvidenceId: "evidence-replacement",
    replacementReason: "Raw source note that should never appear in export body text.",
    version: 1
  });
}

function replacementRecord(): EvidenceVaultRecord {
  return record({
    id: "evidence-replacement",
    filename: "claims-inventory-replacement.md",
    fileHash: "b".repeat(64),
    status: "received",
    linkedRiskFlagIds: ["marketing-claims"],
    linkedControlIds: ["control-us-sec-marketing-claim-review"],
    parentEvidenceId: "evidence-parent",
    replacementReason: "Metadata-only replacement with sanitized claim inventory summary.",
    version: 2
  });
}

function verifiedRecord(): EvidenceVaultRecord {
  return record({
    id: "evidence-verified",
    filename: "custody-controls.md",
    fileHash: "c".repeat(64),
    status: "verified",
    linkedRiskFlagIds: ["asset-custody"],
    linkedControlIds: ["control-sg-mas-custody-safeguards"],
    version: 1
  });
}

function record(overrides: Partial<EvidenceVaultRecord>): EvidenceVaultRecord {
  return {
    recordVersion: "lexproof-evidence-vault-record-v1",
    id: "evidence",
    workspaceId: "workspace-lineage",
    filename: "evidence.md",
    mimeType: "text/markdown",
    byteSize: 128,
    fileHash: "0".repeat(64),
    storageMode: "server-vault",
    status: "received",
    owner: "Compliance",
    sourceNote: "Raw source note that should never appear in lineage digest JSON.",
    version: 1,
    linkedRiskFlagIds: [],
    linkedControlIds: [],
    containsRawKycOrPersonalData: false,
    createdAt: "2026-07-02T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
    ...overrides
  };
}
