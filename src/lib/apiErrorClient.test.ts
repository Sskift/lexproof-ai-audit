import { describe, expect, it } from "vitest";
import { asSafeApiErrorResponse } from "./apiErrorClient";

describe("asSafeApiErrorResponse", () => {
  it("redacts unsafe API error payload text before clients surface it", () => {
    const response = asSafeApiErrorResponse({
      error:
        "Provider returned raw KYC passport data, api key=sk-live-abcdef1234567890abcdef1234567890, and private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef.",
      code: "INTEGRATION_POLICY_INVALID_PAYLOAD",
      recoveryAction: "Remove seed phrase material before creating a final legal decision.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const json = JSON.stringify(response);

    expect(response).toEqual(
      expect.objectContaining({
        code: "INTEGRATION_POLICY_INVALID_PAYLOAD",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );
    expect(response.error).toContain("[redacted-raw-kyc]");
    expect(response.error).toContain("[redacted-secret]");
    expect(response.error).toContain("[redacted-private-key]");
    expect(response.recoveryAction).toContain("[redacted-private-key]");
    expect(response.recoveryAction).toContain("[redacted-legal-conclusion]");
    expect(json).not.toContain("passport data");
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("0x1234567890abcdef");
    expect(json).not.toContain("seed phrase");
    expect(json).not.toContain("final legal decision");
  });

  it("drops malformed error code and non-boundary text", () => {
    expect(
      asSafeApiErrorResponse({
        error: "Policy failed.",
        code: "unsafe code with spaces",
        recoveryAction: "Retry with metadata only.",
        notLegalAdviceBoundary: "Legal approval granted."
      })
    ).toEqual({
      error: "Policy failed.",
      recoveryAction: "Retry with metadata only."
    });
  });
});
