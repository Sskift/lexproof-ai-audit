import { describe, expect, it, vi } from "vitest";
import {
  ModelGatewayRunClientError,
  buildModelGatewayRunRecoveryPacketUrl,
  buildModelGatewayRunUrl,
  buildModelGatewayRunsUrl,
  fetchModelGatewayRun,
  fetchModelGatewayRunRecoveryPacket,
  fetchModelGatewayRuns
} from "./modelGatewayRunClient";
import type { ModelGatewayRunRecoveryPacket } from "./modelGatewayRunReceipt";
import type { ModelGatewayRun, ModelGatewayRunSummary } from "./phase2Types";

const runSummary: ModelGatewayRunSummary = {
  id: "model-run-client-1",
  providerLabel: "Mock local reviewer gateway",
  model: "lexproof-mock",
  status: "completed",
  redactionStatus: "clean",
  humanReviewStatus: "needs-review",
  payloadHash: "c".repeat(64),
  responseHash: "d".repeat(64),
  sourceEvidenceHash: "e".repeat(64),
  retryState: "not-needed",
  remediationSteps: [],
  requiresHumanReview: true,
  boundary: "AI-assisted draft for audit preparation only. Not legal advice."
};

const fullRun: ModelGatewayRun = {
  recordVersion: "lexproof-model-gateway-run-v1",
  id: "model-run-client-1",
  workspaceId: "workspace-model-ledger",
  provider: "mock",
  providerLabel: "Mock local reviewer gateway",
  model: "lexproof-mock",
  purpose: "Create server-side model gateway receipt for audit preparation and human review.",
  status: "completed",
  redactionStatus: "clean",
  payloadHash: "c".repeat(64),
  responseHash: "d".repeat(64),
  sourceEvidenceHash: "e".repeat(64),
  providerMetadata: {
    adapterMode: "local-mock",
    credentialPolicy: "no credentials accepted",
    secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
    allowedDataClasses: ["audit-prep metadata", "evidence hashes"]
  },
  humanReviewStatus: "needs-review",
  attempt: 1,
  maxAttempts: 1,
  retryState: "not-needed",
  remediationSteps: [],
  createdAt: "2026-07-03T00:00:00.000Z",
  completedAt: "2026-07-03T00:00:01.000Z",
  notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
};

