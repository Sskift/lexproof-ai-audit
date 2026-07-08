import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAuditLogRecord } from "../src/lib/phase2Types";
import type {
  AuditLogRecord,
  CounselPackExportRecord,
  EvidenceVaultRecord,
  HumanReviewRecord,
  ModelGatewayRun,
  RegulatorySourceApprovalRecord,
  RegulatorySourceReviewRecord,
  WorkspaceRecord
} from "../src/lib/phase2Types";
import { createIntegrationPolicyEvaluationRecord } from "../src/lib/integrationPolicyEvaluation";
import type { IntegrationPolicyEvaluationRecord } from "../src/lib/integrationPolicyEvaluation";
import { createObjectStoragePolicyReport } from "../src/lib/objectStoragePolicy";
import { createCounselPackExportRecord } from "./counselPackExportService";
import { createEvidenceVaultRecordFromUpload } from "./evidenceVaultService";
import { createHumanReviewRecord } from "./humanReviewService";
import { createModelGatewayRun } from "./modelGatewayService";
import { createMemoryReviewWorkspaceRepository, createPrismaReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

const walletAddress = "0x1111111111111111111111111111111111111111";

describe("Memory review workspace repository", () => {
  it("redacts workspace text before returning in-memory records", async () => {
    const repository = createMemoryReviewWorkspaceRepository();
    const privateKey = `0x${"a".repeat(64)}`;
    const workspace = {
      ...createWorkspaceRecordFixture({ id: "workspace-memory-workspace-redaction" }),
      name: "YieldPassport raw KYC packet",
      organizationName: "YieldPassport Labs sk-live-abcdef1234567890abcdef1234567890",
      ownerId: `founder private key ${privateKey}`,
      notLegalAdviceBoundary: "Legal approval for workspace launch."
    } as WorkspaceRecord;

    await repository.saveWorkspaceRecord(workspace);
    const saved = await repository.findWorkspaceRecord("workspace-memory-workspace-redaction");

    expect(saved).toEqual(
      expect.objectContaining({
        id: "workspace-memory-workspace-redaction",
        name: expect.stringContaining("[redacted-raw-kyc]"),
        organizationName: expect.stringContaining("[redacted-api-key]"),
        ownerId: expect.stringContaining("[redacted-private-key]"),
        notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
      })
    );

    await repository.updateWorkspaceRecord({
      ...(saved as WorkspaceRecord),
      name: `Updated workspace with private key ${privateKey}`,
      ownerId: "compliance sk-live-abcdef1234567890abcdef1234567890"
    });
    const updated = await repository.findWorkspaceRecord("workspace-memory-workspace-redaction");
    const serialized = JSON.stringify(updated);

    expect(updated).toEqual(
      expect.objectContaining({
        name: expect.stringContaining("[redacted-private-key]"),
        ownerId: expect.stringContaining("[redacted-api-key]"),
        notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
      })
    );
    expect(serialized).not.toContain("sk-live-abcdef");
    expect(serialized).not.toContain(privateKey);
    expect(serialized.toLowerCase()).not.toContain("raw kyc");

    (updated as WorkspaceRecord).name = `Re-poison with private key ${privateKey}`;
    const repeated = await repository.findWorkspaceRecord("workspace-memory-workspace-redaction");
    expect(JSON.stringify(repeated)).not.toContain(privateKey);

    await repository.close();
  });

  it("redacts Evidence Vault metadata before returning in-memory records", async () => {
    const repository = createMemoryReviewWorkspaceRepository();
    const privateKey = `0x${"a".repeat(64)}`;
    const workspaceId = "workspace-memory-evidence-redaction";
    const evidence = {
      ...createEvidenceVaultRecordFixture({ workspaceId }),
      filename: "raw KYC packet sk-live-abcdef1234567890abcdef1234567890.txt",
      owner: "Compliance sk-live-abcdef1234567890abcdef1234567890",
      sourceNote: `Evidence note includes raw KYC packet and private key ${privateKey}.`,
      linkedRiskFlagIds: ["governance", `private key ${privateKey}`],
      linkedControlIds: ["control-custody", "raw KYC packet"],
      parentEvidenceId: `parent private key ${privateKey}`,
      supersededByEvidenceId: "successor raw KYC packet",
      replacementReason: `Replace evidence containing private key ${privateKey}.`,
      metadataBoundaryWarnings: [
        {
          dataClass: "personal-data",
          severity: "warn",
          matchCount: 1,
          redactedSnippet: `raw KYC packet and private key ${privateKey}`,
          message: "Confirm raw KYC packet before handoff."
        }
      ]
    } as EvidenceVaultRecord;

    await repository.saveEvidenceVaultRecord(evidence);
    const records = await repository.listEvidenceVaultRecords(workspaceId);
    const lookup = await repository.findEvidenceVaultRecord(workspaceId, evidence.id);
    const serialized = JSON.stringify({ records, lookup });

    expect(records[0]).toEqual(
      expect.objectContaining({
        filename: expect.stringContaining("[redacted-api-key]"),
        owner: expect.stringContaining("[redacted-api-key]"),
        sourceNote: expect.stringContaining("[redacted-private-key]"),
        parentEvidenceId: expect.stringContaining("[redacted-private-key]"),
        supersededByEvidenceId: expect.stringContaining("[redacted-raw-kyc]"),
        replacementReason: expect.stringContaining("[redacted-private-key]")
      })
    );
    expect(lookup).toEqual(records[0]);
    expect(records[0].linkedRiskFlagIds).toEqual(expect.arrayContaining([expect.stringContaining("[redacted-private-key]")]));
    expect(records[0].linkedControlIds).toEqual(expect.arrayContaining([expect.stringContaining("[redacted-raw-kyc]")]));
    expect(records[0].metadataBoundaryWarnings).toHaveLength(1);
    expect(records[0].metadataBoundaryWarnings?.[0]).toEqual(
      expect.objectContaining({
        redactedSnippet: expect.stringContaining("[redacted-private-key]"),
        message: expect.stringContaining("[redacted-raw-kyc]")
      })
    );
    expect(serialized).not.toContain("sk-live-abcdef");
    expect(serialized).not.toContain(privateKey);
    expect(serialized.toLowerCase()).not.toContain("raw kyc");

    records[0].sourceNote = `Re-poison with private key ${privateKey}`;
    records[0].metadataBoundaryWarnings![0].message = `Re-poison raw KYC packet with private key ${privateKey}`;
    const repeatedRecords = await repository.listEvidenceVaultRecords(workspaceId);
    expect(JSON.stringify(repeatedRecords)).not.toContain(privateKey);

    await repository.updateEvidenceVaultRecord({
      ...evidence,
      status: "under-review",
      version: 2,
      sourceNote: `Updated evidence note includes raw KYC packet and private key ${privateKey}.`,
      replacementReason: `Updated replacement reason with private key ${privateKey}.`
    });
    const updated = await repository.findEvidenceVaultRecord(workspaceId, evidence.id);
    const updatedSerialized = JSON.stringify(updated);

    expect(updated).toEqual(
      expect.objectContaining({
        status: "under-review",
        version: 2,
        sourceNote: expect.stringContaining("[redacted-private-key]"),
        replacementReason: expect.stringContaining("[redacted-private-key]")
      })
    );
    expect(updatedSerialized).not.toContain("sk-live-abcdef");
    expect(updatedSerialized).not.toContain(privateKey);
    expect(updatedSerialized.toLowerCase()).not.toContain("raw kyc");

    await repository.close();
  });

  it("redacts Model Gateway run text before returning in-memory records", async () => {
    const repository = createMemoryReviewWorkspaceRepository();
    const privateKey = `0x${"a".repeat(64)}`;
    const workspaceId = "workspace-memory-model-redaction";
    const run = {
      ...createModelGatewayRunFixture({ workspaceId }),
      providerLabel: "Mock provider sk-live-abcdef1234567890abcdef1234567890",
      model: `lexproof-model private key ${privateKey}`,
      purpose: "Draft audit preparation from raw KYC packet",
      errorCode: "MODEL_GATEWAY_sk-live-abcdef1234567890abcdef1234567890",
      errorMessage: `Remove private key ${privateKey} and raw KYC packet before retry.`,
      remediationSteps: [`Remove raw KYC packet and private key ${privateKey}.`],
      providerMetadata: {
        adapterMode: "local-mock",
        credentialPolicy: "no credentials accepted",
        secretPolicy: "Persist sk-live-abcdef1234567890abcdef1234567890 for provider retries.",
        allowedDataClasses: ["audit-prep metadata", "raw KYC packet", `private key ${privateKey}`]
      },
      notLegalAdviceBoundary: "Legal approval for AI output."
    } as ModelGatewayRun;

    await repository.saveModelGatewayRun(run);
    const records = await repository.listModelGatewayRuns(workspaceId);
    const lookup = await repository.findModelGatewayRun(workspaceId, run.id);
    const serialized = JSON.stringify({ records, lookup });

    expect(records[0]).toEqual(
      expect.objectContaining({
        providerLabel: expect.stringContaining("[redacted-api-key]"),
        model: expect.stringContaining("[redacted-private-key]"),
        purpose: expect.stringContaining("[redacted-raw-kyc]"),
        errorCode: expect.stringContaining("[redacted-hex-material]"),
        errorMessage: expect.stringContaining("[redacted-private-key]"),
        remediationSteps: [expect.stringContaining("[redacted-private-key]")],
        notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
      })
    );
    expect(lookup).toEqual(records[0]);
    expect(records[0].providerMetadata).toEqual(
      expect.objectContaining({
        secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
        allowedDataClasses: expect.arrayContaining([
          expect.stringContaining("[redacted-raw-kyc]"),
          expect.stringContaining("[redacted-private-key]")
        ])
      })
    );
    expect(serialized).not.toContain("sk-live-abcdef");
    expect(serialized).not.toContain(privateKey);
    expect(serialized.toLowerCase()).not.toContain("raw kyc");

    records[0].providerMetadata.allowedDataClasses[0] = `Re-poison with private key ${privateKey}`;
    records[0].remediationSteps[0] = `Re-poison raw KYC packet with private key ${privateKey}`;
    const repeatedRecords = await repository.listModelGatewayRuns(workspaceId);
    expect(JSON.stringify(repeatedRecords)).not.toContain(privateKey);

    await repository.saveModelGatewayRun({
      ...run,
      status: "failed",
      redactionStatus: "blocked",
      humanReviewStatus: "needs-review",
      retryState: "blocked-until-remediated",
      attempt: 2,
      maxAttempts: 3,
      errorMessage: `Updated failure with raw KYC packet and private key ${privateKey}.`,
      remediationSteps: [`Updated remediation removes raw KYC packet and private key ${privateKey}.`]
    });
    const updated = await repository.findModelGatewayRun(workspaceId, run.id);
    const updatedSerialized = JSON.stringify(updated);

    expect(updated).toEqual(
      expect.objectContaining({
        status: "failed",
        redactionStatus: "blocked",
        humanReviewStatus: "needs-review",
        retryState: "blocked-until-remediated",
        attempt: 2,
        maxAttempts: 3,
        errorMessage: expect.stringContaining("[redacted-private-key]"),
        remediationSteps: [expect.stringContaining("[redacted-private-key]")]
      })
    );
    expect(updatedSerialized).not.toContain("sk-live-abcdef");
    expect(updatedSerialized).not.toContain(privateKey);
    expect(updatedSerialized.toLowerCase()).not.toContain("raw kyc");

    await repository.close();
  });

  it("redacts integration policy receipt text before returning in-memory records", async () => {
    const repository = createMemoryReviewWorkspaceRepository();
    const privateKey = `0x${"a".repeat(64)}`;
    const report = createObjectStoragePolicyReport({
      context: {
        workspaceId: "workspace-memory-policy-redaction",
        evidenceCount: 2,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        manifestHash: "a".repeat(64)
      },
      policy: {
        policyOwner: "Storage owner",
        retentionDays: 365,
        deletionSlaDays: 30,
        encryptionAtRestApproved: true,
        bucketAllowlistApproved: true,
        accessLoggingApproved: true,
        lifecyclePolicyApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Ready for future adapter review."
      }
    });
    const record = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-memory-policy-redaction",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-memory-policy-redaction", evidenceCount: 2, manifestHash: "a".repeat(64) },
      policy: { policyOwner: "Storage owner", retentionDays: 365 },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T08:30:00.000Z"
    });
    const pollutedRecord: IntegrationPolicyEvaluationRecord = {
      ...record,
      externalCapabilityStatus: `blocked until sk-live-abcdef1234567890abcdef1234567890 and private key ${privateKey} are removed`,
      evaluatorId: "Storage owner sk-live-abcdef1234567890abcdef1234567890",
      nextActions: [`Remove raw KYC packet and private key ${privateKey} before adapter review.`]
    };

    await repository.saveIntegrationPolicyEvaluationRecord(pollutedRecord);
    const records = await repository.listIntegrationPolicyEvaluationRecords("workspace-memory-policy-redaction");
    const serialized = JSON.stringify(records);

    expect(records).toEqual([
      expect.objectContaining({
        externalCapabilityStatus: expect.stringContaining("[redacted-api-key]"),
        evaluatorId: expect.stringContaining("[redacted-api-key]"),
        nextActions: [expect.stringContaining("[redacted-private-key]")],
        notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
      })
    ]);
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain("sk-live-abcdef");
    expect(serialized).not.toContain(privateKey);
    expect(serialized.toLowerCase()).not.toContain("raw kyc");

    records[0].nextActions[0] = `Re-poison with private key ${privateKey}`;
    const repeatedRecords = await repository.listIntegrationPolicyEvaluationRecords("workspace-memory-policy-redaction");
    expect(JSON.stringify(repeatedRecords)).not.toContain(privateKey);

    await repository.close();
  });

  it("redacts Counsel Pack export text before returning in-memory records", async () => {
    const repository = createMemoryReviewWorkspaceRepository();
    const privateKey = `0x${"a".repeat(64)}`;
    const exportRecord = {
      ...createCounselPackExportRecordFixture({ workspaceId: "workspace-memory-export-redaction" }),
      projectName: "YieldPassport raw KYC packet",
      title: `Counsel Pack sk-live-abcdef1234567890abcdef1234567890 private key ${privateKey}`,
      artifactName: "yieldpassport raw KYC packet.md",
      createdBy: "Compliance sk-live-abcdef1234567890abcdef1234567890",
      notLegalAdviceBoundary: "Legal approval for external handoff."
    } as CounselPackExportRecord;

    await repository.saveCounselPackExportRecord(exportRecord);
    const records = await repository.listCounselPackExportRecords("workspace-memory-export-redaction");
    const lookup = await repository.findCounselPackExportRecord("workspace-memory-export-redaction", exportRecord.id);
    const serialized = JSON.stringify({ records, lookup });

    expect(records).toEqual([
      expect.objectContaining({
        projectName: expect.stringContaining("[redacted-raw-kyc]"),
        title: expect.stringContaining("[redacted-api-key]"),
        artifactName: expect.stringContaining("[redacted-raw-kyc]"),
        createdBy: expect.stringContaining("[redacted-api-key]"),
        notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
      })
    ]);
    expect(lookup).toEqual(records[0]);
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).not.toContain("sk-live-abcdef");
    expect(serialized).not.toContain(privateKey);
    expect(serialized.toLowerCase()).not.toContain("raw kyc");

    records[0].projectName = `Re-poison with private key ${privateKey}`;
    if (records[0].jurisdictionReadinessDigest) {
      (records[0].jurisdictionReadinessDigest as { notLegalAdviceBoundary: string }).notLegalAdviceBoundary =
        "Legal approval for launch.";
    }
    const repeatedRecords = await repository.listCounselPackExportRecords("workspace-memory-export-redaction");
    expect(JSON.stringify(repeatedRecords)).not.toContain(privateKey);
    expect(repeatedRecords[0].notLegalAdviceBoundary).toBe(
      "Not legal advice. Counsel Pack export records are audit preparation metadata only."
    );
    expect(repeatedRecords[0].jurisdictionReadinessDigest?.notLegalAdviceBoundary).toBe(
      "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
    );

    await repository.close();
  });

  it("redacts audit-log text before returning in-memory records", async () => {
    const repository = createMemoryReviewWorkspaceRepository();
    const privateKey = `0x${"a".repeat(64)}`;
    const auditLog = {
      ...createAuditLogRecordFixture({ workspaceId: "workspace-memory-audit-redaction" }),
      actorId: "Compliance sk-live-abcdef1234567890abcdef1234567890",
      action: "evidence.updated.raw KYC packet",
      targetId: `target private key ${privateKey}`,
      beforeHash: `raw KYC packet before ${privateKey}`,
      afterHash: `raw KYC packet after ${privateKey}`,
      summary: `Updated record with raw KYC packet and private key ${privateKey}.`,
      notLegalAdviceBoundary: "Legal approval for audit log."
    } as AuditLogRecord;

    await repository.appendAuditLogRecord(auditLog);
    const records = await repository.listAuditLogRecords("workspace-memory-audit-redaction");
    const serialized = JSON.stringify(records);

    expect(records).toEqual([
      expect.objectContaining({
        actorId: expect.stringContaining("[redacted-api-key]"),
        action: expect.stringContaining("[redacted-raw-kyc]"),
        targetId: expect.stringContaining("[redacted-private-key]"),
        beforeHash: expect.stringContaining("[redacted-private-key]"),
        afterHash: expect.stringContaining("[redacted-private-key]"),
        summary: expect.stringContaining("[redacted-private-key]"),
        notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
      })
    ]);
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain("sk-live-abcdef");
    expect(serialized).not.toContain(privateKey);
    expect(serialized.toLowerCase()).not.toContain("raw kyc");

    records[0].summary = `Re-poison with private key ${privateKey}`;
    const repeatedRecords = await repository.listAuditLogRecords("workspace-memory-audit-redaction");
    expect(JSON.stringify(repeatedRecords)).not.toContain(privateKey);
    expect(repeatedRecords[0].notLegalAdviceBoundary).toBe(
      "Not legal advice. Audit log records are review workspace metadata."
    );

    await repository.close();
  });

  it("redacts Human Review text before returning in-memory records", async () => {
    const repository = createMemoryReviewWorkspaceRepository();
    const privateKey = `0x${"a".repeat(64)}`;
    const workspaceId = "workspace-memory-human-review-redaction";
    const review = {
      ...createHumanReviewRecordFixture({ workspaceId }),
      targetId: `model-run private key ${privateKey}`,
      reviewerId: "counsel sk-live-abcdef1234567890abcdef1234567890",
      comment: `Review returned because raw KYC packet and private key ${privateKey} were present.`,
      notLegalAdviceBoundary: "Legal approval for model output."
    } as HumanReviewRecord;

    await repository.saveHumanReviewRecord(review);
    const records = await repository.listHumanReviewRecords(workspaceId);
    const serialized = JSON.stringify(records);

    expect(records).toEqual([
      expect.objectContaining({
        targetId: expect.stringContaining("[redacted-private-key]"),
        reviewerId: expect.stringContaining("[redacted-api-key]"),
        comment: expect.stringContaining("[redacted-raw-kyc]"),
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      })
    ]);
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).not.toContain("sk-live-abcdef");
    expect(serialized).not.toContain(privateKey);
    expect(serialized.toLowerCase()).not.toContain("raw kyc");

    records[0].comment = `Re-poison with private key ${privateKey}`;
    const repeatedRecords = await repository.listHumanReviewRecords(workspaceId);
    expect(JSON.stringify(repeatedRecords)).not.toContain(privateKey);

    await repository.updateHumanReviewRecord({
      ...review,
      status: "needs-more-evidence",
      targetId: `updated model-run private key ${privateKey}`,
      reviewerId: "reviewer sk-live-abcdef1234567890abcdef1234567890",
      comment: `Updated review saw raw KYC packet and private key ${privateKey}.`,
      notLegalAdviceBoundary: "Legal approval for updated model output."
    });
    const updatedRecords = await repository.listHumanReviewRecords(workspaceId);
    const updatedSerialized = JSON.stringify(updatedRecords);

    expect(updatedRecords[0]).toEqual(
      expect.objectContaining({
        status: "needs-more-evidence",
        targetId: expect.stringContaining("[redacted-private-key]"),
        reviewerId: expect.stringContaining("[redacted-api-key]"),
        comment: expect.stringContaining("[redacted-raw-kyc]"),
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      })
    );
    expect(updatedSerialized).not.toContain("sk-live-abcdef");
    expect(updatedSerialized).not.toContain(privateKey);
    expect(updatedSerialized.toLowerCase()).not.toContain("raw kyc");

    await repository.close();
  });

  it("redacts source approval and review text before returning in-memory records", async () => {
    const repository = createMemoryReviewWorkspaceRepository();
    const privateKey = `0x${"a".repeat(64)}`;
    const approvalRecord = createRegulatorySourceApprovalRecordFixture({
      id: "source-approval-memory-redaction-record",
      workspaceId: "workspace-memory-source-redaction",
      sourceApprovalItemId: `approval private key ${privateKey}`,
      clauseId: "custody raw KYC packet",
      jurisdiction: "United States sk-live-abcdef1234567890abcdef1234567890",
      regulator: `SEC private key ${privateKey}`,
      citation: "17 CFR raw KYC packet",
      sourceName: "SEC source sk-live-abcdef1234567890abcdef1234567890",
      sourceUrl: `https://sec.example/private-key-${privateKey}`,
      effectiveAsOf: "2026-01-01 raw KYC packet",
      lastReviewedAt: `2026-06-01 private key ${privateKey}`,
      nextReviewDueAt: "2026-09-01 raw KYC packet",
      reviewerNotes: `Confirm source metadata without raw KYC packet or private key ${privateKey}.`,
      nextAction: "Remove sk-live-abcdef1234567890abcdef1234567890 before approval.",
      approvalGate: `Unsafe gate with raw KYC packet and private key ${privateKey}`,
      matchingBehaviorChanged: true,
      createdBy: `Compliance private key ${privateKey}`
    });
    const reviewRecord = createRegulatorySourceReviewRecordFixture({
      id: "source-review-memory-redaction-record",
      workspaceId: "workspace-memory-source-redaction",
      sourceReviewItemId: `review private key ${privateKey}`,
      clauseId: "custody raw KYC packet",
      jurisdiction: "United States sk-live-abcdef1234567890abcdef1234567890",
      regulator: `SEC private key ${privateKey}`,
      citation: "17 CFR raw KYC packet",
      sourceName: "SEC source sk-live-abcdef1234567890abcdef1234567890",
      sourceUrl: `https://sec.example/private-key-${privateKey}`,
      effectiveAsOf: "2026-01-01 raw KYC packet",
      lastReviewedAt: `2026-06-01 private key ${privateKey}`,
      nextReviewDueAt: "2026-09-01 raw KYC packet",
      reviewerNotes: `Confirm source metadata without raw KYC packet or private key ${privateKey}.`,
      nextAction: "Remove sk-live-abcdef1234567890abcdef1234567890 before review.",
      matchingBehaviorChanged: true,
      createdBy: `Compliance private key ${privateKey}`
    });

    await repository.saveRegulatorySourceApprovalRecord(approvalRecord);
    await repository.saveRegulatorySourceReviewRecord(reviewRecord);
    const approvals = await repository.listRegulatorySourceApprovalRecords("workspace-memory-source-redaction");
    const reviews = await repository.listRegulatorySourceReviewRecords("workspace-memory-source-redaction");
    const serialized = JSON.stringify({ approvals, reviews });

    expect(approvals[0]).toEqual(
      expect.objectContaining({
        sourceApprovalItemId: expect.stringContaining("[redacted-private-key]"),
        clauseId: expect.stringContaining("[redacted-raw-kyc]"),
        jurisdiction: expect.stringContaining("[redacted-api-key]"),
        regulator: expect.stringContaining("[redacted-private-key]"),
        sourceUrl: expect.stringContaining("[redacted-private-key]"),
        reviewerNotes: expect.stringContaining("[redacted-private-key]"),
        nextAction: expect.stringContaining("[redacted-api-key]"),
        approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
        matchingBehaviorChanged: false,
        createdBy: expect.stringContaining("[redacted-private-key]"),
        notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
      })
    );
    expect(reviews[0]).toEqual(
      expect.objectContaining({
        sourceReviewItemId: expect.stringContaining("[redacted-private-key]"),
        clauseId: expect.stringContaining("[redacted-raw-kyc]"),
        jurisdiction: expect.stringContaining("[redacted-api-key]"),
        regulator: expect.stringContaining("[redacted-private-key]"),
        sourceUrl: expect.stringContaining("[redacted-private-key]"),
        reviewerNotes: expect.stringContaining("[redacted-private-key]"),
        nextAction: expect.stringContaining("[redacted-api-key]"),
        matchingBehaviorChanged: false,
        createdBy: expect.stringContaining("[redacted-private-key]"),
        notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
      })
    );
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain("sk-live-abcdef");
    expect(serialized).not.toContain(privateKey);
    expect(serialized.toLowerCase()).not.toContain("raw kyc");

    await repository.close();
  });
});

