import { describe, expect, it } from "vitest";
import { createAuditLogExport } from "./auditLogExport";
import { createDataBoundaryReport } from "./dataBoundary";
import {
  createApiPreflightExportArtifact,
  createAuditLogExportArtifact,
  createExportSafetyInventory,
  createDemoRunbookExportArtifact,
  createDemoSmokeChecklistExportArtifact,
  createEvidenceRecertificationQueueExportArtifact,
  createEvidenceVaultLineageDigestExportArtifact,
  createSourceFreshnessBoardExportArtifact,
  createModelGatewayEvaluationExportArtifact,
  exportSafetyInventoryJson,
  type ExportSafetyArtifactInput
} from "./exportSafetyInventory";
import type { EvidenceRecertificationQueue } from "./evidenceRecertification";
import type { EvidenceVaultLineageDigest } from "./evidenceVaultLineageDigest";
import type { ModelGatewayEvaluationRecord } from "./modelGatewayEvaluation";
import type { AuditLogRecord } from "./phase2Types";
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

  it("adds API Preflight Report as a metadata-only security artifact with report hash", async () => {
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-api-preflight",
      projectName: "API Preflight Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [
        ...safeArtifacts(),
        createApiPreflightExportArtifact({
          status: "ready",
          service: "lexproof-secure-review-workspace-api",
          version: "lexproof-phase-2-backend-v1",
          capabilities: ["modelGateway: mock-run-ready"],
          apiPreflightReportHash: "f".repeat(64),
          routeChecks: [
            {
              id: "api-preflight-report",
              label: "API Preflight report",
              status: "ready",
              url: "http://127.0.0.1:8787/api/preflight",
              detail: "API preflight report is reachable with a stable metadata hash.",
              artifactHash: "f".repeat(64)
            },
            {
              id: "audit-log",
              label: "Audit Log",
              status: "ready",
              url: "http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/audit-log",
              detail: "Audit Log route is reachable."
            }
          ],
          checkedAt: "2026-07-01T01:00:00.000Z",
          notLegalAdviceBoundary: "Not legal advice. API preflight reports are audit preparation readiness metadata only."
        })
      ],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const artifact = inventory.artifacts.find((item) => item.id === "api-preflight-report");

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "API Preflight Report JSON",
        category: "security",
        exportMode: "metadata-only-json",
        status: "ready",
        required: false,
        available: true,
        artifactHash: "f".repeat(64),
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Keep API Preflight Report JSON with the judge handoff packet; 2/2 safe route checks passed.",
        notLegalAdviceBoundary: "Not legal advice. API preflight reports are audit preparation readiness metadata only."
      })
    );
    expect(artifact?.warnings).toEqual([]);
    expect(exportSafetyInventoryJson(inventory)).toContain("API Preflight Report JSON");
  });

  it("surfaces API Preflight recovery when the demo API has not been checked", async () => {
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-api-preflight-missing",
      projectName: "API Preflight Missing Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [...safeArtifacts(), createApiPreflightExportArtifact({ status: "not-checked" })],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const artifact = inventory.artifacts.find((item) => item.id === "api-preflight-report");

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "API Preflight Report JSON",
        status: "needs-review",
        required: false,
        available: false,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Open Judge Demo Readiness, start the Phase 2 API, and click Check Demo API before judge handoff."
      })
    );
    expect(artifact?.warnings).toEqual(["Phase 2 API preflight has not been checked in this browser session."]);
    expect(inventory.exportHandoffAllowed).toBe(true);
  });

  it("adds Evidence Vault Lineage Digest as a metadata-only evidence artifact with recovery warning", async () => {
    const digest = evidenceVaultLineageDigest();
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-vault-lineage",
      projectName: "Vault Lineage Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [...safeArtifacts(), createEvidenceVaultLineageDigestExportArtifact(digest)],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const artifact = inventory.artifacts.find((item) => item.id === "evidence-vault-lineage-digest");

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "Evidence Vault Lineage Digest JSON",
        category: "evidence",
        exportMode: "metadata-only-json",
        status: "needs-review",
        required: false,
        available: true,
        artifactHash: digest.digestHash,
        metadataOnly: true,
        rawContentIncluded: false,
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only."
      })
    );
    expect(artifact?.warnings).toEqual([
      "Evidence Vault Lineage Digest status is needs-replacement; resolve vault lineage recovery before external handoff."
    ]);
    expect(inventory.exportHandoffAllowed).toBe(true);
    expect(exportSafetyInventoryJson(inventory)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key|source-note body/i);
  });

  it("adds Model Gateway Evaluation as a metadata-only governance artifact that surfaces human review state", async () => {
    const evaluation = modelGatewayEvaluation();
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-model-governance",
      projectName: "Model Governance Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [...safeArtifacts(), createModelGatewayEvaluationExportArtifact(evaluation)],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const artifact = inventory.artifacts.find((item) => item.id === "model-gateway-evaluation");
    const json = exportSafetyInventoryJson(inventory);

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "Model Gateway Evaluation JSON",
        category: "model-governance",
        exportMode: "metadata-only-json",
        status: "needs-review",
        required: false,
        available: true,
        artifactHash: evaluation.hashes.responseHash,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Route Model Gateway Evaluation through Human Review before relying on model output.",
        notLegalAdviceBoundary: "Not legal advice. Model Gateway evaluation records are audit preparation metadata only."
      })
    );
    expect(artifact?.warnings).toEqual([
      "Model Gateway Evaluation human review status is needs-review; route through Human Review before export reliance."
    ]);
    expect(inventory.exportHandoffAllowed).toBe(true);
    expect(json).toContain("Model Gateway Evaluation JSON");
    expect(json).toContain("Not legal advice");
    expect(json).not.toMatch(/\braw model payload\b|\blegal approval\b/i);
  });

  it("adds Audit Log Export as a metadata-only security artifact when boundary checks are clean", async () => {
    const auditLogExport = createAuditLogExport({
      workspaceId: "workspace-audit-log-export",
      records: [
        auditLogRecord({
          id: "audit-log-export-clean",
          action: "model.run.human-review-queued",
          targetType: "model-run",
          targetId: "model-gateway-run-clean",
          summary: "Queued model run for human review with metadata-only hashes."
        })
      ],
      exportedAt: "2026-07-01T01:00:00.000Z"
    });
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-audit-log-export",
      projectName: "Audit Log Export Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [...safeArtifacts(), createAuditLogExportArtifact(auditLogExport)],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const artifact = inventory.artifacts.find((item) => item.id === "audit-log-export");

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "Audit Log Export JSON",
        category: "security",
        exportMode: "metadata-only-json",
        status: "ready",
        required: false,
        available: true,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Keep Audit Log Export JSON with the secure review handoff packet.",
        notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only."
      })
    );
    expect(artifact?.warnings).toEqual([]);
    expect(artifact?.blockers).toEqual([]);
    expect(exportSafetyInventoryJson(inventory)).toContain("Audit Log Export JSON");
  });

  it("blocks Audit Log Export artifacts with unsafe source fields without leaking secrets", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const auditLogExport = createAuditLogExport({
      workspaceId: "workspace-audit-log-blocked",
      records: [
        auditLogRecord({
          actorId: `reviewer ${apiKey}`,
          beforeHash: privateKey,
          afterHash: apiKey,
          summary: `Blocked ${apiKey}, private key ${privateKey}, and raw KYC packet before export.`
        })
      ],
      exportedAt: "2026-07-01T01:00:00.000Z"
    });
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-audit-log-blocked",
      projectName: "Blocked Audit Log Export Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [...safeArtifacts(), createAuditLogExportArtifact(auditLogExport)],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const artifact = inventory.artifacts.find((item) => item.id === "audit-log-export");
    const json = exportSafetyInventoryJson(inventory);

    expect(inventory.overallStatus).toBe("blocked");
    expect(inventory.exportHandoffAllowed).toBe(false);
    expect(artifact).toEqual(
      expect.objectContaining({
        status: "blocked",
        available: true,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction:
          "Remove secrets, private-key material, and [redacted-raw-kyc] references from Audit Log source records before handoff."
      })
    );
    expect(artifact?.blockers.join(" ")).toContain("Audit Log Export boundary status is blocked");
    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).toContain("[redacted-raw-kyc]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain("raw KYC packet");
    expect(json).toContain("Not legal advice");
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

  it("adds Demo Smoke Checklist as a hashed metadata-only required submission artifact", async () => {
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-demo-smoke",
      projectName: "Demo Smoke Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [
        ...safeArtifacts(),
        createDemoSmokeChecklistExportArtifact({
          checklistHash: "f".repeat(64),
          status: "needs-api",
          commandCount: 6,
          stepCount: 8,
          apiPreflightStatus: "not-checked",
          screenshotStatus: "ready",
          notLegalAdviceBoundary: "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only."
        })
      ],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const artifact = inventory.artifacts.find((item) => item.id === "demo-smoke-checklist");

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "Demo Smoke Checklist JSON",
        category: "submission",
        exportMode: "metadata-only-json",
        status: "needs-review",
        required: true,
        available: true,
        artifactHash: "f".repeat(64),
        metadataOnly: true,
        rawContentIncluded: false,
        notLegalAdviceBoundary: "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only."
      })
    );
    expect(artifact?.warnings).toEqual([
      "Demo Smoke Checklist status is needs-api with API preflight not-checked; complete clean-clone smoke recovery before judge handoff."
    ]);
    expect(artifact?.recoveryAction).toContain("6 commands and 8 smoke steps");
    expect(exportSafetyInventoryJson(inventory)).toContain("Demo Smoke Checklist JSON");
    expect(exportSafetyInventoryJson(inventory)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
  });

  it("adds Evidence Recertification Queue as a hashed metadata-only evidence artifact", async () => {
    const inventory = await createExportSafetyInventory({
      workspaceId: "workspace-recertification",
      projectName: "Recertification Desk",
      dataBoundaryReport: cleanBoundaryReport(),
      artifacts: [
        ...safeArtifacts(),
        createEvidenceRecertificationQueueExportArtifact(
          recertificationQueue({
            status: "needs-recertification",
            totalActionCount: 2,
            nextSteps: ["Recertify stale source-linked evidence before counsel/export reliance."]
          })
        )
      ],
      generatedAt: "2026-07-01T01:00:00.000Z"
    });

    const artifact = inventory.artifacts.find((item) => item.id === "evidence-recertification-queue");

    expect(artifact).toEqual(
      expect.objectContaining({
        label: "Evidence Recertification Queue JSON",
        category: "evidence",
        exportMode: "metadata-only-json",
        status: "needs-review",
        required: false,
        available: true,
        artifactHash: "9".repeat(64),
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Recertify stale source-linked evidence before counsel/export reliance.",
        notLegalAdviceBoundary: "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."
      })
    );
    expect(artifact?.warnings).toEqual([
      "Evidence Recertification Queue status is needs-recertification with 2 open actions; resolve recertification before external handoff."
    ]);
    expect(exportSafetyInventoryJson(inventory)).toContain("Evidence Recertification Queue JSON");
    expect(exportSafetyInventoryJson(inventory)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
  });
});

