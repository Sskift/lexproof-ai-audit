import type { AuditResult } from "./auditEngine";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type EvidenceManifestItem = {
  sequence: number;
  label: string;
  kind: string;
  source: string;
  status: string;
  owner: string;
  contentHash: string;
};

export type EvidenceManifest = {
  manifestVersion: "lexproof-manifest-v1";
  generatedAt: string;
  projectId: string;
  projectName: string;
  riskLevel: AuditResult["riskLevel"];
  riskScore: number;
  itemCount: number;
  items: EvidenceManifestItem[];
  bundleHash: string;
};

export async function hashEvidenceItem(item: EvidenceItem): Promise<string> {
  return sha256Hex(stableStringify(normalizeEvidenceItem(item)));
}

export async function createEvidenceManifest(
  project: ProjectProfile,
  audit: AuditResult,
  evidenceItems: EvidenceItem[]
): Promise<EvidenceManifest> {
  const items = await Promise.all(
    evidenceItems.map(async (item, index): Promise<EvidenceManifestItem> => {
      const normalized = normalizeEvidenceItem(item);
      return {
        sequence: index + 1,
        label: normalized.label,
        kind: normalized.kind,
        source: normalized.source,
        status: normalized.status,
        owner: normalized.owner,
        contentHash: await hashEvidenceItem(item)
      };
    })
  );

  const hashPayload = {
    manifestVersion: "lexproof-manifest-v1",
    projectId: project.id,
    projectName: project.projectName.trim(),
    riskLevel: audit.riskLevel,
    riskScore: audit.score,
    flags: audit.flags.map((flag) => flag.id),
    items
  };
  const bundleHash = await sha256Hex(stableStringify(hashPayload));

  return {
    manifestVersion: "lexproof-manifest-v1",
    generatedAt: new Date().toISOString(),
    projectId: project.id,
    projectName: project.projectName.trim(),
    riskLevel: audit.riskLevel,
    riskScore: audit.score,
    itemCount: items.length,
    items,
    bundleHash
  };
}

export function exportManifestJson(manifest: EvidenceManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function downloadManifestJson(filename: string, manifest: EvidenceManifest): void {
  const blob = new Blob([exportManifestJson(manifest)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeEvidenceItem(item: EvidenceItem) {
  return {
    label: item.label.trim(),
    kind: item.kind.trim(),
    content: item.content.trim(),
    source: item.source?.trim() ?? "",
    status: item.status ?? "draft",
    owner: item.owner ?? "Founder"
  };
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
