import type { AuditResult } from "./auditEngine";
import type { CounselReviewItem, CounselReviewStatus } from "./counselReview";
import type { EvidenceManifest } from "./evidenceManifest";
import type { JurisdictionReadinessDigest } from "./jurisdictionReadinessDigest";
import type { ProjectProfile } from "./projectModel";
import type { RegulatorySourcePack } from "./regulatorySourcePack";

export type CounselPackReviewSummary = {
  total: number;
  reviewed: number;
  readyForCounsel: number;
  needsEvidence: number;
  blocked: number;
  open: number;
};

export type CounselPackReviewStatusSnapshot = {
  flagId: string;
  title: string;
  status: CounselReviewStatus;
  reviewer: string;
  evidenceSummary: string;
};

export type CounselPackSourceSnapshot = {
  title: string;
  url: string;
};

export type CounselPackRegulatorySourcePackSnapshot = {
  packVersion: RegulatorySourcePack["packVersion"];
  packHash: string;
  sourceCount: number;
  evidenceGapCount: number;
  sourceReviewStatus: RegulatorySourcePack["sourceReview"]["status"];
  currentSourceCount: number;
  reviewDueCount: number;
  metadataMissingCount: number;
  reviewWindowDays: number;
  notLegalAdviceBoundary: "Not legal advice. Regulatory source pack snapshot is audit preparation source-lineage metadata only.";
};

export type CounselPackJurisdictionReadinessDigestSnapshot = {
  digestVersion: JurisdictionReadinessDigest["digestVersion"];
  digestHash: string;
  status: JurisdictionReadinessDigest["status"];
  handoffAllowed: boolean;
  jurisdictionCount: number;
  readyForCounselCount: number;
  needsEvidenceCount: number;
  needsSourceReviewCount: number;
  metadataMissingCount: number;
  openEvidenceRequestCount: number;
  sourceFreshnessBlockerCount: number;
  dueSoonSourceCount: number;
  notLegalAdviceBoundary: "Not legal advice. Jurisdiction readiness digest snapshots are audit preparation workflow metadata only.";
};

export type CounselPackVersionDiff = {
  diffVersion: "lexproof-counsel-pack-version-diff-v1";
  previousVersion: number;
  nextVersion: number;
  manifestHashChanged: boolean;
  markdownHashChanged: boolean;
  regulatorySourcePackHashChanged: boolean;
  jurisdictionReadinessDigestHashChanged: boolean;
  reviewStatusChanges: Array<{
    flagId: string;
    title: string;
    from: CounselReviewStatus;
    to: CounselReviewStatus;
  }>;
  addedSourceCount: number;
  removedSourceCount: number;
  summary: string;
  notLegalAdviceBoundary: "Not legal advice. Counsel Pack version diffs are audit preparation change metadata only.";
};

export type CounselPackVersionRecord = {
  recordVersion: "lexproof-counsel-pack-version-v1";
  id: string;
  projectId: string;
  projectName: string;
  version: number;
  title: string;
  manifestHash: string;
  markdownHash: string;
  markdownSize: number;
  riskLevel: AuditResult["riskLevel"];
  reviewSummary: CounselPackReviewSummary;
  reviewStatuses: CounselPackReviewStatusSnapshot[];
  sourcePack: CounselPackSourceSnapshot[];
  regulatorySourcePack?: CounselPackRegulatorySourcePackSnapshot;
  jurisdictionReadinessDigest?: CounselPackJurisdictionReadinessDigestSnapshot;
  exportedAt: string;
  diffFromPrevious?: CounselPackVersionDiff;
  notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only.";
};

export type CreateCounselPackVersionRecordInput = {
  project: ProjectProfile;
  audit: AuditResult;
  manifest: EvidenceManifest;
  regulatorySourcePack?: RegulatorySourcePack | null;
  jurisdictionReadinessDigest?: JurisdictionReadinessDigest | null;
  markdown: string;
  counselReviews: CounselReviewItem[];
  previousVersions?: CounselPackVersionRecord[];
  exportedAt?: string;
};

