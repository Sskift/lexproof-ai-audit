import { PrismaClient } from "@prisma/client";
import type {
  AuditLogRecord,
  CounselPackExportRecord,
  EvidenceVaultRecord,
  HumanReviewRecord,
  ModelGatewayRun,
  RegulatorySourceApprovalRecord,
  RegulatorySourceReviewRecord,
  WorkspaceRecord
} from "../src/lib/phase2Types.js";
import { redactClassifiedText } from "../src/lib/dataClassification.js";
import { sanitizeCounselPackExportRecord } from "../src/lib/counselPackExportRecords.js";
import type { IntegrationPolicyEvaluationRecord } from "../src/lib/integrationPolicyEvaluation.js";

export type ReviewWorkspaceRepository = {
  saveWorkspaceRecord(record: WorkspaceRecord): Promise<void>;
  updateWorkspaceRecord(record: WorkspaceRecord): Promise<void>;
  findWorkspaceRecord(workspaceId: string): Promise<WorkspaceRecord | null>;
  saveEvidenceVaultRecord(record: EvidenceVaultRecord): Promise<void>;
  updateEvidenceVaultRecord(record: EvidenceVaultRecord): Promise<void>;
  listEvidenceVaultRecords(workspaceId: string): Promise<EvidenceVaultRecord[]>;
  findEvidenceVaultRecord(workspaceId: string, evidenceId: string): Promise<EvidenceVaultRecord | null>;
  saveModelGatewayRun(run: ModelGatewayRun): Promise<void>;
  listModelGatewayRuns(workspaceId: string): Promise<ModelGatewayRun[]>;
  findModelGatewayRun(workspaceId: string, runId: string): Promise<ModelGatewayRun | null>;
  saveHumanReviewRecord(record: HumanReviewRecord): Promise<void>;
  updateHumanReviewRecord(record: HumanReviewRecord): Promise<void>;
  listHumanReviewRecords(workspaceId: string): Promise<HumanReviewRecord[]>;
  saveCounselPackExportRecord(record: CounselPackExportRecord): Promise<void>;
  listCounselPackExportRecords(workspaceId: string): Promise<CounselPackExportRecord[]>;
  findCounselPackExportRecord(workspaceId: string, exportId: string): Promise<CounselPackExportRecord | null>;
  saveIntegrationPolicyEvaluationRecord(record: IntegrationPolicyEvaluationRecord): Promise<void>;
  listIntegrationPolicyEvaluationRecords(workspaceId: string): Promise<IntegrationPolicyEvaluationRecord[]>;
  saveRegulatorySourceApprovalRecord(record: RegulatorySourceApprovalRecord): Promise<void>;
  listRegulatorySourceApprovalRecords(workspaceId: string): Promise<RegulatorySourceApprovalRecord[]>;
  saveRegulatorySourceReviewRecord(record: RegulatorySourceReviewRecord): Promise<void>;
  listRegulatorySourceReviewRecords(workspaceId: string): Promise<RegulatorySourceReviewRecord[]>;
  appendAuditLogRecord(record: AuditLogRecord): Promise<void>;
  listAuditLogRecords(workspaceId: string): Promise<AuditLogRecord[]>;
  close(): Promise<void>;
};

export type PrismaReviewWorkspaceRepositoryOptions = {
  databaseUrl: string;
};

export function createMemoryReviewWorkspaceRepository(): ReviewWorkspaceRepository {
  const workspaces = new Map<string, WorkspaceRecord>();
  const evidenceRecords = new Map<string, EvidenceVaultRecord[]>();
  const modelRuns = new Map<string, ModelGatewayRun[]>();
  const humanReviews = new Map<string, HumanReviewRecord[]>();
  const counselPackExports = new Map<string, CounselPackExportRecord[]>();
  const integrationPolicyEvaluations = new Map<string, IntegrationPolicyEvaluationRecord[]>();
  const sourceApprovals = new Map<string, RegulatorySourceApprovalRecord[]>();
  const sourceReviews = new Map<string, RegulatorySourceReviewRecord[]>();
  const auditLogs = new Map<string, AuditLogRecord[]>();

  return {
    async saveWorkspaceRecord(record) {
      const sanitizedRecord = sanitizeWorkspaceRecord(record);
      workspaces.set(sanitizedRecord.id, sanitizedRecord);
    },

    async updateWorkspaceRecord(record) {
      const sanitizedRecord = sanitizeWorkspaceRecord(record);
      workspaces.set(sanitizedRecord.id, sanitizedRecord);
    },

    async findWorkspaceRecord(workspaceId) {
      const record = workspaces.get(workspaceId);
      return record ? sanitizeWorkspaceRecord(record) : null;
    },

    async saveEvidenceVaultRecord(record) {
      const sanitizedRecord = sanitizeEvidenceVaultRecord(record);
      evidenceRecords.set(
        sanitizedRecord.workspaceId,
        upsertById(evidenceRecords.get(sanitizedRecord.workspaceId) ?? [], sanitizedRecord)
      );
    },

    async updateEvidenceVaultRecord(record) {
      const sanitizedRecord = sanitizeEvidenceVaultRecord(record);
      evidenceRecords.set(
        sanitizedRecord.workspaceId,
        upsertById(evidenceRecords.get(sanitizedRecord.workspaceId) ?? [], sanitizedRecord)
      );
    },

    async listEvidenceVaultRecords(workspaceId) {
      return (evidenceRecords.get(workspaceId) ?? []).map(sanitizeEvidenceVaultRecord);
    },

    async findEvidenceVaultRecord(workspaceId, evidenceId) {
      const record = (evidenceRecords.get(workspaceId) ?? []).find((current) => current.id === evidenceId);
      return record ? sanitizeEvidenceVaultRecord(record) : null;
    },

    async saveModelGatewayRun(run) {
      const sanitizedRun = sanitizeModelGatewayRun(run);
      modelRuns.set(sanitizedRun.workspaceId, upsertById(modelRuns.get(sanitizedRun.workspaceId) ?? [], sanitizedRun));
    },

    async listModelGatewayRuns(workspaceId) {
      return (modelRuns.get(workspaceId) ?? []).map(sanitizeModelGatewayRun);
    },

    async findModelGatewayRun(workspaceId, runId) {
      const run = (modelRuns.get(workspaceId) ?? []).find((current) => current.id === runId);
      return run ? sanitizeModelGatewayRun(run) : null;
    },

    async saveHumanReviewRecord(record) {
      const sanitizedRecord = sanitizeHumanReviewRecord(record);
      humanReviews.set(
        sanitizedRecord.workspaceId,
        upsertById(humanReviews.get(sanitizedRecord.workspaceId) ?? [], sanitizedRecord)
      );
    },

    async updateHumanReviewRecord(record) {
      const sanitizedRecord = sanitizeHumanReviewRecord(record);
      humanReviews.set(
        sanitizedRecord.workspaceId,
        upsertById(humanReviews.get(sanitizedRecord.workspaceId) ?? [], sanitizedRecord)
      );
    },

    async listHumanReviewRecords(workspaceId) {
      return (humanReviews.get(workspaceId) ?? []).map(sanitizeHumanReviewRecord);
    },

    async saveCounselPackExportRecord(record) {
      const sanitizedRecord = sanitizeCounselPackExportRecord(record);
      counselPackExports.set(
        sanitizedRecord.workspaceId,
        upsertById(counselPackExports.get(sanitizedRecord.workspaceId) ?? [], sanitizedRecord)
      );
    },

    async listCounselPackExportRecords(workspaceId) {
      return (counselPackExports.get(workspaceId) ?? []).map(sanitizeCounselPackExportRecord);
    },

    async findCounselPackExportRecord(workspaceId, exportId) {
      const record = (counselPackExports.get(workspaceId) ?? []).find((current) => current.id === exportId);
      return record ? sanitizeCounselPackExportRecord(record) : null;
    },

    async saveIntegrationPolicyEvaluationRecord(record) {
      const sanitizedRecord = sanitizeIntegrationPolicyEvaluationRecord(record);
      integrationPolicyEvaluations.set(
        sanitizedRecord.workspaceId,
        upsertById(integrationPolicyEvaluations.get(sanitizedRecord.workspaceId) ?? [], sanitizedRecord)
      );
    },

    async listIntegrationPolicyEvaluationRecords(workspaceId) {
      return (integrationPolicyEvaluations.get(workspaceId) ?? []).map(sanitizeIntegrationPolicyEvaluationRecord);
    },

    async saveRegulatorySourceApprovalRecord(record) {
      const sanitizedRecord = sanitizeRegulatorySourceApprovalRecord(record);
      sourceApprovals.set(
        sanitizedRecord.workspaceId,
        upsertById(sourceApprovals.get(sanitizedRecord.workspaceId) ?? [], sanitizedRecord)
      );
    },

    async listRegulatorySourceApprovalRecords(workspaceId) {
      return (sourceApprovals.get(workspaceId) ?? []).map(sanitizeRegulatorySourceApprovalRecord);
    },

    async saveRegulatorySourceReviewRecord(record) {
      const sanitizedRecord = sanitizeRegulatorySourceReviewRecord(record);
      sourceReviews.set(
        sanitizedRecord.workspaceId,
        upsertById(sourceReviews.get(sanitizedRecord.workspaceId) ?? [], sanitizedRecord)
      );
    },

    async listRegulatorySourceReviewRecords(workspaceId) {
      return (sourceReviews.get(workspaceId) ?? []).map(sanitizeRegulatorySourceReviewRecord);
    },

    async appendAuditLogRecord(record) {
      const sanitizedRecord = sanitizeAuditLogRecord(record);
      auditLogs.set(sanitizedRecord.workspaceId, [...(auditLogs.get(sanitizedRecord.workspaceId) ?? []), sanitizedRecord]);
    },

    async listAuditLogRecords(workspaceId) {
      return (auditLogs.get(workspaceId) ?? []).map(sanitizeAuditLogRecord);
    },

    async close() {
      return undefined;
    }
  };
}

