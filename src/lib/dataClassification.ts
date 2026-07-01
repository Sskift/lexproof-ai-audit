export type ClassifiedDataClass =
  | "public"
  | "confidential"
  | "personal-data"
  | "raw-kyc"
  | "credential-material"
  | "private-key-material";

export type ClassifiedDataSeverity = "block" | "warn" | "info";

export type ClassifiedDataFinding = {
  dataClass: ClassifiedDataClass;
  severity: ClassifiedDataSeverity;
  matchCount: number;
  redactedSnippet: string;
  message: string;
};

type ClassificationRule = {
  dataClass: Exclude<ClassifiedDataClass, "public">;
  severity: ClassifiedDataSeverity;
  pattern: RegExp;
  message: string;
  allowNegatedRawKyc?: boolean;
};

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/;
const phonePattern = /\+\d[\d\s().-]{7,}\d|\b(?:phone|tel|mobile)\s*[:#-]?\s*\d[\d\s().-]{7,}\d\b/;
const ssnPattern = /\b(?:ssn|social security number)?\s*[:#-]?\s*\d{3}-\d{2}-\d{4}\b/;
const passportIdPattern = /\bpassport(?:\s+(?:number|no\.?|id))?\s+(?:[A-Z]{1,3}\d{5,9}|\d{6,12})\b/;
const directPersonalIdentifierPattern = new RegExp(
  `${emailPattern.source}|${phonePattern.source}|${ssnPattern.source}|${passportIdPattern.source}`,
  "gi"
);

const classificationRules: ClassificationRule[] = [
  {
    dataClass: "private-key-material",
    severity: "block",
    pattern: /0x[a-fA-F0-9]{64}/g,
    message: "Private-key-like material must be removed before export handoff."
  },
  {
    dataClass: "private-key-material",
    severity: "block",
    pattern: /\b(seed phrase|mnemonic|private key)\b/gi,
    message: "Secret phrase or private-key references must be removed before export handoff."
  },
  {
    dataClass: "credential-material",
    severity: "block",
    pattern: /\bsk-(?:live|test|proj|[a-z0-9])[-_A-Za-z0-9]{12,}\b/g,
    message: "API keys or credential-like tokens must be removed before export handoff."
  },
  {
    dataClass: "credential-material",
    severity: "block",
    pattern: /\b(api[_\-\s]?key|secret[_\-\s]?key|client secret|bearer token)\s*[:=]\s*[\w.\-]{8,}/gi,
    message: "Credential fields must be removed before export handoff."
  },
  {
    dataClass: "raw-kyc",
    severity: "block",
    pattern: /\b(raw\s+kyc|kyc\s+(packet|file|document|upload|room|dump|csv|spreadsheet))\b/gi,
    message: "Raw KYC material must stay outside Counsel Pack exports."
  },
  {
    dataClass: "personal-data",
    severity: "warn",
    pattern: directPersonalIdentifierPattern,
    message: "Direct personal identifiers must be redacted or summarized before external handoff."
  },
  {
    dataClass: "personal-data",
    severity: "warn",
    pattern: /\b(passport\s+number|social security number|ssn|personal data|direct identifier|direct identifiers)\b/gi,
    message: "Personal-data references need human confirmation before export."
  },
  {
    dataClass: "personal-data",
    severity: "warn",
    pattern: /\bkyc\b/gi,
    message: "KYC references should remain metadata-only and require human confirmation before export.",
    allowNegatedRawKyc: true
  },
  {
    dataClass: "confidential",
    severity: "info",
    pattern: /\b(confidential|privileged|attorney-client|internal only)\b/gi,
    message: "Confidentiality labels should be confirmed before external handoff."
  }
];

export function classifyDataBoundaryText(value: string): ClassifiedDataFinding[] {
  const text = normalizeWhitespace(value);

  return classificationRules.flatMap((rule) => {
    const matches = Array.from(text.matchAll(rule.pattern)).filter((match) => {
      if (rule.allowNegatedRawKyc) {
        return !isNegatedKycReference(text, match.index ?? 0);
      }
      return rule.dataClass !== "raw-kyc" || !isNegatedKycReference(text, match.index ?? 0);
    });

    if (matches.length === 0) {
      return [];
    }

    return [
      {
        dataClass: rule.dataClass,
        severity: rule.severity,
        matchCount: matches.length,
        redactedSnippet: createRedactedSnippet(text, matches[0].index ?? 0),
        message: rule.message
      }
    ];
  });
}

export function redactClassifiedText(value: string): string {
  return value
    .replace(/0x[a-fA-F0-9]{64}/g, "[redacted-private-key]")
    .replace(/\b(api[_\-\s]?key|secret[_\-\s]?key|client secret|bearer token)(\s*[:=]\s*)[\w.\-]{8,}/gi, "$1$2[redacted-secret]")
    .replace(/\bsk-(?:live|test|proj|[a-z0-9])[-_A-Za-z0-9]{12,}\b/g, "[redacted-api-key]")
    .replace(/\b[a-fA-F0-9]{24,}\b/g, "[redacted-hex-material]")
    .replace(/\b(raw\s+kyc|kyc\s+(packet|file|document|upload|room|dump|csv|spreadsheet))\b/gi, "[redacted-raw-kyc]")
    .replace(new RegExp(emailPattern.source, "gi"), "[redacted-email]")
    .replace(new RegExp(ssnPattern.source, "gi"), "[redacted-ssn]")
    .replace(new RegExp(passportIdPattern.source, "gi"), "[redacted-passport-id]")
    .replace(new RegExp(phonePattern.source, "gi"), "[redacted-phone]")
    .replace(/(?<!-)\b(passport\s+number|social security number|ssn)\b/gi, "[redacted-personal-data]");
}

function isNegatedKycReference(text: string, matchIndex: number): boolean {
  const windowStart = Math.max(0, matchIndex - 32);
  const windowEnd = Math.min(text.length, matchIndex + 48);
  const window = text.slice(windowStart, windowEnd).toLowerCase();
  return /\b(no|without|exclude|excluded|excludes|excluding|not)\b.{0,24}\b(raw\s+)?kyc\b/.test(window);
}

function createRedactedSnippet(text: string, matchIndex: number): string {
  const start = Math.max(0, Math.min(matchIndex, text.length) - 52);
  const end = Math.min(text.length, start + 180);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${redactClassifiedText(text.slice(start, end))}${suffix}`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
