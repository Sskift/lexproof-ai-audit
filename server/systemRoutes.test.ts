import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerSystemRoutes } from "./systemRoutes";

describe("System route module", () => {
  it("serves health metadata with explicit audit-prep boundaries", async () => {
    const server = Fastify({ logger: false });
    registerSystemRoutes(server);

    const response = await server.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
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
    });

    await server.close();
  });

  it("handles API preflight requests without creating workflow side effects", async () => {
    const server = Fastify({ logger: false });
    registerSystemRoutes(server);

    const response = await server.inject({ method: "OPTIONS", url: "/api/workspaces/workspace-1/evidence" });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");

    await server.close();
  });
});