export async function createPrismaReviewWorkspaceRepository(
  options: PrismaReviewWorkspaceRepositoryOptions
): Promise<ReviewWorkspaceRepository> {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: options.databaseUrl
      }
    }
  });

  await ensureReviewWorkspaceSchema(prisma);

  return {
    async saveWorkspaceRecord(record) {
      const sanitizedRecord = sanitizeWorkspaceRecord(record);
      await prisma.workspaceRecord.upsert({
        where: { id: sanitizedRecord.id },
        update: serializeWorkspaceRecord(sanitizedRecord),
        create: serializeWorkspaceRecord(sanitizedRecord)
      });
    },

    async updateWorkspaceRecord(record) {
      const sanitizedRecord = sanitizeWorkspaceRecord(record);
      await prisma.workspaceRecord.update({
        where: { id: sanitizedRecord.id },
        data: serializeWorkspaceRecord(sanitizedRecord)
      });
    },

    async findWorkspaceRecord(workspaceId) {
      const record = await prisma.workspaceRecord.findUnique({
        where: { id: workspaceId }
      });
      return record ? deserializeWorkspaceRecord(record) : null;
    },

    async saveEvidenceVaultRecord(record) {
      const sanitizedRecord = sanitizeEvidenceVaultRecord(record);
      await prisma.evidenceVaultRecord.upsert({
        where: { id: sanitizedRecord.id },
        update: serializeEvidenceVaultRecord(sanitizedRecord),
        create: serializeEvidenceVaultRecord(sanitizedRecord)
      });
    },

    async updateEvidenceVaultRecord(record) {
      const sanitizedRecord = sanitizeEvidenceVaultRecord(record);
      await prisma.evidenceVaultRecord.update({
        where: { id: sanitizedRecord.id },
        data: serializeEvidenceVaultRecord(sanitizedRecord)
      });
    },

    async listEvidenceVaultRecords(workspaceId) {
      const records = await prisma.evidenceVaultRecord.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" }
      });
      return records.map(deserializeEvidenceVaultRecord);
    },

    async findEvidenceVaultRecord(workspaceId, evidenceId) {
      const record = await prisma.evidenceVaultRecord.findFirst({
        where: { workspaceId, id: evidenceId }
      });
      return record ? deserializeEvidenceVaultRecord(record) : null;
    },

    async saveModelGatewayRun(run) {
      const sanitizedRun = sanitizeModelGatewayRun(run);
      await prisma.modelGatewayRun.upsert({
        where: { id: sanitizedRun.id },
        update: serializeModelGatewayRun(sanitizedRun),
        create: serializeModelGatewayRun(sanitizedRun)
      });
    },

    async listModelGatewayRuns(workspaceId) {
      const runs = await prisma.modelGatewayRun.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" }
      });
      return runs.map(deserializeModelGatewayRun);
    },

    async findModelGatewayRun(workspaceId, runId) {
      const run = await prisma.modelGatewayRun.findFirst({
        where: { workspaceId, id: runId }
      });
      return run ? deserializeModelGatewayRun(run) : null;
    },

    async saveHumanReviewRecord(record) {
      const sanitizedRecord = sanitizeHumanReviewRecord(record);
      await prisma.humanReviewRecord.upsert({
        where: { id: sanitizedRecord.id },
        update: serializeHumanReviewRecord(sanitizedRecord),
        create: serializeHumanReviewRecord(sanitizedRecord)
      });
    },

    async updateHumanReviewRecord(record) {
      const sanitizedRecord = sanitizeHumanReviewRecord(record);
      await prisma.humanReviewRecord.update({
        where: { id: sanitizedRecord.id },
        data: serializeHumanReviewRecord(sanitizedRecord)
      });
    },

    async listHumanReviewRecords(workspaceId) {
      const records = await prisma.humanReviewRecord.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" }
      });
      return records.map(deserializeHumanReviewRecord);
    },

    async saveCounselPackExportRecord(record) {
      const sanitizedRecord = sanitizeCounselPackExportRecord(record);
      await prisma.counselPackExportRecord.upsert({
        where: { id: sanitizedRecord.id },
        update: serializeCounselPackExportRecord(sanitizedRecord),
        create: serializeCounselPackExportRecord(sanitizedRecord)
      });
    },

    async listCounselPackExportRecords(workspaceId) {
      const records = await prisma.counselPackExportRecord.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" }
      });
      return records.map(deserializeCounselPackExportRecord);
    },

    async findCounselPackExportRecord(workspaceId, exportId) {
      const record = await prisma.counselPackExportRecord.findFirst({
        where: { workspaceId, id: exportId }
      });
      return record ? deserializeCounselPackExportRecord(record) : null;
    },

    async saveIntegrationPolicyEvaluationRecord(record) {
      const sanitizedRecord = sanitizeIntegrationPolicyEvaluationRecord(record);
      await prisma.integrationPolicyEvaluationRecord.upsert({
        where: { id: sanitizedRecord.id },
        update: serializeIntegrationPolicyEvaluationRecord(sanitizedRecord),
        create: serializeIntegrationPolicyEvaluationRecord(sanitizedRecord)
      });
    },

    async listIntegrationPolicyEvaluationRecords(workspaceId) {
      const records = await prisma.integrationPolicyEvaluationRecord.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" }
      });
      return records.map(deserializeIntegrationPolicyEvaluationRecord);
    },

    async saveRegulatorySourceApprovalRecord(record) {
      const sanitizedRecord = sanitizeRegulatorySourceApprovalRecord(record);
      await prisma.regulatorySourceApprovalRecord.upsert({
        where: { id: sanitizedRecord.id },
        update: serializeRegulatorySourceApprovalRecord(sanitizedRecord),
        create: serializeRegulatorySourceApprovalRecord(sanitizedRecord)
      });
    },

    async listRegulatorySourceApprovalRecords(workspaceId) {
      const records = await prisma.regulatorySourceApprovalRecord.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" }
      });
      return records.map(deserializeRegulatorySourceApprovalRecord);
    },

    async saveRegulatorySourceReviewRecord(record) {
      const sanitizedRecord = sanitizeRegulatorySourceReviewRecord(record);
      await prisma.regulatorySourceReviewRecord.upsert({
        where: { id: sanitizedRecord.id },
        update: serializeRegulatorySourceReviewRecord(sanitizedRecord),
        create: serializeRegulatorySourceReviewRecord(sanitizedRecord)
      });
    },

    async listRegulatorySourceReviewRecords(workspaceId) {
      const records = await prisma.regulatorySourceReviewRecord.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" }
      });
      return records.map(deserializeRegulatorySourceReviewRecord);
    },

    async appendAuditLogRecord(record) {
      const sanitizedRecord = sanitizeAuditLogRecord(record);
      await prisma.auditLogRecord.create({
        data: serializeAuditLogRecord(sanitizedRecord)
      });
    },

    async listAuditLogRecords(workspaceId) {
      const records = await prisma.auditLogRecord.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" }
      });
      return records.map(deserializeAuditLogRecord);
    },

    async close() {
      await prisma.$disconnect();
    }
  };
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((current) => current.id === item.id);

  if (index === -1) {
    return [...items, item];
  }

  const nextItems = [...items];
  nextItems[index] = item;
  return nextItems;
}

