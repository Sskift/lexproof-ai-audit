import type { FastifyInstance } from "fastify";
import { createEvidenceVaultManifest } from "../src/lib/evidenceVaultManifest.js";
import { createEvidenceVaultLineageDigest } from "../src/lib/evidenceVaultLineageDigest.js";
import { createEvidenceVaultLineageRecoveryPacket } from "../src/lib/evidenceVaultLineageRecoveryPacket.js";
import { validateEvidenceVaultStatusTransition } from "../src/lib/evidenceVaultWorkflow.js";
import { redactClassifiedText } from "../src/lib/dataClassification.js";
import { validateEvidenceMetadataBoundary } from "../src/lib/evidenceUploadBoundary.js";
import { createAuditLogRecord, type EvidenceVaultRecord } from "../src/lib/phase2Types.js";
import {
  createEvidenceVaultRecordFromUpload,
  findDuplicateEvidenceVaultRecord,
  supersedeEvidenceVaultRecord
} from "./evidenceVaultService.js";
import { createApiErrorResponse } from "./apiError.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { sha256Hex, stableStringify } from "./routeHash.js";

export type EvidenceVaultRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerEvidenceVaultRoutes(server: FastifyInstance, options: EvidenceVaultRoutesOptions): void {
  const { repository } = options;

  server.post<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence", async (request, reply) => {
    try {
      const upload = await readMultipartFile(request, "Evidence upload must use multipart/form-data.");

      if (!upload) {
        return reply.status(400).send(createEvidenceFileRequiredError());
      }

      const bytes = new Uint8Array(await upload.toBuffer());
      const evidence = createEvidenceVaultRecordFromUpload({
        workspaceId: request.params.workspaceId,
        filename: upload.filename,
        mimeType: upload.mimetype,
        bytes,
        owner: getMultipartFieldValue(upload, "owner", "Unassigned"),
        sourceNote: getMultipartFieldValue(upload, "sourceNote", ""),
        linkedRiskFlagIds: parseCsv(getMultipartFieldValue(upload, "linkedRiskFlagIds", "")),
        linkedControlIds: parseCsv(getMultipartFieldValue(upload, "linkedControlIds", "")),
        containsRawKycOrPersonalData: parseBooleanField(getMultipartFieldValue(upload, "containsRawKycOrPersonalData", "false"))
      });
      const duplicate = findDuplicateEvidenceVaultRecord(await repository.listEvidenceVaultRecords(request.params.workspaceId), evidence);

      if (duplicate) {
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: evidence.owner,
            action: "evidence.duplicate.blocked",
            targetType: "evidence",
            targetId: duplicate.id,
            beforeHash: duplicate.fileHash,
            afterHash: evidence.fileHash,
            summary: "Blocked duplicate evidence hash before storing a second vault record.",
            createdAt: new Date().toISOString()
          })
        );
        return reply.status(409).send({
          ...createApiErrorResponse({
            error: new Error("Duplicate evidence hash already exists in this workspace."),
            code: "EVIDENCE_DUPLICATE_HASH",
            fallbackMessage: "Duplicate evidence hash already exists in this workspace.",
            recoveryAction: "Use the existing record, update its status, or upload a replacement with a changed metadata hash."
          }),
          duplicateEvidenceId: duplicate.id,
          duplicateStatus: duplicate.status
        });
      }

      await repository.saveEvidenceVaultRecord(evidence);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: request.params.workspaceId,
          actorId: evidence.owner,
          action: "evidence.created",
          targetType: "evidence",
          targetId: evidence.id,
          beforeHash: "",
          afterHash: evidence.fileHash,
          summary: "Uploaded evidence metadata into the Phase 2 evidence vault.",
          createdAt: evidence.createdAt
        })
      );
      return reply.status(201).send(evidence);
    } catch (error) {
      return reply.status(400).send(
        createApiErrorResponse({
          error,
          code: "EVIDENCE_UPLOAD_FAILED",
          fallbackMessage: "Evidence upload failed.",
          recoveryAction: "Retry with a multipart evidence file and metadata-only fields."
        })
      );
    }
  });

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence", async (request) =>
    repository.listEvidenceVaultRecords(request.params.workspaceId)
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence-manifest", async (request) => {
    const records = await repository.listEvidenceVaultRecords(request.params.workspaceId);
    return createEvidenceVaultManifest({ workspaceId: request.params.workspaceId, records });
  });

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence-lineage-digest", async (request) => {
    const records = await repository.listEvidenceVaultRecords(request.params.workspaceId);
    const manifest = await createEvidenceVaultManifest({ workspaceId: request.params.workspaceId, records });
    return createEvidenceVaultLineageDigest({
      workspaceId: request.params.workspaceId,
      records,
      manifest
    });
  });

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence-lineage-recovery", async (request) => {
    const records = await repository.listEvidenceVaultRecords(request.params.workspaceId);
    const manifest = await createEvidenceVaultManifest({ workspaceId: request.params.workspaceId, records });
    return createEvidenceVaultLineageRecoveryPacket({
      workspaceId: request.params.workspaceId,
      records,
      manifest
    });
  });

  server.patch<{ Params: { workspaceId: string; evidenceId: string }; Body: UpdateEvidenceRequestBody }>(
    "/api/workspaces/:workspaceId/evidence/:evidenceId",
    async (request, reply) => {
      const existing = await repository.findEvidenceVaultRecord(request.params.workspaceId, request.params.evidenceId);

      if (!existing) {
        return reply.status(404).send(createEvidenceNotFoundError("Upload the evidence record before updating it or verify the evidence ID."));
      }

      try {
        const payload = parseUpdateEvidenceRequestBody(request.body);
        const nextStatus = payload.status ?? existing.status;
        assertEvidenceVaultStatus(nextStatus);
        const transition = validateEvidenceVaultStatusTransition(existing.status, nextStatus);

        if (!transition.valid) {
          return reply.status(409).send(createEvidenceStatusTransitionError(transition));
        }

        const updated = updateEvidenceVaultRecord(existing, payload);
        await repository.updateEvidenceVaultRecord(updated);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: updated.owner,
            action: "evidence.updated",
            targetType: "evidence",
            targetId: updated.id,
            beforeHash: sha256Hex(stableStringify(existing)),
            afterHash: sha256Hex(stableStringify(updated)),
            summary: `Updated evidence status to ${updated.status}.`,
            createdAt: updated.updatedAt
          })
        );
        return updated;
      } catch (error) {
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "EVIDENCE_UPDATE_FAILED",
            fallbackMessage: "Evidence update failed.",
            recoveryAction: "Use a supported Evidence Vault status and keep review decisions as audit-prep workflow metadata."
          })
        );
      }
    }
  );

  server.post<{ Params: { workspaceId: string; evidenceId: string } }>(
    "/api/workspaces/:workspaceId/evidence/:evidenceId/replacement",
    async (request, reply) => {
      const existing = await repository.findEvidenceVaultRecord(request.params.workspaceId, request.params.evidenceId);

      if (!existing) {
        return reply.status(404).send(createEvidenceNotFoundError("Upload the evidence record before replacing it or verify the evidence ID."));
      }

      if (existing.status !== "rejected") {
        return reply.status(400).send(
          createApiErrorResponse({
            error: new Error("Only rejected evidence vault records can be replaced from this recovery flow."),
            code: "EVIDENCE_REPLACEMENT_NOT_ALLOWED",
            fallbackMessage: "Only rejected evidence vault records can be replaced from this recovery flow.",
            recoveryAction: "Mark the record rejected after review, or update the existing record status instead."
          })
        );
      }

      try {
        const upload = await readMultipartFile(request, "Evidence replacement upload must use multipart/form-data.");

        if (!upload) {
          return reply.status(400).send(createReplacementEvidenceFileRequiredError());
        }

        const replacementReason = getMultipartFieldValue(upload, "replacementReason", "").trim();

        if (!replacementReason) {
          return reply.status(400).send(
            createApiErrorResponse({
              error: new Error("Replacement reason is required."),
              code: "EVIDENCE_REPLACEMENT_REASON_REQUIRED",
              fallbackMessage: "Replacement reason is required.",
              recoveryAction: "Add a replacement reason so rejected evidence lineage remains reviewable."
            })
          );
        }

        const bytes = new Uint8Array(await upload.toBuffer());
        const replacement = createEvidenceVaultRecordFromUpload({
          workspaceId: request.params.workspaceId,
          filename: upload.filename,
          mimeType: upload.mimetype,
          bytes,
          owner: getMultipartFieldValue(upload, "owner", existing.owner),
          sourceNote: getMultipartFieldValue(upload, "sourceNote", ""),
          linkedRiskFlagIds: parseCsv(getMultipartFieldValue(upload, "linkedRiskFlagIds", existing.linkedRiskFlagIds.join(","))),
          linkedControlIds: parseCsv(getMultipartFieldValue(upload, "linkedControlIds", existing.linkedControlIds.join(","))),
          containsRawKycOrPersonalData: parseBooleanField(getMultipartFieldValue(upload, "containsRawKycOrPersonalData", "false")),
          parentEvidenceId: existing.id,
          replacementReason,
          baseVersion: existing.version
        });
        const duplicate = findDuplicateEvidenceVaultRecord(await repository.listEvidenceVaultRecords(request.params.workspaceId), replacement);

        if (duplicate) {
          return reply.status(409).send({
            ...createApiErrorResponse({
              error: new Error(
                duplicate.id === existing.id
                  ? "Replacement evidence must use a new metadata hash from the rejected record."
                  : "Duplicate evidence hash already exists in this workspace."
              ),
              code: "EVIDENCE_REPLACEMENT_DUPLICATE_HASH",
              fallbackMessage: "Duplicate evidence hash already exists in this workspace.",
              recoveryAction: "Change the replacement evidence metadata or use the existing vault record."
            }),
            duplicateEvidenceId: duplicate.id,
            duplicateStatus: duplicate.status
          });
        }

        const superseded = supersedeEvidenceVaultRecord(existing, replacement, replacementReason);
        await repository.updateEvidenceVaultRecord(superseded);
        await repository.saveEvidenceVaultRecord(replacement);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: superseded.owner,
            action: "evidence.superseded",
            targetType: "evidence",
            targetId: superseded.id,
            beforeHash: sha256Hex(stableStringify(existing)),
            afterHash: sha256Hex(stableStringify(superseded)),
            summary: "Superseded rejected evidence after replacement upload.",
            createdAt: superseded.updatedAt
          })
        );
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: replacement.owner,
            action: "evidence.replacement.created",
            targetType: "evidence",
            targetId: replacement.id,
            beforeHash: existing.fileHash,
            afterHash: replacement.fileHash,
            summary: "Created replacement evidence metadata for rejected vault record.",
            createdAt: replacement.createdAt
          })
        );
        return reply.status(201).send({
          superseded,
          replacement,
          notLegalAdviceBoundary: "Not legal advice. Evidence replacement records are audit preparation metadata only."
        });
      } catch (error) {
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "EVIDENCE_REPLACEMENT_FAILED",
            fallbackMessage: "Evidence replacement failed.",
            recoveryAction: "Retry with a replacement file, metadata-only fields, and a lineage reason."
          })
        );
      }
    }
  );
}

