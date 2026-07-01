import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { createAuditLogRecord } from "../src/lib/phase2Types";
import { registerAuditLogRoutes } from "./auditLogRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

describe("Audit Log route module", () => {
  it("registers workspace audit-log listing routes without raw payload fields", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    registerAuditLogRoutes(server, { repository });

    const firstRecord = createAuditLogRecord({
      workspaceId: "workspace-audit-routes",
      actorId: "Compliance",
      action: "workspace.created",
      targetType: "workspace",
      targetId: "workspace-audit-routes",
      beforeHash: "",
      afterHash: "a".repeat(64),
      summary: "Created secure review workspace.",
      createdAt: "2026-06-30T00:00:00.000Z"
    });
    const secondRecord = createAuditLogRecord({
      workspaceId: "workspace-audit-routes",
      actorId: "Counsel",
      action: "human-review.updated",
      targetType: "human-review",
      targetId: "human-review-1",
      beforeHash: "requested",
      afterHash: "reviewed",
      summary: "Updated human review status to reviewed.",
      createdAt: "2026-06-30T00:01:00.000Z"
    });
    const thirdRecord = createAuditLogRecord({
      workspaceId: "workspace-audit-routes",
      actorId: "Counsel",
      action: "evidence.updated",
      targetType: "evidence",
      targetId: "evidence-1",
      beforeHash: "received",
      afterHash: "verified",
      summary: "Updated evidence status to verified.",
      createdAt: "2026-06-30T00:02:00.000Z"
    });
    await repository.appendAuditLogRecord(firstRecord);
    await repository.appendAuditLogRecord(secondRecord);
    await repository.appendAuditLogRecord(thirdRecord);

    const response = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-routes/audit-log"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      expect.objectContaining({
        recordVersion: "lexproof-audit-log-record-v1",
        id: firstRecord.id,
        action: "workspace.created",
        targetType: "workspace",
        notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
      }),
      expect.objectContaining({
        id: secondRecord.id,
        action: "human-review.updated",
        targetType: "human-review",
        notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
      }),
      expect.objectContaining({
        id: thirdRecord.id,
        action: "evidence.updated",
        targetType: "evidence",
        notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
      })
    ]);
    expect(response.body.toLowerCase()).not.toContain("api_key");
    expect(response.body.toLowerCase()).not.toContain("private_key");

    const emptyResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-empty/audit-log"
    });
    expect(emptyResponse.statusCode).toBe(200);
    expect(emptyResponse.json()).toEqual([]);

    const filteredResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-routes/audit-log?actorId=Counsel&targetType=evidence&action=evidence.updated&targetId=evidence-1"
    });
    expect(filteredResponse.statusCode).toBe(200);
    expect(filteredResponse.json()).toEqual([expect.objectContaining({ id: thirdRecord.id, actorId: "Counsel", targetType: "evidence" })]);

    const invalidFilterResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-routes/audit-log?targetType=legal-opinion"
    });
    expect(invalidFilterResponse.statusCode).toBe(400);
    expect(invalidFilterResponse.json()).toEqual({
      error: "Audit log target type must be workspace, evidence, model-run, human-review, source-approval, source-review, or export.",
      code: "AUDIT_LOG_FILTER_FAILED",
      recoveryAction: "Use supported audit log filters for actorId, action, targetType, or targetId.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
    await repository.close();
  });
});
