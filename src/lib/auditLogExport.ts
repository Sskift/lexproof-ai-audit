import {
  classifyDataBoundaryText,
  type ClassifiedDataClass,
  type ClassifiedDataSeverity
} from "./dataClassification.js";
import { redactAuditLogText } from "./auditLogRedaction.js";
import type { AuditLogRecord } from "./phase2Types.js";

export type AuditLogExportBoundaryStatus = "clean" | "needs-review" | "blocked";
export type AuditLogExportIntegrityStatus = "verified" | "needs-review" | "blocked" | "empty";

export type AuditLogExportBoundaryFinding = {
  source: "workspace" | "event";
  eventId?: string;
  field: "workspaceId" | keyof Pick<AuditLogRecord, "id" | "actorId" | "action" | "targetId" | "beforeHash" | "afterHash" | "summary">;
  dataClass: ClassifiedDataClass;
  severity: ClassifiedDataSeverity;
  matchCount: number;
  redactedSnippet: string;
  message: string;
};

export type AuditLogExportEvent = {
  id: string;
  actorId: string;
  action: string;
  targetType: AuditLogRecord["targetType"];
  targetId: string;
  beforeHash: string;
  afterHash: string;
  summary: string;
  createdAt: string;
  entryHash: string;
};

export type AuditLogExportRecord = {
  exportVersion: "lexproof-audit-log-export-v1";
  workspaceId: string;
  exportedAt: string;
  exportHash: string;
  integrityChainHash: string;
  integrityStatus: AuditLogExportIntegrityStatus;
  integritySummary: string;
  eventCount: number;
  firstEventAt?: string;
  lastEventAt?: string;
  actionCounts: Record<string, number>;
  actors: string[];
  targetTypes: AuditLogRecord["targetType"][];
  dataBoundaryStatus: AuditLogExportBoundaryStatus;
  exportAllowed: boolean;
  boundaryBlockerCount: number;
  boundaryWarningCount: number;
  detectedClasses: ClassifiedDataClass[];
  boundaryFindings: AuditLogExportBoundaryFinding[];
  remediation: string[];
  nextActions: string[];
  events: AuditLogExportEvent[];
  notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only.";
};