function recertificationQueue({
  status,
  totalActionCount,
  nextSteps
}: {
  status: EvidenceRecertificationQueue["status"];
  totalActionCount: number;
  nextSteps: string[];
}): EvidenceRecertificationQueue {
  return {
    queueVersion: "lexproof-evidence-recertification-queue-v1",
    workspaceId: "workspace-recertification",
    generatedAt: "2026-07-01T00:00:00.000Z",
    status,
    queueHash: "9".repeat(64),
    policy: {
      recertificationIntervalDays: 90,
      warningWindowDays: 14
    },
    summary: {
      totalActionCount,
      overdueCount: status === "needs-recertification" ? totalActionCount : 0,
      expiringCount: status === "monitoring" ? totalActionCount : 0,
      sourceLinkedCount: totalActionCount,
      missingTimestampCount: 0
    },
    items: [],
    nextSteps,
    notLegalAdviceBoundary: "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."
  };
}

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

function auditLogRecord(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    recordVersion: "lexproof-audit-log-record-v1",
    id: "audit-log-export-1",
    workspaceId: "workspace-audit-log-export",
    actorId: "Compliance",
    action: "workspace.created",
    targetType: "workspace",
    targetId: "workspace-audit-log-export",
    beforeHash: "",
    afterHash: "a".repeat(64),
    summary: "Created secure review workspace metadata.",
    createdAt: "2026-07-01T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata.",
    ...overrides
  };
}

