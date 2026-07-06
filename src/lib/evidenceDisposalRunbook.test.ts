import { describe, expect, it } from "vitest";
import { createEvidenceRetentionRemediationQueue } from "./evidenceRetentionRemediation";
import {
  createEvidenceDisposalRunbook,
  exportEvidenceDisposalRunbookJson,
  type EvidenceDisposalRunbook
} from "./evidenceDisposalRunbook";
import { createRetentionPolicyReport, type RetentionPolicyInput } from "./retentionPolicy";
import type { EvidenceItem } from "./projectModel";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";

describe("createEvidenceDisposalRunbook", () => {
  it("builds a stable deletion-required runbook without leaking blocked values", async () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          label: "Unsafe disposal packet",
          kind: "Text",
          content: `Contains private key ${privateKey}, API key ${apiKey}, and raw KYC packet.`,
          status: "draft",
          owner: "Engineering"
        }
      ])
    );
    const queue = await createEvidenceRetentionRemediationQueue(report, "2026-07-01T00:00:00.000Z");

    const first = await createEvidenceDisposalRunbook(report, queue, "2026-07-01T00:00:00.000Z");
    const second = await createEvidenceDisposalRunbook(report, queue, "2026-07-02T00:00:00.000Z");

    expect(first.status).toBe("delete-required");
    expect(first.rawEvidenceIncluded).toBe(false);
    expect(first.deletionPerformed).toBe(false);
    expect(first.runbookHash).toBe(second.runbookHash);
    expect(first.summary.deletionRequiredCount).toBeGreaterThanOrEqual(3);
    expect(first.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "delete-or-replace-before-vault-sync",
          verificationEvidence: expect.stringContaining("reviewer deletion confirmation")
        })
      ])
    );
    expect(JSON.stringify(first)).toContain("Not legal advice");
    expect(JSON.stringify(first)).not.toContain(privateKey);
    expect(JSON.stringify(first)).not.toContain(apiKey);
    expect(JSON.stringify(first)).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("moves metadata-only evidence into retention-ready disposal tasks", async () => {
    const report = createRetentionPolicyReport(
      withInput([
        {
          label: "Launch approval metadata",
          kind: "Local file metadata",
          content: `File SHA-256: ${"b".repeat(64)}. Raw file content is not stored in LexProof.`,
          status: "received",
          owner: "Compliance"
        }
      ])
    );
    const queue = await createEvidenceRetentionRemediationQueue(report, "2026-07-01T00:00:00.000Z");

    const runbook = await createEvidenceDisposalRunbook(report, queue, "2026-07-01T00:00:00.000Z");

    expect(runbook.status).toBe("retention-ready");
    expect(runbook.summary).toMatchObject({
      deletionRequiredCount: 0,
      metadataReviewCount: 0,
      retainedMetadataCount: 1,
      vaultSyncAllowed: true
    });
    expect(runbook.tasks[0]).toMatchObject({
      action: "retain-metadata-until-workspace-deletion",
      deletionTrigger: "delete with audit workspace or superseded evidence record"
    });
  });
});

describe("exportEvidenceDisposalRunbookJson", () => {
  it("exports metadata-only disposal runbook JSON with a hash and non-advice boundary", async () => {
    const runbook = await createRunbook([
      {
        label: "Unsafe disposal packet",
        kind: "Text",
        content: `Contains raw KYC packet and private key ${privateKey}.`,
        status: "draft",
        owner: "Engineering"
      }
    ]);

    const json = exportEvidenceDisposalRunbookJson(runbook);

    expect(json).toContain("lexproof-evidence-disposal-runbook-v1");
    expect(json).toContain("Not legal advice");
    expect(json).toContain("delete-or-replace-before-vault-sync");
    expect(runbook.runbookHash).toMatch(/^[a-f0-9]{64}$/);
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });
});

async function createRunbook(evidenceItems: EvidenceItem[]): Promise<EvidenceDisposalRunbook> {
  const report = createRetentionPolicyReport(withInput(evidenceItems));
  const queue = await createEvidenceRetentionRemediationQueue(report, "2026-07-01T00:00:00.000Z");
  return createEvidenceDisposalRunbook(report, queue, "2026-07-01T00:00:00.000Z");
}

function withInput(evidenceItems: EvidenceItem[]): RetentionPolicyInput {
  return {
    workspaceId: "workspace-disposal",
    evidenceItems
  };
}
