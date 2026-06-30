import type { EvidenceVaultStatus, HumanReviewRecord } from "./phase2Types.js";

export type EvidenceVaultStatusEffectFromHumanReview = {
  targetEvidenceId: string;
  nextStatus: EvidenceVaultStatus;
  summary: string;
  notLegalAdviceBoundary: "Not legal advice. Human review effects update audit preparation workflow metadata only.";
};

const NOT_LEGAL_ADVICE_BOUNDARY = "Not legal advice. Human review effects update audit preparation workflow metadata only.";

export function createEvidenceVaultStatusEffectFromHumanReview(
  review: HumanReviewRecord
): EvidenceVaultStatusEffectFromHumanReview | null {
  if (review.targetType !== "evidence") {
    return null;
  }

  const targetEvidenceId = review.targetId.trim();
  if (!targetEvidenceId) {
    return null;
  }

  const nextStatus = mapHumanReviewStatusToEvidenceVaultStatus(review.status);

  return {
    targetEvidenceId,
    nextStatus,
    summary: createEvidenceStatusEffectSummary(review.status, nextStatus),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
}

function mapHumanReviewStatusToEvidenceVaultStatus(status: HumanReviewRecord["status"]): EvidenceVaultStatus {
  if (status === "reviewed") {
    return "verified";
  }

  if (status === "needs-more-evidence" || status === "requested") {
    return "requested";
  }

  if (status === "under-review") {
    return "under-review";
  }

  return "rejected";
}

function createEvidenceStatusEffectSummary(status: HumanReviewRecord["status"], nextStatus: EvidenceVaultStatus): string {
  if (status === "needs-more-evidence") {
    return "Human Review requested more evidence; returned Evidence Vault record to requested.";
  }

  if (status === "reviewed") {
    return "Human Review marked evidence reviewed; moved Evidence Vault record to verified.";
  }

  if (status === "under-review") {
    return "Human Review started evidence review; moved Evidence Vault record to under-review.";
  }

  if (status === "rejected") {
    return "Human Review rejected evidence; moved Evidence Vault record to rejected for replacement recovery.";
  }

  return `Human Review set evidence workflow to ${nextStatus}.`;
}
