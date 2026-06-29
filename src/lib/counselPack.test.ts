import { describe, expect, it, vi } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { buildMarkdownCounselPack, downloadMarkdownFile } from "./counselPack";
import { createEvidenceManifest } from "./evidenceManifest";
import type { CounselQuestion } from "./counselQuestions";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "project-counsel",
  projectName: "Counsel Yield Review",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized yield product",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC references excluded from export",
  aiUsage: "AI flags legal review questions with citations",
  blockchainUse: "Simulated evidence hash registry",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      id: "terms",
      label: "Token terms",
      kind: "Markdown",
      content: "Yield, redemption, custody, and user eligibility facts",
      status: "received",
      owner: "Counsel"
    }
  ]
};

describe("buildMarkdownCounselPack", () => {
  it("includes non-advice boundary, risk level, manifest hash, and remediation queue", async () => {
    const audit = analyzeAuditProfile(project);
    const manifest = await createEvidenceManifest(project, audit, project.evidenceItems);
    const questions: CounselQuestion[] = [
      {
        id: "question-project-custody",
        projectId: project.id,
        question: "Who can approve wallet operations before launch?",
        relatedFlagId: "custody",
        priority: "P0",
        status: "open",
        source: "risk-rule",
        notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only."
      }
    ];
    const markdown = buildMarkdownCounselPack(project, audit, manifest, questions);

    expect(markdown).toContain("Not legal advice");
    expect(markdown).toContain(`Risk level: ${audit.riskLevel}`);
    expect(markdown).toContain(manifest.bundleHash);
    expect(markdown).toContain("## Counsel Questions");
    expect(markdown).toContain("- P0 open [custody] Who can approve wallet operations before launch?");
    expect(markdown).toContain("## Remediation Queue");
    expect(markdown).toContain(audit.remediation[0].action);
  });
});

describe("downloadMarkdownFile", () => {
  it("downloads Markdown content through a browser Blob", () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:lexproof");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      downloadMarkdownFile("counsel-pack.md", "# Counsel Pack");

      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:lexproof");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });
});
