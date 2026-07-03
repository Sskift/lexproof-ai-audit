import { describe, expect, it } from "vitest";
import type { DataBoundaryReport } from "./dataBoundary";
import type { HumanReviewQueue } from "./humanReviewWorkflow";
import type { ProjectValidationResult } from "./projectModel";
import type { RegulatoryGraph } from "./regulatoryGraph";
import type { RegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import type { RegulatorySourceReview } from "./regulatorySourceReview";
import type { SecurityReviewChecklistReport } from "./securityReviewChecklist";
import type { EvidenceRecertificationQueue } from "./evidenceRecertification";
import { createWorkspaceActionQueue } from "./workspaceActionQueue";

describe("createWorkspaceActionQueue", () => {
  it("prioritizes recoverable workspace actions without making legal conclusions", () => {
    const queue = createWorkspaceActionQueue({
      validation: validation({ valid: true }),
      regulatoryGraph: graph({
        evidenceGaps: [
          {
            id: "eu-mica-whitepaper",
            clauseId: "eu-mica-title-ii-white-paper",
            jurisdiction: "European Union",
            citation: "Regulation (EU) 2023/1114, Title II",
            title: "White paper disclosure evidence",
            reason: "Confirm disclosure controls before counsel handoff.",
            priority: "P0",
            sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng"
          }
        ]
      }),
      sourceReview: sourceReview({ actionCount: 1 }),
      humanReviewQueue: humanReviewQueue({ openCount: 2, blockedCount: 1 }),
      securityReviewChecklist: securityChecklist({ overallStatus: "blocked", blockerCount: 1 }),
      dataBoundaryReport: dataBoundary({ exportAllowed: false, blockerCount: 1 }),
      evidenceCount: 0,
      manifestHash: "",
      counselPackVersionCount: 0
    });

    expect(queue.queueVersion).toBe("lexproof-workspace-action-queue-v1");
    expect(queue.summary).toEqual({
      totalCount: 7,
      p0Count: 3,
      nextTarget: "review",
      notLegalAdviceBoundary: "Not legal advice. Workspace actions are audit preparation workflow prompts only."
    });
    expect(queue.items.map((item) => item.id)).toEqual([
      "recover-human-review",
      "resolve-regulatory-evidence-gaps",
      "clear-export-safety-gate",
      "refresh-source-review",
      "complete-human-review",
      "validate-security-readiness",
      "save-counsel-pack-version"
    ]);
    expect(queue.items[0]).toEqual(
      expect.objectContaining({
        priority: "P0",
        target: "review",
        title: "Recover blocked review decisions",
        cta: "Open review queue"
      })
    );
    expect(queue.items[1].summary).toContain("White paper disclosure evidence");
    expect(queue.items[1]).toEqual(
      expect.objectContaining({
        id: "resolve-regulatory-evidence-gaps",
        target: "evidence",
        cta: "Open source gap triage",
        focusTarget: "source-gap-triage"
      })
    );
    expect(queue.items.every((item) => item.notLegalAdviceBoundary.includes("Not legal advice"))).toBe(true);
  });

  it("surfaces source update approval gates as command-center recovery actions", () => {
    const queue = createWorkspaceActionQueue({
      validation: validation({ valid: true }),
      regulatoryGraph: graph({ evidenceGaps: [] }),
      sourceReview: sourceReview({ actionCount: 0 }),
      sourceApprovalQueue: sourceApprovalQueue({ metadataRequiredCount: 1, approvalRequiredCount: 2 }),
      humanReviewQueue: humanReviewQueue({ openCount: 0, blockedCount: 0 }),
      securityReviewChecklist: securityChecklist({ overallStatus: "ready", blockerCount: 0 }),
      dataBoundaryReport: dataBoundary({ exportAllowed: true, blockerCount: 0 }),
      evidenceCount: 2,
      manifestHash: "abc123def4567890",
      counselPackVersionCount: 1
    });

    expect(queue.summary).toEqual(
      expect.objectContaining({
        totalCount: 2,
        p0Count: 1,
        nextTarget: "review"
      })
    );
    expect(queue.items[0]).toEqual(
      expect.objectContaining({
        id: "approve-source-updates",
        priority: "P0",
        target: "review",
        title: "Review source update approvals",
        cta: "Open source approval queue",
        focusTarget: "source-approval-queue",
        notLegalAdviceBoundary: "Not legal advice. Workspace actions are audit preparation workflow prompts only."
      })
    );
    expect(queue.items[0].summary).toContain("1 metadata gate");
    expect(queue.items[0].summary).toContain("2 approval gates");
    expect(queue.items[0].summary).toContain("Matching behavior remains unchanged");
    expect(JSON.stringify(queue)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal approval\b/i);
  });

  it("surfaces a ready export action when blockers are cleared and the first pack version exists", () => {
    const queue = createWorkspaceActionQueue({
      validation: validation({ valid: true }),
      regulatoryGraph: graph({ evidenceGaps: [] }),
      sourceReview: sourceReview({ actionCount: 0 }),
      humanReviewQueue: humanReviewQueue({ openCount: 0, blockedCount: 0 }),
      securityReviewChecklist: securityChecklist({ overallStatus: "ready", blockerCount: 0 }),
      dataBoundaryReport: dataBoundary({ exportAllowed: true, blockerCount: 0 }),
      evidenceCount: 2,
      manifestHash: "abc123def4567890",
      counselPackVersionCount: 1
    });

    expect(queue.items).toEqual([
      expect.objectContaining({
        id: "download-counsel-pack",
        priority: "P3",
        target: "counsel",
        title: "Export counsel-ready packet",
        summary: "Manifest abc123def456 is ready with 1 saved Counsel Pack version.",
        cta: "Open export queue"
      })
    ]);
  });

  it("routes stale evidence recertification to the Evidence Ledger before export work", () => {
    const queue = createWorkspaceActionQueue({
      validation: validation({ valid: true }),
      regulatoryGraph: graph({ evidenceGaps: [] }),
      sourceReview: sourceReview({ actionCount: 0 }),
      humanReviewQueue: humanReviewQueue({ openCount: 0, blockedCount: 0 }),
      securityReviewChecklist: securityChecklist({ overallStatus: "ready", blockerCount: 0 }),
      dataBoundaryReport: dataBoundary({ exportAllowed: true, blockerCount: 0 }),
      evidenceCount: 1,
      manifestHash: "abc123def4567890",
      counselPackVersionCount: 1,
      evidenceRecertificationQueue: recertificationQueue()
    } as Parameters<typeof createWorkspaceActionQueue>[0] & { evidenceRecertificationQueue: EvidenceRecertificationQueue });

    expect(queue.items[0]).toEqual(
      expect.objectContaining({
        id: "recertify-stale-evidence",
        priority: "P0",
        target: "evidence",
        title: "Recertify stale evidence",
        cta: "Open recertification queue"
      })
    );
    expect(queue.items[0].summary).toContain("Claims inventory");
    expect(queue.items[0].summary).toContain("2026-04-01");
    expect(queue.items[0].notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("escalates overdue human review work to a P0 command-center action", () => {
    const queue = createWorkspaceActionQueue({
      validation: validation({ valid: true }),
      regulatoryGraph: graph({ evidenceGaps: [] }),
      sourceReview: sourceReview({ actionCount: 0 }),
      humanReviewQueue: humanReviewQueue({
        openCount: 2,
        blockedCount: 0,
        items: [
          humanReviewItem({
            targetId: "overdue-model-run",
            title: "Model Gateway receipt review",
            dueAt: "2026-06-29T00:00:00.000Z",
            reviewer: "AI governance reviewer"
          }),
          humanReviewItem({
            targetId: "future-counsel-pack",
            title: "Counsel Pack version review",
            dueAt: "2026-07-10T00:00:00.000Z",
            reviewer: "Counsel"
          })
        ]
      }),
      securityReviewChecklist: securityChecklist({ overallStatus: "ready", blockerCount: 0 }),
      dataBoundaryReport: dataBoundary({ exportAllowed: true, blockerCount: 0 }),
      evidenceCount: 2,
      manifestHash: "abc123def4567890",
      counselPackVersionCount: 1,
      evaluatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(queue.items[0]).toEqual(
      expect.objectContaining({
        id: "complete-human-review",
        priority: "P0",
        target: "review",
        title: "Resolve overdue human review",
        cta: "Open review queue"
      })
    );
    expect(queue.items[0].summary).toContain("1 open review item overdue");
    expect(queue.items[0].summary).toContain("Model Gateway receipt review");
    expect(queue.items[0].summary).toContain("2026-06-29");
    expect(queue.items[0].summary).toContain("AI governance reviewer");
    expect(queue.items[0].notLegalAdviceBoundary).toContain("Not legal advice");
  });
});

function validation(overrides: Partial<ProjectValidationResult>): ProjectValidationResult {
  return {
    valid: false,
    errors: ["Project name is required."],
    ...overrides
  };
}

function graph(overrides: Partial<RegulatoryGraph>): RegulatoryGraph {
  return {
    graphVersion: "lexproof-regulatory-graph-v1",
    projectId: "project-action-queue",
    generatedAt: "2026-06-30T00:00:00.000Z",
    matchedClauses: [],
    jurisdictionSummaries: [],
    evidenceGaps: [],
    topActions: [],
    notLegalAdviceBoundary: "Not legal advice. Regulatory graph output is audit preparation material only.",
    ...overrides
  };
}

function sourceReview({ actionCount }: { actionCount: number }): RegulatorySourceReview {
  return {
    status: actionCount > 0 ? "review-due" : "current",
    totalSourceCount: actionCount,
    currentSourceCount: 0,
    reviewDueCount: actionCount,
    metadataMissingCount: 0,
    reviewWindowDays: 90,
    items: [],
    actions: Array.from({ length: actionCount }, (_, index) => ({
      id: `source-review-${index + 1}`,
      priority: "P1",
      action: "Refresh source metadata before counsel handoff.",
      clauseId: `clause-${index + 1}`,
      sourceUrl: "https://example.com/source"
    })),
    notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only."
  };
}

function humanReviewQueue({
  openCount,
  blockedCount,
  items = []
}: {
  openCount: number;
  blockedCount: number;
  items?: HumanReviewQueue["items"];
}): HumanReviewQueue {
  return {
    queueVersion: "lexproof-human-review-queue-v1",
    items,
    summary: {
      totalCount: openCount + blockedCount,
      openCount,
      reviewedCount: 0,
      blockedCount,
      notLegalAdviceBoundary: "Not legal advice. Human review workflow status is audit preparation workflow only."
    }
  };
}

function humanReviewItem(overrides: Partial<HumanReviewQueue["items"][number]>): HumanReviewQueue["items"][number] {
  return {
    queueVersion: "lexproof-human-review-queue-item-v1",
    id: "human-review-queue-ai-event-default",
    projectId: "project-action-queue",
    targetType: "ai-event",
    targetId: "default-target",
    sourceId: "default-source",
    title: "Default review item",
    summary: "Review output before audit-prep reliance.",
    priority: "P1",
    status: "needs-review",
    reviewer: "Reviewer",
    decisionNote: "",
    dueAt: "2026-07-10T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only.",
    ...overrides
  };
}

function securityChecklist({
  overallStatus,
  blockerCount
}: {
  overallStatus: SecurityReviewChecklistReport["overallStatus"];
  blockerCount: number;
}): SecurityReviewChecklistReport {
  return {
    reportVersion: "lexproof-security-review-checklist-v1",
    overallStatus,
    readyCount: overallStatus === "ready" ? 3 : 0,
    reviewCount: overallStatus === "needs-review" ? 1 : 0,
    blockerCount,
    items: [],
    nextActions: [],
    notLegalAdviceBoundary: "Not legal advice. Security review checklist output is audit preparation metadata only."
  };
}

function dataBoundary({
  exportAllowed,
  blockerCount
}: {
  exportAllowed: boolean;
  blockerCount: number;
}): DataBoundaryReport {
  return {
    reportVersion: "lexproof-data-boundary-v1",
    status: exportAllowed ? "clean" : "blocked",
    exportAllowed,
    detectedClasses: [],
    blockerCount,
    warningCount: 0,
    findings: [],
    remediation: [],
    notLegalAdviceBoundary: "Not legal advice. Data boundary output is audit preparation material only."
  };
}

function recertificationQueue(): EvidenceRecertificationQueue {
  return {
    queueVersion: "lexproof-evidence-recertification-queue-v1",
    workspaceId: "workspace-action-queue",
    generatedAt: "2026-07-01T00:00:00.000Z",
    status: "needs-recertification",
    queueHash: "f".repeat(64),
    policy: {
      recertificationIntervalDays: 90,
      warningWindowDays: 14
    },
    summary: {
      totalActionCount: 1,
      overdueCount: 1,
      expiringCount: 0,
      sourceLinkedCount: 1,
      missingTimestampCount: 0
    },
    items: [
      {
        itemVersion: "lexproof-evidence-recertification-item-v1",
        id: "p0-claims-inventory",
        priority: "P0",
        evidenceIndex: 0,
        evidenceId: "claims-inventory",
        evidenceLabel: "Claims inventory",
        evidenceKind: "CSV",
        owner: "Compliance",
        evidenceStatus: "verified",
        lastReviewedAt: "2026-01-01T00:00:00.000Z",
        dueAt: "2026-04-01T00:00:00.000Z",
        ageDays: 181,
        daysUntilDue: -91,
        linkedControlIds: ["control-uae-vara-marketing-approval"],
        linkedRiskIds: ["risk-marketing-claims"],
        reason: "Evidence exceeded the recertification window for audit-prep reliance.",
        nextAction: "Recertify source-linked evidence before counsel/export reliance.",
        notLegalAdviceBoundary:
          "Not legal advice. Evidence recertification items are audit preparation workflow metadata only."
      }
    ],
    nextSteps: ["Refresh P0/P1 evidence metadata before counsel/export reliance."],
    notLegalAdviceBoundary:
      "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."
  };
}

function sourceApprovalQueue({
  metadataRequiredCount,
  approvalRequiredCount
}: {
  metadataRequiredCount: number;
  approvalRequiredCount: number;
}): RegulatorySourceApprovalQueue {
  const totalItemCount = metadataRequiredCount + approvalRequiredCount;

  return {
    queueVersion: "lexproof-regulatory-source-approval-queue-v1",
    generatedAt: "2026-07-01T00:00:00.000Z",
    status: metadataRequiredCount > 0 ? "needs-metadata" : approvalRequiredCount > 0 ? "needs-approval" : "empty",
    totalItemCount,
    approvalRequiredCount,
    metadataRequiredCount,
    items: [],
    notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only."
  };
}
