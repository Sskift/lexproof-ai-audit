import type { EvidenceManifest } from "./evidenceManifest";

export type SimulatedAnchorNetwork = "ethereum-sepolia" | "bitcoin-testnet" | "internal-registry";

export type SimulatedAnchorReceipt = {
  receiptVersion: "lexproof-anchor-receipt-v1";
  mode: "simulated";
  status: "not-submitted";
  network: SimulatedAnchorNetwork;
  createdAt: string;
  receiptId: string;
  projectId: string;
  projectName: string;
  manifestVersion: EvidenceManifest["manifestVersion"];
  bundleHash: string;
  itemCount: number;
  publicPayload: {
    manifestVersion: EvidenceManifest["manifestVersion"];
    bundleHash: string;
    itemCount: number;
    riskLevel: EvidenceManifest["riskLevel"];
  };
  disclaimer: "This is not a real on-chain write. It is a local simulated receipt for audit preparation only.";
};

export function createSimulatedAnchorReceipt(
  manifest: EvidenceManifest,
  network: SimulatedAnchorNetwork = "ethereum-sepolia"
): SimulatedAnchorReceipt {
  return {
    receiptVersion: "lexproof-anchor-receipt-v1",
    mode: "simulated",
    status: "not-submitted",
    network,
    createdAt: new Date().toISOString(),
    receiptId: `sim-${network}-${manifest.bundleHash.slice(0, 16)}`,
    projectId: manifest.projectId,
    projectName: manifest.projectName,
    manifestVersion: manifest.manifestVersion,
    bundleHash: manifest.bundleHash,
    itemCount: manifest.itemCount,
    publicPayload: {
      manifestVersion: manifest.manifestVersion,
      bundleHash: manifest.bundleHash,
      itemCount: manifest.itemCount,
      riskLevel: manifest.riskLevel
    },
    disclaimer: "This is not a real on-chain write. It is a local simulated receipt for audit preparation only."
  };
}

export function exportAnchorReceiptJson(receipt: SimulatedAnchorReceipt): string {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function downloadAnchorReceiptJson(filename: string, receipt: SimulatedAnchorReceipt): void {
  const blob = new Blob([exportAnchorReceiptJson(receipt)], { type: "application/json;charset=utf-8" });
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
