import type { AuditResult, SubmissionFit } from "./auditEngine";
import type { DataBoundaryReport } from "./dataBoundary";
import { redactClassifiedText } from "./dataClassification";
import type { DemoReadinessCheckStatus, DemoReadinessReport } from "./demoReadiness";
import type { EvidenceManifest } from "./evidenceManifest";
import type { ProjectProfile } from "./projectModel";
import type { RegulatorySourceCoverageReport } from "./regulatorySourceCoverage";
import type { RegulatorySourcePack } from "./regulatorySourcePack";

export type SubmissionPackStatus = "ready" | "needs-action" | "blocked";
export type SubmissionModelConnectStatus = "ready" | "not-configured" | "blocked";
export type SubmissionExportSafetyStatus = "ready" | "needs-action" | "blocked";

export type SubmissionPackAsset = {
  label: string;
  status: SubmissionPackStatus;
  evidence: string;
  recoveryAction: string;
};

export type SubmissionPackFeatureMapping = {
  criterion: string;
  productEvidence: string[];
  boundary: string;
};

export type SubmissionPackKnownLimitation = {
  id: string;
  title: string;
  detail: string;
  mitigation: string;
};

export type SubmissionExportSafetySummary = {
  status: SubmissionExportSafetyStatus;
  exportHandoffAllowed: boolean;
  boundaryStatus: DataBoundaryReport["status"];
  boundaryBlockerCount: number;
  boundaryWarningCount: number;
  manifestReady: boolean;
  regulatorySourcePackReady: boolean;
  regulatorySourceCoverageReady: boolean;
  counselPackVersionReady: boolean;
  serverExportRecordReady: boolean;
  demoRunbookReady: boolean;
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Submission export safety is audit preparation handoff metadata only.";
};

export type SubmissionDemoRunbookSummary = {
  runbookHash: string;
  status: DemoReadinessReport["status"];
  apiPreflightStatus: DemoReadinessCheckStatus;
  scenarioCount: number;
  screenshotCount: number;
  notLegalAdviceBoundary: string;
};

export type SubmissionPack = {
  packVersion: "lexproof-submission-pack-v1";
  projectId: string;
  projectName: string;
  generatedAt: string;
  targetHackathon: string;
  riskLevel: AuditResult["riskLevel"];
  riskScore: number;
  themeCoverage: string[];
  demoReadinessStatus: DemoReadinessReport["status"];
  modelConnectStatus: SubmissionModelConnectStatus;
  evidenceItemCount: number;
  manifestHash: string;
  regulatorySourcePackHash: string;
  regulatorySourceCoverageHash: string;
  regulatorySourceCoverageStatus: RegulatorySourceCoverageReport["status"] | "missing";
  demoRunbookHash: string;
  sourceCount: number;
  evidenceGapCount: number;
  sourceCoverageJurisdictionCount: number;
  sourceCoverageOpenEvidenceRequestCount: number;
  counselPackVersionCount: number;
  serverExportRecordCount: number;
  exportSafetySummary: SubmissionExportSafetySummary;
  requiredAssets: SubmissionPackAsset[];
  featureMappings: SubmissionPackFeatureMapping[];
  knownLimitations: SubmissionPackKnownLimitation[];
  judgeRunbook: string[];
  packHash: string;
  notLegalAdviceBoundary: "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only.";
};

