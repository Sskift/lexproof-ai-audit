import type { AuditResult } from "./auditEngine";
import type { CounselReviewItem, CounselReviewStatus } from "./counselReview";
import { redactClassifiedText } from "./dataClassification";
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

const COUNSEL_PACK_VERSION_BOUNDARY = "Not legal advice. Counsel Pack version records are audit preparation export metadata only." as const;
const COUNSEL_PACK_DIFF_BOUNDARY = "Not legal advice. Counsel Pack version diffs are audit preparation change metadata only." as const;
const REGULATORY_SOURCE_PACK_SNAPSHOT_BOUNDARY =
  "Not legal advice. Regulatory source pack snapshot is audit preparation source-lineage metadata only." as const;
const JURISDICTION_READINESS_DIGEST_SNAPSHOT_BOUNDARY =
  "Not legal advice. Jurisdiction readiness digest snapshots are audit preparation workflow metadata only." as const;
const counselReviewStatuses = ["not-started", "needs-evidence", "ready-for-counsel", "reviewed", "blocked"] as const;
const riskLevels = ["low", "moderate", "high", "critical"] as const;
const sourceReviewStatuses = ["current", "review-due", "metadata-missing"] as const;
const jurisdictionReadinessStatuses = [
  "ready-for-counsel",
  "needs-evidence",
  "needs-source-review",
  "metadata-missing",
  "no-jurisdictions"
] as const;
const sha256HexPattern = /^[a-f0-9]{64}$/;
const legalConclusionPattern =
  /\b(final\s+legal\s+decision|legal\s+opinion|legal\s+approval|legally\s+compliant|legally\s+non-compliant|compliance\s+decision)\b/gi;

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
  const projectId = sanitizeCounselPackVersionText(project.id) || "project";
  const projectName = sanitizeCounselPackVersionText(project.projectName) || "Project";
  const markdownHash = await sha256Hex(markdown);
  const idHash = await sha256Hex(
    stableStringify({
      exportedAt,
      manifestHash: manifest.bundleHash,
      jurisdictionReadinessDigestHash: jurisdictionReadinessDigest?.digestHash ?? "",
      markdownHash,
      projectId,
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
    projectId,
    projectName,
    version,
    title: `${projectName} Counsel Pack v${version}`,
    manifestHash: manifest.bundleHash,
    markdownHash,
    markdownSize: markdown.length,
    riskLevel: audit.riskLevel,
    reviewSummary: summarizeReviews(counselReviews),
    reviewStatuses: counselReviews.map(snapshotReviewStatus),
    sourcePack: audit.sourcePack.map((source) => ({
      title: sanitizeCounselPackVersionText(source.title),
      url: sanitizeCounselPackVersionText(source.url)
    })),
    ...(regulatorySourcePackSnapshot ? { regulatorySourcePack: regulatorySourcePackSnapshot } : {}),
    ...(jurisdictionReadinessDigestSnapshot ? { jurisdictionReadinessDigest: jurisdictionReadinessDigestSnapshot } : {}),
    exportedAt,
    notLegalAdviceBoundary: COUNSEL_PACK_VERSION_BOUNDARY
  };
  const sanitizedBaseRecord = sanitizeCounselPackVersionRecord(baseRecord);

  if (!previous) {
    return sanitizedBaseRecord;
  }

  return {
    ...sanitizedBaseRecord,
    diffFromPrevious: createCounselPackDiff(previous, sanitizedBaseRecord)
  };
}

export function createCounselPackDiff(
  previous: CounselPackVersionRecord,
  next: CounselPackVersionRecord
): CounselPackVersionDiff {
  const safePrevious = sanitizeCounselPackVersionRecord(previous);
  const safeNext = sanitizeCounselPackVersionRecord(next);
  const previousReviewByFlag = new Map(safePrevious.reviewStatuses.map((review) => [review.flagId, review]));
  const reviewStatusChanges = safeNext.reviewStatuses.flatMap((review) => {
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
  const previousSources = sourceSet(safePrevious.sourcePack);
  const nextSources = sourceSet(safeNext.sourcePack);
  const addedSourceCount = [...nextSources].filter((source) => !previousSources.has(source)).length;
  const removedSourceCount = [...previousSources].filter((source) => !nextSources.has(source)).length;
  const manifestHashChanged = safePrevious.manifestHash !== safeNext.manifestHash;
  const markdownHashChanged = safePrevious.markdownHash !== safeNext.markdownHash;
  const regulatorySourcePackHashChanged =
    (safePrevious.regulatorySourcePack?.packHash ?? "") !== (safeNext.regulatorySourcePack?.packHash ?? "");
  const jurisdictionReadinessDigestHashChanged =
    (safePrevious.jurisdictionReadinessDigest?.digestHash ?? "") !== (safeNext.jurisdictionReadinessDigest?.digestHash ?? "");

  return sanitizeCounselPackVersionDiff({
    diffVersion: "lexproof-counsel-pack-version-diff-v1",
    previousVersion: safePrevious.version,
    nextVersion: safeNext.version,
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
    notLegalAdviceBoundary: COUNSEL_PACK_DIFF_BOUNDARY
  });
}

export function parseStoredCounselPackVersions(raw: string | null | undefined): CounselPackVersionRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.flatMap((item) => {
          const record = parseCounselPackVersionRecord(item);
          return record ? [record] : [];
        })
      : [];
  } catch {
    return [];
  }
}

export function parseCounselPackVersionRecord(value: unknown): CounselPackVersionRecord | null {
  if (!isRecord(value) || value.recordVersion !== "lexproof-counsel-pack-version-v1") {
    return null;
  }
  if (value.notLegalAdviceBoundary !== COUNSEL_PACK_VERSION_BOUNDARY) {
    return null;
  }

  const reviewSummary = parseReviewSummary(value.reviewSummary);
  const reviewStatuses = parseArray(value.reviewStatuses, parseReviewStatusSnapshot);
  const sourcePack = parseArray(value.sourcePack, parseSourceSnapshot);
  const regulatorySourcePack =
    value.regulatorySourcePack === undefined ? undefined : parseRegulatorySourcePackSnapshot(value.regulatorySourcePack);
  const jurisdictionReadinessDigest =
    value.jurisdictionReadinessDigest === undefined
      ? undefined
      : parseJurisdictionReadinessDigestSnapshot(value.jurisdictionReadinessDigest);
  const diffFromPrevious = value.diffFromPrevious === undefined ? undefined : parseCounselPackVersionDiff(value.diffFromPrevious);

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.projectId) ||
    !isNonEmptyString(value.projectName) ||
    !isPositiveInteger(value.version) ||
    !isNonEmptyString(value.title) ||
    !isSha256Hex(value.manifestHash) ||
    !isSha256Hex(value.markdownHash) ||
    !isCount(value.markdownSize) ||
    !isOneOf(value.riskLevel, riskLevels) ||
    !reviewSummary ||
    !reviewStatuses ||
    !sourcePack ||
    regulatorySourcePack === null ||
    jurisdictionReadinessDigest === null ||
    diffFromPrevious === null ||
    !isStrictIsoTimestamp(value.exportedAt)
  ) {
    return null;
  }

  return sanitizeCounselPackVersionRecord({
    recordVersion: "lexproof-counsel-pack-version-v1",
    id: value.id,
    projectId: value.projectId,
    projectName: value.projectName,
    version: value.version,
    title: value.title,
    manifestHash: value.manifestHash,
    markdownHash: value.markdownHash,
    markdownSize: value.markdownSize,
    riskLevel: value.riskLevel,
    reviewSummary,
    reviewStatuses,
    sourcePack,
    ...(regulatorySourcePack ? { regulatorySourcePack } : {}),
    ...(jurisdictionReadinessDigest ? { jurisdictionReadinessDigest } : {}),
    exportedAt: value.exportedAt,
    ...(diffFromPrevious ? { diffFromPrevious } : {}),
    notLegalAdviceBoundary: COUNSEL_PACK_VERSION_BOUNDARY
  });
}

