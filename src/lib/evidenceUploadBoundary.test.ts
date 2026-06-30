import { describe, expect, it } from "vitest";
import { validateEvidenceMetadataBoundary } from "./evidenceUploadBoundary";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

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
      errors: [],
      notLegalAdviceBoundary: "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only."
    });
  });
});
