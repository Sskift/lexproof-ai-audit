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

  it("serves a metadata-only API preflight artifact for demo readiness", async () => {
    const server = Fastify({ logger: false });
    registerSystemRoutes(server);

    const response = await server.inject({ method: "GET", url: "/api/preflight" });
    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-api-preflight-v1",
        status: "ready",
        service: "lexproof-secure-review-workspace-api",
        version: "lexproof-phase-2-backend-v1",
        externalSideEffectsAllowed: false,
        reportHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. API preflight reports are audit preparation readiness metadata only."
      })
    );
    expect(payload.routeFamilies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "model-gateway-provider-policy", path: "/api/model-gateway/provider-policy" }),
        expect.objectContaining({
          id: "model-gateway-run-ledger",
          path: "/api/workspaces/:workspaceId/model-runs"
        }),
        expect.objectContaining({
          id: "model-gateway-run-recovery",
          path: "/api/workspaces/:workspaceId/model-runs/recovery"
        }),
        expect.objectContaining({ id: "evidence-vault-manifest", path: "/api/workspaces/:workspaceId/evidence-manifest" }),
        expect.objectContaining({
          id: "evidence-vault-lineage-digest",
          path: "/api/workspaces/:workspaceId/evidence-lineage-digest"
        }),
        expect.objectContaining({
          id: "evidence-vault-lineage-recovery",
          path: "/api/workspaces/:workspaceId/evidence-lineage-recovery"
        }),
        expect.objectContaining({ id: "human-review-queue", path: "/api/workspaces/:workspaceId/reviews/queue" }),
        expect.objectContaining({ id: "source-review-ledger", path: "/api/workspaces/:workspaceId/source-reviews" }),
        expect.objectContaining({ id: "source-review-packet", path: "/api/workspaces/:workspaceId/source-reviews/packet" }),
        expect.objectContaining({ id: "source-approval-queue", path: "/api/workspaces/:workspaceId/source-approvals" }),
        expect.objectContaining({ id: "source-approval-packet", path: "/api/workspaces/:workspaceId/source-approvals/packet" }),
        expect.objectContaining({
          id: "counsel-pack-export-recovery",
          path: "/api/workspaces/:workspaceId/exports/counsel-pack/recovery"
        }),
        expect.objectContaining({ id: "audit-log-export", path: "/api/workspaces/:workspaceId/audit-log/export" }),
        expect.objectContaining({ id: "integration-policy-evaluations" }),
        expect.objectContaining({
          id: "integration-policy-receipt-bundle",
          path: "/api/workspaces/:workspaceId/integration-policy-evaluations/bundle"
        }),
        expect.objectContaining({
          id: "integration-policy-receipt-recovery",
          path: "/api/workspaces/:workspaceId/integration-policy-evaluations/recovery"
        })
      ])
    );
    expect(payload.routeFamilyCount).toBe(19);
    expect(payload.implementedRoutes).toEqual(expect.arrayContaining([expect.objectContaining({ path: "/api/preflight" })]));
    expect(JSON.stringify(payload)).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);

    await server.close();
  });
});
