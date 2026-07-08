import { describe, expect, it, vi } from "vitest";
import {
  createEvidenceVaultLineageRecoveryPacket,
  downloadEvidenceVaultLineageRecoveryPacketJson,
  exportEvidenceVaultLineageRecoveryPacketJson,
  type EvidenceVaultLineageRecoveryPacket
} from "./evidenceVaultLineageRecoveryPacket";
import type { EvidenceVaultManifest } from "./evidenceVaultManifest";
import type { EvidenceVaultRecord } from "./phase2Types";

describe("createEvidenceVaultLineageRecoveryPacket", () => {
  it("creates a stable metadata-only recovery packet for open rejected vault evidence", async () => {
    const records = [verifiedRecord(), openRejectedRecord()];
    const first = await createEvidenceVaultLineageRecoveryPacket({
      workspaceId: "workspace-lineage-recovery",
      records,
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-03T01:00:00.000Z"
    });
    const second = await createEvidenceVaultLineageRecoveryPacket({
      workspaceId: "workspace-lineage-recovery",
      records: [...records].reverse(),
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-03T09:00:00.000Z"
    });

    expect(first.packetHash).toBe(second.packetHash);
    expect(first).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-evidence-vault-lineage-recovery-packet-v1",
        workspaceId: "workspace-lineage-recovery",
        status: "needs-replacement",
        lineageDigestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        manifestHash: "manifest-a",
        summary: expect.objectContaining({
          totalRecoveryCount: 1,
          openRejectedCount: 1,
          missingManifestCount: 0,
          activeRecordCount: 1,
          lineageLinkCount: 0,
          nextAction: "Create metadata-only replacement records for rejected vault evidence before final counsel handoff.",
          notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only."
        }),
        nextActions: ["Create metadata-only replacement records for rejected vault evidence before final counsel handoff."],
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only."
      })
    );
    expect(first.items).toEqual([
      {
        itemVersion: "lexproof-evidence-vault-lineage-recovery-item-v1",
        evidenceId: "evidence-rejected",
        filename: "rejected-custody-summary.metadata.json",
        evidenceStatus: "rejected",
        version: 3,
        fileHash: "b".repeat(64),
        linkedRiskFlagIds: ["custody"],
        linkedControlIds: ["control-sg-mas-dpt-customer-asset-safeguards"],
        recoveryStatus: "needs-replacement",
        priority: "P0",
        recoveryAction: "Create metadata-only replacement evidence for this rejected vault record before final counsel handoff.",
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery items are audit preparation metadata only."
      }
    ]);

    const json = exportEvidenceVaultLineageRecoveryPacketJson(first);
    expect(json).toContain("Not legal advice");
    expect(json).not.toContain("Raw source note that should never appear");
    expect(json).not.toContain("Raw replacement reason that should never appear");
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|legal approval/i);
  });

  it("surfaces manifest recovery when lineage exists without a manifest hash", async () => {
    const packet = await createEvidenceVaultLineageRecoveryPacket({
      workspaceId: "workspace-lineage-recovery",
      records: [verifiedRecord()],
      manifest: null,
      generatedAt: "2026-07-03T01:00:00.000Z"
    });

    expect(packet.status).toBe("needs-manifest");
    expect(packet.manifestHash).toBeNull();
    expect(packet.summary).toEqual(
      expect.objectContaining({
        totalRecoveryCount: 1,
        openRejectedCount: 0,
        missingManifestCount: 1,
        nextAction: "Refresh the Evidence Vault Manifest so lineage metadata is tied to a stable bundle hash."
      })
    );
    expect(packet.items).toEqual([
      expect.objectContaining({
        evidenceId: "evidence-vault-manifest",
        evidenceStatus: "manifest-missing",
        recoveryStatus: "needs-manifest",
        priority: "P1",
        linkedRiskFlagIds: ["marketing-claims"],
        linkedControlIds: ["control-us-ftc-endorsement-advertising-guides"]
      })
    ]);
  });

  it("marks empty and ready packets without inventing recovery records", async () => {
    const empty = await createEvidenceVaultLineageRecoveryPacket({
      workspaceId: "workspace-lineage-recovery",
      records: [],
      manifest: null,
      generatedAt: "2026-07-03T01:00:00.000Z"
    });
    const ready = await createEvidenceVaultLineageRecoveryPacket({
      workspaceId: "workspace-lineage-recovery",
      records: [verifiedRecord()],
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-03T01:00:00.000Z"
    });

    expect(empty.status).toBe("empty");
    expect(empty.items).toEqual([]);
    expect(empty.nextActions).toEqual(["Add metadata-only evidence records, then sync the Evidence Vault before counsel handoff."]);
    expect(ready.status).toBe("ready");
    expect(ready.items).toEqual([]);
    expect(ready.nextActions).toEqual([
      "Keep the Evidence Vault lineage recovery packet with the final manifest and Counsel Pack handoff."
    ]);
  });
});