describe("Prisma review workspace repository", () => {
  let tempDir: string;
  let databaseUrl: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "lexproof-prisma-"));
    databaseUrl = `file:${join(tempDir, "review-workspace.db")}`;
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("persists model runs, human reviews, and audit log records across repository instances", async () => {
    const firstRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const modelResult = createModelGatewayRun({
      workspaceId: "workspace-1",
      provider: "mock",
      model: "lexproof-mock",
      purpose: "Draft audit preparation issue spotting for counsel review.",
      redactionStatus: "clean",
      includesCredentialMaterial: false,
      includesRawKycOrPersonalData: false,
      humanReviewOwner: "Compliance",
      allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
      payload: { projectName: "YieldPassport" },
      createdAt: "2026-06-29T10:00:00.000Z"
    });

    if (!modelResult.valid) {
      throw new Error(modelResult.errors.join(", "));
    }

    const review = createHumanReviewRecord({
      workspaceId: "workspace-1",
      targetType: "model-run",
      targetId: modelResult.run.id,
      reviewerId: "counsel-1",
      comment: "Review model run before export.",
      createdAt: "2026-06-29T10:05:00.000Z"
    });
    const auditLog = createAuditLogRecord({
      workspaceId: "workspace-1",
      actorId: "system",
      action: "model.run.created",
      targetType: "model-run",
      targetId: modelResult.run.id,
      beforeHash: "",
      afterHash: modelResult.run.responseHash,
      summary: "Created mock model gateway run.",
      createdAt: "2026-06-29T10:00:00.000Z"
    });

    await firstRepository.saveModelGatewayRun(modelResult.run);
    await firstRepository.saveHumanReviewRecord(review);
    await firstRepository.appendAuditLogRecord(auditLog);
    await firstRepository.close();

    const secondRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });

    await expect(secondRepository.listModelGatewayRuns("workspace-1")).resolves.toEqual([modelResult.run]);
    await expect(secondRepository.listHumanReviewRecords("workspace-1")).resolves.toEqual([review]);
    await expect(secondRepository.listAuditLogRecords("workspace-1")).resolves.toEqual([auditLog]);

    await secondRepository.close();
  });

  it("sanitizes direct Prisma repository writes before storing records", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const privateKey = `0x${"a".repeat(64)}`;
    const workspaceId = "workspace-prisma-write-redaction";
    const workspace = {
      ...createWorkspaceRecordFixture({ id: workspaceId }),
      name: "YieldPassport raw KYC packet",
      organizationName: "YieldPassport Labs sk-live-abcdef1234567890abcdef1234567890",
      ownerId: `founder private key ${privateKey}`,
      notLegalAdviceBoundary: "Legal approval for workspace launch."
    } as WorkspaceRecord;
    const evidence = {
      ...createEvidenceVaultRecordFixture({ workspaceId }),
      filename: "raw KYC packet sk-live-abcdef1234567890abcdef1234567890.txt",
      owner: "Compliance sk-live-abcdef1234567890abcdef1234567890",
      sourceNote: `Evidence note includes raw KYC packet and private key ${privateKey}.`,
      linkedRiskFlagIds: ["governance", `private key ${privateKey}`],
      linkedControlIds: ["control-custody", "raw KYC packet"],
      replacementReason: `Replace evidence containing private key ${privateKey}.`,
      metadataBoundaryWarnings: [
        {
          dataClass: "personal-data",
          severity: "warn",
          matchCount: 1,
          redactedSnippet: `raw KYC packet and private key ${privateKey}`,
          message: "Confirm raw KYC packet before handoff."
        }
      ]
    } as EvidenceVaultRecord;
    const modelRun = {
      ...createModelGatewayRunFixture({ workspaceId }),
      providerLabel: "Mock provider sk-live-abcdef1234567890abcdef1234567890",
      model: `lexproof-model private key ${privateKey}`,
      purpose: "Draft audit preparation from raw KYC packet",
      errorCode: "MODEL_GATEWAY_sk-live-abcdef1234567890abcdef1234567890",
      errorMessage: `Remove private key ${privateKey} and raw KYC packet before retry.`,
      remediationSteps: [`Remove raw KYC packet and private key ${privateKey}.`],
      providerMetadata: {
        adapterMode: "local-mock",
        credentialPolicy: "no credentials accepted",
        secretPolicy: "Persist sk-live-abcdef1234567890abcdef1234567890 for provider retries.",
        allowedDataClasses: ["audit-prep metadata", "raw KYC packet", `private key ${privateKey}`]
      },
      notLegalAdviceBoundary: "Legal approval for AI output."
    } as ModelGatewayRun;
    const humanReview = {
      ...createHumanReviewRecordFixture({ workspaceId }),
      targetId: `model-run private key ${privateKey}`,
      reviewerId: "counsel sk-live-abcdef1234567890abcdef1234567890",
      comment: `Review returned because raw KYC packet and private key ${privateKey} were present.`,
      notLegalAdviceBoundary: "Legal approval for model output."
    } as HumanReviewRecord;
    const counselExport = {
      ...createCounselPackExportRecordFixture({ workspaceId }),
      projectName: "YieldPassport raw KYC packet",
      title: `Counsel Pack sk-live-abcdef1234567890abcdef1234567890 private key ${privateKey}`,
      artifactName: "yieldpassport raw KYC packet.md",
      createdBy: "Compliance sk-live-abcdef1234567890abcdef1234567890",
      notLegalAdviceBoundary: "Legal approval for external handoff."
    } as CounselPackExportRecord;
    const integrationRecord = {
      ...(await createIntegrationPolicyEvaluationRecordFixture({ workspaceId })),
      externalCapabilityStatus: `blocked until sk-live-abcdef1234567890abcdef1234567890 and private key ${privateKey} are removed`,
      evaluatorId: "Storage owner sk-live-abcdef1234567890abcdef1234567890",
      nextActions: [`Remove raw KYC packet and private key ${privateKey} before adapter review.`],
      notLegalAdviceBoundary: "Legal approval for external storage."
    } as IntegrationPolicyEvaluationRecord;
    const sourceApproval = createRegulatorySourceApprovalRecordFixture({
      id: "source-approval-prisma-write-redaction",
      workspaceId,
      sourceApprovalItemId: `approval private key ${privateKey}`,
      clauseId: "custody raw KYC packet",
      jurisdiction: "United States sk-live-abcdef1234567890abcdef1234567890",
      regulator: `SEC private key ${privateKey}`,
      citation: "17 CFR raw KYC packet",
      sourceName: "SEC source sk-live-abcdef1234567890abcdef1234567890",
      sourceUrl: `https://sec.example/private-key-${privateKey}`,
      effectiveAsOf: "2026-01-01 raw KYC packet",
      lastReviewedAt: `2026-06-01 private key ${privateKey}`,
      nextReviewDueAt: "2026-09-01 raw KYC packet",
      reviewerNotes: `Confirm source metadata without raw KYC packet or private key ${privateKey}.`,
      nextAction: "Remove sk-live-abcdef1234567890abcdef1234567890 before approval.",
      approvalGate: `Unsafe gate with raw KYC packet and private key ${privateKey}`,
      matchingBehaviorChanged: true,
      createdBy: `Compliance private key ${privateKey}`,
      notLegalAdviceBoundary: "Legal approval for source update."
    });
    const sourceReview = createRegulatorySourceReviewRecordFixture({
      id: "source-review-prisma-write-redaction",
      workspaceId,
      sourceReviewItemId: `review private key ${privateKey}`,
      clauseId: "custody raw KYC packet",
      jurisdiction: "United States sk-live-abcdef1234567890abcdef1234567890",
      regulator: `SEC private key ${privateKey}`,
      citation: "17 CFR raw KYC packet",
      sourceName: "SEC source sk-live-abcdef1234567890abcdef1234567890",
      sourceUrl: `https://sec.example/private-key-${privateKey}`,
      effectiveAsOf: "2026-01-01 raw KYC packet",
      lastReviewedAt: `2026-06-01 private key ${privateKey}`,
      nextReviewDueAt: "2026-09-01 raw KYC packet",
      reviewerNotes: `Confirm source metadata without raw KYC packet or private key ${privateKey}.`,
      nextAction: "Remove sk-live-abcdef1234567890abcdef1234567890 before review.",
      matchingBehaviorChanged: true,
      createdBy: `Compliance private key ${privateKey}`,
      notLegalAdviceBoundary: "Legal approval for source review."
    });
    const auditLog = {
      ...createAuditLogRecordFixture({ workspaceId }),
      actorId: "Compliance sk-live-abcdef1234567890abcdef1234567890",
      action: "evidence.updated.raw KYC packet",
      targetId: `target private key ${privateKey}`,
      beforeHash: `raw KYC packet before ${privateKey}`,
      afterHash: `raw KYC packet after ${privateKey}`,
      summary: `Updated record with raw KYC packet and private key ${privateKey}.`,
      notLegalAdviceBoundary: "Legal approval for audit log."
    } as AuditLogRecord;

    await repository.saveWorkspaceRecord(workspace);
    await repository.saveEvidenceVaultRecord(evidence);
    await repository.saveModelGatewayRun(modelRun);
    await repository.saveHumanReviewRecord(humanReview);
    await repository.saveCounselPackExportRecord(counselExport);
    await repository.saveIntegrationPolicyEvaluationRecord(integrationRecord);
    await repository.saveRegulatorySourceApprovalRecord(sourceApproval);
    await repository.saveRegulatorySourceReviewRecord(sourceReview);
    await repository.appendAuditLogRecord(auditLog);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      const storedRows = {
        workspaces: await prisma.workspaceRecord.findMany({ where: { id: workspaceId } }),
        evidence: await prisma.evidenceVaultRecord.findMany({ where: { workspaceId } }),
        modelRuns: await prisma.modelGatewayRun.findMany({ where: { workspaceId } }),
        humanReviews: await prisma.humanReviewRecord.findMany({ where: { workspaceId } }),
        counselExports: await prisma.counselPackExportRecord.findMany({ where: { workspaceId } }),
        integrations: await prisma.integrationPolicyEvaluationRecord.findMany({ where: { workspaceId } }),
        sourceApprovals: await prisma.regulatorySourceApprovalRecord.findMany({ where: { workspaceId } }),
        sourceReviews: await prisma.regulatorySourceReviewRecord.findMany({ where: { workspaceId } }),
        auditLogs: await prisma.auditLogRecord.findMany({ where: { workspaceId } })
      };
      const serialized = JSON.stringify(storedRows);

      expect(serialized).toContain("[redacted-raw-kyc]");
      expect(serialized).toContain("[redacted-private-key]");
      expect(serialized).toContain("[redacted-api-key]");
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
      expect(serialized).not.toContain("Legal approval");
      expect(storedRows.modelRuns[0].providerMetadataJson).toContain(
        "No model provider secrets are accepted or persisted by the server gateway."
      );
      expect(storedRows.sourceApprovals[0].approvalGate).toBe(
        "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata."
      );
      expect(storedRows.sourceApprovals[0].matchingBehaviorChanged).toBe(false);
      expect(storedRows.sourceReviews[0].matchingBehaviorChanged).toBe(false);
    } finally {
      await prisma.$disconnect();
    }
  });

  it("rejects corrupted persisted Model Gateway runs instead of trusting invalid workflow fields", async () => {
    const cases = [
      {
        workspaceId: "workspace-model-corrupt-provider",
        data: { provider: "external-live-provider" },
        expectedError: "Model Gateway provider is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-status",
        data: { status: "approved" },
        expectedError: "Model Gateway run status is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-redaction",
        data: { redactionStatus: "unsafe" },
        expectedError: "Model Gateway redaction status is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-human-review",
        data: { humanReviewStatus: "auto-approved" },
        expectedError: "Model Gateway human review status is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-retry",
        data: { retryState: "retry-with-live-provider" },
        expectedError: "Model Gateway retry state is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-payload-hash",
        data: { payloadHash: "not-a-sha" },
        expectedError: "Model Gateway payload hash is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-response-hash",
        data: { responseHash: "not-a-sha" },
        expectedError: "Model Gateway response hash is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-source-hash",
        data: { sourceEvidenceHash: "not-a-sha" },
        expectedError: "Model Gateway source evidence hash is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-attempt",
        data: { attempt: 0 },
        expectedError: "Model Gateway attempt is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-max-attempts",
        data: { maxAttempts: 0 },
        expectedError: "Model Gateway max attempts is invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-attempt-range",
        data: { attempt: 2, maxAttempts: 1 },
        expectedError: "Model Gateway attempt cannot exceed max attempts."
      },
      {
        workspaceId: "workspace-model-corrupt-remediation",
        data: { remediationStepsJson: JSON.stringify(["Remove unsafe metadata", 42]) },
        expectedError: "Model Gateway remediation steps are invalid."
      },
      {
        workspaceId: "workspace-model-corrupt-provider-metadata",
        data: {
          providerMetadataJson: JSON.stringify({
            adapterMode: "live-provider",
            credentialPolicy: "no credentials accepted",
            allowedDataClasses: []
          })
        },
        expectedError: "Model Gateway provider metadata is invalid."
      }
    ];

    for (const testCase of cases) {
      const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      const run = createModelGatewayRunFixture({ workspaceId: testCase.workspaceId });

      await repository.saveModelGatewayRun(run);
      await repository.close();

      const prisma = createTestPrismaClient(databaseUrl);
      try {
        await prisma.modelGatewayRun.update({
          where: { id: run.id },
          data: testCase.data
        });
      } finally {
        await prisma.$disconnect();
      }

      const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      try {
        await expect(reader.listModelGatewayRuns(testCase.workspaceId)).rejects.toThrow(testCase.expectedError);
      } finally {
        await reader.close();
      }
    }
  });

  it("redacts corrupted persisted Model Gateway run text before returning records", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const run = createModelGatewayRunFixture({ workspaceId: "workspace-model-redaction" });
    const privateKey = `0x${"a".repeat(64)}`;

    await repository.saveModelGatewayRun(run);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.modelGatewayRun.update({
        where: { id: run.id },
        data: {
          providerLabel: "Mock provider sk-live-abcdef1234567890abcdef1234567890",
          model: `lexproof-model private key ${privateKey}`,
          purpose: "Draft audit preparation from raw KYC packet",
          errorCode: "MODEL_GATEWAY_sk-live-abcdef1234567890abcdef1234567890",
          errorMessage: `Remove private key ${privateKey} and raw KYC packet before retry.`,
          remediationStepsJson: JSON.stringify([`Remove raw KYC packet and private key ${privateKey}.`]),
          providerMetadataJson: JSON.stringify({
            adapterMode: "local-mock",
            credentialPolicy: "no credentials accepted",
            secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
            allowedDataClasses: ["audit-prep metadata", "raw KYC packet", `private key ${privateKey}`]
          })
        }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      const records = await reader.listModelGatewayRuns("workspace-model-redaction");
      const serialized = JSON.stringify(records);

      expect(records[0]).toEqual(
        expect.objectContaining({
          providerLabel: expect.stringContaining("[redacted-api-key]"),
          model: expect.stringContaining("[redacted-private-key]"),
          purpose: expect.stringContaining("[redacted-raw-kyc]"),
          errorCode: expect.stringContaining("[redacted-hex-material]"),
          errorMessage: expect.stringContaining("[redacted-private-key]"),
          remediationSteps: [expect.stringContaining("[redacted-private-key]")]
        })
      );
      expect(records[0].providerMetadata.allowedDataClasses).toEqual(
        expect.arrayContaining([expect.stringContaining("[redacted-raw-kyc]"), expect.stringContaining("[redacted-private-key]")])
      );
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
    } finally {
      await reader.close();
    }
  });

  it("rejects corrupted persisted Human Review records instead of trusting invalid workflow fields", async () => {
    const cases = [
      {
        workspaceId: "workspace-human-review-corrupt-target",
        data: { targetType: "legal-decision" },
        expectedError: "Human review target type is invalid."
      },
      {
        workspaceId: "workspace-human-review-corrupt-status",
        data: { status: "approved" },
        expectedError: "Human review status is invalid."
      }
    ];

    for (const testCase of cases) {
      const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      const review = createHumanReviewRecordFixture({ workspaceId: testCase.workspaceId });

      await repository.saveHumanReviewRecord(review);
      await repository.close();

      const prisma = createTestPrismaClient(databaseUrl);
      try {
        await prisma.humanReviewRecord.update({
          where: { id: review.id },
          data: testCase.data
        });
      } finally {
        await prisma.$disconnect();
      }

      const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      try {
        await expect(reader.listHumanReviewRecords(testCase.workspaceId)).rejects.toThrow(testCase.expectedError);
      } finally {
        await reader.close();
      }
    }
  });

  it("redacts corrupted persisted Human Review text before returning records", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const review = createHumanReviewRecordFixture({ workspaceId: "workspace-human-review-redaction" });
    const privateKey = `0x${"a".repeat(64)}`;

    await repository.saveHumanReviewRecord(review);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.humanReviewRecord.update({
        where: { id: review.id },
        data: {
          targetId: `model-run private key ${privateKey}`,
          reviewerId: "counsel sk-live-abcdef1234567890abcdef1234567890",
          comment: `Review returned because raw KYC packet and private key ${privateKey} were present.`
        }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      const records = await reader.listHumanReviewRecords("workspace-human-review-redaction");
      const serialized = JSON.stringify(records);

      expect(records[0]).toEqual(
        expect.objectContaining({
          targetId: expect.stringContaining("[redacted-private-key]"),
          reviewerId: expect.stringContaining("[redacted-api-key]"),
          comment: expect.stringContaining("[redacted-raw-kyc]")
        })
      );
      expect(serialized).toContain("[redacted-private-key]");
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
    } finally {
      await reader.close();
    }
  });

  it("rejects corrupted persisted Audit Log records instead of trusting invalid target types", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const record = createAuditLogRecordFixture({ workspaceId: "workspace-audit-corrupt-target" });

    await repository.appendAuditLogRecord(record);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.auditLogRecord.update({
        where: { id: record.id },
        data: { targetType: "legal-opinion" }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      await expect(reader.listAuditLogRecords("workspace-audit-corrupt-target")).rejects.toThrow(
        "Audit log target type is invalid."
      );
    } finally {
      await reader.close();
    }
  });

  it("redacts corrupted persisted Audit Log text before returning records", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const record = createAuditLogRecordFixture({ workspaceId: "workspace-audit-redaction" });
    const privateKey = `0x${"a".repeat(64)}`;

    await repository.appendAuditLogRecord(record);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.auditLogRecord.update({
        where: { id: record.id },
        data: {
          actorId: "Compliance sk-live-abcdef1234567890abcdef1234567890",
          action: "evidence.updated.raw KYC packet",
          targetId: `target private key ${privateKey}`,
          beforeHash: `raw KYC packet before ${privateKey}`,
          afterHash: `raw KYC packet after ${privateKey}`,
          summary: `Updated record with raw KYC packet and private key ${privateKey}.`
        }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      const records = await reader.listAuditLogRecords("workspace-audit-redaction");
      const serialized = JSON.stringify(records);

      expect(records[0]).toEqual(
        expect.objectContaining({
          actorId: expect.stringContaining("[redacted-api-key]"),
          action: expect.stringContaining("[redacted-raw-kyc]"),
          targetId: expect.stringContaining("[redacted-private-key]"),
          beforeHash: expect.stringContaining("[redacted-private-key]"),
          afterHash: expect.stringContaining("[redacted-private-key]"),
          summary: expect.stringContaining("[redacted-private-key]")
        })
      );
      expect(serialized).toContain("[redacted-raw-kyc]");
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
    } finally {
      await reader.close();
    }
  });

  it("persists workspace and evidence records across repository instances", async () => {
    const firstRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const workspace = {
      recordVersion: "lexproof-workspace-record-v1" as const,
      id: "workspace-1",
      name: "YieldPassport Counsel Review",
      organizationName: "YieldPassport Labs",
      ownerId: "founder-1",
      status: "active" as const,
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z",
      notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only." as const
    };
    const evidence = createEvidenceVaultRecordFromUpload({
      workspaceId: workspace.id,
      filename: "approval-memo.txt",
      mimeType: "text/plain",
      bytes: new TextEncoder().encode("board approval memo"),
      owner: "Compliance",
      sourceNote: `Board approval memo for counsel review with treasury wallet ${walletAddress} and contact jane.founder@example.com.`,
      linkedRiskFlagIds: ["governance", "custody"],
      linkedControlIds: ["control-governance", "control-custody"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-29T10:05:00.000Z"
    });
    const updatedEvidence = {
      ...evidence,
      status: "verified" as const,
      owner: "Counsel",
      version: evidence.version + 1,
      updatedAt: "2026-06-29T10:10:00.000Z"
    };

    await firstRepository.saveWorkspaceRecord(workspace);
    await firstRepository.saveEvidenceVaultRecord(evidence);
    await firstRepository.updateEvidenceVaultRecord(updatedEvidence);
    await firstRepository.close();

    const secondRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });

    await expect(secondRepository.findWorkspaceRecord(workspace.id)).resolves.toEqual(workspace);
    await expect(secondRepository.listEvidenceVaultRecords(workspace.id)).resolves.toEqual([updatedEvidence]);
    await expect(secondRepository.findEvidenceVaultRecord(workspace.id, evidence.id)).resolves.toEqual(updatedEvidence);
    expect(JSON.stringify(await secondRepository.listEvidenceVaultRecords(workspace.id))).not.toContain(walletAddress);
    expect(JSON.stringify(await secondRepository.listEvidenceVaultRecords(workspace.id))).not.toContain("jane.founder@example.com");

    await secondRepository.close();
  });

  it("rejects corrupted persisted workspace status instead of trusting invalid workflow state", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const workspace = createWorkspaceRecordFixture({ id: "workspace-corrupt-status" });

    await repository.saveWorkspaceRecord(workspace);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.workspaceRecord.update({
        where: { id: workspace.id },
        data: { status: "approved" }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      await expect(reader.findWorkspaceRecord(workspace.id)).rejects.toThrow("Workspace status is invalid.");
    } finally {
      await reader.close();
    }
  });

  it("redacts corrupted persisted workspace metadata before returning records", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const workspace = createWorkspaceRecordFixture({ id: "workspace-redaction" });
    const privateKey = `0x${"a".repeat(64)}`;

    await repository.saveWorkspaceRecord(workspace);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.workspaceRecord.update({
        where: { id: workspace.id },
        data: {
          name: `YieldPassport raw KYC packet private key ${privateKey}`,
          organizationName: "YieldPassport Labs sk-live-abcdef1234567890abcdef1234567890",
          ownerId: `founder private key ${privateKey}`
        }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      const record = await reader.findWorkspaceRecord(workspace.id);
      const serialized = JSON.stringify(record);

      expect(record).toEqual(
        expect.objectContaining({
          name: expect.stringContaining("[redacted-private-key]"),
          organizationName: expect.stringContaining("[redacted-api-key]"),
          ownerId: expect.stringContaining("[redacted-private-key]")
        })
      );
      expect(serialized).toContain("[redacted-raw-kyc]");
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
    } finally {
      await reader.close();
    }
  });

  it("rejects corrupted persisted Evidence Vault records instead of defaulting unsafe metadata", async () => {
    const validWarning = {
      dataClass: "personal-data",
      severity: "warn",
      matchCount: 1,
      redactedSnippet: "[redacted-email]",
      message: "Direct personal identifiers must be redacted or summarized before external handoff."
    };
    const cases = [
      {
        workspaceId: "workspace-evidence-corrupt-storage",
        data: { storageMode: "external-live-vault" },
        expectedError: "Evidence Vault storage mode is invalid."
      },
      {
        workspaceId: "workspace-evidence-corrupt-status",
        data: { status: "approved" },
        expectedError: "Evidence Vault status is invalid."
      },
      {
        workspaceId: "workspace-evidence-corrupt-hash",
        data: { fileHash: "not-a-sha" },
        expectedError: "Evidence Vault file hash is invalid."
      },
      {
        workspaceId: "workspace-evidence-corrupt-risk-links",
        data: { linkedRiskFlagIdsJson: JSON.stringify(["governance", 42]) },
        expectedError: "Evidence Vault linked risk flag ids are invalid."
      },
      {
        workspaceId: "workspace-evidence-corrupt-warning",
        data: { metadataBoundaryWarningsJson: JSON.stringify([{ ...validWarning, severity: "block" }]) },
        expectedError: "Evidence Vault metadata boundary warnings are invalid."
      },
      {
        workspaceId: "workspace-evidence-corrupt-warning-count",
        data: { metadataBoundaryWarningsJson: JSON.stringify([{ ...validWarning, matchCount: -1 }]) },
        expectedError: "Evidence Vault metadata boundary warnings are invalid."
      }
    ];

    for (const testCase of cases) {
      const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      const evidence = createEvidenceVaultRecordFixture({ workspaceId: testCase.workspaceId });

      await repository.saveEvidenceVaultRecord(evidence);
      await repository.close();

      const prisma = createTestPrismaClient(databaseUrl);
      try {
        await prisma.evidenceVaultRecord.update({
          where: { id: evidence.id },
          data: testCase.data
        });
      } finally {
        await prisma.$disconnect();
      }

      const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      try {
        await expect(reader.listEvidenceVaultRecords(testCase.workspaceId)).rejects.toThrow(testCase.expectedError);
      } finally {
        await reader.close();
      }
    }
  });

  it("redacts corrupted persisted Evidence Vault metadata before returning records", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const evidence = createEvidenceVaultRecordFixture({ workspaceId: "workspace-evidence-redaction" });
    const privateKey = `0x${"a".repeat(64)}`;

    await repository.saveEvidenceVaultRecord(evidence);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.evidenceVaultRecord.update({
        where: { id: evidence.id },
        data: {
          filename: "raw KYC packet sk-live-abcdef1234567890abcdef1234567890.txt",
          owner: "Compliance sk-live-abcdef1234567890abcdef1234567890",
          sourceNote: `Evidence note includes raw KYC packet and private key ${privateKey}.`,
          linkedRiskFlagIdsJson: JSON.stringify(["governance", `private key ${privateKey}`]),
          linkedControlIdsJson: JSON.stringify(["control-custody", "raw KYC packet"]),
          replacementReason: `Replace evidence containing private key ${privateKey}.`,
          metadataBoundaryWarningsJson: JSON.stringify([
            {
              dataClass: "personal-data",
              severity: "warn",
              matchCount: 1,
              redactedSnippet: `raw KYC packet and private key ${privateKey}`,
              message: "Confirm raw KYC packet before handoff."
            }
          ])
        }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      const records = await reader.listEvidenceVaultRecords("workspace-evidence-redaction");
      const serialized = JSON.stringify(records);

      expect(records[0]).toEqual(
        expect.objectContaining({
          filename: expect.stringContaining("[redacted-api-key]"),
          owner: expect.stringContaining("[redacted-api-key]"),
          sourceNote: expect.stringContaining("[redacted-private-key]"),
          replacementReason: expect.stringContaining("[redacted-private-key]")
        })
      );
      expect(records[0].linkedRiskFlagIds).toEqual(expect.arrayContaining([expect.stringContaining("[redacted-private-key]")]));
      expect(records[0].linkedControlIds).toEqual(expect.arrayContaining([expect.stringContaining("[redacted-raw-kyc]")]));
      expect(records[0].metadataBoundaryWarnings?.[0]).toEqual(
        expect.objectContaining({
          redactedSnippet: expect.stringContaining("[redacted-private-key]"),
          message: expect.stringContaining("[redacted-raw-kyc]")
        })
      );
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
    } finally {
      await reader.close();
    }
  });

  it("persists Counsel Pack export records across repository instances", async () => {
    const firstRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const exportRecord = createCounselPackExportRecord({
      workspaceId: "workspace-1",
      projectName: "YieldPassport",
      title: "YieldPassport Counsel Pack v1",
      format: "markdown",
      version: 1,
      artifactName: "yieldpassport-counsel-pack.md",
      manifestHash: "a".repeat(64),
      artifactHash: "b".repeat(64),
      artifactSize: 4096,
      riskLevel: "critical",
      reviewSummary: {
        total: 7,
        reviewed: 1,
        readyForCounsel: 2,
        needsEvidence: 3,
        blocked: 1,
        open: 6
      },
      sourceCount: 4,
      sourcePackHash: "c".repeat(64),
      sourceReviewStatus: "current",
      jurisdictionReadinessDigest: {
        digestHash: "d".repeat(64),
        status: "needs-evidence",
        handoffAllowed: false,
        jurisdictionCount: 2,
        readyForCounselCount: 0,
        needsEvidenceCount: 2,
        needsSourceReviewCount: 0,
        metadataMissingCount: 0,
        openEvidenceRequestCount: 8,
        sourceFreshnessBlockerCount: 1,
        dueSoonSourceCount: 0,
        notLegalAdviceBoundary:
          "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
      },
      createdBy: "Compliance",
      includesRawKycOrPersonalData: false,
      includesCredentialMaterial: false,
      createdAt: "2026-06-30T08:30:00.000Z"
    });

    await firstRepository.saveCounselPackExportRecord(exportRecord);
    await firstRepository.close();

    const secondRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });

    await expect(secondRepository.listCounselPackExportRecords("workspace-1")).resolves.toEqual([exportRecord]);
    await expect(secondRepository.findCounselPackExportRecord("workspace-1", exportRecord.id)).resolves.toEqual(exportRecord);

    await secondRepository.close();
  });

  it("persists integration policy evaluation records across repository instances", async () => {
    const firstRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const report = createObjectStoragePolicyReport({
      context: {
        workspaceId: "workspace-1",
        evidenceCount: 2,
        retentionStatus: "ready",
        vaultSyncAllowed: true,
        blockerCount: 0,
        manifestHash: "a".repeat(64)
      },
      policy: {
        policyOwner: "Storage owner",
        retentionDays: 365,
        deletionSlaDays: 30,
        encryptionAtRestApproved: true,
        bucketAllowlistApproved: true,
        accessLoggingApproved: true,
        lifecyclePolicyApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Ready for future adapter review."
      }
    });
    const record = await createIntegrationPolicyEvaluationRecord({
      workspaceId: "workspace-1",
      policyId: "object-storage",
      report,
      context: { workspaceId: "workspace-1", evidenceCount: 2, manifestHash: "a".repeat(64) },
      policy: { policyOwner: "Storage owner", retentionDays: 365 },
      evaluatorId: "Storage owner",
      createdAt: "2026-07-03T08:30:00.000Z"
    });

    await firstRepository.saveIntegrationPolicyEvaluationRecord(record);
    await firstRepository.close();

    const secondRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });

    await expect(secondRepository.listIntegrationPolicyEvaluationRecords("workspace-1")).resolves.toEqual([record]);

    await secondRepository.close();
  });

  it("rejects corrupted persisted Counsel Pack export records instead of defaulting unsafe fields", async () => {
    const validReviewSummary = {
      total: 7,
      reviewed: 1,
      readyForCounsel: 2,
      needsEvidence: 3,
      blocked: 1,
      open: 6
    };
    const validJurisdictionDigest = {
      digestHash: "d".repeat(64),
      status: "needs-evidence",
      handoffAllowed: false,
      jurisdictionCount: 2,
      readyForCounselCount: 0,
      needsEvidenceCount: 2,
      needsSourceReviewCount: 0,
      metadataMissingCount: 0,
      openEvidenceRequestCount: 8,
      sourceFreshnessBlockerCount: 1,
      dueSoonSourceCount: 0,
      notLegalAdviceBoundary:
        "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
    };
    const cases = [
      {
        workspaceId: "workspace-export-corrupt-type",
        data: { exportType: "submission-pack" },
        expectedError: "Counsel Pack export type is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-format",
        data: { format: "docx" },
        expectedError: "Counsel Pack export format is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-risk",
        data: { riskLevel: "urgent" },
        expectedError: "Counsel Pack export risk level is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-status",
        data: { status: "draft" },
        expectedError: "Counsel Pack export status is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-version",
        data: { version: 0 },
        expectedError: "Counsel Pack export version is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-artifact-size",
        data: { artifactSize: 0 },
        expectedError: "Counsel Pack export artifact size is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-source-count",
        data: { sourceCount: -1 },
        expectedError: "Counsel Pack export source count is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-source-review",
        data: { sourceReviewStatus: "stale" },
        expectedError: "Counsel Pack export source review status is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-review-summary",
        data: { reviewSummaryJson: JSON.stringify({ ...validReviewSummary, blocked: -1 }) },
        expectedError: "Counsel Pack export review summary is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-jurisdiction-digest",
        data: { jurisdictionReadinessDigestJson: JSON.stringify({ ...validJurisdictionDigest, status: "launch-approved" }) },
        expectedError: "Counsel Pack export jurisdiction readiness digest is invalid."
      },
      {
        workspaceId: "workspace-export-corrupt-jurisdiction-handoff",
        data: { jurisdictionReadinessDigestJson: JSON.stringify({ ...validJurisdictionDigest, handoffAllowed: "yes" }) },
        expectedError: "Counsel Pack export jurisdiction readiness digest is invalid."
      }
    ];

    for (const testCase of cases) {
      const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      const record = createCounselPackExportRecordFixture({ workspaceId: testCase.workspaceId });

      await repository.saveCounselPackExportRecord(record);
      await repository.close();

      const prisma = createTestPrismaClient(databaseUrl);
      try {
        await prisma.counselPackExportRecord.update({
          where: { id: record.id },
          data: testCase.data
        });
      } finally {
        await prisma.$disconnect();
      }

      const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      try {
        await expect(reader.listCounselPackExportRecords(testCase.workspaceId)).rejects.toThrow(testCase.expectedError);
      } finally {
        await reader.close();
      }
    }
  });

  it("redacts corrupted persisted Counsel Pack export text before returning records", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const record = createCounselPackExportRecordFixture({ workspaceId: "workspace-export-redaction" });
    const privateKey = `0x${"a".repeat(64)}`;

    await repository.saveCounselPackExportRecord(record);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.counselPackExportRecord.update({
        where: { id: record.id },
        data: {
          projectName: "YieldPassport raw KYC packet",
          title: `Counsel Pack sk-live-abcdef1234567890abcdef1234567890 private key ${privateKey}`,
          artifactName: "yieldpassport raw KYC packet.md",
          createdBy: "Compliance sk-live-abcdef1234567890abcdef1234567890"
        }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      const records = await reader.listCounselPackExportRecords("workspace-export-redaction");
      const serialized = JSON.stringify(records);

      expect(records[0]).toEqual(
        expect.objectContaining({
          projectName: expect.stringContaining("[redacted-raw-kyc]"),
          title: expect.stringContaining("[redacted-api-key]"),
          artifactName: expect.stringContaining("[redacted-raw-kyc]"),
          createdBy: expect.stringContaining("[redacted-api-key]")
        })
      );
      expect(serialized).toContain("[redacted-private-key]");
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
    } finally {
      await reader.close();
    }
  });

  it("rejects corrupted persisted integration policy receipts instead of defaulting unsafe fields", async () => {
    const cases = [
      {
        workspaceId: "workspace-policy-corrupt-id",
        data: { policyId: "external-webhook" },
        expectedError: "Integration policy id is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-status",
        data: { overallStatus: "enabled" },
        expectedError: "Integration policy status is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-capability",
        data: { externalCapabilityAllowed: true },
        expectedError: "Integration policy external capability flag is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-source",
        data: { source: "client" },
        expectedError: "Integration policy source is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-approved-count",
        data: { approvedControlCount: -1 },
        expectedError: "Integration policy approved control count is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-required-count",
        data: { requiredControlCount: -1 },
        expectedError: "Integration policy required control count is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-report-hash",
        data: { reportHash: "not-a-sha" },
        expectedError: "Integration policy report hash is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-context-hash",
        data: { contextHash: "not-a-sha" },
        expectedError: "Integration policy context hash is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-policy-hash",
        data: { policyHash: "not-a-sha" },
        expectedError: "Integration policy policy hash is invalid."
      },
      {
        workspaceId: "workspace-policy-corrupt-next-actions",
        data: { nextActionsJson: JSON.stringify(["Review metadata-only policy", 42]) },
        expectedError: "Integration policy next actions are invalid."
      }
    ];

    for (const testCase of cases) {
      const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      const record = await createIntegrationPolicyEvaluationRecordFixture({ workspaceId: testCase.workspaceId });

      await repository.saveIntegrationPolicyEvaluationRecord(record);
      await repository.close();

      const prisma = createTestPrismaClient(databaseUrl);
      try {
        await prisma.integrationPolicyEvaluationRecord.update({
          where: { id: record.id },
          data: testCase.data
        });
      } finally {
        await prisma.$disconnect();
      }

      const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      try {
        await expect(reader.listIntegrationPolicyEvaluationRecords(testCase.workspaceId)).rejects.toThrow(testCase.expectedError);
      } finally {
        await reader.close();
      }
    }
  });

  it("redacts corrupted persisted integration policy receipt text before returning records", async () => {
    const repository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const record = await createIntegrationPolicyEvaluationRecordFixture({ workspaceId: "workspace-policy-redaction" });
    const privateKey = `0x${"a".repeat(64)}`;

    await repository.saveIntegrationPolicyEvaluationRecord(record);
    await repository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.integrationPolicyEvaluationRecord.update({
        where: { id: record.id },
        data: {
          externalCapabilityStatus: `blocked until sk-live-abcdef1234567890abcdef1234567890 and private key ${privateKey} are removed`,
          evaluatorId: "Storage owner sk-live-abcdef1234567890abcdef1234567890",
          nextActionsJson: JSON.stringify([`Remove raw KYC packet and private key ${privateKey} before adapter review.`])
        }
      });
    } finally {
      await prisma.$disconnect();
    }

    const reader = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      const records = await reader.listIntegrationPolicyEvaluationRecords("workspace-policy-redaction");
      const serialized = JSON.stringify(records);

      expect(records[0]).toEqual(
        expect.objectContaining({
          externalCapabilityStatus: expect.stringContaining("[redacted-api-key]"),
          evaluatorId: expect.stringContaining("[redacted-api-key]"),
          nextActions: [expect.stringContaining("[redacted-private-key]")]
        })
      );
      expect(serialized).toContain("[redacted-raw-kyc]");
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
    } finally {
      await reader.close();
    }
  });

  it("persists regulatory source approval and review records across repository instances", async () => {
    const firstRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const approvalRecord = createRegulatorySourceApprovalRecordFixture();
    const reviewRecord = createRegulatorySourceReviewRecordFixture();

    await firstRepository.saveRegulatorySourceApprovalRecord(approvalRecord);
    await firstRepository.saveRegulatorySourceReviewRecord(reviewRecord);
    await firstRepository.close();

    const secondRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });

    await expect(secondRepository.listRegulatorySourceApprovalRecords("workspace-1")).resolves.toEqual([approvalRecord]);
    await expect(secondRepository.listRegulatorySourceReviewRecords("workspace-1")).resolves.toEqual([reviewRecord]);

    await secondRepository.close();
  });

  it("rejects corrupted persisted source approval records instead of defaulting source workflow fields", async () => {
    const cases = [
      {
        workspaceId: "workspace-source-approval-corrupt-hash",
        data: { queueHash: "not-a-sha" },
        expectedError: "Source approval queue hash is invalid."
      },
      {
        workspaceId: "workspace-source-approval-corrupt-priority",
        data: { priority: "P3" },
        expectedError: "Source approval priority is invalid."
      },
      {
        workspaceId: "workspace-source-approval-corrupt-approval-status",
        data: { approvalStatus: "approved" },
        expectedError: "Source approval status is invalid."
      },
      {
        workspaceId: "workspace-source-approval-corrupt-review-status",
        data: { reviewStatus: "stale" },
        expectedError: "Source review status is invalid."
      },
      {
        workspaceId: "workspace-source-approval-corrupt-status",
        data: { status: "approved" },
        expectedError: "Source approval record status is invalid."
      },
      {
        workspaceId: "workspace-source-approval-corrupt-matching",
        data: { matchingBehaviorChanged: true },
        expectedError: "Source approval matching behavior changed flag is invalid."
      }
    ];

    for (const testCase of cases) {
      const firstRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      const approvalRecord = createRegulatorySourceApprovalRecordFixture({
        id: `${testCase.workspaceId}-record`,
        workspaceId: testCase.workspaceId
      });

      await firstRepository.saveRegulatorySourceApprovalRecord(approvalRecord);
      await firstRepository.close();

      const prisma = createTestPrismaClient(databaseUrl);
      try {
        await prisma.regulatorySourceApprovalRecord.update({
          where: { id: approvalRecord.id },
          data: testCase.data
        });
      } finally {
        await prisma.$disconnect();
      }

      const secondRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      try {
        await expect(secondRepository.listRegulatorySourceApprovalRecords(testCase.workspaceId)).rejects.toThrow(
          testCase.expectedError
        );
      } finally {
        await secondRepository.close();
      }
    }
  });

  it("rejects corrupted persisted source review records instead of defaulting source workflow fields", async () => {
    const cases = [
      {
        workspaceId: "workspace-source-review-corrupt-hash",
        data: { ledgerHash: "not-a-sha" },
        expectedError: "Source review ledger hash is invalid."
      },
      {
        workspaceId: "workspace-source-review-corrupt-review-status",
        data: { reviewStatus: "stale" },
        expectedError: "Source review status is invalid."
      },
      {
        workspaceId: "workspace-source-review-corrupt-priority",
        data: { priority: "P3" },
        expectedError: "Source review priority is invalid."
      },
      {
        workspaceId: "workspace-source-review-corrupt-status",
        data: { status: "approved" },
        expectedError: "Source review record status is invalid."
      },
      {
        workspaceId: "workspace-source-review-corrupt-matching",
        data: { matchingBehaviorChanged: true },
        expectedError: "Source review matching behavior changed flag is invalid."
      }
    ];

    for (const testCase of cases) {
      const firstRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      const reviewRecord = createRegulatorySourceReviewRecordFixture({
        id: `${testCase.workspaceId}-record`,
        workspaceId: testCase.workspaceId
      });

      await firstRepository.saveRegulatorySourceReviewRecord(reviewRecord);
      await firstRepository.close();

      const prisma = createTestPrismaClient(databaseUrl);
      try {
        await prisma.regulatorySourceReviewRecord.update({
          where: { id: reviewRecord.id },
          data: testCase.data
        });
      } finally {
        await prisma.$disconnect();
      }

      const secondRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
      try {
        await expect(secondRepository.listRegulatorySourceReviewRecords(testCase.workspaceId)).rejects.toThrow(
          testCase.expectedError
        );
      } finally {
        await secondRepository.close();
      }
    }
  });

  it("redacts corrupted persisted source approval and review text before returning records", async () => {
    const firstRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    const approvalRecord = createRegulatorySourceApprovalRecordFixture({
      id: "source-approval-redaction-record",
      workspaceId: "workspace-source-redaction"
    });
    const reviewRecord = createRegulatorySourceReviewRecordFixture({
      id: "source-review-redaction-record",
      workspaceId: "workspace-source-redaction"
    });
    const privateKey = `0x${"a".repeat(64)}`;

    await firstRepository.saveRegulatorySourceApprovalRecord(approvalRecord);
    await firstRepository.saveRegulatorySourceReviewRecord(reviewRecord);
    await firstRepository.close();

    const prisma = createTestPrismaClient(databaseUrl);
    try {
      await prisma.regulatorySourceApprovalRecord.update({
        where: { id: approvalRecord.id },
        data: {
          sourceApprovalItemId: `approval private key ${privateKey}`,
          clauseId: "custody raw KYC packet",
          jurisdiction: "United States sk-live-abcdef1234567890abcdef1234567890",
          regulator: `SEC private key ${privateKey}`,
          citation: "17 CFR raw KYC packet",
          sourceName: "SEC source sk-live-abcdef1234567890abcdef1234567890",
          sourceUrl: `https://sec.example/private-key-${privateKey}`,
          effectiveAsOf: "2026-01-01 raw KYC packet",
          lastReviewedAt: `2026-06-01 private key ${privateKey}`,
          nextReviewDueAt: "2026-09-01 raw KYC packet",
          reviewerNotes: `Confirm source metadata without raw KYC packet or private key ${privateKey}.`,
          nextAction: "Remove sk-live-abcdef1234567890abcdef1234567890 before approval.",
          createdBy: `Compliance private key ${privateKey}`
        }
      });
      await prisma.regulatorySourceReviewRecord.update({
        where: { id: reviewRecord.id },
        data: {
          sourceReviewItemId: `review private key ${privateKey}`,
          clauseId: "custody raw KYC packet",
          jurisdiction: "United States sk-live-abcdef1234567890abcdef1234567890",
          regulator: `SEC private key ${privateKey}`,
          citation: "17 CFR raw KYC packet",
          sourceName: "SEC source sk-live-abcdef1234567890abcdef1234567890",
          sourceUrl: `https://sec.example/private-key-${privateKey}`,
          effectiveAsOf: "2026-01-01 raw KYC packet",
          lastReviewedAt: `2026-06-01 private key ${privateKey}`,
          nextReviewDueAt: "2026-09-01 raw KYC packet",
          reviewerNotes: `Confirm source metadata without raw KYC packet or private key ${privateKey}.`,
          nextAction: "Remove sk-live-abcdef1234567890abcdef1234567890 before review.",
          createdBy: `Compliance private key ${privateKey}`
        }
      });
    } finally {
      await prisma.$disconnect();
    }

    const secondRepository = await createPrismaReviewWorkspaceRepository({ databaseUrl });
    try {
      const approvals = await secondRepository.listRegulatorySourceApprovalRecords("workspace-source-redaction");
      const reviews = await secondRepository.listRegulatorySourceReviewRecords("workspace-source-redaction");
      const serialized = JSON.stringify({ approvals, reviews });

      expect(approvals[0]).toEqual(
        expect.objectContaining({
          sourceApprovalItemId: expect.stringContaining("[redacted-private-key]"),
          clauseId: expect.stringContaining("[redacted-raw-kyc]"),
          jurisdiction: expect.stringContaining("[redacted-api-key]"),
          regulator: expect.stringContaining("[redacted-private-key]"),
          sourceUrl: expect.stringContaining("[redacted-private-key]"),
          reviewerNotes: expect.stringContaining("[redacted-private-key]"),
          nextAction: expect.stringContaining("[redacted-api-key]"),
          createdBy: expect.stringContaining("[redacted-private-key]")
        })
      );
      expect(reviews[0]).toEqual(
        expect.objectContaining({
          sourceReviewItemId: expect.stringContaining("[redacted-private-key]"),
          clauseId: expect.stringContaining("[redacted-raw-kyc]"),
          jurisdiction: expect.stringContaining("[redacted-api-key]"),
          regulator: expect.stringContaining("[redacted-private-key]"),
          sourceUrl: expect.stringContaining("[redacted-private-key]"),
          reviewerNotes: expect.stringContaining("[redacted-private-key]"),
          nextAction: expect.stringContaining("[redacted-api-key]"),
          createdBy: expect.stringContaining("[redacted-private-key]")
        })
      );
      expect(serialized).toContain("[redacted-raw-kyc]");
      expect(serialized).not.toContain("sk-live-abcdef");
      expect(serialized).not.toContain(privateKey);
      expect(serialized.toLowerCase()).not.toContain("raw kyc");
    } finally {
      await secondRepository.close();
    }
  });
});

function createTestPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });
}

function createModelGatewayRunFixture({ workspaceId }: { workspaceId: string }): ModelGatewayRun {
  const modelResult = createModelGatewayRun({
    workspaceId,
    provider: "mock",
    model: "lexproof-mock",
    purpose: "Draft audit preparation issue spotting for counsel review.",
    redactionStatus: "clean",
    includesCredentialMaterial: false,
    includesRawKycOrPersonalData: false,
    humanReviewOwner: "Compliance",
    allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
    payload: { projectName: "YieldPassport" },
    createdAt: "2026-06-29T10:00:00.000Z"
  });

  if (!modelResult.valid) {
    throw new Error(modelResult.errors.join(", "));
  }

  return modelResult.run;
}

function createHumanReviewRecordFixture({ workspaceId }: { workspaceId: string }): HumanReviewRecord {
  return createHumanReviewRecord({
    workspaceId,
    targetType: "model-run",
    targetId: "model-gateway-run-review-target",
    reviewerId: "counsel-1",
    comment: "Review model run before export.",
    createdAt: "2026-06-29T10:05:00.000Z"
  });
}

function createAuditLogRecordFixture({ workspaceId }: { workspaceId: string }): AuditLogRecord {
  return createAuditLogRecord({
    workspaceId,
    actorId: "system",
    action: "evidence.updated",
    targetType: "evidence",
    targetId: "evidence-vault-review-target",
    beforeHash: "received",
    afterHash: "verified",
    summary: "Updated evidence status to verified.",
    createdAt: "2026-06-30T00:02:00.000Z"
  });
}

