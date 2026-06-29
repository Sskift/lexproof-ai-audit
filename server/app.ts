import Fastify from "fastify";

export function buildServer() {
  const server = Fastify({ logger: false });

  server.get("/api/health", async () => ({
    status: "ok",
    service: "lexproof-secure-review-workspace-api",
    version: "lexproof-phase-2-backend-v1",
    capabilities: {
      modelGateway: "contract-only",
      evidenceVault: "metadata-hashing-ready",
      humanReview: "contract-only",
      auditLog: "contract-only"
    },
    notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
  }));

  return server;
}
