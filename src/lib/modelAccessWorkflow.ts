import type { ModelConnectionReadiness } from "./modelConnectionReadiness";
import type { ModelIntakeSummary } from "./modelIntake";
import type { ModelSettings, ModelSettingsValidation } from "./modelProvider";

export type ModelAccessWorkflowStatus = "ready-to-run" | "blocked" | "needs-human-review" | "complete";

export type ModelAccessStepStatus = "complete" | "active" | "blocked" | "pending";

export type ModelAccessWorkflowStep = {
  title: string;
  status: ModelAccessStepStatus;
  detail: string;
};

export type ModelAccessWorkflow = {
  workflowVersion: "lexproof-model-access-workflow-v1";
  currentMode: "Demo mock reviewer" | "Live OpenAI-compatible session";
  overallStatus: ModelAccessWorkflowStatus;
  blockers: string[];
  steps: ModelAccessWorkflowStep[];
  notLegalAdviceBoundary: "Not legal advice. Model access workflow status is audit preparation guidance for human review.";
};

export type ModelAccessWorkflowInput = {
  settings: ModelSettings;
  settingsValidation: ModelSettingsValidation;
  connectionReadiness: ModelConnectionReadiness;
  modelIntakeSummary: ModelIntakeSummary | null;
  runCount: number;
};

export function createModelAccessWorkflow(input: ModelAccessWorkflowInput): ModelAccessWorkflow {
  const providerBlocked = !input.settingsValidation.valid;
  const redactionBlocked = input.connectionReadiness.status === "blocked";
  const unresolvedEvents = input.modelIntakeSummary?.unresolvedEventCount ?? 0;
  const hasRuns = input.runCount > 0;
  const blockers = [
    ...input.settingsValidation.errors,
    ...input.connectionReadiness.blockers.filter((blocker) => !input.settingsValidation.errors.includes(blocker)),
    ...(unresolvedEvents > 0 ? [`${unresolvedEvents} AI event requires human review before external reliance.`] : [])
  ];

  return {
    workflowVersion: "lexproof-model-access-workflow-v1",
    currentMode: input.settings.provider === "mock" ? "Demo mock reviewer" : "Live OpenAI-compatible session",
    overallStatus: createOverallStatus(providerBlocked, redactionBlocked, unresolvedEvents, hasRuns),
    blockers,
    steps: [
      createModelIntakeStep(input.modelIntakeSummary),
      createProviderStep(input.settings, providerBlocked),
      createRedactionStep(input.connectionReadiness),
      createRunStep(providerBlocked, redactionBlocked, hasRuns),
      createHumanReviewStep(input.modelIntakeSummary, hasRuns)
    ],
    notLegalAdviceBoundary: "Not legal advice. Model access workflow status is audit preparation guidance for human review."
  };
}

function createOverallStatus(
  providerBlocked: boolean,
  redactionBlocked: boolean,
  unresolvedEvents: number,
  hasRuns: boolean
): ModelAccessWorkflowStatus {
  if (providerBlocked || redactionBlocked) {
    return "blocked";
  }

  if (unresolvedEvents > 0) {
    return "needs-human-review";
  }

  return hasRuns ? "complete" : "ready-to-run";
}

function createModelIntakeStep(summary: ModelIntakeSummary | null): ModelAccessWorkflowStep {
  if (!summary) {
    return {
      title: "Register Model Intake",
      status: "active",
      detail: "Document provider purpose, allowed data classes, and the human-review owner before external reliance."
    };
  }

  if (summary.readiness === "blocked") {
    return {
      title: "Register Model Intake",
      status: "blocked",
      detail: "Model Intake has blocked data classes or an invalid decision role."
    };
  }

  return {
    title: "Register Model Intake",
    status: "complete",
    detail: "Model purpose and human review owner are documented in Model Intake."
  };
}

function createProviderStep(settings: ModelSettings, providerBlocked: boolean): ModelAccessWorkflowStep {
  if (providerBlocked) {
    return {
      title: "Configure Model Provider",
      status: "blocked",
      detail: "Complete endpoint, model name, and session-only API key settings before a live run."
    };
  }

  return {
    title: "Configure Model Provider",
    status: "complete",
    detail:
      settings.provider === "mock"
        ? "No API key is needed for the mock reviewer."
        : "OpenAI-compatible provider settings are complete for this browser session."
  };
}

function createRedactionStep(readiness: ModelConnectionReadiness): ModelAccessWorkflowStep {
  if (readiness.status === "blocked") {
    return {
      title: "Pass Redaction Gate",
      status: "blocked",
      detail: "Remove private-key-like or secret material before sending audit-prep summaries to a model."
    };
  }

  return {
    title: "Pass Redaction Gate",
    status: "complete",
    detail: "Redaction Gate has no current blockers for the model review payload."
  };
}

function createRunStep(providerBlocked: boolean, redactionBlocked: boolean, hasRuns: boolean): ModelAccessWorkflowStep {
  if (hasRuns) {
    return {
      title: "Run AI Review",
      status: "complete",
      detail: "At least one model run receipt has been recorded with payload and response hashes."
    };
  }

  return {
    title: "Run AI Review",
    status: providerBlocked || redactionBlocked ? "pending" : "active",
    detail: "Run AI Review to create draft audit-prep output and a local model-run receipt."
  };
}

function createHumanReviewStep(summary: ModelIntakeSummary | null, hasRuns: boolean): ModelAccessWorkflowStep {
  const unresolvedEvents = summary?.unresolvedEventCount ?? 0;

  if (unresolvedEvents > 0) {
    return {
      title: "Human Review And Export",
      status: "active",
      detail: "Review or reject AI event records in Model Intake before using them in external handoff materials."
    };
  }

  if (hasRuns) {
    return {
      title: "Human Review And Export",
      status: "complete",
      detail: "Model Intake has no unresolved AI events; Counsel Pack and JSON exports can include reviewed hashes."
    };
  }

  return {
    title: "Human Review And Export",
    status: "pending",
    detail: "After a run, review AI events and export Model Intake or Counsel Pack materials for counsel review."
  };
}
