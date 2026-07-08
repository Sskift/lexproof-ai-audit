import { redactClassifiedText } from "./dataClassification.js";
import type { CounselPackExportRecord } from "./phase2Types.js";

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
  jurisdictionReadinessDigest?: CounselPackExportRecord["jurisdictionReadinessDigest"];
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

export type CounselPackExportRecoveryStatus = "blocked" | "needs-source-review" | "needs-review" | "ready";
export type CounselPackExportRecoveryPriority = "P0" | "P1" | "P2" | "P3";

export type CounselPackExportRecoveryPacketItem = {
  exportRecordId: string;
  version: number;
  artifactName: string;
  createdAt: string;
  sourceReviewStatus: CounselPackExportRecord["sourceReviewStatus"];
  jurisdictionReadinessStatus?: NonNullable<CounselPackExportRecord["jurisdictionReadinessDigest"]>["status"];
  jurisdictionHandoffAllowed?: boolean;
  reviewSummary: CounselPackExportRecord["reviewSummary"];
  recoveryStatus: CounselPackExportRecoveryStatus;
  priority: CounselPackExportRecoveryPriority;
  recoveryAction: string;
  hashes: {
    manifestHash: string;
    artifactHash: string;
    sourcePackHash: string;
  };
  notLegalAdviceBoundary: "Not legal advice. Counsel Pack export recovery items are audit preparation workflow metadata only.";
};

export type CounselPackExportRecoveryPacket = {
  packetVersion: "lexproof-counsel-pack-export-recovery-packet-v1";
  workspaceId: string;
  generatedAt: string;
  packetHash: string;
  recordCount: number;
  recoveryItemCount: number;
  blockedCount: number;
  needsSourceReviewCount: number;
  needsReviewCount: number;
  readyCount: number;
  latestExportRecordId?: string;
  nextActions: string[];
  items: CounselPackExportRecoveryPacketItem[];
  notLegalAdviceBoundary: "Not legal advice. Counsel Pack export recovery packets are audit preparation metadata only.";
};

export type CreateCounselPackExportRecoveryPacketOptions = {
  generatedAt?: string;
};

type CounselPackExportRecordReceiptSubject = Omit<CounselPackExportRecordReceipt, "exportedAt" | "receiptHash">;
type CounselPackExportRecoveryPacketSubject = Omit<CounselPackExportRecoveryPacket, "generatedAt" | "packetHash">;

const NOT_LEGAL_ADVICE_BOUNDARY =
  "Not legal advice. Counsel Pack server export receipts are audit preparation metadata only.";
const RECOVERY_PACKET_BOUNDARY =
  "Not legal advice. Counsel Pack export recovery packets are audit preparation metadata only." as const;
const RECOVERY_ITEM_BOUNDARY =
  "Not legal advice. Counsel Pack export recovery items are audit preparation workflow metadata only." as const;
const legalConclusionPattern =
  /\b(final[_\-\s]+legal[_\-\s]+decision|legal[_\-\s]+opinion|legal[_\-\s]+conclusion|legal[_\-\s]+approval|legally[_\-\s]+compliant|legally[_\-\s]+non[_\-\s]+compliant|compliance[_\-\s]+decision)\b/gi;

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
  const browser = resolveBrowserDownloadGlobals();
  const blob = new browser.Blob([exportCounselPackExportRecordReceiptJson(receipt)], {
    type: "application/json;charset=utf-8"
  });
  const url = browser.URL.createObjectURL(blob);
  const link = browser.document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  browser.document.body.appendChild(link);
  link.click();
  link.remove();
  browser.URL.revokeObjectURL(url);
}

