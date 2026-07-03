import { validateProjectProfile, type EvidenceItem, type ProjectProfile } from "./projectModel";

export const PROJECT_PERSISTENCE_BOUNDARY =
  "Not legal advice. Workspace persistence recovery is audit preparation safety metadata only.";

export type ProjectPersistenceIssueReason =
  | "corrupt-json"
  | "invalid-shape"
  | "unsafe-project-metadata"
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

  const safety = assessProjectPersistenceSafety(parsed);
  if (!safety.canPersist) {
    return {
      project: null,
      notice: createProjectWorkspaceRecoveryNotice("unsafe-project-metadata"),
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
  const validation = validateProjectProfile(project);
  const unsafeMetadataFound = validation.errors.includes(unsafeProjectMetadataError);

  if (!unsafeMetadataFound) {
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

  return {
    ...base,
    title: "Workspace autosave blocked",
    message: "Project metadata appears to include unsafe material and was not written to localStorage.",
    recoveryAction: "Remove credentials, private keys, raw KYC, direct personal identifiers, and wallet addresses from project fields before saving."
  };
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
