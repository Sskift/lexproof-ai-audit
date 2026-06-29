import { PrismaClient } from "@prisma/client";
import type { AuditLogRecord, HumanReviewRecord, ModelGatewayRun } from "../src/lib/phase2Types.js";

export type ReviewWorkspaceRepository = {
  saveModelGatewayRun(run: ModelGatewayRun): Promise<void>;
  listModelGatewayRuns(workspaceId: string): Promise<ModelGatewayRun[]>;
  findModelGatewayRun(workspaceId: string, runId: string): Promise<ModelGatewayRun | null>;
  saveHumanReviewRecord(record: HumanReviewRecord): Promise<void>;
  updateHumanReviewRecord(record: HumanReviewRecord): Promise<void>;
  listHumanReviewRecords(workspaceId: string): Promise<HumanReviewRecord[]>;
  appendAuditLogRecord(record: AuditLogRecord): Promise<void>;
  listAuditLogRecords(workspaceId: string): Promise<AuditLogRecord[]>;
  close(): Promise<void>;
};

export type PrismaReviewWorkspaceRepositoryOptions = {
  databaseUrl: string;
};

export function createMemoryReviewWorkspaceRepository(): ReviewWorkspaceRepository {
  const modelRuns = new Map<string, ModelGatewayRun[]>();
  const humanReviews = new Map<string, HumanReviewRecord[]>();
  const auditLogs = new Map<string, AuditLogRecord[]>();

  return {
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
      "humanReviewStatus" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL,
      "completedAt" DATETIME,
      "notLegalAdviceBoundary" TEXT NOT NULL
    );
  `);
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
    humanReviewStatus: run.humanReviewStatus,
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
  humanReviewStatus: string;
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
    humanReviewStatus: run.humanReviewStatus as ModelGatewayRun["humanReviewStatus"],
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString(),
    notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
  };
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
