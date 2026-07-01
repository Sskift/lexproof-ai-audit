import { describe, expect, it, vi } from "vitest";
import { fetchDocumentParserPolicyReport } from "./documentParserPolicyClient";
import type { DocumentParserPolicyContext, DocumentParserPolicyReport } from "./documentParserPolicy";

const readyReport: DocumentParserPolicyReport = {
  reportVersion: "lexproof-document-parser-policy-v1",
  generatedAt: "2026-07-01T00:00:00.000Z",
  overallStatus: "ready",
  requiredControlCount: 10,
  approvedControlCount: 10,
  externalDocumentParsingAllowed: false,
  externalDocumentParsingStatus: "policy-ready-not-enabled",
  controls: [
    {
      id: "retention-boundary",
      label: "Retention boundary",
      status: "ready",
      evidence: "Retention policy is ready for metadata-only parser review.",
      recoveryAction: "Keep raw document parsing disabled until adapter enablement review."
    }
  ],
  nextActions: ["Keep external document parsing disabled until a separate raw-document adapter enablement review."],
  notLegalAdviceBoundary: "Not legal advice. Document parser policy is audit preparation metadata only."
};

describe("document parser policy client", () => {
  it("posts parser policy metadata without sending raw documents or credentials", async () => {
    const contextWithUnexpectedRawFields: DocumentParserPolicyContext & { rawDocumentBytes: string } = {
      workspaceId: "workspace-parser",
      evidenceCount: 2,
      retentionStatus: "ready",
      vaultSyncAllowed: true,
      blockerCount: 0,
      exportBlockerCount: 0,
      manifestHash: "f".repeat(64),
      rawDocumentBytes: "raw PDF bytes should not be posted"
    };
    const policyWithUnexpectedRawFields = {
      policyOwner: "Document owner",
      maxDocumentSizeMb: 10,
      rawDocumentRetentionDays: 14,
      deletionSlaDays: 7,
      parsingPurpose: "Extract source citations for audit preparation.",
      redactionBeforeParsingApproved: true,
      noTrainingUseConfirmed: true,
      accessLoggingApproved: true,
      noSensitiveMaterialConfirmed: true,
      humanReviewRequired: true,
      notes: "Prepared for future document parser adapter review.",
      rawDocumentBody: "full contract text should not be posted",
      apiKey: "sk-live-abcdef1234567890abcdef1234567890"
    };
    const fetcherMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> => ({
      ok: true,
      json: async () => readyReport
    }) as Response);

    const report = await fetchDocumentParserPolicyReport({
      apiBaseUrl: "https://api.lexproof.test/",
      fetcher: fetcherMock as unknown as typeof fetch,
      context: contextWithUnexpectedRawFields,
      policy: policyWithUnexpectedRawFields
    });

    expect(report).toBe(readyReport);
    expect(fetcherMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetcherMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/integrations/document-parser/policy");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
      context: {
        workspaceId: "workspace-parser",
        evidenceCount: 2,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        exportBlockerCount: 0,
        manifestHash: "f".repeat(64)
      },
      policy: {
        policyOwner: "Document owner",
        maxDocumentSizeMb: 10,
        rawDocumentRetentionDays: 14,
        deletionSlaDays: 7,
        parsingPurpose: "Extract source citations for audit preparation.",
        redactionBeforeParsingApproved: true,
        noTrainingUseConfirmed: true,
        accessLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Prepared for future document parser adapter review."
      }
    });
    expect(String(init?.body)).not.toContain("rawDocumentBytes");
    expect(String(init?.body)).not.toContain("rawDocumentBody");
    expect(String(init?.body)).not.toContain("apiKey");
    expect(String(init?.body)).not.toContain("sk-");
  });

  it("rejects malformed parser policy responses before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...readyReport, externalDocumentParsingAllowed: true })
    })) as unknown as typeof fetch;

    await expect(
      fetchDocumentParserPolicyReport({
        apiBaseUrl: "https://api.lexproof.test",
        fetcher,
        context: {
          workspaceId: "workspace-parser",
          evidenceCount: 1,
          retentionStatus: "ready",
          vaultSyncAllowed: true,
          blockerCount: 0,
          exportBlockerCount: 0,
          manifestHash: "f".repeat(64)
        },
        policy: {
          policyOwner: "Document owner",
          maxDocumentSizeMb: 10,
          rawDocumentRetentionDays: 14,
          deletionSlaDays: 7,
          parsingPurpose: "Extract source citations for audit preparation.",
          redactionBeforeParsingApproved: true,
          noTrainingUseConfirmed: true,
          accessLoggingApproved: true,
          noSensitiveMaterialConfirmed: true,
          humanReviewRequired: true,
          notes: ""
        }
      })
    ).rejects.toMatchObject({
      code: "DOCUMENT_PARSER_POLICY_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning the metadata-only document parser policy contract."
    });
  });
});
