import { redactClassifiedText } from "./dataClassification";
import type { DemoScenario, DemoScenarioStartTab } from "./demoScenarioLibrary";
import type { DemoReadinessCheckStatus, DemoReadinessReport, DemoReadinessStatus } from "./demoReadiness";

export type DemoRunbookPathStep = {
  step: number;
  label: string;
  workbenchSurface: string;
  action: string;
  expectedEvidence: string;
  notLegalAdviceBoundary: "Not legal advice. Demo runbook steps are audit preparation demo instructions only.";
};

export type DemoRunbookScenario = {
  id: string;
  title: string;
  projectName: string;
  estimatedMinutes: number;
  recommendedStartTab: DemoScenarioStartTab;
  judgePath: string[];
  expectedArtifacts: string[];
  focusTags: string[];
  notLegalAdviceBoundary: string;
};

export type DemoRunbookReadinessCheck = {
  id: string;
  label: string;
  status: DemoReadinessCheckStatus;
  detail: string;
  recoveryAction: string;
};

export type DemoRunbook = {
  runbookVersion: "lexproof-demo-runbook-v1";
  generatedAt: string;
  runbookHash: string;
  status: DemoReadinessStatus;
  apiPreflightStatus: DemoReadinessCheckStatus;
  scenarioCount: number;
  cleanCloneCommands: string[];
  demoPath: DemoRunbookPathStep[];
  scenarios: DemoRunbookScenario[];
  readinessChecks: DemoRunbookReadinessCheck[];
  screenshotRefs: string[];
  nextActions: string[];
  limitations: string[];
  notLegalAdviceBoundary: "Not legal advice. Demo runbooks are audit preparation demo metadata only.";
};

export type CreateDemoRunbookInput = {
  readinessReport: DemoReadinessReport;
  scenarios: DemoScenario[];
  generatedAt?: string;
};

const RUNBOOK_BOUNDARY = "Not legal advice. Demo runbooks are audit preparation demo metadata only." as const;
const STEP_BOUNDARY = "Not legal advice. Demo runbook steps are audit preparation demo instructions only." as const;

const demoPath: DemoRunbookPathStep[] = [
  {
    step: 1,
    label: "Start from Project Workspace",
    workbenchSurface: "Project Workspace -> Judge Demo Readiness",
    action: "Run the clean-clone commands, then check the Phase 2 API preflight before judging.",
    expectedEvidence: "Judge Demo Readiness panel is visible with clean-clone commands and API preflight.",
    notLegalAdviceBoundary: STEP_BOUNDARY
  },
  {
    step: 2,
    label: "Connect model safely",
    workbenchSurface: "Model Intake -> Model Connect",
    action: "Use the mock or OpenAI-compatible model settings without persisting session credentials.",
    expectedEvidence: "Model Connect receipt and Model Intake event hash are available for review.",
    notLegalAdviceBoundary: STEP_BOUNDARY
  },
  {
    step: 3,
    label: "Collect and vault evidence metadata",
    workbenchSurface: "Evidence Ledger -> Evidence Vault",
    action: "Add or select synthetic metadata-only evidence, sync the Evidence Vault, and inspect the manifest and lineage digest.",
    expectedEvidence: "Evidence Manifest, Evidence Vault manifest hash, and Evidence Vault Lineage Digest are visible.",
    notLegalAdviceBoundary: STEP_BOUNDARY
  },
  {
    step: 4,
    label: "Route review decisions",
    workbenchSurface: "Risk Audit -> Human Review",
    action: "Inspect source-linked risk triggers, route model/evidence/source items through Human Review, and keep returned or rejected states recoverable.",
    expectedEvidence: "Human Review timeline, linked status effects, and remediation queue are visible.",
    notLegalAdviceBoundary: STEP_BOUNDARY
  },
  {
    step: 5,
    label: "Export audit-prep handoff",
    workbenchSurface: "Counsel Pack -> Sources",
    action: "Export the Counsel Pack, Regulatory Source Pack, Submission Pack, and this Demo Runbook as metadata-only artifacts.",
    expectedEvidence: "Counsel Pack Markdown, Submission Pack JSON, Demo Runbook JSON, and Not legal advice boundaries are present.",
    notLegalAdviceBoundary: STEP_BOUNDARY
  }
];

