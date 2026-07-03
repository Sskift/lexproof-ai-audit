import { redactClassifiedText } from "./dataClassification";
import type { DemoScenarioValidationResult } from "./demoScenarioLibrary";

export type DemoReadinessStatus = "ready" | "needs-api" | "blocked";
export type DemoReadinessCheckStatus = "ready" | "not-checked" | "failed" | "blocked";

export type DemoApiPreflight =
  | {
      status: "not-checked";
    }
  | {
      status: "ready";
      service: string;
      version: string;
      capabilities: string[];
      routeChecks: DemoApiRouteCheck[];
      checkedAt: string;
      notLegalAdviceBoundary: string;
    }
  | {
      status: "failed";
      error: string;
      recoveryAction: string;
      checkedAt: string;
      notLegalAdviceBoundary: string;
    };

export type DemoApiRouteCheck = {
  id:
    | "model-gateway-adapters"
    | "model-gateway-provider-policy"
    | "evidence-vault-manifest"
    | "human-review-queue"
    | "counsel-pack-exports"
    | "audit-log"
    | "integration-policy-evaluations";
  label: string;
  status: "ready" | "failed";
  url: string;
  detail: string;
};

export type DemoReadinessCheck = {
  id: "scenario-library" | "clean-clone-commands" | "private-credentials" | "screenshot-set" | "phase-2-api-preflight";
  label: string;
  status: DemoReadinessCheckStatus;
  detail: string;
  recoveryAction: string;
};

export type DemoScreenshotFindingReason = "unsafe-path" | "unsupported-extension" | "duplicate" | "missing";

export type DemoScreenshotFinding = {
  ref: string;
  reason: DemoScreenshotFindingReason;
  message: string;
};

export type DemoScreenshotInventory = {
  inventoryVersion: "lexproof-demo-screenshot-inventory-v1";
  registeredCount: number;
  usableCount: number;
  blockedCount: number;
  missingCount: number;
  duplicateCount: number;
  unsafeCount: number;
  unsupportedCount: number;
  usableRefs: string[];
  findings: DemoScreenshotFinding[];
  notLegalAdviceBoundary: "Not legal advice. Demo screenshot inventory is audit preparation readiness metadata only.";
};

