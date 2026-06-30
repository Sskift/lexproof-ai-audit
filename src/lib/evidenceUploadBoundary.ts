import { classifyDataBoundaryText, type ClassifiedDataClass } from "./dataClassification.js";

export type EvidenceMetadataBoundaryClass = Extract<
  ClassifiedDataClass,
  "credential-material" | "private-key-material" | "raw-kyc"
>;

export type EvidenceMetadataBoundaryInput = {
  filename: string;
  owner: string;
  sourceNote: string;
  linkedRiskFlagIds: string[];
  linkedControlIds?: string[];
  replacementReason?: string;
};

export type EvidenceMetadataBoundaryResult = {
  resultVersion: "lexproof-evidence-metadata-boundary-v1";
  valid: boolean;
  blockedClasses: EvidenceMetadataBoundaryClass[];
  errors: string[];
  notLegalAdviceBoundary: "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only.";
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only.";
const metadataClassOrder: EvidenceMetadataBoundaryClass[] = ["credential-material", "private-key-material", "raw-kyc"];

const metadataBoundaryMessages: Record<EvidenceMetadataBoundaryClass, string> = {
  "credential-material": "API keys or credential-like tokens must be removed before Evidence Vault upload.",
  "private-key-material": "Private-key-like material must be removed before Evidence Vault upload.",
  "raw-kyc": "Raw KYC material must stay outside Evidence Vault metadata."
};

export function validateEvidenceMetadataBoundary(input: EvidenceMetadataBoundaryInput): EvidenceMetadataBoundaryResult {
  const text = normalizeWhitespace(
    [
      input.filename,
      input.owner,
      input.sourceNote,
      input.linkedRiskFlagIds.join(" "),
      input.linkedControlIds?.join(" ") ?? "",
      input.replacementReason ?? ""
    ].join(" ")
  );
  const matchedClasses = new Set(
    classifyDataBoundaryText(text)
      .map((finding) => finding.dataClass)
      .filter(isEvidenceMetadataBoundaryClass)
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

function createBoundaryError(dataClass: EvidenceMetadataBoundaryClass): string {
  return `Evidence metadata contains ${dataClass}. ${
    metadataBoundaryMessages[dataClass] ?? "Remove blocked material before Evidence Vault upload."
  }`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isEvidenceMetadataBoundaryClass(dataClass: ClassifiedDataClass): dataClass is EvidenceMetadataBoundaryClass {
  return metadataClassOrder.includes(dataClass as EvidenceMetadataBoundaryClass);
}
