import type { EvidenceItem, EvidenceOwner } from "./projectModel";

export type EvidenceAuditAction = "created" | "updated" | "removed" | "template-applied" | "source-gap-requested";

export type EvidenceAuditActor = EvidenceOwner | "System";

export type EvidenceAuditEvent = {
  eventVersion: "lexproof-evidence-audit-event-v1";
  id: string;
  projectId: string;
  evidenceId: string;
  evidenceLabel: string;
  action: EvidenceAuditAction;
  actor: EvidenceAuditActor;
  changedFields: string[];
  summary: string;
  createdAt: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence audit trail events are local audit preparation metadata.";
};

type EvidenceAuditEventInput = {
  projectId: string;
  evidence: EvidenceItem;
  action: EvidenceAuditAction;
  actor: EvidenceAuditActor;
  changedFields: string[];
  createdAt?: string;
};

const materialEvidenceFields: Array<keyof EvidenceItem> = ["label", "kind", "content", "source", "status", "owner"];

export function createEvidenceCreatedEvent(
  projectId: string,
  evidence: EvidenceItem,
  actor: EvidenceAuditActor,
  createdAt?: string,
  action: EvidenceAuditAction = "created"
): EvidenceAuditEvent {
  return createEvidenceAuditEvent({
    projectId,
    evidence,
    action,
    actor,
    changedFields: materialEvidenceFields,
    createdAt
  });
}

export function createEvidenceUpdateEvent(
  projectId: string,
  previous: EvidenceItem,
  next: EvidenceItem,
  actor: EvidenceAuditActor,
  createdAt?: string
): EvidenceAuditEvent | null {
  const changedFields = materialEvidenceFields.filter((field) => normalizeFieldValue(previous[field]) !== normalizeFieldValue(next[field]));

  if (changedFields.length === 0) {
    return null;
  }

  return createEvidenceAuditEvent({
    projectId,
    evidence: next,
    action: "updated",
    actor,
    changedFields,
    createdAt
  });
}

export function createEvidenceRemovedEvent(
  projectId: string,
  evidence: EvidenceItem,
  actor: EvidenceAuditActor,
  createdAt?: string
): EvidenceAuditEvent {
  return createEvidenceAuditEvent({
    projectId,
    evidence,
    action: "removed",
    actor,
    changedFields: ["removed"],
    createdAt
  });
}

export function exportEvidenceAuditTrailJson(events: EvidenceAuditEvent[]): string {
  return `${JSON.stringify({ trailVersion: "lexproof-evidence-audit-trail-v1", events }, null, 2)}\n`;
}

export function downloadEvidenceAuditTrailJson(filename: string, events: EvidenceAuditEvent[]): void {
  const blob = new Blob([exportEvidenceAuditTrailJson(events)], { type: "application/json;charset=utf-8" });
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

function createEvidenceAuditEvent(input: EvidenceAuditEventInput): EvidenceAuditEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const label = input.evidence.label.trim() || "Untitled evidence";

  return {
    eventVersion: "lexproof-evidence-audit-event-v1",
    id: `evidence-event-${hashEventId(input.projectId, input.evidence.id ?? label, input.action, createdAt)}`,
    projectId: input.projectId,
    evidenceId: input.evidence.id ?? "untracked-evidence",
    evidenceLabel: label,
    action: input.action,
    actor: input.actor,
    changedFields: input.changedFields.map(String),
    summary: createSummary(input.action, label, input.changedFields.map(String)),
    createdAt,
    notLegalAdviceBoundary: "Not legal advice. Evidence audit trail events are local audit preparation metadata."
  };
}

function createSummary(action: EvidenceAuditAction, label: string, changedFields: string[]): string {
  if (action === "updated") {
    return `updated ${label}: ${changedFields.join(", ")}`;
  }

  return `${action} ${label}`;
}

function normalizeFieldValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : JSON.stringify(value);
}

function hashEventId(...parts: string[]): string {
  let hash = 0;
  const payload = parts.join("|");
  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash * 31 + payload.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
