import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createJurisdictionPacks } from "./jurisdictionPacks";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "jurisdiction-pack-project",
  projectName: "Global Launch Desk",
  entityType: "Startup issuer",
  jurisdictions: [
    "United States",
    "European Union",
    "United Kingdom",
    "Singapore",
    "Hong Kong",
    "Switzerland",
    "United Arab Emirates",
    "Brazil"
  ],
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
      expect.arrayContaining([
        "United States",
        "European Union",
        "United Kingdom",
        "Singapore",
        "Hong Kong",
        "Switzerland",
        "United Arab Emirates",
        "Brazil"
      ])
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

    const singaporePack = packs.find((pack) => pack.jurisdiction === "Singapore");
    expect(singaporePack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Singapore fintech / digital asset counsel"
      }
    });
    expect(singaporePack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining(["Product scope and launch-intake control", "Custody, AML, and data handoff control"])
    );

    const hongKongPack = packs.find((pack) => pack.jurisdiction === "Hong Kong");
    expect(hongKongPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Hong Kong virtual asset trading platform counsel"
      }
    });
    expect(hongKongPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining(["VATP client asset custody control", "Wallet governance and compensation arrangement control"])
    );

    const switzerlandPack = packs.find((pack) => pack.jurisdiction === "Switzerland");
    expect(switzerlandPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Swiss DLT / financial services counsel"
      }
    });
    expect(switzerlandPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining(["Token classification and prospectus-intake control", "Foundation, custody, and banking perimeter control"])
    );

    const uaePack = packs.find((pack) => pack.jurisdiction === "United Arab Emirates");
    expect(uaePack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "UAE virtual-assets / financial regulatory counsel"
      }
    });
    expect(uaePack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "Virtual asset activity scope control",
        "Marketing approval and audience-control control",
        "KOL, incentive, and marketing recordkeeping control",
        "Marketing, custody, and cross-border access control"
      ])
    );

    const brazilPack = packs.find((pack) => pack.jurisdiction === "Brazil");
    expect(brazilPack).toMatchObject({
      jurisdiction: "Brazil",
      localCounselRoute: {
        recommendedRole: "Brazil virtual-assets / capital markets counsel"
      }
    });
    expect(brazilPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "Virtual asset service authorization and AML/CFT control",
        "Crypto-security classification and disclosure control"
      ])
    );
    expect(brazilPack?.source).toBe("LexProof jurisdiction pack v1 for audit preparation. Not legal advice.");
  });
});
