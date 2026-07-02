import type { ChainAnchorPolicyReport } from "./chainAnchorPolicy.js";
import type { DocumentParserPolicyReport } from "./documentParserPolicy.js";
import type { GrcDestinationPolicyReport } from "./grcDestinationPolicy.js";
import type { ObjectStoragePolicyReport } from "./objectStoragePolicy.js";

export type IntegrationPolicyId = "object-storage" | "document-parser" | "chain-anchor" | "grc-destination";
type IntegrationPolicyEvaluationStatus = "ready" | "needs-policy" | "blocked" | "disabled";

export type IntegrationPolicyEvaluationRecord = {
  recordVersion: "lexproof-integration-policy-evaluation-record-v1";
  id: string;
  workspaceId: string;
  policyId: IntegrationPolicyId;
  reportVersion: string;
  overallStatus: Extract<IntegrationPolicyEvaluationStatus, "ready" | "needs-policy" | "blocked">;
  approvedControlCount: number;
  requiredControlCount: number;
  externalCapabilityAllowed: false;
  externalCapabilityStatus: string;
  reportHash: string;
  contextHash: string;
  policyHash: string;
  evaluatorId: string;
  source: "server";
  createdAt: string;
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only.";
};

export type IntegrationPolicyEvaluationReport =
  | ObjectStoragePolicyReport
  | DocumentParserPolicyReport
  | ChainAnchorPolicyReport
  | GrcDestinationPolicyReport;

