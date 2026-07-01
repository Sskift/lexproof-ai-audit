import type { FastifyInstance } from "fastify";
import { createHumanReviewRecord } from "./humanReviewService.js";
import {
  createModelGatewayRun,
  createServerModelGatewayProviderPolicyReport,
  createServerModelGatewaySecretPolicyReport,
  listModelGatewayAdapters
} from "./modelGatewayService.js";
import { createApiErrorResponse } from "./apiError.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import { createAuditLogRecord, createModelGatewayRunSummary } from "../src/lib/phase2Types.js";
import type { ModelGatewayProviderPolicyModelConnectReceipt } from "../src/lib/modelGatewayProviderPolicy.js";
import type { ModelGatewaySecretPolicyAccessReviewCadence, ModelGatewaySecretPolicyDraft } from "../src/lib/modelGatewaySecretPolicy.js";

export type ModelGatewayRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerModelGatewayRoutes(server: FastifyInstance, options: ModelGatewayRoutesOptions): void {
  const { repository } = options;

  server.get("/api/model-gateway/adapters", async () => listModelGatewayAdapters());
  server.get("/api/model-gateway/provider-policy", async () => createServerModelGatewayProviderPolicyReport());
  server.post<{ Body: ModelGatewayProviderPolicyRequestBody }>("/api/model-gateway/provider-policy", async (request) =>
    createServerModelGatewayProviderPolicyReport(toModelGatewayProviderPolicyReceipt(request.body?.modelConnectReceipt))
  );
  server.post<{ Body: ModelGatewaySecretPolicyRequestBody }>("/api/model-gateway/secret-policy", async (request) =>
    createServerModelGatewaySecretPolicyReport(toModelGatewaySecretPolicyDraft(request.body?.policy))
  );

  server.post<{ Params: { workspaceId: string }; Body: ModelGatewayRequestBody }>(
    "/api/workspaces/:workspaceId/model-runs",
    async (request, reply) => {
      const result = createModelGatewayRun({
        workspaceId: request.params.workspaceId,
        provider: request.body.provider,
        model: request.body.model,
        purpose: request.body.purpose,
        redactionStatus: request.body.redactionStatus,
        includesCredentialMaterial: request.body.includesCredentialMaterial,
        includesRawKycOrPersonalData: request.body.includesRawKycOrPersonalData,
        humanReviewOwner: request.body.humanReviewOwner,
        allowedDataClasses: request.body.allowedDataClasses ?? [],
        payload: request.body.payload
      });

      if (!result.valid) {
        await repository.saveModelGatewayRun(result.failureRun);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: "system",
            action: result.failureRun.status === "blocked" ? "model.run.blocked" : "model.run.failed",
            targetType: "model-run",
            targetId: result.failureRun.id,
            beforeHash: "",
            afterHash: sha256Hex(
              stableStringify({
                id: result.failureRun.id,
                status: result.failureRun.status,
                errorCode: result.failureRun.errorCode,
                retryState: result.failureRun.retryState
              })
            ),
            summary: "Recorded Model Gateway failure receipt for audit preparation remediation.",
            createdAt: result.failureRun.createdAt
          })
        );
        return reply.status(400).send({
          ...createApiErrorResponse({
            error: new Error("Model Gateway boundary failed."),
            code: result.failureRun.errorCode ?? "MODEL_GATEWAY_BOUNDARY_FAILED",
            fallbackMessage: "Model Gateway boundary failed.",
            recoveryAction: result.failureRun.remediationSteps[0] ?? "Review Model Gateway boundary errors and retry after remediation."
          }),
          errors: result.errors,
          runId: result.failureRun.id,
          retryState: result.failureRun.retryState,
          remediationSteps: result.failureRun.remediationSteps
        });
      }

      await repository.saveModelGatewayRun(result.run);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: request.params.workspaceId,
          actorId: "system",
          action: "model.run.created",
          targetType: "model-run",
          targetId: result.run.id,
          beforeHash: "",
          afterHash: result.run.responseHash,
          summary: "Created mock model gateway run for audit preparation.",
          createdAt: result.run.createdAt
        })
      );
      const review = createHumanReviewRecord({
        workspaceId: request.params.workspaceId,
        targetType: "model-run",
        targetId: result.run.id,
        reviewerId: request.body.humanReviewOwner,
        comment: "Review Model Gateway output before audit-prep reliance. AI-assisted draft only. Not legal advice.",
        createdAt: result.run.createdAt
      });
      await repository.saveHumanReviewRecord(review);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: request.params.workspaceId,
          actorId: review.reviewerId,
          action: "model.run.human-review-queued",
          targetType: "human-review",
          targetId: review.id,
          beforeHash: "",
          afterHash: sha256Hex(
            stableStringify({
              id: review.id,
              targetType: review.targetType,
              targetId: review.targetId,
              reviewerId: review.reviewerId,
              status: review.status
            })
          ),
          summary: "Queued completed Model Gateway output for human review before audit-prep reliance.",
          createdAt: review.createdAt
        })
      );
      return reply.status(201).send(result.run);
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/model-runs", async (request) =>
    (await repository.listModelGatewayRuns(request.params.workspaceId)).map(createModelGatewayRunSummary)
  );

  server.get<{ Params: { workspaceId: string; runId: string } }>(
    "/api/workspaces/:workspaceId/model-runs/:runId",
    async (request, reply) => {
      const run = await repository.findModelGatewayRun(request.params.workspaceId, request.params.runId);
      if (!run) {
        return reply.status(404).send(createModelGatewayRunNotFoundError());
      }
      return run;
    }
  );
}

