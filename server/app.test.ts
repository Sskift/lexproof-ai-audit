import { describe, expect, it } from "vitest";
import { buildServer } from "./app";
import type { HumanReviewRecord } from "../src/lib/phase2Types";

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
        evidenceVault: "metadata-versioning-ready",
        humanReview: "repository-ready",
        exports: "metadata-records-ready",
        auditLog: "repository-ready"
      },
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
  });

  it("supports local workbench CORS for Phase 2 API calls", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "OPTIONS",
      url: "/api/workspaces/workspace-1/evidence",
      headers: {
        origin: "http://127.0.0.1:5173"
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:5173");
    expect(response.headers["access-control-allow-methods"]).toBe("GET,POST,PATCH,OPTIONS");
    expect(response.headers["access-control-allow-headers"]).toContain("Content-Type");

    await server.close();
  });

  it("lists model gateway adapters without accepting credentials or enabling external providers", async () => {
    const server = buildServer();

    const response = await server.inject({ method: "GET", url: "/api/model-gateway/adapters" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      expect.objectContaining({
        provider: "mock",
        enabled: true,
        credentialPolicy: "no credentials accepted"
      }),
      expect.objectContaining({
        provider: "openai-compatible",
        enabled: false,
        credentialPolicy: "deferred until server-side secret policy is approved"
      }),
      expect.objectContaining({
        provider: "enterprise-proxy",
        enabled: false,
        credentialPolicy: "deferred until server-side secret policy is approved"
      })
    ]);
    expect(response.body.toLowerCase()).not.toContain("api_key");
    expect(response.body.toLowerCase()).not.toContain("private_key");

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
        allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
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
        sourceEvidenceHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        retryState: "not-needed",
        remediationSteps: [],
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

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/audit-log" });
    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json()).toEqual([
      expect.objectContaining({
        action: "model.run.created",
        targetType: "model-run",
        targetId: response.json().id,
        afterHash: response.json().responseHash,
        summary: "Created mock model gateway run for audit preparation."
      })
    ]);

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
        allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
        payload: { projectName: "YieldPassport" }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: "Model Gateway boundary failed.",
        errors: [
        "Model Gateway request must pass the Redaction Gate before provider calls.",
        "Model Gateway requests must not include API keys, private keys, or credential material.",
        "Raw KYC or personal data cannot be sent through the Model Gateway draft.",
        "Model Gateway purpose cannot request final legal decisions.",
        "Human review owner is required before external reliance on model output."
        ],
        runId: expect.stringMatching(/^model-gateway-run-[a-f0-9]{16}$/),
        retryState: "blocked-until-remediated",
        remediationSteps: expect.arrayContaining([
          "Pass the Redaction Gate before creating a server Model Gateway run.",
          "Remove API keys, private keys, credentials, raw KYC, and personal data from the request metadata."
        ]),
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );
    expect(response.body.toLowerCase()).not.toContain("api_key");

    const runsResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/model-runs" });
    expect(runsResponse.json()).toEqual([
      expect.objectContaining({
        status: "blocked",
        retryState: "blocked-until-remediated",
        requiresHumanReview: true
      })
    ]);

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/audit-log" });
    expect(auditResponse.json()).toEqual([
      expect.objectContaining({
        action: "model.run.blocked",
        targetType: "model-run",
        targetId: response.json().runId
      })
    ]);

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

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/audit-log" });
    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json()).toEqual([
      expect.objectContaining({
        action: "human-review.created",
        targetType: "human-review",
        targetId: created.id
      }),
      expect.objectContaining({
        action: "human-review.updated",
        targetType: "human-review",
        targetId: created.id,
        summary: "Updated human review status to reviewed."
      })
    ]);

    await server.close();
  });

  it("returns a filtered human review queue view with workflow summary", async () => {
    const server = buildServer();

    await createReviewRequest(server, {
      targetType: "model-run",
      targetId: "model-run-queue",
      reviewerId: "Compliance",
      comment: "Review model output before handoff."
    });
    const evidenceReview = await createReviewRequest(server, {
      targetType: "evidence",
      targetId: "evidence-queue",
      reviewerId: "Counsel",
      comment: "Need stronger evidence support."
    });
    const counselPackReview = await createReviewRequest(server, {
      targetType: "counsel-pack",
      targetId: "counsel-pack-v1",
      reviewerId: "Counsel",
      comment: "Review export readiness."
    });
    await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-queue/reviews/${evidenceReview.id}`,
      payload: {
        status: "needs-more-evidence",
        comment: "Evidence is not sufficient for counsel handoff."
      }
    });
    await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-queue/reviews/${counselPackReview.id}`,
      payload: {
        status: "reviewed",
        comment: "Reviewed as audit-prep packet, not legal approval."
      }
    });

    const queueResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-queue/reviews/queue?targetType=evidence&reviewerId=Counsel"
    });

    expect(queueResponse.statusCode).toBe(200);
    expect(queueResponse.json()).toEqual({
      queueVersion: "lexproof-server-human-review-queue-v1",
      workspaceId: "workspace-queue",
      filters: {
        targetType: "evidence",
        reviewerId: "Counsel"
      },
      totalCount: 1,
      openCount: 1,
      reviewedCount: 0,
      blockedCount: 0,
      targetTypeCounts: {
        evidence: 1
      },
      statusCounts: {
        "needs-more-evidence": 1
      },
      reviewerCounts: {
        Counsel: 1
      },
      nextActions: ["1 review item needs more evidence before counsel handoff."],
      items: [expect.objectContaining({ id: evidenceReview.id, targetType: "evidence", status: "needs-more-evidence" })],
      notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only."
    });
    expect(queueResponse.body.toLowerCase()).not.toContain("legal approval");

    await server.close();
  });

  it("syncs model-run human review decisions back to Model Gateway receipts", async () => {
    const server = buildServer();
    const modelRunResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-model-review/model-runs",
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
          issue: "Summarize model-run review status only."
        }
      }
    });
    expect(modelRunResponse.statusCode).toBe(201);
    expect(modelRunResponse.json()).toEqual(expect.objectContaining({ humanReviewStatus: "needs-review" }));

    const reviewResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-model-review/reviews",
      payload: {
        targetType: "model-run",
        targetId: modelRunResponse.json().id,
        reviewerId: "Counsel",
        comment: "Review model output before audit-prep reliance."
      }
    });
    expect(reviewResponse.statusCode).toBe(201);

    const reviewedResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-model-review/reviews/${reviewResponse.json().id}`,
      payload: {
        status: "reviewed",
        comment: "Reviewed for audit-prep reliance, not legal approval."
      }
    });
    expect(reviewedResponse.statusCode).toBe(200);

    const modelRunLookup = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-model-review/model-runs/${modelRunResponse.json().id}`
    });
    expect(modelRunLookup.statusCode).toBe(200);
    expect(modelRunLookup.json()).toEqual(expect.objectContaining({ id: modelRunResponse.json().id, humanReviewStatus: "reviewed" }));

    const modelRunList = await server.inject({ method: "GET", url: "/api/workspaces/workspace-model-review/model-runs" });
    expect(modelRunList.json()).toEqual([expect.objectContaining({ id: modelRunResponse.json().id, humanReviewStatus: "reviewed", requiresHumanReview: false })]);

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-model-review/audit-log" });
    expect(auditResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "human-review.updated", targetId: reviewResponse.json().id }),
        expect.objectContaining({
          action: "model.run.review-status.synced",
          targetType: "model-run",
          targetId: modelRunResponse.json().id,
          summary: "Human Review marked model run reviewed for audit-prep reliance."
        })
      ])
    );

    await server.close();
  });

  it("creates and reads metadata-only Counsel Pack export records with audit logs", async () => {
    const server = buildServer();

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-1/exports/counsel-pack",
      payload: {
        projectName: "YieldPassport",
        title: "YieldPassport Counsel Pack v1",
        format: "markdown",
        artifactName: "yieldpassport-counsel-pack.md",
        manifestHash: "a".repeat(64),
        artifactHash: "b".repeat(64),
        artifactSize: 4096,
        riskLevel: "critical",
        reviewSummary: {
          total: 7,
          reviewed: 1,
          readyForCounsel: 2,
          needsEvidence: 3,
          blocked: 1,
          open: 6
        },
        sourceCount: 4,
        sourcePackHash: "c".repeat(64),
        sourceReviewStatus: "current",
        createdBy: "Compliance",
        includesRawKycOrPersonalData: false,
        includesCredentialMaterial: false
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-counsel-pack-export-record-v1",
        id: expect.stringMatching(/^counsel-pack-export-[a-f0-9]{16}$/),
        workspaceId: "workspace-1",
        exportType: "counsel-pack",
        format: "markdown",
        version: 1,
        title: "YieldPassport Counsel Pack v1",
        artifactName: "yieldpassport-counsel-pack.md",
        manifestHash: "a".repeat(64),
        artifactHash: "b".repeat(64),
        artifactSize: 4096,
        riskLevel: "critical",
        sourceCount: 4,
        sourcePackHash: "c".repeat(64),
        sourceReviewStatus: "current",
        createdBy: "Compliance",
        status: "ready",
        notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
      })
    );
    expect(createResponse.body).not.toContain("# Counsel Pack");
    expect(createResponse.body.toLowerCase()).not.toContain("api_key");

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/exports" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([expect.objectContaining({ id: createResponse.json().id, version: 1 })]);

    const downloadResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-1/exports/${createResponse.json().id}`
    });
    expect(downloadResponse.statusCode).toBe(200);
    expect(downloadResponse.json()).toEqual(createResponse.json());

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/audit-log" });
    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json()).toEqual([
      expect.objectContaining({
        action: "export.counsel-pack.created",
        targetType: "export",
        targetId: createResponse.json().id,
        afterHash: createResponse.json().artifactHash,
        summary: "Created Counsel Pack export metadata record."
      })
    ]);

    await server.close();
  });

  it("blocks Counsel Pack export records that include unsafe content or invalid hashes", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-1/exports/counsel-pack",
      payload: {
        projectName: "YieldPassport",
        title: "Unsafe Counsel Pack",
        format: "markdown",
        artifactName: "unsafe.md",
        manifestHash: "not-a-hash",
        artifactHash: "also-not-a-hash",
        artifactSize: 12,
        riskLevel: "critical",
        reviewSummary: {
          total: 1,
          reviewed: 0,
          readyForCounsel: 0,
          needsEvidence: 1,
          blocked: 0,
          open: 1
        },
        sourceCount: 1,
        sourcePackHash: "not-a-source-pack-hash",
        sourceReviewStatus: "review-due",
        createdBy: "Compliance",
        includesRawKycOrPersonalData: true,
        includesCredentialMaterial: true,
        rawMarkdown: "# Counsel Pack\n\napi_key=sk-live-secret"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error:
        "Manifest hash must be a SHA-256 hex digest. Artifact hash must be a SHA-256 hex digest. Source pack hash must be a SHA-256 hex digest. Counsel Pack export records must not include raw KYC or personal data. Counsel Pack export records must not include API keys, private keys, or credential material. Server export records accept hashes and metadata only, not raw Markdown or PDF content.",
      code: "COUNSEL_PACK_EXPORT_CREATE_FAILED",
      recoveryAction: "Remove raw content and blocked data classes, then retry with manifest and artifact hashes only.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(response.body).not.toContain("sk-live-secret");
    expect(response.body.toLowerCase()).not.toContain("api_key");

    await server.close();
  });
});

async function createReviewRequest(
  server: ReturnType<typeof buildServer>,
  payload: {
    targetType: HumanReviewRecord["targetType"];
    targetId: string;
    reviewerId: string;
    comment: string;
  }
): Promise<HumanReviewRecord> {
  const response = await server.inject({
    method: "POST",
    url: "/api/workspaces/workspace-queue/reviews",
    payload
  });
  expect(response.statusCode).toBe(201);
  return response.json() as HumanReviewRecord;
}
