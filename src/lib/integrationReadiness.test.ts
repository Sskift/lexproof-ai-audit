import { describe, expect, it } from "vitest";
import { createDataBoundaryReport } from "./dataBoundary";
import { createIntegrationReadinessRegistry } from "./integrationReadiness";
import type { ModelConnectReceipt } from "./modelConnect";
import type { EvidenceItem, ProjectProfile } from "./projectModel";
import { createRetentionPolicyReport } from "./retentionPolicy";
import { createSecurityReviewChecklist } from "./securityReviewChecklist";

const baseProject: ProjectProfile = {
  id: "integration-readiness-project",
  projectName: "Integration Readiness Desk",
  entityType: "Delaware C-corp issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized private credit note",
  userType: "Accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "Policy metadata only",
  aiUsage: "AI drafts audit-prep questions",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Private beta",
  evidenceItems: [],
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z"
};

const mockReceipt: ModelConnectReceipt = {
  receiptVersion: "lexproof-model-connect-receipt-v1",
  provider: "mock",
  providerLabel: "Mock local reviewer",
  model: "lexproof-mock",
  endpointHost: "local mock",
  status: "ready",
  mode: "local-mock",
  blockers: [],
  createdAt: "2026-06-30T00:00:00.000Z",
  notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only."
};