type UpdateEvidenceRequestBody = unknown;

type ParsedUpdateEvidenceRequestBody = {
  status?: EvidenceVaultRecord["status"];
  owner?: string;
  sourceNote?: string;
  linkedRiskFlagIds?: string[];
  linkedControlIds?: string[];
};

type MultipartField = {
  value?: unknown;
};

type MultipartUpload = {
  filename: string;
  mimetype: string;
  fields: Record<string, MultipartField | MultipartField[] | undefined>;
  toBuffer(): Promise<Buffer>;
};

function parseUpdateEvidenceRequestBody(value: unknown): ParsedUpdateEvidenceRequestBody {
  if (!isRecord(value)) {
    throw new Error("Evidence update payload must be a JSON object.");
  }

  return {
    status: optionalEvidenceVaultStatusField(value.status),
    owner: optionalStringField(value.owner, "Evidence owner must be a string."),
    sourceNote: optionalStringField(value.sourceNote, "Evidence source note must be a string."),
    linkedRiskFlagIds: optionalStringListField(
      value.linkedRiskFlagIds,
      "Evidence linked risk flag IDs must be strings or a comma-separated string."
    ),
    linkedControlIds: optionalStringListField(
      value.linkedControlIds,
      "Evidence linked control IDs must be strings or a comma-separated string."
    )
  };
}