export type CreateAuditLogExportInput = {
  workspaceId: string;
  records: AuditLogRecord[];
  exportedAt?: string;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Audit Log exports are review workspace metadata only.";

export function createAuditLogExport(input: CreateAuditLogExportInput): AuditLogExportRecord {
  const records = [...input.records].sort(compareAuditLogRecords);
  const events = records.map(createExportEvent);
  const boundaryFindings = createBoundaryFindings(input.workspaceId, records);
  const boundaryBlockerCount = boundaryFindings.filter((finding) => finding.severity === "block").length;
  const boundaryWarningCount = boundaryFindings.filter((finding) => finding.severity === "warn").length;
  const dataBoundaryStatus = createBoundaryStatus(boundaryBlockerCount, boundaryWarningCount);
  const integrityChainHash = createIntegrityChainHash(events);
  const integrityStatus = createIntegrityStatus(events.length, dataBoundaryStatus);
  const actionCounts = countActions(events);
  const actors = uniqueSorted(events.map((event) => event.actorId));
  const targetTypes = uniqueSorted(events.map((event) => event.targetType)) as AuditLogRecord["targetType"][];
  const remediation = createRemediation(boundaryFindings);
  const nextActions = createNextActions({
    eventCount: events.length,
    integrityStatus,
    exportAllowed: boundaryBlockerCount === 0,
    remediation
  });
  const exportHash = createExportHash({
    workspaceId: redactAuditLogText(input.workspaceId.trim() || "local-workspace"),
    eventCount: events.length,
    firstEventAt: events[0]?.createdAt,
    lastEventAt: events.at(-1)?.createdAt,
    actionCounts,
    actors,
    targetTypes,
    dataBoundaryStatus,
    integrityChainHash,
    integrityStatus,
    exportAllowed: boundaryBlockerCount === 0,
    boundaryBlockerCount,
    boundaryWarningCount,
    detectedClasses: uniqueSorted(boundaryFindings.map((finding) => finding.dataClass)),
    remediation,
    nextActions,
    eventEntryHashes: events.map((event) => event.entryHash)
  });

  return {
    exportVersion: "lexproof-audit-log-export-v1",
    workspaceId: redactAuditLogText(input.workspaceId.trim() || "local-workspace"),
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    exportHash,
    integrityChainHash,
    integrityStatus,
    integritySummary: createIntegritySummary(events.length, integrityStatus, dataBoundaryStatus),
    eventCount: events.length,
    ...(events[0] ? { firstEventAt: events[0].createdAt } : {}),
    ...(events.at(-1) ? { lastEventAt: events.at(-1)?.createdAt } : {}),
    actionCounts,
    actors,
    targetTypes,
    dataBoundaryStatus,
    exportAllowed: boundaryBlockerCount === 0,
    boundaryBlockerCount,
    boundaryWarningCount,
    detectedClasses: uniqueSorted(boundaryFindings.map((finding) => finding.dataClass)) as ClassifiedDataClass[],
    boundaryFindings,
    remediation,
    nextActions,
    events,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportAuditLogJson(record: AuditLogExportRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function downloadAuditLogJson(filename: string, record: AuditLogExportRecord): void {
  const browser = resolveBrowserDownloadGlobals();
  const blob = new browser.Blob([exportAuditLogJson(record)], { type: "application/json;charset=utf-8" });
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
    throw new Error("Audit Log JSON download requires browser document APIs.");
  }
  return globals as BrowserDownloadGlobals;
}

function createExportEvent(record: AuditLogRecord): AuditLogExportEvent {
  const event = {
    id: redactAuditLogText(record.id),
    actorId: redactAuditLogText(record.actorId),
    action: redactAuditLogText(record.action),
    targetType: record.targetType,
    targetId: redactAuditLogText(record.targetId),
    beforeHash: sanitizeAuditHash(record.beforeHash),
    afterHash: sanitizeAuditHash(record.afterHash),
    summary: redactAuditLogText(record.summary),
    createdAt: record.createdAt
  };

  return {
    ...event,
    entryHash: sha256Hex(stableStringify(event))
  };
}

function createBoundaryFindings(workspaceId: string, records: AuditLogRecord[]): AuditLogExportBoundaryFinding[] {
  return [
    ...scanBoundaryField({ source: "workspace", field: "workspaceId", value: workspaceId }),
    ...records.flatMap((record) =>
      scanAuditLogRecord(record).map((finding) => ({
        ...finding,
        eventId: redactAuditLogText(record.id)
      }))
    )
  ];
}

function scanAuditLogRecord(record: AuditLogRecord): AuditLogExportBoundaryFinding[] {
  return [
    scanBoundaryField({ source: "event", field: "id", value: record.id }),
    scanBoundaryField({ source: "event", field: "actorId", value: record.actorId }),
    scanBoundaryField({ source: "event", field: "action", value: record.action }),
    scanBoundaryField({ source: "event", field: "targetId", value: record.targetId }),
    scanBoundaryField({ source: "event", field: "beforeHash", value: record.beforeHash }),
    scanBoundaryField({ source: "event", field: "afterHash", value: record.afterHash }),
    scanBoundaryField({ source: "event", field: "summary", value: record.summary })
  ].flat();
}

function scanBoundaryField(input: {
  source: AuditLogExportBoundaryFinding["source"];
  field: AuditLogExportBoundaryFinding["field"];
  value: string;
}): AuditLogExportBoundaryFinding[] {
  return classifyDataBoundaryText(input.value).map((finding) => ({
    source: input.source,
    field: input.field,
    dataClass: finding.dataClass,
    severity: finding.severity,
    matchCount: finding.matchCount,
    redactedSnippet: redactAuditLogText(finding.redactedSnippet),
    message: redactAuditLogText(finding.message)
  }));
}

function sanitizeAuditHash(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : redactAuditLogText(value);
}

function createBoundaryStatus(
  boundaryBlockerCount: number,
  boundaryWarningCount: number
): AuditLogExportBoundaryStatus {
  if (boundaryBlockerCount > 0) {
    return "blocked";
  }

  if (boundaryWarningCount > 0) {
    return "needs-review";
  }

  return "clean";
}

function createRemediation(findings: AuditLogExportBoundaryFinding[]): string[] {
  if (findings.length === 0) {
    return ["Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."];
  }

  const remediation: string[] = [];
  if (findings.some((finding) => finding.severity === "block")) {
    remediation.push("Remove secrets, private-key material, and raw KYC references from Audit Log source records before handoff.");
  }

  if (findings.some((finding) => finding.severity === "warn")) {
    remediation.push("Confirm wallet addresses, KYC references, and personal-data mentions are metadata-only or redacted before sharing.");
  }

  if (findings.some((finding) => finding.severity === "info")) {
    remediation.push("Confirm confidentiality labels and recipient scope before distributing Audit Log exports.");
  }

  return remediation;
}

function createNextActions(input: {
  eventCount: number;
  integrityStatus: AuditLogExportIntegrityStatus;
  exportAllowed: boolean;
  remediation: string[];
}): string[] {
  const actions: string[] = [];

  if (input.eventCount === 0 || input.integrityStatus === "empty") {
    actions.push("Run Secure Review Journey or clear Audit Log filters before final handoff.");
  }

  if (input.integrityStatus === "blocked" || !input.exportAllowed) {
    actions.push("Resolve Audit Log data-boundary blockers before downloading or sharing the export.");
  }

  if (input.integrityStatus === "needs-review") {
    actions.push("Confirm warning-level Audit Log metadata with the reviewer before external handoff.");
  }

  return Array.from(new Set([...actions, ...input.remediation])).filter((action) => action.trim().length > 0);
}

function compareAuditLogRecords(left: AuditLogRecord, right: AuditLogRecord): number {
  const time = left.createdAt.localeCompare(right.createdAt);
  return time === 0 ? left.id.localeCompare(right.id) : time;
}

function countActions(events: AuditLogExportEvent[]): Record<string, number> {
  return events.reduce<Record<string, number>>((counts, event) => {
    counts[event.action] = (counts[event.action] ?? 0) + 1;
    return counts;
  }, {});
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function createIntegrityChainHash(events: AuditLogExportEvent[]): string {
  return events.reduce(
    (previousHash, event) =>
      sha256Hex(
        stableStringify({
          previousHash,
          entryHash: event.entryHash
        })
      ),
    sha256Hex("lexproof-empty-audit-log-chain")
  );
}

function createIntegrityStatus(
  eventCount: number,
  dataBoundaryStatus: AuditLogExportBoundaryStatus
): AuditLogExportIntegrityStatus {
  if (eventCount === 0) {
    return "empty";
  }
  if (dataBoundaryStatus === "blocked") {
    return "blocked";
  }
  if (dataBoundaryStatus === "needs-review") {
    return "needs-review";
  }
  return "verified";
}

function createIntegritySummary(
  eventCount: number,
  integrityStatus: AuditLogExportIntegrityStatus,
  dataBoundaryStatus: AuditLogExportBoundaryStatus
): string {
  if (integrityStatus === "empty") {
    return "No server audit log events are available yet; run the Secure Review Journey before final handoff.";
  }
  if (integrityStatus === "blocked") {
    return `Audit log chain has ${eventCount} event hashes but export is blocked by data-boundary findings.`;
  }
  if (integrityStatus === "needs-review") {
    return `Audit log chain has ${eventCount} event hashes and needs reviewer confirmation for ${dataBoundaryStatus} metadata.`;
  }
  return `Audit log chain verified across ${eventCount} metadata-only event hash${eventCount === 1 ? "" : "es"}.`;
}

function createExportHash(payload: Record<string, unknown>): string {
  return sha256Hex(
    stableStringify({
      exportVersion: "lexproof-audit-log-export-v1",
      ...payload,
      notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
    })
  );
}

function sha256Hex(payload: string): string {
  const bytes = new TextEncoder().encode(payload);
  const words = createSha256Words(bytes);
  return words.map((word) => word.toString(16).padStart(8, "0")).join("");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

function createSha256Words(bytes: Uint8Array): number[] {
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const length = bytes.length;
  const paddedLength = Math.ceil((length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[length] = 0x80;
  const bitLength = length * 8;
  const dataView = new DataView(padded.buffer);
  dataView.setUint32(paddedLength - 4, bitLength, false);

  for (let chunk = 0; chunk < paddedLength; chunk += 64) {
    const words = new Array<number>(64).fill(0);
    for (let index = 0; index < 16; index += 1) {
      words[index] = dataView.getUint32(chunk + index * 4, false);
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = add32(words[index - 16], s0, words[index - 7], s1);
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = add32(h, s1, choice, constants[index], words[index]);
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = add32(s0, majority);
      h = g;
      g = f;
      f = e;
      e = add32(d, temp1);
      d = c;
      c = b;
      b = a;
      a = add32(temp1, temp2);
    }

    hash[0] = add32(hash[0], a);
    hash[1] = add32(hash[1], b);
    hash[2] = add32(hash[2], c);
    hash[3] = add32(hash[3], d);
    hash[4] = add32(hash[4], e);
    hash[5] = add32(hash[5], f);
    hash[6] = add32(hash[6], g);
    hash[7] = add32(hash[7], h);
  }

  return hash;
}

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function add32(...values: number[]): number {
  return values.reduce((sum, value) => (sum + value) >>> 0, 0);
}
