import { describe, expect, it } from "vitest";
import type { EvidenceItem } from "./projectModel";
import {
  createEvidenceRecertificationQueue,
  exportEvidenceRecertificationJson
} from "./evidenceRecertification";

const generatedAt = "2026-07-01T00:00:00.000Z";

describe("evidence recertification", () => {
  it("routes stale source-linked verified evidence into a priority recertification queue without raw content", async () => {
    const staleEvidence: EvidenceItem = {
      id: "evidence-claims-inventory",
      label: "Claims inventory",
      kind: "CSV",
      content: "Synthetic claim rows plus blocked raw body that should never enter recertification export.",
      source: "regulatory control: control-uae-vara-marketing-approval; risk evidence requirement: marketing-claims",
      status: "verified",
      owner: "Compliance",
      updatedAt: "2026-01-01T00:00:00.000Z"
    };

    const queue = await createEvidenceRecertificationQueue({
      workspaceId: "workspace-signalbridge",
      evidenceItems: [staleEvidence],
      generatedAt,
      recertificationIntervalDays: 90,
      warningWindowDays: 14
    });

    expect(queue.status).toBe("needs-recertification");
    expect(queue.summary.overdueCount).toBe(1);
    expect(queue.summary.sourceLinkedCount).toBe(1);
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toMatchObject({
      priority: "P0",
      evidenceId: "evidence-claims-inventory",
      evidenceLabel: "Claims inventory",
      owner: "Compliance",
      evidenceStatus: "verified",
      ageDays: 181,
      dueAt: "2026-04-01T00:00:00.000Z",
      linkedControlIds: ["control-uae-vara-marketing-approval"]
    });
    expect(queue.items[0].notLegalAdviceBoundary).toContain("Not legal advice");
    expect(exportEvidenceRecertificationJson(queue)).not.toContain("blocked raw body");
  });

  it("keeps queue hashes stable and metadata-only when raw content changes", async () => {
    const evidence: EvidenceItem = {
      id: "evidence-source-log",
      label: "Source review log",
      kind: "CSV",
      content: "first raw summary body",
      source: "regulatory control: control-eu-ai-act-ai-literacy-governance",
      status: "verified",
      owner: "Counsel",
      updatedAt: "2026-04-06T00:00:00.000Z"
    };
    const changedContent: EvidenceItem = {
      ...evidence,
      content: "changed raw summary body"
    };

    const firstQueue = await createEvidenceRecertificationQueue({
      workspaceId: "workspace-ai-review",
      evidenceItems: [evidence],
      generatedAt,
      recertificationIntervalDays: 90,
      warningWindowDays: 14
    });
    const secondQueue = await createEvidenceRecertificationQueue({
      workspaceId: "workspace-ai-review",
      evidenceItems: [changedContent],
      generatedAt,
      recertificationIntervalDays: 90,
      warningWindowDays: 14
    });

    expect(firstQueue.status).toBe("monitoring");
    expect(firstQueue.items[0].priority).toBe("P2");
    expect(firstQueue.queueHash).toEqual(secondQueue.queueHash);
    expect(exportEvidenceRecertificationJson(secondQueue)).not.toContain("changed raw summary body");
  });

  it("returns a ready state when evidence is fresh or not yet reliance-ready", async () => {
    const evidence: EvidenceItem[] = [
      {
        id: "fresh",
        label: "Fresh verified memo",
        kind: "Markdown",
        content: "Metadata-only summary",
        status: "verified",
        owner: "Founder",
        updatedAt: "2026-06-25T00:00:00.000Z"
      },
      {
        id: "requested",
        label: "Requested memo",
        kind: "Markdown",
        content: "Metadata-only request",
        status: "requested",
        owner: "Compliance",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ];

    const queue = await createEvidenceRecertificationQueue({
      workspaceId: "workspace-ready",
      evidenceItems: evidence,
      generatedAt,
      recertificationIntervalDays: 90,
      warningWindowDays: 14
    });

    expect(queue.status).toBe("ready");
    expect(queue.summary.totalActionCount).toBe(0);
    expect(queue.items).toEqual([]);
    expect(queue.nextSteps).toEqual(["No recertification action is due for reliance-ready evidence."]);
  });
});
