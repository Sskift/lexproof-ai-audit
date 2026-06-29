import { createHash } from "node:crypto";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { createModelGatewayRun } from "./modelGatewayService.js";
import { createMemoryReviewWorkspaceRepository, type ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";
import {
  createAuditLogRecord,
  createModelGatewayRunSummary,
  type EvidenceVaultRecord,
  type HumanReviewRecord,
  type WorkspaceRecord
} from "../src/lib/phase2Types.js";
import { createHumanReviewRecord, updateHumanReviewRecord } from "./humanReviewService.js";
import { createEvidenceVaultRecordFromUpload } from "./evidenceVaultService.js";

export type BuildServerOptions = {
  repository?: ReviewWorkspaceRepository;
};

export function buildServer(options: BuildServerOptions = {}) {
  const server = Fastify({ logger: false });
  const repository = options.repository ?? createMemoryReviewWorkspaceRepository();
  server.register(multipart);

  server.addHook("onClose", async () => {
    await repository.close();
  });

  server.get("/api/health", async () => ({
    status: "ok",
    service: "lexproof-secure-review-workspace-api",
    version: "lexproof-phase-2-backend-v1",
    capabilities: {
      modelGateway: "mock-run-ready",
      evidenceVault: "metadata-hashing-ready",
      humanReview: "repository-ready",
      auditLog: "repository-ready"
    },
    notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
  }));

  server.post<{ Body: CreateWorkspaceRequestBody }>("/api/workspaces", async (request, reply) => {
    try {
      const workspace = createWorkspaceRecord(request.body);
      await repository.saveWorkspaceRecord(workspace);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: workspace.id,
          actorId: workspace.ownerId,
          action: "workspace.created",
          targetType: "workspace",
          targetId: workspace.id,
          beforeHash: "",
          afterHash: sha256Hex(stableStringify(workspace)),
          summary: "Created secure review workspace.",
          createdAt: workspace.createdAt
        })
      );
      return reply.status(201).send(workspace);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Workspace creation failed.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
    }
  });

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId", async (request, reply) => {
    const workspace = await repository.findWorkspaceRecord(request.params.workspaceId);

    if (!workspace) {
      return reply.status(404).send({ error: "Workspace record not found." });
    }

    return workspace;
  });

  server.patch<{ Params: { workspaceId: string }; Body: UpdateWorkspaceRequestBody }>(
    "/api/workspaces/:workspaceId",
    async (request, reply) => {
      const existing = await repository.findWorkspaceRecord(request.params.workspaceId);

      if (!existing) {
        return reply.status(404).send({ error: "Workspace record not found." });
      }

      try {
        const updated = updateWorkspaceRecord(existing, request.body);
        await repository.updateWorkspaceRecord(updated);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: updated.id,
            actorId: updated.ownerId,
            action: "workspace.updated",
            targetType: "workspace",
            targetId: updated.id,
            beforeHash: sha256Hex(stableStringify(existing)),
            afterHash: sha256Hex(stableStringify(updated)),
            summary: `Updated workspace status to ${updated.status}.`,
            createdAt: updated.updatedAt
          })
        );
        return updated;
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Workspace update failed.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }
    }
  );

  server.post<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence", async (request, reply) => {
    try {
      const upload = await readMultipartFile(request);

      if (!upload) {
        return reply.status(400).send({ error: "Evidence file is required." });
      }

      const bytes = new Uint8Array(await upload.toBuffer());
      const evidence = createEvidenceVaultRecordFromUpload({
        workspaceId: request.params.workspaceId,
        filename: upload.filename,
        mimeType: upload.mimetype,
        bytes,
        owner: getMultipartFieldValue(upload, "owner", "Unassigned"),
        sourceNote: getMultipartFieldValue(upload, "sourceNote", ""),
        linkedRiskFlagIds: parseCsv(getMultipartFieldValue(upload, "linkedRiskFlagIds", "")),
        containsRawKycOrPersonalData: parseBooleanField(getMultipartFieldValue(upload, "containsRawKycOrPersonalData", "false"))
      });

      await repository.saveEvidenceVaultRecord(evidence);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: request.params.workspaceId,
          actorId: evidence.owner,
          action: "evidence.created",
          targetType: "evidence",
          targetId: evidence.id,
          beforeHash: "",
          afterHash: evidence.fileHash,
          summary: "Uploaded evidence metadata into the Phase 2 evidence vault.",
          createdAt: evidence.createdAt
        })
      );
      return reply.status(201).send(evidence);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Evidence upload failed.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
    }
  });

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence", async (request) =>
    repository.listEvidenceVaultRecords(request.params.workspaceId)
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/evidence-manifest", async (request) => {
    const records = await repository.listEvidenceVaultRecords(request.params.workspaceId);
    const items = records.map((record, index) => ({
      sequence: index + 1,
      evidenceId: record.id,
      filename: record.filename,
      mimeType: record.mimeType,
      byteSize: record.byteSize,
      fileHash: record.fileHash,
      storageMode: record.storageMode,
      status: record.status,
      owner: record.owner,
      version: record.version,
      linkedRiskFlagIds: record.linkedRiskFlagIds,
      containsRawKycOrPersonalData: record.containsRawKycOrPersonalData
    }));
    const hashPayload = {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: request.params.workspaceId,
      items
    };

    return {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: request.params.workspaceId,
      generatedAt: new Date().toISOString(),
      itemCount: records.length,
      items,
      bundleHash: sha256Hex(stableStringify(hashPayload)),
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
    };
  });

  server.patch<{ Params: { workspaceId: string; evidenceId: string }; Body: UpdateEvidenceRequestBody }>(
    "/api/workspaces/:workspaceId/evidence/:evidenceId",
    async (request, reply) => {
      const existing = await repository.findEvidenceVaultRecord(request.params.workspaceId, request.params.evidenceId);

      if (!existing) {
        return reply.status(404).send({ error: "Evidence vault record not found." });
      }

      try {
        const updated = updateEvidenceVaultRecord(existing, request.body);
        await repository.updateEvidenceVaultRecord(updated);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: updated.owner,
            action: "evidence.updated",
            targetType: "evidence",
            targetId: updated.id,
            beforeHash: sha256Hex(stableStringify(existing)),
            afterHash: sha256Hex(stableStringify(updated)),
            summary: `Updated evidence status to ${updated.status}.`,
            createdAt: updated.updatedAt
          })
        );
        return updated;
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Evidence update failed.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }
    }
  );

  server.post<{ Params: { workspaceId: string }; Body: ModelGatewayRequestBody }>(
    "/api/workspaces/:workspaceId/model-runs",
    async (request, reply) => {
      const result = createModelGatewayRun({
        workspaceId: request.params.workspaceId,
        provider: request.body.provider,
        model: request.body.model,
        purpose: request.body.purpose,
        redactionStatus: request.body.redactionStatus,
        includesCredentialMaterial: request.body.includesCredentialMaterial,
        includesRawKycOrPersonalData: request.body.includesRawKycOrPersonalData,
        humanReviewOwner: request.body.humanReviewOwner,
        payload: request.body.payload
      });

      if (!result.valid) {
        return reply.status(400).send({
          error: "Model Gateway boundary failed.",
          errors: result.errors,
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }

      await repository.saveModelGatewayRun(result.run);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: request.params.workspaceId,
          actorId: "system",
          action: "model.run.created",
          targetType: "model-run",
          targetId: result.run.id,
          beforeHash: "",
          afterHash: result.run.responseHash,
          summary: "Created mock model gateway run for audit preparation.",
          createdAt: result.run.createdAt
        })
      );
      return reply.status(201).send(result.run);
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/model-runs", async (request) =>
    (await repository.listModelGatewayRuns(request.params.workspaceId)).map(createModelGatewayRunSummary)
  );

  server.get<{ Params: { workspaceId: string; runId: string } }>(
    "/api/workspaces/:workspaceId/model-runs/:runId",
    async (request, reply) => {
      const run = await repository.findModelGatewayRun(request.params.workspaceId, request.params.runId);
      if (!run) {
        return reply.status(404).send({ error: "Model Gateway run not found." });
      }
      return run;
    }
  );

  server.post<{ Params: { workspaceId: string }; Body: HumanReviewRequestBody }>(
    "/api/workspaces/:workspaceId/reviews",
    async (request, reply) => {
      try {
        const review = createHumanReviewRecord({
          workspaceId: request.params.workspaceId,
          targetType: request.body.targetType,
          targetId: request.body.targetId,
          reviewerId: request.body.reviewerId,
          comment: request.body.comment
        });
        await repository.saveHumanReviewRecord(review);
        await repository.appendAuditLogRecord(
          createAuditLogRecord({
            workspaceId: request.params.workspaceId,
            actorId: review.reviewerId,
            action: "human-review.created",
            targetType: "human-review",
            targetId: review.id,
            beforeHash: "",
            afterHash: review.id,
            summary: "Created human review request.",
            createdAt: review.createdAt
          })
        );
        return reply.status(201).send(review);
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Human review request failed.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        });
      }
    }
  );

  server.patch<{ Params: { workspaceId: string; reviewId: string }; Body: HumanReviewUpdateBody }>(
    "/api/workspaces/:workspaceId/reviews/:reviewId",
    async (request, reply) => {
      const reviews = await repository.listHumanReviewRecords(request.params.workspaceId);
      const reviewIndex = reviews.findIndex((item) => item.id === request.params.reviewId);

      if (reviewIndex === -1) {
        return reply.status(404).send({ error: "Human review record not found." });
      }

      const updated = updateHumanReviewRecord(reviews[reviewIndex], {
        status: request.body.status,
        comment: request.body.comment,
        reviewerId: request.body.reviewerId
      });
      await repository.updateHumanReviewRecord(updated);
      await repository.appendAuditLogRecord(
        createAuditLogRecord({
          workspaceId: request.params.workspaceId,
          actorId: updated.reviewerId,
          action: "human-review.updated",
          targetType: "human-review",
          targetId: updated.id,
          beforeHash: reviews[reviewIndex].status,
          afterHash: updated.status,
          summary: `Updated human review status to ${updated.status}.`,
          createdAt: updated.updatedAt
        })
      );
      return updated;
    }
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/reviews", async (request) =>
    repository.listHumanReviewRecords(request.params.workspaceId)
  );

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/audit-log", async (request) =>
    repository.listAuditLogRecords(request.params.workspaceId)
  );

  return server;
}

