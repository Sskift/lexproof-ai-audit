import { describe, expect, it } from "vitest";
import { createDataBoundaryReport } from "./dataBoundary";
import {
  createExportSafetyInventory,
  createDemoRunbookExportArtifact,
  createSourceFreshnessBoardExportArtifact,
  exportSafetyInventoryJson,
  type ExportSafetyArtifactInput
} from "./exportSafetyInventory";
import type { EvidenceItem, ProjectProfile } from "./projectModel";
import type { SourceFreshnessBoard } from "./sourceFreshnessBoard";

describe("createExportSafetyInventory", () => {
  it("creates a stable ready inventory hash for available safe export artifacts", async () => {
    const first = await createExportSafetyInventory({
      workspaceId: "workspace-export-safe",
      projectName: "Export Safe Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: safeArtifacts(),
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const second = await createExportSafetyInventory({
      workspaceId: "workspace-export-safe",
      projectName: "Export Safe Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: safeArtifacts().reverse(),
      generatedAt: "2026-07-01T02:00:00.000Z"
    });

    expect(first.inventoryHash).toBe(second.inventoryHash);
    expect(first.inventoryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toEqual(
      expect.objectContaining({
        inventoryVersion: "lexproof-export-safety-inventory-v1",
        overallStatus: "ready",
        exportHandoffAllowed: true,
        artifactCount: 4,
        readyCount: 4,
        notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only."
      })
    );
    expect(first.artifacts.map((artifact) => artifact.id)).toEqual([
      "counsel-pack-version",
      "evidence-manifest",
      "integration-dossier",
      "submission-pack"
    ]);
  });

  it("blocks all handoff artifacts when the data boundary has hard blockers without leaking unsafe text", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const unsafeBoundary = createDataBoundaryReport({
      project: baseProject({
        evidenceItems: [
          {
            id: "unsafe-export-evidence",
            label: "Unsafe export evidence",
            kind: "Text",
            content: `Contains ${apiKey}, private key ${privateKey}, and raw KYC packet.`,
            source: "Synthetic unsafe export",
            status: "received",
            owner: "Compliance"
          }
        ]
      }),
      evidenceItems: [
        {
          id: "unsafe-export-evidence",
          label: "Unsafe export evidence",
          kind: "Text",
          content: `Contains ${apiKey}, private key ${privateKey}, and raw KYC packet.`,
          source: "Synthetic unsafe export",
          status: "received",
          owner: "Compliance"
        }
      ],
      counselQuestions: [],
      counselReviews: [],
      aiEvents: []
    });

    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-export-blocked",
      projectName: "Blocked Export Desk",
      dataBoundaryReport: unsafeBoundary,
      artifacts: safeArtifacts(),
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const json = exportSafetyInventoryJson(inventory);

    expect(inventory.overallStatus).toBe("blocked");
    expect(inventory.exportHandoffAllowed).toBe(false);
    expect(inventory.blockedCount).toBe(4);
    expect(inventory.artifacts.every((artifact) => artifact.status === "blocked")).toBe(true);
    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain("raw KYC packet");
    expect(json).toContain("Not legal advice");
  });

  it("marks required missing artifacts as needs-action with clear recovery", async () => {
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-export-missing",
      projectName: "Missing Export Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [
        ...safeArtifacts(),
        {
          id: "regulatory-source-pack",
          label: "Regulatory Source Pack JSON",
          category: "source-lineage",
          exportMode: "metadata-only-json",
          required: true,
          available: false,
          rawContentIncluded: false,
          metadataOnly: true,
          recoveryAction: "Open Counsel Pack after source graph calculation completes.",
          notLegalAdviceBoundary: "Not legal advice. Source packs are audit preparation source-lineage metadata only."
        }
      ],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    expect(inventory.overallStatus).toBe("needs-action");
    expect(inventory.exportHandoffAllowed).toBe(false);
    expect(inventory.missingRequiredCount).toBe(1);
    expect(inventory.nextActions).toEqual(
      expect.arrayContaining(["Regulatory Source Pack JSON: Open Counsel Pack after source graph calculation completes."])
    );
  });

  it("adds Source Freshness Board as a metadata-only source-lineage artifact with board hash", async () => {
    const board = sourceFreshnessBoard();
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-source-freshness",
      projectName: "Source Freshness Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [...safeArtifacts(), createSourceFreshnessBoardExportArtifact(board)],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const artifact = inventory.artifacts.find((item) => item.id === "source-freshness-board");

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "Source Freshness Board JSON",
        category: "source-lineage",
        exportMode: "metadata-only-json",
        status: "needs-review",
        required: false,
        available: true,
        artifactHash: board.boardHash,
        metadataOnly: true,
        rawContentIncluded: false,
        notLegalAdviceBoundary: "Not legal advice. Source freshness boards are audit preparation scheduling metadata only."
      })
    );
    expect(artifact?.warnings).toEqual(["Source Freshness Board status is attention-needed; review lanes before counsel handoff."]);
    expect(inventory.exportHandoffAllowed).toBe(true);
    expect(exportSafetyInventoryJson(inventory)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
  });

  it("adds Demo Runbook as a metadata-only required submission artifact with runbook hash", async () => {
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-demo-runbook",
      projectName: "Demo Runbook Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [
        ...safeArtifacts(),
        createDemoRunbookExportArtifact({
          runbookHash: "e".repeat(64),
          status: "ready",
          apiPreflightStatus: "ready",
          scenarioCount: 8,
          screenshotCount: 24,
          notLegalAdviceBoundary: "Not legal advice. Demo runbooks are audit preparation demo metadata only."
        })
      ],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const artifact = inventory.artifacts.find((item) => item.id === "demo-runbook");

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "Demo Runbook JSON",
        category: "submission",
        exportMode: "metadata-only-json",
        status: "ready",
        required: true,
        available: true,
        artifactHash: "e".repeat(64),
        metadataOnly: true,
        rawContentIncluded: false,
        notLegalAdviceBoundary: "Not legal advice. Demo runbooks are audit preparation demo metadata only."
      })
    );
    expect(artifact?.warnings).toEqual([]);
    expect(exportSafetyInventoryJson(inventory)).toContain("Demo Runbook JSON");
    expect(exportSafetyInventoryJson(inventory)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
  });
});

