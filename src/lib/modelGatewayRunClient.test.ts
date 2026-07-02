import { describe, expect, it, vi } from "vitest";
import {
  ModelGatewayRunClientError,
  buildModelGatewayRunUrl,
  buildModelGatewayRunsUrl,
  fetchModelGatewayRun,
  fetchModelGatewayRuns
} from "./modelGatewayRunClient";
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

  it("builds stable encoded list and lookup URLs", () => {
    expect(buildModelGatewayRunsUrl("https://api.lexproof.test/", "workspace with spaces")).toBe(
      "https://api.lexproof.test/api/workspaces/workspace%20with%20spaces/model-runs"
    );
    expect(buildModelGatewayRunUrl("", "workspace with spaces", "run/id")).toBe(
      "/api/workspaces/workspace%20with%20spaces/model-runs/run%2Fid"
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
    expect(error.message).toContain("[redacted-personal-data]");
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
