import multipart from "@fastify/multipart";
import Fastify from "fastify";
import FormData from "form-data";
import { describe, expect, it } from "vitest";
import { registerEvidenceVaultRoutes } from "./evidenceVaultRoutes";
import { createMemoryReviewWorkspaceRepository } from "./reviewWorkspaceRepository";

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const walletAddress = "0x1111111111111111111111111111111111111111";

describe("Evidence Vault route module", () => {
  it("registers metadata-only upload, list, update, manifest, lineage digest, lineage recovery, and duplicate-blocker routes", async () => {
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
    uploadForm.append("linkedControlIds", "control-eu-mica-title-ii-white-paper,control-us-sec-cftc-crypto-asset-interpretation");
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
        linkedControlIds: ["control-eu-mica-title-ii-white-paper", "control-us-sec-cftc-crypto-asset-interpretation"],
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
    const manifest = manifestResponse.json();
    expect(manifest).toEqual(
      expect.objectContaining({
        manifestVersion: "lexproof-evidence-vault-manifest-v1",
        workspaceId: "workspace-evidence-routes",
        itemCount: 1,
        bundleHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
      })
    );
    expect(manifest.items[0]).toEqual(
      expect.objectContaining({
        evidenceId: evidence.id,
        status: "verified",
        version: 2,
        linkedControlIds: ["control-eu-mica-title-ii-white-paper", "control-us-sec-cftc-crypto-asset-interpretation"]
      })
    );

    const lineageResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-evidence-routes/evidence-lineage-digest"
    });
    expect(lineageResponse.statusCode).toBe(200);
    expect(lineageResponse.json()).toEqual(
      expect.objectContaining({
        digestVersion: "lexproof-evidence-vault-lineage-digest-v1",
        workspaceId: "workspace-evidence-routes",
        readinessStatus: "ready",
        manifestHash: manifest.bundleHash,
        itemCount: 1,
        statusCounts: expect.objectContaining({ verified: 1 }),
        lineageCounts: expect.objectContaining({
          activeRecords: 1,
          replacedRecords: 0,
          openRejectedRecords: 0,
          lineageLinkCount: 0,
          linkedControlCount: 2,
          linkedRiskFlagCount: 2
        }),
        lineageLinks: [],
        activeEvidenceIds: [evidence.id],
        openRejectedEvidenceIds: [],
        linkedControlIds: ["control-eu-mica-title-ii-white-paper", "control-us-sec-cftc-crypto-asset-interpretation"],
        linkedRiskFlagIds: ["custody", "governance"],
        digestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only."
      })
    );
    expect(lineageResponse.body.toLowerCase()).not.toContain("board approval memo");

    const lineageRecoveryResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-evidence-routes/evidence-lineage-recovery"
    });
    expect(lineageRecoveryResponse.statusCode).toBe(200);
    expect(lineageRecoveryResponse.json()).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-evidence-vault-lineage-recovery-packet-v1",
        workspaceId: "workspace-evidence-routes",
        status: "ready",
        lineageDigestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        manifestHash: manifest.bundleHash,
        summary: expect.objectContaining({
          totalRecoveryCount: 0,
          openRejectedCount: 0,
          missingManifestCount: 0,
          activeRecordCount: 1,
          lineageLinkCount: 0,
          nextAction: "Keep the Evidence Vault lineage recovery packet with the final manifest and Counsel Pack handoff.",
          notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only."
        }),
        items: [],
        nextActions: ["Keep the Evidence Vault lineage recovery packet with the final manifest and Counsel Pack handoff."],
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only."
      })
    );
    expect(lineageRecoveryResponse.body.toLowerCase()).not.toContain("board approval memo");

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

  it("serves lineage recovery packet actions for open rejected vault records without raw evidence", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await server.register(multipart);
    registerEvidenceVaultRoutes(server, { repository });

    const uploadForm = new FormData();
    uploadForm.append("file", Buffer.from("raw rejected custody memo body must not be returned"), {
      filename: "rejected-custody-memo.txt",
      contentType: "text/plain"
    });
    uploadForm.append("owner", "Compliance");
    uploadForm.append("sourceNote", "Metadata-only rejected custody memo for replacement testing.");
    uploadForm.append("linkedRiskFlagIds", "custody");
    uploadForm.append("linkedControlIds", "control-sg-mas-dpt-customer-asset-safeguards");
    uploadForm.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-lineage-recovery/evidence",
      headers: uploadForm.getHeaders(),
      payload: uploadForm
    });
    expect(uploadResponse.statusCode).toBe(201);
    const evidence = uploadResponse.json();

    const rejectedResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-evidence-lineage-recovery/evidence/${evidence.id}`,
      payload: {
        status: "rejected",
        sourceNote: "Reviewer rejected this metadata summary; replacement evidence is required."
      }
    });
    expect(rejectedResponse.statusCode).toBe(200);

    const recoveryResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-evidence-lineage-recovery/evidence-lineage-recovery"
    });

    expect(recoveryResponse.statusCode).toBe(200);
    expect(recoveryResponse.json()).toEqual(
      expect.objectContaining({
        packetVersion: "lexproof-evidence-vault-lineage-recovery-packet-v1",
        workspaceId: "workspace-evidence-lineage-recovery",
        status: "needs-replacement",
        summary: expect.objectContaining({
          totalRecoveryCount: 1,
          openRejectedCount: 1,
          missingManifestCount: 0,
          nextAction: "Create metadata-only replacement records for rejected vault evidence before final counsel handoff."
        }),
        nextActions: ["Create metadata-only replacement records for rejected vault evidence before final counsel handoff."],
        packetHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery packets are audit preparation metadata only."
      })
    );
    expect(recoveryResponse.json().items).toEqual([
      expect.objectContaining({
        evidenceId: evidence.id,
        filename: "rejected-custody-memo.txt",
        evidenceStatus: "rejected",
        linkedRiskFlagIds: ["custody"],
        linkedControlIds: ["control-sg-mas-dpt-customer-asset-safeguards"],
        recoveryStatus: "needs-replacement",
        priority: "P0",
        recoveryAction: "Create metadata-only replacement evidence for this rejected vault record before final counsel handoff.",
        notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage recovery items are audit preparation metadata only."
      })
    ]);
    expect(recoveryResponse.body).not.toContain("raw rejected custody memo body");
    expect(recoveryResponse.body).not.toContain("Reviewer rejected this metadata summary");
    expect(recoveryResponse.body).not.toMatch(/raw KYC|private key|legal opinion|final legal decision/i);

    await server.close();
    await repository.close();
  });

  it("blocks unsafe evidence metadata before storage without echoing secrets", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await server.register(multipart);
    registerEvidenceVaultRoutes(server, { repository });

    const unsafeForm = new FormData();
    unsafeForm.append("file", Buffer.from("board approval memo"), {
      filename: "approval-memo.txt",
      contentType: "text/plain"
    });
    unsafeForm.append("owner", "Compliance");
    unsafeForm.append("sourceNote", `Do not store API key ${apiKey} or raw KYC packet in metadata.`);
    unsafeForm.append("containsRawKycOrPersonalData", "false");

    const response = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-boundary/evidence",
      headers: unsafeForm.getHeaders(),
      payload: unsafeForm
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        code: "EVIDENCE_UPLOAD_FAILED",
        error: expect.stringContaining("credential-material"),
        recoveryAction: "Retry with a multipart evidence file and metadata-only fields.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );
    expect(response.body).not.toContain(apiKey);
    expect(response.body.toLowerCase()).not.toContain("api_key");
    expect(await repository.listEvidenceVaultRecords("workspace-evidence-boundary")).toEqual([]);

    await server.close();
    await repository.close();
  });

  it("rejects non-multipart evidence upload and replacement requests without evaluating raw bodies", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await server.register(multipart);
    registerEvidenceVaultRoutes(server, { repository });

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-non-multipart/evidence",
      payload: {
        rawEvidenceBody: `raw KYC passport packet with apiKey=${apiKey}`
      }
    });

    expect(uploadResponse.statusCode).toBe(400);
    expect(uploadResponse.json()).toEqual(
      expect.objectContaining({
        code: "EVIDENCE_UPLOAD_FAILED",
        error: "Evidence upload must use multipart/form-data.",
        recoveryAction: "Retry with a multipart evidence file and metadata-only fields.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );
    expect(uploadResponse.body).not.toContain(apiKey);
    expect(uploadResponse.body).not.toContain("rawEvidenceBody");
    expect(uploadResponse.body.toLowerCase()).not.toContain("passport packet");
    expect(await repository.listEvidenceVaultRecords("workspace-evidence-non-multipart")).toEqual([]);
    expect(await repository.listAuditLogRecords("workspace-evidence-non-multipart")).toEqual([]);

    const uploadForm = new FormData();
    uploadForm.append("file", Buffer.from("replacement boundary memo"), {
      filename: "replacement-boundary.txt",
      contentType: "text/plain"
    });
    uploadForm.append("owner", "Compliance");
    uploadForm.append("containsRawKycOrPersonalData", "false");

    const initialUploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-non-multipart-replacement/evidence",
      headers: uploadForm.getHeaders(),
      payload: uploadForm
    });
    expect(initialUploadResponse.statusCode).toBe(201);
    const evidence = initialUploadResponse.json();

    const rejectedResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-evidence-non-multipart-replacement/evidence/${evidence.id}`,
      payload: {
        status: "rejected",
        sourceNote: "Reviewer rejected this metadata record."
      }
    });
    expect(rejectedResponse.statusCode).toBe(200);
    const auditLogBeforeReplacement = await repository.listAuditLogRecords("workspace-evidence-non-multipart-replacement");

    const replacementResponse = await server.inject({
      method: "POST",
      url: `/api/workspaces/workspace-evidence-non-multipart-replacement/evidence/${evidence.id}/replacement`,
      payload: {
        replacementReason: `Use raw KYC packet and private key ${privateKey} with apiKey=${apiKey}`
      }
    });

    expect(replacementResponse.statusCode).toBe(400);
    expect(replacementResponse.json()).toEqual(
      expect.objectContaining({
        code: "EVIDENCE_REPLACEMENT_FAILED",
        error: "Evidence replacement upload must use multipart/form-data.",
        recoveryAction: "Retry with a replacement file, metadata-only fields, and a lineage reason.",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      })
    );
    expect(replacementResponse.body).not.toContain(apiKey);
    expect(replacementResponse.body).not.toContain(privateKey);
    expect(replacementResponse.body).not.toContain("replacementReason");
    expect(replacementResponse.body.toLowerCase()).not.toContain("raw kyc");
    expect(await repository.findEvidenceVaultRecord("workspace-evidence-non-multipart-replacement", evidence.id)).toEqual(
      expect.objectContaining({
        id: evidence.id,
        status: "rejected",
        version: 2
      })
    );
    expect(await repository.listAuditLogRecords("workspace-evidence-non-multipart-replacement")).toEqual(auditLogBeforeReplacement);

    await server.close();
    await repository.close();
  });

  it("rejects malformed evidence updates before mutating records or audit logs", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await server.register(multipart);
    registerEvidenceVaultRoutes(server, { repository });

    const uploadForm = new FormData();
    uploadForm.append("file", Buffer.from("patch boundary memo"), {
      filename: "patch-boundary.txt",
      contentType: "text/plain"
    });
    uploadForm.append("owner", "Compliance");
    uploadForm.append("sourceNote", "Patch boundary memo.");
    uploadForm.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-update-boundary/evidence",
      headers: uploadForm.getHeaders(),
      payload: uploadForm
    });
    expect(uploadResponse.statusCode).toBe(201);
    const evidence = uploadResponse.json();

    const cases: Array<{ payload?: unknown; expectedError: string | RegExp }> = [
      {
        expectedError: "Evidence update payload must be a JSON object."
      },
      {
        payload: {
          owner: { apiKey }
        },
        expectedError: "Evidence owner must be a string."
      },
      {
        payload: {
          linkedRiskFlagIds: ["governance", { apiKey }]
        },
        expectedError: "Evidence linked risk flag IDs must be strings or a comma-separated string."
      },
      {
        payload: {
          sourceNote: `Do not persist API key ${apiKey}, private key ${privateKey}, or raw KYC packet.`
        },
        expectedError: /credential-material.*private-key-material.*raw-kyc/
      }
    ];

    for (const item of cases) {
      const response = await server.inject({
        method: "PATCH",
        url: `/api/workspaces/workspace-evidence-update-boundary/evidence/${evidence.id}`,
        ...(item.payload === undefined ? {} : { payload: item.payload })
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          code: "EVIDENCE_UPDATE_FAILED",
          recoveryAction: "Use a supported Evidence Vault status and keep review decisions as audit-prep workflow metadata.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        })
      );
      if (typeof item.expectedError === "string") {
        expect(response.json().error).toBe(item.expectedError);
      } else {
        expect(response.json().error).toMatch(item.expectedError);
      }
      expect(response.body).not.toContain(apiKey);
      expect(response.body).not.toContain(privateKey);
      expect(response.body).not.toContain("raw KYC packet");
      expect(response.body).not.toContain("apiKey");
      expect(await repository.findEvidenceVaultRecord("workspace-evidence-update-boundary", evidence.id)).toEqual(
        expect.objectContaining({
          id: evidence.id,
          status: "received",
          owner: "Compliance",
          sourceNote: "Patch boundary memo.",
          version: 1
        })
      );
      expect(await repository.listAuditLogRecords("workspace-evidence-update-boundary")).toEqual([
        expect.objectContaining({
          action: "evidence.created",
          targetId: evidence.id
        })
      ]);
    }

    await server.close();
    await repository.close();
  });

  it("redacts warning-class evidence update metadata while preserving review findings", async () => {
    const server = Fastify({ logger: false });
    const repository = createMemoryReviewWorkspaceRepository();
    await server.register(multipart);
    registerEvidenceVaultRoutes(server, { repository });

    const uploadForm = new FormData();
    uploadForm.append("file", Buffer.from("warning metadata memo"), {
      filename: "warning-metadata.txt",
      contentType: "text/plain"
    });
    uploadForm.append("owner", "Compliance");
    uploadForm.append("sourceNote", "Warning metadata memo.");
    uploadForm.append("containsRawKycOrPersonalData", "false");

    const uploadResponse = await server.inject({
      method: "POST",
      url: "/api/workspaces/workspace-evidence-update-warning/evidence",
      headers: uploadForm.getHeaders(),
      payload: uploadForm
    });
    expect(uploadResponse.statusCode).toBe(201);
    const evidence = uploadResponse.json();

    const updateResponse = await server.inject({
      method: "PATCH",
      url: `/api/workspaces/workspace-evidence-update-warning/evidence/${evidence.id}`,
      payload: {
        sourceNote: `Treasury signer wallet ${walletAddress} and contact jane.founder@example.com require counsel review.`,
        linkedRiskFlagIds: "custody,governance"
      }
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual(
      expect.objectContaining({
        id: evidence.id,
        status: "received",
        sourceNote: expect.stringContaining("[redacted-wallet-address]"),
        linkedRiskFlagIds: ["custody", "governance"],
        version: 2
      })
    );
    expect(updateResponse.json().metadataBoundaryWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dataClass: "wallet-address", severity: "warn" }),
        expect.objectContaining({ dataClass: "personal-data", severity: "warn" })
      ])
    );
    expect(updateResponse.body).not.toContain(walletAddress);
    expect(updateResponse.body).not.toContain("jane.founder@example.com");

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
    replacementForm.append("linkedControlIds", "control-eu-mica-title-ii-white-paper");
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
          linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
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

    const lineageResponse = await server.inject({
      method: "GET",
      url: "/api/workspaces/workspace-replacement-routes/evidence-lineage-digest"
    });
    expect(lineageResponse.statusCode).toBe(200);
    expect(lineageResponse.json()).toEqual(
      expect.objectContaining({
        digestVersion: "lexproof-evidence-vault-lineage-digest-v1",
        workspaceId: "workspace-replacement-routes",
        readinessStatus: "ready",
        itemCount: 2,
        lineageCounts: expect.objectContaining({
          activeRecords: 1,
          replacedRecords: 1,
          openRejectedRecords: 0,
          lineageLinkCount: 1,
          linkedControlCount: 1,
          linkedRiskFlagCount: 1
        }),
        activeEvidenceIds: [replacementResponse.json().replacement.id],
        openRejectedEvidenceIds: [],
        linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
        linkedRiskFlagIds: ["governance"],
        digestHash: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    );
    expect(lineageResponse.json().lineageLinks).toEqual([
      expect.objectContaining({
        parentEvidenceId: original.id,
        replacementEvidenceId: replacementResponse.json().replacement.id,
        parentStatus: "superseded",
        replacementStatus: "received",
        replacementVersion: 3,
        replacementReasonHash: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    ]);
    expect(lineageResponse.body).not.toContain("Reviewer rejected the first memo because approval scope was incomplete.");
    expect(lineageResponse.body).not.toContain("Replacement memo with corrected approval scope.");

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
