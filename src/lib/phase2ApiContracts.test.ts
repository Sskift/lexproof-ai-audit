import { describe, expect, it } from "vitest";
import {
  createPhase2PrismaSchemaDraft,
  listPhase2ApiRoutes,
  validateEvidenceUploadBoundary,
  validateModelGatewayBoundary,
  type EvidenceUploadBoundaryInput,
  type ModelGatewayBoundaryInput
} from "./phase2ApiContracts";

describe("Phase 2 backend API contracts", () => {
  it("lists review workspace API routes for every Week 2 backend domain", () => {
    const routes = listPhase2ApiRoutes();
    const domains = new Set(routes.map((route) => route.domain));

    expect(domains).toEqual(new Set(["workspaces", "evidence-vault", "model-gateway", "human-review", "exports", "audit-log"]));
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/workspaces/:workspaceId/model-runs",
        domain: "model-gateway",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/workspaces/:workspaceId/reviews",
        domain: "human-review",
        implemented: true
      })
    );
    expect(routes.every((route) => route.notLegalAdviceBoundary.includes("Not legal advice"))).toBe(true);
  });

  it("blocks model gateway requests that bypass redaction, include credentials, or ask for legal decisions", () => {
    const request: ModelGatewayBoundaryInput = {
      provider: "openai-compatible",
      model: "gpt-4.1-mini",
      purpose: "Make final legal decision for launch approval.",
      redactionStatus: "blocked",
      includesCredentialMaterial: true,
      includesRawKycOrPersonalData: true,
      humanReviewOwner: ""
    };

    expect(validateModelGatewayBoundary(request)).toEqual({
      valid: false,
      errors: [
        "Model Gateway request must pass the Redaction Gate before provider calls.",
        "Model Gateway requests must not include API keys, private keys, or credential material.",
        "Raw KYC or personal data cannot be sent through the Model Gateway draft.",
        "Model Gateway purpose cannot request final legal decisions.",
        "Human review owner is required before external reliance on model output."
      ]
    });
  });

  it("blocks evidence upload boundaries that include raw content or KYC in the contract draft", () => {
    const upload: EvidenceUploadBoundaryInput = {
      workspaceId: "workspace-1",
      filename: "passport.pdf",
      byteSize: 1024,
      declaredHash: "sha-256",
      uploadMode: "multipart",
      includesRawDocumentContentInApiJson: true,
      containsRawKycOrPersonalData: true
    };

    expect(validateEvidenceUploadBoundary(upload)).toEqual({
      valid: false,
      errors: [
        "Evidence upload JSON must carry metadata only, not raw document content.",
        "Raw KYC or personal data cannot be accepted in the Phase 2 evidence upload draft."
      ]
    });
  });

  it("drafts a Prisma schema with the five Phase 2 persistence models", () => {
    const schema = createPhase2PrismaSchemaDraft();

    expect(schema).toContain("model WorkspaceRecord");
    expect(schema).toContain("model EvidenceVaultRecord");
    expect(schema).toContain("model ModelGatewayRun");
    expect(schema).toContain("model HumanReviewRecord");
    expect(schema).toContain("model AuditLogRecord");
    expect(schema).not.toContain("model Kyc");
    expect(schema).not.toContain("model LegalDecision");
    expect(schema).not.toContain("model ChainTransaction");
  });
});
