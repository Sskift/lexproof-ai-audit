import { describe, expect, it, vi } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import {
  buildMarkdownCounselPack,
  buildPrintableCounselPackHtml,
  downloadMarkdownFile,
  printCounselPackPdf
} from "./counselPack";
import type { CounselReviewItem } from "./counselReview";
import { createEvidenceManifest } from "./evidenceManifest";
import type { CounselQuestion } from "./counselQuestions";
import type { ProjectProfile } from "./projectModel";
import type { HumanReviewTimelineEntry } from "./humanReviewWorkflow";
import { buildModelIntakeSummary, type AIEventRecord, type ModelConnectionProfile } from "./modelIntake";
import { createRegulatoryGraph } from "./regulatoryGraph";
import { createRegulatorySourceReview } from "./regulatorySourceReview";
import { createRegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import { createSourceFreshnessBoard } from "./sourceFreshnessBoard";
import { createDataBoundaryReport } from "./dataBoundary";
import { createEvidenceRecertificationQueue } from "./evidenceRecertification";
import { createJurisdictionEvidenceMap } from "./jurisdictionEvidenceMap";
import { createJurisdictionReadinessDigest } from "./jurisdictionReadinessDigest";
import { createLocalCounselRoutingPlan } from "./localCounselRouting";
import { createRegulatoryControlMatrix } from "./regulatoryControlMatrix";
import { createRiskSourceCitationControls } from "./sourceCitationControls";
import type { EvidenceVaultControlCoverage } from "./evidenceVaultControlCoverage";

const project: ProjectProfile = {
  id: "project-counsel",
  projectName: "Counsel Yield Review",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized yield product",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC references excluded from export",
  aiUsage: "AI flags legal review questions with citations",
  blockchainUse: "Simulated evidence hash registry",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      id: "terms",
      label: "Token terms",
      kind: "Markdown",
      content: "Yield, redemption, custody, and user eligibility facts",
      status: "received",
      owner: "Counsel"
    }
  ]
};

