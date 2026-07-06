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

export type DemoScenarioProofSummary = {
  scenarioId: string;
  workflowStepCount: number;
  expectedArtifactCount: number;
  sourceControlSignalCount: number;
  sourceControlSignals: string[];
  label: string;
  notLegalAdviceBoundary: "Not legal advice. Demo scenario proof signals are audit preparation readiness metadata only.";
};

const REQUIRED_BOUNDARY = "Not legal advice";
const PROOF_SIGNAL_BOUNDARY = "Not legal advice. Demo scenario proof signals are audit preparation readiness metadata only." as const;

const blockedDemoText: Array<{ label: string; pattern: RegExp }> = [
  { label: "raw KYC", pattern: /\braw\s+kyc\b/i },
  { label: "private key", pattern: /\bprivate\s+key\b/i },
  { label: "seed phrase", pattern: /\bseed\s+phrase\b/i },
  { label: "live API key", pattern: /\bsk-(live|proj|test)-[a-z0-9_-]{8,}\b/i }
];
const sourceControlSignalPattern =
  /\b(source|control|regulation|review|governance|counsel|export|regulator|aba|nist|aedt|ccpa|colorado|ai act|ico|sec|cftc|nydfs|fincen|ofac|genius|mica|dora|tfr|dlt|fca|boe|mas|sfc|hkma|fsa|csa|asic|austrac|ojk|fsc|kofiu|fiu|pmla|bnm|bsp|fsca|fic|vara|bafin|finma|aml|cft|travel rule|custody|stablecoin|vasp|casp|dao|rwa|consumer protection)\b/i;

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

    if (createDemoScenarioProofSummary(scenario).sourceControlSignalCount === 0) {
      errors.push(`${scenario.id} needs at least one source/control proof signal.`);
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
  const proof = createDemoScenarioProofSummary(scenario);
  return `${scenario.title} | ${scenario.estimatedMinutes} min | ${proof.label} | ${scenario.expectedArtifacts.join(", ")} | ${scenario.notLegalAdviceBoundary}`;
}

export function createDemoScenarioProofSummary(scenario: DemoScenario): DemoScenarioProofSummary {
  const sourceControlSignals = scenario.focusTags.filter((tag) => sourceControlSignalPattern.test(tag.trim()));
  const workflowStepCount = scenario.judgePath.length;
  const expectedArtifactCount = scenario.expectedArtifacts.length;
  const sourceControlSignalCount = sourceControlSignals.length;

  return {
    scenarioId: scenario.id,
    workflowStepCount,
    expectedArtifactCount,
    sourceControlSignalCount,
    sourceControlSignals,
    label: `${workflowStepCount} steps / ${expectedArtifactCount} artifacts / ${sourceControlSignalCount} source-control signals`,
    notLegalAdviceBoundary: PROOF_SIGNAL_BOUNDARY
  };
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
