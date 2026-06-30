import { describe, expect, it, vi } from "vitest";
import { analyzeAuditProfile, type AuditResult } from "./auditEngine";
import { createDataBoundaryReport } from "./dataBoundary";
import {
  createGrcTicketExport,
  downloadGrcTicketExportJson,
  exportGrcTicketExportJson
} from "./grcTicketExport";
import { createIntegrationReadinessRegistry } from "./integrationReadiness";
import type { ModelConnectReceipt } from "./modelConnect";
import type { EvidenceItem, ProjectProfile } from "./projectModel";
import { createRetentionPolicyReport } from "./retentionPolicy";
import { createSecurityReviewChecklist } from "./securityReviewChecklist";

const baseProject: ProjectProfile = {
  id: "grc-export-project",
  projectName: "GRC Export Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "Policy metadata only",
  aiUsage: "AI drafts audit-prep questions",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Private beta",
  evidenceItems: [],
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z"
};

const modelReceipt: ModelConnectReceipt = {
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

describe("createGrcTicketExport", () => {
  it("creates a metadata-only remediation ticket bundle when the GRC adapter is ready", () => {
    const evidenceItems: EvidenceItem[] = [
      {
        id: "policy-summary",
        label: "Policy summary metadata",
        kind: "Markdown",
        content: "Raw memo body should stay outside the GRC ticket payload.",
        source: "Synthetic policy memo",
        status: "verified",
        owner: "Compliance"
      }
    ];
    const project = { ...baseProject, evidenceItems };
    const audit = analyzeAuditProfile(project);
    const bundle = createGrcTicketExport({
      project,
      audit,
      integrationReadinessRegistry: createRegistry(project, audit, evidenceItems),
      generatedAt: "2026-06-30T12:00:00.000Z"
    });

    expect(bundle).toEqual(
      expect.objectContaining({
        bundleVersion: "lexproof-grc-ticket-export-v1",
        projectId: project.id,
        projectName: project.projectName,
        riskLevel: audit.riskLevel,
        adapterStatus: "ready",
        exportAllowed: true,
        ticketCount: audit.remediation.length,
        notLegalAdviceBoundary: "Not legal advice. GRC ticket exports are audit preparation workflow metadata only."
      })
    );
    expect(bundle.tickets[0]).toEqual(
      expect.objectContaining({
        title: expect.stringContaining(audit.remediation[0].owner),
        owner: audit.remediation[0].owner,
        priority: audit.remediation[0].priority,
        status: "open",
        sourceTitles: expect.arrayContaining(["BLI Legal Tech Hackathon 2"]),
        notLegalAdviceBoundary: "Not legal advice. GRC ticket records are audit preparation workflow metadata only."
      })
    );
    expect(bundle.tickets.some((ticket) => ticket.linkedRiskFlagIds.includes("asset-yield"))).toBe(true);
    expect(JSON.stringify(bundle)).not.toContain("Raw memo body should stay outside");
  });

  it("blocks ticket export when integration readiness is unsafe without leaking secrets or raw KYC", () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const evidenceItems: EvidenceItem[] = [
      {
        id: "unsafe",
        label: "Unsafe packet",
        kind: "Text",
        content: `Contains ${apiKey}, private key ${privateKey}, and raw KYC packet.`,
        source: "Synthetic unsafe packet",
        status: "received",
        owner: "Compliance"
      }
    ];
    const project = { ...baseProject, evidenceItems };
    const audit = analyzeAuditProfile(project);
    const registry = createRegistry(project, audit, evidenceItems, {
      ...modelReceipt,
      status: "blocked",
      blockers: [`Do not route ${apiKey} or ${privateKey}.`]
    });

    const bundle = createGrcTicketExport({
      project,
      audit,
      integrationReadinessRegistry: registry,
      generatedAt: "2026-06-30T12:00:00.000Z"
    });

    expect(bundle.exportAllowed).toBe(false);
    expect(bundle.adapterStatus).toBe("blocked");
    expect(bundle.tickets).toEqual([]);
    expect(bundle.blockers.length).toBeGreaterThan(0);
    expect(JSON.stringify(bundle)).not.toContain(apiKey);
    expect(JSON.stringify(bundle)).not.toContain(privateKey);
    expect(JSON.stringify(bundle)).not.toContain("raw KYC packet");
    expect(bundle.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining("Remove blocked materials before enabling this adapter.")])
    );
  });
});

describe("exportGrcTicketExportJson", () => {
  it("serializes a ticket export bundle with a trailing newline", () => {
    const project: ProjectProfile = {
      ...baseProject,
      evidenceItems: [
        {
          id: "policy-summary",
          label: "Policy summary metadata",
          kind: "Markdown",
          content: "Metadata only",
          status: "verified",
          owner: "Compliance"
        }
      ]
    };
    const audit = analyzeAuditProfile(project);
    const bundle = createGrcTicketExport({
      project,
      audit,
      integrationReadinessRegistry: createRegistry(project, audit, project.evidenceItems),
      generatedAt: "2026-06-30T12:00:00.000Z"
    });
    const json = exportGrcTicketExportJson(bundle);

    expect(json.endsWith("\n")).toBe(true);
    expect(JSON.parse(json)).toEqual(bundle);
  });
});

describe("downloadGrcTicketExportJson", () => {
  it("downloads the GRC ticket export JSON bundle", () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:grc-ticket-export");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadGrcTicketExportJson("grc-ticket-export", {
        bundleVersion: "lexproof-grc-ticket-export-v1",
        projectId: "project",
        projectName: "Project",
        riskLevel: "high",
        adapterStatus: "ready",
        exportAllowed: true,
        blockerCount: 0,
        blockers: [],
        ticketCount: 0,
        tickets: [],
        generatedAt: "2026-06-30T12:00:00.000Z",
        notLegalAdviceBoundary: "Not legal advice. GRC ticket exports are audit preparation workflow metadata only."
      });

      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:grc-ticket-export");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });
});

function createRegistry(
  project: ProjectProfile,
  audit: AuditResult,
  evidenceItems: EvidenceItem[],
  receipt: ModelConnectReceipt | null = modelReceipt
) {
  const securityReviewChecklist = createSecurityReviewChecklist({
    modelConnectReceipt: receipt,
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
    manifestHash: "a".repeat(64)
  });

  return createIntegrationReadinessRegistry({
    securityReviewChecklist,
    modelConnectReceipt: receipt,
    evidenceCount: evidenceItems.length,
    manifestHash: "a".repeat(64),
    remediationItemCount: audit.remediation.length,
    counselPackVersionCount: 0
  });
}
