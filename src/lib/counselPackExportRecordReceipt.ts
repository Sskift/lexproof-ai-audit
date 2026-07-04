import { redactDataBoundaryText } from "./dataBoundary";
import type { CounselPackExportRecord } from "./phase2Types";

export type CounselPackExportRecordReceipt = {
  receiptVersion: "lexproof-counsel-pack-export-record-receipt-v1";
  exportRecordId: string;
  workspaceId: string;
  exportType: CounselPackExportRecord["exportType"];
  format: CounselPackExportRecord["format"];
  status: CounselPackExportRecord["status"];
  projectName: string;
  title: string;
  artifactName: string;
  version: number;
  riskLevel: CounselPackExportRecord["riskLevel"];
  reviewSummary: CounselPackExportRecord["reviewSummary"];
  sourceCount: number;
  sourceReviewStatus: CounselPackExportRecord["sourceReviewStatus"];
  hashes: {
    manifestHash: string;
    artifactHash: string;
    sourcePackHash: string;
  };
  artifactSize: number;
  createdBy: string;
  createdAt: string;
  exportedAt: string;
  recoveryAction: string;
  receiptHash: string;
  notLegalAdviceBoundary: "Not legal advice. Counsel Pack server export receipts are audit preparation metadata only.";
};

export type CreateCounselPackExportRecordReceiptOptions = {
  exportedAt?: string;
};

type CounselPackExportRecordReceiptSubject = Omit<CounselPackExportRecordReceipt, "exportedAt" | "receiptHash">;

const NOT_LEGAL_ADVICE_BOUNDARY =
  "Not legal advice. Counsel Pack server export receipts are audit preparation metadata only.";

export async function createCounselPackExportRecordReceipt(
  record: CounselPackExportRecord,
  options: CreateCounselPackExportRecordReceiptOptions = {}
): Promise<CounselPackExportRecordReceipt> {
  const subject = createReceiptSubject(record);
  const receiptHash = await sha256Hex(stableStringify(subject));

  return {
    ...subject,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    receiptHash
  };
}

export function exportCounselPackExportRecordReceiptJson(receipt: CounselPackExportRecordReceipt): string {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function downloadCounselPackExportRecordReceiptJson(
  filename: string,
  receipt: CounselPackExportRecordReceipt
): void {
  const blob = new Blob([exportCounselPackExportRecordReceiptJson(receipt)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createReceiptSubject(record: CounselPackExportRecord): CounselPackExportRecordReceiptSubject {
  return {
    receiptVersion: "lexproof-counsel-pack-export-record-receipt-v1",
    exportRecordId: sanitizeText(record.id),
    workspaceId: sanitizeText(record.workspaceId),
    exportType: record.exportType,
    format: record.format,
    status: record.status,
    projectName: sanitizeText(record.projectName),
    title: sanitizeText(record.title),
    artifactName: sanitizeText(record.artifactName),
    version: record.version,
    riskLevel: record.riskLevel,
    reviewSummary: { ...record.reviewSummary },
    sourceCount: record.sourceCount,
    sourceReviewStatus: record.sourceReviewStatus,
    hashes: {
      manifestHash: record.manifestHash,
      artifactHash: record.artifactHash,
      sourcePackHash: record.sourcePackHash
    },
    artifactSize: record.artifactSize,
    createdBy: sanitizeText(record.createdBy),
    createdAt: record.createdAt,
    recoveryAction: createRecoveryAction(record),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

function createRecoveryAction(record: CounselPackExportRecord): string {
  if (record.sourceReviewStatus !== "current") {
    return "Refresh source review metadata before final external handoff.";
  }

  if (record.reviewSummary.blocked > 0 || record.reviewSummary.needsEvidence > 0) {
    return "Resolve blocked or evidence-needed counsel review items before external handoff.";
  }

  if (record.reviewSummary.open > 0) {
    return "Complete open counsel review items before treating this as a final handoff packet.";
  }

  return "Keep this metadata-only receipt with the audit-preparation export packet.";
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

function sanitizeText(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
}
