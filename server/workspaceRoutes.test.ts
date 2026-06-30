import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";
import { registerWorkspaceRoutes } from "./workspaceRoutes";

describe("Workspace route module", () => {
  it("registers workspace create, read, and update routes with audit logs", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    registerWorkspaceRoutes(server, { repository });

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: {
        id: "workspace-routes",
        name: "YieldPassport Review",
        organizationName: "YieldPassport Labs",
        ownerId: "founder-1"
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-workspace-record-v1",
        id: "workspace-routes",
        name: "YieldPassport Review",
        organizationName: "YieldPassport Labs",
        ownerId: "founder-1",
        status: "draft",
        notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
      })
    );

    const readResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-routes" });
    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.json()).toEqual(expect.objectContaining({ id: "workspace-routes", status: "draft" }));

    const updateResponse = await server.inject({
      method: "PATCH",
      url: "/api/workspaces/workspace-routes",
      payload: {
        status: "active",
        name: "YieldPassport Counsel Review"
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual(
      expect.objectContaining({
        id: "workspace-routes",
        name: "YieldPassport Counsel Review",
        status: "active"
      })
    );

    expect(await repository.listAuditLogRecords("workspace-routes")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "workspace.created",
          targetType: "workspace",
          targetId: "workspace-routes",
          summary: "Created secure review workspace."
        }),
        expect.objectContaining({
          action: "workspace.updated",
          targetType: "workspace",
          targetId: "workspace-routes",
          summary: "Updated workspace status to active."
        })
      ])
    );

    await server.close();
    await repository.close();
  });

  it("returns actionable workspace errors with the audit-prep boundary", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    registerWorkspaceRoutes(server, { repository });

    const invalidCreateResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: {
        name: "",
        organizationName: "YieldPassport Labs",
        ownerId: "founder-1"
      }
    });
    expect(invalidCreateResponse.statusCode).toBe(400);
    expect(invalidCreateResponse.json()).toEqual({
      error: "Workspace name is required.",
      code: "WORKSPACE_CREATE_FAILED",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const missingResponse = await server.inject({ method: "GET", url: "/api/workspaces/missing-workspace" });
    expect(missingResponse.statusCode).toBe(404);
    expect(missingResponse.json()).toEqual({
      error: "Workspace record not found.",
      code: "WORKSPACE_NOT_FOUND",
      recoveryAction: "Create the workspace before reading or updating it.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: {
        id: "workspace-invalid-update",
        name: "YieldPassport Review",
        organizationName: "YieldPassport Labs",
        ownerId: "founder-1"
      }
    });
    expect(createResponse.statusCode).toBe(201);

    const invalidUpdateResponse = await server.inject({
      method: "PATCH",
      url: "/api/workspaces/workspace-invalid-update",
      payload: { status: "approved" }
    });
    expect(invalidUpdateResponse.statusCode).toBe(400);
    expect(invalidUpdateResponse.json()).toEqual({
      error: "Workspace status must be draft, active, or archived.",
      code: "WORKSPACE_UPDATE_FAILED",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
    await repository.close();
  });
});
