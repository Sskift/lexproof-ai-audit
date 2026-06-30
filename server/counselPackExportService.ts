import { createHash } from "node:crypto";
import type {
  CounselPackExportRecord,
  CounselPackExportReviewSummary,
  CounselPackExportSourceReviewStatus
} from "../src/lib/phase2Types.js";

export type CreateCounselPackExportInput = {
  workspaceId: string;
  projectName: string;
  title: string;
  format: CounselPackExportRecord["format"];
  version: number;
  artifactName: string;
  manifestHash: string;
  artifactHash: string;
  artifactSize: number;
  riskLevel: CounselPackExportRecord["riskLevel"];
  reviewSummary: CounselPackExportReviewSummary;
  sourceCount: number;
  sourcePackHash: string;
  sourceReviewStatus: CounselPackExportSourceReviewStatus;
  createdBy: string;
  includesRawKycOrPersonalData: boolean;
  includesCredentialMaterial: boolean;
  rawMarkdown?: string;
  rawContent?: string;
  content?: string;
  createdAt?: string;
};

export function createCounselPackExportRecord(input: CreateCounselPackExportInput): CounselPackExportRecord {
  const errors = validateCounselPackExportInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const id = `counsel-pack-export-${sha256Hex(
    stableStringify({
      workspaceId: input.workspaceId,
      artifactHash: input.artifactHash,
      manifestHash: input.manifestHash,
      version: input.version,
      createdAt
    })
  ).slice(0, 16)}`;

  return {
    recordVersion: "lexproof-counsel-pack-export-record-v1",
    id,
    workspaceId: input.workspaceId.trim(),
    exportType: "counsel-pack",
    format: input.format,
    version: input.version,
    projectName: input.projectName.trim(),
    title: input.title.trim(),
    artifactName: input.artifactName.trim(),
    manifestHash: input.manifestHash.trim(),
    artifactHash: input.artifactHash.trim(),
    artifactSize: input.artifactSize,
    riskLevel: input.riskLevel,
    reviewSummary: { ...input.reviewSummary },
    sourceCount: input.sourceCount,
    sourcePackHash: input.sourcePackHash.trim(),
    sourceReviewStatus: input.sourceReviewStatus,
    createdBy: input.createdBy.trim(),
    status: "ready",
    createdAt,
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
  };
}

function validateCounselPackExportInput(input: CreateCounselPackExportInput): string[] {
  const errors: string[] = [];

  if (!input.workspaceId.trim()) {
    errors.push("Workspace ID is required.");
  }

  if (!input.projectName.trim()) {
    errors.push("Project name is required.");
  }

  if (!input.title.trim()) {
    errors.push("Export title is required.");
  }

  if (!input.artifactName.trim()) {
    errors.push("Artifact filename is required.");
  }

  if (!isSha256Hex(input.manifestHash)) {
    errors.push("Manifest hash must be a SHA-256 hex digest.");
  }

  if (!isSha256Hex(input.artifactHash)) {
    errors.push("Artifact hash must be a SHA-256 hex digest.");
  }

  if (input.artifactSize <= 0) {
    errors.push("Artifact size must be greater than zero.");
  }

  if (input.version <= 0) {
    errors.push("Export version must be greater than zero.");
  }

  if (input.sourceCount < 0) {
    errors.push("Source count cannot be negative.");
  }

  if (!isSha256Hex(input.sourcePackHash)) {
    errors.push("Source pack hash must be a SHA-256 hex digest.");
  }

  if (!["current", "review-due", "metadata-missing"].includes(input.sourceReviewStatus)) {
    errors.push("Source review status must be current, review-due, or metadata-missing.");
  }

  if (!input.createdBy.trim()) {
    errors.push("Export creator is required.");
  }

  if (input.includesRawKycOrPersonalData) {
    errors.push("Counsel Pack export records must not include raw KYC or personal data.");
  }

  if (input.includesCredentialMaterial) {
    errors.push("Counsel Pack export records must not include API keys, private keys, or credential material.");
  }

  if (hasRawArtifactContent(input)) {
    errors.push("Server export records accept hashes and metadata only, not raw Markdown or PDF content.");
  }

  return errors;
}

function hasRawArtifactContent(input: CreateCounselPackExportInput): boolean {
  return Boolean(input.rawMarkdown?.trim() || input.rawContent?.trim() || input.content?.trim());
}

function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value.trim());
}

function sha256Hex(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