export type DemoReadinessReport = {
  reportVersion: "lexproof-demo-readiness-v1";
  status: DemoReadinessStatus;
  checks: DemoReadinessCheck[];
  cleanCloneCommands: string[];
  screenshotRefs: string[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Demo readiness checks are audit preparation readiness metadata only.";
};

export type DemoSmokeChecklistStep = {
  id:
    | "install-dependencies"
    | "run-verify"
    | "build-server"
    | "start-api"
    | "run-demo-smoke"
    | "start-frontend"
    | "phase-2-api-preflight"
    | "screenshot-set";
  label: string;
  command?: string;
  status: DemoReadinessCheckStatus;
  detail: string;
  recoveryAction: string;
};

export type DemoSmokeChecklist = {
  checklistVersion: "lexproof-demo-smoke-checklist-v1";
  status: DemoReadinessStatus;
  commandCount: number;
  steps: DemoSmokeChecklistStep[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only.";
};

export type DemoReadinessInput = {
  scenarioValidation: DemoScenarioValidationResult;
  scenarioCount: number;
  screenshotRefs: string[];
  availableScreenshotRefs?: string[];
  apiPreflight: DemoApiPreflight;
};

export type DemoApiPreflightInput = {
  apiBaseUrl?: string;
  checkedAt?: string;
  fetcher?: typeof fetch;
};

type HealthResponseShape = {
  status: "ok";
  service: "lexproof-secure-review-workspace-api";
  version: string;
  capabilities: Record<string, string>;
  notLegalAdviceBoundary: string;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Demo readiness checks are audit preparation readiness metadata only." as const;
const SCREENSHOT_INVENTORY_BOUNDARY = "Not legal advice. Demo screenshot inventory is audit preparation readiness metadata only." as const;
const SMOKE_CHECKLIST_BOUNDARY = "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only." as const;
const API_PREFLIGHT_RECOVERY = "Start the Phase 2 API, confirm /api/health is reachable, and retry the demo preflight.";
const SCREENSHOT_RECOVERY = "Fix missing, duplicate, or unsafe screenshot references under docs/assets/screenshots before judging.";
const capabilityOrder = ["modelGateway", "evidenceVault", "humanReview", "exports", "auditLog"];
const demoPreflightWorkspaceId = "demo-smoke-preflight";
const apiRoutePreflightSpecs: Array<{
  id: DemoApiRouteCheck["id"];
  label: string;
  path: string;
  validate: (payload: unknown) => boolean;
  readyDetail: string;
}> = [
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
    validate: (payload) => isRecord(payload) && payload.reportVersion === "lexproof-model-gateway-provider-policy-v1",
    readyDetail: "Model Gateway provider policy report is reachable."
  },
  {
    id: "evidence-vault-manifest",
    label: "Evidence Vault manifest",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/evidence-manifest`,
    validate: (payload) => isRecord(payload) && payload.manifestVersion === "lexproof-evidence-vault-manifest-v1",
    readyDetail: "Evidence Vault manifest route is reachable for an empty demo workspace."
  },
  {
    id: "human-review-queue",
    label: "Human Review queue",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/reviews/queue`,
    validate: (payload) => isRecord(payload) && payload.queueVersion === "lexproof-server-human-review-queue-v1",
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
const screenshotPathPrefix = "docs/assets/screenshots/";
const screenshotExtensionPattern = /\.(png|jpe?g|webp)$/i;

export const demoReadinessCommands = [
  "npm install",
  "npm run verify",
  "npm run build:server",
  "DATABASE_URL=file:./demo-review-workspace.db npm run start:api",
  "DEMO_API_BASE_URL=http://127.0.0.1:8787 npm run demo:smoke",
  "npm run dev"
];

export function createDemoReadinessReport(input: DemoReadinessInput): DemoReadinessReport {
  const screenshotInventory = createDemoScreenshotInventory(input.screenshotRefs, input.availableScreenshotRefs);
  const checks: DemoReadinessCheck[] = [
    createScenarioCheck(input.scenarioValidation, input.scenarioCount),
    {
      id: "clean-clone-commands",
      label: "Clean clone commands",
      status: "ready",
      detail: demoReadinessCommands.join(" -> "),
      recoveryAction: "Run the commands in order from a clean clone before judging."
    },
    {
      id: "private-credentials",
      label: "Private credentials not required",
      status: "ready",
      detail: "The judge path uses synthetic profiles, mock model review, metadata-only evidence, and simulated anchors.",
      recoveryAction: "Keep real API keys, private keys, raw KYC, and personal data out of the demo."
    },
    createScreenshotCheck(screenshotInventory),
    createApiPreflightCheck(input.apiPreflight)
  ];
  const status = createReadinessStatus(checks);

  return {
    reportVersion: "lexproof-demo-readiness-v1",
    status,
    checks,
    cleanCloneCommands: [...demoReadinessCommands],
    screenshotRefs: screenshotInventory.usableRefs,
    nextActions: createNextActions(checks),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function createDemoSmokeChecklist(report: DemoReadinessReport): DemoSmokeChecklist {
  const apiPreflightCheck = findReadinessCheck(report, "phase-2-api-preflight");
  const screenshotCheck = findReadinessCheck(report, "screenshot-set");
  const steps: DemoSmokeChecklistStep[] = [
    createCommandStep("install-dependencies", "Install dependencies", report.cleanCloneCommands[0], "Install packages from a clean clone."),
    createCommandStep("run-verify", "Run verification", report.cleanCloneCommands[1], "Run the full repository verification gate."),
    createCommandStep("build-server", "Build Phase 2 API", report.cleanCloneCommands[2], "Build the server bundle before starting the API."),
    createCommandStep("start-api", "Start Phase 2 API", report.cleanCloneCommands[3], "Start the local metadata-only API with a disposable SQLite file."),
    createCommandStep(
      "run-demo-smoke",
      "Run demo smoke CLI",
      report.cleanCloneCommands[4],
      "Check repository files, screenshots, and the Phase 2 API health endpoint before opening the workbench."
    ),
    createCommandStep("start-frontend", "Start workbench", report.cleanCloneCommands[5], "Start the local Vite workbench for the judge path."),
    {
      id: "phase-2-api-preflight",
      label: apiPreflightCheck.label,
      status: apiPreflightCheck.status,
      detail: apiPreflightCheck.detail,
      recoveryAction: apiPreflightCheck.recoveryAction
    },
    {
      id: "screenshot-set",
      label: screenshotCheck.label,
      status: screenshotCheck.status,
      detail: screenshotCheck.detail,
      recoveryAction: screenshotCheck.recoveryAction
    }
  ];

  return {
    checklistVersion: "lexproof-demo-smoke-checklist-v1",
    status: createReadinessStatus(steps),
    commandCount: report.cleanCloneCommands.length,
    steps,
    nextActions: createNextActions(steps),
    notLegalAdviceBoundary: SMOKE_CHECKLIST_BOUNDARY
  };
}

export function exportDemoSmokeChecklistJson(checklist: DemoSmokeChecklist): string {
  return `${JSON.stringify(checklist, null, 2)}\n`;
}

export function downloadDemoSmokeChecklistJson(filename: string, checklist: DemoSmokeChecklist): void {
  const blob = new Blob([exportDemoSmokeChecklistJson(checklist)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function createDemoScreenshotInventory(
  screenshotRefs: string[],
  availableScreenshotRefs?: string[]
): DemoScreenshotInventory {
  const availableSet = availableScreenshotRefs ? new Set(availableScreenshotRefs.map(normalizeScreenshotRef).filter(Boolean)) : null;
  const seen = new Set<string>();
  const usableRefs: string[] = [];
  const findings: DemoScreenshotFinding[] = [];

  for (const rawRef of screenshotRefs) {
    const ref = normalizeScreenshotRef(rawRef);
    if (!ref) {
      continue;
    }

    if (!isSafeScreenshotRef(ref)) {
      findings.push(createScreenshotFinding(ref, "unsafe-path", "Screenshot refs must stay under docs/assets/screenshots."));
      continue;
    }

    if (!screenshotExtensionPattern.test(ref)) {
      findings.push(createScreenshotFinding(ref, "unsupported-extension", "Screenshot refs must use png, jpg, jpeg, or webp image files."));
      continue;
    }

    if (seen.has(ref)) {
      findings.push(createScreenshotFinding(ref, "duplicate", "Screenshot refs must be unique in the demo readiness set."));
      continue;
    }

    seen.add(ref);

    if (availableSet && !availableSet.has(ref)) {
      findings.push(createScreenshotFinding(ref, "missing", "Screenshot ref is not present in the available screenshot asset set."));
      continue;
    }

    usableRefs.push(ref);
  }

  return {
    inventoryVersion: "lexproof-demo-screenshot-inventory-v1",
    registeredCount: screenshotRefs.length,
    usableCount: usableRefs.length,
    blockedCount: findings.length,
    missingCount: findings.filter((finding) => finding.reason === "missing").length,
    duplicateCount: findings.filter((finding) => finding.reason === "duplicate").length,
    unsafeCount: findings.filter((finding) => finding.reason === "unsafe-path").length,
    unsupportedCount: findings.filter((finding) => finding.reason === "unsupported-extension").length,
    usableRefs,
    findings,
    notLegalAdviceBoundary: SCREENSHOT_INVENTORY_BOUNDARY
  };
}

export async function checkDemoApiPreflight(input: DemoApiPreflightInput = {}): Promise<DemoApiPreflight> {
  const checkedAt = input.checkedAt ?? new Date().toISOString();

  try {
    const fetcher = resolveFetcher(input.fetcher);
    const response = await fetcher(buildHealthUrl(input.apiBaseUrl), { method: "GET" });
    const payload = await readJson(response);

    if (!response.ok) {
      return createFailedPreflight(readErrorMessage(payload, `Phase 2 API health check failed with ${response.status}.`), checkedAt);
    }

    if (!isValidHealthResponse(payload)) {
      return createFailedPreflight("Phase 2 API health response is missing required readiness metadata.", checkedAt);
    }

    const routeChecks = await checkDemoApiRouteFamilies({
      apiBaseUrl: input.apiBaseUrl,
      fetcher
    });
    const failedRoute = routeChecks.find((check) => check.status === "failed");

    if (failedRoute) {
      return createFailedPreflight(`${failedRoute.label}: ${failedRoute.detail}`, checkedAt);
    }

    return {
      status: "ready",
      service: sanitize(payload.service),
      version: sanitize(payload.version),
      capabilities: capabilityOrder
        .filter((key) => payload.capabilities[key])
        .map((key) => sanitize(`${key}: ${payload.capabilities?.[key]}`)),
      routeChecks,
      checkedAt,
      notLegalAdviceBoundary: sanitize(payload.notLegalAdviceBoundary)
    };
  } catch (error) {
    return createFailedPreflight(error instanceof Error ? error.message : "Phase 2 API health check failed.", checkedAt);
  }
}

async function checkDemoApiRouteFamilies({
  apiBaseUrl,
  fetcher
}: {
  apiBaseUrl: string | undefined;
  fetcher: typeof fetch;
}): Promise<DemoApiRouteCheck[]> {
  const routeChecks: DemoApiRouteCheck[] = [];

  for (const spec of apiRoutePreflightSpecs) {
    const url = buildApiUrl(apiBaseUrl, spec.path);

    try {
      const response = await fetcher(url, { method: "GET" });
      const payload = await readJson(response);

      if (!response.ok) {
        routeChecks.push({
          id: spec.id,
          label: spec.label,
          status: "failed",
          url,
          detail: sanitize(`${spec.label} returned ${response.status}: ${readErrorMessage(payload, "unknown route error")}.`)
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

function createScenarioCheck(validation: DemoScenarioValidationResult, scenarioCount: number): DemoReadinessCheck {
  if (!validation.valid || scenarioCount === 0) {
    return {
      id: "scenario-library",
      label: "Scenario library",
      status: "blocked",
      detail: sanitize(validation.errors.join(" ") || "No seeded demo scenarios are available."),
      recoveryAction: "Fix seeded demo scenarios before judging."
    };
  }

  return {
    id: "scenario-library",
    label: "Scenario library",
    status: "ready",
    detail: `${scenarioCount} synthetic judge paths are available and validated.`,
    recoveryAction: "Keep demo scenarios synthetic and source-linked."
  };
}

function createScreenshotCheck(inventory: DemoScreenshotInventory): DemoReadinessCheck {
  if (inventory.blockedCount > 0) {
    return {
      id: "screenshot-set",
      label: "Screenshot set",
      status: "blocked",
      detail: `${inventory.usableCount} usable screenshot${inventory.usableCount === 1 ? "" : "s"}; ${inventory.blockedCount} blocked screenshot reference${inventory.blockedCount === 1 ? "" : "s"} (${createScreenshotFindingSummary(inventory)}).`,
      recoveryAction: SCREENSHOT_RECOVERY
    };
  }

  if (inventory.usableCount === 0) {
    return {
      id: "screenshot-set",
      label: "Screenshot set",
      status: "blocked",
      detail: "No judge-visible screenshots are registered for the demo runbook.",
      recoveryAction: "Capture current screenshots under docs/assets/screenshots before judging."
    };
  }

  return {
    id: "screenshot-set",
    label: "Screenshot set",
    status: "ready",
    detail: `${inventory.usableCount} current screenshots are registered and passed path checks for the judge path.`,
    recoveryAction: "Refresh screenshots after visible UI changes."
  };
}

function createApiPreflightCheck(apiPreflight: DemoApiPreflight): DemoReadinessCheck {
  if (apiPreflight.status === "ready") {
    const readyRouteCount = apiPreflight.routeChecks.filter((check) => check.status === "ready").length;
    return {
      id: "phase-2-api-preflight",
      label: "Phase 2 API preflight",
      status: "ready",
      detail: `${apiPreflight.service} ${apiPreflight.version} is reachable with ${apiPreflight.capabilities.length} capabilities and ${readyRouteCount}/${apiPreflight.routeChecks.length} safe route checks.`,
      recoveryAction: "Keep the API process running while judges run the secure review path."
    };
  }

  if (apiPreflight.status === "failed") {
    return {
      id: "phase-2-api-preflight",
      label: "Phase 2 API preflight",
      status: "failed",
      detail: apiPreflight.error,
      recoveryAction: apiPreflight.recoveryAction
    };
  }

  return {
    id: "phase-2-api-preflight",
    label: "Phase 2 API preflight",
    status: "not-checked",
    detail: "The browser has not checked /api/health for the Phase 2 API in this session.",
    recoveryAction: "Run the Phase 2 API and click Check Demo API before judging."
  };
}

function createReadinessStatus(checks: Array<{ status: DemoReadinessCheckStatus }>): DemoReadinessStatus {
  if (checks.some((check) => check.status === "blocked")) {
    return "blocked";
  }

  if (checks.some((check) => check.status === "failed" || check.status === "not-checked")) {
    return "needs-api";
  }

  return "ready";
}

function createNextActions(checks: Array<DemoReadinessCheck | DemoSmokeChecklistStep>): string[] {
  const actions = checks
    .filter((check) => check.status !== "ready")
    .map((check) => check.recoveryAction)
    .filter(Boolean)
    .map(sanitize);

  return actions.length > 0 ? unique(actions) : ["Judge demo readiness checks are ready for the clean-clone path."];
}

function createCommandStep(
  id: DemoSmokeChecklistStep["id"],
  label: string,
  command: string | undefined,
  detail: string
): DemoSmokeChecklistStep {
  return {
    id,
    label,
    command: sanitize(command ?? ""),
    status: command ? "ready" : "blocked",
    detail: command ? sanitize(detail) : "Required clean-clone command is missing from Demo Readiness.",
    recoveryAction: command ? "Run this command in order during judge setup." : "Restore the clean-clone command before judging."
  };
}

function findReadinessCheck(report: DemoReadinessReport, id: DemoReadinessCheck["id"]): DemoReadinessCheck {
  return (
    report.checks.find((check) => check.id === id) ?? {
      id,
      label: id,
      status: "blocked",
      detail: "Required demo readiness check is missing.",
      recoveryAction: "Restore the missing demo readiness check before judging."
    }
  );
}

function createFailedPreflight(message: string, checkedAt: string): DemoApiPreflight {
  return {
    status: "failed",
    error: sanitize(message),
    recoveryAction: API_PREFLIGHT_RECOVERY,
    checkedAt,
    notLegalAdviceBoundary: "Not legal advice. Demo API preflight checks audit preparation workflow readiness only."
  };
}

function isValidHealthResponse(payload: unknown): payload is HealthResponseShape {
  if (!isRecord(payload)) {
    return false;
  }

  const capabilities = payload.capabilities;

  return (
    payload.status === "ok" &&
    payload.service === "lexproof-secure-review-workspace-api" &&
    typeof payload.version === "string" &&
    isStringRecord(capabilities) &&
    typeof payload.notLegalAdviceBoundary === "string" &&
    payload.notLegalAdviceBoundary.includes("Not legal advice")
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  const errors = payload.errors;

  if (Array.isArray(errors)) {
    return errors.filter((item): item is string => typeof item === "string").join(" ") || fallback;
  }

  return stringValue(payload.error) || stringValue(payload.message) || fallback;
}

function buildHealthUrl(apiBaseUrl: string | undefined): string {
  return buildApiUrl(apiBaseUrl, "/api/health");
}

function buildApiUrl(apiBaseUrl: string | undefined, path: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeScreenshotRef(value: string): string {
  return sanitize(value).replace(/\\/g, "/").replace(/^\/+/, "");
}

function isSafeScreenshotRef(value: string): boolean {
  return (
    value.startsWith(screenshotPathPrefix) &&
    !value.includes("..") &&
    !/^[a-z][a-z0-9+.-]*:/i.test(value) &&
    !value.includes("\0")
  );
}

function createScreenshotFinding(
  ref: string,
  reason: DemoScreenshotFindingReason,
  message: string
): DemoScreenshotFinding {
  return {
    ref: sanitize(ref),
    reason,
    message
  };
}

function createScreenshotFindingSummary(inventory: DemoScreenshotInventory): string {
  const parts = [
    inventory.missingCount > 0 ? `${inventory.missingCount} missing` : "",
    inventory.duplicateCount > 0 ? `${inventory.duplicateCount} duplicate` : "",
    inventory.unsafeCount > 0 ? `${inventory.unsafeCount} unsafe` : "",
    inventory.unsupportedCount > 0 ? `${inventory.unsupportedCount} unsupported` : ""
  ].filter(Boolean);

  return parts.join(", ") || "no usable screenshot references";
}

function resolveFetcher(fetcher: typeof fetch | undefined): typeof fetch {
  const resolved = fetcher ?? globalThis.fetch?.bind(globalThis);

  if (!resolved) {
    throw new Error("Fetch API is unavailable for Demo API preflight.");
  }

  return resolved as typeof fetch;
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
