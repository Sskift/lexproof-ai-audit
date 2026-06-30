import { describe, expect, it } from "vitest";
import { sampleProfiles } from "../data/sampleProfiles";
import { analyzeAuditProfile } from "./auditEngine";
import { createEvidenceIntakeGuidance } from "./evidenceIntakeGuidance";
import { listEvidenceTemplates, recommendEvidenceTemplates } from "./evidenceTemplates";
import { createRiskEvidenceCoverage } from "./riskEvidence";
import type { ProjectProfile } from "./projectModel";

const yieldPassportEmptyProject: ProjectProfile = {
  ...sampleProfiles[0],
  id: "project-yieldpassport-empty",
  evidenceItems: []
};

describe("createEvidenceIntakeGuidance", () => {
  it("turns an empty high-risk ledger into concrete synthetic-safe next actions", () => {
    const audit = analyzeAuditProfile(yieldPassportEmptyProject);
    const templates = listEvidenceTemplates();
    const recommendedTemplates = recommendEvidenceTemplates(yieldPassportEmptyProject);
    const coverage = createRiskEvidenceCoverage(audit, yieldPassportEmptyProject.evidenceItems);

    const guidance = createEvidenceIntakeGuidance({
      project: yieldPassportEmptyProject,
      evidenceItems: yieldPassportEmptyProject.evidenceItems,
      riskEvidenceCoverage: coverage,
      evidenceTemplates: templates,
      recommendedTemplateIds: recommendedTemplates.map((template) => template.id)
    });

    expect(guidance.status).toBe("needs-evidence");
    expect(guidance.notLegalAdviceBoundary).toBe(
      "Not legal advice. Evidence intake guidance is audit preparation workflow metadata only."
    );
    expect(guidance.summary).toContain("Start with tokenized yield / RWA evidence");
    expect(guidance.actions[0]).toEqual(
      expect.objectContaining({
        actionType: "apply-template",
        templateId: "tokenized-yield-rwa",
        title: "Apply tokenized yield / RWA template"
      })
    );
    expect(guidance.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionType: "prefill-request",
          priority: "P0",
          title: "Asset classification memo",
          source: "risk evidence requirement: asset-classification"
        })
      ])
    );
    expect(JSON.stringify(guidance)).not.toContain("Yield terms, target users, redemption policy");
  });

  it("returns a ready state when ledger evidence already exists", () => {
    const projectWithEvidence: ProjectProfile = {
      ...sampleProfiles[0],
      id: "project-yieldpassport-ready"
    };
    const audit = analyzeAuditProfile(projectWithEvidence);
    const templates = listEvidenceTemplates();
    const coverage = createRiskEvidenceCoverage(audit, projectWithEvidence.evidenceItems);

    const guidance = createEvidenceIntakeGuidance({
      project: projectWithEvidence,
      evidenceItems: projectWithEvidence.evidenceItems,
      riskEvidenceCoverage: coverage,
      evidenceTemplates: templates,
      recommendedTemplateIds: recommendEvidenceTemplates(projectWithEvidence).map((template) => template.id)
    });

    expect(guidance.status).toBe("ready");
    expect(guidance.summary).toContain("3 evidence records already exist");
    expect(guidance.actions.length).toBeGreaterThan(0);
  });
});
