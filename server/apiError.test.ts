import { describe, expect, it } from "vitest";
import { API_NOT_LEGAL_ADVICE_BOUNDARY, createApiErrorResponse } from "./apiError";

describe("API error responses", () => {
  it("returns a typed audit-prep error response for thrown errors", () => {
    expect(
      createApiErrorResponse({
        error: new Error("Workspace name is required."),
        code: "WORKSPACE_CREATE_FAILED",
        fallbackMessage: "Workspace creation failed.",
        recoveryAction: "Provide a workspace name before retrying."
      })
    ).toEqual({
      error: "Workspace name is required.",
      code: "WORKSPACE_CREATE_FAILED",
      recoveryAction: "Provide a workspace name before retrying.",
      notLegalAdviceBoundary: API_NOT_LEGAL_ADVICE_BOUNDARY
    });
  });

  it("uses the fallback message for unknown errors without dropping the boundary", () => {
    expect(
      createApiErrorResponse({
        error: "opaque failure",
        code: "",
        fallbackMessage: "Request failed."
      })
    ).toEqual({
      error: "Request failed.",
      code: "API_ERROR",
      notLegalAdviceBoundary: API_NOT_LEGAL_ADVICE_BOUNDARY
    });
  });

  it("redacts unsafe error and recovery text before returning typed API errors", () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const response = createApiErrorResponse({
      error: new Error(`Provider rejected ${apiKey}, private key ${privateKey}, raw KYC packet, and final legal decision.`),
      code: "MODEL_GATEWAY_FAILED",
      fallbackMessage: "Model Gateway request failed.",
      recoveryAction: `Remove ${apiKey}, private key ${privateKey}, raw KYC packet, and legal opinion before retrying.`
    });
    const serialized = JSON.stringify(response);

    expect(response.error).toContain("[redacted-api-key]");
    expect(response.error).toContain("[redacted-private-key]");
    expect(response.error).toContain("[redacted-raw-kyc]");
    expect(response.error).toContain("[redacted-legal-conclusion]");
    expect(response.recoveryAction).toContain("[redacted-api-key]");
    expect(response.recoveryAction).toContain("[redacted-private-key]");
    expect(response.recoveryAction).toContain("[redacted-raw-kyc]");
    expect(response.recoveryAction).toContain("[redacted-legal-conclusion]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/raw KYC packet|final legal decision|legal opinion/i);
    expect(response.notLegalAdviceBoundary).toBe(API_NOT_LEGAL_ADVICE_BOUNDARY);
  });
});