function createWorkspaceRecordFixture({ id }: { id: string }): WorkspaceRecord {
  return {
    recordVersion: "lexproof-workspace-record-v1",
    id,
    name: "YieldPassport Counsel Review",
    organizationName: "YieldPassport Labs",
    ownerId: "founder-1",
    status: "active",
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
  };
}

function createEvidenceVaultRecordFixture({ workspaceId }: { workspaceId: string }): EvidenceVaultRecord {
  return createEvidenceVaultRecordFromUpload({
    workspaceId,
    filename: "approval-memo.txt",
    mimeType: "text/plain",
    bytes: new TextEncoder().encode("board approval memo"),
    owner: "Compliance",
    sourceNote: "Board approval memo for counsel review.",
    linkedRiskFlagIds: ["governance", "custody"],
    linkedControlIds: ["control-governance", "control-custody"],
    containsRawKycOrPersonalData: false,
    createdAt: "2026-06-29T10:05:00.000Z"
  });
}

function createCounselPackExportRecordFixture({
  workspaceId
}: {
  workspaceId: string;
}): CounselPackExportRecord {
  return createCounselPackExportRecord({
    workspaceId,
    projectName: "YieldPassport",
    title: "YieldPassport Counsel Pack v1",
    format: "markdown",
    version: 1,
    artifactName: "yieldpassport-counsel-pack.md",
    manifestHash: "a".repeat(64),
    artifactHash: "b".repeat(64),
    artifactSize: 4096,
    riskLevel: "critical",
    reviewSummary: {
      total: 7,
      reviewed: 1,
      readyForCounsel: 2,
      needsEvidence: 3,
      blocked: 1,
      open: 6
    },
    sourceCount: 4,
    sourcePackHash: "c".repeat(64),
    sourceReviewStatus: "current",
    jurisdictionReadinessDigest: {
      digestHash: "d".repeat(64),
      status: "needs-evidence",
      handoffAllowed: false,
      jurisdictionCount: 2,
      readyForCounselCount: 0,
      needsEvidenceCount: 2,
      needsSourceReviewCount: 0,
      metadataMissingCount: 0,
      openEvidenceRequestCount: 8,
      sourceFreshnessBlockerCount: 1,
      dueSoonSourceCount: 0,
      notLegalAdviceBoundary:
        "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
    },
    createdBy: "Compliance",
    includesRawKycOrPersonalData: false,
    includesCredentialMaterial: false,
    createdAt: "2026-06-30T08:30:00.000Z"
  });
}

