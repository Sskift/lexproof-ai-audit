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

    expect(domains).toEqual(
      new Set([
        "workspaces",
        "evidence-vault",
        "model-gateway",
        "human-review",
        "source-approvals",
        "source-reviews",
        "exports",
        "audit-log",
        "integrations"
      ])
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/workspaces",
        domain: "workspaces",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/workspaces/:workspaceId/evidence",
        domain: "evidence-vault",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/evidence-manifest",
        domain: "evidence-vault",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/evidence-lineage-digest",
        domain: "evidence-vault",
        requestContract: "EvidenceVaultLineageDigestRequest",
        responseContract: "EvidenceVaultLineageDigest",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/source-reviews/packet",
        domain: "source-reviews",
        requestContract: "ServerSourceReviewPacketRequest",
        responseContract: "ServerRegulatorySourceReviewPacket",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/workspaces/:workspaceId/evidence/:evidenceId/replacement",
        domain: "evidence-vault",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/model-gateway/adapters",
        domain: "model-gateway",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/model-gateway/provider-policy",
        domain: "model-gateway",
        implemented: true,
        responseContract: "ModelGatewayProviderPolicyReport"
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/model-gateway/provider-policy",
        domain: "model-gateway",
        requestContract: "ModelGatewayProviderPolicyReceiptRequest",
        responseContract: "ModelGatewayProviderPolicyReport",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/model-gateway/secret-policy",
        domain: "model-gateway",
        requestContract: "ModelGatewaySecretPolicyRequest",
        responseContract: "ModelGatewaySecretPolicyReport",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/integrations/object-storage/policy",
        domain: "integrations",
        requestContract: "ObjectStoragePolicyRequest",
        responseContract: "ObjectStoragePolicyReport",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/integrations/document-parser/policy",
        domain: "integrations",
        requestContract: "DocumentParserPolicyRequest",
        responseContract: "DocumentParserPolicyReport",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/integrations/chain-anchor/policy",
        domain: "integrations",
        requestContract: "ChainAnchorPolicyRequest",
        responseContract: "ChainAnchorPolicyReport",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/integrations/grc-destination/policy",
        domain: "integrations",
        requestContract: "GrcDestinationPolicyRequest",
        responseContract: "GrcDestinationPolicyReport",
        implemented: true
      })
    );
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
        method: "GET",
        path: "/api/workspaces/:workspaceId/model-runs/recovery",
        domain: "model-gateway",
        requestContract: "ModelGatewayRunRecoveryRequest",
        responseContract: "ModelGatewayRunRecoveryPacket",
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
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/workspaces/:workspaceId/source-approvals",
        domain: "source-approvals",
        requestContract: "SourceApprovalSyncRequest",
        responseContract: "RegulatorySourceApprovalSyncResult",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/source-approvals",
        domain: "source-approvals",
        requestContract: "SourceApprovalListRequest",
        responseContract: "RegulatorySourceApprovalRecord[]",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/source-approvals/packet",
        domain: "source-approvals",
        requestContract: "ServerSourceApprovalPacketRequest",
        responseContract: "ServerRegulatorySourceApprovalPacket",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/workspaces/:workspaceId/source-reviews",
        domain: "source-reviews",
        requestContract: "SourceReviewSyncRequest",
        responseContract: "RegulatorySourceReviewSyncResult",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/source-reviews",
        domain: "source-reviews",
        requestContract: "SourceReviewListRequest",
        responseContract: "RegulatorySourceReviewRecord[]",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/integration-policy-evaluations/bundle",
        domain: "integrations",
        requestContract: "IntegrationPolicyEvaluationReceiptBundleRequest",
        responseContract: "IntegrationPolicyEvaluationReceiptBundle",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/reviews/queue",
        domain: "human-review",
        implemented: true,
        responseContract: "ServerHumanReviewQueueView"
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/audit-log",
        domain: "audit-log",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/audit-log/export",
        domain: "audit-log",
        requestContract: "AuditLogExportRequest",
        responseContract: "AuditLogExportRecord",
        implemented: true
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: "/api/workspaces/:workspaceId/exports/counsel-pack",
        domain: "exports",
        implemented: true,
        responseContract: "CounselPackExportRecord"
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/exports",
        domain: "exports",
        implemented: true,
        responseContract: "CounselPackExportRecord[]"
      })
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        method: "GET",
        path: "/api/workspaces/:workspaceId/exports/counsel-pack/recovery",
        domain: "exports",
        requestContract: "CounselPackExportRecoveryRequest",
        responseContract: "CounselPackExportRecoveryPacket",
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
      humanReviewOwner: "",
      allowedDataClasses: []
    };

    expect(validateModelGatewayBoundary(request)).toEqual({
      valid: false,
      errors: [
        "Model Gateway request must pass the Redaction Gate before provider calls.",
        "Model Gateway requests must not include API keys, private keys, or credential material.",
        "Raw KYC or personal data cannot be sent through the Model Gateway draft.",
        "Model Gateway purpose cannot request final legal decisions.",
        "Human review owner is required before external reliance on model output.",
        "Allowed data classes are required before Model Gateway runs.",
        "Allowed data classes must be limited to audit-prep metadata, evidence hashes, risk flag summaries, regulatory source references, or model receipts."
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

  it("drafts a Prisma schema with the six Phase 2 persistence models", () => {
    const schema = createPhase2PrismaSchemaDraft();

    expect(schema).toContain("model WorkspaceRecord");
    expect(schema).toContain("model EvidenceVaultRecord");
    expect(schema).toContain("parentEvidenceId");
    expect(schema).toContain("supersededByEvidenceId");
    expect(schema).toContain("replacementReason");
    expect(schema).toContain("model ModelGatewayRun");
    expect(schema).toContain("sourceEvidenceHash");
    expect(schema).toContain("providerMetadataJson");
    expect(schema).toContain("retryState");
    expect(schema).toContain("remediationStepsJson");
    expect(schema).toContain("model HumanReviewRecord");
    expect(schema).toContain("model CounselPackExportRecord");
    expect(schema).toContain("reviewSummaryJson");
    expect(schema).toContain("manifestHash");
    expect(schema).toContain("artifactHash");
    expect(schema).toContain("model RegulatorySourceReviewRecord");
    expect(schema).toContain("ledgerHash");
    expect(schema).toContain("model AuditLogRecord");
    expect(schema).toContain('provider = "sqlite"');
    expect(schema).toContain('provider = "prisma-client-js"');
    expect(schema).toContain("@@index([workspaceId])");
    expect(schema).not.toContain("model Kyc");
    expect(schema).not.toContain("model LegalDecision");
    expect(schema).not.toContain("model ChainTransaction");
  });
});
