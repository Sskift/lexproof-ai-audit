import { describe, expect, it } from "vitest";
import { demoScenarios } from "../data/demoScenarios";
import type { DemoReadinessReport } from "./demoReadiness";
import { createDemoRunbook, exportDemoRunbookJson } from "./demoRunbook";

const readyReport: DemoReadinessReport = {
  reportVersion: "lexproof-demo-readiness-v1",
  status: "ready",
  checks: [
    {
      id: "scenario-library",
      label: "Scenario library",
      status: "ready",
      detail: "8 synthetic judge paths are available and validated.",
      recoveryAction: "Keep demo scenarios synthetic and source-linked."
    },
    {
      id: "clean-clone-commands",
      label: "Clean clone commands",
      status: "ready",
      detail: "npm install -> npm run verify -> npm run dev",
      recoveryAction: "Run the commands in order from a clean clone before judging."
    },
    {
      id: "phase-2-api-preflight",
      label: "Phase 2 API preflight",
      status: "ready",
      detail: "lexproof-secure-review-workspace-api lexproof-phase-2-backend-v1 is reachable with 5 capabilities.",
      recoveryAction: "Keep the API process running while judges run the secure review path."
    }
  ],
  cleanCloneCommands: [
    "npm install",
    "npm run verify",
    "npm run build:server",
    "DATABASE_URL=file:./demo-review-workspace.db npm run start:api",
    "npm run dev"
  ],
  screenshotRefs: ["docs/assets/screenshots/judge-demo-readiness.png", "docs/assets/screenshots/evidence-vault-lineage-digest.png"],
  nextActions: ["Judge demo readiness checks are ready for the clean-clone path."],
  notLegalAdviceBoundary: "Not legal advice. Demo readiness checks are audit preparation readiness metadata only."
};

describe("demo runbook", () => {
  it("builds a stable metadata-only clean-clone runbook for hackathon judges", async () => {
    const first = await createDemoRunbook({
      readinessReport: readyReport,
      scenarios: demoScenarios,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const second = await createDemoRunbook({
      readinessReport: readyReport,
      scenarios: demoScenarios,
      generatedAt: "2026-07-03T00:00:00.000Z"
    });

    expect(first).toEqual(
      expect.objectContaining({
        runbookVersion: "lexproof-demo-runbook-v1",
        status: "ready",
        scenarioCount: demoScenarios.length,
        apiPreflightStatus: "ready",
        notLegalAdviceBoundary: "Not legal advice. Demo runbooks are audit preparation demo metadata only."
      })
    );
    expect(first.runbookHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.runbookHash).toBe(second.runbookHash);
    expect(first.cleanCloneCommands).toContain("npm run verify");
    expect(first.demoPath[0]).toMatchObject({
      step: 1,
      label: "Start from Project Workspace",
      expectedEvidence: "Judge Demo Readiness panel is visible with clean-clone commands and API preflight."
    });
    expect(first.scenarios.map((scenario) => scenario.id)).toContain("lexassist-ai-workflow-path");
    expect(first.screenshotRefs).toContain("docs/assets/screenshots/judge-demo-readiness.png");
    expect(first.limitations).toContain("No legal advice, compliance conclusion, KYC processing, private-key handling, or real chain write is performed.");

    const exported = exportDemoRunbookJson(first);
    expect(exported).toContain("Not legal advice");
    expect(exported).toContain("Model Connect");
    expect(exported).toContain("Evidence Vault");
    expect(exported).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);
  });

  it("changes the runbook hash when judge scenario metadata changes", async () => {
    const base = await createDemoRunbook({
      readinessReport: readyReport,
      scenarios: demoScenarios,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const changed = await createDemoRunbook({
      readinessReport: readyReport,
      scenarios: [
        {
          ...demoScenarios[0],
          expectedArtifacts: [...demoScenarios[0].expectedArtifacts, "Demo Runbook JSON"]
        },
        ...demoScenarios.slice(1)
      ],
      generatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(changed.runbookHash).not.toBe(base.runbookHash);
  });
});