async function ensureReviewWorkspaceSchema(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WorkspaceRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "organizationName" TEXT NOT NULL,
      "ownerId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "updatedAt" DATETIME NOT NULL,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EvidenceVaultRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "byteSize" INTEGER NOT NULL,
      "fileHash" TEXT NOT NULL,
      "storageMode" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "owner" TEXT NOT NULL,
      "sourceNote" TEXT NOT NULL,
      "version" INTEGER NOT NULL,
      "linkedRiskFlagIdsJson" TEXT NOT NULL,
      "linkedControlIdsJson" TEXT NOT NULL DEFAULT '[]',
      "containsRawKycOrPersonalData" BOOLEAN NOT NULL,
      "metadataBoundaryWarningsJson" TEXT NOT NULL DEFAULT '[]',
      "parentEvidenceId" TEXT,
      "supersededByEvidenceId" TEXT,
      "replacementReason" TEXT,
      "createdAt" DATETIME NOT NULL,
      "updatedAt" DATETIME NOT NULL
    );
  `);
  await addColumnIfMissing(prisma, "EvidenceVaultRecord", "parentEvidenceId", "TEXT");
  await addColumnIfMissing(prisma, "EvidenceVaultRecord", "supersededByEvidenceId", "TEXT");
  await addColumnIfMissing(prisma, "EvidenceVaultRecord", "replacementReason", "TEXT");
  await addColumnIfMissing(prisma, "EvidenceVaultRecord", "linkedControlIdsJson", "TEXT NOT NULL DEFAULT '[]'");
  await addColumnIfMissing(prisma, "EvidenceVaultRecord", "metadataBoundaryWarningsJson", "TEXT NOT NULL DEFAULT '[]'");
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EvidenceVaultRecord_workspaceId_idx" ON "EvidenceVaultRecord"("workspaceId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EvidenceVaultRecord_parentEvidenceId_idx" ON "EvidenceVaultRecord"("parentEvidenceId");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ModelGatewayRun" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerLabel" TEXT NOT NULL,
      "model" TEXT NOT NULL,
      "purpose" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "redactionStatus" TEXT NOT NULL,
      "payloadHash" TEXT NOT NULL,
      "responseHash" TEXT NOT NULL,
      "sourceEvidenceHash" TEXT NOT NULL,
      "providerMetadataJson" TEXT NOT NULL,
      "humanReviewStatus" TEXT NOT NULL,
      "attempt" INTEGER NOT NULL,
      "maxAttempts" INTEGER NOT NULL,
      "retryState" TEXT NOT NULL,
      "errorCode" TEXT,
      "errorMessage" TEXT,
      "remediationStepsJson" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "completedAt" DATETIME,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);
  await addColumnIfMissing(prisma, "ModelGatewayRun", "sourceEvidenceHash", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(
    prisma,
    "ModelGatewayRun",
    "providerMetadataJson",
    `TEXT NOT NULL DEFAULT '{"adapterMode":"external-provider-placeholder","credentialPolicy":"deferred until server-side secret policy is approved","secretPolicy":"No model provider secrets are accepted or persisted by the server gateway.","allowedDataClasses":[]}'`
  );
  await addColumnIfMissing(prisma, "ModelGatewayRun", "attempt", "INTEGER NOT NULL DEFAULT 1");
  await addColumnIfMissing(prisma, "ModelGatewayRun", "maxAttempts", "INTEGER NOT NULL DEFAULT 1");
  await addColumnIfMissing(prisma, "ModelGatewayRun", "retryState", "TEXT NOT NULL DEFAULT 'not-needed'");
  await addColumnIfMissing(prisma, "ModelGatewayRun", "errorCode", "TEXT");
  await addColumnIfMissing(prisma, "ModelGatewayRun", "errorMessage", "TEXT");
  await addColumnIfMissing(prisma, "ModelGatewayRun", "remediationStepsJson", "TEXT NOT NULL DEFAULT '[]'");
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ModelGatewayRun_workspaceId_idx" ON "ModelGatewayRun"("workspaceId");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "HumanReviewRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "reviewerId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "comment" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "updatedAt" DATETIME NOT NULL,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "HumanReviewRecord_workspaceId_idx" ON "HumanReviewRecord"("workspaceId");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CounselPackExportRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "exportType" TEXT NOT NULL,
      "format" TEXT NOT NULL,
      "version" INTEGER NOT NULL,
      "projectName" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "artifactName" TEXT NOT NULL,
      "manifestHash" TEXT NOT NULL,
      "artifactHash" TEXT NOT NULL,
      "artifactSize" INTEGER NOT NULL,
      "riskLevel" TEXT NOT NULL,
      "reviewSummaryJson" TEXT NOT NULL,
      "sourceCount" INTEGER NOT NULL,
      "sourcePackHash" TEXT NOT NULL DEFAULT '',
      "sourceReviewStatus" TEXT NOT NULL DEFAULT 'metadata-missing',
      "jurisdictionReadinessDigestJson" TEXT NOT NULL DEFAULT '',
      "createdBy" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CounselPackExportRecord_workspaceId_idx" ON "CounselPackExportRecord"("workspaceId");`
  );
  await addColumnIfMissing(prisma, "CounselPackExportRecord", "sourcePackHash", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(prisma, "CounselPackExportRecord", "sourceReviewStatus", "TEXT NOT NULL DEFAULT 'metadata-missing'");
  await addColumnIfMissing(prisma, "CounselPackExportRecord", "jurisdictionReadinessDigestJson", "TEXT NOT NULL DEFAULT ''");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IntegrationPolicyEvaluationRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "policyId" TEXT NOT NULL,
      "reportVersion" TEXT NOT NULL,
      "overallStatus" TEXT NOT NULL,
      "approvedControlCount" INTEGER NOT NULL,
      "requiredControlCount" INTEGER NOT NULL,
      "externalCapabilityAllowed" BOOLEAN NOT NULL,
      "externalCapabilityStatus" TEXT NOT NULL,
      "reportHash" TEXT NOT NULL,
      "contextHash" TEXT NOT NULL,
      "policyHash" TEXT NOT NULL,
      "evaluatorId" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "nextActionsJson" TEXT NOT NULL,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "IntegrationPolicyEvaluationRecord_workspaceId_idx" ON "IntegrationPolicyEvaluationRecord"("workspaceId");`
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RegulatorySourceApprovalRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "queueHash" TEXT NOT NULL,
      "sourceApprovalItemId" TEXT NOT NULL,
      "clauseId" TEXT NOT NULL,
      "jurisdiction" TEXT NOT NULL,
      "regulator" TEXT NOT NULL,
      "citation" TEXT NOT NULL,
      "sourceName" TEXT NOT NULL,
      "sourceUrl" TEXT NOT NULL,
      "priority" TEXT NOT NULL,
      "approvalStatus" TEXT NOT NULL,
      "reviewStatus" TEXT NOT NULL,
      "effectiveAsOf" TEXT NOT NULL,
      "lastReviewedAt" TEXT NOT NULL,
      "nextReviewDueAt" TEXT NOT NULL,
      "reviewerNotes" TEXT NOT NULL,
      "nextAction" TEXT NOT NULL,
      "approvalGate" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "matchingBehaviorChanged" BOOLEAN NOT NULL,
      "createdBy" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "RegulatorySourceApprovalRecord_workspaceId_idx" ON "RegulatorySourceApprovalRecord"("workspaceId");`
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RegulatorySourceReviewRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "ledgerHash" TEXT NOT NULL,
      "sourceReviewItemId" TEXT NOT NULL,
      "clauseId" TEXT NOT NULL,
      "jurisdiction" TEXT NOT NULL,
      "regulator" TEXT NOT NULL,
      "citation" TEXT NOT NULL,
      "sourceName" TEXT NOT NULL,
      "sourceUrl" TEXT NOT NULL,
      "reviewStatus" TEXT NOT NULL,
      "priority" TEXT NOT NULL,
      "effectiveAsOf" TEXT NOT NULL,
      "lastReviewedAt" TEXT NOT NULL,
      "nextReviewDueAt" TEXT NOT NULL,
      "reviewerNotes" TEXT NOT NULL,
      "nextAction" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "matchingBehaviorChanged" BOOLEAN NOT NULL,
      "createdBy" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "RegulatorySourceReviewRecord_workspaceId_idx" ON "RegulatorySourceReviewRecord"("workspaceId");`
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditLogRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "beforeHash" TEXT NOT NULL,
      "afterHash" TEXT NOT NULL,
      "summary" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLogRecord_workspaceId_idx" ON "AuditLogRecord"("workspaceId");`);
}

function serializeWorkspaceRecord(record: WorkspaceRecord) {
  return {
    id: record.id,
    name: record.name,
    organizationName: record.organizationName,
    ownerId: record.ownerId,
    status: record.status,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    notLegalAdviceBoundary: record.notLegalAdviceBoundary
  };
}

type PersistedWorkspaceRecord = {
  id: string;
  name: string;
  organizationName: string;
  ownerId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  notLegalAdviceBoundary: string;
};

function deserializeWorkspaceRecord(record: PersistedWorkspaceRecord): WorkspaceRecord {
  return {
    recordVersion: "lexproof-workspace-record-v1",
    id: record.id,
    name: sanitizePersistedText(record.name),
    organizationName: sanitizePersistedText(record.organizationName),
    ownerId: sanitizePersistedText(record.ownerId),
    status: parseWorkspaceStatus(record.status),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
  };
}

function sanitizeWorkspaceRecord(record: WorkspaceRecord): WorkspaceRecord {
  return {
    ...record,
    name: sanitizePersistedText(record.name),
    organizationName: sanitizePersistedText(record.organizationName),
    ownerId: sanitizePersistedText(record.ownerId),
    status: parseWorkspaceStatus(record.status),
    notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
  };
}

function parseWorkspaceStatus(value: string): WorkspaceRecord["status"] {
  if (value === "draft" || value === "active" || value === "archived") {
    return value;
  }
  throw new Error("Workspace status is invalid.");
}

function serializeEvidenceVaultRecord(record: EvidenceVaultRecord) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    filename: record.filename,
    mimeType: record.mimeType,
    byteSize: record.byteSize,
    fileHash: record.fileHash,
    storageMode: record.storageMode,
    status: record.status,
    owner: record.owner,
    sourceNote: record.sourceNote,
    version: record.version,
    linkedRiskFlagIdsJson: JSON.stringify(record.linkedRiskFlagIds),
    linkedControlIdsJson: JSON.stringify(record.linkedControlIds),
    containsRawKycOrPersonalData: record.containsRawKycOrPersonalData,
    metadataBoundaryWarningsJson: JSON.stringify(record.metadataBoundaryWarnings ?? []),
    parentEvidenceId: record.parentEvidenceId ?? null,
    supersededByEvidenceId: record.supersededByEvidenceId ?? null,
    replacementReason: record.replacementReason ?? null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  };
}