function evidenceVaultLineageDigest(): EvidenceVaultLineageDigest {
  return {
    digestVersion: "lexproof-evidence-vault-lineage-digest-v1",
    workspaceId: "workspace-vault-lineage",
    generatedAt: "2026-07-01T00:00:00.000Z",
    readinessStatus: "needs-replacement",
    manifestHash: "f".repeat(64),
    itemCount: 2,
    statusCounts: { verified: 1, rejected: 1 },
    lineageCounts: {
      activeRecords: 1,
      replacedRecords: 0,
      openRejectedRecords: 1,
      lineageLinkCount: 0,
      linkedControlCount: 1,
      linkedRiskFlagCount: 1
    },
    lineageLinks: [],
    activeEvidenceIds: ["evidence-active"],
    openRejectedEvidenceIds: ["evidence-rejected"],
    linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
    linkedRiskFlagIds: ["governance-approval"],
    nextActions: ["Create metadata-only replacement records for rejected vault evidence before final handoff."],
    digestHash: "6".repeat(64),
    notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only."
  };
}

function modelGatewayEvaluation(overrides: Partial<ModelGatewayEvaluationRecord> = {}): ModelGatewayEvaluationRecord {
  return {
    evaluationVersion: "lexproof-model-gateway-evaluation-v1",
    runId: "model-gateway-run-export",
    workspaceId: "workspace-model-governance",
    status: "completed",
    provider: "mock",
    providerLabel: "Traceable mock reviewer",
    model: "lexproof-mock",
    purpose: "Create audit-prep model receipt metadata. Not legal advice.",
    adapterMode: "local-mock",
    credentialPolicy: "no credentials accepted",
    secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
    allowedDataClasses: ["audit-prep metadata", "evidence hashes"],
    redactionStatus: "clean",
    humanReviewStatus: "needs-review",
    requiresHumanReview: true,
    retryState: "not-needed",
    attempt: 1,
    maxAttempts: 1,
    hashes: {
      payloadHash: "a".repeat(64),
      responseHash: "b".repeat(64),
      sourceEvidenceHash: "c".repeat(64)
    },
    remediationSteps: [],
    reviewerAction: "send-to-human-review",
    createdAt: "2026-07-01T00:00:00.000Z",
    completedAt: "2026-07-01T00:00:01.000Z",
    notLegalAdviceBoundary: "Not legal advice. Model Gateway evaluation records are audit preparation metadata only.",
    ...overrides
  };
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
