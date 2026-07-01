import { redactDataBoundaryText } from "./dataBoundary";
import {
  classifyDataBoundaryText,
  type ClassifiedDataClass,
  type ClassifiedDataFinding,
  type ClassifiedDataSeverity
} from "./dataClassification";
import type { EvidenceItem } from "./projectModel";

export type RetentionPolicyStatus = "ready" | "needs-review" | "blocked";

export type RetentionPolicySeverity = "info" | "warn" | "block";

export type RetentionPolicyActionType =
  | "keep-metadata-only"
  | "review-before-vault-sync"
  | "block-vault-sync";

export type RetentionPolicyAction = {
  evidenceLabel: string;
  evidenceStatus: string;
  owner: string;
  dataClass: "metadata-only" | Exclude<ClassifiedDataClass, "public">;
  action: RetentionPolicyActionType;
  severity: RetentionPolicySeverity;
  reason: string;
  redactedSnippet: string;
  retentionWindow: string;
  deletionTrigger: string;
};

type RetentionDataClass = Exclude<ClassifiedDataClass, "public">;

type RetentionDataFinding = ClassifiedDataFinding & {
  dataClass: RetentionDataClass;
};

export type RetentionPolicyReport = {
  reportVersion: "lexproof-retention-policy-v1";
  workspaceId: string;
  status: RetentionPolicyStatus;
  vaultSyncAllowed: boolean;
  evidenceCount: number;
  readyCount: number;
  reviewCount: number;
  blockerCount: number;
  actions: RetentionPolicyAction[];
  nextSteps: string[];
  notLegalAdviceBoundary: "Not legal advice. Retention policy output is audit preparation metadata only.";
};

