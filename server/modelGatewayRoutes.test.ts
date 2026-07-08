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

  it("evaluates provider policy from a metadata-only Model Connect receipt without accepting credentials", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const policyResponse = await server.inject({
      method: "POST",
      url: "/api/model-gateway/provider-policy",
      payload: {
        modelConnectReceipt: {
          provider: "openai-compatible",
          mode: "session-openai-compatible",
          status: "ready",
          blockers: [],
          apiKey: "sk-live-abcdef1234567890abcdef1234567890"
        }
      }
    });

    expect(policyResponse.statusCode).toBe(200);
    expect(policyResponse.json()).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-model-gateway-provider-policy-v1",
        overallStatus: "needs-policy",
        notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
      })
    );
    expect(policyResponse.json().adapters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provider: "openai-compatible", status: "needs-policy", enabled: false }),
        expect.objectContaining({ provider: "enterprise-proxy", status: "disabled", enabled: false })
      ])
    );
    expect(policyResponse.json().nextActions).toEqual(
      expect.arrayContaining(["Approve server-side secret policy before enabling OpenAI-compatible gateway."])
    );
    expect(policyResponse.body).not.toContain("sk-live-abcdef");
    expect(policyResponse.body).not.toContain("apiKey");
    expect(policyResponse.body.toLowerCase()).not.toContain("legal opinion");

    await server.close();
    await repository.close();
  });

  it("rejects malformed provider policy payloads without leaking Model Connect secrets", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const cases: Array<{ payload?: unknown; expectedError: string }> = [
      {
        expectedError: "Model Gateway provider policy payload must be a JSON object."
      },
      {
        payload: ["model connect receipt apiKey=sk-live-abcdef1234567890abcdef1234567890"],
        expectedError: "Model Gateway provider policy payload must be a JSON object."
      },
      {
        payload: {
          modelConnectReceipt: {
            provider: "openai-compatible",
            mode: "session-openai-compatible",
            status: "approved",
            apiKey: "sk-live-abcdef1234567890abcdef1234567890"
          }
        },
        expectedError: "Model Gateway provider policy Model Connect receipt must be a metadata-only JSON object."
      }
    ];

    for (const item of cases) {
      const response = await server.inject({
        method: "POST",
        url: "/api/model-gateway/provider-policy",
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: item.expectedError,
          code: "MODEL_GATEWAY_PROVIDER_POLICY_INVALID_PAYLOAD",
          recoveryAction:
            "Send metadata-only Model Connect receipt JSON without provider credentials, private keys, [redacted-raw-kyc], personal data, or legal conclusions.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("apiKey");
    }

    await server.close();
    await repository.close();
  });

  it("evaluates secret policy readiness without accepting provider credentials or enabling external proxying", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const policyResponse = await server.inject({
      method: "POST",
      url: "/api/model-gateway/secret-policy",
      payload: {
        policy: {
          policyOwner: "Security lead",
          kmsBackedStorageApproved: true,
          rotationDays: 30,
          accessReviewCadence: "quarterly",
          providerAllowlistApproved: true,
          egressLoggingApproved: true,
          incidentResponseRunbookApproved: true,
          noClientSecretPersistence: true,
          humanReviewRequired: true,
          notes: "Ready for future adapter review.",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890"
        }
      }
    });

    expect(policyResponse.statusCode).toBe(200);
    expect(policyResponse.json()).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-model-gateway-secret-policy-v1",
        overallStatus: "ready",
        externalProviderProxyingAllowed: false,
        externalProviderProxyingStatus: "policy-ready-not-enabled",
        notLegalAdviceBoundary: "Not legal advice. Model Gateway secret policy is audit preparation metadata only."
      })
    );
    expect(policyResponse.json().controls).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "kms-secret-storage", status: "ready" })])
    );
    expect(policyResponse.body).not.toContain("sk-live-abcdef");
    expect(policyResponse.body).not.toContain("apiKey");
    expect(policyResponse.body.toLowerCase()).not.toContain("legal opinion");

    await server.close();
    await repository.close();
  });

  it("rejects malformed secret policy payloads before evaluating external provider readiness", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const cases: Array<{ payload?: unknown; expectedError: string }> = [
      {
        expectedError: "Model Gateway secret policy payload must be a JSON object."
      },
      {
        payload: ["secret policy apiKey=sk-live-abcdef1234567890abcdef1234567890"],
        expectedError: "Model Gateway secret policy payload must be a JSON object."
      },
      {
        payload: {
          policy: ["apiKey=sk-live-abcdef1234567890abcdef1234567890"]
        },
        expectedError: "Model Gateway secret policy draft must be a JSON object."
      },
      {
        payload: {
          apiKey: "sk-live-abcdef1234567890abcdef1234567890"
        },
        expectedError: "Model Gateway secret policy draft must be a JSON object."
      }
    ];

    for (const item of cases) {
      const response = await server.inject({
        method: "POST",
        url: "/api/model-gateway/secret-policy",
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: item.expectedError,
          code: "MODEL_GATEWAY_SECRET_POLICY_INVALID_PAYLOAD",
          recoveryAction:
            "Send metadata-only Model Gateway secret policy JSON with non-negative integer numeric fields and without provider credentials, private keys, [redacted-raw-kyc], personal data, or legal conclusions.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("apiKey");
      expect(response.body).not.toContain("externalProviderProxyingAllowed");
    }

    await server.close();
    await repository.close();
  });

  it("returns typed recovery errors for malformed secret policy numeric fields without leaking credentials", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const cases = [
      { rotationDays: "30", apiKey: "sk-live-abcdef1234567890abcdef1234567890" },
      { rotationDays: -1, privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" }
    ];

    for (const policy of cases) {
      const response = await server.inject({
        method: "POST",
        url: "/api/model-gateway/secret-policy",
        payload: { policy }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          code: "MODEL_GATEWAY_SECRET_POLICY_INVALID_PAYLOAD",
          error: "Model Gateway secret policy numeric fields must be non-negative integers.",
          recoveryAction:
            "Send metadata-only Model Gateway secret policy JSON with non-negative integer numeric fields and without provider credentials, private keys, [redacted-raw-kyc], personal data, or legal conclusions.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("0x1234567890abcdef");
      expect(response.body).not.toContain("apiKey");
      expect(response.body).not.toContain("privateKey");
    }

    await server.close();
    await repository.close();
  });

  it("rejects malformed model gateway run payloads before creating failure receipts", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const validPayload = {
      provider: "mock",
      model: "lexproof-mock",
      purpose: "Draft audit preparation issue spotting for counsel review.",
      redactionStatus: "clean",
      humanReviewOwner: "Counsel",
      includesCredentialMaterial: false,
      includesRawKycOrPersonalData: false,
      allowedDataClasses: ["audit-prep metadata", "evidence hashes"],
      payload: { projectName: "YieldPassport" }
    };
    const cases: Array<{ payload?: unknown; expectedError: string }> = [
      {
        expectedError: "Model Gateway run payload must be a JSON object."
      },
      {
        payload: {
          ...validPayload,
          includesCredentialMaterial: "false",
          payload: { apiKey: "sk-live-abcdef1234567890abcdef1234567890" }
        },
        expectedError: "Model Gateway credential material flag must be a boolean."
      },
      {
        payload: {
          ...validPayload,
          allowedDataClasses: ["audit-prep metadata", 7],
          payload: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" }
        },
        expectedError: "Model Gateway allowed data classes must be an array of strings."
      },
      {
        payload: {
          ...validPayload,
          redactionStatus: "approved"
        },
        expectedError: "Model Gateway redaction status must be clean, needs-review, or blocked."
      }
    ];

    for (const [index, item] of cases.entries()) {
      const workspaceId = `workspace-model-malformed-${index}`;
      const response = await server.inject({
        method: "POST",
        url: `/api/workspaces/${workspaceId}/model-runs`,
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: item.expectedError,
          code: "MODEL_GATEWAY_INVALID_PAYLOAD",
          recoveryAction:
            "Send metadata-only Model Gateway run JSON with a supported provider, clean redaction status, explicit booleans, safe allowed data classes, human review owner, and no credentials, private keys, [redacted-raw-kyc], personal data, or legal conclusions.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("0x1234567890abcdef");
      expect(response.body).not.toContain("apiKey");
      expect(response.body).not.toContain("privateKey");
      expect(await repository.listModelGatewayRuns(workspaceId)).toEqual([]);
      expect(await repository.listAuditLogRecords(workspaceId)).toEqual([]);

      const recoveryResponse = await server.inject({
        method: "GET",
        url: `/api/workspaces/${workspaceId}/model-runs/recovery`
      });
      expect(recoveryResponse.statusCode).toBe(200);
      expect(recoveryResponse.json()).toEqual(
        expect.objectContaining({
          runCount: 0,
          recoveryItemCount: 0,
          blockedCount: 0,
          notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
        })
      );
    }

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

    const recoveryResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-model-routes/model-runs/recovery" });
    expect(recoveryResponse.statusCode).toBe(200);
    expect(recoveryResponse.json()).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-model-gateway-run-recovery-packet-v1",
        workspaceId: "workspace-model-routes",
        runCount: 1,
        recoveryItemCount: 1,
        blockedCount: 0,
        retryAvailableCount: 0,
        needsHumanReviewCount: 1,
        readyCount: 0,
        latestRunId: runResponse.json().id,
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
      })
    );
    expect(recoveryResponse.json().items).toEqual([
      expect.objectContaining({
        runId: runResponse.json().id,
        recoveryStatus: "needs-human-review",
        priority: "P2",
        recoveryAction: "Complete Human Review before relying on this AI-assisted draft.",
        hashes: expect.objectContaining({
          payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          responseHash: expect.stringMatching(/^[a-f0-9]{64}$/)
        }),
        notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery items are audit preparation workflow metadata only."
      })
    ]);
    expect(recoveryResponse.body).not.toContain("raw model prompt should not leave the gateway");

    const lookupResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-model-routes/model-runs/${runResponse.json().id}`
    });
    expect(lookupResponse.statusCode).toBe(200);
    expect(lookupResponse.json()).toEqual(expect.objectContaining({ id: runResponse.json().id }));

    expect(await repository.listHumanReviewRecords("workspace-model-routes")).toEqual([
      expect.objectContaining({
        targetType: "model-run",
        targetId: runResponse.json().id,
        reviewerId: "Counsel",
        status: "requested"
      })
    ]);
    expect(await repository.listAuditLogRecords("workspace-model-routes")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "model.run.created",
          targetType: "model-run",
          targetId: runResponse.json().id,
          summary: "Created mock model gateway run for audit preparation."
        }),
        expect.objectContaining({
          action: "model.run.human-review-queued",
          targetType: "human-review",
          summary: "Queued completed Model Gateway output for human review before audit-prep reliance."
        })
      ])
    );

    await server.close();
    await repository.close();
  });

  it("automatically queues completed model gateway output for human review", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerModelGatewayRoutes(server, { repository });

    const runResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-model-auto-review/model-runs",
      payload: {
        provider: "mock",
        model: "lexproof-mock",
        purpose: "Draft audit preparation issue spotting for counsel review.",
        redactionStatus: "clean",
        humanReviewOwner: "Compliance reviewer",
        includesCredentialMaterial: false,
        includesRawKycOrPersonalData: false,
        allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
        payload: {
          projectName: "YieldPassport",
          evidenceVault: {
            bundleHash: "c".repeat(64),
            records: [{ fileHash: "d".repeat(64), status: "verified" }]
          }
        }
      }
    });

    expect(runResponse.statusCode).toBe(201);

    expect(await repository.listHumanReviewRecords("workspace-model-auto-review")).toEqual([
      expect.objectContaining({
        recordVersion: "lexproof-human-review-record-v1",
        workspaceId: "workspace-model-auto-review",
        targetType: "model-run",
        targetId: runResponse.json().id,
        reviewerId: "Compliance reviewer",
        status: "requested",
        comment: "Review Model Gateway output before audit-prep reliance. AI-assisted draft only. Not legal advice.",
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      })
    ]);
    expect(await repository.listAuditLogRecords("workspace-model-auto-review")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "model.run.human-review-queued",
          targetType: "human-review",
          summary: "Queued completed Model Gateway output for human review before audit-prep reliance."
        })
      ])
    );

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

    const recoveryResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-model-errors/model-runs/recovery" });
    expect(recoveryResponse.statusCode).toBe(200);
    expect(recoveryResponse.json()).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-model-gateway-run-recovery-packet-v1",
        workspaceId: "workspace-model-errors",
        runCount: 1,
        recoveryItemCount: 1,
        blockedCount: 1,
        retryAvailableCount: 0,
        needsHumanReviewCount: 0,
        readyCount: 0,
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
      })
    );
    expect(recoveryResponse.json().items).toEqual([
      expect.objectContaining({
        runId: blockedResponse.json().runId,
        recoveryStatus: "blocked",
        priority: "P0",
        retryState: "blocked-until-remediated",
        recoveryAction: "Resolve Model Gateway remediation steps before retry, export handoff, or external reliance.",
        remediationSteps: expect.arrayContaining([
          "Pass the Redaction Gate before creating a server Model Gateway run.",
          "Remove API keys, private keys, credentials, [redacted-raw-kyc], and personal data from the request metadata."
        ])
      })
    ]);
    expect(recoveryResponse.body).not.toContain("api_key");
    expect(recoveryResponse.body.toLowerCase()).not.toContain("raw kyc");

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
