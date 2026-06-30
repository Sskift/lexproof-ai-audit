import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerCounselPackExportRoutes } from "./counselPackExportRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

describe("Counsel Pack export route module", () => {
  it("registers metadata-only create, list, and lookup routes with audit logs", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerCounselPackExportRoutes(server, { repository });

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-export-routes/exports/counsel-pack",
      payload: {
        projectName: "YieldPassport",
        title: "YieldPassport Counsel Pack v1",
        format: "markdown",
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
        createdBy: "Compliance",
        includesRawKycOrPersonalData: false,
        includesCredentialMaterial: false
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-counsel-pack-export-record-v1",
        id: expect.stringMatching(/^counsel-pack-export-[a-f0-9]{16}$/),
        workspaceId: "workspace-export-routes",
        exportType: "counsel-pack",
        format: "markdown",
        version: 1,
        manifestHash: "a".repeat(64),
        artifactHash: "b".repeat(64),
        notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
      })
    );
    expect(createResponse.body).not.toContain("# Counsel Pack");
    expect(createResponse.body.toLowerCase()).not.toContain("api_key");

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-export-routes/exports" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([expect.objectContaining({ id: createResponse.json().id, version: 1 })]);

    const lookupResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-export-routes/exports/${createResponse.json().id}`
    });
    expect(lookupResponse.statusCode).toBe(200);
    expect(lookupResponse.json()).toEqual(createResponse.json());

    expect(await repository.listAuditLogRecords("workspace-export-routes")).toEqual([
      expect.objectContaining({
        action: "export.counsel-pack.created",
        targetType: "export",
        targetId: createResponse.json().id,
        afterHash: "b".repeat(64),
        summary: "Created Counsel Pack export metadata record."
      })
    ]);

    await server.close();
    await repository.close();
  });

  it("blocks unsafe export record payloads without echoing raw content", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerCounselPackExportRoutes(server, { repository });

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-export-routes/exports/counsel-pack",
      payload: {
        projectName: "YieldPassport",
        title: "Unsafe Counsel Pack",
        format: "markdown",
        artifactName: "unsafe.md",
        manifestHash: "not-a-hash",
        artifactHash: "also-not-a-hash",
        artifactSize: 12,
        riskLevel: "critical",
        reviewSummary: {
          total: 1,
          reviewed: 0,
          readyForCounsel: 0,
          needsEvidence: 1,
          blocked: 0,
          open: 1
        },
        sourceCount: 1,
        createdBy: "Compliance",
        includesRawKycOrPersonalData: true,
        includesCredentialMaterial: true,
        rawMarkdown: "# Counsel Pack\n\napi_key=sk-live-secret"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error:
        "Manifest hash must be a SHA-256 hex digest. Artifact hash must be a SHA-256 hex digest. Counsel Pack export records must not include raw KYC or personal data. Counsel Pack export records must not include API keys, private keys, or credential material. Server export records accept hashes and metadata only, not raw Markdown or PDF content.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(response.body).not.toContain("sk-live-secret");
    expect(response.body.toLowerCase()).not.toContain("api_key");

    await server.close();
    await repository.close();
  });
});
