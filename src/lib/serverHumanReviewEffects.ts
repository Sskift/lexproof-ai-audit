import type { EvidenceVaultStatus, HumanReviewRecord, ModelGatewayRun } from "./phase2Types.js";

export type EvidenceVaultStatusEffectFromHumanReview = {
  targetEvidenceId: string;
  nextStatus: EvidenceVaultStatus;
  summary: string;
  notLegalAdviceBoundary: "Not legal advice. Human review effects update audit preparation workflow metadata only.";
};

export type ModelGatewayReviewStatusEffectFromHumanReview = {
  targetRunId: string;
  nextStatus: ModelGatewayRun["humanReviewStatus"];
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

export function createModelGatewayReviewStatusEffectFromHumanReview(
  review: HumanReviewRecord
): ModelGatewayReviewStatusEffectFromHumanReview | null {
  if (review.targetType !== "model-run") {
    return null;
  }

  const targetRunId = review.targetId.trim();
  if (!targetRunId) {
    return null;
  }

  const nextStatus = mapHumanReviewStatusToModelGatewayStatus(review.status);

  return {
    targetRunId,
    nextStatus,
    summary: createModelGatewayEffectSummary(review.status, nextStatus),
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

function mapHumanReviewStatusToModelGatewayStatus(status: HumanReviewRecord["status"]): ModelGatewayRun["humanReviewStatus"] {
  if (status === "reviewed") {
    return "reviewed";
  }

  if (status === "rejected") {
    return "rejected";
  }

  return "needs-review";
}

function createModelGatewayEffectSummary(
  status: HumanReviewRecord["status"],
  nextStatus: ModelGatewayRun["humanReviewStatus"]
): string {
  if (status === "reviewed") {
    return "Human Review marked model run reviewed for audit-prep reliance.";
  }

  if (status === "rejected") {
    return "Human Review rejected model run output; keep it out of audit-prep reliance.";
  }

  if (status === "under-review") {
    return "Human Review is still reviewing model run output.";
  }

  if (status === "needs-more-evidence") {
    return "Human Review needs more evidence before model run reliance.";
  }

  return `Human Review set model run workflow to ${nextStatus}.`;
}
