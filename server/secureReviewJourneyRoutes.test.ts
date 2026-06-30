import FormData from "form-data";
import { describe, expect, it } from "vitest";
import { buildServer } from "./app";

describe("Secure Review Journey routes", () => {
  it("runs workspace, evidence vault, model gateway, human review, and audit log routes together", async () => {
    const server = buildServer();

    const workspaceResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: {
        id: "workspace-secure-review-e2e",
        name: "Secure Review E2E",
        organizationName: "LexProof Labs",
        ownerId: "Compliance",
        status: "active"
      }
    });
    expect(workspaceResponse.statusCode).toBe(201);

    const form = new FormData();
    form.append("file", Buffer.from("board approval memo for server-side evidence hashing"), {
      filename: "approval-memo.txt",
      contentType: "text/plain"
    });
    form.append("owner", "Compliance");
    form.append("sourceNote", "Metadata-only secure review journey evidence.");
    form.append("linkedRiskFlagIds", "governance-approval");
    form.append("containsRawKycOrPersonalData", "false");

    const evidenceResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-secure-review-e2e/evidence",
      headers: form.getHeaders(),
      payload: form
    });
    expect(evidenceResponse.statusCode).toBe(201);
    expect(evidenceResponse.body).not.toContain("board approval memo for server-side evidence hashing");

    const manifestResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-secure-review-e2e/evidence-manifest"
    });
    expect(manifestResponse.statusCode).toBe(200);
    expect(manifestResponse.json()).toEqual(
      expect.objectContaining({
        itemCount: 1,
        bundleHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
      })
    );

    const modelRunResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-secure-review-e2e/model-runs",
      payload: {
        provider: "mock",
        model: "lexproof-mock",
        purpose: "Create server-side model gateway receipt for audit preparation and human review.",
        redactionStatus: "clean",
        includesCredentialMaterial: false,
        includesRawKycOrPersonalData: false,
        humanReviewOwner: "Compliance",
        allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"],
        payload: {
          boundary: "Not legal advice. Server Model Gateway receipts support audit preparation and human review only.",
          evidenceVaultBundleHash: manifestResponse.json().bundleHash,
          modelConnectReceipt: {
            provider: "mock",
            providerLabel: "Mock local reviewer",
            notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only."
          }
        }
      }
    });
    expect(modelRunResponse.statusCode).toBe(201);
    expect(modelRunResponse.json()).toEqual(
      expect.objectContaining({
        providerLabel: "Mock local reviewer gateway",
        responseHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        humanReviewStatus: "needs-review",
        notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
      })
    );
    expect(modelRunResponse.body.toLowerCase()).not.toContain("api_key");

    const reviewsResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-secure-review-e2e/reviews"
    });
    expect(reviewsResponse.statusCode).toBe(200);
    expect(reviewsResponse.json()).toEqual([
      expect.objectContaining({
        targetType: "model-run",
        targetId: modelRunResponse.json().id,
        reviewerId: "Compliance",
        status: "requested",
        notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
      })
    ]);
    const review = reviewsResponse.json()[0];

    const returnedReviewResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-secure-review-e2e/reviews/${review.id}`,
      payload: {
        status: "needs-more-evidence",
        comment: "Returned for more evidence before any external reliance."
      }
    });
    expect(returnedReviewResponse.statusCode).toBe(200);
    expect(returnedReviewResponse.json()).toEqual(expect.objectContaining({ status: "needs-more-evidence" }));

    const auditLogResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-secure-review-e2e/audit-log"
    });
    expect(auditLogResponse.statusCode).toBe(200);
    expect(auditLogResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "workspace.created" }),
        expect.objectContaining({ action: "evidence.created" }),
        expect.objectContaining({ action: "model.run.created" }),
        expect.objectContaining({ action: "model.run.human-review-queued" }),
        expect.objectContaining({ action: "human-review.updated" })
      ])
    );

    await server.close();
  });
});
