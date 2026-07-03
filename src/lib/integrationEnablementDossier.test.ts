import { describe, expect, it } from "vitest";
import { createChainAnchorPolicyReport } from "./chainAnchorPolicy";
import { createDocumentParserPolicyReport } from "./documentParserPolicy";
import { createGrcDestinationPolicyReport } from "./grcDestinationPolicy";
import {
  createIntegrationEnablementDossier,
  exportIntegrationEnablementDossierJson,
  type CreateIntegrationEnablementDossierInput
} from "./integrationEnablementDossier";
import { createIntegrationPolicyEvaluationRecord } from "./integrationPolicyEvaluation";
import type { IntegrationReadinessRegistry } from "./integrationReadiness";
import { createModelGatewayProviderPolicyReport, defaultModelGatewayProviderAdapters } from "./modelGatewayProviderPolicy";
import { createModelGatewaySecretPolicyReport } from "./modelGatewaySecretPolicy";
import { createObjectStoragePolicyReport } from "./objectStoragePolicy";

describe("createIntegrationEnablementDossier", () => {
  it("creates a stable dossier hash that ignores generatedAt", async () => {
    const first = await createIntegrationEnablementDossier({
      ...createInput(),
      generatedAt: "2026-07-01T01:00:00.000Z"
    });
    const second = await createIntegrationEnablementDossier({
      ...createInput(),
      generatedAt: "2026-07-01T02:00:00.000Z"
    });

    expect(first.dossierHash).toBe(second.dossierHash);
    expect(first.dossierHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toEqual(
      expect.objectContaining({
        dossierVersion: "lexproof-integration-enablement-dossier-v1",
        externalEnablementAllowed: false,
        adapterCount: 5,
        policyReportCount: 6,
        notLegalAdviceBoundary: "Not legal advice. Integration enablement dossiers are audit preparation metadata only."
      })
    );
  });

  it("keeps external enablement disabled even when policy controls are ready", async () => {
    const dossier = await createIntegrationEnablementDossier(createInput({ readyPolicyControls: true }));

    expect(dossier.externalEnablementAllowed).toBe(false);
    expect(dossier.policyReports.map((report) => [report.id, report.externalCapabilityAllowed])).toEqual([
      ["provider-policy", false],
      ["secret-policy", false],
      ["object-storage-policy", false],
      ["document-parser-policy", false],
      ["chain-anchor-policy", false],
      ["grc-destination-policy", false]
    ]);
    expect(dossier.nextActions).toEqual(
      expect.arrayContaining([expect.stringContaining("Keep all external adapters disabled until adapter enablement review")])
    );
    expect(JSON.stringify(dossier)).toContain("Not legal advice");
  });

  it("exports metadata-only JSON without leaking unsafe adapter metadata", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const input = createInput();
    input.registry = {
      ...input.registry,
      adapters: input.registry.adapters.map((adapter) =>
        adapter.id === "server-model-provider"
          ? {
              ...adapter,
              status: "blocked",
              readinessEvidence: `Do not route ${apiKey}, private key ${privateKey}, or raw KYC packet.`,
              validationErrors: [`Remove ${apiKey} before enablement.`]
            }
          : adapter
      )
    };

    const dossier = await createIntegrationEnablementDossier(input);
    const json = exportIntegrationEnablementDossierJson(dossier);

    expect(dossier.overallStatus).toBe("blocked");
    expect(json).toContain("lexproof-integration-enablement-dossier-v1");
    expect(json).toContain("[redacted-api-key]");
    expect(json).toContain("[redacted-private-key]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toContain("raw KYC packet");
    expect(JSON.parse(json)).toEqual(expect.objectContaining({ externalEnablementAllowed: false }));
  });

  it("includes persisted server policy evaluation receipts without raw policy payloads", async () => {
    const input = createInput({ readyPolicyControls: true });
    const evaluationRecord = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "integration-enable",
      policyId: "object-storage",
      report: input.objectStoragePolicyReport,
      context: {
        workspaceId: "integration-enable",
        evidenceCount: 2,
        manifestHash: "a".repeat(64)
      },
      policy: {
        policyOwner: "Storage owner",
        retentionDays: 365,
        apiKey: "sk-live-abcdef1234567890abcdef1234567890",
        rawEvidence: "raw customer file body should not enter dossier"
      },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T08:00:00.000Z"
    });
    const dossier = await createIntegrationEnablementDossier({
      ...input,
      policyEvaluationRecords: [evaluationRecord]
    });
    const json = exportIntegrationEnablementDossierJson(dossier);

    expect(dossier.policyEvaluationRecordCount).toBe(1);
    expect(dossier.policyEvaluationRecords[0]).toEqual(
      expect.objectContaining({
        id: evaluationRecord.id,
        policyId: "object-storage",
        source: "server",
        externalCapabilityAllowed: false,
        reportHash: evaluationRecord.reportHash,
        contextHash: evaluationRecord.contextHash,
        policyHash: evaluationRecord.policyHash,
        notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
      })
    );
    expect(json).toContain("policyEvaluationRecords");
    expect(json).toContain(evaluationRecord.policyHash);
    expect(json).not.toContain("sk-live-abcdef");
    expect(json).not.toContain("raw customer file body");
    expect(json).not.toContain("rawEvidence");
  });

  it("changes the dossier hash when server policy evaluation receipts change", async () => {
    const input = createInput({ readyPolicyControls: true });
    const firstRecord = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "integration-enable",
      policyId: "object-storage",
      report: input.objectStoragePolicyReport,
      context: { workspaceId: "integration-enable" },
      policy: { retentionDays: 365 },
      createdAt: "2026-07-03T08:00:00.000Z"
    });
    const secondRecord = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "integration-enable",
      policyId: "object-storage",
      report: input.objectStoragePolicyReport,
      context: { workspaceId: "integration-enable" },
      policy: { retentionDays: 180 },
      createdAt: "2026-07-03T08:00:00.000Z"
    });

    const firstDossier = await createIntegrationEnablementDossier({
      ...input,
      policyEvaluationRecords: [firstRecord]
    });
    const secondDossier = await createIntegrationEnablementDossier({
      ...input,
      policyEvaluationRecords: [secondRecord]
    });

    expect(secondRecord.policyHash).not.toBe(firstRecord.policyHash);
    expect(secondDossier.dossierHash).not.toBe(firstDossier.dossierHash);
  });
});

