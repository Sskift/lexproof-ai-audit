export type EvidenceMetadataBoundaryClass = "credential-material" | "private-key-material" | "raw-kyc";

export type EvidenceMetadataBoundaryInput = {
  filename: string;
  owner: string;
  sourceNote: string;
  linkedRiskFlagIds: string[];
  replacementReason?: string;
};

export type EvidenceMetadataBoundaryResult = {
  resultVersion: "lexproof-evidence-metadata-boundary-v1";
  valid: boolean;
  blockedClasses: EvidenceMetadataBoundaryClass[];
  errors: string[];
  notLegalAdviceBoundary: "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only.";
};

type MetadataScanner = {
  dataClass: EvidenceMetadataBoundaryClass;
  pattern: RegExp;
  message: string;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only.";
const metadataClassOrder: EvidenceMetadataBoundaryClass[] = ["credential-material", "private-key-material", "raw-kyc"];

const metadataScanners: MetadataScanner[] = [
  {
    dataClass: "private-key-material",
    pattern: /0x[a-fA-F0-9]{64}/g,
    message: "Private-key-like material must be removed before Evidence Vault upload."
  },
  {
    dataClass: "private-key-material",
    pattern: /\b(seed phrase|mnemonic|private key)\b/gi,
    message: "Secret phrase or private-key references must be removed before Evidence Vault upload."
  },
  {
    dataClass: "credential-material",
    pattern: /\bsk-(?:live|test|proj|[a-z0-9])[-_A-Za-z0-9]{12,}\b/g,
    message: "API keys or credential-like tokens must be removed before Evidence Vault upload."
  },
  {
    dataClass: "credential-material",
    pattern: /\b(api[_\-\s]?key|secret[_\-\s]?key|client secret|bearer token)\s*[:=]\s*[\w.\-]{8,}/gi,
    message: "Credential fields must be removed before Evidence Vault upload."
  },
  {
    dataClass: "raw-kyc",
    pattern: /\b(raw\s+kyc|kyc\s+(packet|file|document|upload|room|dump|csv|spreadsheet))\b/gi,
    message: "Raw KYC material must stay outside Evidence Vault metadata."
  }
];

export function validateEvidenceMetadataBoundary(input: EvidenceMetadataBoundaryInput): EvidenceMetadataBoundaryResult {
  const text = normalizeWhitespace(
    [
      input.filename,
      input.owner,
      input.sourceNote,
      input.linkedRiskFlagIds.join(" "),
      input.replacementReason ?? ""
    ].join(" ")
  );
  const matchedClasses = new Set(
    metadataScanners
      .filter((scanner) => hasBoundaryMatch(text, scanner))
      .map((scanner) => scanner.dataClass)
  );
  const blockedClasses = metadataClassOrder.filter((dataClass) => matchedClasses.has(dataClass));

  return {
    resultVersion: "lexproof-evidence-metadata-boundary-v1",
    valid: blockedClasses.length === 0,
    blockedClasses,
    errors: blockedClasses.map((dataClass) => createBoundaryError(dataClass)),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

function hasBoundaryMatch(text: string, scanner: MetadataScanner): boolean {
  return Array.from(text.matchAll(scanner.pattern)).some((match) => {
    if (scanner.dataClass === "raw-kyc") {
      return !isNegatedKycReference(text, match.index ?? 0);
    }
    return true;
  });
}

function createBoundaryError(dataClass: EvidenceMetadataBoundaryClass): string {
  const messages = metadataScanners
    .filter((scanner) => scanner.dataClass === dataClass)
    .map((scanner) => scanner.message);
  return `Evidence metadata contains ${dataClass}. ${messages[0] ?? "Remove blocked material before Evidence Vault upload."}`;
}

function isNegatedKycReference(text: string, matchIndex: number): boolean {
  const windowStart = Math.max(0, matchIndex - 32);
  const windowEnd = Math.min(text.length, matchIndex + 48);
  const window = text.slice(windowStart, windowEnd).toLowerCase();
  return /\b(no|without|exclude|excluded|excludes|excluding|not)\b.{0,24}\b(raw\s+)?kyc\b/.test(window);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