type PersistedEvidenceVaultRecord = {
  id: string;
  workspaceId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  fileHash: string;
  storageMode: string;
  status: string;
  owner: string;
  sourceNote: string;
  version: number;
  linkedRiskFlagIdsJson: string;
  linkedControlIdsJson?: string | null;
  containsRawKycOrPersonalData: boolean;
  metadataBoundaryWarningsJson?: string | null;
  parentEvidenceId: string | null;
  supersededByEvidenceId: string | null;
  replacementReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function deserializeEvidenceVaultRecord(record: PersistedEvidenceVaultRecord): EvidenceVaultRecord {
  return {
    recordVersion: "lexproof-evidence-vault-record-v1",
    id: record.id,
    workspaceId: record.workspaceId,
    filename: sanitizePersistedText(record.filename),
    mimeType: sanitizePersistedText(record.mimeType),
    byteSize: parseEvidenceVaultNonNegativeInteger(record.byteSize, "byte size"),
    fileHash: parseSha256Hex(record.fileHash, "Evidence Vault file hash"),
    storageMode: parseEvidenceVaultStorageMode(record.storageMode),
    status: parseEvidenceVaultStatus(record.status),
    owner: sanitizePersistedText(record.owner),
    sourceNote: sanitizePersistedText(record.sourceNote),
    version: parseEvidenceVaultPositiveInteger(record.version, "version"),
    linkedRiskFlagIds: parseEvidenceVaultStringArray(record.linkedRiskFlagIdsJson, "linked risk flag ids"),
    linkedControlIds: parseEvidenceVaultStringArray(record.linkedControlIdsJson ?? "[]", "linked control ids"),
    containsRawKycOrPersonalData: record.containsRawKycOrPersonalData,
    ...parseMetadataBoundaryWarnings(record.metadataBoundaryWarningsJson ?? "[]"),
    parentEvidenceId: sanitizeOptionalPersistedText(record.parentEvidenceId),
    supersededByEvidenceId: sanitizeOptionalPersistedText(record.supersededByEvidenceId),
    replacementReason: sanitizeOptionalPersistedText(record.replacementReason),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function sanitizeEvidenceVaultRecord(record: EvidenceVaultRecord): EvidenceVaultRecord {
  return {
    ...record,
    filename: sanitizePersistedText(record.filename),
    mimeType: sanitizePersistedText(record.mimeType),
    byteSize: parseEvidenceVaultNonNegativeInteger(record.byteSize, "byte size"),
    fileHash: parseSha256Hex(record.fileHash, "Evidence Vault file hash"),
    storageMode: parseEvidenceVaultStorageMode(record.storageMode),
    status: parseEvidenceVaultStatus(record.status),
    owner: sanitizePersistedText(record.owner),
    sourceNote: sanitizePersistedText(record.sourceNote),
    version: parseEvidenceVaultPositiveInteger(record.version, "version"),
    linkedRiskFlagIds: sanitizeEvidenceVaultStringArray(record.linkedRiskFlagIds, "linked risk flag ids"),
    linkedControlIds: sanitizeEvidenceVaultStringArray(record.linkedControlIds, "linked control ids"),
    metadataBoundaryWarnings: sanitizeEvidenceVaultMetadataBoundaryWarnings(record.metadataBoundaryWarnings),
    parentEvidenceId: sanitizeOptionalPersistedText(record.parentEvidenceId),
    supersededByEvidenceId: sanitizeOptionalPersistedText(record.supersededByEvidenceId),
    replacementReason: sanitizeOptionalPersistedText(record.replacementReason)
  };
}

function parseEvidenceVaultStorageMode(value: string): EvidenceVaultRecord["storageMode"] {
  if (value === "local-metadata" || value === "server-vault" || value === "external-reference") {
    return value;
  }
  throw new Error("Evidence Vault storage mode is invalid.");
}

function parseEvidenceVaultStatus(value: string): EvidenceVaultRecord["status"] {
  if (
    value === "draft" ||
    value === "requested" ||
    value === "received" ||
    value === "submitted" ||
    value === "under-review" ||
    value === "verified" ||
    value === "rejected" ||
    value === "superseded"
  ) {
    return value;
  }
  throw new Error("Evidence Vault status is invalid.");
}

function parseEvidenceVaultStringArray(payload: string, label: string): string[] {
  try {
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error("invalid array");
    }
    return parsed.map(sanitizePersistedText).filter(Boolean);
  } catch {
    throw new Error(`Evidence Vault ${label} are invalid.`);
  }
}

function parseEvidenceVaultNonNegativeInteger(value: number, label: string): number {
  if (Number.isInteger(value) && value >= 0) {
    return value;
  }
  throw new Error(`Evidence Vault ${label} is invalid.`);
}

function parseEvidenceVaultPositiveInteger(value: number, label: string): number {
  if (Number.isInteger(value) && value > 0) {
    return value;
  }
  throw new Error(`Evidence Vault ${label} is invalid.`);
}

function sanitizeEvidenceVaultStringArray(values: string[], label: string): string[] {
  if (!Array.isArray(values) || values.some((item) => typeof item !== "string")) {
    throw new Error(`Evidence Vault ${label} are invalid.`);
  }
  return values.map(sanitizePersistedText).filter(Boolean);
}

function sanitizeEvidenceVaultMetadataBoundaryWarnings(
  warnings: EvidenceVaultRecord["metadataBoundaryWarnings"]
): EvidenceVaultRecord["metadataBoundaryWarnings"] {
  if (!warnings) {
    return undefined;
  }
  if (!Array.isArray(warnings) || warnings.some((warning) => !isMetadataBoundaryWarning(warning))) {
    throw new Error("Evidence Vault metadata boundary warnings are invalid.");
  }
  const sanitizedWarnings = warnings.map(sanitizeMetadataBoundaryWarning);
  return sanitizedWarnings.length > 0 ? sanitizedWarnings : undefined;
}

async function addColumnIfMissing(prisma: PrismaClient, tableName: string, columnName: string, definition: string): Promise<void> {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("${tableName}");`);

  if (!columns.some((column) => column.name === columnName)) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition};`);
  }
}

function parseStringArray(payload: string): string[] {
  try {
    const parsed = JSON.parse(payload);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseMetadataBoundaryWarnings(payload: string): Pick<EvidenceVaultRecord, "metadataBoundaryWarnings"> {
  try {
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed) || parsed.some((item) => !isMetadataBoundaryWarning(item))) {
      throw new Error("invalid warnings");
    }
    const metadataBoundaryWarnings = parsed.map(sanitizeMetadataBoundaryWarning);
    return metadataBoundaryWarnings.length > 0 ? { metadataBoundaryWarnings } : {};
  } catch {
    throw new Error("Evidence Vault metadata boundary warnings are invalid.");
  }
}

function isMetadataBoundaryWarning(value: unknown): value is NonNullable<EvidenceVaultRecord["metadataBoundaryWarnings"]>[number] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const matchCount = candidate.matchCount;
  return (
    (candidate.dataClass === "wallet-address" || candidate.dataClass === "personal-data" || candidate.dataClass === "confidential") &&
    candidate.severity === "warn" &&
    typeof matchCount === "number" &&
    Number.isInteger(matchCount) &&
    matchCount >= 0 &&
    typeof candidate.redactedSnippet === "string" &&
    typeof candidate.message === "string"
  );
}

function sanitizeMetadataBoundaryWarning(
  warning: NonNullable<EvidenceVaultRecord["metadataBoundaryWarnings"]>[number]
): NonNullable<EvidenceVaultRecord["metadataBoundaryWarnings"]>[number] {
  return {
    dataClass: warning.dataClass,
    severity: warning.severity,
    matchCount: warning.matchCount,
    redactedSnippet: sanitizePersistedText(warning.redactedSnippet),
    message: sanitizePersistedText(warning.message)
  };
}

function serializeModelGatewayRun(run: ModelGatewayRun) {
  return {
    id: run.id,
    workspaceId: run.workspaceId,
    provider: run.provider,
    providerLabel: run.providerLabel,
    model: run.model,
    purpose: run.purpose,
    status: run.status,
    redactionStatus: run.redactionStatus,
    payloadHash: run.payloadHash,
    responseHash: run.responseHash,
    sourceEvidenceHash: run.sourceEvidenceHash,
    providerMetadataJson: JSON.stringify(run.providerMetadata),
    humanReviewStatus: run.humanReviewStatus,
    attempt: run.attempt,
    maxAttempts: run.maxAttempts,
    retryState: run.retryState,
    errorCode: run.errorCode ?? null,
    errorMessage: run.errorMessage ?? null,
    remediationStepsJson: JSON.stringify(run.remediationSteps),
    createdAt: new Date(run.createdAt),
    completedAt: run.completedAt ? new Date(run.completedAt) : null,
    notLegalAdviceBoundary: run.notLegalAdviceBoundary
  };
}

type PersistedModelGatewayRun = {
  id: string;
  workspaceId: string;
  provider: string;
  providerLabel: string;
  model: string;
  purpose: string;
  status: string;
  redactionStatus: string;
  payloadHash: string;
  responseHash: string;
  sourceEvidenceHash: string;
  providerMetadataJson: string;
  humanReviewStatus: string;
  attempt: number;
  maxAttempts: number;
  retryState: string;
  errorCode: string | null;
  errorMessage: string | null;
  remediationStepsJson: string;
  createdAt: Date;
  completedAt: Date | null;
  notLegalAdviceBoundary: string;
};

