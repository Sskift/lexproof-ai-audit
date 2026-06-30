import { describe, expect, it } from "vitest";
import { demoScenarios } from "../data/demoScenarios";
import { sampleProfiles } from "../data/sampleProfiles";
import {
  findDemoScenarioById,
  summarizeDemoScenario,
  validateDemoScenarioLibrary,
  type DemoScenario
} from "./demoScenarioLibrary";

const scenario: DemoScenario = {
  id: "yieldpassport-judge-path",
  projectName: "YieldPassport",
  title: "High-risk RWA launch",
  summary: "Tokenized private credit, custody, retail exposure, AI review, and manifest handoff.",
  estimatedMinutes: 8,
  recommendedStartTab: "risk",
  judgePath: ["Validate model", "Add evidence", "Run risk audit", "Download GRC tickets", "Export counsel pack"],
  expectedArtifacts: ["Evidence Manifest", "GRC Ticket Export", "Counsel Pack Markdown"],
  focusTags: ["RWA", "AI governance", "Evidence vault"],
  notLegalAdviceBoundary: "Not legal advice. Demo scenarios are synthetic audit preparation paths only."
};

describe("validateDemoScenarioLibrary", () => {
  it("accepts synthetic scenarios that reference existing sample profiles and contain judge-ready paths", () => {
    const result = validateDemoScenarioLibrary([scenario], sampleProfiles);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns clear errors for unknown samples, missing boundaries, weak judge paths, and unsafe text", () => {
    const invalid: DemoScenario = {
      ...scenario,
      id: "unsafe-demo",
      projectName: "Missing Project",
      summary: "Use raw KYC packet and private key for testing.",
      judgePath: ["Open app"],
      expectedArtifacts: [],
      notLegalAdviceBoundary: "Demo only."
    };

    const result = validateDemoScenarioLibrary([invalid], sampleProfiles);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "unsafe-demo references an unknown sample profile: Missing Project.",
        "unsafe-demo must include the Not legal advice boundary.",
        "unsafe-demo needs at least three judge path steps.",
        "unsafe-demo needs at least one expected artifact.",
        "unsafe-demo includes blocked demo text: raw KYC.",
        "unsafe-demo includes blocked demo text: private key."
      ])
    );
  });

  it("keeps a seeded AI legal workflow path for model governance and counsel handoff demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const aiWorkflowScenario = findDemoScenarioById(demoScenarios, "lexassist-ai-workflow-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(aiWorkflowScenario).toEqual(
      expect.objectContaining({
        title: "AI legal workflow review",
        projectName: "LexAssist Evidence Desk",
        recommendedStartTab: "model",
        focusTags: expect.arrayContaining(["AI legal workflow", "Model governance", "Counsel handoff"]),
        expectedArtifacts: expect.arrayContaining(["Model Intake JSON", "Human Review Timeline", "Counsel Pack Markdown"])
      })
    );
    expect(aiWorkflowScenario?.judgePath).toEqual(
      expect.arrayContaining(["Connect model", "Register AI event", "Route human review", "Inspect source review", "Export counsel pack"])
    );
    expect(aiWorkflowScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });
});

describe("findDemoScenarioById", () => {
  it("finds a scenario by stable id", () => {
    expect(findDemoScenarioById([scenario], "yieldpassport-judge-path")).toEqual(scenario);
  });
});

describe("summarizeDemoScenario", () => {
  it("creates a concise non-advice UI summary", () => {
    const summary = summarizeDemoScenario(scenario);

    expect(summary).toContain("High-risk RWA launch");
    expect(summary).toContain("8 min");
    expect(summary).toContain("Evidence Manifest, GRC Ticket Export, Counsel Pack Markdown");
    expect(summary).toContain("Not legal advice");
  });
});
