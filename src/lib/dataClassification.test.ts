import { describe, expect, it } from "vitest";
import { classifyDataBoundaryText, redactClassifiedText } from "./dataClassification";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const bearerToken = "eyJhbGciOiJIUzI1NiJ9.auditPrepPayload.signature";
const standaloneBearerToken = "eyJhbGciOiJSUzI1NiJ9.auditEvidencePayload.signature";
const basicAuthCredential = ["dXNlcl9uYW1l", "OlN5bnRoZXRpY0Jhc2ljQ3JlZGVudGlhbA=="].join("");
const jwtToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJsZXhwcm9vZiIsInN1YiI6ImRlbW8ifQ.invalidSignatureHash";
const awsAccessKey = "AKIAIOSFODNN7EXAMPLE";
const connectorPassword = "Sup3rSecret!2026";
const refreshToken = "rt_abcdef1234567890abcdef";
const githubToken = ["ghp", "syntheticTokenValue1234567890"].join("_");
const slackToken = ["xoxb", "123456789012", "syntheticSlackTokenValue"].join("-");
const databaseConnectionUri = "postgres://audit_user:Sup3rSecretPass@db.internal.example.com:5432/lexproof";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const pemPrivateKey = [
  "-----BEGIN PRIVATE KEY-----",
  "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7unsafePemBody",
  "-----END PRIVATE KEY-----"
].join("\n");
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

  it("redacts full text before snippet truncation so nearby raw KYC text is not partially leaked", () => {
    const findings = classifyDataBoundaryText(
      `Unsafe export bundle Text draft Founder Contains ${apiKey}, private key ${privateKey}, and raw KYC packet.`
    );
    const credentialFinding = findings.find((finding) => finding.dataClass === "credential-material");

    expect(credentialFinding?.redactedSnippet).toContain("[redacted-api-key]");
    expect(credentialFinding?.redactedSnippet).not.toMatch(/\braw\s+K/i);
  });

  it("blocks provider authorization headers and cloud access keys without exposing token values", () => {
    const findings = classifyDataBoundaryText(
      `Model proxy metadata includes Authorization: Bearer ${bearerToken} and AWS access key ${awsAccessKey}.`
    );
    const credentialFinding = findings.find((finding) => finding.dataClass === "credential-material");
    const serialized = JSON.stringify(findings);

    expect(credentialFinding).toMatchObject({
      dataClass: "credential-material",
      severity: "block",
      matchCount: 2
    });
    expect(credentialFinding?.redactedSnippet).toContain("[redacted-secret]");
    expect(serialized).not.toContain(bearerToken);
    expect(serialized).not.toContain(awsAccessKey);
  });

  it("blocks standalone bearer credentials without exposing token values", () => {
    const findings = classifyDataBoundaryText(`Temporary connector note copied Bearer ${standaloneBearerToken}.`);
    const credentialFinding = findings.find((finding) => finding.dataClass === "credential-material");
    const serialized = JSON.stringify(findings);

    expect(credentialFinding).toMatchObject({
      dataClass: "credential-material",
      severity: "block",
      matchCount: 1
    });
    expect(credentialFinding?.redactedSnippet).toContain("Bearer [redacted-secret]");
    expect(serialized).not.toContain(standaloneBearerToken);
  });

  it("blocks Basic auth credentials without exposing encoded payloads", () => {
    const findings = classifyDataBoundaryText(
      `Parser adapter draft includes Authorization: Basic ${basicAuthCredential} and a copied Basic ${basicAuthCredential} note.`
    );
    const credentialFinding = findings.find((finding) => finding.dataClass === "credential-material");
    const serialized = JSON.stringify(findings);

    expect(credentialFinding).toMatchObject({
      dataClass: "credential-material",
      severity: "block",
      matchCount: 2
    });
    expect(credentialFinding?.redactedSnippet).toContain("Basic [redacted-secret]");
    expect(serialized).not.toContain(basicAuthCredential);
  });

  it("blocks unlabeled JWT credentials without exposing compact token values", () => {
    const findings = classifyDataBoundaryText(`Evidence note accidentally pasted model session JWT ${jwtToken}.`);
    const credentialFinding = findings.find((finding) => finding.dataClass === "credential-material");
    const serialized = JSON.stringify(findings);

    expect(credentialFinding).toMatchObject({
      dataClass: "credential-material",
      severity: "block",
      matchCount: 1
    });
    expect(credentialFinding?.redactedSnippet).toContain("[redacted-jwt]");
    expect(serialized).not.toContain(jwtToken);
    expect(serialized).not.toContain("invalidSignatureHash");
  });

  it("blocks password and token fields without exposing connector credential values", () => {
    const findings = classifyDataBoundaryText(
      `Connector draft {"password":"${connectorPassword}","refresh_token":"${refreshToken}"}.`
    );
    const credentialFinding = findings.find((finding) => finding.dataClass === "credential-material");
    const serialized = JSON.stringify(findings);

    expect(credentialFinding).toMatchObject({
      dataClass: "credential-material",
      severity: "block",
      matchCount: 2
    });
    expect(credentialFinding?.redactedSnippet).toContain("[redacted-secret]");
    expect(serialized).not.toContain(connectorPassword);
    expect(serialized).not.toContain(refreshToken);
  });

  it("blocks third-party integration tokens without exposing token bodies", () => {
    const findings = classifyDataBoundaryText(`GRC connector notes include ${githubToken} and ${slackToken}.`);
    const credentialFinding = findings.find((finding) => finding.dataClass === "credential-material");
    const serialized = JSON.stringify(findings);

    expect(credentialFinding).toMatchObject({
      dataClass: "credential-material",
      severity: "block",
      matchCount: 2
    });
    expect(credentialFinding?.redactedSnippet).toContain("[redacted-integration-token]");
    expect(serialized).not.toContain(githubToken);
    expect(serialized).not.toContain(slackToken);
    expect(serialized).not.toContain("syntheticTokenValue");
    expect(serialized).not.toContain("syntheticSlackTokenValue");
  });

  it("blocks credential-bearing connection URIs without exposing user, password, or host", () => {
    const findings = classifyDataBoundaryText(`Parser policy notes include DATABASE_URL=${databaseConnectionUri}.`);
    const credentialFinding = findings.find((finding) => finding.dataClass === "credential-material");
    const serialized = JSON.stringify(findings);

    expect(credentialFinding).toMatchObject({
      dataClass: "credential-material",
      severity: "block",
      matchCount: 1
    });
    expect(credentialFinding?.redactedSnippet).toContain("[redacted-connection-uri]");
    expect(serialized).not.toContain("audit_user");
    expect(serialized).not.toContain("Sup3rSecretPass");
    expect(serialized).not.toContain("db.internal.example.com");
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

  it("flags date of birth and government identity numbers without exposing raw values", () => {
    const findings = classifyDataBoundaryText(
      "KYC summary includes DOB 1990-01-02, driver license D1234567, and national ID SG-1234567-Z for removal."
    );

    const personalDataFinding = findings.find((finding) => finding.dataClass === "personal-data");
    const serialized = JSON.stringify(findings);

    expect(personalDataFinding).toMatchObject({
      dataClass: "personal-data",
      severity: "warn",
      matchCount: 3
    });
    expect(personalDataFinding?.redactedSnippet).toContain("[redacted-date-of-birth]");
    expect(serialized).not.toContain("1990-01-02");
    expect(serialized).not.toContain("D1234567");
    expect(serialized).not.toContain("SG-1234567-Z");
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

  it("blocks wallet recovery phrases without leaking the phrase or seed words", () => {
    const phrase = "abandon ability able about above absent absorb abstract absurd abuse access accident";
    const findings = classifyDataBoundaryText(`Wallet recovery phrase: ${phrase}. Route this as metadata only.`);
    const privateKeyFinding = findings.find((finding) => finding.dataClass === "private-key-material");
    const serialized = JSON.stringify(findings).toLowerCase();

    expect(privateKeyFinding).toMatchObject({
      dataClass: "private-key-material",
      severity: "block",
      matchCount: 1
    });
    expect(privateKeyFinding?.redactedSnippet).toContain("[redacted-private-key]");
    expect(serialized).not.toContain("recovery phrase");
    expect(serialized).not.toContain("abandon ability");
    expect(serialized).not.toContain("access accident");
  });

  it("blocks PEM private-key blocks without leaking headers or key body", () => {
    const findings = classifyDataBoundaryText(`Do not export this signing artifact:\n${pemPrivateKey}`);
    const privateKeyFinding = findings.find((finding) => finding.dataClass === "private-key-material");
    const serialized = JSON.stringify(findings);

    expect(privateKeyFinding).toMatchObject({
      dataClass: "private-key-material",
      severity: "block",
      matchCount: 1
    });
    expect(privateKeyFinding?.redactedSnippet).toContain("[redacted-private-key]");
    expect(serialized).not.toContain("BEGIN PRIVATE KEY");
    expect(serialized).not.toContain("unsafePemBody");
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

  it("redacts provider authorization headers and cloud access keys from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(`Authorization: Bearer ${bearerToken}; AWS access key ${awsAccessKey}.`);

    expect(redacted).toContain("[redacted-secret]");
    expect(redacted).not.toContain(bearerToken);
    expect(redacted).not.toContain(awsAccessKey);
  });

  it("redacts standalone bearer credentials from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(`Copied Bearer ${standaloneBearerToken} into a connector note.`);

    expect(redacted).toContain("Bearer [redacted-secret]");
    expect(redacted).not.toContain(standaloneBearerToken);
  });

  it("redacts Basic auth credentials from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(
      `Authorization: Basic ${basicAuthCredential}; copied Basic ${basicAuthCredential}`
    );

    expect(redacted).toContain("Authorization: Basic [redacted-secret]");
    expect(redacted).toContain("Basic [redacted-secret]");
    expect(redacted).not.toContain(basicAuthCredential);
  });

  it("redacts unlabeled JWT credentials from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(`Accidental JWT paste: ${jwtToken}`);

    expect(redacted).toContain("[redacted-jwt]");
    expect(redacted).not.toContain(jwtToken);
    expect(redacted).not.toContain("invalidSignatureHash");
  });

  it("redacts password and token field values from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(`password="${connectorPassword}"; refresh_token=${refreshToken}`);

    expect(redacted).toContain('password="[redacted-secret]"');
    expect(redacted).toContain("refresh_token=[redacted-secret]");
    expect(redacted).toContain("[redacted-secret]");
    expect(redacted).not.toContain(connectorPassword);
    expect(redacted).not.toContain(refreshToken);
  });

  it("redacts third-party integration tokens from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(`Tokens: ${githubToken}; ${slackToken}`);

    expect(redacted.match(/\[redacted-integration-token\]/g)?.length).toBe(2);
    expect(redacted).not.toContain(githubToken);
    expect(redacted).not.toContain(slackToken);
    expect(redacted).not.toContain("syntheticTokenValue");
    expect(redacted).not.toContain("syntheticSlackTokenValue");
  });

  it("redacts credential-bearing connection URIs from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(`DATABASE_URL=${databaseConnectionUri}`);

    expect(redacted).toContain("[redacted-connection-uri]");
    expect(redacted).not.toContain("audit_user");
    expect(redacted).not.toContain("Sup3rSecretPass");
    expect(redacted).not.toContain("db.internal.example.com");
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

  it("redacts date of birth and government identity numbers from reusable boundary snippets", () => {
    const redacted = redactClassifiedText("DOB 1990-01-02; driver license D1234567; national ID SG-1234567-Z.");

    expect(redacted).toContain("[redacted-date-of-birth]");
    expect(redacted).toContain("[redacted-government-id]");
    expect(redacted).not.toContain("1990-01-02");
    expect(redacted).not.toContain("D1234567");
    expect(redacted).not.toContain("SG-1234567-Z");
  });

  it("redacts wallet addresses without changing private-key redaction", () => {
    const redacted = redactClassifiedText(`wallet ${walletAddress} private key ${privateKey}`);

    expect(redacted).toContain("[redacted-wallet-address]");
    expect(redacted).toContain("[redacted-private-key]");
    expect(redacted).not.toContain(walletAddress);
    expect(redacted).not.toContain(privateKey);
  });

  it("redacts seed phrase, mnemonic, recovery phrase, and wallet secret text", () => {
    const redacted = redactClassifiedText(
      "seed phrase abandon ability able about; mnemonic alpha beta gamma delta; recovery phrase echo foxtrot golf; wallet secret hotel india juliet."
    );
    const lower = redacted.toLowerCase();

    expect(redacted.match(/\[redacted-private-key\]/g)?.length).toBe(4);
    expect(lower).not.toContain("seed phrase");
    expect(lower).not.toContain("mnemonic");
    expect(lower).not.toContain("recovery phrase");
    expect(lower).not.toContain("wallet secret");
    expect(lower).not.toContain("abandon ability");
    expect(lower).not.toContain("alpha beta");
    expect(lower).not.toContain("echo foxtrot");
    expect(lower).not.toContain("hotel india");
  });

  it("redacts whole PEM private-key blocks from reusable boundary snippets", () => {
    const redacted = redactClassifiedText(`Rotated signing key:\n${pemPrivateKey}`);

    expect(redacted).toContain("[redacted-private-key]");
    expect(redacted).not.toContain("BEGIN PRIVATE KEY");
    expect(redacted).not.toContain("unsafePemBody");
    expect(redacted).not.toContain("END PRIVATE KEY");
  });
});
