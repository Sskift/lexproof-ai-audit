import { describe, expect, it } from "vitest";
import { validateEvidenceVaultStatusTransition } from "./evidenceVaultWorkflow";

describe("Evidence Vault workflow", () => {
  it("allows normal review progression from received to under-review to verified", () => {
    expect(validateEvidenceVaultStatusTransition("received", "under-review")).toEqual({ valid: true });
    expect(validateEvidenceVaultStatusTransition("under-review", "verified")).toEqual({ valid: true });
  });

  it("blocks rejected evidence from being directly reactivated without replacement lineage", () => {
    const result = validateEvidenceVaultStatusTransition("rejected", "verified");

    expect(result).toEqual({
      valid: false,
      error: "Rejected Evidence Vault records cannot be directly moved to verified.",
      recoveryAction: "Upload a replacement from the rejected evidence recovery flow so parent/child lineage is preserved.",
      notLegalAdviceBoundary: "Not legal advice. Evidence status transitions are audit preparation workflow metadata only."
    });
  });

  it("keeps superseded evidence as historical metadata and blocks reactivation", () => {
    const result = validateEvidenceVaultStatusTransition("superseded", "received");

    expect(result).toEqual({
      valid: false,
      error: "Superseded Evidence Vault records cannot be reactivated.",
      recoveryAction: "Use the active replacement record or upload a new replacement after review.",
      notLegalAdviceBoundary: "Not legal advice. Evidence status transitions are audit preparation workflow metadata only."
    });
  });

  it("requires the replacement flow rather than a manual superseded patch", () => {
    const result = validateEvidenceVaultStatusTransition("rejected", "superseded");

    expect(result).toEqual({
      valid: false,
      error: "Superseded status is created only by the rejected-evidence replacement flow.",
      recoveryAction: "Use the Evidence Vault replacement endpoint so the new record and superseded parent are written together.",
      notLegalAdviceBoundary: "Not legal advice. Evidence status transitions are audit preparation workflow metadata only."
    });
  });
});
