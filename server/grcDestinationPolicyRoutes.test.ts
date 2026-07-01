import { describe, expect, it } from "vitest";
import { buildServer } from "./app";

describe("GRC destination policy route", () => {
  it("evaluates destination policy readiness without accepting ticket secrets or creating external tickets", async () => {
    const server = buildServer();

    const response = await server.inject({
      method: "POST",
      url: "/api/integrations/grc-destination/policy",
      payload: {
        context: {
          workspaceId: "workspace-grc",
          remediationItemCount: 3,
          exportSafetyStatus: "clean",
          exportBlockerCount: 0,
          integrationAdapterStatus: "ready",
          localTicketExportAvailable: true,
          rawTicketBody: "raw ticket body should be ignored"
        },
        policy: {
          policyOwner: "GRC operations",
          destinationSystem: "jira",
          destinationQueue: "LEGAL-AUDIT",
          fieldMappingApproved: true,
          authenticationPolicyApproved: true,
          redactionPolicyApproved: true,
          ticketOwnershipApproved: true,
          retryAndAuditLoggingApproved: true,
          noSensitiveMaterialConfirmed: true,
          humanReviewRequired: true,
          notes: "Metadata-only destination policy.",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890",
          webhookSecret: "secret-key: abcdef1234567890",
          rawTicketBody: "raw KYC passport data"
        }
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    const json = JSON.stringify(body);

    expect(body).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-grc-destination-policy-v1",
        overallStatus: "ready",
        externalGrcTicketCreationAllowed: false,
        externalGrcTicketCreationStatus: "policy-ready-not-enabled",
        exportMode: "metadata-only-json",
        notLegalAdviceBoundary: "Not legal advice. GRC destination policy is audit preparation metadata only."
      })
    );
    expect(json).not.toContain("raw ticket body should be ignored");
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("secret-key");
    expect(json).not.toContain("passport data");

    await server.close();
  });
});
