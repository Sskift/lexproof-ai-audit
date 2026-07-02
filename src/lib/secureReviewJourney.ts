import type { AuditResult } from "./auditEngine";
import { createRedactionReport } from "./aiReview";
import { asSafeApiErrorResponse } from "./apiErrorClient";
import {
  syncEvidenceLedgerToVault,
  type EvidenceVaultSyncResult,
  type EvidenceVaultRecordResponse
} from "./evidenceVaultClient";
import type { ModelConnectReceipt } from "./modelConnect";
import type { EvidenceItem, ProjectProfile } from "./projectModel";
import type { AuditLogRecord, HumanReviewRecord, ModelGatewayRun, WorkspaceRecord } from "./phase2Types";

export type SecureReviewJourneyResult = {
  status: "complete";
  workspace: WorkspaceRecord;
  evidenceVault: EvidenceVaultSyncResult;
  modelGatewayRun: ModelGatewayRun;
  humanReview: HumanReviewRecord;
  auditLogRecords: AuditLogRecord[];
  completedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Secure review journeys create audit preparation workflow records only.";
};

export type RunSecureReviewJourneyInput = {
  project: ProjectProfile;
  audit: AuditResult;
  evidenceItems: EvidenceItem[];
  modelConnectReceipt: ModelConnectReceipt | null;
  apiBaseUrl?: string;
  humanReviewOwner?: string;
  fetcher?: SecureReviewFetch;
};

type SecureReviewFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type ErrorResponse = {
  error?: string;
  errors?: string[];
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
  runId?: string;
  retryState?: string;
  remediationSteps?: string[];
};

export type SecureReviewJourneyClientErrorDetails = {
  message: string;
  code?: string;
  runId?: string;
  retryState?: string;
  recoveryAction?: string;
  remediationSteps?: string[];
  notLegalAdviceBoundary?: string;
};

export class SecureReviewJourneyClientError extends Error {
  code?: string;
  runId?: string;
  retryState?: string;
  recoveryAction?: string;
  remediationSteps: string[];
  notLegalAdviceBoundary: string;

  constructor(details: SecureReviewJourneyClientErrorDetails) {
    super(details.message);
    this.name = "SecureReviewJourneyClientError";
    this.code = details.code;
    this.runId = details.runId;
    this.retryState = details.retryState;
    this.recoveryAction = details.recoveryAction;
    this.remediationSteps = details.remediationSteps ?? [];
    this.notLegalAdviceBoundary =
      details.notLegalAdviceBoundary ??
      "Not legal advice. Secure review journey errors are audit preparation workflow metadata only.";
  }
}

export async function runSecureReviewJourney(input: RunSecureReviewJourneyInput): Promise<SecureReviewJourneyResult> {
  assertJourneyCanRun(input);

  const fetcher = resolveFetcher(input.fetcher);
  const workspaceId = input.project.id.trim();
  const humanReviewOwner = input.humanReviewOwner?.trim() || "Compliance";
  const workspace = await createWorkspace(input, humanReviewOwner, fetcher);
  const evidenceVault = await syncEvidenceLedgerToVault({
    workspaceId,
    evidenceItems: input.evidenceItems,
    apiBaseUrl: input.apiBaseUrl,
    fetcher
  });
  const modelGatewayRun = await createModelGatewayRun(input, evidenceVault, humanReviewOwner, fetcher);
  const humanReview = await resolveModelRunHumanReview(input, modelGatewayRun, humanReviewOwner, fetcher);
  const auditLogRecords = await fetchAuditLog(input.apiBaseUrl, workspaceId, fetcher);

  return {
    status: "complete",
    workspace,
    evidenceVault,
    modelGatewayRun,
    humanReview,
    auditLogRecords,
    completedAt: new Date().toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Secure review journeys create audit preparation workflow records only."
  };
}

