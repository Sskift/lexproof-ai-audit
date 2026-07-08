import { describe, expect, it } from "vitest";
import {
  PROJECT_PERSISTENCE_BOUNDARY,
  assessProjectPersistenceSafety,
  parseStoredProjectSnapshot,
  type ProjectWorkspaceRecoveryNotice
} from "./projectPersistence";
import type { ProjectProfile } from "./projectModel";

const safeProject: ProjectProfile = {
  id: "project-safe",
  projectName: "Safe Launch Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized policy metadata review",
  userType: "Compliance and counsel",
  custodyModel: "Non-custodial audit-prep workspace",
  dataSensitivity: "Policy metadata only; no raw KYC",
  aiUsage: "AI suggests missing evidence, human review required",
  blockchainUse: "Simulated evidence anchor only",
  operatingStage: "Private pilot",
  evidenceItems: [
    {
      id: "evidence-1",
      label: "Control memo",
      kind: "Markdown",
      content: "Metadata-only control summary",
      source: "Synthetic internal memo",
      status: "received",
      owner: "Compliance"
    }
  ]
};

const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("parseStoredProjectSnapshot", () => {
  it("returns no recovery notice when no local snapshot exists", () => {
    expect(parseStoredProjectSnapshot(null)).toEqual({
      project: null,
      notice: null,
      shouldClearStoredProject: false
    });
  });

  it("restores a metadata-safe project snapshot", () => {
    const result = parseStoredProjectSnapshot(JSON.stringify(safeProject));

    expect(result.project).toEqual(safeProject);
    expect(result.notice).toBeNull();
    expect(result.shouldClearStoredProject).toBe(false);
  });

  it("rejects corrupt JSON with a recoverable non-advice notice", () => {
    const result = parseStoredProjectSnapshot("{not-json");

    expect(result.project).toBeNull();
    expect(result.shouldClearStoredProject).toBe(true);
    expectNotice(result.notice, "corrupt-json", /Saved workspace was not restored/i);
  });

  it("rejects snapshots that do not match the project profile shape", () => {
    const result = parseStoredProjectSnapshot(JSON.stringify({ id: "project-broken", evidenceItems: [] }));

    expect(result.project).toBeNull();
    expect(result.shouldClearStoredProject).toBe(true);
    expectNotice(result.notice, "invalid-shape", /Saved workspace shape was rejected/i);
  });

  it("blocks unsafe project metadata from being restored", () => {
    const result = parseStoredProjectSnapshot(
      JSON.stringify({
        ...safeProject,
        projectName: "Wallet owner jane.reviewer@example.com",
        aiUsage: "Use api_key=sk-live-abcdef1234567890abcdef1234567890 for model review."
      })
    );

    expect(result.project).toBeNull();
    expect(result.shouldClearStoredProject).toBe(true);
    expectNotice(result.notice, "unsafe-project-metadata", /Unsafe saved workspace was blocked/i);
    expect(result.notice?.message).not.toMatch(/sk-live|jane\.reviewer/i);
  });

  it("blocks unsafe saved evidence metadata from being restored or echoed", () => {
    const result = parseStoredProjectSnapshot(
      JSON.stringify({
        ...safeProject,
        evidenceItems: [
          {
            ...safeProject.evidenceItems[0],
            label: `Unsafe evidence ${apiKey}`,
            content: `Pasted raw KYC packet and private key ${privateKey}.`
          }
        ]
      })
    );

    expect(result.project).toBeNull();
    expect(result.shouldClearStoredProject).toBe(true);
    expectNotice(result.notice, "unsafe-evidence-metadata", /Unsafe saved evidence was blocked/i);
    expect(JSON.stringify(result.notice)).not.toContain(apiKey);
    expect(JSON.stringify(result.notice)).not.toContain(privateKey);
    expect(JSON.stringify(result.notice)).not.toContain("raw KYC packet");
  });
});

describe("assessProjectPersistenceSafety", () => {
  it("allows safe project facts to persist", () => {
    expect(assessProjectPersistenceSafety(safeProject)).toEqual({
      canPersist: true,
      notice: null
    });
  });

  it("blocks autosave when project metadata contains unsafe material", () => {
    const result = assessProjectPersistenceSafety({
      ...safeProject,
      custodyModel:
        "Signer wallet 0x1234567890abcdef1234567890abcdef12345678 uses private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef."
    });

    expect(result.canPersist).toBe(false);
    expectNotice(result.notice, "unsafe-autosave-blocked", /Workspace autosave blocked/i);
    expect(result.notice?.recoveryAction).toMatch(/Remove credentials, private keys, raw KYC/i);
  });

  it("blocks autosave when evidence metadata contains unsafe material", () => {
    const result = assessProjectPersistenceSafety({
      ...safeProject,
      evidenceItems: [
        {
          ...safeProject.evidenceItems[0],
          content: `Do not persist API key ${apiKey}, private key ${privateKey}, or raw KYC packet.`
        }
      ]
    });

    expect(result.canPersist).toBe(false);
    expectNotice(result.notice, "unsafe-autosave-blocked", /Workspace autosave blocked/i);
    expect(result.notice?.message).toMatch(/Workspace metadata appears to include unsafe material/i);
    expect(result.notice?.recoveryAction).toMatch(/project or evidence fields/i);
    expect(JSON.stringify(result.notice)).not.toContain(apiKey);
    expect(JSON.stringify(result.notice)).not.toContain(privateKey);
    expect(JSON.stringify(result.notice)).not.toContain("raw KYC packet");
  });
});

function expectNotice(
  notice: ProjectWorkspaceRecoveryNotice | null,
  reason: ProjectWorkspaceRecoveryNotice["reason"],
  title: RegExp
) {
  expect(notice).toEqual(
    expect.objectContaining({
      reason,
      title: expect.stringMatching(title),
      notLegalAdviceBoundary: PROJECT_PERSISTENCE_BOUNDARY
    })
  );
}
