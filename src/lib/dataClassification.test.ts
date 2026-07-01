import { describe, expect, it } from "vitest";
import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const walletAddress = "0x1111111111111111111111111111111111111111";

describe("classifyDataBoundaryText", () => {
  it("classifies secrets, raw KYC, personal data, and confidential labels without leaking raw values", () => {
    const findings = classifyDataBoundaryText(
      `Confidential memo includes API key ${apiKey}, private key ${privateKey}, raw KYC packet, and passport number handling.`
    );

    expect(findings.map((finding) => finding.dataClass)).toEqual(
      expect.arrayContaining([
        "credential-material",
        "private-key-material",
        "raw-kyc",
        "personal-data",
        "confidential"
      ])
    );
    expect(findings.filter((finding) => finding.severity === "block").length).toBeGreaterThanOrEqual(3);
    expect(findings.find((finding) => finding.dataClass === "personal-data")).toMatchObject({ severity: "warn" });
    expect(findings.find((finding) => finding.dataClass === "confidential")).toMatchObject({ severity: "info" });
    expect(JSON.stringify(findings)).not.toContain(apiKey);
    expect(JSON.stringify(findings)).not.toContain(privateKey);
    expect(JSON.stringify(findings)).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("ignores negated raw KYC references so metadata-only safety copy is not blocked", () => {
    expect(classifyDataBoundaryText("Metadata-only board approval memo; no raw KYC files included.")).toEqual([]);
  });

  it("flags direct personal identifiers without exposing the raw identifier values", () => {
    const findings = classifyDataBoundaryText(
      "Reviewer note lists founder jane.founder@example.com, phone +1 415 555 0199, SSN 123-45-6789, and passport AB1234567 for removal."
    );

    const personalDataFinding = findings.find((finding) => finding.dataClass === "personal-data");

    expect(personalDataFinding).toMatchObject({
      dataClass: "personal-data",
      severity: "warn",
      matchCount: 4
    });
    expect(JSON.stringify(findings)).not.toContain("jane.founder@example.com");
    expect(JSON.stringify(findings)).not.toContain("+1 415 555 0199");
    expect(JSON.stringify(findings)).not.toContain("123-45-6789");
    expect(JSON.stringify(findings)).not.toContain("AB1234567");
  });

  it("flags wallet addresses as reviewable Web3 identifiers without treating them as private keys", () => {
    const findings = classifyDataBoundaryText(
      `Evidence note references treasury wallet ${walletAddress} and signer wallet 0x2222222222222222222222222222222222222222 for review.`
    );

    const walletFinding = findings.find((finding) => finding.dataClass === "wallet-address");

    expect(walletFinding).toMatchObject({
      dataClass: "wallet-address",
      severity: "warn",
      matchCount: 2
    });
    expect(findings.map((finding) => finding.dataClass)).not.toContain("private-key-material");
    expect(JSON.stringify(findings)).not.toContain(walletAddress);
    expect(JSON.stringify(findings)).not.toContain("0x2222222222222222222222222222222222222222");
  });
});

describe("redactClassifiedText", () => {
  it("redacts reusable boundary snippets without exposing credential material", () => {
    const redacted = redactClassifiedText(`api key=${apiKey} private key ${privateKey}`);

    expect(redacted).toContain("[redacted-secret]");
    expect(redacted).toContain("[redacted-private-key]");
    expect(redacted).not.toContain(apiKey);
    expect(redacted).not.toContain(privateKey);
  });

  it("redacts direct personal identifiers from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(
      "Contact jane.founder@example.com, +1 415 555 0199, SSN 123-45-6789, passport AB1234567."
    );

    expect(redacted).toContain("[redacted-email]");
    expect(redacted).toContain("[redacted-phone]");
    expect(redacted).toContain("[redacted-ssn]");
    expect(redacted).toContain("[redacted-passport-id]");
    expect(redacted).not.toContain("jane.founder@example.com");
    expect(redacted).not.toContain("+1 415 555 0199");
    expect(redacted).not.toContain("123-45-6789");
    expect(redacted).not.toContain("AB1234567");
  });

  it("redacts wallet addresses without changing private-key redaction", () => {
    const redacted = redactClassifiedText(`wallet ${walletAddress} private key ${privateKey}`);

    expect(redacted).toContain("[redacted-wallet-address]");
    expect(redacted).toContain("[redacted-private-key]");
    expect(redacted).not.toContain(walletAddress);
    expect(redacted).not.toContain(privateKey);
  });
});