function assertJourneyCanRun(input: RunSecureReviewJourneyInput): asserts input is RunSecureReviewJourneyInput & { modelConnectReceipt: ModelConnectReceipt } {
  if (input.evidenceItems.length === 0) {
    throw new Error("Add at least one evidence item before running the secure review journey.");
  }

  if (!input.modelConnectReceipt) {
    throw new Error("Validate Model Connect before running the secure review journey.");
  }

  if (input.modelConnectReceipt.status !== "ready") {
    const blockers = input.modelConnectReceipt.blockers.join(" ");
    throw new Error(blockers || "Validate Model Connect before running the secure review journey.");
  }

  const redactionReport = createRedactionReport(input.evidenceItems);
  if (redactionReport.status === "blocked") {
    throw new Error("Redaction Gate blocked the secure review journey. Remove secrets or private-key material first.");
  }

  if (!input.project.id.trim()) {
    throw new Error("Workspace ID is required before running the secure review journey.");
  }
}

async function createWorkspace(input: RunSecureReviewJourneyInput, humanReviewOwner: string, fetcher: SecureReviewFetch): Promise<WorkspaceRecord> {
  const response = await fetcher(buildApiUrl(input.apiBaseUrl, "workspaces"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: input.project.id,
      name: input.project.projectName.trim() || "Untitled secure review workspace",
      organizationName: input.project.entityType.trim() || input.project.projectName.trim() || "LexProof workspace",
      ownerId: humanReviewOwner,
      status: "active"
    })
  });

  return readJsonResponse<WorkspaceRecord>(response, "Secure review workspace creation failed.");
}

async function createModelGatewayRun(
  input: RunSecureReviewJourneyInput & { modelConnectReceipt: ModelConnectReceipt },
  evidenceVault: EvidenceVaultSyncResult,
  humanReviewOwner: string,
  fetcher: SecureReviewFetch
): Promise<ModelGatewayRun> {
  const redactionReport = createRedactionReport(input.evidenceItems);
  const response = await fetcher(buildWorkspaceUrl(input.apiBaseUrl, input.project.id, "model-runs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "mock",
      model: input.modelConnectReceipt.model || "lexproof-mock",
      purpose: "Create server-side model gateway receipt for audit preparation and human review.",
      redactionStatus: redactionReport.status,
      includesCredentialMaterial: false,
      includesRawKycOrPersonalData: false,
      humanReviewOwner,
      allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
      payload: createModelGatewayPayload(input, evidenceVault)
    })
  });

  return readJsonResponse<ModelGatewayRun>(response, "Model Gateway run creation failed.");
}

function createModelGatewayPayload(
  input: RunSecureReviewJourneyInput & { modelConnectReceipt: ModelConnectReceipt },
  evidenceVault: EvidenceVaultSyncResult
) {
  return {
    boundary: "Not legal advice. Server Model Gateway receipts support audit preparation and human review only.",
    project: {
      id: input.project.id,
      projectName: input.project.projectName,
      jurisdictions: input.project.jurisdictions,
      assetModel: input.project.assetModel,
      custodyModel: input.project.custodyModel,
      aiUsage: input.project.aiUsage,
      operatingStage: input.project.operatingStage
    },
    riskFlags: input.audit.flags.map((flag) => ({
      id: flag.id,
      title: flag.title,
      severity: flag.severity
    })),
    evidenceVault: {
      bundleHash: evidenceVault.manifest.bundleHash,
      itemCount: evidenceVault.manifest.itemCount,
      records: evidenceVault.records.map(createEvidenceRecordSummary)
    },
    modelConnectReceipt: input.modelConnectReceipt
  };
}

function createEvidenceRecordSummary(record: EvidenceVaultRecordResponse) {
  return {
    id: record.id,
    filename: record.filename,
    status: record.status,
    owner: record.owner,
    fileHash: record.fileHash,
    storageMode: record.storageMode,
    containsRawKycOrPersonalData: record.containsRawKycOrPersonalData
  };
}

