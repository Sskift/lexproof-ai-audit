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
        status: "submitted",
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
});
