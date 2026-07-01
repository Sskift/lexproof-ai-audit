import { describe, expect, it } from "vitest";
import {
  createDataBoundaryReport,
  summarizeDataBoundaryForExport,
  type DataBoundaryReportInput
} from "./dataBoundary";
import type { ProjectProfile } from "./projectModel";

const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const walletAddress = "0x1111111111111111111111111111111111111111";

const baseProject: ProjectProfile = {
  id: "project-boundary",
  projectName: "Export Boundary Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "Policy metadata only; no raw KYC files",
  aiUsage: "AI drafts audit-prep review questions",
  blockchainUse: "Simulated evidence hash registry",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createDataBoundaryReport", () => {
  it("blocks export when private keys, API keys, or raw KYC materials are present without leaking the raw secret", () => {
    const report = createDataBoundaryReport(
      withInput({
        project: {
          ...baseProject,
          evidenceItems: [
            {
              id: "unsafe",
              label: "Unsafe export packet",
              kind: "Text",
              source: "raw KYC room",
              content: `Developer pasted private key ${privateKey}, API key ${apiKey}, and raw KYC packet.`,
              status: "draft",
              owner: "Engineering"
            }
          ]
        }
      })
    );

    expect(report.status).toBe("blocked");
    expect(report.exportAllowed).toBe(false);
    expect(report.blockerCount).toBeGreaterThanOrEqual(3);
    expect(report.detectedClasses).toEqual(
      expect.arrayContaining(["private-key-material", "credential-material", "raw-kyc"])
    );
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceLabel: "Unsafe export packet",
          dataClass: "private-key-material",
          severity: "block"
        }),
        expect.objectContaining({
          dataClass: "credential-material",
          severity: "block"
        }),
        expect.objectContaining({
          dataClass: "raw-kyc",
          severity: "block"
        })
      ])
    );
    expect(JSON.stringify(report)).not.toContain(privateKey);
    expect(JSON.stringify(report)).not.toContain(apiKey);
    expect(JSON.stringify(report)).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("marks personal-data references for review while keeping export available after human confirmation", () => {
    const report = createDataBoundaryReport(
      withInput({
        project: {
          ...baseProject,
          dataSensitivity: "Policy metadata with no direct identifiers",
          evidenceItems: [
            {
              id: "personal-data-reference",
              label: "Privacy note",
              kind: "Markdown",
              content: "Mentions passport number handling and personal data retention categories without raw values.",
              status: "received",
              owner: "Compliance"
            }
          ]
        }
      })
    );

    expect(report.status).toBe("needs-review");
    expect(report.exportAllowed).toBe(true);
    expect(report.warningCount).toBeGreaterThanOrEqual(1);
    expect(report.detectedClasses).toContain("personal-data");
    expect(report.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("marks wallet addresses for review while keeping metadata-only export available", () => {
    const report = createDataBoundaryReport(
      withInput({
        project: {
          ...baseProject,
          evidenceItems: [
            {
              id: "wallet-reference",
              label: "Wallet control memo",
              kind: "Markdown",
              content: `Treasury signer address ${walletAddress} appears in the wallet-control summary.`,
              status: "received",
              owner: "Compliance"
            }
          ]
        }
      })
    );

    expect(report.status).toBe("needs-review");
    expect(report.exportAllowed).toBe(true);
    expect(report.detectedClasses).toContain("wallet-address");
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceLabel: "Wallet control memo",
          dataClass: "wallet-address",
          severity: "warn",
          redactedSnippet: expect.stringContaining("[redacted-wallet-address]")
        })
      ])
    );
    expect(report.remediation).toContain(
      "Confirm wallet addresses are public, redacted, or approved for counsel handoff before external sharing."
    );
    expect(JSON.stringify(report)).not.toContain(walletAddress);
  });
});

describe("summarizeDataBoundaryForExport", () => {
  it("summarizes export safety status, remediation, and non-advice boundary without raw secrets", () => {
    const report = createDataBoundaryReport(
      withInput({
        project: {
          ...baseProject,
          evidenceItems: [
            {
              label: "Unsafe export packet",
              kind: "Text",
              content: `Do not export API key ${apiKey} or private key ${privateKey}.`,
              status: "draft",
              owner: "Engineering"
            }
          ]
        }
      })
    );

    const summary = summarizeDataBoundaryForExport(report);

    expect(summary).toContain("Not legal advice");
    expect(summary).toContain("blocked");
    expect(summary).toContain("credential-material");
    expect(summary).toContain("private-key-material");
    expect(summary).toContain("Remove or replace blocked materials");
    expect(summary).not.toContain(privateKey);
    expect(summary).not.toContain(apiKey);
    expect(summary).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("summarizes wallet-address review findings without raw wallet values", () => {
    const report = createDataBoundaryReport(
      withInput({
        project: {
          ...baseProject,
          evidenceItems: [
            {
              label: "Wallet control memo",
              kind: "Markdown",
              content: `Treasury signer address ${walletAddress} appears in the wallet-control summary.`,
              status: "received",
              owner: "Compliance"
            }
          ]
        }
      })
    );

    const summary = summarizeDataBoundaryForExport(report);

    expect(summary).toContain("wallet-address");
    expect(summary).toContain("[redacted-wallet-address]");
    expect(summary).toContain("Not legal advice");
    expect(summary).not.toContain(walletAddress);
  });
});

function withInput(overrides: Partial<DataBoundaryReportInput>): DataBoundaryReportInput {
  const project = overrides.project ?? baseProject;
  return {
    project,
    evidenceItems: overrides.evidenceItems ?? project.evidenceItems,
    counselQuestions: overrides.counselQuestions ?? [],
    counselReviews: overrides.counselReviews ?? [],
    aiEvents: overrides.aiEvents ?? []
  };
}
