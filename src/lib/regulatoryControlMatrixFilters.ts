import type {
  RegulatoryControlMatrixControl,
  RegulatoryControlStatus
} from "./regulatoryControlMatrix";

export type RegulatoryControlMatrixFilterValue = "all" | string;

export type RegulatoryControlMatrixFilters = {
  jurisdiction?: RegulatoryControlMatrixFilterValue;
  topic?: RegulatoryControlMatrixFilterValue;
  status?: RegulatoryControlMatrixFilterValue;
  query?: string;
};

export type RegulatoryControlMatrixFilterOptions = {
  jurisdictions: string[];
  topics: RegulatoryControlMatrixControl["topic"][];
  statuses: RegulatoryControlStatus[];
};

const statusOrder: RegulatoryControlStatus[] = ["metadata-missing", "needs-evidence", "needs-source-review", "ready-for-counsel"];

export function filterRegulatoryControlMatrixControls(
  controls: RegulatoryControlMatrixControl[],
  filters: RegulatoryControlMatrixFilters
): RegulatoryControlMatrixControl[] {
  const queryTerms = normalizeSearch(filters.query ?? "")
    .split(" ")
    .filter(Boolean);

  return controls.filter((control) => {
    if (!matchesFilter(control.jurisdiction, filters.jurisdiction)) {
      return false;
    }
    if (!matchesFilter(control.topic, filters.topic)) {
      return false;
    }
    if (!matchesFilter(control.status, filters.status)) {
      return false;
    }
    if (queryTerms.length === 0) {
      return true;
    }

    const haystack = normalizeSearch([
      control.clauseId,
      control.jurisdiction,
      control.topic,
      control.status,
      control.citation,
      control.sourceName,
      control.localCounselRole,
      control.evidenceCoverageStatus,
      control.sourceReviewStatus,
      control.evidenceRequestTitles.join(" "),
      control.matchedEvidenceLabels.join(" "),
      control.nextAction
    ].join(" "));

    return queryTerms.every((term) => haystack.includes(term));
  });
}

export function createRegulatoryControlMatrixFilterOptions(
  controls: RegulatoryControlMatrixControl[]
): RegulatoryControlMatrixFilterOptions {
  return {
    jurisdictions: uniqueSorted(controls.map((control) => control.jurisdiction)),
    topics: uniqueSorted(controls.map((control) => control.topic)),
    statuses: uniqueSorted(controls.map((control) => control.status)).sort(
      (left, right) => statusOrder.indexOf(left) - statusOrder.indexOf(right)
    )
  };
}

function matchesFilter(actual: string, expected: RegulatoryControlMatrixFilterValue | undefined): boolean {
  return !expected || expected === "all" || actual === expected;
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
