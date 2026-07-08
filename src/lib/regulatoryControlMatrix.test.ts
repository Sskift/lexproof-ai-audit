import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createEvidenceItemsFromTemplate } from "./evidenceTemplates";
import { createRegulatoryControlMatrix, exportRegulatoryControlMatrixJson } from "./regulatoryControlMatrix";
import { createRegulatoryControlMatrixFilterOptions, filterRegulatoryControlMatrixControls } from "./regulatoryControlMatrixFilters";
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
      assetModel: "Crypto-asset public communication and white paper disclosure review",
      custodyModel: "No custody; issuer only prepares metadata summaries for counsel review",
      dataSensitivity: "Public disclosure metadata and source-lineage notes for this review fixture",
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

  it("keeps evidence request titles limited to open requests when a control is partially covered", () => {
    const project: ProjectProfile = {
      ...globalLaunchProject,
      id: "project-hkma-partial-control-matrix",
      projectName: "HarborMint Stablecoin Issuer Review",
      jurisdictions: ["Hong Kong"],
      entityType: "Fiat-referenced stablecoin issuer",
      assetModel:
        "Fiat-referenced stablecoin issuer with specified stablecoin issuance, reserve assets, redemption, and HKMA licence application planning",
      userType: "Hong Kong treasury partners, compliance reviewers, and local counsel",
      custodyModel: "Reserve assets are planned for segregated safekeeping with qualified custodians",
      dataSensitivity: "CDD status summaries and alert metadata excluded from exported demo evidence",
      aiUsage: "AI drafts HKMA stablecoin issuer evidence summaries for human review",
      operatingStage: "Pre-application HKMA stablecoin issuer review before local counsel signoff",
      evidenceItems: [
        {
          id: "hkma-licensing-scope",
          label: "HKMA stablecoin issuer licensing scope note",
          kind: "Memo",
          content: "Hong Kong stablecoin issuer, fiat-referenced stablecoin, Stablecoins Ordinance, HKMA licence application, regulated stablecoin activity, and Hong Kong principal place evidence.",
          status: "verified",
          owner: "Counsel"
        }
      ]
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });

    const matrix = createRegulatoryControlMatrix({ graph, sourceReview });
    const control = matrix.controls.find((item) => item.clauseId === "hk-hkma-stablecoin-issuer-regime");

    expect(control).toMatchObject({
      evidenceCoverageStatus: "partial",
      coveredEvidenceCount: 1,
      totalEvidenceRequestCount: 3,
      openEvidenceRequestCount: 2,
      evidenceRequestTitles: [
        "Hong Kong HKMA stablecoin reserve, redemption, and supervision evidence",
        "Hong Kong HKMA stablecoin AML/CFT and user-protection evidence"
      ]
    });
  });

  it("routes EU AI Act provider quality controls to counsel when source and evidence are current", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("ai-compliance-workflow").map((item, index) => ({
      ...item,
      id: `ai-provider-matrix-${index + 1}`,
      status: "verified" as const
    }));
    const project: ProjectProfile = {
      ...globalLaunchProject,
      id: "project-eu-ai-provider-control-matrix",
      projectName: "EuroModel Provider Dossier",
      jurisdictions: ["European Union"],
      entityType: "High-risk AI provider preparing a provider conformity file",
      assetModel:
        "High-risk AI provider quality management system, risk management system, technical documentation, data governance, record-keeping logs, instructions for use, and provider conformity file review",
      userType: "EU deployer compliance reviewers and local counsel",
      custodyModel: "No asset safekeeping; AI provider evidence is metadata-only",
      dataSensitivity: "Training data governance summaries with raw records excluded",
      aiUsage: "Manual provider quality dossier for counsel review",
      blockchainUse: "No ledger output for this source-control fixture",
      operatingStage: "Pre-market provider quality-system review before local counsel signoff",
      evidenceItems
    };
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });

    const matrix = createRegulatoryControlMatrix({ graph, sourceReview });
    const providerControl = matrix.controls.find((item) => item.clauseId === "eu-ai-act-high-risk-provider-quality-documentation");

    expect(matrix.summary.readyForCounselCount).toBeGreaterThanOrEqual(1);
    expect(providerControl).toEqual(
      expect.objectContaining({
        controlId: "control-eu-ai-act-high-risk-provider-quality-documentation",
        clauseId: "eu-ai-act-high-risk-provider-quality-documentation",
        topic: "ai-governance",
        status: "ready-for-counsel",
        sourceReviewStatus: "current",
        evidenceCoverageStatus: "covered",
        openEvidenceRequestCount: 0,
        localCounselRole: "EU AI Act high-risk provider / quality-system counsel",
        nextAction: "Route EU AI Act high-risk provider / quality-system counsel control to counsel review with covered evidence."
      })
    );
    expect(JSON.stringify(matrix)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("routes stale sources to source review even when evidence is covered", () => {
    const project: ProjectProfile = {
      ...globalLaunchProject,
      jurisdictions: ["European Union"],
      assetModel: "Crypto-asset public communication and white paper disclosure review",
      custodyModel: "No custody; issuer only prepares metadata summaries for counsel review",
      dataSensitivity: "Public disclosure metadata and source-lineage notes for this review fixture",
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

  it("filters controls by jurisdiction, topic, status, and search query without legal conclusions", () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });
    const matrix = createRegulatoryControlMatrix({ graph, sourceReview });

    const filtered = filterRegulatoryControlMatrixControls(matrix.controls, {
      jurisdiction: "United States",
      topic: "aml-cft",
      status: "needs-evidence",
      query: "OFAC blocked property"
    });

    expect(filtered.map((control) => control.clauseId)).toEqual(["us-ofac-virtual-currency-sanctions-compliance"]);
    expect(JSON.stringify(filtered)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("builds stable filter options from the current control set", () => {
    const audit = analyzeAuditProfile(globalLaunchProject);
    const graph = createRegulatoryGraph(globalLaunchProject, audit, globalLaunchProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-15T00:00:00.000Z" });
    const matrix = createRegulatoryControlMatrix({ graph, sourceReview });

    const options = createRegulatoryControlMatrixFilterOptions(matrix.controls);

    expect(options.jurisdictions).toEqual(expect.arrayContaining(["European Union", "Singapore", "United Kingdom", "United States"]));
    expect(options.topics).toEqual(expect.arrayContaining(["aml-cft", "asset-classification", "custody", "marketing"]));
    expect(options.statuses).toEqual(["needs-evidence"]);
  });
});
