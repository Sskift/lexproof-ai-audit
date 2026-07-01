import { describe, expect, it } from "vitest";
import { createDocumentParserPolicyReport, exportDocumentParserPolicyJson } from "./documentParserPolicy";

describe("document parser policy", () => {
  it("evaluates required parser controls without enabling external document parsing", () => {
    const report = createDocumentParserPolicyReport({
      context: {
        workspaceId: "workspace-parser",
        evidenceCount: 2,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        exportBlockerCount: 0,
        manifestHash: "d".repeat(64)
      },
      policy: {
        policyOwner: "Document operations",
        maxDocumentSizeMb: 10,
        rawDocumentRetentionDays: 14,
        deletionSlaDays: 7,
        parsingPurpose: "Extract metadata, source citations, and evidence summaries for audit preparation.",
        redactionBeforeParsingApproved: true,
        noTrainingUseConfirmed: true,
        accessLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Synthetic parser policy metadata only."
      }
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-document-parser-policy-v1",
        overallStatus: "ready",
        externalDocumentParsingAllowed: false,
        externalDocumentParsingStatus: "policy-ready-not-enabled",
        notLegalAdviceBoundary: "Not legal advice. Document parser policy is audit preparation metadata only."
      })
    );
    expect(report.requiredControlCount).toBeGreaterThanOrEqual(10);
    expect(report.approvedControlCount).toBe(report.requiredControlCount);
    expect(report.nextActions).toContain("Keep external document parsing disabled until a separate raw-document adapter enablement review.");
    expect(report.controls.every((control) => control.status === "ready")).toBe(true);
    expect(exportDocumentParserPolicyJson(report)).toContain("lexproof-document-parser-policy-v1");
  });

  it("blocks unsafe parser policy metadata without leaking raw document, credentials, or private-key snippets", () => {
    const report = createDocumentParserPolicyReport({
      context: {
        workspaceId: "workspace-parser",
        evidenceCount: 1,
        retentionStatus: "blocked",
        vaultSyncAllowed: false,
        blockerCount: 1,
        exportBlockerCount: 1,
        manifestHash: "e".repeat(64)
      },
      policy: {
        policyOwner: "sk-live-abcdef1234567890abcdef1234567890",
        maxDocumentSizeMb: 10,
        rawDocumentRetentionDays: 14,
        deletionSlaDays: 7,
        parsingPurpose: "Extract raw KYC passport scan and final legal decision.",
        redactionBeforeParsingApproved: true,
        noTrainingUseConfirmed: true,
        accessLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      }
    });

    const json = JSON.stringify(report);

    expect(report.overallStatus).toBe("blocked");
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "metadata-boundary", status: "blocked" })]));
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "retention-boundary", status: "blocked" })]));
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("0x1234567890abcdef");
    expect(json).not.toContain("passport scan");
    expect(json.toLowerCase()).not.toContain("legal opinion");
  });
});
