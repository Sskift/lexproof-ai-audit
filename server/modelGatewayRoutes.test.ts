import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerModelGatewayRoutes } from "./modelGatewayRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

describe("model gateway route module", () => {
  it("exposes a metadata-only provider policy report from the server registry", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const policyResponse = await server.inject({ method: "GET", url: "/api/model-gateway/provider-policy" });

    expect(policyResponse.statusCode).toBe(200);
    expect(policyResponse.json()).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-model-gateway-provider-policy-v1",
        overallStatus: "needs-policy",
        enabledProviderCount: 1,
        deferredProviderCount: 2,
        notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
      })
    );
    expect(policyResponse.json().adapters).toEqual([
      expect.objectContaining({ provider: "mock", enabled: true, status: "ready", credentialPolicy: "no credentials accepted" }),
      expect.objectContaining({
        provider: "openai-compatible",
        enabled: false,
        status: "disabled",
        credentialPolicy: "deferred until server-side secret policy is approved"
      }),
      expect.objectContaining({ provider: "enterprise-proxy", enabled: false, status: "disabled" })
    ]);
    expect(policyResponse.json().controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "server-side-secret-policy", status: "needs-policy" }),
        expect.objectContaining({ id: "provider-allowlist", status: "needs-policy" }),
        expect.objectContaining({ id: "egress-logging", status: "needs-policy" })
      ])
    );
    expect(policyResponse.body).not.toContain("sk-live");
    expect(policyResponse.body).not.toContain("private key 0x");
    expect(policyResponse.body.toLowerCase()).not.toContain("legal opinion");
    expect(policyResponse.body.toLowerCase()).not.toContain("final legal decision");

    await server.close();
    await repository.close();
  });

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

  it("returns typed audit-prep errors for blocked runs and missing lookups", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const blockedResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-model-errors/model-runs",
      payload: {
        provider: "openai-compatible",
        model: "gpt-4.1-mini",
        purpose: "Make final legal decision for launch approval.",
        redactionStatus: "blocked",
        humanReviewOwner: "",
        includesCredentialMaterial: true,
        includesRawKycOrPersonalData: true,
        allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
        payload: { projectName: "YieldPassport" }
      }
    });

    expect(blockedResponse.statusCode).toBe(400);
    expect(blockedResponse.json()).toEqual(
      expect.objectContaining({
        error: "Model Gateway boundary failed.",
        code: "MODEL_GATEWAY_POLICY_BLOCKED",
        runId: expect.stringMatching(/^model-gateway-run-[a-f0-9]{16}$/),
        retryState: "blocked-until-remediated",
        recoveryAction: "Pass the Redaction Gate before creating a server Model Gateway run.",
        remediationSteps: expect.arrayContaining([
          "Pass the Redaction Gate before creating a server Model Gateway run.",
          "Remove API keys, private keys, credentials, raw KYC, and personal data from the request metadata."
        ]),
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );
    expect(blockedResponse.body.toLowerCase()).not.toContain("api_key");

    const missingResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-model-errors/model-runs/missing-run"
    });

    expect(missingResponse.statusCode).toBe(404);
    expect(missingResponse.json()).toEqual({
      error: "Model Gateway run not found.",
      code: "MODEL_GATEWAY_RUN_NOT_FOUND",
      recoveryAction: "Create a model run before lookup or verify the run ID.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
    await repository.close();
  });
});
