import type { FastifyInstance } from "fastify";
import { createModelGatewayRun, listModelGatewayAdapters } from "./modelGatewayService.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import { createAuditLogRecord, createModelGatewayRunSummary } from "../src/lib/phase2Types.js";

export type ModelGatewayRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerModelGatewayRoutes(server: FastifyInstance, options: ModelGatewayRoutesOptions): void {
  const { repository } = options;

  server.get("/api/model-gateway/adapters", async () => listModelGatewayAdapters());

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
          error: "Model Gateway boundary failed.",
          errors: result.errors,
          runId: result.failureRun.id,
          retryState: result.failureRun.retryState,
          remediationSteps: result.failureRun.remediationSteps,
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
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
        return reply.status(404).send({ error: "Model Gateway run not found." });
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
