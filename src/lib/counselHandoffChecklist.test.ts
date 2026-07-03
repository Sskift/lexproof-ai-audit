import { describe, expect, it } from "vitest";
import type { CounselPackVersionRecord } from "./counselPackVersions";
import type { CounselReviewItem } from "./counselReview";
import {
  createCounselHandoffChecklist,
  exportCounselHandoffChecklistJson,
  type CounselHandoffChecklistInput
} from "./counselHandoffChecklist";
import type { EvidenceRecertificationQueue } from "./evidenceRecertification";
import type { HumanReviewQueue } from "./humanReviewWorkflow";
import type { EvidenceVaultControlCoverage } from "./evidenceVaultControlCoverage";
import type { ExportSafetyInventory } from "./exportSafetyInventory";
import type { CounselPackExportRecord } from "./phase2Types";

describe("createCounselHandoffChecklist", () => {
  it("creates a stable counsel handoff hash and blocks stale export versions with clear recovery", async () => {
    const first = await createCounselHandoffChecklist({
      ...baseInput(),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const second = await createCounselHandoffChecklist({
      ...baseInput({ reverseReviews: true }),
      generatedAt: "2026-07-02T02:00:00.000Z"
    });

    expect(first.checklistHash).toBe(second.checklistHash);
    expect(first.checklistHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toEqual(
      expect.objectContaining({
        checklistVersion: "lexproof-counsel-handoff-checklist-v1",
        overallStatus: "needs-review",
        handoffAllowed: false,
        blockedCount: 0,
        needsReviewCount: 3,
        needsActionCount: 0,
        notLegalAdviceBoundary: "Not legal advice. Counsel handoff checklists are audit preparation workflow metadata only."
      })
    );
    expect(first.items.map((item) => item.id)).toEqual([
      "counsel-pack-version",
      "counsel-review-status",
      "evidence-manifest",
      "export-safety-inventory",
      "regulatory-source-pack",
      "server-export-record",
      "submission-pack"
    ]);
    expect(first.nextActions).toEqual(
      expect.arrayContaining([
        "Counsel Pack Version: Save a fresh Counsel Pack version after the latest manifest and source pack hashes are available.",
        "Counsel Review Status: Route ready and not-started review rows through counsel or compliance review before final handoff.",
        "Server Export Record: Create a metadata-only server export record after the latest Counsel Pack version is saved."
      ])
    );
  });

  it("blocks handoff when export safety or review status is blocked without legal conclusion wording", async () => {
    const checklist = await createCounselHandoffChecklist({
      ...baseInput(),
      exportSafetyInventory: {
        ...readyInventory(),
        overallStatus: "blocked",
        exportHandoffAllowed: false,
        inventoryHash: "9".repeat(64),
        blockers: ["Unsafe evidence includes private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa."]
      },
      counselReviews: [
        {
          ...reviewedItem(),
          id: "review-blocked",
          title: "Token custody controls",
          status: "blocked",
          notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only.",
          reviewerNote: "raw KYC packet and private key evidence must be removed before review."
        }
      ],
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const json = exportCounselHandoffChecklistJson(checklist);

    expect(checklist.overallStatus).toBe("blocked");
    expect(checklist.handoffAllowed).toBe(false);
    expect(checklist.blockedCount).toBeGreaterThanOrEqual(2);
    expect(checklist.nextActions).toEqual(
      expect.arrayContaining([
        "Export Safety Inventory: Resolve Export Safety Inventory blockers before counsel or judge handoff.",
        "Counsel Review Status: Resolve blocked review items before export reliance."
      ])
    );
    expect(json).toContain("[redacted-private-key]");
    expect(json).not.toContain("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|legally approved|raw KYC packet/i);
    expect(json).toContain("Not legal advice");
  });

  it("adds Evidence Vault control coverage recovery to the handoff checklist without legal conclusions", async () => {
    const checklist = await createCounselHandoffChecklist({
      ...baseInput(),
      evidenceVaultControlCoverage: evidenceVaultControlCoverage("needs-review"),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const item = checklist.items.find((candidate) => candidate.id === "evidence-vault-control-coverage");
    const json = exportCounselHandoffChecklistJson(checklist);

    expect(item).toEqual(
      expect.objectContaining({
        label: "Evidence Vault Control Coverage",
        status: "needs-review",
        blockerCount: 0,
        warningCount: 1,
        recoveryAction: "Move linked vault evidence through Human Review before export reliance.",
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault control coverage is audit preparation metadata only."
      })
    );
    expect(item?.evidence).toContain("1/2 controls ready for handoff");
    expect(item?.evidence).toContain("needs review: 1");
    expect(item?.evidence).toContain("control-eu-ai-act-ai-literacy-governance");
    expect(checklist.nextActions).toContain(
      "Evidence Vault Control Coverage: Move linked vault evidence through Human Review before export reliance."
    );
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b/i);
  });

  it("requires recertification recovery before handoff when reliance-ready evidence is stale", async () => {
    const checklist = await createCounselHandoffChecklist({
      ...baseInput(),
      evidenceRecertificationQueue: recertificationQueue("needs-recertification"),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const item = checklist.items.find((candidate) => candidate.id === "evidence-recertification-queue");
    const json = exportCounselHandoffChecklistJson(checklist);

    expect(item).toEqual(
      expect.objectContaining({
        label: "Evidence Recertification Queue",
        status: "needs-action",
        artifactHash: "e".repeat(64),
        warningCount: 2,
        recoveryAction: "Recertify stale or timestamp-missing reliance-ready evidence before final handoff.",
        notLegalAdviceBoundary: "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."
      })
    );
    expect(item?.evidence).toContain("2 open recertification actions");
    expect(item?.evidence).toContain("1 overdue");
    expect(item?.evidence).toContain("1 source-linked");
    expect(checklist.overallStatus).toBe("needs-action");
    expect(checklist.handoffAllowed).toBe(false);
    expect(checklist.nextActions).toContain(
      "Evidence Recertification Queue: Recertify stale or timestamp-missing reliance-ready evidence before final handoff."
    );
    expect(json).toContain("Not legal advice");
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b/i);
  });

  it("marks recertification ready when no reliance-ready evidence action is due", async () => {
    const checklist = await createCounselHandoffChecklist({
      ...baseInput(),
      evidenceRecertificationQueue: recertificationQueue("ready"),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const item = checklist.items.find((candidate) => candidate.id === "evidence-recertification-queue");

    expect(item).toEqual(
      expect.objectContaining({
        label: "Evidence Recertification Queue",
        status: "ready",
        evidence: expect.stringContaining("0 open recertification actions"),
        recoveryAction: "Keep the recertification queue hash with the final handoff packet."
      })
    );
  });

  it("marks Evidence Vault control coverage ready when all linked controls are ready for handoff", async () => {
    const checklist = await createCounselHandoffChecklist({
      ...baseInput(),
      evidenceVaultControlCoverage: evidenceVaultControlCoverage("ready-for-handoff"),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const item = checklist.items.find((candidate) => candidate.id === "evidence-vault-control-coverage");

    expect(item).toEqual(
      expect.objectContaining({
        label: "Evidence Vault Control Coverage",
        status: "ready",
        evidence: expect.stringContaining("2/2 controls ready for handoff"),
        recoveryAction: "Keep verified vault evidence linked in the Counsel Pack and source handoff."
      })
    );
  });

  it("blocks final handoff when the Human Review workflow still has rejected or returned review items", async () => {
    const checklist = await createCounselHandoffChecklist({
      ...baseInput(),
      humanReviewQueue: humanReviewQueue({ openCount: 3, blockedCount: 1 }),
      generatedAt: "2026-07-02T01:00:00.000Z"
    });
    const item = checklist.items.find((candidate) => candidate.id === "human-review-workflow");
    const json = exportCounselHandoffChecklistJson(checklist);

    expect(item).toEqual(
      expect.objectContaining({
        label: "Human Review Workflow",
        status: "blocked",
        blockerCount: 1,
        warningCount: 3,
        recoveryAction: "Resolve rejected or returned Human Review items before final handoff.",
        notLegalAdviceBoundary: "Not legal advice. Human review workflow status is audit preparation workflow only."
      })
    );
    expect(item?.evidence).toContain("3 open review items");
    expect(item?.evidence).toContain("1 blocked");
    expect(checklist.overallStatus).toBe("blocked");
    expect(checklist.handoffAllowed).toBe(false);
    expect(checklist.nextActions).toContain(
      "Human Review Workflow: Resolve rejected or returned Human Review items before final handoff."
    );
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b/i);
    expect(json).toContain("Not legal advice");
  });
});

function baseInput(options: { reverseReviews?: boolean } = {}): CounselHandoffChecklistInput {
  const reviews = [
    reviewedItem(),
    {
      ...reviewedItem(),
      id: "review-ready-for-counsel",
      title: "Marketing claims review",
      status: "ready-for-counsel" as const,
      reviewerNote: "Ready for counsel queue; no legal conclusion recorded."
    }
  ];

  return {
    projectId: "handoff-project",
    projectName: "Handoff Desk",
    manifestHash: "a".repeat(64),
    regulatorySourcePackHash: "b".repeat(64),
    submissionPackHash: "c".repeat(64),
    exportSafetyInventory: readyInventory(),
    counselReviews: options.reverseReviews ? reviews.reverse() : reviews,
    counselPackVersions: [
      {
        ...latestVersion(),
        manifestHash: "old-manifest-hash",
        regulatorySourcePack: { packHash: "old-source-pack-hash" } as CounselPackVersionRecord["regulatorySourcePack"]
      }
    ],
    serverExportRecords: [serverExportRecord()]
  };
}

function reviewedItem(): CounselReviewItem {
  return {
    id: "review-ready",
    projectId: "handoff-project",
    flagId: "flag-token-custody",
    title: "Token custody controls",
    severity: "critical",
    owner: "Compliance",
    priority: "P0",
    status: "reviewed",
    reviewer: "Compliance",
    reviewerNote: "Reviewed for audit preparation; no legal approval recorded.",
    evidenceSummary: "Evidence received",
    updatedAt: "2026-07-02T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
  };
}

function readyInventory(): ExportSafetyInventory {
  return {
    inventoryVersion: "lexproof-export-safety-inventory-v1",
    workspaceId: "handoff-project",
    projectName: "Handoff Desk",
    generatedAt: "2026-07-02T00:00:00.000Z",
    inventoryHash: "d".repeat(64),
    overallStatus: "ready",
    exportHandoffAllowed: true,
    artifactCount: 5,
    readyCount: 5,
    needsReviewCount: 0,
    missingRequiredCount: 0,
    blockedCount: 0,
    boundaryStatus: "clean",
    boundaryBlockerCount: 0,
    boundaryWarningCount: 0,
    detectedClasses: [],
    artifacts: [],
    blockers: [],
    nextActions: ["Keep exports metadata-only and re-run inventory before external sharing."],
    notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only."
  };
}

function recertificationQueue(status: "ready" | "needs-recertification"): EvidenceRecertificationQueue {
  const totalActionCount = status === "ready" ? 0 : 2;
  const overdueCount = status === "ready" ? 0 : 1;
  const expiringCount = status === "ready" ? 0 : 1;
  const sourceLinkedCount = status === "ready" ? 0 : 1;
  const missingTimestampCount = status === "ready" ? 0 : 1;

  return {
    queueVersion: "lexproof-evidence-recertification-queue-v1",
    workspaceId: "handoff-project",
    generatedAt: "2026-07-02T00:00:00.000Z",
    status,
    queueHash: "e".repeat(64),
    policy: {
      recertificationIntervalDays: 90,
      warningWindowDays: 14
    },
    summary: {
      totalActionCount,
      overdueCount,
      expiringCount,
      sourceLinkedCount,
      missingTimestampCount
    },
    items: [],
    nextSteps:
      status === "ready"
        ? ["No recertification action is due for reliance-ready evidence."]
        : ["Recertify stale evidence before counsel/export reliance."],
    notLegalAdviceBoundary: "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."
  };
}

function evidenceVaultControlCoverage(status: "needs-review" | "ready-for-handoff"): EvidenceVaultControlCoverage {
  return {
    coverageVersion: "lexproof-evidence-vault-control-coverage-v1",
    controlCount: 2,
    recordCount: 4,
    manifestItemCount: 4,
    controls: [
      {
        controlId: "control-eu-ai-act-ai-literacy-governance",
        evidenceRecordCount: 3,
        manifestItemCount: 3,
        readiness: status,
        nextAction:
          status === "ready-for-handoff"
            ? "Keep verified vault evidence linked in the Counsel Pack and source handoff."
            : "Move linked vault evidence through Human Review before export reliance.",
        statuses: status === "ready-for-handoff" ? ["verified"] : ["requested", "verified"],
        filenames: ["ai-system-use-policy.metadata.json", "human-review-approval-log.metadata.json"]
      },
      {
        controlId: "control-uk-ico-ai-data-protection-governance",
        evidenceRecordCount: 1,
        manifestItemCount: 1,
        readiness: "ready-for-handoff",
        nextAction: "Keep verified vault evidence linked in the Counsel Pack and source handoff.",
        statuses: ["verified"],
        filenames: ["model-payload-redaction-checklist.metadata.json"]
      }
    ],
    notLegalAdviceBoundary: "Not legal advice. Evidence Vault control coverage is audit preparation metadata only."
  };
}

function humanReviewQueue({ openCount, blockedCount }: { openCount: number; blockedCount: number }): HumanReviewQueue {
  return {
    queueVersion: "lexproof-human-review-queue-v1",
    items: [],
    summary: {
      totalCount: 5,
      openCount,
      reviewedCount: 1,
      blockedCount,
      notLegalAdviceBoundary: "Not legal advice. Human review workflow status is audit preparation workflow only."
    }
  };
}

function latestVersion(): CounselPackVersionRecord {
  return {
    recordVersion: "lexproof-counsel-pack-version-v1",
    id: "counsel-version-1",
    projectId: "handoff-project",
    projectName: "Handoff Desk",
    version: 1,
    title: "Handoff Desk Counsel Pack",
    manifestHash: "a".repeat(64),
    markdownHash: "e".repeat(64),
    markdownSize: 2048,
    riskLevel: "high",
    reviewSummary: { total: 2, reviewed: 1, readyForCounsel: 1, needsEvidence: 0, blocked: 0, open: 1 },
    reviewStatuses: [
      {
        flagId: "flag-token-custody",
        title: "Token custody controls",
        status: "reviewed",
        reviewer: "Compliance",
        evidenceSummary: "Evidence received"
      }
    ],
    sourcePack: [],
    regulatorySourcePack: { packHash: "b".repeat(64) } as CounselPackVersionRecord["regulatorySourcePack"],
    exportedAt: "2026-07-02T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
  };
}

function serverExportRecord(): CounselPackExportRecord {
  return {
    recordVersion: "lexproof-counsel-pack-export-record-v1",
    id: "server-export-1",
    workspaceId: "handoff-project",
    exportType: "counsel-pack",
    version: 1,
    projectName: "Handoff Desk",
    title: "Handoff Desk Counsel Pack",
    artifactName: "handoff-desk-counsel-pack.md",
    format: "markdown",
    status: "ready",
    manifestHash: "a".repeat(64),
    artifactHash: "e".repeat(64),
    artifactSize: 2048,
    riskLevel: "high",
    sourcePackHash: "b".repeat(64),
    sourceReviewStatus: "current",
    sourceCount: 3,
    reviewSummary: { total: 2, reviewed: 1, readyForCounsel: 1, needsEvidence: 0, blocked: 0, open: 1 },
    createdBy: "Compliance",
    createdAt: "2026-07-02T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
  };
}
