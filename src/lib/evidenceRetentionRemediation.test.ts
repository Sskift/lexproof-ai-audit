import { describe, expect, it } from "vitest";
import {
  createEvidenceRetentionRemediationQueue,
  exportEvidenceRetentionRemediationJson
} from "./evidenceRetentionRemediation";
import { createRetentionPolicyReport, type RetentionPolicyInput, type RetentionPolicyReport } from "./retentionPolicy";
import type { EvidenceItem } from "./projectModel";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const generatedAt = "2026-07-01T00:00:00.000Z";

describe("createEvidenceRetentionRemediationQueue", () => {
  it("turns blocked retention actions into a redacted remediation queue", async () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          id: "unsafe-retention",
          label: "Unsafe retention packet",
          kind: "Text",
          source: "raw KYC room",
          content: `Developer pasted private key ${privateKey}, API key ${apiKey}, and raw KYC packet.`,
          status: "draft",
          owner: "Engineering"
        }
      ])
    );

    const queue = await createEvidenceRetentionRemediationQueue(report, generatedAt);
    const serialized = JSON.stringify(queue);

    expect(queue).toMatchObject({
      queueVersion: "lexproof-evidence-retention-remediation-queue-v1",
      workspaceId: "workspace-retention",
      generatedAt,
      status: "blocked",
      summary: expect.objectContaining({
        blockedActionCount: report.blockerCount,
        vaultSyncAllowed: false
      }),
      notLegalAdviceBoundary: "Not legal advice. Evidence retention remediation queues are audit preparation workflow metadata only."
    });
    expect(queue.queueHash).toMatch(/^[a-f0-9]{64}$/);
    expect(queue.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: "P0",
          actionType: "delete-or-replace",
          evidenceLabel: "Unsafe retention packet",
          owner: "Engineering",
          nextAction: "Delete or replace Unsafe retention packet before Evidence Vault sync.",
          notLegalAdviceBoundary: "Not legal advice. Evidence retention remediation items are audit preparation workflow metadata only."
        })
      ])
    );
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain("raw KYC packet");
    expect(serialized).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("keeps the queue hash stable and changes it when remediation content changes", async () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          label: "Privacy retention note",
          kind: "Markdown",
          content: "Mentions passport number handling and personal data categories without raw values.",
          status: "received",
          owner: "Compliance"
        }
      ])
    );

    const first = await createEvidenceRetentionRemediationQueue(report, generatedAt);
    const second = await createEvidenceRetentionRemediationQueue(report, "2026-07-02T00:00:00.000Z");
    const changed = await createEvidenceRetentionRemediationQueue(withChangedReason(report), generatedAt);

    expect(first.status).toBe("needs-review");
    expect(first.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: "P1",
          actionType: "confirm-metadata-only",
          nextAction: "Confirm Privacy retention note is metadata-only before Evidence Vault sync."
        })
      ])
    );
    expect(first.queueHash).toBe(second.queueHash);
    expect(first.queueHash).not.toBe(changed.queueHash);
  });

  it("keeps ready evidence as metadata-only retention work", async () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          label: "Launch approval memo",
          kind: "Markdown",
          content: "Metadata-only board approval summary with synthetic launch facts only.",
          status: "verified",
          owner: "Compliance"
        }
      ])
    );

    const queue = await createEvidenceRetentionRemediationQueue(report, generatedAt);

    expect(queue.status).toBe("ready");
    expect(queue.summary.readyActionCount).toBe(1);
    expect(queue.items[0]).toMatchObject({
      priority: "P2",
      actionType: "retain-metadata-only",
      nextAction: "Keep Launch approval memo as metadata-only evidence until workspace deletion or supersession."
    });
  });
});

describe("exportEvidenceRetentionRemediationJson", () => {
  it("exports remediation queue JSON with hash and non-advice boundary", async () => {
    const report = createRetentionPolicyReport(withInput([]));
    const queue = await createEvidenceRetentionRemediationQueue(report, generatedAt);

    const json = exportEvidenceRetentionRemediationJson(queue);

    expect(json).toContain("lexproof-evidence-retention-remediation-queue-v1");
    expect(json).toContain(queue.queueHash);
    expect(json).toContain("Not legal advice");
    expect(json.endsWith("\n")).toBe(true);
  });
});

function withInput(evidenceItems: EvidenceItem[]): RetentionPolicyInput {
  return {
    workspaceId: "workspace-retention",
    evidenceItems
  };
}

function withChangedReason(report: RetentionPolicyReport): RetentionPolicyReport {
  return {
    ...report,
    actions: report.actions.map((action, index) =>
      index === 0
        ? {
            ...action,
            reason: `${action.reason} Confirm by named reviewer.`
          }
        : action
    )
  };
}
