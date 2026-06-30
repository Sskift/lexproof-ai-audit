import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryControlMatrix, exportRegulatoryControlMatrixJson } from "./regulatoryControlMatrix";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import type { ProjectProfile } from "./projectModel";

const globalLaunchProject: ProjectProfile = {
  id: "project-control-matrix",
  projectName: "Global Yield Launch",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union", "United Kingdom", "Singapore"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata and wallet transaction history",
  aiUsage: "AI drafts evidence summaries for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createRegulatoryControlMatrix", () => {
  it("turns source graph clauses into prioritized controls without legal conclusions", () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });

    const matrix = createRegulatoryControlMatrix({ graph, sourceReview });

    expect(matrix.matrixVersion).toBe("lexproof-regulatory-control-matrix-v1");
    expect(matrix.projectId).toBe(globalLaunchProject.id);
    expect(matrix.status).toBe("needs-evidence");
    expect(matrix.summary.needsEvidenceCount).toBeGreaterThan(0);
    expect(matrix.controls[0]).toEqual(
      expect.objectContaining({
        status: "needs-evidence",
        sourceReviewStatus: "current",
        evidenceCoverageStatus: "missing",
        openEvidenceRequestCount: expect.any(Number),
        nextAction: expect.stringContaining("Prepare")
      })
    );
    expect(matrix.controls.map((control) => control.clauseId)).toEqual(
      expect.arrayContaining(["us-sec-cftc-crypto-asset-interpretation", "eu-mica-title-ii-white-paper"])
    );
    expect(matrix.notLegalAdviceBoundary).toBe("Not legal advice. Regulatory control matrices are audit preparation workflow metadata only.");
    expect(JSON.stringify(matrix)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks controls ready only when evidence is covered and source review is current", () => {
    const project: ProjectProfile = {
      ...globalLaunchProject,
      jurisdictions: ["European Union"],
      aiUsage: "Manual evidence summary only",
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
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });

    const matrix = createRegulatoryControlMatrix({ graph, sourceReview });

    expect(matrix.status).toBe("ready-for-counsel");
    expect(matrix.summary.readyForCounselCount).toBe(1);
    expect(matrix.controls[0]).toEqual(
      expect.objectContaining({
        clauseId: "eu-mica-title-ii-white-paper",
        status: "ready-for-counsel",
        openEvidenceRequestCount: 0,
        nextAction: "Route EU crypto-asset / data protection counsel control to counsel review with covered evidence."
      })
    );
  });

  it("routes stale sources to source review even when evidence is covered", () => {
    const project: ProjectProfile = {
      ...globalLaunchProject,
      jurisdictions: ["European Union"],
      aiUsage: "Manual evidence summary only",
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
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-10-01T00:00:00.000Z" });

    const matrix = createRegulatoryControlMatrix({ graph, sourceReview });

    expect(matrix.status).toBe("needs-source-review");
    expect(matrix.summary.needsSourceReviewCount).toBe(1);
    expect(matrix.controls[0]).toEqual(
      expect.objectContaining({
        status: "needs-source-review",
        sourceReviewStatus: "review-due",
        nextAction: "Refresh Regulation (EU) 2023/1114, Title II source metadata before counsel handoff."
      })
    );
  });

  it("exports metadata-only JSON with stable control fields", () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });
    const matrix = createRegulatoryControlMatrix({ graph, sourceReview });

    const exported = exportRegulatoryControlMatrixJson(matrix);
    const parsed = JSON.parse(exported);

    expect(parsed).toEqual(
      expect.objectContaining({
        matrixVersion: "lexproof-regulatory-control-matrix-v1",
        controlCount: matrix.controls.length,
        notLegalAdviceBoundary: "Not legal advice. Regulatory control matrices are audit preparation workflow metadata only."
      })
    );
    expect(exported).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });
});
