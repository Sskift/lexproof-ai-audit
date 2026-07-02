import { redactDataBoundaryText } from "./dataBoundary";
import type { JurisdictionEvidenceMap } from "./jurisdictionEvidenceMap";
import type { LocalCounselRoute, LocalCounselRoutingPlan, LocalCounselRoutingStatus } from "./localCounselRouting";
import type { RegulatoryControlPriority, RegulatoryControlStatus } from "./regulatoryControlMatrix";
import type { SourceFreshnessBoard, SourceFreshnessBoardItem } from "./sourceFreshnessBoard";

export type JurisdictionReadinessDigestStatus =
  | "ready-for-counsel"
  | "needs-evidence"
  | "needs-source-review"
  | "metadata-missing"
  | "no-jurisdictions";

export type JurisdictionReadinessHandoffState = "ready" | "needs-action" | "blocked";

export type JurisdictionReadinessDigestSummary = {
  readyForCounselCount: number;
  needsEvidenceCount: number;
  needsSourceReviewCount: number;
  metadataMissingCount: number;
  openEvidenceRequestCount: number;
  sourceFreshnessBlockerCount: number;
  dueSoonSourceCount: number;
};

export type JurisdictionReadinessDigestJurisdiction = {
  jurisdiction: string;
  status: Exclude<JurisdictionReadinessDigestStatus, "no-jurisdictions">;
  handoffState: JurisdictionReadinessHandoffState;
  handoffAllowed: boolean;
  controlCount: number;
  readyForCounselCount: number;
  openEvidenceRequestCount: number;
  p0OpenEvidenceRequestCount: number;
  sourceFreshnessBlockerCount: number;
  dueSoonSourceCount: number;
  localCounselRoles: string[];
  localCounselStatus: LocalCounselRoutingStatus | "not-routed";
  topEvidenceRequests: string[];
  topTopics: string[];
  nextAction: string;
  notLegalAdviceBoundary: "Not legal advice. Jurisdiction readiness digest rows are audit preparation workflow metadata only.";
};

export type JurisdictionReadinessDigest = {
  digestVersion: "lexproof-jurisdiction-readiness-digest-v1";
  projectId: string;
  generatedAt: string;
  digestHash: string;
  status: JurisdictionReadinessDigestStatus;
  handoffAllowed: boolean;
  jurisdictionCount: number;
  summary: JurisdictionReadinessDigestSummary;
  sourceMapHash: string;
  localCounselPlanHash: string;
  sourceFreshnessBoardHash: string;
  jurisdictions: JurisdictionReadinessDigestJurisdiction[];
  notLegalAdviceBoundary: "Not legal advice. Jurisdiction readiness digests are audit preparation workflow metadata only.";
};

export type CreateJurisdictionReadinessDigestInput = {
  evidenceMap: JurisdictionEvidenceMap;
  localCounselRoutingPlan: LocalCounselRoutingPlan | null;
  sourceFreshnessBoard: SourceFreshnessBoard | null;
  generatedAt?: string;
};

const digestBoundary = "Not legal advice. Jurisdiction readiness digests are audit preparation workflow metadata only." as const;
const rowBoundary = "Not legal advice. Jurisdiction readiness digest rows are audit preparation workflow metadata only." as const;