export type CreateSubmissionPackInput = {
  project: ProjectProfile;
  audit: AuditResult;
  fit: SubmissionFit;
  manifest: EvidenceManifest | null;
  regulatorySourcePack: RegulatorySourcePack | null;
  regulatorySourceCoverageReport?: RegulatorySourceCoverageReport | null;
  demoReadinessReport: DemoReadinessReport;
  demoRunbookSummary?: SubmissionDemoRunbookSummary | null;
  dataBoundaryReport: DataBoundaryReport;
  counselPackVersionCount: number;
  serverExportRecordCount: number;
  modelConnectStatus: SubmissionModelConnectStatus;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only." as const;

export async function createSubmissionPack(input: CreateSubmissionPackInput): Promise<SubmissionPack> {
  const projectName = sanitize(input.project.projectName || "Untitled project");
  const manifestHash = sanitizeHash(input.manifest?.bundleHash ?? "");
  const regulatorySourcePackHash = sanitizeHash(input.regulatorySourcePack?.packHash ?? "");
  const regulatorySourceCoverageHash = sanitizeHash(input.regulatorySourceCoverageReport?.reportHash ?? "");
  const demoRunbookHash = sanitizeHash(input.demoRunbookSummary?.runbookHash ?? "");
  const exportSafetySummary = createExportSafetySummary(input);
  const requiredAssets = createRequiredAssets(input);
  const featureMappings = createFeatureMappings(input);
  const knownLimitations = createKnownLimitations();
  const judgeRunbook = createJudgeRunbook(input);

  const hashPayload: Omit<SubmissionPack, "generatedAt" | "packHash"> = {
    packVersion: "lexproof-submission-pack-v1",
    projectId: sanitize(input.project.id),
    projectName,
    targetHackathon: sanitize(input.fit.targetHackathon),
    riskLevel: input.audit.riskLevel,
    riskScore: input.audit.score,
    themeCoverage: input.fit.themeCoverage.map(sanitize).sort(),
    demoReadinessStatus: input.demoReadinessReport.status,
    modelConnectStatus: input.modelConnectStatus,
    evidenceItemCount: input.manifest?.itemCount ?? input.project.evidenceItems.length,
    manifestHash,
    regulatorySourcePackHash,
    regulatorySourceCoverageHash,
    regulatorySourceCoverageStatus: input.regulatorySourceCoverageReport?.status ?? "missing",
    demoRunbookHash,
    sourceCount: input.regulatorySourcePack?.sourceCount ?? input.audit.sourcePack.length,
    evidenceGapCount: input.regulatorySourcePack?.evidenceGapCount ?? 0,
    sourceCoverageJurisdictionCount: input.regulatorySourceCoverageReport?.jurisdictionCount ?? 0,
    sourceCoverageOpenEvidenceRequestCount: input.regulatorySourceCoverageReport?.openEvidenceRequestCount ?? 0,
    counselPackVersionCount: input.counselPackVersionCount,
    serverExportRecordCount: input.serverExportRecordCount,
    exportSafetySummary,
    requiredAssets,
    featureMappings,
    knownLimitations,
    judgeRunbook,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };

  return {
    ...hashPayload,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    packHash: await sha256Hex(stableStringify(hashPayload))
  };
}

export function exportSubmissionPackJson(pack: SubmissionPack): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

function createRequiredAssets(input: CreateSubmissionPackInput): SubmissionPackAsset[] {
  return [
    ...input.fit.requiredAssets.map((asset) => {
    const normalized = asset.toLowerCase();

    if (normalized.includes("github")) {
      return createAsset(asset, "ready", "Repository, README, docs, tests, and screenshots are tracked in Git.", "Keep main verified and pushed.");
    }

    if (normalized.includes("demo video")) {
      return createAsset(
        asset,
        "needs-action",
        `Demo runbook has ${input.demoReadinessReport.screenshotRefs.length} screenshot references and ${input.demoReadinessReport.cleanCloneCommands.length} clean-clone commands.`,
        "Record the current docs/demo-script.md path after npm run verify passes."
      );
    }

    if (normalized.includes("buidl")) {
      return createAsset(
        asset,
        "needs-action",
        "Use README, Counsel Pack, Submission Pack JSON, screenshots, and demo video for the DoraHacks entry.",
        "Submit through DoraHacks after final recording."
      );
    }

    if (normalized.includes("readme")) {
      return createAsset(asset, "ready", "README documents the workflow, screenshots, local run commands, and submission assets.", "Refresh README after visible workflow changes.");
    }

    if (normalized.includes("source")) {
      return createAsset(
        asset,
        input.regulatorySourcePack ? "ready" : "needs-action",
        input.regulatorySourcePack
          ? `Regulatory Source Pack ${shortHash(input.regulatorySourcePack.packHash)} covers ${input.regulatorySourcePack.sourceCount} source records.`
          : "Regulatory Source Pack is still calculating or missing.",
        "Open Counsel Pack or Sources after source graph calculation completes."
      );
    }

    return createAsset(asset, "needs-action", "Asset is tracked in the submission checklist.", "Confirm this asset before final DoraHacks submission.");
    }),
    createDemoRunbookAsset(input),
    createSourceCoverageAsset(input)
  ];
}

function createAsset(label: string, status: SubmissionPackStatus, evidence: string, recoveryAction: string): SubmissionPackAsset {
  return {
    label: sanitize(label),
    status,
    evidence: sanitize(evidence),
    recoveryAction: sanitize(recoveryAction)
  };
}

function createExportSafetySummary(input: CreateSubmissionPackInput): SubmissionExportSafetySummary {
  const manifestReady = Boolean(input.manifest?.bundleHash);
  const regulatorySourcePackReady = Boolean(input.regulatorySourcePack?.packHash);
  const regulatorySourceCoverageReady = Boolean(input.regulatorySourceCoverageReport?.reportHash);
  const counselPackVersionReady = input.counselPackVersionCount > 0;
  const serverExportRecordReady = input.serverExportRecordCount > 0;
  const demoRunbookReady = isDemoRunbookReady(input.demoRunbookSummary);
  const missingActions = [
    !manifestReady ? "Generate an Evidence Manifest before judge or counsel handoff." : "",
    !regulatorySourcePackReady ? "Open Counsel Pack or Sources after Regulatory Source Pack calculation completes." : "",
    !regulatorySourceCoverageReady ? "Open the Regulatory Command Center after Regulatory Source Coverage calculation completes." : "",
    !counselPackVersionReady ? "Save a Counsel Pack version to lock Markdown and source-pack hashes." : "",
    !serverExportRecordReady ? "Create a server export record from the latest Counsel Pack version when the Phase 2 API is running." : "",
    !demoRunbookReady ? "Complete Demo API preflight and download the Demo Runbook JSON before judge handoff." : ""
  ];
  const boundaryActions =
    input.dataBoundaryReport.status === "clean" ? [] : input.dataBoundaryReport.remediation.map(sanitize);
  const nextActions = unique([...missingActions, ...boundaryActions].map(sanitize).filter(Boolean));
  const missingRequiredArtifact =
    !manifestReady ||
    !regulatorySourcePackReady ||
    !regulatorySourceCoverageReady ||
    !counselPackVersionReady ||
    !serverExportRecordReady ||
    !demoRunbookReady;
  const status = createExportSafetyStatus(input.dataBoundaryReport, missingRequiredArtifact);

  return {
    status,
    exportHandoffAllowed: status === "ready",
    boundaryStatus: input.dataBoundaryReport.status,
    boundaryBlockerCount: input.dataBoundaryReport.blockerCount,
    boundaryWarningCount: input.dataBoundaryReport.warningCount,
    manifestReady,
    regulatorySourcePackReady,
    regulatorySourceCoverageReady,
    counselPackVersionReady,
    serverExportRecordReady,
    demoRunbookReady,
    nextActions: nextActions.length > 0 ? nextActions : ["Submission export safety is ready for metadata-only judge handoff."],
    notLegalAdviceBoundary: "Not legal advice. Submission export safety is audit preparation handoff metadata only."
  };
}

function createDemoRunbookAsset(input: CreateSubmissionPackInput): SubmissionPackAsset {
  const summary = input.demoRunbookSummary;

  if (!summary?.runbookHash) {
    return createAsset(
      "Demo Runbook JSON",
      "needs-action",
      "Demo Runbook JSON has not been generated for the current judge path.",
      "Open Judge Demo Readiness, complete API preflight, and download Demo Runbook JSON before judging."
    );
  }

  const status = isDemoRunbookReady(summary) ? "ready" : "needs-action";
  return createAsset(
    "Demo Runbook JSON",
    status,
    `Runbook ${shortHash(summary.runbookHash)} covers ${summary.scenarioCount} scenarios, ${summary.screenshotCount} screenshots, API preflight ${summary.apiPreflightStatus}.`,
    status === "ready"
      ? "Keep the runbook aligned with README, demo script, and current screenshots."
      : "Complete Demo API preflight and download the Demo Runbook JSON before judge handoff."
  );
}

function createSourceCoverageAsset(input: CreateSubmissionPackInput): SubmissionPackAsset {
  const coverage = input.regulatorySourceCoverageReport;

  if (!coverage?.reportHash) {
    return createAsset(
      "Regulatory Source Coverage JSON",
      "needs-action",
      "Regulatory Source Coverage has not been generated for the current command-center state.",
      "Open Regulatory Command Center after source graph and source review metadata finish calculating."
    );
  }

  const status: SubmissionPackStatus = coverage.status === "ready-for-counsel" ? "ready" : "needs-action";

  return createAsset(
    "Regulatory Source Coverage JSON",
    status,
    `Coverage ${shortHash(coverage.reportHash)} spans ${coverage.jurisdictionCount} jurisdiction${coverage.jurisdictionCount === 1 ? "" : "s"}, ${coverage.sourceCount} source${coverage.sourceCount === 1 ? "" : "s"}, and ${coverage.openEvidenceRequestCount} open evidence request${coverage.openEvidenceRequestCount === 1 ? "" : "s"}.`,
    status === "ready"
      ? "Keep source coverage aligned with the latest source review ledger before final judge handoff."
      : "Resolve open source coverage actions or explain them as known audit-prep blockers before judge handoff."
  );
}

function isDemoRunbookReady(summary: SubmissionDemoRunbookSummary | null | undefined): boolean {
  return Boolean(summary?.runbookHash) && summary?.status === "ready" && summary?.apiPreflightStatus === "ready";
}

function createExportSafetyStatus(
  dataBoundaryReport: DataBoundaryReport,
  missingRequiredArtifact: boolean
): SubmissionExportSafetyStatus {
  if (!dataBoundaryReport.exportAllowed || dataBoundaryReport.status === "blocked") {
    return "blocked";
  }

  if (missingRequiredArtifact || dataBoundaryReport.status === "needs-review") {
    return "needs-action";
  }

  return "ready";
}

function createFeatureMappings(input: CreateSubmissionPackInput): SubmissionPackFeatureMapping[] {
  return [
    {
      criterion: "Legal/compliance workflow",
      productEvidence: [
        `${input.audit.flags.length} deterministic risk flag${input.audit.flags.length === 1 ? "" : "s"} with source-linked rationale.`,
        `${input.audit.remediation.length} remediation owner item${input.audit.remediation.length === 1 ? "" : "s"} for counsel/compliance review.`,
        `${input.counselPackVersionCount} saved Counsel Pack version${input.counselPackVersionCount === 1 ? "" : "s"}.`
      ].map(sanitize),
      boundary: "Review status is workflow metadata, not legal approval."
    },
    {
      criterion: "AI governance",
      productEvidence: [
        `Model Connect status: ${input.modelConnectStatus}.`,
        "AI output remains draft audit preparation and routes through human review before reliance.",
        "Server Model Gateway adapters stay disabled unless policy gates are satisfied."
      ].map(sanitize),
      boundary: "AI output never changes deterministic risk scoring."
    },
    {
      criterion: "Web3 evidence provenance",
      productEvidence: [
        input.manifest
          ? `Evidence manifest ${shortHash(input.manifest.bundleHash)} covers ${input.manifest.itemCount} metadata item${input.manifest.itemCount === 1 ? "" : "s"}.`
          : "Evidence manifest is not available yet.",
        "Simulated anchor receipts are labeled as local simulations until a real transaction exists."
      ].map(sanitize),
      boundary: "Raw evidence bytes, raw KYC, and credential material stay out of default exports."
    },
    {
      criterion: "RegTech and GRC readiness",
      productEvidence: [
        input.regulatorySourcePack
          ? `Regulatory Source Pack ${shortHash(input.regulatorySourcePack.packHash)} has ${input.regulatorySourcePack.evidenceGapCount} open evidence gap${input.regulatorySourcePack.evidenceGapCount === 1 ? "" : "s"}.`
          : "Regulatory Source Pack is still missing.",
        input.regulatorySourceCoverageReport
          ? `Regulatory Source Coverage ${shortHash(input.regulatorySourceCoverageReport.reportHash)} is ${input.regulatorySourceCoverageReport.status} across ${input.regulatorySourceCoverageReport.jurisdictionCount} jurisdiction${input.regulatorySourceCoverageReport.jurisdictionCount === 1 ? "" : "s"}.`
          : "Regulatory Source Coverage is still missing.",
        `${input.serverExportRecordCount} server export metadata record${input.serverExportRecordCount === 1 ? "" : "s"}.`,
        `Demo readiness status: ${input.demoReadinessReport.status}.`
      ].map(sanitize),
      boundary: "Source triggers are audit-prep prompts and do not decide legality."
    },
    {
      criterion: "Finance/RWA and Web3 launch fit",
      productEvidence: [
        `Risk posture: ${input.audit.riskLevel} (${input.audit.score}/100).`,
        `Theme coverage: ${input.fit.themeCoverage.map(sanitize).join(", ")}.`
      ],
      boundary: "The packet frames review scope for counsel rather than making securities or compliance conclusions."
    }
  ];
}

function createKnownLimitations(): SubmissionPackKnownLimitation[] {
  return [
    {
      id: "not-legal-advice",
      title: "Not legal advice",
      detail: "LexProof produces audit preparation materials, evidence metadata, source lineage, and review handoff artifacts.",
      mitigation: "Route conclusions, filings, launch approvals, and jurisdiction decisions to qualified counsel."
    },
    {
      id: "local-first-storage",
      title: "Local-first browser workspace",
      detail: "The current SPA persists the active workspace in browser storage and uses a local Phase 2 API for metadata records.",
      mitigation: "Add organization accounts, RBAC, retention policy, and secure storage before production pilots."
    },
    {
      id: "simulated-anchor",
      title: "Simulated anchor only",
      detail: "Manifest anchor receipts are local simulations unless a real transaction hash and chain receipt are created.",
      mitigation: "Enable a wallet or timestamping adapter only after signing, privacy, and audit policies are approved."
    },
    {
      id: "external-provider-disabled",
      title: "External model providers remain disabled",
      detail: "The server gateway exposes policy status but keeps real external model adapters disabled by default.",
      mitigation: "Approve server-side secret storage, provider allowlist, egress logging, cost controls, and human-review enforcement first."
    },
    {
      id: "metadata-only-evidence",
      title: "Metadata-only evidence handling",
      detail: "The default demo stores evidence labels, hashes, source notes, statuses, and lineage metadata rather than raw files.",
      mitigation: "Add encrypted object storage, deletion controls, and access logs before raw document retention."
    }
  ].map((item) => ({
    id: item.id,
    title: sanitize(item.title),
    detail: sanitize(item.detail),
    mitigation: sanitize(item.mitigation)
  }));
}

function createJudgeRunbook(input: CreateSubmissionPackInput): string[] {
  return [
    "Run npm install, npm run verify, and npm run dev from a clean clone.",
    "Start the Phase 2 API with DATABASE_URL=file:./demo-review-workspace.db npm run start:api for the secure review path.",
    "Launch a synthetic Demo Scenario Library path such as High-risk RWA launch, AI legal workflow review, Thailand digital asset custody review, Indonesia OJK crypto trading review, Malaysia digital asset exchange review, Philippines VASP custody review, Brazil VASP source review, or Marketing claims review.",
    "Validate Model Connect with the mock local reviewer and inspect Redaction Gate status.",
    "Review or add metadata-only evidence, then confirm the Evidence Manifest bundle hash.",
    "Open Risk Audit, Human Review, Secure Review Journey, Counsel Pack, and Sources.",
    "Download Counsel Pack Markdown, Regulatory Source Pack JSON, Regulatory Source Coverage JSON, Evidence Manifest JSON, Demo Runbook JSON, and this Submission Pack JSON."
  ].map(sanitize);
}

function shortHash(value: string): string {
  return value ? sanitize(value.slice(0, 12)) : "missing";
}

function sanitizeHash(value: string): string {
  const normalized = value.trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : sanitize(value);
}

function sanitize(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
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
