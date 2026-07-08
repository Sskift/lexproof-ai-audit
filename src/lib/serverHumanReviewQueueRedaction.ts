import { redactClassifiedText } from "./dataClassification";
import type { HumanReviewRecord } from "./phase2Types";
import type {
  ServerHumanReviewQueueFilters,
  ServerHumanReviewQueueView,
  ServerHumanReviewRecoveryItem,
  ServerHumanReviewRecoveryPacket
} from "./serverHumanReviewQueue";

const legalConclusionPattern =
  /\b(final[_\-\s]+legal[_\-\s]+decision|legal[_\-\s]+opinion|legal[_\-\s]+conclusion|legal[_\-\s]+approval|legally[_\-\s]+compliant|legally[_\-\s]+non[_\-\s]+compliant|compliance[_\-\s]+decision)\b/gi;

export function redactServerHumanReviewQueueView(view: ServerHumanReviewQueueView): ServerHumanReviewQueueView {
  return {
    ...view,
    workspaceId: redactHumanReviewQueueText(view.workspaceId),
    filters: redactServerHumanReviewQueueFilters(view.filters),
    reviewerCounts: redactReviewerCounts(view.reviewerCounts),
    nextActions: view.nextActions.map(redactHumanReviewQueueText),
    recoveryPacket: redactServerHumanReviewRecoveryPacket(view.recoveryPacket),
    items: view.items.map(redactHumanReviewRecord)
  };
}

function redactServerHumanReviewQueueFilters(
  filters: ServerHumanReviewQueueFilters
): ServerHumanReviewQueueFilters {
  return {
    ...filters,
    ...(filters.reviewerId === undefined ? {} : { reviewerId: redactHumanReviewQueueText(filters.reviewerId) })
  };
}

export function redactServerHumanReviewRecoveryPacket(
  packet: ServerHumanReviewRecoveryPacket
): ServerHumanReviewRecoveryPacket {
  return {
    ...packet,
    workspaceId: redactHumanReviewQueueText(packet.workspaceId),
    generatedAt: redactHumanReviewQueueText(packet.generatedAt),
    summary: {
      ...packet.summary,
      nextAction: redactHumanReviewQueueText(packet.summary.nextAction)
    },
    nextActions: packet.nextActions.map(redactHumanReviewQueueText),
    items: packet.items.map(redactServerHumanReviewRecoveryItem)
  };
}

function redactServerHumanReviewRecoveryItem(item: ServerHumanReviewRecoveryItem): ServerHumanReviewRecoveryItem {
  return {
    ...item,
    id: redactHumanReviewQueueText(item.id),
    workspaceId: redactHumanReviewQueueText(item.workspaceId),
    targetId: redactHumanReviewQueueText(item.targetId),
    targetLabel: redactHumanReviewQueueText(item.targetLabel),
    reviewerId: redactHumanReviewQueueText(item.reviewerId),
    reviewerComment: redactHumanReviewQueueText(item.reviewerComment),
    createdAt: redactHumanReviewQueueText(item.createdAt),
    updatedAt: redactHumanReviewQueueText(item.updatedAt),
    recoveryAction: redactHumanReviewQueueText(item.recoveryAction)
  };
}

function redactHumanReviewRecord(record: HumanReviewRecord): HumanReviewRecord {
  return {
    ...record,
    id: redactHumanReviewQueueText(record.id),
    workspaceId: redactHumanReviewQueueText(record.workspaceId),
    targetId: redactHumanReviewQueueText(record.targetId),
    reviewerId: redactHumanReviewQueueText(record.reviewerId),
    comment: redactHumanReviewQueueText(record.comment),
    createdAt: redactHumanReviewQueueText(record.createdAt),
    updatedAt: redactHumanReviewQueueText(record.updatedAt)
  };
}

function redactReviewerCounts(reviewerCounts: Record<string, number>): Record<string, number> {
  return Object.entries(reviewerCounts).reduce<Record<string, number>>((counts, [reviewerId, count]) => {
    const safeReviewerId = redactHumanReviewQueueText(reviewerId) || "redacted-reviewer";
    counts[safeReviewerId] = (counts[safeReviewerId] ?? 0) + count;
    return counts;
  }, {});
}

function redactHumanReviewQueueText(value: string): string {
  return redactClassifiedText(value)
    .replace(
      /\b(?:api[_\-\s]?key|apiKey|secret[_\-\s]?key|secretKey|client[_\-\s]?secret|client secret|clientSecret|bearer token|bearerToken|access[_\-\s]?token|accessToken|refresh[_\-\s]?token|refreshToken|session[_\-\s]?token|sessionToken|webhook[_\-\s]?secret|webhookSecret|password|passphrase)\s*[:=]\s*\[redacted-secret\]/gi,
      "[redacted-secret]"
    )
    .replace(/\[redacted-\[redacted-raw-kyc\]\]/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-raw-kyc\](?:\s+(?:packet|file|document|upload|room|dump|csv|spreadsheet|passport|data)\b)+/gi, "[redacted-raw-kyc]")
    .replace(/\bprivate\s+key\s+\[redacted-private-key\]/gi, "[redacted-private-key]")
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image|data)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}
