import { redactApiErrorText } from "../src/lib/apiErrorRedaction.js";

export const API_NOT_LEGAL_ADVICE_BOUNDARY =
  "Not legal advice. This API creates audit preparation workflow records only." as const;

export type ApiErrorResponse = {
  error: string;
  code: string;
  notLegalAdviceBoundary: typeof API_NOT_LEGAL_ADVICE_BOUNDARY;
  recoveryAction?: string;
};

export type ApiErrorInput = {
  error: unknown;
  code: string;
  fallbackMessage: string;
  recoveryAction?: string;
};

export function createApiErrorResponse(input: ApiErrorInput): ApiErrorResponse {
  const error = sanitizeApiErrorText(extractErrorMessage(input.error) || input.fallbackMessage);
  const code = input.code.trim() || "API_ERROR";
  const recoveryAction = input.recoveryAction ? sanitizeApiErrorText(input.recoveryAction) : "";

  return {
    error,
    code,
    ...(recoveryAction ? { recoveryAction } : {}),
    notLegalAdviceBoundary: API_NOT_LEGAL_ADVICE_BOUNDARY
  };
}

function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "";
  }

  return error.message.trim();
}

function sanitizeApiErrorText(value: string): string {
  return redactApiErrorText(value);
}
