import { describe, expect, it } from "vitest";
import {
  createAuditLogRecord,
  createModelGatewayRunSummary,
  validateEvidenceVaultRecord,
  type AuditLogRecord,
  type EvidenceVaultRecord,
  type ModelGatewayRun
} from "./phase2Types";

describe("Phase 2 secure review workspace types", () => {
  it("creates deterministic audit log records with the non-advice boundary", () => {
    const input: Omit<AuditLogRecord, "recordVersion" | "id" | "notLegalAdviceBoundary"> = {
      workspaceId: "workspace-1",
      actorId: "reviewer-1",
      action: "review.status.updated",
      targetType: "human-review",
      targetId: "review-1",
      beforeHash: "before-hash",
      afterHash: "after-hash",
      summary: "Reviewer marked AI event as reviewed.",
      createdAt: "2026-06-29T10:00:00.000Z"
    };

    const first = createAuditLogRecord(input);
    const second = createAuditLogRecord(input);
    const changed = createAuditLogRecord({ ...input, afterHash: "different-after-hash" });

    expect(first).toEqual(second);
    expect(first.id).toMatch(/^audit-log-[a-f0-9]{12}$/);
    expect(changed.id).not.toBe(first.id);
    expect(first.notLegalAdviceBoundary).toBe("Not legal advice. Audit log records are review workspace metadata.");
  });

  it("summarizes model gateway runs without exposing credentials", () => {
    const run: ModelGatewayRun = {
      recordVersion: "lexproof-model-gateway-run-v1",
      id: "model-run-1",
      workspaceId: "workspace-1",
      provider: "openai-compatible",
      providerLabel: "OpenAI-compatible gateway",
      model: "gpt-4.1-mini",
      purpose: "Draft audit-prep issue spotting for counsel review.",
      status: "completed",
      redactionStatus: "clean",
      payloadHash: "payload-sha-256",
      responseHash: "response-sha-256",
      sourceEvidenceHash: "source-evidence-sha-256",
      humanReviewStatus: "needs-review",
      providerMetadata: {
        adapterMode: "external-provider-placeholder",
        credentialPolicy: "deferred until server-side secret policy is approved",
        secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
        allowedDataClasses: ["audit-prep metadata"]
      },
      attempt: 1,
      maxAttempts: 1,
      retryState: "not-needed",
      remediationSteps: [],
      createdAt: "2026-06-29T10:00:00.000Z",
      completedAt: "2026-06-29T10:00:12.000Z",
      notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
    };

    const summary = createModelGatewayRunSummary(run);

    expect(summary).toEqual({
      id: "model-run-1",
      providerLabel: "OpenAI-compatible gateway",
      model: "gpt-4.1-mini",
      status: "completed",
      redactionStatus: "clean",
      humanReviewStatus: "needs-review",
      payloadHash: "payload-sha-256",
      responseHash: "response-sha-256",
      sourceEvidenceHash: "source-evidence-sha-256",
      retryState: "not-needed",
      remediationSteps: [],
      requiresHumanReview: true,
      boundary: "AI-assisted draft for audit preparation only. Not legal advice."
    });
    expect(JSON.stringify(summary).toLowerCase()).not.toContain("api");
    expect(JSON.stringify(summary).toLowerCase()).not.toContain("key");
  });

  it("returns explicit evidence vault validation errors", () => {
    const record: EvidenceVaultRecord = {
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: "evidence-1",
      workspaceId: "",
      filename: "",
      mimeType: "application/pdf",
      byteSize: 0,
      fileHash: "",
      storageMode: "server-vault",
      status: "submitted",
      owner: "",
      sourceNote: "Contains raw passport scans.",
      version: 1,
      linkedRiskFlagIds: ["custody"],
      linkedControlIds: [],
      containsRawKycOrPersonalData: true,
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    };

    expect(validateEvidenceVaultRecord(record)).toEqual({
      valid: false,
      errors: [
        "Workspace ID is required.",
        "Evidence filename is required.",
        "Evidence file hash is required.",
        "Evidence owner is required.",
        "Evidence byte size must be greater than zero.",
        "Raw KYC or personal data cannot be stored in the Phase 2 evidence vault draft."
      ]
    });
  });
});
