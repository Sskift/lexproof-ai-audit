#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const reportVersion = "lexproof-demo-smoke-cli-v1";
const notLegalAdviceBoundary = "Not legal advice. Demo smoke checks are audit preparation readiness metadata only.";
const requiredScripts = ["verify", "build:server", "start:api", "demo:smoke", "dev"];
const requiredFiles = [
  "README.md",
  "src/data/demoReadiness.ts",
  "src/lib/demoReadiness.ts",
  "docs/demo-script.md",
  "docs/submission-pack.md"
];
const requiredCommandDocs = ["README.md", "docs/demo-script.md"];
const screenshotDocumentationPaths = ["README.md", "docs/demo-script.md", "docs/submission-pack.md"];
const requiredCleanCloneCommands = [
  "npm install",
  "npm run verify",
  "npm run build:server",
  "DATABASE_URL=file:./demo-review-workspace.db npm run start:api",
  "DEMO_API_BASE_URL=http://127.0.0.1:8787 npm run demo:smoke",
  "npm run dev"
];
const screenshotRefPattern = /["']([^"']+)["']/g;
const markdownScreenshotRefPattern = /(?:\(|`|")((?:docs\/)?assets\/screenshots\/[^)`"]+\.(?:png|jpe?g|webp))(?:\)|`|")/gi;
const screenshotPathPrefix = "docs/assets/screenshots/";
const screenshotExtensionPattern = /\.(?:png|jpe?g|webp)$/i;
const demoPreflightWorkspaceId = "demo-smoke-preflight";
const apiPortRecoveryAction =
  "Start the Phase 2 API, confirm /api/health is reachable, and rerun the smoke check. If port 8787 is already in use, start the API with PORT=<free-port> and rerun with DEMO_API_BASE_URL=http://127.0.0.1:<free-port>.";
const apiRoutePreflightSpecs = [
  {
    id: "api-preflight-report",
    label: "API Preflight report",
    path: "/api/preflight",
    validate: (payload) =>
      Boolean(
        payload &&
          payload.reportVersion === "lexproof-api-preflight-v1" &&
          payload.status === "ready" &&
          payload.externalSideEffectsAllowed === false &&
          typeof payload.reportHash === "string"
      ),
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.reportHash) : undefined),
    readyDetail: "API preflight report is reachable with a stable metadata hash."
  },
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
    validate: isDemoModelGatewayProviderPolicyPayload,
    readyDetail: "Model Gateway provider policy report is reachable with disabled external adapters and recovery metadata."
  },
  {
    id: "model-gateway-run-recovery",
    label: "Model Gateway run recovery",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/model-runs/recovery`,
    validate: isDemoModelGatewayRunRecoveryPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.packetHash) : undefined),
    readyDetail: "Model Gateway run recovery route is reachable with packet hash metadata for an empty demo workspace."
  },
  {
    id: "evidence-vault-manifest",
    label: "Evidence Vault manifest",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/evidence-manifest`,
    validate: isDemoEvidenceVaultManifestPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.bundleHash) : undefined),
    readyDetail: "Evidence Vault manifest route is reachable with a bundle hash and metadata boundary for a demo workspace."
  },
  {
    id: "evidence-vault-lineage-digest",
    label: "Evidence Vault lineage digest",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/evidence-lineage-digest`,
    validate: isDemoEvidenceVaultLineageDigestPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.digestHash) : undefined),
    readyDetail: "Evidence Vault lineage digest route is reachable with digest hash metadata for an empty demo workspace."
  },
  {
    id: "human-review-queue",
    label: "Human Review queue",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/reviews/queue`,
    validate: isDemoHumanReviewQueuePayload,
    readyDetail: "Human Review queue route is reachable with server recovery packet metadata for an empty demo workspace."
  },
  {
    id: "source-review-ledger",
    label: "Source Review Ledger",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/source-reviews`,
    validate: Array.isArray,
    readyDetail: "Source Review Ledger route is reachable for persisted metadata checks."
  },
  {
    id: "source-review-packet",
    label: "Source Review packet",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/source-reviews/packet`,
    validate: isDemoServerSourceReviewPacketPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.packetHash) : undefined),
    readyDetail: "Source Review packet route is reachable with packet hash metadata for an empty demo workspace."
  },
  {
    id: "source-approval-queue",
    label: "Source Approval Queue",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/source-approvals`,
    validate: Array.isArray,
    readyDetail: "Source Approval Queue route is reachable for persisted metadata checks."
  },
  {
    id: "source-approval-packet",
    label: "Source Approval packet",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/source-approvals/packet`,
    validate: isDemoServerSourceApprovalPacketPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.packetHash) : undefined),
    readyDetail: "Source Approval packet route is reachable with packet hash metadata for an empty demo workspace."
  },
  {
    id: "counsel-pack-exports",
    label: "Counsel Pack exports",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/exports`,
    validate: Array.isArray,
    readyDetail: "Counsel Pack export record route is reachable."
  },
  {
    id: "counsel-pack-export-recovery",
    label: "Counsel Pack export recovery",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/exports/counsel-pack/recovery`,
    validate: isDemoCounselPackExportRecoveryPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.packetHash) : undefined),
    readyDetail: "Counsel Pack export recovery route is reachable with packet hash metadata for an empty demo workspace."
  },
  {
    id: "audit-log",
    label: "Audit Log",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/audit-log`,
    validate: Array.isArray,
    readyDetail: "Audit Log route is reachable."
  },
  {
    id: "audit-log-export",
    label: "Audit Log export",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/audit-log/export`,
    validate: isDemoAuditLogExportPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.exportHash) : undefined),
    readyDetail: "Audit Log export route is reachable with integrity chain metadata for an empty demo workspace."
  },
  {
    id: "integration-policy-evaluations",
    label: "Integration Policy Evaluation receipts",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/integration-policy-evaluations`,
    validate: Array.isArray,
    readyDetail: "Integration Policy Evaluation receipt route is reachable."
  },
  {
    id: "integration-policy-receipt-bundle",
    label: "Integration Policy receipt bundle",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/integration-policy-evaluations/bundle`,
    validate: isDemoIntegrationPolicyReceiptBundlePayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.bundleHash) : undefined),
    readyDetail: "Integration Policy receipt bundle route is reachable with missing-policy metadata for an empty demo workspace."
  }
];

