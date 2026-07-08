import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerCounselPackExportRoutes } from "./counselPackExportRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

describe("Counsel Pack export route module", () => {
  it("registers metadata-only create, list, lookup, and recovery routes with audit logs", async () => {
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
        sourcePackHash: "c".repeat(64),
        sourceReviewStatus: "current",
        jurisdictionReadinessDigest: {
          digestHash: "d".repeat(64),
          status: "needs-evidence",
          handoffAllowed: false,
          jurisdictionCount: 2,
          readyForCounselCount: 0,
          needsEvidenceCount: 2,
          needsSourceReviewCount: 0,
          metadataMissingCount: 0,
          openEvidenceRequestCount: 8,
          sourceFreshnessBlockerCount: 1,
          dueSoonSourceCount: 0,
          notLegalAdviceBoundary:
            "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
        },
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
        sourcePackHash: "c".repeat(64),
        sourceReviewStatus: "current",
        jurisdictionReadinessDigest: expect.objectContaining({
          digestHash: "d".repeat(64),
          status: "needs-evidence",
          handoffAllowed: false
        }),
        notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
      })
    );
    expect(createResponse.body).not.toContain("# Counsel Pack");
    expect(createResponse.body.toLowerCase()).not.toContain("api_key");

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-export-routes/exports" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([expect.objectContaining({ id: createResponse.json().id, version: 1 })]);

    const recoveryResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-export-routes/exports/counsel-pack/recovery"
    });
    expect(recoveryResponse.statusCode).toBe(200);
    expect(recoveryResponse.json()).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-counsel-pack-export-recovery-packet-v1",
        workspaceId: "workspace-export-routes",
        recordCount: 1,
        recoveryItemCount: 1,
        blockedCount: 1,
        latestExportRecordId: createResponse.json().id,
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Counsel Pack export recovery packets are audit preparation metadata only."
      })
    );
    expect(recoveryResponse.json().items).toEqual([
      expect.objectContaining({
        exportRecordId: createResponse.json().id,
        recoveryStatus: "blocked",
        priority: "P0",
        recoveryAction: "Resolve blocked counsel review items before export recovery can clear.",
        notLegalAdviceBoundary: "Not legal advice. Counsel Pack export recovery items are audit preparation workflow metadata only."
      })
    ]);
    expect(recoveryResponse.body).not.toContain("# Counsel Pack");
    expect(recoveryResponse.body.toLowerCase()).not.toContain("api_key");

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
        sourcePackHash: "not-a-source-pack-hash",
        sourceReviewStatus: "review-due",
        createdBy: "Compliance",
        includesRawKycOrPersonalData: true,
        includesCredentialMaterial: true,
        rawMarkdown: "# Counsel Pack\n\napi_key=sk-live-secret"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error:
        "Manifest hash must be a SHA-256 hex digest. Artifact hash must be a SHA-256 hex digest. Source pack hash must be a SHA-256 hex digest. Counsel Pack export records must not include [redacted-raw-kyc] or personal data. Counsel Pack export records must not include API keys, private keys, or credential material. Server export records accept hashes and metadata only, not raw Markdown or PDF content.",
      code: "COUNSEL_PACK_EXPORT_CREATE_FAILED",
      recoveryAction: "Remove raw content and blocked data classes, then retry with manifest and artifact hashes only.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(response.body).not.toContain("sk-live-secret");
    expect(response.body.toLowerCase()).not.toContain("api_key");

    await server.close();
    await repository.close();
  });

  it("rejects malformed export record metadata before creating records or audit logs", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerCounselPackExportRoutes(server, { repository });

    const validPayload = {
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
      sourcePackHash: "c".repeat(64),
      sourceReviewStatus: "current",
      jurisdictionReadinessDigest: {
        digestHash: "d".repeat(64),
        status: "needs-evidence",
        handoffAllowed: false,
        jurisdictionCount: 2,
        readyForCounselCount: 0,
        needsEvidenceCount: 2,
        needsSourceReviewCount: 0,
        metadataMissingCount: 0,
        openEvidenceRequestCount: 8,
        sourceFreshnessBlockerCount: 1,
        dueSoonSourceCount: 0,
        notLegalAdviceBoundary:
          "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
      },
      createdBy: "Compliance",
      includesRawKycOrPersonalData: false,
      includesCredentialMaterial: false
    };
    const cases: Array<{ payload?: unknown; expectedError: string }> = [
      {
        expectedError: "Counsel Pack export payload must be a JSON object."
      },
      {
        payload: {
          ...validPayload,
          artifactSize: "4096",
          apiKey: "sk-live-abcdef1234567890abcdef1234567890"
        },
        expectedError: "Counsel Pack export artifact size must be a non-negative integer."
      },
      {
        payload: {
          ...validPayload,
          reviewSummary: {
            ...validPayload.reviewSummary,
            reviewed: "1"
          }
        },
        expectedError: "Counsel Pack export review summary reviewed count must be a non-negative integer."
      },
      {
        payload: {
          ...validPayload,
          jurisdictionReadinessDigest: {
            ...validPayload.jurisdictionReadinessDigest,
            dueSoonSourceCount: 0.5
          },
          rawContent: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" }
        },
        expectedError: "Counsel Pack export jurisdiction readiness due soon source count must be a non-negative integer."
      },
      {
        payload: {
          ...validPayload,
          includesCredentialMaterial: "false"
        },
        expectedError: "Counsel Pack export credential material flag must be a boolean."
      }
    ];

    for (const [index, item] of cases.entries()) {
      const workspaceId = `workspace-export-malformed-${index}`;
      const response = await server.inject({
        method: "POST",
        url: `/api/workspaces/${workspaceId}/exports/counsel-pack`,
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: item.expectedError,
          code: "COUNSEL_PACK_EXPORT_CREATE_FAILED",
          recoveryAction: "Remove raw content and blocked data classes, then retry with manifest and artifact hashes only.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      expect(response.body).not.toContain("sk-live-abcdef");
      expect(response.body).not.toContain("0x1234567890abcdef");
      expect(response.body).not.toContain("apiKey");
      expect(response.body).not.toContain("privateKey");
      expect(await repository.listCounselPackExportRecords(workspaceId)).toEqual([]);
      expect(await repository.listAuditLogRecords(workspaceId)).toEqual([]);

      const recoveryResponse = await server.inject({
        method: "GET",
        url: `/api/workspaces/${workspaceId}/exports/counsel-pack/recovery`
      });
      expect(recoveryResponse.statusCode).toBe(200);
      expect(recoveryResponse.json()).toEqual(
        expect.objectContaining({
          recordCount: 0,
          recoveryItemCount: 0,
          blockedCount: 0,
          notLegalAdviceBoundary: "Not legal advice. Counsel Pack export recovery packets are audit preparation metadata only."
        })
      );
    }

    await server.close();
    await repository.close();
  });

  it("returns a typed audit-prep error for missing export lookups", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await registerCounselPackExportRoutes(server, { repository });

    const response = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-export-routes/exports/missing-export"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: "Counsel Pack export record not found.",
      code: "COUNSEL_PACK_EXPORT_NOT_FOUND",
      recoveryAction: "Create a Counsel Pack export record before lookup or verify the export ID.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
    await repository.close();
  });
});
