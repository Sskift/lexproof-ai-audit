import type { FastifyInstance } from "fastify";
import { createApiPreflightReport, type ApiPreflightReport } from "../src/lib/apiPreflight.js";

export type HealthResponse = {
  status: "ok";
  service: "lexproof-secure-review-workspace-api";
  version: "lexproof-phase-2-backend-v1";
  capabilities: {
    modelGateway: "mock-run-ready";
    evidenceVault: "metadata-versioning-ready";
    humanReview: "repository-ready";
    exports: "metadata-records-ready";
    auditLog: "repository-ready";
  };
  notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only.";
};

export function registerSystemRoutes(server: FastifyInstance): void {
  server.options("/api/*", async (_request, reply) => reply.status(204).send());

  server.get("/api/health", async (): Promise<HealthResponse> => ({
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

  server.get("/api/preflight", async (): Promise<ApiPreflightReport> => createApiPreflightReport());
}
