#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const reportVersion = "lexproof-demo-smoke-cli-v1";
const notLegalAdviceBoundary = "Not legal advice. Demo smoke checks are audit preparation readiness metadata only.";
const requiredScripts = ["verify", "build:server", "start:api", "demo:smoke", "dev"];
const requiredFiles = ["README.md", "src/data/demoReadiness.ts", "src/lib/demoReadiness.ts", "docs/demo-script.md"];
const screenshotRefPattern = /["'](docs\/assets\/screenshots\/[^"']+\.(?:png|jpe?g|webp))["']/gi;
const demoPreflightWorkspaceId = "demo-smoke-preflight";
const apiRoutePreflightSpecs = [
  {
    id: "model-gateway-adapters",
    label: "Model Gateway adapters",
    path: "/api/model-gateway/adapters",
    validate: Array.isArray,
    readyDetail: "Model Gateway adapter registry is reachable."
  },
  {
    id: "model-gateway-provider-policy",
    label: "Model Gateway provider policy",
    path: "/api/model-gateway/provider-policy",
    validate: (payload) => Boolean(payload && payload.reportVersion === "lexproof-model-gateway-provider-policy-v1"),
    readyDetail: "Model Gateway provider policy report is reachable."
  },
  {
    id: "evidence-vault-manifest",
    label: "Evidence Vault manifest",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/evidence-manifest`,
    validate: (payload) => Boolean(payload && payload.manifestVersion === "lexproof-evidence-vault-manifest-v1"),
    readyDetail: "Evidence Vault manifest route is reachable for an empty demo workspace."
  },
  {
    id: "human-review-queue",
    label: "Human Review queue",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/reviews/queue`,
    validate: (payload) => Boolean(payload && payload.queueVersion === "lexproof-server-human-review-queue-v1"),
    readyDetail: "Human Review queue route is reachable for an empty demo workspace."
  },
  {
    id: "counsel-pack-exports",
    label: "Counsel Pack exports",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/exports`,
    validate: Array.isArray,
    readyDetail: "Counsel Pack export record route is reachable."
  },
  {
    id: "audit-log",
    label: "Audit Log",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/audit-log`,
    validate: Array.isArray,
    readyDetail: "Audit Log route is reachable."
  },
  {
    id: "integration-policy-evaluations",
    label: "Integration Policy Evaluation receipts",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/integration-policy-evaluations`,
    validate: Array.isArray,
    readyDetail: "Integration Policy Evaluation receipt route is reachable."
  }
];

const args = parseArgs(process.argv.slice(2));
const apiBaseUrl = args.apiBaseUrl ?? process.env.DEMO_API_BASE_URL;
const checks = [];

checks.push(checkPackageScripts());
checks.push(checkRequiredFiles());
checks.push(checkScreenshotAssets());
checks.push(await checkApiHealth({ apiBaseUrl, skipApi: args.skipApi }));

const report = {
  reportVersion,
  status: createStatus(checks),
  checkedAt: new Date().toISOString(),
  checks,
  nextActions: createNextActions(checks),
  notLegalAdviceBoundary
};

if (args.json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  printHumanReport(report);
}

if (report.status === "blocked") {
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {
    json: false,
    skipApi: false,
    apiBaseUrl: undefined
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--json") {
      parsed.json = true;
      continue;
    }

    if (arg === "--skip-api") {
      parsed.skipApi = true;
      continue;
    }

    if (arg === "--api-base-url") {
      parsed.apiBaseUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--api-base-url=")) {
      parsed.apiBaseUrl = arg.slice("--api-base-url=".length);
    }
  }

  return parsed;
}

function checkPackageScripts() {
  const packageJsonPath = resolve(process.cwd(), "package.json");

  if (!existsSync(packageJsonPath)) {
    return createCheck(
      "package-scripts",
      "Package scripts",
      "blocked",
      "package.json is missing.",
      "Restore package.json before running the judge demo."
    );
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const scripts = packageJson.scripts ?? {};
    const missingScripts = requiredScripts.filter((scriptName) => !scripts[scriptName]);

    if (missingScripts.length > 0) {
      return createCheck(
        "package-scripts",
        "Package scripts",
        "blocked",
        `Missing required scripts: ${missingScripts.join(", ")}.`,
        "Restore the clean-clone npm scripts before judging."
      );
    }

    return createCheck(
      "package-scripts",
      "Package scripts",
      "ready",
      `Required scripts are present: ${requiredScripts.join(", ")}.`,
      "Run npm install, npm run verify, npm run build:server, npm run start:api, npm run demo:smoke, and npm run dev in order."
    );
  } catch (error) {
    return createCheck(
      "package-scripts",
      "Package scripts",
      "blocked",
      `package.json could not be parsed: ${error instanceof Error ? error.message : "unknown parse error"}.`,
      "Fix package.json before running the judge demo."
    );
  }
}

function checkRequiredFiles() {
  const missingFiles = requiredFiles.filter((filePath) => !existsSync(resolve(process.cwd(), filePath)));

  if (missingFiles.length > 0) {
    return createCheck(
      "required-files",
      "Required demo files",
      "blocked",
      `Missing required files: ${missingFiles.join(", ")}.`,
      "Restore the README, demo script, and demo readiness modules before judging."
    );
  }

  return createCheck(
    "required-files",
    "Required demo files",
    "ready",
    `Required demo files are present: ${requiredFiles.join(", ")}.`,
    "Keep README, demo script, and demo readiness artifacts aligned."
  );
}

function checkScreenshotAssets() {
  const demoReadinessPath = resolve(process.cwd(), "src/data/demoReadiness.ts");

  if (!existsSync(demoReadinessPath)) {
    return createCheck(
      "screenshot-assets",
      "Screenshot assets",
      "blocked",
      "src/data/demoReadiness.ts is missing, so screenshot references cannot be checked.",
      "Restore the demo readiness screenshot registry before judging."
    );
  }

  const source = readFileSync(demoReadinessPath, "utf8");
  const refs = [...source.matchAll(screenshotRefPattern)].map((match) => match[1]);
  const uniqueRefs = [...new Set(refs)];
  const duplicateCount = refs.length - uniqueRefs.length;
  const missingRefs = uniqueRefs.filter((ref) => !existsSync(resolve(process.cwd(), ref)));

  if (uniqueRefs.length === 0) {
    return createCheck(
      "screenshot-assets",
      "Screenshot assets",
      "blocked",
      "No demo screenshot references are registered.",
      "Capture current judge-visible screenshots under docs/assets/screenshots."
    );
  }

  if (missingRefs.length > 0 || duplicateCount > 0) {
    return createCheck(
      "screenshot-assets",
      "Screenshot assets",
      "blocked",
      `${uniqueRefs.length} screenshot refs registered; ${missingRefs.length} missing; ${duplicateCount} duplicate.`,
      "Fix missing or duplicate screenshot references before judging.",
      { registeredCount: uniqueRefs.length, missingCount: missingRefs.length, duplicateCount }
    );
  }

  return createCheck(
    "screenshot-assets",
    "Screenshot assets",
    "ready",
    `${uniqueRefs.length} registered demo screenshots exist on disk.`,
    "Refresh screenshots after visible UI changes.",
    { registeredCount: uniqueRefs.length, missingCount: 0, duplicateCount: 0 }
  );
}

async function checkApiHealth({ apiBaseUrl, skipApi }) {
  if (skipApi) {
    return createCheck(
      "phase-2-api-health",
      "Phase 2 API health",
      "ready",
      "API preflight skipped by --skip-api for offline clean-clone file checks.",
      "Run with DEMO_API_BASE_URL=http://127.0.0.1:8787 when the local API is available."
    );
  }

  if (!apiBaseUrl) {
    return createCheck(
      "phase-2-api-health",
      "Phase 2 API health",
      "not-checked",
      "No DEMO_API_BASE_URL was provided, so /api/health was not checked.",
      "Start the API and rerun with DEMO_API_BASE_URL=http://127.0.0.1:8787 npm run demo:smoke."
    );
  }

  try {
    const healthUrl = buildHealthUrl(apiBaseUrl);
    const response = await fetch(healthUrl, { method: "GET" });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return createCheck(
        "phase-2-api-health",
        "Phase 2 API health",
        "blocked",
        sanitize(`API health check failed with ${response.status}: ${readErrorMessage(payload)}.`),
        "Start the Phase 2 API, confirm /api/health is reachable, and rerun the smoke check."
      );
    }

    if (!isValidHealthPayload(payload)) {
      return createCheck(
        "phase-2-api-health",
        "Phase 2 API health",
        "blocked",
        "API health response is missing required demo readiness metadata.",
        "Confirm the Phase 2 API build is current and exposes /api/health."
      );
    }

    const routeChecks = await checkApiRouteFamilies(apiBaseUrl);
    const failedRoute = routeChecks.find((check) => check.status === "failed");

    if (failedRoute) {
      return createCheck(
        "phase-2-api-health",
        "Phase 2 API health",
        "blocked",
        `${failedRoute.label}: ${failedRoute.detail}`,
        "Start the Phase 2 API, confirm route modules are registered, and rerun the smoke check.",
        { routeChecks }
      );
    }

    return createCheck(
      "phase-2-api-health",
      "Phase 2 API health",
      "ready",
      sanitize(
        `${payload.service} ${payload.version} responded with ${Object.keys(payload.capabilities).length} capabilities and ${routeChecks.length}/${routeChecks.length} safe route checks.`
      ),
      "Keep the API process running while judges use the secure review path.",
      {
        service: sanitize(payload.service),
        version: sanitize(payload.version),
        capabilities: Object.keys(payload.capabilities).sort(),
        routeChecks,
        notLegalAdviceBoundary: sanitize(payload.notLegalAdviceBoundary)
      }
    );
  } catch (error) {
    return createCheck(
      "phase-2-api-health",
      "Phase 2 API health",
      "blocked",
      sanitize(`API health check failed: ${error instanceof Error ? error.message : "unknown error"}.`),
      "Start the Phase 2 API, confirm /api/health is reachable, and rerun the smoke check."
    );
  }
}

function buildHealthUrl(apiBaseUrl) {
  return buildApiUrl(apiBaseUrl, "/api/health");
}

async function checkApiRouteFamilies(apiBaseUrl) {
  const routeChecks = [];

  for (const spec of apiRoutePreflightSpecs) {
    const url = buildApiUrl(apiBaseUrl, spec.path);

    try {
      const response = await fetch(url, { method: "GET" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        routeChecks.push({
          id: spec.id,
          label: spec.label,
          status: "failed",
          url,
          detail: sanitize(`${spec.label} returned ${response.status}: ${readErrorMessage(payload)}.`)
        });
        continue;
      }

      if (!spec.validate(payload)) {
        routeChecks.push({
          id: spec.id,
          label: spec.label,
          status: "failed",
          url,
          detail: sanitize(`${spec.label} response is missing expected metadata.`)
        });
        continue;
      }

      routeChecks.push({
        id: spec.id,
        label: spec.label,
        status: "ready",
        url,
        detail: spec.readyDetail
      });
    } catch (error) {
      routeChecks.push({
        id: spec.id,
        label: spec.label,
        status: "failed",
        url,
        detail: sanitize(`${spec.label} route check failed: ${error instanceof Error ? error.message : "unknown error"}.`)
      });
    }
  }

  return routeChecks;
}

function buildApiUrl(apiBaseUrl, path) {
  return new URL(path, `${apiBaseUrl.replace(/\/+$/, "")}/`).toString();
}

function readErrorMessage(payload) {
  if (typeof payload?.error === "string") {
    return payload.error;
  }

  if (typeof payload?.message === "string") {
    return payload.message;
  }

  return "unknown API error";
}

function isValidHealthPayload(payload) {
  return (
    payload?.status === "ok" &&
    payload.service === "lexproof-secure-review-workspace-api" &&
    typeof payload.version === "string" &&
    typeof payload.notLegalAdviceBoundary === "string" &&
    payload.notLegalAdviceBoundary.includes("Not legal advice") &&
    payload.capabilities &&
    typeof payload.capabilities === "object"
  );
}

function createCheck(id, label, status, detail, recoveryAction, metadata = {}) {
  return {
    id,
    label,
    status,
    detail: sanitize(detail),
    recoveryAction: sanitize(recoveryAction),
    ...metadata
  };
}

function createStatus(checksToSummarize) {
  if (checksToSummarize.some((check) => check.status === "blocked")) {
    return "blocked";
  }

  if (checksToSummarize.some((check) => check.status === "not-checked")) {
    return "needs-api";
  }

  return "ready";
}

function createNextActions(checksToSummarize) {
  const actions = checksToSummarize
    .filter((check) => check.status !== "ready")
    .map((check) => check.recoveryAction)
    .filter(Boolean);

  return actions.length > 0 ? [...new Set(actions)] : ["Demo smoke checks are ready for the clean-clone judge path."];
}

function printHumanReport(reportToPrint) {
  process.stdout.write(`LexProof demo smoke: ${reportToPrint.status}\n`);
  process.stdout.write(`${reportToPrint.notLegalAdviceBoundary}\n`);

  for (const check of reportToPrint.checks) {
    process.stdout.write(`- ${check.label}: ${check.status} - ${check.detail}\n`);
  }

  process.stdout.write("Next actions:\n");
  for (const action of reportToPrint.nextActions) {
    process.stdout.write(`- ${action}\n`);
  }
}

function sanitize(value) {
  return String(value)
    .replace(/\bsk-(?:live|test|proj)-[A-Za-z0-9_-]{8,}\b/g, "[redacted-api-key]")
    .replace(/-----BEGIN [^-]+PRIVATE KEY-----[\s\S]*?-----END [^-]+PRIVATE KEY-----/g, "[redacted-private-key]")
    .replace(/\b(?:seed phrase|mnemonic phrase)\b[^.\n]*/gi, "[redacted-seed-phrase]")
    .replace(/\braw KYC\b/gi, "[redacted-raw-kyc]");
}
