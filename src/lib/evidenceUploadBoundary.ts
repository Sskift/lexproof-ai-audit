import { classifyDataBoundaryText, type ClassifiedDataClass } from "./dataClassification.js";
import type { EvidenceVaultMetadataBoundaryWarning } from "./phase2Types.js";

export type EvidenceMetadataBoundaryClass = Extract<
  ClassifiedDataClass,
  "credential-material" | "private-key-material" | "raw-kyc"
>;

export type EvidenceMetadataBoundaryWarningClass = EvidenceVaultMetadataBoundaryWarning["dataClass"];

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
  warningClasses: EvidenceMetadataBoundaryWarningClass[];
  warningFindings: EvidenceVaultMetadataBoundaryWarning[];
  errors: string[];
  notLegalAdviceBoundary: "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only.";
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Evidence metadata boundary checks are audit preparation safeguards only.";
const metadataClassOrder: EvidenceMetadataBoundaryClass[] = ["credential-material", "private-key-material", "raw-kyc"];
const metadataWarningClassOrder: EvidenceMetadataBoundaryWarningClass[] = ["wallet-address", "personal-data", "confidential"];

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
  const warningFindings = classifyDataBoundaryText(text)
    .filter(isEvidenceMetadataBoundaryWarningFinding)
    .sort((left, right) => metadataWarningClassOrder.indexOf(left.dataClass) - metadataWarningClassOrder.indexOf(right.dataClass));
  const blockedClasses = metadataClassOrder.filter((dataClass) => matchedClasses.has(dataClass));
  const warningClasses = metadataWarningClassOrder.filter((dataClass) =>
    warningFindings.some((finding) => finding.dataClass === dataClass)
  );

  return {
    resultVersion: "lexproof-evidence-metadata-boundary-v1",
    valid: blockedClasses.length === 0,
    blockedClasses,
    warningClasses,
    warningFindings,
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

function isEvidenceMetadataBoundaryWarningFinding(
  finding: ReturnType<typeof classifyDataBoundaryText>[number]
): finding is EvidenceVaultMetadataBoundaryWarning {
  return metadataWarningClassOrder.includes(finding.dataClass as EvidenceMetadataBoundaryWarningClass) && finding.severity === "warn";
}
