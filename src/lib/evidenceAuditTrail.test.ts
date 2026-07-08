import { describe, expect, it, vi } from "vitest";
import {
  createEvidenceCreatedEvent,
  createEvidenceRemovedEvent,
  createEvidenceUpdateEvent,
  downloadEvidenceAuditTrailJson,
  exportEvidenceAuditTrailJson,
  parseStoredEvidenceAuditEvents,
  sanitizeEvidenceAuditEvent,
  type EvidenceAuditEvent
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

  it("records source-gap refreshes without implying legal approval", () => {
    const event = createEvidenceCreatedEvent(
      "project-1",
      evidence,
      "Compliance",
      "2026-07-02T01:00:00.000Z",
      "source-gap-refreshed"
    );

    expect(event).toMatchObject({
      action: "source-gap-refreshed",
      actor: "Compliance",
      summary: "source-gap-refreshed Launch memo",
      changedFields: ["label", "kind", "content", "source", "status", "owner"]
    });
    expect(JSON.stringify(event)).not.toMatch(/\blegal approval\b|\blegal opinion\b|\bcompliant\b|\bnon-compliant\b/i);
    expect(event.notLegalAdviceBoundary).toContain("Not legal advice");
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

  it("sanitizes stored evidence audit events before local recovery", () => {
    const restored = parseStoredEvidenceAuditEvents(
      JSON.stringify([
        {
          eventVersion: "lexproof-evidence-audit-event-v1",
          id: "event-sk-live123456789012",
          projectId: "project-1",
          evidenceId: "evidence-1",
          evidenceLabel: "Legal opinion raw KYC packet passport file apiKey=supersecretvalue",
          action: "updated",
          actor: "Compliance",
          changedFields: ["label", "content"],
          summary:
            "Updated after final legal decision with 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef.",
          createdAt: "2026-06-29T01:00:00.000Z",
          rawEvidenceContent: "must not survive",
          notLegalAdviceBoundary: "Not legal advice. Evidence audit trail events are local audit preparation metadata."
        }
      ])
    );

    expect(restored).toHaveLength(1);
    expect(JSON.stringify(restored[0])).not.toContain("sk-live123456789012");
    expect(JSON.stringify(restored[0])).not.toContain("supersecretvalue");
    expect(JSON.stringify(restored[0])).not.toContain("Legal opinion");
    expect(JSON.stringify(restored[0])).not.toContain("raw KYC packet");
    expect(JSON.stringify(restored[0])).not.toContain("passport file");
    expect(JSON.stringify(restored[0])).not.toContain("final legal decision");
    expect(JSON.stringify(restored[0])).not.toContain("0x1234567890abcdef");
    expect(restored[0]).not.toHaveProperty("rawEvidenceContent");
    expect(restored[0]?.evidenceLabel).toContain("[redacted-raw-kyc]");
    expect(restored[0]?.notLegalAdviceBoundary).toBe(
      "Not legal advice. Evidence audit trail events are local audit preparation metadata."
    );
  });

  it("drops malformed stored evidence audit events and invalid workflow fields", () => {
    const valid: EvidenceAuditEvent = createEvidenceCreatedEvent(
      "project-1",
      evidence,
      "Founder",
      "2026-06-29T00:00:00.000Z"
    );

    expect(
      parseStoredEvidenceAuditEvents(
        JSON.stringify([
          valid,
          { ...valid, id: "bad-boundary", notLegalAdviceBoundary: "Legal advice approved." },
          { ...valid, id: "bad-action", action: "approved" },
          { ...valid, id: "bad-actor", actor: "Outside Counsel" },
          { ...valid, id: "bad-field", changedFields: ["label", "rawEvidenceContent"] },
          { ...valid, id: "bad-date", createdAt: "June 29, 2026" }
        ])
      )
    ).toEqual([valid]);
    expect(parseStoredEvidenceAuditEvents("{not-json")).toEqual([]);
  });

  it("sanitizes mutated audit trail exports without changing the non-advice boundary", () => {
    const event = sanitizeEvidenceAuditEvent({
      eventVersion: "lexproof-evidence-audit-event-v1",
      id: "event-1",
      projectId: "project-1",
      evidenceId: "evidence-1",
      evidenceLabel: "Passport document review",
      action: "updated",
      actor: "Compliance",
      changedFields: ["label"],
      summary: "Compliance decision references raw KYC dump.",
      createdAt: "2026-06-29T01:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Evidence audit trail events are local audit preparation metadata."
    });
    const json = exportEvidenceAuditTrailJson([event]);

    expect(json).not.toContain("Passport document");
    expect(json).not.toContain("Compliance decision");
    expect(json).not.toContain("raw KYC dump");
    expect(json).toContain("[redacted-identity-document]");
    expect(json).toContain("[redacted-legal-conclusion]");
    expect(json).toContain("Not legal advice");
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
