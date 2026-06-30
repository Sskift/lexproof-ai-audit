import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { registerAuditLogRoutes } from "./auditLogRoutes.js";
import { registerCounselPackExportRoutes } from "./counselPackExportRoutes.js";
import { registerEvidenceVaultRoutes } from "./evidenceVaultRoutes.js";
import { registerHumanReviewRoutes } from "./humanReviewRoutes.js";
import { registerModelGatewayRoutes } from "./modelGatewayRoutes.js";
import { registerWorkspaceRoutes } from "./workspaceRoutes.js";
import { createMemoryReviewWorkspaceRepository, type ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";

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
  registerWorkspaceRoutes(server, { repository });
  registerAuditLogRoutes(server, { repository });

  return server;
}
