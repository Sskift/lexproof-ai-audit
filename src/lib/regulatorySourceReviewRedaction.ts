import { redactClassifiedText } from "./dataClassification";
import type { RegulatorySourceReviewSyncResult } from "./phase2Types";
import type { ServerRegulatorySourceReviewPacket, ServerRegulatorySourceReviewPacketRecord } from "./regulatorySourceReviewSync";

const RECORD_BOUNDARY = "Not legal advice. Source review records are audit preparation lineage metadata only." as const;
const SERVER_PACKET_BOUNDARY = "Not legal advice. Server Source Review packets are audit preparation lineage metadata only." as const;
const legalConclusionPattern =
  /\b(final legal decision|legal opinion|legal conclusion|legally compliant|legally non-compliant|compliance decision|legal approval)\b/gi;

export function redactRegulatorySourceReviewSyncResult(
  result: RegulatorySourceReviewSyncResult
): RegulatorySourceReviewSyncResult {
  const workspaceId = redactSourceReviewText(result.workspaceId);
  const records = mapPossiblyChanged(result.records, redactSourceReviewRecord);
  const changed = workspaceId !== result.workspaceId || records.changed;

  if (!changed) {
    return result;
  }

  return {
    ...result,
    workspaceId,
    records: records.value,
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };
}

export function redactRegulatorySourceReviewPacket(
  packet: ServerRegulatorySourceReviewPacket
): ServerRegulatorySourceReviewPacket {
  const workspaceId = redactSourceReviewText(packet.workspaceId);
  const generatedAt = redactSourceReviewText(packet.generatedAt);
  const records = mapPossiblyChanged(packet.records, redactSourceReviewPacketRecord);
  const nextActions = mapStringsPossiblyChanged(packet.nextActions);
  const changed =
    workspaceId !== packet.workspaceId || generatedAt !== packet.generatedAt || records.changed || nextActions.changed;

  if (!changed) {
    return packet;
  }

  return {
    ...packet,
    workspaceId,
    generatedAt,
    records: records.value,
    nextActions: nextActions.value,
    notLegalAdviceBoundary: SERVER_PACKET_BOUNDARY
  };
}

function redactSourceReviewRecord(record: RegulatorySourceReviewSyncResult["records"][number]): {
  value: RegulatorySourceReviewSyncResult["records"][number];
  changed: boolean;
} {
  const redacted = {
    ...record,
    id: redactSourceReviewText(record.id),
    workspaceId: redactSourceReviewText(record.workspaceId),
    sourceReviewItemId: redactSourceReviewText(record.sourceReviewItemId),
    clauseId: redactSourceReviewText(record.clauseId),
    jurisdiction: redactSourceReviewText(record.jurisdiction),
    regulator: redactSourceReviewText(record.regulator),
    citation: redactSourceReviewText(record.citation),
    sourceName: redactSourceReviewText(record.sourceName),
    sourceUrl: redactSourceReviewText(record.sourceUrl),
    effectiveAsOf: redactSourceReviewText(record.effectiveAsOf),
    lastReviewedAt: redactSourceReviewText(record.lastReviewedAt),
    nextReviewDueAt: redactSourceReviewText(record.nextReviewDueAt),
    reviewerNotes: redactSourceReviewText(record.reviewerNotes),
    nextAction: redactSourceReviewText(record.nextAction),
    createdBy: redactSourceReviewText(record.createdBy),
    createdAt: redactSourceReviewText(record.createdAt),
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };

  return { value: redacted, changed: JSON.stringify(redacted) !== JSON.stringify(record) };
}

function redactSourceReviewPacketRecord(record: ServerRegulatorySourceReviewPacketRecord): {
  value: ServerRegulatorySourceReviewPacketRecord;
  changed: boolean;
} {
  const redacted = {
    ...record,
    recordId: redactSourceReviewText(record.recordId),
    clauseId: redactSourceReviewText(record.clauseId),
    jurisdiction: redactSourceReviewText(record.jurisdiction),
    regulator: redactSourceReviewText(record.regulator),
    citation: redactSourceReviewText(record.citation),
    sourceName: redactSourceReviewText(record.sourceName),
    sourceUrl: redactSourceReviewText(record.sourceUrl),
    effectiveAsOf: redactSourceReviewText(record.effectiveAsOf),
    lastReviewedAt: redactSourceReviewText(record.lastReviewedAt),
    nextReviewDueAt: redactSourceReviewText(record.nextReviewDueAt),
    nextAction: redactSourceReviewText(record.nextAction),
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };

  return { value: redacted, changed: JSON.stringify(redacted) !== JSON.stringify(record) };
}

function mapPossiblyChanged<T>(
  values: T[],
  mapper: (value: T) => { value: T; changed: boolean }
): { value: T[]; changed: boolean } {
  let changed = false;
  const mapped = values.map((value) => {
    const result = mapper(value);
    changed = changed || result.changed;
    return result.value;
  });

  return changed ? { value: mapped, changed: true } : { value: values, changed: false };
}

function mapStringsPossiblyChanged(values: string[]): { value: string[]; changed: boolean } {
  let changed = false;
  const mapped = values.map((value) => {
    const redacted = redactSourceReviewText(value);
    changed = changed || redacted !== value;
    return redacted;
  });

  return changed ? { value: mapped, changed: true } : { value: values, changed: false };
}

function redactSourceReviewText(value: string): string {
  return redactClassifiedText(value)
    .replace(
      /\b(?:api[_\-\s]?key|apiKey|secret[_\-\s]?key|secretKey|client[_\-\s]?secret|client secret|clientSecret|bearer token|bearerToken|access[_\-\s]?token|accessToken|refresh[_\-\s]?token|refreshToken|session[_\-\s]?token|sessionToken|webhook[_\-\s]?secret|webhookSecret|password|passphrase)\s*[:=]\s*\[redacted-secret\]/gi,
      "[redacted-secret]"
    )
    .replace(/raw[_\-\s]+kyc/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-\[redacted-raw-kyc\]\]/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-raw-kyc\]\s+(?:packet|file|document|upload|room|dump|csv|spreadsheet|passport|data)\b/gi, "[redacted-raw-kyc]")
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image|data)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}
