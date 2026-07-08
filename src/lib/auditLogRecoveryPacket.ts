import { redactAuditLogText } from "./auditLogRedaction.js";
import type { AuditLogExportBoundaryFinding, AuditLogExportRecord } from "./auditLogExport.js";
import type { AuditLogFilterInput } from "./auditLogFilters.js";

export type AuditLogRecoveryStatus = "empty" | "blocked" | "needs-review" | "ready";
export type AuditLogRecoveryPriority = "P0" | "P1" | "P2" | "P3";

export type AuditLogRecoveryPacketItem = {
  itemId: string;
  source: "export" | "boundary-finding";
  recoveryStatus: Exclude<AuditLogRecoveryStatus, "ready">;
  priority: AuditLogRecoveryPriority;
  recoveryAction: string;
  eventId?: string;
  action?: string;
  targetType?: AuditLogExportRecord["events"][number]["targetType"];
  targetId?: string;
  entryHash?: string;
  field?: AuditLogBoundaryFindingField;
  dataClass?: AuditLogExportBoundaryFinding["dataClass"];
  severity?: AuditLogExportBoundaryFinding["severity"];
  notLegalAdviceBoundary: "Not legal advice. Audit Log recovery items are review workspace metadata only.";
};

export type AuditLogRecoveryPacket = {
  packetVersion: "lexproof-audit-log-recovery-packet-v1";
  workspaceId: string;
  generatedAt: string;
  packetHash: string;
  status: AuditLogRecoveryStatus;
  eventCount: number;
  recoveryItemCount: number;
  blockedCount: number;
  needsReviewCount: number;
  emptyExportCount: number;
  readyEventCount: number;
  exportAllowed: boolean;
  exportHash: string;
  integrityChainHash: string;
  appliedFilters: AuditLogAppliedFilters;
  nextActions: string[];
  items: AuditLogRecoveryPacketItem[];
  notLegalAdviceBoundary: "Not legal advice. Audit Log recovery packets are review workspace metadata only.";
};

export type CreateAuditLogRecoveryPacketOptions = {
  generatedAt?: string;
  filters?: AuditLogFilterInput;
};

export type AuditLogAppliedFilters = Partial<Record<keyof AuditLogFilterInput, string>>;
export type AuditLogBoundaryFindingField = AuditLogExportRecord["boundaryFindings"][number]["field"];

type AuditLogRecoveryPacketSubject = Omit<AuditLogRecoveryPacket, "generatedAt" | "packetHash">;

const PACKET_BOUNDARY = "Not legal advice. Audit Log recovery packets are review workspace metadata only." as const;
const ITEM_BOUNDARY = "Not legal advice. Audit Log recovery items are review workspace metadata only." as const;

export async function createAuditLogRecoveryPacket(
  exportRecord: AuditLogExportRecord,
  options: CreateAuditLogRecoveryPacketOptions = {}
): Promise<AuditLogRecoveryPacket> {
  const items = createRecoveryItems(exportRecord);
  const status = createRecoveryStatus(exportRecord, items);
  const subject: AuditLogRecoveryPacketSubject = {
    packetVersion: "lexproof-audit-log-recovery-packet-v1",
    workspaceId: redactAuditLogText(exportRecord.workspaceId),
    status,
    eventCount: exportRecord.eventCount,
    recoveryItemCount: items.length,
    blockedCount: items.filter((item) => item.recoveryStatus === "blocked").length,
    needsReviewCount: items.filter((item) => item.recoveryStatus === "needs-review").length,
    emptyExportCount: status === "empty" ? 1 : 0,
    readyEventCount: status === "ready" ? exportRecord.eventCount : 0,
    exportAllowed: exportRecord.exportAllowed,
    exportHash: exportRecord.exportHash,
    integrityChainHash: exportRecord.integrityChainHash,
    appliedFilters: createAppliedFilters(options.filters),
    nextActions: createPacketNextActions(exportRecord, items),
    items,
    notLegalAdviceBoundary: PACKET_BOUNDARY
  };

  return {
    ...subject,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    packetHash: await sha256Hex(stableStringify(subject))
  };
}

