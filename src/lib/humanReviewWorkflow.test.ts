import { describe, expect, it } from "vitest";
import type { CounselReviewItem } from "./counselReview";
import {
  createHumanReviewDecision,
  createHumanReviewQueue,
  createHumanReviewTimeline,
  exportHumanReviewTimelineJson
} from "./humanReviewWorkflow";
import type { AIEventRecord } from "./modelIntake";
import type { EvidenceItem } from "./projectModel";
import type { RegulatorySourceReview } from "./regulatorySourceReview";

const counselReview: CounselReviewItem = {
  id: "project-1-review-asset-yield",
  projectId: "project-1",
  flagId: "asset-yield",
  title: "Yield-bearing or investment-like asset",
  severity: "critical",
  owner: "Counsel",
  priority: "P0",
  status: "needs-evidence",
  evidenceSummary: "1/3 evidence requirements covered",
  reviewer: "",
  reviewerNote: "",
  updatedAt: "2026-06-30T00:00:00.000Z",
  notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
};

const evidence: EvidenceItem = {
  id: "evidence-1",
  label: "Disclosure memo",
  kind: "Markdown",
  content: "Offering disclosure assumptions.",
  status: "received",
  owner: "Compliance",
  updatedAt: "2026-06-30T00:00:00.000Z"
};

const aiEvent: AIEventRecord = {
  id: "ai-event-1",
  projectId: "project-1",
  eventType: "AI Review run",
  inputSummary: "3 evidence summaries",
  outputSummary: "1 draft counsel question",
  modelAction: "Mock model produced an audit-prep draft.",
  humanReviewer: "Compliance",
  reviewStatus: "needs-review",
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z"
};

const sourceReview: RegulatorySourceReview = {
  status: "review-due",
  totalSourceCount: 1,
  currentSourceCount: 0,
  reviewDueCount: 1,
  metadataMissingCount: 0,
  reviewWindowDays: 90,
  items: [
    {
      clauseId: "eu-mica-title-ii-white-paper",
      jurisdiction: "European Union",
      regulator: "European Union",
      citation: "Regulation (EU) 2023/1114, Title II",
      sourceName: "Regulation (EU) 2023/1114 on markets in crypto-assets",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
      effectiveAsOf: "2024-12-30",
      lastReviewedAt: "2026-01-01",
      nextReviewDueAt: "2026-04-01",
      reviewStatus: "review-due",
      reviewerNotes: "Route interpretation to local counsel."
    }
  ],
  actions: [
    {
      id: "source-review-eu-mica-title-ii-white-paper",
      priority: "P1",
      action: "Refresh Regulation (EU) 2023/1114, Title II source metadata before counsel handoff.",
      clauseId: "eu-mica-title-ii-white-paper",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng"
    }
  ],
  notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only."
};

