import { describe, expect, it, vi } from "vitest";
import {
  createModelGatewayRunRecoveryPacket,
  createModelGatewayRunReceipt,
  downloadModelGatewayRunRecoveryPacketJson,
  downloadModelGatewayRunReceiptJson,
  exportModelGatewayRunRecoveryPacketJson,
  exportModelGatewayRunReceiptJson,
  type ModelGatewayRunRecoveryPacket,
  type ModelGatewayRunReceipt
} from "./modelGatewayRunReceipt";
import type { ModelGatewayRun, ModelGatewayRunSummary } from "./phase2Types";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";

describe("model gateway run receipt", () => {
  it("creates a metadata-only receipt with a stable receipt hash", async () => {
    const first = await createModelGatewayRunReceipt(createRun(), { exportedAt: "2026-07-04T00:00:00.000Z" });
    const second = await createModelGatewayRunReceipt(createRun(), { exportedAt: "2026-07-04T00:01:00.000Z" });

    expect(first).toMatchObject({
      receiptVersion: "lexproof-model-gateway-run-receipt-v1",
      runId: "model-gateway-run-receipt",
      workspaceId: "workspace-receipt",
      status: "completed",
      humanReviewStatus: "needs-review",
      requiresHumanReview: true,
      retryState: "not-needed",
      providerPolicy: {
        provider: "mock",
        adapterMode: "local-mock",
        credentialPolicy: "no credentials accepted",
        secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
        allowedDataClasses: ["audit-prep metadata", "evidence hashes"]
      },
      hashes: {
        payloadHash: "c".repeat(64),
        responseHash: "d".repeat(64),
        sourceEvidenceHash: "e".repeat(64)
      },
      recoveryAction: "Complete Human Review before relying on this AI-assisted draft."
    } satisfies Partial<ModelGatewayRunReceipt>);
    expect(first.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(first.receiptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.receiptHash).toBe(second.receiptHash);
    expect(first.exportedAt).not.toBe(second.exportedAt);
  });

  it("changes the receipt hash when run hashes change", async () => {
    const first = await createModelGatewayRunReceipt(createRun({ responseHash: "d".repeat(64) }));
    const second = await createModelGatewayRunReceipt(createRun({ responseHash: "f".repeat(64) }));

    expect(first.receiptHash).not.toBe(second.receiptHash);
  });

  it("creates a downloadable receipt from persisted run summaries", async () => {
    const receipt = await createModelGatewayRunReceipt(createRunSummary(), {
      workspaceId: "workspace-summary",
      exportedAt: "2026-07-04T00:00:00.000Z"
    });
    const json = exportModelGatewayRunReceiptJson(receipt);

    expect(receipt.workspaceId).toBe("workspace-summary");
    expect(receipt.providerPolicy.provider).toBe("not-in-summary");
    expect(receipt.providerPolicy.allowedDataClasses).toEqual(["metadata-only model-run summary"]);
    expect(receipt.purpose).toBe("Persisted Model Gateway run summary for audit preparation and human review.");
    expect(json).toContain("lexproof-model-gateway-run-receipt-v1");
    expect(json).toContain("Not legal advice");
  });

  it("redacts unsafe failure text before export", async () => {
    const receipt = await createModelGatewayRunReceipt(
      createRun({
        model: "lexproof legal conclusion",
        status: "blocked",
        retryState: "blocked-until-remediated",
        errorCode: "MODEL_GATEWAY_POLICY_BLOCKED",
        providerMetadata: {
          adapterMode: "local-mock",
          credentialPolicy: "no credentials accepted",
          secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
          allowedDataClasses: ["audit-prep metadata", "raw_KYC passport A1234567", "passport data"]
        },
        errorMessage: `Request included apiKey=${apiKey}, raw_KYC passport A1234567, legal conclusion, and private key ${privateKey}.`,
        remediationSteps: [`Remove apiKey=${apiKey}, final-legal-decision, raw_KYC data, and private key ${privateKey} before retry.`],
        responseHash: ""
      })
    );
    const json = exportModelGatewayRunReceiptJson(receipt);

    expect(receipt.recoveryAction).toContain("Resolve Model Gateway remediation steps");
    expect(json).toContain("[redacted-secret]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).toContain("[redacted-raw-kyc]");
    expect(json).toContain("[redacted-legal-conclusion]");
    expect(json).toContain("[redacted-identity-document]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toMatch(/apiKey|raw_KYC|A1234567|legal conclusion|final-legal-decision|passport data/i);
    expect(json).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("exports and downloads receipt JSON", async () => {
    const receipt = await createModelGatewayRunReceipt(createRun());
    const json = exportModelGatewayRunReceiptJson(receipt);

    expect(json).toContain("\"receiptVersion\": \"lexproof-model-gateway-run-receipt-v1\"");
    expect(json).toContain("\"receiptHash\"");
    expect(json).toContain("Not legal advice");

    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:model-gateway-run-receipt");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadModelGatewayRunReceiptJson("model-gateway-run-receipt.json", receipt);
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:model-gateway-run-receipt");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("creates a stable metadata-only recovery packet across model runs", async () => {
    const blockedRun = createRun({
      id: `model-gateway-run-blocked-apiKey=${apiKey}`,
      model: "lexproof legal conclusion",
      status: "blocked",
      redactionStatus: "blocked",
      retryState: "blocked-until-remediated",
      errorCode: "MODEL_GATEWAY_POLICY_BLOCKED",
      errorMessage: `Request included apiKey=${apiKey}, raw_KYC passport A1234567, and private key ${privateKey}.`,
      remediationSteps: [`Remove apiKey=${apiKey}, raw_KYC data, and final-legal-decision before retry.`],
      responseHash: "",
      createdAt: "2026-07-04T00:00:00.000Z",
      completedAt: undefined
    });
    const retryRun = createRun({
      id: "model-gateway-run-retry",
      status: "failed",
      retryState: "retry-available",
      errorCode: "MODEL_GATEWAY_TIMEOUT",
      errorMessage: "Gateway timeout after safe metadata request.",
      remediationSteps: ["Retry once after confirming the model gateway health endpoint."],
      createdAt: "2026-07-05T00:00:00.000Z",
      completedAt: undefined
    });
    const reviewRun = createRun({
      id: "model-gateway-run-review",
      humanReviewStatus: "needs-review",
      createdAt: "2026-07-06T00:00:00.000Z"
    });
    const readyRun = createRun({
      id: "model-gateway-run-ready raw_KYC passport A1234567",
      humanReviewStatus: "reviewed",
      createdAt: "2026-07-07T00:00:00.000Z"
    });

    const first = await createModelGatewayRunRecoveryPacket("workspace-receipt", [readyRun, reviewRun, retryRun, blockedRun], {
      generatedAt: "2026-07-08T00:00:00.000Z"
    });
    const second = await createModelGatewayRunRecoveryPacket("workspace-receipt", [blockedRun, readyRun, retryRun, reviewRun], {
      generatedAt: "2026-07-08T00:01:00.000Z"
    });
    const json = exportModelGatewayRunRecoveryPacketJson(first);

    expect(first).toMatchObject({
      packetVersion: "lexproof-model-gateway-run-recovery-packet-v1",
      workspaceId: "workspace-receipt",
      runCount: 4,
      recoveryItemCount: 3,
      blockedCount: 1,
      retryAvailableCount: 1,
      needsHumanReviewCount: 1,
      readyCount: 1,
      latestRunId: expect.stringContaining("[redacted-raw-kyc]"),
      notLegalAdviceBoundary: "Not legal advice. Model Gateway run recovery packets are audit preparation metadata only."
    } satisfies Partial<ModelGatewayRunRecoveryPacket>);
    expect(first.items.map((item) => item.recoveryStatus)).toEqual([
      "blocked",
      "retry-available",
      "needs-human-review",
      "ready"
    ]);
    expect(first.items[0]).toEqual(
      expect.objectContaining({
        priority: "P0",
        recoveryAction: "Resolve Model Gateway remediation steps before retry, export handoff, or external reliance."
      })
    );
    expect(first.items[1]).toEqual(
      expect.objectContaining({
        priority: "P1",
        recoveryAction: "Retry the Model Gateway run only after remediation and keep the failure receipt with the audit trail."
      })
    );
    expect(first.items[2]).toEqual(
      expect.objectContaining({
        priority: "P2",
        recoveryAction: "Complete Human Review before relying on this AI-assisted draft."
      })
    );
    expect(first.packetHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.packetHash).toBe(second.packetHash);
    expect(first.generatedAt).not.toBe(second.generatedAt);
    expect(json).toContain("[redacted-secret]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).toContain("[redacted-raw-kyc]");
    expect(json).toContain("[redacted-legal-conclusion]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toMatch(/apiKey|raw_KYC|A1234567|legal conclusion|final-legal-decision/i);
    expect(json).not.toContain("raw model prompt");
  });

  it("exports and downloads recovery packet JSON", async () => {
    const packet = await createModelGatewayRunRecoveryPacket("workspace-receipt", [createRun({ humanReviewStatus: "reviewed" })]);
    const json = exportModelGatewayRunRecoveryPacketJson(packet);

    expect(json).toContain("\"packetVersion\": \"lexproof-model-gateway-run-recovery-packet-v1\"");
    expect(json).toContain("\"packetHash\"");
    expect(json).toContain("Keep Model Gateway run receipts");
    expect(json).toContain("Not legal advice");

    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:model-gateway-run-recovery-packet");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadModelGatewayRunRecoveryPacketJson("model-gateway-run-recovery-packet.json", packet);
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:model-gateway-run-recovery-packet");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });
});

function createRun(overrides: Partial<ModelGatewayRun> = {}): ModelGatewayRun {
  return {
    recordVersion: "lexproof-model-gateway-run-v1",
    id: "model-gateway-run-receipt",
    workspaceId: "workspace-receipt",
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
    createdAt: "2026-07-04T00:00:00.000Z",
    completedAt: "2026-07-04T00:00:01.000Z",
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice.",
    ...overrides
  };
}

function createRunSummary(overrides: Partial<ModelGatewayRunSummary> = {}): ModelGatewayRunSummary {
  return {
    id: "model-gateway-run-summary",
    providerLabel: "Mock local reviewer gateway",
    model: "lexproof-mock",
    status: "completed",
    redactionStatus: "clean",
    humanReviewStatus: "reviewed",
    payloadHash: "c".repeat(64),
    responseHash: "d".repeat(64),
    sourceEvidenceHash: "e".repeat(64),
    retryState: "not-needed",
    remediationSteps: [],
    requiresHumanReview: false,
    boundary: "AI-assisted draft for audit preparation only. Not legal advice.",
    ...overrides
  };
}
