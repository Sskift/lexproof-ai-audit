import { describe, expect, it, vi } from "vitest";
import {
  createEvidenceVaultSnapshot,
  EvidenceVaultClientError,
  fetchEvidenceVaultManifest,
  listEvidenceVaultRecords,
  replaceEvidenceVaultRecord,
  syncEvidenceLedgerToVault,
  type EvidenceVaultManifestResponse,
  type EvidenceVaultRecordResponse
} from "./evidenceVaultClient";
import type { EvidenceItem } from "./projectModel";

const evidenceItem: EvidenceItem = {
  id: "launch-approval",
  label: "Launch approval memo",
  kind: "Markdown",
  source: "risk evidence requirement: governance-approval; regulatory control: control-eu-mica-title-ii-white-paper",
  status: "verified",
  owner: "Compliance",
  content: "Confidential board approval text that must stay local."
};

describe("evidence vault client", () => {
  it("builds metadata-only vault snapshots without raw evidence content", async () => {
    const snapshot = await createEvidenceVaultSnapshot(evidenceItem);
    const changedSnapshot = await createEvidenceVaultSnapshot({
      ...evidenceItem,
      content: "Changed confidential board approval text that must stay local."
    });
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.snapshotVersion).toBe("lexproof-evidence-vault-snapshot-v1");
    expect(snapshot.localContentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(changedSnapshot.localContentHash).not.toBe(snapshot.localContentHash);
    expect(snapshot.linkedControlIds).toEqual(["control-eu-mica-title-ii-white-paper"]);
    expect(snapshot.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(serialized).not.toContain("Confidential board approval text");
  });

  it("syncs ledger evidence to the backend vault and fetches the vault manifest", async () => {
    const uploadedForms: FormData[] = [];
    const manifest: EvidenceVaultManifestResponse = {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: "workspace-vault",
      generatedAt: "2026-06-30T00:00:00.000Z",
      itemCount: 1,
      items: [],
      bundleHash: "a".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
    };
    const vaultRecord: EvidenceVaultRecordResponse = {
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: "evidence-vault-1",
      workspaceId: "workspace-vault",
      filename: "launch-approval-memo.metadata.json",
      mimeType: "application/json",
      byteSize: 512,
      fileHash: "b".repeat(64),
      storageMode: "server-vault",
      status: "received",
      owner: "Compliance",
      sourceNote: "Metadata-only sync",
      version: 1,
      linkedRiskFlagIds: ["governance-approval"],
      linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-30T00:00:00.000Z",
      updatedAt: "2026-06-30T00:00:00.000Z"
    };
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "POST") {
        uploadedForms.push(init.body as FormData);
        return jsonResponse(vaultRecord, 201);
      }

      if (path.endsWith("/evidence-vault-1") && init?.method === "PATCH") {
        expect(JSON.parse(String(init.body))).toEqual(
          expect.objectContaining({
            status: "verified",
            linkedRiskFlagIds: ["governance-approval"],
            linkedControlIds: ["control-eu-mica-title-ii-white-paper"]
          })
        );
        return jsonResponse({ ...vaultRecord, status: "verified", version: 2 }, 200);
      }

      if (path.endsWith("/evidence-manifest")) {
        return jsonResponse(manifest, 200);
      }

      throw new Error(`Unexpected request ${path}`);
    });

    const result = await syncEvidenceLedgerToVault({
      workspaceId: "workspace-vault",
      evidenceItems: [evidenceItem],
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith("https://api.lexproof.test/api/workspaces/workspace-vault/evidence", expect.any(Object));
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.lexproof.test/api/workspaces/workspace-vault/evidence/evidence-vault-1",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(fetcher).toHaveBeenCalledWith("https://api.lexproof.test/api/workspaces/workspace-vault/evidence-manifest", { method: "GET" });
    expect(result.records[0]).toEqual(expect.objectContaining({ status: "verified" }));
    expect(result.manifest.bundleHash).toBe("a".repeat(64));
    expect(result.notLegalAdviceBoundary).toContain("Not legal advice");

    const uploadedFile = uploadedForms[0].get("file") as Blob;
    const uploadedPayload = await readBlobText(uploadedFile);
    expect(uploadedPayload).toContain("localContentHash");
    expect(uploadedPayload).toContain("governance-approval");
    expect(uploadedPayload).toContain("control-eu-mica-title-ii-white-paper");
    expect(uploadedPayload).not.toContain("Confidential board approval text");
    expect(uploadedForms[0].get("linkedControlIds")).toBe("control-eu-mica-title-ii-white-paper");
    expect(uploadedForms[0].get("containsRawKycOrPersonalData")).toBe("false");
  });

  it("syncs local review-stage evidence statuses to backend vault status updates", async () => {
    const patchStatuses: string[] = [];
    const manifest: EvidenceVaultManifestResponse = {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: "workspace-vault",
      generatedAt: "2026-06-30T00:00:00.000Z",
      itemCount: 2,
      items: [],
      bundleHash: "e".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
    };
    const baseRecord: EvidenceVaultRecordResponse = {
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: "evidence-vault-review-1",
      workspaceId: "workspace-vault",
      filename: "review-stage.metadata.json",
      mimeType: "application/json",
      byteSize: 512,
      fileHash: "f".repeat(64),
      storageMode: "server-vault",
      status: "received",
      owner: "Compliance",
      sourceNote: "Metadata-only sync",
      version: 1,
      linkedRiskFlagIds: [],
      linkedControlIds: [],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-30T00:00:00.000Z",
      updatedAt: "2026-06-30T00:00:00.000Z"
    };
    let uploadCount = 0;
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "POST") {
        uploadCount += 1;
        return jsonResponse({ ...baseRecord, id: `evidence-vault-review-${uploadCount}` }, 201);
      }

      if (path.includes("/evidence/evidence-vault-review-") && init?.method === "PATCH") {
        const body = JSON.parse(String(init.body)) as { status: string };
        patchStatuses.push(body.status);
        return jsonResponse({ ...baseRecord, id: path.split("/").pop() ?? baseRecord.id, status: body.status, version: 2 }, 200);
      }

      if (path.endsWith("/evidence-manifest")) {
        return jsonResponse(manifest, 200);
      }

      throw new Error(`Unexpected request ${path}`);
    });

    const result = await syncEvidenceLedgerToVault({
      workspaceId: "workspace-vault",
      evidenceItems: [
        {
          ...evidenceItem,
          id: "review-stage-under-review",
          label: "Evidence under reviewer review",
          status: "under-review"
        },
        {
          ...evidenceItem,
          id: "review-stage-rejected",
          label: "Evidence rejected for replacement",
          status: "rejected"
        }
      ],
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });

    expect(patchStatuses).toEqual(["under-review", "rejected"]);
    expect(result.records.map((record) => record.status)).toEqual(["under-review", "rejected"]);
    expect(result.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps sparse Evidence Vault manifest items readable while preserving the metadata boundary", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence-manifest") && init?.method === "GET") {
        return jsonResponse(
          {
            manifestVersion: "lexproof-evidence-vault-manifest-v1",
            workspaceId: "workspace-vault",
            generatedAt: "2026-06-30T00:00:00.000Z",
            itemCount: 1,
            items: [{ evidenceId: "evidence-vault-rejected-ui", status: "rejected" }],
            bundleHash: "e".repeat(64),
            notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
          },
          200
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });

    const result = await fetchEvidenceVaultManifest({
      workspaceId: "workspace-vault",
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });

    expect(result.items[0]).toEqual({ evidenceId: "evidence-vault-rejected-ui", status: "rejected" });
    expect(result.bundleHash).toBe("e".repeat(64));
    expect(result.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("redacts classified text from otherwise valid Evidence Vault sync responses before UI use", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const manifest: EvidenceVaultManifestResponse = {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: `workspace-vault apiKey=${apiKey}`,
      generatedAt: `2026-06-30T00:00:00.000Z private key ${privateKey}`,
      itemCount: 1,
      items: [
        {
          sequence: 1,
          evidenceId: "evidence-vault-manifest raw_KYC passport A1234567",
          filename: "launch-approval reviewer@example.com.metadata.json",
          mimeType: "application/json",
          byteSize: 512,
          fileHash: "a".repeat(64),
          storageMode: "server-vault",
          status: "verified",
          owner: "reviewer@example.com",
          version: 1,
          linkedRiskFlagIds: [`governance-approval apiKey=${apiKey}`],
          linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
          containsRawKycOrPersonalData: false,
          replacementReason: "Remove legal conclusion before handoff."
        }
      ],
      bundleHash: "b".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
    };
    const vaultRecord: EvidenceVaultRecordResponse = {
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: `evidence-vault-1 ${privateKey}`,
      workspaceId: `workspace-vault apiKey=${apiKey}`,
      filename: "launch raw_KYC passport A1234567.metadata.json",
      mimeType: "application/json",
      byteSize: 512,
      fileHash: "c".repeat(64),
      storageMode: "server-vault",
      status: "verified",
      owner: "Compliance",
      sourceNote: "Remove legal conclusion, reviewer@example.com, and raw KYC passport A1234567 before handoff.",
      version: 1,
      linkedRiskFlagIds: ["governance-approval"],
      linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-30T00:00:00.000Z",
      updatedAt: `2026-06-30T00:00:00.000Z private key ${privateKey}`
    };
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "POST") {
        return jsonResponse(vaultRecord, 201);
      }

      if (path.endsWith("/evidence-manifest")) {
        return jsonResponse(manifest, 200);
      }

      throw new Error(`Unexpected request ${path}`);
    });

    const result = await syncEvidenceLedgerToVault({
      workspaceId: "workspace-vault",
      evidenceItems: [evidenceItem],
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });
    const serialized = JSON.stringify(result);

    expect(result.records[0].id).toContain("[redacted-private-key]");
    expect(result.records[0].workspaceId).toBe("workspace-vault [redacted-secret]");
    expect(result.records[0].filename).toContain("[redacted-raw-kyc]");
    expect(result.records[0].filename).toContain("[redacted-passport-id]");
    expect(result.records[0].fileHash).toBe("c".repeat(64));
    expect(result.records[0].sourceNote).toContain("[redacted-legal-conclusion]");
    expect(result.records[0].sourceNote).toContain("[redacted-email]");
    expect(result.records[0].updatedAt).toContain("[redacted-private-key]");
    expect(result.manifest.workspaceId).toBe("workspace-vault [redacted-secret]");
    expect(result.manifest.generatedAt).toContain("[redacted-private-key]");
    expect(result.manifest.items[0].evidenceId).toContain("[redacted-raw-kyc]");
    expect(result.manifest.items[0].filename).toContain("[redacted-email]");
    expect(result.manifest.items[0].fileHash).toBe("a".repeat(64));
    expect(result.manifest.bundleHash).toBe("b".repeat(64));
    expect(result.manifest.items[0].linkedRiskFlagIds[0]).toBe("governance-approval [redacted-secret]");
    expect(result.manifest.items[0].replacementReason).toContain("[redacted-legal-conclusion]");
    expect(serialized).toContain("[redacted-secret]");
    expect(serialized).toContain("[redacted-private-key]");
    expect(serialized).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("A1234567");
    expect(serialized).not.toContain("reviewer@example.com");
    expect(serialized).not.toMatch(/\blegal conclusion\b/i);
  });

  it("preserves structured duplicate-hash recovery metadata from Evidence Vault errors", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "POST") {
        return jsonResponse(
          {
            error: "Duplicate evidence hash already exists in this workspace.",
            code: "EVIDENCE_DUPLICATE_HASH",
            recoveryAction: "Use the existing record, update its status, or upload a replacement with a changed metadata hash.",
            duplicateEvidenceId: "evidence-vault-existing",
            duplicateStatus: "verified",
            notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
          },
          409
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });

    try {
      await syncEvidenceLedgerToVault({
        workspaceId: "workspace-vault",
        evidenceItems: [evidenceItem],
        apiBaseUrl: "https://api.lexproof.test",
        fetcher
      });
      throw new Error("Expected duplicate Evidence Vault error.");
    } catch (error) {
      expect(error).toBeInstanceOf(EvidenceVaultClientError);
      expect(error).toMatchObject({
        message: "Duplicate evidence hash already exists in this workspace.",
        code: "EVIDENCE_DUPLICATE_HASH",
        recoveryAction: "Use the existing record, update its status, or upload a replacement with a changed metadata hash.",
        duplicateEvidenceId: "evidence-vault-existing",
        duplicateStatus: "verified",
        notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
      });
    }
  });

  it("redacts unsafe Evidence Vault API error payload text before surfacing recovery details", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "POST") {
        return jsonResponse(
          {
            error:
              "Duplicate upload included raw KYC passport data and api key=sk-live-abcdef1234567890abcdef1234567890.",
            errors: ["Private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef must be removed."],
            code: "EVIDENCE_UPLOAD_BOUNDARY_FAILED",
            recoveryAction: "Remove seed phrase material before final legal decision.",
            notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
          },
          400
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });

    await expect(
      syncEvidenceLedgerToVault({
        workspaceId: "workspace-vault",
        evidenceItems: [evidenceItem],
        apiBaseUrl: "https://api.lexproof.test",
        fetcher
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining("[redacted-raw-kyc]"),
      code: "EVIDENCE_UPLOAD_BOUNDARY_FAILED",
      recoveryAction: expect.stringContaining("[redacted-private-key]"),
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    });

    await expect(
      syncEvidenceLedgerToVault({
        workspaceId: "workspace-vault",
        evidenceItems: [evidenceItem],
        apiBaseUrl: "https://api.lexproof.test",
        fetcher
      })
    ).rejects.not.toThrow(/passport data|sk-live-abcdef|0x1234567890abcdef|seed phrase|final legal decision/i);
  });

  it("redacts classified text from otherwise valid Evidence Vault record lists before UI use", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "GET") {
        return jsonResponse(
          [
            {
              recordVersion: "lexproof-evidence-vault-record-v1",
              id: `evidence-vault-list ${privateKey}`,
              workspaceId: `workspace-vault apiKey=${apiKey}`,
              filename: "vault-list raw_KYC passport A1234567.metadata.json",
              mimeType: "application/json",
              byteSize: 512,
              fileHash: "d".repeat(64),
              storageMode: "server-vault",
              status: "received",
              owner: "reviewer@example.com",
              sourceNote: `Remove legal conclusion and apiKey=${apiKey} before handoff.`,
              version: 1,
              linkedRiskFlagIds: ["governance-approval"],
              linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
              containsRawKycOrPersonalData: false,
              createdAt: "2026-06-30T00:00:00.000Z",
              updatedAt: "2026-06-30T00:00:00.000Z"
            }
          ],
          200
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });

    const records = await listEvidenceVaultRecords({
      workspaceId: "workspace-vault",
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });
    const serialized = JSON.stringify(records);

    expect(records[0].id).toContain("[redacted-private-key]");
    expect(records[0].workspaceId).toBe("workspace-vault [redacted-secret]");
    expect(records[0].filename).toContain("[redacted-raw-kyc]");
    expect(records[0].filename).toContain("[redacted-passport-id]");
    expect(records[0].owner).toBe("[redacted-email]");
    expect(records[0].sourceNote).toContain("[redacted-legal-conclusion]");
    expect(records[0].sourceNote).toContain("[redacted-secret]");
    expect(records[0].fileHash).toBe("d".repeat(64));
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("A1234567");
    expect(serialized).not.toContain("reviewer@example.com");
    expect(serialized).not.toMatch(/\blegal conclusion\b/i);
  });

  it("uploads a metadata-only replacement for a rejected vault record", async () => {
    const uploadedForms: FormData[] = [];
    const superseded: EvidenceVaultRecordResponse = {
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: "evidence-vault-rejected",
      workspaceId: "workspace-vault",
      filename: "launch-approval-memo.metadata.json",
      mimeType: "application/json",
      byteSize: 512,
      fileHash: "c".repeat(64),
      storageMode: "server-vault",
      status: "superseded",
      owner: "Compliance",
      sourceNote: "Rejected memo.",
      version: 3,
      linkedRiskFlagIds: ["governance-approval"],
      linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
      containsRawKycOrPersonalData: false,
      supersededByEvidenceId: "evidence-vault-replacement",
      replacementReason: "Reviewer requested corrected approval scope.",
      createdAt: "2026-06-30T00:00:00.000Z",
      updatedAt: "2026-06-30T01:00:00.000Z"
    };
    const replacement: EvidenceVaultRecordResponse = {
      ...superseded,
      id: "evidence-vault-replacement",
      filename: "launch-approval-memo-v2.metadata.json",
      fileHash: "d".repeat(64),
      status: "received",
      parentEvidenceId: "evidence-vault-rejected",
      supersededByEvidenceId: undefined,
      version: 3
    };
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence/evidence-vault-rejected/replacement") && init?.method === "POST") {
        uploadedForms.push(init.body as FormData);
        return jsonResponse(
          {
            superseded,
            replacement,
            notLegalAdviceBoundary: "Not legal advice. Evidence replacement records are audit preparation metadata only."
          },
          201
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });

    const result = await replaceEvidenceVaultRecord({
      workspaceId: "workspace-vault",
      evidenceId: "evidence-vault-rejected",
      replacementItem: {
        ...evidenceItem,
        content: "Corrected confidential board approval text that must stay local."
      },
      replacementReason: "Reviewer requested corrected approval scope.",
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.lexproof.test/api/workspaces/workspace-vault/evidence/evidence-vault-rejected/replacement",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.superseded.status).toBe("superseded");
    expect(result.replacement).toEqual(expect.objectContaining({ parentEvidenceId: "evidence-vault-rejected", status: "received" }));
    expect(result.notLegalAdviceBoundary).toContain("Not legal advice");
    expect(uploadedForms[0].get("replacementReason")).toBe("Reviewer requested corrected approval scope.");

    const uploadedFile = uploadedForms[0].get("file") as Blob;
    const uploadedPayload = await readBlobText(uploadedFile);
    expect(uploadedPayload).toContain("localContentHash");
    expect(uploadedPayload).toContain("control-eu-mica-title-ii-white-paper");
    expect(uploadedForms[0].get("linkedControlIds")).toBe("control-eu-mica-title-ii-white-paper");
    expect(uploadedPayload).not.toContain("Corrected confidential board approval text");
  });

  it("redacts classified text from otherwise valid Evidence Vault replacement responses before UI use", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const superseded: EvidenceVaultRecordResponse = {
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: `evidence-vault-rejected ${privateKey}`,
      workspaceId: `workspace-vault apiKey=${apiKey}`,
      filename: "rejected raw_KYC passport A1234567.metadata.json",
      mimeType: "application/json",
      byteSize: 512,
      fileHash: "e".repeat(64),
      storageMode: "server-vault",
      status: "superseded",
      owner: "Compliance",
      sourceNote: "Rejected memo with legal conclusion removed.",
      version: 3,
      linkedRiskFlagIds: ["governance-approval"],
      linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
      containsRawKycOrPersonalData: false,
      supersededByEvidenceId: `evidence-vault-replacement apiKey=${apiKey}`,
      replacementReason: "Remove reviewer@example.com and legal conclusion from replacement notes.",
      createdAt: "2026-06-30T00:00:00.000Z",
      updatedAt: "2026-06-30T01:00:00.000Z"
    };
    const replacement: EvidenceVaultRecordResponse = {
      ...superseded,
      id: "evidence-vault-replacement raw KYC passport A1234567",
      filename: "replacement reviewer@example.com.metadata.json",
      fileHash: "f".repeat(64),
      status: "received",
      parentEvidenceId: `evidence-vault-rejected ${privateKey}`,
      supersededByEvidenceId: undefined,
      version: 3
    };
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence/evidence-vault-rejected/replacement") && init?.method === "POST") {
        return jsonResponse(
          {
            superseded,
            replacement,
            notLegalAdviceBoundary: "Not legal advice. Evidence replacement records are audit preparation metadata only."
          },
          201
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });

    const result = await replaceEvidenceVaultRecord({
      workspaceId: "workspace-vault",
      evidenceId: "evidence-vault-rejected",
      replacementItem: evidenceItem,
      replacementReason: "Reviewer requested corrected approval scope.",
      apiBaseUrl: "https://api.lexproof.test",
      fetcher
    });
    const serialized = JSON.stringify(result);

    expect(result.superseded.id).toContain("[redacted-private-key]");
    expect(result.superseded.workspaceId).toBe("workspace-vault [redacted-secret]");
    expect(result.superseded.filename).toContain("[redacted-raw-kyc]");
    expect(result.superseded.fileHash).toBe("e".repeat(64));
    expect(result.superseded.supersededByEvidenceId).toBe("evidence-vault-replacement [redacted-secret]");
    expect(result.superseded.replacementReason).toContain("[redacted-email]");
    expect(result.superseded.replacementReason).toContain("[redacted-legal-conclusion]");
    expect(result.replacement.id).toContain("[redacted-raw-kyc]");
    expect(result.replacement.filename).toContain("[redacted-email]");
    expect(result.replacement.fileHash).toBe("f".repeat(64));
    expect(result.replacement.parentEvidenceId).toContain("[redacted-private-key]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toContain("A1234567");
    expect(serialized).not.toContain("reviewer@example.com");
    expect(serialized).not.toMatch(/\blegal conclusion\b/i);
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
