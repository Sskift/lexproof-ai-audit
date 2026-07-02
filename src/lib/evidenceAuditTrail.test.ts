import { describe, expect, it, vi } from "vitest";
import {
  createEvidenceCreatedEvent,
  createEvidenceRemovedEvent,
  createEvidenceUpdateEvent,
  downloadEvidenceAuditTrailJson,
  exportEvidenceAuditTrailJson
} from "./evidenceAuditTrail";
import type { EvidenceItem } from "./projectModel";

const evidence: EvidenceItem = {
  id: "evidence-1",
  label: "Launch memo",
  kind: "Markdown",
  content: "Token terms and launch approvals",
  source: "Synthetic memo",
  status: "draft",
  owner: "Founder"
};

describe("evidence audit trail events", () => {
  it("records evidence creation with a non-advice audit-prep boundary", () => {
    const event = createEvidenceCreatedEvent("project-1", evidence, "Founder", "2026-06-29T00:00:00.000Z");

    expect(event).toMatchObject({
      eventVersion: "lexproof-evidence-audit-event-v1",
      projectId: "project-1",
      evidenceId: "evidence-1",
      evidenceLabel: "Launch memo",
      action: "created",
      actor: "Founder",
      changedFields: ["label", "kind", "content", "source", "status", "owner"],
      summary: "created Launch memo"
    });
    expect(event.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("records source-gap requested evidence as a distinct audit-prep action", () => {
    const event = createEvidenceCreatedEvent(
      "project-1",
      evidence,
      "Compliance",
      "2026-07-02T00:00:00.000Z",
      "source-gap-requested"
    );

    expect(event).toMatchObject({
      action: "source-gap-requested",
      actor: "Compliance",
      summary: "source-gap-requested Launch memo",
      changedFields: ["label", "kind", "content", "source", "status", "owner"]
    });
    expect(JSON.stringify(event)).toContain("Not legal advice");
  });

  it("records only material evidence fields that changed during an update", () => {
    const event = createEvidenceUpdateEvent(
      "project-1",
      evidence,
      { ...evidence, status: "verified", owner: "Compliance", updatedAt: "2026-06-29T01:00:00.000Z" },
      "Compliance",
      "2026-06-29T01:00:00.000Z"
    );

    expect(event).toMatchObject({
      action: "updated",
      actor: "Compliance",
      changedFields: ["status", "owner"],
      summary: "updated Launch memo: status, owner"
    });
  });

  it("does not create update events when no material evidence fields changed", () => {
    expect(createEvidenceUpdateEvent("project-1", evidence, { ...evidence }, "Founder")).toBeNull();
  });

  it("records removals and exports the trail as JSON", () => {
    const event = createEvidenceRemovedEvent("project-1", evidence, "Founder", "2026-06-29T02:00:00.000Z");
    const json = exportEvidenceAuditTrailJson([event]);

    expect(event).toMatchObject({
      action: "removed",
      changedFields: ["removed"],
      summary: "removed Launch memo"
    });
    expect(json).toContain("\"trailVersion\": \"lexproof-evidence-audit-trail-v1\"");
    expect(json).toContain("\"action\": \"removed\"");
  });
});

describe("downloadEvidenceAuditTrailJson", () => {
  it("downloads evidence audit trail events through a browser Blob", () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:evidence-trail");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const event = createEvidenceCreatedEvent("project-1", evidence, "Founder", "2026-06-29T00:00:00.000Z");

    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadEvidenceAuditTrailJson("evidence-trail.json", [event]);

      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:evidence-trail");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });
});