export type RetentionPolicyInput = {
  workspaceId: string;
  evidenceItems: EvidenceItem[];
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Retention policy output is audit preparation metadata only.";
const METADATA_ONLY_RETENTION_WINDOW = "metadata-only until audit workspace deletion";
const RAW_MATERIAL_DELETION_TRIGGER = "delete or replace before Evidence Vault sync";

export function createRetentionPolicyReport(input: RetentionPolicyInput): RetentionPolicyReport {
  const actions =
    input.evidenceItems.length > 0 ? input.evidenceItems.flatMap(createRetentionActionsForEvidence) : [createEmptyEvidenceAction()];
  const blockerCount = actions.filter((action) => action.severity === "block").length;
  const reviewCount = actions.filter((action) => action.severity === "warn").length;
  const readyCount = actions.filter((action) => action.severity === "info").length;
  const status: RetentionPolicyStatus =
    blockerCount > 0 ? "blocked" : reviewCount > 0 || input.evidenceItems.length === 0 ? "needs-review" : "ready";

  return {
    reportVersion: "lexproof-retention-policy-v1",
    workspaceId: input.workspaceId.trim() || "local-workspace",
    status,
    vaultSyncAllowed: input.evidenceItems.length > 0 && blockerCount === 0,
    evidenceCount: input.evidenceItems.length,
    readyCount,
    reviewCount,
    blockerCount,
    actions,
    nextSteps: createNextSteps(status, input.evidenceItems.length),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

export function exportRetentionPolicyJson(report: RetentionPolicyReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function downloadRetentionPolicyJson(filename: string, report: RetentionPolicyReport): void {
  const blob = new Blob([exportRetentionPolicyJson(report)], { type: "application/json;charset=utf-8" });
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

function createRetentionActionsForEvidence(item: EvidenceItem): RetentionPolicyAction[] {
  const sourceText = [item.label, item.kind, item.source, item.status, item.owner, item.content].filter(Boolean).join(" ");
  const matchedActions = classifyDataBoundaryText(sourceText)
    .filter(isRetentionDataFinding)
    .map((finding) => createRetentionActionFromFinding(item, finding));

  if (matchedActions.length > 0) {
    return matchedActions;
  }

  return [
    {
      evidenceLabel: createSafeLabel(item.label),
      evidenceStatus: item.status ?? "draft",
      owner: item.owner ?? "Founder",
      dataClass: "metadata-only",
      action: "keep-metadata-only",
      severity: "info",
      reason: "Evidence can remain as metadata-only retention material.",
      redactedSnippet: createRedactedSnippet(sourceText, 0),
      retentionWindow: METADATA_ONLY_RETENTION_WINDOW,
      deletionTrigger: "delete with audit workspace or superseded evidence record"
    }
  ];
}

function createEmptyEvidenceAction(): RetentionPolicyAction {
  return {
    evidenceLabel: "No evidence",
    evidenceStatus: "empty",
    owner: "unassigned",
    dataClass: "metadata-only",
    action: "review-before-vault-sync",
    severity: "warn",
    reason: "Add metadata-only evidence before vault sync.",
    redactedSnippet: "No evidence records have been added.",
    retentionWindow: "none",
    deletionTrigger: "add evidence before retention starts"
  };
}

function createNextSteps(status: RetentionPolicyStatus, evidenceCount: number): string[] {
  if (evidenceCount === 0) {
    return ["Add metadata-only evidence before Evidence Vault sync."];
  }

  if (status === "blocked") {
    return [
      "Resolve retention blockers before starting Evidence Vault sync.",
      "Remove raw KYC, private-key-like material, and credentials or replace them with metadata-only summaries."
    ];
  }

  if (status === "needs-review") {
    return [
      "Confirm wallet-address, personal-data, KYC, or confidentiality references are metadata-only before sync.",
      "Keep raw files outside LexProof until a retention and deletion policy is approved."
    ];
  }

  return ["Evidence retention is metadata-only; continue to Evidence Vault sync when ready."];
}

function createSafeLabel(label: string): string {
  const redacted = redactDataBoundaryText(label.trim() || "Untitled evidence");
  return redacted.length > 96 ? `${redacted.slice(0, 93)}...` : redacted;
}

function createRetentionActionFromFinding(
  item: EvidenceItem,
  finding: RetentionDataFinding
): RetentionPolicyAction {
  const severity = mapRetentionSeverity(finding.severity);

  return {
    evidenceLabel: createSafeLabel(item.label),
    evidenceStatus: item.status ?? "draft",
    owner: item.owner ?? "Founder",
    dataClass: finding.dataClass,
    action: severity === "block" ? "block-vault-sync" : "review-before-vault-sync",
    severity,
    reason: createRetentionReason(finding.dataClass, finding.message),
    redactedSnippet: `${finding.dataClass}: ${finding.redactedSnippet || "matched metadata"}`,
    retentionWindow: severity === "block" ? "none until remediated" : METADATA_ONLY_RETENTION_WINDOW,
    deletionTrigger: severity === "block" ? RAW_MATERIAL_DELETION_TRIGGER : "confirm metadata-only scope before handoff"
  };
}

function mapRetentionSeverity(severity: ClassifiedDataSeverity): RetentionPolicySeverity {
  return severity === "block" ? "block" : "warn";
}

function createRetentionReason(dataClass: RetentionDataClass, fallback: string): string {
  switch (dataClass) {
    case "private-key-material":
      return "Private-key-like material cannot enter vault sync or retention exports.";
    case "credential-material":
      return "Credential-like material must be removed before vault sync.";
    case "raw-kyc":
      return "Raw KYC material must be deleted or replaced with metadata before vault sync.";
    case "wallet-address":
      return "Wallet addresses can be linkable Web3 identifiers and require human confirmation before metadata-only sync.";
    case "personal-data":
      return "Personal-data references require human confirmation before metadata-only sync.";
    case "confidential":
      return "Confidentiality labels require recipient and retention-scope review.";
    default:
      return fallback;
  }
}

function isRetentionDataFinding(finding: ClassifiedDataFinding): finding is RetentionDataFinding {
  return finding.dataClass !== "public";
}

function createRedactedSnippet(text: string, matchIndex: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const start = Math.max(0, Math.min(matchIndex, normalized.length) - 52);
  const end = Math.min(normalized.length, start + 180);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${redactDataBoundaryText(normalized.slice(start, end))}${suffix}`;
}