function deserializeModelGatewayRun(run: PersistedModelGatewayRun): ModelGatewayRun {
  const attempt = parseModelGatewayPositiveInteger(run.attempt, "attempt");
  const maxAttempts = parseModelGatewayPositiveInteger(run.maxAttempts, "max attempts");
  if (attempt > maxAttempts) {
    throw new Error("Model Gateway attempt cannot exceed max attempts.");
  }

  return {
    recordVersion: "lexproof-model-gateway-run-v1",
    id: run.id,
    workspaceId: run.workspaceId,
    provider: parseModelGatewayProvider(run.provider),
    providerLabel: sanitizePersistedText(run.providerLabel),
    model: sanitizePersistedText(run.model),
    purpose: sanitizePersistedText(run.purpose),
    status: parseModelGatewayRunStatus(run.status),
    redactionStatus: parseModelGatewayRedactionStatus(run.redactionStatus),
    payloadHash: parseModelGatewayHash(run.payloadHash, "payload hash"),
    responseHash: parseModelGatewayHash(run.responseHash, "response hash", { allowEmpty: true }),
    sourceEvidenceHash: parseModelGatewayHash(run.sourceEvidenceHash, "source evidence hash"),
    providerMetadata: parseModelGatewayProviderMetadata(run.providerMetadataJson),
    humanReviewStatus: parseModelGatewayHumanReviewStatus(run.humanReviewStatus),
    attempt,
    maxAttempts,
    retryState: parseModelGatewayRetryState(run.retryState),
    ...(run.errorCode ? { errorCode: sanitizePersistedText(run.errorCode) } : {}),
    ...(run.errorMessage ? { errorMessage: sanitizePersistedText(run.errorMessage) } : {}),
    remediationSteps: parseModelGatewayRemediationSteps(run.remediationStepsJson),
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString(),
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

function sanitizeModelGatewayRun(run: ModelGatewayRun): ModelGatewayRun {
  const attempt = parseModelGatewayPositiveInteger(run.attempt, "attempt");
  const maxAttempts = parseModelGatewayPositiveInteger(run.maxAttempts, "max attempts");
  if (attempt > maxAttempts) {
    throw new Error("Model Gateway attempt cannot exceed max attempts.");
  }

  return {
    recordVersion: "lexproof-model-gateway-run-v1",
    id: run.id,
    workspaceId: run.workspaceId,
    provider: parseModelGatewayProvider(run.provider),
    providerLabel: sanitizePersistedText(run.providerLabel),
    model: sanitizePersistedText(run.model),
    purpose: sanitizePersistedText(run.purpose),
    status: parseModelGatewayRunStatus(run.status),
    redactionStatus: parseModelGatewayRedactionStatus(run.redactionStatus),
    payloadHash: parseModelGatewayHash(run.payloadHash, "payload hash"),
    responseHash: parseModelGatewayHash(run.responseHash, "response hash", { allowEmpty: true }),
    sourceEvidenceHash: parseModelGatewayHash(run.sourceEvidenceHash, "source evidence hash"),
    providerMetadata: sanitizeModelGatewayProviderMetadata(run.providerMetadata),
    humanReviewStatus: parseModelGatewayHumanReviewStatus(run.humanReviewStatus),
    attempt,
    maxAttempts,
    retryState: parseModelGatewayRetryState(run.retryState),
    ...(run.errorCode ? { errorCode: sanitizePersistedText(run.errorCode) } : {}),
    ...(run.errorMessage ? { errorMessage: sanitizePersistedText(run.errorMessage) } : {}),
    remediationSteps: sanitizeModelGatewayRemediationSteps(run.remediationSteps),
    createdAt: run.createdAt,
    ...(run.completedAt ? { completedAt: run.completedAt } : {}),
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

function parseModelGatewayProvider(value: string): ModelGatewayRun["provider"] {
  if (value === "mock" || value === "openai-compatible" || value === "enterprise-proxy") {
    return value;
  }
  throw new Error("Model Gateway provider is invalid.");
}

function parseModelGatewayRunStatus(value: string): ModelGatewayRun["status"] {
  if (value === "queued" || value === "blocked" || value === "completed" || value === "failed") {
    return value;
  }
  throw new Error("Model Gateway run status is invalid.");
}

function parseModelGatewayRedactionStatus(value: string): ModelGatewayRun["redactionStatus"] {
  if (value === "clean" || value === "needs-review" || value === "blocked") {
    return value;
  }
  throw new Error("Model Gateway redaction status is invalid.");
}

function parseModelGatewayHumanReviewStatus(value: string): ModelGatewayRun["humanReviewStatus"] {
  if (value === "not-required" || value === "needs-review" || value === "reviewed" || value === "rejected") {
    return value;
  }
  throw new Error("Model Gateway human review status is invalid.");
}

function parseModelGatewayRetryState(value: string): ModelGatewayRun["retryState"] {
  if (
    value === "not-needed" ||
    value === "retry-available" ||
    value === "blocked-until-remediated" ||
    value === "blocked-until-policy-change"
  ) {
    return value;
  }
  throw new Error("Model Gateway retry state is invalid.");
}

function parseModelGatewayHash(value: string, label: string, options: { allowEmpty?: boolean } = {}): string {
  if (options.allowEmpty && value === "") {
    return "";
  }
  if (/^[a-f0-9]{64}$/.test(value)) {
    return value;
  }
  throw new Error(`Model Gateway ${label} is invalid.`);
}

function parseModelGatewayPositiveInteger(value: number, label: string): number {
  if (Number.isInteger(value) && value > 0) {
    return value;
  }
  throw new Error(`Model Gateway ${label} is invalid.`);
}

function sanitizeModelGatewayRemediationSteps(steps: string[]): string[] {
  if (!Array.isArray(steps) || steps.some((item) => typeof item !== "string")) {
    throw new Error("Model Gateway remediation steps are invalid.");
  }
  return steps.map(sanitizePersistedText).filter(Boolean);
}

function parseModelGatewayRemediationSteps(payload: string): string[] {
  try {
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error("invalid remediation steps");
    }
    return parsed.map(sanitizePersistedText).filter(Boolean);
  } catch {
    throw new Error("Model Gateway remediation steps are invalid.");
  }
}

function parseModelGatewayProviderMetadata(payload: string): ModelGatewayRun["providerMetadata"] {
  try {
    const parsed = JSON.parse(payload) as Partial<ModelGatewayRun["providerMetadata"]>;
    const adapterMode = parseModelGatewayAdapterMode(parsed.adapterMode);
    const credentialPolicy = parseModelGatewayCredentialPolicy(parsed.credentialPolicy);
    const allowedDataClasses = Array.isArray(parsed.allowedDataClasses)
      ? parsed.allowedDataClasses.filter((item): item is string => typeof item === "string").map(sanitizePersistedText).filter(Boolean)
      : undefined;
    if (!allowedDataClasses) {
      throw new Error("Model Gateway provider metadata allowed data classes are invalid.");
    }
    return {
      adapterMode,
      credentialPolicy,
      secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
      allowedDataClasses
    };
  } catch {
    throw new Error("Model Gateway provider metadata is invalid.");
  }
}

function sanitizeModelGatewayProviderMetadata(
  metadata: ModelGatewayRun["providerMetadata"]
): ModelGatewayRun["providerMetadata"] {
  try {
    const adapterMode = parseModelGatewayAdapterMode(metadata.adapterMode);
    const credentialPolicy = parseModelGatewayCredentialPolicy(metadata.credentialPolicy);
    if (!Array.isArray(metadata.allowedDataClasses) || metadata.allowedDataClasses.some((item) => typeof item !== "string")) {
      throw new Error("Model Gateway provider metadata allowed data classes are invalid.");
    }
    return {
      adapterMode,
      credentialPolicy,
      secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
      allowedDataClasses: metadata.allowedDataClasses.map(sanitizePersistedText).filter(Boolean)
    };
  } catch {
    throw new Error("Model Gateway provider metadata is invalid.");
  }
}

function parseModelGatewayAdapterMode(value: unknown): ModelGatewayRun["providerMetadata"]["adapterMode"] {
  if (value === "local-mock" || value === "external-provider-placeholder") {
    return value;
  }
  throw new Error("Model Gateway provider metadata adapter mode is invalid.");
}

function parseModelGatewayCredentialPolicy(value: unknown): ModelGatewayRun["providerMetadata"]["credentialPolicy"] {
  if (value === "no credentials accepted" || value === "deferred until server-side secret policy is approved") {
    return value;
  }
  throw new Error("Model Gateway provider metadata credential policy is invalid.");
}

function serializeHumanReviewRecord(record: HumanReviewRecord) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    targetType: record.targetType,
    targetId: record.targetId,
    reviewerId: record.reviewerId,
    status: record.status,
    comment: record.comment,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    notLegalAdviceBoundary: record.notLegalAdviceBoundary
  };
}

type PersistedHumanReviewRecord = {
  id: string;
  workspaceId: string;
  targetType: string;
  targetId: string;
  reviewerId: string;
  status: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  notLegalAdviceBoundary: string;
};

function deserializeHumanReviewRecord(record: PersistedHumanReviewRecord): HumanReviewRecord {
  return {
    recordVersion: "lexproof-human-review-record-v1",
    id: record.id,
    workspaceId: record.workspaceId,
    targetType: parseHumanReviewTargetType(record.targetType),
    targetId: sanitizePersistedText(record.targetId),
    reviewerId: sanitizePersistedText(record.reviewerId),
    status: parseHumanReviewStatus(record.status),
    comment: sanitizePersistedText(record.comment),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
  };
}

function sanitizeHumanReviewRecord(record: HumanReviewRecord): HumanReviewRecord {
  return {
    ...record,
    targetType: parseHumanReviewTargetType(record.targetType),
    targetId: sanitizePersistedText(record.targetId),
    reviewerId: sanitizePersistedText(record.reviewerId),
    status: parseHumanReviewStatus(record.status),
    comment: sanitizePersistedText(record.comment),
    notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
  };
}

function parseHumanReviewTargetType(value: string): HumanReviewRecord["targetType"] {
  if (
    value === "risk-flag" ||
    value === "evidence" ||
    value === "model-run" ||
    value === "clause-match" ||
    value === "counsel-pack"
  ) {
    return value;
  }
  throw new Error("Human review target type is invalid.");
}

function parseHumanReviewStatus(value: string): HumanReviewRecord["status"] {
  if (
    value === "requested" ||
    value === "under-review" ||
    value === "reviewed" ||
    value === "rejected" ||
    value === "needs-more-evidence"
  ) {
    return value;
  }
  throw new Error("Human review status is invalid.");
}

function serializeCounselPackExportRecord(record: CounselPackExportRecord) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    exportType: record.exportType,
    format: record.format,
    version: record.version,
    projectName: record.projectName,
    title: record.title,
    artifactName: record.artifactName,
    manifestHash: record.manifestHash,
    artifactHash: record.artifactHash,
    artifactSize: record.artifactSize,
    riskLevel: record.riskLevel,
    reviewSummaryJson: JSON.stringify(record.reviewSummary),
    sourceCount: record.sourceCount,
    sourcePackHash: record.sourcePackHash,
    sourceReviewStatus: record.sourceReviewStatus,
    jurisdictionReadinessDigestJson: JSON.stringify(record.jurisdictionReadinessDigest ?? null),
    createdBy: record.createdBy,
    status: record.status,
    createdAt: new Date(record.createdAt),
    notLegalAdviceBoundary: record.notLegalAdviceBoundary
  };
}

