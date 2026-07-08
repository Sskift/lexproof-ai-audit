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

  it("rejects malformed workspace create metadata before creating records or audit logs", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    registerWorkspaceRoutes(server, { repository });

    const cases: Array<{ payload?: unknown; workspaceId: string; expectedError: string }> = [
      {
        workspaceId: "workspace-malformed-create-empty",
        expectedError: "Workspace creation payload must be a JSON object."
      },
      {
        workspaceId: "workspace-malformed-create-name",
        payload: {
          id: "workspace-malformed-create-name",
          name: 123,
          organizationName: "YieldPassport Labs",
          ownerId: "founder-1",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890"
        },
        expectedError: "Workspace name must be a string."
      },
      {
        workspaceId: "workspace-malformed-create-secret",
        payload: {
          id: "workspace-malformed-create-secret",
          name: "YieldPassport sk-live-abcdef1234567890abcdef1234567890",
          organizationName: "YieldPassport Labs",
          ownerId: "founder-1"
        },
        expectedError: "Workspace metadata must not include credential-material."
      },
      {
        workspaceId: "workspace-malformed-create-status",
        payload: {
          id: "workspace-malformed-create-status",
          name: "YieldPassport Review",
          organizationName: "YieldPassport Labs",
          ownerId: "founder-1",
          status: "approved"
        },
        expectedError: "Workspace status must be draft, active, or archived."
      }
    ];

    for (const item of cases) {
      const response = await server.inject({
        method: "POST",
        url: "/api/workspaces",
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: item.expectedError,
        code: "WORKSPACE_CREATE_FAILED",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("apiKey");
      expect(await repository.findWorkspaceRecord(item.workspaceId)).toBeNull();
      expect(await repository.listAuditLogRecords(item.workspaceId)).toEqual([]);
    }

    await server.close();
    await repository.close();
  });

  it("rejects malformed workspace updates before mutating records or audit logs", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    registerWorkspaceRoutes(server, { repository });

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: {
        id: "workspace-malformed-update",
        name: "YieldPassport Review",
        organizationName: "YieldPassport Labs",
        ownerId: "founder-1"
      }
    });
    expect(createResponse.statusCode).toBe(201);

    const cases: Array<{ payload?: unknown; expectedError: string }> = [
      {
        expectedError: "Workspace update payload must be a JSON object."
      },
      {
        payload: {
          ownerId: { apiKey: "sk-live-abcdef1234567890abcdef1234567890" }
        },
        expectedError: "Workspace owner ID must be a string."
      },
      {
        payload: {
          organizationName: "Raw KYC packet intake room"
        },
        expectedError: "Workspace metadata must not include [redacted-raw-kyc]."
      },
      {
        payload: {
          status: 7
        },
        expectedError: "Workspace status must be draft, active, or archived."
      }
    ];

    for (const item of cases) {
      const response = await server.inject({
        method: "PATCH",
        url: "/api/workspaces/workspace-malformed-update",
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: item.expectedError,
        code: "WORKSPACE_UPDATE_FAILED",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("apiKey");
      expect(await repository.findWorkspaceRecord("workspace-malformed-update")).toEqual(
        expect.objectContaining({
          id: "workspace-malformed-update",
          name: "YieldPassport Review",
          organizationName: "YieldPassport Labs",
          ownerId: "founder-1",
          status: "draft"
        })
      );
      expect(await repository.listAuditLogRecords("workspace-malformed-update")).toEqual([
        expect.objectContaining({
          action: "workspace.created",
          targetId: "workspace-malformed-update"
        })
      ]);
    }

    await server.close();
    await repository.close();
  });
});
