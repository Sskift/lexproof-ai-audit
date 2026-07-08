import type { FastifyInstance } from "fastify";
import { createCounselPackExportRecord, type CreateCounselPackExportInput } from "./counselPackExportService.js";
import { createApiErrorResponse } from "./apiError.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import {
  createAuditLogRecord,
  type CounselPackExportJurisdictionReadinessDigest,
  type CounselPackExportRecord,
  type CounselPackExportReviewSummary
} from "../src/lib/phase2Types.js";
import { createCounselPackExportRecoveryPacket } from "../src/lib/counselPackExportRecordReceipt.js";

export type CounselPackExportRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerCounselPackExportRoutes(server: FastifyInstance, options: CounselPackExportRoutesOptions): void {
  const { repository } = options;

  server.post<{ Params: { workspaceId: string }; Body: CounselPackExportRequestBody }>(
    "/api/workspaces/:workspaceId/exports/counsel-pack",
    async (request, reply) => {
      try {
        const payload = parseCounselPackExportRequestBody(request.body);
        const existingExports = await repository.listCounselPackExportRecords(request.params.workspaceId);
        const record = createCounselPackExportRecord({
          workspaceId: request.params.workspaceId,
          projectName: payload.projectName,
          title: payload.title,
          format: payload.format,
          version: existingExports.length + 1,
          artifactName: payload.artifactName,
          manifestHash: payload.manifestHash,
          artifactHash: payload.artifactHash,
          artifactSize: payload.artifactSize,
          riskLevel: payload.riskLevel,
          reviewSummary: payload.reviewSummary,
          sourceCount: payload.sourceCount,
          sourcePackHash: payload.sourcePackHash,
          sourceReviewStatus: payload.sourceReviewStatus,
          jurisdictionReadinessDigest: payload.jurisdictionReadinessDigest,
          createdBy: payload.createdBy,
          includesRawKycOrPersonalData: payload.includesRawKycOrPersonalData,
          includesCredentialMaterial: payload.includesCredentialMaterial,
          rawMarkdown: payload.rawMarkdown,
          rawContent: payload.rawContent,
          content: payload.content
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

  server.get<{ Params: { workspaceId: string } }>(
    "/api/workspaces/:workspaceId/exports/counsel-pack/recovery",
    async (request) => {
      const records = await repository.listCounselPackExportRecords(request.params.workspaceId);
      return createCounselPackExportRecoveryPacket(request.params.workspaceId, records);
    }
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

type CounselPackExportRequestBody = unknown;

type ParsedCounselPackExportRequestBody = Omit<CreateCounselPackExportInput, "workspaceId" | "version" | "createdAt">;

function parseCounselPackExportRequestBody(value: unknown): ParsedCounselPackExportRequestBody {
  if (!isRecord(value)) {
    throw new Error("Counsel Pack export payload must be a JSON object.");
  }

  return {
    projectName: stringField(value.projectName, "Counsel Pack export project name must be a string."),
    title: stringField(value.title, "Counsel Pack export title must be a string."),
    format: exportFormatField(value.format),
    artifactName: stringField(value.artifactName, "Counsel Pack export artifact name must be a string."),
    manifestHash: stringField(value.manifestHash, "Counsel Pack export manifest hash must be a string."),
    artifactHash: stringField(value.artifactHash, "Counsel Pack export artifact hash must be a string."),
    artifactSize: nonNegativeIntegerField(value.artifactSize, "Counsel Pack export artifact size must be a non-negative integer."),
    riskLevel: riskLevelField(value.riskLevel),
    reviewSummary: reviewSummaryField(value.reviewSummary),
    sourceCount: nonNegativeIntegerField(value.sourceCount, "Counsel Pack export source count must be a non-negative integer."),
    sourcePackHash: stringField(value.sourcePackHash, "Counsel Pack export source pack hash must be a string."),
    sourceReviewStatus: sourceReviewStatusField(value.sourceReviewStatus),
    jurisdictionReadinessDigest: optionalJurisdictionReadinessDigestField(value.jurisdictionReadinessDigest),
    createdBy: stringField(value.createdBy, "Counsel Pack export creator must be a string."),
    includesRawKycOrPersonalData: booleanField(
      value.includesRawKycOrPersonalData,
      "Counsel Pack export raw KYC or personal data flag must be a boolean."
    ),
    includesCredentialMaterial: booleanField(
      value.includesCredentialMaterial,
      "Counsel Pack export credential material flag must be a boolean."
    ),
    rawMarkdown: optionalStringField(value.rawMarkdown, "Counsel Pack export raw Markdown field must be a string."),
    rawContent: optionalStringField(value.rawContent, "Counsel Pack export raw content field must be a string."),
    content: optionalStringField(value.content, "Counsel Pack export content field must be a string.")
  };
}

function reviewSummaryField(value: unknown): CounselPackExportReviewSummary {
  if (!isRecord(value)) {
    throw new Error("Counsel Pack export review summary must be a JSON object.");
  }

  return {
    total: nonNegativeIntegerField(value.total, "Counsel Pack export review summary total must be a non-negative integer."),
    reviewed: nonNegativeIntegerField(value.reviewed, "Counsel Pack export review summary reviewed count must be a non-negative integer."),
    readyForCounsel: nonNegativeIntegerField(
      value.readyForCounsel,
      "Counsel Pack export review summary ready for counsel count must be a non-negative integer."
    ),
    needsEvidence: nonNegativeIntegerField(
      value.needsEvidence,
      "Counsel Pack export review summary needs evidence count must be a non-negative integer."
    ),
    blocked: nonNegativeIntegerField(value.blocked, "Counsel Pack export review summary blocked count must be a non-negative integer."),
    open: nonNegativeIntegerField(value.open, "Counsel Pack export review summary open count must be a non-negative integer.")
  };
}

function optionalJurisdictionReadinessDigestField(value: unknown): CounselPackExportJurisdictionReadinessDigest | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error("Counsel Pack export jurisdiction readiness digest must be a JSON object.");
  }

  return {
    digestHash: stringField(value.digestHash, "Counsel Pack export jurisdiction readiness digest hash must be a string."),
    status: jurisdictionReadinessStatusField(value.status),
    handoffAllowed: booleanField(
      value.handoffAllowed,
      "Counsel Pack export jurisdiction readiness handoff flag must be a boolean."
    ),
    jurisdictionCount: nonNegativeIntegerField(
      value.jurisdictionCount,
      "Counsel Pack export jurisdiction readiness jurisdiction count must be a non-negative integer."
    ),
    readyForCounselCount: nonNegativeIntegerField(
      value.readyForCounselCount,
      "Counsel Pack export jurisdiction readiness ready for counsel count must be a non-negative integer."
    ),
    needsEvidenceCount: nonNegativeIntegerField(
      value.needsEvidenceCount,
      "Counsel Pack export jurisdiction readiness needs evidence count must be a non-negative integer."
    ),
    needsSourceReviewCount: nonNegativeIntegerField(
      value.needsSourceReviewCount,
      "Counsel Pack export jurisdiction readiness needs source review count must be a non-negative integer."
    ),
    metadataMissingCount: nonNegativeIntegerField(
      value.metadataMissingCount,
      "Counsel Pack export jurisdiction readiness metadata missing count must be a non-negative integer."
    ),
    openEvidenceRequestCount: nonNegativeIntegerField(
      value.openEvidenceRequestCount,
      "Counsel Pack export jurisdiction readiness open evidence request count must be a non-negative integer."
    ),
    sourceFreshnessBlockerCount: nonNegativeIntegerField(
      value.sourceFreshnessBlockerCount,
      "Counsel Pack export jurisdiction readiness source freshness blocker count must be a non-negative integer."
    ),
    dueSoonSourceCount: nonNegativeIntegerField(
      value.dueSoonSourceCount,
      "Counsel Pack export jurisdiction readiness due soon source count must be a non-negative integer."
    ),
    notLegalAdviceBoundary:
      "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
  };
}

function exportFormatField(value: unknown): CounselPackExportRecord["format"] {
  if (value === "markdown" || value === "print-pdf") {
    return value;
  }

  throw new Error("Counsel Pack export format must be markdown or print-pdf.");
}

function riskLevelField(value: unknown): CounselPackExportRecord["riskLevel"] {
  if (value === "low" || value === "moderate" || value === "high" || value === "critical") {
    return value;
  }

  throw new Error("Counsel Pack export risk level must be low, moderate, high, or critical.");
}

function sourceReviewStatusField(value: unknown): CounselPackExportRecord["sourceReviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }

  throw new Error("Counsel Pack export source review status must be current, review-due, or metadata-missing.");
}

function jurisdictionReadinessStatusField(value: unknown): CounselPackExportJurisdictionReadinessDigest["status"] {
  if (
    value === "ready-for-counsel" ||
    value === "needs-evidence" ||
    value === "needs-source-review" ||
    value === "metadata-missing" ||
    value === "no-jurisdictions"
  ) {
    return value;
  }

  throw new Error("Counsel Pack export jurisdiction readiness status is invalid.");
}

function nonNegativeIntegerField(value: unknown, message: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  throw new Error(message);
}

function booleanField(value: unknown, message: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  throw new Error(message);
}

function optionalStringField(value: unknown, message: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return stringField(value, message);
}

function stringField(value: unknown, message: string): string {
  if (typeof value === "string") {
    return value;
  }

  throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createCounselPackExportNotFoundError() {
  return createApiErrorResponse({
    error: new Error("Counsel Pack export record not found."),
    code: "COUNSEL_PACK_EXPORT_NOT_FOUND",
    fallbackMessage: "Counsel Pack export record not found.",
    recoveryAction: "Create a Counsel Pack export record before lookup or verify the export ID."
  });
}
