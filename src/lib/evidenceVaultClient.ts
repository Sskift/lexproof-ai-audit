import { hashEvidenceItem } from "./evidenceManifest";
import type { EvidenceItem } from "./projectModel";

export type EvidenceVaultRecordResponse = {
  recordVersion: "lexproof-evidence-vault-record-v1";
  id: string;
  workspaceId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  fileHash: string;
  storageMode: "local-metadata" | "server-vault" | "external-reference";
  status: "draft" | "requested" | "received" | "submitted" | "under-review" | "verified" | "rejected" | "superseded";
  owner: string;
  sourceNote: string;
  version: number;
  linkedRiskFlagIds: string[];
  containsRawKycOrPersonalData: boolean;
  parentEvidenceId?: string;
  supersededByEvidenceId?: string;
  replacementReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceVaultManifestResponse = {
  manifestVersion: "lexproof-evidence-vault-manifest-v1";
  workspaceId: string;
  generatedAt: string;
  itemCount: number;
  items: Array<{
    sequence: number;
    evidenceId: string;
    filename: string;
    mimeType: string;
    byteSize: number;
    fileHash: string;
    storageMode: EvidenceVaultRecordResponse["storageMode"];
    status: EvidenceVaultRecordResponse["status"];
    owner: string;
    version: number;
    linkedRiskFlagIds: string[];
    containsRawKycOrPersonalData: boolean;
    parentEvidenceId?: string;
    supersededByEvidenceId?: string;
    replacementReason?: string;
  }>;
  bundleHash: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only.";
};

export type EvidenceVaultSnapshot = {
  snapshotVersion: "lexproof-evidence-vault-snapshot-v1";
  localEvidenceId: string;
  label: string;
  kind: string;
  source: string;
  status: string;
  owner: string;
  linkedRiskFlagIds: string[];
  localContentHash: string;
  contentPolicy: "metadata-only; raw evidence content excluded";
  notLegalAdviceBoundary: "Not legal advice. Evidence Vault snapshots are audit preparation metadata only.";
};

export type EvidenceVaultSyncResult = {
  records: EvidenceVaultRecordResponse[];
  manifest: EvidenceVaultManifestResponse;
  syncedAt: string;
  notLegalAdviceBoundary: "Not legal advice. Evidence Vault sync creates audit preparation metadata only.";
};

export type EvidenceVaultClientOptions = {
  workspaceId: string;
  apiBaseUrl?: string;
  fetcher?: EvidenceVaultFetch;
};

export type EvidenceVaultSyncInput = EvidenceVaultClientOptions & {
  evidenceItems: EvidenceItem[];
};

export type EvidenceVaultReplacementInput = EvidenceVaultClientOptions & {
  evidenceId: string;
  replacementItem: EvidenceItem;
  replacementReason: string;
};

export type EvidenceVaultReplacementResult = {
  superseded: EvidenceVaultRecordResponse;
  replacement: EvidenceVaultRecordResponse;
  notLegalAdviceBoundary: "Not legal advice. Evidence replacement records are audit preparation metadata only.";
};

type EvidenceVaultFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type ErrorResponse = {
  error?: string;
  errors?: string[];
  recoveryAction?: string;
};

export async function createEvidenceVaultSnapshot(item: EvidenceItem): Promise<EvidenceVaultSnapshot> {
  const localContentHash = await hashEvidenceItem(item);

  return {
    snapshotVersion: "lexproof-evidence-vault-snapshot-v1",
    localEvidenceId: item.id?.trim() || slug(item.label || "evidence"),
    label: item.label.trim(),
    kind: item.kind.trim() || "Evidence metadata",
    source: item.source?.trim() ?? "",
    status: item.status ?? "draft",
    owner: item.owner ?? "Founder",
    linkedRiskFlagIds: extractLinkedRiskFlagIds(item),
    localContentHash,
    contentPolicy: "metadata-only; raw evidence content excluded",
    notLegalAdviceBoundary: "Not legal advice. Evidence Vault snapshots are audit preparation metadata only."
  };
}

export async function syncEvidenceLedgerToVault(input: EvidenceVaultSyncInput): Promise<EvidenceVaultSyncResult> {
  const workspaceId = normalizeWorkspaceId(input.workspaceId);
  const fetcher = resolveFetcher(input.fetcher);
  const records: EvidenceVaultRecordResponse[] = [];

  for (const item of input.evidenceItems) {
    if (!item.label.trim()) {
      continue;
    }

    const snapshot = await createEvidenceVaultSnapshot(item);
    const uploadResponse = await fetcher(buildEvidenceVaultUrl(input.apiBaseUrl, workspaceId, "evidence"), {
      method: "POST",
      body: createVaultUploadFormData(snapshot)
    });
    const uploaded = await readJsonResponse<EvidenceVaultRecordResponse>(uploadResponse, "Evidence Vault upload failed.");
    const desiredStatus = mapLedgerStatusToVaultStatus(item.status);

    if (uploaded.status !== desiredStatus || uploaded.owner !== snapshot.owner || uploaded.linkedRiskFlagIds.join(",") !== snapshot.linkedRiskFlagIds.join(",")) {
      const patchResponse = await fetcher(buildEvidenceVaultUrl(input.apiBaseUrl, workspaceId, `evidence/${encodeURIComponent(uploaded.id)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: desiredStatus,
          owner: snapshot.owner,
          sourceNote: createSourceNote(snapshot),
          linkedRiskFlagIds: snapshot.linkedRiskFlagIds
        })
      });
      records.push(await readJsonResponse<EvidenceVaultRecordResponse>(patchResponse, "Evidence Vault status update failed."));
    } else {
      records.push(uploaded);
    }
  }

  const manifest = await fetchEvidenceVaultManifest({
    workspaceId,
    apiBaseUrl: input.apiBaseUrl,
    fetcher
  });

  return {
    records,
    manifest,
    syncedAt: new Date().toISOString(),
    notLegalAdviceBoundary: "Not legal advice. Evidence Vault sync creates audit preparation metadata only."
  };
}

export async function fetchEvidenceVaultManifest(input: EvidenceVaultClientOptions): Promise<EvidenceVaultManifestResponse> {
  const workspaceId = normalizeWorkspaceId(input.workspaceId);
  const fetcher = resolveFetcher(input.fetcher);
  const response = await fetcher(buildEvidenceVaultUrl(input.apiBaseUrl, workspaceId, "evidence-manifest"), { method: "GET" });

  return readJsonResponse<EvidenceVaultManifestResponse>(response, "Evidence Vault manifest fetch failed.");
}

export async function listEvidenceVaultRecords(input: EvidenceVaultClientOptions): Promise<EvidenceVaultRecordResponse[]> {
  const workspaceId = normalizeWorkspaceId(input.workspaceId);
  const fetcher = resolveFetcher(input.fetcher);
  const response = await fetcher(buildEvidenceVaultUrl(input.apiBaseUrl, workspaceId, "evidence"), { method: "GET" });

  return readJsonResponse<EvidenceVaultRecordResponse[]>(response, "Evidence Vault records fetch failed.");
}

export async function replaceEvidenceVaultRecord(input: EvidenceVaultReplacementInput): Promise<EvidenceVaultReplacementResult> {
  const workspaceId = normalizeWorkspaceId(input.workspaceId);
  const evidenceId = input.evidenceId.trim();

  if (!evidenceId) {
    throw new Error("Evidence ID is required before Evidence Vault replacement.");
  }

  if (!input.replacementReason.trim()) {
    throw new Error("Replacement reason is required before Evidence Vault replacement.");
  }

  const fetcher = resolveFetcher(input.fetcher);
  const snapshot = await createEvidenceVaultSnapshot(input.replacementItem);
  const response = await fetcher(buildEvidenceVaultUrl(input.apiBaseUrl, workspaceId, `evidence/${encodeURIComponent(evidenceId)}/replacement`), {
    method: "POST",
    body: createVaultUploadFormData(snapshot, input.replacementReason)
  });

  return readJsonResponse<EvidenceVaultReplacementResult>(response, "Evidence Vault replacement failed.");
}

function createVaultUploadFormData(snapshot: EvidenceVaultSnapshot, replacementReason?: string): FormData {
  const formData = new FormData();
  const payload = stableStringify(snapshot);
  const file = new Blob([payload], { type: "application/json" });

  formData.append("file", file, `${slug(snapshot.label || snapshot.localEvidenceId)}.metadata.json`);
  formData.append("owner", snapshot.owner);
  formData.append("sourceNote", createSourceNote(snapshot));
  formData.append("linkedRiskFlagIds", snapshot.linkedRiskFlagIds.join(","));
  formData.append("containsRawKycOrPersonalData", "false");
  if (replacementReason) {
    formData.append("replacementReason", replacementReason.trim());
  }

  return formData;
}

function createSourceNote(snapshot: EvidenceVaultSnapshot): string {
  return [
    `Metadata-only sync for ${snapshot.label}.`,
    `Local content SHA-256: ${snapshot.localContentHash}.`,
    "Raw evidence content, KYC, personal data, private keys, and credentials are excluded."
  ].join(" ");
}

function extractLinkedRiskFlagIds(item: EvidenceItem): string[] {
  const source = item.source ?? "";
  const match = source.match(/risk evidence requirement:\s*([a-z0-9-]+)/i);
  return match ? [match[1]] : [];
}

function mapLedgerStatusToVaultStatus(status: EvidenceItem["status"]): EvidenceVaultRecordResponse["status"] {
  if (status === "verified") {
    return "verified";
  }

  if (status === "received") {
    return "received";
  }

  if (status === "requested" || status === "draft") {
    return "requested";
  }

  return "received";
}

function buildEvidenceVaultUrl(apiBaseUrl: string | undefined, workspaceId: string, route: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/${route}`;
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ErrorResponse | T;

  if (!response.ok) {
    const errorPayload = payload as ErrorResponse;
    const details = [errorPayload.errors?.join(" "), errorPayload.error, errorPayload.recoveryAction].filter(Boolean).join(" ") || fallbackMessage;
    throw new Error(details);
  }

  return payload as T;
}

function normalizeWorkspaceId(workspaceId: string): string {
  const normalized = workspaceId.trim();

  if (!normalized) {
    throw new Error("Workspace ID is required before Evidence Vault sync.");
  }

  return normalized;
}

function resolveFetcher(fetcher: EvidenceVaultFetch | undefined): EvidenceVaultFetch {
  const resolved = fetcher ?? globalThis.fetch?.bind(globalThis);

  if (!resolved) {
    throw new Error("Fetch is required for Evidence Vault sync.");
  }

  return resolved;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "evidence"
  );
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
