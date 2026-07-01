import { describe, expect, it } from "vitest";
import { createRejectedEvidenceReplacementDraft } from "./evidenceReplacement";
import type { EvidenceItem } from "./projectModel";

describe("evidence replacement", () => {
  it("creates a metadata-only replacement request for rejected evidence without copying rejected content", () => {
    const rejectedEvidence: EvidenceItem = {
      id: "evidence-rejected-1",
      label: "Rejected custody memo",
      kind: "Markdown",
      content: "Contains stale review notes that should not be copied.",
      source: "regulatory control: control-sg-mas-dpt-customer-asset-safeguards",
      status: "rejected",
      owner: "Compliance"
    };

    const replacement = createRejectedEvidenceReplacementDraft(
      rejectedEvidence,
      "Reviewer requested updated signer scope."
    );

    expect(replacement).toEqual(
      expect.objectContaining({
        label: "Replacement for Rejected custody memo",
        kind: "Markdown",
        status: "requested",
        owner: "Compliance"
      })
    );
    expect(replacement?.source).toContain("replacement for evidence: evidence-rejected-1");
    expect(replacement?.source).toContain("regulatory control: control-sg-mas-dpt-customer-asset-safeguards");
    expect(replacement?.content).toContain("Reviewer requested updated signer scope.");
    expect(replacement?.content).toContain("Not legal advice");
    expect(replacement?.content).not.toContain("Contains stale review notes");
  });

  it("does not open replacement requests for active evidence", () => {
    const activeEvidence: EvidenceItem = {
      id: "evidence-active-1",
      label: "Active custody memo",
      kind: "Markdown",
      content: "Metadata-only custody summary.",
      status: "received",
      owner: "Compliance"
    };

    expect(createRejectedEvidenceReplacementDraft(activeEvidence)).toBeNull();
  });
});
