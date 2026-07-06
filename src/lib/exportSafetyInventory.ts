import type { AuditLogExportRecord } from "./auditLogExport";
import type { DataBoundaryReport } from "./dataBoundary";
import { redactDataBoundaryText } from "./dataBoundary";
import type {
  DemoApiPreflight,
  DemoReadinessCheckStatus,
  DemoReadinessStatus,
  DemoSmokeChecklistSummary
} from "./demoReadiness";
import type { EvidenceRecertificationQueue } from "./evidenceRecertification";
import type { EvidenceVaultLineageDigest } from "./evidenceVaultLineageDigest";
import type { ModelGatewayEvaluationRecord } from "./modelGatewayEvaluation";
import type { RegulatorySourceApprovalQueue } from "./regulatorySourceApproval";
import type { SourceFreshnessBoard } from "./sourceFreshnessBoard";

export type ExportSafetyArtifactCategory =
  | "evidence"
  | "counsel-export"
  | "model-governance"
  | "source-lineage"
  | "review-workflow"
  | "integration-readiness"
  | "submission"
  | "security";

export type ExportSafetyExportMode = "metadata-only-json" | "audit-prep-markdown" | "browser-print-pdf" | "simulated-receipt-json";

export type ExportSafetyArtifactStatus = "ready" | "needs-review" | "needs-action" | "blocked";

export type ExportSafetyInventoryStatus = "ready" | "needs-review" | "needs-action" | "blocked";

export type ExportSafetyArtifactInput = {
  id: string;
  label: string;
  category: ExportSafetyArtifactCategory;
  exportMode: ExportSafetyExportMode;
  required: boolean;
  available: boolean;
  artifactHash?: string;
  metadataOnly: boolean;
  rawContentIncluded: boolean;
  warnings?: string[];
  blockers?: string[];
  recoveryAction: string;
  notLegalAdviceBoundary: string;
};

export type ExportSafetyInventoryArtifact = {
  id: string;
  label: string;
  category: ExportSafetyArtifactCategory;
  exportMode: ExportSafetyExportMode;
  status: ExportSafetyArtifactStatus;
  required: boolean;
  available: boolean;
  artifactHash?: string;
  metadataOnly: boolean;
  rawContentIncluded: boolean;
  blockers: string[];
  warnings: string[];
  recoveryAction: string;
  notLegalAdviceBoundary: string;
};

export type ExportSafetyInventory = {
  inventoryVersion: "lexproof-export-safety-inventory-v1";
  workspaceId: string;
  projectName: string;
  generatedAt: string;
  inventoryHash: string;
  overallStatus: ExportSafetyInventoryStatus;
  exportHandoffAllowed: boolean;
  artifactCount: number;
  readyCount: number;
  needsReviewCount: number;
  missingRequiredCount: number;
  blockedCount: number;
  boundaryStatus: DataBoundaryReport["status"];
  boundaryBlockerCount: number;
  boundaryWarningCount: number;
  detectedClasses: DataBoundaryReport["detectedClasses"];
  artifacts: ExportSafetyInventoryArtifact[];
  blockers: string[];
  nextActions: string[];
  notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only.";
};

export type CreateExportSafetyInventoryInput = {
  workspaceId: string;
  projectName: string;
  dataBoundaryReport: DataBoundaryReport;
  artifacts: ExportSafetyArtifactInput[];
  generatedAt?: string;
};

