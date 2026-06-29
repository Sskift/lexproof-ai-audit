import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createEvidenceManifest, exportManifestJson, hashEvidenceItem } from "./evidenceManifest";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "project-yield",
  projectName: "Yield Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata references only; raw KYC excluded",
  aiUsage: "AI drafts suitability memo and flags restricted investors",
  blockchainUse: "Simulated Ethereum evidence anchor",
  operatingStage: "Pilot with planned public launch",
  evidenceItems: [
    {
      id: "issuer-memo",
      label: "Issuer memo",
      kind: "PDF",
      content: "Yield terms, target users, redemption policy",
      source: "Synthetic memo",
      status: "received",
      owner: "Counsel"
    },
    {
      id: "wallet-policy",
      label: "Wallet policy",
      kind: "Runbook",
      content: "Signer controls, withdrawal queues, emergency pause process",
      status: "draft",
      owner: "Engineering"
    }
  ]
};

describe("evidence manifest", () => {
  it("creates stable evidence item and bundle hashes for the same evidence", async () => {
    const audit = analyzeAuditProfile(project);
    const itemHash = await hashEvidenceItem(project.evidenceItems[0]);
    const repeatedItemHash = await hashEvidenceItem({ ...project.evidenceItems[0] });
    const firstManifest = await createEvidenceManifest(project, audit, project.evidenceItems);
    const secondManifest = await createEvidenceManifest(project, audit, [...project.evidenceItems]);

    expect(itemHash).toBe(repeatedItemHash);
    expect(itemHash).toMatch(/^[a-f0-9]{64}$/);
    expect(firstManifest.bundleHash).toBe(secondManifest.bundleHash);
    expect(firstManifest.bundleHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes the bundle hash when evidence content changes", async () => {
    const audit = analyzeAuditProfile(project);
    const original = await createEvidenceManifest(project, audit, project.evidenceItems);
    const changed = await createEvidenceManifest(project, audit, [
      ...project.evidenceItems.slice(0, 1),
      {
        ...project.evidenceItems[1],
        content: "Signer controls, withdrawal queues, emergency pause process, and board approval gate"
      }
    ]);

    expect(changed.bundleHash).not.toBe(original.bundleHash);
  });

  it("exports a readable manifest JSON document with the bundle hash", async () => {
    const audit = analyzeAuditProfile(project);
    const manifest = await createEvidenceManifest(project, audit, project.evidenceItems);
    const json = exportManifestJson(manifest);

    expect(json).toContain("\"manifestVersion\": \"lexproof-manifest-v1\"");
    expect(json).toContain(manifest.bundleHash);
    expect(JSON.parse(json)).toMatchObject({
      projectName: "Yield Desk",
      itemCount: 2,
      bundleHash: manifest.bundleHash
    });
  });
});
