import { describe, expect, it } from "vitest";
import { createEvidenceRequestFromRequirement } from "./missingEvidenceWorkflow";
import type { RiskEvidenceRequirement } from "./riskEvidence";

const requirement: RiskEvidenceRequirement = {
  id: "signer-control",
  title: "Signer control policy",
  reason: "Wallet control and withdrawal authority need explicit signer, approval, and emergency boundaries.",
  priority: "P0",
  relatedFlagId: "custody",
  status: "missing",
  matchedEvidenceLabels: []
};

describe("createEvidenceRequestFromRequirement", () => {
  it("turns a missing risk evidence requirement into a requested ledger item", () => {
    const item = createEvidenceRequestFromRequirement(requirement);

    expect(item).toMatchObject({
      label: "Signer control policy",
      kind: "Evidence request",
      source: "risk evidence requirement: signer-control",
      status: "requested",
      owner: "Compliance"
    });
    expect(item.content).toContain("Related risk flag: custody");
    expect(item.content).toContain("Priority: P0");
    expect(item.content).toContain(requirement.reason);
    expect(item.content).toContain("Not legal advice");
  });
});
