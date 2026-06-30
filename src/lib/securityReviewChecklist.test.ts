import { describe, expect, it } from "vitest";
import { createDataBoundaryReport } from "./dataBoundary";
import { createRetentionPolicyReport } from "./retentionPolicy";
import { createSecurityReviewChecklist } from "./securityReviewChecklist";
import type { ModelConnectReceipt } from "./modelConnect";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

const baseProject: ProjectProfile = {
  id: "security-review-project",
  projectName: "Security Review Desk",
  entityType: "Delaware C-corp issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized private credit note",
  userType: "Accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "Policy metadata only",
  aiUsage: "AI drafts counsel questions",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Private beta",
  evidenceItems: [],
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z"
};

const readyMockReceipt: ModelConnectReceipt = {
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

describe("createSecurityReviewChecklist", () => {
  it("marks mock model, clean metadata storage, and simulated anchor as ready for audit-prep review", () => {
    const evidenceItems: EvidenceItem[] = [
      {
        id: "evidence-clean",
        label: "Board approval metadata",
        kind: "Markdown",
        content: "Board approval summary with no raw KYC files included.",
        source: "Synthetic board approval note",
        status: "verified",
        owner: "Compliance"
      }
    ];
    const project: ProjectProfile = {
      ...baseProject,
      evidenceItems
    };

    const report = createSecurityReviewChecklist({
      modelConnectReceipt: readyMockReceipt,
      retentionPolicyReport: createRetentionPolicyReport({
        workspaceId: project.id,
        evidenceItems: project.evidenceItems
      }),
      dataBoundaryReport: createDataBoundaryReport({
        project,
        evidenceItems: project.evidenceItems,
        counselQuestions: [],
        counselReviews: [],
        aiEvents: []
      }),
      manifestHash: "a".repeat(64),
      evidenceCount: project.evidenceItems.length
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-security-review-checklist-v1",
        overallStatus: "ready",
        blockerCount: 0,
        notLegalAdviceBoundary: "Not legal advice. Security review checklist output is audit preparation metadata only."
      })
    );
    expect(report.items.map((item) => item.status)).toEqual(["ready", "ready", "ready"]);
    expect(report.items.find((item) => item.area === "anchor-integration")).toEqual(
      expect.objectContaining({
        evidence: expect.stringContaining("simulated"),
        requiredBeforeRealIntegration: expect.stringContaining("wallet signing")
      })
    );
  });

  it("blocks unsafe model and evidence boundaries without echoing secret values", () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const evidenceItems: EvidenceItem[] = [
      {
        id: "evidence-unsafe",
        label: "Unsafe packet",
        kind: "Text",
        content: `Contains ${apiKey}, private key ${privateKey}, and raw KYC packet.`,
        source: "Synthetic unsafe packet",
        status: "received",
        owner: "Compliance"
      }
    ];
    const project: ProjectProfile = {
      ...baseProject,
      evidenceItems
    };
    const blockedReceipt: ModelConnectReceipt = {
      ...readyMockReceipt,
      status: "blocked",
      blockers: [`Credential ${apiKey} and private key ${privateKey} must not be routed.`]
    };

    const report = createSecurityReviewChecklist({
      modelConnectReceipt: blockedReceipt,
      retentionPolicyReport: createRetentionPolicyReport({
        workspaceId: project.id,
        evidenceItems: project.evidenceItems
      }),
      dataBoundaryReport: createDataBoundaryReport({
        project,
        evidenceItems: project.evidenceItems,
        counselQuestions: [],
        counselReviews: [],
        aiEvents: []
      }),
      manifestHash: "b".repeat(64),
      evidenceCount: project.evidenceItems.length
    });

    expect(report.overallStatus).toBe("blocked");
    expect(report.blockerCount).toBeGreaterThanOrEqual(2);
    expect(report.items.find((item) => item.area === "model-provider")).toMatchObject({ status: "blocked" });
    expect(report.items.find((item) => item.area === "evidence-storage")).toMatchObject({ status: "blocked" });
    expect(JSON.stringify(report)).not.toContain(apiKey);
    expect(JSON.stringify(report)).not.toContain(privateKey);
    expect(JSON.stringify(report)).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("requires security review for session OpenAI-compatible model routing before server provider integration", () => {
    const sessionReceipt: ModelConnectReceipt = {
      ...readyMockReceipt,
      provider: "openai-compatible",
      providerLabel: "OpenAI-compatible session model",
      model: "gpt-review",
      endpointHost: "api.example.test",
      mode: "session-openai-compatible"
    };
    const report = createSecurityReviewChecklist({
      modelConnectReceipt: sessionReceipt,
      retentionPolicyReport: createRetentionPolicyReport({
        workspaceId: baseProject.id,
        evidenceItems: []
      }),
      dataBoundaryReport: createDataBoundaryReport({
        project: baseProject,
        evidenceItems: [],
        counselQuestions: [],
        counselReviews: [],
        aiEvents: []
      }),
      evidenceCount: 0
    });

    expect(report.overallStatus).toBe("needs-review");
    expect(report.items.find((item) => item.area === "model-provider")).toEqual(
      expect.objectContaining({
        status: "needs-review",
        evidence: expect.stringContaining("session-only"),
        recoveryAction: expect.stringContaining("server-side secret policy")
      })
    );
  });
});
