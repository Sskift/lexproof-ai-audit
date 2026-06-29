import { describe, expect, it } from "vitest";
import { createModelAccessWorkflow } from "./modelAccessWorkflow";
import type { ModelConnectionReadiness } from "./modelConnectionReadiness";
import type { ModelIntakeSummary } from "./modelIntake";
import type { ModelSettings, ModelSettingsValidation } from "./modelProvider";

const mockReady: ModelConnectionReadiness = {
  status: "mock-ready",
  headline: "Mock local reviewer ready",
  detail: "The built-in mock reviewer can run without network access or credentials for demos and tests.",
  checklist: ["No API key is needed for the mock reviewer."],
  blockers: []
};

const readyIntake: ModelIntakeSummary = {
  modelIntakeVersion: "lexproof-model-intake-v1",
  readiness: "ready",
  eventCount: 0,
  unresolvedEventCount: 0,
  blockers: [],
  handoffChecklist: ["Model purpose and human review owner are documented."],
  eventHashes: [],
  notLegalAdviceBoundary: "Not legal advice. Model intake records are audit preparation materials for human review."
};

describe("createModelAccessWorkflow", () => {
  it("shows mock reviewer mode as run-ready without requiring an API key", () => {
    const workflow = createModelAccessWorkflow({
      settings: { provider: "mock", model: "lexproof-mock" },
      settingsValidation: { valid: true, errors: [] },
      connectionReadiness: mockReady,
      modelIntakeSummary: readyIntake,
      runCount: 0
    });

    expect(workflow.currentMode).toBe("Demo mock reviewer");
    expect(workflow.overallStatus).toBe("ready-to-run");
    expect(workflow.blockers).toEqual([]);
    expect(workflow.steps.map((step) => `${step.status}:${step.title}`)).toEqual([
      "complete:Register Model Intake",
      "complete:Configure Model Provider",
      "complete:Pass Redaction Gate",
      "active:Run AI Review",
      "pending:Human Review And Export"
    ]);
    expect(workflow.steps[1].detail).toContain("No API key is needed");
    expect(workflow.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("surfaces live OpenAI-compatible settings errors before a model run", () => {
    const settings: ModelSettings = { provider: "openai-compatible", model: "", baseUrl: "", apiKey: "" };
    const settingsValidation: ModelSettingsValidation = {
      valid: false,
      errors: [
        "Base URL is required for OpenAI-compatible providers.",
        "Model name is required.",
        "API key is required for live model calls."
      ]
    };
    const workflow = createModelAccessWorkflow({
      settings,
      settingsValidation,
      connectionReadiness: {
        status: "needs-config",
        headline: "Model connection needs configuration",
        detail: "Complete the model settings before running a live OpenAI-compatible review.",
        checklist: [],
        blockers: settingsValidation.errors
      },
      modelIntakeSummary: readyIntake,
      runCount: 0
    });

    expect(workflow.currentMode).toBe("Live OpenAI-compatible session");
    expect(workflow.overallStatus).toBe("blocked");
    expect(workflow.blockers).toEqual(settingsValidation.errors);
    expect(workflow.steps[1]).toMatchObject({
      title: "Configure Model Provider",
      status: "blocked"
    });
    expect(workflow.steps[3].status).toBe("pending");
  });

  it("moves the workflow to human review when a model run has unresolved AI events", () => {
    const workflow = createModelAccessWorkflow({
      settings: { provider: "mock", model: "lexproof-mock" },
      settingsValidation: { valid: true, errors: [] },
      connectionReadiness: mockReady,
      modelIntakeSummary: {
        ...readyIntake,
        readiness: "needs-review",
        eventCount: 1,
        unresolvedEventCount: 1
      },
      runCount: 1
    });

    expect(workflow.overallStatus).toBe("needs-human-review");
    expect(workflow.blockers).toEqual(["1 AI event requires human review before external reliance."]);
    expect(workflow.steps[3].status).toBe("complete");
    expect(workflow.steps[4]).toMatchObject({
      title: "Human Review And Export",
      status: "active"
    });
  });
});
