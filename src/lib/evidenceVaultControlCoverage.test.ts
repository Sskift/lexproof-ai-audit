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
        readiness: "ready-for-handoff",
        nextAction: "Keep verified vault evidence linked in the Counsel Pack and source handoff.",
        statuses: ["verified"],
        filenames: ["ai-system-use-policy.metadata.json", "human-review-approval-log.metadata.json"]
      },
      {
        controlId: "control-uk-ico-ai-data-protection-governance",
        evidenceRecordCount: 2,
        manifestItemCount: 2,
        readiness: "needs-review",
        nextAction: "Move linked vault evidence through Human Review before export reliance.",
        statuses: ["received", "verified"],
        filenames: ["human-review-approval-log.metadata.json", "model-payload-redaction-checklist.metadata.json"]
      }
    ]);
    expect(JSON.stringify(coverage)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("surfaces manifest linkage recovery actions without legal conclusions", () => {
    const coverage = createEvidenceVaultControlCoverage({
      records: [
        {
          id: "record-rwa-disclosure",
          filename: "rwa-disclosure.metadata.json",
          status: "verified",
          linkedControlIds: ["control-us-sec-cftc-crypto-asset-interpretation"]
        }
      ],
      manifest: {
        items: [
          {
            evidenceId: "manifest-only-record",
            linkedControlIds: ["control-eu-mica-title-ii-white-paper"]
          }
        ]
      }
    });

    expect(coverage.controls).toEqual([
      {
        controlId: "control-eu-mica-title-ii-white-paper",
        evidenceRecordCount: 0,
        manifestItemCount: 1,
        readiness: "needs-vault-record",
        nextAction: "Sync the linked evidence record to Evidence Vault before relying on manifest metadata.",
        statuses: [],
        filenames: []
      },
      {
        controlId: "control-us-sec-cftc-crypto-asset-interpretation",
        evidenceRecordCount: 1,
        manifestItemCount: 0,
        readiness: "needs-manifest-link",
        nextAction: "Regenerate the Evidence Vault manifest so this control has hash lineage.",
        statuses: ["verified"],
        filenames: ["rwa-disclosure.metadata.json"]
      }
    ]);
    expect(JSON.stringify(coverage)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });
});