function createInput({ readyPolicyControls = false } = {}): CreateIntegrationEnablementDossierInput {
  const generatedAt = "2026-07-01T00:00:00.000Z";
  const manifestHash = "a".repeat(64);
  const context = {
    workspaceId: "integration-enable",
    evidenceCount: 2,
    retentionStatus: "ready" as const,
    vaultSyncAllowed: true,
    blockerCount: 0,
    exportBlockerCount: 0,
    manifestHash
  };
  const registry: IntegrationReadinessRegistry = {
    registryVersion: "lexproof-integration-readiness-registry-v1",
    overallStatus: "needs-policy",
    readyCount: 1,
    needsPolicyCount: 2,
    blockedCount: 0,
    disabledCount: 2,
    adapters: [
      adapter("server-model-provider", "Server model provider", "model-provider", "disabled"),
      adapter("object-storage-vault", "Object storage vault", "evidence-storage", "needs-policy"),
      adapter("chain-anchor", "Chain anchor", "anchor", "needs-policy"),
      adapter("document-parser-ocr", "Document parser / OCR", "document-processing", "disabled"),
      adapter("grc-ticket-export", "GRC ticket export", "workflow-export", "ready")
    ],
    nextActions: ["Object storage vault: Approve retention policy before external storage."],
    notLegalAdviceBoundary: "Not legal advice. Integration readiness output is audit preparation metadata only."
  };

  const policyOwner = readyPolicyControls ? "Security Review" : "Integration Owner";
  const storageDraft = {
    policyOwner,
    retentionDays: 90,
    deletionSlaDays: 14,
    encryptionAtRestApproved: readyPolicyControls,
    bucketAllowlistApproved: readyPolicyControls,
    accessLoggingApproved: readyPolicyControls,
    lifecyclePolicyApproved: readyPolicyControls,
    noSensitiveMaterialConfirmed: readyPolicyControls,
    humanReviewRequired: readyPolicyControls,
    notes: "Metadata-only policy review."
  };
  const parserDraft = {
    policyOwner,
    maxDocumentSizeMb: 5,
    rawDocumentRetentionDays: 7,
    deletionSlaDays: 7,
    parsingPurpose: "Extract audit-prep metadata only.",
    redactionBeforeParsingApproved: readyPolicyControls,
    noTrainingUseConfirmed: readyPolicyControls,
    accessLoggingApproved: readyPolicyControls,
    noSensitiveMaterialConfirmed: readyPolicyControls,
    humanReviewRequired: readyPolicyControls,
    notes: "Raw document parsing remains disabled."
  };
  const anchorDraft = {
    policyOwner,
    targetNetwork: "testnet-disabled",
    walletCustodyModel: "No wallet connected",
    signerRole: "Security reviewer",
    transactionLoggingApproved: readyPolicyControls,
    privacyReviewApproved: readyPolicyControls,
    publicPayloadLimitedApproved: readyPolicyControls,
    userConsentApproved: readyPolicyControls,
    noRawEvidenceOnChainConfirmed: readyPolicyControls,
    humanReviewRequired: readyPolicyControls,
    notes: "Simulated anchor only."
  };
  const grcDraft = {
    policyOwner,
    destinationSystem: "Jira placeholder",
    destinationQueue: "Regulatory review queue",
    fieldMappingApproved: readyPolicyControls,
    authenticationPolicyApproved: readyPolicyControls,
    redactionPolicyApproved: readyPolicyControls,
    ticketOwnershipApproved: readyPolicyControls,
    retryAndAuditLoggingApproved: readyPolicyControls,
    noSensitiveMaterialConfirmed: readyPolicyControls,
    humanReviewRequired: readyPolicyControls,
    notes: "Metadata-only ticket export."
  };

  return {
    registry,
    providerPolicyReport: createModelGatewayProviderPolicyReport(
      {
        adapters: defaultModelGatewayProviderAdapters,
        modelConnectReceipt: null,
        generatedAt
      }
    ),
    secretPolicyReport: createModelGatewaySecretPolicyReport(
      {
        policyOwner,
        kmsBackedStorageApproved: readyPolicyControls,
        rotationDays: 90,
        accessReviewCadence: readyPolicyControls ? "quarterly" : "none",
        providerAllowlistApproved: readyPolicyControls,
        egressLoggingApproved: readyPolicyControls,
        incidentResponseRunbookApproved: readyPolicyControls,
        noClientSecretPersistence: readyPolicyControls,
        humanReviewRequired: readyPolicyControls,
        notes: "Session-only credentials are not persisted."
      },
      generatedAt
    ),
    objectStoragePolicyReport: createObjectStoragePolicyReport({ context, policy: storageDraft }, generatedAt),
    documentParserPolicyReport: createDocumentParserPolicyReport({ context, policy: parserDraft }, generatedAt),
    chainAnchorPolicyReport: createChainAnchorPolicyReport(
      {
        context: {
          ...context,
          counselPackVersionCount: 1,
          simulatedAnchorAvailable: true
        },
        policy: anchorDraft
      },
      generatedAt
    ),
    grcDestinationPolicyReport: createGrcDestinationPolicyReport(
      {
        context: {
          workspaceId: context.workspaceId,
          remediationItemCount: 2,
          exportSafetyStatus: "clean",
          exportBlockerCount: 0,
          integrationAdapterStatus: "ready",
          localTicketExportAvailable: true
        },
        policy: grcDraft
      },
      generatedAt
    ),
    generatedAt
  };
}

function adapter(
  id: IntegrationReadinessRegistry["adapters"][number]["id"],
  label: string,
  category: IntegrationReadinessRegistry["adapters"][number]["category"],
  status: IntegrationReadinessRegistry["adapters"][number]["status"]
): IntegrationReadinessRegistry["adapters"][number] {
  return {
    id,
    label,
    category,
    status,
    readinessEvidence: `${label} readiness metadata.`,
    validationErrors: [],
    recoveryAction: `${label}: keep disabled until policy review.`,
    requiredPolicy: `${label} adapter enablement policy.`,
    disabledReason: status === "disabled" ? "External adapter disabled by default." : undefined,
    notLegalAdviceBoundary: "Not legal advice. Integration adapter readiness is audit preparation metadata only."
  };
}