function updateEvidenceVaultRecord(record: EvidenceVaultRecord, input: ParsedUpdateEvidenceRequestBody): EvidenceVaultRecord {
  const status = input.status ?? record.status;
  assertEvidenceVaultStatus(status);
  const linkedRiskFlagIds = normalizeRiskFlagIds(input.linkedRiskFlagIds) ?? record.linkedRiskFlagIds;
  const linkedControlIds = normalizeControlIds(input.linkedControlIds) ?? record.linkedControlIds;
  const rawOwner = input.owner === undefined ? record.owner : input.owner.trim() || record.owner;
  const rawSourceNote = input.sourceNote === undefined ? record.sourceNote : input.sourceNote.trim();
  const metadataBoundary = validateEvidenceMetadataBoundary({
    filename: record.filename,
    owner: rawOwner,
    sourceNote: rawSourceNote,
    linkedRiskFlagIds,
    linkedControlIds,
    replacementReason: record.replacementReason
  });

  if (!metadataBoundary.valid) {
    throw new Error(metadataBoundary.errors.join(" "));
  }

  return {
    ...record,
    status,
    owner: sanitizeVaultMetadata(rawOwner) || record.owner,
    sourceNote: sanitizeVaultMetadata(rawSourceNote),
    linkedRiskFlagIds,
    linkedControlIds,
    metadataBoundaryWarnings: metadataBoundary.warningFindings.length > 0 ? metadataBoundary.warningFindings : undefined,
    version: record.version + 1,
    updatedAt: new Date().toISOString()
  };
}