function safeArtifacts(): ExportSafetyArtifactInput[] {
  return [
    {
      id: "submission-pack",
      label: "Submission Pack JSON",
      category: "submission",
      exportMode: "metadata-only-json",
      required: true,
      available: true,
      artifactHash: "c".repeat(64),
      rawContentIncluded: false,
      metadataOnly: true,
      recoveryAction: "Download from Sources after pack hash is available.",
      notLegalAdviceBoundary: "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging only."
    },
    {
      id: "evidence-manifest",
      label: "Evidence Manifest JSON",
      category: "evidence",
      exportMode: "metadata-only-json",
      required: true,
      available: true,
      artifactHash: "a".repeat(64),
      rawContentIncluded: false,
      metadataOnly: true,
      recoveryAction: "Generate an Evidence Manifest from metadata-only evidence.",
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests are audit preparation hash metadata only."
    },
    {
      id: "integration-dossier",
      label: "Integration Enablement Dossier JSON",
      category: "integration-readiness",
      exportMode: "metadata-only-json",
      required: false,
      available: true,
      artifactHash: "d".repeat(64),
      rawContentIncluded: false,
      metadataOnly: true,
      recoveryAction: "Open Integration Readiness to refresh the dossier.",
      notLegalAdviceBoundary: "Not legal advice. Integration enablement dossiers are audit preparation metadata only."
    },
    {
      id: "counsel-pack-version",
      label: "Counsel Pack Version JSON",
      category: "counsel-export",
      exportMode: "metadata-only-json",
      required: true,
      available: true,
      artifactHash: "b".repeat(64),
      rawContentIncluded: false,
      metadataOnly: true,
      recoveryAction: "Save a Counsel Pack version before external handoff.",
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
    }
  ];
}

function cleanBoundaryReport() {
  const project = baseProject();

  return createDataBoundaryReport({
    project,
    evidenceItems: project.evidenceItems,
    counselQuestions: [],
    counselReviews: [],
    aiEvents: []
  });
}

function baseProject(overrides: Partial<ProjectProfile> = {}): ProjectProfile {
  return {
    id: "export-safety-project",
    projectName: "Export Safety Desk",
    entityType: "Delaware C-corp issuer",
    jurisdictions: ["United States"],
    assetModel: "Tokenized private credit note",
    userType: "Accredited investors",
    custodyModel: "Platform controls omnibus wallet",
    dataSensitivity: "Policy metadata only",
    aiUsage: "AI drafts audit-prep questions",
    blockchainUse: "Simulated evidence anchor",
    operatingStage: "Private beta",
    evidenceItems: overrides.evidenceItems ?? safeEvidence(),
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides
  };
}

function safeEvidence(): EvidenceItem[] {
  return [
    {
      id: "safe-export-evidence",
      label: "Safe export evidence",
      kind: "Markdown",
      content: "Synthetic board memo metadata and control owner summary only.",
      source: "Synthetic board memo",
      status: "verified",
      owner: "Compliance"
    }
  ];
}

function sourceFreshnessBoard(overrides: Partial<SourceFreshnessBoard> = {}): SourceFreshnessBoard {
  return {
    boardVersion: "lexproof-source-freshness-board-v1",
    generatedAt: "2026-07-01T00:00:00.000Z",
    asOf: "2026-07-01",
    dueSoonDays: 30,
    boardHash: "e".repeat(64),
    status: "attention-needed",
    laneCount: 4,
    totalSourceCount: 2,
    metadataMissingCount: 0,
    overdueCount: 1,
    dueSoonCount: 1,
    scheduledCount: 0,
    lanes: [],
    notLegalAdviceBoundary: "Not legal advice. Source freshness boards are audit preparation scheduling metadata only.",
    ...overrides
  };
}
