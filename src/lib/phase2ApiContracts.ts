export type Phase2ApiDomain =
  | "workspaces"
  | "evidence-vault"
  | "model-gateway"
  | "human-review"
  | "exports"
  | "audit-log";

export type Phase2ApiMethod = "GET" | "POST" | "PATCH";

export type Phase2ApiRoute = {
  method: Phase2ApiMethod;
  path: string;
  domain: Phase2ApiDomain;
  requestContract: string;
  responseContract: string;
  implemented: boolean;
  notLegalAdviceBoundary: "Not legal advice. Phase 2 APIs create audit preparation workflow records only.";
};

export type ModelGatewayBoundaryInput = {
  provider: "mock" | "openai-compatible" | "enterprise-proxy";
  model: string;
  purpose: string;
  redactionStatus: "clean" | "needs-review" | "blocked";
  includesCredentialMaterial: boolean;
  includesRawKycOrPersonalData: boolean;
  humanReviewOwner: string;
  allowedDataClasses: string[];
};

export type EvidenceUploadBoundaryInput = {
  workspaceId: string;
  filename: string;
  byteSize: number;
  declaredHash: string;
  uploadMode: "multipart" | "external-reference" | "metadata-only";
  includesRawDocumentContentInApiJson: boolean;
  containsRawKycOrPersonalData: boolean;
};

export type Phase2BoundaryValidationResult = {
  valid: boolean;
  errors: string[];
};

const notLegalAdviceBoundary = "Not legal advice. Phase 2 APIs create audit preparation workflow records only." as const;

export function listPhase2ApiRoutes(): Phase2ApiRoute[] {
  return [
    createRoute("POST", "/api/workspaces", "workspaces", "CreateWorkspaceRequest", "WorkspaceRecord", true),
    createRoute("GET", "/api/workspaces/:workspaceId", "workspaces", "WorkspaceLookupRequest", "WorkspaceRecord", true),
    createRoute("PATCH", "/api/workspaces/:workspaceId", "workspaces", "UpdateWorkspaceRequest", "WorkspaceRecord", true),
    createRoute("POST", "/api/workspaces/:workspaceId/evidence", "evidence-vault", "EvidenceUploadRequest", "EvidenceVaultRecord", true),
    createRoute("GET", "/api/workspaces/:workspaceId/evidence", "evidence-vault", "EvidenceListRequest", "EvidenceVaultRecord[]", true),
    createRoute(
      "PATCH",
      "/api/workspaces/:workspaceId/evidence/:evidenceId",
      "evidence-vault",
      "UpdateEvidenceRequest",
      "EvidenceVaultRecord",
      true
    ),
    createRoute(
      "POST",
      "/api/workspaces/:workspaceId/evidence/:evidenceId/replacement",
      "evidence-vault",
      "EvidenceReplacementRequest",
      "EvidenceReplacementResult",
      true
    ),
    createRoute("GET", "/api/workspaces/:workspaceId/evidence-manifest", "evidence-vault", "EvidenceManifestRequest", "EvidenceManifest", true),
    createRoute("GET", "/api/model-gateway/adapters", "model-gateway", "ModelGatewayAdapterListRequest", "ModelGatewayAdapterDescriptor[]", true),
    createRoute("POST", "/api/workspaces/:workspaceId/model-runs", "model-gateway", "CreateModelGatewayRunRequest", "ModelGatewayRun", true),
    createRoute("GET", "/api/workspaces/:workspaceId/model-runs", "model-gateway", "ModelGatewayRunListRequest", "ModelGatewayRunSummary[]", true),
    createRoute("GET", "/api/workspaces/:workspaceId/model-runs/:runId", "model-gateway", "ModelGatewayRunLookupRequest", "ModelGatewayRun", true),
    createRoute("POST", "/api/workspaces/:workspaceId/reviews", "human-review", "CreateHumanReviewRequest", "HumanReviewRecord", true),
    createRoute("PATCH", "/api/workspaces/:workspaceId/reviews/:reviewId", "human-review", "UpdateHumanReviewRequest", "HumanReviewRecord", true),
    createRoute("GET", "/api/workspaces/:workspaceId/reviews", "human-review", "HumanReviewListRequest", "HumanReviewRecord[]", true),
    createRoute(
      "POST",
      "/api/workspaces/:workspaceId/exports/counsel-pack",
      "exports",
      "CreateCounselPackExportRequest",
      "CounselPackExportRecord",
      true
    ),
    createRoute("GET", "/api/workspaces/:workspaceId/exports", "exports", "CounselPackExportListRequest", "CounselPackExportRecord[]", true),
    createRoute(
      "GET",
      "/api/workspaces/:workspaceId/exports/:exportId",
      "exports",
      "CounselPackExportLookupRequest",
      "CounselPackExportRecord",
      true
    ),
    createRoute("GET", "/api/workspaces/:workspaceId/audit-log", "audit-log", "AuditLogListRequest", "AuditLogRecord[]", true)
  ];
}