describe("model gateway run client", () => {
  it("fetches persisted Model Gateway run summaries without sending raw payload or credentials", async () => {
    const fetcher = vi.fn(async () => jsonResponse([runSummary], 200)) as unknown as typeof fetch;

    const runs = await fetchModelGatewayRuns({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: " workspace-model-ledger ",
      fetcher
    });

    expect(runs).toEqual([runSummary]);
    expect(fetcher).toHaveBeenCalledWith("https://api.lexproof.test/api/workspaces/workspace-model-ledger/model-runs", {
      method: "GET"
    });
    const [, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(JSON.stringify(init)).not.toContain("apiKey");
    expect(JSON.stringify(init)).not.toContain("rawKyc");
    expect(JSON.stringify(init)).not.toContain("payload");
  });

  it("redacts classified text from otherwise valid Model Gateway run summaries before UI use", async () => {
    const unsafeSummary: ModelGatewayRunSummary = {
      ...runSummary,
      id: "model-run-client-1 apiKey=sk-live-abcdef1234567890abcdef1234567890",
      providerLabel: "Provider reviewer@example.com",
      model: "lexproof-mock legal opinion",
      errorCode: "MODEL_GATEWAY_raw KYC passport A1234567",
      errorMessage: "Retry blocked by private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef.",
      remediationSteps: [
        "Remove raw KYC passport A1234567 and apiKey=sk-live-abcdef1234567890abcdef1234567890 before retry.",
        "Do not treat model output as a final legal decision."
      ]
    };
    const fetcher = vi.fn(async () => jsonResponse([unsafeSummary], 200)) as unknown as typeof fetch;

    const runs = await fetchModelGatewayRuns({
      workspaceId: "workspace-model-ledger",
      fetcher
    });

    const [run] = runs;
    expect(run.id).toContain("[redacted-secret]");
    expect(run.providerLabel).toContain("[redacted-email]");
    expect(run.model).toContain("[redacted-legal-conclusion]");
    expect(run.errorCode).toContain("[redacted-raw-kyc]");
    expect(run.errorMessage).toContain("[redacted-private-key]");
    expect(run.remediationSteps.join(" ")).toContain("[redacted-raw-kyc]");
    expect(run.remediationSteps.join(" ")).toContain("[redacted-passport-id]");
    expect(run.remediationSteps.join(" ")).toContain("[redacted-secret]");
    expect(run.remediationSteps.join(" ")).toContain("[redacted-legal-conclusion]");
    expect(JSON.stringify(runs)).not.toMatch(
      /sk-live-abcdef|raw KYC|passport A1234567|reviewer@example\.com|private key|legal opinion|final legal decision/i
    );
    expect(run.boundary).toBe("AI-assisted draft for audit preparation only. Not legal advice.");
  });

  it("fetches a single full run receipt by run ID", async () => {
    const fetcher = vi.fn(async () => jsonResponse(fullRun, 200)) as unknown as typeof fetch;

    const run = await fetchModelGatewayRun({
      apiBaseUrl: "https://api.lexproof.test",
      workspaceId: "workspace-model-ledger",
      runId: "model-run-client-1",
      fetcher
    });

    expect(run).toEqual(fullRun);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.lexproof.test/api/workspaces/workspace-model-ledger/model-runs/model-run-client-1",
      { method: "GET" }
    );
  });

  it("redacts classified text from otherwise valid full Model Gateway runs before UI use", async () => {
    const unsafeRun: ModelGatewayRun = {
      ...fullRun,
      id: "model-run-client-1 apiKey=sk-live-abcdef1234567890abcdef1234567890",
      workspaceId: "workspace-model-ledger raw KYC passport A1234567",
      providerLabel: "Provider reviewer@example.com",
      model: "lexproof-mock legal approval",
      purpose: "Create a final legal decision from raw KYC passport A1234567.",
      providerMetadata: {
        ...fullRun.providerMetadata,
        allowedDataClasses: [
          "audit-prep metadata",
          "raw KYC passport A1234567",
          "apiKey=sk-live-abcdef1234567890abcdef1234567890"
        ]
      },
      errorCode: "MODEL_GATEWAY_LEGAL_OPINION",
      errorMessage: "Blocked by private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef.",
      remediationSteps: [
        "Remove raw KYC passport A1234567 and apiKey=sk-live-abcdef1234567890abcdef1234567890 before retry.",
        "Do not treat this output as a legal conclusion."
      ],
      createdAt: "2026-07-03T00:00:00.000Z legal opinion",
      completedAt: "2026-07-03T00:00:01.000Z final legal decision"
    };
    const fetcher = vi.fn(async () => jsonResponse(unsafeRun, 200)) as unknown as typeof fetch;

    const run = await fetchModelGatewayRun({
      workspaceId: "workspace-model-ledger",
      runId: "model-run-client-1",
      fetcher
    });

    expect(run.id).toContain("[redacted-secret]");
    expect(run.workspaceId).toContain("[redacted-raw-kyc]");
    expect(run.providerLabel).toContain("[redacted-email]");
    expect(run.model).toContain("[redacted-legal-conclusion]");
    expect(run.purpose).toContain("[redacted-legal-conclusion]");
    expect(run.providerMetadata.allowedDataClasses.join(" ")).toContain("[redacted-raw-kyc]");
    expect(run.providerMetadata.allowedDataClasses.join(" ")).toContain("[redacted-secret]");
    expect(run.errorMessage).toContain("[redacted-private-key]");
    expect(run.remediationSteps.join(" ")).toContain("[redacted-legal-conclusion]");
    expect(run.createdAt).toContain("[redacted-legal-conclusion]");
    expect(run.completedAt).toContain("[redacted-legal-conclusion]");
    expect(JSON.stringify(run)).not.toMatch(
      /sk-live-abcdef|raw KYC|passport A1234567|reviewer@example\.com|private key|legal opinion|legal approval|legal conclusion|final legal decision/i
    );
    expect(run.notLegalAdviceBoundary).toBe("AI-assisted draft for audit preparation only. Not legal advice.");
  });

  it("fetches a metadata-only Model Gateway run recovery packet", async () => {
    const recoveryPacket = createRecoveryPacket();
    const fetcher = vi.fn(async () => jsonResponse(recoveryPacket, 200)) as unknown as typeof fetch;

    const packet = await fetchModelGatewayRunRecoveryPacket({
      apiBaseUrl: "https://api.lexproof.test/",
      workspaceId: " workspace-model-ledger ",
      fetcher
    });

    expect(packet).toEqual(recoveryPacket);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.lexproof.test/api/workspaces/workspace-model-ledger/model-runs/recovery",
      { method: "GET" }
    );
    expect(JSON.stringify(packet)).not.toContain("apiKey");
    expect(JSON.stringify(packet)).not.toContain("raw KYC");
    expect(JSON.stringify(packet)).not.toContain("private key");
  });

  it("redacts classified text from otherwise valid Model Gateway recovery packets before UI use", async () => {
    const recoveryPacket = createRecoveryPacket();
    recoveryPacket.workspaceId = "workspace-model-ledger apiKey=sk-live-abcdef1234567890abcdef1234567890";
    recoveryPacket.generatedAt = "2026-07-03T00:00:00.000Z legal opinion";
    recoveryPacket.latestRunId = "model-run-client-1 raw KYC passport A1234567";
    recoveryPacket.nextActions = [
      "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef before retry.",
      "Do not present a legal conclusion."
    ];
    recoveryPacket.items[0] = {
      ...recoveryPacket.items[0],
      runId: "model-run-client-1 apiKey=sk-live-abcdef1234567890abcdef1234567890",
      providerLabel: "Provider reviewer@example.com",
      model: "lexproof-mock legal approval",
      recoveryAction: "Remove raw KYC passport A1234567 before final legal decision.",
      errorCode: "MODEL_GATEWAY_LEGAL_OPINION",
      errorMessage: "Blocked by private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef.",
      remediationSteps: ["Remove apiKey=sk-live-abcdef1234567890abcdef1234567890 before retry."],
      createdAt: "2026-07-03T00:00:00.000Z legal conclusion",
      completedAt: "2026-07-03T00:00:01.000Z final legal decision"
    };
    const fetcher = vi.fn(async () => jsonResponse(recoveryPacket, 200)) as unknown as typeof fetch;

    const packet = await fetchModelGatewayRunRecoveryPacket({
      workspaceId: "workspace-model-ledger",
      fetcher
    });

    expect(packet.workspaceId).toContain("[redacted-secret]");
    expect(packet.generatedAt).toContain("[redacted-legal-conclusion]");
    expect(packet.latestRunId).toContain("[redacted-raw-kyc]");
    expect(packet.nextActions.join(" ")).toContain("[redacted-private-key]");
    expect(packet.nextActions.join(" ")).toContain("[redacted-legal-conclusion]");
    expect(packet.items[0].runId).toContain("[redacted-secret]");
    expect(packet.items[0].providerLabel).toContain("[redacted-email]");
    expect(packet.items[0].model).toContain("[redacted-legal-conclusion]");
    expect(packet.items[0].recoveryAction).toContain("[redacted-raw-kyc]");
    expect(packet.items[0].recoveryAction).toContain("[redacted-legal-conclusion]");
    expect(packet.items[0].errorMessage).toContain("[redacted-private-key]");
    expect(packet.items[0].remediationSteps.join(" ")).toContain("[redacted-secret]");
    expect(packet.items[0].createdAt).toContain("[redacted-legal-conclusion]");
    expect(packet.items[0].completedAt).toContain("[redacted-legal-conclusion]");
    expect(JSON.stringify(packet)).not.toMatch(
      /sk-live-abcdef|raw KYC|passport A1234567|reviewer@example\.com|private key|legal opinion|legal approval|legal conclusion|final legal decision/i
    );
    expect(packet.notLegalAdviceBoundary).toBe(
      "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
    );
  });

  it("accepts blocked run summaries with no response hash while keeping source hashes strict", async () => {
    const blockedSummary: ModelGatewayRunSummary = {
      ...runSummary,
      status: "blocked",
      redactionStatus: "blocked",
      responseHash: "",
      retryState: "blocked-until-remediated",
      errorCode: "MODEL_GATEWAY_BOUNDARY_FAILED",
      errorMessage: "Model Gateway boundary failed.",
      remediationSteps: ["Remove blocked metadata before retry."]
    };
    const fetcher = vi.fn(async () => jsonResponse([blockedSummary], 200)) as unknown as typeof fetch;

    await expect(fetchModelGatewayRuns({ workspaceId: "workspace-model-ledger", fetcher })).resolves.toEqual([
      blockedSummary
    ]);
  });

  it("builds stable encoded list and lookup URLs", () => {
    expect(buildModelGatewayRunsUrl("https://api.lexproof.test/", "workspace with spaces")).toBe(
      "https://api.lexproof.test/api/workspaces/workspace%20with%20spaces/model-runs"
    );
    expect(buildModelGatewayRunUrl("", "workspace with spaces", "run/id")).toBe(
      "/api/workspaces/workspace%20with%20spaces/model-runs/run%2Fid"
    );
    expect(buildModelGatewayRunRecoveryPacketUrl("", "workspace with spaces")).toBe(
      "/api/workspaces/workspace%20with%20spaces/model-runs/recovery"
    );
  });

  it("rejects malformed run summaries before the UI trusts them", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse([{ ...runSummary, boundary: "Final legal approval." }], 200)
    ) as unknown as typeof fetch;

    await expect(fetchModelGatewayRuns({ workspaceId: "workspace-model-ledger", fetcher })).rejects.toMatchObject({
      code: "MODEL_GATEWAY_RUN_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Model Gateway run records."
    });
  });

  it("rejects corrupted run hashes and retry counters before the UI trusts them", async () => {
    const corruptedSummaryFetcher = vi.fn(async () =>
      jsonResponse([{ ...runSummary, payloadHash: "not-a-sha-256" }], 200)
    ) as unknown as typeof fetch;
    const impossibleAttemptFetcher = vi.fn(async () =>
      jsonResponse({ ...fullRun, attempt: 2, maxAttempts: 1 }, 200)
    ) as unknown as typeof fetch;

    await expect(
      fetchModelGatewayRuns({ workspaceId: "workspace-model-ledger", fetcher: corruptedSummaryFetcher })
    ).rejects.toMatchObject({
      code: "MODEL_GATEWAY_RUN_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Model Gateway run records."
    });
    await expect(
      fetchModelGatewayRun({
        workspaceId: "workspace-model-ledger",
        runId: "model-run-client-1",
        fetcher: impossibleAttemptFetcher
      })
    ).rejects.toMatchObject({
      code: "MODEL_GATEWAY_RUN_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Model Gateway run records."
    });
  });

  it("rejects malformed recovery packets before the UI trusts them", async () => {
    const badCountFetcher = vi.fn(async () =>
      jsonResponse({ ...createRecoveryPacket(), blockedCount: 9 }, 200)
    ) as unknown as typeof fetch;
    const badBoundaryFetcher = vi.fn(async () =>
      jsonResponse(
        {
          ...createRecoveryPacket(),
          items: [
            {
              ...createRecoveryPacket().items[0],
              notLegalAdviceBoundary: "Final legal approval."
            }
          ]
        },
        200
      )
    ) as unknown as typeof fetch;
    const emptyNextActionFetcher = vi.fn(async () =>
      jsonResponse({ ...createRecoveryPacket(), nextActions: [] }, 200)
    ) as unknown as typeof fetch;
    const badNextActionFetcher = vi.fn(async () =>
      jsonResponse(
        {
          ...createRecoveryPacket(),
          nextActions: ["Complete Human Review before relying on this AI-assisted draft.", "   "]
        },
        200
      )
    ) as unknown as typeof fetch;

    await expect(
      fetchModelGatewayRunRecoveryPacket({ workspaceId: "workspace-model-ledger", fetcher: badCountFetcher })
    ).rejects.toMatchObject({
      code: "MODEL_GATEWAY_RUN_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Model Gateway run records."
    });
    await expect(
      fetchModelGatewayRunRecoveryPacket({ workspaceId: "workspace-model-ledger", fetcher: badBoundaryFetcher })
    ).rejects.toMatchObject({
      code: "MODEL_GATEWAY_RUN_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Model Gateway run records."
    });
    await expect(
      fetchModelGatewayRunRecoveryPacket({ workspaceId: "workspace-model-ledger", fetcher: emptyNextActionFetcher })
    ).rejects.toMatchObject({
      code: "MODEL_GATEWAY_RUN_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Model Gateway run records."
    });
    await expect(
      fetchModelGatewayRunRecoveryPacket({ workspaceId: "workspace-model-ledger", fetcher: badNextActionFetcher })
    ).rejects.toMatchObject({
      code: "MODEL_GATEWAY_RUN_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning metadata-only Model Gateway run records."
    });
  });

  it("redacts unsafe API error text when run refresh fails", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: "Model run lookup failed with api_key=sk-live-abcdef1234567890abcdef1234567890 and passport data.",
          code: "MODEL_GATEWAY_RUN_LOOKUP_FAILED",
          recoveryAction:
            "Remove private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef and retry.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        },
        503
      )
    ) as unknown as typeof fetch;

    let caught: unknown;
    try {
      await fetchModelGatewayRuns({ workspaceId: "workspace-model-ledger", fetcher });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ModelGatewayRunClientError);
    const error = caught as ModelGatewayRunClientError;
    expect(error.code).toBe("MODEL_GATEWAY_RUN_LOOKUP_FAILED");
    expect(error.message).toContain("[redacted-secret]");
    expect(error.message).toContain("[redacted-identity-document]");
    expect(error.message).not.toContain("sk-live");
    expect(error.message).not.toContain("passport data");
    expect(error.recoveryAction).toContain("[redacted-private-key]");
    expect(error.notLegalAdviceBoundary).toBe("Not legal advice. This API creates audit preparation workflow records only.");
  });
});