async function createIntegrationPolicyEvaluationRecordFixture({
  workspaceId
}: {
  workspaceId: string;
}): Promise<IntegrationPolicyEvaluationRecord> {
  const report = createObjectStoragePolicyReport({
    context: {
      workspaceId,
      evidenceCount: 2,
      retentionStatus: "ready",
      vaultSyncAllowed: true,
      blockerCount: 0,
      manifestHash: "a".repeat(64)
    },
    policy: {
      policyOwner: "Storage owner",
      retentionDays: 365,
      deletionSlaDays: 30,
      encryptionAtRestApproved: true,
      bucketAllowlistApproved: true,
      accessLoggingApproved: true,
      lifecyclePolicyApproved: true,
      noSensitiveMaterialConfirmed: true,
      humanReviewRequired: true,
      notes: "Ready for future adapter review."
    }
  });

  return createIntegrationPolicyEvaluationRecord({
    workspaceId,
    policyId: "object-storage",
    report,
    context: { workspaceId, evidenceCount: 2, manifestHash: "a".repeat(64) },
    policy: { policyOwner: "Storage owner", retentionDays: 365 },
    evaluatorId: "Storage owner",
    createdAt: "2026-07-03T08:30:00.000Z"
  });
}

function createRegulatorySourceApprovalRecordFixture(
  overrides: Partial<RegulatorySourceApprovalRecord> = {}
): RegulatorySourceApprovalRecord {
  return {
    recordVersion: "lexproof-source-approval-record-v1",
    id: "source-approval-record-1",
    workspaceId: "workspace-1",
    queueHash: "a".repeat(64),
    sourceApprovalItemId: "source-approval-item-1",
    clauseId: "custody-control",
    jurisdiction: "United States",
    regulator: "SEC",
    citation: "17 CFR 275.206(4)-2",
    sourceName: "SEC Custody Rule",
    sourceUrl: "https://www.sec.gov/rules/final/ia-2176.htm",
    priority: "P0",
    approvalStatus: "approval-required",
    reviewStatus: "review-due",
    effectiveAsOf: "2026-01-01",
    lastReviewedAt: "2026-06-01",
    nextReviewDueAt: "2026-09-01",
    reviewerNotes: "Confirm refreshed custody source metadata before counsel handoff.",
    nextAction: "Record counsel or compliance approval for refreshed source metadata.",
    approvalGate:
      "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
    status: "pending-review",
    matchingBehaviorChanged: false,
    createdBy: "Compliance",
    createdAt: "2026-07-01T10:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only.",
    ...overrides
  };
}

function createRegulatorySourceReviewRecordFixture(
  overrides: Partial<RegulatorySourceReviewRecord> = {}
): RegulatorySourceReviewRecord {
  return {
    recordVersion: "lexproof-source-review-record-v1",
    id: "source-review-record-1",
    workspaceId: "workspace-1",
    ledgerHash: "b".repeat(64),
    sourceReviewItemId: "source-review-item-1",
    clauseId: "custody-control",
    jurisdiction: "United States",
    regulator: "SEC",
    citation: "17 CFR 275.206(4)-2",
    sourceName: "SEC Custody Rule",
    sourceUrl: "https://www.sec.gov/rules/final/ia-2176.htm",
    reviewStatus: "current",
    priority: "P1",
    effectiveAsOf: "2026-01-01",
    lastReviewedAt: "2026-06-01",
    nextReviewDueAt: "2026-09-01",
    reviewerNotes: "Source metadata is current for audit preparation.",
    nextAction: "Keep this source in the review calendar.",
    status: "current",
    matchingBehaviorChanged: false,
    createdBy: "Compliance",
    createdAt: "2026-07-01T10:05:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only.",
    ...overrides
  };
}