export function exportAuditLogRecoveryPacketJson(packet: AuditLogRecoveryPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

export function downloadAuditLogRecoveryPacketJson(filename: string, packet: AuditLogRecoveryPacket): void {
  const browser = resolveBrowserDownloadGlobals();
  const blob = new browser.Blob([exportAuditLogRecoveryPacketJson(packet)], {
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

function createRecoveryItems(exportRecord: AuditLogExportRecord): AuditLogRecoveryPacketItem[] {
  if (exportRecord.eventCount === 0 || exportRecord.integrityStatus === "empty") {
    return [
      {
        itemId: "audit-log-empty-export",
        source: "export",
        recoveryStatus: "empty",
        priority: "P1",
        recoveryAction:
          exportRecord.nextActions.find((action) => /secure review journey|clear audit log filters/i.test(action)) ??
          "Run Secure Review Journey or clear Audit Log filters before final handoff.",
        notLegalAdviceBoundary: ITEM_BOUNDARY
      }
    ];
  }

  return exportRecord.boundaryFindings
    .filter((finding) => finding.severity === "block" || finding.severity === "warn")
    .map((finding, index) => createBoundaryFindingItem(exportRecord, finding, index))
    .sort(compareItems);
}

function createBoundaryFindingItem(
  exportRecord: AuditLogExportRecord,
  finding: AuditLogExportBoundaryFinding,
  index: number
): AuditLogRecoveryPacketItem {
  const matchedEvent = finding.eventId
    ? exportRecord.events.find((event) => event.id === finding.eventId)
    : undefined;
  const recoveryStatus = finding.severity === "block" ? "blocked" : "needs-review";
  const recoveryAction =
    recoveryStatus === "blocked"
      ? "Remove Audit Log data-boundary blockers before downloading or sharing the export."
      : "Confirm warning-level Audit Log metadata with the reviewer before external handoff.";

  return {
    itemId: `audit-log-boundary-${index + 1}`,
    source: "boundary-finding",
    recoveryStatus,
    priority: recoveryStatus === "blocked" ? "P0" : "P1",
    recoveryAction,
    ...(finding.eventId ? { eventId: redactAuditLogText(finding.eventId) } : {}),
    ...(matchedEvent
      ? {
          action: redactAuditLogText(matchedEvent.action),
          targetType: matchedEvent.targetType,
          targetId: redactAuditLogText(matchedEvent.targetId),
          entryHash: matchedEvent.entryHash
        }
      : {}),
    field: finding.field,
    dataClass: finding.dataClass,
    severity: finding.severity,
    notLegalAdviceBoundary: ITEM_BOUNDARY
  };
}

function createRecoveryStatus(
  exportRecord: AuditLogExportRecord,
  items: AuditLogRecoveryPacketItem[]
): AuditLogRecoveryStatus {
  if (exportRecord.eventCount === 0 || exportRecord.integrityStatus === "empty") {
    return "empty";
  }

  if (!exportRecord.exportAllowed || exportRecord.integrityStatus === "blocked" || items.some((item) => item.recoveryStatus === "blocked")) {
    return "blocked";
  }

  if (exportRecord.integrityStatus === "needs-review" || items.some((item) => item.recoveryStatus === "needs-review")) {
    return "needs-review";
  }

  return "ready";
}

function createPacketNextActions(
  exportRecord: AuditLogExportRecord,
  items: AuditLogRecoveryPacketItem[]
): string[] {
  const actions = [
    ...items.map((item) => item.recoveryAction),
    ...exportRecord.nextActions,
    ...exportRecord.remediation
  ]
    .map(redactAuditLogText)
    .filter(Boolean);

  return Array.from(new Set(actions));
}

function createAppliedFilters(filters: AuditLogFilterInput = {}): AuditLogAppliedFilters {
  return (["actorId", "action", "targetType", "targetId"] as Array<keyof AuditLogFilterInput>).reduce<AuditLogAppliedFilters>(
    (applied, key) => {
      const value = filters[key];
      if (typeof value === "string" && value.trim()) {
        applied[key] = redactAuditLogText(value);
      }
      return applied;
    },
    {}
  );
}

function compareItems(left: AuditLogRecoveryPacketItem, right: AuditLogRecoveryPacketItem): number {
  const priority = left.priority.localeCompare(right.priority);
  return priority === 0 ? left.itemId.localeCompare(right.itemId) : priority;
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
    throw new Error("Audit Log recovery packet download requires browser document APIs.");
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
