import { redactApiErrorText } from "./apiErrorRedaction";

export type SafeApiErrorResponse = {
  error?: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,119}$/;

export function asSafeApiErrorResponse(value: unknown): SafeApiErrorResponse {
  if (!isRecord(value)) {
    return {};
  }

  return withoutUndefined({
    error: safeTextField(value.error),
    code: safeCodeField(value.code),
    recoveryAction: safeTextField(value.recoveryAction),
    notLegalAdviceBoundary: safeBoundaryField(value.notLegalAdviceBoundary)
  });
}

function safeTextField(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const redacted = redactApiErrorText(value.replace(/\s+/g, " ").trim());

  return redacted || undefined;
}

function safeCodeField(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const code = value.trim();
  return CODE_PATTERN.test(code) ? code : undefined;
}

function safeBoundaryField(value: unknown): string | undefined {
  const boundary = safeTextField(value);
  return boundary?.startsWith("Not legal advice.") ? boundary : undefined;
}

function withoutUndefined(value: SafeApiErrorResponse): SafeApiErrorResponse {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as SafeApiErrorResponse;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
