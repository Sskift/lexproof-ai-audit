import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { registerCounselPackExportRoutes } from "./counselPackExportRoutes.js";
import { registerHumanReviewRoutes } from "./humanReviewRoutes.js";
import { registerModelGatewayRoutes } from "./modelGatewayRoutes.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import { validateEvidenceVaultStatusTransition } from "../src/lib/evidenceVaultWorkflow.js";
import { createMemoryReviewWorkspaceRepository, type ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import {
  createAuditLogRecord,
  type EvidenceVaultRecord,
  type WorkspaceRecord
} from "../src/lib/phase2Types.js";
import {
  createEvidenceVaultRecordFromUpload,
  findDuplicateEvidenceVaultRecord,
  supersedeEvidenceVaultRecord
} from "./evidenceVaultService.js";

export type BuildServerOptions = {
  repository?: ReviewWorkspaceRepository;
};

export function buildServer(options: BuildServerOptions = {}) {
  const server = Fastify({ logger: false });
  const repository = options.repository ?? createMemoryReviewWorkspaceRepository();
  server.register(multipart);

  server.addHook("onRequest", async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", request.headers.origin ?? "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    reply.header("Vary", "Origin");
  });

  server.addHook("onClose", async () => {
    await repository.close();
  });

  server.options("/api/*", async (_request, reply) => reply.status(204).send());

  server.get("/api/health", async () => ({
    status: "ok",
    service: "lexproof-secure-review-workspace-api",
    version: "lexproof-phase-2-backend-v1",
    capabilities: {
      modelGateway: "mock-run-ready",
      evidenceVault: "metadata-versioning-ready",
      humanReview: "repository-ready",
      exports: "metadata-records-ready",
      auditLog: "repository-ready"
    },
    notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
  }));

  registerModelGatewayRoutes(server, { repository });
  registerCounselPackExportRoutes(server, { repository });
  registerHumanReviewRoutes(server, { repository });

  server.post<{ Body: CreateWorkspaceRequestBody }>("/api/workspaces", async (request, reply) => {
    try {
      const workspace = createWorkspaceRecord(request.body);
      await repository.saveWorkspaceRecord(workspace);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: workspace.id,
          actorId: workspace.ownerId,
          action: "workspace.created",
          targetType: "workspace",
          targetId: workspace.id,
          beforeHash: "",
          afterHash: sha256Hex(stableStringify(workspace)),
          summary: "Created secure review workspace.",
          createdAt: workspace.createdAt
        })
      );
      return reply.status(201).send(workspace);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Workspace creation failed.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
    }
  });

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId", async (request, reply) => {
    const workspace = await repository.findWorkspaceRecord(request.params.workspaceId);

    if (!workspace) {
      return reply.status(404).send({ error: "Workspace record not found." });
    }

    return workspace;
  });

  server.patch<{ Params: { workspaceId: string }; Body: UpdateWorkspaceRequestBody }>(
    "/api/workspaces/:workspaceId",
    async (request, reply) => {
      const existing = await repository.findWorkspaceRecord(request.params.workspaceId);

      if (!existing) {
        return reply.status(404).send({ error: "Workspace record not found." });
      }

      try {
        const updated = updateWorkspaceRecord(existing, request.body);
        await repository.updateWorkspaceRecord(updated);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: updated.id,
            actorId: updated.ownerId,
            action: "workspace.updated",
            targetType: "workspace",
            targetId: updated.id,
            beforeHash: sha256Hex(stableStringify(existing)),
            afterHash: sha256Hex(stableStringify(updated)),
            summary: `Updated workspace status to ${updated.status}.`,
            createdAt: updated.updatedAt
          })
        );
        return updated;
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Workspace update failed.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }
    }
  );

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

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/audit-log", async (request) =>
    repository.listAuditLogRecords(request.params.workspaceId)
  );

  return server;
}

type CreateWorkspaceRequestBody = {
  id?: string;
  name: string;
  organizationName: string;
  ownerId: string;
  status?: WorkspaceRecord["status"];
};

type UpdateWorkspaceRequestBody = {
  name?: string;
  organizationName?: string;
  ownerId?: string;
  status?: WorkspaceRecord["status"];
};

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

function createWorkspaceRecord(input: CreateWorkspaceRequestBody): WorkspaceRecord {
  const createdAt = new Date().toISOString();
  const name = input.name?.trim() ?? "";
  const organizationName = input.organizationName?.trim() ?? "";
  const ownerId = input.ownerId?.trim() ?? "";
  const status = input.status ?? "draft";

  if (!name) {
    throw new Error("Workspace name is required.");
  }

  if (!organizationName) {
    throw new Error("Workspace organization name is required.");
  }

  if (!ownerId) {
    throw new Error("Workspace owner ID is required.");
  }

  assertWorkspaceStatus(status);

  return {
    recordVersion: "lexproof-workspace-record-v1",
    id: input.id?.trim() || `workspace-${sha256Hex(stableStringify({ name, organizationName, ownerId, createdAt })).slice(0, 16)}`,
    name,
    organizationName,
    ownerId,
    status,
    createdAt,
    updatedAt: createdAt,
    notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
  };
}

function updateWorkspaceRecord(record: WorkspaceRecord, input: UpdateWorkspaceRequestBody): WorkspaceRecord {
  const status = input.status ?? record.status;
  assertWorkspaceStatus(status);

  return {
    ...record,
    name: input.name?.trim() || record.name,
    organizationName: input.organizationName?.trim() || record.organizationName,
    ownerId: input.ownerId?.trim() || record.ownerId,
    status,
    updatedAt: new Date().toISOString()
  };
}

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

function assertWorkspaceStatus(status: string): asserts status is WorkspaceRecord["status"] {
  if (!["draft", "active", "archived"].includes(status)) {
    throw new Error("Workspace status must be draft, active, or archived.");
  }
}

function assertEvidenceVaultStatus(status: string): asserts status is EvidenceVaultRecord["status"] {
  if (!["draft", "requested", "received", "submitted", "under-review", "verified", "rejected", "superseded"].includes(status)) {
    throw new Error("Evidence status must be draft, requested, received, submitted, under-review, verified, rejected, or superseded.");
  }
}
