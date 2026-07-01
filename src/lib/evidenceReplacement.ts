import type { EvidenceItem } from "./projectModel";

const replacementBoundary = "Not legal advice. Evidence replacement requests are audit preparation workflow metadata only.";
const defaultReplacementReason = "Reviewer requested replacement evidence.";

export function createRejectedEvidenceReplacementDraft(
  rejectedEvidence: EvidenceItem,
  replacementReason = defaultReplacementReason
): EvidenceItem | null {
  if (rejectedEvidence.status !== "rejected") {
    return null;
  }

  const label = normalizeText(rejectedEvidence.label, "Untitled evidence");
  const kind = normalizeText(rejectedEvidence.kind, "Evidence request");
  const parentReference = normalizeText(rejectedEvidence.id, createEvidenceReference(label));
  const reason = normalizeText(replacementReason, defaultReplacementReason);
  const sourceParts = [`replacement for evidence: ${parentReference}`];
  const originalSource = rejectedEvidence.source?.trim();

  if (originalSource) {
    sourceParts.push(originalSource);
  }

  return {
    label: `Replacement for ${label}`,
    kind,
    content: [
      `Replacement requested for rejected evidence "${label}".`,
      `Reason: ${reason}`,
      "Add a metadata-only summary of the corrected artifact. Do not paste raw KYC, personal data, private keys, credentials, or stale rejected content.",
      replacementBoundary
    ].join(" "),
    source: sourceParts.join("; "),
    status: "requested",
    owner: rejectedEvidence.owner ?? "Compliance"
  };
}

function normalizeText(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function createEvidenceReference(label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "rejected-evidence";
}
