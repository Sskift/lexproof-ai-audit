import { redactDataBoundaryText } from "./dataBoundary";
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
  dataClass: "metadata-only" | "confidential" | "personal-data" | "raw-kyc" | "credential-material" | "private-key-material";
  action: RetentionPolicyActionType;
  severity: RetentionPolicySeverity;
  reason: string;
  redactedSnippet: string;
  retentionWindow: string;
  deletionTrigger: string;
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

type RetentionScanner = {
  dataClass: Exclude<RetentionPolicyAction["dataClass"], "metadata-only">;
  severity: Exclude<RetentionPolicySeverity, "info">;
  action: Exclude<RetentionPolicyActionType, "keep-metadata-only">;
  pattern: RegExp;
  reason: string;
  allowNegatedKyc?: boolean;
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Retention policy output is audit preparation metadata only.";
const METADATA_ONLY_RETENTION_WINDOW = "metadata-only until audit workspace deletion";
const RAW_MATERIAL_DELETION_TRIGGER = "delete or replace before Evidence Vault sync";

const scanners: RetentionScanner[] = [
  {
    dataClass: "private-key-material",
    severity: "block",
    action: "block-vault-sync",
    pattern: /0x[a-fA-F0-9]{64}/g,
    reason: "Private-key-like material cannot enter vault sync or retention exports."
  },
  {
    dataClass: "private-key-material",
    severity: "block",
    action: "block-vault-sync",
    pattern: /\b(seed phrase|mnemonic|private key)\b/gi,
    reason: "Secret phrase or private-key references must be removed before retention."
  },
  {
    dataClass: "credential-material",
    severity: "block",
    action: "block-vault-sync",
    pattern: /\bsk-(?:live|test|proj|[a-z0-9])[-_A-Za-z0-9]{12,}\b/g,
    reason: "Credential-like tokens must be removed before vault sync."
  },
  {
    dataClass: "credential-material",
    severity: "block",
    action: "block-vault-sync",
    pattern: /\b(api[_\-\s]?key|secret[_\-\s]?key|client secret|bearer token)\s*[:=]\s*[\w.\-]{8,}/gi,
    reason: "Credential fields must be removed before retention."
  },
  {
    dataClass: "raw-kyc",
    severity: "block",
    action: "block-vault-sync",
    pattern: /\b(raw\s+kyc|kyc\s+(packet|file|document|upload|room|dump|csv|spreadsheet))\b/gi,
    reason: "Raw KYC material must be deleted or replaced with metadata before vault sync.",
    allowNegatedKyc: true
  },
  {
    dataClass: "personal-data",
    severity: "warn",
    action: "review-before-vault-sync",
    pattern: /\b(passport\s+number|social security number|ssn|personal data|direct identifier|direct identifiers)\b/gi,
    reason: "Personal-data references require human confirmation before metadata-only sync."
  },
  {
    dataClass: "personal-data",
    severity: "warn",
    action: "review-before-vault-sync",
    pattern: /\bkyc\b/gi,
    reason: "KYC references require confirmation that only metadata is retained.",
    allowNegatedKyc: true
  },
  {
    dataClass: "confidential",
    severity: "warn",
    action: "review-before-vault-sync",
    pattern: /\b(confidential|privileged|attorney-client|internal only)\b/gi,
    reason: "Confidentiality labels require recipient and retention-scope review."
  }
];

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
  const matchedActions = scanners.flatMap((scanner) => {
    const matches = Array.from(sourceText.matchAll(scanner.pattern)).filter((match) => {
      return !scanner.allowNegatedKyc || !isNegatedKycReference(sourceText, match.index ?? 0);
    });

    if (matches.length === 0) {
      return [];
    }

    return [
      {
        evidenceLabel: createSafeLabel(item.label),
        evidenceStatus: item.status ?? "draft",
        owner: item.owner ?? "Founder",
        dataClass: scanner.dataClass,
        action: scanner.action,
        severity: scanner.severity,
        reason: scanner.reason,
        redactedSnippet: createMatchedRedactedSnippet(scanner.dataClass, matches[0][0]),
        retentionWindow: scanner.severity === "block" ? "none until remediated" : METADATA_ONLY_RETENTION_WINDOW,
        deletionTrigger: scanner.severity === "block" ? RAW_MATERIAL_DELETION_TRIGGER : "confirm metadata-only scope before handoff"
      } satisfies RetentionPolicyAction
    ];
  });

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
      "Confirm personal-data, KYC, or confidentiality references are metadata-only before sync.",
      "Keep raw files outside LexProof until a retention and deletion policy is approved."
    ];
  }

  return ["Evidence retention is metadata-only; continue to Evidence Vault sync when ready."];
}

function isNegatedKycReference(text: string, matchIndex: number): boolean {
  const windowStart = Math.max(0, matchIndex - 32);
  const windowEnd = Math.min(text.length, matchIndex + 48);
  const window = text.slice(windowStart, windowEnd).toLowerCase();
  return /\b(no|without|exclude|excluded|excludes|excluding|not)\b.{0,24}\b(raw\s+)?kyc\b/.test(window);
}

function createSafeLabel(label: string): string {
  const redacted = redactDataBoundaryText(label.trim() || "Untitled evidence");
  return redacted.length > 96 ? `${redacted.slice(0, 93)}...` : redacted;
}

function createMatchedRedactedSnippet(dataClass: RetentionPolicyAction["dataClass"], matchValue: string): string {
  const redacted = redactDataBoundaryText(matchValue.replace(/\s+/g, " ").trim());
  return `${dataClass}: ${redacted || "matched metadata"}`;
}

function createRedactedSnippet(text: string, matchIndex: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const start = Math.max(0, Math.min(matchIndex, normalized.length) - 52);
  const end = Math.min(normalized.length, start + 180);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${redactDataBoundaryText(normalized.slice(start, end))}${suffix}`;
}
