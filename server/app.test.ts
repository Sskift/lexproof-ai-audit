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
        modelGateway: "mock-run-ready",
        evidenceVault: "metadata-hashing-ready",
        humanReview: "in-memory-ready",
        auditLog: "contract-only"
      },
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
  });

  it("creates model gateway mock run receipts without returning raw payload or credentials", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-1/model-runs",
      payload: {
        provider: "mock",
        model: "lexproof-mock",
        purpose: "Draft audit preparation issue spotting for counsel review.",
        redactionStatus: "clean",
        humanReviewOwner: "Compliance",
        includesCredentialMaterial: false,
        includesRawKycOrPersonalData: false,
        payload: {
          projectName: "YieldPassport",
          privatePromptText: "raw model prompt should not be returned"
        }
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-model-gateway-run-v1",
        id: expect.stringMatching(/^model-gateway-run-[a-f0-9]{16}$/),
        workspaceId: "workspace-1",
        provider: "mock",
        providerLabel: "Mock local reviewer gateway",
        model: "lexproof-mock",
        status: "completed",
        redactionStatus: "clean",
        humanReviewStatus: "needs-review",
        payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        responseHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
      })
    );
    expect(response.body).not.toContain("raw model prompt should not be returned");
    expect(response.body.toLowerCase()).not.toContain("api_key");

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/model-runs" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toHaveLength(1);
    expect(listResponse.json()[0]).toEqual(
      expect.objectContaining({
        providerLabel: "Mock local reviewer gateway",
        requiresHumanReview: true
      })
    );

    await server.close();
  });

  it("blocks model gateway route requests that fail redaction or human-review boundaries", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-1/model-runs",
      payload: {
        provider: "openai-compatible",
        model: "gpt-4.1-mini",
        purpose: "Make final legal decision for launch approval.",
        redactionStatus: "blocked",
        humanReviewOwner: "",
        includesCredentialMaterial: true,
        includesRawKycOrPersonalData: true,
        payload: { projectName: "YieldPassport" }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "Model Gateway boundary failed.",
      errors: [
        "Model Gateway request must pass the Redaction Gate before provider calls.",
        "Model Gateway requests must not include API keys, private keys, or credential material.",
        "Raw KYC or personal data cannot be sent through the Model Gateway draft.",
        "Model Gateway purpose cannot request final legal decisions.",
        "Human review owner is required before external reliance on model output."
      ],
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
  });

  it("creates, updates, and lists human review records", async () => {
    const server = buildServer();

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-1/reviews",
      payload: {
        targetType: "model-run",
        targetId: "model-run-1",
        reviewerId: "counsel-1",
        comment: "Review AI draft before counsel pack export."
      }
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();
    expect(created).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-human-review-record-v1",
        id: expect.stringMatching(/^human-review-[a-f0-9]{16}$/),
        workspaceId: "workspace-1",
        targetType: "model-run",
        targetId: "model-run-1",
        reviewerId: "counsel-1",
        status: "requested",
        comment: "Review AI draft before counsel pack export.",
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      })
    );

    const patchResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-1/reviews/${created.id}`,
      payload: {
        status: "reviewed",
        comment: "Reviewed for audit-prep handoff."
      }
    });

    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.json()).toEqual(
      expect.objectContaining({
        id: created.id,
        status: "reviewed",
        comment: "Reviewed for audit-prep handoff."
      })
    );

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/reviews" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toHaveLength(1);
    expect(listResponse.json()[0]).toEqual(expect.objectContaining({ id: created.id, status: "reviewed" }));

    await server.close();
  });
});
