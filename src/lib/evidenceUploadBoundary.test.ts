import { describe, expect, it } from "vitest";
import { validateEvidenceMetadataBoundary, validateLocalFileEvidenceMetadata } from "./evidenceUploadBoundary";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const walletAddress = "0x1111111111111111111111111111111111111111";

describe("validateEvidenceMetadataBoundary", () => {
  it("blocks private keys, credentials, and raw KYC references in server evidence metadata without leaking values", () => {
    const result = validateEvidenceMetadataBoundary({
      filename: "board-approval.txt",
      owner: "Compliance",
      sourceNote: `Do not store ${apiKey}, private key ${privateKey}, or raw KYC packet in metadata.`,
      linkedRiskFlagIds: ["governance"],
      replacementReason: ""
    });

    expect(result).toEqual(
      expect.objectContaining({
        valid: false,
        blockedClasses: expect.arrayContaining(["credential-material", "private-key-material", "raw-kyc"]),
        notLegalAdviceBoundary: "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only."
      })
    );
    expect(result.errors.join(" ")).toContain("credential-material");
    expect(result.errors.join(" ")).toContain("private-key-material");
    expect(result.errors.join(" ")).toContain("raw-kyc");
    expect(JSON.stringify(result)).not.toContain(apiKey);
    expect(JSON.stringify(result)).not.toContain(privateKey);
    expect(JSON.stringify(result)).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("allows clean metadata and ignores negated raw KYC references", () => {
    expect(
      validateEvidenceMetadataBoundary({
        filename: "board-approval.txt",
        owner: "Compliance",
        sourceNote: "Metadata-only board approval memo; no raw KYC files included.",
        linkedRiskFlagIds: ["governance", "custody"],
        replacementReason: "Reviewer requested clearer authorization scope."
      })
    ).toEqual({
      resultVersion: "lexproof-evidence-metadata-boundary-v1",
      valid: true,
      blockedClasses: [],
      warningClasses: [],
      warningFindings: [],
      errors: [],
      notLegalAdviceBoundary: "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only."
    });
  });

  it("returns redacted warning findings for wallet addresses and direct identifiers without blocking upload", () => {
    const result = validateEvidenceMetadataBoundary({
      filename: "wallet-control.txt",
      owner: "Compliance",
      sourceNote: `Treasury wallet ${walletAddress} and contact jane.founder@example.com require review.`,
      linkedRiskFlagIds: ["custody"],
      linkedControlIds: ["control-wallet"],
      replacementReason: ""
    });

    expect(result.valid).toBe(true);
    expect(result.blockedClasses).toEqual([]);
    expect(result.warningClasses).toEqual(["wallet-address", "personal-data"]);
    expect(result.warningFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dataClass: "wallet-address",
          severity: "warn",
          redactedSnippet: expect.stringContaining("[redacted-wallet-address]")
        }),
        expect.objectContaining({
          dataClass: "personal-data",
          severity: "warn",
          redactedSnippet: expect.stringContaining("[redacted-email]")
        })
      ])
    );
    expect(JSON.stringify(result)).not.toContain(walletAddress);
    expect(JSON.stringify(result)).not.toContain("jane.founder@example.com");
  });
});

describe("validateLocalFileEvidenceMetadata", () => {
  it("blocks unsafe local file metadata before hashing without leaking secret values", () => {
    const result = validateLocalFileEvidenceMetadata({
      filename: `raw KYC packet ${apiKey} private key ${privateKey}.pdf`,
      mimeType: "application/pdf",
      byteSize: 1234,
      lastModified: Date.UTC(2026, 6, 5, 8, 30, 0),
      owner: "Founder"
    });

    expect(result).toEqual(
      expect.objectContaining({
        valid: false,
        blockedClasses: expect.arrayContaining(["credential-material", "private-key-material", "raw-kyc"]),
        warningClasses: [],
        notLegalAdviceBoundary: "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only."
      })
    );
    expect(JSON.stringify(result)).not.toContain(apiKey);
    expect(JSON.stringify(result)).not.toContain(privateKey);
    expect(JSON.stringify(result)).not.toContain("raw KYC packet");
  });

  it("warns on linkable local file metadata while allowing metadata-only intake", () => {
    const result = validateLocalFileEvidenceMetadata({
      filename: `treasury-${walletAddress}-jane.founder@example.com.txt`,
      mimeType: "text/plain",
      byteSize: 88,
      lastModified: "2026-07-05T08:30:00.000Z",
      owner: "Compliance"
    });

    expect(result.valid).toBe(true);
    expect(result.blockedClasses).toEqual([]);
    expect(result.warningClasses).toEqual(["wallet-address", "personal-data"]);
    expect(result.warningFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dataClass: "wallet-address", redactedSnippet: expect.stringContaining("[redacted-wallet-address]") }),
        expect.objectContaining({ dataClass: "personal-data", redactedSnippet: expect.stringContaining("[redacted-email]") })
      ])
    );
    expect(JSON.stringify(result)).not.toContain(walletAddress);
    expect(JSON.stringify(result)).not.toContain("jane.founder@example.com");
  });

  it("allows clean local file metadata", () => {
    expect(
      validateLocalFileEvidenceMetadata({
        filename: "board-approval-metadata.pdf",
        mimeType: "application/pdf",
        byteSize: 4096,
        lastModified: Date.UTC(2026, 6, 5, 8, 30, 0),
        owner: "Compliance"
      })
    ).toEqual({
      resultVersion: "lexproof-evidence-metadata-boundary-v1",
      valid: true,
      blockedClasses: [],
      warningClasses: [],
      warningFindings: [],
      errors: [],
      notLegalAdviceBoundary: "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only."
    });
  });
});
