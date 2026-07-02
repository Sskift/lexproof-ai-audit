import type { RiskLevel } from "./auditEngine";
import type { WorkspaceActionPriority, WorkspaceActionQueue, WorkspaceActionTarget } from "./workspaceActionQueue";
import type { WorkspaceJourney } from "./workspaceJourney";

export type WorkspaceCockpitBriefStatus = "blocked" | "needs-action" | "ready";

export type WorkspaceCockpitFactStatus = WorkspaceCockpitBriefStatus;

export type WorkspaceCockpitFact = {
  label: string;
  value: string;
  helper: string;
  status: WorkspaceCockpitFactStatus;
};

export type WorkspaceCockpitNextAction = {
  target: WorkspaceActionTarget;
  priority: WorkspaceActionPriority;
  title: string;
  cta: string;
};

export type WorkspaceCockpitBrief = {
  briefVersion: "lexproof-workspace-cockpit-brief-v1";
  status: WorkspaceCockpitBriefStatus;
  headline: string;
  summary: string;
  nextAction: WorkspaceCockpitNextAction | null;
  facts: WorkspaceCockpitFact[];
  notLegalAdviceBoundary: "Not legal advice. Workspace cockpit status is audit preparation workflow metadata only.";
};

export type CreateWorkspaceCockpitBriefInput = {
  projectName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  evidenceCount: number;
  humanReviewOpenCount: number;
  humanReviewBlockedCount: number;
  manifestHash?: string;
  exportAllowed: boolean;
  counselPackVersionCount: number;
  journey: WorkspaceJourney;
  actionQueue: WorkspaceActionQueue;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Workspace cockpit status is audit preparation workflow metadata only.";

export function createWorkspaceCockpitBrief(input: CreateWorkspaceCockpitBriefInput): WorkspaceCockpitBrief {
  const status = createBriefStatus(input);
  const nextAction = createNextAction(input);

  return {
    briefVersion: "lexproof-workspace-cockpit-brief-v1",
    status,
    headline: createHeadline(status),
    summary: createSummary(input, status),
    nextAction,
    facts: createFacts(input),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

function createBriefStatus(input: CreateWorkspaceCockpitBriefInput): WorkspaceCockpitBriefStatus {
  const hasBlocker =
    input.journey.summary.blockedCount > 0 ||
    input.actionQueue.summary.p0Count > 0 ||
    input.humanReviewBlockedCount > 0 ||
    !input.exportAllowed;

  if (hasBlocker) {
    return "blocked";
  }

  const journeyReady = input.journey.summary.readyCount === input.journey.steps.length;
  const exportReady = Boolean(input.manifestHash) && input.counselPackVersionCount > 0;
  const reviewReady = input.humanReviewOpenCount === 0;

  return journeyReady && exportReady && reviewReady ? "ready" : "needs-action";
}

function createHeadline(status: WorkspaceCockpitBriefStatus): string {
  if (status === "blocked") {
    return "Audit-prep cockpit needs blocker recovery";
  }

  if (status === "ready") {
    return "Audit-prep packet ready for counsel handoff";
  }

  return "Audit-prep cockpit needs next actions";
}

function createSummary(input: CreateWorkspaceCockpitBriefInput, status: WorkspaceCockpitBriefStatus): string {
  const projectName = normalizeProjectName(input.projectName);
  const totalSteps = input.journey.steps.length;
  const readySteps = input.journey.summary.readyCount;
  const blockedSteps = input.journey.summary.blockedCount;
  const p0Count = input.actionQueue.summary.p0Count;

  if (status === "blocked") {
    return `${projectName} has ${blockedSteps} blocked journey step${blockedSteps === 1 ? "" : "s"} and ${p0Count} P0 action${p0Count === 1 ? "" : "s"} before counsel handoff.`;
  }

  if (status === "ready") {
    return `${projectName} has all ${totalSteps} journey steps ready with manifest ${formatHash(input.manifestHash)}.`;
  }

  return `${projectName} has ${readySteps}/${totalSteps} journey steps ready and ${input.actionQueue.summary.totalCount} open action${input.actionQueue.summary.totalCount === 1 ? "" : "s"}.`;
}

function createNextAction(input: CreateWorkspaceCockpitBriefInput): WorkspaceCockpitNextAction | null {
  const firstAction = input.actionQueue.items[0];
  if (firstAction) {
    return {
      target: firstAction.target,
      priority: firstAction.priority,
      title: firstAction.title,
      cta: firstAction.cta
    };
  }

  const nextStep = input.journey.steps.find((step) => step.status !== "ready");
  if (!nextStep) {
    return null;
  }

  return {
    target: nextStep.target,
    priority: nextStep.status === "blocked" ? "P0" : "P1",
    title: `Continue ${nextStep.label}`,
    cta: "Continue journey"
  };
}

function createFacts(input: CreateWorkspaceCockpitBriefInput): WorkspaceCockpitFact[] {
  return [
    {
      label: "Risk",
      value: input.riskLevel,
      helper: `${input.riskScore}/100 deterministic audit score`,
      status: riskFactStatus(input.riskLevel)
    },
    {
      label: "Journey",
      value: `${input.journey.summary.readyCount}/${input.journey.steps.length} ready`,
      helper: `${input.journey.summary.blockedCount} blocked step${input.journey.summary.blockedCount === 1 ? "" : "s"}`,
      status: input.journey.summary.blockedCount > 0 ? "blocked" : input.journey.summary.readyCount === input.journey.steps.length ? "ready" : "needs-action"
    },
    {
      label: "Evidence",
      value: String(input.evidenceCount),
      helper: "metadata-only records",
      status: input.evidenceCount > 0 ? "ready" : "needs-action"
    },
    {
      label: "Human review",
      value: `${input.humanReviewOpenCount + input.humanReviewBlockedCount} open`,
      helper: `${input.humanReviewBlockedCount} blocked or returned`,
      status: input.humanReviewBlockedCount > 0 ? "blocked" : input.humanReviewOpenCount > 0 ? "needs-action" : "ready"
    },
    {
      label: "Manifest",
      value: input.manifestHash ? formatHash(input.manifestHash) : "pending",
      helper: input.manifestHash ? "bundle hash" : "generate evidence manifest",
      status: input.manifestHash ? "ready" : "needs-action"
    },
    {
      label: "Export",
      value: input.exportAllowed && input.counselPackVersionCount > 0 ? "ready" : input.exportAllowed ? "needs version" : "blocked",
      helper: `${input.counselPackVersionCount} saved version${input.counselPackVersionCount === 1 ? "" : "s"}`,
      status: !input.exportAllowed ? "blocked" : input.counselPackVersionCount > 0 ? "ready" : "needs-action"
    }
  ];
}

function riskFactStatus(riskLevel: RiskLevel): WorkspaceCockpitFactStatus {
  if (riskLevel === "critical" || riskLevel === "high") {
    return "blocked";
  }

  return riskLevel === "moderate" ? "needs-action" : "ready";
}

function formatHash(hash: string | undefined): string {
  return hash ? hash.slice(0, 12) : "pending";
}

function normalizeProjectName(projectName: string): string {
  return projectName.trim() || "This workspace";
}
