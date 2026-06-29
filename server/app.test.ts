import { describe, expect, it } from "vitest";
import { buildServer } from "./app";

describe("Phase 2 backend app", () => {
  it("serves a no-op health endpoint with explicit audit-prep boundaries", async () => {
    const server = buildServer();

    const response = await server.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
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
    });

    await server.close();
  });
});
