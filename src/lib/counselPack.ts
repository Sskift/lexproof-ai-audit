import type { AuditResult } from "./auditEngine";
import type { CounselReviewItem } from "./counselReview";
import type { CounselQuestion } from "./counselQuestions";
import type { CounselPackTemplate } from "./counselPackTemplates";
import { redactDataBoundaryText, summarizeDataBoundaryForExport, type DataBoundaryReport } from "./dataBoundary";
import type { EvidenceRecertificationQueue } from "./evidenceRecertification";
import type { EvidenceManifest } from "./evidenceManifest";
import type { EvidenceVaultControlCoverage } from "./evidenceVaultControlCoverage";
import type { HumanReviewTimelineEntry } from "./humanReviewWorkflow";
import type { LocalCounselRoutingPlan } from "./localCounselRouting";
import type { AIEventRecord, ModelConnectionProfile, ModelIntakeSummary } from "./modelIntake";
import type { ProjectProfile } from "./projectModel";
import type { RegulatoryGraph } from "./regulatoryGraph";
import type { RegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import type { RegulatorySourceReview } from "./regulatorySourceReview";
import type { SourceFreshnessBoard } from "./sourceFreshnessBoard";

export type CounselPackModelIntake = {
  profile: ModelConnectionProfile;
  events: AIEventRecord[];
  summary: ModelIntakeSummary;
};

export function buildMarkdownCounselPack(
  project: ProjectProfile,
  audit: AuditResult,
  manifest: EvidenceManifest,
  counselQuestions: CounselQuestion[] = [],
  counselReviews: CounselReviewItem[] = [],
  modelIntake?: CounselPackModelIntake,
  regulatoryGraph?: RegulatoryGraph,
  exportTemplate?: CounselPackTemplate,
  dataBoundaryReport?: DataBoundaryReport,
  regulatorySourceReview?: RegulatorySourceReview,
  regulatorySourceApprovalQueue?: RegulatorySourceApprovalQueue,
  humanReviewTimeline: HumanReviewTimelineEntry[] = [],
  evidenceRecertificationQueue?: EvidenceRecertificationQueue,
  localCounselRoutingPlan?: LocalCounselRoutingPlan,
  sourceFreshnessBoard?: SourceFreshnessBoard,
  evidenceVaultControlCoverage?: EvidenceVaultControlCoverage
): string {
  const flags = audit.flags.map((flag) => `- [${flag.severity}] ${safe(flag.title)}: ${safe(flag.rationale)}`).join("\n");
  const remediation = audit.remediation.map((item) => `- ${item.priority} ${safe(item.owner)}: ${safe(item.action)}`).join("\n");
  const evidence = manifest.items
    .map((item) => `- ${item.sequence}. ${safe(item.label)} (${safe(item.kind)}, ${safe(item.status)}) — ${item.contentHash}`)
    .join("\n");
  const questions = counselQuestions
    .map((item) => `- ${item.priority} ${item.status} [${safe(item.relatedFlagId ?? item.source)}] ${safe(item.question)}`)
    .join("\n");
  const reviews = counselReviews.map(formatReviewItem).join("\n");
  const modelIntakeSection = modelIntake ? formatModelIntakeSection(modelIntake) : "";
  const regulatoryGraphSection = regulatoryGraph ? formatRegulatoryGraphSection(regulatoryGraph) : "";
  const sourceReviewSection = regulatorySourceReview ? formatRegulatorySourceReviewSection(regulatorySourceReview) : "";
  const sourceFreshnessBoardSection = sourceFreshnessBoard ? formatSourceFreshnessBoardSection(sourceFreshnessBoard) : "";
  const localCounselRoutingSection =
    localCounselRoutingPlan && localCounselRoutingPlan.routeCount > 0
      ? formatLocalCounselRoutingPlanSection(localCounselRoutingPlan)
      : "";
  const sourceApprovalSection =
    regulatorySourceApprovalQueue && regulatorySourceApprovalQueue.totalItemCount > 0
      ? formatRegulatorySourceApprovalQueueSection(regulatorySourceApprovalQueue)
      : "";
  const humanReviewSection = humanReviewTimeline.length > 0 ? formatHumanReviewTimelineSection(humanReviewTimeline) : "";
  const evidenceVaultControlCoverageSection =
    evidenceVaultControlCoverage && evidenceVaultControlCoverage.controlCount > 0
      ? formatEvidenceVaultControlCoverageSection(evidenceVaultControlCoverage)
      : "";
  const recertificationSection =
    evidenceRecertificationQueue && evidenceRecertificationQueue.summary.totalActionCount > 0
      ? formatEvidenceRecertificationQueueSection(evidenceRecertificationQueue)
      : "";
  const exportTemplateSection = exportTemplate ? formatExportTemplateSection(exportTemplate) : "";
  const dataBoundarySection = dataBoundaryReport ? summarizeDataBoundaryForExport(dataBoundaryReport) : "";
  const sources = audit.sourcePack.map((source) => `- ${safe(source.title)}: ${source.url}`).join("\n");

  return [
    `# ${safe(project.projectName)} Counsel Pack`,
    "",
    "Not legal advice. This document is audit preparation material for counsel and compliance review.",
    "",
    "## Project Profile",
    `- Entity type: ${safe(project.entityType)}`,
    `- Jurisdictions: ${safe(project.jurisdictions.join(", "))}`,
    `- Asset model: ${safe(project.assetModel)}`,
    `- User exposure: ${safe(project.userType)}`,
    `- Custody model: ${safe(project.custodyModel)}`,
    `- Data boundary: ${safe(project.dataSensitivity)}`,
    `- AI usage: ${safe(project.aiUsage)}`,
    `- Blockchain use: ${safe(project.blockchainUse)}`,
    `- Operating stage: ${safe(project.operatingStage)}`,
    "",
    "## Risk Summary",
    `- Risk level: ${audit.riskLevel}`,
    `- Risk score: ${audit.score}/100`,
    `- Manifest bundle SHA-256: ${manifest.bundleHash}`,
    "",
    ...(exportTemplateSection ? ["## Export Template", exportTemplateSection, ""] : []),
    ...(dataBoundarySection ? ["## Data Boundary Report", dataBoundarySection, ""] : []),
    "## Risk Flags",
    flags || "- No material flags detected in the current facts.",
    "",
    "## Counsel Questions",
    questions || "- No counsel questions have been added yet.",
    "",
    "## Counsel Review Status",
    reviews || "- No counsel review statuses have been generated yet.",
    "",
    ...(regulatoryGraphSection ? ["## Regulatory Source Graph", regulatoryGraphSection, ""] : []),
    ...(sourceReviewSection ? ["## Source Review Ledger", sourceReviewSection, ""] : []),
    ...(sourceFreshnessBoardSection ? ["## Source Freshness Board", sourceFreshnessBoardSection, ""] : []),
    ...(localCounselRoutingSection ? ["## Local Counsel Routing Plan", localCounselRoutingSection, ""] : []),
    ...(sourceApprovalSection ? ["## Source Update Approval Queue", sourceApprovalSection, ""] : []),
    ...(humanReviewSection ? ["## Human Review Timeline", humanReviewSection, ""] : []),
    ...(evidenceVaultControlCoverageSection ? ["## Evidence Vault Control Coverage", evidenceVaultControlCoverageSection, ""] : []),
    ...(recertificationSection ? ["## Evidence Recertification Queue", recertificationSection, ""] : []),
    ...(modelIntakeSection ? ["## Model Intake Summary", modelIntakeSection, ""] : []),
    "## Remediation Queue",
    remediation,
    "",
    "## Evidence Manifest",
    `- Manifest version: ${manifest.manifestVersion}`,
    `- Generated at: ${manifest.generatedAt}`,
    `- Evidence item count: ${manifest.itemCount}`,
    evidence || "- No evidence items have been added yet.",
    "",
    "## Source Pack",
    sources
  ].join("\n");
}

function formatEvidenceVaultControlCoverageSection(coverage: EvidenceVaultControlCoverage): string {
  const controls = coverage.controls
    .map(
      (control) =>
        `- ${safe(control.controlId)}: ${control.readiness}; ${control.evidenceRecordCount} vault records; ${
          control.manifestItemCount
        } manifest items; statuses: ${safe(control.statuses.join(", ") || "not synced")}; evidence: ${safe(
          control.filenames.join(", ") || "no filenames"
        )}; next action: ${safe(control.nextAction)}`
    )
    .join("\n");

  return [
    coverage.notLegalAdviceBoundary,
    `- Coverage version: ${coverage.coverageVersion}`,
    `- Controls: ${coverage.controlCount}`,
    `- Vault records: ${coverage.recordCount}`,
    `- Manifest items: ${coverage.manifestItemCount}`,
    "",
    "### Control Readiness",
    controls || "- No Evidence Vault control coverage records are available yet."
  ].join("\n");
}

function formatSourceFreshnessBoardSection(board: SourceFreshnessBoard): string {
  const laneLines = board.lanes
    .map((lane) => {
      const items = lane.items
        .slice(0, 4)
        .map(
          (item) =>
            `  - ${item.priority} ${safe(item.jurisdiction)} [${safe(item.citation)}] ${safe(
              item.nextAction
            )} Last reviewed ${safe(item.lastReviewedAt || "metadata missing")}; next review ${safe(
              item.nextReviewDueAt || "metadata missing"
            )}.`
        )
        .join("\n");
      return [`- ${safe(lane.label)}: ${lane.itemCount}`, items || "  - No source records in this lane."].join("\n");
    })
    .join("\n");

  return [
    board.notLegalAdviceBoundary,
    `- Board status: ${board.status}`,
    `- Board hash: ${board.boardHash}`,
    `- As of: ${safe(board.asOf)}`,
    `- Due soon window: ${board.dueSoonDays} days`,
    `- Total sources: ${board.totalSourceCount}`,
    `- Metadata missing sources: ${board.metadataMissingCount}`,
    `- Overdue sources: ${board.overdueCount}`,
    `- Due soon sources: ${board.dueSoonCount}`,
    `- Scheduled sources: ${board.scheduledCount}`,
    "",
    "### Source Freshness Lanes",
    laneLines || "- No source review records matched current facts."
  ].join("\n");
}

function formatLocalCounselRoutingPlanSection(plan: LocalCounselRoutingPlan): string {
  const routes = plan.routes
    .map((route) => {
      const gaps = route.evidenceGapTitles.slice(0, 3).join("; ") || "none";
      const questions = route.counselQuestions.slice(0, 2).join(" / ") || "none";
      return `- ${route.priority} ${route.status} ${safe(route.jurisdiction)}: ${safe(
        route.localCounselRole
      )}; source review: ${route.sourceReviewStatus}; clauses: ${safe(route.matchedClauseIds.join(", "))}; evidence gaps: ${
        route.evidenceGapCount
      } (${safe(gaps)}); questions: ${safe(questions)}; ${safe(route.nextAction)}`;
    })
    .join("\n");

  return [
    plan.notLegalAdviceBoundary,
    `- Plan hash: ${plan.planHash}`,
    `- Route count: ${plan.routeCount}`,
    `- Priority summary: P0 ${plan.prioritySummary.P0}; P1 ${plan.prioritySummary.P1}; P2 ${plan.prioritySummary.P2}`,
    "",
    "### Local Counsel Routes",
    routes || "- No local counsel routing actions are open."
  ].join("\n");
}

function formatHumanReviewTimelineSection(entries: HumanReviewTimelineEntry[]): string {
  const orderedEntries = [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 12);
  const decisionCount = entries.filter((entry) => entry.action === "review.decision.saved").length;
  const openCount = entries.filter((entry) => entry.status !== "reviewed" && entry.status !== "rejected").length;
  const lines = orderedEntries
    .map((entry) => {
      const reviewer = safe(entry.reviewer.trim() || "unassigned");
      const note = entry.decisionNote.trim() ? `; note: ${safe(entry.decisionNote.trim())}` : "";
      return `- ${entry.status} ${entry.targetType} [${entry.action}] ${safe(entry.title)}; reviewer: ${reviewer}; due ${safe(
        formatDate(entry.dueAt)
      )}; audit log: ${safe(entry.auditLogId)}${note}`;
    })
    .join("\n");

  return [
    "Not legal advice. Human review timeline entries are audit preparation metadata only.",
    `- Timeline entries: ${entries.length}`,
    `- Saved decisions: ${decisionCount}`,
    `- Open workflow items: ${openCount}`,
    "",
    "### Human Review Entries",
    lines || "- No human review timeline entries have been created yet."
  ].join("\n");
}

function formatRegulatorySourceApprovalQueueSection(queue: RegulatorySourceApprovalQueue): string {
  const approvalGate =
    queue.items[0]?.approvalGate ??
    "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.";
  const items = queue.items
    .map(
      (item) =>
        `- ${item.priority} ${item.approvalStatus} ${safe(item.jurisdiction)} [${safe(item.citation)}] ${safe(item.nextAction)} ${safe(item.approvalGate)} Last reviewed ${safe(item.lastReviewedAt)}; next review ${safe(item.nextReviewDueAt)}. Source: ${item.sourceUrl}`
    )
    .join("\n");

  return [
    queue.notLegalAdviceBoundary,
    `- Queue status: ${queue.status}`,
    `- Approval required: ${queue.approvalRequiredCount}`,
    `- Metadata required: ${queue.metadataRequiredCount}`,
    `- Open gates: ${queue.totalItemCount}`,
    `- Generated at: ${queue.generatedAt}`,
    `- Approval gate: ${safe(approvalGate)}`,
    "",
    "### Source Approval Actions",
    items || "- No source update approval actions are open."
  ].join("\n");
}

function formatExportTemplateSection(template: CounselPackTemplate): string {
  const agenda = template.reviewAgenda.map((item) => `- ${safe(item)}`).join("\n");
  const evidenceFocus = template.evidenceFocus.map((item) => `- ${safe(item)}`).join("\n");
  const assumptionChecks = template.assumptionChecks.map((item) => `- ${safe(item)}`).join("\n");

  return [
    template.notLegalAdviceBoundary,
    `- Template: ${safe(template.title)}`,
    `- Focus: ${safe(template.summary)}`,
    "",
    "### Template Review Agenda",
    agenda,
    "",
    "### Template Evidence Focus",
    evidenceFocus,
    "",
    "### Template Assumption Checks",
    assumptionChecks
  ].join("\n");
}

function formatRegulatorySourceReviewSection(review: RegulatorySourceReview): string {
  const items = review.items
    .map(
      (item) =>
        `- ${item.reviewStatus} ${safe(item.jurisdiction)} [${safe(item.citation)}] last reviewed ${safe(item.lastReviewedAt)}; next review ${safe(item.nextReviewDueAt)}; Source: ${item.sourceUrl}; notes: ${safe(item.reviewerNotes)}`
    )
    .join("\n");
  const actions = review.actions
    .map((action) => `- ${action.priority} [${safe(action.clauseId)}] ${safe(action.action)} Source: ${action.sourceUrl}`)
    .join("\n");

  return [
    review.notLegalAdviceBoundary,
    `- Review status: ${review.status}`,
    `- Review cadence: ${review.reviewWindowDays} days`,
    `- Reviewed sources: ${review.currentSourceCount}/${review.totalSourceCount}`,
    `- Review due: ${review.reviewDueCount}`,
    `- Metadata gaps: ${review.metadataMissingCount}`,
    "",
    "### Source Review Records",
    items || "- No source review records matched current facts.",
    "",
    "### Source Refresh Actions",
    actions || "- No source metadata refresh actions currently open."
  ].join("\n");
}

function formatRegulatoryGraphSection(graph: RegulatoryGraph): string {
  const summaries = graph.jurisdictionSummaries
    .map(
      (summary) =>
        `- ${safe(summary.jurisdiction)}: ${summary.readiness}; ${summary.matchedClauseCount} source triggers; ${summary.missingEvidenceCount} Evidence gaps; local counsel: ${safe(summary.localCounselRole)}`
    )
    .join("\n");
  const clauses = graph.matchedClauses
    .map(
      (clause) =>
        `- ${safe(clause.jurisdiction)} ${clause.coverageStatus} [${safe(clause.citation)}] ${safe(clause.summary)} Source: ${clause.sourceUrl}`
    )
    .join("\n");
  const gaps = graph.evidenceGaps
    .map((gap) => `- ${gap.priority} ${safe(gap.jurisdiction)} [${safe(gap.citation)}] ${safe(gap.title)}: ${safe(gap.reason)}`)
    .join("\n");
  const actions = graph.topActions.map((action) => `- ${action.priority} ${safe(action.jurisdiction)}: ${safe(action.action)}`).join("\n");

  return [
    graph.notLegalAdviceBoundary,
    `- Graph version: ${graph.graphVersion}`,
    `- Matched source triggers: ${graph.matchedClauses.length}`,
    `- Evidence gaps: ${graph.evidenceGaps.length}`,
    "",
    "### Jurisdiction Readiness",
    summaries || "- No jurisdiction summaries generated.",
    "",
    "### Matched Source Clauses",
    clauses || "- No regulatory source triggers matched current facts.",
    "",
    "### Evidence gaps",
    gaps || "- No regulatory source evidence gaps currently open.",
    "",
    "### Regulatory Action Queue",
    actions || "- No regulatory source actions currently open."
  ].join("\n");
}

function formatModelIntakeSection({ profile, events, summary }: CounselPackModelIntake): string {
  const eventHashes = new Map(summary.eventHashes.map((item) => [item.eventId, item.hash]));
  const eventLines = events
    .map((event) => {
      const eventHash = eventHashes.get(event.id) ?? "pending";
      const reviewer = safe(event.humanReviewer.trim() || "unassigned");
      return `- ${event.reviewStatus} ${safe(event.eventType)}: ${safe(event.outputSummary || "No output summary recorded.")} (reviewer: ${reviewer}; Event SHA-256: ${eventHash})`;
    })
    .join("\n");
  const blockers = summary.blockers.map((blocker) => `- ${safe(blocker)}`).join("\n");
  const checklist = summary.handoffChecklist.map((item) => `- ${safe(item)}`).join("\n");

  return [
    `- Provider: ${safe(profile.providerName)}`,
    `- Model: ${safe(profile.modelName)}`,
    `- Endpoint type: ${profile.endpointType}`,
    `- Use case: ${safe(profile.useCase)}`,
    `- Decision role: ${profile.decisionRole}`,
    `- Allowed data classes: ${safe(profile.dataClasses.join(", ") || "none recorded")}`,
    `- Human review owner: ${safe(profile.humanReviewOwner)}`,
    `- Readiness: ${summary.readiness}`,
    `- AI event count: ${summary.eventCount}`,
    `- Unresolved AI events: ${summary.unresolvedEventCount}`,
    "",
    "### Model Intake Handoff Checklist",
    checklist || "- No handoff checklist items generated.",
    "",
    "### Model Intake Blockers",
    blockers || "- No blockers recorded.",
    "",
    "### AI Event Records",
    eventLines || "- No AI event records have been added yet.",
    "",
    summary.notLegalAdviceBoundary
  ].join("\n");
}

function formatEvidenceRecertificationQueueSection(queue: EvidenceRecertificationQueue): string {
  const items = queue.items
    .map(
      (item) =>
        `- ${item.priority} ${safe(item.evidenceLabel)} (${safe(item.evidenceStatus)}, ${safe(item.owner)}) due ${safe(
          formatDate(item.dueAt)
        )}; age ${item.ageDays} days; controls: ${safe(item.linkedControlIds.join(", ") || "none")}; ${safe(item.nextAction)}`
    )
    .join("\n");

  return [
    queue.notLegalAdviceBoundary,
    `- Status: ${queue.status}`,
    `- Queue hash: ${queue.queueHash}`,
    `- Actions: ${queue.summary.totalActionCount}`,
    `- Overdue: ${queue.summary.overdueCount}`,
    `- Expiring: ${queue.summary.expiringCount}`,
    `- Source-linked: ${queue.summary.sourceLinkedCount}`,
    "",
    "### Recertification Actions",
    items || "- No evidence recertification actions are open."
  ].join("\n");
}

function formatReviewItem(item: CounselReviewItem): string {
  const reviewer = safe(item.reviewer.trim() || "unassigned");
  const note = item.reviewerNote.trim() ? `\n  - note: ${safe(item.reviewerNote.trim())}` : "";
  return `- ${item.priority} ${item.status} [${safe(item.flagId)}] ${safe(item.title)} (${safe(item.owner)}; ${safe(item.evidenceSummary)}; reviewer: ${reviewer})${note}`;
}

function safe(value: string): string {
  return redactDataBoundaryText(value);
}

function formatDate(value: string): string {
  return value.slice(0, 10);
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildPrintableCounselPackHtml(title: string, markdown: string): string {
  const safeTitle = escapeHtml(title);
  const safeMarkdown = escapeHtml(markdown);

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${safeTitle}</title>`,
    "<style>",
    ":root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
    "body { margin: 0; background: #f7faf9; color: #1c2b2f; }",
    "main { max-width: 860px; margin: 0 auto; padding: 32px; background: #ffffff; min-height: 100vh; }",
    "h1 { margin: 0 0 8px; font-size: 22px; }",
    ".boundary { margin: 0 0 20px; color: #596b70; font-size: 13px; }",
    "pre { white-space: pre-wrap; overflow-wrap: anywhere; font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }",
    "@media print { body { background: #ffffff; } main { padding: 0; max-width: none; } button { display: none; } }",
    "</style>",
    "</head>",
    "<body>",
    "<main>",
    `<h1>${safeTitle}</h1>`,
    '<p class="boundary">Not legal advice. Browser print output is audit preparation material for counsel and compliance review.</p>',
    `<pre>${safeMarkdown}</pre>`,
    "</main>",
    "</body>",
    "</html>"
  ].join("");
}

export function printCounselPackPdf(title: string, markdown: string): void {
  const printWindow = window.open("", "_blank", "width=960,height=720");
  if (!printWindow) {
    throw new Error("Unable to open counsel pack print window.");
  }

  try {
    printWindow.opener = null;
  } catch {
    // Some browsers expose opener as read-only for this window mode.
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintableCounselPackHtml(title, markdown));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
