import { describe, expect, it } from "vitest";
import { createEvidenceVaultControlCoverage } from "./evidenceVaultControlCoverage";

describe("createEvidenceVaultControlCoverage", () => {
  it("summarizes linked regulatory controls across vault records and manifest items", () => {
    const coverage = createEvidenceVaultControlCoverage({
      records: [
        {
          id: "record-ai-policy",
          filename: "ai-system-use-policy.metadata.json",
          status: "verified",
          linkedControlIds: ["control-eu-ai-act-ai-literacy-governance"]
        },
        {
          id: "record-human-review",
          filename: "human-review-approval-log.metadata.json",
          status: "verified",
          linkedControlIds: [
            "control-eu-ai-act-ai-literacy-governance",
            "control-uk-ico-ai-data-protection-governance"
          ]
        },
        {
          id: "record-redaction",
          filename: "model-payload-redaction-checklist.metadata.json",
          status: "received",
          linkedControlIds: ["control-uk-ico-ai-data-protection-governance"]
        }
      ],
      manifest: {
        items: [
          {
            evidenceId: "record-ai-policy",
            linkedControlIds: ["control-eu-ai-act-ai-literacy-governance"]
          },
          {
            evidenceId: "record-human-review",
            linkedControlIds: [
              "control-eu-ai-act-ai-literacy-governance",
              "control-uk-ico-ai-data-protection-governance"
            ]
          },
          {
            evidenceId: "record-redaction",
            linkedControlIds: ["control-uk-ico-ai-data-protection-governance"]
          }
        ]
      }
    });

    expect(coverage).toEqual(
      expect.objectContaining({
        coverageVersion: "lexproof-evidence-vault-control-coverage-v1",
        controlCount: 2,
        recordCount: 3,
        manifestItemCount: 3,
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault control coverage is audit preparation metadata only."
      })
    );
    expect(coverage.controls).toEqual([
      {
        controlId: "control-eu-ai-act-ai-literacy-governance",
        evidenceRecordCount: 2,
        manifestItemCount: 2,
        statuses: ["verified"],
        filenames: ["ai-system-use-policy.metadata.json", "human-review-approval-log.metadata.json"]
      },
      {
        controlId: "control-uk-ico-ai-data-protection-governance",
        evidenceRecordCount: 2,
        manifestItemCount: 2,
        statuses: ["received", "verified"],
        filenames: ["human-review-approval-log.metadata.json", "model-payload-redaction-checklist.metadata.json"]
      }
    ]);
    expect(JSON.stringify(coverage)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });
});
