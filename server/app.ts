import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { registerCounselPackExportRoutes } from "./counselPackExportRoutes.js";
import { registerEvidenceVaultRoutes } from "./evidenceVaultRoutes.js";
import { registerHumanReviewRoutes } from "./humanReviewRoutes.js";
import { registerModelGatewayRoutes } from "./modelGatewayRoutes.js";
import { sha256Hex, stableStringify } from "./routeHash.js";
import { createMemoryReviewWorkspaceRepository, type ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import { createAuditLogRecord, type WorkspaceRecord } from "../src/lib/phase2Types.js";

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
  registerEvidenceVaultRoutes(server, { repository });

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

function assertWorkspaceStatus(status: string): asserts status is WorkspaceRecord["status"] {
  if (!["draft", "active", "archived"].includes(status)) {
    throw new Error("Workspace status must be draft, active, or archived.");
  }
}
