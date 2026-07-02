import type { FastifyInstance } from "fastify";
import { createApiErrorResponse } from "./apiError.js";
import {
  createChainAnchorPolicyReport,
  type ChainAnchorPolicyContext,
  type ChainAnchorPolicyDraft
} from "../src/lib/chainAnchorPolicy.js";
import {
  createGrcDestinationPolicyReport,
  type GrcDestinationPolicyContext,
  type GrcDestinationPolicyDraft
} from "../src/lib/grcDestinationPolicy.js";
import {
  createDocumentParserPolicyReport,
  type DocumentParserPolicyContext,
  type DocumentParserPolicyDraft
} from "../src/lib/documentParserPolicy.js";
import {
  createObjectStoragePolicyReport,
  type ObjectStoragePolicyContext,
  type ObjectStoragePolicyDraft
} from "../src/lib/objectStoragePolicy.js";

type ObjectStoragePolicyRequestBody = {
  context?: unknown;
  policy?: unknown;
};

type DocumentParserPolicyRequestBody = {
  context?: unknown;
  policy?: unknown;
};

type ChainAnchorPolicyRequestBody = {
  context?: unknown;
  policy?: unknown;
};

type GrcDestinationPolicyRequestBody = {
  context?: unknown;
  policy?: unknown;
};

type IntegrationPolicyRequestPayload = {
  context: Record<string, unknown>;
  policy: Record<string, unknown>;
};

const INTEGRATION_POLICY_RECOVERY_ACTION =
  "Send metadata-only integration context and policy JSON objects without raw documents, credentials, raw KYC, personal data, private keys, wallet secrets, legal conclusions, or external write commands." as const;

export function registerIntegrationPolicyRoutes(server: FastifyInstance): void {
  server.post<{ Body: ObjectStoragePolicyRequestBody }>("/api/integrations/object-storage/policy", async (request, reply) =>
    evaluateIntegrationPolicy(request.body, reply, (payload) =>
      createObjectStoragePolicyReport({
        context: toObjectStoragePolicyContext(payload.context),
        policy: toObjectStoragePolicyDraft(payload.policy)
      })
    )
  );

  server.post<{ Body: DocumentParserPolicyRequestBody }>("/api/integrations/document-parser/policy", async (request, reply) =>
    evaluateIntegrationPolicy(request.body, reply, (payload) =>
      createDocumentParserPolicyReport({
        context: toDocumentParserPolicyContext(payload.context),
        policy: toDocumentParserPolicyDraft(payload.policy)
      })
    )
  );

  server.post<{ Body: ChainAnchorPolicyRequestBody }>("/api/integrations/chain-anchor/policy", async (request, reply) =>
    evaluateIntegrationPolicy(request.body, reply, (payload) =>
      createChainAnchorPolicyReport({
        context: toChainAnchorPolicyContext(payload.context),
        policy: toChainAnchorPolicyDraft(payload.policy)
      })
    )
  );

  server.post<{ Body: GrcDestinationPolicyRequestBody }>("/api/integrations/grc-destination/policy", async (request, reply) =>
    evaluateIntegrationPolicy(request.body, reply, (payload) =>
      createGrcDestinationPolicyReport({
        context: toGrcDestinationPolicyContext(payload.context),
        policy: toGrcDestinationPolicyDraft(payload.policy)
      })
    )
  );
}

function evaluateIntegrationPolicy<T>(
  body: unknown,
  reply: { status: (statusCode: number) => { send: (payload: unknown) => unknown } },
  createReport: (payload: IntegrationPolicyRequestPayload) => T
): T | unknown {
  try {
    return createReport(createIntegrationPolicyRequestPayload(body));
  } catch (error) {
    return reply.status(400).send(
      createApiErrorResponse({
        error: safeIntegrationPolicyError(error),
        code: "INTEGRATION_POLICY_INVALID_PAYLOAD",
        fallbackMessage: "Integration policy payload must include metadata-only context and policy JSON objects.",
        recoveryAction: INTEGRATION_POLICY_RECOVERY_ACTION
      })
    );
  }
}

function createIntegrationPolicyRequestPayload(value: unknown): IntegrationPolicyRequestPayload {
  const body = isRecord(value) ? value : {};

  return {
    context: jsonObjectField(body.context, "Integration policy context must be a JSON object."),
    policy: jsonObjectField(body.policy, "Integration policy draft must be a JSON object.")
  };
}

function jsonObjectField(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(message);
  }

  return value;
}

function safeIntegrationPolicyError(error: unknown): Error {
  if (error instanceof Error && isKnownIntegrationPolicyError(error.message)) {
    return error;
  }

  return new Error("Integration policy payload could not be evaluated safely.");
}

