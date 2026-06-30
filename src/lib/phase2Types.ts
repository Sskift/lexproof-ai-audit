export type WorkspaceRecord = {
  recordVersion: "lexproof-workspace-record-v1";
  id: string;
  name: string;
  organizationName: string;
  ownerId: string;
  status: "draft" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only.";
};

export type EvidenceVaultStatus =
  | "draft"
  | "requested"
  | "received"
  | "submitted"
  | "under-review"
  | "verified"
  | "rejected"
  | "superseded";

export type EvidenceVaultRecord = {
  recordVersion: "lexproof-evidence-vault-record-v1";
  id: string;
  workspaceId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  fileHash: string;
  storageMode: "local-metadata" | "server-vault" | "external-reference";
  status: EvidenceVaultStatus;
  owner: string;
  sourceNote: string;
  version: number;
  linkedRiskFlagIds: string[];
  containsRawKycOrPersonalData: boolean;
  parentEvidenceId?: string;
  supersededByEvidenceId?: string;
  replacementReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type ModelGatewayRunStatus = "queued" | "blocked" | "completed" | "failed";

export type ModelGatewayRetryState =
  | "not-needed"
  | "retry-available"
  | "blocked-until-remediated"
  | "blocked-until-policy-change";

export type ModelGatewayProviderMetadata = {
  adapterMode: "local-mock" | "external-provider-placeholder";
  credentialPolicy: "no credentials accepted" | "deferred until server-side secret policy is approved";
  secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.";
  allowedDataClasses: string[];
};

export type ModelGatewayRun = {
  recordVersion: "lexproof-model-gateway-run-v1";
  id: string;
  workspaceId: string;
  provider: "mock" | "openai-compatible" | "enterprise-proxy";
  providerLabel: string;
  model: string;
  purpose: string;
  status: ModelGatewayRunStatus;
  redactionStatus: "clean" | "needs-review" | "blocked";
  payloadHash: string;
  responseHash: string;
  sourceEvidenceHash: string;
  providerMetadata: ModelGatewayProviderMetadata;
  humanReviewStatus: "not-required" | "needs-review" | "reviewed" | "rejected";
  attempt: number;
  maxAttempts: number;
  retryState: ModelGatewayRetryState;
  errorCode?: string;
  errorMessage?: string;
  remediationSteps: string[];
  createdAt: string;
  completedAt?: string;
  notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice.";
};

export type ModelGatewayRunSummary = {
  id: string;
  providerLabel: string;
  model: string;
  status: ModelGatewayRunStatus;
  redactionStatus: ModelGatewayRun["redactionStatus"];
  humanReviewStatus: ModelGatewayRun["humanReviewStatus"];
  payloadHash: string;
  responseHash: string;
  sourceEvidenceHash: string;
  retryState: ModelGatewayRetryState;
  errorCode?: string;
  errorMessage?: string;
  remediationSteps: string[];
  requiresHumanReview: boolean;
  boundary: ModelGatewayRun["notLegalAdviceBoundary"];
};

export type HumanReviewRecord = {
  recordVersion: "lexproof-human-review-record-v1";
  id: string;
  workspaceId: string;
  targetType: "risk-flag" | "evidence" | "model-run" | "clause-match" | "counsel-pack";
  targetId: string;
  reviewerId: string;
  status: "requested" | "under-review" | "reviewed" | "rejected" | "needs-more-evidence";
  comment: string;
  createdAt: string;
  updatedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status.";
};

export type CounselPackExportReviewSummary = {
  total: number;
  reviewed: number;
  readyForCounsel: number;
  needsEvidence: number;
  blocked: number;
  open: number;
};

export type CounselPackExportSourceReviewStatus = "current" | "review-due" | "metadata-missing";

export type CounselPackExportRecord = {
  recordVersion: "lexproof-counsel-pack-export-record-v1";
  id: string;
  workspaceId: string;
  exportType: "counsel-pack";
  format: "markdown" | "print-pdf";
  version: number;
  projectName: string;
  title: string;
  artifactName: string;
  manifestHash: string;
  artifactHash: string;
  artifactSize: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  reviewSummary: CounselPackExportReviewSummary;
  sourceCount: number;
  sourcePackHash: string;
  sourceReviewStatus: CounselPackExportSourceReviewStatus;
  createdBy: string;
  status: "ready";
  createdAt: string;
  notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only.";
};

export type AuditLogRecord = {
  recordVersion: "lexproof-audit-log-record-v1";
  id: string;
  workspaceId: string;
  actorId: string;
  action: string;
  targetType: "workspace" | "evidence" | "model-run" | "human-review" | "export";
  targetId: string;
  beforeHash: string;
  afterHash: string;
  summary: string;
  createdAt: string;
  notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata.";
};

export type EvidenceVaultValidationResult = {
  valid: boolean;
  errors: string[];
};

export function createAuditLogRecord(
  input: Omit<AuditLogRecord, "recordVersion" | "id" | "notLegalAdviceBoundary">
): AuditLogRecord {
  return {
    recordVersion: "lexproof-audit-log-record-v1",
    id: `audit-log-${hashId([
      input.workspaceId,
      input.actorId,
      input.action,
      input.targetType,
      input.targetId,
      input.beforeHash,
      input.afterHash,
      input.createdAt
    ])}`,
    ...input,
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
  };
}

export function createModelGatewayRunSummary(run: ModelGatewayRun): ModelGatewayRunSummary {
  return {
    id: run.id,
    providerLabel: run.providerLabel,
    model: run.model,
    status: run.status,
    redactionStatus: run.redactionStatus,
    humanReviewStatus: run.humanReviewStatus,
    payloadHash: run.payloadHash,
    responseHash: run.responseHash,
    sourceEvidenceHash: run.sourceEvidenceHash,
    retryState: run.retryState,
    ...(run.errorCode ? { errorCode: run.errorCode } : {}),
    ...(run.errorMessage ? { errorMessage: run.errorMessage } : {}),
    remediationSteps: [...run.remediationSteps],
    requiresHumanReview: run.humanReviewStatus === "needs-review",
    boundary: run.notLegalAdviceBoundary
  };
}

export function validateEvidenceVaultRecord(record: EvidenceVaultRecord): EvidenceVaultValidationResult {
  const errors: string[] = [];

  if (!record.workspaceId.trim()) {
    errors.push("Workspace ID is required.");
  }

  if (!record.filename.trim()) {
    errors.push("Evidence filename is required.");
  }

  if (!record.fileHash.trim()) {
    errors.push("Evidence file hash is required.");
  }

  if (!record.owner.trim()) {
    errors.push("Evidence owner is required.");
  }

  if (record.byteSize <= 0) {
    errors.push("Evidence byte size must be greater than zero.");
  }

  if (record.containsRawKycOrPersonalData) {
    errors.push("Raw KYC or personal data cannot be stored in the Phase 2 evidence vault draft.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function hashId(parts: string[]): string {
  let hash = 0xcbf29ce484222325n;
  const payload = parts.map((part) => part.trim()).join("|");

  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }

  return hash.toString(16).padStart(16, "0").slice(0, 12);
}