describe("buildMarkdownCounselPack", () => {
  it("includes non-advice boundary, risk level, manifest hash, and remediation queue", async () => {
    const audit = analyzeAuditProfile(project);
    const manifest = await createEvidenceManifest(project, audit, project.evidenceItems);
    const questions: CounselQuestion[] = [
      {
        id: "question-project-custody",
        projectId: project.id,
        question: "Who can approve wallet operations before launch?",
        relatedFlagId: "custody",
        priority: "P0",
        status: "open",
        source: "risk-rule",
        notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only."
      }
    ];
    const reviews: CounselReviewItem[] = [
      {
        id: "review-custody",
        projectId: project.id,
        flagId: "custody",
        title: "Custody or wallet control",
        severity: "critical",
        owner: "Compliance",
        priority: "P0",
        status: "needs-evidence",
        evidenceSummary: "0/2 evidence requirements covered",
        reviewer: "Outside counsel",
        reviewerNote: "Need signer control policy before review can close.",
        updatedAt: "2026-06-29T08:00:00.000Z",
        notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
      }
    ];
    const markdown = buildMarkdownCounselPack(project, audit, manifest, questions, reviews);

    expect(markdown).toContain("Not legal advice");
    expect(markdown).toContain(`Risk level: ${audit.riskLevel}`);
    expect(markdown).toContain(manifest.bundleHash);
    expect(markdown).toContain("## Counsel Questions");
    expect(markdown).toContain("- P0 open [custody] Who can approve wallet operations before launch?");
    expect(markdown).toContain("## Counsel Review Status");
    expect(markdown).toContain("- P0 needs-evidence [custody] Custody or wallet control");
    expect(markdown).toContain("reviewer: Outside counsel");
    expect(markdown).toContain("Need signer control policy before review can close.");
    expect(markdown).toContain("## Remediation Queue");
    expect(markdown).toContain(audit.remediation[0].action);
  });

  it("includes model intake profile, AI event review status, and event hashes when provided", async () => {
    const audit = analyzeAuditProfile(project);
    const manifest = await createEvidenceManifest(project, audit, project.evidenceItems);
    const profile: ModelConnectionProfile = {
      providerName: "OpenAI-compatible gateway",
      modelName: "gpt-audit-review",
      endpointType: "openai-compatible",
      useCase: "Evidence extraction and draft counsel questions",
      decisionRole: "human-review-support",
      dataClasses: ["evidence summaries", "policy metadata"],
      humanReviewOwner: "Compliance"
    };
    const events: AIEventRecord[] = [
      {
        id: "event-counsel-1",
        projectId: project.id,
        eventType: "Evidence review",
        inputSummary: "Review token terms and custody summary",
        outputSummary: "Drafted missing evidence question for wallet authority",
        modelAction: "Generated draft audit-prep questions",
        humanReviewer: "Compliance",
        reviewStatus: "needs-review",
        createdAt: "2026-06-29T08:30:00.000Z"
      }
    ];
    const summary = await buildModelIntakeSummary(profile, events);
    const markdown = buildMarkdownCounselPack(project, audit, manifest, [], [], {
      profile,
      events,
      summary
    });

    expect(markdown).toContain("## Model Intake Summary");
    expect(markdown).toContain("- Provider: OpenAI-compatible gateway");
    expect(markdown).toContain("- Model: gpt-audit-review");
    expect(markdown).toContain("- Use case: Evidence extraction and draft counsel questions");
    expect(markdown).toContain("- Human review owner: Compliance");
    expect(markdown).toContain("- Readiness: needs-review");
    expect(markdown).toContain("Event SHA-256");
    expect(markdown).toContain(summary.eventHashes[0].hash);
    expect(markdown).toContain("- needs-review Evidence review: Drafted missing evidence question for wallet authority");
    expect(markdown).toContain("Not legal advice");
  });

  it("includes Human Review timeline metadata without representing it as legal approval", async () => {
    const audit = analyzeAuditProfile(project);
    const manifest = await createEvidenceManifest(project, audit, project.evidenceItems);
    const timeline: HumanReviewTimelineEntry[] = [
      {
        timelineEntryVersion: "lexproof-human-review-timeline-entry-v1",
        id: "human-review-timeline-counsel-pack",
        projectId: project.id,
        targetType: "counsel-pack",
        targetId: "counsel-pack-version-1",
        title: "Counsel Yield Review Counsel Pack v1",
        action: "review.decision.saved",
        status: "reviewed",
        reviewer: "Outside counsel",
        decisionNote: "Reviewed export metadata for audit-prep handoff.",
        dueAt: "2026-07-02T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
        auditLogId: "human-review-audit-abc123def456",
        notLegalAdviceBoundary: "Not legal advice. Human review timeline entries are audit preparation metadata only."
      }
    ];
    const markdown = buildMarkdownCounselPack(project, audit, manifest, [], [], undefined, undefined, undefined, undefined, undefined, undefined, timeline);

    expect(markdown).toContain("## Human Review Timeline");
    expect(markdown).toContain("Not legal advice. Human review timeline entries are audit preparation metadata only.");
    expect(markdown).toContain("counsel-pack");
    expect(markdown).toContain("review.decision.saved");
    expect(markdown).toContain("reviewer: Outside counsel");
    expect(markdown).toContain("Reviewed export metadata for audit-prep handoff.");
    expect(markdown).toContain("human-review-audit-abc123def456");
    expect(markdown).not.toMatch(/\blegal approval\b/i);
  });

  it("includes regulatory source graph clauses, source review ledger, evidence gaps, and non-advice boundary when provided", async () => {
    const graphProject: ProjectProfile = {
      ...project,
      jurisdictions: ["European Union", "United Kingdom"],
      assetModel: "Tokenized private credit note with yield",
      userType: "Retail users",
      operatingStage: "Planned public launch",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(graphProject);
    const manifest = await createEvidenceManifest(graphProject, audit, graphProject.evidenceItems);
    const graph = createRegulatoryGraph(graphProject, audit, graphProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-07-15T00:00:00.000Z"
    });
    const markdown = buildMarkdownCounselPack(graphProject, audit, manifest, [], [], undefined, graph, undefined, undefined, sourceReview);

    expect(markdown).toContain("## Regulatory Source Graph");
    expect(markdown).toContain("## Source Review Ledger");
    expect(markdown).toContain("Not legal advice. Source review metadata is audit preparation lineage only.");
    expect(markdown).toContain("- Review cadence: 90 days");
    expect(markdown).toContain("next review 2026-09-28");
    expect(markdown).toContain("route interpretation to local counsel");
    expect(markdown).toContain("Regulation (EU) 2023/1114, Title II");
    expect(markdown).toContain("FCA PS23/6 and FG23/3");
    expect(markdown).toContain("Evidence gaps");
    expect(markdown).toContain("Not legal advice. Regulatory graph output is audit preparation material only.");
  });

  it("includes per-risk source citation controls in Markdown handoff without legal conclusions", async () => {
    const graphProject: ProjectProfile = {
      ...project,
      jurisdictions: ["United States", "European Union", "United Kingdom"],
      assetModel: "Tokenized private credit note with yield",
      userType: "Retail users and accredited investors",
      custodyModel: "Platform controls omnibus wallet",
      operatingStage: "Planned public launch",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(graphProject);
    const manifest = await createEvidenceManifest(graphProject, audit, graphProject.evidenceItems);
    const graph = createRegulatoryGraph(graphProject, audit, graphProject.evidenceItems);
    const citationControls = createRiskSourceCitationControls(audit, graph);

    const markdown = buildMarkdownCounselPack(
      graphProject,
      audit,
      manifest,
      [],
      [],
      undefined,
      graph,
      undefined,
      undefined,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      citationControls
    );

    expect(markdown).toContain("## Risk Source Citation Controls");
    expect(markdown).toContain("Not legal advice. Risk source citation controls are audit preparation source-lineage metadata only.");
    expect(markdown).toContain("- Risk flags with citation controls:");
    expect(markdown).toContain("Yield-bearing or investment-like asset");
    expect(markdown).toContain("Regulation (EU) 2023/1114, Title II");
    expect(markdown).toContain("17 C.F.R. 230.501(a), 230.506(c)");
    expect(markdown).toContain("Open citation evidence");
    expect(markdown).toContain("US private offering / securities counsel");
    expect(markdown).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal approval\b|raw KYC|private key/i);
  });

  it("includes source update approval gates in Markdown handoff when source approvals are open", async () => {
    const graphProject: ProjectProfile = {
      ...project,
      jurisdictions: ["European Union", "United Kingdom"],
      assetModel: "Tokenized private credit note with yield",
      userType: "Retail users",
      operatingStage: "Planned public launch",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(graphProject);
    const manifest = await createEvidenceManifest(graphProject, audit, graphProject.evidenceItems);
    const graph = createRegulatoryGraph(graphProject, audit, graphProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-01T00:00:00.000Z"
    });
    const sourceApprovalQueue = createRegulatorySourceApprovalQueue(sourceReview, {
      generatedAt: "2026-10-01T00:00:00.000Z"
    });

    const markdown = buildMarkdownCounselPack(
      graphProject,
      audit,
      manifest,
      [],
      [],
      undefined,
      graph,
      undefined,
      undefined,
      sourceReview,
      sourceApprovalQueue
    );

    expect(markdown).toContain("## Source Update Approval Queue");
    expect(markdown).toContain("Not legal advice. Source update approvals are audit preparation workflow metadata only.");
    expect(markdown).toContain("Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.");
    expect(markdown).toContain("- Queue status: needs-approval");
    expect(markdown).toContain(`- Queue hash: ${sourceApprovalQueue.queueHash}`);
    expect(markdown).toContain("- Approval required:");
    expect(markdown).toContain("approval-required");
    expect(markdown).toContain("Refresh and approve");
    expect(markdown).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
  });

  it("includes source freshness board scheduling metadata in Markdown handoff", async () => {
    const graphProject: ProjectProfile = {
      ...project,
      jurisdictions: ["European Union", "United Kingdom"],
      assetModel: "Tokenized private credit note with yield",
      userType: "Retail users",
      operatingStage: "Planned public launch",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(graphProject);
    const manifest = await createEvidenceManifest(graphProject, audit, graphProject.evidenceItems);
    const graph = createRegulatoryGraph(graphProject, audit, graphProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-01T00:00:00.000Z"
    });
    const sourceFreshnessBoard = await createSourceFreshnessBoard({
      sourceReview,
      asOf: "2026-10-01T00:00:00.000Z",
      generatedAt: "2026-10-01T00:00:00.000Z"
    });

    const markdown = buildMarkdownCounselPack(
      graphProject,
      audit,
      manifest,
      [],
      [],
      undefined,
      graph,
      undefined,
      undefined,
      sourceReview,
      undefined,
      [],
      undefined,
      undefined,
      sourceFreshnessBoard
    );

    expect(markdown).toContain("## Source Freshness Board");
    expect(markdown).toContain("Not legal advice. Source freshness boards are audit preparation scheduling metadata only.");
    expect(markdown).toContain(`- Board hash: ${sourceFreshnessBoard.boardHash}`);
    expect(markdown).toContain("- Board status: attention-needed");
    expect(markdown).toContain("- Overdue sources:");
    expect(markdown).toContain("- Due soon sources:");
    expect(markdown).toContain("Refresh");
    expect(markdown).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
  });

  it("includes jurisdiction readiness digest metadata in Markdown handoff without legal conclusions", async () => {
    const graphProject: ProjectProfile = {
      ...project,
      jurisdictions: ["European Union", "United Kingdom", "United States"],
      assetModel: "Tokenized private credit note with yield and public communications",
      userType: "Retail users and accredited investors",
      custodyModel: "Platform controls omnibus wallet",
      operatingStage: "Planned public launch before local counsel review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(graphProject);
    const manifest = await createEvidenceManifest(graphProject, audit, graphProject.evidenceItems);
    const graph = createRegulatoryGraph(graphProject, audit, graphProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-15T00:00:00.000Z"
    });
    const sourceFreshnessBoard = await createSourceFreshnessBoard({
      sourceReview,
      asOf: "2026-10-15T00:00:00.000Z",
      generatedAt: "2026-10-15T00:00:00.000Z"
    });
    const localCounselRoutingPlan = await createLocalCounselRoutingPlan({
      graph,
      sourceReview,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });
    const controlMatrix = createRegulatoryControlMatrix({
      graph,
      sourceReview,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });
    const evidenceMap = await createJurisdictionEvidenceMap({
      matrix: controlMatrix,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });
    const readinessDigest = await createJurisdictionReadinessDigest({
      evidenceMap,
      localCounselRoutingPlan,
      sourceFreshnessBoard,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });

    const markdown = buildMarkdownCounselPack(
      graphProject,
      audit,
      manifest,
      [],
      [],
      undefined,
      graph,
      undefined,
      undefined,
      sourceReview,
      undefined,
      [],
      undefined,
      localCounselRoutingPlan,
      sourceFreshnessBoard,
      undefined,
      [],
      readinessDigest
    );

    expect(markdown).toContain("## Jurisdiction Readiness Digest");
    expect(markdown).toContain("Not legal advice. Jurisdiction readiness digests are audit preparation workflow metadata only.");
    expect(markdown).toContain(`- Digest hash: ${readinessDigest.digestHash}`);
    expect(markdown).toContain("- Handoff allowed: no");
    expect(markdown).toContain("- Needs evidence:");
    expect(markdown).toContain("- Source freshness blockers:");
    expect(markdown).toContain("United States");
    expect(markdown).toContain("European Union");
    expect(markdown).toContain("US private offering / securities counsel");
    expect(markdown).toContain("Prepare");
    expect(markdown).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b|raw KYC|private key/i);
  });

  it("includes local counsel routing plan metadata in Markdown handoff without legal conclusions", async () => {
    const graphProject: ProjectProfile = {
      ...project,
      jurisdictions: ["European Union", "United Kingdom", "United States"],
      assetModel: "Tokenized private credit note with yield and public communications",
      userType: "Retail users and accredited investors",
      custodyModel: "Platform controls omnibus wallet",
      operatingStage: "Planned public launch before local counsel review",
      evidenceItems: []
    };
    const audit = analyzeAuditProfile(graphProject);
    const manifest = await createEvidenceManifest(graphProject, audit, graphProject.evidenceItems);
    const graph = createRegulatoryGraph(graphProject, audit, graphProject.evidenceItems);
    const sourceReview = createRegulatorySourceReview(graph, {
      asOf: "2026-10-15T00:00:00.000Z"
    });
    const localCounselRoutingPlan = await createLocalCounselRoutingPlan({
      graph,
      sourceReview,
      generatedAt: "2026-10-15T00:00:00.000Z"
    });

    const markdown = buildMarkdownCounselPack(
      graphProject,
      audit,
      manifest,
      [],
      [],
      undefined,
      graph,
      undefined,
      undefined,
      sourceReview,
      undefined,
      [],
      undefined,
      localCounselRoutingPlan
    );

    expect(markdown).toContain("## Local Counsel Routing Plan");
    expect(markdown).toContain("Not legal advice. Local counsel routing plans are audit preparation workflow metadata only.");
    expect(markdown).toContain(localCounselRoutingPlan.planHash);
    expect(markdown).toContain("US private offering / securities counsel");
    expect(markdown).toContain("UK financial promotion / crypto counsel");
    expect(markdown).toContain("Prepare missing evidence for local counsel review.");
    expect(markdown).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b|raw KYC|private key/i);
  });

  it("includes evidence recertification queue metadata without raw evidence content", async () => {
    const staleProject: ProjectProfile = {
      ...project,
      evidenceItems: [
        {
          id: "claims-inventory",
          label: "Claims inventory",
          kind: "CSV",
          content: "Synthetic claim rows plus raw working notes that must not enter the Counsel Pack recertification section.",
          source: "regulatory control: control-uae-vara-marketing-approval; risk evidence requirement: marketing-claims",
          status: "verified",
          owner: "Compliance",
          updatedAt: "2026-01-01T00:00:00.000Z"
        }
      ]
    };
    const audit = analyzeAuditProfile(staleProject);
    const manifest = await createEvidenceManifest(staleProject, audit, staleProject.evidenceItems);
    const recertificationQueue = await createEvidenceRecertificationQueue({
      workspaceId: staleProject.id,
      evidenceItems: staleProject.evidenceItems,
      generatedAt: "2026-07-01T00:00:00.000Z"
    });

    const markdown = buildMarkdownCounselPack(
      staleProject,
      audit,
      manifest,
      [],
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [],
      recertificationQueue
    );

    expect(markdown).toContain("## Evidence Recertification Queue");
    expect(markdown).toContain("Not legal advice. Evidence recertification queues are audit preparation workflow metadata only.");
    expect(markdown).toContain(`- Queue hash: ${recertificationQueue.queueHash}`);
    expect(markdown).toContain("- Status: needs-recertification");
    expect(markdown).toContain("- P0 Claims inventory");
    expect(markdown).toContain("control-uae-vara-marketing-approval");
    expect(markdown).toContain("Recertify source-linked evidence before counsel/export reliance.");
    expect(markdown).not.toContain("raw working notes");
  });

  it("includes Evidence Vault control coverage readiness in Markdown handoff without legal conclusions", async () => {
    const audit = analyzeAuditProfile(project);
    const manifest = await createEvidenceManifest(project, audit, project.evidenceItems);
    const coverage: EvidenceVaultControlCoverage = {
      coverageVersion: "lexproof-evidence-vault-control-coverage-v1",
      controlCount: 2,
      recordCount: 3,
      manifestItemCount: 2,
      controls: [
        {
          controlId: "control-eu-mica-title-ii-white-paper",
          evidenceRecordCount: 1,
          manifestItemCount: 1,
          readiness: "needs-review",
          nextAction: "Move linked vault evidence through Human Review before export reliance.",
          statuses: ["requested"],
          filenames: ["lineage-digest-vault-memo.metadata.json"]
        },
        {
          controlId: "control-uae-vara-marketing-approval",
          evidenceRecordCount: 2,
          manifestItemCount: 1,
          readiness: "needs-manifest-link",
          nextAction: "Regenerate the Evidence Vault manifest so this control has hash lineage.",
          statuses: ["received", "verified"],
          filenames: ["claims-inventory.metadata.json", "approval-log.metadata.json"]
        }
      ],
      notLegalAdviceBoundary: "Not legal advice. Evidence Vault control coverage is audit preparation metadata only."
    };

    const markdown = buildMarkdownCounselPack(
      project,
      audit,
      manifest,
      [],
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      coverage
    );

    expect(markdown).toContain("## Evidence Vault Control Coverage");
    expect(markdown).toContain("Not legal advice. Evidence Vault control coverage is audit preparation metadata only.");
    expect(markdown).toContain("- Controls: 2");
    expect(markdown).toContain("control-eu-mica-title-ii-white-paper: needs-review");
    expect(markdown).toContain("Move linked vault evidence through Human Review before export reliance.");
    expect(markdown).toContain("control-uae-vara-marketing-approval: needs-manifest-link");
    expect(markdown).toContain("Regenerate the Evidence Vault manifest so this control has hash lineage.");
    expect(markdown).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal approval\b/i);
  });

  it("includes a data boundary report and does not leak blocked export materials", async () => {
    const unsafeProject: ProjectProfile = {
      ...project,
      evidenceItems: [
        {
          id: "unsafe-export",
          label: "Unsafe export packet",
          kind: "Text",
          content:
            "Developer note includes private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa and sk-live-abcdef1234567890.",
          status: "draft",
          owner: "Engineering"
        }
      ]
    };
    const audit = analyzeAuditProfile(unsafeProject);
    const manifest = await createEvidenceManifest(unsafeProject, audit, unsafeProject.evidenceItems);
    const dataBoundaryReport = createDataBoundaryReport({
      project: unsafeProject,
      evidenceItems: unsafeProject.evidenceItems,
      counselQuestions: [],
      counselReviews: [],
      aiEvents: []
    });
    const markdown = buildMarkdownCounselPack(
      unsafeProject,
      audit,
      manifest,
      [],
      [],
      undefined,
      undefined,
      undefined,
      dataBoundaryReport
    );

    expect(markdown).toContain("## Data Boundary Report");
    expect(markdown).toContain("Not legal advice");
    expect(markdown).toContain("- Export status: blocked");
    expect(markdown).toContain("private-key-material");
    expect(markdown).toContain("credential-material");
    expect(markdown).toContain("Remove or replace blocked materials");
    expect(markdown).not.toContain("0xaaaaaaaa");
    expect(markdown).not.toContain("sk-live-abcdef");
  });
});

