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

export type EvidenceVaultControlCoverageControl = {
  controlId: string;
  evidenceRecordCount: number;
  manifestItemCount: number;
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
      .map((entry) => ({
        controlId: entry.controlId,
        evidenceRecordCount: entry.recordIds.size,
        manifestItemCount: entry.manifestEvidenceIds.size,
        statuses: [...entry.statuses].sort((left, right) => left.localeCompare(right)),
        filenames: [...entry.filenames].sort((left, right) => left.localeCompare(right))
      }))
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
