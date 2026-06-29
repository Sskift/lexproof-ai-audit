import { describe, expect, it } from "vitest";
import { createSimulatedAnchorReceipt, exportAnchorReceiptJson } from "./anchorReceipt";
import type { EvidenceManifest } from "./evidenceManifest";

const manifest: EvidenceManifest = {
  manifestVersion: "lexproof-manifest-v1",
  generatedAt: "2026-06-29T00:00:00.000Z",
  projectId: "project-anchor",
  projectName: "Anchor Desk",
  riskLevel: "high",
  riskScore: 72,
  itemCount: 2,
  items: [
    {
      sequence: 1,
      label: "Issuer memo",
      kind: "Markdown",
      source: "Synthetic",
      status: "received",
      owner: "Counsel",
      contentHash: "a".repeat(64)
    },
    {
      sequence: 2,
      label: "Wallet policy",
      kind: "Runbook",
      source: "",
      status: "draft",
      owner: "Engineering",
      contentHash: "b".repeat(64)
    }
  ],
  bundleHash: "c".repeat(64)
};

describe("simulated anchor receipt", () => {
  it("creates a clear simulated receipt without raw evidence or real chain claims", () => {
    const receipt = createSimulatedAnchorReceipt(manifest, "ethereum-sepolia");

    expect(receipt).toMatchObject({
      receiptVersion: "lexproof-anchor-receipt-v1",
      mode: "simulated",
      status: "not-submitted",
      network: "ethereum-sepolia",
      bundleHash: manifest.bundleHash,
      projectId: "project-anchor"
    });
    expect(receipt.receiptId).toContain(manifest.bundleHash.slice(0, 16));
    expect(receipt.disclaimer).toContain("not a real on-chain write");
    expect(JSON.stringify(receipt)).not.toContain("Yield terms");
    expect(JSON.stringify(receipt)).not.toContain("withdrawal authority");
  });

  it("exports readable receipt JSON", () => {
    const receipt = createSimulatedAnchorReceipt(manifest, "internal-registry");
    const json = exportAnchorReceiptJson(receipt);

    expect(json).toContain("\"mode\": \"simulated\"");
    expect(json).toContain("\"network\": \"internal-registry\"");
    expect(JSON.parse(json)).toMatchObject({
      receiptVersion: "lexproof-anchor-receipt-v1",
      bundleHash: manifest.bundleHash
    });
  });
});
