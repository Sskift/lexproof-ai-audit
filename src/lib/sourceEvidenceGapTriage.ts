import { redactDataBoundaryText } from "./dataBoundary";
import type { EvidenceItem } from "./projectModel";
import type { MatchedRegulatoryClause, RegulatoryEvidenceGap, RegulatoryGraph } from "./regulatoryGraph";

export type SourceEvidenceGapTriageStatus = "ready-for-counsel" | "needs-evidence";

export type SourceEvidenceGapTriageDraft = {
  label: string;
  kind: "Checklist";
  status: "requested";
  owner: "Compliance";
  source: string;
  content: string;
};

export type SourceEvidenceGapTriageItem = {
  itemVersion: "lexproof-source-evidence-gap-triage-item-v1";
  id: string;
  priority: RegulatoryEvidenceGap["priority"];
  jurisdiction: string;
  clauseId: string;
  title: string;
  reason: string;
  citation: string;
  sourceName: string;
  sourceUrl: string;
  localCounselRole: string;
  nextAction: string;
  evidenceLedgerDraft: SourceEvidenceGapTriageDraft;
  notLegalAdviceBoundary: "Not legal advice. Source evidence gap triage is audit preparation workflow metadata only.";
};

export type SourceEvidenceGapTriage = {
  triageVersion: "lexproof-source-evidence-gap-triage-v1";
  projectId: string;
  generatedAt: string;
  triageHash: string;
  status: SourceEvidenceGapTriageStatus;
  totalGapCount: number;
  visibleGapCount: number;
  jurisdictionCount: number;
  p0Count: number;
  items: SourceEvidenceGapTriageItem[];
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Source evidence gap triage is audit preparation workflow metadata only.";
};

export type CreateSourceEvidenceGapTriageInput = {
  graph: RegulatoryGraph;
  maxItems?: number;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Source evidence gap triage is audit preparation workflow metadata only." as const;

export async function createSourceEvidenceGapTriage({
  graph,
  maxItems = 6,
  generatedAt = new Date().toISOString()
}: CreateSourceEvidenceGapTriageInput): Promise<SourceEvidenceGapTriage> {
  const clausesById = new Map(graph.matchedClauses.map((clause) => [clause.clauseId, clause]));
  const sortedGaps = graph.evidenceGaps.slice().sort(compareGaps);
  const items = sortedGaps.slice(0, Math.max(0, maxItems)).map((gap) => createTriageItem(gap, clausesById.get(gap.clauseId)));
  const status: SourceEvidenceGapTriageStatus = graph.evidenceGaps.length > 0 ? "needs-evidence" : "ready-for-counsel";
  const p0Count = graph.evidenceGaps.filter((gap) => gap.priority === "P0").length;
  const hashPayload = {
    triageVersion: "lexproof-source-evidence-gap-triage-v1",
    projectId: sanitize(graph.projectId),
    status,
    totalGapCount: graph.evidenceGaps.length,
    visibleGapCount: items.length,
    p0Count,
    items
  };

  return {
    triageVersion: "lexproof-source-evidence-gap-triage-v1",
    projectId: sanitize(graph.projectId),
    generatedAt,
    triageHash: await sha256Hex(stableStringify(hashPayload)),
    status,
    totalGapCount: graph.evidenceGaps.length,
    visibleGapCount: items.length,
    jurisdictionCount: unique(graph.evidenceGaps.map((gap) => sanitize(gap.jurisdiction))).length,
    p0Count,
    items,
    nextAction: createBundleNextAction(status, items, graph.evidenceGaps.length),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportSourceEvidenceGapTriageJson(triage: SourceEvidenceGapTriage): string {
  return `${JSON.stringify(triage, null, 2)}\n`;
}

export function downloadSourceEvidenceGapTriageJson(filename: string, triage: SourceEvidenceGapTriage): void {
  const blob = new Blob([exportSourceEvidenceGapTriageJson(triage)], { type: "application/json;charset=utf-8" });
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

export function createEvidenceItemFromSourceGapTriageItem(item: SourceEvidenceGapTriageItem): EvidenceItem {
  return {
    label: sanitize(item.evidenceLedgerDraft.label),
    kind: item.evidenceLedgerDraft.kind,
    content: sanitize(item.evidenceLedgerDraft.content),
    source: sanitize(item.evidenceLedgerDraft.source),
    status: item.evidenceLedgerDraft.status,
    owner: item.evidenceLedgerDraft.owner
  };
}

function createTriageItem(
  gap: RegulatoryEvidenceGap,
  clause: MatchedRegulatoryClause | undefined
): SourceEvidenceGapTriageItem {
  const localCounselRole = sanitize(clause?.localCounselRole ?? "Local counsel");
  const sourceName = sanitize(clause?.sourceName ?? gap.citation);
  const controlId = `control-${gap.clauseId}`;
  const title = sanitize(gap.title);
  const jurisdiction = sanitize(gap.jurisdiction);
  const citation = sanitize(gap.citation);

  return {
    itemVersion: "lexproof-source-evidence-gap-triage-item-v1",
    id: sanitize(gap.id),
    priority: gap.priority,
    jurisdiction,
    clauseId: sanitize(gap.clauseId),
    title,
    reason: sanitize(gap.reason),
    citation,
    sourceName,
    sourceUrl: sanitize(gap.sourceUrl),
    localCounselRole,
    nextAction: `Create metadata-only evidence for ${title} and route it to ${localCounselRole}.`,
    evidenceLedgerDraft: {
      label: title,
      kind: "Checklist",
      status: "requested",
      owner: "Compliance",
      source: `Regulatory Source Graph; regulatory control: ${controlId}; source: ${sourceName}; citation: ${citation}`,
      content: `Requested: prepare metadata-only evidence for ${title}; cite ${citation}; identify reviewer owner, retained source lineage, open assumptions, and counsel questions. Exclude raw KYC, credentials, private keys, seed phrases, and personal data.`
    },
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

function createBundleNextAction(
  status: SourceEvidenceGapTriageStatus,
  items: SourceEvidenceGapTriageItem[],
  totalGapCount: number
): string {
  if (status === "ready-for-counsel") {
    return "No source evidence gaps are open in the current graph; keep source review metadata current before counsel handoff.";
  }

  const firstItem = items[0];
  if (!firstItem) {
    return `${totalGapCount} source evidence gaps are open; increase the triage item limit or open the full regulatory graph.`;
  }

  return `Start with ${firstItem.title} for ${firstItem.jurisdiction}; add it in Evidence Ledger as requested metadata before counsel handoff.`;
}

function compareGaps(left: RegulatoryEvidenceGap, right: RegulatoryEvidenceGap): number {
  const priority = priorityWeight(left.priority) - priorityWeight(right.priority);
  if (priority !== 0) {
    return priority;
  }

  return `${left.jurisdiction}-${left.citation}-${left.title}`.localeCompare(`${right.jurisdiction}-${right.citation}-${right.title}`);
}

function priorityWeight(priority: RegulatoryEvidenceGap["priority"]): number {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

function sanitize(value: string): string {
  return redactDataBoundaryText(value.replace(/\s+/g, " ").trim());
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