describe("downloadEvidenceVaultLineageRecoveryPacketJson", () => {
  it("downloads a metadata-only JSON packet when browser APIs are available", async () => {
    const packet = await createEvidenceVaultLineageRecoveryPacket({
      workspaceId: "workspace-lineage-recovery",
      records: [openRejectedRecord()],
      manifest: manifest("manifest-a"),
      generatedAt: "2026-07-03T01:00:00.000Z"
    });
    const createObjectURL = vi.fn(() => "blob:lineage-recovery");
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    const createElement = vi.fn(() => ({ href: "", download: "", click }));
    const blob = vi.fn();

    vi.stubGlobal("Blob", blob);
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("document", { createElement });

    downloadEvidenceVaultLineageRecoveryPacketJson("lineage-recovery.json", packet);

    expect(blob).toHaveBeenCalledWith([exportEvidenceVaultLineageRecoveryPacketJson(packet)], {
      type: "application/json;charset=utf-8"
    });
    expect(createElement).toHaveBeenCalledWith("a");
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:lineage-recovery");

    vi.unstubAllGlobals();
  });
});

function manifest(bundleHash: string): EvidenceVaultManifest {
  return {
    manifestVersion: "lexproof-evidence-vault-manifest-v1",
    workspaceId: "workspace-lineage-recovery",
    generatedAt: "2026-07-03T00:00:00.000Z",
    itemCount: 1,
    items: [],
    bundleHash,
    notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
  };
}

function verifiedRecord(): EvidenceVaultRecord {
  return record({
    id: "evidence-verified",
    filename: "claims-review.metadata.json",
    fileHash: "a".repeat(64),
    status: "verified",
    linkedRiskFlagIds: ["marketing-claims"],
    linkedControlIds: ["control-us-ftc-endorsement-advertising-guides"],
    version: 2
  });
}

function openRejectedRecord(): EvidenceVaultRecord {
  return record({
    id: "evidence-rejected",
    filename: "rejected-custody-summary.metadata.json",
    fileHash: "b".repeat(64),
    status: "rejected",
    sourceNote: "Raw source note that should never appear in recovery packet JSON.",
    replacementReason: "Raw replacement reason that should never appear in recovery packet JSON.",
    linkedRiskFlagIds: ["custody"],
    linkedControlIds: ["control-sg-mas-dpt-customer-asset-safeguards"],
    version: 3
  });
}

function record(overrides: Partial<EvidenceVaultRecord>): EvidenceVaultRecord {
  return {
    recordVersion: "lexproof-evidence-vault-record-v1",
    id: "evidence",
    workspaceId: "workspace-lineage-recovery",
    filename: "evidence.metadata.json",
    mimeType: "application/json",
    byteSize: 128,
    fileHash: "0".repeat(64),
    storageMode: "server-vault",
    status: "received",
    owner: "Compliance",
    sourceNote: "Metadata summary.",
    version: 1,
    linkedRiskFlagIds: [],
    linkedControlIds: [],
    containsRawKycOrPersonalData: false,
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-03T00:00:00.000Z",
    ...overrides
  };
}
