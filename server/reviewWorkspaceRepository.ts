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
  const sourceApprovals = new Map<string, RegulatorySourceApprovalRecord[]>();
  const sourceReviews = new Map<string, RegulatorySourceReviewRecord[]>();
  const auditLogs = new Map<string, AuditLogRecord[]>();

  return {
    async saveWorkspaceRecord(record) {
      workspaces.set(record.id, record);
    },

    async updateWorkspaceRecord(record) {
      workspaces.set(record.id, record);
    },

    async findWorkspaceRecord(workspaceId) {
      return workspaces.get(workspaceId) ?? null;
    },

    async saveEvidenceVaultRecord(record) {
      evidenceRecords.set(record.workspaceId, upsertById(evidenceRecords.get(record.workspaceId) ?? [], record));
    },

    async updateEvidenceVaultRecord(record) {
      evidenceRecords.set(record.workspaceId, upsertById(evidenceRecords.get(record.workspaceId) ?? [], record));
    },

    async listEvidenceVaultRecords(workspaceId) {
      return evidenceRecords.get(workspaceId) ?? [];
    },

    async findEvidenceVaultRecord(workspaceId, evidenceId) {
      return (evidenceRecords.get(workspaceId) ?? []).find((record) => record.id === evidenceId) ?? null;
    },

    async saveModelGatewayRun(run) {
      modelRuns.set(run.workspaceId, upsertById(modelRuns.get(run.workspaceId) ?? [], run));
    },

    async listModelGatewayRuns(workspaceId) {
      return modelRuns.get(workspaceId) ?? [];
    },

    async findModelGatewayRun(workspaceId, runId) {
      return (modelRuns.get(workspaceId) ?? []).find((run) => run.id === runId) ?? null;
    },

    async saveHumanReviewRecord(record) {
      humanReviews.set(record.workspaceId, upsertById(humanReviews.get(record.workspaceId) ?? [], record));
    },

    async updateHumanReviewRecord(record) {
      humanReviews.set(record.workspaceId, upsertById(humanReviews.get(record.workspaceId) ?? [], record));
    },

    async listHumanReviewRecords(workspaceId) {
      return humanReviews.get(workspaceId) ?? [];
    },

    async saveCounselPackExportRecord(record) {
      counselPackExports.set(record.workspaceId, upsertById(counselPackExports.get(record.workspaceId) ?? [], record));
    },

    async listCounselPackExportRecords(workspaceId) {
      return counselPackExports.get(workspaceId) ?? [];
    },

    async findCounselPackExportRecord(workspaceId, exportId) {
      return (counselPackExports.get(workspaceId) ?? []).find((record) => record.id === exportId) ?? null;
    },

    async saveRegulatorySourceApprovalRecord(record) {
      sourceApprovals.set(record.workspaceId, upsertById(sourceApprovals.get(record.workspaceId) ?? [], record));
    },

    async listRegulatorySourceApprovalRecords(workspaceId) {
      return sourceApprovals.get(workspaceId) ?? [];
    },

    async saveRegulatorySourceReviewRecord(record) {
      sourceReviews.set(record.workspaceId, upsertById(sourceReviews.get(record.workspaceId) ?? [], record));
    },

    async listRegulatorySourceReviewRecords(workspaceId) {
      return sourceReviews.get(workspaceId) ?? [];
    },

    async appendAuditLogRecord(record) {
      auditLogs.set(record.workspaceId, [...(auditLogs.get(record.workspaceId) ?? []), record]);
    },

    async listAuditLogRecords(workspaceId) {
      return auditLogs.get(workspaceId) ?? [];
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
      await prisma.workspaceRecord.upsert({
        where: { id: record.id },
        update: serializeWorkspaceRecord(record),
        create: serializeWorkspaceRecord(record)
      });
    },

    async updateWorkspaceRecord(record) {
      await prisma.workspaceRecord.update({
        where: { id: record.id },
        data: serializeWorkspaceRecord(record)
      });
    },

    async findWorkspaceRecord(workspaceId) {
      const record = await prisma.workspaceRecord.findUnique({
        where: { id: workspaceId }
      });
      return record ? deserializeWorkspaceRecord(record) : null;
    },

    async saveEvidenceVaultRecord(record) {
      await prisma.evidenceVaultRecord.upsert({
        where: { id: record.id },
        update: serializeEvidenceVaultRecord(record),
        create: serializeEvidenceVaultRecord(record)
      });
    },

    async updateEvidenceVaultRecord(record) {
      await prisma.evidenceVaultRecord.update({
        where: { id: record.id },
        data: serializeEvidenceVaultRecord(record)
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
      await prisma.modelGatewayRun.upsert({
        where: { id: run.id },
        update: serializeModelGatewayRun(run),
        create: serializeModelGatewayRun(run)
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
      await prisma.humanReviewRecord.upsert({
        where: { id: record.id },
        update: serializeHumanReviewRecord(record),
        create: serializeHumanReviewRecord(record)
      });
    },

    async updateHumanReviewRecord(record) {
      await prisma.humanReviewRecord.update({
        where: { id: record.id },
        data: serializeHumanReviewRecord(record)
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
      await prisma.counselPackExportRecord.upsert({
        where: { id: record.id },
        update: serializeCounselPackExportRecord(record),
        create: serializeCounselPackExportRecord(record)
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

    async saveRegulatorySourceApprovalRecord(record) {
      await prisma.regulatorySourceApprovalRecord.upsert({
        where: { id: record.id },
        update: serializeRegulatorySourceApprovalRecord(record),
        create: serializeRegulatorySourceApprovalRecord(record)
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
      await prisma.regulatorySourceReviewRecord.upsert({
        where: { id: record.id },
        update: serializeRegulatorySourceReviewRecord(record),
        create: serializeRegulatorySourceReviewRecord(record)
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
      await prisma.auditLogRecord.create({
        data: serializeAuditLogRecord(record)
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
    name: record.name,
    organizationName: record.organizationName,
    ownerId: record.ownerId,
    status: record.status as WorkspaceRecord["status"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
  };
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
    filename: record.filename,
    mimeType: record.mimeType,
    byteSize: record.byteSize,
    fileHash: record.fileHash,
    storageMode: record.storageMode as EvidenceVaultRecord["storageMode"],
    status: record.status as EvidenceVaultRecord["status"],
    owner: record.owner,
    sourceNote: record.sourceNote,
    version: record.version,
    linkedRiskFlagIds: parseStringArray(record.linkedRiskFlagIdsJson),
    linkedControlIds: parseStringArray(record.linkedControlIdsJson ?? "[]"),
    containsRawKycOrPersonalData: record.containsRawKycOrPersonalData,
    ...parseMetadataBoundaryWarnings(record.metadataBoundaryWarningsJson ?? "[]"),
    parentEvidenceId: record.parentEvidenceId ?? undefined,
    supersededByEvidenceId: record.supersededByEvidenceId ?? undefined,
    replacementReason: record.replacementReason ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
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
    const metadataBoundaryWarnings = Array.isArray(parsed) ? parsed.filter(isMetadataBoundaryWarning) : [];
    return metadataBoundaryWarnings.length > 0 ? { metadataBoundaryWarnings } : {};
  } catch {
    return {};
  }
}

function isMetadataBoundaryWarning(value: unknown): value is NonNullable<EvidenceVaultRecord["metadataBoundaryWarnings"]>[number] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.dataClass === "wallet-address" || candidate.dataClass === "personal-data" || candidate.dataClass === "confidential") &&
    candidate.severity === "warn" &&
    typeof candidate.matchCount === "number" &&
    typeof candidate.redactedSnippet === "string" &&
    typeof candidate.message === "string"
  );
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
  return {
    recordVersion: "lexproof-model-gateway-run-v1",
    id: run.id,
    workspaceId: run.workspaceId,
    provider: run.provider as ModelGatewayRun["provider"],
    providerLabel: run.providerLabel,
    model: run.model,
    purpose: run.purpose,
    status: run.status as ModelGatewayRun["status"],
    redactionStatus: run.redactionStatus as ModelGatewayRun["redactionStatus"],
    payloadHash: run.payloadHash,
    responseHash: run.responseHash,
    sourceEvidenceHash: run.sourceEvidenceHash,
    providerMetadata: parseModelGatewayProviderMetadata(run.providerMetadataJson),
    humanReviewStatus: run.humanReviewStatus as ModelGatewayRun["humanReviewStatus"],
    attempt: run.attempt,
    maxAttempts: run.maxAttempts,
    retryState: run.retryState as ModelGatewayRun["retryState"],
    ...(run.errorCode ? { errorCode: run.errorCode } : {}),
    ...(run.errorMessage ? { errorMessage: run.errorMessage } : {}),
    remediationSteps: parseStringArray(run.remediationStepsJson),
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString(),
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
}

function parseModelGatewayProviderMetadata(payload: string): ModelGatewayRun["providerMetadata"] {
  const fallback: ModelGatewayRun["providerMetadata"] = {
    adapterMode: "external-provider-placeholder",
    credentialPolicy: "deferred until server-side secret policy is approved",
    secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
    allowedDataClasses: []
  };

  try {
    const parsed = JSON.parse(payload) as Partial<ModelGatewayRun["providerMetadata"]>;
    return {
      adapterMode: parsed.adapterMode === "local-mock" ? "local-mock" : "external-provider-placeholder",
      credentialPolicy:
        parsed.credentialPolicy === "no credentials accepted"
          ? "no credentials accepted"
          : "deferred until server-side secret policy is approved",
      secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
      allowedDataClasses: Array.isArray(parsed.allowedDataClasses)
        ? parsed.allowedDataClasses.filter((item): item is string => typeof item === "string")
        : []
    };
  } catch {
    return fallback;
  }
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
    targetType: record.targetType as HumanReviewRecord["targetType"],
    targetId: record.targetId,
    reviewerId: record.reviewerId,
    status: record.status as HumanReviewRecord["status"],
    comment: record.comment,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
  };
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
    exportType: "counsel-pack",
    format: record.format as CounselPackExportRecord["format"],
    version: record.version,
    projectName: record.projectName,
    title: record.title,
    artifactName: record.artifactName,
    manifestHash: record.manifestHash,
    artifactHash: record.artifactHash,
    artifactSize: record.artifactSize,
    riskLevel: record.riskLevel as CounselPackExportRecord["riskLevel"],
    reviewSummary: parseCounselPackExportReviewSummary(record.reviewSummaryJson),
    sourceCount: record.sourceCount,
    sourcePackHash: record.sourcePackHash ?? "",
    sourceReviewStatus: parseCounselPackExportSourceReviewStatus(record.sourceReviewStatus),
    createdBy: record.createdBy,
    status: "ready",
    createdAt: record.createdAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
  };
}

function parseCounselPackExportReviewSummary(payload: string): CounselPackExportRecord["reviewSummary"] {
  const fallback: CounselPackExportRecord["reviewSummary"] = {
    total: 0,
    reviewed: 0,
    readyForCounsel: 0,
    needsEvidence: 0,
    blocked: 0,
    open: 0
  };

  try {
    const parsed = JSON.parse(payload) as Partial<CounselPackExportRecord["reviewSummary"]>;
    return {
      total: Number(parsed.total ?? fallback.total),
      reviewed: Number(parsed.reviewed ?? fallback.reviewed),
      readyForCounsel: Number(parsed.readyForCounsel ?? fallback.readyForCounsel),
      needsEvidence: Number(parsed.needsEvidence ?? fallback.needsEvidence),
      blocked: Number(parsed.blocked ?? fallback.blocked),
      open: Number(parsed.open ?? fallback.open)
    };
  } catch {
    return fallback;
  }
}

function parseCounselPackExportSourceReviewStatus(value: string | null | undefined): CounselPackExportRecord["sourceReviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  return "metadata-missing";
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
    queueHash: record.queueHash,
    sourceApprovalItemId: record.sourceApprovalItemId,
    clauseId: record.clauseId,
    jurisdiction: record.jurisdiction,
    regulator: record.regulator,
    citation: record.citation,
    sourceName: record.sourceName,
    sourceUrl: record.sourceUrl,
    priority: record.priority as RegulatorySourceApprovalRecord["priority"],
    approvalStatus: record.approvalStatus as RegulatorySourceApprovalRecord["approvalStatus"],
    reviewStatus: record.reviewStatus as RegulatorySourceApprovalRecord["reviewStatus"],
    effectiveAsOf: record.effectiveAsOf,
    lastReviewedAt: record.lastReviewedAt,
    nextReviewDueAt: record.nextReviewDueAt,
    reviewerNotes: record.reviewerNotes,
    nextAction: record.nextAction,
    approvalGate:
      "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
    status: "pending-review",
    matchingBehaviorChanged: false,
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
  };
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
    ledgerHash: record.ledgerHash,
    sourceReviewItemId: record.sourceReviewItemId,
    clauseId: record.clauseId,
    jurisdiction: record.jurisdiction,
    regulator: record.regulator,
    citation: record.citation,
    sourceName: record.sourceName,
    sourceUrl: record.sourceUrl,
    reviewStatus: parseRegulatorySourceReviewStatus(record.reviewStatus),
    priority: parseRegulatorySourceReviewPriority(record.priority),
    effectiveAsOf: record.effectiveAsOf,
    lastReviewedAt: record.lastReviewedAt,
    nextReviewDueAt: record.nextReviewDueAt,
    reviewerNotes: record.reviewerNotes,
    nextAction: record.nextAction,
    status: parseRegulatorySourceReviewRecordStatus(record.status),
    matchingBehaviorChanged: false,
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
  };
}

function parseRegulatorySourceReviewStatus(value: string): RegulatorySourceReviewRecord["reviewStatus"] {
  if (value === "current" || value === "review-due" || value === "metadata-missing") {
    return value;
  }
  return "metadata-missing";
}

function parseRegulatorySourceReviewPriority(value: string): RegulatorySourceReviewRecord["priority"] {
  if (value === "P0" || value === "P1" || value === "P2") {
    return value;
  }
  return "P1";
}

function parseRegulatorySourceReviewRecordStatus(value: string): RegulatorySourceReviewRecord["status"] {
  if (value === "current" || value === "pending-review" || value === "metadata-needed") {
    return value;
  }
  return "pending-review";
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
    actorId: record.actorId,
    action: record.action,
    targetType: record.targetType as AuditLogRecord["targetType"],
    targetId: record.targetId,
    beforeHash: record.beforeHash,
    afterHash: record.afterHash,
    summary: record.summary,
    createdAt: record.createdAt.toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
  };
}