const limitations = [
  "No legal advice, compliance conclusion, KYC processing, private-key handling, or real chain write is performed.",
  "External model, storage, parser, GRC, and chain adapters remain disabled until separate readiness review.",
  "Screenshots and scenarios are synthetic judge materials and must be refreshed after visible workflow changes.",
  "The Phase 2 API preflight proves local demo readiness only; it does not certify production deployment."
];

export async function createDemoRunbook({
  readinessReport,
  scenarios,
  generatedAt = new Date().toISOString()
}: CreateDemoRunbookInput): Promise<DemoRunbook> {
  const readinessChecks = readinessReport.checks.map((check) => ({
    id: sanitize(check.id),
    label: sanitize(check.label),
    status: check.status,
    detail: sanitize(check.detail),
    recoveryAction: sanitize(check.recoveryAction)
  }));
  const apiPreflightStatus =
    readinessChecks.find((check) => check.id === "phase-2-api-preflight")?.status ?? "not-checked";
  const runbookScenarios = scenarios.map(toRunbookScenario);
  const hashPayload = {
    runbookVersion: "lexproof-demo-runbook-v1",
    status: readinessReport.status,
    apiPreflightStatus,
    scenarioCount: runbookScenarios.length,
    cleanCloneCommands: readinessReport.cleanCloneCommands.map(sanitize).filter(Boolean),
    demoPath,
    scenarios: runbookScenarios,
    readinessChecks,
    screenshotRefs: readinessReport.screenshotRefs.map(sanitize).filter(Boolean),
    nextActions: readinessReport.nextActions.map(sanitize).filter(Boolean),
    limitations: limitations.map(sanitize),
    notLegalAdviceBoundary: RUNBOOK_BOUNDARY
  };

  return {
    runbookVersion: "lexproof-demo-runbook-v1",
    generatedAt,
    runbookHash: await sha256Hex(stableStringify(hashPayload)),
    status: readinessReport.status,
    apiPreflightStatus,
    scenarioCount: runbookScenarios.length,
    cleanCloneCommands: readinessReport.cleanCloneCommands.map(sanitize).filter(Boolean),
    demoPath,
    scenarios: runbookScenarios,
    readinessChecks,
    screenshotRefs: readinessReport.screenshotRefs.map(sanitize).filter(Boolean),
    nextActions: readinessReport.nextActions.map(sanitize).filter(Boolean),
    limitations: limitations.map(sanitize),
    notLegalAdviceBoundary: RUNBOOK_BOUNDARY
  };
}

export function exportDemoRunbookJson(runbook: DemoRunbook): string {
  return `${JSON.stringify(runbook, null, 2)}\n`;
}

export function downloadDemoRunbookJson(filename: string, runbook: DemoRunbook): void {
  const blob = new Blob([exportDemoRunbookJson(runbook)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function toRunbookScenario(scenario: DemoScenario): DemoRunbookScenario {
  return {
    id: sanitize(scenario.id),
    title: sanitize(scenario.title),
    projectName: sanitize(scenario.projectName),
    estimatedMinutes: scenario.estimatedMinutes,
    recommendedStartTab: scenario.recommendedStartTab,
    judgePath: scenario.judgePath.map(sanitize).filter(Boolean),
    expectedArtifacts: scenario.expectedArtifacts.map(sanitize).filter(Boolean),
    focusTags: scenario.focusTags.map(sanitize).filter(Boolean),
    notLegalAdviceBoundary: sanitize(scenario.notLegalAdviceBoundary)
  };
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
