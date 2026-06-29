import type { EvidenceItem } from "./projectModel";
import type { RiskEvidenceRequirement } from "./riskEvidence";

export function createEvidenceRequestFromRequirement(requirement: RiskEvidenceRequirement): EvidenceItem {
  return {
    label: requirement.title,
    kind: "Evidence request",
    source: `risk evidence requirement: ${requirement.id}`,
    status: "requested",
    owner: "Compliance",
    content: [
      "Requested from Risk Audit evidence workflow.",
      `Related risk flag: ${requirement.relatedFlagId}`,
      `Priority: ${requirement.priority}`,
      `Request: ${requirement.title}`,
      `Reason: ${requirement.reason}`,
      "Not legal advice. This is an audit preparation evidence request for counsel and compliance review."
    ].join("\n")
  };
}