describe("human review workflow", () => {
  it("builds a single review queue across risk flags, evidence, and AI events", () => {
    const queue = createHumanReviewQueue({
      projectId: "project-1",
      counselReviews: [counselReview],
      evidenceItems: [evidence],
      aiEvents: [aiEvent]
    });

    expect(queue.summary).toEqual({
      totalCount: 3,
      openCount: 3,
      reviewedCount: 0,
      blockedCount: 0,
      notLegalAdviceBoundary: "Not legal advice. Human review workflow status is audit preparation workflow only."
    });
    expect(queue.items.map((item) => `${item.targetType}:${item.title}`)).toEqual([
      "risk-flag:Yield-bearing or investment-like asset",
      "ai-event:AI Review run",
      "evidence:Disclosure memo"
    ]);
    expect(queue.items[1]).toEqual(
      expect.objectContaining({
        targetId: "ai-event-1",
        status: "needs-review",
        reviewer: "Compliance",
        notLegalAdviceBoundary: "Not legal advice. Human review queue items are audit preparation workflow records only."
      })
    );
  });

  it("queues source review refresh actions as clause-match human review records", () => {
    const queue = createHumanReviewQueue({
      projectId: "project-1",
      counselReviews: [],
      evidenceItems: [],
      aiEvents: [],
      sourceReview,
      sourceReviewUpdatedAt: "2026-06-30T00:00:00.000Z"
    });

    expect(queue.summary).toEqual({
      totalCount: 1,
      openCount: 1,
      reviewedCount: 0,
      blockedCount: 0,
      notLegalAdviceBoundary: "Not legal advice. Human review workflow status is audit preparation workflow only."
    });
    expect(queue.items[0]).toEqual(
      expect.objectContaining({
        id: "human-review-queue-clause-match-source-review-eu-mica-title-ii-white-paper",
        targetType: "clause-match",
        targetId: "source-review-eu-mica-title-ii-white-paper",
        sourceId: "eu-mica-title-ii-white-paper",
        title: "Regulation (EU) 2023/1114, Title II",
        summary:
          "Refresh Regulation (EU) 2023/1114, Title II source metadata before counsel handoff. Source: https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
        priority: "P1",
        status: "needs-review",
        reviewer: "Local counsel",
        decisionNote: "Not legal advice. Source review metadata is audit preparation lineage only.",
        dueAt: "2026-07-05T00:00:00.000Z",
        updatedAt: "2026-06-30T00:00:00.000Z"
      })
    );
  });

  it("creates a review decision without turning workflow status into legal advice", () => {
    const queue = createHumanReviewQueue({
      projectId: "project-1",
      counselReviews: [counselReview],
      evidenceItems: [evidence],
      aiEvents: [aiEvent]
    });

    const decision = createHumanReviewDecision(
      queue.items[1],
      {
        status: "reviewed",
        reviewer: "Outside counsel",
        decisionNote: "Reviewed AI output for audit-prep handoff."
      },
      "2026-06-30T01:00:00.000Z"
    );

    expect(decision).toEqual({
      decisionVersion: "lexproof-human-review-decision-v1",
      id: "human-review-ai-event-ai-event-1",
      projectId: "project-1",
      targetType: "ai-event",
      targetId: "ai-event-1",
      title: "AI Review run",
      status: "reviewed",
      reviewer: "Outside counsel",
      decisionNote: "Reviewed AI output for audit-prep handoff.",
      dueAt: "2026-07-05T00:00:00.000Z",
      updatedAt: "2026-06-30T01:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Human review decisions track audit preparation workflow status only."
    });
  });

  it("adds due dates and applies the latest decision as status history grows", () => {
    const initialQueue = createHumanReviewQueue({
      projectId: "project-1",
      counselReviews: [counselReview],
      evidenceItems: [evidence],
      aiEvents: [aiEvent]
    });
    const olderDecision = createHumanReviewDecision(
      initialQueue.items[0],
      {
        status: "in-review",
        reviewer: "Compliance",
        decisionNote: "Started review.",
        dueAt: "2026-07-01T00:00:00.000Z"
      },
      "2026-06-30T01:00:00.000Z"
    );
    const newerDecision = createHumanReviewDecision(
      initialQueue.items[0],
      {
        status: "needs-more-evidence",
        reviewer: "Outside counsel",
        decisionNote: "Return for source-linked disclosure memo.",
        dueAt: "2026-07-03T00:00:00.000Z"
      },
      "2026-06-30T02:00:00.000Z"
    );

    const queue = createHumanReviewQueue({
      projectId: "project-1",
      counselReviews: [counselReview],
      evidenceItems: [evidence],
      aiEvents: [aiEvent],
      decisions: [newerDecision, olderDecision]
    });

    expect(initialQueue.items.map((item) => `${item.priority}:${item.dueAt}`)).toEqual([
      "P0:2026-07-02T00:00:00.000Z",
      "P1:2026-07-05T00:00:00.000Z",
      "P2:2026-07-10T00:00:00.000Z"
    ]);
    expect(queue.items[0]).toEqual(
      expect.objectContaining({
        status: "needs-more-evidence",
        reviewer: "Outside counsel",
        decisionNote: "Return for source-linked disclosure memo.",
        dueAt: "2026-07-03T00:00:00.000Z"
      })
    );
  });

  it("exports a review timeline with deterministic audit log IDs and non-advice boundaries", () => {
    const queue = createHumanReviewQueue({
      projectId: "project-1",
      counselReviews: [counselReview],
      evidenceItems: [evidence],
      aiEvents: [aiEvent]
    });
    const decision = createHumanReviewDecision(
      queue.items[2],
      {
        status: "rejected",
        reviewer: "Compliance",
        decisionNote: "Rejected until replacement evidence is attached.",
        dueAt: "2026-07-04T00:00:00.000Z"
      },
      "2026-06-30T02:00:00.000Z"
    );
    const timeline = createHumanReviewTimeline({
      projectId: "project-1",
      queue,
      decisions: [decision]
    });

    expect(timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "review.requested",
          targetType: "risk-flag",
          auditLogId: expect.stringMatching(/^human-review-audit-[a-f0-9]{12}$/),
          dueAt: "2026-07-02T00:00:00.000Z",
          notLegalAdviceBoundary: "Not legal advice. Human review timeline entries are audit preparation metadata only."
        }),
        expect.objectContaining({
          action: "review.decision.saved",
          targetType: "evidence",
          status: "rejected",
          reviewer: "Compliance",
          decisionNote: "Rejected until replacement evidence is attached.",
          auditLogId: expect.stringMatching(/^human-review-audit-[a-f0-9]{12}$/)
        })
      ])
    );

    const exported = JSON.parse(exportHumanReviewTimelineJson(timeline));
    expect(exported.timelineVersion).toBe("lexproof-human-review-timeline-v1");
    expect(exported.entries).toHaveLength(4);
    expect(JSON.stringify(exported)).toContain("Not legal advice");
  });
});
