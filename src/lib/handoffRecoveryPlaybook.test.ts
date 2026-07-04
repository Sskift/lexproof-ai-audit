import { describe, expect, it } from "vitest";
import type { CounselHandoffChecklist, CounselHandoffChecklistItem } from "./counselHandoffChecklist";
import type { ExportSafetyInventory, ExportSafetyInventoryArtifact } from "./exportSafetyInventory";
import type { JudgeHandoffBundle, JudgeHandoffBundleArtifact } from "./judgeHandoffBundle";
import {
  createHandoffRecoveryPlaybook,
  exportHandoffRecoveryPlaybookJson
} from "./handoffRecoveryPlaybook";

describe("createHandoffRecoveryPlaybook", () => {
  it("creates a stable prioritized recovery playbook without leaking unsafe source text", async () => {
    const first = await createHandoffRecoveryPlaybook({
      workspaceId: "workspace-handoff",
      projectName: "Handoff Desk",
      exportSafetyInventory: exportSafetyInventory({
        boundaryStatus: "blocked",
        boundaryBlockerCount: 1,
        artifacts: [
          exportArtifact({
            id: "counsel-pack-version",
            label: "Counsel Pack Version JSON",
            category: "counsel-export",
            status: "needs-action",
            available: false,
            recoveryAction: "Save a Counsel Pack version before external handoff."
          }),
          exportArtifact({
            id: "model-gateway-evaluation",
            label: "Model Gateway Evaluation JSON",
            category: "model-governance",
            status: "needs-review",
            warnings: ["Model Gateway output still needs Human Review before export reliance."],
            recoveryAction: "Route Model Gateway Evaluation through Human Review before relying on model output."
          })
        ],
        nextActions: ["Counsel Pack Version JSON: Save a Counsel Pack version before external handoff."]
      }),
      judgeHandoffBundle: judgeHandoffBundle({
        artifacts: [
          judgeArtifact({
            id: "counsel-handoff-checklist",
            label: "Counsel Handoff Checklist JSON",
            status: "blocked",
            recoveryAction: "Resolve rejected or returned Human Review items before final handoff."
          })
        ]
      }),
      counselHandoffChecklist: counselHandoffChecklist({
        items: [
          checklistItem({
            id: "manifest-drift-report",
            label: "Manifest Drift Guard",
            status: "needs-action",
            recoveryAction: "Save a fresh Counsel Pack version before external counsel or judge handoff."
          }),
          checklistItem({
            id: "human-review-workflow",
            label: "Human Review Workflow",
            status: "blocked",
            evidence: "Rejected review item included private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.",
            recoveryAction: "Resolve rejected or returned Human Review items before final handoff."
          })
        ]
      }),
      generatedAt: "2026-07-05T00:00:00.000Z"
    });
    const second = await createHandoffRecoveryPlaybook({
      workspaceId: "workspace-handoff",
      projectName: "Handoff Desk",
      exportSafetyInventory: exportSafetyInventory({
        boundaryStatus: "blocked",
        boundaryBlockerCount: 1,
        artifacts: [
          exportArtifact({
            id: "model-gateway-evaluation",
            label: "Model Gateway Evaluation JSON",
            category: "model-governance",
            status: "needs-review",
            warnings: ["Model Gateway output still needs Human Review before export reliance."],
            recoveryAction: "Route Model Gateway Evaluation through Human Review before relying on model output."
          }),
          exportArtifact({
            id: "counsel-pack-version",
            label: "Counsel Pack Version JSON",
            category: "counsel-export",
            status: "needs-action",
            available: false,
            recoveryAction: "Save a Counsel Pack version before external handoff."
          })
        ],
        nextActions: ["Counsel Pack Version JSON: Save a Counsel Pack version before external handoff."]
      }),
      judgeHandoffBundle: judgeHandoffBundle({
        artifacts: [
          judgeArtifact({
            id: "counsel-handoff-checklist",
            label: "Counsel Handoff Checklist JSON",
            status: "blocked",
            recoveryAction: "Resolve rejected or returned Human Review items before final handoff."
          })
        ]
      }),
      counselHandoffChecklist: counselHandoffChecklist({
        items: [
          checklistItem({
            id: "human-review-workflow",
            label: "Human Review Workflow",
            status: "blocked",
            evidence: "Rejected review item included private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.",
            recoveryAction: "Resolve rejected or returned Human Review items before final handoff."
          }),
          checklistItem({
            id: "manifest-drift-report",
            label: "Manifest Drift Guard",
            status: "needs-action",
            recoveryAction: "Save a fresh Counsel Pack version before external counsel or judge handoff."
          })
        ]
      }),
      generatedAt: "2026-07-05T01:00:00.000Z"
    });
    const json = exportHandoffRecoveryPlaybookJson(first);

    expect(first).toEqual(
      expect.objectContaining({
        playbookVersion: "lexproof-handoff-recovery-playbook-v1",
        workspaceId: "workspace-handoff",
        projectName: "Handoff Desk",
        status: "blocked",
        exportHandoffAllowed: false,
        notLegalAdviceBoundary: "Not legal advice. Handoff Recovery Playbooks are audit preparation workflow metadata only."
      })
    );
    expect(first.playbookHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.playbookHash).toBe(second.playbookHash);
    expect(first.steps[0]).toEqual(
      expect.objectContaining({
        id: "export-boundary-blockers",
        severity: "blocked",
        targetSurface: "evidence",
        source: "export-safety-inventory"
      })
    );
    expect(first.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceArtifactId: "counsel-pack-version",
          targetSurface: "counsel",
          severity: "needs-action"
        }),
        expect.objectContaining({
          sourceArtifactId: "model-gateway-evaluation",
          targetSurface: "ai",
          severity: "needs-review"
        }),
        expect.objectContaining({
          sourceArtifactId: "manifest-drift-report",
          targetSurface: "evidence",
          severity: "needs-action"
        })
      ])
    );
    expect(first.steps.filter((step) => step.recoveryAction === "Resolve rejected or returned Human Review items before final handoff.")).toHaveLength(1);
    expect(json).toContain("Not legal advice");
    expect(json).not.toMatch(/private key 0x|raw KYC|legal opinion|final legal decision/i);
    expect(json).toContain("[redacted-private-key]");
  });

  it("marks the playbook ready when export, judge, and counsel artifacts are all ready", async () => {
    const playbook = await createHandoffRecoveryPlaybook({
      workspaceId: "workspace-ready",
      projectName: "Ready Handoff",
      exportSafetyInventory: exportSafetyInventory({ overallStatus: "ready", exportHandoffAllowed: true, artifacts: [] }),
      judgeHandoffBundle: judgeHandoffBundle({ exportHandoffAllowed: true, artifacts: [] }),
      counselHandoffChecklist: counselHandoffChecklist({ overallStatus: "ready", handoffAllowed: true, items: [] }),
      generatedAt: "2026-07-05T00:00:00.000Z"
    });

    expect(playbook.status).toBe("ready");
    expect(playbook.exportHandoffAllowed).toBe(true);
    expect(playbook.stepCount).toBe(0);
    expect(playbook.nextActions).toEqual([
      "Handoff recovery is clear; keep the playbook with the final metadata-only export packet."
    ]);
  });

  it("returns a calculating playbook while Sources handoff artifacts are not available", async () => {
    const playbook = await createHandoffRecoveryPlaybook({
      workspaceId: "workspace-calculating",
      projectName: "Calculating Handoff",
      exportSafetyInventory: null,
      judgeHandoffBundle: null,
      counselHandoffChecklist: null,
      generatedAt: "2026-07-05T00:00:00.000Z"
    });

    expect(playbook.status).toBe("calculating");
    expect(playbook.exportHandoffAllowed).toBe(false);
    expect(playbook.steps).toEqual([
      expect.objectContaining({
        id: "sources-artifacts-calculating",
        targetSurface: "sources",
        recoveryAction: "Keep Sources open until the handoff recovery playbook receives current artifact hashes."
      })
    ]);
  });
});

