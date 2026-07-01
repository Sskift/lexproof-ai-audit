import { redactDataBoundaryText } from "./dataBoundary";
import type {
  RegulatoryControlMatrix,
  RegulatoryControlMatrixControl,
  RegulatoryControlMatrixStatus,
  RegulatoryControlPriority,
  RegulatoryControlStatus
} from "./regulatoryControlMatrix";
import type { RegulatoryClauseTopic } from "../data/regulatoryClauses";

export type JurisdictionEvidenceMapControlInput = RegulatoryControlMatrixControl;

export type JurisdictionEvidenceMapStatus = RegulatoryControlMatrixStatus;

export type JurisdictionEvidenceMapTopicSummary = {
  topic: RegulatoryClauseTopic;
  controlCount: number;
};

export type JurisdictionEvidenceMapOpenRequest = {
  title: string;
  priority: RegulatoryControlPriority;
  sourceName: string;
  citation: string;
  nextAction: string;
};

export type JurisdictionEvidenceMapJurisdiction = {
  jurisdiction: string;
  status: Exclude<RegulatoryControlStatus, "ready-for-counsel"> | "ready-for-counsel";
  controlCount: number;
  readyForCounselCount: number;
  needsEvidenceCount: number;
  needsSourceReviewCount: number;
  metadataMissingCount: number;
  openEvidenceRequestCount: number;
  p0OpenEvidenceRequestCount: number;
  localCounselRoles: string[];
  topics: JurisdictionEvidenceMapTopicSummary[];
  topOpenEvidenceRequests: JurisdictionEvidenceMapOpenRequest[];
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only.";
};

export type JurisdictionEvidenceMap = {
  mapVersion: "lexproof-jurisdiction-evidence-map-v1";
  projectId: string;
  generatedAt: string;
  mapHash: string;
  status: JurisdictionEvidenceMapStatus;
  jurisdictionCount: number;
  totalControlCount: number;
  totalOpenEvidenceRequestCount: number;
  highestPriority: RegulatoryControlPriority;
  jurisdictions: JurisdictionEvidenceMapJurisdiction[];
  notLegalAdviceBoundary: "Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only.";
};

export type CreateJurisdictionEvidenceMapInput = {
  matrix: RegulatoryControlMatrix;
  generatedAt?: string;
};

const NOT_LEGAL_ADVICE = "Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only." as const;

