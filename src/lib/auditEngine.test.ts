import { describe, expect, it } from "vitest";
import {
  analyzeAuditProfile,
  buildCounselMemo,
  createEvidenceHash,
  createSubmissionFit,
  type AuditProfile
} from "./auditEngine";

const highRiskProfile: AuditProfile = {
  projectName: "YieldPassport",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC, investor accreditation, transaction history",
  aiUsage: "AI drafts suitability memo and flags restricted investors",
  blockchainUse: "Ethereum evidence anchor and investor status registry",
  operatingStage: "Pilot with planned public launch",
  evidenceItems: [
    { label: "Issuer memo", kind: "PDF", content: "Yield terms, target users, redemption policy" },
    { label: "KYC policy", kind: "Policy", content: "OFAC screening, wallet risk score, accreditation checks" }
  ]
};

const lowerRiskProfile: AuditProfile = {
  projectName: "OpenClause Atlas",
  entityType: "Open-source research project",
  jurisdictions: ["United States"],
  assetModel: "No token sale or custody",
  userType: "Law students and educators",
  custodyModel: "No custody",
  dataSensitivity: "Public legal education materials",
  aiUsage: "AI summarizes public resources with source links",
  blockchainUse: "Optional hash of public lesson versions",
  operatingStage: "Research prototype",
  evidenceItems: [
    { label: "Public syllabus", kind: "Markdown", content: "Blockchain legal education outline" }
  ]
};

describe("analyzeAuditProfile", () => {
  it("classifies custody, retail yield, sensitive data, and public launch as elevated legal audit risk", () => {
    const audit = analyzeAuditProfile(highRiskProfile);

    expect(audit.riskLevel).toBe("critical");
    expect(audit.score).toBeGreaterThanOrEqual(85);
    expect(audit.flags.map((flag) => flag.id)).toEqual(
      expect.arrayContaining(["asset-yield", "custody", "retail", "sensitive-data", "public-launch"])
    );
    expect(audit.remediation.some((item) => item.owner === "Counsel")).toBe(true);
  });

  it("keeps an education-only, no-custody profile below high risk while preserving audit tasks", () => {
    const audit = analyzeAuditProfile(lowerRiskProfile);

    expect(audit.riskLevel).toBe("low");
    expect(audit.score).toBeLessThan(35);
    expect(audit.remediation.length).toBeGreaterThanOrEqual(3);
    expect(audit.flags.map((flag) => flag.id)).not.toContain("custody");
  });
});

describe("createEvidenceHash", () => {
  it("returns a stable sha256 hash for the same evidence bundle", async () => {
    const first = await createEvidenceHash(highRiskProfile.evidenceItems);
    const second = await createEvidenceHash([...highRiskProfile.evidenceItems].reverse().reverse());

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes the hash when evidence content changes", async () => {
    const original = await createEvidenceHash(highRiskProfile.evidenceItems);
    const changed = await createEvidenceHash([
      ...highRiskProfile.evidenceItems,
      { label: "Token terms", kind: "PDF", content: "Updated lockup and redemption rights" }
    ]);

    expect(changed).not.toBe(original);
  });
});

describe("buildCounselMemo", () => {
  it("produces a non-advice legal audit memo with sources, risk posture, and handoff tasks", async () => {
    const audit = analyzeAuditProfile(highRiskProfile);
    const hash = await createEvidenceHash(highRiskProfile.evidenceItems);
    const memo = buildCounselMemo(highRiskProfile, audit, hash);

    expect(memo).toContain("Not legal advice");
    expect(memo).toContain("YieldPassport");
    expect(memo).toContain("critical");
    expect(memo).toContain(hash);
    expect(memo).toContain("BLI Legal Tech Hackathon 2");
    expect(memo).toContain("Counsel");
  });
});

describe("createSubmissionFit", () => {
  it("maps the MVP to BLI themes and required submission assets", () => {
    const fit = createSubmissionFit();

    expect(fit.targetHackathon).toBe("BLI Legal Tech Hackathon 2");
    expect(fit.themeCoverage).toEqual(expect.arrayContaining(["Legal", "Compliance", "AI", "RegTech", "Blockchain"]));
    expect(fit.requiredAssets).toEqual(expect.arrayContaining(["Public GitHub repository", "Demo video", "BUIDL submission"]));
    expect(fit.scorecard.prizeToEffort).toBeGreaterThanOrEqual(8);
  });
});
