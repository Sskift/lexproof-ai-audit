import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import {
  createRegulatorySourceCoverageReport,
  exportRegulatorySourceCoverageJson
} from "./regulatorySourceCoverage";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import type { ProjectProfile } from "./projectModel";

const multiJurisdictionProject: ProjectProfile = {
  id: "project-source-coverage",
  projectName: "Global Custody Launch",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union", "Singapore"],
  assetModel: "Tokenized private credit note with yield and public communications",
  userType: "Retail users and accredited investors",
  custodyModel: "Platform custody for tokenized asset records",
  dataSensitivity: "KYC status metadata and wallet transaction labels",
  aiUsage: "AI drafts source-linked audit summaries for human review",
  blockchainUse: "Simulated evidence anchor only",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createRegulatorySourceCoverageReport", () => {
  it("aggregates source coverage by jurisdiction without legal conclusions", async () => {
    const audit = analyzeAuditProfile(multiJurisdictionProject);
    const graph = createRegulatoryGraph(multiJurisdictionProject, audit, multiJurisdictionProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });

    const report = await createRegulatorySourceCoverageReport({
      graph,
      sourceReview,
      generatedAt: "2026-07-15T00:00:00.000Z"
    });

    expect(report.reportVersion).toBe("lexproof-regulatory-source-coverage-v1");
    expect(report.projectId).toBe(multiJurisdictionProject.id);
    expect(report.status).toBe("needs-evidence");
    expect(report.reportHash).toMatch(/^[a-f0-9]{64}$/);
    expect(report.jurisdictions.map((item) => item.jurisdiction)).toEqual(
      expect.arrayContaining(["European Union", "Singapore", "United States"])
    );
    expect(report.sourceCount).toBeGreaterThan(0);
    expect(report.currentSourceCount).toBe(report.sourceCount);
    expect(report.openEvidenceRequestCount).toBeGreaterThan(0);
    expect(report.actions[0]).toEqual(
      expect.objectContaining({
        priority: "P1",
        status: "needs-evidence",
        action: expect.stringContaining("Prepare open source-linked evidence requests")
      })
    );
    expect(report.notLegalAdviceBoundary).toBe("Not legal advice. Regulatory source coverage is audit preparation metadata only.");
    expect(JSON.stringify(report)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("changes the report hash when source review freshness changes", async () => {
    const project: ProjectProfile = {
      ...multiJurisdictionProject,
      jurisdictions: ["European Union"],
      assetModel: "Crypto-asset public communication and white paper disclosure review",
      custodyModel: "No custody; issuer prepares source-lineage metadata for counsel review",
      dataSensitivity: "Public disclosure metadata only",
      evidenceItems: [
        {
          id: "mica-whitepaper",
          label: "MiCA white paper and public communication review",
          kind: "Counsel memo",
          source: "Regulation (EU) 2023/1114 Title II evidence request",
          content: "Crypto-asset white paper, public communication, risk disclosure, and management approval evidence.",
          status: "verified",
          owner: "Counsel"
        }
      ]
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);
    const currentReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });
    const staleReview = createRegulatorySourceReview(graph, { asOf: "2026-10-01T00:00:00.000Z" });

    const currentReport = await createRegulatorySourceCoverageReport({ graph, sourceReview: currentReview });
    const staleReport = await createRegulatorySourceCoverageReport({ graph, sourceReview: staleReview });

    expect(currentReport.status).toBe("needs-evidence");
    expect(staleReport.status).toBe("needs-source-review");
    expect(staleReport.reviewDueCount).toBeGreaterThan(0);
    expect(staleReport.reportHash).not.toBe(currentReport.reportHash);
  });

  it("captures unsupported jurisdictions as no-source-coverage recovery actions", async () => {
    const project: ProjectProfile = {
      ...multiJurisdictionProject,
      jurisdictions: ["Atlantis"],
      assetModel: "Tokenized yield product",
      custodyModel: "No custody",
      dataSensitivity: "Public metadata only",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });

    const report = await createRegulatorySourceCoverageReport({ graph, sourceReview });

    expect(report.status).toBe("no-source-coverage");
    expect(report.jurisdictions).toEqual([
      expect.objectContaining({
        jurisdiction: "Atlantis",
        priority: "P0",
        sourceCount: 0,
        nextAction: expect.stringContaining("Add source-backed regulatory controls")
      })
    ]);
  });

  it("exports metadata-only JSON with the report hash and Not legal advice boundary", async () => {
    const audit = analyzeAuditProfile(multiJurisdictionProject);
    const graph = createRegulatoryGraph(multiJurisdictionProject, audit, multiJurisdictionProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });
    const report = await createRegulatorySourceCoverageReport({ graph, sourceReview });

    const exported = exportRegulatorySourceCoverageJson(report);
    const parsed = JSON.parse(exported);

    expect(parsed).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-regulatory-source-coverage-v1",
        reportHash: report.reportHash,
        notLegalAdviceBoundary: "Not legal advice. Regulatory source coverage is audit preparation metadata only."
      })
    );
    expect(exported).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });
});
