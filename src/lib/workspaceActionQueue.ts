import type { DataBoundaryReport } from "./dataBoundary";
import type { EvidenceRecertificationQueue } from "./evidenceRecertification";
import type { HumanReviewQueue, HumanReviewQueueItem } from "./humanReviewWorkflow";
import type { ProjectValidationResult } from "./projectModel";
import type { RegulatoryGraph } from "./regulatoryGraph";
import type { RegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import type { RegulatorySourceReview } from "./regulatorySourceReview";
import type { SecurityReviewChecklistReport } from "./securityReviewChecklist";

export type WorkspaceActionTarget =
  | "wizard"
  | "ai"
  | "model"
  | "review"
  | "jurisdiction"
  | "risk"
  | "evidence"
  | "counsel"
  | "sources";

export type WorkspaceActionFocusTarget = "source-gap-triage" | "source-approval-queue";

export type WorkspaceActionPriority = "P0" | "P1" | "P2" | "P3";

export type WorkspaceActionItem = {
  actionVersion: "lexproof-workspace-action-v1";
  id: string;
  priority: WorkspaceActionPriority;
  target: WorkspaceActionTarget;
  title: string;
  summary: string;
  cta: string;
  focusTarget?: WorkspaceActionFocusTarget;
  notLegalAdviceBoundary: "Not legal advice. Workspace actions are audit preparation workflow prompts only.";
};

export type WorkspaceActionQueue = {
  queueVersion: "lexproof-workspace-action-queue-v1";
  items: WorkspaceActionItem[];
  summary: {
    totalCount: number;
    p0Count: number;
    nextTarget: WorkspaceActionTarget | "none";
    notLegalAdviceBoundary: "Not legal advice. Workspace actions are audit preparation workflow prompts only.";
  };
  notLegalAdviceBoundary: "Not legal advice. Workspace actions are audit preparation workflow prompts only.";
};

export type CreateWorkspaceActionQueueInput = {
  validation: ProjectValidationResult;
  regulatoryGraph: RegulatoryGraph;
  sourceReview: RegulatorySourceReview;
  sourceApprovalQueue?: RegulatorySourceApprovalQueue;
  humanReviewQueue: HumanReviewQueue;
  securityReviewChecklist: SecurityReviewChecklistReport;
  dataBoundaryReport: DataBoundaryReport;
  evidenceCount: number;
  manifestHash?: string;
  counselPackVersionCount: number;
  evidenceRecertificationQueue?: EvidenceRecertificationQueue;
  evaluatedAt?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Workspace actions are audit preparation workflow prompts only.";

export function createWorkspaceActionQueue(input: CreateWorkspaceActionQueueInput): WorkspaceActionQueue {
  const actions = [
    createProjectFactsAction(input.validation),
    createHumanReviewRecoveryAction(input.humanReviewQueue),
    createRegulatoryEvidenceAction(input.regulatoryGraph),
    createExportSafetyAction(input.dataBoundaryReport),
    createEvidenceRecertificationAction(input.evidenceRecertificationQueue),
    createSourceRefreshAction(input.sourceReview),
    createSourceApprovalAction(input.sourceApprovalQueue),
    createHumanReviewOpenAction(input.humanReviewQueue, input.evaluatedAt),
    createSecurityReadinessAction(input.securityReviewChecklist),
    createCounselPackVersionAction(input),
    createCounselPackExportAction(input)
  ].filter((item): item is WorkspaceActionItem => Boolean(item));
  const items = actions.sort(compareActions);

  return {
    queueVersion: "lexproof-workspace-action-queue-v1",
    items,
    summary: {
      totalCount: items.length,
      p0Count: items.filter((item) => item.priority === "P0").length,
      nextTarget: items[0]?.target ?? "none",
      notLegalAdviceBoundary: NOT_LEGAL_ADVICE
    },
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

function createProjectFactsAction(validation: ProjectValidationResult): WorkspaceActionItem | null {
  if (validation.valid) {
    return null;
  }

  return createAction({
    id: "complete-project-facts",
    priority: "P0",
    target: "wizard",
    title: "Complete project facts",
    summary: `${validation.errors.length} required project fact${validation.errors.length === 1 ? "" : "s"} need attention before review handoff.`,
    cta: "Open fact intake"
  });
}

function createHumanReviewRecoveryAction(queue: HumanReviewQueue): WorkspaceActionItem | null {
  if (queue.summary.blockedCount === 0) {
    return null;
  }

  return createAction({
    id: "recover-human-review",
    priority: "P0",
    target: "review",
    title: "Recover blocked review decisions",
    summary: `${queue.summary.blockedCount} review item${queue.summary.blockedCount === 1 ? " is" : "s are"} rejected or waiting on more evidence before export readiness.`,
    cta: "Open review queue"
  });
}

function createRegulatoryEvidenceAction(graph: RegulatoryGraph): WorkspaceActionItem | null {
  if (graph.evidenceGaps.length === 0) {
    return null;
  }

  const firstGap = graph.evidenceGaps[0];

  return createAction({
    id: "resolve-regulatory-evidence-gaps",
    priority: firstGap.priority === "P0" ? "P0" : "P1",
    target: "evidence",
    title: "Resolve source evidence gaps",
    summary: `${graph.evidenceGaps.length} source-linked evidence gap${graph.evidenceGaps.length === 1 ? "" : "s"} open. First: ${firstGap.title} for ${firstGap.citation}.`,
    cta: "Open source gap triage",
    focusTarget: "source-gap-triage"
  });
}

function createExportSafetyAction(report: DataBoundaryReport): WorkspaceActionItem | null {
  if (report.exportAllowed) {
    return null;
  }

  return createAction({
    id: "clear-export-safety-gate",
    priority: "P0",
    target: "counsel",
    title: "Clear Export Safety Gate",
    summary: `${report.blockerCount} blocked data-boundary finding${report.blockerCount === 1 ? "" : "s"} must be remediated before pack export.`,
    cta: "Open export queue"
  });
}

function createEvidenceRecertificationAction(queue: EvidenceRecertificationQueue | undefined): WorkspaceActionItem | null {
  if (!queue || queue.summary.totalActionCount === 0 || queue.status === "ready") {
    return null;
  }

  const firstItem = queue.items[0];
  const priority = queue.summary.overdueCount > 0 || firstItem?.priority === "P0" ? "P0" : "P1";
  const dueLabel = firstItem?.dueAt && firstItem.dueAt !== "missing" ? ` due ${firstItem.dueAt.slice(0, 10)}` : "";
  const firstLabel = firstItem ? ` First: ${firstItem.evidenceLabel}${dueLabel}.` : "";

  return createAction({
    id: "recertify-stale-evidence",
    priority,
    target: "evidence",
    title: "Recertify stale evidence",
    summary: `${queue.summary.totalActionCount} evidence recertification action${queue.summary.totalActionCount === 1 ? "" : "s"} open; ${queue.summary.sourceLinkedCount} source-linked.${firstLabel}`,
    cta: "Open recertification queue"
  });
}

function createSourceRefreshAction(sourceReview: RegulatorySourceReview): WorkspaceActionItem | null {
  if (sourceReview.actions.length === 0) {
    return null;
  }

  return createAction({
    id: "refresh-source-review",
    priority: sourceReview.actions.some((action) => action.priority === "P0") ? "P0" : "P1",
    target: "review",
    title: "Refresh source review metadata",
    summary: `${sourceReview.actions.length} source refresh action${sourceReview.actions.length === 1 ? "" : "s"} due. First: ${sourceReview.actions[0].action}`,
    cta: "Open review queue"
  });
}

function createSourceApprovalAction(queue: RegulatorySourceApprovalQueue | undefined): WorkspaceActionItem | null {
  if (!queue || queue.totalItemCount === 0 || queue.status === "empty") {
    return null;
  }

  const metadataLabel =
    queue.metadataRequiredCount > 0
      ? `${queue.metadataRequiredCount} metadata gate${queue.metadataRequiredCount === 1 ? "" : "s"}`
      : "no metadata gates";
  const approvalLabel =
    queue.approvalRequiredCount > 0
      ? `${queue.approvalRequiredCount} approval gate${queue.approvalRequiredCount === 1 ? "" : "s"}`
      : "no approval gates";

  return createAction({
    id: "approve-source-updates",
    priority: queue.metadataRequiredCount > 0 ? "P0" : "P1",
    target: "review",
    title: "Review source update approvals",
    summary: `${queue.totalItemCount} source update approval gate${queue.totalItemCount === 1 ? "" : "s"} open: ${metadataLabel} and ${approvalLabel}. Matching behavior remains unchanged until review records refreshed metadata.`,
    cta: "Open source approval queue",
    focusTarget: "source-approval-queue"
  });
}

function createHumanReviewOpenAction(queue: HumanReviewQueue, evaluatedAt = new Date().toISOString()): WorkspaceActionItem | null {
  if (queue.summary.openCount === 0) {
    return null;
  }

  const overdueItems = getOverdueHumanReviewItems(queue, evaluatedAt);
  if (overdueItems.length > 0) {
    const firstItem = overdueItems[0];
    const dueLabel = firstItem.dueAt.slice(0, 10);

    return createAction({
      id: "complete-human-review",
      priority: "P0",
      target: "review",
      title: "Resolve overdue human review",
      summary: `${overdueItems.length} open review item${overdueItems.length === 1 ? "" : "s"} overdue before export reliance. First: ${firstItem.title} due ${dueLabel}; reviewer ${firstItem.reviewer}.`,
      cta: "Open review queue"
    });
  }

  return createAction({
    id: "complete-human-review",
    priority: "P1",
    target: "review",
    title: "Complete human review queue",
    summary: `${queue.summary.openCount} review item${queue.summary.openCount === 1 ? "" : "s"} need reviewer status before external reliance.`,
    cta: "Open review queue"
  });
}

function getOverdueHumanReviewItems(queue: HumanReviewQueue, evaluatedAt: string): HumanReviewQueueItem[] {
  const evaluatedTime = Date.parse(evaluatedAt);
  if (Number.isNaN(evaluatedTime)) {
    return [];
  }

  return queue.items
    .filter((item) => item.status !== "reviewed" && item.status !== "rejected")
    .filter((item) => {
      const dueTime = Date.parse(item.dueAt);
      return !Number.isNaN(dueTime) && dueTime < evaluatedTime;
    })
    .sort(
      (left, right) =>
        Date.parse(left.dueAt) - Date.parse(right.dueAt) ||
        priorityWeight(left.priority) - priorityWeight(right.priority) ||
        left.title.localeCompare(right.title)
    );
}

function createSecurityReadinessAction(report: SecurityReviewChecklistReport): WorkspaceActionItem | null {
  if (report.overallStatus === "ready") {
    return null;
  }

  return createAction({
    id: "validate-security-readiness",
    priority: report.overallStatus === "blocked" ? "P1" : "P2",
    target: "model",
    title: "Validate security readiness",
    summary: `${report.blockerCount} blocker${report.blockerCount === 1 ? "" : "s"} and ${report.reviewCount} review gate${report.reviewCount === 1 ? "" : "s"} remain before real integrations.`,
    cta: "Open model gate"
  });
}

function createCounselPackVersionAction(input: CreateWorkspaceActionQueueInput): WorkspaceActionItem | null {
  if (input.counselPackVersionCount > 0) {
    return null;
  }

  return createAction({
    id: "save-counsel-pack-version",
    priority: input.dataBoundaryReport.exportAllowed && input.manifestHash ? "P2" : "P3",
    target: "counsel",
    title: "Save first Counsel Pack version",
    summary: input.manifestHash
      ? `Manifest ${input.manifestHash.slice(0, 12)} is available; save a version after review blockers are cleared.`
      : "Save a Counsel Pack version after evidence manifest generation and export safety checks are ready.",
    cta: "Open export queue"
  });
}

function createCounselPackExportAction(input: CreateWorkspaceActionQueueInput): WorkspaceActionItem | null {
  if (!input.dataBoundaryReport.exportAllowed || input.counselPackVersionCount === 0 || !input.manifestHash) {
    return null;
  }

  return createAction({
    id: "download-counsel-pack",
    priority: "P3",
    target: "counsel",
    title: "Export counsel-ready packet",
    summary: `Manifest ${input.manifestHash.slice(0, 12)} is ready with ${input.counselPackVersionCount} saved Counsel Pack version${input.counselPackVersionCount === 1 ? "" : "s"}.`,
    cta: "Open export queue"
  });
}

function createAction(input: Omit<WorkspaceActionItem, "actionVersion" | "notLegalAdviceBoundary">): WorkspaceActionItem {
  return {
    actionVersion: "lexproof-workspace-action-v1",
    ...input,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

function compareActions(left: WorkspaceActionItem, right: WorkspaceActionItem): number {
  return priorityWeight(left.priority) - priorityWeight(right.priority) || actionOrder(left.id) - actionOrder(right.id) || left.title.localeCompare(right.title);
}

function priorityWeight(priority: WorkspaceActionPriority): number {
  return { P0: 0, P1: 1, P2: 2, P3: 3 }[priority];
}

function actionOrder(id: string): number {
  return [
    "complete-project-facts",
    "recover-human-review",
    "resolve-regulatory-evidence-gaps",
    "clear-export-safety-gate",
    "recertify-stale-evidence",
    "refresh-source-review",
    "approve-source-updates",
    "complete-human-review",
    "validate-security-readiness",
    "save-counsel-pack-version",
    "download-counsel-pack"
  ].indexOf(id);
}