function jsonResponse(payload: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}

function createRecoveryPacket(): ModelGatewayRunRecoveryPacket {
  return {
    packetVersion: "lexproof-model-gateway-run-recovery-packet-v1",
    workspaceId: "workspace-model-ledger",
    generatedAt: "2026-07-03T00:00:00.000Z",
    packetHash: "f".repeat(64),
    runCount: 1,
    recoveryItemCount: 1,
    blockedCount: 0,
    retryAvailableCount: 0,
    needsHumanReviewCount: 1,
    readyCount: 0,
    latestRunId: "model-run-client-1",
    nextActions: ["Complete Human Review before relying on this AI-assisted draft."],
    items: [
      {
        runId: "model-run-client-1",
        providerLabel: "Mock local reviewer gateway",
        model: "lexproof-mock",
        status: "completed",
        redactionStatus: "clean",
        humanReviewStatus: "needs-review",
        retryState: "not-needed",
        requiresHumanReview: true,
        recoveryStatus: "needs-human-review",
        priority: "P2",
        recoveryAction: "Complete Human Review before relying on this AI-assisted draft.",
        hashes: {
          payloadHash: "c".repeat(64),
          responseHash: "d".repeat(64),
          sourceEvidenceHash: "e".repeat(64)
        },
        remediationSteps: [],
        createdAt: "2026-07-03T00:00:00.000Z",
        completedAt: "2026-07-03T00:00:01.000Z",
        notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery items are audit preparation workflow metadata only."
      }
    ],
    notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
  };
}
