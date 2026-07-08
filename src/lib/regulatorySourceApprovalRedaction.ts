import { redactClassifiedText } from "./dataClassification";
import type { RegulatorySourceApprovalRecord, RegulatorySourceApprovalSyncResult } from "./phase2Types";
import type {
  ServerRegulatorySourceApprovalPacket,
  ServerRegulatorySourceApprovalPacketRecord
} from "./regulatorySourceApprovalSync";

const RECORD_BOUNDARY = "Not legal advice. Source approval records are audit preparation workflow metadata only." as const;
const SERVER_PACKET_BOUNDARY = "Not legal advice. Server Source Approval packets are audit preparation workflow metadata only." as const;
const legalConclusionPattern =
  /\b(final legal decision|legal opinion|legal conclusion|legally compliant|legally non-compliant|compliance decision|legal approval)\b/gi;

export function redactRegulatorySourceApprovalSyncResult(
  result: RegulatorySourceApprovalSyncResult
): RegulatorySourceApprovalSyncResult {
  const workspaceId = redactSourceApprovalText(result.workspaceId);
  const records = mapPossiblyChanged(result.records, redactSourceApprovalRecord);
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

export function redactRegulatorySourceApprovalRecords(records: RegulatorySourceApprovalRecord[]): RegulatorySourceApprovalRecord[] {
  const redacted = mapPossiblyChanged(records, redactSourceApprovalRecord);
  return redacted.changed ? redacted.value : records;
}

export function redactRegulatorySourceApprovalPacket(
  packet: ServerRegulatorySourceApprovalPacket
): ServerRegulatorySourceApprovalPacket {
  const workspaceId = redactSourceApprovalText(packet.workspaceId);
  const generatedAt = redactSourceApprovalText(packet.generatedAt);
  const records = mapPossiblyChanged(packet.records, redactSourceApprovalPacketRecord);
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

function redactSourceApprovalRecord(record: RegulatorySourceApprovalRecord): {
  value: RegulatorySourceApprovalRecord;
  changed: boolean;
} {
  const redacted = {
    ...record,
    id: redactSourceApprovalText(record.id),
    workspaceId: redactSourceApprovalText(record.workspaceId),
    sourceApprovalItemId: redactSourceApprovalText(record.sourceApprovalItemId),
    clauseId: redactSourceApprovalText(record.clauseId),
    jurisdiction: redactSourceApprovalText(record.jurisdiction),
    regulator: redactSourceApprovalText(record.regulator),
    citation: redactSourceApprovalText(record.citation),
    sourceName: redactSourceApprovalText(record.sourceName),
    sourceUrl: redactSourceApprovalText(record.sourceUrl),
    effectiveAsOf: redactSourceApprovalText(record.effectiveAsOf),
    lastReviewedAt: redactSourceApprovalText(record.lastReviewedAt),
    nextReviewDueAt: redactSourceApprovalText(record.nextReviewDueAt),
    reviewerNotes: redactSourceApprovalText(record.reviewerNotes),
    nextAction: redactSourceApprovalText(record.nextAction),
    createdBy: redactSourceApprovalText(record.createdBy),
    createdAt: redactSourceApprovalText(record.createdAt),
    notLegalAdviceBoundary: RECORD_BOUNDARY
  };

  return { value: redacted, changed: JSON.stringify(redacted) !== JSON.stringify(record) };
}

function redactSourceApprovalPacketRecord(record: ServerRegulatorySourceApprovalPacketRecord): {
  value: ServerRegulatorySourceApprovalPacketRecord;
  changed: boolean;
} {
  const redacted = {
    ...record,
    recordId: redactSourceApprovalText(record.recordId),
    sourceApprovalItemId: redactSourceApprovalText(record.sourceApprovalItemId),
    clauseId: redactSourceApprovalText(record.clauseId),
    jurisdiction: redactSourceApprovalText(record.jurisdiction),
    regulator: redactSourceApprovalText(record.regulator),
    citation: redactSourceApprovalText(record.citation),
    sourceName: redactSourceApprovalText(record.sourceName),
    sourceUrl: redactSourceApprovalText(record.sourceUrl),
    effectiveAsOf: redactSourceApprovalText(record.effectiveAsOf),
    lastReviewedAt: redactSourceApprovalText(record.lastReviewedAt),
    nextReviewDueAt: redactSourceApprovalText(record.nextReviewDueAt),
    nextAction: redactSourceApprovalText(record.nextAction),
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
    const redacted = redactSourceApprovalText(value);
    changed = changed || redacted !== value;
    return redacted;
  });

  return changed ? { value: mapped, changed: true } : { value: values, changed: false };
}

function redactSourceApprovalText(value: string): string {
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
