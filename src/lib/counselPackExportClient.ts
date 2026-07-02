import type { CounselPackExportRecord } from "./phase2Types";
import type { CounselPackVersionRecord } from "./counselPackVersions";
import { asSafeApiErrorResponse } from "./apiErrorClient";

export type CreateServerCounselPackExportInput = {
  workspaceId: string;
  versionRecord: CounselPackVersionRecord;
  createdBy: string;
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
};

type ErrorResponse = {
  error?: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

export type CounselPackExportClientErrorDetails = {
  message: string;
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;
};

export class CounselPackExportClientError extends Error {
  code?: string;
  recoveryAction?: string;
  notLegalAdviceBoundary?: string;

  constructor(details: CounselPackExportClientErrorDetails) {
    super(details.message);
    this.name = "CounselPackExportClientError";
    this.code = details.code;
    this.recoveryAction = details.recoveryAction;
    this.notLegalAdviceBoundary = details.notLegalAdviceBoundary;
  }
}

export async function createServerCounselPackExportRecord({
  workspaceId,
  versionRecord,
  createdBy,
  apiBaseUrl,
  fetcher = globalThis.fetch?.bind(globalThis)
}: CreateServerCounselPackExportInput): Promise<CounselPackExportRecord> {
  if (!fetcher) {
    throw new Error("Fetch is required to create a server Counsel Pack export record.");
  }
  if (!versionRecord.regulatorySourcePack?.packHash) {
    throw new Error("Save a fresh Counsel Pack version with Regulatory Source Pack metadata before server export.");
  }

  const response = await fetcher(buildWorkspaceUrl(apiBaseUrl, workspaceId, "exports/counsel-pack"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectName: versionRecord.projectName,
      title: versionRecord.title,
      format: "markdown",
      artifactName: `${slug(versionRecord.projectName)}-counsel-pack-v${versionRecord.version}.md`,
      manifestHash: versionRecord.manifestHash,
      artifactHash: versionRecord.markdownHash,
      artifactSize: versionRecord.markdownSize,
      riskLevel: versionRecord.riskLevel,
      reviewSummary: versionRecord.reviewSummary,
      sourceCount: versionRecord.sourcePack.length,
      sourcePackHash: versionRecord.regulatorySourcePack.packHash,
      sourceReviewStatus: versionRecord.regulatorySourcePack.sourceReviewStatus,
      createdBy: createdBy.trim() || "Compliance",
      includesRawKycOrPersonalData: false,
      includesCredentialMaterial: false
    })
  });

  const payload = (await response.json().catch(() => ({}))) as CounselPackExportRecord | ErrorResponse;

  if (!response.ok) {
    const safeError = asSafeApiErrorResponse(payload);
    throw new CounselPackExportClientError({
      message: safeError.error || "Server Counsel Pack export record creation failed.",
      code: safeError.code,
      recoveryAction: safeError.recoveryAction,
      notLegalAdviceBoundary: safeError.notLegalAdviceBoundary
    });
  }

  return payload as CounselPackExportRecord;
}

function buildWorkspaceUrl(apiBaseUrl: string | undefined, workspaceId: string, route: string): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/api/workspaces/${encodeURIComponent(workspaceId)}/${route}`;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "lexproof"
  );
}
