import { describe, expect, it } from "vitest";
import { demoScenarios } from "../data/demoScenarios";
import { sampleProfiles } from "../data/sampleProfiles";
import {
  findDemoScenarioById,
  summarizeDemoScenario,
  validateDemoScenarioLibrary,
  type DemoScenario
} from "./demoScenarioLibrary";

const scenario: DemoScenario = {
  id: "yieldpassport-judge-path",
  projectName: "YieldPassport",
  title: "High-risk RWA launch",
  summary: "Tokenized private credit, custody, retail exposure, AI review, and manifest handoff.",
  estimatedMinutes: 8,
  recommendedStartTab: "risk",
  judgePath: ["Validate model", "Add evidence", "Run risk audit", "Download GRC tickets", "Export counsel pack"],
  expectedArtifacts: ["Evidence Manifest", "GRC Ticket Export", "Counsel Pack Markdown"],
  focusTags: ["RWA", "AI governance", "Evidence vault"],
  notLegalAdviceBoundary: "Not legal advice. Demo scenarios are synthetic audit preparation paths only."
};

describe("validateDemoScenarioLibrary", () => {
  it("accepts synthetic scenarios that reference existing sample profiles and contain judge-ready paths", () => {
    const result = validateDemoScenarioLibrary([scenario], sampleProfiles);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns clear errors for unknown samples, missing boundaries, weak judge paths, and unsafe text", () => {
    const invalid: DemoScenario = {
      ...scenario,
      id: "unsafe-demo",
      projectName: "Missing Project",
      summary: "Use raw KYC packet and private key for testing.",
      judgePath: ["Open app"],
      expectedArtifacts: [],
      notLegalAdviceBoundary: "Demo only."
    };

    const result = validateDemoScenarioLibrary([invalid], sampleProfiles);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "unsafe-demo references an unknown sample profile: Missing Project.",
        "unsafe-demo must include the Not legal advice boundary.",
        "unsafe-demo needs at least three judge path steps.",
        "unsafe-demo needs at least one expected artifact.",
        "unsafe-demo includes blocked demo text: raw KYC.",
        "unsafe-demo includes blocked demo text: private key."
      ])
    );
  });

  it("keeps a seeded AI legal workflow path for model governance and counsel handoff demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const aiWorkflowScenario = findDemoScenarioById(demoScenarios, "lexassist-ai-workflow-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(aiWorkflowScenario).toEqual(
      expect.objectContaining({
        title: "AI legal workflow review",
        projectName: "LexAssist Evidence Desk",
        recommendedStartTab: "model",
        focusTags: expect.arrayContaining(["AI legal workflow", "US NIST AI RMF", "EU AI Act", "UK ICO", "Model governance", "Counsel handoff"]),
        expectedArtifacts: expect.arrayContaining(["Model Intake JSON", "Human Review Timeline", "Counsel Pack Markdown"])
      })
    );
    expect(aiWorkflowScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Connect model",
        "Register AI event",
        "Route human review",
        "Inspect US NIST / EU AI Act / UK ICO source review",
        "Export counsel pack"
      ])
    );
    expect(aiWorkflowScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded DAO proposal path for source-linked governance demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const daoScenario = findDemoScenarioById(demoScenarios, "clauseguard-review-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(daoScenario).toEqual(
      expect.objectContaining({
        title: "DAO proposal review",
        projectName: "ClauseGuard DAO",
        recommendedStartTab: "review",
        focusTags: expect.arrayContaining(["DAO governance", "US SEC DAO Report", "UK Law Commission", "Human review"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Human Review Timeline", "Counsel Pack Version"])
      })
    );
    expect(daoScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect DAO governance source controls",
        "Return evidence for support",
        "Download review timeline"
      ])
    );
    expect(daoScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded Brazil VASP path for jurisdiction source graph demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const brazilScenario = findDemoScenarioById(demoScenarios, "brazil-vasp-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(brazilScenario).toEqual(
      expect.objectContaining({
        title: "Brazil VASP source review",
        projectName: "Brazil VASP Launch Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["Brazil", "VASP", "Source graph"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(brazilScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect Brazil source graph",
        "Review VASP authorization evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(brazilScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded Swiss FINMA stablecoin path for token and stablecoin source demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const swissScenario = findDemoScenarioById(demoScenarios, "swiss-stablecoin-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(swissScenario).toEqual(
      expect.objectContaining({
        title: "Swiss FINMA stablecoin review",
        projectName: "Helvetia Stablecoin Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["Switzerland", "FINMA", "Stablecoin", "Token classification"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(swissScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect Swiss FINMA source graph",
        "Review token classification and prospectus evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(swissScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded Singapore DPT custody path for customer-asset safeguard demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const singaporeScenario = findDemoScenarioById(demoScenarios, "singapore-dpt-custody-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(singaporeScenario).toEqual(
      expect.objectContaining({
        title: "Singapore DPT custody review",
        projectName: "HarborKey DPT Custody Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["Singapore", "DPT custody", "Customer assets"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(singaporeScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect MAS customer asset safeguards",
        "Review custody segregation evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(singaporeScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded Hong Kong VATP custody path for SFC custody source demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const hongKongScenario = findDemoScenarioById(demoScenarios, "hong-kong-vatp-custody-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(hongKongScenario).toEqual(
      expect.objectContaining({
        title: "Hong Kong VATP custody review",
        projectName: "HarborBridge VATP Custody Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["Hong Kong", "VATP custody", "SFC"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(hongKongScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect SFC VATP custody controls",
        "Review associated-entity and client-asset evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(hongKongScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded Japan crypto custody path for FSA source demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const japanScenario = findDemoScenarioById(demoScenarios, "japan-crypto-custody-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(japanScenario).toEqual(
      expect.objectContaining({
        title: "Japan crypto custody review",
        projectName: "SakuraKey Crypto Custody Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["Japan", "FSA", "Crypto custody"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(japanScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect Japan FSA custody controls",
        "Review user-asset protection evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(japanScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded Canada CTP custody path for CSA PRU source demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const canadaScenario = findDemoScenarioById(demoScenarios, "canada-ctp-custody-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(canadaScenario).toEqual(
      expect.objectContaining({
        title: "Canada CTP custody review",
        projectName: "MapleVault CTP Custody Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["Canada", "CSA", "CTP custody"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(canadaScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect Canada CSA CTP controls",
        "Review PRU and investor-protection evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(canadaScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded Australia digital asset path for ASIC and AUSTRAC source demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const australiaScenario = findDemoScenarioById(demoScenarios, "australia-digital-asset-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(australiaScenario).toEqual(
      expect.objectContaining({
        title: "Australia digital asset review",
        projectName: "SouthernCross Digital Asset Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["Australia", "ASIC", "AUSTRAC", "VASP AML/CTF"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(australiaScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect Australia ASIC/AUSTRAC source graph",
        "Review digital-asset financial services and custody evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(australiaScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded Korea VASP user protection path for FSC and KoFIU source demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const koreaScenario = findDemoScenarioById(demoScenarios, "korea-vasp-user-protection-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(koreaScenario).toEqual(
      expect.objectContaining({
        title: "Korea VASP user protection review",
        projectName: "HanRiver VASP User Protection Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["South Korea", "FSC", "KoFIU", "VASP AML/CFT"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(koreaScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect Korea FSC/KoFIU source graph",
        "Review user-asset protection and custody evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(koreaScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded India VDA PMLA path for FIU-IND source demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const indiaScenario = findDemoScenarioById(demoScenarios, "india-vda-pmla-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(indiaScenario).toEqual(
      expect.objectContaining({
        title: "India VDA PMLA review",
        projectName: "Mumbai VDA PMLA Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["India", "FIU-IND", "PMLA", "VDA AML/CFT"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(indiaScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect India FIU-IND/PMLA source graph",
        "Review VDA activity-scope and Reporting Entity evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(indiaScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded UK cryptoasset AML path for FCA source demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const ukScenario = findDemoScenarioById(demoScenarios, "uk-cryptoasset-aml-source-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(ukScenario).toEqual(
      expect.objectContaining({
        title: "UK cryptoasset AML review",
        projectName: "Thames Cryptoasset AML Review",
        recommendedStartTab: "jurisdiction",
        focusTags: expect.arrayContaining(["United Kingdom", "FCA", "MLRs", "Travel Rule"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"])
      })
    );
    expect(ukScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect UK FCA/MLR source graph",
        "Review cryptoasset activity-scope and registration evidence gaps",
        "Export counsel pack"
      ])
    );
    expect(ukScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps a seeded marketing claims path for source-linked promotion review demos", () => {
    const result = validateDemoScenarioLibrary(demoScenarios, sampleProfiles);
    const marketingScenario = findDemoScenarioById(demoScenarios, "cross-border-marketing-claims-path");

    expect(result).toEqual({ valid: true, errors: [] });
    expect(marketingScenario).toEqual(
      expect.objectContaining({
        title: "Marketing claims review",
        projectName: "SignalBridge Marketing Review",
        recommendedStartTab: "counsel",
        focusTags: expect.arrayContaining(["Marketing claims", "US FTC", "EU MiCA", "UK FCA", "VARA 2024 marketing"]),
        expectedArtifacts: expect.arrayContaining(["Regulatory Source Graph", "Marketing Claims Counsel Pack", "Source Pack JSON"])
      })
    );
    expect(marketingScenario?.judgePath).toEqual(
      expect.arrayContaining([
        "Inspect US, EU MiCA, UK, and VARA 2024 marketing source controls",
        "Review promotion approval evidence gaps",
        "Review KOL, incentive, and recordkeeping evidence gaps",
        "Export Marketing Claims counsel pack"
      ])
    );
    expect(marketingScenario?.notLegalAdviceBoundary).toContain("Not legal advice");
  });
});

describe("findDemoScenarioById", () => {
  it("finds a scenario by stable id", () => {
    expect(findDemoScenarioById([scenario], "yieldpassport-judge-path")).toEqual(scenario);
  });
});

describe("summarizeDemoScenario", () => {
  it("creates a concise non-advice UI summary", () => {
    const summary = summarizeDemoScenario(scenario);

    expect(summary).toContain("High-risk RWA launch");
    expect(summary).toContain("8 min");
    expect(summary).toContain("Evidence Manifest, GRC Ticket Export, Counsel Pack Markdown");
    expect(summary).toContain("Not legal advice");
  });
});
