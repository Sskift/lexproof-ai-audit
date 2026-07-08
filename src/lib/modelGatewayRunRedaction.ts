import { redactClassifiedText } from "./dataClassification.js";
import type { ModelGatewayRunRecoveryPacket, ModelGatewayRunRecoveryPacketItem } from "./modelGatewayRunReceipt.js";
import type { ModelGatewayRun, ModelGatewayRunSummary } from "./phase2Types.js";

const legalConclusionPattern =
  /\b(final[_\-\s]+legal[_\-\s]+decision|legal[_\-\s]+opinion|legal[_\-\s]+conclusion|legal[_\-\s]+approval|legally[_\-\s]+compliant|legally[_\-\s]+non[_\-\s]+compliant|compliance[_\-\s]+decision)\b/gi;

export function redactModelGatewayRunSummary(summary: ModelGatewayRunSummary): ModelGatewayRunSummary {
  return {
    ...summary,
    id: redactModelGatewayRunText(summary.id),
    providerLabel: redactModelGatewayRunText(summary.providerLabel),
    model: redactModelGatewayRunText(summary.model),
    ...(summary.errorCode === undefined ? {} : { errorCode: redactModelGatewayRunText(summary.errorCode) }),
    ...(summary.errorMessage === undefined ? {} : { errorMessage: redactModelGatewayRunText(summary.errorMessage) }),
    remediationSteps: summary.remediationSteps.map(redactModelGatewayRunText)
  };
}

export function redactModelGatewayRun(run: ModelGatewayRun): ModelGatewayRun {
  return {
    ...run,
    id: redactModelGatewayRunText(run.id),
    workspaceId: redactModelGatewayRunText(run.workspaceId),
    providerLabel: redactModelGatewayRunText(run.providerLabel),
    model: redactModelGatewayRunText(run.model),
    purpose: redactModelGatewayRunText(run.purpose),
    providerMetadata: {
      ...run.providerMetadata,
      allowedDataClasses: run.providerMetadata.allowedDataClasses.map(redactModelGatewayRunText)
    },
    ...(run.errorCode === undefined ? {} : { errorCode: redactModelGatewayRunText(run.errorCode) }),
    ...(run.errorMessage === undefined ? {} : { errorMessage: redactModelGatewayRunText(run.errorMessage) }),
    remediationSteps: run.remediationSteps.map(redactModelGatewayRunText),
    createdAt: redactModelGatewayRunText(run.createdAt),
    ...(run.completedAt === undefined ? {} : { completedAt: redactModelGatewayRunText(run.completedAt) })
  };
}

export function redactModelGatewayRunRecoveryPacket(packet: ModelGatewayRunRecoveryPacket): ModelGatewayRunRecoveryPacket {
  return {
    ...packet,
    workspaceId: redactModelGatewayRunText(packet.workspaceId),
    generatedAt: redactModelGatewayRunText(packet.generatedAt),
    ...(packet.latestRunId === undefined ? {} : { latestRunId: redactModelGatewayRunText(packet.latestRunId) }),
    nextActions: packet.nextActions.map(redactModelGatewayRunText),
    items: packet.items.map(redactModelGatewayRunRecoveryPacketItem)
  };
}

function redactModelGatewayRunRecoveryPacketItem(
  item: ModelGatewayRunRecoveryPacketItem
): ModelGatewayRunRecoveryPacketItem {
  return {
    ...item,
    runId: redactModelGatewayRunText(item.runId),
    providerLabel: redactModelGatewayRunText(item.providerLabel),
    model: redactModelGatewayRunText(item.model),
    recoveryAction: redactModelGatewayRunText(item.recoveryAction),
    ...(item.errorCode === undefined ? {} : { errorCode: redactModelGatewayRunText(item.errorCode) }),
    ...(item.errorMessage === undefined ? {} : { errorMessage: redactModelGatewayRunText(item.errorMessage) }),
    remediationSteps: item.remediationSteps.map(redactModelGatewayRunText),
    ...(item.createdAt === undefined ? {} : { createdAt: redactModelGatewayRunText(item.createdAt) }),
    ...(item.completedAt === undefined ? {} : { completedAt: redactModelGatewayRunText(item.completedAt) })
  };
}

export function redactModelGatewayRunText(value: string): string {
  return redactClassifiedText(value)
    .replace(
      /\b(?:api[_\-\s]?key|apiKey|secret[_\-\s]?key|secretKey|client[_\-\s]?secret|client secret|clientSecret|bearer token|bearerToken|access[_\-\s]?token|accessToken|refresh[_\-\s]?token|refreshToken|session[_\-\s]?token|sessionToken|webhook[_\-\s]?secret|webhookSecret|password|passphrase)\s*[:=]\s*\[redacted-secret\]/gi,
      "[redacted-secret]"
    )
    .replace(/raw[_\-\s]+kyc/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-\[redacted-raw-kyc\]\]/gi, "[redacted-raw-kyc]")
    .replace(/\[redacted-raw-kyc\]\s+(?:packet|file|document|upload|room|dump|csv|spreadsheet|passport|data)\b/gi, "[redacted-raw-kyc]")
    .replace(/\bprivate\s+key\s+\[redacted-private-key\]/gi, "[redacted-private-key]")
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image|data)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}
