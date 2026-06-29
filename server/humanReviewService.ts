import { createHash } from "node:crypto";
import type { HumanReviewRecord } from "../src/lib/phase2Types.js";

export type CreateHumanReviewInput = {
  workspaceId: string;
  targetType: HumanReviewRecord["targetType"];
  targetId: string;
  reviewerId: string;
  comment: string;
  createdAt?: string;
};

export type UpdateHumanReviewInput = {
  status?: HumanReviewRecord["status"];
  comment?: string;
  reviewerId?: string;
  updatedAt?: string;
};

export type HumanReviewValidationResult = {
  valid: boolean;
  errors: string[];
};

export function createHumanReviewRecord(input: CreateHumanReviewInput): HumanReviewRecord {
  const validation = validateHumanReviewInput(input);

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const idHash = createHash("sha256")
    .update([input.workspaceId, input.targetType, input.targetId, input.reviewerId, createdAt].join("|"))
    .digest("hex");

  return {
    recordVersion: "lexproof-human-review-record-v1",
    id: `human-review-${idHash.slice(0, 16)}`,
    workspaceId: input.workspaceId,
    targetType: input.targetType,
    targetId: input.targetId.trim(),
    reviewerId: input.reviewerId.trim(),
    status: "requested",
    comment: input.comment.trim(),
    createdAt,
    updatedAt: createdAt,
    notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
  };
}

export function updateHumanReviewRecord(record: HumanReviewRecord, input: UpdateHumanReviewInput): HumanReviewRecord {
  return {
    ...record,
    status: input.status ?? record.status,
    comment: input.comment?.trim() ?? record.comment,
    reviewerId: input.reviewerId?.trim() ?? record.reviewerId,
    updatedAt: input.updatedAt ?? new Date().toISOString()
  };
}

export function validateHumanReviewInput(input: CreateHumanReviewInput): HumanReviewValidationResult {
  const errors: string[] = [];

  if (!input.workspaceId.trim()) {
    errors.push("Workspace ID is required.");
  }

  if (!input.targetId.trim()) {
    errors.push("Human review target ID is required.");
  }

  if (!input.reviewerId.trim()) {
    errors.push("Human review reviewer ID is required.");
  }

  return { valid: errors.length === 0, errors };
}
