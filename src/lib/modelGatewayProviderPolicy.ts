import { redactClassifiedText } from "./dataClassification.js";
import type { ModelGatewayRun } from "./phase2Types.js";

export type ModelGatewayProviderPolicyStatus = "ready" | "needs-policy" | "blocked" | "disabled";

export type ModelGatewayProviderPolicyControlId =
  | "server-side-secret-policy"
  | "provider-allowlist"
  | "egress-logging"
  | "redaction-gate"
  | "human-review-enforcement";

export type ModelGatewayProviderPolicyAdapter = {
  provider: ModelGatewayRun["provider"];
  label: string;
  enabled: boolean;
  mode: ModelGatewayRun["providerMetadata"]["adapterMode"];
  credentialPolicy: ModelGatewayRun["providerMetadata"]["credentialPolicy"];
};

export type ModelGatewayProviderPolicyAdapterReport = ModelGatewayProviderPolicyAdapter & {
  status: ModelGatewayProviderPolicyStatus;
  readinessEvidence: string;
  requiredControls: ModelGatewayProviderPolicyControlId[];
  disabledReason?: string;
};

export type ModelGatewayProviderPolicyControl = {
  id: ModelGatewayProviderPolicyControlId;
  label: string;
  status: ModelGatewayProviderPolicyStatus;
  evidence: string;
  recoveryAction: string;
};

