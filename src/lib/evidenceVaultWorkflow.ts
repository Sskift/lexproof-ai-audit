import type { EvidenceVaultStatus } from "./phase2Types.js";

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Evidence status transitions are audit preparation workflow metadata only.";

export type EvidenceVaultStatusTransitionResult =
  | { valid: true }
  | {
      valid: false;
      error: string;
      recoveryAction: string;
      notLegalAdviceBoundary: typeof NOT_LEGAL_ADVICE_BOUNDARY;
    };

const ALLOWED_TRANSITIONS: Record<EvidenceVaultStatus, EvidenceVaultStatus[]> = {
  draft: ["requested", "received", "rejected"],
  requested: ["received", "submitted", "rejected"],
  submitted: ["received", "under-review", "rejected"],
  received: ["requested", "under-review", "verified", "rejected"],
  "under-review": ["requested", "verified", "rejected"],
  verified: ["under-review", "rejected"],
  rejected: [],
  superseded: []
};

export function validateEvidenceVaultStatusTransition(
  currentStatus: EvidenceVaultStatus,
  nextStatus: EvidenceVaultStatus
): EvidenceVaultStatusTransitionResult {
  if (currentStatus === nextStatus) {
    return { valid: true };
  }

  if (nextStatus === "superseded") {
    return createInvalidTransition(
      "Superseded status is created only by the rejected-evidence replacement flow.",
      "Use the Evidence Vault replacement endpoint so the new record and superseded parent are written together."
    );
  }

  if (currentStatus === "superseded") {
    return createInvalidTransition(
      "Superseded Evidence Vault records cannot be reactivated.",
      "Use the active replacement record or upload a new replacement after review."
    );
  }

  if (currentStatus === "rejected") {
    return createInvalidTransition(
      `Rejected Evidence Vault records cannot be directly moved to ${nextStatus}.`,
      "Upload a replacement from the rejected evidence recovery flow so parent/child lineage is preserved."
    );
  }

  if (ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
    return { valid: true };
  }

  return createInvalidTransition(
    `Evidence Vault status cannot move from ${currentStatus} to ${nextStatus}.`,
    "Move the evidence through the requested, received, and under-review workflow before closing review."
  );
}

function createInvalidTransition(error: string, recoveryAction: string): EvidenceVaultStatusTransitionResult {
  return {
    valid: false,
    error,
    recoveryAction,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}
