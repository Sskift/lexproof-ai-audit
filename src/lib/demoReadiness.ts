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
      apiPreflightReportHash?: string;
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
    | "api-preflight-report"
    | "model-gateway-adapters"
    | "model-gateway-provider-policy"
    | "model-gateway-run-ledger"
    | "model-gateway-run-recovery"
    | "evidence-vault-manifest"
    | "evidence-vault-lineage-digest"
    | "evidence-vault-lineage-recovery"
    | "human-review-queue"
    | "human-review-recovery"
    | "source-review-ledger"
    | "source-review-packet"
    | "source-approval-queue"
    | "source-approval-packet"
    | "counsel-pack-exports"
    | "counsel-pack-export-recovery"
    | "audit-log"
    | "audit-log-export"
    | "integration-policy-evaluations"
    | "integration-policy-receipt-bundle"
    | "integration-policy-receipt-recovery";
  label: string;
  status: "ready" | "failed";
  url: string;
  detail: string;
  artifactHash?: string;
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

export type DemoSmokeChecklistSummary = {
  checklistHash: string;
  status: DemoReadinessStatus;
  commandCount: number;
  stepCount: number;
  apiPreflightStatus: DemoReadinessCheckStatus;
  screenshotStatus: DemoReadinessCheckStatus;
  notLegalAdviceBoundary: DemoSmokeChecklist["notLegalAdviceBoundary"];
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
  extractArtifactHash?: (payload: unknown) => string | undefined;
  readyDetail: string;
}> = [
  {
    id: "api-preflight-report",
    label: "API Preflight report",
    path: "/api/preflight",
    validate: (payload) =>
      isRecord(payload) &&
      payload.reportVersion === "lexproof-api-preflight-v1" &&
      payload.status === "ready" &&
      payload.externalSideEffectsAllowed === false &&
      typeof payload.reportHash === "string" &&
      preserveSha256(payload.reportHash) !== undefined,
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
    id: "model-gateway-run-ledger",
    label: "Server Model Run Ledger",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/model-runs`,
    validate: Array.isArray,
    readyDetail: "Server Model Run Ledger route is reachable for persisted metadata checks."
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
    id: "evidence-vault-lineage-recovery",
    label: "Evidence Vault lineage recovery",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/evidence-lineage-recovery`,
    validate: isDemoEvidenceVaultLineageRecoveryPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.packetHash) : undefined),
    readyDetail: "Evidence Vault lineage recovery route is reachable with packet hash metadata for an empty demo workspace."
  },
  {
    id: "human-review-queue",
    label: "Human Review queue",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/reviews/queue`,
    validate: isDemoHumanReviewQueuePayload,
    readyDetail: "Human Review queue route is reachable with server recovery packet metadata for an empty demo workspace."
  },
  {
    id: "human-review-recovery",
    label: "Human Review recovery",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/reviews/recovery`,
    validate: isDemoHumanReviewRecoveryPacketPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.packetHash) : undefined),
    readyDetail: "Human Review recovery route is reachable with packet hash metadata for an empty demo workspace."
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
  },
  {
    id: "integration-policy-receipt-recovery",
    label: "Integration Policy receipt recovery",
    path: `/api/workspaces/${demoPreflightWorkspaceId}/integration-policy-evaluations/recovery`,
    validate: isDemoIntegrationPolicyReceiptRecoveryPayload,
    extractArtifactHash: (payload) => (isRecord(payload) ? preserveSha256(payload.packetHash) : undefined),
    readyDetail: "Integration Policy receipt recovery route is reachable with packet hash metadata for an empty demo workspace."
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

export async function createDemoSmokeChecklistSummary(checklist: DemoSmokeChecklist): Promise<DemoSmokeChecklistSummary> {
  const hashPayload = {
    checklistVersion: checklist.checklistVersion,
    status: checklist.status,
    commandCount: checklist.commandCount,
    steps: checklist.steps.map((step) => ({
      id: step.id,
      label: step.label,
      command: step.command,
      status: step.status,
      detail: step.detail,
      recoveryAction: step.recoveryAction
    })),
    nextActions: checklist.nextActions,
    notLegalAdviceBoundary: checklist.notLegalAdviceBoundary
  };
  const apiPreflightStatus = checklist.steps.find((step) => step.id === "phase-2-api-preflight")?.status ?? "not-checked";
  const screenshotStatus = checklist.steps.find((step) => step.id === "screenshot-set")?.status ?? "not-checked";

  return {
    checklistHash: await sha256Hex(stableStringify(hashPayload)),
    status: checklist.status,
    commandCount: checklist.commandCount,
    stepCount: checklist.steps.length,
    apiPreflightStatus,
    screenshotStatus,
    notLegalAdviceBoundary: checklist.notLegalAdviceBoundary
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
    const apiPreflightReportHash = routeChecks.find((check) => check.id === "api-preflight-report")?.artifactHash;

    return {
      status: "ready",
      service: sanitize(payload.service),
      version: sanitize(payload.version),
      capabilities: capabilityOrder
        .filter((key) => payload.capabilities[key])
        .map((key) => sanitize(`${key}: ${payload.capabilities?.[key]}`)),
      apiPreflightReportHash,
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
      detail: `${apiPreflight.service} ${apiPreflight.version} is reachable with ${apiPreflight.capabilities.length} capabilities, ${readyRouteCount}/${apiPreflight.routeChecks.length} safe route checks, and API preflight report hash ${
        apiPreflight.apiPreflightReportHash ? `${apiPreflight.apiPreflightReportHash.slice(0, 12)}...` : "pending"
      }.`,
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

function preserveSha256(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : undefined;
}

function isDemoEvidenceVaultManifestPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.manifestVersion !== "lexproof-evidence-vault-manifest-v1") {
    return false;
  }

  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    typeof payload.itemCount === "number" &&
    Number.isInteger(payload.itemCount) &&
    payload.itemCount >= 0 &&
    Array.isArray(payload.items) &&
    payload.items.length === payload.itemCount &&
    preserveSha256(payload.bundleHash) !== undefined &&
    payload.notLegalAdviceBoundary === "Not legal advice. Evidence manifests summarize audit preparation metadata only."
  );
}

function isDemoHumanReviewQueuePayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.queueVersion !== "lexproof-server-human-review-queue-v1") {
    return false;
  }

  return payload.workspaceId === demoPreflightWorkspaceId && isDemoHumanReviewRecoveryPacketPayload(payload.recoveryPacket);
}

function isDemoHumanReviewRecoveryPacketPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.packetVersion !== "lexproof-server-human-review-recovery-packet-v1") {
    return false;
  }

  const summary = payload.summary;
  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    preserveSha256(payload.packetHash) !== undefined &&
    (payload.status === "ready" || payload.status === "needs-recovery") &&
    Array.isArray(payload.items) &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    isRecord(summary) &&
    typeof summary.totalRecoveryCount === "number" &&
    typeof summary.returnedCount === "number" &&
    typeof summary.rejectedCount === "number" &&
    typeof summary.nextAction === "string" &&
    summary.nextAction.trim().length > 0 &&
    summary.notLegalAdviceBoundary === "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only." &&
    payload.notLegalAdviceBoundary === "Not legal advice. Server Human Review recovery packets are audit preparation workflow metadata only."
  );
}

function isDemoModelGatewayRunRecoveryPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.packetVersion !== "lexproof-model-gateway-run-recovery-packet-v1") {
    return false;
  }

  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    preserveSha256(payload.packetHash) !== undefined &&
    typeof payload.runCount === "number" &&
    Number.isInteger(payload.runCount) &&
    payload.runCount >= 0 &&
    typeof payload.recoveryItemCount === "number" &&
    Number.isInteger(payload.recoveryItemCount) &&
    payload.recoveryItemCount >= 0 &&
    typeof payload.blockedCount === "number" &&
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

function isDemoModelGatewayProviderPolicyPayload(payload: unknown): boolean {
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

function isDemoModelGatewayProviderPolicyAdapter(adapter: unknown): boolean {
  if (!isRecord(adapter)) {
    return false;
  }

  return (
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

function isDemoModelGatewayProviderPolicyControl(control: unknown): boolean {
  if (!isRecord(control)) {
    return false;
  }

  return (
    typeof control.id === "string" &&
    typeof control.label === "string" &&
    isModelGatewayProviderPolicyStatus(control.status) &&
    typeof control.evidence === "string" &&
    typeof control.recoveryAction === "string" &&
    control.recoveryAction.trim().length > 0
  );
}

function isModelGatewayProviderPolicyStatus(value: unknown): boolean {
  return value === "ready" || value === "needs-policy" || value === "blocked" || value === "disabled";
}

function isDemoEvidenceVaultLineageDigestPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.digestVersion !== "lexproof-evidence-vault-lineage-digest-v1") {
    return false;
  }

  const lineageCounts = payload.lineageCounts;
  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    (payload.readinessStatus === "empty" ||
      payload.readinessStatus === "ready" ||
      payload.readinessStatus === "needs-replacement" ||
      payload.readinessStatus === "needs-manifest") &&
    (payload.manifestHash === null || preserveSha256(payload.manifestHash) !== undefined) &&
    typeof payload.itemCount === "number" &&
    Number.isInteger(payload.itemCount) &&
    payload.itemCount >= 0 &&
    isRecord(payload.statusCounts) &&
    isRecord(lineageCounts) &&
    typeof lineageCounts.activeRecords === "number" &&
    Number.isInteger(lineageCounts.activeRecords) &&
    lineageCounts.activeRecords >= 0 &&
    typeof lineageCounts.openRejectedRecords === "number" &&
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
    preserveSha256(payload.digestHash) !== undefined &&
    payload.notLegalAdviceBoundary === "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only."
  );
}

function isDemoEvidenceVaultLineageRecoveryPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.packetVersion !== "lexproof-evidence-vault-lineage-recovery-packet-v1") {
    return false;
  }

  const summary = payload.summary;
  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    isEvidenceLineageRecoveryStatus(payload.status) &&
    preserveSha256(payload.lineageDigestHash) !== undefined &&
    (payload.manifestHash === null || preserveSha256(payload.manifestHash) !== undefined) &&
    isRecord(summary) &&
    typeof summary.totalRecoveryCount === "number" &&
    Number.isInteger(summary.totalRecoveryCount) &&
    summary.totalRecoveryCount >= 0 &&
    typeof summary.openRejectedCount === "number" &&
    Number.isInteger(summary.openRejectedCount) &&
    summary.openRejectedCount >= 0 &&
    typeof summary.missingManifestCount === "number" &&
    Number.isInteger(summary.missingManifestCount) &&
    summary.missingManifestCount >= 0 &&
    typeof summary.activeRecordCount === "number" &&
    Number.isInteger(summary.activeRecordCount) &&
    summary.activeRecordCount >= 0 &&
    typeof summary.lineageLinkCount === "number" &&
    Number.isInteger(summary.lineageLinkCount) &&
    summary.lineageLinkCount >= 0 &&
    typeof summary.nextAction === "string" &&
    summary.nextAction.trim().length > 0 &&
    summary.notLegalAdviceBoundary === "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only." &&
    Array.isArray(payload.items) &&
    payload.items.length === summary.totalRecoveryCount &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    preserveSha256(payload.packetHash) !== undefined &&
    payload.notLegalAdviceBoundary === "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only."
  );
}

function isEvidenceLineageRecoveryStatus(value: unknown): boolean {
  return value === "empty" || value === "ready" || value === "needs-replacement" || value === "needs-manifest";
}

function isDemoServerSourceReviewPacketPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.packetVersion !== "lexproof-server-source-review-packet-v1") {
    return false;
  }

  const statusCounts = payload.statusCounts;
  const reviewStatusCounts = payload.reviewStatusCounts;
  const priorityCounts = payload.priorityCounts;
  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    (payload.status === "empty" || payload.status === "ready" || payload.status === "needs-review" || payload.status === "metadata-needed") &&
    typeof payload.recordCount === "number" &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    Array.isArray(payload.ledgerHashes) &&
    payload.ledgerHashes.every((hash) => typeof hash === "string" && preserveSha256(hash) !== undefined) &&
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
    preserveSha256(payload.packetHash) !== undefined &&
    payload.notLegalAdviceBoundary === "Not legal advice. Server Source Review packets are audit preparation lineage metadata only."
  );
}

function isDemoServerSourceApprovalPacketPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.packetVersion !== "lexproof-server-source-approval-packet-v1") {
    return false;
  }

  const statusCounts = payload.statusCounts;
  const approvalStatusCounts = payload.approvalStatusCounts;
  const reviewStatusCounts = payload.reviewStatusCounts;
  const priorityCounts = payload.priorityCounts;
  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    (payload.status === "empty" ||
      payload.status === "ready" ||
      payload.status === "needs-approval" ||
      payload.status === "metadata-needed") &&
    typeof payload.recordCount === "number" &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    Array.isArray(payload.queueHashes) &&
    payload.queueHashes.every((hash) => typeof hash === "string" && preserveSha256(hash) !== undefined) &&
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
    preserveSha256(payload.packetHash) !== undefined &&
    payload.notLegalAdviceBoundary === "Not legal advice. Server Source Approval packets are audit preparation workflow metadata only."
  );
}

function isDemoCounselPackExportRecoveryPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.packetVersion !== "lexproof-counsel-pack-export-recovery-packet-v1") {
    return false;
  }

  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    preserveSha256(payload.packetHash) !== undefined &&
    typeof payload.recordCount === "number" &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    typeof payload.recoveryItemCount === "number" &&
    Number.isInteger(payload.recoveryItemCount) &&
    payload.recoveryItemCount >= 0 &&
    typeof payload.blockedCount === "number" &&
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

function isDemoAuditLogExportPayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.exportVersion !== "lexproof-audit-log-export-v1") {
    return false;
  }

  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.exportedAt === "string" &&
    preserveSha256(payload.exportHash) !== undefined &&
    preserveSha256(payload.integrityChainHash) !== undefined &&
    isAuditLogExportIntegrityStatus(payload.integrityStatus) &&
    typeof payload.integritySummary === "string" &&
    typeof payload.eventCount === "number" &&
    Number.isInteger(payload.eventCount) &&
    payload.eventCount >= 0 &&
    Array.isArray(payload.events) &&
    payload.events.length === payload.eventCount &&
    isAuditLogExportBoundaryStatus(payload.dataBoundaryStatus) &&
    typeof payload.exportAllowed === "boolean" &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    payload.notLegalAdviceBoundary === "Not legal advice. Audit Log exports are review workspace metadata only."
  );
}

function isDemoIntegrationPolicyReceiptBundlePayload(payload: unknown): boolean {
  if (!isRecord(payload) || payload.bundleVersion !== "lexproof-integration-policy-evaluation-receipt-bundle-v1") {
    return false;
  }

  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    preserveSha256(payload.bundleHash) !== undefined &&
    typeof payload.recordCount === "number" &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    typeof payload.policyCount === "number" &&
    Number.isInteger(payload.policyCount) &&
    payload.policyCount >= 0 &&
    Array.isArray(payload.missingPolicyIds) &&
    typeof payload.readyCount === "number" &&
    Number.isInteger(payload.readyCount) &&
    payload.readyCount >= 0 &&
    typeof payload.needsPolicyCount === "number" &&
    Number.isInteger(payload.needsPolicyCount) &&
    payload.needsPolicyCount >= 0 &&
    typeof payload.blockedCount === "number" &&
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

function isDemoIntegrationPolicyReceiptRecoveryPayload(payload: unknown): boolean {
  const summary = isRecord(payload) ? payload.summary : null;

  if (!isRecord(payload) || payload.packetVersion !== "lexproof-integration-policy-receipt-recovery-packet-v1") {
    return false;
  }

  return (
    payload.workspaceId === demoPreflightWorkspaceId &&
    typeof payload.generatedAt === "string" &&
    preserveSha256(payload.packetHash) !== undefined &&
    isIntegrationPolicyReceiptRecoveryPacketStatus(payload.status) &&
    typeof payload.recordCount === "number" &&
    Number.isInteger(payload.recordCount) &&
    payload.recordCount >= 0 &&
    typeof payload.policyCount === "number" &&
    Number.isInteger(payload.policyCount) &&
    payload.policyCount >= 0 &&
    payload.externalEnablementAllowed === false &&
    isRecord(summary) &&
    isNonNegativeInteger(summary.totalRecoveryCount) &&
    isNonNegativeInteger(summary.missingPolicyCount) &&
    isNonNegativeInteger(summary.blockedCount) &&
    isNonNegativeInteger(summary.needsPolicyCount) &&
    isNonNegativeInteger(summary.staleReceiptCount) &&
    isNonNegativeInteger(summary.readyPolicyCount) &&
    isNonNegativeInteger(summary.latestReceiptCount) &&
    typeof summary.nextAction === "string" &&
    summary.nextAction.trim().length > 0 &&
    summary.notLegalAdviceBoundary === "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only." &&
    Array.isArray(payload.items) &&
    payload.items.length >= payload.policyCount &&
    Array.isArray(payload.nextActions) &&
    payload.nextActions.length > 0 &&
    payload.nextActions.every((action) => typeof action === "string" && action.trim().length > 0) &&
    payload.notLegalAdviceBoundary === "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only."
  );
}

function isIntegrationPolicyReceiptRecoveryPacketStatus(value: unknown): boolean {
  return (
    value === "empty" ||
    value === "missing-receipts" ||
    value === "blocked" ||
    value === "needs-policy" ||
    value === "stale-receipts" ||
    value === "ready"
  );
}

function isAuditLogExportIntegrityStatus(value: unknown): boolean {
  return value === "verified" || value === "needs-review" || value === "blocked" || value === "empty";
}

function isAuditLogExportBoundaryStatus(value: unknown): boolean {
  return value === "clean" || value === "needs-review" || value === "blocked";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
