import { describe, expect, it, vi } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { runSecureReviewJourney } from "./secureReviewJourney";
import type { ModelConnectReceipt } from "./modelConnect";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "workspace-secure-journey",
  projectName: "Secure Journey Desk",
  entityType: "Delaware C-corp issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "Policy metadata only; raw KYC excluded",
  aiUsage: "AI drafts audit-prep questions for human review",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Private beta",
  evidenceItems: [
    {
      id: "approval-memo",
      label: "Approval memo",
      kind: "Markdown",
      source: "risk evidence requirement: governance-approval",
      status: "verified",
      owner: "Compliance",
      content: "Board approval summary that must remain local."
    }
  ]
};

const modelConnectReceipt: ModelConnectReceipt = {
  receiptVersion: "lexproof-model-connect-receipt-v1",
  provider: "mock",
  providerLabel: "Mock local reviewer",
  model: "lexproof-mock",
  endpointHost: "local mock",
  status: "ready",
  mode: "local-mock",
  blockers: [],
  createdAt: "2026-06-30T00:00:00.000Z",
  notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only."
};

describe("secure review journey", () => {
  it("blocks the journey before API calls when evidence or Model Connect is missing", async () => {
    await expect(
      runSecureReviewJourney({
        project: { ...project, evidenceItems: [] },
        audit: analyzeAuditProfile({ ...project, evidenceItems: [] }),
        evidenceItems: [],
        modelConnectReceipt,
        apiBaseUrl: "https://api.lexproof.test",
        fetcher: vi.fn()
      })
    ).rejects.toThrow("Add at least one evidence item before running the secure review journey.");

    await expect(
      runSecureReviewJourney({
        project,
        audit: analyzeAuditProfile(project),
        evidenceItems: project.evidenceItems,
        modelConnectReceipt: null,
        apiBaseUrl: "https://api.lexproof.test",
        fetcher: vi.fn()
      })
    ).rejects.toThrow("Validate Model Connect before running the secure review journey.");
  });

  it("creates workspace, syncs evidence, creates a model gateway run, and opens human review", async () => {
    const uploadedForms: FormData[] = [];
    const requestBodies: Array<{ url: string; body: unknown }> = [];
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (typeof init?.body === "string") {
        requestBodies.push({ url: path, body: JSON.parse(init.body) });
      }

      if (path.endsWith("/api/workspaces") && init?.method === "POST") {
        return jsonResponse({
          recordVersion: "lexproof-workspace-record-v1",
          id: project.id,
          name: project.projectName,
          organizationName: project.entityType,
          ownerId: "Compliance",
          status: "active",
          createdAt: "2026-06-30T00:00:00.000Z",
          updatedAt: "2026-06-30T00:00:00.000Z",
          notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
        }, 201);
      }

      if (path.endsWith(`/api/workspaces/${project.id}/evidence`) && init?.method === "POST") {
        uploadedForms.push(init.body as FormData);
        return jsonResponse({
          recordVersion: "lexproof-evidence-vault-record-v1",
          id: "evidence-vault-approval",
          workspaceId: project.id,
          filename: "approval-memo.metadata.json",
          mimeType: "application/json",
          byteSize: 512,
          fileHash: "b".repeat(64),
          storageMode: "server-vault",
          status: "submitted",
          owner: "Compliance",
          sourceNote: "Metadata-only sync",
          version: 1,
          linkedRiskFlagIds: ["governance-approval"],
          containsRawKycOrPersonalData: false,
          createdAt: "2026-06-30T00:00:00.000Z",
          updatedAt: "2026-06-30T00:00:00.000Z"
        }, 201);
      }

      if (path.endsWith("/evidence/evidence-vault-approval") && init?.method === "PATCH") {
        return jsonResponse({ id: "evidence-vault-approval", status: "verified", version: 2 }, 200);
      }

      if (path.endsWith("/evidence-manifest") && init?.method === "GET") {
        return jsonResponse({
          manifestVersion: "lexproof-evidence-vault-manifest-v1",
          workspaceId: project.id,
          generatedAt: "2026-06-30T00:00:00.000Z",
          itemCount: 1,
          items: [],
          bundleHash: "a".repeat(64),
          notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
        }, 200);
      }

      if (path.endsWith("/model-runs") && init?.method === "POST") {
        return jsonResponse({
          recordVersion: "lexproof-model-gateway-run-v1",
          id: "model-gateway-run-secure",
          workspaceId: project.id,
          provider: "mock",
          providerLabel: "Mock local reviewer gateway",
          model: "lexproof-mock",
          purpose: "Create server-side model gateway receipt for audit preparation and human review.",
          status: "completed",
          redactionStatus: "clean",
          payloadHash: "c".repeat(64),
          responseHash: "d".repeat(64),
          humanReviewStatus: "needs-review",
          createdAt: "2026-06-30T00:00:00.000Z",
          completedAt: "2026-06-30T00:00:00.000Z",
          notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
        }, 201);
      }

      if (path.endsWith("/reviews") && init?.method === "POST") {
        return jsonResponse({
          recordVersion: "lexproof-human-review-record-v1",
          id: "human-review-secure",
          workspaceId: project.id,
          targetType: "model-run",
          targetId: "model-gateway-run-secure",
          reviewerId: "Compliance",
          status: "requested",
          comment: "Review Model Gateway run before counsel pack reliance.",
          createdAt: "2026-06-30T00:00:00.000Z",
          updatedAt: "2026-06-30T00:00:00.000Z",
          notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
        }, 201);
      }

      if (path.endsWith("/audit-log") && init?.method === "GET") {
        return jsonResponse([
          { action: "workspace.created" },
          { action: "evidence.created" },
          { action: "model.run.created" },
          { action: "human-review.created" }
        ], 200);
      }

      throw new Error(`Unexpected request ${path}`);
    });

    const result = await runSecureReviewJourney({
      project,
      audit: analyzeAuditProfile(project),
      evidenceItems: project.evidenceItems,
      modelConnectReceipt,
      apiBaseUrl: "https://api.lexproof.test",
      humanReviewOwner: "Compliance",
      fetcher
    });

    expect(result.status).toBe("complete");
    expect(result.evidenceVault.manifest.bundleHash).toBe("a".repeat(64));
    expect(result.modelGatewayRun.responseHash).toBe("d".repeat(64));
    expect(result.humanReview.status).toBe("requested");
    expect(result.auditLogRecords).toHaveLength(4);
    expect(result.notLegalAdviceBoundary).toContain("Not legal advice");

    const uploadedPayload = await readBlobText(uploadedForms[0].get("file") as Blob);
    expect(uploadedPayload).toContain("localContentHash");
    expect(uploadedPayload).not.toContain("Board approval summary that must remain local");

    const modelRunBody = requestBodies.find((request) => request.url.endsWith("/model-runs"))?.body as Record<string, unknown>;
    expect(modelRunBody.provider).toBe("mock");
    expect(modelRunBody).toEqual(expect.objectContaining({ includesCredentialMaterial: false, includesRawKycOrPersonalData: false }));
    expect(JSON.stringify(modelRunBody)).toContain("Model Connect validates audit-prep routing only");
    expect(JSON.stringify(modelRunBody).toLowerCase()).not.toContain("api_key");
  });
});

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}

function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") {
    return blob.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read blob.")));
    reader.readAsText(blob);
  });
}
