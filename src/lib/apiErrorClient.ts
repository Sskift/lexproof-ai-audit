import { redactClassifiedText } from "./dataClassification";

export type SafeApiErrorResponse = {
  error?: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

const LEGAL_CONCLUSION_PATTERN =
  /\b(final legal decision|legal opinion|legal approval|legally compliant|legally non-compliant|compliance decision)\b/gi;
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

  const redacted = redactClassifiedText(value.replace(/\s+/g, " ").trim())
    .replace(/\b(seed phrase|mnemonic|private key)\b/gi, "[redacted-private-key]")
    .replace(/\b(passport data|passport document|passport file)\b/gi, "[redacted-personal-data]")
    .replace(LEGAL_CONCLUSION_PATTERN, "[redacted-legal-conclusion]")
    .trim();

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