export async function createJurisdictionReadinessDigest({
  evidenceMap,
  localCounselRoutingPlan,
  sourceFreshnessBoard,
  generatedAt = new Date().toISOString()
}: CreateJurisdictionReadinessDigestInput): Promise<JurisdictionReadinessDigest> {
  const routeByJurisdiction = new Map(
    (localCounselRoutingPlan?.routes ?? []).map((route) => [sanitize(route.jurisdiction), route])
  );
  const sourceFreshnessByJurisdiction = groupSourceFreshnessItems(sourceFreshnessBoard);
  const jurisdictions = evidenceMap.jurisdictions
    .map((item) =>
      createJurisdictionDigestRow({
        item,
        route: routeByJurisdiction.get(sanitize(item.jurisdiction)),
        sourceFreshnessItems: sourceFreshnessByJurisdiction.get(sanitize(item.jurisdiction)) ?? []
      })
    )
    .sort(compareJurisdictionRows);
  const summary = createSummary(jurisdictions);
  const status = createDigestStatus(jurisdictions);
  const hashPayload = {
    digestVersion: "lexproof-jurisdiction-readiness-digest-v1",
    projectId: sanitize(evidenceMap.projectId),
    status,
    jurisdictionCount: jurisdictions.length,
    summary,
    sourceMapHash: sanitize(evidenceMap.mapHash),
    localCounselPlanHash: sanitize(localCounselRoutingPlan?.planHash ?? ""),
    sourceFreshnessBoardHash: sanitize(sourceFreshnessBoard?.boardHash ?? ""),
    jurisdictions
  };

  return {
    digestVersion: "lexproof-jurisdiction-readiness-digest-v1",
    projectId: sanitize(evidenceMap.projectId),
    generatedAt,
    digestHash: await sha256Hex(stableStringify(hashPayload)),
    status,
    handoffAllowed: status === "ready-for-counsel",
    jurisdictionCount: jurisdictions.length,
    summary,
    sourceMapHash: sanitize(evidenceMap.mapHash),
    localCounselPlanHash: sanitize(localCounselRoutingPlan?.planHash ?? ""),
    sourceFreshnessBoardHash: sanitize(sourceFreshnessBoard?.boardHash ?? ""),
    jurisdictions,
    notLegalAdviceBoundary: digestBoundary
  };
}

export function exportJurisdictionReadinessDigestJson(digest: JurisdictionReadinessDigest): string {
  return `${JSON.stringify(digest, null, 2)}\n`;
}

