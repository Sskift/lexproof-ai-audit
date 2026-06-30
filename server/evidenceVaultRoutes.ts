import type { FastifyInstance } from "fastify";
import { validateEvidenceVaultStatusTransition } from "../src/lib/evidenceVaultWorkflow.js";
import { createAuditLogRecord, type EvidenceVaultRecord } from "../src/lib/phase2Types.js";
import {
  createEvidenceVaultRecordFromUpload,
  findDuplicateEvidenceVaultRecord,
  supersedeEvidenceVaultRecord
} from "./evidenceVaultService.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { sha256Hex, stableStringify } from "./routeHash.js";

export type EvidenceVaultRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerEvidenceVaultRoutes(server: FastifyInstance, options: EvidenceVaultRoutesOptions): void {
  const { repository } = options;

  server.post<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence", async (request, reply) => {
    try {
      const upload = await readMultipartFile(request);

      if (!upload) {
        return reply.status(400).send({ error: "Evidence file is required." });
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
          error: "Duplicate evidence hash already exists in this workspace.",
          duplicateEvidenceId: duplicate.id,
          duplicateStatus: duplicate.status,
          recoveryAction: "Use the existing record, update its status, or upload a replacement with a changed metadata hash.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
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
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Evidence upload failed.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
    }
  });

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence", async (request) =>
    repository.listEvidenceVaultRecords(request.params.workspaceId)
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence-manifest", async (request) => {
    const records = await repository.listEvidenceVaultRecords(request.params.workspaceId);
    const items = records.map((record, index) => ({
      sequence: index + 1,
      evidenceId: record.id,
      filename: record.filename,
      mimeType: record.mimeType,
      byteSize: record.byteSize,
      fileHash: record.fileHash,
      storageMode: record.storageMode,
      status: record.status,
      owner: record.owner,
      version: record.version,
      linkedRiskFlagIds: record.linkedRiskFlagIds,
      containsRawKycOrPersonalData: record.containsRawKycOrPersonalData,
      ...(record.parentEvidenceId ? { parentEvidenceId: record.parentEvidenceId } : {}),
      ...(record.supersededByEvidenceId ? { supersededByEvidenceId: record.supersededByEvidenceId } : {}),
      ...(record.replacementReason ? { replacementReason: record.replacementReason } : {})
    }));
    const hashPayload = {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: request.params.workspaceId,
      items
    };

    return {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: request.params.workspaceId,
      generatedAt: new Date().toISOString(),
      itemCount: records.length,
      items,
      bundleHash: sha256Hex(stableStringify(hashPayload)),
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
    };
  });

  server.patch<{ Params: { workspaceId: string; evidenceId: string }; Body: UpdateEvidenceRequestBody }>(
    "/api/workspaces/:workspaceId/evidence/:evidenceId",
    async (request, reply) => {
      const existing = await repository.findEvidenceVaultRecord(request.params.workspaceId, request.params.evidenceId);

      if (!existing) {
        return reply.status(404).send({ error: "Evidence vault record not found." });
      }

      try {
        const nextStatus = request.body.status ?? existing.status;
        assertEvidenceVaultStatus(nextStatus);
        const transition = validateEvidenceVaultStatusTransition(existing.status, nextStatus);

        if (!transition.valid) {
          return reply.status(409).send({
            error: transition.error,
            recoveryAction: transition.recoveryAction,
            notLegalAdviceBoundary: transition.notLegalAdviceBoundary
          });
        }

        const updated = updateEvidenceVaultRecord(existing, request.body);
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
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Evidence update failed.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }
    }
  );

  server.post<{ Params: { workspaceId: string; evidenceId: string } }>(
    "/api/workspaces/:workspaceId/evidence/:evidenceId/replacement",
    async (request, reply) => {
      const existing = await repository.findEvidenceVaultRecord(request.params.workspaceId, request.params.evidenceId);

      if (!existing) {
        return reply.status(404).send({ error: "Evidence vault record not found." });
      }

      if (existing.status !== "rejected") {
        return reply.status(400).send({
          error: "Only rejected evidence vault records can be replaced from this recovery flow.",
          recoveryAction: "Mark the record rejected after review, or update the existing record status instead.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }

      try {
        const upload = await readMultipartFile(request);

        if (!upload) {
          return reply.status(400).send({ error: "Replacement evidence file is required." });
        }

        const replacementReason = getMultipartFieldValue(upload, "replacementReason", "").trim();

        if (!replacementReason) {
          return reply.status(400).send({
            error: "Replacement reason is required.",
            notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
          });
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
          containsRawKycOrPersonalData: parseBooleanField(getMultipartFieldValue(upload, "containsRawKycOrPersonalData", "false")),
          parentEvidenceId: existing.id,
          replacementReason,
          baseVersion: existing.version
        });
        const duplicate = findDuplicateEvidenceVaultRecord(await repository.listEvidenceVaultRecords(request.params.workspaceId), replacement);

        if (duplicate) {
          return reply.status(409).send({
            error:
              duplicate.id === existing.id
                ? "Replacement evidence must use a new metadata hash from the rejected record."
                : "Duplicate evidence hash already exists in this workspace.",
            duplicateEvidenceId: duplicate.id,
            duplicateStatus: duplicate.status,
            recoveryAction: "Change the replacement evidence metadata or use the existing vault record.",
            notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
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
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Evidence replacement failed.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }
    }
  );
}

type UpdateEvidenceRequestBody = {
  status?: EvidenceVaultRecord["status"];
  owner?: string;
  sourceNote?: string;
  linkedRiskFlagIds?: string[] | string;
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

function updateEvidenceVaultRecord(record: EvidenceVaultRecord, input: UpdateEvidenceRequestBody): EvidenceVaultRecord {
  const status = input.status ?? record.status;
  assertEvidenceVaultStatus(status);

  return {
    ...record,
    status,
    owner: input.owner?.trim() || record.owner,
    sourceNote: input.sourceNote?.trim() ?? record.sourceNote,
    linkedRiskFlagIds: normalizeRiskFlagIds(input.linkedRiskFlagIds) ?? record.linkedRiskFlagIds,
    version: record.version + 1,
    updatedAt: new Date().toISOString()
  };
}

async function readMultipartFile(request: unknown): Promise<MultipartUpload | undefined> {
  const fileRequest = request as { file: () => Promise<MultipartUpload | undefined> };
  return fileRequest.file();
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

function normalizeRiskFlagIds(value: UpdateEvidenceRequestBody["linkedRiskFlagIds"]): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return parseCsv(value);
}

function assertEvidenceVaultStatus(status: string): asserts status is EvidenceVaultRecord["status"] {
  if (!["draft", "requested", "received", "submitted", "under-review", "verified", "rejected", "superseded"].includes(status)) {
    throw new Error("Evidence status must be draft, requested, received, submitted, under-review, verified, rejected, or superseded.");
  }
}
