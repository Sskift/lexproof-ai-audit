import { describe, expect, it } from "vitest";
import type { DemoRunbook } from "./demoRunbook";
import type { ExportSafetyInventory } from "./exportSafetyInventory";
import { createJudgeHandoffBundle, exportJudgeHandoffBundleJson } from "./judgeHandoffBundle";
import type { SubmissionPack } from "./submissionPack";

describe("createJudgeHandoffBundle", () => {
  it("creates a stable metadata-only judge handoff bundle from current Sources artifacts", async () => {
    const first = await createJudgeHandoffBundle({
      projectName: "YieldPassport",
      submissionPack: submissionPack(),
      demoRunbook: demoRunbook(),
      exportSafetyInventory: exportSafetyInventory(),
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const second = await createJudgeHandoffBundle({
      projectName: "YieldPassport",
      submissionPack: submissionPack(),
      demoRunbook: demoRunbook(),
      exportSafetyInventory: exportSafetyInventory(),
      generatedAt: "2026-07-03T00:00:00.000Z"
    });

    expect(first).toEqual(
      expect.objectContaining({
        bundleVersion: "lexproof-judge-handoff-bundle-v1",
        projectName: "YieldPassport",
        artifactCount: 3,
        readyCount: 1,
        exportHandoffAllowed: false,
        notLegalAdviceBoundary: "Not legal advice. Judge handoff bundles are audit preparation metadata only."
      })
    );
    expect(first.bundleHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.bundleHash).toBe(second.bundleHash);
    expect(first.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "submission-pack",
          label: "Submission Pack JSON",
          status: "needs-action",
          artifactHash: "a".repeat(64)
        }),
        expect.objectContaining({
          id: "demo-runbook",
          label: "Demo Runbook JSON",
          status: "needs-action",
          artifactHash: "b".repeat(64)
        }),
        expect.objectContaining({
          id: "export-safety-inventory",
          label: "Export Safety Inventory JSON",
          status: "ready",
          artifactHash: "c".repeat(64)
        })
      ])
    );
    expect(first.nextActions).toEqual(
      expect.arrayContaining([
        "Complete Demo API preflight and download the Demo Runbook JSON before judge handoff.",
        "Save a Counsel Pack version to lock Markdown and source-pack hashes."
      ])
    );
    expect(exportJudgeHandoffBundleJson(first)).toContain("Not legal advice");
    expect(exportJudgeHandoffBundleJson(first)).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);
  });

  it("changes the bundle hash when a child handoff artifact hash changes", async () => {
    const base = await createJudgeHandoffBundle({
      projectName: "YieldPassport",
      submissionPack: submissionPack(),
      demoRunbook: demoRunbook(),
      exportSafetyInventory: exportSafetyInventory(),
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const changed = await createJudgeHandoffBundle({
      projectName: "YieldPassport",
      submissionPack: submissionPack({ packHash: "d".repeat(64) }),
      demoRunbook: demoRunbook(),
      exportSafetyInventory: exportSafetyInventory(),
      generatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(changed.bundleHash).not.toBe(base.bundleHash);
  });
});

function submissionPack(overrides: Partial<SubmissionPack> = {}): SubmissionPack {
  return {
    packVersion: "lexproof-submission-pack-v1",
    projectId: "project-yieldpassport",
    projectName: "YieldPassport",
    generatedAt: "2026-07-02T00:00:00.000Z",
    targetHackathon: "BLI Legal Tech Hackathon 2",
    riskLevel: "critical",
    riskScore: 93,
    themeCoverage: ["Legal", "Compliance", "AI"],
    demoReadinessStatus: "needs-api",
    modelConnectStatus: "ready",
    evidenceItemCount: 4,
    manifestHash: "1".repeat(64),
    regulatorySourcePackHash: "2".repeat(64),
    demoRunbookHash: "b".repeat(64),
    sourceCount: 8,
    evidenceGapCount: 2,
    counselPackVersionCount: 0,
    serverExportRecordCount: 0,
    exportSafetySummary: {
      status: "needs-action",
      exportHandoffAllowed: false,
      boundaryStatus: "clean",
      boundaryBlockerCount: 0,
      boundaryWarningCount: 0,
      manifestReady: true,
      regulatorySourcePackReady: true,
      counselPackVersionReady: false,
      serverExportRecordReady: false,
      demoRunbookReady: false,
      nextActions: [
        "Save a Counsel Pack version to lock Markdown and source-pack hashes.",
        "Complete Demo API preflight and download the Demo Runbook JSON before judge handoff."
      ],
      notLegalAdviceBoundary: "Not legal advice. Submission export safety is audit preparation handoff metadata only."
    },
    requiredAssets: [],
    featureMappings: [],
    knownLimitations: [],
    judgeRunbook: [],
    packHash: "a".repeat(64),
    notLegalAdviceBoundary: "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only.",
    ...overrides
  };
}

function demoRunbook(overrides: Partial<DemoRunbook> = {}): DemoRunbook {
  return {
    runbookVersion: "lexproof-demo-runbook-v1",
    generatedAt: "2026-07-02T00:00:00.000Z",
    runbookHash: "b".repeat(64),
    status: "needs-api",
    apiPreflightStatus: "not-checked",
    scenarioCount: 8,
    cleanCloneCommands: ["npm install", "npm run verify", "npm run dev"],
    demoPath: [],
    scenarios: [],
    readinessChecks: [],
    screenshotRefs: ["docs/assets/screenshots/sources-demo-runbook-handoff.png"],
    nextActions: ["Run the Phase 2 API and click Check Demo API before judging."],
    limitations: ["No legal advice, compliance conclusion, KYC processing, private-key handling, or real chain write is performed."],
    notLegalAdviceBoundary: "Not legal advice. Demo runbooks are audit preparation demo metadata only.",
    ...overrides
  };
}

function exportSafetyInventory(overrides: Partial<ExportSafetyInventory> = {}): ExportSafetyInventory {
  return {
    inventoryVersion: "lexproof-export-safety-inventory-v1",
    workspaceId: "project-yieldpassport",
    projectName: "YieldPassport",
    generatedAt: "2026-07-02T00:00:00.000Z",
    inventoryHash: "c".repeat(64),
    overallStatus: "ready",
    exportHandoffAllowed: true,
    artifactCount: 3,
    readyCount: 3,
    needsReviewCount: 0,
    missingRequiredCount: 0,
    blockedCount: 0,
    boundaryStatus: "clean",
    boundaryBlockerCount: 0,
    boundaryWarningCount: 0,
    detectedClasses: [],
    artifacts: [],
    blockers: [],
    nextActions: ["Keep exports metadata-only and re-run inventory before external sharing."],
    notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only.",
    ...overrides
  };
}
