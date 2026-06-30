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
    await repository.appendAuditLogRecord(firstRecord);
    await repository.appendAuditLogRecord(secondRecord);

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

    await server.close();
    await repository.close();
  });
});
