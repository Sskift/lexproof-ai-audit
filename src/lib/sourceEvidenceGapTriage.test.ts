import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createRegulatoryGraph } from "./regulatoryGraph";
import {
  createSourceEvidenceGapTriage,
  createEvidenceRequestOperationFromSourceGapTriageItem,
  createEvidenceItemFromSourceGapTriageItem,
  exportSourceEvidenceGapTriageJson
} from "./sourceEvidenceGapTriage";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "project-source-gap-triage",
  projectName: "Global Yield Launch",
  entityType: "Startup issuer",
  jurisdictions: ["European Union", "United Kingdom", "Singapore", "United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata and wallet transaction history",
  aiUsage: "AI drafts evidence summaries for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createSourceEvidenceGapTriage", () => {
  it("creates source-linked Evidence Ledger drafts without legal conclusions", async () => {
    const graph = createRegulatoryGraph(project, analyzeAuditProfile(project), project.evidenceItems);
    const triage = await createSourceEvidenceGapTriage({
      graph,
      maxItems: 4,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(triage).toMatchObject({
      triageVersion: "lexproof-source-evidence-gap-triage-v1",
      projectId: project.id,
      status: "needs-evidence",
      visibleGapCount: 4,
      notLegalAdviceBoundary: "Not legal advice. Source evidence gap triage is audit preparation workflow metadata only."
    });
    expect(triage.p0Count).toBeGreaterThan(0);
    expect(triage.triageHash).toMatch(/^[a-f0-9]{64}$/);
    expect(triage.items.map((item) => item.priority)).toEqual(["P0", "P0", "P0", "P0"]);
    const usItem = triage.items.find((item) => item.jurisdiction === "United States");
    expect(usItem).toEqual(
      expect.objectContaining({
        itemVersion: "lexproof-source-evidence-gap-triage-item-v1",
        localCounselRole: expect.stringMatching(/^US /)
      })
    );
    expect(triage.items[0]?.evidenceLedgerDraft).toEqual(
      expect.objectContaining({
        kind: "Checklist",
        status: "requested",
        owner: "Compliance"
      })
    );
    expect(triage.items[0]?.evidenceLedgerDraft.source).toContain("regulatory control: control-");
    expect(triage.items[0]?.evidenceLedgerDraft.content).toContain("Exclude raw KYC, credentials, private keys");
    expect(JSON.stringify(triage)).toContain("Not legal advice");
    expect(JSON.stringify(triage)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|legal opinion|final legal decision/i);
  });

  it("keeps the triage hash stable across generatedAt changes and changes it when gaps change", async () => {
    const graph = createRegulatoryGraph(project, analyzeAuditProfile(project), project.evidenceItems);
    const first = await createSourceEvidenceGapTriage({
      graph,
      maxItems: 3,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const second = await createSourceEvidenceGapTriage({
      graph,
      maxItems: 3,
      generatedAt: "2026-07-03T00:00:00.000Z"
    });
    const changed = await createSourceEvidenceGapTriage({
      graph: {
        ...graph,
        evidenceGaps: graph.evidenceGaps.slice(1)
      },
      maxItems: 3,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });

    expect(first.generatedAt).not.toBe(second.generatedAt);
    expect(first.triageHash).toBe(second.triageHash);
    expect(changed.triageHash).not.toBe(first.triageHash);
  });

  it("exports metadata-only JSON with a ready state when no source gaps are open", async () => {
    const graph = createRegulatoryGraph(project, analyzeAuditProfile(project), project.evidenceItems);
    const triage = await createSourceEvidenceGapTriage({
      graph: {
        ...graph,
        evidenceGaps: []
      },
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const json = exportSourceEvidenceGapTriageJson(triage);

    expect(triage.status).toBe("ready-for-counsel");
    expect(triage.items).toHaveLength(0);
    expect(triage.nextAction).toMatch(/No source evidence gaps are open/i);
    expect(json.endsWith("\n")).toBe(true);
    expect(json).toContain("Not legal advice");
    expect(json).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw evidence bytes/i);
  });

  it("turns a triage item into a metadata-only Evidence Ledger request", async () => {
    const graph = createRegulatoryGraph(project, analyzeAuditProfile(project), project.evidenceItems);
    const triage = await createSourceEvidenceGapTriage({
      graph,
      maxItems: 1,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const evidence = createEvidenceItemFromSourceGapTriageItem(triage.items[0]);

    expect(evidence).toEqual(
      expect.objectContaining({
        kind: "Checklist",
        status: "requested",
        owner: "Compliance"
      })
    );
    expect(evidence.label).toBe(triage.items[0]?.title);
    expect(evidence.source).toContain(`source gap: ${triage.items[0]?.id}`);
    expect(evidence.source).toContain(`regulatory control: control-${triage.items[0]?.clauseId}`);
    expect(evidence.content).toContain("metadata-only evidence");
    expect(JSON.stringify(evidence)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|sk-live|api_key|passport number/i);
  });

  it("reuses an existing source-gap Evidence Ledger request instead of creating a duplicate", async () => {
    const graph = createRegulatoryGraph(project, analyzeAuditProfile(project), project.evidenceItems);
    const triage = await createSourceEvidenceGapTriage({
      graph,
      maxItems: 1,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const item = triage.items[0];
    const firstOperation = createEvidenceRequestOperationFromSourceGapTriageItem([], item);
    const existingEvidence = {
      ...firstOperation.evidenceItem,
      id: "evidence-existing-source-gap",
      content: "Reviewer-edited metadata request",
      status: "rejected" as const,
      owner: "Founder" as const,
      addedAt: "2026-07-02T01:00:00.000Z"
    };
    const secondOperation = createEvidenceRequestOperationFromSourceGapTriageItem([existingEvidence], item);

    expect(firstOperation).toEqual(
      expect.objectContaining({
        operation: "create",
        existingIndex: -1,
        controlId: `control-${item.clauseId}`,
        notLegalAdviceBoundary: "Not legal advice. Source evidence gap triage is audit preparation workflow metadata only."
      })
    );
    expect(secondOperation).toEqual(
      expect.objectContaining({
        operation: "refresh",
        existingIndex: 0,
        controlId: `control-${item.clauseId}`,
        notLegalAdviceBoundary: "Not legal advice. Source evidence gap triage is audit preparation workflow metadata only."
      })
    );
    expect(secondOperation.evidenceItem).toEqual(
      expect.objectContaining({
        id: "evidence-existing-source-gap",
        content: "Reviewer-edited metadata request",
        status: "requested",
        owner: "Founder",
        addedAt: "2026-07-02T01:00:00.000Z"
      })
    );
    expect(secondOperation.statusMessage).toContain("no duplicate evidence item");
    expect(JSON.stringify(secondOperation)).not.toMatch(/\bcompliant\b|\bnon-compliant\b|legal opinion|final legal decision/i);
  });

  it("does not collapse different evidence gaps from the same regulatory control", async () => {
    const graph = createRegulatoryGraph(project, analyzeAuditProfile(project), project.evidenceItems);
    const triage = await createSourceEvidenceGapTriage({
      graph,
      maxItems: graph.evidenceGaps.length,
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const first = triage.items.find((item) => item.clauseId === "eu-dlt-pilot-regime-market-infrastructure");
    expect(first).toBeDefined();
    const sameControlDifferentGap = triage.items.find((item) => item.clauseId === first!.clauseId && item.id !== first!.id);
    expect(sameControlDifferentGap).toBeDefined();

    const firstRequest = createEvidenceRequestOperationFromSourceGapTriageItem([], first!).evidenceItem;
    const secondOperation = createEvidenceRequestOperationFromSourceGapTriageItem([firstRequest], sameControlDifferentGap!);

    expect(secondOperation.operation).toBe("create");
    expect(secondOperation.existingIndex).toBe(-1);
    expect(secondOperation.evidenceItem.source).toContain(`source gap: ${sameControlDifferentGap?.id}`);
  });
});