export async function createCounselPackExportRecoveryPacket(
  workspaceId: string,
  records: CounselPackExportRecord[],
  options: CreateCounselPackExportRecoveryPacketOptions = {}
): Promise<CounselPackExportRecoveryPacket> {
  const items = records.map(createRecoveryPacketItem).sort(compareRecoveryItems);
  const subject: CounselPackExportRecoveryPacketSubject = {
    packetVersion: "lexproof-counsel-pack-export-recovery-packet-v1",
    workspaceId: sanitizeText(workspaceId),
    recordCount: records.length,
    recoveryItemCount: items.filter((item) => item.recoveryStatus !== "ready").length,
    blockedCount: items.filter((item) => item.recoveryStatus === "blocked").length,
    needsSourceReviewCount: items.filter((item) => item.recoveryStatus === "needs-source-review").length,
    needsReviewCount: items.filter((item) => item.recoveryStatus === "needs-review").length,
    readyCount: items.filter((item) => item.recoveryStatus === "ready").length,
    ...(findLatestExportRecord(records) ? { latestExportRecordId: sanitizeText(findLatestExportRecord(records)?.id ?? "") } : {}),
    nextActions: createPacketNextActions(items),
    items,
    notLegalAdviceBoundary: RECOVERY_PACKET_BOUNDARY
  };

  return {
    ...subject,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    packetHash: await sha256Hex(stableStringify(subject))
  };
}

