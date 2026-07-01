import type { FastifyInstance } from "fastify";
import {
  createObjectStoragePolicyReport,
  type ObjectStoragePolicyContext,
  type ObjectStoragePolicyDraft
} from "../src/lib/objectStoragePolicy.js";

type ObjectStoragePolicyRequestBody = {
  context?: unknown;
  policy?: unknown;
};

export function registerIntegrationPolicyRoutes(server: FastifyInstance): void {
  server.post<{ Body: ObjectStoragePolicyRequestBody }>("/api/integrations/object-storage/policy", async (request) =>
    createObjectStoragePolicyReport({
      context: toObjectStoragePolicyContext(request.body?.context),
      policy: toObjectStoragePolicyDraft(request.body?.policy)
    })
  );
}

function toObjectStoragePolicyContext(value: unknown): ObjectStoragePolicyContext {
  const context = isRecord(value) ? value : {};

  return {
    workspaceId: stringField(context.workspaceId),
    evidenceCount: numberField(context.evidenceCount),
    retentionStatus: isRetentionPolicyStatus(context.retentionStatus) ? context.retentionStatus : "needs-review",
    vaultSyncAllowed: context.vaultSyncAllowed === true,
    blockerCount: numberField(context.blockerCount),
    manifestHash: stringField(context.manifestHash) || undefined
  };
}

function toObjectStoragePolicyDraft(value: unknown): ObjectStoragePolicyDraft {
  const policy = isRecord(value) ? value : {};

  return {
    policyOwner: stringField(policy.policyOwner),
    retentionDays: numberField(policy.retentionDays),
    deletionSlaDays: numberField(policy.deletionSlaDays),
    encryptionAtRestApproved: policy.encryptionAtRestApproved === true,
    bucketAllowlistApproved: policy.bucketAllowlistApproved === true,
    accessLoggingApproved: policy.accessLoggingApproved === true,
    lifecyclePolicyApproved: policy.lifecyclePolicyApproved === true,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: stringField(policy.notes)
  };
}

function isRetentionPolicyStatus(value: unknown): value is ObjectStoragePolicyContext["retentionStatus"] {
  return value === "ready" || value === "needs-review" || value === "blocked";
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberField(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
