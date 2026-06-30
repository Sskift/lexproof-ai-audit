import { redactDataBoundaryText } from "./dataBoundary";
import type { ModelGatewayRun, ModelGatewayRunStatus, ModelGatewayRetryState } from "./phase2Types";

export type ModelGatewayReviewerAction =
  | "send-to-human-review"
  | "resolve-remediation"
  | "policy-change-required"
  | "archive-reviewed";

export type ModelGatewayEvaluationRecord = {
  evaluationVersion: "lexproof-model-gateway-evaluation-v1";
  runId: string;
  workspaceId: string;
  status: ModelGatewayRunStatus;
  provider: ModelGatewayRun["provider"];
  providerLabel: string;
  model: string;
  purpose: string;
  adapterMode: ModelGatewayRun["providerMetadata"]["adapterMode"];
  credentialPolicy: ModelGatewayRun["providerMetadata"]["credentialPolicy"];
  secretPolicy: ModelGatewayRun["providerMetadata"]["secretPolicy"];
  allowedDataClasses: string[];
  redactionStatus: ModelGatewayRun["redactionStatus"];
  humanReviewStatus: ModelGatewayRun["humanReviewStatus"];
  requiresHumanReview: boolean;
  retryState: ModelGatewayRetryState;
  attempt: number;
  maxAttempts: number;
  hashes: {
    payloadHash: string;
    responseHash: string;
    sourceEvidenceHash: string;
  };
  errorCode?: string;
  errorMessage?: string;
  remediationSteps: string[];
  reviewerAction: ModelGatewayReviewerAction;
  createdAt: string;
  completedAt?: string;
  notLegalAdviceBoundary: "Not legal advice. Model Gateway evaluation records are audit preparation metadata only.";
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Model Gateway evaluation records are audit preparation metadata only.";

export function createModelGatewayEvaluationRecord(run: ModelGatewayRun): ModelGatewayEvaluationRecord {
  const providerMetadata = run.providerMetadata ?? createFallbackProviderMetadata();

  return {
    evaluationVersion: "lexproof-model-gateway-evaluation-v1",
    runId: run.id,
    workspaceId: run.workspaceId,
    status: run.status,
    provider: run.provider,
    providerLabel: redactDataBoundaryText(run.providerLabel),
    model: redactDataBoundaryText(run.model),
    purpose: redactDataBoundaryText(run.purpose),
    adapterMode: providerMetadata.adapterMode,
    credentialPolicy: providerMetadata.credentialPolicy,
    secretPolicy: providerMetadata.secretPolicy,
    allowedDataClasses: providerMetadata.allowedDataClasses.map((item) => redactDataBoundaryText(item)),
    redactionStatus: run.redactionStatus,
    humanReviewStatus: run.humanReviewStatus,
    requiresHumanReview: run.humanReviewStatus === "needs-review",
    retryState: run.retryState ?? "not-needed",
    attempt: run.attempt ?? 1,
    maxAttempts: run.maxAttempts ?? 1,
    hashes: {
      payloadHash: run.payloadHash,
      responseHash: run.responseHash || "not-available",
      sourceEvidenceHash: run.sourceEvidenceHash || "not-available"
    },
    ...(run.errorCode ? { errorCode: redactDataBoundaryText(run.errorCode) } : {}),
    ...(run.errorMessage ? { errorMessage: redactDataBoundaryText(run.errorMessage) } : {}),
    remediationSteps: run.remediationSteps.map((step) => redactDataBoundaryText(step)),
    reviewerAction: createReviewerAction(run),
    createdAt: run.createdAt,
    ...(run.completedAt ? { completedAt: run.completedAt } : {}),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportModelGatewayEvaluationJson(record: ModelGatewayEvaluationRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function downloadModelGatewayEvaluationJson(filename: string, record: ModelGatewayEvaluationRecord): void {
  const blob = new Blob([exportModelGatewayEvaluationJson(record)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createReviewerAction(run: ModelGatewayRun): ModelGatewayReviewerAction {
  if (run.retryState === "blocked-until-policy-change") {
    return "policy-change-required";
  }

  if (run.status === "blocked" || run.status === "failed" || run.retryState === "blocked-until-remediated") {
    return "resolve-remediation";
  }

  if (run.humanReviewStatus === "reviewed") {
    return "archive-reviewed";
  }

  return "send-to-human-review";
}

function createFallbackProviderMetadata(): ModelGatewayRun["providerMetadata"] {
  return {
    adapterMode: "external-provider-placeholder",
    credentialPolicy: "deferred until server-side secret policy is approved",
    secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
    allowedDataClasses: []
  };
}