export function sanitizeCounselPackVersionRecord(record: CounselPackVersionRecord): CounselPackVersionRecord {
  const regulatorySourcePack = record.regulatorySourcePack
    ? sanitizeRegulatorySourcePackSnapshot(record.regulatorySourcePack)
    : undefined;
  const jurisdictionReadinessDigest = record.jurisdictionReadinessDigest
    ? sanitizeJurisdictionReadinessDigestSnapshot(record.jurisdictionReadinessDigest)
    : undefined;
  const diffFromPrevious = record.diffFromPrevious ? sanitizeCounselPackVersionDiff(record.diffFromPrevious) : undefined;

  return {
    recordVersion: "lexproof-counsel-pack-version-v1",
    id: sanitizeCounselPackVersionText(record.id) || "counsel-pack-version",
    projectId: sanitizeCounselPackVersionText(record.projectId) || "project",
    projectName: sanitizeCounselPackVersionText(record.projectName) || "Project",
    version: record.version,
    title: sanitizeCounselPackVersionText(record.title) || `Counsel Pack v${record.version}`,
    manifestHash: record.manifestHash,
    markdownHash: record.markdownHash,
    markdownSize: record.markdownSize,
    riskLevel: record.riskLevel,
    reviewSummary: { ...record.reviewSummary },
    reviewStatuses: record.reviewStatuses.map(sanitizeReviewStatusSnapshot),
    sourcePack: record.sourcePack.map((source) => ({
      title: sanitizeCounselPackVersionText(source.title),
      url: sanitizeCounselPackVersionText(source.url)
    })),
    ...(regulatorySourcePack ? { regulatorySourcePack } : {}),
    ...(jurisdictionReadinessDigest ? { jurisdictionReadinessDigest } : {}),
    exportedAt: sanitizeCounselPackVersionText(record.exportedAt),
    ...(diffFromPrevious ? { diffFromPrevious } : {}),
    notLegalAdviceBoundary: COUNSEL_PACK_VERSION_BOUNDARY
  };
}