function isKnownIntegrationPolicyError(message: string): boolean {
  return (
    message === "Integration policy context must be a JSON object." ||
    message === "Integration policy draft must be a JSON object."
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

function toDocumentParserPolicyContext(value: unknown): DocumentParserPolicyContext {
  const context = isRecord(value) ? value : {};

  return {
    workspaceId: stringField(context.workspaceId),
    evidenceCount: numberField(context.evidenceCount),
    retentionStatus: isRetentionPolicyStatus(context.retentionStatus) ? context.retentionStatus : "needs-review",
    vaultSyncAllowed: context.vaultSyncAllowed === true,
    blockerCount: numberField(context.blockerCount),
    exportBlockerCount: numberField(context.exportBlockerCount),
    manifestHash: stringField(context.manifestHash) || undefined
  };
}

function toDocumentParserPolicyDraft(value: unknown): DocumentParserPolicyDraft {
  const policy = isRecord(value) ? value : {};

  return {
    policyOwner: stringField(policy.policyOwner),
    maxDocumentSizeMb: numberField(policy.maxDocumentSizeMb),
    rawDocumentRetentionDays: numberField(policy.rawDocumentRetentionDays),
    deletionSlaDays: numberField(policy.deletionSlaDays),
    parsingPurpose: stringField(policy.parsingPurpose),
    redactionBeforeParsingApproved: policy.redactionBeforeParsingApproved === true,
    noTrainingUseConfirmed: policy.noTrainingUseConfirmed === true,
    accessLoggingApproved: policy.accessLoggingApproved === true,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: stringField(policy.notes)
  };
}

function toChainAnchorPolicyContext(value: unknown): ChainAnchorPolicyContext {
  const context = isRecord(value) ? value : {};

  return {
    workspaceId: stringField(context.workspaceId),
    evidenceCount: numberField(context.evidenceCount),
    retentionStatus: isRetentionPolicyStatus(context.retentionStatus) ? context.retentionStatus : "needs-review",
    vaultSyncAllowed: context.vaultSyncAllowed === true,
    blockerCount: numberField(context.blockerCount),
    exportBlockerCount: numberField(context.exportBlockerCount),
    manifestHash: stringField(context.manifestHash) || undefined,
    counselPackVersionCount: numberField(context.counselPackVersionCount),
    simulatedAnchorAvailable: context.simulatedAnchorAvailable === true
  };
}

function toChainAnchorPolicyDraft(value: unknown): ChainAnchorPolicyDraft {
  const policy = isRecord(value) ? value : {};

  return {
    policyOwner: stringField(policy.policyOwner),
    targetNetwork: stringField(policy.targetNetwork),
    walletCustodyModel: stringField(policy.walletCustodyModel),
    signerRole: stringField(policy.signerRole),
    transactionLoggingApproved: policy.transactionLoggingApproved === true,
    privacyReviewApproved: policy.privacyReviewApproved === true,
    publicPayloadLimitedApproved: policy.publicPayloadLimitedApproved === true,
    userConsentApproved: policy.userConsentApproved === true,
    noRawEvidenceOnChainConfirmed: policy.noRawEvidenceOnChainConfirmed === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: stringField(policy.notes)
  };
}

function toGrcDestinationPolicyContext(value: unknown): GrcDestinationPolicyContext {
  const context = isRecord(value) ? value : {};

  return {
    workspaceId: stringField(context.workspaceId),
    remediationItemCount: numberField(context.remediationItemCount),
    exportSafetyStatus: isGrcDestinationExportSafetyStatus(context.exportSafetyStatus) ? context.exportSafetyStatus : "needs-review",
    exportBlockerCount: numberField(context.exportBlockerCount),
    integrationAdapterStatus: isIntegrationAdapterStatus(context.integrationAdapterStatus) ? context.integrationAdapterStatus : "blocked",
    localTicketExportAvailable: context.localTicketExportAvailable === true
  };
}

function toGrcDestinationPolicyDraft(value: unknown): GrcDestinationPolicyDraft {
  const policy = isRecord(value) ? value : {};

  return {
    policyOwner: stringField(policy.policyOwner),
    destinationSystem: stringField(policy.destinationSystem),
    destinationQueue: stringField(policy.destinationQueue),
    fieldMappingApproved: policy.fieldMappingApproved === true,
    authenticationPolicyApproved: policy.authenticationPolicyApproved === true,
    redactionPolicyApproved: policy.redactionPolicyApproved === true,
    ticketOwnershipApproved: policy.ticketOwnershipApproved === true,
    retryAndAuditLoggingApproved: policy.retryAndAuditLoggingApproved === true,
    noSensitiveMaterialConfirmed: policy.noSensitiveMaterialConfirmed === true,
    humanReviewRequired: policy.humanReviewRequired === true,
    notes: stringField(policy.notes)
  };
}

function isRetentionPolicyStatus(value: unknown): value is ObjectStoragePolicyContext["retentionStatus"] {
  return value === "ready" || value === "needs-review" || value === "blocked";
}

function isGrcDestinationExportSafetyStatus(value: unknown): value is GrcDestinationPolicyContext["exportSafetyStatus"] {
  return value === "clean" || value === "needs-review" || value === "blocked";
}

function isIntegrationAdapterStatus(value: unknown): value is GrcDestinationPolicyContext["integrationAdapterStatus"] {
  return value === "ready" || value === "needs-policy" || value === "blocked" || value === "disabled";
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
