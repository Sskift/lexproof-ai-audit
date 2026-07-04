import { describe, expect, it, vi } from "vitest";
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
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
const execFileAsync = promisify(execFile);

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
        routeChecks: [
          {
            id: "model-gateway-adapters",
            label: "Model Gateway adapters",
            status: "ready",
            url: "http://127.0.0.1:8787/api/model-gateway/adapters",
            detail: "Model Gateway adapter registry is reachable."
          }
        ],
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
        routeChecks: [
          {
            id: "model-gateway-adapters",
            label: "Model Gateway adapters",
            status: "ready",
            url: "http://127.0.0.1:8787/api/model-gateway/adapters",
            detail: "Model Gateway adapter registry is reachable."
          }
        ],
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

  it("blocks the demo smoke CLI when screenshot refs are unsafe, duplicated, or unsupported", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "lexproof-demo-smoke-"));
    const registryPath = join(tempDir, "demoReadiness.ts");
    writeFileSync(
      registryPath,
      [
        "export const demoReadinessScreenshotRefs = [",
        '  "docs/assets/screenshots/demo-01-model-connect.png",',
        '  "docs/assets/screenshots/demo-01-model-connect.png",',
        '  "docs/assets/screenshots/unsupported-demo.gif",',
        '  "../secrets/sk-live-abcdef1234567890abcdef1234567890.png"',
        "];"
      ].join("\n")
    );

    try {
      execFileSync(
        process.execPath,
        ["scripts/demo-smoke.mjs", "--skip-api", "--json", "--screenshot-registry", registryPath],
        {
          cwd: process.cwd(),
          encoding: "utf8"
        }
      );
      throw new Error("Expected demo smoke CLI to block unsafe screenshot refs.");
    } catch (error) {
      const output = error instanceof Error && "stdout" in error ? String(error.stdout) : "";
      const report = JSON.parse(output);
      const screenshotCheck = report.checks.find((check: { id: string }) => check.id === "screenshot-assets");

      expect(report.status).toBe("blocked");
      expect(screenshotCheck).toEqual(
        expect.objectContaining({
          status: "blocked",
          registeredCount: 1,
          missingCount: 0,
          duplicateCount: 1,
          unsafeCount: 1,
          unsupportedCount: 1,
          recoveryAction: "Fix missing, duplicate, unsafe, or unsupported screenshot references before judging."
        })
      );
      expect(screenshotCheck.detail).toContain("1 duplicate");
      expect(screenshotCheck.detail).toContain("1 unsafe");
      expect(screenshotCheck.detail).toContain("1 unsupported");
      expect(JSON.stringify(report)).not.toContain("sk-live");
      expect(JSON.stringify(report)).toContain("Not legal advice");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("runs the clean-clone demo smoke CLI against safe Phase 2 route families", async () => {
    const server = createServer((request, response) => {
      const payload = createDemoApiPayload(`http://127.0.0.1${request.url ?? "/"}`);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(payload));
    });
    await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Demo smoke test API did not bind to a port.");
    }

    try {
      const result = await execFileAsync(process.execPath, ["scripts/demo-smoke.mjs", "--json"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DEMO_API_BASE_URL: `http://127.0.0.1:${address.port}`
        }
      });
      const report = JSON.parse(result.stdout);
      const apiCheck = report.checks.find((check: { id: string }) => check.id === "phase-2-api-health");

      expect(report.status).toBe("ready");
      expect(apiCheck).toEqual(
        expect.objectContaining({
          status: "ready",
          routeChecks: expect.arrayContaining([
            expect.objectContaining({ id: "api-preflight-report", status: "ready" }),
            expect.objectContaining({ id: "evidence-vault-manifest", status: "ready" }),
            expect.objectContaining({ id: "integration-policy-evaluations", status: "ready" })
          ])
        })
      );
      expect(apiCheck.routeChecks).toHaveLength(8);
      expect(JSON.stringify(report)).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);
    } finally {
      await new Promise<void>((resolveClose, rejectClose) =>
        server.close((error) => (error ? rejectClose(error) : resolveClose()))
      );
    }
  });

  it("checks the Phase 2 API health endpoint and safe route families", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => createJsonResponse(createDemoApiPayload(String(url)), 200)) as unknown as typeof fetch;

    const preflight = await checkDemoApiPreflight({
      apiBaseUrl: "http://127.0.0.1:8787",
      checkedAt: "2026-07-01T00:00:00.000Z",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/health", { method: "GET" });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/preflight", { method: "GET" });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/model-gateway/adapters", { method: "GET" });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/evidence-manifest", {
      method: "GET"
    });
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
      routeChecks: expect.arrayContaining([
        expect.objectContaining({
          id: "api-preflight-report",
          status: "ready"
        }),
        expect.objectContaining({
          id: "model-gateway-adapters",
          status: "ready"
        }),
        expect.objectContaining({
          id: "integration-policy-evaluations",
          status: "ready"
        })
      ]),
      checkedAt: "2026-07-01T00:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(preflight.status === "ready" ? preflight.routeChecks : []).toHaveLength(8);
  });

  it("fails API preflight when a safe route family is missing", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/reviews/queue")) {
        return createJsonResponse({ error: "missing route with raw KYC sk-live-abcdef1234567890abcdef1234567890" }, 404);
      }
      return createJsonResponse(createDemoApiPayload(value), 200);
    }) as unknown as typeof fetch;

    const preflight = await checkDemoApiPreflight({
      apiBaseUrl: "http://127.0.0.1:8787",
      checkedAt: "2026-07-01T00:00:00.000Z",
      fetcher
    });

    expect(preflight.status).toBe("failed");
    if (preflight.status !== "failed") {
      throw new Error("Expected failed API preflight.");
    }
    expect(preflight.error).toContain("Human Review queue");
    expect(preflight.error).toContain("[redacted-api-key]");
    expect(preflight.error).not.toContain("sk-live");
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

function createDemoApiPayload(url: string): unknown {
  if (url.endsWith("/api/health")) {
    return healthResponse;
  }
  if (url.endsWith("/api/preflight")) {
    return {
      reportVersion: "lexproof-api-preflight-v1",
      status: "ready",
      routeFamilyCount: 7,
      routeFamilies: [],
      implementedRouteCount: 24,
      implementedRoutes: [],
      externalSideEffectsAllowed: false,
      reportHash: "a".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. API preflight reports are audit preparation readiness metadata only."
    };
  }
  if (url.endsWith("/api/model-gateway/adapters")) {
    return [];
  }
  if (url.endsWith("/api/model-gateway/provider-policy")) {
    return {
      reportVersion: "lexproof-model-gateway-provider-policy-v1",
      notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/evidence-manifest")) {
    return {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: "demo-smoke-preflight",
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/reviews/queue")) {
    return {
      queueVersion: "lexproof-server-human-review-queue-v1",
      workspaceId: "demo-smoke-preflight",
      notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only."
    };
  }
  if (
    url.endsWith("/api/workspaces/demo-smoke-preflight/exports") ||
    url.endsWith("/api/workspaces/demo-smoke-preflight/audit-log") ||
    url.endsWith("/api/workspaces/demo-smoke-preflight/integration-policy-evaluations")
  ) {
    return [];
  }

  return {};
}
