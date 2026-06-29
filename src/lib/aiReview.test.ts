import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import {
  buildAIReviewPayload,
  createMissingEvidenceChecklist,
  createRedactionReport,
  parseAIReviewJson,
  runAIReview,
  type AIReviewResult
} from "./aiReview";
import { createMockModelProvider } from "./modelProvider";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "project-ai-review",
  projectName: "RWA Review Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States", "European Union"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC references only; raw KYC excluded",
  aiUsage: "AI flags missing approvals with citations",
  blockchainUse: "Simulated Ethereum evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      id: "issuer-memo",
      label: "Issuer memo",
      kind: "Markdown",
      content: "Yield terms, target users, and redemption policy",
      status: "received",
      owner: "Counsel"
    },
    {
      id: "private-note",
      label: "Sensitive draft",
      kind: "Text",
      content: "Do not expose private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa or raw KYC files.",
      status: "draft",
      owner: "Compliance"
    }
  ]
};

describe("createMissingEvidenceChecklist", () => {
  it("maps audit flags to concrete evidence requests and marks uncovered custody controls as missing", () => {
    const audit = analyzeAuditProfile(project);
    const checklist = createMissingEvidenceChecklist(audit, project.evidenceItems);

    expect(checklist.map((item) => item.title)).toEqual(
      expect.arrayContaining(["Signer control policy", "Data handling and redaction policy", "Launch approval checklist"])
    );
    expect(checklist.find((item) => item.title === "Signer control policy")).toMatchObject({
      relatedFlagId: "custody",
      status: "missing",
      priority: "P0"
    });
  });
});

describe("buildAIReviewPayload", () => {
  it("builds a non-advice model payload with evidence previews and private key redaction", () => {
    const audit = analyzeAuditProfile(project);
    const payload = buildAIReviewPayload(project, audit, project.evidenceItems);

    expect(payload.boundary).toContain("Not legal advice");
    expect(payload.project.projectName).toBe("RWA Review Desk");
    expect(payload.evidenceSummaries[1].contentPreview).toContain("[redacted-private-key]");
    expect(payload.evidenceSummaries[1].contentPreview).not.toContain("0xaaaaaaaa");
    expect(payload.instructions).toContain("Return JSON only");
  });
});

describe("createRedactionReport", () => {
  it("blocks model calls when evidence includes private-key-like material and removes it from previews", () => {
    const report = createRedactionReport(project.evidenceItems);

    expect(report.status).toBe("blocked");
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceLabel: "Sensitive draft",
          category: "private-key-like value",
          severity: "block"
        })
      ])
    );
    expect(report.evidencePreview.find((item) => item.label === "Sensitive draft")?.contentPreview).toContain(
      "[redacted-private-key]"
    );
    expect(JSON.stringify(report)).not.toContain("0xaaaaaaaa");
  });

  it("marks KYC and personal-data references for review before sending evidence to a model", () => {
    const report = createRedactionReport([
      {
        label: "KYC export",
        kind: "CSV",
        content: "Raw KYC packet with passport number and investor personal data",
        status: "draft",
        owner: "Compliance"
      }
    ]);

    expect(report.status).toBe("needs-review");
    expect(report.findings.map((item) => item.category)).toEqual(expect.arrayContaining(["raw KYC reference"]));
    expect(report.boundary).toContain("Not legal advice");
  });
});

describe("parseAIReviewJson", () => {
  it("keeps only validated AI review arrays and preserves the non-advice boundary", () => {
    const result = parseAIReviewJson(
      JSON.stringify({
        extractedFacts: ["Tokenized yield note"],
        missingEvidence: ["Custody policy"],
        draftQuestions: ["Who controls withdrawals?"],
        suggestedRemediation: ["Document signer controls"],
        ignored: "not surfaced"
      })
    );

    expect(result).toMatchObject<AIReviewResult>({
      extractedFacts: ["Tokenized yield note"],
      missingEvidence: ["Custody policy"],
      draftQuestions: ["Who controls withdrawals?"],
      suggestedRemediation: ["Document signer controls"],
      modelBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
    });
  });
});

describe("runAIReview", () => {
  it("runs a mock AI review and combines model suggestions with deterministic missing evidence", async () => {
    const audit = analyzeAuditProfile(project);
    const review = await runAIReview(project, audit, project.evidenceItems, createMockModelProvider());

    expect(review.modelBoundary).toContain("Not legal advice");
    expect(review.extractedFacts).toEqual(expect.arrayContaining(["Tokenized private credit note with yield"]));
    expect(review.missingEvidence).toEqual(expect.arrayContaining(["Signer control policy"]));
    expect(review.suggestedRemediation.length).toBeGreaterThan(0);
  });
});