export type ModelGatewayProviderPolicyReport = {
  reportVersion: "lexproof-model-gateway-provider-policy-v1";
  generatedAt: string;
  overallStatus: ModelGatewayProviderPolicyStatus;
  enabledProviderCount: number;
  deferredProviderCount: number;
  adapters: ModelGatewayProviderPolicyAdapterReport[];
  controls: ModelGatewayProviderPolicyControl[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only.";
};

export type ModelGatewayProviderPolicyModelConnectReceipt = {
  provider: ModelGatewayRun["provider"];
  mode: "local-mock" | "session-openai-compatible";
  status: "ready" | "blocked";
  blockers: string[];
};

export type ModelGatewayProviderPolicyInput = {
  adapters: ModelGatewayProviderPolicyAdapter[];
  modelConnectReceipt: ModelGatewayProviderPolicyModelConnectReceipt | null;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Model Gateway provider policy is audit preparation metadata only." as const;

export const defaultModelGatewayProviderAdapters: ModelGatewayProviderPolicyAdapter[] = [
  {
    provider: "mock",
    label: "Mock local reviewer gateway",
    enabled: true,
    mode: "local-mock",
    credentialPolicy: "no credentials accepted"
  },
  {
    provider: "openai-compatible",
    label: "OpenAI-compatible gateway",
    enabled: false,
    mode: "external-provider-placeholder",
    credentialPolicy: "deferred until server-side secret policy is approved"
  },
  {
    provider: "enterprise-proxy",
    label: "Enterprise model proxy gateway",
    enabled: false,
    mode: "external-provider-placeholder",
    credentialPolicy: "deferred until server-side secret policy is approved"
  }
];

export function createModelGatewayProviderPolicyReport(input: ModelGatewayProviderPolicyInput): ModelGatewayProviderPolicyReport {
  const receiptBlocked = input.modelConnectReceipt?.status === "blocked";
  const adapters = input.adapters.map((adapter) => createAdapterReport(adapter, input.modelConnectReceipt, receiptBlocked));
  const controls = createControls(input.modelConnectReceipt, receiptBlocked);
  const enabledProviderCount = adapters.filter((adapter) => adapter.enabled).length;
  const deferredProviderCount = adapters.filter((adapter) => !adapter.enabled).length;

  return {
    reportVersion: "lexproof-model-gateway-provider-policy-v1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    overallStatus: createOverallStatus([...adapters.map((adapter) => adapter.status), ...controls.map((control) => control.status)]),
    enabledProviderCount,
    deferredProviderCount,
    adapters,
    controls,
    nextActions: createNextActions(adapters, controls, input.modelConnectReceipt),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportModelGatewayProviderPolicyJson(report: ModelGatewayProviderPolicyReport): string {
  return JSON.stringify(report, null, 2);
}

function createAdapterReport(
  adapter: ModelGatewayProviderPolicyAdapter,
  receipt: ModelGatewayProviderPolicyModelConnectReceipt | null,
  receiptBlocked: boolean
): ModelGatewayProviderPolicyAdapterReport {
  if (adapter.enabled) {
    return {
      ...adapter,
      status: "ready",
      readinessEvidence: sanitize(`${adapter.label} is enabled for metadata-only mock review. No external provider call is made.`),
      requiredControls: ["redaction-gate", "human-review-enforcement"]
    };
  }

  const receiptTargetsAdapter = receipt?.provider === adapter.provider && receipt.mode === "session-openai-compatible";
  const status: ModelGatewayProviderPolicyStatus = receiptBlocked && receiptTargetsAdapter ? "blocked" : receiptTargetsAdapter ? "needs-policy" : "disabled";

  return {
    ...adapter,
    status,
    readinessEvidence: sanitize(createExternalAdapterEvidence(adapter, receiptTargetsAdapter, receiptBlocked)),
    requiredControls: ["server-side-secret-policy", "provider-allowlist", "egress-logging", "redaction-gate", "human-review-enforcement"],
    disabledReason:
      status === "disabled"
        ? "External provider proxying is disabled until server-side secret handling, provider allowlist, and egress logging are approved."
        : undefined
  };
}

function createExternalAdapterEvidence(
  adapter: ModelGatewayProviderPolicyAdapter,
  receiptTargetsAdapter: boolean,
  receiptBlocked: boolean
): string {
  if (receiptBlocked && receiptTargetsAdapter) {
    return `${adapter.label} cannot be reviewed for server proxying until Model Connect blockers are remediated.`;
  }

  if (receiptTargetsAdapter) {
    return `${adapter.label} has a session-only browser receipt, but server proxying remains disabled until provider policy controls are approved.`;
  }

  return `${adapter.label} is registered as a disabled placeholder and cannot receive credentials or external requests in this phase.`;
}

function createControls(
  receipt: ModelGatewayProviderPolicyModelConnectReceipt | null,
  receiptBlocked: boolean
): ModelGatewayProviderPolicyControl[] {
  const sanitizedBlockers = receipt?.blockers.map(sanitize).filter(Boolean) ?? [];

  const controls: ModelGatewayProviderPolicyControl[] = [
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
      status: receiptBlocked ? "blocked" : "ready",
      evidence: receiptBlocked
        ? sanitizedBlockers.join(" ") || "Model Connect is blocked by redaction or configuration checks."
        : "Model Connect has no current redaction blockers for audit-prep routing.",
      recoveryAction: receiptBlocked
        ? "Resolve Model Connect blockers before provider policy review."
        : "Keep Redaction Gate mandatory before any provider request."
    },
    {
      id: "human-review-enforcement",
      label: "Human review enforcement",
      status: "ready",
      evidence: "Model Gateway receipts and Model Intake route model output to human review before external reliance.",
      recoveryAction: "Keep model output as draft audit preparation and require human review before counsel handoff."
    }
  ];

  return controls.map((control) => ({
    ...control,
    evidence: sanitize(control.evidence),
    recoveryAction: sanitize(control.recoveryAction)
  }));
}

function createOverallStatus(statuses: ModelGatewayProviderPolicyStatus[]): ModelGatewayProviderPolicyStatus {
  if (statuses.includes("blocked")) {
    return "blocked";
  }

  if (statuses.includes("needs-policy")) {
    return "needs-policy";
  }

  if (statuses.includes("ready")) {
    return "ready";
  }

  return "disabled";
}

function createNextActions(
  adapters: ModelGatewayProviderPolicyAdapterReport[],
  controls: ModelGatewayProviderPolicyControl[],
  receipt: ModelGatewayProviderPolicyModelConnectReceipt | null
): string[] {
  const actions: string[] = [];

  if (receipt?.status === "blocked") {
    actions.push("Resolve Model Connect blockers before provider policy review.");
  }

  if (adapters.some((adapter) => adapter.provider === "openai-compatible" && adapter.status === "needs-policy")) {
    actions.push("Approve server-side secret policy before enabling OpenAI-compatible gateway.");
  }

  if (adapters.some((adapter) => !adapter.enabled)) {
    actions.push("Keep external provider proxying disabled until provider allowlist and egress logging are reviewed.");
  }

  controls
    .filter((control) => control.status === "blocked")
    .forEach((control) => actions.push(`${control.label}: ${control.recoveryAction}`));

  return actions.length > 0
    ? unique(actions.map(sanitize))
    : ["Provider policy controls are ready for mock-only audit preparation. Keep real external calls disabled until approved."];
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
