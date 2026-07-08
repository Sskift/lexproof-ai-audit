import { describe, expect, it, vi } from "vitest";
import { fetchGrcDestinationPolicyReport } from "./grcDestinationPolicyClient";
import type { GrcDestinationPolicyContext, GrcDestinationPolicyReport } from "./grcDestinationPolicy";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const readyReport: GrcDestinationPolicyReport = {
  reportVersion: "lexproof-grc-destination-policy-v1",
  generatedAt: "2026-07-01T00:00:00.000Z",
  overallStatus: "ready",
  requiredControlCount: 10,
  approvedControlCount: 10,
  externalGrcTicketCreationAllowed: false,
  externalGrcTicketCreationStatus: "policy-ready-not-enabled",
  exportMode: "metadata-only-json",
  controls: [
    {
      id: "destination-scope",
      label: "Destination scope",
      status: "ready",
      evidence: "Destination system and queue are defined for future adapter review.",
      recoveryAction: "Keep external ticket creation disabled until destination enablement review."
    }
  ],
  nextActions: ["Keep external GRC ticket creation disabled until a separate destination adapter enablement review."],
  notLegalAdviceBoundary: "Not legal advice. GRC destination policy is audit preparation metadata only."
};

describe("GRC destination policy client", () => {
  it("posts destination policy metadata without sending credentials, raw evidence, or external write payloads", async () => {
    const contextWithUnsafeExtras: GrcDestinationPolicyContext & { rawMarkdown: string } = {
      workspaceId: "workspace-grc",
      remediationItemCount: 3,
      exportSafetyStatus: "clean",
      exportBlockerCount: 0,
      integrationAdapterStatus: "ready",
      localTicketExportAvailable: true,
      rawMarkdown: "raw counsel pack should not be posted"
    };
    const policyWithUnsafeExtras = {
      policyOwner: "GRC owner",
      destinationSystem: "jira",
      destinationQueue: "LEGAL-AUDIT",
      fieldMappingApproved: true,
      authenticationPolicyApproved: true,
      redactionPolicyApproved: true,
      ticketOwnershipApproved: true,
      retryAndAuditLoggingApproved: true,
      noSensitiveMaterialConfirmed: true,
      humanReviewRequired: true,
      notes: "Prepared for future GRC adapter review.",
      apiKey: "sk-live-abcdef1234567890abcdef1234567890",
      webhookSecret: "secret-key: abcdef1234567890",
      rawTicketBody: "raw KYC passport data"
    };
    const fetcherMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> => ({
      ok: true,
      json: async () => readyReport
    }) as Response);

    const report = await fetchGrcDestinationPolicyReport({
      apiBaseUrl: "https://api.lexproof.test/",
      fetcher: fetcherMock as unknown as typeof fetch,
      context: contextWithUnsafeExtras,
      policy: policyWithUnsafeExtras
    });

    expect(report).toBe(readyReport);
    expect(fetcherMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetcherMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.lexproof.test/api/integrations/grc-destination/policy");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
      context: {
        workspaceId: "workspace-grc",
        remediationItemCount: 3,
        exportSafetyStatus: "clean",
        exportBlockerCount: 0,
        integrationAdapterStatus: "ready",
        localTicketExportAvailable: true
      },
      policy: {
        policyOwner: "GRC owner",
        destinationSystem: "jira",
        destinationQueue: "LEGAL-AUDIT",
        fieldMappingApproved: true,
        authenticationPolicyApproved: true,
        redactionPolicyApproved: true,
        ticketOwnershipApproved: true,
        retryAndAuditLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Prepared for future GRC adapter review."
      }
    });
    expect(String(init?.body)).not.toContain("rawMarkdown");
    expect(String(init?.body)).not.toContain("apiKey");
    expect(String(init?.body)).not.toContain("webhookSecret");
    expect(String(init?.body)).not.toContain("rawTicketBody");
    expect(String(init?.body)).not.toContain("sk-live");
    expect(String(init?.body)).not.toContain("passport data");
  });

  it("rejects malformed destination policy responses before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...readyReport, externalGrcTicketCreationAllowed: true })
    })) as unknown as typeof fetch;

    await expect(
      fetchGrcDestinationPolicyReport({
        apiBaseUrl: "https://api.lexproof.test",
        fetcher,
        context: {
          workspaceId: "workspace-grc",
          remediationItemCount: 1,
          exportSafetyStatus: "clean",
          exportBlockerCount: 0,
          integrationAdapterStatus: "ready",
          localTicketExportAvailable: true
        },
        policy: {
          policyOwner: "GRC owner",
          destinationSystem: "jira",
          destinationQueue: "LEGAL-AUDIT",
          fieldMappingApproved: true,
          authenticationPolicyApproved: true,
          redactionPolicyApproved: true,
          ticketOwnershipApproved: true,
          retryAndAuditLoggingApproved: true,
          noSensitiveMaterialConfirmed: true,
          humanReviewRequired: true,
          notes: ""
        }
      })
    ).rejects.toMatchObject({
      code: "GRC_DESTINATION_POLICY_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning the metadata-only GRC destination policy contract."
    });
  });

  it("rejects destination policy responses with blank next actions before the UI trusts them", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...readyReport,
        nextActions: ["Keep external GRC ticket creation disabled until a separate destination adapter enablement review.", "   "]
      })
    })) as unknown as typeof fetch;

    await expect(
      fetchGrcDestinationPolicyReport({
        apiBaseUrl: "https://api.lexproof.test",
        fetcher,
        context: {
          workspaceId: "workspace-grc",
          remediationItemCount: 1,
          exportSafetyStatus: "clean",
          exportBlockerCount: 0,
          integrationAdapterStatus: "ready",
          localTicketExportAvailable: true
        },
        policy: {
          policyOwner: "GRC owner",
          destinationSystem: "jira",
          destinationQueue: "LEGAL-AUDIT",
          fieldMappingApproved: true,
          authenticationPolicyApproved: true,
          redactionPolicyApproved: true,
          ticketOwnershipApproved: true,
          retryAndAuditLoggingApproved: true,
          noSensitiveMaterialConfirmed: true,
          humanReviewRequired: true,
          notes: ""
        }
      })
    ).rejects.toMatchObject({
      code: "GRC_DESTINATION_POLICY_INVALID_RESPONSE",
      recoveryAction: "Verify the Phase 2 API is returning the metadata-only GRC destination policy contract."
    });
  });

  it("redacts classified text from otherwise valid destination policy responses before UI use", async () => {
    const pollutedReport: GrcDestinationPolicyReport = {
      ...readyReport,
      controls: [
        {
          ...readyReport.controls[0],
          label: `Destination scope ${apiKey}`,
          evidence: `Destination evidence copied raw KYC packet and apiKey=${apiKey} before a legal opinion.`,
          recoveryAction: `Remove private key ${privateKey} and passport file before destination review.`
        }
      ],
      nextActions: [`Resolve apiKey=${apiKey}, raw KYC packet, and compliance decision before GRC review.`]
    };
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => pollutedReport
    })) as unknown as typeof fetch;

    const report = await fetchGrcDestinationPolicyReport({
      apiBaseUrl: "https://api.lexproof.test",
      fetcher,
      context: {
        workspaceId: "workspace-grc",
        remediationItemCount: 1,
        exportSafetyStatus: "clean",
        exportBlockerCount: 0,
        integrationAdapterStatus: "ready",
        localTicketExportAvailable: true
      },
      policy: {
        policyOwner: "GRC owner",
        destinationSystem: "jira",
        destinationQueue: "LEGAL-AUDIT",
        fieldMappingApproved: true,
        authenticationPolicyApproved: true,
        redactionPolicyApproved: true,
        ticketOwnershipApproved: true,
        retryAndAuditLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: ""
      }
    });
    const serialized = JSON.stringify(report);

    expect(report).not.toBe(pollutedReport);
    expect(report.controls[0].evidence).toContain("[redacted-raw-kyc]");
    expect(report.nextActions[0]).toContain("[redacted-legal-conclusion]");
    expect(serialized).toContain("[redacted-api-key]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/raw KYC packet|passport file|legal opinion|compliance decision/i);
  });
});
