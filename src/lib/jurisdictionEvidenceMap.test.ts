import { describe, expect, it } from "vitest";
import {
  createJurisdictionEvidenceMap,
  exportJurisdictionEvidenceMapJson,
  type JurisdictionEvidenceMapControlInput
} from "./jurisdictionEvidenceMap";
import type { RegulatoryControlMatrix } from "./regulatoryControlMatrix";

describe("createJurisdictionEvidenceMap", () => {
  it("groups controls by jurisdiction with a stable hash and prioritized open evidence", async () => {
    const first = await createJurisdictionEvidenceMap({
      matrix: matrixWithControls([euCustodyControl(), usOfferingControl(), euWhitePaperControl()]),
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const second = await createJurisdictionEvidenceMap({
      matrix: matrixWithControls([euWhitePaperControl(), euCustodyControl(), usOfferingControl()]),
      generatedAt: "2026-07-01T02:00:00.000Z"
    });

    expect(first.mapHash).toBe(second.mapHash);
    expect(first.mapHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toEqual(
      expect.objectContaining({
        mapVersion: "lexproof-jurisdiction-evidence-map-v1",
        projectId: "jurisdiction-map-project",
        status: "needs-evidence",
        jurisdictionCount: 2,
        totalOpenEvidenceRequestCount: 3,
        highestPriority: "P0",
        notLegalAdviceBoundary: "Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only."
      })
    );
    expect(first.jurisdictions.map((item) => item.jurisdiction)).toEqual(["European Union", "United States"]);
    expect(first.jurisdictions[0]).toEqual(
      expect.objectContaining({
        jurisdiction: "European Union",
        status: "needs-evidence",
        controlCount: 2,
        needsEvidenceCount: 1,
        needsSourceReviewCount: 1,
        openEvidenceRequestCount: 2,
        p0OpenEvidenceRequestCount: 1,
        localCounselRoles: ["EU CASP counsel", "EU issuer counsel"],
        topics: [
          { topic: "custody", controlCount: 1 },
          { topic: "asset-classification", controlCount: 1 }
        ]
      })
    );
    expect(first.jurisdictions[0]?.topOpenEvidenceRequests.map((item) => item.title)).toEqual([
      "EU client asset safeguarding evidence",
      "EU white paper approval evidence"
    ]);
  });

  it("keeps exported jurisdiction maps redacted and metadata-only", async () => {
    const unsafeControl = usOfferingControl({
      nextAction: "Prepare reviewer note with sk-live-abcdef1234567890abcdef1234567890 removed.",
      evidenceRequestTitles: ["API key sk-live-abcdef1234567890abcdef1234567890 removal evidence"]
    });

    const map = await createJurisdictionEvidenceMap({
      matrix: matrixWithControls([unsafeControl]),
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const json = exportJurisdictionEvidenceMapJson(map);

    expect(json).toContain("[redacted-api-key]");
    expect(json).not.toContain("sk-live-abcdef1234567890");
    expect(json).toContain("Not legal advice");
  });
});

function matrixWithControls(controls: JurisdictionEvidenceMapControlInput[]): RegulatoryControlMatrix {
  return {
    matrixVersion: "lexproof-regulatory-control-matrix-v1",
    projectId: "jurisdiction-map-project",
    generatedAt: "2026-07-01T00:00:00.000Z",
    status: "needs-evidence",
    controlCount: controls.length,
    summary: {
      totalControlCount: controls.length,
      readyForCounselCount: controls.filter((control) => control.status === "ready-for-counsel").length,
      needsEvidenceCount: controls.filter((control) => control.status === "needs-evidence").length,
      needsSourceReviewCount: controls.filter((control) => control.status === "needs-source-review").length,
      metadataMissingCount: controls.filter((control) => control.status === "metadata-missing").length,
      openEvidenceRequestCount: controls.reduce((sum, control) => sum + control.openEvidenceRequestCount, 0)
    },
    controls,
    notLegalAdviceBoundary: "Not legal advice. Regulatory control matrices are audit preparation workflow metadata only."
  };
}

function euCustodyControl(overrides: Partial<JurisdictionEvidenceMapControlInput> = {}): JurisdictionEvidenceMapControlInput {
  return control({
    controlId: "control-eu-custody",
    clauseId: "eu-mica-casp-custody-administration",
    jurisdiction: "European Union",
    topic: "custody",
    citation: "MiCA Article 75",
    sourceName: "MiCA",
    sourceUrl: "https://eur-lex.europa.eu/",
    localCounselRole: "EU CASP counsel",
    status: "needs-evidence",
    evidenceCoverageStatus: "missing",
    sourceReviewStatus: "current",
    openEvidenceRequestCount: 1,
    highestPriority: "P0",
    evidenceRequestTitles: ["EU client asset safeguarding evidence"],
    nextAction: "Prepare EU client asset safeguarding evidence for EU CASP counsel review.",
    ...overrides
  });
}

function euWhitePaperControl(overrides: Partial<JurisdictionEvidenceMapControlInput> = {}): JurisdictionEvidenceMapControlInput {
  return control({
    controlId: "control-eu-white-paper",
    clauseId: "eu-mica-title-ii-white-paper",
    jurisdiction: "European Union",
    topic: "asset-classification",
    citation: "MiCA Title II",
    sourceName: "MiCA",
    sourceUrl: "https://eur-lex.europa.eu/",
    localCounselRole: "EU issuer counsel",
    status: "needs-source-review",
    evidenceCoverageStatus: "partial",
    sourceReviewStatus: "review-due",
    openEvidenceRequestCount: 1,
    highestPriority: "P1",
    evidenceRequestTitles: ["EU white paper approval evidence"],
    nextAction: "Refresh MiCA Title II source metadata before counsel handoff.",
    ...overrides
  });
}

function usOfferingControl(overrides: Partial<JurisdictionEvidenceMapControlInput> = {}): JurisdictionEvidenceMapControlInput {
  return control({
    controlId: "control-us-reg-d",
    clauseId: "us-sec-reg-d-accredited-investor-verification",
    jurisdiction: "United States",
    topic: "asset-classification",
    citation: "17 C.F.R. 230.506(c)",
    sourceName: "Regulation D",
    sourceUrl: "https://www.ecfr.gov/",
    localCounselRole: "US securities counsel",
    status: "needs-evidence",
    evidenceCoverageStatus: "missing",
    sourceReviewStatus: "current",
    openEvidenceRequestCount: 1,
    highestPriority: "P0",
    evidenceRequestTitles: ["US investor eligibility evidence"],
    nextAction: "Prepare US investor eligibility evidence for US securities counsel review.",
    ...overrides
  });
}

function control(overrides: Partial<JurisdictionEvidenceMapControlInput>): JurisdictionEvidenceMapControlInput {
  return {
    controlId: "control",
    clauseId: "clause",
    jurisdiction: "United States",
    topic: "asset-classification",
    citation: "Citation",
    sourceName: "Source",
    sourceUrl: "https://example.com",
    localCounselRole: "Local counsel",
    status: "needs-evidence",
    evidenceCoverageStatus: "missing",
    sourceReviewStatus: "current",
    coveredEvidenceCount: 0,
    totalEvidenceRequestCount: 1,
    openEvidenceRequestCount: 1,
    highestPriority: "P0",
    evidenceRequestTitles: ["Evidence"],
    matchedEvidenceLabels: [],
    nextAction: "Prepare evidence.",
    notLegalAdviceBoundary: "Not legal advice. Regulatory controls are audit preparation workflow metadata only.",
    ...overrides
  };
}
