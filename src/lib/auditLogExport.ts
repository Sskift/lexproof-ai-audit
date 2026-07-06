import { redactDataBoundaryText } from "./dataBoundary";
import {
  classifyDataBoundaryText,
  type ClassifiedDataClass,
  type ClassifiedDataSeverity
} from "./dataClassification";
import type { AuditLogRecord } from "./phase2Types";

export type AuditLogExportBoundaryStatus = "clean" | "needs-review" | "blocked";

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
};

export type AuditLogExportRecord = {
  exportVersion: "lexproof-audit-log-export-v1";
  workspaceId: string;
  exportedAt: string;
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

  return {
    exportVersion: "lexproof-audit-log-export-v1",
    workspaceId: redactDataBoundaryText(input.workspaceId.trim() || "local-workspace"),
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    eventCount: events.length,
    ...(events[0] ? { firstEventAt: events[0].createdAt } : {}),
    ...(events.at(-1) ? { lastEventAt: events.at(-1)?.createdAt } : {}),
    actionCounts: countActions(events),
    actors: uniqueSorted(events.map((event) => event.actorId)),
    targetTypes: uniqueSorted(events.map((event) => event.targetType)) as AuditLogRecord["targetType"][],
    dataBoundaryStatus,
    exportAllowed: boundaryBlockerCount === 0,
    boundaryBlockerCount,
    boundaryWarningCount,
    detectedClasses: uniqueSorted(boundaryFindings.map((finding) => finding.dataClass)) as ClassifiedDataClass[],
    boundaryFindings,
    remediation: createRemediation(boundaryFindings),
    events,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportAuditLogJson(record: AuditLogExportRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function downloadAuditLogJson(filename: string, record: AuditLogExportRecord): void {
  const blob = new Blob([exportAuditLogJson(record)], { type: "application/json;charset=utf-8" });
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

function createExportEvent(record: AuditLogRecord): AuditLogExportEvent {
  return {
    id: redactDataBoundaryText(record.id),
    actorId: redactDataBoundaryText(record.actorId),
    action: redactDataBoundaryText(record.action),
    targetType: record.targetType,
    targetId: redactDataBoundaryText(record.targetId),
    beforeHash: sanitizeAuditHash(record.beforeHash),
    afterHash: sanitizeAuditHash(record.afterHash),
    summary: redactDataBoundaryText(record.summary),
    createdAt: record.createdAt
  };
}

function createBoundaryFindings(workspaceId: string, records: AuditLogRecord[]): AuditLogExportBoundaryFinding[] {
  return [
    ...scanBoundaryField({ source: "workspace", field: "workspaceId", value: workspaceId }),
    ...records.flatMap((record) =>
      scanAuditLogRecord(record).map((finding) => ({
        ...finding,
        eventId: redactDataBoundaryText(record.id)
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
    redactedSnippet: finding.redactedSnippet,
    message: finding.message
  }));
}

function sanitizeAuditHash(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : redactDataBoundaryText(value);
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