export function validateModelGatewayBoundary(input: ModelGatewayBoundaryInput): Phase2BoundaryValidationResult {
  const errors: string[] = [];

  if (input.redactionStatus === "blocked") {
    errors.push("Model Gateway request must pass the Redaction Gate before provider calls.");
  }

  if (input.includesCredentialMaterial) {
    errors.push("Model Gateway requests must not include API keys, private keys, or credential material.");
  }

  if (input.includesRawKycOrPersonalData) {
    errors.push("Raw KYC or personal data cannot be sent through the Model Gateway draft.");
  }

  if (requestsFinalLegalDecision(input.purpose)) {
    errors.push("Model Gateway purpose cannot request final legal decisions.");
  }

  if (!input.humanReviewOwner.trim()) {
    errors.push("Human review owner is required before external reliance on model output.");
  }

  if (!Array.isArray(input.allowedDataClasses) || input.allowedDataClasses.length === 0) {
    errors.push("Allowed data classes are required before Model Gateway runs.");
  }

  if (!allowedDataClassesAreSafe(input.allowedDataClasses ?? [])) {
    errors.push(
      "Allowed data classes must be limited to audit-prep metadata, evidence hashes, risk flag summaries, regulatory source references, or model receipts."
    );
  }

  return { valid: errors.length === 0, errors };
}

export function validateEvidenceUploadBoundary(input: EvidenceUploadBoundaryInput): Phase2BoundaryValidationResult {
  const errors: string[] = [];

  if (!input.workspaceId.trim()) {
    errors.push("Workspace ID is required before evidence upload.");
  }

  if (!input.filename.trim()) {
    errors.push("Evidence filename is required before upload.");
  }

  if (input.byteSize <= 0) {
    errors.push("Evidence byte size must be greater than zero.");
  }

  if (!input.declaredHash.trim()) {
    errors.push("Evidence upload must declare or compute a SHA-256 hash.");
  }

  if (input.includesRawDocumentContentInApiJson) {
    errors.push("Evidence upload JSON must carry metadata only, not raw document content.");
  }

  if (input.containsRawKycOrPersonalData) {
    errors.push("Raw KYC or personal data cannot be accepted in the Phase 2 evidence upload draft.");
  }

  return { valid: errors.length === 0, errors };
}

export function createPhase2PrismaSchemaDraft(): string {
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model WorkspaceRecord {
  id                     String   @id
  name                   String
  organizationName       String
  ownerId                String
  status                 String
  createdAt              DateTime
  updatedAt              DateTime
  notLegalAdviceBoundary String
}

model EvidenceVaultRecord {
  id                           String   @id
  workspaceId                  String
  filename                     String
  mimeType                     String
  byteSize                     Int
  fileHash                     String
  storageMode                  String
  status                       String
  owner                        String
  sourceNote                   String
  version                      Int
  linkedRiskFlagIdsJson        String
  containsRawKycOrPersonalData Boolean
  parentEvidenceId             String?
  supersededByEvidenceId       String?
  replacementReason            String?
  createdAt                    DateTime
  updatedAt                    DateTime

  @@index([workspaceId])
  @@index([parentEvidenceId])
}

model ModelGatewayRun {
  id                     String    @id
  workspaceId            String
  provider               String
  providerLabel          String
  model                  String
  purpose                String
  status                 String
  redactionStatus        String
  payloadHash            String
  responseHash           String
  sourceEvidenceHash     String
  providerMetadataJson   String
  humanReviewStatus      String
  attempt                Int
  maxAttempts            Int
  retryState             String
  errorCode              String?
  errorMessage           String?
  remediationStepsJson   String
  createdAt              DateTime
  completedAt            DateTime?
  notLegalAdviceBoundary String

  @@index([workspaceId])
}

model HumanReviewRecord {
  id                     String   @id
  workspaceId            String
  targetType             String
  targetId               String
  reviewerId             String
  status                 String
  comment                String
  createdAt              DateTime
  updatedAt              DateTime
  notLegalAdviceBoundary String

  @@index([workspaceId])
}

model CounselPackExportRecord {
  id                     String   @id
  workspaceId            String
  exportType             String
  format                 String
  version                Int
  projectName            String
  title                  String
  artifactName           String
  manifestHash           String
  artifactHash           String
  artifactSize           Int
  riskLevel              String
  reviewSummaryJson      String
  sourceCount            Int
  createdBy              String
  status                 String
  createdAt              DateTime
  notLegalAdviceBoundary String

  @@index([workspaceId])
}

model AuditLogRecord {
  id                     String   @id
  workspaceId            String
  actorId                String
  action                 String
  targetType             String
  targetId               String
  beforeHash             String
  afterHash              String
  summary                String
  createdAt              DateTime
  notLegalAdviceBoundary String

  @@index([workspaceId])
}
`;
}

function createRoute(
  method: Phase2ApiMethod,
  path: string,
  domain: Phase2ApiDomain,
  requestContract: string,
  responseContract: string,
  implemented = false
): Phase2ApiRoute {
  return {
    method,
    path,
    domain,
    requestContract,
    responseContract,
    implemented,
    notLegalAdviceBoundary
  };
}

function allowedDataClassesAreSafe(classes: string[]): boolean {
  const allowed = new Set([
    "audit-prep metadata",
    "evidence hashes",
    "risk flag summaries",
    "regulatory source references",
    "model receipts"
  ]);

  return classes.length > 0 && classes.every((item) => allowed.has(item.trim().toLowerCase()));
}

function requestsFinalLegalDecision(purpose: string): boolean {
  return /\b(final legal decision|legal decision|launch approval|adjudicat|determine legality|legal conclusion)\b/i.test(purpose);
}
