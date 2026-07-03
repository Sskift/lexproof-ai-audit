import { describe, expect, it } from "vitest";
import {
  createWorkspaceCockpitBrief,
  createWorkspaceCockpitHandoff,
  exportWorkspaceCockpitHandoffJson
} from "./workspaceCockpitBrief";
import type { WorkspaceActionQueue } from "./workspaceActionQueue";
import type { WorkspaceJourney, WorkspaceJourneyStatus } from "./workspaceJourney";

describe("createWorkspaceCockpitBrief", () => {
  it("prioritizes blocked review recovery as the first-screen next action without legal conclusions", () => {
    const brief = createWorkspaceCockpitBrief({
      projectName: "RWA Launch Review",
      riskLevel: "high",
      riskScore: 82,
      evidenceCount: 2,
      humanReviewOpenCount: 1,
      humanReviewBlockedCount: 1,
      manifestHash: "abc123def4567890abc123def4567890abc123def4567890abc123def4567890",
      exportAllowed: false,
      counselPackVersionCount: 0,
      journey: journey([
        "ready",
        "ready",
        "needs-review",
        "blocked",
        "ready",
        "blocked"
      ]),
      actionQueue: actionQueue([
        {
          id: "recover-human-review",
          priority: "P0",
          target: "review",
          title: "Recover blocked review decisions",
          cta: "Open review queue"
        },
        {
          id: "clear-export-safety-gate",
          priority: "P0",
          target: "counsel",
          title: "Clear Export Safety Gate",
          cta: "Open export queue"
        }
      ])
    });

    expect(brief).toEqual(
      expect.objectContaining({
        briefVersion: "lexproof-workspace-cockpit-brief-v1",
        status: "blocked",
        headline: "Audit-prep cockpit needs blocker recovery",
        summary: "RWA Launch Review has 2 blocked journey steps and 2 P0 actions before counsel handoff.",
        notLegalAdviceBoundary: "Not legal advice. Workspace cockpit status is audit preparation workflow metadata only."
      })
    );
    expect(brief.nextAction).toEqual({
      target: "review",
      priority: "P0",
      title: "Recover blocked review decisions",
      cta: "Open review queue"
    });
    expect(brief.facts).toEqual([
      { label: "Risk", value: "high", helper: "82/100 deterministic audit score", status: "blocked" },
      { label: "Journey", value: "3/6 ready", helper: "2 blocked steps", status: "blocked" },
      { label: "Evidence", value: "2", helper: "metadata-only records", status: "ready" },
      { label: "Human review", value: "2 open", helper: "1 blocked or returned", status: "blocked" },
      { label: "Manifest", value: "abc123def456", helper: "bundle hash", status: "ready" },
      { label: "Export", value: "blocked", helper: "0 saved versions", status: "blocked" }
    ]);
    expect(JSON.stringify(brief)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal approval\b/i);
  });

  it("marks the first-screen cockpit ready when the journey is ready and only export download remains", () => {
    const brief = createWorkspaceCockpitBrief({
      projectName: "AI Governance Review",
      riskLevel: "moderate",
      riskScore: 52,
      evidenceCount: 5,
      humanReviewOpenCount: 0,
      humanReviewBlockedCount: 0,
      manifestHash: "f".repeat(64),
      exportAllowed: true,
      counselPackVersionCount: 2,
      journey: journey(["ready", "ready", "ready", "ready", "ready", "ready"]),
      actionQueue: actionQueue([
        {
          id: "download-counsel-pack",
          priority: "P3",
          target: "counsel",
          title: "Export counsel-ready packet",
          cta: "Open export queue"
        }
      ])
    });

    expect(brief).toEqual(
      expect.objectContaining({
        status: "ready",
        headline: "Audit-prep packet ready for counsel handoff",
        summary: "AI Governance Review has all 6 journey steps ready with manifest ffffffffffff.",
        nextAction: {
          target: "counsel",
          priority: "P3",
          title: "Export counsel-ready packet",
          cta: "Open export queue"
        }
      })
    );
    expect(brief.facts.find((fact) => fact.label === "Export")).toEqual({
      label: "Export",
      value: "ready",
      helper: "2 saved versions",
      status: "ready"
    });
    expect(JSON.stringify(brief)).toContain("Not legal advice");
  });

  it("exports a stable metadata-only cockpit handoff without leaking credential-like project names", async () => {
    const sharedJourney = journey(["ready", "ready", "needs-review", "ready", "ready", "needs-review"]);
    const sharedActionQueue = actionQueue([
      {
        id: "complete-human-review",
        priority: "P1",
        target: "review",
        title: "Complete human review queue",
        cta: "Open review queue"
      }
    ]);
    const brief = createWorkspaceCockpitBrief({
      projectName: "Gateway sk-live-1234567890abcdef audit",
      riskLevel: "moderate",
      riskScore: 48,
      evidenceCount: 4,
      humanReviewOpenCount: 1,
      humanReviewBlockedCount: 0,
      manifestHash: "a".repeat(64),
      exportAllowed: true,
      counselPackVersionCount: 1,
      journey: sharedJourney,
      actionQueue: sharedActionQueue
    });

    const first = await createWorkspaceCockpitHandoff({
      projectId: "project-cockpit",
      projectName: "Gateway sk-live-1234567890abcdef audit",
      riskLevel: "moderate",
      riskScore: 48,
      evidenceCount: 4,
      humanReviewOpenCount: 1,
      humanReviewBlockedCount: 0,
      manifestHash: "a".repeat(64),
      exportAllowed: true,
      counselPackVersionCount: 1,
      journey: sharedJourney,
      actionQueue: sharedActionQueue,
      cockpitBrief: brief,
      generatedAt: "2026-07-01T00:00:00.000Z"
    });
    const second = await createWorkspaceCockpitHandoff({
      projectId: "project-cockpit",
      projectName: "Gateway sk-live-1234567890abcdef audit",
      riskLevel: "moderate",
      riskScore: 48,
      evidenceCount: 4,
      humanReviewOpenCount: 1,
      humanReviewBlockedCount: 0,
      manifestHash: "a".repeat(64),
      exportAllowed: true,
      counselPackVersionCount: 1,
      journey: sharedJourney,
      actionQueue: sharedActionQueue,
      cockpitBrief: brief,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const exported = exportWorkspaceCockpitHandoffJson(first);

    expect(first.handoffVersion).toBe("lexproof-workspace-cockpit-handoff-v1");
    expect(first.handoffHash).toMatch(/^[a-f0-9]{64}$/);
    expect(second.handoffHash).toBe(first.handoffHash);
    expect(first.projectName).toContain("[redacted-api-key]");
    expect(exported).not.toContain("sk-live-1234567890abcdef");
    expect(exported).toContain("Not legal advice. Workspace cockpit handoffs are audit preparation workflow metadata only.");
    expect(exported).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal approval\b/i);
    expect(first.openActions[0]).toEqual(
      expect.objectContaining({
        id: "complete-human-review",
        priority: "P1",
        target: "review",
        title: "Complete human review queue"
      })
    );
  });
});

function journey(statuses: WorkspaceJourneyStatus[]): WorkspaceJourney {
  const ids: WorkspaceJourney["steps"][number]["id"][] = [
    "project-facts",
    "model-evidence-intake",
    "risk-source-graph",
    "human-review",
    "vault-manifest",
    "counsel-export"
  ];
  const targets: WorkspaceJourney["steps"][number]["target"][] = ["wizard", "model", "risk", "review", "evidence", "counsel"];
  const steps = statuses.map((status, index) => ({
    stepVersion: "lexproof-workspace-journey-step-v1" as const,
    id: ids[index],
    label: ids[index],
    target: targets[index],
    status,
    summary: `${ids[index]} ${status}`,
    detail: `${ids[index]} detail`,
    notLegalAdviceBoundary: "Not legal advice. Workspace journey status is audit preparation workflow metadata only." as const
  }));

  return {
    journeyVersion: "lexproof-workspace-journey-v1",
    steps,
    summary: {
      readyCount: steps.filter((step) => step.status === "ready").length,
      blockedCount: steps.filter((step) => step.status === "blocked").length,
      nextTarget: steps.find((step) => step.status !== "ready")?.target ?? "none",
      nextStepId: steps.find((step) => step.status !== "ready")?.id ?? "none",
      notLegalAdviceBoundary: "Not legal advice. Workspace journey status is audit preparation workflow metadata only."
    },
    notLegalAdviceBoundary: "Not legal advice. Workspace journey status is audit preparation workflow metadata only."
  };
}

function actionQueue(
  items: Array<Pick<WorkspaceActionQueue["items"][number], "id" | "priority" | "target" | "title" | "cta">>
): WorkspaceActionQueue {
  return {
    queueVersion: "lexproof-workspace-action-queue-v1",
    items: items.map((item) => ({
      actionVersion: "lexproof-workspace-action-v1",
      ...item,
      summary: `${item.title} summary`,
      notLegalAdviceBoundary: "Not legal advice. Workspace actions are audit preparation workflow prompts only."
    })),
    summary: {
      totalCount: items.length,
      p0Count: items.filter((item) => item.priority === "P0").length,
      nextTarget: items[0]?.target ?? "none",
      notLegalAdviceBoundary: "Not legal advice. Workspace actions are audit preparation workflow prompts only."
    },
    notLegalAdviceBoundary: "Not legal advice. Workspace actions are audit preparation workflow prompts only."
  };
}
