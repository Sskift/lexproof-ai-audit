import { describe, expect, it, vi } from "vitest";
import type { DemoScenarioValidationResult } from "./demoScenarioLibrary";
import {
  checkDemoApiPreflight,
  createDemoReadinessReport,
  demoReadinessCommands
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
      screenshotRefs: ["demo-01-model-connect.png", "demo-02-evidence-ledger.png"],
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
  });

  it("blocks readiness when scenario validation fails even if the API is healthy", () => {
    const report = createDemoReadinessReport({
      scenarioValidation: {
        valid: false,
        errors: ["unsafe-demo includes blocked demo text: private key."]
      },
      scenarioCount: 1,
      screenshotRefs: ["demo-01-model-connect.png"],
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
