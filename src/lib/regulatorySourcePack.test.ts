import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourcePack, exportRegulatorySourcePackJson } from "./regulatorySourcePack";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import type { ProjectProfile } from "./projectModel";

const rawEvidenceBody = "raw evidence body that must never appear in the regulatory source pack";

const project: ProjectProfile = {
  id: "project-source-pack",
  projectName: "Source Pack Review",
  entityType: "Startup issuer",
  jurisdictions: ["European Union", "United Kingdom", "United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata only",
  aiUsage: "AI drafts evidence summaries for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      id: "evidence-mica",
      label: "MiCA white paper control memo",
      kind: "Counsel memo",
      source: "Synthetic control evidence",
      content: `${rawEvidenceBody}; white paper and public communication evidence.`,
      status: "received",
      owner: "Compliance"
    }
  ]
};

describe("createRegulatorySourcePack", () => {
  it("builds a deterministic metadata-only source pack for counsel handoff without legal conclusions", async () => {
    const audit = analyzeAuditProfile(project);
    const graph = createRegulatoryGraph(project, audit, project.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, { asOf: "2026-07-01", reviewWindowDays: 90 });
    const firstPack = await createRegulatorySourcePack({
      graph,
      sourceReview,
      generatedAt: "2026-07-01T00:00:00.000Z"
    });
    const secondPack = await createRegulatorySourcePack({
      graph,
      sourceReview,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(firstPack.packVersion).toBe("lexproof-regulatory-source-pack-v1");
    expect(firstPack.packHash).toMatch(/^[a-f0-9]{64}$/);
    expect(secondPack.packHash).toBe(firstPack.packHash);
    expect(firstPack.projectId).toBe(project.id);
    expect(firstPack.sourceCount).toBe(firstPack.clauses.length);
    expect(firstPack.evidenceGapCount).toBe(firstPack.evidenceGaps.length);
    expect(firstPack.notLegalAdviceBoundary).toBe(
      "Not legal advice. Regulatory source packs are audit preparation materials only."
    );
    expect(firstPack.clauses.find((clause) => clause.clauseId === "eu-mica-title-ii-white-paper")).toMatchObject({
      jurisdiction: "European Union",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng",
      coverageStatus: "partial",
      localCounselRole: "EU crypto-asset / data protection counsel"
    });
    expect(firstPack.clauses.flatMap((clause) => clause.counselQuestions)).toEqual(
      expect.arrayContaining([expect.stringContaining("local EU counsel")])
    );
    expect(firstPack.sourceReview).toMatchObject({
      status: "current",
      reviewWindowDays: 90,
      totalSourceCount: firstPack.sourceCount
    });
    expect(firstPack.jurisdictionSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jurisdiction: "European Union",
          readiness: "partial-evidence"
        })
      ])
    );

    const json = exportRegulatorySourcePackJson(firstPack);
    expect(json).toContain(firstPack.packHash);
    expect(json).toContain("Not legal advice");
    expect(json).not.toContain(rawEvidenceBody);
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });
});
