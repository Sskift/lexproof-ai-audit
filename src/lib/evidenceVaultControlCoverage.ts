import type { EvidenceVaultRecordResponse } from "./evidenceVaultClient";

export type EvidenceVaultControlCoverageInput = {
  records: Array<Pick<EvidenceVaultRecordResponse, "id" | "filename" | "status" | "linkedControlIds">>;
  manifest?: {
    items: Array<{
      evidenceId: string;
      linkedControlIds?: string[];
    }>;
  } | null;
};

export type EvidenceVaultControlCoverageReadiness =
  | "ready-for-handoff"
  | "needs-review"
  | "needs-manifest-link"
  | "needs-vault-record";

export type EvidenceVaultControlCoverageControl = {
  controlId: string;
  evidenceRecordCount: number;
  manifestItemCount: number;
  readiness: EvidenceVaultControlCoverageReadiness;
  nextAction: string;
  statuses: string[];
  filenames: string[];
};

export type EvidenceVaultControlCoverage = {
  coverageVersion: "lexproof-evidence-vault-control-coverage-v1";
  controlCount: number;
  recordCount: number;
  manifestItemCount: number;
  controls: EvidenceVaultControlCoverageControl[];
  notLegalAdviceBoundary: "Not legal advice. Evidence Vault control coverage is audit preparation metadata only.";
};

const NOT_LEGAL_ADVICE =
  "Not legal advice. Evidence Vault control coverage is audit preparation metadata only.";

type ControlAccumulator = {
  controlId: string;
  recordIds: Set<string>;
  manifestEvidenceIds: Set<string>;
  statuses: Set<string>;
  filenames: Set<string>;
};

export function createEvidenceVaultControlCoverage(
  input: EvidenceVaultControlCoverageInput
): EvidenceVaultControlCoverage {
  const controls = new Map<string, ControlAccumulator>();
  const manifestItems = input.manifest?.items ?? [];

  for (const record of input.records) {
    for (const controlId of normalizeControlIds(record.linkedControlIds)) {
      const entry = getControlAccumulator(controls, controlId);
      entry.recordIds.add(record.id);
      entry.statuses.add(record.status);
      entry.filenames.add(record.filename);
    }
  }

  for (const item of manifestItems) {
    for (const controlId of normalizeControlIds(item.linkedControlIds)) {
      const entry = getControlAccumulator(controls, controlId);
      entry.manifestEvidenceIds.add(item.evidenceId);
    }
  }

  return {
    coverageVersion: "lexproof-evidence-vault-control-coverage-v1",
    controlCount: controls.size,
    recordCount: input.records.length,
    manifestItemCount: manifestItems.length,
    controls: Array.from(controls.values())
      .map((entry) => {
        const readiness = createReadiness(entry.recordIds.size, entry.manifestEvidenceIds.size, entry.statuses);

        return {
          controlId: entry.controlId,
          evidenceRecordCount: entry.recordIds.size,
          manifestItemCount: entry.manifestEvidenceIds.size,
          readiness,
          nextAction: createNextAction(readiness),
          statuses: [...entry.statuses].sort((left, right) => left.localeCompare(right)),
          filenames: [...entry.filenames].sort((left, right) => left.localeCompare(right))
        };
      })
      .sort((left, right) => left.controlId.localeCompare(right.controlId)),
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE
  };
}

function getControlAccumulator(controls: Map<string, ControlAccumulator>, controlId: string): ControlAccumulator {
  const existing = controls.get(controlId);
  if (existing) {
    return existing;
  }

  const created: ControlAccumulator = {
    controlId,
    recordIds: new Set<string>(),
    manifestEvidenceIds: new Set<string>(),
    statuses: new Set<string>(),
    filenames: new Set<string>()
  };
  controls.set(controlId, created);
  return created;
}

function normalizeControlIds(values: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function createReadiness(
  evidenceRecordCount: number,
  manifestItemCount: number,
  statuses: Set<string>
): EvidenceVaultControlCoverageReadiness {
  if (evidenceRecordCount === 0 || manifestItemCount > evidenceRecordCount) {
    return "needs-vault-record";
  }
  if (manifestItemCount < evidenceRecordCount) {
    return "needs-manifest-link";
  }
  if ([...statuses].some((status) => status !== "verified")) {
    return "needs-review";
  }
  return "ready-for-handoff";
}

function createNextAction(readiness: EvidenceVaultControlCoverageReadiness): string {
  if (readiness === "needs-vault-record") {
    return "Sync the linked evidence record to Evidence Vault before relying on manifest metadata.";
  }
  if (readiness === "needs-manifest-link") {
    return "Regenerate the Evidence Vault manifest so this control has hash lineage.";
  }
  if (readiness === "needs-review") {
    return "Move linked vault evidence through Human Review before export reliance.";
  }
  return "Keep verified vault evidence linked in the Counsel Pack and source handoff.";
}