describe("createIntegrationReadinessRegistry", () => {
  it("summarizes disabled, needs-policy, and ready adapter states without enabling real external calls", () => {
    const evidenceItems: EvidenceItem[] = [
      {
        id: "board-memo",
        label: "Board approval metadata",
        kind: "Markdown",
        content: "Approval summary and control owner metadata only.",
        source: "Synthetic board memo",
        status: "verified",
        owner: "Compliance"
      }
    ];
    const securityReviewChecklist = createSecurityReviewChecklist({
      modelConnectReceipt: mockReceipt,
      retentionPolicyReport: createRetentionPolicyReport({
        workspaceId: baseProject.id,
        evidenceItems
      }),
      dataBoundaryReport: createDataBoundaryReport({
        project: { ...baseProject, evidenceItems },
        evidenceItems,
        counselQuestions: [],
        counselReviews: [],
        aiEvents: []
      }),
      evidenceCount: evidenceItems.length,
      manifestHash: "a".repeat(64)
    });

    const registry = createIntegrationReadinessRegistry({
      securityReviewChecklist,
      modelConnectReceipt: mockReceipt,
      evidenceCount: evidenceItems.length,
      manifestHash: "a".repeat(64),
      remediationItemCount: 3,
      counselPackVersionCount: 1
    });

    expect(registry).toEqual(
      expect.objectContaining({
        registryVersion: "lexproof-integration-readiness-registry-v1",
        overallStatus: "needs-policy",
        readyCount: 1,
        blockedCount: 0,
        notLegalAdviceBoundary: "Not legal advice. Integration readiness output is audit preparation metadata only."
      })
    );
    expect(registry.adapters.map((adapter) => [adapter.id, adapter.status])).toEqual([
      ["server-model-provider", "disabled"],
      ["object-storage-vault", "needs-policy"],
      ["chain-anchor", "needs-policy"],
      ["document-parser-ocr", "disabled"],
      ["grc-ticket-export", "ready"]
    ]);
    expect(registry.adapters.find((adapter) => adapter.id === "server-model-provider")).toEqual(
      expect.objectContaining({
        disabledReason: expect.stringContaining("disabled by default"),
        requiredPolicy: expect.stringMatching(/server-side secret policy/i)
      })
    );
    expect(registry.adapters.find((adapter) => adapter.id === "grc-ticket-export")).toEqual(
      expect.objectContaining({
        readinessEvidence: expect.stringContaining("3 remediation items"),
        recoveryAction: expect.stringContaining("Export metadata")
      })
    );
    expect(JSON.stringify(registry)).toContain("Not legal advice");
    expect(JSON.stringify(registry)).not.toContain("real on-chain write");
  });

  it("blocks unsafe adapter readiness without echoing credential or private-key material", () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const evidenceItems: EvidenceItem[] = [
      {
        id: "unsafe-evidence",
        label: "Unsafe integration packet",
        kind: "Text",
        content: `Contains ${apiKey}, private key ${privateKey}, and raw KYC packet.`,
        source: "Synthetic unsafe packet",
        status: "received",
        owner: "Compliance"
      }
    ];
    const blockedReceipt: ModelConnectReceipt = {
      ...mockReceipt,
      status: "blocked",
      blockers: [`Do not route ${apiKey} or ${privateKey} to provider.`]
    };
    const project = { ...baseProject, evidenceItems };
    const securityReviewChecklist = createSecurityReviewChecklist({
      modelConnectReceipt: blockedReceipt,
      retentionPolicyReport: createRetentionPolicyReport({
        workspaceId: project.id,
        evidenceItems
      }),
      dataBoundaryReport: createDataBoundaryReport({
        project,
        evidenceItems,
        counselQuestions: [],
        counselReviews: [],
        aiEvents: []
      }),
      evidenceCount: evidenceItems.length,
      manifestHash: "b".repeat(64)
    });

    const registry = createIntegrationReadinessRegistry({
      securityReviewChecklist,
      modelConnectReceipt: blockedReceipt,
      evidenceCount: evidenceItems.length,
      manifestHash: "b".repeat(64),
      remediationItemCount: 2,
      counselPackVersionCount: 0
    });

    expect(registry.overallStatus).toBe("blocked");
    expect(registry.blockedCount).toBeGreaterThanOrEqual(4);
    expect(registry.adapters.find((adapter) => adapter.id === "server-model-provider")).toMatchObject({
      status: "blocked",
      validationErrors: expect.arrayContaining([expect.stringContaining("[redacted-api-key]")])
    });
    expect(registry.adapters.find((adapter) => adapter.id === "document-parser-ocr")).toMatchObject({
      status: "blocked",
      recoveryAction: expect.stringContaining("Remove blocked materials")
    });
    expect(JSON.stringify(registry)).not.toContain(apiKey);
    expect(JSON.stringify(registry)).not.toContain(privateKey);
    expect(JSON.stringify(registry)).not.toContain("raw KYC packet");
  });

  it("blocks chain anchor readiness when the manifest exists but evidence is empty", () => {
    const evidenceItems: EvidenceItem[] = [];
    const securityReviewChecklist = createSecurityReviewChecklist({
      modelConnectReceipt: mockReceipt,
      retentionPolicyReport: createRetentionPolicyReport({
        workspaceId: baseProject.id,
        evidenceItems
      }),
      dataBoundaryReport: createDataBoundaryReport({
        project: baseProject,
        evidenceItems,
        counselQuestions: [],
        counselReviews: [],
        aiEvents: []
      }),
      evidenceCount: evidenceItems.length,
      manifestHash: "c".repeat(64)
    });

    const registry = createIntegrationReadinessRegistry({
      securityReviewChecklist,
      modelConnectReceipt: mockReceipt,
      evidenceCount: evidenceItems.length,
      manifestHash: "c".repeat(64),
      remediationItemCount: 1,
      counselPackVersionCount: 0
    });

    expect(registry.overallStatus).toBe("blocked");
    expect(registry.adapters.find((adapter) => adapter.id === "chain-anchor")).toEqual(
      expect.objectContaining({
        status: "blocked",
        readinessEvidence: "No metadata-only evidence records are available for anchor review.",
        validationErrors: ["Add at least one metadata-only evidence item before chain anchor policy review."],
        recoveryAction: "Add metadata-only evidence in the Evidence Ledger before enabling this adapter.",
        notLegalAdviceBoundary: "Not legal advice. Integration adapter readiness is audit preparation metadata only."
      })
    );
  });
});