export function downloadJurisdictionReadinessDigestJson(filename: string, digest: JurisdictionReadinessDigest): void {
  const blob = new Blob([exportJurisdictionReadinessDigestJson(digest)], { type: "application/json;charset=utf-8" });
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

function createJurisdictionDigestRow({
  item,
  route,
  sourceFreshnessItems
}: {
  item: JurisdictionEvidenceMap["jurisdictions"][number];
  route: LocalCounselRoute | undefined;
  sourceFreshnessItems: SourceFreshnessBoardItem[];
}): JurisdictionReadinessDigestJurisdiction {
  const sourceFreshnessBlockerCount = sourceFreshnessItems.filter(isSourceFreshnessBlocker).length;
  const dueSoonSourceCount = sourceFreshnessItems.filter((source) => source.laneId === "due-soon").length;
  const status = createRowStatus(item.status, route?.status, sourceFreshnessBlockerCount);
  const localCounselRoles = unique([...item.localCounselRoles, route?.localCounselRole ?? ""].map(sanitize));
  const topEvidenceRequests = item.topOpenEvidenceRequests.map((request) => sanitize(request.title)).filter(Boolean).slice(0, 3);

  return {
    jurisdiction: sanitize(item.jurisdiction),
    status,
    handoffState: createHandoffState(status),
    handoffAllowed: status === "ready-for-counsel",
    controlCount: item.controlCount,
    readyForCounselCount: item.readyForCounselCount,
    openEvidenceRequestCount: item.openEvidenceRequestCount,
    p0OpenEvidenceRequestCount: item.p0OpenEvidenceRequestCount,
    sourceFreshnessBlockerCount,
    dueSoonSourceCount,
    localCounselRoles,
    localCounselStatus: route?.status ?? "not-routed",
    topEvidenceRequests,
    topTopics: item.topics.map((topic) => sanitize(topic.topic)).slice(0, 4),
    nextAction: createNextAction(status, item, sourceFreshnessItems, route),
    notLegalAdviceBoundary: rowBoundary
  };
}

function createRowStatus(
  mapStatus: RegulatoryControlStatus,
  localCounselStatus: LocalCounselRoutingStatus | undefined,
  sourceFreshnessBlockerCount: number
): JurisdictionReadinessDigestJurisdiction["status"] {
  if (mapStatus === "metadata-missing") {
    return "metadata-missing";
  }
  if (mapStatus === "needs-evidence" || localCounselStatus === "needs-evidence") {
    return "needs-evidence";
  }
  if (mapStatus === "needs-source-review" || localCounselStatus === "needs-source-review" || sourceFreshnessBlockerCount > 0) {
    return "needs-source-review";
  }
  return "ready-for-counsel";
}

function createNextAction(
  status: JurisdictionReadinessDigestJurisdiction["status"],
  item: JurisdictionEvidenceMap["jurisdictions"][number],
  sourceFreshnessItems: SourceFreshnessBoardItem[],
  route: LocalCounselRoute | undefined
): string {
  if (status === "metadata-missing") {
    return `Complete source metadata for ${sanitize(item.jurisdiction)} before counsel handoff.`;
  }
  if (status === "needs-source-review") {
    const blocker = sourceFreshnessItems.find(isSourceFreshnessBlocker);
    return sanitize(item.nextAction ?? blocker?.nextAction ?? route?.nextAction ?? "Refresh source metadata before counsel handoff.");
  }
  if (status === "needs-evidence") {
    return sanitize(item.topOpenEvidenceRequests[0]?.nextAction ?? route?.nextAction ?? item.nextAction);
  }
  return sanitize(item.nextAction || route?.nextAction || `Route ${item.jurisdiction} controls to counsel review.`);
}

function createHandoffState(status: JurisdictionReadinessDigestJurisdiction["status"]): JurisdictionReadinessHandoffState {
  if (status === "ready-for-counsel") {
    return "ready";
  }
  if (status === "metadata-missing" || status === "needs-evidence") {
    return "blocked";
  }
  return "needs-action";
}

function createSummary(jurisdictions: JurisdictionReadinessDigestJurisdiction[]): JurisdictionReadinessDigestSummary {
  return {
    readyForCounselCount: jurisdictions.filter((item) => item.status === "ready-for-counsel").length,
    needsEvidenceCount: jurisdictions.filter((item) => item.status === "needs-evidence").length,
    needsSourceReviewCount: jurisdictions.filter((item) => item.status === "needs-source-review").length,
    metadataMissingCount: jurisdictions.filter((item) => item.status === "metadata-missing").length,
    openEvidenceRequestCount: jurisdictions.reduce((sum, item) => sum + item.openEvidenceRequestCount, 0),
    sourceFreshnessBlockerCount: jurisdictions.reduce((sum, item) => sum + item.sourceFreshnessBlockerCount, 0),
    dueSoonSourceCount: jurisdictions.reduce((sum, item) => sum + item.dueSoonSourceCount, 0)
  };
}

function createDigestStatus(jurisdictions: JurisdictionReadinessDigestJurisdiction[]): JurisdictionReadinessDigestStatus {
  if (jurisdictions.length === 0) {
    return "no-jurisdictions";
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

function groupSourceFreshnessItems(sourceFreshnessBoard: SourceFreshnessBoard | null): Map<string, SourceFreshnessBoardItem[]> {
  const items = sourceFreshnessBoard?.lanes.flatMap((lane) => lane.items) ?? [];
  const grouped = new Map<string, SourceFreshnessBoardItem[]>();

  for (const item of items) {
    const jurisdiction = sanitize(item.jurisdiction);
    grouped.set(jurisdiction, [...(grouped.get(jurisdiction) ?? []), item]);
  }

  return grouped;
}

function isSourceFreshnessBlocker(item: SourceFreshnessBoardItem): boolean {
  return item.laneId === "metadata-missing" || item.laneId === "overdue";
}

function compareJurisdictionRows(
  left: JurisdictionReadinessDigestJurisdiction,
  right: JurisdictionReadinessDigestJurisdiction
): number {
  const status = statusWeight(left.status) - statusWeight(right.status);
  if (status !== 0) {
    return status;
  }

  const priority = priorityScore(right) - priorityScore(left);
  if (priority !== 0) {
    return priority;
  }

  return left.jurisdiction.localeCompare(right.jurisdiction);
}

function priorityScore(row: JurisdictionReadinessDigestJurisdiction): number {
  return row.p0OpenEvidenceRequestCount * 100 + row.openEvidenceRequestCount * 10 + row.sourceFreshnessBlockerCount;
}

function statusWeight(status: Exclude<JurisdictionReadinessDigestStatus, "no-jurisdictions">): number {
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

function sanitize(value: string): string {
  return redactDataBoundaryText(
    value
      .replace(/\blegally approved\b/gi, "human review recorded")
      .replace(/\bprivate key\b/gi, "restricted signing material")
      .replace(/\s+/g, " ")
      .trim()
  );
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
