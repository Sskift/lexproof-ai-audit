import { redactDataBoundaryText } from "./dataBoundary";
import type { AuditLogRecord } from "./phase2Types";

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
  const events = [...input.records].sort(compareAuditLogRecords).map(createExportEvent);

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
    beforeHash: redactDataBoundaryText(record.beforeHash),
    afterHash: redactDataBoundaryText(record.afterHash),
    summary: redactDataBoundaryText(record.summary),
    createdAt: record.createdAt
  };
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