type ModelGatewayRequestBody = {
  provider: "mock" | "openai-compatible" | "enterprise-proxy";
  model: string;
  purpose: string;
  redactionStatus: "clean" | "needs-review" | "blocked";
  includesCredentialMaterial: boolean;
  includesRawKycOrPersonalData: boolean;
  humanReviewOwner: string;
  payload: unknown;
};

type HumanReviewRequestBody = {
  targetType: HumanReviewRecord["targetType"];
  targetId: string;
  reviewerId: string;
  comment: string;
};

type HumanReviewUpdateBody = {
  status?: HumanReviewRecord["status"];
  comment?: string;
  reviewerId?: string;
};

type CreateWorkspaceRequestBody = {
  id?: string;
  name: string;
  organizationName: string;
  ownerId: string;
  status?: WorkspaceRecord["status"];
};

type UpdateWorkspaceRequestBody = {
  name?: string;
  organizationName?: string;
  ownerId?: string;
  status?: WorkspaceRecord["status"];
};

type UpdateEvidenceRequestBody = {
  status?: EvidenceVaultRecord["status"];
  owner?: string;
  sourceNote?: string;
  linkedRiskFlagIds?: string[] | string;
};

type MultipartField = {
  value?: unknown;
};

type MultipartUpload = {
  filename: string;
  mimetype: string;
  fields: Record<string, MultipartField | MultipartField[] | undefined>;
  toBuffer(): Promise<Buffer>;
};

