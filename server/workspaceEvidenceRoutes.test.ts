import FormData from "form-data";
import { describe, expect, it } from "vitest";
import { buildServer } from "./app";

describe("Phase 2 workspace and evidence routes", () => {
  it("creates, reads, and updates workspace records", async () => {
    const server = buildServer();

    const createResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: {
        id: "workspace-1",
        name: "YieldPassport Review",
        organizationName: "YieldPassport Labs",
        ownerId: "founder-1"
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-workspace-record-v1",
        id: "workspace-1",
        name: "YieldPassport Review",
        organizationName: "YieldPassport Labs",
        ownerId: "founder-1",
        status: "draft",
        notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
      })
    );

    const patchResponse = await server.inject({
      method: "PATCH",
      url: "/api/workspaces/workspace-1",
      payload: {
        status: "active",
        name: "YieldPassport Counsel Review"
      }
    });

    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.json()).toEqual(expect.objectContaining({ id: "workspace-1", status: "active", name: "YieldPassport Counsel Review" }));

    const getResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1" });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toEqual(expect.objectContaining({ id: "workspace-1", status: "active" }));

    await server.close();
  });

  it("uploads evidence through multipart, stores metadata only, updates status, and generates a manifest", async () => {
    const server = buildServer();
    const form = new FormData();
    form.append("file", Buffer.from("board approval memo"), {
      filename: "approval-memo.txt",
      contentType: "text/plain"
    });
    form.append("owner", "Compliance");
    form.append("sourceNote", "Board approval memo for counsel review.");
    form.append("linkedRiskFlagIds", "governance,custody");
    form.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-1/evidence",
      headers: form.getHeaders(),
      payload: form
    });

    expect(uploadResponse.statusCode).toBe(201);
    const evidence = uploadResponse.json();
    expect(evidence).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-evidence-vault-record-v1",
        workspaceId: "workspace-1",
        filename: "approval-memo.txt",
        mimeType: "text/plain",
        byteSize: 19,
        storageMode: "server-vault",
        status: "received",
        owner: "Compliance",
        sourceNote: "Board approval memo for counsel review.",
        linkedRiskFlagIds: ["governance", "custody"],
        containsRawKycOrPersonalData: false
      })
    );
    expect(uploadResponse.body).not.toContain("board approval memo");

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/evidence" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toHaveLength(1);

    const patchResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-1/evidence/${evidence.id}`,
      payload: {
        status: "verified",
        owner: "Counsel"
      }
    });
    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.json()).toEqual(expect.objectContaining({ id: evidence.id, status: "verified", owner: "Counsel" }));

    const manifestResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/evidence-manifest" });
    expect(manifestResponse.statusCode).toBe(200);
    expect(manifestResponse.json()).toEqual(
      expect.objectContaining({
        manifestVersion: "lexproof-evidence-vault-manifest-v1",
        workspaceId: "workspace-1",
        itemCount: 1,
        bundleHash: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    );
    expect(manifestResponse.json().items[0]).toEqual(
      expect.objectContaining({
        evidenceId: evidence.id,
        fileHash: evidence.fileHash,
        status: "verified"
      })
    );

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-1/audit-log" });
    expect(auditResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "evidence.created", targetType: "evidence", targetId: evidence.id }),
        expect.objectContaining({ action: "evidence.updated", targetType: "evidence", targetId: evidence.id })
      ])
    );

    await server.close();
  });

  it("detects duplicate evidence uploads and supports rejected-evidence replacement lineage", async () => {
    const server = buildServer();
    const firstForm = new FormData();
    firstForm.append("file", Buffer.from("original approval memo"), {
      filename: "approval-memo-v1.txt",
      contentType: "text/plain"
    });
    firstForm.append("owner", "Compliance");
    firstForm.append("sourceNote", "Original memo for counsel review.");
    firstForm.append("linkedRiskFlagIds", "governance");
    firstForm.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-dup/evidence",
      headers: firstForm.getHeaders(),
      payload: firstForm
    });
    expect(uploadResponse.statusCode).toBe(201);
    const original = uploadResponse.json();
    const originalManifest = await server.inject({ method: "GET", url: "/api/workspaces/workspace-dup/evidence-manifest" });

    const duplicateForm = new FormData();
    duplicateForm.append("file", Buffer.from("original approval memo"), {
      filename: "approval-memo-copy.txt",
      contentType: "text/plain"
    });
    duplicateForm.append("owner", "Compliance");
    duplicateForm.append("sourceNote", "Duplicate memo.");
    duplicateForm.append("containsRawKycOrPersonalData", "false");

    const duplicateResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-dup/evidence",
      headers: duplicateForm.getHeaders(),
      payload: duplicateForm
    });
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toEqual(
      expect.objectContaining({
        error: "Duplicate evidence hash already exists in this workspace.",
        duplicateEvidenceId: original.id,
        recoveryAction: expect.stringContaining("Use the existing record")
      })
    );

    const rejectedResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-dup/evidence/${original.id}`,
      payload: {
        status: "rejected",
        sourceNote: "Reviewer rejected this memo because approval scope was incomplete."
      }
    });
    expect(rejectedResponse.statusCode).toBe(200);

    const replacementForm = new FormData();
    replacementForm.append("file", Buffer.from("replacement approval memo with corrected scope"), {
      filename: "approval-memo-v2.txt",
      contentType: "text/plain"
    });
    replacementForm.append("owner", "Compliance");
    replacementForm.append("sourceNote", "Replacement memo with corrected approval scope.");
    replacementForm.append("linkedRiskFlagIds", "governance");
    replacementForm.append("replacementReason", "Reviewer rejected the first memo because approval scope was incomplete.");
    replacementForm.append("containsRawKycOrPersonalData", "false");

    const replacementResponse = await server.inject({
      method: "POST",
      url: `/api/workspaces/workspace-dup/evidence/${original.id}/replacement`,
      headers: replacementForm.getHeaders(),
      payload: replacementForm
    });
    expect(replacementResponse.statusCode).toBe(201);
    expect(replacementResponse.json()).toEqual(
      expect.objectContaining({
        superseded: expect.objectContaining({
          id: original.id,
          status: "superseded",
          replacementReason: "Reviewer rejected the first memo because approval scope was incomplete."
        }),
        replacement: expect.objectContaining({
          parentEvidenceId: original.id,
          replacementReason: "Reviewer rejected the first memo because approval scope was incomplete.",
          status: "received"
        }),
        notLegalAdviceBoundary: "Not legal advice. Evidence replacement records are audit preparation metadata only."
      })
    );

    const replacementManifest = await server.inject({ method: "GET", url: "/api/workspaces/workspace-dup/evidence-manifest" });
    expect(replacementManifest.json().bundleHash).not.toBe(originalManifest.json().bundleHash);
    expect(replacementManifest.json().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ evidenceId: original.id, status: "superseded", supersededByEvidenceId: replacementResponse.json().replacement.id }),
        expect.objectContaining({ parentEvidenceId: original.id, status: "received" })
      ])
    );

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-dup/audit-log" });
    expect(auditResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "evidence.duplicate.blocked", targetId: original.id }),
        expect.objectContaining({ action: "evidence.replacement.created", targetId: replacementResponse.json().replacement.id }),
        expect.objectContaining({ action: "evidence.superseded", targetId: original.id })
      ])
    );

    await server.close();
  });

  it("blocks direct reactivation of rejected evidence and preserves the recovery path", async () => {
    const server = buildServer();
    const form = new FormData();
    form.append("file", Buffer.from("review evidence that needs replacement"), {
      filename: "needs-replacement.txt",
      contentType: "text/plain"
    });
    form.append("owner", "Compliance");
    form.append("sourceNote", "Evidence pending review.");
    form.append("linkedRiskFlagIds", "governance");
    form.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-state/evidence",
      headers: form.getHeaders(),
      payload: form
    });
    expect(uploadResponse.statusCode).toBe(201);
    const evidence = uploadResponse.json();

    const rejectedResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-state/evidence/${evidence.id}`,
      payload: {
        status: "rejected",
        sourceNote: "Reviewer rejected this evidence and needs a replacement."
      }
    });
    expect(rejectedResponse.statusCode).toBe(200);

    const invalidTransitionResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-state/evidence/${evidence.id}`,
      payload: {
        status: "verified"
      }
    });
    expect(invalidTransitionResponse.statusCode).toBe(409);
    expect(invalidTransitionResponse.json()).toEqual({
      error: "Rejected Evidence Vault records cannot be directly moved to verified.",
      recoveryAction: "Upload a replacement from the rejected evidence recovery flow so parent/child lineage is preserved.",
      notLegalAdviceBoundary: "Not legal advice. Evidence status transitions are audit preparation workflow metadata only."
    });

    const recordsResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-state/evidence" });
    expect(recordsResponse.json()).toEqual([expect.objectContaining({ id: evidence.id, status: "rejected" })]);

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-state/audit-log" });
    const updateEvents = auditResponse.json().filter((record: { action: string }) => record.action === "evidence.updated");
    expect(updateEvents).toHaveLength(1);
    expect(updateEvents[0]).toEqual(expect.objectContaining({ summary: "Updated evidence status to rejected." }));

    await server.close();
  });

  it("syncs evidence-target human review decisions back to Evidence Vault status", async () => {
    const server = buildServer();
    const form = new FormData();
    form.append("file", Buffer.from("evidence memo requiring reviewer follow up"), {
      filename: "follow-up-evidence.txt",
      contentType: "text/plain"
    });
    form.append("owner", "Compliance");
    form.append("sourceNote", "Evidence awaiting human review.");
    form.append("linkedRiskFlagIds", "governance");
    form.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-review-effects/evidence",
      headers: form.getHeaders(),
      payload: form
    });
    expect(uploadResponse.statusCode).toBe(201);
    const evidence = uploadResponse.json();

    const reviewResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-review-effects/reviews",
      payload: {
        targetType: "evidence",
        targetId: evidence.id,
        reviewerId: "Counsel",
        comment: "Review evidence before export readiness."
      }
    });
    expect(reviewResponse.statusCode).toBe(201);

    const returnedResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-review-effects/reviews/${reviewResponse.json().id}`,
      payload: {
        status: "needs-more-evidence",
        comment: "Need a clearer board authorization memo."
      }
    });
    expect(returnedResponse.statusCode).toBe(200);

    const recordsResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-review-effects/evidence" });
    expect(recordsResponse.json()).toEqual([
      expect.objectContaining({
        id: evidence.id,
        status: "requested",
        version: 2,
        sourceNote: "Human Review requested more evidence; returned Evidence Vault record to requested."
      })
    ]);

    const manifestResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-review-effects/evidence-manifest" });
    expect(manifestResponse.json().items).toEqual([expect.objectContaining({ evidenceId: evidence.id, status: "requested", version: 2 })]);

    const auditResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-review-effects/audit-log" });
    expect(auditResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "human-review.updated", targetId: reviewResponse.json().id }),
        expect.objectContaining({
          action: "evidence.review-status.synced",
          targetType: "evidence",
          targetId: evidence.id,
          summary: "Human Review requested more evidence; returned Evidence Vault record to requested."
        })
      ])
    );

    await server.close();
  });
});
