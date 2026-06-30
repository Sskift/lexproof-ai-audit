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
});
