import { redactClassifiedText } from "./dataClassification.js";
import type { AuditLogExportRecord } from "./auditLogExport.js";
import type { AuditLogRecord } from "./phase2Types.js";

const AUDIT_LOG_BOUNDARY = "Not legal advice. Audit log records are review workspace metadata." as const;
const AUDIT_LOG_EXPORT_BOUNDARY = "Not legal advice. Audit Log exports are review workspace metadata only." as const;
const legalConclusionPattern =
  /\b(final[_\-\s]+legal[_\-\s]+decision|legal[_\-\s]+opinion|legal[_\-\s]+conclusion|legal[_\-\s]+approval|legally[_\-\s]+compliant|legally[_\-\s]+non[_\-\s]+compliant|compliance[_\-\s]+decision)\b/gi;

export function redactAuditLogRecord(record: AuditLogRecord): AuditLogRecord {
  return {
    ...record,
    workspaceId: redactAuditLogText(record.workspaceId),
    actorId: redactAuditLogText(record.actorId),
    action: redactAuditLogText(record.action),
    targetId: redactAuditLogText(record.targetId),
    beforeHash: redactAuditLogHash(record.beforeHash),
    afterHash: redactAuditLogHash(record.afterHash),
    summary: redactAuditLogText(record.summary),
    notLegalAdviceBoundary: AUDIT_LOG_BOUNDARY
  };
}

export function redactAuditLogHash(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : redactAuditLogText(value);
}

export function redactAuditLogExportRecord(record: AuditLogExportRecord): AuditLogExportRecord {
  return {
    ...record,
    workspaceId: redactAuditLogText(record.workspaceId),
    integritySummary: redactAuditLogText(record.integritySummary),
    actionCounts: redactActionCounts(record.actionCounts),
    actors: record.actors.map(redactAuditLogText),
    boundaryFindings: record.boundaryFindings.map((finding) => ({
      ...finding,
      ...(finding.eventId ? { eventId: redactAuditLogText(finding.eventId) } : {}),
      redactedSnippet: redactAuditLogText(finding.redactedSnippet),
      message: redactAuditLogText(finding.message)
    })),
    remediation: record.remediation.map(redactAuditLogText).filter(Boolean),
    nextActions: record.nextActions.map(redactAuditLogText).filter(Boolean),
    events: record.events.map((event) => ({
      ...event,
      id: redactAuditLogText(event.id),
      actorId: redactAuditLogText(event.actorId),
      action: redactAuditLogText(event.action),
      targetId: redactAuditLogText(event.targetId),
      beforeHash: redactAuditLogHash(event.beforeHash),
      afterHash: redactAuditLogHash(event.afterHash),
      summary: redactAuditLogText(event.summary)
    })),
    notLegalAdviceBoundary: AUDIT_LOG_EXPORT_BOUNDARY
  };
}

function redactActionCounts(actionCounts: Record<string, number>): Record<string, number> {
  return Object.entries(actionCounts).reduce<Record<string, number>>((counts, [action, count]) => {
    const safeAction = redactAuditLogText(action) || "redacted-action";
    counts[safeAction] = (counts[safeAction] ?? 0) + count;
    return counts;
  }, {});
}

export function redactAuditLogText(value: string): string {
  return redactClassifiedText(value)
    .replace(
      /\b(?:api[_\-\s]?key|apiKey|secret[_\-\s]?key|secretKey|client[_\-\s]?secret|client secret|clientSecret|bearer token|bearerToken|access[_\-\s]?token|accessToken|refresh[_\-\s]?token|refreshToken|session[_\-\s]?token|sessionToken|webhook[_\-\s]?secret|webhookSecret|password|passphrase)\s*[:=]\s*\[redacted-secret\]/gi,
      "[redacted-secret]"
    )
    .replace(/(?<!redacted-)raw[_\-\s]+kyc/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-\[redacted-raw-kyc\]\]/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-raw-kyc\]\s+(?:packet|file|document|upload|room|dump|csv|spreadsheet|passport|data)\b/gi, "[redacted-raw-kyc]")
    .replace(/\bprivate\s+key\s+\[redacted-private-key\]/gi, "[redacted-private-key]")
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image|data)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}
