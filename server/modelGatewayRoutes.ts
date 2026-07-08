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
import { createModelGatewayRunRecoveryPacket } from "../src/lib/modelGatewayRunReceipt.js";
import type { ModelGatewayProviderPolicyModelConnectReceipt } from "../src/lib/modelGatewayProviderPolicy.js";
import type { ModelGatewaySecretPolicyAccessReviewCadence, ModelGatewaySecretPolicyDraft } from "../src/lib/modelGatewaySecretPolicy.js";

export type ModelGatewayRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

const MODEL_GATEWAY_SECRET_POLICY_NUMERIC_FIELD_ERROR =
  "Model Gateway secret policy numeric fields must be non-negative integers." as const;

export function registerModelGatewayRoutes(server: FastifyInstance, options: ModelGatewayRoutesOptions): void {
  const { repository } = options;

  server.get("/api/model-gateway/adapters", async () => listModelGatewayAdapters());
  server.get("/api/model-gateway/provider-policy", async () => createServerModelGatewayProviderPolicyReport());
  server.post<{ Body: ModelGatewayProviderPolicyRequestBody }>("/api/model-gateway/provider-policy", async (request, reply) => {
    try {
      const payload = parseModelGatewayProviderPolicyRequestBody(request.body);
      return createServerModelGatewayProviderPolicyReport(payload.modelConnectReceipt);
    } catch (error) {
      return reply.status(400).send(
        createApiErrorResponse({
          error,
          code: "MODEL_GATEWAY_PROVIDER_POLICY_INVALID_PAYLOAD",
          fallbackMessage: "Model Gateway provider policy payload could not be evaluated safely.",
          recoveryAction:
            "Send metadata-only Model Connect receipt JSON without provider credentials, private keys, raw KYC, personal data, or legal conclusions."
        })
      );
    }
  });
  server.post<{ Body: ModelGatewaySecretPolicyRequestBody }>("/api/model-gateway/secret-policy", async (request, reply) => {
    try {
      const payload = parseModelGatewaySecretPolicyRequestBody(request.body);
      return createServerModelGatewaySecretPolicyReport(toModelGatewaySecretPolicyDraft(payload.policy));
    } catch (error) {
      return reply.status(400).send(
        createApiErrorResponse({
          error:
            error instanceof Error && isModelGatewaySecretPolicySafePayloadError(error.message)
              ? error
              : new Error("Model Gateway secret policy payload could not be evaluated safely."),
          code: "MODEL_GATEWAY_SECRET_POLICY_INVALID_PAYLOAD",
          fallbackMessage: "Model Gateway secret policy payload could not be evaluated safely.",
          recoveryAction:
            "Send metadata-only Model Gateway secret policy JSON with non-negative integer numeric fields and without provider credentials, private keys, raw KYC, personal data, or legal conclusions."
        })
      );
    }
  });

  server.post<{ Params: { workspaceId: string }; Body: ModelGatewayRequestBody }>(
    "/api/workspaces/:workspaceId/model-runs",
    async (request, reply) => {
      let payload: ParsedModelGatewayRequestBody;

      try {
        payload = parseModelGatewayRunRequestBody(request.body);
      } catch (error) {
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "MODEL_GATEWAY_INVALID_PAYLOAD",
            fallbackMessage: "Model Gateway run payload could not be evaluated safely.",
            recoveryAction:
              "Send metadata-only Model Gateway run JSON with a supported provider, clean redaction status, explicit booleans, safe allowed data classes, human review owner, and no credentials, private keys, raw KYC, personal data, or legal conclusions."
          })
        );
      }

      const result = createModelGatewayRun({
        workspaceId: request.params.workspaceId,
        provider: payload.provider,
        model: payload.model,
        purpose: payload.purpose,
        redactionStatus: payload.redactionStatus,
        includesCredentialMaterial: payload.includesCredentialMaterial,
        includesRawKycOrPersonalData: payload.includesRawKycOrPersonalData,
        humanReviewOwner: payload.humanReviewOwner,
        allowedDataClasses: payload.allowedDataClasses,
        payload: payload.payload
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
        reviewerId: payload.humanReviewOwner,
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

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/model-runs/recovery", async (request) =>
    createModelGatewayRunRecoveryPacket(
      request.params.workspaceId,
      await repository.listModelGatewayRuns(request.params.workspaceId)
    )
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

type ModelGatewayRequestBody = unknown;

type ParsedModelGatewayRequestBody = {
  provider: "mock" | "openai-compatible" | "enterprise-proxy";
  model: string;
  purpose: string;
  redactionStatus: "clean" | "needs-review" | "blocked";
  includesCredentialMaterial: boolean;
  includesRawKycOrPersonalData: boolean;
  humanReviewOwner: string;
  allowedDataClasses: string[];
  payload: unknown;
};

type ModelGatewayProviderPolicyRequestBody = unknown;

type ParsedModelGatewayProviderPolicyRequestBody = {
  modelConnectReceipt: ModelGatewayProviderPolicyModelConnectReceipt;
};

type ModelGatewaySecretPolicyRequestBody = unknown;

type ParsedModelGatewaySecretPolicyRequestBody = {
  policy: Record<string, unknown>;
};

function parseModelGatewayProviderPolicyRequestBody(value: unknown): ParsedModelGatewayProviderPolicyRequestBody {
  if (!isRecord(value)) {
    throw new Error("Model Gateway provider policy payload must be a JSON object.");
  }

  const modelConnectReceipt = toModelGatewayProviderPolicyReceipt(value.modelConnectReceipt);
  if (!modelConnectReceipt) {
    throw new Error("Model Gateway provider policy Model Connect receipt must be a metadata-only JSON object.");
  }

  return { modelConnectReceipt };
}

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

function parseModelGatewayRunRequestBody(value: unknown): ParsedModelGatewayRequestBody {
  if (!isRecord(value)) {
    throw new Error("Model Gateway run payload must be a JSON object.");
  }

  return {
    provider: modelGatewayProviderField(value.provider),
    model: stringField(value.model, "Model Gateway model must be a string."),
    purpose: stringField(value.purpose, "Model Gateway purpose must be a string."),
    redactionStatus: modelGatewayRedactionStatusField(value.redactionStatus),
    includesCredentialMaterial: booleanField(
      value.includesCredentialMaterial,
      "Model Gateway credential material flag must be a boolean."
    ),
    includesRawKycOrPersonalData: booleanField(
      value.includesRawKycOrPersonalData,
      "Model Gateway raw KYC or personal data flag must be a boolean."
    ),
    humanReviewOwner: stringField(value.humanReviewOwner, "Model Gateway human review owner must be a string."),
    allowedDataClasses: stringArrayField(value.allowedDataClasses, "Model Gateway allowed data classes must be an array of strings."),
    payload: jsonPayloadField(value.payload)
  };
}

function modelGatewayProviderField(value: unknown): ParsedModelGatewayRequestBody["provider"] {
  if (value === "mock" || value === "openai-compatible" || value === "enterprise-proxy") {
    return value;
  }

  throw new Error("Model Gateway provider must be mock, openai-compatible, or enterprise-proxy.");
}

function modelGatewayRedactionStatusField(value: unknown): ParsedModelGatewayRequestBody["redactionStatus"] {
  if (value === "clean" || value === "needs-review" || value === "blocked") {
    return value;
  }

  throw new Error("Model Gateway redaction status must be clean, needs-review, or blocked.");
}

function booleanField(value: unknown, message: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  throw new Error(message);
}

function stringArrayField(value: unknown, message: string): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  throw new Error(message);
}

function jsonPayloadField(value: unknown): unknown {
  if (value !== undefined) {
    return value;
  }

  throw new Error("Model Gateway metadata payload is required.");
}

function parseModelGatewaySecretPolicyRequestBody(value: unknown): ParsedModelGatewaySecretPolicyRequestBody {
  if (!isRecord(value)) {
    throw new Error("Model Gateway secret policy payload must be a JSON object.");
  }

  if (!isRecord(value.policy)) {
    throw new Error("Model Gateway secret policy draft must be a JSON object.");
  }

  return { policy: value.policy };
}

function isModelGatewaySecretPolicySafePayloadError(message: string): boolean {
  return (
    message === MODEL_GATEWAY_SECRET_POLICY_NUMERIC_FIELD_ERROR ||
    message === "Model Gateway secret policy payload must be a JSON object." ||
    message === "Model Gateway secret policy draft must be a JSON object."
  );
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

function stringField(value: unknown, invalidMessage?: string): string {
  if (typeof value === "string") {
    return value;
  }

  if (invalidMessage) {
    throw new Error(invalidMessage);
  }

  return "";
}

function numberField(value: unknown): number {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  throw new Error(MODEL_GATEWAY_SECRET_POLICY_NUMERIC_FIELD_ERROR);
}

function createModelGatewayRunNotFoundError() {
  return createApiErrorResponse({
    error: new Error("Model Gateway run not found."),
    code: "MODEL_GATEWAY_RUN_NOT_FOUND",
    fallbackMessage: "Model Gateway run not found.",
    recoveryAction: "Create a model run before lookup or verify the run ID."
  });
}
