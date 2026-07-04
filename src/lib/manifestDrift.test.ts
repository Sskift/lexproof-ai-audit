import { describe, expect, it } from "vitest";
import type { CounselPackVersionRecord } from "./counselPackVersions";
import type { EvidenceManifest } from "./evidenceManifest";
import {
  createManifestDriftReport,
  exportManifestDriftReportJson
} from "./manifestDrift";
import type { CounselPackExportRecord } from "./phase2Types";

describe("createManifestDriftReport", () => {
  it("creates a stable metadata-only report hash for the same manifest and export targets", async () => {
    const manifest = evidenceManifest("a".repeat(64), ["1".repeat(64), "2".repeat(64)]);
    const version = counselPackVersion(manifest.bundleHash);
    const serverExport = serverExportRecord(manifest.bundleHash);
    const vaultRecords = manifest.items.map((item, index) => vaultRecord(item.contentHash, `vault-${index + 1}`));

    const first = await createManifestDriftReport({
      projectId: "workspace-1",
      manifest,
      latestCounselPackVersion: version,
      latestServerExportRecord: serverExport,
      vaultManifest: { bundleHash: "v".repeat(64), itemCount: 2 },
      vaultRecords,
      generatedAt: "2026-07-05T00:00:00.000Z"
    });
    const second = await createManifestDriftReport({
      projectId: "workspace-1",
      manifest,
      latestCounselPackVersion: version,
      latestServerExportRecord: serverExport,
      vaultManifest: { bundleHash: "v".repeat(64), itemCount: 2 },
      vaultRecords,
      generatedAt: "2026-07-05T00:05:00.000Z"
    });

    expect(first.status).toBe("ready");
    expect(first.freshCount).toBe(3);
    expect(first.reportHash).toBe(second.reportHash);
    expect(first.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(exportManifestDriftReportJson(first)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks saved Counsel Pack and server export records stale when the current manifest hash changes", async () => {
    const currentManifest = evidenceManifest("b".repeat(64), ["3".repeat(64)]);
    const oldManifestHash = "a".repeat(64);

    const report = await createManifestDriftReport({
      projectId: "workspace-1",
      manifest: currentManifest,
      latestCounselPackVersion: counselPackVersion(oldManifestHash),
      latestServerExportRecord: serverExportRecord(oldManifestHash),
      vaultRecords: [vaultRecord(currentManifest.items[0].contentHash)]
    });

    expect(report.status).toBe("needs-review");
    expect(report.staleCount).toBe(2);
    expect(report.targets.find((target) => target.id === "counsel-pack-version")).toEqual(
      expect.objectContaining({
        status: "stale",
        currentHash: currentManifest.bundleHash,
        recordedHash: oldManifestHash,
        recoveryAction: "Save a fresh Counsel Pack version before external counsel or judge handoff."
      })
    );
    expect(report.targets.find((target) => target.id === "server-export-record")?.recoveryAction).toContain(
      "Create a new metadata-only server export record"
    );
  });

  it("detects stale Evidence Vault metadata from local content hashes without exporting source note bodies", async () => {
    const currentManifest = evidenceManifest("c".repeat(64), ["4".repeat(64), "5".repeat(64)]);
    const staleVaultHash = "9".repeat(64);

    const report = await createManifestDriftReport({
      projectId: "workspace-1",
      manifest: currentManifest,
      latestCounselPackVersion: counselPackVersion(currentManifest.bundleHash),
      latestServerExportRecord: serverExportRecord(currentManifest.bundleHash),
      vaultManifest: { bundleHash: "v".repeat(64), itemCount: 1 },
      vaultRecords: [
        {
          status: "received",
          fileHash: "filehash",
          sourceNote: `Metadata-only sync. Local content SHA-256: ${staleVaultHash}. Raw internal note that must stay out.`
        }
      ]
    });
    const vaultTarget = report.targets.find((target) => target.id === "evidence-vault-sync");
    const exported = exportManifestDriftReportJson(report);

    expect(report.status).toBe("needs-review");
    expect(vaultTarget).toEqual(
      expect.objectContaining({
        status: "stale",
        matchedItemCount: 0,
        missingCurrentHashCount: 2,
        extraRecordedHashCount: 1,
        recoveryAction: "Sync Evidence Vault metadata again so vault lineage reflects the current ledger."
      })
    );
    expect(exported).toContain("lexproof-manifest-drift-report-v1");
    expect(exported).toContain("Not legal advice");
    expect(exported).not.toContain("Raw internal note");
  });
});

function evidenceManifest(bundleHash: string, itemHashes: string[]): EvidenceManifest {
  return {
    manifestVersion: "lexproof-manifest-v1",
    generatedAt: "2026-07-05T00:00:00.000Z",
    projectId: "workspace-1",
    projectName: "Workspace",
    riskLevel: "moderate",
    riskScore: 40,
    itemCount: itemHashes.length,
    items: itemHashes.map((hash, index) => ({
      sequence: index + 1,
      label: `Evidence ${index + 1}`,
      kind: "Markdown",
      source: "Synthetic source",
      status: "verified",
      owner: "Compliance",
      contentHash: hash
    })),
    bundleHash
  };
}

function counselPackVersion(manifestHash: string): CounselPackVersionRecord {
  return {
    recordVersion: "lexproof-counsel-pack-version-v1",
    id: "counsel-version-1",
    projectId: "workspace-1",
    projectName: "Workspace",
    version: 1,
    title: "Workspace Counsel Pack v1",
    manifestHash,
    markdownHash: "d".repeat(64),
    markdownSize: 120,
    riskLevel: "moderate",
    reviewSummary: { total: 1, reviewed: 1, readyForCounsel: 0, needsEvidence: 0, blocked: 0, open: 0 },
    reviewStatuses: [],
    sourcePack: [],
    exportedAt: "2026-07-05T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
  };
}

function serverExportRecord(manifestHash: string): CounselPackExportRecord {
  return {
    recordVersion: "lexproof-counsel-pack-export-record-v1",
    id: "server-export-1",
    workspaceId: "workspace-1",
    exportType: "counsel-pack",
    artifactName: "workspace-counsel-pack-v1.md",
    projectName: "Workspace",
    version: 1,
    title: "Workspace Counsel Pack v1",
    format: "markdown",
    status: "ready",
    manifestHash,
    artifactHash: "e".repeat(64),
    artifactSize: 120,
    riskLevel: "moderate",
    sourcePackHash: "f".repeat(64),
    sourceCount: 0,
    sourceReviewStatus: "current",
    reviewSummary: { total: 1, reviewed: 1, readyForCounsel: 0, needsEvidence: 0, blocked: 0, open: 0 },
    createdAt: "2026-07-05T00:00:00.000Z",
    createdBy: "Compliance",
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
  };
}

function vaultRecord(hash: string, id = "vault-1") {
  return {
    status: "received",
    fileHash: `${id}-file-hash`,
    sourceNote: `Metadata-only sync. Local content SHA-256: ${hash}. Raw evidence content excluded.`
  };
}