export function exportCounselPackVersionJson(record: CounselPackVersionRecord): string {
  return `${JSON.stringify(sanitizeCounselPackVersionRecord(record), null, 2)}\n`;
}

export function exportCounselPackVersionDiffJson(diff: CounselPackVersionDiff): string {
  return `${JSON.stringify(sanitizeCounselPackVersionDiff(diff), null, 2)}\n`;
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
  return records.map(sanitizeCounselPackVersionRecord).sort((left, right) => right.version - left.version)[0];
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
    flagId: sanitizeCounselPackVersionText(review.flagId),
    title: sanitizeCounselPackVersionText(review.title),
    status: review.status,
    reviewer: sanitizeCounselPackVersionText(review.reviewer),
    evidenceSummary: sanitizeCounselPackVersionText(review.evidenceSummary)
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
    notLegalAdviceBoundary: REGULATORY_SOURCE_PACK_SNAPSHOT_BOUNDARY
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
    notLegalAdviceBoundary: JURISDICTION_READINESS_DIGEST_SNAPSHOT_BOUNDARY
  };
}

function parseCounselPackVersionDiff(value: unknown): CounselPackVersionDiff | null {
  if (!isRecord(value) || value.diffVersion !== "lexproof-counsel-pack-version-diff-v1") {
    return null;
  }
  if (
    value.notLegalAdviceBoundary !== COUNSEL_PACK_DIFF_BOUNDARY ||
    !isPositiveInteger(value.previousVersion) ||
    !isPositiveInteger(value.nextVersion) ||
    typeof value.manifestHashChanged !== "boolean" ||
    typeof value.markdownHashChanged !== "boolean" ||
    typeof value.regulatorySourcePackHashChanged !== "boolean" ||
    typeof value.jurisdictionReadinessDigestHashChanged !== "boolean" ||
    !isCount(value.addedSourceCount) ||
    !isCount(value.removedSourceCount) ||
    typeof value.summary !== "string"
  ) {
    return null;
  }

  const reviewStatusChanges = parseArray(value.reviewStatusChanges, parseReviewStatusChange);
  if (!reviewStatusChanges) {
    return null;
  }

  return sanitizeCounselPackVersionDiff({
    diffVersion: "lexproof-counsel-pack-version-diff-v1",
    previousVersion: value.previousVersion,
    nextVersion: value.nextVersion,
    manifestHashChanged: value.manifestHashChanged,
    markdownHashChanged: value.markdownHashChanged,
    regulatorySourcePackHashChanged: value.regulatorySourcePackHashChanged,
    jurisdictionReadinessDigestHashChanged: value.jurisdictionReadinessDigestHashChanged,
    reviewStatusChanges,
    addedSourceCount: value.addedSourceCount,
    removedSourceCount: value.removedSourceCount,
    summary: value.summary,
    notLegalAdviceBoundary: COUNSEL_PACK_DIFF_BOUNDARY
  });
}

