import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createJurisdictionChecklist } from "./jurisdictionChecklist";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "project-jurisdictions",
  projectName: "Global Yield Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union", "United Kingdom"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata references only; raw KYC excluded",
  aiUsage: "AI flags missing approvals with source lineage",
  blockchainUse: "Simulated Ethereum evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      label: "Issuer memo",
      kind: "Markdown",
      content: "Yield terms, target users, redemption policy",
      status: "received",
      owner: "Counsel"
    }
  ]
};

describe("createJurisdictionChecklist", () => {
  it("creates US, EU, and UK audit-prep checklist items without making legal conclusions", () => {
    const audit = analyzeAuditProfile(project);
    const checklist = createJurisdictionChecklist(project, audit);

    expect(checklist.map((item) => `${item.jurisdiction}:${item.title}`)).toEqual(
      expect.arrayContaining([
        "United States:US offering and asset classification review",
        "United States:US custody and wallet-control evidence review",
        "European Union:EU crypto-asset disclosure readiness review",
        "United Kingdom:UK financial promotion and retail exposure review"
      ])
    );
    expect(checklist.every((item) => item.reason.toLowerCase().includes("review"))).toBe(true);
    expect(checklist.some((item) => /is compliant|is unlawful|legal advice/i.test(item.reason))).toBe(false);
  });

  it("marks checklist items as evidence-ready when supporting evidence is present", () => {
    const audit = analyzeAuditProfile(project);
    const checklist = createJurisdictionChecklist(
      {
        ...project,
        evidenceItems: [
          ...project.evidenceItems,
          {
            label: "Custody controls",
            kind: "Policy",
            content: "Signer control policy, wallet control approvals, withdrawal authority, and incident response",
            status: "verified",
            owner: "Compliance"
          }
        ]
      },
      audit
    );

    expect(checklist.find((item) => item.id === "us-custody-wallet-control")).toMatchObject({
      status: "evidence-ready",
      priority: "P0"
    });
  });
});