describe("downloadMarkdownFile", () => {
  it("downloads Markdown content through a browser Blob", () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:lexproof");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadMarkdownFile("counsel-pack.md", "# Counsel Pack");

      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:lexproof");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });
});

describe("buildPrintableCounselPackHtml", () => {
  it("wraps counsel pack Markdown in printable HTML and escapes unsafe content", () => {
    const html = buildPrintableCounselPackHtml(
      "Counsel Pack <Draft>",
      "# Counsel Pack\n\nNot legal advice.\n\n<script>alert('x')</script>"
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Counsel Pack &lt;Draft&gt;");
    expect(html).toContain("Not legal advice.");
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert");
  });
});

describe("printCounselPackPdf", () => {
  it("opens a printable counsel pack window for browser Save as PDF", () => {
    const originalOpen = window.open;
    const fakeWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn()
      },
      focus: vi.fn(),
      print: vi.fn()
    };
    window.open = vi.fn(() => fakeWindow as unknown as Window);

    try {
      printCounselPackPdf("YieldPassport counsel pack", "# Counsel Pack\n\nNot legal advice.");

      expect(window.open).toHaveBeenCalledWith("", "_blank", "width=960,height=720");
      expect(fakeWindow.document.open).toHaveBeenCalledTimes(1);
      expect(fakeWindow.document.write).toHaveBeenCalledWith(expect.stringContaining("Not legal advice."));
      expect(fakeWindow.document.close).toHaveBeenCalledTimes(1);
      expect(fakeWindow.focus).toHaveBeenCalledTimes(1);
      expect(fakeWindow.print).toHaveBeenCalledTimes(1);
    } finally {
      window.open = originalOpen;
    }
  });
});
