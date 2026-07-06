import { classifyDataBoundaryText, type ClassifiedDataFinding } from "./dataClassification";

export const evidenceStatuses = ["draft", "requested", "received", "under-review", "verified", "rejected"] as const;
export const evidenceOwners = ["Counsel", "Compliance", "Engineering", "Product", "Founder"] as const;

export type EvidenceStatus = (typeof evidenceStatuses)[number];

export type EvidenceOwner = (typeof evidenceOwners)[number];

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

const PROFILE_IMPORT_BOUNDARY = "Not legal advice. Imported profiles are audit preparation metadata only." as const;

export type ProjectProfileImportResult =
  | {
      ok: true;
      profile: ProjectProfile;
      warnings: string[];
      notLegalAdviceBoundary: typeof PROFILE_IMPORT_BOUNDARY;
    }
  | {
      ok: false;
      errors: string[];
      notLegalAdviceBoundary: typeof PROFILE_IMPORT_BOUNDARY;
    };

const unsafeProjectMetadataError =
  "Project profile metadata must not include credentials, private keys, raw KYC, direct personal identifiers, or wallet addresses.";
const unsafeEvidenceImportError =
  "Imported evidence metadata must not include credentials, private keys, raw KYC, direct personal identifiers, or wallet addresses.";

export function importProjectProfileJson(json: string, options: { importedAt?: string } = {}): ProjectProfileImportResult {
  const parsed = parseJsonObject(json);
  if (!parsed.ok) {
    return {
      ok: false,
      errors: [parsed.error],
      notLegalAdviceBoundary: PROFILE_IMPORT_BOUNDARY
    };
  }

  const importedAt = options.importedAt ?? new Date().toISOString();
  const projectName = stringValue(parsed.value.projectName);
  const projectId = stringValue(parsed.value.id) || `import-${slugify(projectName || "project")}`;
  const evidenceNormalization = normalizeImportedEvidenceItems(parsed.value.evidenceItems, projectId, importedAt);
  const profile: ProjectProfile = {
    id: projectId,
    projectName,
    entityType: stringValue(parsed.value.entityType),
    jurisdictions: listValue(parsed.value.jurisdictions),
    assetModel: stringValue(parsed.value.assetModel),
    userType: stringValue(parsed.value.userType),
    custodyModel: stringValue(parsed.value.custodyModel),
    dataSensitivity: stringValue(parsed.value.dataSensitivity),
    aiUsage: stringValue(parsed.value.aiUsage),
    blockchainUse: stringValue(parsed.value.blockchainUse),
    operatingStage: stringValue(parsed.value.operatingStage),
    evidenceItems: evidenceNormalization.items,
    createdAt: stringValue(parsed.value.createdAt) || importedAt,
    updatedAt: importedAt
  };
  const validation = validateProjectProfile(profile);
  const errors = [...validation.errors];

  if (containsUnsafeImportedEvidenceMetadata(profile.evidenceItems)) {
    errors.push(unsafeEvidenceImportError);
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      notLegalAdviceBoundary: PROFILE_IMPORT_BOUNDARY
    };
  }

  return {
    ok: true,
    profile,
    warnings: evidenceNormalization.warnings,
    notLegalAdviceBoundary: PROFILE_IMPORT_BOUNDARY
  };
}

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

  if (containsUnsafeProjectMetadata(profile)) {
    errors.push(unsafeProjectMetadataError);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function isEvidenceStatus(value: unknown): value is EvidenceStatus {
  return typeof value === "string" && evidenceStatuses.includes(value as EvidenceStatus);
}

export function isEvidenceOwner(value: unknown): value is EvidenceOwner {
  return typeof value === "string" && evidenceOwners.includes(value as EvidenceOwner);
}

function parseJsonObject(json: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (!json.trim()) {
    return { ok: false, error: "Project profile JSON is required." };
  }

  try {
    const value = JSON.parse(json) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "Project profile JSON must be an object with project facts." };
    }
    return { ok: true, value: value as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Project profile JSON is not valid JSON." };
  }
}

function normalizeImportedEvidenceItems(
  value: unknown,
  projectId: string,
  importedAt: string
): { items: EvidenceItem[]; warnings: string[] } {
  if (value == null) {
    return { items: [], warnings: [] };
  }

  if (!Array.isArray(value)) {
    return {
      items: [],
      warnings: ["Imported evidenceItems was not an array, so no evidence metadata was imported."]
    };
  }

  const warnings: string[] = [];
  const items = value.flatMap((item, index): EvidenceItem[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      warnings.push(`Skipped evidence item ${index + 1} because it was not an object.`);
      return [];
    }

    const record = item as Record<string, unknown>;
    const status = isEvidenceStatus(record.status) ? record.status : "draft";
    const owner = isEvidenceOwner(record.owner) ? record.owner : "Founder";
    if (record.status != null && !isEvidenceStatus(record.status)) {
      warnings.push(`Evidence item ${index + 1} had an unknown status and was imported as draft.`);
    }
    if (record.owner != null && !isEvidenceOwner(record.owner)) {
      warnings.push(`Evidence item ${index + 1} had an unknown owner and was assigned to Founder.`);
    }

    return [
      {
        id: stringValue(record.id) || `${projectId}-evidence-${index + 1}`,
        label: stringValue(record.label) || `Imported evidence ${index + 1}`,
        kind: stringValue(record.kind) || "Text",
        content: stringValue(record.content),
        source: stringValue(record.source),
        status,
        owner,
        addedAt: stringValue(record.addedAt) || importedAt,
        updatedAt: importedAt
      }
    ];
  });

  return { items, warnings };
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function listValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(stringValue).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function containsUnsafeProjectMetadata(profile: Partial<AuditInputProfile> & { id?: string }): boolean {
  const metadata = [
    profile.id,
    profile.projectName,
    profile.entityType,
    ...(Array.isArray(profile.jurisdictions) ? profile.jurisdictions : []),
    profile.assetModel,
    profile.userType,
    profile.custodyModel,
    profile.dataSensitivity,
    profile.aiUsage,
    profile.blockchainUse,
    profile.operatingStage
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  return classifyDataBoundaryText(metadata).some(isUnsafeProjectMetadataFinding);
}

function containsUnsafeImportedEvidenceMetadata(evidenceItems: EvidenceItem[]): boolean {
  const metadata = evidenceItems
    .flatMap((item) => [item.id, item.label, item.kind, item.content, item.source, item.owner])
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  return classifyDataBoundaryText(metadata).some(isUnsafeProjectMetadataFinding);
}

function isUnsafeProjectMetadataFinding(finding: ClassifiedDataFinding): boolean {
  if (finding.severity === "block") {
    return true;
  }

  if (finding.dataClass === "wallet-address") {
    return true;
  }

  return (
    finding.dataClass === "personal-data" &&
    /\[redacted-(?:email|phone|ssn|passport-id|personal-data)\]/.test(finding.redactedSnippet)
  );
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "project";
}
