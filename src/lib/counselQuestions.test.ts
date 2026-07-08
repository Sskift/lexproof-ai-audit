import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import {
  createDefaultCounselQuestions,
  createQuestionsFromAIReview,
  mergeCounselQuestionQueues,
  parseStoredCounselQuestions,
  sanitizeCounselQuestion,
  type CounselQuestion
} from "./counselQuestions";
import type { AIReviewResult } from "./aiReview";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "question-project",
  projectName: "Question Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC references excluded from export",
  aiUsage: "AI flags legal review questions with citations",
  blockchainUse: "Simulated evidence hash registry",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createDefaultCounselQuestions", () => {
  it("creates deterministic non-advice counsel questions from risk flags", () => {
    const audit = analyzeAuditProfile(project);
    const questions = createDefaultCounselQuestions(project, audit);

    expect(questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "question-project-asset-yield-classification",
          question: expect.stringContaining("classification"),
          relatedFlagId: "asset-yield",
          priority: "P0",
          status: "open",
          source: "risk-rule"
        }),
        expect.objectContaining({
          id: "question-project-custody-authority",
          question: expect.stringContaining("wallet operations"),
          relatedFlagId: "custody",
          priority: "P0"
        })
      ])
    );
    expect(questions.every((item) => item.notLegalAdviceBoundary.includes("Not legal advice"))).toBe(true);
  });
});

describe("mergeCounselQuestionQueues", () => {
  it("keeps edited user questions while adding non-duplicate AI review questions", () => {
    const existing: CounselQuestion[] = [
      {
        id: "question-project-asset-yield-classification",
        projectId: "question-project",
        question: "Edited counsel classification question?",
        relatedFlagId: "asset-yield",
        priority: "P0",
        status: "answered",
        source: "risk-rule",
        notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only."
      }
    ];
    const aiReview: AIReviewResult = {
      extractedFacts: [],
      missingEvidence: [],
      draftQuestions: [
        "Edited counsel classification question?",
        "Which artifacts can be shared with counsel without exposing raw KYC or personal data?"
      ],
      suggestedRemediation: [],
      modelBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
    };

    const merged = mergeCounselQuestionQueues(existing, createQuestionsFromAIReview(project, aiReview));

    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({
      question: "Edited counsel classification question?",
      status: "answered"
    });
    expect(merged[1]).toMatchObject({
      question: "Which artifacts can be shared with counsel without exposing [redacted-raw-kyc] or personal data?",
      status: "open",
      source: "ai-review",
      priority: "P1"
    });
  });
});

describe("stored counsel question recovery", () => {
  it("sanitizes persisted counsel questions before restoring them", () => {
    const restored = parseStoredCounselQuestions(
      JSON.stringify([
        {
          id: "question-secret-sk-live123456789012",
          projectId: "question-project",
          question:
            "Review raw KYC packet, passport file, apiKey=supersecretvalue, 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef, and final legal decision.",
          relatedFlagId: "sensitive-data",
          priority: "P0",
          status: "open",
          source: "manual",
          extraRawEvidence: "must not survive",
          notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only."
        }
      ])
    );

    expect(restored).toHaveLength(1);
    expect(JSON.stringify(restored[0])).not.toContain("supersecretvalue");
    expect(JSON.stringify(restored[0])).not.toContain("0x1234567890abcdef");
    expect(JSON.stringify(restored[0])).not.toContain("raw KYC packet");
    expect(JSON.stringify(restored[0])).not.toContain("passport file");
    expect(JSON.stringify(restored[0])).not.toContain("final legal decision");
    expect(restored[0]).not.toHaveProperty("extraRawEvidence");
    expect(restored[0]).toMatchObject({
      question: expect.stringContaining("[redacted-raw-kyc]"),
      notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only."
    });
  });

  it("drops malformed stored counsel questions and invalid workflow enums", () => {
    const valid: CounselQuestion = {
      id: "valid-question",
      projectId: "question-project",
      question: "Which metadata-only artifacts can counsel review?",
      priority: "P1",
      status: "open",
      source: "manual",
      notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only."
    };

    expect(
      parseStoredCounselQuestions(
        JSON.stringify([
          valid,
          { ...valid, id: "bad-boundary", notLegalAdviceBoundary: "Legal advice approved." },
          { ...valid, id: "bad-priority", priority: "P3" },
          { ...valid, id: "bad-status", status: "closed" },
          { ...valid, id: "bad-source", source: "external-counsel" },
          { ...valid, id: "" }
        ])
      )
    ).toEqual([valid]);
    expect(parseStoredCounselQuestions("{not-json")).toEqual([]);
  });

  it("sanitizes manual counsel question edits without changing the non-advice boundary", () => {
    const question = sanitizeCounselQuestion({
      id: "manual",
      projectId: "question-project",
      question: "Legal opinion says legally compliant after passport file review.",
      priority: "P1",
      status: "deferred",
      source: "manual",
      notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only."
    });

    expect(question.question).toContain("[redacted-legal-conclusion]");
    expect(question.question).toContain("[redacted-identity-document]");
    expect(question.notLegalAdviceBoundary).toBe("Not legal advice. Counsel questions are audit preparation prompts only.");
  });
});
