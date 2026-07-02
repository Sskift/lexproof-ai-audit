import { describe, expect, it } from "vitest";
import {
  createJurisdictionReadinessDigest,
  exportJurisdictionReadinessDigestJson,
  type CreateJurisdictionReadinessDigestInput
} from "./jurisdictionReadinessDigest";
import type { JurisdictionEvidenceMap } from "./jurisdictionEvidenceMap";
import type { LocalCounselRoutingPlan } from "./localCounselRouting";
import type { SourceFreshnessBoard } from "./sourceFreshnessBoard";

describe("createJurisdictionReadinessDigest", () => {
  it("builds a stable per-jurisdiction handoff digest from source, evidence, and counsel routing metadata", async () => {
    const first = await createJurisdictionReadinessDigest({
      evidenceMap: evidenceMap(["European Union", "United States"]),
      localCounselRoutingPlan: localCounselRoutingPlan(["United States", "European Union"]),
      sourceFreshnessBoard: sourceFreshnessBoard(["European Union"]),
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const second = await createJurisdictionReadinessDigest({
      evidenceMap: evidenceMap(["United States", "European Union"]),
      localCounselRoutingPlan: localCounselRoutingPlan(["European Union", "United States"]),
      sourceFreshnessBoard: sourceFreshnessBoard(["European Union"]),
      generatedAt: "2026-07-03T00:00:00.000Z"
    });

    expect(first.digestHash).toBe(second.digestHash);
    expect(first.digestHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toEqual(
      expect.objectContaining({
        digestVersion: "lexproof-jurisdiction-readiness-digest-v1",
        projectId: "jurisdiction-digest-project",
        status: "needs-evidence",
        handoffAllowed: false,
        jurisdictionCount: 2,
        notLegalAdviceBoundary: "Not legal advice. Jurisdiction readiness digests are audit preparation workflow metadata only."
      })
    );
    expect(first.summary).toEqual({
      readyForCounselCount: 0,
      needsEvidenceCount: 1,
      needsSourceReviewCount: 1,
      metadataMissingCount: 0,
      openEvidenceRequestCount: 3,
      sourceFreshnessBlockerCount: 1,
      dueSoonSourceCount: 0
    });
    expect(first.jurisdictions.map((item) => item.jurisdiction)).toEqual(["United States", "European Union"]);
    expect(first.jurisdictions[0]).toEqual(
      expect.objectContaining({
        jurisdiction: "United States",
        status: "needs-evidence",
        handoffAllowed: false,
        controlCount: 2,
        openEvidenceRequestCount: 2,
        p0OpenEvidenceRequestCount: 1,
        localCounselRoles: ["US securities counsel"],
        localCounselStatus: "needs-evidence",
        sourceFreshnessBlockerCount: 0,
        nextAction: "Prepare US investor eligibility evidence for local counsel review."
      })
    );
    expect(first.jurisdictions[1]).toEqual(
      expect.objectContaining({
        jurisdiction: "European Union",
        status: "needs-source-review",
        localCounselStatus: "needs-source-review",
        sourceFreshnessBlockerCount: 1,
        nextAction: "Refresh review-due European Union source metadata before counsel handoff."
      })
    );
  });

  it("exports redacted metadata without legal conclusions or unsafe snippets", async () => {
    const input = createInput();
    input.evidenceMap.jurisdictions[0].topOpenEvidenceRequests[0].nextAction =
      "Prepare evidence after removing sk-live-abcdef1234567890abcdef1234567890 and private key 0xabc.";
    input.localCounselRoutingPlan!.routes[0].counselQuestions = ["Can counsel mark this legally approved?"];

    const digest = await createJurisdictionReadinessDigest(input);
    const json = exportJurisdictionReadinessDigestJson(digest);

    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("restricted signing material");
    expect(json).not.toContain("sk-live-abcdef1234567890");
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b/i);
    expect(json).toContain("Not legal advice");
  });
});

function createInput(): CreateJurisdictionReadinessDigestInput {
  return {
    evidenceMap: evidenceMap(["United States", "European Union"]),
    localCounselRoutingPlan: localCounselRoutingPlan(["United States", "European Union"]),
    sourceFreshnessBoard: sourceFreshnessBoard(["European Union"]),
    generatedAt: "2026-07-02T00:00:00.000Z"
  };
}

function evidenceMap(order: string[]): JurisdictionEvidenceMap {
  const jurisdictions = order.map((jurisdiction) =>
    jurisdiction === "United States" ? usJurisdiction() : euJurisdiction()
  );

  return {
    mapVersion: "lexproof-jurisdiction-evidence-map-v1",
    projectId: "jurisdiction-digest-project",
    generatedAt: "2026-07-02T00:00:00.000Z",
    mapHash: "a".repeat(64),
    status: "needs-evidence",
    jurisdictionCount: jurisdictions.length,
    totalControlCount: 3,
    totalOpenEvidenceRequestCount: 3,
    highestPriority: "P0",
    jurisdictions,
    notLegalAdviceBoundary: "Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only."
  };
}

function usJurisdiction(): JurisdictionEvidenceMap["jurisdictions"][number] {
  return {
    jurisdiction: "United States",
    status: "needs-evidence",
    controlCount: 2,
    readyForCounselCount: 0,
    needsEvidenceCount: 2,
    needsSourceReviewCount: 0,
    metadataMissingCount: 0,
    openEvidenceRequestCount: 2,
    p0OpenEvidenceRequestCount: 1,
    localCounselRoles: ["US securities counsel"],
    topics: [{ topic: "asset-classification", controlCount: 2 }],
    topOpenEvidenceRequests: [
      {
        title: "US investor eligibility evidence",
        priority: "P0",
        sourceName: "Regulation D",
        citation: "17 C.F.R. 230.506(c)",
        nextAction: "Prepare US investor eligibility evidence for local counsel review."
      },
      {
        title: "OFAC wallet screening evidence",
        priority: "P1",
        sourceName: "OFAC guidance",
        citation: "OFAC virtual currency sanctions guidance",
        nextAction: "Prepare wallet screening evidence."
      }
    ],
    nextAction: "Prepare US investor eligibility evidence for local counsel review.",
    notLegalAdviceBoundary: "Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only."
  };
}

function euJurisdiction(): JurisdictionEvidenceMap["jurisdictions"][number] {
  return {
    jurisdiction: "European Union",
    status: "needs-source-review",
    controlCount: 1,
    readyForCounselCount: 0,
    needsEvidenceCount: 0,
    needsSourceReviewCount: 1,
    metadataMissingCount: 0,
    openEvidenceRequestCount: 1,
    p0OpenEvidenceRequestCount: 0,
    localCounselRoles: ["EU CASP counsel"],
    topics: [{ topic: "custody", controlCount: 1 }],
    topOpenEvidenceRequests: [
      {
        title: "EU custody delegation evidence",
        priority: "P1",
        sourceName: "MiCA",
        citation: "MiCA Article 75",
        nextAction: "Refresh review-due European Union source metadata before counsel handoff."
      }
    ],
    nextAction: "Refresh review-due European Union source metadata before counsel handoff.",
    notLegalAdviceBoundary: "Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only."
  };
}

function localCounselRoutingPlan(order: string[]): LocalCounselRoutingPlan {
  const routes = order.map((jurisdiction) =>
    jurisdiction === "United States"
      ? {
          id: "local-counsel-united-states-us-securities-counsel",
          jurisdiction: "United States",
          localCounselRole: "US securities counsel",
          priority: "P0" as const,
          status: "needs-evidence" as const,
          sourceReviewStatus: "current" as const,
          matchedClauseIds: ["us-sec-reg-d-accredited-investor-verification"],
          citations: ["17 C.F.R. 230.506(c)"],
          sourceUrls: ["https://www.ecfr.gov/"],
          topics: ["asset-classification" as const],
          evidenceGapCount: 2,
          evidenceGapTitles: ["US investor eligibility evidence"],
          counselQuestions: ["What offering-route evidence should US securities counsel review?"],
          matchedEvidenceLabels: [],
          nextAction: "Prepare missing evidence for local counsel review."
        }
      : {
          id: "local-counsel-european-union-eu-casp-counsel",
          jurisdiction: "European Union",
          localCounselRole: "EU CASP counsel",
          priority: "P1" as const,
          status: "needs-source-review" as const,
          sourceReviewStatus: "review-due" as const,
          matchedClauseIds: ["eu-mica-casp-custody-administration"],
          citations: ["MiCA Article 75"],
          sourceUrls: ["https://eur-lex.europa.eu/"],
          topics: ["custody" as const],
          evidenceGapCount: 0,
          evidenceGapTitles: [],
          counselQuestions: ["Which custody assumptions should EU counsel review?"],
          matchedEvidenceLabels: ["EU custody policy"],
          nextAction: "Refresh source metadata before local counsel handoff."
        }
  );

  return {
    planVersion: "lexproof-local-counsel-routing-v1",
    projectId: "jurisdiction-digest-project",
    generatedAt: "2026-07-02T00:00:00.000Z",
    routeCount: routes.length,
    prioritySummary: { P0: 1, P1: 1, P2: 0 },
    routes,
    planHash: "b".repeat(64),
    notLegalAdviceBoundary: "Not legal advice. Local counsel routing plans are audit preparation workflow metadata only."
  };
}

function sourceFreshnessBoard(blockedJurisdictions: string[]): SourceFreshnessBoard {
  const items = blockedJurisdictions.map((jurisdiction) => ({
    id: `source-freshness-${jurisdiction.toLowerCase().replace(/\s+/g, "-")}`,
    laneId: "overdue" as const,
    priority: "P1" as const,
    clauseId: `clause-${jurisdiction}`,
    jurisdiction,
    regulator: "Synthetic regulator",
    citation: `${jurisdiction} source citation`,
    sourceName: `${jurisdiction} source`,
    sourceUrl: "https://example.test/source",
    effectiveAsOf: "2026-01-01",
    lastReviewedAt: "2026-01-01",
    nextReviewDueAt: "2026-04-01",
    reviewStatus: "review-due" as const,
    reviewerNotes: "Refresh source metadata before handoff.",
    daysUntilReviewDue: -90,
    nextAction: `Refresh ${jurisdiction} source metadata before counsel handoff.`,
    notLegalAdviceBoundary: "Not legal advice. Source freshness board items are audit preparation scheduling metadata only." as const
  }));

  return {
    boardVersion: "lexproof-source-freshness-board-v1",
    generatedAt: "2026-07-02T00:00:00.000Z",
    asOf: "2026-07-02",
    dueSoonDays: 30,
    boardHash: "c".repeat(64),
    status: items.length > 0 ? "attention-needed" : "current",
    laneCount: 4,
    totalSourceCount: items.length,
    metadataMissingCount: 0,
    overdueCount: items.length,
    dueSoonCount: 0,
    scheduledCount: 0,
    lanes: [
      { id: "metadata-missing", label: "Metadata missing", itemCount: 0, items: [] },
      { id: "overdue", label: "Overdue", itemCount: items.length, items },
      { id: "due-soon", label: "Due soon", itemCount: 0, items: [] },
      { id: "scheduled", label: "Scheduled", itemCount: 0, items: [] }
    ],
    notLegalAdviceBoundary: "Not legal advice. Source freshness boards are audit preparation scheduling metadata only."
  };
}
