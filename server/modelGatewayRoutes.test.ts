import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerModelGatewayRoutes } from "./modelGatewayRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

describe("model gateway route module", () => {
  it("registers metadata-only adapter, run, lookup, and summary routes without raw payload leakage", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const adaptersResponse = await server.inject({ method: "GET", url: "/api/model-gateway/adapters" });
    expect(adaptersResponse.statusCode).toBe(200);
    expect(adaptersResponse.json()).toEqual([
      expect.objectContaining({ provider: "mock", enabled: true, credentialPolicy: "no credentials accepted" }),
      expect.objectContaining({ provider: "openai-compatible", enabled: false }),
      expect.objectContaining({ provider: "enterprise-proxy", enabled: false })
    ]);

    const runResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-model-routes/model-runs",
      payload: {
        provider: "mock",
        model: "lexproof-mock",
        purpose: "Draft audit preparation issue spotting for counsel review.",
        redactionStatus: "clean",
        humanReviewOwner: "Counsel",
        includesCredentialMaterial: false,
        includesRawKycOrPersonalData: false,
        allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
        payload: {
          projectName: "YieldPassport",
          privatePromptText: "raw model prompt should not leave the gateway"
        }
      }
    });

    expect(runResponse.statusCode).toBe(201);
    expect(runResponse.json()).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-model-gateway-run-v1",
        workspaceId: "workspace-model-routes",
        provider: "mock",
        status: "completed",
        humanReviewStatus: "needs-review",
        payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        responseHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
      })
    );
    expect(runResponse.body).not.toContain("raw model prompt should not leave the gateway");

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-model-routes/model-runs" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([
      expect.objectContaining({
        id: runResponse.json().id,
        humanReviewStatus: "needs-review",
        requiresHumanReview: true,
        boundary: "AI-assisted draft for audit preparation only. Not legal advice."
      })
    ]);

    const lookupResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-model-routes/model-runs/${runResponse.json().id}`
    });
    expect(lookupResponse.statusCode).toBe(200);
    expect(lookupResponse.json()).toEqual(expect.objectContaining({ id: runResponse.json().id }));

    expect(await repository.listAuditLogRecords("workspace-model-routes")).toEqual([
      expect.objectContaining({
        action: "model.run.created",
        targetType: "model-run",
        targetId: runResponse.json().id,
        summary: "Created mock model gateway run for audit preparation."
      })
    ]);

    await server.close();
    await repository.close();
  });
});