function createWorkspaceRecord(input: CreateWorkspaceRequestBody): WorkspaceRecord {
  const createdAt = new Date().toISOString();
  const name = input.name?.trim() ?? "";
  const organizationName = input.organizationName?.trim() ?? "";
  const ownerId = input.ownerId?.trim() ?? "";
  const status = input.status ?? "draft";

  if (!name) {
    throw new Error("Workspace name is required.");
  }

  if (!organizationName) {
    throw new Error("Workspace organization name is required.");
  }

  if (!ownerId) {
    throw new Error("Workspace owner ID is required.");
  }

  assertWorkspaceStatus(status);

  return {
    recordVersion: "lexproof-workspace-record-v1",
    id: input.id?.trim() || `workspace-${sha256Hex(stableStringify({ name, organizationName, ownerId, createdAt })).slice(0, 16)}`,
    name,
    organizationName,
    ownerId,
    status,
    createdAt,
    updatedAt: createdAt,
    notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
  };
}

function updateWorkspaceRecord(record: WorkspaceRecord, input: UpdateWorkspaceRequestBody): WorkspaceRecord {
  const status = input.status ?? record.status;
  assertWorkspaceStatus(status);

  return {
    ...record,
    name: input.name?.trim() || record.name,
    organizationName: input.organizationName?.trim() || record.organizationName,
    ownerId: input.ownerId?.trim() || record.ownerId,
    status,
    updatedAt: new Date().toISOString()
  };
}

function updateEvidenceVaultRecord(record: EvidenceVaultRecord, input: UpdateEvidenceRequestBody): EvidenceVaultRecord {
  const status = input.status ?? record.status;
  assertEvidenceVaultStatus(status);

  return {
    ...record,
    status,
    owner: input.owner?.trim() || record.owner,
    sourceNote: input.sourceNote?.trim() ?? record.sourceNote,
    linkedRiskFlagIds: normalizeRiskFlagIds(input.linkedRiskFlagIds) ?? record.linkedRiskFlagIds,
    version: record.version + 1,
    updatedAt: new Date().toISOString()
  };
}

async function readMultipartFile(request: unknown): Promise<MultipartUpload | undefined> {
  const fileRequest = request as { file: () => Promise<MultipartUpload | undefined> };
  return fileRequest.file();
}

function getMultipartFieldValue(upload: MultipartUpload, key: string, fallback: string): string {
  const field = upload.fields[key];
  const value = Array.isArray(field) ? field[0]?.value : field?.value;

  if (value === undefined || value === null) {
    return fallback;
  }

  return typeof value === "string" ? value : String(value);
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBooleanField(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

function normalizeRiskFlagIds(value: UpdateEvidenceRequestBody["linkedRiskFlagIds"]): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return parseCsv(value);
}

function assertWorkspaceStatus(status: string): asserts status is WorkspaceRecord["status"] {
  if (!["draft", "active", "archived"].includes(status)) {
    throw new Error("Workspace status must be draft, active, or archived.");
  }
}

function assertEvidenceVaultStatus(status: string): asserts status is EvidenceVaultRecord["status"] {
  if (!["requested", "submitted", "under-review", "verified", "rejected"].includes(status)) {
    throw new Error("Evidence status must be requested, submitted, under-review, verified, or rejected.");
  }
}

function sha256Hex(payload: string | Uint8Array): string {
  return createHash("sha256").update(payload).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
