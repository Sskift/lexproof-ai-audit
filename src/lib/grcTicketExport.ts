import type { AuditResult, RemediationItem } from "./auditEngine";
import { redactDataBoundaryText } from "./dataBoundary";
import type { IntegrationAdapterStatus, IntegrationReadinessAdapter, IntegrationReadinessRegistry } from "./integrationReadiness";
import type { ProjectProfile } from "./projectModel";

export type GrcTicketExportRecord = {
  id: string;
  title: string;
  owner: RemediationItem["owner"];
  priority: RemediationItem["priority"];
  action: string;
  status: "open";
  linkedRiskFlagIds: string[];
  sourceTitles: string[];
  notLegalAdviceBoundary: "Not legal advice. GRC ticket records are audit preparation workflow metadata only.";
};

export type GrcTicketExportBundle = {
  bundleVersion: "lexproof-grc-ticket-export-v1";
  projectId: string;
  projectName: string;
  riskLevel: AuditResult["riskLevel"];
  adapterStatus: IntegrationAdapterStatus;
  exportAllowed: boolean;
  blockerCount: number;
  blockers: string[];
  ticketCount: number;
  tickets: GrcTicketExportRecord[];
  generatedAt: string;
  notLegalAdviceBoundary: "Not legal advice. GRC ticket exports are audit preparation workflow metadata only.";
};

export type CreateGrcTicketExportInput = {
  project: ProjectProfile;
  audit: AuditResult;
  integrationReadinessRegistry: IntegrationReadinessRegistry;
  generatedAt?: string;
};

const BUNDLE_NOT_LEGAL_ADVICE = "Not legal advice. GRC ticket exports are audit preparation workflow metadata only.";
const TICKET_NOT_LEGAL_ADVICE = "Not legal advice. GRC ticket records are audit preparation workflow metadata only.";

export function createGrcTicketExport({
  project,
  audit,
  integrationReadinessRegistry,
  generatedAt = new Date().toISOString()
}: CreateGrcTicketExportInput): GrcTicketExportBundle {
  const adapter = findGrcAdapter(integrationReadinessRegistry);
  const exportAllowed = adapter.status === "ready" && audit.remediation.length > 0;
  const blockers = exportAllowed ? [] : createBlockers(adapter, audit.remediation.length);
  const tickets = exportAllowed ? audit.remediation.map((item, index) => createTicket(project, audit, item, index)) : [];

  return {
    bundleVersion: "lexproof-grc-ticket-export-v1",
    projectId: sanitize(project.id),
    projectName: sanitize(project.projectName || "Untitled project"),
    riskLevel: audit.riskLevel,
    adapterStatus: adapter.status,
    exportAllowed,
    blockerCount: blockers.length,
    blockers,
    ticketCount: tickets.length,
    tickets,
    generatedAt,
    notLegalAdviceBoundary: BUNDLE_NOT_LEGAL_ADVICE
  };
}

export function exportGrcTicketExportJson(bundle: GrcTicketExportBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function downloadGrcTicketExportJson(filename: string, bundle: GrcTicketExportBundle): void {
  const blob = new Blob([exportGrcTicketExportJson(bundle)], { type: "application/json;charset=utf-8" });
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

function createTicket(
  project: ProjectProfile,
  audit: AuditResult,
  item: RemediationItem,
  index: number
): GrcTicketExportRecord {
  return {
    id: `grc-ticket-${slug(project.id)}-${String(index + 1).padStart(2, "0")}`,
    title: sanitize(`${item.priority} ${item.owner} remediation`),
    owner: item.owner,
    priority: item.priority,
    action: sanitize(item.action),
    status: "open",
    linkedRiskFlagIds: findLinkedRiskFlagIds(audit, item),
    sourceTitles: audit.sourcePack.map((source) => sanitize(source.title)),
    notLegalAdviceBoundary: TICKET_NOT_LEGAL_ADVICE
  };
}

function findLinkedRiskFlagIds(audit: AuditResult, item: RemediationItem): string[] {
  const text = `${item.owner} ${item.action}`.toLowerCase();
  const matches = audit.flags
    .filter((flag) => {
      const haystack = `${flag.id} ${flag.title} ${flag.rationale}`.toLowerCase();
      return haystack
        .split(/[^a-z0-9]+/)
        .filter((part) => part.length >= 4)
        .some((part) => text.includes(part));
    })
    .map((flag) => flag.id);

  return matches.length > 0 ? unique(matches) : audit.flags.slice(0, 3).map((flag) => flag.id);
}

function findGrcAdapter(registry: IntegrationReadinessRegistry): IntegrationReadinessAdapter {
  const adapter = registry.adapters.find((candidate) => candidate.id === "grc-ticket-export");
  if (adapter) {
    return adapter;
  }

  return {
    id: "grc-ticket-export",
    label: "GRC ticket export",
    category: "workflow-export",
    status: "blocked",
    readinessEvidence: "GRC ticket export adapter is missing from integration readiness registry.",
    validationErrors: ["Regenerate Integration Readiness Registry before export."],
    recoveryAction: "Regenerate Integration Readiness Registry before export.",
    requiredPolicy: "Destination field mapping, ticket ownership, and export redaction policy.",
    notLegalAdviceBoundary: "Not legal advice. Integration adapter readiness is audit preparation metadata only."
  };
}

function createBlockers(adapter: IntegrationReadinessAdapter, remediationItemCount: number): string[] {
  const blockers = [
    ...adapter.validationErrors,
    remediationItemCount === 0 ? "No remediation queue items are available for ticket export." : "",
    adapter.recoveryAction
  ].filter(Boolean);

  return unique(blockers.map(sanitize));
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
}

function slug(value: string): string {
  return (
    sanitize(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "project"
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
