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
const API_PREFLIGHT_RECOVERY = "Start the Phase 2 API, confirm /api/health is reachable, and retry the demo preflight.";
const SCREENSHOT_RECOVERY = "Fix missing, duplicate, or unsafe screenshot references under docs/assets/screenshots before judging.";
const capabilityOrder = ["modelGateway", "evidenceVault", "humanReview", "exports", "auditLog"];
const screenshotPathPrefix = "docs/assets/screenshots/";
const screenshotExtensionPattern = /\.(png|jpe?g|webp)$/i;

export const demoReadinessCommands = [
  "npm install",
  "npm run verify",
  "npm run build:server",
  "DATABASE_URL=file:./demo-review-workspace.db npm run start:api",
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

    return {
      status: "ready",
      service: sanitize(payload.service),
      version: sanitize(payload.version),
      capabilities: capabilityOrder
        .filter((key) => payload.capabilities[key])
        .map((key) => sanitize(`${key}: ${payload.capabilities?.[key]}`)),
      checkedAt,
      notLegalAdviceBoundary: sanitize(payload.notLegalAdviceBoundary)
    };
  } catch (error) {
    return createFailedPreflight(error instanceof Error ? error.message : "Phase 2 API health check failed.", checkedAt);
  }
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
    return {
      id: "phase-2-api-preflight",
      label: "Phase 2 API preflight",
      status: "ready",
      detail: `${apiPreflight.service} ${apiPreflight.version} is reachable with ${apiPreflight.capabilities.length} capabilities.`,
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

function createReadinessStatus(checks: DemoReadinessCheck[]): DemoReadinessStatus {
  if (checks.some((check) => check.status === "blocked")) {
    return "blocked";
  }

  if (checks.some((check) => check.status === "failed" || check.status === "not-checked")) {
    return "needs-api";
  }

  return "ready";
}

function createNextActions(checks: DemoReadinessCheck[]): string[] {
  const actions = checks
    .filter((check) => check.status !== "ready")
    .map((check) => check.recoveryAction)
    .filter(Boolean)
    .map(sanitize);

  return actions.length > 0 ? unique(actions) : ["Judge demo readiness checks are ready for the clean-clone path."];
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
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";

  return `${base}/api/health`;
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
