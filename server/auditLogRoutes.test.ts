import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { createAuditLogRecord } from "../src/lib/phase2Types";
import { registerAuditLogRoutes } from "./auditLogRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

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
    const fourthRecord = createAuditLogRecord({
      workspaceId: "workspace-audit-routes",
      actorId: "Integration policy evaluator",
      action: "integration-policy.evaluated",
      targetType: "integration-policy",
      targetId: "integration-policy-evaluation-1",
      beforeHash: "",
      afterHash: "b".repeat(64),
      summary: "Evaluated object-storage integration policy as audit preparation metadata.",
      createdAt: "2026-06-30T00:03:00.000Z"
    });
    await repository.appendAuditLogRecord(firstRecord);
    await repository.appendAuditLogRecord(secondRecord);
    await repository.appendAuditLogRecord(thirdRecord);
    await repository.appendAuditLogRecord(fourthRecord);

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
      }),
      expect.objectContaining({
        id: fourthRecord.id,
        action: "integration-policy.evaluated",
        targetType: "integration-policy",
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

    const integrationPolicyFilterResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-routes/audit-log?targetType=integration-policy&action=integration-policy.evaluated"
    });
    expect(integrationPolicyFilterResponse.statusCode).toBe(200);
    expect(integrationPolicyFilterResponse.json()).toEqual([
      expect.objectContaining({
        id: fourthRecord.id,
        actorId: "Integration policy evaluator",
        targetType: "integration-policy",
        summary: "Evaluated object-storage integration policy as audit preparation metadata."
      })
    ]);

    const exportResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-routes/audit-log/export?targetType=integration-policy&action=integration-policy.evaluated"
    });
    expect(exportResponse.statusCode).toBe(200);
    expect(exportResponse.json()).toEqual(
      expect.objectContaining({
        exportVersion: "lexproof-audit-log-export-v1",
        workspaceId: "workspace-audit-routes",
        exportHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        integrityChainHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        integrityStatus: "verified",
        eventCount: 1,
        dataBoundaryStatus: "clean",
        exportAllowed: true,
        nextActions: ["Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."],
        notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only."
      })
    );
    expect(exportResponse.json().events).toEqual([
      expect.objectContaining({
        id: fourthRecord.id,
        action: "integration-policy.evaluated",
        targetType: "integration-policy",
        targetId: "integration-policy-evaluation-1",
        entryHash: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    ]);
    expect(exportResponse.body.toLowerCase()).not.toContain("api_key");
    expect(exportResponse.body.toLowerCase()).not.toContain("private_key");

    const emptyExportResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-empty/audit-log/export"
    });
    expect(emptyExportResponse.statusCode).toBe(200);
    expect(emptyExportResponse.json()).toEqual(
      expect.objectContaining({
        exportVersion: "lexproof-audit-log-export-v1",
        workspaceId: "workspace-empty",
        integrityStatus: "empty",
        eventCount: 0,
        nextActions: [
          "Run Secure Review Journey or clear Audit Log filters before final handoff.",
          "Keep Audit Log exports metadata-only and re-run the boundary check before external handoff."
        ],
        notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only."
      })
    );

    const invalidFilterResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-routes/audit-log?targetType=legal-opinion"
    });
    expect(invalidFilterResponse.statusCode).toBe(400);
    expect(invalidFilterResponse.json()).toEqual({
      error:
        "Audit log target type must be workspace, evidence, model-run, human-review, source-approval, source-review, integration-policy, or export.",
      code: "AUDIT_LOG_FILTER_FAILED",
      recoveryAction: "Use supported audit log filters for actorId, action, targetType, or targetId.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const invalidExportFilterResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-routes/audit-log/export?targetType=legal-opinion"
    });
    expect(invalidExportFilterResponse.statusCode).toBe(400);
    expect(invalidExportFilterResponse.json()).toEqual({
      error:
        "Audit log target type must be workspace, evidence, model-run, human-review, source-approval, source-review, integration-policy, or export.",
      code: "AUDIT_LOG_EXPORT_FAILED",
      recoveryAction: "Use supported audit log filters before exporting audit-log metadata.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const repeatedFilterResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-audit-routes/audit-log?actorId=Compliance&actorId=${encodeURIComponent(apiKey)}`
    });
    expect(repeatedFilterResponse.statusCode).toBe(400);
    expect(repeatedFilterResponse.json()).toEqual({
      error: "Audit log actorId filter must be a single string.",
      code: "AUDIT_LOG_FILTER_FAILED",
      recoveryAction: "Use supported audit log filters for actorId, action, targetType, or targetId.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(repeatedFilterResponse.body).not.toContain(apiKey);

    const repeatedExportFilterResponse = await server.inject({
      method: "GET",
      url: `/api/workspaces/workspace-audit-routes/audit-log/export?targetType=evidence&targetType=${encodeURIComponent(privateKey)}`
    });
    expect(repeatedExportFilterResponse.statusCode).toBe(400);
    expect(repeatedExportFilterResponse.json()).toEqual({
      error: "Audit log targetType filter must be a single string.",
      code: "AUDIT_LOG_EXPORT_FAILED",
      recoveryAction: "Use supported audit log filters before exporting audit-log metadata.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(repeatedExportFilterResponse.body).not.toContain(privateKey);

    await server.close();
    await repository.close();
  });

  it("redacts polluted audit-log metadata from listing and export responses", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    registerAuditLogRoutes(server, { repository });

    const pollutedRecord = createAuditLogRecord({
      workspaceId: "workspace-audit-redacted-routes",
      actorId: `Compliance ${apiKey}`,
      action: "evidence.updated",
      targetType: "evidence",
      targetId: `evidence-${privateKey}`,
      beforeHash: privateKey,
      afterHash: apiKey,
      summary: `Blocked raw_KYC passport A1234567, private key ${privateKey}, final-legal-decision, passport data, and apiKey=${apiKey} before handoff.`,
      createdAt: "2026-07-04T00:00:00.000Z"
    });
    await repository.appendAuditLogRecord(pollutedRecord);

    const listResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-redacted-routes/audit-log"
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([
      expect.objectContaining({
        actorId: "Compliance [redacted-api-key]",
        targetId: "evidence-[redacted-private-key]",
        beforeHash: "[redacted-private-key]",
        afterHash: "[redacted-api-key]",
        summary: expect.stringContaining("[redacted-raw-kyc]"),
        notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata."
      })
    ]);
    expect(listResponse.body).not.toContain(apiKey);
    expect(listResponse.body).not.toContain(privateKey);
    expect(listResponse.body).not.toContain("apiKey");
    expect(listResponse.body).not.toContain("raw_KYC");
    expect(listResponse.body).not.toContain("raw-KYC");
    expect(listResponse.body).not.toContain("A1234567");
    expect(listResponse.body).not.toContain("passport data");
    expect(listResponse.body).not.toContain("final-legal-decision");

    const exportResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-audit-redacted-routes/audit-log/export"
    });

    expect(exportResponse.statusCode).toBe(200);
    expect(exportResponse.json()).toEqual(
      expect.objectContaining({
        eventCount: 1,
        dataBoundaryStatus: "blocked",
        integrityStatus: "blocked",
        exportAllowed: false,
        boundaryBlockerCount: expect.any(Number),
        nextActions: expect.arrayContaining([
          "Resolve Audit Log data-boundary blockers before downloading or sharing the export.",
          "Remove secrets, private-key material, and raw KYC references from Audit Log source records before handoff."
        ]),
        notLegalAdviceBoundary: "Not legal advice. Audit Log exports are review workspace metadata only."
      })
    );
    expect(exportResponse.json().events).toEqual([
      expect.objectContaining({
        actorId: "Compliance [redacted-api-key]",
        targetId: "evidence-[redacted-private-key]",
        beforeHash: "[redacted-private-key]",
        afterHash: "[redacted-api-key]",
        summary: expect.stringContaining("[redacted-raw-kyc]")
      })
    ]);
    expect(exportResponse.body).not.toContain(apiKey);
    expect(exportResponse.body).not.toContain(privateKey);
    expect(exportResponse.body).not.toContain("apiKey");
    expect(exportResponse.body).not.toContain("raw_KYC");
    expect(exportResponse.body).not.toContain("raw-KYC");
    expect(exportResponse.body).not.toContain("A1234567");
    expect(exportResponse.body).not.toContain("passport data");
    expect(exportResponse.body).not.toContain("final-legal-decision");

    await server.close();
    await repository.close();
  });
});
