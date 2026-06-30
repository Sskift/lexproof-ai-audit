import { exportEvidenceVaultManifestJson, type EvidenceVaultManifest } from "./evidenceVaultManifest";

export function downloadEvidenceVaultManifestJson(filename: string, manifest: EvidenceVaultManifest): void {
  const blob = new Blob([exportEvidenceVaultManifestJson(manifest)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
