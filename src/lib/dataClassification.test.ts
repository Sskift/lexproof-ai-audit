import { describe, expect, it } from "vitest";
import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

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
});

describe("redactClassifiedText", () => {
  it("redacts reusable boundary snippets without exposing credential material", () => {
    const redacted = redactClassifiedText(`api key=${apiKey} private key ${privateKey}`);

    expect(redacted).toContain("[redacted-secret]");
    expect(redacted).toContain("[redacted-private-key]");
    expect(redacted).not.toContain(apiKey);
    expect(redacted).not.toContain(privateKey);
  });
});
