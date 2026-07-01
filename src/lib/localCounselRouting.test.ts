import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createLocalCounselRoutingPlan, exportLocalCounselRoutingPlanJson } from "./localCounselRouting";
import type { ProjectProfile } from "./projectModel";
import { createRegulatoryGraph, type RegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceReview, type RegulatorySourceReview } from "./regulatorySourceReview";

const rawEvidenceBody = "raw evidence body that must never appear in local counsel routing exports";

const rwaProject: ProjectProfile = {
  id: "project-local-counsel-routing",
  projectName: "Local Counsel RWA Review",
  entityType: "Startup issuer",
  jurisdictions: ["European Union", "United Kingdom", "United States"],
  assetModel: "Tokenized private credit note with yield and public communications",
  userType: "Retail users and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC excluded from routing handoff",
  aiUsage: "AI drafts audit-prep summaries for human review and local counsel routing",
  blockchainUse: "Simulated manifest hash registry",
  operatingStage: "Planned public launch before local counsel review",
  evidenceItems: [
    {
      id: "evidence-mica-public-comms",
      label: "MiCA public communication memo",
      kind: "Counsel memo",
      source: "Synthetic memo; regulatory control: control-eu-mica-title-ii-white-paper",
      content: `${rawEvidenceBody}; white paper and public communication evidence.`,
      status: "received",
      owner: "Compliance"
    }
  ]
};

describe("createLocalCounselRoutingPlan", () => {
  it("builds a stable metadata-only local counsel routing plan from source graph evidence gaps", async () => {
    const audit = analyzeAuditProfile(rwaProject);
    const graph = createRegulatoryGraph(rwaProject, audit, rwaProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-15T00:00:00.000Z",
      reviewWindowDays: 90
    });

    const firstPlan = await createLocalCounselRoutingPlan({
      graph,
      sourceReview,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });
    const secondPlan = await createLocalCounselRoutingPlan({
      graph,
      sourceReview,
      generatedAt: "2026-10-16T00:00:00.000Z"
    });

    expect(firstPlan.planVersion).toBe("lexproof-local-counsel-routing-v1");
    expect(firstPlan.planHash).toMatch(/^[a-f0-9]{64}$/);
    expect(secondPlan.planHash).toBe(firstPlan.planHash);
    expect(firstPlan.notLegalAdviceBoundary).toBe(
      "Not legal advice. Local counsel routing plans are audit preparation workflow metadata only."
    );
    expect(firstPlan.routeCount).toBe(firstPlan.routes.length);
    expect(firstPlan.prioritySummary.P0).toBeGreaterThan(0);
    expect(firstPlan.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jurisdiction: "United States",
          localCounselRole: "US private offering / securities counsel",
          status: "needs-evidence",
          priority: "P0"
        })
      ])
    );
    expect(firstPlan.routes.flatMap((route) => route.counselQuestions)).toEqual(
      expect.arrayContaining([expect.stringContaining("US securities counsel")])
    );
    expect(firstPlan.routes.flatMap((route) => route.evidenceGapTitles)).toEqual(
      expect.arrayContaining([expect.stringContaining("accredited-investor verification")])
    );

    const json = exportLocalCounselRoutingPlanJson(firstPlan);
    expect(json).toContain(firstPlan.planHash);
    expect(json).toContain("Not legal advice");
    expect(json).not.toContain(rawEvidenceBody);
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b/i);
  });

  it("prioritizes covered routes for source review instead of evidence collection", async () => {
    const graph: RegulatoryGraph = {
      graphVersion: "lexproof-regulatory-graph-v1",
      projectId: "project-covered-route",
      generatedAt: "2026-07-01T00:00:00.000Z",
      matchedClauses: [
        {
          clauseId: "covered-clause",
          jurisdiction: "Singapore",
          regulator: "Monetary Authority of Singapore",
          sourceName: "Covered source",
          sourceUrl: "https://example.test/source",
          citation: "Covered source citation",
          topic: "custody",
          summary: "Covered source review trigger.",
          matchedFlagIds: ["custody"],
          matchedTriggerTerms: ["custody"],
          evidenceRequestStatuses: [
            {
              requestId: "covered-request",
              title: "Covered custody evidence",
              reason: "Evidence is ready for review.",
              priority: "P0",
              status: "covered",
              matchedEvidenceLabels: ["Custody policy"]
            }
          ],
          coverageStatus: "covered",
          coveredEvidenceCount: 1,
          totalEvidenceRequestCount: 1,
          matchedEvidenceLabels: ["Custody policy"],
          counselQuestions: ["Which custody controls should Singapore counsel review?"],
          localCounselRole: "Singapore DPT custody / payment services counsel",
          effectiveAsOf: "2026-01-01",
          lastReviewedAt: "2026-01-01",
          reviewerNotes: "Route interpretation to local counsel.",
          notLegalAdviceBoundary: "Not legal advice. Regulatory clauses are audit preparation references only."
        }
      ],
      jurisdictionSummaries: [
        {
          jurisdiction: "Singapore",
          matchedClauseCount: 1,
          missingEvidenceCount: 0,
          coveredEvidenceCount: 1,
          readiness: "ready-for-counsel",
          localCounselRole: "Singapore DPT custody / payment services counsel"
        }
      ],
      evidenceGaps: [],
      topActions: [],
      notLegalAdviceBoundary: "Not legal advice. Regulatory graph output is audit preparation material only."
    };
    const sourceReview: RegulatorySourceReview = {
      status: "review-due",
      totalSourceCount: 1,
      currentSourceCount: 0,
      reviewDueCount: 1,
      metadataMissingCount: 0,
      reviewWindowDays: 90,
      items: [
        {
          clauseId: "covered-clause",
          jurisdiction: "Singapore",
          regulator: "Monetary Authority of Singapore",
          citation: "Covered source citation",
          sourceName: "Covered source",
          sourceUrl: "https://example.test/source",
          effectiveAsOf: "2026-01-01",
          lastReviewedAt: "2026-01-01",
          nextReviewDueAt: "2026-04-01",
          reviewStatus: "review-due",
          reviewerNotes: "Refresh source metadata before handoff."
        }
      ],
      actions: [
        {
          id: "source-review-covered-clause",
          priority: "P1",
          action: "Refresh Covered source citation source metadata before counsel handoff.",
          clauseId: "covered-clause",
          sourceUrl: "https://example.test/source"
        }
      ],
      notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only."
    };

    const plan = await createLocalCounselRoutingPlan({ graph, sourceReview, generatedAt: "2026-07-01T00:00:00.000Z" });

    expect(plan.routes).toHaveLength(1);
    expect(plan.routes[0]).toMatchObject({
      jurisdiction: "Singapore",
      localCounselRole: "Singapore DPT custody / payment services counsel",
      status: "needs-source-review",
      priority: "P1",
      evidenceGapCount: 0,
      sourceReviewStatus: "review-due",
      nextAction: "Refresh source metadata before local counsel handoff."
    });
  });
});
