import type { AuditProfile } from "./auditEngine";

export type DemoScenarioStartTab =
  | "wizard"
  | "ai"
  | "model"
  | "review"
  | "jurisdiction"
  | "risk"
  | "evidence"
  | "counsel"
  | "sources";

export type DemoScenario = {
  id: string;
  projectName: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  recommendedStartTab: DemoScenarioStartTab;
  judgePath: string[];
  expectedArtifacts: string[];
  focusTags: string[];
  notLegalAdviceBoundary: string;
};

export type DemoScenarioValidationResult = {
  valid: boolean;
  errors: string[];
};

const REQUIRED_BOUNDARY = "Not legal advice";

const blockedDemoText: Array<{ label: string; pattern: RegExp }> = [
  { label: "raw KYC", pattern: /\braw\s+kyc\b/i },
  { label: "private key", pattern: /\bprivate\s+key\b/i },
  { label: "seed phrase", pattern: /\bseed\s+phrase\b/i },
  { label: "live API key", pattern: /\bsk-(live|proj|test)-[a-z0-9_-]{8,}\b/i }
];

export function validateDemoScenarioLibrary(
  scenarios: DemoScenario[],
  sampleProfiles: AuditProfile[]
): DemoScenarioValidationResult {
  const errors: string[] = [];
  const sampleNames = new Set(sampleProfiles.map((profile) => profile.projectName));
  const seenIds = new Set<string>();

  for (const scenario of scenarios) {
    if (!scenario.id.trim()) {
      errors.push("Demo scenario id is required.");
    } else if (seenIds.has(scenario.id)) {
      errors.push(`${scenario.id} must be unique.`);
    }
    seenIds.add(scenario.id);

    if (!sampleNames.has(scenario.projectName)) {
      errors.push(`${scenario.id} references an unknown sample profile: ${scenario.projectName}.`);
    }

    if (!scenario.notLegalAdviceBoundary.includes(REQUIRED_BOUNDARY)) {
      errors.push(`${scenario.id} must include the Not legal advice boundary.`);
    }

    if (scenario.judgePath.length < 3) {
      errors.push(`${scenario.id} needs at least three judge path steps.`);
    }

    if (scenario.expectedArtifacts.length === 0) {
      errors.push(`${scenario.id} needs at least one expected artifact.`);
    }

    for (const blocked of blockedDemoText) {
      if (blocked.pattern.test(scenarioText(scenario))) {
        errors.push(`${scenario.id} includes blocked demo text: ${blocked.label}.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function findDemoScenarioById(scenarios: DemoScenario[], id: string): DemoScenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}

export function summarizeDemoScenario(scenario: DemoScenario): string {
  return `${scenario.title} | ${scenario.estimatedMinutes} min | ${scenario.expectedArtifacts.join(", ")} | ${scenario.notLegalAdviceBoundary}`;
}

function scenarioText(scenario: DemoScenario): string {
  return [
    scenario.id,
    scenario.projectName,
    scenario.title,
    scenario.summary,
    scenario.notLegalAdviceBoundary,
    ...scenario.judgePath,
    ...scenario.expectedArtifacts,
    ...scenario.focusTags
  ].join(" ");
}