function exportSafetyInventory(overrides: Partial<ExportSafetyInventory> = {}): ExportSafetyInventory {
  return {
    inventoryVersion: "lexproof-export-safety-inventory-v1",
    workspaceId: "workspace-handoff",
    projectName: "Handoff Desk",
    generatedAt: "2026-07-05T00:00:00.000Z",
    inventoryHash: "a".repeat(64),
    overallStatus: "needs-action",
    exportHandoffAllowed: false,
    artifactCount: overrides.artifacts?.length ?? 0,
    readyCount: 0,
    needsReviewCount: 0,
    missingRequiredCount: 0,
    blockedCount: 0,
    boundaryStatus: "clean",
    boundaryBlockerCount: 0,
    boundaryWarningCount: 0,
    detectedClasses: [],
    artifacts: [],
    blockers: [],
    nextActions: [],
    notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only.",
    ...overrides
  };
}

function exportArtifact(overrides: Partial<ExportSafetyInventoryArtifact> = {}): ExportSafetyInventoryArtifact {
  return {
    id: "evidence-manifest",
    label: "Evidence Manifest JSON",
    category: "evidence",
    exportMode: "metadata-only-json",
    status: "ready",
    required: true,
    available: true,
    artifactHash: "b".repeat(64),
    metadataOnly: true,
    rawContentIncluded: false,
    blockers: [],
    warnings: [],
    recoveryAction: "Keep the artifact with the final handoff packet.",
    notLegalAdviceBoundary: "Not legal advice. Evidence manifests are audit preparation hash metadata only.",
    ...overrides
  };
}