type ModelGatewayRequestBody = {
  provider: "mock" | "openai-compatible" | "enterprise-proxy";
  model: string;
  purpose: string;
  redactionStatus: "clean" | "needs-review" | "blocked";
  includesCredentialMaterial: boolean;
  includesRawKycOrPersonalData: boolean;
  humanReviewOwner: string;
  allowedDataClasses?: string[];
  payload: unknown;
};

type ModelGatewayProviderPolicyRequestBody = {
  modelConnectReceipt?: unknown;
};

type ModelGatewaySecretPolicyRequestBody = {
  policy?: unknown;
};

function toModelGatewayProviderPolicyReceipt(value: unknown): ModelGatewayProviderPolicyModelConnectReceipt | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isProvider(value.provider) || !isReceiptMode(value.mode) || !isReceiptStatus(value.status)) {
    return null;
  }

  return {
    provider: value.provider,
    mode: value.mode,
    status: value.status,
    blockers: Array.isArray(value.blockers)
      ? value.blockers
          .filter((blocker): blocker is string => typeof blocker === "string")
          .map((blocker) => blocker.replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .slice(0, 10)
      : []
  };
}

function isProvider(value: unknown): value is ModelGatewayProviderPolicyModelConnectReceipt["provider"] {
  return value === "mock" || value === "openai-compatible" || value === "enterprise-proxy";
}

function isReceiptMode(value: unknown): value is ModelGatewayProviderPolicyModelConnectReceipt["mode"] {
  return value === "local-mock" || value === "session-openai-compatible";
}

function isReceiptStatus(value: unknown): value is ModelGatewayProviderPolicyModelConnectReceipt["status"] {
  return value === "ready" || value === "blocked";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toModelGatewaySecretPolicyDraft(value: unknown): ModelGatewaySecretPolicyDraft {
  const policy = isRecord(value) ? value : {};

  return {
    policyOwner: stringField(policy.policyOwner),
    kmsBackedStorageApproved: policy.kmsBackedStorageApproved === true,
    rotationDays: numberField(policy.rotationDays),
    accessReviewCadence: isAccessReviewCadence(policy.accessReviewCadence) ? policy.accessReviewCadence : "none",
    providerAllowlistApproved: policy.providerAllowlistApproved === true,
    egressLoggingApproved: policy.egressLoggingApproved === true,
    incidentResponseRunbookApproved: policy.incidentResponseRunbookApproved === true,
    noClientSecretPersistence: policy.noClientSecretPersistence === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: stringField(policy.notes)
  };
}

function isAccessReviewCadence(value: unknown): value is ModelGatewaySecretPolicyAccessReviewCadence {
  return value === "none" || value === "monthly" || value === "quarterly" || value === "annual";
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberField(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function createModelGatewayRunNotFoundError() {
  return createApiErrorResponse({
    error: new Error("Model Gateway run not found."),
    code: "MODEL_GATEWAY_RUN_NOT_FOUND",
    fallbackMessage: "Model Gateway run not found.",
    recoveryAction: "Create a model run before lookup or verify the run ID."
  });
}