export async function createJurisdictionEvidenceMap({
  matrix,
  generatedAt = new Date().toISOString()
}: CreateJurisdictionEvidenceMapInput): Promise<JurisdictionEvidenceMap> {
  const jurisdictions = createJurisdictions(matrix.controls);
  const totalOpenEvidenceRequestCount = jurisdictions.reduce((sum, item) => sum + item.openEvidenceRequestCount, 0);
  const highestPriority = getHighestPriority(
    jurisdictions.flatMap((item) => item.topOpenEvidenceRequests.map((request) => request.priority))
  );
  const status = createMapStatus(jurisdictions);
  const hashPayload = {
    mapVersion: "lexproof-jurisdiction-evidence-map-v1",
    projectId: sanitize(matrix.projectId),
    status,
    jurisdictionCount: jurisdictions.length,
    totalControlCount: matrix.controlCount,
    totalOpenEvidenceRequestCount,
    highestPriority,
    jurisdictions
  };

  return {
    mapVersion: "lexproof-jurisdiction-evidence-map-v1",
    projectId: sanitize(matrix.projectId),
    generatedAt,
    mapHash: await sha256Hex(stableStringify(hashPayload)),
    status,
    jurisdictionCount: jurisdictions.length,
    totalControlCount: matrix.controlCount,
    totalOpenEvidenceRequestCount,
    highestPriority,
    jurisdictions,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

export function exportJurisdictionEvidenceMapJson(map: JurisdictionEvidenceMap): string {
  return `${JSON.stringify(map, null, 2)}\n`;
}

export function downloadJurisdictionEvidenceMapJson(filename: string, map: JurisdictionEvidenceMap): void {
  const blob = new Blob([exportJurisdictionEvidenceMapJson(map)], { type: "application/json;charset=utf-8" });
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

function createJurisdictions(controls: RegulatoryControlMatrixControl[]): JurisdictionEvidenceMapJurisdiction[] {
  const controlsByJurisdiction = new Map<string, RegulatoryControlMatrixControl[]>();

  controls.forEach((control) => {
    const jurisdiction = sanitize(control.jurisdiction) || "Unassigned jurisdiction";
    controlsByJurisdiction.set(jurisdiction, [...(controlsByJurisdiction.get(jurisdiction) ?? []), control]);
  });

  return [...controlsByJurisdiction.entries()].map(([jurisdiction, items]) => createJurisdiction(jurisdiction, items)).sort(compareJurisdictions);
}

function createJurisdiction(
  jurisdiction: string,
  controls: RegulatoryControlMatrixControl[]
): JurisdictionEvidenceMapJurisdiction {
  const sortedControls = controls.slice().sort(compareControls);
  const topOpenEvidenceRequests = sortedControls.flatMap(createOpenRequests).sort(compareOpenRequests).slice(0, 5);
  const needsEvidenceCount = controls.filter((control) => control.status === "needs-evidence").length;
  const needsSourceReviewCount = controls.filter((control) => control.status === "needs-source-review").length;
  const metadataMissingCount = controls.filter((control) => control.status === "metadata-missing").length;
  const readyForCounselCount = controls.filter((control) => control.status === "ready-for-counsel").length;
  const openEvidenceRequestCount = controls.reduce((sum, control) => sum + control.openEvidenceRequestCount, 0);
  const status = createJurisdictionStatus({ metadataMissingCount, needsEvidenceCount, needsSourceReviewCount });

  return {
    jurisdiction,
    status,
    controlCount: controls.length,
    readyForCounselCount,
    needsEvidenceCount,
    needsSourceReviewCount,
    metadataMissingCount,
    openEvidenceRequestCount,
    p0OpenEvidenceRequestCount: controls.filter((control) => control.openEvidenceRequestCount > 0 && control.highestPriority === "P0").length,
    localCounselRoles: unique(sortedControls.map((control) => sanitize(control.localCounselRole))),
    topics: createTopicSummary(sortedControls),
    topOpenEvidenceRequests,
    nextAction: createNextAction(status, jurisdiction, topOpenEvidenceRequests),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

function createOpenRequests(control: RegulatoryControlMatrixControl): JurisdictionEvidenceMapOpenRequest[] {
  if (control.openEvidenceRequestCount <= 0) {
    return [];
  }

  return control.evidenceRequestTitles.slice(0, control.openEvidenceRequestCount).map((title) => ({
    title: sanitize(title),
    priority: control.highestPriority,
    sourceName: sanitize(control.sourceName),
    citation: sanitize(control.citation),
    nextAction: sanitize(control.nextAction)
  }));
}

function createTopicSummary(controls: RegulatoryControlMatrixControl[]): JurisdictionEvidenceMapTopicSummary[] {
  const counts = new Map<RegulatoryClauseTopic, { controlCount: number; priorityWeight: number; statusWeight: number }>();
  controls.forEach((control) => {
    const current = counts.get(control.topic);
    counts.set(control.topic, {
      controlCount: (current?.controlCount ?? 0) + 1,
      priorityWeight: Math.min(current?.priorityWeight ?? Number.POSITIVE_INFINITY, priorityWeight(control.highestPriority)),
      statusWeight: Math.min(current?.statusWeight ?? Number.POSITIVE_INFINITY, statusWeight(control.status))
    });
  });

  return [...counts.entries()]
    .map(([topic, summary]) => ({ topic, controlCount: summary.controlCount, priorityWeight: summary.priorityWeight, statusWeight: summary.statusWeight }))
    .sort(
      (left, right) =>
        left.statusWeight - right.statusWeight ||
        left.priorityWeight - right.priorityWeight ||
        right.controlCount - left.controlCount ||
        left.topic.localeCompare(right.topic)
    )
    .map(({ topic, controlCount }) => ({ topic, controlCount }));
}

function createJurisdictionStatus(input: {
  metadataMissingCount: number;
  needsEvidenceCount: number;
  needsSourceReviewCount: number;
}): RegulatoryControlStatus {
  if (input.metadataMissingCount > 0) {
    return "metadata-missing";
  }
  if (input.needsEvidenceCount > 0) {
    return "needs-evidence";
  }
  if (input.needsSourceReviewCount > 0) {
    return "needs-source-review";
  }
  return "ready-for-counsel";
}

function createMapStatus(jurisdictions: JurisdictionEvidenceMapJurisdiction[]): JurisdictionEvidenceMapStatus {
  if (jurisdictions.length === 0) {
    return "no-controls";
  }
  if (jurisdictions.some((item) => item.status === "metadata-missing")) {
    return "metadata-missing";
  }
  if (jurisdictions.some((item) => item.status === "needs-evidence")) {
    return "needs-evidence";
  }
  if (jurisdictions.some((item) => item.status === "needs-source-review")) {
    return "needs-source-review";
  }
  return "ready-for-counsel";
}

function createNextAction(
  status: RegulatoryControlStatus,
  jurisdiction: string,
  topOpenEvidenceRequests: JurisdictionEvidenceMapOpenRequest[]
): string {
  if (status === "metadata-missing") {
    return `Complete source metadata for ${jurisdiction} before external counsel handoff.`;
  }
  if (status === "needs-source-review") {
    return `Refresh review-due ${jurisdiction} source metadata before counsel handoff.`;
  }
  if (status === "ready-for-counsel") {
    return `Route ${jurisdiction} controls to counsel with covered evidence and source lineage.`;
  }

  const requestTitle = topOpenEvidenceRequests[0]?.title ?? "open evidence requests";
  return `Prepare ${requestTitle} for ${jurisdiction} counsel review.`;
}

function compareJurisdictions(left: JurisdictionEvidenceMapJurisdiction, right: JurisdictionEvidenceMapJurisdiction): number {
  const status = statusWeight(left.status) - statusWeight(right.status);
  if (status !== 0) {
    return status;
  }

  const openRequests = right.openEvidenceRequestCount - left.openEvidenceRequestCount;
  if (openRequests !== 0) {
    return openRequests;
  }

  return left.jurisdiction.localeCompare(right.jurisdiction);
}

function compareControls(left: RegulatoryControlMatrixControl, right: RegulatoryControlMatrixControl): number {
  const priority = priorityWeight(left.highestPriority) - priorityWeight(right.highestPriority);
  if (priority !== 0) {
    return priority;
  }
  return `${left.jurisdiction}-${left.citation}-${left.controlId}`.localeCompare(`${right.jurisdiction}-${right.citation}-${right.controlId}`);
}

function compareOpenRequests(left: JurisdictionEvidenceMapOpenRequest, right: JurisdictionEvidenceMapOpenRequest): number {
  const priority = priorityWeight(left.priority) - priorityWeight(right.priority);
  if (priority !== 0) {
    return priority;
  }
  return `${left.citation}-${left.title}`.localeCompare(`${right.citation}-${right.title}`);
}

function statusWeight(status: RegulatoryControlStatus): number {
  if (status === "metadata-missing") {
    return 0;
  }
  if (status === "needs-evidence") {
    return 1;
  }
  if (status === "needs-source-review") {
    return 2;
  }
  return 3;
}

function priorityWeight(priority: RegulatoryControlPriority): number {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

function getHighestPriority(priorities: RegulatoryControlPriority[]): RegulatoryControlPriority {
  return priorities.sort((left, right) => priorityWeight(left) - priorityWeight(right))[0] ?? "P2";
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
