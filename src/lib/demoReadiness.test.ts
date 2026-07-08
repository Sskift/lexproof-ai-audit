import { describe, expect, it, vi } from "vitest";
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  createDemoSmokeChecklistSummary,
  demoReadinessCommands,
  exportDemoSmokeChecklistJson
} from "./demoReadiness";

const validScenarioValidation: DemoScenarioValidationResult = {
  valid: true,
  errors: []
};
const execFileAsync = promisify(execFile);
const demoReadinessDocumentationPaths = ["README.md", "docs/demo-script.md", "docs/submission-pack.md"];

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

function extractScreenshotRefsFromMarkdown(markdownPath: string): string[] {
  const markdown = readFileSync(resolve(process.cwd(), markdownPath), "utf8");
  const refs = [...markdown.matchAll(/(?:\(|`|")((?:docs\/)?assets\/screenshots\/[^)`"]+\.(?:png|jpe?g|webp))(?:\)|`|")/gi)]
    .map((match) => (match[1].startsWith("assets/") ? `docs/${match[1]}` : match[1]))
    .sort();

  return [...new Set(refs)];
}

function readNormalizedMarkdown(markdownPath: string): string {
  return readFileSync(resolve(process.cwd(), markdownPath), "utf8")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ");
}

describe("demo readiness", () => {
  it("keeps a clean-clone judge run in needs-api state until Phase 2 API preflight is checked", async () => {
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

    const firstSummary = await createDemoSmokeChecklistSummary(checklist);
    const secondSummary = await createDemoSmokeChecklistSummary(createDemoSmokeChecklist(report));
    const readyReport = createDemoReadinessReport({
      scenarioValidation: validScenarioValidation,
      scenarioCount: 4,
      screenshotRefs: ["docs/assets/screenshots/demo-01-model-connect.png", "docs/assets/screenshots/demo-02-evidence-ledger.png"],
      apiPreflight: {
        status: "ready",
        service: healthResponse.service,
        version: healthResponse.version,
        capabilities: ["modelGateway: mock-run-ready"],
        apiPreflightReportHash: "a".repeat(64),
        routeChecks: [
          {
            id: "api-preflight-report",
            label: "API Preflight report",
            status: "ready",
            url: "http://127.0.0.1:8787/api/preflight",
            detail: "API preflight report is reachable with a stable metadata hash.",
            artifactHash: "a".repeat(64)
          }
        ],
        checkedAt: "2026-07-01T00:00:00.000Z",
        notLegalAdviceBoundary: healthResponse.notLegalAdviceBoundary
      }
    });
    const readySummary = await createDemoSmokeChecklistSummary(createDemoSmokeChecklist(readyReport));

    expect(firstSummary).toEqual(
      expect.objectContaining({
        status: "needs-api",
        commandCount: demoReadinessCommands.length,
        stepCount: 8,
        apiPreflightStatus: "not-checked",
        screenshotStatus: "ready",
        notLegalAdviceBoundary: "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only."
      })
    );
    expect(firstSummary.checklistHash).toMatch(/^[a-f0-9]{64}$/);
    expect(secondSummary.checklistHash).toBe(firstSummary.checklistHash);
    expect(readySummary.checklistHash).not.toBe(firstSummary.checklistHash);
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

  it("registers every local screenshot referenced by judge demo documentation", () => {
    const registeredRefs = new Set(demoReadinessScreenshotRefs);
    const missingRefs = demoReadinessDocumentationPaths.flatMap((markdownPath) =>
      extractScreenshotRefsFromMarkdown(markdownPath)
        .filter((ref) => !registeredRefs.has(ref))
        .map((ref) => `${markdownPath}: ${ref}`)
    );

    expect(missingRefs).toEqual([]);
  });

  it("keeps the clean-clone judge commands documented in README and demo script", () => {
    const commandDocs = ["README.md", "docs/demo-script.md"];
    const missingCommands = commandDocs.flatMap((markdownPath) => {
      const markdown = readNormalizedMarkdown(markdownPath);

      return demoReadinessCommands
        .filter((command) => !markdown.includes(command))
        .map((command) => `${markdownPath}: ${command}`);
    });

    expect(missingCommands).toEqual([]);
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
      ["clean-clone-documentation", "ready"],
      ["screenshot-assets", "ready"],
      ["phase-2-api-health", "ready"]
    ]);
    expect(report.checks.find((check: { id: string }) => check.id === "required-files")?.detail).toContain(
      "docs/submission-pack.md"
    );
    expect(report.checks.find((check: { id: string }) => check.id === "clean-clone-documentation")?.detail).toContain(
      "docs/demo-script.md"
    );
    expect(report.checks.find((check: { id: string }) => check.id === "screenshot-assets")).toEqual(
      expect.objectContaining({
        documentReferencedCount: expect.any(Number),
        unregisteredDocumentRefCount: 0,
        missingDocumentRefCount: 0
      })
    );
    expect(report.nextActions).toEqual(["Demo smoke checks are ready for the clean-clone judge path."]);
    expect(JSON.stringify(report)).toContain("Not legal advice");
    expect(JSON.stringify(report)).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);
  });

  it("blocks the demo smoke CLI when judge documentation references unregistered screenshots", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "lexproof-demo-smoke-docs-"));
    const registryPath = join(tempDir, "demoReadiness.ts");
    writeFileSync(
      registryPath,
      [
        "export const demoReadinessScreenshotRefs = [",
        '  "docs/assets/screenshots/demo-01-model-connect.png"',
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
      throw new Error("Expected demo smoke CLI to block unregistered document screenshots.");
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
          duplicateCount: 0,
          unsafeCount: 0,
          unsupportedCount: 0,
          missingDocumentRefCount: 0
        })
      );
      expect(screenshotCheck.documentReferencedCount).toBeGreaterThan(1);
      expect(screenshotCheck.unregisteredDocumentRefCount).toBeGreaterThan(0);
      expect(screenshotCheck.detail).toContain("unregistered document refs");
      expect(JSON.stringify(report)).toContain("Not legal advice");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
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
          unregisteredDocumentRefCount: expect.any(Number),
          missingDocumentRefCount: 0,
          recoveryAction: "Fix missing, duplicate, unsafe, or unsupported screenshot references before judging."
        })
      );
      expect(screenshotCheck.unregisteredDocumentRefCount).toBeGreaterThan(0);
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
            expect.objectContaining({ id: "api-preflight-report", status: "ready", artifactHash: "a".repeat(64) }),
            expect.objectContaining({
              id: "model-gateway-provider-policy",
              status: "ready",
              detail: "Model Gateway provider policy report is reachable with disabled external adapters and recovery metadata."
            }),
            expect.objectContaining({ id: "model-gateway-run-ledger", status: "ready" }),
            expect.objectContaining({ id: "model-gateway-run-recovery", status: "ready", artifactHash: "6".repeat(64) }),
            expect.objectContaining({ id: "evidence-vault-manifest", status: "ready", artifactHash: "c".repeat(64) }),
            expect.objectContaining({ id: "evidence-vault-lineage-digest", status: "ready", artifactHash: "8".repeat(64) }),
            expect.objectContaining({ id: "evidence-vault-lineage-recovery", status: "ready", artifactHash: "5".repeat(64) }),
            expect.objectContaining({ id: "source-review-packet", status: "ready", artifactHash: "9".repeat(64) }),
            expect.objectContaining({ id: "source-approval-packet", status: "ready", artifactHash: "4".repeat(64) }),
            expect.objectContaining({ id: "counsel-pack-export-recovery", status: "ready", artifactHash: "f".repeat(64) }),
            expect.objectContaining({ id: "audit-log-export", status: "ready", artifactHash: "d".repeat(64) }),
            expect.objectContaining({ id: "integration-policy-evaluations", status: "ready" }),
            expect.objectContaining({ id: "integration-policy-receipt-bundle", status: "ready", artifactHash: "7".repeat(64) })
          ])
        })
      );
      expect(apiCheck.routeChecks).toHaveLength(19);
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
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/model-runs", {
      method: "GET"
    });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/model-runs/recovery", {
      method: "GET"
    });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/evidence-manifest", {
      method: "GET"
    });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/evidence-lineage-digest", {
      method: "GET"
    });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/evidence-lineage-recovery", {
      method: "GET"
    });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/source-reviews/packet", {
      method: "GET"
    });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/source-approvals/packet", {
      method: "GET"
    });
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/audit-log/export", {
      method: "GET"
    });
    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/integration-policy-evaluations/bundle",
      { method: "GET" }
    );
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
      apiPreflightReportHash: "a".repeat(64),
      routeChecks: expect.arrayContaining([
        expect.objectContaining({
          id: "api-preflight-report",
          status: "ready",
          artifactHash: "a".repeat(64)
        }),
        expect.objectContaining({
          id: "evidence-vault-manifest",
          status: "ready",
          artifactHash: "c".repeat(64),
          detail: "Evidence Vault manifest route is reachable with a bundle hash and metadata boundary for a demo workspace."
        }),
        expect.objectContaining({
          id: "evidence-vault-lineage-digest",
          status: "ready",
          artifactHash: "8".repeat(64),
          detail: "Evidence Vault lineage digest route is reachable with digest hash metadata for an empty demo workspace."
        }),
        expect.objectContaining({
          id: "evidence-vault-lineage-recovery",
          status: "ready",
          artifactHash: "5".repeat(64),
          detail: "Evidence Vault lineage recovery route is reachable with packet hash metadata for an empty demo workspace."
        }),
        expect.objectContaining({
          id: "model-gateway-adapters",
          status: "ready"
        }),
        expect.objectContaining({
          id: "model-gateway-provider-policy",
          status: "ready",
          detail: "Model Gateway provider policy report is reachable with disabled external adapters and recovery metadata."
        }),
        expect.objectContaining({
          id: "model-gateway-run-ledger",
          status: "ready",
          detail: "Server Model Run Ledger route is reachable for persisted metadata checks."
        }),
        expect.objectContaining({
          id: "model-gateway-run-recovery",
          status: "ready",
          artifactHash: "6".repeat(64),
          detail: "Model Gateway run recovery route is reachable with packet hash metadata for an empty demo workspace."
        }),
        expect.objectContaining({
          id: "integration-policy-evaluations",
          status: "ready"
        }),
        expect.objectContaining({
          id: "integration-policy-receipt-bundle",
          status: "ready",
          artifactHash: "7".repeat(64),
          detail: "Integration Policy receipt bundle route is reachable with missing-policy metadata for an empty demo workspace."
        }),
        expect.objectContaining({
          id: "counsel-pack-export-recovery",
          status: "ready",
          artifactHash: "f".repeat(64),
          detail: "Counsel Pack export recovery route is reachable with packet hash metadata for an empty demo workspace."
        }),
        expect.objectContaining({
          id: "audit-log-export",
          status: "ready",
          artifactHash: "d".repeat(64),
          detail: "Audit Log export route is reachable with integrity chain metadata for an empty demo workspace."
        }),
        expect.objectContaining({
          id: "source-review-ledger",
          status: "ready"
        }),
        expect.objectContaining({
          id: "source-review-packet",
          status: "ready",
          artifactHash: "9".repeat(64),
          detail: "Source Review packet route is reachable with packet hash metadata for an empty demo workspace."
        }),
        expect.objectContaining({
          id: "source-approval-queue",
          status: "ready"
        }),
        expect.objectContaining({
          id: "source-approval-packet",
          status: "ready",
          artifactHash: "4".repeat(64),
          detail: "Source Approval packet route is reachable with packet hash metadata for an empty demo workspace."
        }),
        expect.objectContaining({
          id: "human-review-queue",
          status: "ready",
          detail: "Human Review queue route is reachable with server recovery packet metadata for an empty demo workspace."
        })
      ]),
      checkedAt: "2026-07-01T00:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(preflight.status === "ready" ? preflight.routeChecks : []).toHaveLength(19);
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

  it("fails API preflight when the Human Review queue omits server recovery packet metadata", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/reviews/queue")) {
        return createJsonResponse(
          {
            queueVersion: "lexproof-server-human-review-queue-v1",
            workspaceId: "demo-smoke-preflight",
            notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only."
          },
          200
        );
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
    expect(preflight.error).toBe("Human Review queue: Human Review queue response is missing expected metadata.");
  });

  it.each([
    {
      label: "Human Review queue",
      path: "/api/workspaces/demo-smoke-preflight/reviews/queue",
      updatePayload: (payload: Record<string, unknown>) => ({
        ...payload,
        recoveryPacket: {
          ...(payload.recoveryPacket as Record<string, unknown>),
          nextActions: []
        }
      })
    },
    {
      label: "Model Gateway run recovery",
      path: "/api/workspaces/demo-smoke-preflight/model-runs/recovery",
      updatePayload: (payload: Record<string, unknown>) => ({ ...payload, nextActions: [] })
    },
    {
      label: "Evidence Vault lineage digest",
      path: "/api/workspaces/demo-smoke-preflight/evidence-lineage-digest",
      updatePayload: (payload: Record<string, unknown>) => ({ ...payload, nextActions: [] })
    },
    {
      label: "Evidence Vault lineage recovery",
      path: "/api/workspaces/demo-smoke-preflight/evidence-lineage-recovery",
      updatePayload: (payload: Record<string, unknown>) => ({ ...payload, nextActions: [] })
    },
    {
      label: "Counsel Pack export recovery",
      path: "/api/workspaces/demo-smoke-preflight/exports/counsel-pack/recovery",
      updatePayload: (payload: Record<string, unknown>) => ({ ...payload, nextActions: [] })
    },
    {
      label: "Audit Log export",
      path: "/api/workspaces/demo-smoke-preflight/audit-log/export",
      updatePayload: (payload: Record<string, unknown>) => ({ ...payload, nextActions: [] })
    }
  ])("fails API preflight when $label next actions are an empty array", async ({ label, path, updatePayload }) => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith(path)) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error(`Expected demo ${label} payload.`);
        }
        return createJsonResponse(updatePayload(payload as Record<string, unknown>), 200);
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
    expect(preflight.error).toBe(`${label}: ${label} response is missing expected metadata.`);
  });

  it("fails API preflight when the Human Review recovery summary next action is blank", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/reviews/queue")) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error("Expected demo Human Review queue payload.");
        }
        const queuePayload = payload as Record<string, unknown>;
        const recoveryPacket = queuePayload.recoveryPacket;
        if (typeof recoveryPacket !== "object" || recoveryPacket === null || Array.isArray(recoveryPacket)) {
          throw new Error("Expected demo Human Review recovery packet.");
        }
        const recoveryPacketPayload = recoveryPacket as Record<string, unknown>;
        const summary = recoveryPacketPayload.summary;
        if (typeof summary !== "object" || summary === null || Array.isArray(summary)) {
          throw new Error("Expected demo Human Review recovery summary.");
        }
        const summaryPayload = summary as Record<string, unknown>;
        return createJsonResponse(
          {
            ...queuePayload,
            recoveryPacket: {
              ...recoveryPacketPayload,
              summary: {
                ...summaryPayload,
                nextAction: " "
              }
            }
          },
          200
        );
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
    expect(preflight.error).toBe("Human Review queue: Human Review queue response is missing expected metadata.");
  });

  it("fails API preflight when Model Gateway provider policy next actions are empty", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/model-gateway/provider-policy")) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error("Expected demo Model Gateway provider policy payload.");
        }
        return createJsonResponse(
          {
            ...payload,
            nextActions: ["Keep external provider proxying disabled until provider allowlist and egress logging are reviewed.", "   "]
          },
          200
        );
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
    expect(preflight.error).toBe("Model Gateway provider policy: Model Gateway provider policy response is missing expected metadata.");
  });

  it("fails API preflight when Model Gateway provider policy enables an external adapter", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/model-gateway/provider-policy")) {
        const payload = createDemoApiPayload(value);
        const policyPayload = payload as { adapters?: unknown[] };
        if (typeof payload !== "object" || payload === null || Array.isArray(payload) || !Array.isArray(policyPayload.adapters)) {
          throw new Error("Expected demo Model Gateway provider policy payload.");
        }
        return createJsonResponse(
          {
            ...payload,
            enabledProviderCount: 2,
            deferredProviderCount: 1,
            adapters: policyPayload.adapters.map((adapter) =>
              typeof adapter === "object" &&
              adapter !== null &&
              !Array.isArray(adapter) &&
              (adapter as { provider?: unknown }).provider === "openai-compatible"
                ? {
                    ...adapter,
                    enabled: true,
                    status: "ready",
                    readinessEvidence: "OpenAI-compatible gateway is enabled for external provider proxying."
                  }
                : adapter
            )
          },
          200
        );
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
    expect(preflight.error).toBe("Model Gateway provider policy: Model Gateway provider policy response is missing expected metadata.");
  });

  it("fails API preflight when the Source Review packet next actions are empty", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/source-reviews/packet")) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error("Expected demo Source Review packet payload.");
        }
        return createJsonResponse(
          {
            ...payload,
            nextActions: ["Sync Source Review Ledger metadata before counsel handoff.", "   "]
          },
          200
        );
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
    expect(preflight.error).toBe("Source Review packet: Source Review packet response is missing expected metadata.");
  });

  it("fails API preflight when the Source Approval packet next actions are empty", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/source-approvals/packet")) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error("Expected demo Source Approval packet payload.");
        }
        return createJsonResponse(
          {
            ...payload,
            nextActions: ["Sync Source Approval Queue metadata before counsel handoff when source review freshness is due.", "   "]
          },
          200
        );
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
    expect(preflight.error).toBe("Source Approval packet: Source Approval packet response is missing expected metadata.");
  });

  it("fails API preflight when Model Gateway recovery next actions are empty", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/model-runs/recovery")) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error("Expected demo Model Gateway recovery payload.");
        }
        return createJsonResponse(
          {
            ...payload,
            nextActions: ["Keep Model Gateway run receipts with the audit-preparation handoff packet.", "   "]
          },
          200
        );
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
    expect(preflight.error).toBe("Model Gateway run recovery: Model Gateway run recovery response is missing expected metadata.");
  });

  it("fails API preflight when Counsel Pack export recovery next actions are empty", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/exports/counsel-pack/recovery")) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error("Expected demo Counsel Pack export recovery payload.");
        }
        return createJsonResponse(
          {
            ...payload,
            nextActions: ["Keep the latest metadata-only export receipt with the counsel handoff packet.", "   "]
          },
          200
        );
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
    expect(preflight.error).toBe(
      "Counsel Pack export recovery: Counsel Pack export recovery response is missing expected metadata."
    );
  });

  it("fails API preflight when the Evidence Vault manifest omits bundle hash metadata", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/evidence-manifest")) {
        return createJsonResponse(
          {
            manifestVersion: "lexproof-evidence-vault-manifest-v1",
            workspaceId: "demo-smoke-preflight",
            generatedAt: "2026-07-01T00:00:00.000Z",
            itemCount: 0,
            items: [],
            notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
          },
          200
        );
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
    expect(preflight.error).toBe("Evidence Vault manifest: Evidence Vault manifest response is missing expected metadata.");
  });

  it("fails API preflight when the Audit Log export omits integrity chain metadata", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/audit-log/export")) {
        return createJsonResponse(
          {
            exportVersion: "lexproof-audit-log-export-v1",
            workspaceId: "demo-smoke-preflight",
            exportedAt: "2026-07-01T00:00:00.000Z",
            exportHash: "d".repeat(64),
            integrityStatus: "empty",
            integritySummary: "No server audit log events are available yet.",
            eventCount: 0,
            events: [],
            dataBoundaryStatus: "clean",
            exportAllowed: true,
            notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only."
          },
          200
        );
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
    expect(preflight.error).toBe("Audit Log export: Audit Log export response is missing expected metadata.");
  });

  it("fails API preflight when the Audit Log export next actions are empty", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/audit-log/export")) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error("Expected demo Audit Log export payload.");
        }
        return createJsonResponse(
          {
            ...payload,
            nextActions: ["Run Secure Review Journey or clear Audit Log filters before final handoff.", "   "]
          },
          200
        );
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
    expect(preflight.error).toBe("Audit Log export: Audit Log export response is missing expected metadata.");
  });

  it("fails API preflight when the Integration Policy receipt bundle next actions are empty", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const value = String(url);
      if (value.endsWith("/api/workspaces/demo-smoke-preflight/integration-policy-evaluations/bundle")) {
        const payload = createDemoApiPayload(value);
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          throw new Error("Expected demo Integration Policy receipt bundle payload.");
        }
        return createJsonResponse(
          {
            ...payload,
            nextActions: ["Evaluate server integration policies before any adapter enablement review.", "   "]
          },
          200
        );
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
    expect(preflight.error).toBe(
      "Integration Policy receipt bundle: Integration Policy receipt bundle response is missing expected metadata."
    );
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
      routeFamilyCount: 18,
      routeFamilies: [],
      implementedRouteCount: 29,
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
      generatedAt: "2026-07-01T00:00:00.000Z",
      overallStatus: "needs-policy",
      enabledProviderCount: 1,
      deferredProviderCount: 2,
      adapters: [
        {
          provider: "mock",
          label: "Mock local reviewer gateway",
          enabled: true,
          mode: "local-mock",
          credentialPolicy: "no credentials accepted",
          status: "ready",
          readinessEvidence: "Mock local reviewer gateway is enabled for metadata-only mock review. No external provider call is made.",
          requiredControls: ["redaction-gate", "human-review-enforcement"]
        },
        {
          provider: "openai-compatible",
          label: "OpenAI-compatible gateway",
          enabled: false,
          mode: "external-provider-placeholder",
          credentialPolicy: "deferred until server-side secret policy is approved",
          status: "disabled",
          readinessEvidence: "OpenAI-compatible gateway is registered as a disabled placeholder and cannot receive credentials or external requests in this phase.",
          requiredControls: [
            "server-side-secret-policy",
            "provider-allowlist",
            "egress-logging",
            "redaction-gate",
            "human-review-enforcement"
          ],
          disabledReason:
            "External provider proxying is disabled until server-side secret handling, provider allowlist, and egress logging are approved."
        },
        {
          provider: "enterprise-proxy",
          label: "Enterprise model proxy gateway",
          enabled: false,
          mode: "external-provider-placeholder",
          credentialPolicy: "deferred until server-side secret policy is approved",
          status: "disabled",
          readinessEvidence:
            "Enterprise model proxy gateway is registered as a disabled placeholder and cannot receive credentials or external requests in this phase.",
          requiredControls: [
            "server-side-secret-policy",
            "provider-allowlist",
            "egress-logging",
            "redaction-gate",
            "human-review-enforcement"
          ],
          disabledReason:
            "External provider proxying is disabled until server-side secret handling, provider allowlist, and egress logging are approved."
        }
      ],
      controls: [
        {
          id: "server-side-secret-policy",
          label: "Server-side secret policy",
          status: "needs-policy",
          evidence: "No KMS-backed provider credential storage or secret rotation policy is approved yet.",
          recoveryAction: "Approve KMS-backed secret storage, rotation, access review, and no-client-persistence requirements."
        },
        {
          id: "provider-allowlist",
          label: "Provider allowlist",
          status: "needs-policy",
          evidence: "External model providers are placeholders until an allowlist and destination review are approved.",
          recoveryAction: "Approve provider allowlist, model list, jurisdictional routing, and data-class limits."
        },
        {
          id: "egress-logging",
          label: "Egress logging",
          status: "needs-policy",
          evidence: "Server egress logging, retry policy, and failure receipt retention are not approved for external providers.",
          recoveryAction: "Define metadata-only request logging, retry limits, incident response, and receipt retention."
        },
        {
          id: "redaction-gate",
          label: "Redaction Gate",
          status: "ready",
          evidence: "Model Connect has no current redaction blockers for audit-prep routing.",
          recoveryAction: "Keep Redaction Gate mandatory before any provider request."
        },
        {
          id: "human-review-enforcement",
          label: "Human review enforcement",
          status: "ready",
          evidence: "Model Gateway receipts and Model Intake route model output to human review before external reliance.",
          recoveryAction: "Keep model output as draft audit preparation and require human review before counsel handoff."
        }
      ],
      nextActions: ["Keep external provider proxying disabled until provider allowlist and egress logging are reviewed."],
      notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/model-runs")) {
    return [];
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/model-runs/recovery")) {
    return {
      packetVersion: "lexproof-model-gateway-run-recovery-packet-v1",
      workspaceId: "demo-smoke-preflight",
      generatedAt: "2026-07-01T00:00:00.000Z",
      packetHash: "6".repeat(64),
      runCount: 0,
      recoveryItemCount: 0,
      blockedCount: 0,
      retryAvailableCount: 0,
      needsHumanReviewCount: 0,
      readyCount: 0,
      nextActions: ["Keep Model Gateway run receipts with the audit-preparation handoff packet."],
      items: [],
      notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/evidence-manifest")) {
    return {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: "demo-smoke-preflight",
      generatedAt: "2026-07-01T00:00:00.000Z",
      itemCount: 0,
      items: [],
      bundleHash: "c".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/evidence-lineage-digest")) {
    return {
      digestVersion: "lexproof-evidence-vault-lineage-digest-v1",
      workspaceId: "demo-smoke-preflight",
      generatedAt: "2026-07-01T00:00:00.000Z",
      readinessStatus: "empty",
      manifestHash: "c".repeat(64),
      itemCount: 0,
      statusCounts: {},
      lineageCounts: {
        activeRecords: 0,
        replacedRecords: 0,
        openRejectedRecords: 0,
        lineageLinkCount: 0,
        linkedControlCount: 0,
        linkedRiskFlagCount: 0
      },
      lineageLinks: [],
      activeEvidenceIds: [],
      openRejectedEvidenceIds: [],
      linkedControlIds: [],
      linkedRiskFlagIds: [],
      nextActions: ["Add metadata-only evidence records, then sync the Evidence Vault before counsel handoff."],
      digestHash: "8".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/evidence-lineage-recovery")) {
    return {
      packetVersion: "lexproof-evidence-vault-lineage-recovery-packet-v1",
      workspaceId: "demo-smoke-preflight",
      generatedAt: "2026-07-01T00:00:00.000Z",
      status: "empty",
      lineageDigestHash: "8".repeat(64),
      manifestHash: "c".repeat(64),
      summary: {
        totalRecoveryCount: 0,
        openRejectedCount: 0,
        missingManifestCount: 0,
        activeRecordCount: 0,
        lineageLinkCount: 0,
        nextAction: "Add metadata-only evidence records, then sync the Evidence Vault before counsel handoff.",
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only."
      },
      items: [],
      nextActions: ["Add metadata-only evidence records, then sync the Evidence Vault before counsel handoff."],
      packetHash: "5".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/source-reviews/packet")) {
    return {
      packetVersion: "lexproof-server-source-review-packet-v1",
      workspaceId: "demo-smoke-preflight",
      generatedAt: "2026-07-01T00:00:00.000Z",
      status: "empty",
      recordCount: 0,
      ledgerHashes: [],
      statusCounts: {
        current: 0,
        pendingReview: 0,
        metadataNeeded: 0
      },
      reviewStatusCounts: {
        current: 0,
        reviewDue: 0,
        metadataMissing: 0
      },
      priorityCounts: {
        P0: 0,
        P1: 0,
        P2: 0
      },
      matchingBehaviorChanged: false,
      records: [],
      nextActions: ["Sync Source Review Ledger metadata before counsel handoff."],
      packetHash: "9".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. Server Source Review packets are audit preparation lineage metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/source-approvals/packet")) {
    return {
      packetVersion: "lexproof-server-source-approval-packet-v1",
      workspaceId: "demo-smoke-preflight",
      generatedAt: "2026-07-01T00:00:00.000Z",
      status: "empty",
      recordCount: 0,
      queueHashes: [],
      statusCounts: {
        pendingReview: 0
      },
      approvalStatusCounts: {
        approvalRequired: 0,
        metadataRequired: 0
      },
      reviewStatusCounts: {
        current: 0,
        reviewDue: 0,
        metadataMissing: 0
      },
      priorityCounts: {
        P0: 0,
        P1: 0
      },
      matchingBehaviorChanged: false,
      records: [],
      nextActions: ["Sync Source Approval Queue metadata before counsel handoff when source review freshness is due."],
      packetHash: "4".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. Server Source Approval packets are audit preparation workflow metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/reviews/queue")) {
    return {
      queueVersion: "lexproof-server-human-review-queue-v1",
      workspaceId: "demo-smoke-preflight",
      recoveryPacket: {
        packetVersion: "lexproof-server-human-review-recovery-packet-v1",
        workspaceId: "demo-smoke-preflight",
        generatedAt: "2026-07-01T00:00:00.000Z",
        packetHash: "b".repeat(64),
        status: "ready",
        summary: {
          totalRecoveryCount: 0,
          returnedCount: 0,
          rejectedCount: 0,
          nextAction: "No returned or rejected server human review records currently need recovery.",
          notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
        },
        nextActions: ["No returned or rejected server human review records currently need recovery."],
        items: [],
        notLegalAdviceBoundary: "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
      },
      notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/exports/counsel-pack/recovery")) {
    return {
      packetVersion: "lexproof-counsel-pack-export-recovery-packet-v1",
      workspaceId: "demo-smoke-preflight",
      generatedAt: "2026-07-01T00:00:00.000Z",
      packetHash: "f".repeat(64),
      recordCount: 0,
      recoveryItemCount: 0,
      blockedCount: 0,
      needsSourceReviewCount: 0,
      needsReviewCount: 0,
      readyCount: 0,
      nextActions: ["Keep the latest metadata-only export receipt with the counsel handoff packet."],
      items: [],
      notLegalAdviceBoundary: "Not legal advice. Counsel Pack export recovery packets are audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/audit-log/export")) {
    return {
      exportVersion: "lexproof-audit-log-export-v1",
      workspaceId: "demo-smoke-preflight",
      exportedAt: "2026-07-01T00:00:00.000Z",
      exportHash: "d".repeat(64),
      integrityChainHash: "e".repeat(64),
      integrityStatus: "empty",
      integritySummary: "No server audit log events are available yet; run the Secure Review Journey before final handoff.",
      eventCount: 0,
      actionCounts: {},
      actors: [],
      targetTypes: [],
      dataBoundaryStatus: "clean",
      exportAllowed: true,
      boundaryBlockerCount: 0,
      boundaryWarningCount: 0,
      detectedClasses: [],
      boundaryFindings: [],
      remediation: ["Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."],
      nextActions: [
        "Run Secure Review Journey or clear Audit Log filters before final handoff.",
        "Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."
      ],
      events: [],
      notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/integration-policy-evaluations/bundle")) {
    return {
      bundleVersion: "lexproof-integration-policy-evaluation-receipt-bundle-v1",
      workspaceId: "demo-smoke-preflight",
      generatedAt: "2026-07-01T00:00:00.000Z",
      bundleHash: "7".repeat(64),
      recordCount: 0,
      policyCount: 0,
      missingPolicyIds: ["object-storage", "document-parser", "chain-anchor", "grc-destination"],
      readyCount: 0,
      needsPolicyCount: 0,
      blockedCount: 0,
      externalEnablementAllowed: false,
      nextActions: ["Evaluate server integration policies before any adapter enablement review."],
      records: [],
      notLegalAdviceBoundary: "Not legal advice. Integration policy receipt bundles are audit preparation metadata only."
    };
  }
  if (
    url.endsWith("/api/workspaces/demo-smoke-preflight/source-reviews") ||
    url.endsWith("/api/workspaces/demo-smoke-preflight/source-approvals") ||
    url.endsWith("/api/workspaces/demo-smoke-preflight/exports") ||
    url.endsWith("/api/workspaces/demo-smoke-preflight/audit-log") ||
    url.endsWith("/api/workspaces/demo-smoke-preflight/integration-policy-evaluations")
  ) {
    return [];
  }

  return {};
}
