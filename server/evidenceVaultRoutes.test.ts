import multipart from "@fastify/multipart";
import Fastify from "fastify";
import FormData from "form-data";
import { describe, expect, it } from "vitest";
import { registerEvidenceVaultRoutes } from "./evidenceVaultRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

describe("Evidence Vault route module", () => {
  it("registers metadata-only upload, list, update, manifest, and duplicate-blocker routes", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await server.register(multipart);
    registerEvidenceVaultRoutes(server, { repository });

    const uploadForm = new FormData();
    uploadForm.append("file", Buffer.from("board approval memo"), {
      filename: "approval-memo.txt",
      contentType: "text/plain"
    });
    uploadForm.append("owner", "Compliance");
    uploadForm.append("sourceNote", "Board approval memo for counsel review.");
    uploadForm.append("linkedRiskFlagIds", "governance,custody");
    uploadForm.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-routes/evidence",
      headers: uploadForm.getHeaders(),
      payload: uploadForm
    });

    expect(uploadResponse.statusCode).toBe(201);
    const evidence = uploadResponse.json();
    expect(evidence).toEqual(
      expect.objectContaining({
        recordVersion: "lexproof-evidence-vault-record-v1",
        workspaceId: "workspace-evidence-routes",
        filename: "approval-memo.txt",
        mimeType: "text/plain",
        status: "received",
        owner: "Compliance",
        linkedRiskFlagIds: ["governance", "custody"],
        containsRawKycOrPersonalData: false
      })
    );
    expect(uploadResponse.body).not.toContain("board approval memo");

    const listResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-evidence-routes/evidence" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([expect.objectContaining({ id: evidence.id })]);

    const updateResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-evidence-routes/evidence/${evidence.id}`,
      payload: {
        status: "verified",
        owner: "Counsel"
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual(expect.objectContaining({ id: evidence.id, status: "verified", owner: "Counsel", version: 2 }));

    const manifestResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-evidence-routes/evidence-manifest" });
    expect(manifestResponse.statusCode).toBe(200);
    expect(manifestResponse.json()).toEqual(
      expect.objectContaining({
        manifestVersion: "lexproof-evidence-vault-manifest-v1",
        workspaceId: "workspace-evidence-routes",
        itemCount: 1,
        bundleHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
      })
    );
    expect(manifestResponse.json().items[0]).toEqual(
      expect.objectContaining({
        evidenceId: evidence.id,
        status: "verified",
        version: 2
      })
    );

    const duplicateForm = new FormData();
    duplicateForm.append("file", Buffer.from("board approval memo"), {
      filename: "approval-memo-copy.txt",
      contentType: "text/plain"
    });
    duplicateForm.append("owner", "Compliance");
    duplicateForm.append("containsRawKycOrPersonalData", "false");

    const duplicateResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-routes/evidence",
      headers: duplicateForm.getHeaders(),
      payload: duplicateForm
    });
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toEqual(
      expect.objectContaining({
        error: "Duplicate evidence hash already exists in this workspace.",
        code: "EVIDENCE_DUPLICATE_HASH",
        duplicateEvidenceId: evidence.id,
        duplicateStatus: "verified",
        recoveryAction: "Use the existing record, update its status, or upload a replacement with a changed metadata hash.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );

    expect(await repository.listAuditLogRecords("workspace-evidence-routes")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "evidence.created", targetId: evidence.id }),
        expect.objectContaining({ action: "evidence.updated", targetId: evidence.id }),
        expect.objectContaining({ action: "evidence.duplicate.blocked", targetId: evidence.id })
      ])
    );

    await server.close();
    await repository.close();
  });

  it("registers rejected evidence replacement routes with lineage and transition recovery", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await server.register(multipart);
    registerEvidenceVaultRoutes(server, { repository });

    const uploadForm = new FormData();
    uploadForm.append("file", Buffer.from("original approval memo"), {
      filename: "approval-memo-v1.txt",
      contentType: "text/plain"
    });
    uploadForm.append("owner", "Compliance");
    uploadForm.append("sourceNote", "Original approval memo.");
    uploadForm.append("linkedRiskFlagIds", "governance");
    uploadForm.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-replacement-routes/evidence",
      headers: uploadForm.getHeaders(),
      payload: uploadForm
    });
    expect(uploadResponse.statusCode).toBe(201);
    const original = uploadResponse.json();

    const rejectedResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-replacement-routes/evidence/${original.id}`,
      payload: {
        status: "rejected",
        sourceNote: "Reviewer rejected this memo because approval scope was incomplete."
      }
    });
    expect(rejectedResponse.statusCode).toBe(200);

    const invalidTransitionResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-replacement-routes/evidence/${original.id}`,
      payload: { status: "verified" }
    });
    expect(invalidTransitionResponse.statusCode).toBe(409);
    expect(invalidTransitionResponse.json()).toEqual({
      error: "Rejected Evidence Vault records cannot be directly moved to verified.",
      code: "EVIDENCE_STATUS_TRANSITION_BLOCKED",
      recoveryAction: "Upload a replacement from the rejected evidence recovery flow so parent/child lineage is preserved.",
      notLegalAdviceBoundary: "Not legal advice. Evidence status transitions are audit preparation workflow metadata only."
    });

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
      url: `/api/workspaces/workspace-replacement-routes/evidence/${original.id}/replacement`,
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
          status: "received",
          replacementReason: "Reviewer rejected the first memo because approval scope was incomplete."
        }),
        notLegalAdviceBoundary: "Not legal advice. Evidence replacement records are audit preparation metadata only."
      })
    );

    const manifestResponse = await server.inject({ method: "GET", url: "/api/workspaces/workspace-replacement-routes/evidence-manifest" });
    expect(manifestResponse.json().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ evidenceId: original.id, status: "superseded", supersededByEvidenceId: replacementResponse.json().replacement.id }),
        expect.objectContaining({ parentEvidenceId: original.id, status: "received" })
      ])
    );

    expect(await repository.listAuditLogRecords("workspace-replacement-routes")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "evidence.superseded", targetId: original.id }),
        expect.objectContaining({ action: "evidence.replacement.created", targetId: replacementResponse.json().replacement.id })
      ])
    );

    await server.close();
    await repository.close();
  });

  it("returns typed audit-prep errors for missing update, invalid status, and invalid replacement flows", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await server.register(multipart);
    registerEvidenceVaultRoutes(server, { repository });

    const missingUpdateResponse = await server.inject({
      method: "PATCH",
      url: "/api/workspaces/workspace-evidence-errors/evidence/missing-evidence",
      payload: {
        status: "verified"
      }
    });

    expect(missingUpdateResponse.statusCode).toBe(404);
    expect(missingUpdateResponse.json()).toEqual({
      error: "Evidence vault record not found.",
      code: "EVIDENCE_NOT_FOUND",
      recoveryAction: "Upload the evidence record before updating it or verify the evidence ID.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const uploadForm = new FormData();
    uploadForm.append("file", Buffer.from("evidence for typed errors"), {
      filename: "typed-errors.txt",
      contentType: "text/plain"
    });
    uploadForm.append("owner", "Compliance");
    uploadForm.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-errors/evidence",
      headers: uploadForm.getHeaders(),
      payload: uploadForm
    });
    expect(uploadResponse.statusCode).toBe(201);
    const evidence = uploadResponse.json();

    const invalidStatusResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-evidence-errors/evidence/${evidence.id}`,
      payload: {
        status: "approved"
      }
    });

    expect(invalidStatusResponse.statusCode).toBe(400);
    expect(invalidStatusResponse.json()).toEqual({
      error: "Evidence status must be draft, requested, received, submitted, under-review, verified, rejected, or superseded.",
      code: "EVIDENCE_UPDATE_FAILED",
      recoveryAction: "Use a supported Evidence Vault status and keep review decisions as audit-prep workflow metadata.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });
    expect(await repository.findEvidenceVaultRecord("workspace-evidence-errors", evidence.id)).toEqual(
      expect.objectContaining({ id: evidence.id, status: "received" })
    );

    const notRejectedReplacementForm = new FormData();
    notRejectedReplacementForm.append("file", Buffer.from("replacement before rejection"), {
      filename: "replacement-before-rejection.txt",
      contentType: "text/plain"
    });
    notRejectedReplacementForm.append("replacementReason", "Trying to replace before review rejection.");

    const notRejectedReplacementResponse = await server.inject({
      method: "POST",
      url: `/api/workspaces/workspace-evidence-errors/evidence/${evidence.id}/replacement`,
      headers: notRejectedReplacementForm.getHeaders(),
      payload: notRejectedReplacementForm
    });

    expect(notRejectedReplacementResponse.statusCode).toBe(400);
    expect(notRejectedReplacementResponse.json()).toEqual({
      error: "Only rejected evidence vault records can be replaced from this recovery flow.",
      code: "EVIDENCE_REPLACEMENT_NOT_ALLOWED",
      recoveryAction: "Mark the record rejected after review, or update the existing record status instead.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    const rejectedResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-evidence-errors/evidence/${evidence.id}`,
      payload: {
        status: "rejected",
        sourceNote: "Reviewer rejected this evidence."
      }
    });
    expect(rejectedResponse.statusCode).toBe(200);

    const missingReasonForm = new FormData();
    missingReasonForm.append("file", Buffer.from("replacement without reason"), {
      filename: "replacement-without-reason.txt",
      contentType: "text/plain"
    });

    const missingReasonResponse = await server.inject({
      method: "POST",
      url: `/api/workspaces/workspace-evidence-errors/evidence/${evidence.id}/replacement`,
      headers: missingReasonForm.getHeaders(),
      payload: missingReasonForm
    });

    expect(missingReasonResponse.statusCode).toBe(400);
    expect(missingReasonResponse.json()).toEqual({
      error: "Replacement reason is required.",
      code: "EVIDENCE_REPLACEMENT_REASON_REQUIRED",
      recoveryAction: "Add a replacement reason so rejected evidence lineage remains reviewable.",
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await server.close();
    await repository.close();
  });
});
