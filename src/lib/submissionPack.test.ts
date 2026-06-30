import { describe, expect, it } from "vitest";
import { analyzeAuditProfile, createSubmissionFit } from "./auditEngine";
import { createSubmissionPack, exportSubmissionPackJson } from "./submissionPack";
import type { DemoReadinessReport } from "./demoReadiness";
import type { EvidenceManifest } from "./evidenceManifest";
import type { ProjectProfile } from "./projectModel";
import type { RegulatorySourcePack } from "./regulatorySourcePack";

const project: ProjectProfile = {
  id: "project-yieldpassport",
  projectName: "YieldPassport",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC, investor accreditation, transaction history",
  aiUsage: "AI drafts suitability memo and flags restricted investors",
  blockchainUse: "Ethereum evidence anchor and investor status registry",
  operatingStage: "Pilot with planned public launch",
  evidenceItems: [
    {
      id: "evidence-issuer-memo",
      label: "Issuer memo",
      kind: "PDF",
      content: "Yield terms, target users, redemption policy",
      status: "verified",
      owner: "Counsel",
      source: "Data room"
    }
  ]
};

const manifest: EvidenceManifest = {
  manifestVersion: "lexproof-manifest-v1",
  generatedAt: "2026-07-01T00:00:00.000Z",
  projectId: project.id,
  projectName: project.projectName,
  riskLevel: "critical",
  riskScore: 100,
  itemCount: 1,
  items: [
    {
      sequence: 1,
      label: "Issuer memo",
      kind: "PDF",
      source: "Data room",
      status: "verified",
      owner: "Counsel",
      contentHash: "a".repeat(64)
    }
  ],
  bundleHash: "b".repeat(64)
};

const regulatorySourcePack = {
  packHash: "c".repeat(64),
  sourceCount: 4,
  evidenceGapCount: 2,
  sourceReview: {
    status: "review-due"
  }
} as RegulatorySourcePack;

const demoReadinessReport: DemoReadinessReport = {
  reportVersion: "lexproof-demo-readiness-v1",
  status: "needs-api",
  checks: [
    {
      id: "scenario-library",
      label: "Scenario library",
      status: "ready",
      detail: "3 synthetic judge paths are available and validated.",
      recoveryAction: "Keep demo scenarios synthetic and source-linked."
    },
    {
      id: "phase-2-api-preflight",
      label: "Phase 2 API preflight",
      status: "not-checked",
      detail: "The browser has not checked /api/health.",
      recoveryAction: "Run the Phase 2 API and click Check Demo API before judging."
    }
  ],
  cleanCloneCommands: ["npm install", "npm run verify", "npm run dev"],
  screenshotRefs: ["docs/assets/screenshots/demo-06-counsel-pack-export.png"],
  nextActions: ["Run the Phase 2 API and click Check Demo API before judging."],
  notLegalAdviceBoundary: "Not legal advice. Demo readiness checks are audit preparation readiness metadata only."
};

describe("createSubmissionPack", () => {
  it("builds a judge-facing artifact with hashes, limitations, feature mapping, and non-advice boundary", async () => {
    const audit = analyzeAuditProfile(project);
    const pack = await createSubmissionPack({
      project,
      audit,
      fit: createSubmissionFit(),
      manifest,
      regulatorySourcePack,
      demoReadinessReport,
      counselPackVersionCount: 2,
      serverExportRecordCount: 1,
      modelConnectStatus: "ready",
      generatedAt: "2026-07-01T00:00:00.000Z"
    });

    expect(pack.packVersion).toBe("lexproof-submission-pack-v1");
    expect(pack.targetHackathon).toBe("BLI Legal Tech Hackathon 2");
    expect(pack.riskLevel).toBe("critical");
    expect(pack.manifestHash).toBe(manifest.bundleHash);
    expect(pack.regulatorySourcePackHash).toBe(regulatorySourcePack.packHash);
    expect(pack.requiredAssets.map((asset) => asset.label)).toEqual(expect.arrayContaining(["Public GitHub repository", "Demo video"]));
    expect(pack.requiredAssets.some((asset) => asset.status === "needs-action")).toBe(true);
    expect(pack.featureMappings.map((mapping) => mapping.criterion)).toEqual(
      expect.arrayContaining(["Legal/compliance workflow", "AI governance", "Web3 evidence provenance"])
    );
    expect(pack.knownLimitations.map((item) => item.id)).toEqual(
      expect.arrayContaining(["not-legal-advice", "local-first-storage", "simulated-anchor", "external-provider-disabled"])
    );
    expect(pack.packHash).toMatch(/^[a-f0-9]{64}$/);
    expect(pack.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("keeps the pack hash stable across generatedAt changes and changes when material hashes change", async () => {
    const audit = analyzeAuditProfile(project);
    const baseInput = {
      project,
      audit,
      fit: createSubmissionFit(),
      manifest,
      regulatorySourcePack,
      demoReadinessReport,
      counselPackVersionCount: 1,
      serverExportRecordCount: 0,
      modelConnectStatus: "ready" as const
    };

    const first = await createSubmissionPack({ ...baseInput, generatedAt: "2026-07-01T00:00:00.000Z" });
    const second = await createSubmissionPack({ ...baseInput, generatedAt: "2026-07-02T00:00:00.000Z" });
    const changed = await createSubmissionPack({
      ...baseInput,
      manifest: { ...manifest, bundleHash: "d".repeat(64) },
      generatedAt: "2026-07-01T00:00:00.000Z"
    });

    expect(second.packHash).toBe(first.packHash);
    expect(changed.packHash).not.toBe(first.packHash);
  });

  it("exports metadata-only JSON with sensitive project text redacted", async () => {
    const unsafeProject: ProjectProfile = {
      ...project,
      projectName: "sk-live-abcdef1234567890 raw KYC packet",
      assetModel: "Tokenized yield product with API key: secret-value-1234",
      evidenceItems: [
        {
          label: "Raw KYC packet",
          kind: "PDF",
          content: "private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ]
    };
    const audit = analyzeAuditProfile(unsafeProject);

    const pack = await createSubmissionPack({
      project: unsafeProject,
      audit,
      fit: createSubmissionFit(),
      manifest: null,
      regulatorySourcePack: null,
      demoReadinessReport,
      counselPackVersionCount: 0,
      serverExportRecordCount: 0,
      modelConnectStatus: "blocked",
      generatedAt: "2026-07-01T00:00:00.000Z"
    });
    const exported = exportSubmissionPackJson(pack);

    expect(exported).toContain("[redacted-api-key]");
    expect(exported).toContain("[redacted-raw-kyc]");
    expect(exported).not.toContain("sk-live-abcdef1234567890");
    expect(exported).not.toContain("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(exported).not.toContain("private key");
  });
});