function sanitizeCounselPackVersionDiff(diff: CounselPackVersionDiff): CounselPackVersionDiff {
  return {
    diffVersion: "lexproof-counsel-pack-version-diff-v1",
    previousVersion: diff.previousVersion,
    nextVersion: diff.nextVersion,
    manifestHashChanged: diff.manifestHashChanged,
    markdownHashChanged: diff.markdownHashChanged,
    regulatorySourcePackHashChanged: diff.regulatorySourcePackHashChanged,
    jurisdictionReadinessDigestHashChanged: diff.jurisdictionReadinessDigestHashChanged,
    reviewStatusChanges: diff.reviewStatusChanges.map((change) => ({
      flagId: sanitizeCounselPackVersionText(change.flagId),
      title: sanitizeCounselPackVersionText(change.title),
      from: change.from,
      to: change.to
    })),
    addedSourceCount: diff.addedSourceCount,
    removedSourceCount: diff.removedSourceCount,
    summary: sanitizeCounselPackVersionText(diff.summary),
    notLegalAdviceBoundary: COUNSEL_PACK_DIFF_BOUNDARY
  };
}

function parseReviewStatusChange(value: unknown): CounselPackVersionDiff["reviewStatusChanges"][number] | null {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.flagId) ||
    !isNonEmptyString(value.title) ||
    !isOneOf(value.from, counselReviewStatuses) ||
    !isOneOf(value.to, counselReviewStatuses)
  ) {
    return null;
  }

  return {
    flagId: sanitizeCounselPackVersionText(value.flagId),
    title: sanitizeCounselPackVersionText(value.title),
    from: value.from,
    to: value.to
  };
}

function parseReviewSummary(value: unknown): CounselPackReviewSummary | null {
  if (
    !isRecord(value) ||
    !isCount(value.total) ||
    !isCount(value.reviewed) ||
    !isCount(value.readyForCounsel) ||
    !isCount(value.needsEvidence) ||
    !isCount(value.blocked) ||
    !isCount(value.open)
  ) {
    return null;
  }

  return {
    total: value.total,
    reviewed: value.reviewed,
    readyForCounsel: value.readyForCounsel,
    needsEvidence: value.needsEvidence,
    blocked: value.blocked,
    open: value.open
  };
}

function parseReviewStatusSnapshot(value: unknown): CounselPackReviewStatusSnapshot | null {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.flagId) ||
    !isNonEmptyString(value.title) ||
    !isOneOf(value.status, counselReviewStatuses) ||
    typeof value.reviewer !== "string" ||
    typeof value.evidenceSummary !== "string"
  ) {
    return null;
  }

  return sanitizeReviewStatusSnapshot({
    flagId: value.flagId,
    title: value.title,
    status: value.status,
    reviewer: value.reviewer,
    evidenceSummary: value.evidenceSummary
  });
}

function sanitizeReviewStatusSnapshot(review: CounselPackReviewStatusSnapshot): CounselPackReviewStatusSnapshot {
  return {
    flagId: sanitizeCounselPackVersionText(review.flagId),
    title: sanitizeCounselPackVersionText(review.title),
    status: review.status,
    reviewer: sanitizeCounselPackVersionText(review.reviewer),
    evidenceSummary: sanitizeCounselPackVersionText(review.evidenceSummary)
  };
}

function parseSourceSnapshot(value: unknown): CounselPackSourceSnapshot | null {
  if (!isRecord(value) || !isNonEmptyString(value.title) || !isHttpUrl(value.url)) {
    return null;
  }

  return {
    title: sanitizeCounselPackVersionText(value.title),
    url: sanitizeCounselPackVersionText(value.url)
  };
}

function parseRegulatorySourcePackSnapshot(value: unknown): CounselPackRegulatorySourcePackSnapshot | null {
  if (
    !isRecord(value) ||
    value.packVersion !== "lexproof-regulatory-source-pack-v1" ||
    value.notLegalAdviceBoundary !== REGULATORY_SOURCE_PACK_SNAPSHOT_BOUNDARY ||
    !isSha256Hex(value.packHash) ||
    !isCount(value.sourceCount) ||
    !isCount(value.evidenceGapCount) ||
    !isOneOf(value.sourceReviewStatus, sourceReviewStatuses) ||
    !isCount(value.currentSourceCount) ||
    !isCount(value.reviewDueCount) ||
    !isCount(value.metadataMissingCount) ||
    !isPositiveInteger(value.reviewWindowDays)
  ) {
    return null;
  }

  return sanitizeRegulatorySourcePackSnapshot({
    packVersion: "lexproof-regulatory-source-pack-v1",
    packHash: value.packHash,
    sourceCount: value.sourceCount,
    evidenceGapCount: value.evidenceGapCount,
    sourceReviewStatus: value.sourceReviewStatus,
    currentSourceCount: value.currentSourceCount,
    reviewDueCount: value.reviewDueCount,
    metadataMissingCount: value.metadataMissingCount,
    reviewWindowDays: value.reviewWindowDays,
    notLegalAdviceBoundary: REGULATORY_SOURCE_PACK_SNAPSHOT_BOUNDARY
  });
}

