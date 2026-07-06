import { describe, expect, it } from "vitest";
import {
  evidenceOwners,
  evidenceStatuses,
  importProjectProfileJson,
  isEvidenceOwner,
  isEvidenceStatus,
  validateProjectProfile,
  type ProjectProfile
} from "./projectModel";

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

  it("blocks unsafe project profile metadata while allowing metadata-only data boundary descriptions", () => {
    expect(
      validateProjectProfile({
        ...validProject,
        dataSensitivity: "KYC metadata only; personal data excluded from project facts."
      })
    ).toEqual({ valid: true, errors: [] });

    const result = validateProjectProfile({
      ...validProject,
      projectName: "Review jane.reviewer@example.com",
      custodyModel: "Wallet 0x1234567890abcdef1234567890abcdef12345678 with private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      dataSensitivity: "raw KYC packet with phone +1 415 555 0100",
      aiUsage: "Route api_key=sk-live-abcdef1234567890abcdef1234567890 into model review."
    });

    expect(result).toEqual({
      valid: false,
      errors: ["Project profile metadata must not include credentials, private keys, raw KYC, direct personal identifiers, or wallet addresses."]
    });
  });

  it("recognizes review-stage evidence statuses used by the ledger and vault workflow", () => {
    expect(evidenceStatuses).toEqual(["draft", "requested", "received", "under-review", "verified", "rejected"]);
    expect(evidenceOwners).toEqual(["Counsel", "Compliance", "Engineering", "Product", "Founder"]);
    expect(isEvidenceStatus("under-review")).toBe(true);
    expect(isEvidenceStatus("rejected")).toBe(true);
    expect(isEvidenceStatus("approved")).toBe(false);
    expect(isEvidenceStatus("superseded")).toBe(false);
    expect(isEvidenceOwner("Compliance")).toBe(true);
    expect(isEvidenceOwner("Legal")).toBe(false);
  });
});

describe("importProjectProfileJson", () => {
  it("imports and normalizes a metadata-only project profile JSON", () => {
    const result = importProjectProfileJson(
      JSON.stringify({
        projectName: "Imported AI Governance Desk",
        entityType: "Legal operations AI workflow",
        jurisdictions: "United States, European Union",
        assetModel: "AI review workflow for counsel evidence preparation",
        userType: "Internal legal operations team",
        custodyModel: "No custody; evidence metadata only",
        dataSensitivity: "Policy metadata only; no raw KYC",
        aiUsage: "AI drafts issue-spotting notes for human review",
        blockchainUse: "Simulated evidence anchor only",
        operatingStage: "Pilot",
        evidenceItems: [
          {
            label: "AI review SOP",
            kind: "Policy",
            content: "Human review owner, model use limits, redaction checks, escalation path",
            source: "Synthetic import profile",
            status: "verified",
            owner: "Compliance"
          },
          {
            label: "Imported draft",
            kind: "Note",
            content: "Needs reviewer assignment.",
            status: "unknown",
            owner: "Legal"
          }
        ]
      }),
      { importedAt: "2026-07-06T12:00:00.000Z" }
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        warnings: [
          "Evidence item 2 had an unknown status and was imported as draft.",
          "Evidence item 2 had an unknown owner and was assigned to Founder."
        ],
        notLegalAdviceBoundary: "Not legal advice. Imported profiles are audit preparation metadata only."
      })
    );
    expect(result.ok && result.profile).toEqual(
      expect.objectContaining({
        id: "import-imported-ai-governance-desk",
        projectName: "Imported AI Governance Desk",
        jurisdictions: ["United States", "European Union"],
        updatedAt: "2026-07-06T12:00:00.000Z"
      })
    );
    expect(result.ok ? result.profile.evidenceItems : []).toEqual([
      expect.objectContaining({
        id: "import-imported-ai-governance-desk-evidence-1",
        status: "verified",
        owner: "Compliance",
        addedAt: "2026-07-06T12:00:00.000Z",
        updatedAt: "2026-07-06T12:00:00.000Z"
      }),
      expect.objectContaining({
        id: "import-imported-ai-governance-desk-evidence-2",
        status: "draft",
        owner: "Founder"
      })
    ]);
  });

  it("returns clear errors for malformed or incomplete project profile JSON", () => {
    expect(importProjectProfileJson("not-json")).toEqual({
      ok: false,
      errors: ["Project profile JSON is not valid JSON."],
      notLegalAdviceBoundary: "Not legal advice. Imported profiles are audit preparation metadata only."
    });

    const result = importProjectProfileJson(JSON.stringify({ projectName: "Incomplete import" }));

    expect(result).toEqual({
      ok: false,
      errors: [
        "Entity type is required.",
        "At least one jurisdiction is required.",
        "Asset model is required.",
        "User exposure is required.",
        "Custody model is required.",
        "Data sensitivity is required.",
        "AI usage is required.",
        "Blockchain use is required.",
        "Operating stage is required."
      ],
      notLegalAdviceBoundary: "Not legal advice. Imported profiles are audit preparation metadata only."
    });
  });

  it("blocks unsafe imported project and evidence metadata without echoing secret values", () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const result = importProjectProfileJson(
      JSON.stringify({
        ...validProject,
        id: apiKey,
        projectName: `Unsafe import ${apiKey}`,
        evidenceItems: [
          {
            label: "Unsafe evidence",
            kind: "Text",
            content: `Contains private key ${privateKey} and raw KYC packet.`,
            source: "Unsafe import fixture",
            status: "received",
            owner: "Compliance"
          }
        ]
      })
    );
    const serialized = JSON.stringify(result);

    expect(result).toEqual({
      ok: false,
      errors: [
        "Project profile metadata must not include credentials, private keys, raw KYC, direct personal identifiers, or wallet addresses.",
        "Imported evidence metadata must not include credentials, private keys, raw KYC, direct personal identifiers, or wallet addresses."
      ],
      notLegalAdviceBoundary: "Not legal advice. Imported profiles are audit preparation metadata only."
    });
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
  });
});