const args = parseArgs(process.argv.slice(2));
const apiBaseUrl = args.apiBaseUrl ?? process.env.DEMO_API_BASE_URL;
const checks = [];

checks.push(checkPackageScripts());
checks.push(checkRequiredFiles());
checks.push(checkCleanCloneDocumentation());
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
    apiBaseUrl: undefined,
    screenshotRegistry: undefined
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
      continue;
    }

    if (arg === "--screenshot-registry") {
      parsed.screenshotRegistry = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--screenshot-registry=")) {
      parsed.screenshotRegistry = arg.slice("--screenshot-registry=".length);
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

function checkCleanCloneDocumentation() {
  const missingDocs = requiredCommandDocs.filter((filePath) => !existsSync(resolve(process.cwd(), filePath)));

  if (missingDocs.length > 0) {
    return createCheck(
      "clean-clone-documentation",
      "Clean-clone command docs",
      "blocked",
      `Missing command documentation files: ${missingDocs.join(", ")}.`,
      "Restore README and demo script clean-clone commands before judging."
    );
  }

  const missingCommands = [];

  for (const filePath of requiredCommandDocs) {
    const content = normalizeCommandText(readFileSync(resolve(process.cwd(), filePath), "utf8"));

    for (const command of requiredCleanCloneCommands) {
      if (!content.includes(normalizeCommandText(command))) {
        missingCommands.push(`${filePath}: ${command}`);
      }
    }
  }

  if (missingCommands.length > 0) {
    return createCheck(
      "clean-clone-documentation",
      "Clean-clone command docs",
      "blocked",
      `Missing documented clean-clone commands: ${missingCommands.join("; ")}.`,
      "Keep README and docs/demo-script.md aligned with the Judge Demo Readiness command list."
    );
  }

  return createCheck(
    "clean-clone-documentation",
    "Clean-clone command docs",
    "ready",
    `Clean-clone commands are documented in ${requiredCommandDocs.join(", ")}.`,
    "Update README, demo script, and demo readiness commands together."
  );
}

function checkScreenshotAssets() {
  const demoReadinessPath = resolve(process.cwd(), args.screenshotRegistry ?? "src/data/demoReadiness.ts");

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
  const refs = [...source.matchAll(screenshotRefPattern)].map((match) => normalizeScreenshotRef(match[1])).filter(Boolean);
  const safeSupportedRefs = refs.filter(isSafeSupportedScreenshotRef);
  const uniqueRefs = [...new Set(safeSupportedRefs)];
  const uniqueRefSet = new Set(uniqueRefs);
  const unsafeCount = refs.filter((ref) => !isSafeScreenshotRef(ref)).length;
  const unsupportedCount = refs.filter((ref) => isSafeScreenshotRef(ref) && !screenshotExtensionPattern.test(ref)).length;
  const duplicateCount = safeSupportedRefs.length - uniqueRefs.length;
  const missingRefs = uniqueRefs.filter((ref) => !existsSync(resolve(process.cwd(), ref)));
  const documentRefs = collectDocumentScreenshotRefs();
  const safeSupportedDocumentRefs = documentRefs.filter(isSafeSupportedScreenshotRef);
  const uniqueDocumentRefs = [...new Set(safeSupportedDocumentRefs)];
  const unsafeDocumentRefCount = documentRefs.filter((ref) => !isSafeScreenshotRef(ref)).length;
  const unregisteredDocumentRefs = uniqueDocumentRefs.filter((ref) => !uniqueRefSet.has(ref));
  const missingDocumentRefs = uniqueDocumentRefs.filter((ref) => !existsSync(resolve(process.cwd(), ref)));

  if (uniqueRefs.length === 0) {
    return createCheck(
      "screenshot-assets",
      "Screenshot assets",
      "blocked",
      refs.length === 0
        ? "No demo screenshot references are registered."
        : `${refs.length} screenshot-like references were found, but none passed path and extension checks.`,
      "Capture current judge-visible png, jpg, jpeg, or webp screenshots under docs/assets/screenshots."
    );
  }

  if (
    missingRefs.length > 0 ||
    duplicateCount > 0 ||
    unsafeCount > 0 ||
    unsupportedCount > 0 ||
    unsafeDocumentRefCount > 0 ||
    unregisteredDocumentRefs.length > 0 ||
    missingDocumentRefs.length > 0
  ) {
    return createCheck(
      "screenshot-assets",
      "Screenshot assets",
      "blocked",
      `${uniqueRefs.length} screenshot refs registered; ${uniqueDocumentRefs.length} document screenshot refs; ${missingRefs.length} missing registered files; ${unregisteredDocumentRefs.length} unregistered document refs; ${missingDocumentRefs.length} missing document files; ${duplicateCount} duplicate; ${unsafeCount + unsafeDocumentRefCount} unsafe; ${unsupportedCount} unsupported.`,
      "Fix missing, duplicate, unsafe, or unsupported screenshot references before judging.",
      {
        registeredCount: uniqueRefs.length,
        missingCount: missingRefs.length,
        duplicateCount,
        unsafeCount: unsafeCount + unsafeDocumentRefCount,
        unsupportedCount,
        documentReferencedCount: uniqueDocumentRefs.length,
        unregisteredDocumentRefCount: unregisteredDocumentRefs.length,
        missingDocumentRefCount: missingDocumentRefs.length
      }
    );
  }

  return createCheck(
    "screenshot-assets",
    "Screenshot assets",
    "ready",
    `${uniqueRefs.length} registered demo screenshots exist on disk and cover ${uniqueDocumentRefs.length} judge document screenshot references.`,
    "Refresh screenshots after visible UI changes.",
    {
      registeredCount: uniqueRefs.length,
      missingCount: 0,
      duplicateCount: 0,
      unsafeCount: 0,
      unsupportedCount: 0,
      documentReferencedCount: uniqueDocumentRefs.length,
      unregisteredDocumentRefCount: 0,
      missingDocumentRefCount: 0
    }
  );
}

function collectDocumentScreenshotRefs() {
  const refs = [];

  for (const filePath of screenshotDocumentationPaths) {
    const fullPath = resolve(process.cwd(), filePath);
    if (!existsSync(fullPath)) {
      continue;
    }

    const markdown = readFileSync(fullPath, "utf8");
    for (const match of markdown.matchAll(markdownScreenshotRefPattern)) {
      const ref = normalizeScreenshotRef(match[1]);
      if (ref) {
        refs.push(ref);
      }
    }
  }

  return refs;
}

function normalizeScreenshotRef(value) {
  const normalized = String(value).replace(/\\/g, "/").replace(/^\.\//, "").trim();

  return normalized.startsWith("assets/screenshots/") ? `docs/${normalized}` : normalized;
}

function isSafeScreenshotRef(ref) {
  return ref.startsWith(screenshotPathPrefix) && !ref.includes("..") && !ref.includes("\0");
}

function isSafeSupportedScreenshotRef(ref) {
  return isSafeScreenshotRef(ref) && screenshotExtensionPattern.test(ref);
}

function normalizeCommandText(value) {
  return String(value).replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

async function checkApiHealth({ apiBaseUrl, skipApi }) {
  if (skipApi) {
    return createCheck(
      "phase-2-api-health",
      "Phase 2 API health",
      "ready",
      "API preflight skipped by --skip-api for offline clean-clone file checks.",
      "Run with DEMO_API_BASE_URL=http://127.0.0.1:8787 when the local API is available, or use the same alternate port passed to PORT if 8787 is occupied."
    );
  }

  if (!apiBaseUrl) {
    return createCheck(
      "phase-2-api-health",
      "Phase 2 API health",
      "not-checked",
      "No DEMO_API_BASE_URL was provided, so /api/health was not checked.",
      "Start the API and rerun with DEMO_API_BASE_URL=http://127.0.0.1:8787 npm run demo:smoke. If 8787 is occupied, start the API with PORT=<free-port> and use that same port in DEMO_API_BASE_URL."
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
        apiPortRecoveryAction
      );
    }

    if (!isValidHealthPayload(payload)) {
      return createCheck(
        "phase-2-api-health",
        "Phase 2 API health",
        "blocked",
        "API health response is missing required demo readiness metadata.",
        "Confirm DEMO_API_BASE_URL points at the LexProof Phase 2 API, rebuild with npm run build:server, and verify the chosen port exposes /api/health."
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
        "Start the current Phase 2 API build, confirm route modules are registered on the same port used by DEMO_API_BASE_URL, and rerun the smoke check.",
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
      apiPortRecoveryAction
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
        detail: spec.readyDetail,
        artifactHash: spec.extractArtifactHash?.(payload)
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

function isDemoHumanReviewQueuePayload(payload) {
  if (!isRecord(payload) || payload.queueVersion !== "lexproof-server-human-review-queue-v1") {
    return false;
  }

  const recoveryPacket = payload.recoveryPacket;
  const summary = isRecord(recoveryPacket) ? recoveryPacket.summary : undefined;

  return (
    isRecord(recoveryPacket) &&
    recoveryPacket.packetVersion === "lexproof-server-human-review-recovery-packet-v1" &&
    typeof recoveryPacket.generatedAt === "string" &&
    isSha256(recoveryPacket.packetHash) &&
    (recoveryPacket.status === "ready" || recoveryPacket.status === "needs-recovery") &&
    Array.isArray(recoveryPacket.items) &&
    Array.isArray(recoveryPacket.nextActions) &&
    recoveryPacket.nextActions.length > 0 &&
    recoveryPacket.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    isRecord(summary) &&
    typeof summary.totalRecoveryCount === "number" &&
    typeof summary.nextAction === "string" &&
    summary.nextAction.trim().length > 0 &&
    summary.notLegalAdviceBoundary === "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only." &&
    recoveryPacket.notLegalAdviceBoundary === "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
  );
}

function isDemoEvidenceVaultManifestPayload(payload) {
  return (
    isRecord(payload) &&
    payload.manifestVersion === "lexproof-evidence-vault-manifest-v1" &&
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    Number.isInteger(payload.itemCount) &&
    payload.itemCount >= 0 &&
    Array.isArray(payload.items) &&
    payload.items.length === payload.itemCount &&
    isSha256(payload.bundleHash) &&
    payload.notLegalAdviceBoundary === "Not legal advice. Evidence manifests summarize audit preparation metadata only."
  );
}

function isDemoEvidenceVaultLineageDigestPayload(payload) {
  const lineageCounts = isRecord(payload) ? payload.lineageCounts : null;

  return (
    isRecord(payload) &&
    payload.digestVersion === "lexproof-evidence-vault-lineage-digest-v1" &&
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    (payload.readinessStatus === "empty" ||
      payload.readinessStatus === "ready" ||
      payload.readinessStatus === "needs-replacement" ||
      payload.readinessStatus === "needs-manifest") &&
    (payload.manifestHash === null || isSha256(payload.manifestHash)) &&
    Number.isInteger(payload.itemCount) &&
    payload.itemCount >= 0 &&
    isRecord(payload.statusCounts) &&
    isRecord(lineageCounts) &&
    Number.isInteger(lineageCounts.activeRecords) &&
    lineageCounts.activeRecords >= 0 &&
    Number.isInteger(lineageCounts.openRejectedRecords) &&
    lineageCounts.openRejectedRecords >= 0 &&
    Array.isArray(payload.lineageLinks) &&
    Array.isArray(payload.activeEvidenceIds) &&
    Array.isArray(payload.openRejectedEvidenceIds) &&
    Array.isArray(payload.linkedControlIds) &&
    Array.isArray(payload.linkedRiskFlagIds) &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    isSha256(payload.digestHash) &&
    payload.notLegalAdviceBoundary === "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only."
  );
}

function isDemoServerSourceReviewPacketPayload(payload) {
  const statusCounts = isRecord(payload) ? payload.statusCounts : null;
  const reviewStatusCounts = isRecord(payload) ? payload.reviewStatusCounts : null;
  const priorityCounts = isRecord(payload) ? payload.priorityCounts : null;

  return (
    isRecord(payload) &&
    payload.packetVersion === "lexproof-server-source-review-packet-v1" &&
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    (payload.status === "empty" || payload.status === "ready" || payload.status === "needs-review" || payload.status === "metadata-needed") &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    Array.isArray(payload.ledgerHashes) &&
    payload.ledgerHashes.every((hash) => typeof hash === "string" && isSha256(hash)) &&
    isRecord(statusCounts) &&
    isNonNegativeInteger(statusCounts.current) &&
    isNonNegativeInteger(statusCounts.pendingReview) &&
    isNonNegativeInteger(statusCounts.metadataNeeded) &&
    isRecord(reviewStatusCounts) &&
    isNonNegativeInteger(reviewStatusCounts.current) &&
    isNonNegativeInteger(reviewStatusCounts.reviewDue) &&
    isNonNegativeInteger(reviewStatusCounts.metadataMissing) &&
    isRecord(priorityCounts) &&
    isNonNegativeInteger(priorityCounts.P0) &&
    isNonNegativeInteger(priorityCounts.P1) &&
    isNonNegativeInteger(priorityCounts.P2) &&
    payload.matchingBehaviorChanged === false &&
    Array.isArray(payload.records) &&
    payload.records.length === payload.recordCount &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    isSha256(payload.packetHash) &&
    payload.notLegalAdviceBoundary === "Not legal advice. Server Source Review packets are audit preparation lineage metadata only."
  );
}

function isDemoServerSourceApprovalPacketPayload(payload) {
  const statusCounts = isRecord(payload) ? payload.statusCounts : null;
  const approvalStatusCounts = isRecord(payload) ? payload.approvalStatusCounts : null;
  const reviewStatusCounts = isRecord(payload) ? payload.reviewStatusCounts : null;
  const priorityCounts = isRecord(payload) ? payload.priorityCounts : null;

  return (
    isRecord(payload) &&
    payload.packetVersion === "lexproof-server-source-approval-packet-v1" &&
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    (payload.status === "empty" ||
      payload.status === "ready" ||
      payload.status === "needs-approval" ||
      payload.status === "metadata-needed") &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    Array.isArray(payload.queueHashes) &&
    payload.queueHashes.every((hash) => typeof hash === "string" && isSha256(hash)) &&
    isRecord(statusCounts) &&
    isNonNegativeInteger(statusCounts.pendingReview) &&
    isRecord(approvalStatusCounts) &&
    isNonNegativeInteger(approvalStatusCounts.approvalRequired) &&
    isNonNegativeInteger(approvalStatusCounts.metadataRequired) &&
    isRecord(reviewStatusCounts) &&
    isNonNegativeInteger(reviewStatusCounts.current) &&
    isNonNegativeInteger(reviewStatusCounts.reviewDue) &&
    isNonNegativeInteger(reviewStatusCounts.metadataMissing) &&
    isRecord(priorityCounts) &&
    isNonNegativeInteger(priorityCounts.P0) &&
    isNonNegativeInteger(priorityCounts.P1) &&
    payload.matchingBehaviorChanged === false &&
    Array.isArray(payload.records) &&
    payload.records.length === payload.recordCount &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    isSha256(payload.packetHash) &&
    payload.notLegalAdviceBoundary === "Not legal advice. Server Source Approval packets are audit preparation workflow metadata only."
  );
}

function isDemoModelGatewayRunRecoveryPayload(payload) {
  return (
    isRecord(payload) &&
    payload.packetVersion === "lexproof-model-gateway-run-recovery-packet-v1" &&
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    isSha256(payload.packetHash) &&
    Number.isInteger(payload.runCount) &&
    payload.runCount >= 0 &&
    Number.isInteger(payload.recoveryItemCount) &&
    payload.recoveryItemCount >= 0 &&
    Number.isInteger(payload.blockedCount) &&
    payload.blockedCount >= 0 &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    Array.isArray(payload.items) &&
    payload.items.length === payload.runCount &&
    payload.notLegalAdviceBoundary === "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
  );
}

function isDemoModelGatewayProviderPolicyPayload(payload) {
  if (!isRecord(payload) || payload.reportVersion !== "lexproof-model-gateway-provider-policy-v1") {
    return false;
  }

  const adapters = Array.isArray(payload.adapters) ? payload.adapters : null;
  const controls = Array.isArray(payload.controls) ? payload.controls : null;
  if (!adapters || !controls) {
    return false;
  }

  const enabledProviderCount = adapters.filter((adapter) => isRecord(adapter) && adapter.enabled === true).length;
  const deferredProviderCount = adapters.filter((adapter) => isRecord(adapter) && adapter.enabled === false).length;
  const hasMockOnlyEnabledAdapter = adapters.some(
    (adapter) => isRecord(adapter) && adapter.provider === "mock" && adapter.mode === "local-mock" && adapter.enabled === true
  );
  const externalAdaptersDisabled = adapters.every(
    (adapter) => isRecord(adapter) && (adapter.mode === "local-mock" || adapter.enabled === false)
  );

  return (
    typeof payload.generatedAt === "string" &&
    isModelGatewayProviderPolicyStatus(payload.overallStatus) &&
    payload.enabledProviderCount === enabledProviderCount &&
    payload.deferredProviderCount === deferredProviderCount &&
    hasMockOnlyEnabledAdapter &&
    externalAdaptersDisabled &&
    adapters.every(isDemoModelGatewayProviderPolicyAdapter) &&
    controls.length > 0 &&
    controls.every(isDemoModelGatewayProviderPolicyControl) &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    payload.notLegalAdviceBoundary === "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
  );
}

function isDemoModelGatewayProviderPolicyAdapter(adapter) {
  return (
    isRecord(adapter) &&
    typeof adapter.provider === "string" &&
    typeof adapter.label === "string" &&
    typeof adapter.enabled === "boolean" &&
    typeof adapter.mode === "string" &&
    typeof adapter.credentialPolicy === "string" &&
    isModelGatewayProviderPolicyStatus(adapter.status) &&
    typeof adapter.readinessEvidence === "string" &&
    Array.isArray(adapter.requiredControls) &&
    adapter.requiredControls.length > 0 &&
    adapter.requiredControls.every((controlId) => typeof controlId === "string" && controlId.trim().length > 0) &&
    (adapter.disabledReason === undefined || typeof adapter.disabledReason === "string")
  );
}

function isDemoModelGatewayProviderPolicyControl(control) {
  return (
    isRecord(control) &&
    typeof control.id === "string" &&
    typeof control.label === "string" &&
    isModelGatewayProviderPolicyStatus(control.status) &&
    typeof control.evidence === "string" &&
    typeof control.recoveryAction === "string" &&
    control.recoveryAction.trim().length > 0
  );
}

function isModelGatewayProviderPolicyStatus(value) {
  return value === "ready" || value === "needs-policy" || value === "blocked" || value === "disabled";
}

function isDemoCounselPackExportRecoveryPayload(payload) {
  return (
    isRecord(payload) &&
    payload.packetVersion === "lexproof-counsel-pack-export-recovery-packet-v1" &&
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    isSha256(payload.packetHash) &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    Number.isInteger(payload.recoveryItemCount) &&
    payload.recoveryItemCount >= 0 &&
    Number.isInteger(payload.blockedCount) &&
    payload.blockedCount >= 0 &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    Array.isArray(payload.items) &&
    payload.items.length === payload.recordCount &&
    payload.notLegalAdviceBoundary === "Not legal advice. Counsel Pack export recovery packets are audit preparation metadata only."
  );
}

function isDemoAuditLogExportPayload(payload) {
  return (
    isRecord(payload) &&
    payload.exportVersion === "lexproof-audit-log-export-v1" &&
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.exportedAt === "string" &&
    isSha256(payload.exportHash) &&
    isSha256(payload.integrityChainHash) &&
    isAuditLogExportIntegrityStatus(payload.integrityStatus) &&
    typeof payload.integritySummary === "string" &&
    Number.isInteger(payload.eventCount) &&
    payload.eventCount >= 0 &&
    Array.isArray(payload.events) &&
    payload.events.length === payload.eventCount &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    isAuditLogExportBoundaryStatus(payload.dataBoundaryStatus) &&
    typeof payload.exportAllowed === "boolean" &&
    payload.notLegalAdviceBoundary === "Not legal advice. Audit Log exports are review workspace metadata only."
  );
}

function isDemoIntegrationPolicyReceiptBundlePayload(payload) {
  return (
    isRecord(payload) &&
    payload.bundleVersion === "lexproof-integration-policy-evaluation-receipt-bundle-v1" &&
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    isSha256(payload.bundleHash) &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    Number.isInteger(payload.policyCount) &&
    payload.policyCount >= 0 &&
    Array.isArray(payload.missingPolicyIds) &&
    Number.isInteger(payload.readyCount) &&
    payload.readyCount >= 0 &&
    Number.isInteger(payload.needsPolicyCount) &&
    payload.needsPolicyCount >= 0 &&
    Number.isInteger(payload.blockedCount) &&
    payload.blockedCount >= 0 &&
    payload.externalEnablementAllowed === false &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    Array.isArray(payload.records) &&
    payload.records.length === payload.recordCount &&
    payload.notLegalAdviceBoundary === "Not legal advice. Integration policy receipt bundles are audit preparation metadata only."
  );
}

function isAuditLogExportIntegrityStatus(value) {
  return value === "verified" || value === "needs-review" || value === "blocked" || value === "empty";
}

function isAuditLogExportBoundaryStatus(value) {
  return value === "clean" || value === "needs-review" || value === "blocked";
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value.trim());
}

function preserveSha256(value) {
  return isSha256(value) ? value.trim().toLowerCase() : undefined;
}
