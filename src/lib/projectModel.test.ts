import { describe, expect, it } from "vitest";
import { evidenceStatuses, isEvidenceStatus, validateProjectProfile, type ProjectProfile } from "./projectModel";

const validProject: ProjectProfile = {
  id: "project-test",
  projectName: "Test Protocol",
  entityType: "Delaware C-corp",
  jurisdictions: ["United States"],
  assetModel: "Tokenized fund administration workflow",
  userType: "Accredited investors and issuer counsel",
  custodyModel: "Non-custodial evidence review",
  dataSensitivity: "Policy metadata only; no raw KYC",
  aiUsage: "AI flags missing evidence with source lineage",
  blockchainUse: "Optional simulated evidence anchor",
  operatingStage: "Private pilot",
  evidenceItems: [
    {
      id: "evidence-1",
      label: "Launch memo",
      kind: "Markdown",
      content: "Token facts, user eligibility, custody assumptions",
      source: "Internal counsel draft",
      status: "received",
      owner: "Counsel"
    }
  ]
};

describe("validateProjectProfile", () => {
  it("accepts a complete project profile", () => {
    const result = validateProjectProfile(validProject);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns explicit errors for an invalid project profile", () => {
    const result = validateProjectProfile({
      ...validProject,
      projectName: " ",
      jurisdictions: [],
      assetModel: ""
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      "Project name is required.",
      "At least one jurisdiction is required.",
      "Asset model is required."
    ]);
  });

  it("recognizes review-stage evidence statuses used by the ledger and vault workflow", () => {
    expect(evidenceStatuses).toEqual(["draft", "requested", "received", "under-review", "verified", "rejected"]);
    expect(isEvidenceStatus("under-review")).toBe(true);
    expect(isEvidenceStatus("rejected")).toBe(true);
    expect(isEvidenceStatus("approved")).toBe(false);
    expect(isEvidenceStatus("superseded")).toBe(false);
  });
});
