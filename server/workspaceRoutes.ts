import type { FastifyInstance } from "fastify";
import { createAuditLogRecord, type WorkspaceRecord } from "../src/lib/phase2Types.js";
import { classifyDataBoundaryText } from "../src/lib/dataClassification.js";
import { createApiErrorResponse } from "./apiError.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { sha256Hex, stableStringify } from "./routeHash.js";

export type WorkspaceRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerWorkspaceRoutes(server: FastifyInstance, options: WorkspaceRoutesOptions): void {
  const { repository } = options;

  server.post<{ Body: CreateWorkspaceRequestBody }>("/api/workspaces", async (request, reply) => {
    try {
      const payload = parseCreateWorkspaceRequestBody(request.body);
      const workspace = createWorkspaceRecord(payload);
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
      return reply.status(400).send(
        createApiErrorResponse({
          error,
          code: "WORKSPACE_CREATE_FAILED",
          fallbackMessage: "Workspace creation failed."
        })
      );
    }
  });

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId", async (request, reply) => {
    const workspace = await repository.findWorkspaceRecord(request.params.workspaceId);

    if (!workspace) {
      return reply.status(404).send(createWorkspaceNotFoundError());
    }

    return workspace;
  });

  server.patch<{ Params: { workspaceId: string }; Body: UpdateWorkspaceRequestBody }>(
    "/api/workspaces/:workspaceId",
    async (request, reply) => {
      const existing = await repository.findWorkspaceRecord(request.params.workspaceId);

      if (!existing) {
        return reply.status(404).send(createWorkspaceNotFoundError());
      }

      try {
        const payload = parseUpdateWorkspaceRequestBody(request.body);
        const updated = updateWorkspaceRecord(existing, payload);
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
        return reply.status(400).send(
          createApiErrorResponse({
            error,
            code: "WORKSPACE_UPDATE_FAILED",
            fallbackMessage: "Workspace update failed."
          })
        );
      }
    }
  );
}

type CreateWorkspaceRequestBody = unknown;

type ParsedCreateWorkspaceRequestBody = {
  id?: string;
  name: string;
  organizationName: string;
  ownerId: string;
  status?: WorkspaceRecord["status"];
};

type UpdateWorkspaceRequestBody = unknown;

type ParsedUpdateWorkspaceRequestBody = {
  name?: string;
  organizationName?: string;
  ownerId?: string;
  status?: WorkspaceRecord["status"];
};

type WorkspaceMetadataBoundaryInput = {
  id?: string;
  name?: string;
  organizationName?: string;
  ownerId?: string;
};

function parseCreateWorkspaceRequestBody(value: unknown): ParsedCreateWorkspaceRequestBody {
  if (!isRecord(value)) {
    throw new Error("Workspace creation payload must be a JSON object.");
  }

  const payload = {
    id: optionalStringField(value.id, "Workspace ID must be a string."),
    name: stringField(value.name, "Workspace name must be a string."),
    organizationName: stringField(value.organizationName, "Workspace organization name must be a string."),
    ownerId: stringField(value.ownerId, "Workspace owner ID must be a string."),
    status: optionalWorkspaceStatusField(value.status)
  };

  assertWorkspaceMetadataBoundary(payload);
  return payload;
}

function parseUpdateWorkspaceRequestBody(value: unknown): ParsedUpdateWorkspaceRequestBody {
  if (!isRecord(value)) {
    throw new Error("Workspace update payload must be a JSON object.");
  }

  const payload = {
    name: optionalStringField(value.name, "Workspace name must be a string."),
    organizationName: optionalStringField(value.organizationName, "Workspace organization name must be a string."),
    ownerId: optionalStringField(value.ownerId, "Workspace owner ID must be a string."),
    status: optionalWorkspaceStatusField(value.status)
  };

  assertWorkspaceMetadataBoundary(payload);
  return payload;
}

function createWorkspaceRecord(input: ParsedCreateWorkspaceRequestBody): WorkspaceRecord {
  const createdAt = new Date().toISOString();
  const name = input.name.trim();
  const organizationName = input.organizationName.trim();
  const ownerId = input.ownerId.trim();
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

function updateWorkspaceRecord(record: WorkspaceRecord, input: ParsedUpdateWorkspaceRequestBody): WorkspaceRecord {
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

function assertWorkspaceMetadataBoundary(input: WorkspaceMetadataBoundaryInput): void {
  const blockedClasses = new Set(
    [input.id, input.name, input.organizationName, input.ownerId]
      .filter((value): value is string => typeof value === "string")
      .flatMap((value) => classifyDataBoundaryText(value))
      .filter((finding) => finding.severity === "block")
      .map((finding) => finding.dataClass)
  );

  if (blockedClasses.size > 0) {
    throw new Error(`Workspace metadata must not include ${Array.from(blockedClasses).sort().join(", ")}.`);
  }
}

function optionalWorkspaceStatusField(value: unknown): WorkspaceRecord["status"] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("Workspace status must be draft, active, or archived.");
  }

  assertWorkspaceStatus(value);
  return value;
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

function assertWorkspaceStatus(status: string): asserts status is WorkspaceRecord["status"] {
  if (!["draft", "active", "archived"].includes(status)) {
    throw new Error("Workspace status must be draft, active, or archived.");
  }
}

function createWorkspaceNotFoundError() {
  return createApiErrorResponse({
    error: new Error("Workspace record not found."),
    code: "WORKSPACE_NOT_FOUND",
    fallbackMessage: "Workspace record not found.",
    recoveryAction: "Create the workspace before reading or updating it."
  });
}
