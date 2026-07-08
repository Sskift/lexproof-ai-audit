import { redactClassifiedText } from "./dataClassification";
import { evidenceOwners, type EvidenceItem, type EvidenceOwner } from "./projectModel";

export type EvidenceAuditAction =
  | "created"
  | "updated"
  | "removed"
  | "template-applied"
  | "source-gap-requested"
  | "source-gap-refreshed";

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

const EVIDENCE_AUDIT_EVENT_BOUNDARY = "Not legal advice. Evidence audit trail events are local audit preparation metadata." as const;
const evidenceAuditActions = [
  "created",
  "updated",
  "removed",
  "template-applied",
  "source-gap-requested",
  "source-gap-refreshed"
] as const;
const evidenceAuditActors = [...evidenceOwners, "System"] as const;
const evidenceAuditChangedFields = ["label", "kind", "content", "source", "status", "owner", "removed"] as const;
const legalConclusionPattern =
  /\b(final\s+legal\s+decision|legal\s+opinion|legal\s+approval|legally\s+compliant|legally\s+non-compliant|compliance\s+decision)\b/gi;

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
  return `${JSON.stringify({ trailVersion: "lexproof-evidence-audit-trail-v1", events: events.map(sanitizeEvidenceAuditEvent) }, null, 2)}\n`;
}

export function parseStoredEvidenceAuditEvents(raw: string | null | undefined): EvidenceAuditEvent[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.flatMap((item) => {
          const event = parseEvidenceAuditEvent(item);
          return event ? [event] : [];
        })
      : [];
  } catch {
    return [];
  }
}

export function parseEvidenceAuditEvent(value: unknown): EvidenceAuditEvent | null {
  if (!isRecord(value) || value.eventVersion !== "lexproof-evidence-audit-event-v1") {
    return null;
  }
  if (value.notLegalAdviceBoundary !== EVIDENCE_AUDIT_EVENT_BOUNDARY) {
    return null;
  }
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.projectId) ||
    !isNonEmptyString(value.evidenceId) ||
    !isNonEmptyString(value.evidenceLabel) ||
    !isOneOf(value.action, evidenceAuditActions) ||
    !isOneOf(value.actor, evidenceAuditActors) ||
    !isChangedFields(value.changedFields) ||
    typeof value.summary !== "string" ||
    !isStrictIsoTimestamp(value.createdAt)
  ) {
    return null;
  }

  return sanitizeEvidenceAuditEvent({
    eventVersion: "lexproof-evidence-audit-event-v1",
    id: value.id,
    projectId: value.projectId,
    evidenceId: value.evidenceId,
    evidenceLabel: value.evidenceLabel,
    action: value.action,
    actor: value.actor,
    changedFields: value.changedFields,
    summary: value.summary,
    createdAt: value.createdAt,
    notLegalAdviceBoundary: EVIDENCE_AUDIT_EVENT_BOUNDARY
  });
}

export function sanitizeEvidenceAuditEvent(event: EvidenceAuditEvent): EvidenceAuditEvent {
  return {
    eventVersion: "lexproof-evidence-audit-event-v1",
    id: sanitizeEvidenceAuditText(event.id) || "evidence-event",
    projectId: sanitizeEvidenceAuditText(event.projectId) || "project",
    evidenceId: sanitizeEvidenceAuditText(event.evidenceId) || "evidence",
    evidenceLabel: sanitizeEvidenceAuditText(event.evidenceLabel) || "Untitled evidence",
    action: event.action,
    actor: event.actor,
    changedFields: event.changedFields.map(sanitizeEvidenceAuditText).filter(Boolean),
    summary: sanitizeEvidenceAuditText(event.summary),
    createdAt: sanitizeEvidenceAuditText(event.createdAt),
    notLegalAdviceBoundary: EVIDENCE_AUDIT_EVENT_BOUNDARY
  };
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
  const createdAt = isStrictIsoTimestamp(input.createdAt) ? input.createdAt : new Date().toISOString();
  const projectId = sanitizeEvidenceAuditText(input.projectId) || "project";
  const evidenceId = sanitizeEvidenceAuditText(input.evidence.id ?? "untracked-evidence") || "untracked-evidence";
  const label = sanitizeEvidenceAuditText(input.evidence.label) || "Untitled evidence";
  const changedFields = input.changedFields.map(String).map(sanitizeEvidenceAuditText).filter(Boolean);

  return {
    eventVersion: "lexproof-evidence-audit-event-v1",
    id: `evidence-event-${hashEventId(projectId, evidenceId, input.action, createdAt)}`,
    projectId,
    evidenceId,
    evidenceLabel: label,
    action: input.action,
    actor: input.actor,
    changedFields,
    summary: sanitizeEvidenceAuditText(createSummary(input.action, label, changedFields)),
    createdAt,
    notLegalAdviceBoundary: EVIDENCE_AUDIT_EVENT_BOUNDARY
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

function sanitizeEvidenceAuditText(value: string): string {
  return redactClassifiedText(value)
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<const T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function isChangedFields(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((field) => isOneOf(field, evidenceAuditChangedFields));
}

function isStrictIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}
