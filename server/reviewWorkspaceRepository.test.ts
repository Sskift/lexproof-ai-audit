import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAuditLogRecord } from "../src/lib/phase2Types";
import { createEvidenceVaultRecordFromUpload } from "./evidenceVaultService";
import { createHumanReviewRecord } from "./humanReviewService";
import { createModelGatewayRun } from "./modelGatewayService";
import { createPrismaReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

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
      sourceNote: "Board approval memo for counsel review.",
      linkedRiskFlagIds: ["governance", "custody"],
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

    await secondRepository.close();
  });
});