type PersistedCounselPackExportRecord = {
  id: string;
  workspaceId: string;
  exportType: string;
  format: string;
  version: number;
  projectName: string;
  title: string;
  artifactName: string;
  manifestHash: string;
  artifactHash: string;
  artifactSize: number;
  riskLevel: string;
  reviewSummaryJson: string;
  sourceCount: number;
  sourcePackHash?: string | null;
  sourceReviewStatus?: string | null;
  jurisdictionReadinessDigestJson?: string | null;
  createdBy: string;
  status: string;
  createdAt: Date;
  notLegalAdviceBoundary: string;
};

function deserializeCounselPackExportRecord(record: PersistedCounselPackExportRecord): CounselPackExportRecord {
  return {
    recordVersion: "lexproof-counsel-pack-export-record-v1",
    id: record.id,
    workspaceId: record.workspaceId,
    exportType: parseCounselPackExportType(record.exportType),
    format: parseCounselPackExportFormat(record.format),
    version: parseCounselPackExportPositiveInteger(record.version, "version"),
    projectName: sanitizePersistedText(record.projectName),
    title: sanitizePersistedText(record.title),
    artifactName: sanitizePersistedText(record.artifactName),
    manifestHash: parseSha256Hex(record.manifestHash, "Counsel Pack export manifest hash"),
    artifactHash: parseSha256Hex(record.artifactHash, "Counsel Pack export artifact hash"),
    artifactSize: parseCounselPackExportPositiveInteger(record.artifactSize, "artifact size"),
    riskLevel: parseCounselPackExportRiskLevel(record.riskLevel),
    reviewSummary: parseCounselPackExportReviewSummary(record.reviewSummaryJson),
    sourceCount: parseCounselPackExportCount(record.sourceCount, "source count"),
    sourcePackHash: parseSha256Hex(record.sourcePackHash ?? "", "Counsel Pack export source pack hash"),
    sourceReviewStatus: parseCounselPackExportSourceReviewStatus(record.sourceReviewStatus),
    ...parseCounselPackExportJurisdictionReadinessDigest(record.jurisdictionReadinessDigestJson),
    createdBy: sanitizePersistedText(record.createdBy),
    status: parseCounselPackExportStatus(record.status),
    createdAt: record.createdAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
  };
}

function parseCounselPackExportType(value: string): CounselPackExportRecord["exportType"] {
  if (value === "counsel-pack") {
    return value;
  }
  throw new Error("Counsel Pack export type is invalid.");
}

function parseCounselPackExportFormat(value: string): CounselPackExportRecord["format"] {
  if (value === "markdown" || value === "print-pdf") {
    return value;
  }
  throw new Error("Counsel Pack export format is invalid.");
}

function parseCounselPackExportRiskLevel(value: string): CounselPackExportRecord["riskLevel"] {
  if (value === "low" || value === "moderate" || value === "high" || value === "critical") {
    return value;
  }
  throw new Error("Counsel Pack export risk level is invalid.");
}

function parseCounselPackExportStatus(value: string): CounselPackExportRecord["status"] {
  if (value === "ready") {
    return value;
  }
  throw new Error("Counsel Pack export status is invalid.");
}

function parseCounselPackExportReviewSummary(payload: string): CounselPackExportRecord["reviewSummary"] {
  try {
    const parsed = JSON.parse(payload) as Partial<CounselPackExportRecord["reviewSummary"]>;
    return {
      total: parseCounselPackExportCount(parsed.total, "review summary total"),
      reviewed: parseCounselPackExportCount(parsed.reviewed, "review summary reviewed count"),
      readyForCounsel: parseCounselPackExportCount(parsed.readyForCounsel, "review summary ready for counsel count"),
      needsEvidence: parseCounselPackExportCount(parsed.needsEvidence, "review summary needs evidence count"),
      blocked: parseCounselPackExportCount(parsed.blocked, "review summary blocked count"),
      open: parseCounselPackExportCount(parsed.open, "review summary open count")
    };
  } catch {
    throw new Error("Counsel Pack export review summary is invalid.");
  }
}

function parseCounselPackExportJurisdictionReadinessDigest(
  payload: string | null | undefined
): Pick<CounselPackExportRecord, "jurisdictionReadinessDigest"> {
  if (!payload?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(payload) as Partial<NonNullable<CounselPackExportRecord["jurisdictionReadinessDigest"]> | null>;
    if (parsed === null) {
      return {};
    }

    return {
      jurisdictionReadinessDigest: {
        digestHash: parseSha256Hex(parsed.digestHash, "Counsel Pack export jurisdiction readiness digest hash"),
        status: parseCounselPackExportJurisdictionReadinessStatus(parsed.status),
        handoffAllowed: parseCounselPackExportBoolean(parsed.handoffAllowed, "jurisdiction readiness handoff allowed"),
        jurisdictionCount: parseCounselPackExportCount(parsed.jurisdictionCount, "jurisdiction readiness jurisdiction count"),
        readyForCounselCount: parseCounselPackExportCount(
          parsed.readyForCounselCount,
          "jurisdiction readiness ready for counsel count"
        ),
        needsEvidenceCount: parseCounselPackExportCount(parsed.needsEvidenceCount, "jurisdiction readiness needs evidence count"),
        needsSourceReviewCount: parseCounselPackExportCount(
          parsed.needsSourceReviewCount,
          "jurisdiction readiness needs source review count"
        ),
        metadataMissingCount: parseCounselPackExportCount(
          parsed.metadataMissingCount,
          "jurisdiction readiness metadata missing count"
        ),
        openEvidenceRequestCount: parseCounselPackExportCount(
          parsed.openEvidenceRequestCount,
          "jurisdiction readiness open evidence request count"
        ),
        sourceFreshnessBlockerCount: parseCounselPackExportCount(
          parsed.sourceFreshnessBlockerCount,
          "jurisdiction readiness source freshness blocker count"
        ),
        dueSoonSourceCount: parseCounselPackExportCount(parsed.dueSoonSourceCount, "jurisdiction readiness due soon source count"),
        notLegalAdviceBoundary:
          "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
      }
    };
  } catch {
    throw new Error("Counsel Pack export jurisdiction readiness digest is invalid.");
  }
}

function parseCounselPackExportJurisdictionReadinessStatus(
  value: unknown
): NonNullable<CounselPackExportRecord["jurisdictionReadinessDigest"]>["status"] {
  if (
    value === "ready-for-counsel" ||
    value === "needs-evidence" ||
    value === "needs-source-review" ||
    value === "metadata-missing" ||
    value === "no-jurisdictions"
  ) {
    return value;
  }
  throw new Error("Counsel Pack export jurisdiction readiness status is invalid.");
}

function parseCounselPackExportSourceReviewStatus(value: string | null | undefined): CounselPackExportRecord["sourceReviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw new Error("Counsel Pack export source review status is invalid.");
}

function parseCounselPackExportPositiveInteger(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  throw new Error(`Counsel Pack export ${label} is invalid.`);
}