export async function createCounselPackVersionRecord({
  project,
  audit,
  manifest,
  regulatorySourcePack,
  jurisdictionReadinessDigest,
  markdown,
  counselReviews,
  previousVersions = [],
  exportedAt = new Date().toISOString()
}: CreateCounselPackVersionRecordInput): Promise<CounselPackVersionRecord> {
  const previous = latestVersion(previousVersions);
  const version = previous ? previous.version + 1 : 1;
  const markdownHash = await sha256Hex(markdown);
  const idHash = await sha256Hex(
    stableStringify({
      exportedAt,
      manifestHash: manifest.bundleHash,
      jurisdictionReadinessDigestHash: jurisdictionReadinessDigest?.digestHash ?? "",
      markdownHash,
      projectId: project.id,
      sourcePackHash: regulatorySourcePack?.packHash ?? "",
      version
    })
  );
  const regulatorySourcePackSnapshot = regulatorySourcePack ? snapshotRegulatorySourcePack(regulatorySourcePack) : undefined;
  const jurisdictionReadinessDigestSnapshot = jurisdictionReadinessDigest
    ? snapshotJurisdictionReadinessDigest(jurisdictionReadinessDigest)
    : undefined;
  const baseRecord: CounselPackVersionRecord = {
    recordVersion: "lexproof-counsel-pack-version-v1",
    id: `counsel-pack-version-${idHash.slice(0, 16)}`,
    projectId: project.id,
    projectName: project.projectName.trim(),
    version,
    title: `${project.projectName.trim()} Counsel Pack v${version}`,
    manifestHash: manifest.bundleHash,
    markdownHash,
    markdownSize: markdown.length,
    riskLevel: audit.riskLevel,
    reviewSummary: summarizeReviews(counselReviews),
    reviewStatuses: counselReviews.map(snapshotReviewStatus),
    sourcePack: audit.sourcePack.map((source) => ({
      title: source.title,
      url: source.url
    })),
    ...(regulatorySourcePackSnapshot ? { regulatorySourcePack: regulatorySourcePackSnapshot } : {}),
    ...(jurisdictionReadinessDigestSnapshot ? { jurisdictionReadinessDigest: jurisdictionReadinessDigestSnapshot } : {}),
    exportedAt,
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
  };

  if (!previous) {
    return baseRecord;
  }

  return {
    ...baseRecord,
    diffFromPrevious: createCounselPackDiff(previous, baseRecord)
  };
}

export function createCounselPackDiff(
  previous: CounselPackVersionRecord,
  next: CounselPackVersionRecord
): CounselPackVersionDiff {
  const previousReviewByFlag = new Map(previous.reviewStatuses.map((review) => [review.flagId, review]));
  const reviewStatusChanges = next.reviewStatuses.flatMap((review) => {
    const previousReview = previousReviewByFlag.get(review.flagId);
    if (!previousReview || previousReview.status === review.status) {
      return [];
    }

    return [
      {
        flagId: review.flagId,
        title: review.title,
        from: previousReview.status,
        to: review.status
      }
    ];
  });
  const previousSources = sourceSet(previous.sourcePack);
  const nextSources = sourceSet(next.sourcePack);
  const addedSourceCount = [...nextSources].filter((source) => !previousSources.has(source)).length;
  const removedSourceCount = [...previousSources].filter((source) => !nextSources.has(source)).length;
  const manifestHashChanged = previous.manifestHash !== next.manifestHash;
  const markdownHashChanged = previous.markdownHash !== next.markdownHash;
  const regulatorySourcePackHashChanged =
    (previous.regulatorySourcePack?.packHash ?? "") !== (next.regulatorySourcePack?.packHash ?? "");
  const jurisdictionReadinessDigestHashChanged =
    (previous.jurisdictionReadinessDigest?.digestHash ?? "") !== (next.jurisdictionReadinessDigest?.digestHash ?? "");

  return {
    diffVersion: "lexproof-counsel-pack-version-diff-v1",
    previousVersion: previous.version,
    nextVersion: next.version,
    manifestHashChanged,
    markdownHashChanged,
    regulatorySourcePackHashChanged,
    jurisdictionReadinessDigestHashChanged,
    reviewStatusChanges,
    addedSourceCount,
    removedSourceCount,
    summary: [
      manifestHashChanged ? "Manifest changed" : "Manifest unchanged",
      markdownHashChanged ? "Markdown changed" : "Markdown unchanged",
      regulatorySourcePackHashChanged ? "Source pack changed" : "Source pack unchanged",
      jurisdictionReadinessDigestHashChanged ? "Jurisdiction digest changed" : "Jurisdiction digest unchanged",
      `${reviewStatusChanges.length} review status ${reviewStatusChanges.length === 1 ? "changed" : "changes"}`,
      `${addedSourceCount} sources added`,
      `${removedSourceCount} sources removed.`
    ].join("; "),
    notLegalAdviceBoundary: "Not legal advice. Counsel Pack version diffs are audit preparation change metadata only."
  };
}