export function exportCounselPackExportRecoveryPacketJson(packet: CounselPackExportRecoveryPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

export function downloadCounselPackExportRecoveryPacketJson(
  filename: string,
  packet: CounselPackExportRecoveryPacket
): void {
  const browser = resolveBrowserDownloadGlobals();
  const blob = new browser.Blob([exportCounselPackExportRecoveryPacketJson(packet)], {
    type: "application/json;charset=utf-8"
  });
  const url = browser.URL.createObjectURL(blob);
  const link = browser.document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  browser.document.body.appendChild(link);
  link.click();
  link.remove();
  browser.URL.revokeObjectURL(url);
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
    ...(record.jurisdictionReadinessDigest
      ? { jurisdictionReadinessDigest: { ...record.jurisdictionReadinessDigest } }
      : {}),
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
  if (record.reviewSummary.blocked > 0) {
    return "Resolve blocked counsel review items before export recovery can clear.";
  }

  if (record.jurisdictionReadinessDigest && !record.jurisdictionReadinessDigest.handoffAllowed) {
    return "Resolve jurisdiction readiness blockers before external handoff.";
  }

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

function createRecoveryPacketItem(record: CounselPackExportRecord): CounselPackExportRecoveryPacketItem {
  const recoveryStatus = createRecoveryStatus(record);

  return {
    exportRecordId: sanitizeText(record.id),
    version: record.version,
    artifactName: sanitizeText(record.artifactName),
    createdAt: record.createdAt,
    sourceReviewStatus: record.sourceReviewStatus,
    ...(record.jurisdictionReadinessDigest
      ? {
          jurisdictionReadinessStatus: record.jurisdictionReadinessDigest.status,
          jurisdictionHandoffAllowed: record.jurisdictionReadinessDigest.handoffAllowed
        }
      : {}),
    reviewSummary: { ...record.reviewSummary },
    recoveryStatus,
    priority: priorityForRecoveryStatus(recoveryStatus),
    recoveryAction: createRecoveryAction(record),
    hashes: {
      manifestHash: record.manifestHash,
      artifactHash: record.artifactHash,
      sourcePackHash: record.sourcePackHash
    },
    notLegalAdviceBoundary: RECOVERY_ITEM_BOUNDARY
  };
}

function createRecoveryStatus(record: CounselPackExportRecord): CounselPackExportRecoveryStatus {
  const digest = record.jurisdictionReadinessDigest;

  if (
    record.reviewSummary.blocked > 0 ||
    record.sourceReviewStatus === "metadata-missing" ||
    digest?.status === "metadata-missing" ||
    (digest && !digest.handoffAllowed && digest.metadataMissingCount > 0)
  ) {
    return "blocked";
  }

  if (
    record.sourceReviewStatus === "review-due" ||
    (digest?.needsSourceReviewCount ?? 0) > 0 ||
    (digest?.sourceFreshnessBlockerCount ?? 0) > 0
  ) {
    return "needs-source-review";
  }

  if (digest?.handoffAllowed === false || record.reviewSummary.needsEvidence > 0 || record.reviewSummary.open > 0) {
    return "needs-review";
  }

  return "ready";
}

function priorityForRecoveryStatus(status: CounselPackExportRecoveryStatus): CounselPackExportRecoveryPriority {
  if (status === "blocked") {
    return "P0";
  }
  if (status === "needs-source-review") {
    return "P1";
  }
  if (status === "needs-review") {
    return "P2";
  }
  return "P3";
}

function createPacketNextActions(items: CounselPackExportRecoveryPacketItem[]): string[] {
  const openActions = unique(items.filter((item) => item.recoveryStatus !== "ready").map((item) => item.recoveryAction));

  if (openActions.length === 0) {
    return ["Keep the latest metadata-only export receipt with the counsel handoff packet."];
  }

  return openActions.slice(0, 6);
}

function findLatestExportRecord(records: CounselPackExportRecord[]): CounselPackExportRecord | undefined {
  return [...records].sort((left, right) => {
    const created = right.createdAt.localeCompare(left.createdAt);
    if (created !== 0) {
      return created;
    }
    return right.version - left.version;
  })[0];
}

function compareRecoveryItems(left: CounselPackExportRecoveryPacketItem, right: CounselPackExportRecoveryPacketItem): number {
  const priority = recoveryStatusWeight(left.recoveryStatus) - recoveryStatusWeight(right.recoveryStatus);
  if (priority !== 0) {
    return priority;
  }

  const version = right.version - left.version;
  if (version !== 0) {
    return version;
  }

  return left.exportRecordId.localeCompare(right.exportRecordId);
}

function recoveryStatusWeight(status: CounselPackExportRecoveryStatus): number {
  if (status === "blocked") {
    return 0;
  }
  if (status === "needs-source-review") {
    return 1;
  }
  if (status === "needs-review") {
    return 2;
  }
  return 3;
}

type BrowserDownloadGlobals = {
  Blob: typeof Blob;
  URL: {
    createObjectURL(blob: Blob): string;
    revokeObjectURL(url: string): void;
  };
  document: {
    body: {
      appendChild(node: unknown): void;
    };
    createElement(tagName: "a"): {
      href: string;
      download: string;
      style: { display: string };
      click(): void;
      remove(): void;
    };
  };
};

function resolveBrowserDownloadGlobals(): BrowserDownloadGlobals {
  const globals = globalThis as typeof globalThis & Partial<BrowserDownloadGlobals>;
  if (!globals.Blob || !globals.URL || !globals.document) {
    throw new Error("Counsel Pack export JSON download requires browser document APIs.");
  }
  return globals as BrowserDownloadGlobals;
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
  return redactClassifiedText(value)
    .replace(
      /\b(?:api[_\-\s]?key|apiKey|secret[_\-\s]?key|secretKey|client[_\-\s]?secret|client secret|clientSecret|bearer token|bearerToken|access[_\-\s]?token|accessToken|refresh[_\-\s]?token|refreshToken|session[_\-\s]?token|sessionToken|webhook[_\-\s]?secret|webhookSecret|password|passphrase)\s*[:=]\s*\[redacted-secret\]/gi,
      "[redacted-secret]"
    )
    .replace(/raw[_\-\s]+kyc/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-\[redacted-raw-kyc\]\]/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-raw-kyc\]\s+(?:packet|file|document|upload|room|dump|csv|spreadsheet|passport|data)\b/gi, "[redacted-raw-kyc]")
    .replace(/\bprivate\s+key\s+\[redacted-private-key\]/gi, "[redacted-private-key]")
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image|data)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
