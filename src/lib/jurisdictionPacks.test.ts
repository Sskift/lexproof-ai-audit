import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createJurisdictionPacks } from "./jurisdictionPacks";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "jurisdiction-pack-project",
  projectName: "Global Launch Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union", "United Kingdom", "Brazil"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata and wallet transaction history",
  aiUsage: "AI flags missing approvals with source lineage",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      id: "us-approval",
      label: "US launch approval memo",
      kind: "Markdown",
      content: "Disclosure approval, offering memo, eligibility review, and go-live signoff.",
      status: "verified",
      owner: "Counsel"
    }
  ]
};

describe("createJurisdictionPacks", () => {
  it("creates deeper jurisdiction packs with policy controls and local-counsel routing", () => {
    const audit = analyzeAuditProfile(project);
    const packs = createJurisdictionPacks(project, audit);

    expect(packs.map((pack) => pack.jurisdiction)).toEqual(
      expect.arrayContaining(["United States", "European Union", "United Kingdom", "Brazil"])
    );

    const usPack = packs.find((pack) => pack.jurisdiction === "United States");
    expect(usPack).toMatchObject({
      packVersion: "lexproof-jurisdiction-pack-v1",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel",
        trigger: "Yield-bearing or investment-like asset"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-offering-disclosure-control",
          title: "Offering and disclosure control",
          status: "evidence-ready",
          evidenceLabels: ["US launch approval memo"]
        }),
        expect.objectContaining({
          id: "us-custody-control",
          title: "Custody and wallet authority control",
          status: "needs-evidence"
        })
      ])
    );

    const euPack = packs.find((pack) => pack.jurisdiction === "European Union");
    expect(euPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining(["Crypto-asset disclosure provenance control", "Data minimization and model-call control"])
    );

    const brazilPack = packs.find((pack) => pack.jurisdiction === "Brazil");
    expect(brazilPack).toMatchObject({
      jurisdiction: "Brazil",
      localCounselRoute: {
        recommendedRole: "Local counsel",
        trigger: "Unmapped jurisdiction"
      }
    });
  });
});