export function exportCounselPackVersionJson(record: CounselPackVersionRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function exportCounselPackVersionDiffJson(diff: CounselPackVersionDiff): string {
  return `${JSON.stringify(diff, null, 2)}\n`;
}

export function downloadCounselPackVersionJson(filename: string, record: CounselPackVersionRecord): void {
  const blob = new Blob([exportCounselPackVersionJson(record)], { type: "application/json;charset=utf-8" });
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

export function downloadCounselPackVersionDiffJson(filename: string, diff: CounselPackVersionDiff): void {
  const blob = new Blob([exportCounselPackVersionDiffJson(diff)], { type: "application/json;charset=utf-8" });
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

function latestVersion(records: CounselPackVersionRecord[]): CounselPackVersionRecord | undefined {
  return [...records].sort((left, right) => right.version - left.version)[0];
}

function summarizeReviews(reviews: CounselReviewItem[]): CounselPackReviewSummary {
  const reviewed = reviews.filter((review) => review.status === "reviewed").length;
  const readyForCounsel = reviews.filter((review) => review.status === "ready-for-counsel").length;
  const needsEvidence = reviews.filter((review) => review.status === "needs-evidence").length;
  const blocked = reviews.filter((review) => review.status === "blocked").length;

  return {
    total: reviews.length,
    reviewed,
    readyForCounsel,
    needsEvidence,
    blocked,
    open: reviews.length - reviewed
  };
}

function snapshotReviewStatus(review: CounselReviewItem): CounselPackReviewStatusSnapshot {
  return {
    flagId: review.flagId,
    title: review.title,
    status: review.status,
    reviewer: review.reviewer,
    evidenceSummary: review.evidenceSummary
  };
}

function snapshotRegulatorySourcePack(pack: RegulatorySourcePack): CounselPackRegulatorySourcePackSnapshot {
  return {
    packVersion: pack.packVersion,
    packHash: pack.packHash,
    sourceCount: pack.sourceCount,
    evidenceGapCount: pack.evidenceGapCount,
    sourceReviewStatus: pack.sourceReview.status,
    currentSourceCount: pack.sourceReview.currentSourceCount,
    reviewDueCount: pack.sourceReview.reviewDueCount,
    metadataMissingCount: pack.sourceReview.metadataMissingCount,
    reviewWindowDays: pack.sourceReview.reviewWindowDays,
    notLegalAdviceBoundary: "Not legal advice. Regulatory source pack snapshot is audit preparation source-lineage metadata only."
  };
}

function snapshotJurisdictionReadinessDigest(
  digest: JurisdictionReadinessDigest
): CounselPackJurisdictionReadinessDigestSnapshot {
  return {
    digestVersion: digest.digestVersion,
    digestHash: digest.digestHash,
    status: digest.status,
    handoffAllowed: digest.handoffAllowed,
    jurisdictionCount: digest.jurisdictionCount,
    readyForCounselCount: digest.summary.readyForCounselCount,
    needsEvidenceCount: digest.summary.needsEvidenceCount,
    needsSourceReviewCount: digest.summary.needsSourceReviewCount,
    metadataMissingCount: digest.summary.metadataMissingCount,
    openEvidenceRequestCount: digest.summary.openEvidenceRequestCount,
    sourceFreshnessBlockerCount: digest.summary.sourceFreshnessBlockerCount,
    dueSoonSourceCount: digest.summary.dueSoonSourceCount,
    notLegalAdviceBoundary: "Not legal advice. Jurisdiction readiness digest snapshots are audit preparation workflow metadata only."
  };
}

function sourceSet(sources: CounselPackSourceSnapshot[]): Set<string> {
  return new Set(sources.map((source) => `${source.title}\n${source.url}`));
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
