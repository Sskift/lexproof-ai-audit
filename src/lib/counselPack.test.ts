import { describe, expect, it, vi } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import {
  buildMarkdownCounselPack,
  buildPrintableCounselPackHtml,
  downloadMarkdownFile,
  printCounselPackPdf
} from "./counselPack";
import type { CounselReviewItem } from "./counselReview";
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
    const reviews: CounselReviewItem[] = [
      {
        id: "review-custody",
        projectId: project.id,
        flagId: "custody",
        title: "Custody or wallet control",
        severity: "critical",
        owner: "Compliance",
        priority: "P0",
        status: "needs-evidence",
        evidenceSummary: "0/2 evidence requirements covered",
        reviewer: "Outside counsel",
        reviewerNote: "Need signer control policy before review can close.",
        updatedAt: "2026-06-29T08:00:00.000Z",
        notLegalAdviceBoundary: "Not legal advice. Counsel review status is audit preparation workflow only."
      }
    ];
    const markdown = buildMarkdownCounselPack(project, audit, manifest, questions, reviews);

    expect(markdown).toContain("Not legal advice");
    expect(markdown).toContain(`Risk level: ${audit.riskLevel}`);
    expect(markdown).toContain(manifest.bundleHash);
    expect(markdown).toContain("## Counsel Questions");
    expect(markdown).toContain("- P0 open [custody] Who can approve wallet operations before launch?");
    expect(markdown).toContain("## Counsel Review Status");
    expect(markdown).toContain("- P0 needs-evidence [custody] Custody or wallet control");
    expect(markdown).toContain("reviewer: Outside counsel");
    expect(markdown).toContain("Need signer control policy before review can close.");
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

describe("buildPrintableCounselPackHtml", () => {
  it("wraps counsel pack Markdown in printable HTML and escapes unsafe content", () => {
    const html = buildPrintableCounselPackHtml(
      "Counsel Pack <Draft>",
      "# Counsel Pack\n\nNot legal advice.\n\n<script>alert('x')</script>"
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Counsel Pack &lt;Draft&gt;");
    expect(html).toContain("Not legal advice.");
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert");
  });
});

describe("printCounselPackPdf", () => {
  it("opens a printable counsel pack window for browser Save as PDF", () => {
    const originalOpen = window.open;
    const fakeWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn()
      },
      focus: vi.fn(),
      print: vi.fn()
    };
    window.open = vi.fn(() => fakeWindow as unknown as Window);

    try {
      printCounselPackPdf("YieldPassport counsel pack", "# Counsel Pack\n\nNot legal advice.");

      expect(window.open).toHaveBeenCalledWith("", "_blank", "width=960,height=720");
      expect(fakeWindow.document.open).toHaveBeenCalledTimes(1);
      expect(fakeWindow.document.write).toHaveBeenCalledWith(expect.stringContaining("Not legal advice."));
      expect(fakeWindow.document.close).toHaveBeenCalledTimes(1);
      expect(fakeWindow.focus).toHaveBeenCalledTimes(1);
      expect(fakeWindow.print).toHaveBeenCalledTimes(1);
    } finally {
      window.open = originalOpen;
    }
  });
});
