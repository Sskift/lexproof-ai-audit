import type { HumanReviewWorkflowSummary } from "./humanReviewWorkflow";
import type { ModelConnectReceipt } from "./modelConnect";
import type { ProjectValidationResult } from "./projectModel";
import type { RegulatorySourceReviewStatus } from "./regulatorySourceReview";
import type { WorkspaceActionTarget } from "./workspaceActionQueue";

export type WorkspaceJourneyStepId =
  | "project-facts"
  | "model-evidence-intake"
  | "risk-source-graph"
  | "human-review"
  | "vault-manifest"
  | "counsel-export";

export type WorkspaceJourneyStatus = "blocked" | "needs-input" | "needs-review" | "ready";

export type WorkspaceJourneyStep = {
  stepVersion: "lexproof-workspace-journey-step-v1";
  id: WorkspaceJourneyStepId;
  label: string;
  target: WorkspaceActionTarget;
  status: WorkspaceJourneyStatus;
  summary: string;
  detail: string;
  notLegalAdviceBoundary: "Not legal advice. Workspace journey status is audit preparation workflow metadata only.";
};

export type WorkspaceJourney = {
  journeyVersion: "lexproof-workspace-journey-v1";
  steps: WorkspaceJourneyStep[];
  summary: {
    readyCount: number;
    blockedCount: number;
    nextTarget: WorkspaceActionTarget | "none";
    nextStepId: WorkspaceJourneyStepId | "none";
    notLegalAdviceBoundary: "Not legal advice. Workspace journey status is audit preparation workflow metadata only.";
  };
  notLegalAdviceBoundary: "Not legal advice. Workspace journey status is audit preparation workflow metadata only.";
};