function parseCounselPackExportCount(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  throw new Error(`Counsel Pack export ${label} is invalid.`);
}

function parseCounselPackExportBoolean(value: unknown, label: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  throw new Error(`Counsel Pack export ${label} is invalid.`);
}

function parseSha256Hex(value: unknown, label: string): string {
  if (typeof value === "string" && /^[a-f0-9]{64}$/.test(value)) {
    return value;
  }
  throw new Error(`${label} is invalid.`);
}

function serializeIntegrationPolicyEvaluationRecord(record: IntegrationPolicyEvaluationRecord) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    policyId: record.policyId,
    reportVersion: record.reportVersion,
    overallStatus: record.overallStatus,
    approvedControlCount: record.approvedControlCount,
    requiredControlCount: record.requiredControlCount,
    externalCapabilityAllowed: record.externalCapabilityAllowed,
    externalCapabilityStatus: record.externalCapabilityStatus,
    reportHash: record.reportHash,
    contextHash: record.contextHash,
    policyHash: record.policyHash,
    evaluatorId: record.evaluatorId,
    source: record.source,
    createdAt: new Date(record.createdAt),
    nextActionsJson: JSON.stringify(record.nextActions),
    notLegalAdviceBoundary: record.notLegalAdviceBoundary
  };
}

type PersistedIntegrationPolicyEvaluationRecord = {
  id: string;
  workspaceId: string;
  policyId: string;
  reportVersion: string;
  overallStatus: string;
  approvedControlCount: number;
  requiredControlCount: number;
  externalCapabilityAllowed: boolean;
  externalCapabilityStatus: string;
  reportHash: string;
  contextHash: string;
  policyHash: string;
  evaluatorId: string;
  source: string;
  createdAt: Date;
  nextActionsJson: string;
  notLegalAdviceBoundary: string;
};

function deserializeIntegrationPolicyEvaluationRecord(
  record: PersistedIntegrationPolicyEvaluationRecord
): IntegrationPolicyEvaluationRecord {
  return {
    recordVersion: "lexproof-integration-policy-evaluation-record-v1",
    id: record.id,
    workspaceId: record.workspaceId,
    policyId: parseIntegrationPolicyId(record.policyId),
    reportVersion: sanitizePersistedText(record.reportVersion),
    overallStatus: parseIntegrationPolicyStatus(record.overallStatus),
    approvedControlCount: parseIntegrationPolicyCount(record.approvedControlCount, "approved control count"),
    requiredControlCount: parseIntegrationPolicyCount(record.requiredControlCount, "required control count"),
    externalCapabilityAllowed: parseIntegrationPolicyExternalCapabilityAllowed(record.externalCapabilityAllowed),
    externalCapabilityStatus: sanitizePersistedText(record.externalCapabilityStatus),
    reportHash: parseSha256Hex(record.reportHash, "Integration policy report hash"),
    contextHash: parseSha256Hex(record.contextHash, "Integration policy context hash"),
    policyHash: parseSha256Hex(record.policyHash, "Integration policy policy hash"),
    evaluatorId: sanitizePersistedText(record.evaluatorId) || "Integration policy evaluator",
    source: parseIntegrationPolicySource(record.source),
    createdAt: record.createdAt.toISOString(),
    nextActions: parseIntegrationPolicyNextActions(record.nextActionsJson),
    notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
  };
}

function sanitizeIntegrationPolicyEvaluationRecord(record: IntegrationPolicyEvaluationRecord): IntegrationPolicyEvaluationRecord {
  return {
    ...record,
    reportVersion: sanitizePersistedText(record.reportVersion),
    externalCapabilityStatus: sanitizePersistedText(record.externalCapabilityStatus),
    evaluatorId: sanitizePersistedText(record.evaluatorId) || "Integration policy evaluator",
    nextActions: record.nextActions.map(sanitizePersistedText).filter(Boolean),
    notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
  };
}

function parseIntegrationPolicyId(value: string): IntegrationPolicyEvaluationRecord["policyId"] {
  if (value === "object-storage" || value === "document-parser" || value === "chain-anchor" || value === "grc-destination") {
    return value;
  }
  throw new Error("Integration policy id is invalid.");
}

function parseIntegrationPolicyStatus(value: string): IntegrationPolicyEvaluationRecord["overallStatus"] {
  if (value === "ready" || value === "needs-policy" || value === "blocked") {
    return value;
  }
  throw new Error("Integration policy status is invalid.");
}

function parseIntegrationPolicyCount(value: number, label: string): number {
  if (Number.isInteger(value) && value >= 0) {
    return value;
  }
  throw new Error(`Integration policy ${label} is invalid.`);
}

function parseIntegrationPolicyExternalCapabilityAllowed(
  value: boolean
): IntegrationPolicyEvaluationRecord["externalCapabilityAllowed"] {
  if (value === false) {
    return value;
  }
  throw new Error("Integration policy external capability flag is invalid.");
}

function parseIntegrationPolicySource(value: string): IntegrationPolicyEvaluationRecord["source"] {
  if (value === "server") {
    return value;
  }
  throw new Error("Integration policy source is invalid.");
}

function parseIntegrationPolicyNextActions(payload: string): string[] {
  try {
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error("invalid next actions");
    }
    return parsed.map(sanitizePersistedText).filter(Boolean);
  } catch {
    throw new Error("Integration policy next actions are invalid.");
  }
}

function sanitizePersistedText(value: string): string {
  return redactClassifiedText(String(value ?? "").replace(/\s+/g, " ").trim());
}

function sanitizeOptionalPersistedText(value: string | null | undefined): string | undefined {
  const sanitized = sanitizePersistedText(value ?? "");
  return sanitized ? sanitized : undefined;
}

function serializeRegulatorySourceApprovalRecord(record: RegulatorySourceApprovalRecord) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    queueHash: record.queueHash,
    sourceApprovalItemId: record.sourceApprovalItemId,
    clauseId: record.clauseId,
    jurisdiction: record.jurisdiction,
    regulator: record.regulator,
    citation: record.citation,
    sourceName: record.sourceName,
    sourceUrl: record.sourceUrl,
    priority: record.priority,
    approvalStatus: record.approvalStatus,
    reviewStatus: record.reviewStatus,
    effectiveAsOf: record.effectiveAsOf,
    lastReviewedAt: record.lastReviewedAt,
    nextReviewDueAt: record.nextReviewDueAt,
    reviewerNotes: record.reviewerNotes,
    nextAction: record.nextAction,
    approvalGate: record.approvalGate,
    status: record.status,
    matchingBehaviorChanged: record.matchingBehaviorChanged,
    createdBy: record.createdBy,
    createdAt: new Date(record.createdAt),
    notLegalAdviceBoundary: record.notLegalAdviceBoundary
  };
}

type PersistedRegulatorySourceApprovalRecord = {
  id: string;
  workspaceId: string;
  queueHash: string;
  sourceApprovalItemId: string;
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  priority: string;
  approvalStatus: string;
  reviewStatus: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  reviewerNotes: string;
  nextAction: string;
  approvalGate: string;
  status: string;
  matchingBehaviorChanged: boolean;
  createdBy: string;
  createdAt: Date;
  notLegalAdviceBoundary: string;
};

function deserializeRegulatorySourceApprovalRecord(
  record: PersistedRegulatorySourceApprovalRecord
): RegulatorySourceApprovalRecord {
  return {
    recordVersion: "lexproof-source-approval-record-v1",
    id: record.id,
    workspaceId: record.workspaceId,
    queueHash: parseSha256Hex(record.queueHash, "Source approval queue hash"),
    sourceApprovalItemId: sanitizePersistedText(record.sourceApprovalItemId),
    clauseId: sanitizePersistedText(record.clauseId),
    jurisdiction: sanitizePersistedText(record.jurisdiction),
    regulator: sanitizePersistedText(record.regulator),
    citation: sanitizePersistedText(record.citation),
    sourceName: sanitizePersistedText(record.sourceName),
    sourceUrl: sanitizePersistedText(record.sourceUrl),
    priority: parseRegulatorySourceApprovalPriority(record.priority),
    approvalStatus: parseRegulatorySourceApprovalStatus(record.approvalStatus),
    reviewStatus: parseRegulatorySourceApprovalReviewStatus(record.reviewStatus),
    effectiveAsOf: sanitizePersistedText(record.effectiveAsOf),
    lastReviewedAt: sanitizePersistedText(record.lastReviewedAt),
    nextReviewDueAt: sanitizePersistedText(record.nextReviewDueAt),
    reviewerNotes: sanitizePersistedText(record.reviewerNotes),
    nextAction: sanitizePersistedText(record.nextAction),
    approvalGate:
      "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
    status: parseRegulatorySourceApprovalRecordStatus(record.status),
    matchingBehaviorChanged: parseRegulatorySourceApprovalMatchingBehaviorChanged(record.matchingBehaviorChanged),
    createdBy: sanitizePersistedText(record.createdBy),
    createdAt: record.createdAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
  };
}