export type ExportSafetyDemoRunbookSummary = {
  runbookHash?: string;
  status?: DemoReadinessStatus;
  apiPreflightStatus?: DemoReadinessCheckStatus;
  scenarioCount?: number;
  screenshotCount?: number;
  notLegalAdviceBoundary?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only." as const;
const API_PREFLIGHT_EXPORT_BOUNDARY =
  "Not legal advice. API preflight reports are audit preparation readiness metadata only.";

export async function createExportSafetyInventory({
  workspaceId,
  projectName,
  dataBoundaryReport,
  artifacts,
  generatedAt = new Date().toISOString()
}: CreateExportSafetyInventoryInput): Promise<ExportSafetyInventory> {
  const normalizedArtifacts = artifacts.map((artifact) => normalizeArtifact(artifact, dataBoundaryReport)).sort(compareArtifact);
  const readyCount = normalizedArtifacts.filter((artifact) => artifact.status === "ready").length;
  const needsReviewCount = normalizedArtifacts.filter((artifact) => artifact.status === "needs-review").length;
  const missingRequiredCount = normalizedArtifacts.filter((artifact) => artifact.required && artifact.status === "needs-action").length;
  const blockedCount = normalizedArtifacts.filter((artifact) => artifact.status === "blocked").length;
  const blockers = collectBlockers(normalizedArtifacts, dataBoundaryReport);
  const nextActions = createNextActions(normalizedArtifacts, dataBoundaryReport);
  const overallStatus = createOverallStatus({ blockedCount, missingRequiredCount, needsReviewCount, boundaryStatus: dataBoundaryReport.status });
  const hashPayload = {
    inventoryVersion: "lexproof-export-safety-inventory-v1",
    workspaceId: sanitize(workspaceId),
    projectName: sanitize(projectName),
    overallStatus,
    boundaryStatus: dataBoundaryReport.status,
    boundaryBlockerCount: dataBoundaryReport.blockerCount,
    boundaryWarningCount: dataBoundaryReport.warningCount,
    detectedClasses: dataBoundaryReport.detectedClasses.slice().sort(),
    artifacts: normalizedArtifacts,
    blockers,
    nextActions,
    exportHandoffAllowed: blockedCount === 0 && missingRequiredCount === 0 && dataBoundaryReport.exportAllowed
  };

  return {
    inventoryVersion: "lexproof-export-safety-inventory-v1",
    workspaceId: sanitize(workspaceId),
    projectName: sanitize(projectName),
    generatedAt,
    inventoryHash: await sha256Hex(stableStringify(hashPayload)),
    overallStatus,
    exportHandoffAllowed: blockedCount === 0 && missingRequiredCount === 0 && dataBoundaryReport.exportAllowed,
    artifactCount: normalizedArtifacts.length,
    readyCount,
    needsReviewCount,
    missingRequiredCount,
    blockedCount,
    boundaryStatus: dataBoundaryReport.status,
    boundaryBlockerCount: dataBoundaryReport.blockerCount,
    boundaryWarningCount: dataBoundaryReport.warningCount,
    detectedClasses: dataBoundaryReport.detectedClasses.slice().sort(),
    artifacts: normalizedArtifacts,
    blockers,
    nextActions,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportSafetyInventoryJson(inventory: ExportSafetyInventory): string {
  return `${JSON.stringify(inventory, null, 2)}\n`;
}

export function downloadExportSafetyInventoryJson(filename: string, inventory: ExportSafetyInventory): void {
  const blob = new Blob([exportSafetyInventoryJson(inventory)], { type: "application/json;charset=utf-8" });
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

export function createSourceFreshnessBoardExportArtifact(
  sourceFreshnessBoard: SourceFreshnessBoard | null | undefined
): ExportSafetyArtifactInput {
  const hasBoard = Boolean(sourceFreshnessBoard?.boardHash);
  const status = sourceFreshnessBoard?.status;
  const warnings =
    hasBoard && status && status !== "current"
      ? [`Source Freshness Board status is ${status}; review lanes before counsel handoff.`]
      : [];

  return {
    id: "source-freshness-board",
    label: "Source Freshness Board JSON",
    category: "source-lineage",
    exportMode: "metadata-only-json",
    required: false,
    available: hasBoard,
    artifactHash: sourceFreshnessBoard?.boardHash,
    metadataOnly: true,
    rawContentIncluded: false,
    warnings,
    recoveryAction: hasBoard
      ? "Review the Source Freshness Board lanes before external handoff."
      : "Open the Regulatory Command Center after source review calculation completes.",
    notLegalAdviceBoundary:
      sourceFreshnessBoard?.notLegalAdviceBoundary ??
      "Not legal advice. Source freshness boards are audit preparation scheduling metadata only."
  };
}

export function createSourceApprovalQueueExportArtifact(
  queue: RegulatorySourceApprovalQueue | null | undefined
): ExportSafetyArtifactInput {
  const hasQueue = Boolean(queue?.queueHash);
  const totalItemCount = queue?.totalItemCount ?? 0;
  const warnings =
    hasQueue && totalItemCount > 0
      ? [
          `Source Update Approval Queue status is ${queue?.status ?? "missing"} with ${totalItemCount} open gate${
            totalItemCount === 1 ? "" : "s"
          }; source matching remains gated until refreshed metadata is reviewed.`
        ]
      : [];

  return {
    id: "source-update-approval-queue",
    label: "Source Update Approval Queue JSON",
    category: "source-lineage",
    exportMode: "metadata-only-json",
    required: false,
    available: hasQueue,
    artifactHash: queue?.queueHash,
    metadataOnly: true,
    rawContentIncluded: false,
    warnings,
    recoveryAction: createSourceApprovalQueueRecoveryAction(queue),
    notLegalAdviceBoundary:
      queue?.notLegalAdviceBoundary ??
      "Not legal advice. Source update approvals are audit preparation workflow metadata only."
  };
}

export function createApiPreflightExportArtifact(apiPreflight: DemoApiPreflight): ExportSafetyArtifactInput {
  if (apiPreflight.status === "ready") {
    const routeReadyCount = apiPreflight.routeChecks.filter((check) => check.status === "ready").length;
    const routeCheckCount = apiPreflight.routeChecks.length;

    return {
      id: "api-preflight-report",
      label: "API Preflight Report JSON",
      category: "security",
      exportMode: "metadata-only-json",
      required: false,
      available: Boolean(apiPreflight.apiPreflightReportHash),
      artifactHash: apiPreflight.apiPreflightReportHash,
      metadataOnly: true,
      rawContentIncluded: false,
      warnings: apiPreflight.apiPreflightReportHash
        ? []
        : ["Phase 2 API preflight is ready but the /api/preflight report hash was not returned."],
      recoveryAction: apiPreflight.apiPreflightReportHash
        ? `Keep API Preflight Report JSON with the judge handoff packet; ${routeReadyCount}/${routeCheckCount} safe route checks passed.`
        : "Retry Demo API preflight and confirm /api/preflight returns a metadata-only report hash.",
      notLegalAdviceBoundary: apiPreflight.notLegalAdviceBoundary || API_PREFLIGHT_EXPORT_BOUNDARY
    };
  }

  if (apiPreflight.status === "failed") {
    return {
      id: "api-preflight-report",
      label: "API Preflight Report JSON",
      category: "security",
      exportMode: "metadata-only-json",
      required: false,
      available: false,
      metadataOnly: true,
      rawContentIncluded: false,
      warnings: [`Phase 2 API preflight failed: ${apiPreflight.error}`],
      recoveryAction: apiPreflight.recoveryAction,
      notLegalAdviceBoundary: apiPreflight.notLegalAdviceBoundary || API_PREFLIGHT_EXPORT_BOUNDARY
    };
  }

  return {
    id: "api-preflight-report",
    label: "API Preflight Report JSON",
    category: "security",
    exportMode: "metadata-only-json",
    required: false,
    available: false,
    metadataOnly: true,
    rawContentIncluded: false,
    warnings: ["Phase 2 API preflight has not been checked in this browser session."],
    recoveryAction: "Open Judge Demo Readiness, start the Phase 2 API, and click Check Demo API before judge handoff.",
    notLegalAdviceBoundary: API_PREFLIGHT_EXPORT_BOUNDARY
  };
}

export function createEvidenceVaultLineageDigestExportArtifact(
  digest: EvidenceVaultLineageDigest | null | undefined
): ExportSafetyArtifactInput {
  const hasDigest = Boolean(digest?.digestHash);
  const status = digest?.readinessStatus;
  const warnings =
    hasDigest && status && status !== "ready"
      ? [`Evidence Vault Lineage Digest status is ${status}; resolve vault lineage recovery before external handoff.`]
      : [];

  return {
    id: "evidence-vault-lineage-digest",
    label: "Evidence Vault Lineage Digest JSON",
    category: "evidence",
    exportMode: "metadata-only-json",
    required: false,
    available: hasDigest,
    artifactHash: digest?.digestHash,
    metadataOnly: true,
    rawContentIncluded: false,
    warnings,
    recoveryAction: hasDigest
      ? "Keep the Evidence Vault Lineage Digest with the final evidence handoff packet."
      : "Sync metadata-only evidence to the Evidence Vault and wait for the lineage digest hash.",
    notLegalAdviceBoundary:
      digest?.notLegalAdviceBoundary ??
      "Not legal advice. Evidence Vault lineage digests are audit preparation metadata only."
  };
}

export function createEvidenceRecertificationQueueExportArtifact(
  queue: EvidenceRecertificationQueue | null | undefined
): ExportSafetyArtifactInput {
  const hasQueue = Boolean(queue?.queueHash);
  const totalActionCount = queue?.summary.totalActionCount ?? 0;
  const warnings =
    hasQueue && queue?.status !== "ready"
      ? [
          `Evidence Recertification Queue status is ${queue?.status ?? "missing"} with ${totalActionCount} open action${
            totalActionCount === 1 ? "" : "s"
          }; resolve recertification before external handoff.`
        ]
      : [];

  return {
    id: "evidence-recertification-queue",
    label: "Evidence Recertification Queue JSON",
    category: "evidence",
    exportMode: "metadata-only-json",
    required: false,
    available: hasQueue,
    artifactHash: queue?.queueHash,
    metadataOnly: true,
    rawContentIncluded: false,
    warnings,
    recoveryAction: createEvidenceRecertificationRecoveryAction(queue),
    notLegalAdviceBoundary:
      queue?.notLegalAdviceBoundary ??
      "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."
  };
}

export function createModelGatewayEvaluationExportArtifact(
  evaluation: ModelGatewayEvaluationRecord | null | undefined
): ExportSafetyArtifactInput {
  const hasEvaluation = Boolean(evaluation?.runId);

  return {
    id: "model-gateway-evaluation",
    label: "Model Gateway Evaluation JSON",
    category: "model-governance",
    exportMode: "metadata-only-json",
    required: false,
    available: hasEvaluation,
    artifactHash: selectModelGatewayEvaluationHash(evaluation),
    metadataOnly: true,
    rawContentIncluded: false,
    warnings: createModelGatewayEvaluationWarnings(evaluation),
    recoveryAction: createModelGatewayEvaluationRecoveryAction(evaluation),
    notLegalAdviceBoundary:
      evaluation?.notLegalAdviceBoundary ??
      "Not legal advice. Model Gateway evaluation records are audit preparation metadata only."
  };
}

export function createAuditLogExportArtifact(
  auditLogExport: AuditLogExportRecord | null | undefined
): ExportSafetyArtifactInput {
  const hasExport = Boolean(auditLogExport);

  return {
    id: "audit-log-export",
    label: "Audit Log Export JSON",
    category: "security",
    exportMode: "metadata-only-json",
    required: false,
    available: hasExport,
    metadataOnly: true,
    rawContentIncluded: false,
    blockers: createAuditLogExportBlockers(auditLogExport),
    warnings: createAuditLogExportWarnings(auditLogExport),
    recoveryAction: createAuditLogExportRecoveryAction(auditLogExport),
    notLegalAdviceBoundary:
      auditLogExport?.notLegalAdviceBoundary ??
      "Not legal advice. Audit Log exports are review workspace metadata only."
  };
}

export function createDemoRunbookExportArtifact(
  summary: ExportSafetyDemoRunbookSummary | null | undefined
): ExportSafetyArtifactInput {
  const hasRunbook = Boolean(summary?.runbookHash);
  const warnings =
    hasRunbook && (summary?.status !== "ready" || summary?.apiPreflightStatus !== "ready")
      ? [
          `Demo Runbook status is ${summary?.status ?? "missing"} with API preflight ${
            summary?.apiPreflightStatus ?? "missing"
          }; complete readiness before judge handoff.`
        ]
      : [];

  return {
    id: "demo-runbook",
    label: "Demo Runbook JSON",
    category: "submission",
    exportMode: "metadata-only-json",
    required: true,
    available: hasRunbook,
    artifactHash: summary?.runbookHash,
    metadataOnly: true,
    rawContentIncluded: false,
    warnings,
    recoveryAction: hasRunbook
      ? "Keep the Demo Runbook aligned with README, demo script, and current screenshots."
      : "Open Judge Demo Readiness, complete API preflight, and download Demo Runbook JSON.",
    notLegalAdviceBoundary:
      summary?.notLegalAdviceBoundary ?? "Not legal advice. Demo runbooks are audit preparation demo metadata only."
  };
}

export function createDemoSmokeChecklistExportArtifact(
  summary: DemoSmokeChecklistSummary | null | undefined
): ExportSafetyArtifactInput {
  const hasChecklist = Boolean(summary?.checklistHash);
  const warnings =
    hasChecklist && summary?.status !== "ready"
      ? [
          `Demo Smoke Checklist status is ${summary?.status ?? "missing"} with API preflight ${
            summary?.apiPreflightStatus ?? "missing"
          }; complete clean-clone smoke recovery before judge handoff.`
        ]
      : [];

  return {
    id: "demo-smoke-checklist",
    label: "Demo Smoke Checklist JSON",
    category: "submission",
    exportMode: "metadata-only-json",
    required: true,
    available: hasChecklist,
    artifactHash: summary?.checklistHash,
    metadataOnly: true,
    rawContentIncluded: false,
    warnings,
    recoveryAction: hasChecklist
      ? `Keep the Demo Smoke Checklist with judge setup notes; ${summary?.commandCount ?? 0} commands and ${
          summary?.stepCount ?? 0
        } smoke steps are represented.`
      : "Open Judge Demo Readiness and let the Demo Smoke Checklist hash finish calculating before judge handoff.",
    notLegalAdviceBoundary:
      summary?.notLegalAdviceBoundary ??
      "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only."
  };
}

function createAuditLogExportBlockers(auditLogExport: AuditLogExportRecord | null | undefined): string[] {
  if (!auditLogExport || auditLogExport.exportAllowed) {
    return [];
  }

  return [
    `Audit Log Export boundary status is ${auditLogExport.dataBoundaryStatus}; remove blocked data before external handoff.`,
    ...auditLogExport.boundaryFindings
      .filter((finding) => finding.severity === "block")
      .slice(0, 5)
      .map((finding) => `${finding.field}: ${finding.message} (${finding.redactedSnippet})`)
  ];
}

function createAuditLogExportWarnings(auditLogExport: AuditLogExportRecord | null | undefined): string[] {
  if (!auditLogExport) {
    return ["Run Secure Review Journey or refresh Server Audit Log Explorer before relying on audit-log handoff metadata."];
  }

  return [
    auditLogExport.eventCount === 0 ? "Audit Log Export has no events; run Secure Review Journey before final handoff." : "",
    auditLogExport.dataBoundaryStatus === "needs-review"
      ? `Audit Log Export has ${auditLogExport.boundaryWarningCount} warning-level boundary finding${
          auditLogExport.boundaryWarningCount === 1 ? "" : "s"
        }; review redacted metadata before external handoff.`
      : "",
    ...auditLogExport.boundaryFindings
      .filter((finding) => finding.severity === "warn")
      .slice(0, 5)
      .map((finding) => `${finding.field}: ${finding.message} (${finding.redactedSnippet})`)
  ].filter(Boolean);
}

function createAuditLogExportRecoveryAction(auditLogExport: AuditLogExportRecord | null | undefined): string {
  if (!auditLogExport) {
    return "Run Secure Review Journey or refresh Server Audit Log Explorer to produce a metadata-only Audit Log Export.";
  }

  if (!auditLogExport.exportAllowed) {
    return auditLogExport.remediation[0] ?? "Remove blocked Audit Log source fields before external handoff.";
  }

  if (auditLogExport.dataBoundaryStatus === "needs-review") {
    return auditLogExport.remediation[0] ?? "Review warning-level Audit Log boundary findings before handoff.";
  }

  if (auditLogExport.eventCount === 0) {
    return "Run Secure Review Journey before treating Audit Log Export as complete handoff evidence.";
  }

  return "Keep Audit Log Export JSON with the secure review handoff packet.";
}

function createSourceApprovalQueueRecoveryAction(queue: RegulatorySourceApprovalQueue | null | undefined): string {
  if (!queue) {
    return "Open Regulatory Command Center and wait for the Source Update Approval Queue hash before external handoff.";
  }

  if (queue.metadataRequiredCount > 0) {
    return (
      queue.items.find((item) => item.approvalStatus === "metadata-required")?.nextAction ??
      "Complete missing source metadata before it can change source matching behavior."
    );
  }

  if (queue.approvalRequiredCount > 0) {
    return (
      queue.items.find((item) => item.approvalStatus === "approval-required")?.nextAction ??
      "Refresh and approve due source metadata before it can change source matching behavior."
    );
  }

  return "Keep Source Update Approval Queue JSON with the final source-lineage handoff packet.";
}

function createEvidenceRecertificationRecoveryAction(queue: EvidenceRecertificationQueue | null | undefined): string {
  if (!queue) {
    return "Open Evidence Ledger and wait for the Evidence Recertification Queue hash before final handoff.";
  }

  if (queue.status === "needs-recertification") {
    return queue.nextSteps[0] ?? "Recertify stale or timestamp-missing reliance-ready evidence before final handoff.";
  }

  if (queue.status === "monitoring") {
    return queue.nextSteps[0] ?? "Schedule due-soon evidence recertification before the next external handoff.";
  }

  return "Keep Evidence Recertification Queue JSON with the final evidence handoff packet.";
}

function createModelGatewayEvaluationWarnings(
  evaluation: ModelGatewayEvaluationRecord | null | undefined
): string[] {
  if (!evaluation) {
    return [];
  }

  return [
    evaluation.status !== "completed"
      ? `Model Gateway Evaluation status is ${evaluation.status}; resolve remediation before model-output reliance.`
      : "",
    evaluation.humanReviewStatus !== "reviewed"
      ? `Model Gateway Evaluation human review status is ${evaluation.humanReviewStatus}; route through Human Review before export reliance.`
      : ""
  ].filter(Boolean);
}

function createModelGatewayEvaluationRecoveryAction(
  evaluation: ModelGatewayEvaluationRecord | null | undefined
): string {
  if (!evaluation) {
    return "Run Secure Review Journey to create a metadata-only Model Gateway Evaluation before relying on model output.";
  }

  if (evaluation.status === "blocked" || evaluation.status === "failed") {
    return "Resolve Model Gateway remediation before treating model output as review material.";
  }

  if (evaluation.humanReviewStatus !== "reviewed") {
    return "Route Model Gateway Evaluation through Human Review before relying on model output.";
  }

  return "Keep Model Gateway Evaluation JSON with the final model receipt handoff.";
}

function selectModelGatewayEvaluationHash(
  evaluation: ModelGatewayEvaluationRecord | null | undefined
): string | undefined {
  if (!evaluation) {
    return undefined;
  }

  return isSha256(evaluation.hashes.responseHash) ? evaluation.hashes.responseHash : evaluation.hashes.payloadHash;
}

function normalizeArtifact(
  artifact: ExportSafetyArtifactInput,
  dataBoundaryReport: DataBoundaryReport
): ExportSafetyInventoryArtifact {
  const blockers = [
    ...(artifact.blockers ?? []),
    ...(!artifact.metadataOnly ? ["Artifact is not marked metadata-only or audit-prep safe."] : []),
    ...(artifact.rawContentIncluded ? ["Artifact reports raw content included and cannot be used for external handoff."] : []),
    ...(dataBoundaryReport.exportAllowed
      ? []
      : dataBoundaryReport.findings
          .filter((finding) => finding.severity === "block")
          .map((finding) => `${finding.sourceLabel}: ${finding.message} (${finding.redactedSnippet})`))
  ].map(sanitize);
  const warnings = [
    ...(artifact.warnings ?? []),
    ...(dataBoundaryReport.status === "needs-review" ? dataBoundaryReport.remediation : [])
  ].map(sanitize);
  const available = artifact.available === true;
  const status = createArtifactStatus({ available, required: artifact.required, blockers, warnings });

  return {
    id: sanitizeId(artifact.id),
    label: sanitize(artifact.label),
    category: artifact.category,
    exportMode: artifact.exportMode,
    status,
    required: artifact.required === true,
    available,
    artifactHash: sanitizeHash(artifact.artifactHash),
    metadataOnly: artifact.metadataOnly === true,
    rawContentIncluded: artifact.rawContentIncluded === true,
    blockers,
    warnings,
    recoveryAction: sanitize(artifact.recoveryAction),
    notLegalAdviceBoundary: sanitize(artifact.notLegalAdviceBoundary)
  };
}

function createArtifactStatus(input: {
  available: boolean;
  required: boolean;
  blockers: string[];
  warnings: string[];
}): ExportSafetyArtifactStatus {
  if (input.blockers.length > 0) {
    return "blocked";
  }

  if (!input.available) {
    return input.required ? "needs-action" : "needs-review";
  }

  if (input.warnings.length > 0) {
    return "needs-review";
  }

  return "ready";
}

function createOverallStatus(input: {
  blockedCount: number;
  missingRequiredCount: number;
  needsReviewCount: number;
  boundaryStatus: DataBoundaryReport["status"];
}): ExportSafetyInventoryStatus {
  if (input.blockedCount > 0 || input.boundaryStatus === "blocked") {
    return "blocked";
  }

  if (input.missingRequiredCount > 0) {
    return "needs-action";
  }

  if (input.needsReviewCount > 0 || input.boundaryStatus === "needs-review") {
    return "needs-review";
  }

  return "ready";
}

function collectBlockers(artifacts: ExportSafetyInventoryArtifact[], report: DataBoundaryReport): string[] {
  return unique([
    ...artifacts.flatMap((artifact) => artifact.blockers.map((blocker) => `${artifact.label}: ${blocker}`)),
    ...report.remediation.filter(() => report.status === "blocked").map(sanitize)
  ]);
}

function createNextActions(artifacts: ExportSafetyInventoryArtifact[], report: DataBoundaryReport): string[] {
  const artifactActions = artifacts
    .filter((artifact) => artifact.status !== "ready")
    .map((artifact) => `${artifact.label}: ${artifact.recoveryAction}`);
  const boundaryActions =
    report.status === "clean"
      ? ["Keep exports metadata-only and re-run inventory before external sharing."]
      : report.remediation.map(sanitize);

  return unique([...artifactActions, ...boundaryActions]);
}

function compareArtifact(left: ExportSafetyInventoryArtifact, right: ExportSafetyInventoryArtifact): number {
  return left.id.localeCompare(right.id);
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
}

function sanitizeId(value: string): string {
  return (
    sanitize(value)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "export-artifact"
  );
}

function sanitizeHash(value?: string): string | undefined {
  const normalized = (value ?? "").replace(/\s+/g, "").trim().toLowerCase();
  if (/^[a-f0-9]{8,128}$/.test(normalized)) {
    return normalized;
  }

  const redacted = sanitize(value ?? "").toLowerCase();
  return /^[a-f0-9]{8,128}$/.test(redacted) ? redacted : undefined;
}

function isSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value.trim());
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}