function sanitizeRegulatorySourcePackSnapshot(
  snapshot: CounselPackRegulatorySourcePackSnapshot
): CounselPackRegulatorySourcePackSnapshot {
  return {
    packVersion: "lexproof-regulatory-source-pack-v1",
    packHash: snapshot.packHash,
    sourceCount: snapshot.sourceCount,
    evidenceGapCount: snapshot.evidenceGapCount,
    sourceReviewStatus: snapshot.sourceReviewStatus,
    currentSourceCount: snapshot.currentSourceCount,
    reviewDueCount: snapshot.reviewDueCount,
    metadataMissingCount: snapshot.metadataMissingCount,
    reviewWindowDays: snapshot.reviewWindowDays,
    notLegalAdviceBoundary: REGULATORY_SOURCE_PACK_SNAPSHOT_BOUNDARY
  };
}

function parseJurisdictionReadinessDigestSnapshot(value: unknown): CounselPackJurisdictionReadinessDigestSnapshot | null {
  if (
    !isRecord(value) ||
    value.digestVersion !== "lexproof-jurisdiction-readiness-digest-v1" ||
    value.notLegalAdviceBoundary !== JURISDICTION_READINESS_DIGEST_SNAPSHOT_BOUNDARY ||
    !isSha256Hex(value.digestHash) ||
    !isOneOf(value.status, jurisdictionReadinessStatuses) ||
    typeof value.handoffAllowed !== "boolean" ||
    !isCount(value.jurisdictionCount) ||
    !isCount(value.readyForCounselCount) ||
    !isCount(value.needsEvidenceCount) ||
    !isCount(value.needsSourceReviewCount) ||
    !isCount(value.metadataMissingCount) ||
    !isCount(value.openEvidenceRequestCount) ||
    !isCount(value.sourceFreshnessBlockerCount) ||
    !isCount(value.dueSoonSourceCount)
  ) {
    return null;
  }

  return sanitizeJurisdictionReadinessDigestSnapshot({
    digestVersion: "lexproof-jurisdiction-readiness-digest-v1",
    digestHash: value.digestHash,
    status: value.status,
    handoffAllowed: value.handoffAllowed,
    jurisdictionCount: value.jurisdictionCount,
    readyForCounselCount: value.readyForCounselCount,
    needsEvidenceCount: value.needsEvidenceCount,
    needsSourceReviewCount: value.needsSourceReviewCount,
    metadataMissingCount: value.metadataMissingCount,
    openEvidenceRequestCount: value.openEvidenceRequestCount,
    sourceFreshnessBlockerCount: value.sourceFreshnessBlockerCount,
    dueSoonSourceCount: value.dueSoonSourceCount,
    notLegalAdviceBoundary: JURISDICTION_READINESS_DIGEST_SNAPSHOT_BOUNDARY
  });
}

function sanitizeJurisdictionReadinessDigestSnapshot(
  snapshot: CounselPackJurisdictionReadinessDigestSnapshot
): CounselPackJurisdictionReadinessDigestSnapshot {
  return {
    digestVersion: "lexproof-jurisdiction-readiness-digest-v1",
    digestHash: snapshot.digestHash,
    status: snapshot.status,
    handoffAllowed: snapshot.handoffAllowed,
    jurisdictionCount: snapshot.jurisdictionCount,
    readyForCounselCount: snapshot.readyForCounselCount,
    needsEvidenceCount: snapshot.needsEvidenceCount,
    needsSourceReviewCount: snapshot.needsSourceReviewCount,
    metadataMissingCount: snapshot.metadataMissingCount,
    openEvidenceRequestCount: snapshot.openEvidenceRequestCount,
    sourceFreshnessBlockerCount: snapshot.sourceFreshnessBlockerCount,
    dueSoonSourceCount: snapshot.dueSoonSourceCount,
    notLegalAdviceBoundary: JURISDICTION_READINESS_DIGEST_SNAPSHOT_BOUNDARY
  };
}

function parseArray<T>(value: unknown, parser: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed: T[] = [];
  for (const item of value) {
    const parsedItem = parser(item);
    if (!parsedItem) {
      return null;
    }
    parsed.push(parsedItem);
  }
  return parsed;
}

function sanitizeCounselPackVersionText(value: string): string {
  return redactClassifiedText(value)
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<const T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && sha256HexPattern.test(value);
}

function isStrictIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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