export type CreateWorkspaceJourneyInput = {
  validation: Pick<ProjectValidationResult, "valid" | "errors">;
  evidenceCount: number;
  modelConnectStatus: ModelConnectReceipt["status"] | "not-configured";
  regulatoryTriggerCount: number;
  evidenceGapCount: number;
  sourceReviewStatus: RegulatorySourceReviewStatus;
  humanReviewSummary: Pick<HumanReviewWorkflowSummary, "totalCount" | "openCount" | "blockedCount" | "reviewedCount">;
  manifestHash?: string;
  exportAllowed: boolean;
  counselPackVersionCount: number;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Workspace journey status is audit preparation workflow metadata only.";

export function createWorkspaceJourney(input: CreateWorkspaceJourneyInput): WorkspaceJourney {
  const steps: WorkspaceJourneyStep[] = [
    createProjectFactsStep(input),
    createModelEvidenceStep(input),
    createRiskSourceStep(input),
    createHumanReviewStep(input),
    createVaultManifestStep(input),
    createCounselExportStep(input)
  ];
  const nextStep = steps.find((step) => step.status !== "ready");

  return {
    journeyVersion: "lexproof-workspace-journey-v1",
    steps,
    summary: {
      readyCount: steps.filter((step) => step.status === "ready").length,
      blockedCount: steps.filter((step) => step.status === "blocked").length,
      nextTarget: nextStep?.target ?? "none",
      nextStepId: nextStep?.id ?? "none",
      notLegalAdviceBoundary: NOT_LEGAL_ADVICE
    },
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

function createProjectFactsStep(input: CreateWorkspaceJourneyInput): WorkspaceJourneyStep {
  if (!input.validation.valid) {
    return createStep({
      id: "project-facts",
      label: "Project facts",
      target: "wizard",
      status: "blocked",
      summary: `${input.validation.errors.length} project fact${input.validation.errors.length === 1 ? "" : "s"} missing.`,
      detail: "Complete required workspace facts before counsel or export handoff."
    });
  }

  return createStep({
    id: "project-facts",
    label: "Project facts",
    target: "wizard",
    status: "ready",
    summary: "Required workspace facts are available.",
    detail: "Project assumptions can feed risk, source, and export review."
  });
}

function createModelEvidenceStep(input: CreateWorkspaceJourneyInput): WorkspaceJourneyStep {
  if (input.evidenceCount === 0) {
    return createStep({
      id: "model-evidence-intake",
      label: "Model / evidence intake",
      target: "evidence",
      status: "needs-input",
      summary: "Add metadata-only evidence before review handoff.",
      detail: "Evidence templates or local file hashes can start the review packet."
    });
  }

  if (input.modelConnectStatus === "blocked") {
    return createStep({
      id: "model-evidence-intake",
      label: "Model / evidence intake",
      target: "model",
      status: "blocked",
      summary: `${input.evidenceCount} evidence item${input.evidenceCount === 1 ? "" : "s"} available; Model Connect is blocked.`,
      detail: "Resolve model connection blockers before model output enters review."
    });
  }

  if (input.modelConnectStatus === "not-configured") {
    return createStep({
      id: "model-evidence-intake",
      label: "Model / evidence intake",
      target: "model",
      status: "needs-review",
      summary: `${input.evidenceCount} evidence item${input.evidenceCount === 1 ? "" : "s"} available; Model Connect is not validated.`,
      detail: "Validate the mock reviewer or a session-only model before gateway review."
    });
  }

  return createStep({
    id: "model-evidence-intake",
    label: "Model / evidence intake",
    target: "evidence",
    status: "ready",
    summary: `${input.evidenceCount} evidence item${input.evidenceCount === 1 ? "" : "s"} and Model Connect are ready.`,
    detail: "Evidence and model routing can move into risk/source review."
  });
}

function createRiskSourceStep(input: CreateWorkspaceJourneyInput): WorkspaceJourneyStep {
  if (input.regulatoryTriggerCount === 0) {
    return createStep({
      id: "risk-source-graph",
      label: "Risk / source graph",
      target: "risk",
      status: "needs-input",
      summary: "No source triggers are matched yet.",
      detail: "Add jurisdictions and project facts to generate source-linked review prompts."
    });
  }

  if (input.evidenceGapCount > 0 || input.sourceReviewStatus !== "current") {
    return createStep({
      id: "risk-source-graph",
      label: "Risk / source graph",
      target: input.evidenceGapCount > 0 ? "evidence" : "review",
      status: "needs-review",
      summary: `${input.regulatoryTriggerCount} source trigger${input.regulatoryTriggerCount === 1 ? "" : "s"} with ${input.evidenceGapCount} evidence gap${input.evidenceGapCount === 1 ? "" : "s"}.`,
      detail: `Source review status is ${input.sourceReviewStatus}; resolve gaps before counsel handoff.`
    });
  }

  return createStep({
    id: "risk-source-graph",
    label: "Risk / source graph",
    target: "risk",
    status: "ready",
    summary: `${input.regulatoryTriggerCount} source trigger${input.regulatoryTriggerCount === 1 ? "" : "s"} ready for review.`,
    detail: "Risk flags and source review metadata are current for handoff."
  });
}

function createHumanReviewStep(input: CreateWorkspaceJourneyInput): WorkspaceJourneyStep {
  if (input.humanReviewSummary.blockedCount > 0) {
    return createStep({
      id: "human-review",
      label: "Human review",
      target: "review",
      status: "blocked",
      summary: `${input.humanReviewSummary.blockedCount} review item${input.humanReviewSummary.blockedCount === 1 ? "" : "s"} blocked or returned.`,
      detail: "Resolve rejected or needs-more-evidence decisions before export reliance."
    });
  }

  if (input.humanReviewSummary.openCount > 0) {
    return createStep({
      id: "human-review",
      label: "Human review",
      target: "review",
      status: "needs-review",
      summary: `${input.humanReviewSummary.openCount} review item${input.humanReviewSummary.openCount === 1 ? "" : "s"} still open.`,
      detail: "Reviewer decisions should be captured before the packet is finalized."
    });
  }

  if (input.humanReviewSummary.totalCount === 0) {
    return createStep({
      id: "human-review",
      label: "Human review",
      target: "review",
      status: "needs-input",
      summary: "No human review queue items are open yet.",
      detail: "Route evidence, source, model, or counsel review items when review is required."
    });
  }

  return createStep({
    id: "human-review",
    label: "Human review",
    target: "review",
    status: "ready",
    summary: `${input.humanReviewSummary.reviewedCount} review item${input.humanReviewSummary.reviewedCount === 1 ? "" : "s"} recorded.`,
    detail: "Review status is available for counsel handoff metadata."
  });
}

function createVaultManifestStep(input: CreateWorkspaceJourneyInput): WorkspaceJourneyStep {
  if (input.evidenceCount === 0) {
    return createStep({
      id: "vault-manifest",
      label: "Vault / manifest",
      target: "evidence",
      status: "needs-input",
      summary: "Evidence is required before a manifest can be handed off.",
      detail: "Add metadata-only evidence before vault or manifest review."
    });
  }

  if (!input.manifestHash) {
    return createStep({
      id: "vault-manifest",
      label: "Vault / manifest",
      target: "evidence",
      status: "needs-review",
      summary: "Manifest hash is still pending.",
      detail: "Review Evidence Ledger until a deterministic bundle hash is available."
    });
  }

  return createStep({
    id: "vault-manifest",
    label: "Vault / manifest",
    target: "evidence",
    status: "ready",
    summary: `Manifest ${input.manifestHash.slice(0, 12)} is ready.`,
    detail: "Vault and manifest metadata can be referenced in export handoff."
  });
}

function createCounselExportStep(input: CreateWorkspaceJourneyInput): WorkspaceJourneyStep {
  if (!input.exportAllowed) {
    return createStep({
      id: "counsel-export",
      label: "Counsel export",
      target: "counsel",
      status: "blocked",
      summary: "Export Safety Gate is blocking handoff.",
      detail: "Remove blocked data classes before Markdown, PDF, server export, or anchor receipt handoff."
    });
  }

  if (!input.manifestHash) {
    return createStep({
      id: "counsel-export",
      label: "Counsel export",
      target: "counsel",
      status: "needs-input",
      summary: "Manifest is required before counsel export.",
      detail: "Generate evidence manifest metadata before saving an export version."
    });
  }

  if (input.counselPackVersionCount === 0) {
    return createStep({
      id: "counsel-export",
      label: "Counsel export",
      target: "counsel",
      status: "needs-review",
      summary: "No Counsel Pack version has been saved yet.",
      detail: "Save a version to capture manifest, source, review, and Markdown hashes."
    });
  }

  return createStep({
    id: "counsel-export",
    label: "Counsel export",
    target: "counsel",
    status: "ready",
    summary: `${input.counselPackVersionCount} Counsel Pack version${input.counselPackVersionCount === 1 ? "" : "s"} saved for export handoff.`,
    detail: "Counsel Pack export metadata is ready for judge or counsel review."
  });
}

function createStep(input: Omit<WorkspaceJourneyStep, "stepVersion" | "notLegalAdviceBoundary">): WorkspaceJourneyStep {
  return {
    stepVersion: "lexproof-workspace-journey-step-v1",
    ...input,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}