function sanitizeRegulatorySourceApprovalRecord(record: RegulatorySourceApprovalRecord): RegulatorySourceApprovalRecord {
  return {
    ...record,
    sourceApprovalItemId: sanitizePersistedText(record.sourceApprovalItemId),
    clauseId: sanitizePersistedText(record.clauseId),
    jurisdiction: sanitizePersistedText(record.jurisdiction),
    regulator: sanitizePersistedText(record.regulator),
    citation: sanitizePersistedText(record.citation),
    sourceName: sanitizePersistedText(record.sourceName),
    sourceUrl: sanitizePersistedText(record.sourceUrl),
    effectiveAsOf: sanitizePersistedText(record.effectiveAsOf),
    lastReviewedAt: sanitizePersistedText(record.lastReviewedAt),
    nextReviewDueAt: sanitizePersistedText(record.nextReviewDueAt),
    reviewerNotes: sanitizePersistedText(record.reviewerNotes),
    nextAction: sanitizePersistedText(record.nextAction),
    approvalGate: "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
    matchingBehaviorChanged: false,
    createdBy: sanitizePersistedText(record.createdBy),
    notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
  };
}

function parseRegulatorySourceApprovalPriority(value: string): RegulatorySourceApprovalRecord["priority"] {
  if (value === "P0" || value === "P1") {
    return value;
  }
  throw new Error("Source approval priority is invalid.");
}

function parseRegulatorySourceApprovalStatus(value: string): RegulatorySourceApprovalRecord["approvalStatus"] {
  if (value === "approval-required" || value === "metadata-required") {
    return value;
  }
  throw new Error("Source approval status is invalid.");
}

function parseRegulatorySourceApprovalReviewStatus(value: string): RegulatorySourceApprovalRecord["reviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw new Error("Source review status is invalid.");
}

function parseRegulatorySourceApprovalRecordStatus(value: string): RegulatorySourceApprovalRecord["status"] {
  if (value === "pending-review") {
    return value;
  }
  throw new Error("Source approval record status is invalid.");
}

function parseRegulatorySourceApprovalMatchingBehaviorChanged(
  value: boolean
): RegulatorySourceApprovalRecord["matchingBehaviorChanged"] {
  if (value === false) {
    return value;
  }
  throw new Error("Source approval matching behavior changed flag is invalid.");
}

function serializeRegulatorySourceReviewRecord(record: RegulatorySourceReviewRecord) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    ledgerHash: record.ledgerHash,
    sourceReviewItemId: record.sourceReviewItemId,
    clauseId: record.clauseId,
    jurisdiction: record.jurisdiction,
    regulator: record.regulator,
    citation: record.citation,
    sourceName: record.sourceName,
    sourceUrl: record.sourceUrl,
    reviewStatus: record.reviewStatus,
    priority: record.priority,
    effectiveAsOf: record.effectiveAsOf,
    lastReviewedAt: record.lastReviewedAt,
    nextReviewDueAt: record.nextReviewDueAt,
    reviewerNotes: record.reviewerNotes,
    nextAction: record.nextAction,
    status: record.status,
    matchingBehaviorChanged: record.matchingBehaviorChanged,
    createdBy: record.createdBy,
    createdAt: new Date(record.createdAt),
    notLegalAdviceBoundary: record.notLegalAdviceBoundary
  };
}

type PersistedRegulatorySourceReviewRecord = {
  id: string;
  workspaceId: string;
  ledgerHash: string;
  sourceReviewItemId: string;
  clauseId: string;
  jurisdiction: string;
  regulator: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  reviewStatus: string;
  priority: string;
  effectiveAsOf: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  reviewerNotes: string;
  nextAction: string;
  status: string;
  matchingBehaviorChanged: boolean;
  createdBy: string;
  createdAt: Date;
  notLegalAdviceBoundary: string;
};

function deserializeRegulatorySourceReviewRecord(record: PersistedRegulatorySourceReviewRecord): RegulatorySourceReviewRecord {
  return {
    recordVersion: "lexproof-source-review-record-v1",
    id: record.id,
    workspaceId: record.workspaceId,
    ledgerHash: parseSha256Hex(record.ledgerHash, "Source review ledger hash"),
    sourceReviewItemId: sanitizePersistedText(record.sourceReviewItemId),
    clauseId: sanitizePersistedText(record.clauseId),
    jurisdiction: sanitizePersistedText(record.jurisdiction),
    regulator: sanitizePersistedText(record.regulator),
    citation: sanitizePersistedText(record.citation),
    sourceName: sanitizePersistedText(record.sourceName),
    sourceUrl: sanitizePersistedText(record.sourceUrl),
    reviewStatus: parseRegulatorySourceReviewStatus(record.reviewStatus),
    priority: parseRegulatorySourceReviewPriority(record.priority),
    effectiveAsOf: sanitizePersistedText(record.effectiveAsOf),
    lastReviewedAt: sanitizePersistedText(record.lastReviewedAt),
    nextReviewDueAt: sanitizePersistedText(record.nextReviewDueAt),
    reviewerNotes: sanitizePersistedText(record.reviewerNotes),
    nextAction: sanitizePersistedText(record.nextAction),
    status: parseRegulatorySourceReviewRecordStatus(record.status),
    matchingBehaviorChanged: parseRegulatorySourceReviewMatchingBehaviorChanged(record.matchingBehaviorChanged),
    createdBy: sanitizePersistedText(record.createdBy),
    createdAt: record.createdAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
  };
}

function sanitizeRegulatorySourceReviewRecord(record: RegulatorySourceReviewRecord): RegulatorySourceReviewRecord {
  return {
    ...record,
    sourceReviewItemId: sanitizePersistedText(record.sourceReviewItemId),
    clauseId: sanitizePersistedText(record.clauseId),
    jurisdiction: sanitizePersistedText(record.jurisdiction),
    regulator: sanitizePersistedText(record.regulator),
    citation: sanitizePersistedText(record.citation),
    sourceName: sanitizePersistedText(record.sourceName),
    sourceUrl: sanitizePersistedText(record.sourceUrl),
    effectiveAsOf: sanitizePersistedText(record.effectiveAsOf),
    lastReviewedAt: sanitizePersistedText(record.lastReviewedAt),
    nextReviewDueAt: sanitizePersistedText(record.nextReviewDueAt),
    reviewerNotes: sanitizePersistedText(record.reviewerNotes),
    nextAction: sanitizePersistedText(record.nextAction),
    matchingBehaviorChanged: false,
    createdBy: sanitizePersistedText(record.createdBy),
    notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
  };
}

function parseRegulatorySourceReviewStatus(value: string): RegulatorySourceReviewRecord["reviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  throw new Error("Source review status is invalid.");
}

function parseRegulatorySourceReviewPriority(value: string): RegulatorySourceReviewRecord["priority"] {
  if (value === "P0" || value === "P1" || value === "P2") {
    return value;
  }
  throw new Error("Source review priority is invalid.");
}

function parseRegulatorySourceReviewRecordStatus(value: string): RegulatorySourceReviewRecord["status"] {
  if (value === "current" || value === "pending-review" || value === "metadata-needed") {
    return value;
  }
  throw new Error("Source review record status is invalid.");
}

function parseRegulatorySourceReviewMatchingBehaviorChanged(
  value: boolean
): RegulatorySourceReviewRecord["matchingBehaviorChanged"] {
  if (value === false) {
    return value;
  }
  throw new Error("Source review matching behavior changed flag is invalid.");
}

function serializeAuditLogRecord(record: AuditLogRecord) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    actorId: record.actorId,
    action: record.action,
    targetType: record.targetType,
    targetId: record.targetId,
    beforeHash: record.beforeHash,
    afterHash: record.afterHash,
    summary: record.summary,
    createdAt: new Date(record.createdAt),
    notLegalAdviceBoundary: record.notLegalAdviceBoundary
  };
}

type PersistedAuditLogRecord = {
  id: string;
  workspaceId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeHash: string;
  afterHash: string;
  summary: string;
  createdAt: Date;
  notLegalAdviceBoundary: string;
};

function deserializeAuditLogRecord(record: PersistedAuditLogRecord): AuditLogRecord {
  return {
    recordVersion: "lexproof-audit-log-record-v1",
    id: record.id,
    workspaceId: record.workspaceId,
    actorId: sanitizePersistedText(record.actorId),
    action: sanitizePersistedText(record.action),
    targetType: parseAuditLogTargetType(record.targetType),
    targetId: sanitizePersistedText(record.targetId),
    beforeHash: sanitizePersistedAuditLogHash(record.beforeHash),
    afterHash: sanitizePersistedAuditLogHash(record.afterHash),
    summary: sanitizePersistedText(record.summary),
    createdAt: record.createdAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
  };
}

function sanitizeAuditLogRecord(record: AuditLogRecord): AuditLogRecord {
  return {
    ...record,
    actorId: sanitizePersistedText(record.actorId),
    action: sanitizePersistedText(record.action),
    targetType: parseAuditLogTargetType(record.targetType),
    targetId: sanitizePersistedText(record.targetId),
    beforeHash: sanitizePersistedAuditLogHash(record.beforeHash),
    afterHash: sanitizePersistedAuditLogHash(record.afterHash),
    summary: sanitizePersistedText(record.summary),
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
  };
}

function parseAuditLogTargetType(value: string): AuditLogRecord["targetType"] {
  if (
    value === "workspace" ||
    value === "evidence" ||
    value === "model-run" ||
    value === "human-review" ||
    value === "export" ||
    value === "source-approval" ||
    value === "source-review" ||
    value === "integration-policy"
  ) {
    return value;
  }
  throw new Error("Audit log target type is invalid.");
}

function sanitizePersistedAuditLogHash(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : sanitizePersistedText(value);
}
