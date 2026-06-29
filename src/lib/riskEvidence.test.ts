import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createMissingEvidenceChecklist, createRiskEvidenceCoverage } from "./riskEvidence";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "risk-evidence",
  projectName: "Custody Yield Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "Policy metadata only",
  aiUsage: "No model decisions",
  blockchainUse: "No chain writes",
  operatingStage: "Private beta",
  evidenceItems: [
    {
      id: "signer-controls",
      label: "Signer control note",
      kind: "Markdown",
      content: "Multisig signer approval matrix for wallet control and withdrawal authority.",
      status: "received",
      owner: "Compliance"
    },
    {
      id: "incident-runbook",
      label: "Incident response draft",
      kind: "Markdown",
      content: "Custody incident pause procedure and emergency response owner list.",
      status: "requested",
      owner: "Engineering"
    }
  ]
};

describe("createRiskEvidenceCoverage", () => {
  it("groups evidence requirements by risk flag and separates covered, in-progress, and missing evidence", () => {
    const audit = analyzeAuditProfile(project);
    const coverage = createRiskEvidenceCoverage(audit, project.evidenceItems);

    const custodyCoverage = coverage.find((item) => item.flagId === "custody");
    const assetCoverage = coverage.find((item) => item.flagId === "asset-yield");

    expect(custodyCoverage).toMatchObject({
      flagId: "custody",
      coverageStatus: "partial",
      coveredCount: 1,
      totalCount: 2,
      notLegalAdviceBoundary: "Not legal advice. Evidence coverage is audit preparation status only."
    });
    expect(custodyCoverage?.requirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Signer control policy",
          status: "covered",
          matchedEvidenceLabels: ["Signer control note"]
        }),
        expect.objectContaining({
          title: "Custody incident response runbook",
          status: "in-progress",
          matchedEvidenceLabels: ["Incident response draft"]
        })
      ])
    );
    expect(assetCoverage).toMatchObject({
      flagId: "asset-yield",
      coverageStatus: "missing",
      coveredCount: 0,
      totalCount: 2
    });
  });
});

describe("createMissingEvidenceChecklist", () => {
  it("treats requested evidence as still missing for model-review payloads", () => {
    const audit = analyzeAuditProfile(project);
    const checklist = createMissingEvidenceChecklist(audit, project.evidenceItems);

    expect(checklist.find((item) => item.title === "Signer control policy")).toMatchObject({
      status: "covered",
      relatedFlagId: "custody"
    });
    expect(checklist.find((item) => item.title === "Custody incident response runbook")).toMatchObject({
      status: "missing",
      relatedFlagId: "custody"
    });
  });
});