async function readMultipartFile(request: unknown, invalidMultipartMessage: string): Promise<MultipartUpload | undefined> {
  const fileRequest = request as { file?: () => Promise<MultipartUpload | undefined> };

  if (typeof fileRequest.file !== "function") {
    throw new Error(invalidMultipartMessage);
  }

  try {
    return await fileRequest.file();
  } catch {
    throw new Error(invalidMultipartMessage);
  }
}

function getMultipartFieldValue(upload: MultipartUpload, key: string, fallback: string): string {
  const field = upload.fields[key];
  const value = Array.isArray(field) ? field[0]?.value : field?.value;

  if (value === undefined || value === null) {
    return fallback;
  }

  return typeof value === "string" ? value : String(value);
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBooleanField(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

function optionalEvidenceVaultStatusField(value: unknown): EvidenceVaultRecord["status"] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("Evidence status must be draft, requested, received, submitted, under-review, verified, rejected, or superseded.");
  }

  assertEvidenceVaultStatus(value);
  return value;
}

function optionalStringField(value: unknown, message: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new Error(message);
}

function optionalStringListField(value: unknown, message: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    if (!value.every((item) => typeof item === "string")) {
      throw new Error(message);
    }

    return value;
  }

  if (typeof value === "string") {
    return parseCsv(value);
  }

  throw new Error(message);
}

function normalizeRiskFlagIds(value: ParsedUpdateEvidenceRequestBody["linkedRiskFlagIds"]): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return Array.from(new Set(value.map((item) => item.trim().toLowerCase()).filter(Boolean)));
}

function normalizeControlIds(value: ParsedUpdateEvidenceRequestBody["linkedControlIds"]): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

function sanitizeVaultMetadata(value: string): string {
  return redactClassifiedText(value.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertEvidenceVaultStatus(status: string): asserts status is EvidenceVaultRecord["status"] {
  if (!["draft", "requested", "received", "submitted", "under-review", "verified", "rejected", "superseded"].includes(status)) {
    throw new Error("Evidence status must be draft, requested, received, submitted, under-review, verified, rejected, or superseded.");
  }
}

function createEvidenceFileRequiredError() {
  return createApiErrorResponse({
    error: new Error("Evidence file is required."),
    code: "EVIDENCE_FILE_REQUIRED",
    fallbackMessage: "Evidence file is required.",
    recoveryAction: "Attach a metadata-only evidence file before uploading."
  });
}

function createReplacementEvidenceFileRequiredError() {
  return createApiErrorResponse({
    error: new Error("Replacement evidence file is required."),
    code: "EVIDENCE_REPLACEMENT_FILE_REQUIRED",
    fallbackMessage: "Replacement evidence file is required.",
    recoveryAction: "Attach a replacement file before creating rejected evidence lineage."
  });
}

function createEvidenceNotFoundError(recoveryAction: string) {
  return createApiErrorResponse({
    error: new Error("Evidence vault record not found."),
    code: "EVIDENCE_NOT_FOUND",
    fallbackMessage: "Evidence vault record not found.",
    recoveryAction
  });
}

function createEvidenceStatusTransitionError(transition: {
  error: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;
}) {
  return {
    ...createApiErrorResponse({
      error: new Error(transition.error),
      code: "EVIDENCE_STATUS_TRANSITION_BLOCKED",
      fallbackMessage: "Evidence status transition failed.",
      recoveryAction: transition.recoveryAction
    }),
    notLegalAdviceBoundary: transition.notLegalAdviceBoundary
  };
}
