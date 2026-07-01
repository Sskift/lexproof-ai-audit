export const evidenceStatuses = ["draft", "requested", "received", "under-review", "verified", "rejected"] as const;

export type EvidenceStatus = (typeof evidenceStatuses)[number];

export type EvidenceOwner = "Counsel" | "Compliance" | "Engineering" | "Product" | "Founder";

export type EvidenceItem = {
  id?: string;
  label: string;
  kind: string;
  content: string;
  source?: string;
  status?: EvidenceStatus;
  owner?: EvidenceOwner;
  addedAt?: string;
  updatedAt?: string;
};

export type AuditInputProfile = {
  projectName: string;
  entityType: string;
  jurisdictions: string[];
  assetModel: string;
  userType: string;
  custodyModel: string;
  dataSensitivity: string;
  aiUsage: string;
  blockchainUse: string;
  operatingStage: string;
  evidenceItems: EvidenceItem[];
};

export type ProjectProfile = AuditInputProfile & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateProjectProfile(profile: Partial<AuditInputProfile>): ProjectValidationResult {
  const errors: string[] = [];

  if (!hasText(profile.projectName)) {
    errors.push("Project name is required.");
  }

  if (!hasText(profile.entityType)) {
    errors.push("Entity type is required.");
  }

  if (!Array.isArray(profile.jurisdictions) || profile.jurisdictions.filter(hasText).length === 0) {
    errors.push("At least one jurisdiction is required.");
  }

  if (!hasText(profile.assetModel)) {
    errors.push("Asset model is required.");
  }

  if (!hasText(profile.userType)) {
    errors.push("User exposure is required.");
  }

  if (!hasText(profile.custodyModel)) {
    errors.push("Custody model is required.");
  }

  if (!hasText(profile.dataSensitivity)) {
    errors.push("Data sensitivity is required.");
  }

  if (!hasText(profile.aiUsage)) {
    errors.push("AI usage is required.");
  }

  if (!hasText(profile.blockchainUse)) {
    errors.push("Blockchain use is required.");
  }

  if (!hasText(profile.operatingStage)) {
    errors.push("Operating stage is required.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function isEvidenceStatus(value: unknown): value is EvidenceStatus {
  return typeof value === "string" && evidenceStatuses.includes(value as EvidenceStatus);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