async function resolveModelRunHumanReview(
  input: RunSecureReviewJourneyInput,
  modelGatewayRun: ModelGatewayRun,
  humanReviewOwner: string,
  fetcher: SecureReviewFetch
): Promise<HumanReviewRecord> {
  const queuedReview = await findQueuedModelRunHumanReview(input.apiBaseUrl, input.project.id, modelGatewayRun.id, fetcher);

  if (queuedReview) {
    return queuedReview;
  }

  const response = await fetcher(buildWorkspaceUrl(input.apiBaseUrl, input.project.id, "reviews"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetType: "model-run",
      targetId: modelGatewayRun.id,
      reviewerId: humanReviewOwner,
      comment: "Review Model Gateway run before counsel pack reliance."
    })
  });

  return readJsonResponse<HumanReviewRecord>(response, "Human review request creation failed.");
}

async function findQueuedModelRunHumanReview(
  apiBaseUrl: string | undefined,
  workspaceId: string,
  modelRunId: string,
  fetcher: SecureReviewFetch
): Promise<HumanReviewRecord | null> {
  const response = await fetcher(buildWorkspaceUrl(apiBaseUrl, workspaceId, "reviews"), { method: "GET" });
  const records = await readJsonResponse<HumanReviewRecord[]>(response, "Human review lookup failed.");

  return records.find((record) => record.targetType === "model-run" && record.targetId === modelRunId) ?? null;
}

async function fetchAuditLog(apiBaseUrl: string | undefined, workspaceId: string, fetcher: SecureReviewFetch): Promise<AuditLogRecord[]> {
  const response = await fetcher(buildWorkspaceUrl(apiBaseUrl, workspaceId, "audit-log"), { method: "GET" });
  return readJsonResponse<AuditLogRecord[]>(response, "Secure review audit log fetch failed.");
}

function buildApiUrl(apiBaseUrl: string | undefined, route: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/${route}`;
}

function buildWorkspaceUrl(apiBaseUrl: string | undefined, workspaceId: string, route: string): string {
  return `${buildApiUrl(apiBaseUrl, `workspaces/${encodeURIComponent(workspaceId)}`)}/${route}`;
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ErrorResponse | T;

  if (!response.ok) {
    const errorPayload = payload as ErrorResponse;
    const safeErrorPayload = asSafeApiErrorResponse({
      ...errorPayload,
      error: errorPayload.errors?.join(" ") || errorPayload.error
    });
    const remediationSteps = (errorPayload.remediationSteps ?? []).map(safeRemediationStep).filter(Boolean);
    const runId = safeText(errorPayload.runId);
    const retryState = safeText(errorPayload.retryState);
    const details = [
      safeErrorPayload.error || fallbackMessage,
      runId ? `Run ${runId}.` : "",
      retryState ? `Retry state: ${retryState}.` : "",
      ...remediationSteps
    ]
      .filter(Boolean)
      .join(" ");
    throw new SecureReviewJourneyClientError({
      message: details,
      code: safeErrorPayload.code,
      runId,
      retryState,
      recoveryAction: safeErrorPayload.recoveryAction ?? remediationSteps[0],
      remediationSteps,
      notLegalAdviceBoundary: safeErrorPayload.notLegalAdviceBoundary
    });
  }

  return payload as T;
}

function safeRemediationStep(step: string): string {
  return asSafeApiErrorResponse({ recoveryAction: step }).recoveryAction ?? "";
}

function safeText(value: unknown): string | undefined {
  return asSafeApiErrorResponse({ error: value }).error;
}

function resolveFetcher(fetcher: SecureReviewFetch | undefined): SecureReviewFetch {
  const resolved = fetcher ?? globalThis.fetch?.bind(globalThis);

  if (!resolved) {
    throw new Error("Fetch is required for secure review journey.");
  }

  return resolved;
}