export type CreateIntegrationPolicyEvaluationRecordInput = {
  workspaceId: string;
  policyId: IntegrationPolicyId;
  report: IntegrationPolicyEvaluationReport;
  context: Record<string, unknown>;
  policy: Record<string, unknown>;
  evaluatorId?: string;
  createdAt?: string;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Integration policy evaluation records are audit preparation metadata only." as const;

export async function createIntegrationPolicyEvaluationRecord({
  workspaceId,
  policyId,
  report,
  context,
  policy,
  evaluatorId = "Integration policy evaluator",
  createdAt = new Date().toISOString()
}: CreateIntegrationPolicyEvaluationRecordInput): Promise<IntegrationPolicyEvaluationRecord> {
  const normalizedWorkspaceId = sanitize(workspaceId);
  if (!normalizedWorkspaceId) {
    throw new Error("Workspace ID is required for integration policy evaluation records.");
  }

  const summary = summarizePolicyReport(policyId, report);
  const reportHash = await sha256Hex(stableStringify(summary.hashReport));
  const contextHash = await sha256Hex(stableStringify(redactMetadataObject(context)));
  const policyHash = await sha256Hex(stableStringify(redactMetadataObject(policy)));
  const idHash = await sha256Hex(
    stableStringify({
      workspaceId: normalizedWorkspaceId,
      policyId,
      reportHash,
      contextHash,
      policyHash,
      createdAt
    })
  );

  return {
    recordVersion: "lexproof-integration-policy-evaluation-record-v1",
    id: `integration-policy-evaluation-${idHash.slice(0, 16)}`,
    workspaceId: normalizedWorkspaceId,
    policyId,
    reportVersion: summary.reportVersion,
    overallStatus: summary.overallStatus,
    approvedControlCount: summary.approvedControlCount,
    requiredControlCount: summary.requiredControlCount,
    externalCapabilityAllowed: false,
    externalCapabilityStatus: summary.externalCapabilityStatus,
    reportHash,
    contextHash,
    policyHash,
    evaluatorId: sanitize(evaluatorId) || "Integration policy evaluator",
    source: "server",
    createdAt,
    nextActions: summary.nextActions,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function isIntegrationPolicyEvaluationRecord(value: unknown): value is IntegrationPolicyEvaluationRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.recordVersion === "lexproof-integration-policy-evaluation-record-v1" &&
    typeof value.id === "string" &&
    typeof value.workspaceId === "string" &&
    isIntegrationPolicyId(value.policyId) &&
    typeof value.reportVersion === "string" &&
    (value.overallStatus === "ready" || value.overallStatus === "needs-policy" || value.overallStatus === "blocked") &&
    typeof value.approvedControlCount === "number" &&
    typeof value.requiredControlCount === "number" &&
    value.externalCapabilityAllowed === false &&
    typeof value.externalCapabilityStatus === "string" &&
    isSha256(value.reportHash) &&
    isSha256(value.contextHash) &&
    isSha256(value.policyHash) &&
    typeof value.evaluatorId === "string" &&
    value.source === "server" &&
    typeof value.createdAt === "string" &&
    Array.isArray(value.nextActions) &&
    value.nextActions.every((item) => typeof item === "string") &&
    value.notLegalAdviceBoundary === NOT_LEGAL_ADVICE
  );
}

function summarizePolicyReport(policyId: IntegrationPolicyId, report: IntegrationPolicyEvaluationReport) {
  const reportVersion = sanitize(report.reportVersion);
  const overallStatus = normalizeStatus(report.overallStatus);
  const approvedControlCount = safeCount(report.approvedControlCount);
  const requiredControlCount = safeCount(report.requiredControlCount);
  const nextActions = report.nextActions.map(sanitize).filter(Boolean);
  const externalCapabilityStatus = getExternalCapabilityStatus(policyId, report);

  return {
    reportVersion,
    overallStatus,
    approvedControlCount,
    requiredControlCount,
    externalCapabilityStatus,
    nextActions,
    hashReport: {
      reportVersion,
      overallStatus,
      approvedControlCount,
      requiredControlCount,
      externalCapabilityStatus,
      controls: report.controls.map((control: IntegrationPolicyEvaluationReport["controls"][number]) => ({
        id: sanitize(control.id),
        status: normalizeStatus(control.status),
        label: sanitize(control.label),
        evidence: sanitize(control.evidence),
        recoveryAction: sanitize(control.recoveryAction)
      })),
      nextActions
    }
  };
}

function getExternalCapabilityStatus(policyId: IntegrationPolicyId, report: IntegrationPolicyEvaluationReport): string {
  if (policyId === "object-storage" && "externalObjectStorageStatus" in report) {
    return sanitize(report.externalObjectStorageStatus);
  }
  if (policyId === "document-parser" && "externalDocumentParsingStatus" in report) {
    return sanitize(report.externalDocumentParsingStatus);
  }
  if (policyId === "chain-anchor" && "externalChainAnchoringStatus" in report) {
    return sanitize(report.externalChainAnchoringStatus);
  }
  if (policyId === "grc-destination" && "externalGrcTicketCreationStatus" in report) {
    return sanitize(report.externalGrcTicketCreationStatus);
  }

  return "blocked-by-metadata";
}

function redactMetadataObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isUnsafeKey(key))
      .map(([key, item]) => [key, redactValue(item)])
  );
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitize(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (isRecord(value)) {
    return redactMetadataObject(value);
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  return "";
}

function isUnsafeKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("apikey") ||
    normalized.includes("api_key") ||
    normalized.includes("secret") ||
    normalized.includes("privatekey") ||
    normalized.includes("private_key") ||
    normalized.includes("rawevidence") ||
    normalized.includes("rawdocument") ||
    normalized.includes("rawkyc") ||
    normalized.includes("signedtransaction")
  );
}

function normalizeStatus(
  status: IntegrationPolicyEvaluationStatus
): Extract<IntegrationPolicyEvaluationStatus, "ready" | "needs-policy" | "blocked"> {
  if (status === "ready" || status === "needs-policy" || status === "blocked") {
    return status;
  }
  return "blocked";
}

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function sanitize(value: string): string {
  return value
    .replace(/sk-[a-z0-9_-]{12,}/gi, "[redacted-credential]")
    .replace(/0x[a-f0-9]{40,}/gi, "[redacted-private-key-or-wallet-material]")
    .replace(/\b(passport|ssn|seed phrase|private key|api key)\b/gi, "[redacted-sensitive-material]")
    .trim();
}

function isIntegrationPolicyId(value: unknown): value is IntegrationPolicyId {
  return value === "object-storage" || value === "document-parser" || value === "chain-anchor" || value === "grc-destination";
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
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
  if (isRecord(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