function judgeHandoffBundle(overrides: Partial<JudgeHandoffBundle> = {}): JudgeHandoffBundle {
  return {
    bundleVersion: "lexproof-judge-handoff-bundle-v1",
    projectName: "Handoff Desk",
    generatedAt: "2026-07-05T00:00:00.000Z",
    bundleHash: "c".repeat(64),
    exportHandoffAllowed: false,
    artifactCount: overrides.artifacts?.length ?? 0,
    readyCount: 0,
    needsReviewCount: 0,
    missingCount: 0,
    blockedCount: 0,
    artifacts: [],
    nextActions: [],
    notLegalAdviceBoundary: "Not legal advice. Judge handoff bundles are audit preparation metadata only.",
    ...overrides
  };
}

function judgeArtifact(overrides: Partial<JudgeHandoffBundleArtifact> = {}): JudgeHandoffBundleArtifact {
  return {
    id: "export-safety-inventory",
    label: "Export Safety Inventory JSON",
    status: "ready",
    artifactHash: "d".repeat(64),
    recoveryAction: "Keep exports metadata-only and re-run inventory before external sharing.",
    sourceSurface: "Sources",
    notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only.",
    ...overrides
  };
}

function counselHandoffChecklist(overrides: Partial<CounselHandoffChecklist> = {}): CounselHandoffChecklist {
  return {
    checklistVersion: "lexproof-counsel-handoff-checklist-v1",
    projectId: "workspace-handoff",
    projectName: "Handoff Desk",
    generatedAt: "2026-07-05T00:00:00.000Z",
    checklistHash: "e".repeat(64),
    overallStatus: "needs-action",
    handoffAllowed: false,
    itemCount: overrides.items?.length ?? 0,
    readyCount: 0,
    needsReviewCount: 0,
    needsActionCount: 0,
    blockedCount: 0,
    items: [],
    blockers: [],
    nextActions: [],
    notLegalAdviceBoundary: "Not legal advice. Counsel handoff checklists are audit preparation workflow metadata only.",
    ...overrides
  };
}

function checklistItem(overrides: Partial<CounselHandoffChecklistItem> = {}): CounselHandoffChecklistItem {
  return {
    id: "counsel-pack-version",
    label: "Counsel Pack Version",
    status: "ready",
    required: true,
    evidence: "Version 1 is current.",
    artifactHash: "f".repeat(64),
    blockerCount: 0,
    warningCount: 0,
    recoveryAction: "Keep this version record with the final handoff packet.",
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only.",
    ...overrides
  };
}
