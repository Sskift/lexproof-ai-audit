import { describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { demoReadinessScreenshotRefs } from "../data/demoReadiness";
import type { DemoScenarioValidationResult } from "./demoScenarioLibrary";
import {
  checkDemoApiPreflight,
  createDemoScreenshotInventory,
  createDemoReadinessReport,
  createDemoSmokeChecklist,
  demoReadinessCommands,
  exportDemoSmokeChecklistJson
} from "./demoReadiness";

const validScenarioValidation: DemoScenarioValidationResult = {
  valid: true,
  errors: []
};

const healthResponse = {
  status: "ok",
  service: "lexproof-secure-review-workspace-api",
  version: "lexproof-phase-2-backend-v1",
  capabilities: {
    modelGateway: "mock-run-ready",
    evidenceVault: "metadata-versioning-ready",
    humanReview: "repository-ready",
    exports: "metadata-records-ready",
    auditLog: "repository-ready"
  },
  notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
};

describe("demo readiness", () => {
  it("keeps a clean-clone judge run in needs-api state until Phase 2 API preflight is checked", () => {
    const report = createDemoReadinessReport({
      scenarioValidation: validScenarioValidation,
      scenarioCount: 4,
      screenshotRefs: ["docs/assets/screenshots/demo-01-model-connect.png", "docs/assets/screenshots/demo-02-evidence-ledger.png"],
      apiPreflight: { status: "not-checked" }
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-demo-readiness-v1",
        status: "needs-api",
        notLegalAdviceBoundary: "Not legal advice. Demo readiness checks are audit preparation readiness metadata only."
      })
    );
    expect(report.checks.map((check) => [check.id, check.status])).toEqual([
      ["scenario-library", "ready"],
      ["clean-clone-commands", "ready"],
      ["private-credentials", "ready"],
      ["screenshot-set", "ready"],
      ["phase-2-api-preflight", "not-checked"]
    ]);
    expect(report.nextActions).toContain("Run the Phase 2 API and click Check Demo API before judging.");
    expect(report.checks.find((check) => check.id === "scenario-library")?.detail).toBe(
      "4 synthetic judge paths are available and validated."
    );
    expect(demoReadinessCommands).toContain("npm run verify");
    expect(JSON.stringify(report)).toContain("Not legal advice");
    expect(JSON.stringify(report).toLowerCase()).not.toContain("legal opinion");
    expect(JSON.stringify(report).toLowerCase()).not.toContain("final legal decision");
    expect(JSON.stringify(report).toLowerCase()).not.toContain("sk-live");

    const checklist = createDemoSmokeChecklist(report);
    expect(checklist).toMatchObject({
      checklistVersion: "lexproof-demo-smoke-checklist-v1",
      status: "needs-api",
      commandCount: demoReadinessCommands.length,
      notLegalAdviceBoundary: "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only."
    });
    expect(checklist.steps.map((step) => [step.id, step.status])).toEqual([
      ["install-dependencies", "ready"],
      ["run-verify", "ready"],
      ["build-server", "ready"],
      ["start-api", "ready"],
      ["run-demo-smoke", "ready"],
      ["start-frontend", "ready"],
      ["phase-2-api-preflight", "not-checked"],
      ["screenshot-set", "ready"]
    ]);
    expect(checklist.nextActions).toEqual(["Run the Phase 2 API and click Check Demo API before judging."]);
    expect(JSON.stringify(checklist)).toContain("npm run verify");
    expect(JSON.stringify(checklist)).not.toMatch(/\bsk-live\b|private key|raw KYC|legal opinion|final legal decision/i);
    const checklistJson = exportDemoSmokeChecklistJson(checklist);
    expect(checklistJson).toContain("lexproof-demo-smoke-checklist-v1");
    expect(checklistJson).toContain("Not legal advice");
    expect(checklistJson.endsWith("\n")).toBe(true);
  });

  it("blocks readiness when scenario validation fails even if the API is healthy", () => {
    const report = createDemoReadinessReport({
      scenarioValidation: {
        valid: false,
        errors: ["unsafe-demo includes blocked demo text: private key."]
      },
      scenarioCount: 1,
      screenshotRefs: ["docs/assets/screenshots/demo-01-model-connect.png"],
      apiPreflight: {
        status: "ready",
        service: healthResponse.service,
        version: healthResponse.version,
        capabilities: ["modelGateway: mock-run-ready"],
        checkedAt: "2026-07-01T00:00:00.000Z",
        notLegalAdviceBoundary: healthResponse.notLegalAdviceBoundary
      }
    });

    expect(report.status).toBe("blocked");
    expect(report.checks.find((check) => check.id === "scenario-library")).toMatchObject({
      status: "blocked",
      recoveryAction: "Fix seeded demo scenarios before judging."
    });
    expect(report.nextActions).toContain("Fix seeded demo scenarios before judging.");
  });

  it("blocks readiness when registered screenshot refs are unsafe, duplicated, or missing from the asset set", () => {
    const inventory = createDemoScreenshotInventory(
      [
        "docs/assets/screenshots/demo-01-model-connect.png",
        "docs/assets/screenshots/demo-01-model-connect.png",
        "docs/assets/screenshots/missing-demo-step.png",
        "../secrets/sk-live-abcdef1234567890abcdef1234567890.png"
      ],
      ["docs/assets/screenshots/demo-01-model-connect.png"]
    );
    const report = createDemoReadinessReport({
      scenarioValidation: validScenarioValidation,
      scenarioCount: 4,
      screenshotRefs: [
        "docs/assets/screenshots/demo-01-model-connect.png",
        "docs/assets/screenshots/demo-01-model-connect.png",
        "docs/assets/screenshots/missing-demo-step.png",
        "../secrets/sk-live-abcdef1234567890abcdef1234567890.png"
      ],
      availableScreenshotRefs: ["docs/assets/screenshots/demo-01-model-connect.png"],
      apiPreflight: {
        status: "ready",
        service: healthResponse.service,
        version: healthResponse.version,
        capabilities: ["modelGateway: mock-run-ready"],
        checkedAt: "2026-07-01T00:00:00.000Z",
        notLegalAdviceBoundary: healthResponse.notLegalAdviceBoundary
      }
    });
    const screenshotCheck = report.checks.find((check) => check.id === "screenshot-set");

    expect(inventory).toMatchObject({
      inventoryVersion: "lexproof-demo-screenshot-inventory-v1",
      usableCount: 1,
      blockedCount: 3,
      missingCount: 1,
      duplicateCount: 1,
      unsafeCount: 1,
      notLegalAdviceBoundary: "Not legal advice. Demo screenshot inventory is audit preparation readiness metadata only."
    });
    expect(JSON.stringify(inventory)).not.toContain("sk-live");
    expect(report.status).toBe("blocked");
    expect(screenshotCheck).toMatchObject({
      status: "blocked",
      recoveryAction: "Fix missing, duplicate, or unsafe screenshot references under docs/assets/screenshots before judging."
    });
    expect(screenshotCheck?.detail).toContain("1 usable screenshot");
    expect(screenshotCheck?.detail).toContain("3 blocked screenshot references");
    expect(report.nextActions).toContain(
      "Fix missing, duplicate, or unsafe screenshot references under docs/assets/screenshots before judging."
    );
    expect(JSON.stringify(report)).not.toContain("sk-live");
    expect(report.screenshotRefs).toEqual(["docs/assets/screenshots/demo-01-model-connect.png"]);

    const checklist = createDemoSmokeChecklist(report);
    expect(checklist.status).toBe("blocked");
    expect(checklist.steps.find((step) => step.id === "screenshot-set")).toMatchObject({
      status: "blocked",
      recoveryAction: "Fix missing, duplicate, or unsafe screenshot references under docs/assets/screenshots before judging."
    });
  });

  it("keeps all registered demo screenshot refs pointed at tracked local assets", () => {
    const missingRefs = demoReadinessScreenshotRefs.filter((ref) => !existsSync(resolve(process.cwd(), ref)));

    expect(missingRefs).toEqual([]);
  });

  it("runs the clean-clone demo smoke CLI without API dependencies when explicitly skipped", () => {
    const output = execFileSync(process.execPath, ["scripts/demo-smoke.mjs", "--skip-api", "--json"], {
      cwd: process.cwd(),
      encoding: "utf8"
    });
    const report = JSON.parse(output);

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-demo-smoke-cli-v1",
        status: "ready",
        notLegalAdviceBoundary: "Not legal advice. Demo smoke checks are audit preparation readiness metadata only."
      })
    );
    expect(report.checks.map((check: { id: string; status: string }) => [check.id, check.status])).toEqual([
      ["package-scripts", "ready"],
      ["required-files", "ready"],
      ["screenshot-assets", "ready"],
      ["phase-2-api-health", "ready"]
    ]);
    expect(report.nextActions).toEqual(["Demo smoke checks are ready for the clean-clone judge path."]);
    expect(JSON.stringify(report)).toContain("Not legal advice");
    expect(JSON.stringify(report)).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);
  });

  it("checks the Phase 2 API health endpoint and returns capability evidence", async () => {
    const fetcher = vi.fn(async () => createJsonResponse(healthResponse, 200)) as unknown as typeof fetch;

    const preflight = await checkDemoApiPreflight({
      apiBaseUrl: "http://127.0.0.1:8787",
      checkedAt: "2026-07-01T00:00:00.000Z",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/health", { method: "GET" });
    expect(preflight).toEqual({
      status: "ready",
      service: "lexproof-secure-review-workspace-api",
      version: "lexproof-phase-2-backend-v1",
      capabilities: [
        "modelGateway: mock-run-ready",
        "evidenceVault: metadata-versioning-ready",
        "humanReview: repository-ready",
        "exports: metadata-records-ready",
        "auditLog: repository-ready"
      ],
      checkedAt: "2026-07-01T00:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
  });

  it("sanitizes failed API preflight errors without leaking credential material", async () => {
    const fetcher = vi.fn(async () =>
      createJsonResponse({ error: "Server rejected sk-live-abcdef1234567890abcdef1234567890 in demo metadata." }, 500)
    ) as unknown as typeof fetch;

    const preflight = await checkDemoApiPreflight({
      apiBaseUrl: "https://api.lexproof.test",
      checkedAt: "2026-07-01T00:00:00.000Z",
      fetcher
    });

    expect(preflight.status).toBe("failed");
    if (preflight.status !== "failed") {
      throw new Error("Expected failed API preflight.");
    }
    expect(preflight.error).toContain("[redacted-api-key]");
    expect(preflight.error).not.toContain("sk-live");
    expect(preflight.recoveryAction).toBe("Start the Phase 2 API, confirm /api/health is reachable, and retry the demo preflight.");
  });
});

function createJsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
