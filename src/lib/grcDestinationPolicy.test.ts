import { describe, expect, it } from "vitest";
import { createGrcDestinationPolicyReport, exportGrcDestinationPolicyJson } from "./grcDestinationPolicy";

describe("GRC destination policy", () => {
  it("evaluates destination controls without enabling external ticket creation", () => {
    const report = createGrcDestinationPolicyReport({
      context: {
        workspaceId: "workspace-grc",
        remediationItemCount: 3,
        exportSafetyStatus: "clean",
        exportBlockerCount: 0,
        integrationAdapterStatus: "ready",
        localTicketExportAvailable: true
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
        notes: "Synthetic destination mapping review for future ticket adapter."
      }
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportVersion: "lexproof-grc-destination-policy-v1",
        overallStatus: "ready",
        externalGrcTicketCreationAllowed: false,
        externalGrcTicketCreationStatus: "policy-ready-not-enabled",
        exportMode: "metadata-only-json",
        notLegalAdviceBoundary: "Not legal advice. GRC destination policy is audit preparation metadata only."
      })
    );
    expect(report.requiredControlCount).toBe(10);
    expect(report.approvedControlCount).toBe(10);
    expect(report.nextActions).toContain(
      "Keep external GRC ticket creation disabled until a separate destination adapter enablement review."
    );
    expect(report.controls.every((control) => control.status === "ready")).toBe(true);
    expect(exportGrcDestinationPolicyJson(report)).toContain("lexproof-grc-destination-policy-v1");
  });

  it("blocks unsafe destination metadata without leaking credentials, raw KYC, or ticket-write instructions", () => {
    const report = createGrcDestinationPolicyReport({
      context: {
        workspaceId: "workspace-grc",
        remediationItemCount: 1,
        exportSafetyStatus: "blocked",
        exportBlockerCount: 1,
        integrationAdapterStatus: "blocked",
        localTicketExportAvailable: false
      },
      policy: {
        policyOwner: "sk-live-abcdef1234567890abcdef1234567890",
        destinationSystem: "jira",
        destinationQueue: "Create external Jira tickets now for raw KYC passport data.",
        fieldMappingApproved: true,
        authenticationPolicyApproved: true,
        redactionPolicyApproved: true,
        ticketOwnershipApproved: true,
        retryAndAuditLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Use private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef to push tickets."
      }
    });

    const json = JSON.stringify(report);

    expect(report.overallStatus).toBe("blocked");
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "metadata-boundary", status: "blocked" })]));
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "export-safety", status: "blocked" })]));
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("0x1234567890abcdef");
    expect(json).not.toContain("passport data");
    expect(json.toLowerCase()).not.toContain("push tickets");
  });

  it("blocks direct personal identifiers in destination metadata before external ticket review", () => {
    const report = createGrcDestinationPolicyReport({
      context: {
        workspaceId: "workspace-grc",
        remediationItemCount: 2,
        exportSafetyStatus: "clean",
        exportBlockerCount: 0,
        integrationAdapterStatus: "ready",
        localTicketExportAvailable: true
      },
      policy: {
        policyOwner: "GRC owner jane.reviewer@example.com",
        destinationSystem: "jira",
        destinationQueue: "LEGAL-AUDIT",
        fieldMappingApproved: true,
        authenticationPolicyApproved: true,
        redactionPolicyApproved: true,
        ticketOwnershipApproved: true,
        retryAndAuditLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Ticket exception contact phone +1 415 555 0100 before destination adapter review."
      }
    });

    const json = JSON.stringify(report);

    expect(report.overallStatus).toBe("blocked");
    expect(report.externalGrcTicketCreationStatus).toBe("blocked-by-metadata");
    expect(report.controls).toEqual(expect.arrayContaining([expect.objectContaining({ id: "metadata-boundary", status: "blocked" })]));
    expect(json).not.toContain("jane.reviewer@example.com");
    expect(json).not.toContain("+1 415 555 0100");
    expect(report.notLegalAdviceBoundary).toContain("Not legal advice");
  });
});
