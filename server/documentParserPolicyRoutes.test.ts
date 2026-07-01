import { describe, expect, it } from "vitest";
import { buildServer } from "./app";

describe("document parser policy route", () => {
  it("evaluates parser policy readiness without accepting raw documents or enabling external parsing", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/integrations/document-parser/policy",
      payload: {
        context: {
          workspaceId: "workspace-parser",
          evidenceCount: 2,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          exportBlockerCount: 0,
          manifestHash: "a".repeat(64),
          rawDocumentBytes: "raw PDF bytes should be ignored"
        },
        policy: {
          policyOwner: "Document operations",
          maxDocumentSizeMb: 10,
          rawDocumentRetentionDays: 14,
          deletionSlaDays: 7,
          parsingPurpose: "Extract source citations for audit preparation.",
          redactionBeforeParsingApproved: true,
          noTrainingUseConfirmed: true,
          accessLoggingApproved: true,
          noSensitiveMaterialConfirmed: true,
          humanReviewRequired: true,
          notes: "Metadata-only parser policy.",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890",
          rawDocumentBody: "Full document text should be ignored."
        }
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    const json = JSON.stringify(body);

    expect(body).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-document-parser-policy-v1",
        overallStatus: "ready",
        externalDocumentParsingAllowed: false,
        externalDocumentParsingStatus: "policy-ready-not-enabled",
        notLegalAdviceBoundary: "Not legal advice. Document parser policy is audit preparation metadata only."
      })
    );
    expect(json).not.toContain("raw PDF bytes");
    expect(json).not.toContain("Full document text");
    expect(json).not.toContain("sk-live-abcdef");

    await server.close();
  });
});
