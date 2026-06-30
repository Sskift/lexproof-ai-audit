import { describe, expect, it, vi } from "vitest";
import {
  createEvidenceVaultSnapshot,
  EvidenceVaultClientError,
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
