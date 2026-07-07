import type { FastifyInstance } from "fastify";
import { createCounselPackExportRecord } from "./counselPackExportService.js";
import { createApiErrorResponse } from "./apiError.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { createAuditLogRecord, type CounselPackExportRecord } from "../src/lib/phase2Types.js";

export type CounselPackExportRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerCounselPackExportRoutes(server: FastifyInstance, options: CounselPackExportRoutesOptions): void {
  const { repository } = options;

  server.post<{ Params: { workspaceId: string }; Body: CounselPackExportRequestBody }>(
    "/api/workspaces/:workspaceId/exports/counsel-pack",
    async (request, reply) => {
      try {
        const existingExports = await repository.listCounselPackExportRecords(request.params.workspaceId);
        const record = createCounselPackExportRecord({
          workspaceId: request.params.workspaceId,
          projectName: request.body.projectName,
          title: request.body.title,
          format: request.body.format,
          version: existingExports.length + 1,
          artifactName: request.body.artifactName,
          manifestHash: request.body.manifestHash,
          artifactHash: request.body.artifactHash,
          artifactSize: request.body.artifactSize,
          riskLevel: request.body.riskLevel,
          reviewSummary: request.body.reviewSummary,
          sourceCount: request.body.sourceCount,
          sourcePackHash: request.body.sourcePackHash,
          sourceReviewStatus: request.body.sourceReviewStatus,
          jurisdictionReadinessDigest: request.body.jurisdictionReadinessDigest,
          createdBy: request.body.createdBy,
          includesRawKycOrPersonalData: request.body.includesRawKycOrPersonalData,
          includesCredentialMaterial: request.body.includesCredentialMaterial,
          rawMarkdown: request.body.rawMarkdown,
          rawContent: request.body.rawContent,
          content: request.body.content
        });

        await repository.saveCounselPackExportRecord(record);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: record.createdBy,
            action: "export.counsel-pack.created",
            targetType: "export",
            targetId: record.id,
            beforeHash: "",
            afterHash: record.artifactHash,
            summary: "Created Counsel Pack export metadata record.",
            createdAt: record.createdAt
          })
        );

        return reply.status(201).send(record);
      } catch (error) {
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "COUNSEL_PACK_EXPORT_CREATE_FAILED",
            fallbackMessage: "Counsel Pack export record creation failed.",
            recoveryAction: "Remove raw content and blocked data classes, then retry with manifest and artifact hashes only."
          })
        );
      }
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/exports", async (request) =>
    repository.listCounselPackExportRecords(request.params.workspaceId)
  );

  server.get<{ Params: { workspaceId: string; exportId: string } }>(
    "/api/workspaces/:workspaceId/exports/:exportId",
    async (request, reply) => {
      const record = await repository.findCounselPackExportRecord(request.params.workspaceId, request.params.exportId);
      if (!record) {
        return reply.status(404).send(createCounselPackExportNotFoundError());
      }
      return record;
    }
  );
}

type CounselPackExportRequestBody = {
  projectName: string;
  title: string;
  format: CounselPackExportRecord["format"];
  artifactName: string;
  manifestHash: string;
  artifactHash: string;
  artifactSize: number;
  riskLevel: CounselPackExportRecord["riskLevel"];
  reviewSummary: CounselPackExportRecord["reviewSummary"];
  sourceCount: number;
  sourcePackHash: string;
  sourceReviewStatus: CounselPackExportRecord["sourceReviewStatus"];
  jurisdictionReadinessDigest?: CounselPackExportRecord["jurisdictionReadinessDigest"];
  createdBy: string;
  includesRawKycOrPersonalData: boolean;
  includesCredentialMaterial: boolean;
  rawMarkdown?: string;
  rawContent?: string;
  content?: string;
};

function createCounselPackExportNotFoundError() {
  return createApiErrorResponse({
    error: new Error("Counsel Pack export record not found."),
    code: "COUNSEL_PACK_EXPORT_NOT_FOUND",
    fallbackMessage: "Counsel Pack export record not found.",
    recoveryAction: "Create a Counsel Pack export record before lookup or verify the export ID."
  });
}
