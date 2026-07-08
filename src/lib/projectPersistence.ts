import { classifyDataBoundaryText, type ClassifiedDataFinding } from "./dataClassification";
import { validateProjectProfile, type EvidenceItem, type ProjectProfile } from "./projectModel";

export const PROJECT_PERSISTENCE_BOUNDARY =
  "Not legal advice. Workspace persistence recovery is audit preparation safety metadata only.";

export type ProjectPersistenceIssueReason =
  | "corrupt-json"
  | "invalid-shape"
  | "unsafe-project-metadata"
  | "unsafe-evidence-metadata"
  | "unsafe-autosave-blocked";

export type ProjectWorkspaceRecoveryNotice = {
  reason: ProjectPersistenceIssueReason;
  title: string;
  message: string;
  recoveryAction: string;
  notLegalAdviceBoundary: string;
};

export type ProjectPersistenceSafetyReport = {
  canPersist: boolean;
  notice: ProjectWorkspaceRecoveryNotice | null;
};

export type StoredProjectSnapshotResult = {
  project: ProjectProfile | null;
  notice: ProjectWorkspaceRecoveryNotice | null;
  shouldClearStoredProject: boolean;
};

const unsafeProjectMetadataError =
  "Project profile metadata must not include credentials, private keys, raw KYC, direct personal identifiers, or wallet addresses.";

export function parseStoredProjectSnapshot(raw: string | null | undefined): StoredProjectSnapshotResult {
  if (!raw) {
    return {
      project: null,
      notice: null,
      shouldClearStoredProject: false
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      project: null,
      notice: createProjectWorkspaceRecoveryNotice("corrupt-json"),
      shouldClearStoredProject: true
    };
  }

  if (!isProjectProfileShape(parsed)) {
    return {
      project: null,
      notice: createProjectWorkspaceRecoveryNotice("invalid-shape"),
      shouldClearStoredProject: true
    };
  }

  const unsafeStoredReason = getUnsafeStoredProjectReason(parsed);
  if (unsafeStoredReason) {
    return {
      project: null,
      notice: createProjectWorkspaceRecoveryNotice(unsafeStoredReason),
      shouldClearStoredProject: true
    };
  }

  return {
    project: parsed,
    notice: null,
    shouldClearStoredProject: false
  };
}

export function assessProjectPersistenceSafety(project: Partial<ProjectProfile>): ProjectPersistenceSafetyReport {
  if (!getUnsafeStoredProjectReason(project)) {
    return {
      canPersist: true,
      notice: null
    };
  }

  return {
    canPersist: false,
    notice: createProjectWorkspaceRecoveryNotice("unsafe-autosave-blocked")
  };
}

export function createProjectWorkspaceRecoveryNotice(reason: ProjectPersistenceIssueReason): ProjectWorkspaceRecoveryNotice {
  const base = {
    reason,
    notLegalAdviceBoundary: PROJECT_PERSISTENCE_BOUNDARY
  };

  if (reason === "corrupt-json") {
    return {
      ...base,
      title: "Saved workspace was not restored",
      message: "The local workspace snapshot was not valid JSON, so LexProof started from the safe synthetic sample.",
      recoveryAction: "Create a new workspace or load a demo scenario; the invalid local snapshot should be cleared before autosave resumes."
    };
  }

  if (reason === "invalid-shape") {
    return {
      ...base,
      title: "Saved workspace shape was rejected",
      message: "The local workspace snapshot was missing required project fields, so it was not used.",
      recoveryAction: "Start a new project or load a synthetic sample, then save the workspace again."
    };
  }

  if (reason === "unsafe-project-metadata") {
    return {
      ...base,
      title: "Unsafe saved workspace was blocked",
      message: "The saved project metadata appeared to include credentials, private keys, raw KYC, personal identifiers, or wallet addresses.",
      recoveryAction: "Start from a clean project and enter only metadata-safe audit-prep facts."
    };
  }

  if (reason === "unsafe-evidence-metadata") {
    return {
      ...base,
      title: "Unsafe saved evidence was blocked",
      message: "The saved evidence metadata appeared to include credentials, private keys, raw KYC, personal identifiers, or wallet addresses.",
      recoveryAction: "Start from a clean project and recreate evidence as metadata-only summaries before autosave resumes."
    };
  }

  return {
    ...base,
    title: "Workspace autosave blocked",
    message: "Workspace metadata appears to include unsafe material and was not written to localStorage.",
    recoveryAction:
      "Remove credentials, private keys, raw KYC, direct personal identifiers, and wallet addresses from project or evidence fields before saving."
  };
}

function getUnsafeStoredProjectReason(
  project: Partial<ProjectProfile>
): Extract<ProjectPersistenceIssueReason, "unsafe-project-metadata" | "unsafe-evidence-metadata"> | null {
  const validation = validateProjectProfile(project);
  if (validation.errors.includes(unsafeProjectMetadataError)) {
    return "unsafe-project-metadata";
  }

  if (containsUnsafeEvidencePersistenceMetadata(project.evidenceItems)) {
    return "unsafe-evidence-metadata";
  }

  return null;
}

function containsUnsafeEvidencePersistenceMetadata(evidenceItems: unknown): boolean {
  if (!Array.isArray(evidenceItems)) {
    return false;
  }

  const metadata = evidenceItems
    .flatMap((item) => {
      if (!isRecord(item)) {
        return [];
      }
      return [item.id, item.label, item.kind, item.content, item.source, item.status, item.owner, item.addedAt, item.updatedAt];
    })
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  return classifyDataBoundaryText(metadata).some(isUnsafePersistenceFinding);
}

function isUnsafePersistenceFinding(finding: ClassifiedDataFinding): boolean {
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

function isProjectProfileShape(value: unknown): value is ProjectProfile {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasString(value.id) &&
    hasString(value.projectName) &&
    hasString(value.entityType) &&
    Array.isArray(value.jurisdictions) &&
    value.jurisdictions.every(hasString) &&
    hasString(value.assetModel) &&
    hasString(value.userType) &&
    hasString(value.custodyModel) &&
    hasString(value.dataSensitivity) &&
    hasString(value.aiUsage) &&
    hasString(value.blockchainUse) &&
    hasString(value.operatingStage) &&
    Array.isArray(value.evidenceItems) &&
    value.evidenceItems.every(isEvidenceItemShape)
  );
}

function isEvidenceItemShape(value: unknown): value is EvidenceItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasString(value.label) &&
    hasString(value.kind) &&
    hasString(value.content) &&
    hasOptionalString(value.id) &&
    hasOptionalString(value.source) &&
    hasOptionalString(value.status) &&
    hasOptionalString(value.owner) &&
    hasOptionalString(value.addedAt) &&
    hasOptionalString(value.updatedAt)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(value: unknown): value is string {
  return typeof value === "string";
}

function hasOptionalString(value: unknown): value is string | undefined {
  return typeof value === "undefined" || typeof value === "string";
}
